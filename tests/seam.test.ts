import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveCartonStudy } from '../src/core/carton';

test('closed state (t = 1000) achieves exact closure on all 7 seams', () => {
  const study = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 1000);
  assert.equal(study.isFullyClosed, true);
  assert.ok(study.maxSeamGap <= study.tolerance);

  for (const seam of Object.values(study.seams)) {
    assert.equal(seam.isClosed, true, `Seam ${seam.id} failed closure`);
    assert.ok(seam.maxGap <= study.tolerance, `Seam ${seam.id} gap ${seam.maxGap} > tol ${study.tolerance}`);
  }
});

test('partially folded states report positive seam gaps', () => {
  const study1 = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 250);
  const study2 = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 500);
  const study3 = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 750);

  assert.equal(study1.isFullyClosed, false);
  assert.equal(study2.isFullyClosed, false);
  assert.equal(study3.isFullyClosed, false);

  assert.ok(study1.maxSeamGap > study2.maxSeamGap);
  assert.ok(study2.maxSeamGap > study3.maxSeamGap);
});

test('out of bounds inputs throw validation errors', () => {
  assert.throws(() => deriveCartonStudy({ width: 0, depth: 80, height: 40 }, 500));
  assert.throws(() => deriveCartonStudy({ width: 5000, depth: 80, height: 40 }, 500));
  assert.throws(() => deriveCartonStudy({ width: 120, depth: 80, height: 40 }, -1));
  assert.throws(() => deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 1001));
});
