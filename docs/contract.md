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
