"use strict";

(function () {
  const init = () => {
    const svgRoot = document.querySelector("#dragonOverlay svg");
    if (!svgRoot) return;

    let screen = svgRoot.querySelector("#screen");
    if (!screen) {
      screen = document.createElementNS("http://www.w3.org/2000/svg", "g");
      screen.setAttribute("id", "screen");
      svgRoot.appendChild(screen);
    }

    const xmlns = "http://www.w3.org/2000/svg";
    const VW = 300, VH = 300, VXmin = -150, VYmin = -150;

    // Map pixel coordinates to SVG viewBox coordinates
    const toSvg = (px, py) => {
      const vw = (window.visualViewport && window.visualViewport.width) || window.innerWidth;
      const vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
      return {
        x: (px / vw) * VW + VXmin,
        y: (py / vh) * VH + VYmin
      };
    };

    let vw = (window.visualViewport && window.visualViewport.width) || window.innerWidth;
    let vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;

    const onResize = () => {
      vw = (window.visualViewport && window.visualViewport.width) || window.innerWidth;
      vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize, { passive: true });

    // Dragon segments
    const N = 30;
    const elems = [];
    const mid = toSvg(vw / 2, vh / 2);
    for (let i = 0; i < N; i++) elems[i] = { use: null, x: mid.x, y: mid.y };

    // Target pointer
    const ptr = { x: mid.x, y: mid.y };

    // Auto-roam via Lissajous path (essential for mobile where no mousemove fires)
    let frm = Math.random() * Math.PI * 2;
    const roamW = Math.min(VW, VH) * 0.38;
    const roamH = Math.min(VW, VH) * 0.30;

    let userActive = false;
    let userTimer = null;

    const setUserActive = (px, py) => {
      const c = toSvg(px, py);
      ptr.x = c.x;
      ptr.y = c.y;
      userActive = true;
      clearTimeout(userTimer);
      userTimer = setTimeout(() => { userActive = false; }, 2500);
    };

    // Mouse (desktop)
    window.addEventListener("pointermove", e => {
      if (e.pointerType === "mouse") setUserActive(e.clientX, e.clientY);
    }, { passive: true });

    // Touch (Chrome Android + Safari iOS)
    window.addEventListener("touchstart", e => {
      if (e.touches.length > 0) setUserActive(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener("touchmove", e => {
      if (e.touches.length > 0) setUserActive(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener("touchend", () => {
      userTimer = setTimeout(() => { userActive = false; }, 1500);
    }, { passive: true });

    // Build SVG <use> elements — use only href (NOT xlink:href, deprecated in Chrome)
    const prepend = (id, i) => {
      const el = document.createElementNS(xmlns, "use");
      elems[i].use = el;
      el.setAttribute("href", "#" + id); // modern — works in Chrome Android
      screen.prepend(el);
    };

    for (let i = 1; i < N; i++) {
      if (i === 1) prepend("Cabeza", i);
      else if (i === 6 || i === 13) prepend("Aletas", i);
      else prepend("Espina", i);
    }

    // Animation loop
    const run = () => {
      requestAnimationFrame(run);

      frm += 0.007;

      // Autonomous Lissajous target — dragon always moving even without touch
      const autoX = Math.cos(2.1 * frm) * roamW;
      const autoY = Math.sin(3.3 * frm) * roamH;

      const targetX = userActive ? ptr.x : autoX;
      const targetY = userActive ? ptr.y : autoY;

      const e0 = elems[0];
      e0.x += (targetX - e0.x) / 7;
      e0.y += (targetY - e0.y) / 7;

      for (let i = 1; i < N; i++) {
        const e = elems[i];
        const ep = elems[i - 1];
        const a = Math.atan2(e.y - ep.y, e.x - ep.x);
        e.x += (ep.x - e.x + Math.cos(a) * (100 - i) / 22) / 3;
        e.y += (ep.y - e.y + Math.sin(a) * (100 - i) / 22) / 3;
        const s = (162 + 4 * (1 - i)) / 300;
        if (e.use) {
          e.use.setAttributeNS(null, "transform",
            `translate(${(ep.x + e.x) / 2},${(ep.y + e.y) / 2}) rotate(${(180 / Math.PI) * a}) scale(${s},${s})`
          );
        }
      }
    };

    run();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
