# Operational Contract: Carton Hinge Studio

## 1. Geometric Domain

- **Dimensions**:
  - `width`: integer $W \in [1, 4095]$ mm
  - `depth`: integer $D \in [1, 4095]$ mm
  - `height`: integer $H \in [1, 4095]$ mm
- **Fold Progress**:
  - `foldTicks`: integer $t \in [0, 1000]$
  - `foldFraction`: $\alpha = t / 1000.0 \in [0.0, 1.0]$
  - Fold angle per hinge: $\theta = \alpha \times \frac{\pi}{2}$ radians ($[0^\circ, 90^\circ]$)

## 2. Fixed Carton Topology

The model consists of exactly 6 faces and 5 hinges:
- **Base Face**: Centered at $Z = 0$, width $W$, depth $D$.
- **North Face**: Attached to Base along edge $Y = +D/2$, width $W$, height $H$.
- **South Face**: Attached to Base along edge $Y = -D/2$, width $W$, height $H$.
- **East Face**: Attached to Base along edge $X = +W/2$, width $H$, height $D$.
- **West Face**: Attached to Base along edge $X = -W/2$, width $H$, height $D$.
- **Lid Face**: Attached to the outer edge of North face, width $W$, depth $D$.

## 3. Physical Edge Pairs & Seam Closures

- **Persistent Hinge Pairs** (5 hinges, always 0 gap along axis):
  1. `base-north`
  2. `base-south`
  3. `base-east`
  4. `base-west`
  5. `north-lid`
- **Closure Seam Pairs** (7 seams):
  1. `north-east`: vertical seam at $(+W/2, +D/2)$
  2. `north-west`: vertical seam at $(-W/2, +D/2)$
  3. `south-east`: vertical seam at $(+W/2, -D/2)$
  4. `south-west`: vertical seam at $(-W/2, -D/2)$
  5. `lid-east`: top horizontal seam along $X = +W/2$
  6. `lid-west`: top horizontal seam along $X = -W/2$
  7. `lid-south`: front horizontal seam along $Y = -D/2, Z = H$

## 4. Seam Measurement & Numerical Tolerance

- End-state closure tolerance:
  $$\tau = 10^{-9} \times \max(W, D, H) \text{ mm}$$
- At $t = 1000$ ($\theta = \pi/2$):
  $$\forall s \in \text{Seams}: \quad \text{maxGap}(s) \le \tau$$
  and the study status reports `isFullyClosed = true`.
- Partial fold states ($t < 1000$) report exact Euclidean endpoint distances and gaps without false closure claims.

## 5. Portable study and failure contract

`parseCartonStudyJson` accepts string or Uint8Array and reports a typed result; the UI reads bounded files as bytes. Schema is `carton-hinge-studio/study@1`, units `mm`, root fields `schema`, `units`, `dimensions`, `foldTicks`, optional `selectedFace` (six identities or null). Maximum 8192 UTF-8 bytes, 32 scalar fields and four nested object levels; unknown fields/prototype keys are rejected. JSON duplicates use the maintained parser's last-member-wins policy. Malformed UTF-8 is InvalidDocument rather than an escaping decoder exception.

Unsupported schema/units are UnsupportedDocument; invalid shape/bounds/syntax are InvalidDocument. An indeterminate geometry cannot export. Invalid API scalar arguments to deriveCartonStudy throw before producing a study. Last valid browser state remains available after a rejected import or field draft. Stale import completion is discarded after a newer request, edit, selection, reset or unmount.

## 6. Coordinate and rendering convention

Coordinates are millimetres; +X east, +Y north, +Z up. The base is centred at z=0. Local corner identities follow the fixed net table; the outward sheet normal is -local-Z. Indexed Three triangles therefore use 0,2,1 and 0,3,2, preserving vertex identities. Four side hinges use X+/X−/Y−/Y+ quarter turns; north-lid adds X+ relative to north. Axis endpoint correspondence is an edge identity and does not redefine the signed global axis convention.

At the closed state the six outward planes are z=0 (normal -Z), y=+D/2 (+Y), y=-D/2 (-Y), x=+W/2 (+X), x=-W/2 (-X), z=H (+Z). Partial folding reports distances rather than infeasibility; faces may intersect.

DPR ≤2 and logical backing-buffer pixels ≤4194304. Demand rendering, viewport fitting and disposal calls are implementation mechanisms, not universal resource/deadline guarantees. Real browser, GPU, responsive and accessibility qualification remains separate from CPU geometry/JSDOM evidence. No physical material, manufacturing or safety certification is provided.
