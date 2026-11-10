import { deriveCartonStudy } from './carton';
import {
  CartonStudy,
  CartonStudyDocument,
  FaceId,
  MAX_STUDY_JSON_BYTES,
  MAX_STUDY_SCALAR_FIELDS,
  STUDY_SCHEMA_ID,
  STUDY_UNITS,
  StudyParseResult
} from './types';
import {
  isValidFaceId,
  validateDimensions,
  validateFoldTicks,
  verifyNumericalDeterminacy
} from './validator';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const ALLOWED_ROOT_KEYS = new Set(['schema', 'units', 'dimensions', 'foldTicks', 'selectedFace']);
const ALLOWED_DIM_KEYS = new Set(['width', 'depth', 'height']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

interface ScalarCountResult {
  scalars: number;
  forbiddenKey: string | null;
  depthExceeded: boolean;
}

function inspectObjectTree(value: unknown, depth = 0): ScalarCountResult {
  if (depth > 4) {
    return { scalars: 0, forbiddenKey: null, depthExceeded: true };
  }
  if (value === null || typeof value !== 'object') {
    return { scalars: 1, forbiddenKey: null, depthExceeded: false };
  }
  if (Array.isArray(value)) {
    let total = 0;
    for (const item of value) {
      const res = inspectObjectTree(item, depth + 1);
      if (res.forbiddenKey || res.depthExceeded) return res;
      total += res.scalars;
    }
    return { scalars: total, forbiddenKey: null, depthExceeded: false };
  }
  let total = 0;
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return { scalars: total, forbiddenKey: key, depthExceeded: false };
    }
    const child = (value as Record<string, unknown>)[key];
    const res = inspectObjectTree(child, depth + 1);
    if (res.forbiddenKey || res.depthExceeded) return res;
    total += res.scalars;
  }
  return { scalars: total, forbiddenKey: null, depthExceeded: false };
}

export function createStudyDocument(
  study: CartonStudy,
  selectedFace: FaceId | null = 'lid'
): CartonStudyDocument {
  if (study.status !== 'ValidStudy') {
    throw new Error(`Cannot export study with status ${study.status}`);
  }
  const dimErr = validateDimensions(study.dimensions);
  if (dimErr) {
    throw new Error(dimErr);
  }
  const foldErr = validateFoldTicks(study.foldTicks);
  if (foldErr) {
    throw new Error(foldErr);
  }
  const numErr = verifyNumericalDeterminacy(study);
  if (numErr) {
    throw new Error(`Cannot export numerically indeterminate study: ${numErr}`);
  }
  if (selectedFace !== null && !isValidFaceId(selectedFace)) {
    throw new Error(`Invalid selected face: ${String(selectedFace)}`);
  }
  return {
    schema: STUDY_SCHEMA_ID,
    units: STUDY_UNITS,
    dimensions: {
      width: study.dimensions.width,
      depth: study.dimensions.depth,
      height: study.dimensions.height
    },
    foldTicks: study.foldTicks,
    selectedFace
  };
}

export function serializeCartonStudyJson(
  study: CartonStudy,
  selectedFace: FaceId | null = 'lid'
): string {
  const doc = createStudyDocument(study, selectedFace);
  return JSON.stringify(doc, null, 2) + '\n';
}

