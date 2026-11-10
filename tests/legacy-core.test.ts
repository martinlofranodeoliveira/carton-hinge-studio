import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveCartonStudy } from '../src/core/carton';
import { generateSvgNet } from '../src/core/svg';

test('deriveCartonStudy creates valid 6-face model', () => {
  const study = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 0);
  assert.equal(study.status, 'ValidStudy');
  assert.equal(Object.keys(study.faces).length, 6);
  assert.equal(Object.keys(study.hinges).length, 5);
  assert.equal(Object.keys(study.seams).length, 7);

  // Check face sizes
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

test('flat state corners all reside in Z=0', () => {
  const study = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 0);
  for (const face of Object.values(study.faces)) {
    for (const corner of face.corners3D) {
      assert.ok(Math.abs(corner.z) < 1e-9, `Expected Z=0, got ${corner.z}`);
    }
  }
  assert.equal(study.isFullyClosed, false);
});

test('SVG net generation contains all faces and valid dimensions', () => {
  const study = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 0);
  const svg = generateSvgNet(study);
  assert.ok(svg.startsWith('<?xml'));
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('Base'));
  assert.ok(svg.includes('North'));
  assert.ok(svg.includes('South'));
  assert.ok(svg.includes('East'));
  assert.ok(svg.includes('West'));
  assert.ok(svg.includes('Lid'));
  assert.ok(svg.includes('120 × 80 mm'));
});
