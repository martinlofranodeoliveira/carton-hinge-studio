# Visual Design & Architecture Record: Carton Hinge Studio

## Thesis & Creative Direction

**THESIS**: Study a six-face rectangular carton net through an operable daylight technical maquette. Seed `325ed87b`.

**OWN-WORLD**: Original bounded crease tree kinematics authorize both WebGL geometry and the precise SVG net without relying on generic decorative bounding boxes or bitmap mockups.

**STORY**: The user selects box dimensions ($W \times D \times H$), drags the fold progress slider from $0^\circ$ (flat sheet) to $90^\circ$ (closed volume), observes the simultaneous 3D folding and 2D net layout, and inspects the exact millimeter closure gaps of all 7 seams.

**FIRSTVIEWPORT**: Compact parameter toolbar on the left, dominant 3D WebGL technical maquette in the center, and linked 2D SVG plan plus numerical seam inspector on the right.

**FORM**: Typographic foundation built on Public Sans, deep slate ink `#202b36`, warm daylight ground `#f3f6f7`, structural active accent `#235bd4`. Restrained edges, precise contrast, zero decorative fluff.

---

## Color Foundation & Visual Hierarchy

| Role | Color | Hex | Purpose |
| --- | --- | --- | --- |
| Ink (Primary) | Deep Slate | `#1e293b` | Headings, primary text, dark wireframes |
| Ground (Canvas) | Technical Daylight | `#f1f5f9` | Application background and workbench frame |
| Surface (Cards) | Clean White | `#ffffff` | Toolbars, inspectors, panels |
| Accent (Active) | Drafting Blue | `#235bd4` | Hinge fold lines, active buttons, selection |
| Base Face | Cool Slate | `#cbd5e1` | Base face identification |
| North Face | Soft Sky | `#93c5fd` | North face identification |
| South Face | Warm Amber | `#fde047` | South face identification |
| East Face | Mint Emerald | `#86efac` | East face identification |
| West Face | Soft Coral | `#fca5a5` | West face identification |
| Lid Face | Gentle Purple | `#d8b4fe` | Lid face identification |
| Success / Sealed | Forest Green | `#16a34a` | 0.000 mm seam closure indicator |
| Open / Warning | Rich Amber | `#d97706` | Partial fold opening status |

---

## Responsive Layout & Accessibility

1. **Three-Column Drafting Workbench**:
   - Column 1 (380px): Dimension sliders, preset dimensions, fold percentage, and 2D SVG Net viewer.
   - Column 2 (Flexible): 3D Articulated Three.js Canvas with explicit opt-in orbital inspection.
   - Column 3 (340px): Selected face normal/corner inspector and 7-seam closure gap table.
2. **Keyboard Accessibility**:
   - Native sliders/buttons and SVG Enter/Space handlers are provided. Actual browser tab order, touch gestures and screen-reader behavior remain unverified.
   - Text contrast and focus styling are source design goals; rendered contrast, keyboard flow and accessibility conformance remain unverified.
3. **Performance & Demand Rendering**:
   - R3F Canvas configured with `frameloop="demand"` requests frames on demand; actual GPU behavior has not been measured.
   - Resource disposal calls run on unmount/replacement; actual driver reclamation requires separate browser evidence.

---

## Finish Review & Verdict

**FINISH**: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.

- **Kinematic Integrity**: All 7 seams close to within $10^{-9} \times \max(W, D, H)$ at $t = 1000$.
- **Offline Determinism**: The entire test suite and build pipeline pass inside `node:22-bookworm-slim` with network disabled (`--network none`).
- **Verdict**: Source geometry, DOM and native build evidence are recorded separately. Actual browser/WebGL interaction, responsive screenshots, accessibility conformance and visual finish remain pending; no visual approval is claimed. Original source MIT © 2026 Lofrano Tecnologia.
