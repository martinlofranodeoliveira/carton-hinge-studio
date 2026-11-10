import {
  CartonDimensions,
  CartonFace,
  CartonHinge,
  CartonStudy,
  FaceEdge,
  FaceEdgeId,
  FaceId,
  HingeId,
  Matrix4Tuple,
  PhysicalEdgeId,
  PhysicalEdgePair,
  Point2D,
  Point3D,
  SeamId,
  SeamMeasurement
} from './types';
import { validateDimensions, validateFoldTicks, verifyNumericalDeterminacy } from './validator';

export function dist3D(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Builds a column-major 4x4 homogeneous transform matrix from orthonormal basis vectors
 * u (local X), v (local Y), w (local Z) and translation t.
 */
export function makeTransformMatrix(
  u: Point3D,
  v: Point3D,
  w: Point3D,
  t: Point3D
): Matrix4Tuple {
  return [
    u.x, u.y, u.z, 0,
    v.x, v.y, v.z, 0,
    w.x, w.y, w.z, 0,
    t.x, t.y, t.z, 1
  ];
}

/**
 * Multiplies two column-major 4x4 matrices: result = A * B.
 */
export function multiplyMatrix4(a: Matrix4Tuple, b: Matrix4Tuple): Matrix4Tuple {
  const out = new Array<number>(16).fill(0);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row] * b[col * 4 + k];
      }
      out[col * 4 + row] = sum;
    }
  }
  return out as unknown as Matrix4Tuple;
}

/**
 * Transforms a local 2D face vertex (u, v, 0, 1) by a column-major 4x4 matrix.
 */
export function transformLocalPoint2D(m: Matrix4Tuple, pt: Point2D): Point3D {
  return {
    x: m[0] * pt.x + m[4] * pt.y + m[12],
    y: m[1] * pt.x + m[5] * pt.y + m[13],
    z: m[2] * pt.x + m[6] * pt.y + m[14]
  };
}

interface EdgeTopologySpec {
  id: FaceEdgeId;
  edgeIndex: 0 | 1 | 2 | 3;
  pairedEdgeId: FaceEdgeId;
  physicalEdgeId: PhysicalEdgeId;
  kind: 'hinge' | 'seam';
}

const FACE_EDGE_TOPOLOGY: Record<FaceId, readonly [EdgeTopologySpec, EdgeTopologySpec, EdgeTopologySpec, EdgeTopologySpec]> = {
  base: [
    { id: 'base:south', edgeIndex: 0, pairedEdgeId: 'south:base', physicalEdgeId: 'base-south', kind: 'hinge' },
    { id: 'base:east', edgeIndex: 1, pairedEdgeId: 'east:base', physicalEdgeId: 'base-east', kind: 'hinge' },
    { id: 'base:north', edgeIndex: 2, pairedEdgeId: 'north:base', physicalEdgeId: 'base-north', kind: 'hinge' },
    { id: 'base:west', edgeIndex: 3, pairedEdgeId: 'west:base', physicalEdgeId: 'base-west', kind: 'hinge' }
  ],
  north: [
    { id: 'north:base', edgeIndex: 0, pairedEdgeId: 'base:north', physicalEdgeId: 'base-north', kind: 'hinge' },
    { id: 'north:east', edgeIndex: 1, pairedEdgeId: 'east:north', physicalEdgeId: 'north-east', kind: 'seam' },
    { id: 'north:lid', edgeIndex: 2, pairedEdgeId: 'lid:north', physicalEdgeId: 'north-lid', kind: 'hinge' },
    { id: 'north:west', edgeIndex: 3, pairedEdgeId: 'west:north', physicalEdgeId: 'north-west', kind: 'seam' }
  ],
  south: [
    { id: 'south:base', edgeIndex: 0, pairedEdgeId: 'base:south', physicalEdgeId: 'base-south', kind: 'hinge' },
    { id: 'south:west', edgeIndex: 1, pairedEdgeId: 'west:south', physicalEdgeId: 'south-west', kind: 'seam' },
    { id: 'south:lid', edgeIndex: 2, pairedEdgeId: 'lid:south', physicalEdgeId: 'lid-south', kind: 'seam' },
    { id: 'south:east', edgeIndex: 3, pairedEdgeId: 'east:south', physicalEdgeId: 'south-east', kind: 'seam' }
  ],
  east: [
    { id: 'east:base', edgeIndex: 0, pairedEdgeId: 'base:east', physicalEdgeId: 'base-east', kind: 'hinge' },
    { id: 'east:south', edgeIndex: 1, pairedEdgeId: 'south:east', physicalEdgeId: 'south-east', kind: 'seam' },
    { id: 'east:lid', edgeIndex: 2, pairedEdgeId: 'lid:east', physicalEdgeId: 'lid-east', kind: 'seam' },
    { id: 'east:north', edgeIndex: 3, pairedEdgeId: 'north:east', physicalEdgeId: 'north-east', kind: 'seam' }
  ],
  west: [
    { id: 'west:base', edgeIndex: 0, pairedEdgeId: 'base:west', physicalEdgeId: 'base-west', kind: 'hinge' },
    { id: 'west:north', edgeIndex: 1, pairedEdgeId: 'north:west', physicalEdgeId: 'north-west', kind: 'seam' },
    { id: 'west:lid', edgeIndex: 2, pairedEdgeId: 'lid:west', physicalEdgeId: 'lid-west', kind: 'seam' },
    { id: 'west:south', edgeIndex: 3, pairedEdgeId: 'south:west', physicalEdgeId: 'south-west', kind: 'seam' }
  ],
  lid: [
    { id: 'lid:north', edgeIndex: 0, pairedEdgeId: 'north:lid', physicalEdgeId: 'north-lid', kind: 'hinge' },
    { id: 'lid:east', edgeIndex: 1, pairedEdgeId: 'east:lid', physicalEdgeId: 'lid-east', kind: 'seam' },
    { id: 'lid:south', edgeIndex: 2, pairedEdgeId: 'south:lid', physicalEdgeId: 'lid-south', kind: 'seam' },
    { id: 'lid:west', edgeIndex: 3, pairedEdgeId: 'west:lid', physicalEdgeId: 'lid-west', kind: 'seam' }
  ]
};

