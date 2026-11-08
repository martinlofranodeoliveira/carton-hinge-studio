import { CartonDimensions } from './types';

export const MIN_DIMENSION = 1;
export const MAX_DIMENSION = 4095;
export const MIN_FOLD_TICKS = 0;
export const MAX_FOLD_TICKS = 1000;

export function validateDimensions(dims: CartonDimensions): string | null {
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
