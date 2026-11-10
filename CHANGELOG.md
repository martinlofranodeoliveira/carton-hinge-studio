# Changelog

## 0.1.0 — Unreleased

Development version; no release or deployment is asserted.

- Analytical continuous folding kinematics core for parametric rectangular cartons with 6 planar faces (Bottom, North, South, East, West, Lid) and 5 continuous revolute hinge joints.
- Exact closed-form forward kinematics: $t \in [0, 1000]$ where $t=0$ is flat 2D net and $t=1000$ is fully closed 3D carton box.
- Analytic seam convergence inspector evaluating Euclidean gap distance between matching face edges across 4 vertical side seams and 3 top lid seams.
- Deterministic 2D net planar unwrap with standard packaging CAD die-line SVG generator distinguishing cut contours and crease fold lines.
- React 3D viewer powered by Three.js with opt-in camera controls, face highlighting, and interactive fold angle slider.
- High-contrast 2D planar net SVG viewer fallback for systems without WebGL support.
- Bilingual interface (PT-BR default and English toggle) with full accessibility support.
- Comprehensive test suite covering geometric bounds, hinge rotations, coordinate transforms, and seam convergence tolerances ($\le 10^{-9} \times \max(W, D, H)$).

### Development source hardening

- Added strict bounded UTF-8 portable studies, localized failure recovery and stale-import protection.
- Matched actual mesh winding to outward normals, bounded extreme viewport policies and fitted portrait cameras.
- Added camera/context cleanup, idempotent disposal, preserved original tests and explicit technical-versus-browser evidence limits.
