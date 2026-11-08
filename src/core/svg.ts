import { CartonStudy, FaceId } from './types';

export function generateSvgNet(study: CartonStudy, margin = 20): string {
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
    <!-- Face: ${face.id} -->
    <polygon points="${pts}" fill="#f8fafc" stroke="#202b36" stroke-width="1.5" />
    <text x="${toSvgX(centerX).toFixed(1)}" y="${toSvgY(centerY).toFixed(1)}" 
          font-family="Public Sans, sans-serif" font-size="11" font-weight="600" 
          text-anchor="middle" dominant-baseline="middle" fill="#202b36">
      ${face.name}
    </text>
    <text x="${toSvgX(centerX).toFixed(1)}" y="${(toSvgY(centerY) + 14).toFixed(1)}" 
          font-family="Public Sans, sans-serif" font-size="9" 
          text-anchor="middle" dominant-baseline="middle" fill="#64748b">
      ${face.width} × ${face.height} mm
    </text>`);
  }

  // Draw 5 hinge fold lines as dashed
  const hingeLines: string[] = [
    // base-north: between (-W/2, D/2) and (W/2, D/2)
    `<line x1="${toSvgX(-W / 2).toFixed(1)}" y1="${toSvgY(D / 2).toFixed(1)}" x2="${toSvgX(W / 2).toFixed(1)}" y2="${toSvgY(D / 2).toFixed(1)}" stroke="#235bd4" stroke-width="1.5" stroke-dasharray="4,3" />`,
    // base-south: between (-W/2, -D/2) and (W/2, -D/2)
    `<line x1="${toSvgX(-W / 2).toFixed(1)}" y1="${toSvgY(-D / 2).toFixed(1)}" x2="${toSvgX(W / 2).toFixed(1)}" y2="${toSvgY(-D / 2).toFixed(1)}" stroke="#235bd4" stroke-width="1.5" stroke-dasharray="4,3" />`,
    // base-east: between (W/2, D/2) and (W/2, -D/2)
    `<line x1="${toSvgX(W / 2).toFixed(1)}" y1="${toSvgY(D / 2).toFixed(1)}" x2="${toSvgX(W / 2).toFixed(1)}" y2="${toSvgY(-D / 2).toFixed(1)}" stroke="#235bd4" stroke-width="1.5" stroke-dasharray="4,3" />`,
    // base-west: between (-W/2, D/2) and (-W/2, -D/2)
    `<line x1="${toSvgX(-W / 2).toFixed(1)}" y1="${toSvgY(D / 2).toFixed(1)}" x2="${toSvgX(-W / 2).toFixed(1)}" y2="${toSvgY(-D / 2).toFixed(1)}" stroke="#235bd4" stroke-width="1.5" stroke-dasharray="4,3" />`,
    // north-lid: between (-W/2, D/2 + H) and (W/2, D/2 + H)
    `<line x1="${toSvgX(-W / 2).toFixed(1)}" y1="${toSvgY(D / 2 + H).toFixed(1)}" x2="${toSvgX(W / 2).toFixed(1)}" y2="${toSvgY(D / 2 + H).toFixed(1)}" stroke="#235bd4" stroke-width="1.5" stroke-dasharray="4,3" />`
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(1)} ${totalHeight.toFixed(1)}" width="${totalWidth.toFixed(1)}mm" height="${totalHeight.toFixed(1)}mm">
  <title>Carton Net Plan (${W} × ${D} × ${H} mm)</title>
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
