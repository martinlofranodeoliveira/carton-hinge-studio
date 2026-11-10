/**
 * Typed domain definitions for Carton Hinge Studio.
 * Zero-thickness conceptual kinematic model of a six-face rectangular carton net.
 */

export type Locale = 'pt-BR' | 'en';

export type FaceId = 'base' | 'north' | 'south' | 'east' | 'west' | 'lid';

export type HingeId =
  | 'base-north'
  | 'base-south'
  | 'base-east'
  | 'base-west'
  | 'north-lid';

export type SeamId =
  | 'north-east'
  | 'north-west'
  | 'south-east'
  | 'south-west'
  | 'lid-east'
  | 'lid-west'
  | 'lid-south';

export type PhysicalEdgeId = HingeId | SeamId;

export type FaceEdgeId =
  | 'base:south'
  | 'base:east'
  | 'base:north'
  | 'base:west'
  | 'north:base'
  | 'north:east'
  | 'north:lid'
  | 'north:west'
  | 'south:base'
  | 'south:west'
  | 'south:lid'
  | 'south:east'
  | 'east:base'
  | 'east:south'
  | 'east:lid'
  | 'east:north'
  | 'west:base'
  | 'west:north'
  | 'west:lid'
  | 'west:south'
  | 'lid:north'
  | 'lid:east'
  | 'lid:south'
  | 'lid:west';

export type StudyStatus =
  | 'ValidStudy'
  | 'InvalidDocument'
  | 'UnsupportedDocument'
  | 'NumericallyIndeterminate';

/**
 * 16-element column-major homogeneous 4x4 transformation matrix.
 */
export type Matrix4Tuple = readonly [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface CartonDimensions {
  width: number;  // integer mm: [1, 4095]
  depth: number;  // integer mm: [1, 4095]
  height: number; // integer mm: [1, 4095]
}

export interface FaceEdge {
  id: FaceEdgeId;
  faceId: FaceId;
  edgeIndex: 0 | 1 | 2 | 3;
  pairedEdgeId: FaceEdgeId;
  physicalEdgeId: PhysicalEdgeId;
  kind: 'hinge' | 'seam';
  start3D: Point3D;
  end3D: Point3D;
  startNet: Point2D;
  endNet: Point2D;
}

export interface CartonFace {
  id: FaceId;
  name: string;
  width: number;
  height: number;
  localCorners: [Point2D, Point2D, Point2D, Point2D];
  transformMatrix: Matrix4Tuple;
  corners3D: [Point3D, Point3D, Point3D, Point3D];
  normal3D: Point3D;
  cornersNet: [Point2D, Point2D, Point2D, Point2D];
  edges: [FaceEdge, FaceEdge, FaceEdge, FaceEdge];
}

export interface CartonHinge {
  id: HingeId;
  parentFace: FaceId;
  childFace: FaceId;
  axis: 'x' | 'y';
  signedQuarterTurn: 1 | -1;
  axisStart: Point3D;
  axisEnd: Point3D;
  angleRadians: number;
  angleDegrees: number;
  localMatrix: Matrix4Tuple;
  worldMatrix: Matrix4Tuple;
}

export interface SeamMeasurement {
  id: SeamId;
  name: string;
  faceA: FaceId;
  faceB: FaceId;
  edgeA: FaceEdgeId;
  edgeB: FaceEdgeId;
  pointA1: Point3D;
  pointA2: Point3D;
  pointB1: Point3D;
  pointB2: Point3D;
  gapStart: number;
  gapEnd: number;
  maxGap: number;
  isClosed: boolean;
}

export interface PhysicalEdgePair {
  id: PhysicalEdgeId;
  kind: 'hinge' | 'seam';
  faceA: FaceId;
  faceB: FaceId;
  edgeA: FaceEdgeId;
  edgeB: FaceEdgeId;
  pointA1: Point3D;
  pointA2: Point3D;
  pointB1: Point3D;
  pointB2: Point3D;
  gapStart: number;
  gapEnd: number;
  maxGap: number;
  isCoincident: boolean;
}

export interface CartonStudy {
  dimensions: CartonDimensions;
  foldTicks: number;       // integer [0, 1000]
  foldFraction: number;    // [0.0, 1.0]
  faces: Record<FaceId, CartonFace>;
  hinges: Record<HingeId, CartonHinge>;
  seams: Record<SeamId, SeamMeasurement>;
  faceEdges: Record<FaceEdgeId, FaceEdge>;
  physicalEdges: Record<PhysicalEdgeId, PhysicalEdgePair>;
  isFullyClosed: boolean;
  maxSeamGap: number;
  maxHingeGap: number;
  tolerance: number;
  status: StudyStatus;
}

export const STUDY_SCHEMA_ID = 'carton-hinge-studio/study@1' as const;
export const STUDY_UNITS = 'mm' as const;
export const MAX_STUDY_JSON_BYTES = 8192;
export const MAX_STUDY_SCALAR_FIELDS = 32;

export interface CartonStudyDocument {
  schema: typeof STUDY_SCHEMA_ID;
  units: typeof STUDY_UNITS;
  dimensions: CartonDimensions;
  foldTicks: number;
  selectedFace?: FaceId | null;
}

export type StudyDiagnosticCode =
  | 'VALID'
  | 'EMPTY_DOCUMENT'
  | 'BYTE_LIMIT_EXCEEDED'
  | 'MALFORMED_JSON'
  | 'INVALID_UTF8'
  | 'READ_FAILED'
  | 'EXPORT_FAILED'
  | 'NON_OBJECT_ROOT'
  | 'FORBIDDEN_KEY'
  | 'SCALAR_LIMIT_EXCEEDED'
  | 'UNKNOWN_FIELD'
  | 'MISSING_FIELD'
  | 'UNSUPPORTED_SCHEMA'
  | 'UNSUPPORTED_UNITS'
  | 'INVALID_DIMENSIONS'
  | 'INVALID_FOLD_TICKS'
  | 'INVALID_SELECTED_FACE'
  | 'NUMERICALLY_INDETERMINATE';

export interface StudyParseSuccess {
  ok: true;
  status: 'ValidStudy';
  code: 'VALID';
  document: CartonStudyDocument;
  study: CartonStudy;
}

export interface StudyParseFailure {
  ok: false;
  status: 'InvalidDocument' | 'UnsupportedDocument' | 'NumericallyIndeterminate';
  code: StudyDiagnosticCode;
  message: string;
  field?: string;
}

export type StudyParseResult = StudyParseSuccess | StudyParseFailure;
