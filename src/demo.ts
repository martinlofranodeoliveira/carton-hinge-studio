import {parseCliArguments} from './core/cliArguments';
import { deriveCartonStudy } from './core/carton';
import { parseCartonStudyJson, serializeCartonStudyJson } from './core/studyIo';
import { generateSvgNet } from './core/svg';
import { validateDimensions, validateFoldTicks } from './core/validator';

export function runDemo(assertMode = false, jsonMode = false): void {
  // Scenario 1: Flat carton net (t = 0)
  const studyFlat = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 0);

  // Scenario 2: Partial fold (t = 500, 45 degrees)
  const studyMid = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 500);

  // Scenario 3: Fully closed box (t = 1000, 90 degrees)
  const studyClosed = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 1000);

  // Scenario 4: Portable JSON round-trip and bounds validation rejection
  const exportedJson = serializeCartonStudyJson(studyClosed, 'lid');
  const parsedJson = parseCartonStudyJson(exportedJson);
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

    // Assert 2: Partial fold continuity and persistent hinge coincidence
    if (Math.abs(studyMid.foldFraction - 0.5) > 1e-9) {
      throw new Error(`Partial fold fraction mismatch: ${studyMid.foldFraction}`);
    }
    if (studyMid.maxHingeGap > studyMid.tolerance) {
      throw new Error(`Persistent hinge gap exceeded at half fold: ${studyMid.maxHingeGap}`);
    }

    // Assert 3: Closed state geometric coincidence within tolerance across all 12 physical edges
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
    if (Object.keys(studyClosed.faceEdges).length !== 24) {
      throw new Error('Expected 24 face-edge identities');
    }
    if (Object.keys(studyClosed.physicalEdges).length !== 12) {
      throw new Error('Expected 12 paired physical-edge identities');
    }

    // Assert 4: Portable JSON round-trip and bounds rejection
    if (!parsedJson.ok || parsedJson.status !== 'ValidStudy') {
      throw new Error('Portable study JSON round-trip failed');
    }
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
        maxSeamGap: studyMid.maxSeamGap,
        maxHingeGap: studyMid.maxHingeGap
      },
      scenario3_closed: {
        dimensions: studyClosed.dimensions,
        foldTicks: studyClosed.foldTicks,
        isFullyClosed: studyClosed.isFullyClosed,
        maxSeamGap: studyClosed.maxSeamGap,
        tolerance: studyClosed.tolerance
      },
      scenario4_validation: {
        roundTripStatus: parsedJson.status,
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

    console.log('\n=== Scenario 3: Closed Carton Geometry (t = 1000, 90°) ===');
    console.log(`Max seam gap: ${studyClosed.maxSeamGap.toExponential(3)} mm (tolerance: ${studyClosed.tolerance.toExponential(3)} mm)`);
    console.log(`All 7 closure seams coincident: ${studyClosed.isFullyClosed ? 'YES' : 'NO'}`);

    console.log('\n=== Scenario 4: Validation Bounds & Portable JSON ===');
    console.log(`Portable JSON round-trip: ${parsedJson.status}`);
    console.log(`Width 0: rejected (${invalidDimErr})`);
    console.log(`Fold ticks 1500: rejected (${invalidFoldErr})`);
  }
}

// CLI arguments are fully validated before any result is printed.
try {
  const options = parseCliArguments(process.argv.slice(2));
  if (options.mode === 'demo') {
    runDemo(options.assert, options.json);
  } else {
    const study = deriveCartonStudy({ width: options.width, depth: options.depth, height: options.height }, options.fold);
    if (options.mode === 'svg' || options.format === 'svg') console.log(generateSvgNet(study));
    else if (options.format === 'json') console.log(serializeCartonStudyJson(study, 'lid').trimEnd());
    else console.log(`Carton Study: ${options.width}x${options.depth}x${options.height} mm (fold: ${options.fold}/1000)\nClosed: ${study.isFullyClosed} (max seam gap: ${study.maxSeamGap.toFixed(4)} mm)`);
  }
} catch {
  console.error('Invalid command or study parameters. Use demo [--assert] [--json], study --width=N --depth=N --height=N --fold=N --format=text|json|svg, or svg --width=N --depth=N --height=N.');
  process.exitCode = 2;
}
