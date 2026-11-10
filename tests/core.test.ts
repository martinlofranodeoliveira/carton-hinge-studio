import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveCartonStudy, multiplyMatrix4, transformLocalPoint2D } from '../src/core/carton';
import { generateSvgNet } from '../src/core/svg';
import { FaceId, Point3D } from '../src/core/types';

const GOLDEN_DIMS = { width: 120, depth: 80, height: 40 } as const;

// Literal flat (t = 0) 3D corner table for 120 x 80 x 40 mm
const EXPECTED_FLAT_CORNERS: Record<FaceId, readonly [Point3D, Point3D, Point3D, Point3D]> = {
  base: [
    { x: -60, y: -40, z: 0 },
    { x: 60, y: -40, z: 0 },
    { x: 60, y: 40, z: 0 },
    { x: -60, y: 40, z: 0 }
  ],
  north: [
    { x: -60, y: 40, z: 0 },
    { x: 60, y: 40, z: 0 },
    { x: 60, y: 80, z: 0 },
    { x: -60, y: 80, z: 0 }
  ],
  south: [
    { x: 60, y: -40, z: 0 },
    { x: -60, y: -40, z: 0 },
    { x: -60, y: -80, z: 0 },
    { x: 60, y: -80, z: 0 }
  ],
  east: [
    { x: 60, y: 40, z: 0 },
    { x: 60, y: -40, z: 0 },
    { x: 100, y: -40, z: 0 },
    { x: 100, y: 40, z: 0 }
  ],
  west: [
    { x: -60, y: -40, z: 0 },
    { x: -60, y: 40, z: 0 },
    { x: -100, y: 40, z: 0 },
    { x: -100, y: -40, z: 0 }
  ],
  lid: [
    { x: -60, y: 80, z: 0 },
    { x: 60, y: 80, z: 0 },
    { x: 60, y: 160, z: 0 },
    { x: -60, y: 160, z: 0 }
  ]
};

// Literal closed (t = 1000) 3D corner table for 120 x 80 x 40 mm
const EXPECTED_CLOSED_CORNERS: Record<FaceId, readonly [Point3D, Point3D, Point3D, Point3D]> = {
  base: [
    { x: -60, y: -40, z: 0 },
    { x: 60, y: -40, z: 0 },
    { x: 60, y: 40, z: 0 },
    { x: -60, y: 40, z: 0 }
  ],
  north: [
    { x: -60, y: 40, z: 0 },
    { x: 60, y: 40, z: 0 },
    { x: 60, y: 40, z: 40 },
    { x: -60, y: 40, z: 40 }
  ],
  south: [
    { x: 60, y: -40, z: 0 },
    { x: -60, y: -40, z: 0 },
    { x: -60, y: -40, z: 40 },
    { x: 60, y: -40, z: 40 }
  ],
  east: [
    { x: 60, y: 40, z: 0 },
    { x: 60, y: -40, z: 0 },
    { x: 60, y: -40, z: 40 },
    { x: 60, y: 40, z: 40 }
  ],
  west: [
    { x: -60, y: -40, z: 0 },
    { x: -60, y: 40, z: 0 },
    { x: -60, y: 40, z: 40 },
    { x: -60, y: -40, z: 40 }
  ],
  lid: [
    { x: -60, y: 40, z: 40 },
    { x: 60, y: 40, z: 40 },
    { x: 60, y: -40, z: 40 },
    { x: -60, y: -40, z: 40 }
  ]
};

function assertPointClose(actual: Point3D, expected: Point3D, tol = 1e-9, label = ''): void {
  assert.ok(Math.abs(actual.x - expected.x) <= tol, `${label} X: ${actual.x} vs ${expected.x}`);
  assert.ok(Math.abs(actual.y - expected.y) <= tol, `${label} Y: ${actual.y} vs ${expected.y}`);
  assert.ok(Math.abs(actual.z - expected.z) <= tol, `${label} Z: ${actual.z} vs ${expected.z}`);
}

test('deriveCartonStudy creates valid 6-face, 5-hinge, 24-face-edge, 12-physical-edge model', () => {
  const study = deriveCartonStudy(GOLDEN_DIMS, 0);
  assert.equal(study.status, 'ValidStudy');
  assert.equal(Object.keys(study.faces).length, 6);
  assert.equal(Object.keys(study.hinges).length, 5);
  assert.equal(Object.keys(study.seams).length, 7);
  assert.equal(Object.keys(study.faceEdges).length, 24);
  assert.equal(Object.keys(study.physicalEdges).length, 12);

  assert.equal(study.faces.base.width, 120);
  assert.equal(study.faces.base.height, 80);
  assert.equal(study.faces.north.width, 120);
  assert.equal(study.faces.north.height, 40);
  assert.equal(study.faces.east.width, 40);
  assert.equal(study.faces.east.height, 80);
  assert.equal(study.faces.west.width, 40);
  assert.equal(study.faces.west.height, 80);
  assert.equal(study.faces.south.width, 120);
  assert.equal(study.faces.south.height, 40);
  assert.equal(study.faces.lid.width, 120);
  assert.equal(study.faces.lid.height, 80);
});

test('flat state (t = 0) matches literal golden corner table and outward normals', () => {
  const study = deriveCartonStudy(GOLDEN_DIMS, 0);
  assert.equal(study.isFullyClosed, false);

  for (const faceId of Object.keys(EXPECTED_FLAT_CORNERS) as FaceId[]) {
    const face = study.faces[faceId];
    const expected = EXPECTED_FLAT_CORNERS[faceId];
    for (let i = 0; i < 4; i++) {
      assertPointClose(face.corners3D[i], expected[i], 1e-9, `flat ${faceId} V${i}`);
      assert.equal(face.cornersNet[i].x, expected[i].x);
      assert.equal(face.cornersNet[i].y, expected[i].y);
    }
    assertPointClose(face.normal3D, { x: 0, y: 0, z: -1 }, 1e-9, `flat ${faceId} normal`);
  }
});

