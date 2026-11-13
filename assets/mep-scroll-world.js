/**
 * 皓盛有限公司 (5390857.com) - 原生建築機電滾動穿越引擎 (Scroll-Driven MEP World) v25.0
 * 採用 requestAnimationFrame 節流映射捲軸進度、支援點擊樓層切換、鍵盤操作與清洗前後對比拉桿。
 */
(function () {
  "use strict";

  function initMepScrollWorld() {
    const section = document.getElementById("mep-scroll-world");
    if (!section) return;

    const steps = Array.from(section.querySelectorAll(".mep-story-step"));
    const panes = Array.from(section.querySelectorAll(".mep-scene-pane"));
    const tabs = Array.from(section.querySelectorAll(".mep-world-tab"));
    const svgZones = Array.from(section.querySelectorAll(".mep-svg-zone"));
    const cameraLens = document.getElementById("mep-camera-lens");
    const zoneLabel = document.getElementById("mep-active-zone-label");
    const progressFill = document.getElementById("mep-scroll-progress-fill");
    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const zoneMeta = [
      { code: "RF / COOLING TOWER", yOffset: 0 },
      { code: "3F-12F / COMMERCIAL HVAC", yOffset: 86 },
      { code: "MECH / MOTOR & VALVE", yOffset: 172 },
      { code: "B2 / RC WATER RESERVOIR", yOffset: 258 }
    ];

    let activeIndex = 0;
    let rafPending = false;

    function activateScene(idx) {
      const clamped = Math.max(0, Math.min(zoneMeta.length - 1, idx));
      activeIndex = clamped;

      steps.forEach(function (el, i) {
        el.classList.toggle("is-active", i === clamped);
      });
      panes.forEach(function (el, i) {
        el.classList.toggle("is-active", i === clamped);
      });
      tabs.forEach(function (btn, i) {
        btn.setAttribute("aria-selected", i === clamped ? "true" : "false");
      });
      svgZones.forEach(function (g, i) {
        g.classList.toggle("is-active", i === clamped);
      });

      if (cameraLens) {
        cameraLens.setAttribute("transform", "translate(0, " + zoneMeta[clamped].yOffset + ")");
      }
      if (zoneLabel) {
        zoneLabel.textContent = zoneMeta[clamped].code;
      }
    }

    function updateOnScroll() {
      rafPending = false;
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight || document.documentElement.clientHeight || 800;
      const totalScrollable = Math.max(1, rect.height - viewH * 0.55);
      const scrolled = Math.max(0, Math.min(totalScrollable, -rect.top + viewH * 0.28));
      const ratio = scrolled / totalScrollable;

      if (progressFill) {
        progressFill.style.width = Math.max(12, Math.round(ratio * 100)) + "%";
      }
      if (!reducedMotion) {
        section.style.setProperty("--mep-pipe-offset", String(-Math.round(ratio * 180)));
      }

      let bestIdx = activeIndex;
      let bestDist = Infinity;
      const anchorY = viewH * 0.42;
      steps.forEach(function (stepEl, idx) {
        const r = stepEl.getBoundingClientRect();
        const center = r.top + r.height * 0.5;
        const dist = Math.abs(center - anchorY);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });

      if (bestIdx !== activeIndex) {
        activateScene(bestIdx);
      }
    }

    function requestTick() {
      if (!rafPending) {
        rafPending = true;
        window.requestAnimationFrame(updateOnScroll);
      }
    }

    tabs.forEach(function (btn, idx) {
      btn.addEventListener("click", function () {
        activateScene(idx);
        const target = steps[idx];
        if (target && window.innerWidth > 960) {
          target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        }
      });
    });

    svgZones.forEach(function (zoneEl, idx) {
      zoneEl.addEventListener("click", function () {
        activateScene(idx);
        if (steps[idx]) {
          steps[idx].scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        }
      });
    });

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick, { passive: true });
    activateScene(0);
    updateOnScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMepScrollWorld, { once: true });
  } else {
    initMepScrollWorld();
  }
})();
