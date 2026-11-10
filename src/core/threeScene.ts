import * as THREE from 'three';
import { CartonFace, CartonStudy, FaceId, Point2D, Point3D } from './types';

export const MAX_RENDER_DPR = 2;
export const MAX_BACKING_BUFFER_PIXELS = 4194304; // 2048 x 2048 logical pixel ceiling
export const SCENE_UNIT_SCALE = 0.01; // 1 mm = 0.01 scene units

export const FACE_PALETTE: Record<FaceId, string> = {
  base: '#cbd5e1',
  north: '#93c5fd',
  south: '#fde047',
  east: '#86efac',
  west: '#fca5a5',
  lid: '#d8b4fe'
};

export interface ClampedViewportPolicy {
  cssWidth: number;
  cssHeight: number;
  requestedDpr: number;
  effectiveDpr: number;
  backingWidth: number;
  backingHeight: number;
  backingPixels: number;
}

/**
 * Enforces DPR <= 2 and backing buffer <= 4,194,304 pixels.
 */
export function computeClampedViewport(
  cssWidth: number,
  cssHeight: number,
  requestedDpr = 1
): ClampedViewportPolicy {
  const safeWidth = Number.isFinite(cssWidth) && cssWidth > 0 ? Math.max(1, cssWidth) : 800;
  const safeHeight = Number.isFinite(cssHeight) && cssHeight > 0 ? Math.max(1, cssHeight) : 600;
  const safeReqDpr = Number.isFinite(requestedDpr) && requestedDpr > 0 ? requestedDpr : 1;

  const cappedDpr = Math.min(safeReqDpr, MAX_RENDER_DPR);
  // Separate square roots avoid overflowing W*H; per-axis ceilings account
  // for the mandatory one-pixel minimum on extremely thin viewports.
  const maxDprForPixels = Math.sqrt(MAX_BACKING_BUFFER_PIXELS) / Math.sqrt(safeWidth) / Math.sqrt(safeHeight);
  const effectiveDpr = Math.min(cappedDpr, maxDprForPixels,
    MAX_BACKING_BUFFER_PIXELS / safeWidth, MAX_BACKING_BUFFER_PIXELS / safeHeight);

  const backingWidth = Math.min(MAX_BACKING_BUFFER_PIXELS, Math.max(1, Math.floor(safeWidth * effectiveDpr)));
  const backingHeight = Math.min(Math.floor(MAX_BACKING_BUFFER_PIXELS / backingWidth), Math.max(1, Math.floor(safeHeight * effectiveDpr)));
  const backingPixels = backingWidth * backingHeight;

  return {
    cssWidth: safeWidth,
    cssHeight: safeHeight,
    requestedDpr: safeReqDpr,
    effectiveDpr,
    backingWidth,
    backingHeight,
    backingPixels
  };
}

export type CameraPresetId = 'isometric' | 'top' | 'front';

export interface CameraFraming {
  target: [number, number, number];
  position: [number, number, number];
  up: [number, number, number];
  near: number;
  far: number;
  radius: number;
  gridSize: number;
}

/**
 * Computes camera framing from actual carton dimensions and 3D world corners
 * so any carton from 1x1x1 mm up to 4095x4095x4095 mm is framed without clipping.
 */
export function computeCameraFraming(
  study: CartonStudy,
  preset: CameraPresetId = 'isometric',
  aspect = 1
): CameraFraming {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const face of Object.values(study.faces)) {
    for (const pt of face.corners3D) {
      const sx = pt.x * SCENE_UNIT_SCALE;
      const sy = pt.y * SCENE_UNIT_SCALE;
      const sz = pt.z * SCENE_UNIT_SCALE;
      if (sx < minX) minX = sx;
      if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy;
      if (sy > maxY) maxY = sy;
      if (sz < minZ) minZ = sz;
      if (sz > maxZ) maxZ = sz;
    }
  }

  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const centerZ = (minZ + maxZ) * 0.5;

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const spanZ = maxZ - minZ;
  const radius = Math.max(0.05, Math.hypot(spanX, spanY, spanZ) * 0.5);

  // Fit the bounding sphere against both horizontal and vertical 45-degree
  // perspective constraints; portrait layouts need a larger camera distance.
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? Math.max(Number.EPSILON, aspect) : 1;
  const halfVerticalFov = Math.PI / 8;
  const halfHorizontalFov = Math.atan(Math.tan(halfVerticalFov) * safeAspect);
  const dist = radius * 1.12 / Math.sin(Math.min(halfVerticalFov, halfHorizontalFov));
  const near = Math.max(0.001, dist * 0.005);
  const far = Math.max(50, dist * 12);
  const gridSize = Math.max(2, Math.ceil(radius * 4));

  const direction: [number, number, number] = preset === 'top' ? [0, -0.001, 1]
    : preset === 'front' ? [0, -1, 0.35] : [0.68, -0.82, 0.72];
  const length = Math.hypot(...direction);
  const position: [number, number, number] = [centerX + direction[0] / length * dist,
    centerY + direction[1] / length * dist, centerZ + direction[2] / length * dist];
  const up: [number, number, number] = preset === 'top' ? [0, 1, 0] : [0, 0, 1];

  return {
    target: [centerX, centerY, centerZ],
    position,
    up,
    near,
    far,
    radius,
    gridSize
  };
}

