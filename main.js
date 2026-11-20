(() => {
  const stage = document.getElementById("stage");
  const spawnArea = document.getElementById("spawn-area");
  const modeSelect = document.getElementById("mode");
  const speedInput = document.getElementById("speed");
  const speedOut = document.getElementById("speed-out");
  const countEl = document.getElementById("count");

  const EMOJIS = ["❤️", "👍", "🔥", "⭐"];
  const ICONS = [
    { id: "icon-heart", color: "#ff4d6d" },
    { id: "icon-thumb", color: "#4dabff" },
    { id: "icon-fire", color: "#ff9f1c" },
    { id: "icon-star", color: "#ffd93d" },
  ];

  const LIFESPAN = 3; // seconds
  const SVG_NS = "http://www.w3.org/2000/svg";
  const XLINK_NS = "http://www.w3.org/1999/xlink";

  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  let active = 0;
  const timelines = new Set(); // live GSAP timelines, for mid-flight speed changes

  const updateCount = (delta) => {
    active += delta;
    countEl.textContent = active;
  };

  // Random x origin inside the spawn area (relative to the stage)
  function spawnLeft(itemWidth) {
    const stageRect = stage.getBoundingClientRect();
    const areaRect = spawnArea.getBoundingClientRect();
    const start = areaRect.left - stageRect.left;
    return rand(start, start + areaRect.width - itemWidth);
  }

  // ---------- Phase 1: CSS keyframes ----------
  function spawnCss() {
    const el = document.createElement("div");
    el.className = "reaction reaction-css";
    el.textContent = pick(EMOJIS);
    el.style.left = `${spawnLeft(30)}px`;
    el.style.setProperty("--sway", `${rand(15, 40)}px`);

    // animationend fires once (forwards fill keeps it at 100% until removal)
    el.addEventListener(
      "animationend",
      () => {
        el.remove();
        updateCount(-1);
      },
      { once: true },
    );

    stage.appendChild(el);
    updateCount(1);
  }

  // ---------- Phase 2: GSAP on transform/opacity only ----------
  function spawnGsap() {
    const icon = pick(ICONS);
    const el = document.createElement("div");
    el.className = "reaction reaction-gsap";
    el.style.left = `${spawnLeft(36)}px`;
    el.style.setProperty("--icon-color", icon.color);

    const svg = document.createElementNS(SVG_NS, "svg");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", `#${icon.id}`);
    use.setAttributeNS(XLINK_NS, "xlink:href", `#${icon.id}`); // older Safari
    svg.appendChild(use);
    el.appendChild(svg);

    stage.appendChild(el);
    updateCount(1);

    const travel = stage.clientHeight * 0.9;
    const amp = rand(15, 40);

    // Set start state up front; avoids a flash at the origin on first frame
    gsap.set(el, { x: -amp, y: 0, scale: 0.6, opacity: 1 });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      onComplete: () => {
        timelines.delete(tl);
        tl.kill();
        el.remove();
        updateCount(-1);
      },
    });

    tl.to(el, { y: -travel, duration: LIFESPAN }, 0)
      // 4 half-swings * 0.75s = 3s; sine ease + yoyo gives a smooth left-right sway
      .to(
        el,
        {
          x: amp,
          duration: LIFESPAN / 4,
          repeat: 3,
          yoyo: true,
          ease: "sine.inOut",
        },
        0,
      )
      .to(el, { scale: 1.4, duration: LIFESPAN }, 0)
      .to(
        el,
        { opacity: 0, duration: 0.8, ease: "power1.in" },
        LIFESPAN - 0.8 - 0.2,
      ); // gone before the top

    tl.timeScale(parseFloat(speedInput.value)); // new reactions inherit the current speed
    timelines.add(tl);
  }

  const spawn = () => (modeSelect.value === "css" ? spawnCss() : spawnGsap());

  // ---------- Controls ----------
  document.getElementById("send").addEventListener("click", spawn);

  document.getElementById("burst").addEventListener("click", () => {
    // Stagger over ~1s so they're concurrent but not stacked on a single frame
    for (let i = 0; i < 50; i++) setTimeout(spawn, i * 20);
  });

  speedInput.addEventListener("input", () => {
    const v = parseFloat(speedInput.value);
    speedOut.textContent = `${v.toFixed(1)}x`;
    timelines.forEach((tl) => tl.timeScale(v)); // retimes in-flight animations live
  });

  function syncMode() {
    // timeScale only applies to GSAP timelines; CSS keyframes are fixed
    speedInput.disabled = modeSelect.value === "css";
  }
  modeSelect.addEventListener("change", syncMode);
  syncMode();
})();
