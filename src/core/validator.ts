import { CartonDimensions, CartonStudy, FaceId, Point3D } from './types';

export const MIN_DIMENSION = 1;
export const MAX_DIMENSION = 4095;
export const MIN_FOLD_TICKS = 0;
export const MAX_FOLD_TICKS = 1000;

export const VALID_FACE_IDS: readonly FaceId[] = [
  'base',
  'north',
  'south',
  'east',
  'west',
  'lid'
];

export function isValidFaceId(value: unknown): value is FaceId {
  return typeof value === 'string' && (VALID_FACE_IDS as readonly string[]).includes(value);
}

export function validateDimensions(dims: CartonDimensions): string | null {
  if (!dims || typeof dims !== 'object') {
    return 'Dimensions must be an object';
  }
  if (!Number.isInteger(dims.width) || dims.width < MIN_DIMENSION || dims.width > MAX_DIMENSION) {
    return `Width ${dims.width} out of integer bounds [${MIN_DIMENSION}, ${MAX_DIMENSION}]`;
  }
  if (!Number.isInteger(dims.depth) || dims.depth < MIN_DIMENSION || dims.depth > MAX_DIMENSION) {
    return `Depth ${dims.depth} out of integer bounds [${MIN_DIMENSION}, ${MAX_DIMENSION}]`;
  }
  if (!Number.isInteger(dims.height) || dims.height < MIN_DIMENSION || dims.height > MAX_DIMENSION) {
    return `Height ${dims.height} out of integer bounds [${MIN_DIMENSION}, ${MAX_DIMENSION}]`;
  }
  return null;
}

export function validateFoldTicks(ticks: number): string | null {
  if (!Number.isInteger(ticks) || ticks < MIN_FOLD_TICKS || ticks > MAX_FOLD_TICKS) {
    return `Fold ticks ${ticks} out of integer bounds [${MIN_FOLD_TICKS}, ${MAX_FOLD_TICKS}]`;
  }
  return null;
}

function isFinitePoint3D(pt: Point3D): boolean {
  return Number.isFinite(pt.x) && Number.isFinite(pt.y) && Number.isFinite(pt.z);
}

/**
 * Verifies that a derived CartonStudy has finite coordinates, unit normals, and finite seam measurements.
 * Returns null when determinate, or a diagnostic description when NumericallyIndeterminate.
 */
export function verifyNumericalDeterminacy(study: CartonStudy): string | null {
  if (
    !Number.isFinite(study.foldFraction) ||
    !Number.isFinite(study.maxSeamGap) ||
    !Number.isFinite(study.maxHingeGap) ||
    !Number.isFinite(study.tolerance) ||
    study.tolerance <= 0
  ) {
    return 'Non-finite scalar summary in study';
  }

  for (const face of Object.values(study.faces)) {
    if (!isFinitePoint3D(face.normal3D)) {
      return `Non-finite normal on face ${face.id}`;
    }
    const normLen = Math.hypot(face.normal3D.x, face.normal3D.y, face.normal3D.z);
    if (!Number.isFinite(normLen) || Math.abs(normLen - 1.0) > 1e-7) {
      return `Indeterminate normal magnitude on face ${face.id}: ${normLen}`;
    }
    for (const pt of face.corners3D) {
      if (!isFinitePoint3D(pt)) {
        return `Non-finite 3D corner on face ${face.id}`;
      }
    }
    for (const point of [...face.localCorners, ...face.cornersNet]) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        return `Non-finite local/net coordinate on face ${face.id}`;
      }
    }
    for (const entry of face.transformMatrix) {
      if (!Number.isFinite(entry)) {
        return `Non-finite transform matrix entry on face ${face.id}`;
      }
    }
  }

  for (const seam of Object.values(study.seams)) {
    if (
      !Number.isFinite(seam.gapStart) ||
      !Number.isFinite(seam.gapEnd) ||
      !Number.isFinite(seam.maxGap) ||
      seam.maxGap < 0
    ) {
      return `Indeterminate seam measurement on ${seam.id}`;
    }
  }

  return null;
}
