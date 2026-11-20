# Livestream Reaction Engine — Submission

## 1. Setup & Running Instructions

No build step. Either:

- Open `index.html` directly in Chrome, or
- Serve the folder: `npx serve .` (or `python -m http.server`) and open the printed URL.

GSAP loads from cdnjs, so an internet connection is needed on first load.

Use the **Mode** dropdown to switch between Phase 1 (CSS keyframes) and Phase 2 (GSAP).
Use **Burst ×50** for the high-concurrency test. The **Speed** slider works in GSAP mode only.

DevTools setup used: Rendering tab → Paint Flashing + Frame Rendering Stats;
Performance panel → CPU 6x slowdown.

## 2. Phase 1: CSS Keyframes Analysis

- **Paint Flashing Screenshot:** ![paint flashing p1](screenshots/p1-paint-flashing.png)
- **Performance Profile Screenshot:** ![profile p1](screenshots/p1-performance.png)
- **Observations:**
  - **Green regions:** [Fill in from your own capture.] Expected: a green rectangle
    around every emoji on every frame, plus the regions they vacate, because
    `bottom`, `margin-left` and `font-size` change geometry and the pixels must be
    re-rasterised. With 50+ icons the green covers most of the right side of the stage.
  - **Main thread:** [Fill in from your own capture.] Expected: every frame shows
    Recalculate Style → Layout → Paint → Composite in the flame chart. Layout cost
    scales with the number of animated nodes, and at 6x throttling long tasks appear
    and the FPS meter drops below 60.

## 3. Phase 2: GSAP & Composited Rendering Analysis

- **Performance Profile Screenshot:** ![profile p2](screenshots/p2-performance.png)
- **Observations:**
  - **Flame chart / frame rate vs Phase 1:** [Fill in.] Expected: Layout and Paint
    disappear from the per-frame work; what remains is GSAP's JS tick (writing
    transform/opacity) and Composite. FPS stays much closer to 60 under throttling.
  - **Paint invalidation:** [Fill in.] Expected: little to no green after the initial
    layer creation. `x`, `y`, `scale` and `opacity` are applied on the compositor,
    so each icon moves as a GPU-textured layer without re-rasterising.

## 4. Architectural Reflection

- **Runtime Control & Developer Experience:**
  CSS keyframes are declarative but static. Once the animation starts, changing
  speed or path means rewriting the rule, swapping the class, or going through the
  Web Animations API. Randomised paths need custom properties and still can't change
  mid-flight. A GSAP timeline is an object: `timeScale()` retimes it live, and
  `pause()`, `reverse()`, `seek()` and `progress()` are available. Per-instance
  randomisation (sway amplitude, travel distance) is just a variable, and a single
  slider can retime 50+ in-flight animations with no layout work. The cost is a
  JS dependency and main-thread ticking (the animated properties are still
  compositor-friendly).

- **Pipeline Considerations:**
  Inline SVG (vector) assets expose fill, stroke and gradients to CSS variables or
  JS, so tinting or re-theming at runtime is one property change, with no
  re-export. A single vector asset is resolution independent and light on bytes.
  Pre-rendered raster sequences would need a variant per theme, per color and per
  device pixel ratio. That multiplies asset count and download size, and cannot
  adapt to arbitrary user-chosen colors. Raster sprite sheets also cost memory
  (every frame is decoded to a texture) and blur when scaled past their native size.
  Rasters only win for very complex artwork that is too expensive to draw as vectors.