export interface FaceGeometryBundle {
  faceId: FaceId;
  geometry: THREE.BufferGeometry;
  edgesGeometry: THREE.EdgesGeometry;
  matrix: THREE.Matrix4;
  dispose: () => void;
}

/**
 * Builds a Three.js BufferGeometry for one carton face using exactly 4 face-local vertices
 * and 2 indexed triangles (6 indices), plus its 4x4 homogeneous world transform matrix.
 * Across the 6 carton faces, this yields exactly 24 face-local vertices and 12 triangles.
 */
export function createFaceGeometryBundle(face: CartonFace): FaceGeometryBundle {
  const geometry = new THREE.BufferGeometry();
  const [p0, p1, p2, p3] = face.localCorners;

  const positions = new Float32Array([
    p0.x, p0.y, 0,
    p1.x, p1.y, 0,
    p2.x, p2.y, 0,
    p3.x, p3.y, 0
  ]);
  // Core corner identities use +local-Z order; the outside of the sheet
  // is -local-Z, matching the core's explicit outward normal convention.
  const indices = new Uint16Array([0, 2, 1, 0, 3, 2]);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const matrix = new THREE.Matrix4().fromArray(face.transformMatrix);

  let disposed = false;
  return {
    faceId: face.id,
    geometry,
    edgesGeometry,
    matrix,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      geometry.dispose();
      edgesGeometry.dispose();
    }
  };
}

export interface CartonSceneGraph {
  rootGroup: THREE.Group;
  faceMeshes: Record<FaceId, THREE.Mesh>;
  faceBundles: Record<FaceId, FaceGeometryBundle>;
  totalVertices: number;
  totalTriangles: number;
  dispose: () => void;
}

/**
 * Builds an inspectable Three.js scene graph for all 6 faces with explicit disposal.
 */
export function buildCartonSceneGraph(
  study: CartonStudy,
  selectedFace: FaceId | null = null
): CartonSceneGraph {
  const rootGroup = new THREE.Group();
  rootGroup.scale.set(SCENE_UNIT_SCALE, SCENE_UNIT_SCALE, SCENE_UNIT_SCALE);

  const faceMeshes = {} as Record<FaceId, THREE.Mesh>;
  const faceBundles = {} as Record<FaceId, FaceGeometryBundle>;
  const materials: THREE.Material[] = [];

  let totalVertices = 0;
  let totalTriangles = 0;

  for (const face of Object.values(study.faces)) {
    const bundle = createFaceGeometryBundle(face);
    faceBundles[face.id] = bundle;

    const posAttr = bundle.geometry.getAttribute('position');
    const indexAttr = bundle.geometry.getIndex();
    totalVertices += posAttr.count;
    totalTriangles += indexAttr ? indexAttr.count / 3 : 0;

    const isSelected = selectedFace === face.id;
    const mat = new THREE.MeshStandardMaterial({
      color: isSelected ? '#235bd4' : FACE_PALETTE[face.id],
      side: THREE.DoubleSide,
      roughness: 0.45,
      metalness: 0.08
    });
    materials.push(mat);

    const mesh = new THREE.Mesh(bundle.geometry, mat);
    mesh.name = `face-${face.id}`;
    mesh.matrixAutoUpdate = false;
    mesh.matrix.copy(bundle.matrix);
    mesh.updateMatrixWorld(true);

    const lineMat = new THREE.LineBasicMaterial({
      color: isSelected ? '#1d4ed8' : '#202b36'
    });
    materials.push(lineMat);
    const edgeLines = new THREE.LineSegments(bundle.edgesGeometry, lineMat);
    edgeLines.name = `edges-${face.id}`;
    mesh.add(edgeLines);

    faceMeshes[face.id] = mesh;
    rootGroup.add(mesh);
  }

  rootGroup.updateMatrixWorld(true);

  let disposed = false;
  return {
    rootGroup,
    faceMeshes,
    faceBundles,
    totalVertices,
    totalTriangles,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      for (const bundle of Object.values(faceBundles)) {
        bundle.dispose();
      }
      for (const mat of materials) {
        mat.dispose();
      }
    }
  };
}

/**
 * Projects a 3D point into 2D isometric SVG coordinates for the GPU-free 3D maquette fallback.
 */
export function projectIsometricPoint(pt: Point3D): Point2D {
  const cos30 = 0.8660254037844386;
  const sin30 = 0.5;
  return {
    x: (pt.x - pt.y) * cos30,
    y: (pt.x + pt.y) * sin30 - pt.z
  };
}
