import { deriveCartonStudy } from './core/carton';
import { generateSvgNet } from './core/svg';
import { validateDimensions, validateFoldTicks } from './core/validator';

export function runDemo(assertMode = false, jsonMode = false): void {
  // Scenario 1: Flat carton net (t = 0)
  const studyFlat = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 0);

  // Scenario 2: Partial fold (t = 500, 45 degrees)
  const studyMid = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 500);

  // Scenario 3: Fully closed box (t = 1000, 90 degrees)
  const studyClosed = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 1000);

  // Scenario 4: Bounds validation rejection
  const invalidDimErr = validateDimensions({ width: 0, depth: 80, height: 40 });
  const invalidFoldErr = validateFoldTicks(1500);

  if (assertMode) {
    // Assert 1: Flat state face planarity (Z = 0 for all corners)
    for (const face of Object.values(studyFlat.faces)) {
      for (const pt of face.corners3D) {
        if (Math.abs(pt.z) > 1e-9) {
          throw new Error(`Flat face ${face.id} corner not in Z=0: ${pt.z}`);
        }
      }
    }
    if (studyFlat.isFullyClosed) {
      throw new Error('Flat state must not be marked closed');
    }

    // Assert 2: Partial fold continuity
    if (Math.abs(studyMid.foldFraction - 0.5) > 1e-9) {
      throw new Error(`Partial fold fraction mismatch: ${studyMid.foldFraction}`);
    }

    // Assert 3: Closed state seam closure within tolerance
    if (!studyClosed.isFullyClosed) {
      throw new Error(
        `Closed state failed to close: maxGap=${studyClosed.maxSeamGap}, tol=${studyClosed.tolerance}`
      );
    }
    for (const seam of Object.values(studyClosed.seams)) {
      if (!seam.isClosed) {
        throw new Error(`Seam ${seam.id} failed closure: maxGap=${seam.maxGap}`);
      }
    }

    // Assert 4: Bounds rejection
    if (!invalidDimErr || !invalidFoldErr) {
      throw new Error('Boundary validation failed to reject invalid values');
    }
  }

  if (jsonMode) {
    const report = {
      demo: 'carton-hinge-studio',
      scenario1_flat: {
        dimensions: studyFlat.dimensions,
        foldTicks: studyFlat.foldTicks,
        isFullyClosed: studyFlat.isFullyClosed,
        maxSeamGap: studyFlat.maxSeamGap
      },
      scenario2_mid: {
        dimensions: studyMid.dimensions,
        foldTicks: studyMid.foldTicks,
        isFullyClosed: studyMid.isFullyClosed,
        maxSeamGap: studyMid.maxSeamGap
      },
      scenario3_closed: {
        dimensions: studyClosed.dimensions,
        foldTicks: studyClosed.foldTicks,
        isFullyClosed: studyClosed.isFullyClosed,
        maxSeamGap: studyClosed.maxSeamGap,
        tolerance: studyClosed.tolerance
      },
      scenario4_rejection: {
        invalidDimensionError: invalidDimErr,
        invalidFoldTicksError: invalidFoldErr
      }
    };
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('=== Scenario 1: Flat Net (t = 0) ===');
    console.log(`Dimensions: ${studyFlat.dimensions.width}x${studyFlat.dimensions.depth}x${studyFlat.dimensions.height} mm`);
    console.log(`Max seam gap: ${studyFlat.maxSeamGap.toFixed(2)} mm | Closed: ${studyFlat.isFullyClosed}`);

    console.log('\n=== Scenario 2: Half Fold (t = 500, 45°) ===');
    console.log(`Fold fraction: ${studyMid.foldFraction} | Max seam gap: ${studyMid.maxSeamGap.toFixed(2)} mm`);

    console.log('\n=== Scenario 3: Fully Closed Box (t = 1000, 90°) ===');
    console.log(`Max seam gap: ${studyClosed.maxSeamGap.toExponential(3)} mm (tolerance: ${studyClosed.tolerance.toExponential(3)} mm)`);
    console.log(`All 7 closure seams sealed: ${studyClosed.isFullyClosed ? 'YES' : 'NO'}`);

    console.log('\n=== Scenario 4: Validation Bounds Rejection ===');
    console.log(`Width 0: rejected (${invalidDimErr})`);
    console.log(`Fold ticks 1500: rejected (${invalidFoldErr})`);
  }
}

// CLI argument parsing
const args = process.argv.slice(2);
if (args[0] === 'demo' || args.length === 0 || args.includes('--assert') || args.includes('--json')) {
  const assertMode = args.includes('--assert');
  const jsonMode = args.includes('--json');
  runDemo(assertMode, jsonMode);
} else if (args[0] === 'study') {
  let width = 120;
  let depth = 80;
  let height = 40;
  let fold = 1000;
  let format = 'text';

  for (const arg of args.slice(1)) {
    if (arg.startsWith('--width=')) width = parseInt(arg.slice(8), 10);
    if (arg.startsWith('--depth=')) depth = parseInt(arg.slice(8), 10);
    if (arg.startsWith('--height=')) height = parseInt(arg.slice(9), 10);
    if (arg.startsWith('--fold=')) fold = parseInt(arg.slice(7), 10);
    if (arg.startsWith('--format=')) format = arg.slice(9);
  }

  const study = deriveCartonStudy({ width, depth, height }, fold);
  if (format === 'json') {
    console.log(JSON.stringify(study, null, 2));
  } else if (format === 'svg') {
    console.log(generateSvgNet(study));
  } else {
    console.log(`Carton Study: ${width}x${depth}x${height} mm (fold: ${fold}/1000)`);
    console.log(`Closed: ${study.isFullyClosed} (max seam gap: ${study.maxSeamGap.toFixed(4)} mm)`);
  }
} else if (args[0] === 'svg') {
  let width = 120;
  let depth = 80;
  let height = 40;
  for (const arg of args.slice(1)) {
    if (arg.startsWith('--width=')) width = parseInt(arg.slice(8), 10);
    if (arg.startsWith('--depth=')) depth = parseInt(arg.slice(8), 10);
    if (arg.startsWith('--height=')) height = parseInt(arg.slice(9), 10);
  }
  const study = deriveCartonStudy({ width, depth, height }, 0);
  console.log(generateSvgNet(study));
}
