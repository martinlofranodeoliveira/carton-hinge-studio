# Architecture & Kinematic Design: Carton Hinge Studio

## 1. Overview

`carton-hinge-studio` is a browser-local React and Three.js application powered by a UI-independent analytical kinematics core (`deriveCartonStudy`). The application decouples 3D WebGL rendering, 2D vector SVG generation, and numerical seam verification into clean modular layers.

```
                         +-----------------------------+
                         |      User / CLI Input       |
                         |  (width, depth, height, t)  |
                         +-----------------------------+
                                        |
                                        v
                         +-----------------------------+
                         |      Validation Gate        |
                         |  (1..4095 mm, 0..1000 tick) |
                         +-----------------------------+
                                        |
                                        v
                         +-----------------------------+
                         |     deriveCartonStudy       |
                         |   (Pure Kinematic Core)     |
                         +-----------------------------+
                                   /    |    \
                                  /     |     \
                                 v      v      v
              +--------------------+    |   +--------------------+
              |   WebGL 3D Mesh    |    |   |    2D SVG Net      |
              |  Three.js / Canvas |    |   |  Vector Plan View  |
              +--------------------+    |   +--------------------+
                                        v
                             +--------------------+
                             |  Seam Measurements |
                             |  Gap Verification  |
                             +--------------------+
```

## 2. Kinematics of Articulated Carton Net

- Each of the four side faces (North, South, East, West) rotates about its shared edge with the Base by angle:
  $$\theta = \left(\frac{t}{1000}\right) \times \frac{\pi}{2}$$
- The Lid face is attached to the North face. In world coordinates, the North-Lid hinge moves along:
  $$y_{\text{hinge}}(t) = \frac{D}{2} + H \cos\theta, \qquad z_{\text{hinge}}(t) = H \sin\theta$$
  The Lid rotates relative to the North face by an additional $\theta$, causing its tangent vector to sweep through angle $2\theta$:
  $$\mathbf{u}_{\text{lid}}(t) = (0, \cos(2\theta), \sin(2\theta))$$
- At $t = 1000$ ($\theta = \pi/2$):
  $$\cos\theta = 0, \quad \sin\theta = 1, \quad \cos(2\theta) = -1, \quad \sin(2\theta) = 0$$
  Yielding:
  $$y(d) = \frac{D}{2} - d, \qquad z(d) = H$$
  At $d = D$, the Lid's front edge lands precisely at $y = -D/2, z = H$, perfectly meeting the top edge of the South face.

## 3. Rendering Architecture

- **Three.js WebGL Maquette**:
  - Demand rendering uses `frameloop="demand"`; no zero-overhead or GPU benchmark guarantee is made.
  - Double-sided materials prevent inside-face disappearing during partial fold inspections.
  - Distinct pastel color palette enables immediate visual identification of all six carton faces.
- **Linked 2D SVG Net**:
  - Dynamically computes bounding coordinates.
  - Emits a fixed, XML-parsed SVG subset with solid cut borders and dashed fold creases.

## Source hardening boundaries

Face-local corner identities are unchanged. Mesh triangles reverse that local corner order so their computed normals agree with the explicit outward normal (negative local Z). The camera fits a bounding sphere against both perspective axes using the actual viewport aspect. Backing-buffer admission accounts for minimum one-pixel dimensions and extreme aspect ratios without multiplying two potentially overflowing CSS dimensions.

Camera input is leased only after opt-in and released on Escape/blur/fallback/unmount. WebGL context listeners are detached on replacement/unmount. Owned Three geometries, line geometries and materials have explicit, idempotent CPU-side disposal paths. Real WebGL/GPU resource reclamation is not inferred from those tests.

Imports use a byte ceiling and monotonic request epoch. Typed diagnostics are translated at render time, so a later locale switch cannot leave an obsolete translated message. Source-only tests use real React DOM/JSDOM with globals initialized before ReactDOM; they are not a browser renderer.