test('closed state (t = 1000) matches literal golden corner table and cuboid plane oracle', () => {
  const study = deriveCartonStudy(GOLDEN_DIMS, 1000);
  assert.equal(study.isFullyClosed, true);

  const expectedPlanes: Record<FaceId, { normal: Point3D; offset: number }> = {
    base: { normal: { x: 0, y: 0, z: -1 }, offset: 0 },
    north: { normal: { x: 0, y: 1, z: 0 }, offset: 40 },
    south: { normal: { x: 0, y: -1, z: 0 }, offset: 40 },
    east: { normal: { x: 1, y: 0, z: 0 }, offset: 60 },
    west: { normal: { x: -1, y: 0, z: 0 }, offset: 60 },
    lid: { normal: { x: 0, y: 0, z: 1 }, offset: 40 }
  };

  for (const faceId of Object.keys(EXPECTED_CLOSED_CORNERS) as FaceId[]) {
    const face = study.faces[faceId];
    const expected = EXPECTED_CLOSED_CORNERS[faceId];
    const plane = expectedPlanes[faceId];

    assertPointClose(face.normal3D, plane.normal, 1e-9, `closed ${faceId} normal`);
    for (let i = 0; i < 4; i++) {
      const pt = face.corners3D[i];
      assertPointClose(pt, expected[i], study.tolerance, `closed ${faceId} V${i}`);
      const dot = plane.normal.x * pt.x + plane.normal.y * pt.y + plane.normal.z * pt.z;
      assert.ok(Math.abs(dot - plane.offset) <= study.tolerance, `plane equation failed for ${faceId}`);
    }
  }
});

test('intermediate half-fold (t = 500, 45 deg) matches literal half-turn trigonometric expectations', () => {
  const study = deriveCartonStudy(GOLDEN_DIMS, 500);
  const s = Math.SQRT1_2; // sin(45°) = cos(45°) = √2 / 2
  const hProj = 40 * s;   // 20 * √2

  // North distal edge at y = 40 + 20√2, z = 20√2
  assertPointClose(study.faces.north.corners3D[2], { x: 60, y: 40 + hProj, z: hProj }, 1e-9);
  assertPointClose(study.faces.north.normal3D, { x: 0, y: s, z: -s }, 1e-9);

  // South distal edge at y = -40 - 20√2, z = 20√2
  assertPointClose(study.faces.south.corners3D[2], { x: -60, y: -40 - hProj, z: hProj }, 1e-9);
  assertPointClose(study.faces.south.normal3D, { x: 0, y: -s, z: -s }, 1e-9);

  // East distal edge at x = 60 + 20√2, z = 20√2
  assertPointClose(study.faces.east.corners3D[2], { x: 60 + hProj, y: -40, z: hProj }, 1e-9);
  assertPointClose(study.faces.east.normal3D, { x: s, y: 0, z: -s }, 1e-9);

  // West distal edge at x = -60 - 20√2, z = 20√2
  assertPointClose(study.faces.west.corners3D[2], { x: -60 - hProj, y: 40, z: hProj }, 1e-9);
  assertPointClose(study.faces.west.normal3D, { x: -s, y: 0, z: -s }, 1e-9);

  // Lid at 45° hinge fold has compound angle 2 * 45° = 90° (vertical in +Z)
  assertPointClose(study.faces.lid.corners3D[2], { x: 60, y: 40 + hProj, z: hProj + 80 }, 1e-9);
  assertPointClose(study.faces.lid.normal3D, { x: 0, y: 1, z: 0 }, 1e-9);

  // Verify parent-child transform composition: world(lid) = world(north) * local(north-lid)
  const composedLid = multiplyMatrix4(
    study.hinges['base-north'].worldMatrix,
    study.hinges['north-lid'].localMatrix
  );
  for (let i = 0; i < 16; i++) {
    assert.ok(Math.abs(composedLid[i] - study.faces.lid.transformMatrix[i]) <= 1e-9);
  }

  // Verify every face's localCorners transformed by transformMatrix equal corners3D
  for (const face of Object.values(study.faces)) {
    for (let i = 0; i < 4; i++) {
      const transformed = transformLocalPoint2D(face.transformMatrix, face.localCorners[i]);
      assertPointClose(transformed, face.corners3D[i], 1e-9, `matrix transform ${face.id} L${i}`);
    }
  }
});

test('dimension extremes (1..4095 mm) evaluate deterministically and close at t = 1000', () => {
  for (const dims of [
    { width: 1, depth: 1, height: 1 },
    { width: 4095, depth: 4095, height: 4095 },
    { width: 4095, depth: 1, height: 2048 }
  ]) {
    const study = deriveCartonStudy(dims, 1000);
    assert.equal(study.status, 'ValidStudy');
    assert.equal(study.isFullyClosed, true);
    assert.ok(study.maxSeamGap <= study.tolerance);
    assert.ok(study.maxHingeGap <= study.tolerance);
  }
});

test('SVG net generation contains all faces, hinges and conceptual metadata', () => {
  const study = deriveCartonStudy(GOLDEN_DIMS, 0);
  const svg = generateSvgNet(study);
  assert.ok(svg.startsWith('<?xml'));
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('data-face-id="base"'));
  assert.ok(svg.includes('data-face-id="lid"'));
  assert.ok(svg.includes('data-hinge-id="north-lid"'));
  assert.ok(svg.includes('120 × 80 mm'));
});