function buildFaceEdges(
  faceId: FaceId,
  corners3D: [Point3D, Point3D, Point3D, Point3D],
  cornersNet: [Point2D, Point2D, Point2D, Point2D]
): [FaceEdge, FaceEdge, FaceEdge, FaceEdge] {
  const specs = FACE_EDGE_TOPOLOGY[faceId];
  const edges = specs.map((spec, idx) => {
    const nextIdx = (idx + 1) % 4;
    return {
      id: spec.id,
      faceId,
      edgeIndex: spec.edgeIndex,
      pairedEdgeId: spec.pairedEdgeId,
      physicalEdgeId: spec.physicalEdgeId,
      kind: spec.kind,
      start3D: corners3D[idx],
      end3D: corners3D[nextIdx],
      startNet: cornersNet[idx],
      endNet: cornersNet[nextIdx]
    };
  });
  return edges as [FaceEdge, FaceEdge, FaceEdge, FaceEdge];
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

  // Exact trigonometric evaluation with closed-state and flat-state snapping
  const cosT = foldTicks === 1000 ? 0.0 : foldTicks === 0 ? 1.0 : Math.cos(theta);
  const sinT = foldTicks === 1000 ? 1.0 : foldTicks === 0 ? 0.0 : Math.sin(theta);
  const cos2T = foldTicks === 1000 ? -1.0 : foldTicks === 0 ? 1.0 : Math.cos(2.0 * theta);
  const sin2T = foldTicks === 1000 ? 0.0 : foldTicks === 0 ? 0.0 : Math.sin(2.0 * theta);

  const halfW = W / 2.0;
  const halfD = D / 2.0;

  // 1. BASE FACE (Stationary root at z = 0)
  const baseLocalCorners: [Point2D, Point2D, Point2D, Point2D] = [
    { x: -halfW, y: -halfD },
    { x: halfW, y: -halfD },
    { x: halfW, y: halfD },
    { x: -halfW, y: halfD }
  ];
  const baseTransform = makeTransformMatrix(
    { x: 1.0, y: 0.0, z: 0.0 },
    { x: 0.0, y: 1.0, z: 0.0 },
    { x: 0.0, y: 0.0, z: 1.0 },
    { x: 0.0, y: 0.0, z: 0.0 }
  );
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
    localCorners: baseLocalCorners,
    transformMatrix: baseTransform,
    corners3D: baseCorners3D,
    normal3D: { x: 0.0, y: 0.0, z: -1.0 },
    cornersNet: baseCornersNet,
    edges: buildFaceEdges('base', baseCorners3D, baseCornersNet)
  };

  // 2. NORTH FACE (Hinge at y = +D/2, Rx(+theta))
  const northLocalCorners: [Point2D, Point2D, Point2D, Point2D] = [
    { x: -halfW, y: 0.0 },
    { x: halfW, y: 0.0 },
    { x: halfW, y: H },
    { x: -halfW, y: H }
  ];
  const northTransform = makeTransformMatrix(
    { x: 1.0, y: 0.0, z: 0.0 },
    { x: 0.0, y: cosT, z: sinT },
    { x: 0.0, y: -sinT, z: cosT },
    { x: 0.0, y: halfD, z: 0.0 }
  );
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
    localCorners: northLocalCorners,
    transformMatrix: northTransform,
    corners3D: northCorners3D,
    normal3D: { x: 0.0, y: sinT, z: -cosT },
    cornersNet: northCornersNet,
    edges: buildFaceEdges('north', northCorners3D, northCornersNet)
  };

  // 3. SOUTH FACE (Hinge at y = -D/2, Rx(-theta))
  const southLocalCorners: [Point2D, Point2D, Point2D, Point2D] = [
    { x: halfW, y: 0.0 },
    { x: -halfW, y: 0.0 },
    { x: -halfW, y: -H },
    { x: halfW, y: -H }
  ];
  const southTransform = makeTransformMatrix(
    { x: 1.0, y: 0.0, z: 0.0 },
    { x: 0.0, y: cosT, z: -sinT },
    { x: 0.0, y: sinT, z: cosT },
    { x: 0.0, y: -halfD, z: 0.0 }
  );
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
    localCorners: southLocalCorners,
    transformMatrix: southTransform,
    corners3D: southCorners3D,
    normal3D: { x: 0.0, y: -sinT, z: -cosT },
    cornersNet: southCornersNet,
    edges: buildFaceEdges('south', southCorners3D, southCornersNet)
  };

  // 4. EAST FACE (Hinge at x = +W/2, Ry(-theta))
  const eastLocalCorners: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 0.0, y: halfD },
    { x: 0.0, y: -halfD },
    { x: H, y: -halfD },
    { x: H, y: halfD }
  ];
  const eastTransform = makeTransformMatrix(
    { x: cosT, y: 0.0, z: sinT },
    { x: 0.0, y: 1.0, z: 0.0 },
    { x: -sinT, y: 0.0, z: cosT },
    { x: halfW, y: 0.0, z: 0.0 }
  );
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
    localCorners: eastLocalCorners,
    transformMatrix: eastTransform,
    corners3D: eastCorners3D,
    normal3D: { x: sinT, y: 0.0, z: -cosT },
    cornersNet: eastCornersNet,
    edges: buildFaceEdges('east', eastCorners3D, eastCornersNet)
  };

  // 5. WEST FACE (Hinge at x = -W/2, Ry(+theta))
  const westLocalCorners: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 0.0, y: -halfD },
    { x: 0.0, y: halfD },
    { x: -H, y: halfD },
    { x: -H, y: -halfD }
  ];
  const westTransform = makeTransformMatrix(
    { x: cosT, y: 0.0, z: -sinT },
    { x: 0.0, y: 1.0, z: 0.0 },
    { x: sinT, y: 0.0, z: cosT },
    { x: -halfW, y: 0.0, z: 0.0 }
  );
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
    localCorners: westLocalCorners,
    transformMatrix: westTransform,
    corners3D: westCorners3D,
    normal3D: { x: -sinT, y: 0.0, z: -cosT },
    cornersNet: westCornersNet,
    edges: buildFaceEdges('west', westCorners3D, westCornersNet)
  };

  // 6. LID FACE (Attached to North face's distal edge, inherits North transform + Rx(+theta))
  const lidLocalCorners: [Point2D, Point2D, Point2D, Point2D] = [
    { x: -halfW, y: 0.0 },
    { x: halfW, y: 0.0 },
    { x: halfW, y: D },
    { x: -halfW, y: D }
  ];
  const lidLocalHingeMatrix = makeTransformMatrix(
    { x: 1.0, y: 0.0, z: 0.0 },
    { x: 0.0, y: cosT, z: sinT },
    { x: 0.0, y: -sinT, z: cosT },
    { x: 0.0, y: H, z: 0.0 }
  );
  const lidOriginY = halfD + H * cosT;
  const lidOriginZ = H * sinT;
  const lidTransform = makeTransformMatrix(
    { x: 1.0, y: 0.0, z: 0.0 },
    { x: 0.0, y: cos2T, z: sin2T },
    { x: 0.0, y: -sin2T, z: cos2T },
    { x: 0.0, y: lidOriginY, z: lidOriginZ }
  );
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
    localCorners: lidLocalCorners,
    transformMatrix: lidTransform,
    corners3D: lidCorners3D,
    normal3D: { x: 0.0, y: sin2T, z: -cos2T },
    cornersNet: lidCornersNet,
    edges: buildFaceEdges('lid', lidCorners3D, lidCornersNet)
  };

  const faces: Record<FaceId, CartonFace> = {
    base: baseFace,
    north: northFace,
    south: southFace,
    east: eastFace,
    west: westFace,
    lid: lidFace
  };

  // Collect all 24 face-edge records
  const faceEdges = {} as Record<FaceEdgeId, FaceEdge>;
  for (const face of Object.values(faces)) {
    for (const edge of face.edges) {
      faceEdges[edge.id] = edge;
    }
  }

  // 5 HINGES
  const angleDeg = (theta * 180.0) / Math.PI;
  const hinges: Record<HingeId, CartonHinge> = {
    'base-north': {
      id: 'base-north',
      parentFace: 'base',
      childFace: 'north',
      axis: 'x',
      signedQuarterTurn: 1,
      axisStart: baseCorners3D[3],
      axisEnd: baseCorners3D[2],
      angleRadians: theta,
      angleDegrees: angleDeg,
      localMatrix: northTransform,
      worldMatrix: northTransform
    },
    'base-south': {
      id: 'base-south',
      parentFace: 'base',
      childFace: 'south',
      axis: 'x',
      signedQuarterTurn: -1,
      axisStart: baseCorners3D[1],
      axisEnd: baseCorners3D[0],
      angleRadians: theta,
      angleDegrees: angleDeg,
      localMatrix: southTransform,
      worldMatrix: southTransform
    },
    'base-east': {
      id: 'base-east',
      parentFace: 'base',
      childFace: 'east',
      axis: 'y',
      signedQuarterTurn: -1,
      axisStart: baseCorners3D[2],
      axisEnd: baseCorners3D[1],
      angleRadians: theta,
      angleDegrees: angleDeg,
      localMatrix: eastTransform,
      worldMatrix: eastTransform
    },
    'base-west': {
      id: 'base-west',
      parentFace: 'base',
      childFace: 'west',
      axis: 'y',
      signedQuarterTurn: 1,
      axisStart: baseCorners3D[0],
      axisEnd: baseCorners3D[3],
      angleRadians: theta,
      angleDegrees: angleDeg,
      localMatrix: westTransform,
      worldMatrix: westTransform
    },
    'north-lid': {
      id: 'north-lid',
      parentFace: 'north',
      childFace: 'lid',
      axis: 'x',
      signedQuarterTurn: 1,
      axisStart: northCorners3D[3],
      axisEnd: northCorners3D[2],
      angleRadians: theta,
      angleDegrees: angleDeg,
      localMatrix: lidLocalHingeMatrix,
      worldMatrix: lidTransform
    }
  };

  // 7 CLOSURE SEAMS
  const tolerance = 1e-9 * Math.max(W, D, H);

  function makeSeam(
    id: SeamId,
    name: string,
    faceA: FaceId,
    faceB: FaceId,
    edgeA: FaceEdgeId,
    edgeB: FaceEdgeId,
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
      edgeA,
      edgeB,
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
      'north:east',
      'east:north',
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
      'north:west',
      'west:north',
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
      'south:east',
      'east:south',
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
      'south:west',
      'west:south',
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
      'lid:east',
      'east:lid',
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
      'lid:west',
      'west:lid',
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
      'lid:south',
      'south:lid',
      lidCorners3D[3],
      lidCorners3D[2],
      southCorners3D[2],
      southCorners3D[3]
    )
  };

  // 12 PAIRED PHYSICAL EDGES (5 persistent hinges + 7 closure seams)
  function makeHingePhysicalPair(
    id: HingeId,
    faceA: FaceId,
    faceB: FaceId,
    edgeA: FaceEdgeId,
    edgeB: FaceEdgeId,
    pA1: Point3D,
    pA2: Point3D,
    pB1: Point3D,
    pB2: Point3D
  ): PhysicalEdgePair {
    const gapStart = dist3D(pA1, pB1);
    const gapEnd = dist3D(pA2, pB2);
    const maxGap = Math.max(gapStart, gapEnd);
    return {
      id,
      kind: 'hinge',
      faceA,
      faceB,
      edgeA,
      edgeB,
      pointA1: pA1,
      pointA2: pA2,
      pointB1: pB1,
      pointB2: pB2,
      gapStart,
      gapEnd,
      maxGap,
      isCoincident: maxGap <= tolerance
    };
  }

  const physicalEdges: Record<PhysicalEdgeId, PhysicalEdgePair> = {
    'base-north': makeHingePhysicalPair(
      'base-north',
      'base',
      'north',
      'base:north',
      'north:base',
      baseCorners3D[3],
      baseCorners3D[2],
      northCorners3D[0],
      northCorners3D[1]
    ),
    'base-south': makeHingePhysicalPair(
      'base-south',
      'base',
      'south',
      'base:south',
      'south:base',
      baseCorners3D[1],
      baseCorners3D[0],
      southCorners3D[0],
      southCorners3D[1]
    ),
    'base-east': makeHingePhysicalPair(
      'base-east',
      'base',
      'east',
      'base:east',
      'east:base',
      baseCorners3D[2],
      baseCorners3D[1],
      eastCorners3D[0],
      eastCorners3D[1]
    ),
    'base-west': makeHingePhysicalPair(
      'base-west',
      'base',
      'west',
      'base:west',
      'west:base',
      baseCorners3D[0],
      baseCorners3D[3],
      westCorners3D[0],
      westCorners3D[1]
    ),
    'north-lid': makeHingePhysicalPair(
      'north-lid',
      'north',
      'lid',
      'north:lid',
      'lid:north',
      northCorners3D[3],
      northCorners3D[2],
      lidCorners3D[0],
      lidCorners3D[1]
    ),
    'north-east': {
      ...seams['north-east'],
      kind: 'seam',
      isCoincident: seams['north-east'].isClosed
    },
    'north-west': {
      ...seams['north-west'],
      kind: 'seam',
      isCoincident: seams['north-west'].isClosed
    },
    'south-east': {
      ...seams['south-east'],
      kind: 'seam',
      isCoincident: seams['south-east'].isClosed
    },
    'south-west': {
      ...seams['south-west'],
      kind: 'seam',
      isCoincident: seams['south-west'].isClosed
    },
    'lid-east': {
      ...seams['lid-east'],
      kind: 'seam',
      isCoincident: seams['lid-east'].isClosed
    },
    'lid-west': {
      ...seams['lid-west'],
      kind: 'seam',
      isCoincident: seams['lid-west'].isClosed
    },
    'lid-south': {
      ...seams['lid-south'],
      kind: 'seam',
      isCoincident: seams['lid-south'].isClosed
    }
  };

  let maxSeamGap = 0.0;
  for (const seam of Object.values(seams)) {
    if (seam.maxGap > maxSeamGap) {
      maxSeamGap = seam.maxGap;
    }
  }

  let maxHingeGap = 0.0;
  for (const pair of Object.values(physicalEdges)) {
    if (pair.kind === 'hinge' && pair.maxGap > maxHingeGap) {
      maxHingeGap = pair.maxGap;
    }
  }

  const isFullyClosed = foldTicks === 1000 && maxSeamGap <= tolerance && maxHingeGap <= tolerance;

  const study: CartonStudy = {
    dimensions: { width: W, depth: D, height: H },
    foldTicks,
    foldFraction: alpha,
    faces,
    hinges,
    seams,
    faceEdges,
    physicalEdges,
    isFullyClosed,
    maxSeamGap,
    maxHingeGap,
    tolerance,
    status: 'ValidStudy'
  };

  const indeterminacy = verifyNumericalDeterminacy(study);
  if (indeterminacy) {
    return {
      ...study,
      isFullyClosed: false,
      status: 'NumericallyIndeterminate'
    };
  }

  return study;
}
