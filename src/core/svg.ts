import { CartonStudy } from './types';
import { validateDimensions, validateFoldTicks, verifyNumericalDeterminacy } from './validator';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSvgNet(study: CartonStudy, margin = 20): string {
  if (!study || study.status !== 'ValidStudy') {
    throw new Error(`Refusing SVG export for non-valid study status: ${study?.status ?? 'unknown'}`);
  }
  const dimErr = validateDimensions(study.dimensions);
  if (dimErr) {
    throw new Error(`Refusing SVG export: ${dimErr}`);
  }
  const foldErr = validateFoldTicks(study.foldTicks);
  if (foldErr) {
    throw new Error(`Refusing SVG export: ${foldErr}`);
  }
  const numErr = verifyNumericalDeterminacy(study);
  if (numErr) {
    throw new Error(`Refusing SVG export due to numerical indeterminacy: ${numErr}`);
  }
  if (!Number.isFinite(margin) || margin < 0 || margin > 1000) {
    throw new Error(`Invalid SVG margin: ${margin}`);
  }

  const { faces, dimensions } = study;
  const { width: W, depth: D, height: H } = dimensions;

  // Global bounding box in net coordinates:
  // X ranges from -(W/2 + H) to +(W/2 + H)
  // Y ranges from -(D/2 + H) to +(D/2 + H + D)
  const minX = -(W / 2.0 + H);
  const maxX = W / 2.0 + H;
  const minY = -(D / 2.0 + H);
  const maxY = D / 2.0 + H + D;

  const totalWidth = maxX - minX + margin * 2;
  const totalHeight = maxY - minY + margin * 2;

  function toSvgX(x: number): number {
    return x - minX + margin;
  }
  function toSvgY(y: number): number {
    // Invert Y so North is upwards
    return maxY - y + margin;
  }

  const faceElements: string[] = [];

  for (const face of Object.values(faces)) {
    const pts = face.cornersNet
      .map(p => `${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`)
      .join(' ');
    const centerX = face.cornersNet.reduce((sum, p) => sum + p.x, 0) / 4.0;
    const centerY = face.cornersNet.reduce((sum, p) => sum + p.y, 0) / 4.0;

    faceElements.push(`
    <!-- Face: ${escapeXml(face.id)} -->
    <polygon data-face-id="${escapeXml(face.id)}" points="${pts}" fill="#f8fafc" stroke="#202b36" stroke-width="1.5" />
    <text x="${toSvgX(centerX).toFixed(1)}" y="${toSvgY(centerY).toFixed(1)}"
          font-family="Public Sans, sans-serif" font-size="11" font-weight="600"
          text-anchor="middle" dominant-baseline="middle" fill="#202b36">
      ${escapeXml(face.name)}
    </text>
    <text x="${toSvgX(centerX).toFixed(1)}" y="${(toSvgY(centerY) + 14).toFixed(1)}"
          font-family="Public Sans, sans-serif" font-size="9"
          text-anchor="middle" dominant-baseline="middle" fill="#64748b">
      ${face.width} × ${face.height} mm
    </text>`);
  }

  // Draw 5 hinge fold lines as dashed
  const hingeLines: string[] = [
    `<line data-hinge-id="base-north" x1="${toSvgX(-W / 2).toFixed(1)}" y1="${toSvgY(D / 2).toFixed(1)}" x2="${toSvgX(W / 2).toFixed(1)}" y2="${toSvgY(D / 2).toFixed(1)}" stroke="#235bd4" stroke-width="1.5" stroke-dasharray="4,3" />`,
    `<line data-hinge-id="base-south" x1="${toSvgX(-W / 2).toFixed(1)}" y1="${toSvgY(-D / 2).toFixed(1)}" x2="${toSvgX(W / 2).toFixed(1)}" y2="${toSvgY(-D / 2).toFixed(1)}" stroke="#235bd4" stroke-width="1.5" stroke-dasharray="4,3" />`,
    `<line data-hinge-id="base-east" x1="${toSvgX(W / 2).toFixed(1)}" y1="${toSvgY(D / 2).toFixed(1)}" x2="${toSvgX(W / 2).toFixed(1)}" y2="${toSvgY(-D / 2).toFixed(1)}" stroke="#235bd4" stroke-width="1.5" stroke-dasharray="4,3" />`,
    `<line data-hinge-id="base-west" x1="${toSvgX(-W / 2).toFixed(1)}" y1="${toSvgY(D / 2).toFixed(1)}" x2="${toSvgX(-W / 2).toFixed(1)}" y2="${toSvgY(-D / 2).toFixed(1)}" stroke="#235bd4" stroke-width="1.5" stroke-dasharray="4,3" />`,
    `<line data-hinge-id="north-lid" x1="${toSvgX(-W / 2).toFixed(1)}" y1="${toSvgY(D / 2 + H).toFixed(1)}" x2="${toSvgX(W / 2).toFixed(1)}" y2="${toSvgY(D / 2 + H).toFixed(1)}" stroke="#235bd4" stroke-width="1.5" stroke-dasharray="4,3" />`
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(1)} ${totalHeight.toFixed(1)}" width="${totalWidth.toFixed(1)}mm" height="${totalHeight.toFixed(1)}mm">
  <title>Carton Net Plan (${W} × ${D} × ${H} mm)</title>
  <desc>Conceptual zero-thickness six-face carton net study (not a manufacturing die-line).</desc>
  <defs>
    <style>
      .cut-line { stroke: #202b36; stroke-width: 1.5; fill: none; }
      .crease-line { stroke: #235bd4; stroke-width: 1.5; stroke-dasharray: 4,3; fill: none; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff" />
  <g id="faces">${faceElements.join('\n')}</g>
  <g id="hinges">${hingeLines.join('\n')}</g>
</svg>
`;
}
