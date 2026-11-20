# Livestream Reaction Engine — Submission

## 1. Setup & Running Instructions

Open `index.html` in Google Chrome, or run `python3 -m http.server 8000`
from the project folder and open <http://localhost:8000>.

GSAP loads from cdnjs. If the CDN is unavailable, the app opens in CSS mode
and displays a message.

- **Send Reaction** spawns one icon.
- - **Burst ×50** sends 50 reactions in quick succession with uneven gaps
    between launches. At 1.0×, their flights overlap for the profiling test.
    Click **Send Reaction** during a burst to test more than 50 concurrent
    reactions.
    a burst to test more than 50 concurrent reactions.
- **Mode** controls how new reactions animate. Reactions already in flight
  finish in the mode they started in.
- **Speed** changes the playback rate of active and future GSAP reactions.
  A flight lasts three seconds at 1.0×.

### Profiling setup

In Chrome DevTools, open **Rendering** and enable **Paint flashing** and
**Frame rendering stats**. In the **Performance** panel, set CPU throttling
to **6× slowdown**.

For each phase, wait until **Active** reads `0`, start recording, click
**Burst ×50** once, and record until the count returns to `0`. Use the same
viewport size for both captures and keep GSAP at 1.0× for the comparison.
In a separate GSAP run, drag the slider to 0.1× during the ascent and confirm
that the reactions slow down from their current positions.

## 2. Phase 1 — CSS Keyframes Analysis

- **Paint flashing screenshot**
  <!-- Add the Phase 1 paint flashing screenshot here. -->
- **Performance profile screenshot**
  <!-- Add the Phase 1 Performance panel screenshot here. -->

**Observations**

- Paint flashing regions and when they appeared: [Fill in after recording.]
- Main-thread activity during the burst: [Fill in after recording. Look for
  Recalculate Style, Layout, and Paint during the ascent.]
- Frame rendering stats: [Record what you observed.]

Phase 1 animates `bottom`, `margin-left`, and `font-size`. These properties
affect layout, so the browser can spend time updating geometry and painting
as reactions move. The capture shows how much of that work happened in
this test.

## 3. Phase 2 — GSAP & Composited Rendering Analysis

- **Performance profile screenshot**
  <!-- Add the Phase 2 Performance panel screenshot here. -->

**Observations**

- Flame chart changes compared with Phase 1: [Fill in after recording.]
- Frame rendering stats: [Record what you observed under the same load.]
- Paint flashing during spawn and ascent: [Fill in after recording.]
- Mid-air speed test at 0.1×: [Record what happened.]

Phase 2 uses GSAP to animate `x`, `y`, `scale`, and `opacity`. GSAP still
runs JavaScript to update these values. Chrome can often composite those
changes without recalculating each icon's layout or repainting it every
frame. Creating the icons can still incur style, layout, and paint work.

## 4. Architectural Reflection

### Runtime control and developer experience

CSS keyframes describe the flight in one rule. The app passes each
reaction's sway and travel distance through custom properties at spawn.
The CSS animation plays at its declared duration. Live playback control
could be added through the Web Animations API.

GSAP gives each reaction a timeline. The slider calls `timeScale()` on
every active timeline, so each flight continues from its current position
at the new speed. Path changes are also easier to express in JavaScript.
For example, a flight could start a new horizontal tween from its current
position while its upward tween continues. The trade-offs are an external
dependency and JavaScript work on every animation tick.

### Vector assets and runtime theming

Both phases reference shared SVG symbols. Each reaction sets its color
through `--icon-color`, and the shape inherits it through `currentColor`.
A theme can change that color at runtime while reusing the same paths.
SVG shapes can also render at different icon sizes and screen densities.

Pre-rendered raster sequences can make sense for detailed artwork with
complex effects. For this app, they would add decoded image memory and
could require extra files for different resolutions or color treatments.
