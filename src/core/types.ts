/**
 * Typed domain definitions for Carton Hinge Studio.
 */

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
  width: number;  // mm: [1, 4095]
  depth: number;  // mm: [1, 4095]
  height: number; // mm: [1, 4095]
}

export interface CartonFace {
  id: FaceId;
  name: string;
  width: number;
  height: number;
  corners3D: [Point3D, Point3D, Point3D, Point3D];
  normal3D: Point3D;
  cornersNet: [Point2D, Point2D, Point2D, Point2D];
}

export interface CartonHinge {
  id: HingeId;
  parentFace: FaceId;
  childFace: FaceId;
  axisStart: Point3D;
  axisEnd: Point3D;
  angleRadians: number;
  angleDegrees: number;
}

export interface SeamMeasurement {
  id: SeamId;
  name: string;
  faceA: FaceId;
  faceB: FaceId;
  pointA1: Point3D;
  pointA2: Point3D;
  pointB1: Point3D;
  pointB2: Point3D;
  gapStart: number;
  gapEnd: number;
  maxGap: number;
  isClosed: boolean;
}

export interface CartonStudy {
  dimensions: CartonDimensions;
  foldTicks: number;       // [0, 1000]
  foldFraction: number;    // [0.0, 1.0]
  faces: Record<FaceId, CartonFace>;
  hinges: Record<HingeId, CartonHinge>;
  seams: Record<SeamId, SeamMeasurement>;
  isFullyClosed: boolean;
  maxSeamGap: number;
  tolerance: number;
  status: 'ValidStudy' | 'InvalidDocument' | 'UnsupportedDocument';
}
