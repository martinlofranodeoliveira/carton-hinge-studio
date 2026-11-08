import {
  CartonDimensions,
  CartonFace,
  CartonHinge,
  CartonStudy,
  FaceId,
  HingeId,
  Point2D,
  Point3D,
  SeamId,
  SeamMeasurement
} from './types';
import { validateDimensions, validateFoldTicks } from './validator';

export function dist3D(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function deriveCartonStudy(
  dims: CartonDimensions,
  foldTicks: number
): CartonStudy {
  const errDim = validateDimensions(dims);
  const errFold = validateFoldTicks(foldTicks);
  if (errDim || errFold) {
    throw new Error(errDim || errFold || 'Invalid study parameters');
  }

  const { width: W, depth: D, height: H } = dims;
  const alpha = foldTicks / 1000.0;
  const theta = alpha * (Math.PI / 2.0);

  // Exact trigonometric evaluation with closed-state snapping
  const cosT = foldTicks === 1000 ? 0.0 : foldTicks === 0 ? 1.0 : Math.cos(theta);
  const sinT = foldTicks === 1000 ? 1.0 : foldTicks === 0 ? 0.0 : Math.sin(theta);
  const cos2T = foldTicks === 1000 ? -1.0 : foldTicks === 0 ? 1.0 : Math.cos(2.0 * theta);
  const sin2T = foldTicks === 1000 ? 0.0 : foldTicks === 0 ? 0.0 : Math.sin(2.0 * theta);

  const halfW = W / 2.0;
  const halfD = D / 2.0;

  // 1. BASE FACE
  const baseCorners3D: [Point3D, Point3D, Point3D, Point3D] = [
    { x: -halfW, y: -halfD, z: 0.0 },
    { x: halfW, y: -halfD, z: 0.0 },
    { x: halfW, y: halfD, z: 0.0 },
    { x: -halfW, y: halfD, z: 0.0 }
  ];
  const baseCornersNet: [Point2D, Point2D, Point2D, Point2D] = [
    { x: -halfW, y: -halfD },
    { x: halfW, y: -halfD },
    { x: halfW, y: halfD },
    { x: -halfW, y: halfD }
  ];
  const baseFace: CartonFace = {
    id: 'base',
    name: 'Base',
    width: W,
    height: D,
    corners3D: baseCorners3D,
    normal3D: { x: 0.0, y: 0.0, z: -1.0 },
    cornersNet: baseCornersNet
  };

  // 2. NORTH FACE
  const northCorners3D: [Point3D, Point3D, Point3D, Point3D] = [
    { x: -halfW, y: halfD, z: 0.0 },
    { x: halfW, y: halfD, z: 0.0 },
    { x: halfW, y: halfD + H * cosT, z: H * sinT },
    { x: -halfW, y: halfD + H * cosT, z: H * sinT }
  ];
  const northCornersNet: [Point2D, Point2D, Point2D, Point2D] = [
    { x: -halfW, y: halfD },
    { x: halfW, y: halfD },
    { x: halfW, y: halfD + H },
    { x: -halfW, y: halfD + H }
  ];
  const northFace: CartonFace = {
    id: 'north',
    name: 'North (Norte)',
    width: W,
    height: H,
    corners3D: northCorners3D,
    normal3D: { x: 0.0, y: sinT, z: -cosT },
    cornersNet: northCornersNet
  };

  // 3. SOUTH FACE
  const southCorners3D: [Point3D, Point3D, Point3D, Point3D] = [
    { x: halfW, y: -halfD, z: 0.0 },
    { x: -halfW, y: -halfD, z: 0.0 },
    { x: -halfW, y: -halfD - H * cosT, z: H * sinT },
    { x: halfW, y: -halfD - H * cosT, z: H * sinT }
  ];
  const southCornersNet: [Point2D, Point2D, Point2D, Point2D] = [
    { x: halfW, y: -halfD },
    { x: -halfW, y: -halfD },
    { x: -halfW, y: -halfD - H },
    { x: halfW, y: -halfD - H }
  ];
  const southFace: CartonFace = {
    id: 'south',
    name: 'South (Sul)',
    width: W,
    height: H,
    corners3D: southCorners3D,
    normal3D: { x: 0.0, y: -sinT, z: -cosT },
    cornersNet: southCornersNet
  };

  // 4. EAST FACE
  const eastCorners3D: [Point3D, Point3D, Point3D, Point3D] = [
    { x: halfW, y: halfD, z: 0.0 },
    { x: halfW, y: -halfD, z: 0.0 },
    { x: halfW + H * cosT, y: -halfD, z: H * sinT },
    { x: halfW + H * cosT, y: halfD, z: H * sinT }
  ];
  const eastCornersNet: [Point2D, Point2D, Point2D, Point2D] = [
    { x: halfW, y: halfD },
    { x: halfW, y: -halfD },
    { x: halfW + H, y: -halfD },
    { x: halfW + H, y: halfD }
  ];
  const eastFace: CartonFace = {
    id: 'east',
    name: 'East (Leste)',
    width: H,
    height: D,
    corners3D: eastCorners3D,
    normal3D: { x: sinT, y: 0.0, z: -cosT },
    cornersNet: eastCornersNet
  };

  // 5. WEST FACE
  const westCorners3D: [Point3D, Point3D, Point3D, Point3D] = [
    { x: -halfW, y: -halfD, z: 0.0 },
    { x: -halfW, y: halfD, z: 0.0 },
    { x: -halfW - H * cosT, y: halfD, z: H * sinT },
    { x: -halfW - H * cosT, y: -halfD, z: H * sinT }
  ];
  const westCornersNet: [Point2D, Point2D, Point2D, Point2D] = [
    { x: -halfW, y: -halfD },
    { x: -halfW, y: halfD },
    { x: -halfW - H, y: halfD },
    { x: -halfW - H, y: -halfD }
  ];
  const westFace: CartonFace = {
    id: 'west',
    name: 'West (Oeste)',
    width: H,
    height: D,
    corners3D: westCorners3D,
    normal3D: { x: -sinT, y: 0.0, z: -cosT },
    cornersNet: westCornersNet
  };

  // 6. LID FACE
  const lidOriginY = halfD + H * cosT;
  const lidOriginZ = H * sinT;
  const lidCorners3D: [Point3D, Point3D, Point3D, Point3D] = [
    { x: -halfW, y: lidOriginY, z: lidOriginZ },
    { x: halfW, y: lidOriginY, z: lidOriginZ },
    { x: halfW, y: lidOriginY + D * cos2T, z: lidOriginZ + D * sin2T },
    { x: -halfW, y: lidOriginY + D * cos2T, z: lidOriginZ + D * sin2T }
  ];
  const lidCornersNet: [Point2D, Point2D, Point2D, Point2D] = [
    { x: -halfW, y: halfD + H },
    { x: halfW, y: halfD + H },
    { x: halfW, y: halfD + H + D },
    { x: -halfW, y: halfD + H + D }
  ];
  const lidFace: CartonFace = {
    id: 'lid',
    name: 'Lid (Tampa)',
    width: W,
    height: D,
    corners3D: lidCorners3D,
    normal3D: { x: 0.0, y: sin2T, z: -cos2T },
    cornersNet: lidCornersNet
  };

  const faces: Record<FaceId, CartonFace> = {
    base: baseFace,
    north: northFace,
    south: southFace,
    east: eastFace,
    west: westFace,
    lid: lidFace
  };

  // 5 HINGES
  const hinges: Record<HingeId, CartonHinge> = {
    'base-north': {
      id: 'base-north',
      parentFace: 'base',
      childFace: 'north',
      axisStart: baseCorners3D[3],
      axisEnd: baseCorners3D[2],
      angleRadians: theta,
      angleDegrees: (theta * 180.0) / Math.PI
    },
    'base-south': {
      id: 'base-south',
      parentFace: 'base',
      childFace: 'south',
      axisStart: baseCorners3D[1],
      axisEnd: baseCorners3D[0],
      angleRadians: theta,
      angleDegrees: (theta * 180.0) / Math.PI
    },
    'base-east': {
      id: 'base-east',
      parentFace: 'base',
      childFace: 'east',
      axisStart: baseCorners3D[2],
      axisEnd: baseCorners3D[1],
      angleRadians: theta,
      angleDegrees: (theta * 180.0) / Math.PI
    },
    'base-west': {
      id: 'base-west',
      parentFace: 'base',
      childFace: 'west',
      axisStart: baseCorners3D[0],
      axisEnd: baseCorners3D[3],
      angleRadians: theta,
      angleDegrees: (theta * 180.0) / Math.PI
    },
    'north-lid': {
      id: 'north-lid',
      parentFace: 'north',
      childFace: 'lid',
      axisStart: northCorners3D[3],
      axisEnd: northCorners3D[2],
      angleRadians: theta,
      angleDegrees: (theta * 180.0) / Math.PI
    }
  };

  // 7 CLOSURE SEAMS
  const tolerance = 1e-9 * Math.max(W, D, H);

  function makeSeam(
    id: SeamId,
    name: string,
    faceA: FaceId,
    faceB: FaceId,
    pA1: Point3D,
    pA2: Point3D,
    pB1: Point3D,
    pB2: Point3D
  ): SeamMeasurement {
    const gap1 = dist3D(pA1, pB1);
    const gap2 = dist3D(pA2, pB2);
    const maxGap = Math.max(gap1, gap2);
    return {
      id,
      name,
      faceA,
      faceB,
      pointA1: pA1,
      pointA2: pA2,
      pointB1: pB1,
      pointB2: pB2,
      gapStart: gap1,
      gapEnd: gap2,
      maxGap,
      isClosed: maxGap <= tolerance
    };
  }

  const seams: Record<SeamId, SeamMeasurement> = {
    'north-east': makeSeam(
      'north-east',
      'North-East (Norte-Leste)',
      'north',
      'east',
      northCorners3D[1],
      northCorners3D[2],
      eastCorners3D[0],
      eastCorners3D[3]
    ),
    'north-west': makeSeam(
      'north-west',
      'North-West (Norte-Oeste)',
      'north',
      'west',
      northCorners3D[0],
      northCorners3D[3],
      westCorners3D[1],
      westCorners3D[2]
    ),
    'south-east': makeSeam(
      'south-east',
      'South-East (Sul-Leste)',
      'south',
      'east',
      southCorners3D[0],
      southCorners3D[3],
      eastCorners3D[1],
      eastCorners3D[2]
    ),
    'south-west': makeSeam(
      'south-west',
      'South-West (Sul-Oeste)',
      'south',
      'west',
      southCorners3D[1],
      southCorners3D[2],
      westCorners3D[0],
      westCorners3D[3]
    ),
    'lid-east': makeSeam(
      'lid-east',
      'Lid-East (Tampa-Leste)',
      'lid',
      'east',
      lidCorners3D[1],
      lidCorners3D[2],
      eastCorners3D[3],
      eastCorners3D[2]
    ),
    'lid-west': makeSeam(
      'lid-west',
      'Lid-West (Tampa-Oeste)',
      'lid',
      'west',
      lidCorners3D[0],
      lidCorners3D[3],
      westCorners3D[2],
      westCorners3D[3]
    ),
    'lid-south': makeSeam(
      'lid-south',
      'Lid-South (Tampa-Sul)',
      'lid',
      'south',
      lidCorners3D[3],
      lidCorners3D[2],
      southCorners3D[2],
      southCorners3D[3]
    )
  };

  let maxSeamGap = 0.0;
  for (const seam of Object.values(seams)) {
    if (seam.maxGap > maxSeamGap) {
      maxSeamGap = seam.maxGap;
    }
  }

  const isFullyClosed = foldTicks === 1000 && maxSeamGap <= tolerance;

  return {
    dimensions: dims,
    foldTicks,
    foldFraction: alpha,
    faces,
    hinges,
    seams,
    isFullyClosed,
    maxSeamGap,
    tolerance,
    status: 'ValidStudy'
  };
}