export function parseCartonStudyJson(input: string | Uint8Array): StudyParseResult {
  const rawBytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;

  if (rawBytes.byteLength === 0) {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'EMPTY_DOCUMENT',
      message: 'Study JSON document is empty'
    };
  }

  if (rawBytes.byteLength > MAX_STUDY_JSON_BYTES) {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'BYTE_LIMIT_EXCEEDED',
      message: `Study JSON exceeds ${MAX_STUDY_JSON_BYTES}-byte limit (${rawBytes.byteLength} bytes)`
    };
  }

  let text: string;
  try {
    text = typeof input === 'string' ? input : new TextDecoder('utf-8', { fatal: true }).decode(rawBytes);
  } catch {
    return { ok: false, status: 'InvalidDocument', code: 'INVALID_UTF8', message: 'Study JSON is not valid UTF-8' };
  }

  if (text.trim().length === 0) {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'EMPTY_DOCUMENT',
      message: 'Study JSON document contains only whitespace'
    };
  }

  let forbiddenKeyFound: string | null = null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text, function (key, value) {
      if (FORBIDDEN_KEYS.has(key)) {
        forbiddenKeyFound = key;
        return undefined;
      }
      return value;
    });
  } catch {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'MALFORMED_JSON',
      message: 'Malformed JSON syntax'
    };
  }

  if (forbiddenKeyFound) {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'FORBIDDEN_KEY',
      message: `Forbidden object key: ${forbiddenKeyFound}`,
      field: forbiddenKeyFound
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'NON_OBJECT_ROOT',
      message: 'Top-level JSON value must be a plain object'
    };
  }

  const treeCheck = inspectObjectTree(parsed);
  if (treeCheck.forbiddenKey) {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'FORBIDDEN_KEY',
      message: `Forbidden object key: ${treeCheck.forbiddenKey}`,
      field: treeCheck.forbiddenKey
    };
  }
  if (treeCheck.depthExceeded || treeCheck.scalars > MAX_STUDY_SCALAR_FIELDS) {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'SCALAR_LIMIT_EXCEEDED',
      message: `Study JSON exceeds maximum complexity (${treeCheck.scalars}/${MAX_STUDY_SCALAR_FIELDS} scalars)`
    };
  }

  for (const key of Object.keys(parsed)) {
    if (!ALLOWED_ROOT_KEYS.has(key)) {
      return {
        ok: false,
        status: 'InvalidDocument',
        code: 'UNKNOWN_FIELD',
        message: `Unknown top-level field: ${key}`,
        field: key
      };
    }
  }

  if (!('schema' in parsed) || typeof parsed.schema !== 'string') {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'MISSING_FIELD',
      message: 'Missing or non-string schema identifier',
      field: 'schema'
    };
  }

  if (parsed.schema !== STUDY_SCHEMA_ID) {
    return {
      ok: false,
      status: 'UnsupportedDocument',
      code: 'UNSUPPORTED_SCHEMA',
      message: `Unsupported schema identifier: ${parsed.schema}`,
      field: 'schema'
    };
  }

  if (!('units' in parsed) || typeof parsed.units !== 'string') {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'MISSING_FIELD',
      message: 'Missing or non-string units field',
      field: 'units'
    };
  }

  if (parsed.units !== STUDY_UNITS) {
    return {
      ok: false,
      status: 'UnsupportedDocument',
      code: 'UNSUPPORTED_UNITS',
      message: `Unsupported units: ${parsed.units}`,
      field: 'units'
    };
  }

  if (!('dimensions' in parsed) || !isPlainObject(parsed.dimensions)) {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'MISSING_FIELD',
      message: 'Missing or invalid dimensions object',
      field: 'dimensions'
    };
  }

  const dimsObj = parsed.dimensions;
  for (const key of Object.keys(dimsObj)) {
    if (!ALLOWED_DIM_KEYS.has(key)) {
      return {
        ok: false,
        status: 'InvalidDocument',
        code: 'UNKNOWN_FIELD',
        message: `Unknown field in dimensions: ${key}`,
        field: `dimensions.${key}`
      };
    }
  }

  for (const reqKey of ALLOWED_DIM_KEYS) {
    if (!(reqKey in dimsObj)) {
      return {
        ok: false,
        status: 'InvalidDocument',
        code: 'MISSING_FIELD',
        message: `Missing required dimension: ${reqKey}`,
        field: `dimensions.${reqKey}`
      };
    }
  }

  const width = dimsObj.width;
  const depth = dimsObj.depth;
  const height = dimsObj.height;
  if (
    typeof width !== 'number' ||
    typeof depth !== 'number' ||
    typeof height !== 'number'
  ) {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'INVALID_DIMENSIONS',
      message: 'Dimensions width, depth and height must be finite numbers',
      field: 'dimensions'
    };
  }

  const dims = { width, depth, height };
  const dimErr = validateDimensions(dims);
  if (dimErr) {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'INVALID_DIMENSIONS',
      message: dimErr,
      field: 'dimensions'
    };
  }

  if (!('foldTicks' in parsed) || typeof parsed.foldTicks !== 'number') {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'MISSING_FIELD',
      message: 'Missing or non-numeric foldTicks field',
      field: 'foldTicks'
    };
  }

  const foldErr = validateFoldTicks(parsed.foldTicks);
  if (foldErr) {
    return {
      ok: false,
      status: 'InvalidDocument',
      code: 'INVALID_FOLD_TICKS',
      message: foldErr,
      field: 'foldTicks'
    };
  }

  let selectedFace: FaceId | null = 'lid';
  if ('selectedFace' in parsed) {
    if (parsed.selectedFace === null) {
      selectedFace = null;
    } else if (isValidFaceId(parsed.selectedFace)) {
      selectedFace = parsed.selectedFace;
    } else {
      return {
        ok: false,
        status: 'InvalidDocument',
        code: 'INVALID_SELECTED_FACE',
        message: `Invalid selectedFace identifier: ${String(parsed.selectedFace)}`,
        field: 'selectedFace'
      };
    }
  }

  const study = deriveCartonStudy(dims, parsed.foldTicks);
  if (study.status === 'NumericallyIndeterminate') {
    return {
      ok: false,
      status: 'NumericallyIndeterminate',
      code: 'NUMERICALLY_INDETERMINATE',
      message: 'Derived study geometry is numerically indeterminate'
    };
  }

  return {
    ok: true,
    status: 'ValidStudy',
    code: 'VALID',
    document: {
      schema: STUDY_SCHEMA_ID,
      units: STUDY_UNITS,
      dimensions: dims,
      foldTicks: parsed.foldTicks,
      selectedFace
    },
    study
  };
}
