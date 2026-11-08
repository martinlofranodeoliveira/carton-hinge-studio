# Carton Hinge Studio

Development version **0.1.0** — an original Lofrano Tecnologia parametric folding carton studio, MIT licensed. Inspect sheet-material folding kinematics, evaluate crease patterns, observe real-time continuous hinge rotations, inspect 3D seam convergence, and export 2D packaging die-lines as standard SVG. The application uses real Three.js spatial rendering with a high-contrast 2D planar net fallback. Portuguese is the default interface; the English switch toggles UI text.

[Português](README.pt-BR.md) · [Contract](docs/contract.md) · [Design](docs/design.md) · [Lofrano Tecnologia](https://lofranotecnologia.com.br)

## Features

- **Exact Kinematic Model**: Closed-form analytical rotation of 5 revolute hinge joints mapping a flat planar net ($t = 0$) into a closed 3D prism ($t = 1000$).
- **Parametric Net Dimensioning**: Arbitrary rectangular dimensions (width $W$, depth $D$, height $H$) within validated packaging bounds $[10, 1000]\,\text{mm}$.
- **Seam Convergence Verification**: Real-time Euclidean gap tracking across 7 seams (4 vertical side seams, 3 top lid seams) verifying zero-gap closure at $t = 1000$ to within $10^{-9} \times \max(W, D, H)$.
- **Standard 2D Die-Line Export**: Clean SVG net generation using packaging CAD conventions (solid black cut contours, dashed cyan crease lines, centered origin).
- **Interactive 3D / 2D Studio**: WebGL 3D folding animation with face highlighting, seam gap inspector, and GPU-free 2D net viewer.

## Mathematical Kinematics

The carton net consists of 6 planar faces rooted at the stationary **Bottom** face on the $XY$ plane ($z = 0$, $x \in [-W/2, W/2]$, $y \in [-D/2, D/2]$).

At normalized folding parameter $t \in [0, 1000]$, the fold angle is $\theta(t) = \frac{t}{1000} \cdot \frac{\pi}{2}$:
1. **Bottom Face**: Fixed at $z = 0$.
2. **North Face**: Attached to bottom hinge at $y = +D/2$. Rotates up about the $X$-axis by $+\theta$.
3. **South Face**: Attached to bottom hinge at $y = -D/2$. Rotates up about the $X$-axis by $-\theta$.
4. **East Face**: Attached to bottom hinge at $x = +W/2$. Rotates up about the $Y$-axis by $-\theta$.
5. **West Face**: Attached to bottom hinge at $x = -W/2$. Rotates up about the $Y$-axis by $+\theta$.
6. **Lid Face**: Attached to the distal top hinge of the North face. Undergoes compound rotation: sweeps through an angle $2\theta$ relative to the flat horizontal reference, so at $t = 1000$ ($\theta = \pi/2$) it is rotated by $\pi$, perfectly closing the box parallel to the bottom face at height $z = H$.

## Install and use

Node 22 or later is required; the dependency tuple targets Node 22.23.4 / npm 10.9.9. Direct dependencies are exact versions.

```sh
npm ci --ignore-scripts
npm run dev
```

Open `http://127.0.0.1:5173/carton-hinge-studio/`.

### Validation and Build

```sh
npm test
npm run demo -- --assert
npm run demo -- --json
npm run build
npm run preview
```

Preview runs at `http://127.0.0.1:4173/carton-hinge-studio/`. The production build output is static, self-contained, and configured for `/carton-hinge-studio/`.

## Quality & Determinism

- All core kinematics functions are pure and run deterministically with zero network calls.
- Headless demo script (`src/demo.ts`) validates 4 standard box configurations and verifies seam closure tolerances offline.
- Die-line SVG generation uses strict XML entity escaping and standard packaging stroke-dash patterns.
