# Carton Hinge Studio

Development version **0.1.0**: a browser-local React/Three.js workbench for one six-face rectangular carton net. The same typed hinge model drives an articulated maquette, linked SVG selection and endpoint-gap measurements. Portuguese is the default; all controls, examples, help and diagnostics also have English text. [Português](README.pt-BR.md) · [Contract](docs/contract.md) · [Design](docs/design.md) · [Lofrano Tecnologia](https://lofranotecnologia.com.br).

This is a zero-thickness conceptual geometry study. It does not model tabs, material thickness, bend allowance, collision-free folding, structural properties, cutter calibration or manufacturing readiness. SVG exports are conceptual net drawings rather than certified cutting patterns. No customers, adoption, certifications or measured GPU performance are asserted.

## Operate the workbench

Enter integer width/depth/height from **1 through 4095 mm**. Valid edits apply immediately; invalid drafts show a diagnostic while the last valid geometry remains. The synchronized fold control has **0..1000 integer ticks**, corresponding to 0..90 degrees per hinge. Select a face through the net's buttons/SVG keyboard targets or the maquette, then inspect its local polygon, world corners and crease tree. The edge table distinguishes **five persistent hinge pairs** from **seven closure pairs**, not twelve independent open seams.

3D camera interaction is opt-in. Escape, window blur, switching to 2D, context loss or unmount releases the camera's event/touch-action lease. Isometric, top and front views use the current viewport aspect. Without usable WebGL, the same study remains operable through linked DOM/SVG views. The camera controls are disabled in that fallback. There is no automatic orbiting.

JSON import checks `File.size` before reading, then validates actual bytes with a strict UTF-8 decoder. It accepts at most **8192 bytes** and **32 scalar fields**, rejects unknown properties/prototype keys and requires the closed schema below. Invalid input preserves the current study. A pending import cannot replace a newer import, dimension/fold edit, face selection or reset. Diagnostics are translated in the currently selected locale. Exported JSON is deterministic for the same study/selection.

```json
{"schema":"carton-hinge-studio/study@1","units":"mm","dimensions":{"width":120,"depth":80,"height":40},"foldTicks":500,"selectedFace":"lid"}
```

`selectedFace` may also be null or omitted (default `lid`). The maintained JSON parser uses last-member-wins for duplicate keys; this is not a duplicate-rejecting interchange format. File reading and browser download failures have separate localized diagnostics. A rejected or numerically indeterminate study cannot produce a successful geometry export.

## Build and check

The qualified technical tuple is Node **22.23.4**, npm **10.9.9**, React **19.3.1**, Fiber **9.8.2**, Three **0.184.0** and Vite **8.3.6**, with the genuine committed npm lock. Earlier Node releases or other tuples are not established by this qualification.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run demo -- --assert
npm run demo -- --json
npm run build
npm run dev
```

Development URL: `http://127.0.0.1:5173/carton-hinge-studio/`; preview uses port 4173 after `npm run preview`. Production output is `dist/`, with same-origin bundled code, fonts and dependency notices. No runtime service, credentials, external assets or telemetry are needed. The build uses Vite's qualified on-the-fly config loader so an existing dependency closure may stay read-only; that loader remains an experimental Vite feature in the pinned tuple.

## Source API and CLI

The UI-independent API is `deriveCartonStudy(dimensions, foldTicks)` in `src/core/carton.ts`. Invalid scalar parameters throw before a study is returned. `parseCartonStudyJson(string | Uint8Array)` in `studyIo.ts` returns a typed `ValidStudy`, `InvalidDocument`, `UnsupportedDocument` or `NumericallyIndeterminate` result. `serializeCartonStudyJson` and `generateSvgNet` refuse non-valid or non-finite geometry. The source helpers are not an independently qualified installed npm SDK/CLI distribution.

```ts
import { deriveCartonStudy } from './src/core/carton';
import { serializeCartonStudyJson } from './src/core/studyIo';
const study = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 1000);
console.log(study.physicalEdges['north-lid'].maxGap);
console.log(serializeCartonStudyJson(study, 'lid'));
```

The demo command builds an owned local Node entry. Use that prepared entry directly when stdout must contain only JSON or SVG; npm itself prints a script preamble.

```sh
node build/checks/demo/demo.mjs study --width=120 --depth=80 --height=40 --fold=500 --format=json
node build/checks/demo/demo.mjs svg --width=120 --depth=80 --height=40 > net.svg
```

Modes are `demo [--assert] [--json]`, `study` with the five shown options, or `svg` with dimension options. Numeric options use canonical decimal integers; unknown, duplicate, malformed and out-of-range options exit 2 before result output. No arbitrary commands, URLs or input paths are accepted by this CLI.

## Evidence and limits

Native checks exercise the preserved original tests plus literal geometry expectations, a separately authored **post-source** global-hinge matrix reference, actual Three BufferGeometry/world matrices, output winding, disposal events, camera frusta, DPR/pixel limits, JSON/XML parsing and real DOM state transitions. They do not establish that fixture preparation predated implementation.

Rendering is requested on demand, DPR is capped at 2 and logical backing pixels at 4,194,304. These counters and CPU-side resource-release calls do not guarantee browser/GPU memory, real-time performance or driver cleanup. JSDOM, a Three camera projection and a static design detector are technical evidence only. **Actual browser screenshots, WebGL rendering/interaction, responsive rendering, screen-reader behavior, accessibility conformance and visual finish remain unverified.** Original source is [MIT](LICENSE), © 2026 Lofrano Tecnologia; retained dependency/font licenses remain separate.
