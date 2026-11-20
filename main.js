(() => {
  "use strict";

  const stage = document.getElementById("stage");
  const spawnArea = document.getElementById("spawn-area");
  const modeSelect = document.getElementById("mode");
  const speedInput = document.getElementById("speed");
  const speedLabel = document.getElementById("speed-out");
  const countLabel = document.getElementById("count");
  const status = document.getElementById("status");
  const sendButton = document.getElementById("send");
  const burstButton = document.getElementById("burst");
  const gsap = window.gsap;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const LIFESPAN = 3;
  const BURST_SIZE = 50;
  const ICON_SIZE = 32;
  const END_SCALE = 1.4;
  const FADE_DURATION = 0.8;
  const FADE_OUT_GAP = 0.2;

  const icons = [
    { id: "icon-heart", color: "#ff4d6d" },
    { id: "icon-thumb", color: "#4dabff" },
    { id: "icon-fire", color: "#ff9f1c" },
    { id: "icon-star", color: "#ffd93d" },
  ];

  const activeReactions = new Set();
  const activeTimelines = new Set();

  stage.style.setProperty("--icon-size", `${ICON_SIZE}px`);
  stage.style.setProperty("--end-scale", END_SCALE);
  stage.style.setProperty("--lifespan", `${LIFESPAN}s`);

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function updateCount() {
    countLabel.textContent = activeReactions.size;
  }

  function removeReaction(reaction) {
    // CSS can finish or be cancelled. Either way, remove the icon only once.
    if (activeReactions.delete(reaction)) {
      reaction.remove();
      updateCount();
    }
  }

  function createReaction(mode, bounds, swayAmount) {
    const icon = icons[Math.floor(Math.random() * icons.length)];
    const reaction = document.createElement("div");
    const svg = document.createElementNS(SVG_NS, "svg");
    const use = document.createElementNS(SVG_NS, "use");

    // Spread the starting points across the bottom strip and leave room
    // for the icon to grow and sway near the right edge.
    const growthPadding = (ICON_SIZE * (END_SCALE - 1)) / 2;
    const edgePadding = swayAmount + growthPadding;
    const maxLeft = Math.max(0, bounds.right - ICON_SIZE - edgePadding);
    const minLeft = Math.min(maxLeft, Math.max(bounds.left, edgePadding));

    reaction.className = `reaction reaction-${mode}`;
    reaction.style.left = `${randomBetween(minLeft, maxLeft)}px`;
    reaction.style.setProperty("--icon-color", icon.color);
    reaction.setAttribute("aria-hidden", "true");

    use.setAttribute("href", `#${icon.id}`);
    svg.appendChild(use);
    reaction.appendChild(svg);

    return reaction;
  }

  function prepareCssFlight(reaction, travel, sway) {
    // Give the CSS keyframes this icon's path before adding it to the stage.
    reaction.style.setProperty("--travel", `${travel}px`);
    reaction.style.setProperty("--sway", `${sway}px`);

    const cleanup = () => removeReaction(reaction);
    reaction.addEventListener("animationend", cleanup, { once: true });
    reaction.addEventListener("animationcancel", cleanup, { once: true });
  }

  function startGsapFlight(reaction, travel, sway) {
    // Set the starting position before the browser paints the icon.
    gsap.set(reaction, { x: -sway, y: 0, scale: 1, opacity: 1 });

    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: "none" },
      onComplete() {
        activeTimelines.delete(timeline);
        removeReaction(reaction);
        syncSpeedControl();
      },
    });

    // Rise, sway, and grow together. Start fading near the end of the flight.
    timeline
      .to(reaction, { y: -travel, duration: LIFESPAN }, 0)
      .to(
        reaction,
        {
          x: sway,
          duration: LIFESPAN / 4,
          repeat: 3,
          yoyo: true,
          ease: "sine.inOut",
        },
        0,
      )
      .to(reaction, { scale: END_SCALE, duration: LIFESPAN }, 0)
      .to(
        reaction,
        { opacity: 0, duration: FADE_DURATION },
        LIFESPAN - FADE_DURATION - FADE_OUT_GAP,
      );

    // New reactions use whatever speed is selected when they launch.
    activeTimelines.add(timeline);
    timeline.timeScale(speedInput.valueAsNumber).play();
  }

  function spawnReaction() {
    const mode = modeSelect.value;
    const spawnLeft = spawnArea.offsetLeft;
    const bounds = {
      left: spawnLeft,
      right: spawnLeft + spawnArea.offsetWidth,
    };

    // Vary the rise distance and the direction of the first sway.
    const travel = stage.clientHeight * randomBetween(0.82, 0.92);
    const swayAmount = randomBetween(15, 36);
    const sway = Math.random() < 0.5 ? -swayAmount : swayAmount;
    const reaction = createReaction(mode, bounds, swayAmount);

    if (mode === "css") {
      prepareCssFlight(reaction, travel, sway);
    }

    activeReactions.add(reaction);
    stage.appendChild(reaction);

    if (mode === "gsap") {
      startGsapFlight(reaction, travel, sway);
    }

    updateCount();
  }

  function spawnBurst() {
    // Send one immediately, then use uneven gaps to mimic rapid button presses.
    spawnReaction();

    let delay = 0;
    for (let index = 1; index < BURST_SIZE; index += 1) {
      delay += randomBetween(8, 30);
      window.setTimeout(spawnReaction, delay);
    }
  }

  function syncSpeedControl() {
    // Keep the slider available while any GSAP reactions are still in flight.
    speedInput.disabled =
      modeSelect.value === "css" && activeTimelines.size === 0;
  }

  sendButton.addEventListener("click", spawnReaction);
  burstButton.addEventListener("click", spawnBurst);
  modeSelect.addEventListener("change", syncSpeedControl);

  speedInput.addEventListener("input", () => {
    const speed = speedInput.valueAsNumber;
    speedLabel.textContent = `${speed.toFixed(1)}×`;

    // Change the speed of each current flight from wherever it is now.
    for (const timeline of activeTimelines) {
      timeline.timeScale(speed);
    }
  });

  // CSS mode still works if the GSAP script fails to load.
  if (!gsap) {
    modeSelect.value = "css";
    modeSelect.querySelector('[value="gsap"]').disabled = true;
    status.textContent = "GSAP could not load. CSS mode is available.";
    status.hidden = false;
  }

  syncSpeedControl();
})();
