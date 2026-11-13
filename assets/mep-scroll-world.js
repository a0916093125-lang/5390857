/**
 * 皓盛有限公司 (5390857.com) - 全棟空調與水系統立體縱深巡檢引擎 v29.0
 * 效能與視覺升級重點：
 * 1. 按需渲染 (Render-on-Demand)：僅在滾動進度實際變化時啟動 requestAnimationFrame，手指停下自動休眠 (0% GPU 閒置耗電)
 * 2. 零 Layout Thrashing：於 resize 時預先快取舞台絕對座標，scroll 事件僅讀取 window.scrollY，手機滑動極致順暢
 * 3. 徹底移除右側垂直剖面 SVG 圖層與每幀 DOM 屬性更新，畫面完全置中對稱
 * 4. 雙棲支援：放入真實 WebP 序列幀時自動啟用併發佇列載入並無縫接管渲染
 */
(function () {
  "use strict";

  function initMepScrollWorld() {
    const section = document.getElementById("mep-scroll-world");
    if (!section) return;

    const stage = document.getElementById("mep-scroll-stage");
    const canvas = document.getElementById("mep-3d-canvas");
    const ctx = canvas ? canvas.getContext("2d", { alpha: false }) : null;

    const preloader = document.getElementById("mep-preloader");
    const preloaderBar = document.getElementById("mep-preloader-bar");
    const preloaderText = document.getElementById("mep-preloader-text");

    const steps = Array.from(section.querySelectorAll(".mep-story-step"));
    const tabs = Array.from(section.querySelectorAll(".mep-world-tab"));

    const zoneLabel = document.getElementById("mep-active-zone-label");
    const progressFill = document.getElementById("mep-scroll-progress-fill");

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileQuery = window.matchMedia ? window.matchMedia("(max-width: 768px)") : null;
    let isMobile = mobileQuery ? mobileQuery.matches : window.innerWidth <= 768;

    const CONFIG = {
      totalFrames: 180,
      lerpFactor: reducedMotion ? 0.45 : (isMobile ? 0.18 : 0.11),
      desktopFramePath: "assets/frames_desktop/frame_",
      mobileFramePath: "assets/frames_mobile/frame_",
      frameExt: ".webp",
      unlockThreshold: 0.25,
      maxConcurrency: 6
    };

    const zoneMeta = [
      {
        title: "頂樓・大型冷卻水塔清洗",
        primaryColor: [56, 189, 248],
        secondaryColor: [45, 212, 191]
      },
      {
        title: "3F–12F・商用空調與冷氣保養",
        primaryColor: [14, 165, 233],
        secondaryColor: [125, 211, 252]
      },
      {
        title: "機房・馬達水泵與大口徑蝶閥",
        primaryColor: [245, 158, 11],
        secondaryColor: [56, 189, 248]
      },
      {
        title: "地下室・自來水塔與蓄水池清洗",
        primaryColor: [16, 185, 129],
        secondaryColor: [94, 234, 212]
      }
    ];

    const bokehMotes = [];
    for (let i = 0; i < 28; i++) {
      bokehMotes.push({
        xNorm: ((i * 61) % 100) / 100 - 0.5,
        yNorm: ((i * 83) % 100) / 100 - 0.5,
        zOffset: i / 28,
        radius: 1.8 + (i % 4) * 1.1
      });
    }

    let activeIndex = 0;
    let targetRatio = 0;
    let currentRatio = 0;
    let rafId = null;

    let cachedStageTop = 0;
    let cachedMaxScroll = 1;
    let cachedBgGrad = null;
    let cachedCoreGlow = null;

    const sequenceFrames = new Array(CONFIG.totalFrames);
    let sequenceAvailable = false;
    let loadedCount = 0;
    let isUnlocked = false;

    function padFrameNumber(n) {
      return String(n).padStart(4, "0");
    }

    function hidePreloader() {
      if (isUnlocked) return;
      isUnlocked = true;
      if (preloader) {
        preloader.classList.add("is-hidden");
      }
    }

    function updatePreloaderUI() {
      if (isUnlocked || !preloader || !preloaderBar || !preloaderText) return;
      const unlockTarget = Math.max(1, Math.ceil(CONFIG.totalFrames * CONFIG.unlockThreshold));
      const pct = Math.min(100, Math.round((loadedCount / unlockTarget) * 100));
      preloaderBar.style.width = pct + "%";
      preloaderText.textContent = "載入立體場景 " + pct + "%";
      if (loadedCount >= unlockTarget) {
        hidePreloader();
      }
    }

    function startQueuedPreload(basePath) {
      if (preloader) {
        preloader.classList.remove("is-hidden");
      }
      let nextIndex = 1;
      let inFlight = 0;

      function pump() {
        while (inFlight < CONFIG.maxConcurrency && nextIndex < CONFIG.totalFrames) {
          const idx = nextIndex++;
          inFlight++;
          const img = new Image();
          img.decoding = "async";
          img.onload = img.onerror = function () {
            inFlight--;
            loadedCount++;
            updatePreloaderUI();
            if (Math.abs(idx / CONFIG.totalFrames - currentRatio) < 0.05) {
              scheduleRender();
            }
            pump();
          };
          img.src = basePath + padFrameNumber(idx + 1) + CONFIG.frameExt;
          sequenceFrames[idx] = img;
        }
      }

      pump();
    }

    function probeSequenceFrames() {
      const basePath = isMobile ? CONFIG.mobileFramePath : CONFIG.desktopFramePath;
      const probeImg = new Image();
      probeImg.decoding = "async";
      probeImg.onload = function () {
        sequenceAvailable = true;
        sequenceFrames[0] = probeImg;
        loadedCount = 1;
        updatePreloaderUI();
        scheduleRender();
        startQueuedPreload(basePath);
      };
      probeImg.onerror = function () {
        sequenceAvailable = false;
        hidePreloader();
      };
      probeImg.src = basePath + "0001" + CONFIG.frameExt;
    }

    function updateLayoutMetrics() {
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const viewH = window.innerHeight || document.documentElement.clientHeight || 800;
      cachedStageTop = rect.top + scrollY;
      cachedMaxScroll = Math.max(1, stage.offsetHeight - viewH);
    }

    function rebuildGradients(w, h, cx, cy) {
      if (!ctx) return;
      cachedBgGrad = ctx.createLinearGradient(0, 0, 0, h);
      cachedBgGrad.addColorStop(0, "#050b16");
      cachedBgGrad.addColorStop(0.5, "#081224");
      cachedBgGrad.addColorStop(1, "#030710");

      cachedCoreGlow = ctx.createRadialGradient(cx, cy, w * 0.01, cx, cy, Math.max(w, h) * 0.58);
      cachedCoreGlow.addColorStop(0, "rgba(56, 189, 248, 0.22)");
      cachedCoreGlow.addColorStop(0.45, "rgba(20, 83, 136, 0.08)");
      cachedCoreGlow.addColorStop(1, "rgba(4, 8, 18, 0)");
    }

    function resizeCanvas() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const maxDpr = isMobile ? 1.5 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = Math.max(280, Math.floor(rect.width * dpr));
      const h = Math.max(220, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        const cx = w * 0.5;
        const cy = isMobile ? h * 0.34 : h * 0.48;
        rebuildGradients(w, h, cx, cy);
      }
      updateLayoutMetrics();
      scheduleRender();
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function lerpColor(c1, c2, t) {
      return [
        Math.round(lerp(c1[0], c2[0], t)),
        Math.round(lerp(c1[1], c2[1], t)),
        Math.round(lerp(c1[2], c2[2], t))
      ];
    }

    function drawArchitecturalPrismWorld(ratio) {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w * 0.5;
      const cy = isMobile ? h * 0.34 : h * 0.48;

      if (!cachedBgGrad || !cachedCoreGlow) {
        rebuildGradients(w, h, cx, cy);
      }

      const scaledZone = Math.max(0, Math.min(2.999, ratio * 3));
      const zIdx = Math.floor(scaledZone);
      const zFrac = scaledZone - zIdx;
      const zCurr = zoneMeta[zIdx];
      const zNext = zoneMeta[Math.min(3, zIdx + 1)];
      const rgbMain = lerpColor(zCurr.primaryColor, zNext.primaryColor, zFrac);
      const rgbSub = lerpColor(zCurr.secondaryColor, zNext.secondaryColor, zFrac);

      ctx.fillStyle = cachedBgGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = cachedCoreGlow;
      ctx.fillRect(0, 0, w, h);

      const horizonSpan = w * 0.16;
      const gridCols = 6;
      ctx.lineWidth = Math.max(1, w * 0.0011);
      ctx.strokeStyle = "rgba(" + rgbMain[0] + "," + rgbMain[1] + "," + rgbMain[2] + ", 0.13)";
      ctx.beginPath();
      for (let c = -gridCols; c <= gridCols; c++) {
        const normX = c / gridCols;
        const nearX = cx + normX * w * 0.85;
        const farX = cx + normX * horizonSpan;
        ctx.moveTo(farX, cy - h * 0.06);
        ctx.lineTo(nearX, 0);
        ctx.moveTo(farX, cy + h * 0.06);
        ctx.lineTo(nearX, h);
      }
      ctx.stroke();

      const portalCount = 9;
      const travel = (ratio * 4.0) % 1;
      const maxPortalW = Math.max(w, h) * 1.05;
      const maxPortalH = Math.max(w, h) * 0.68;

      for (let i = 0; i < portalCount; i++) {
        const depth = ((i + travel) / portalCount) % 1;
        const pScale = Math.pow(depth, 2.25);
        const pw = maxPortalW * pScale;
        const ph = maxPortalH * pScale;
        if (pw < 18) continue;

        const x0 = cx - pw * 0.5;
        const y0 = cy - ph * 0.5;
        const chamfer = Math.min(pw, ph) * 0.14;
        const alpha = Math.sin(depth * Math.PI) * 0.52;

        ctx.strokeStyle = "rgba(" + rgbMain[0] + "," + rgbMain[1] + "," + rgbMain[2] + "," + alpha.toFixed(3) + ")";
        ctx.lineWidth = Math.max(1, 2.6 * pScale);
        ctx.beginPath();
        ctx.moveTo(x0 + chamfer, y0);
        ctx.lineTo(x0 + pw - chamfer, y0);
        ctx.lineTo(x0 + pw, y0 + chamfer);
        ctx.lineTo(x0 + pw, y0 + ph - chamfer);
        ctx.lineTo(x0 + pw - chamfer, y0 + ph);
        ctx.lineTo(x0 + chamfer, y0 + ph);
        ctx.lineTo(x0, y0 + ph - chamfer);
        ctx.lineTo(x0, y0 + chamfer);
        ctx.closePath();
        ctx.stroke();

        const pillarAlpha = alpha * 0.95;
        ctx.strokeStyle = "rgba(" + rgbSub[0] + "," + rgbSub[1] + "," + rgbSub[2] + "," + pillarAlpha.toFixed(3) + ")";
        ctx.lineWidth = Math.max(1.5, 4.2 * pScale);
        ctx.beginPath();
        const pillarLen = ph * 0.24;
        ctx.moveTo(x0, cy - pillarLen);
        ctx.lineTo(x0, cy + pillarLen);
        ctx.moveTo(x0 + pw, cy - pillarLen);
        ctx.lineTo(x0 + pw, cy + pillarLen);
        ctx.stroke();

        if (i % 2 === 0) {
          const beamLen = pw * 0.22;
          ctx.strokeStyle = "rgba(251, 191, 36, " + (alpha * 0.65).toFixed(3) + ")";
          ctx.lineWidth = Math.max(1.2, 3.0 * pScale);
          ctx.beginPath();
          ctx.moveTo(cx - beamLen, y0);
          ctx.lineTo(cx + beamLen, y0);
          ctx.moveTo(cx - beamLen, y0 + ph);
          ctx.lineTo(cx + beamLen, y0 + ph);
          ctx.stroke();
        }
      }

      for (let m = 0; m < bokehMotes.length; m++) {
        const mote = bokehMotes[m];
        const mDepth = (mote.zOffset + ratio * 3.2) % 1;
        const mScale = Math.pow(mDepth, 1.9);
        const mx = cx + mote.xNorm * w * 1.15 * mScale;
        const my = cy + mote.yNorm * h * 1.15 * mScale;
        const mAlpha = Math.sin(mDepth * Math.PI) * 0.45;
        ctx.fillStyle = "rgba(" + rgbSub[0] + "," + rgbSub[1] + "," + rgbSub[2] + "," + mAlpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(mx, my, Math.max(1, mote.radius * mScale * 2.1), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function renderCanvasFrame(ratio) {
      if (!ctx || !canvas) return;
      const frameIdx = Math.max(0, Math.min(CONFIG.totalFrames - 1, Math.round(ratio * (CONFIG.totalFrames - 1))));

      if (sequenceAvailable) {
        let img = sequenceFrames[frameIdx];
        if (!img || !img.complete || img.naturalWidth === 0) {
          for (let k = frameIdx - 1; k >= 0; k--) {
            if (sequenceFrames[k] && sequenceFrames[k].complete && sequenceFrames[k].naturalWidth > 0) {
              img = sequenceFrames[k];
              break;
            }
          }
        }
        if (img && img.complete && img.naturalWidth > 0) {
          const cw = canvas.width;
          const ch = canvas.height;
          const iw = img.naturalWidth;
          const ih = img.naturalHeight;
          const scale = Math.max(cw / iw, ch / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          ctx.drawImage(img, (cw - dw) * 0.5, (ch - dh) * 0.5, dw, dh);
          return;
        }
      }

      drawArchitecturalPrismWorld(ratio);
    }

    function activateZone(idx) {
      const clamped = Math.max(0, Math.min(zoneMeta.length - 1, idx));
      activeIndex = clamped;

      steps.forEach(function (el, i) {
        const isCurrent = i === clamped;
        el.classList.toggle("is-active", isCurrent);
        el.setAttribute("aria-hidden", isCurrent ? "false" : "true");
      });

      tabs.forEach(function (btn, i) {
        btn.setAttribute("aria-selected", i === clamped ? "true" : "false");
        btn.setAttribute("tabindex", i === clamped ? "0" : "-1");
      });

      if (zoneLabel) {
        zoneLabel.textContent = zoneMeta[clamped].title;
      }
    }

    function updateTelemetry(ratio) {
      if (progressFill) {
        progressFill.style.width = Math.max(8, Math.round(ratio * 100)) + "%";
      }
    }

    function tick() {
      rafId = null;
      const diff = targetRatio - currentRatio;
      if (Math.abs(diff) > 0.0008) {
        currentRatio += diff * CONFIG.lerpFactor;
        renderCanvasFrame(currentRatio);
        updateTelemetry(currentRatio);
        rafId = window.requestAnimationFrame(tick);
      } else {
        currentRatio = targetRatio;
        renderCanvasFrame(currentRatio);
        updateTelemetry(currentRatio);
      }
    }

    function scheduleRender() {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    }

    function onScroll() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const scrolled = Math.max(0, Math.min(cachedMaxScroll, scrollY - cachedStageTop));
      const progress = scrolled / cachedMaxScroll;

      if (Math.abs(progress - targetRatio) > 0.0005) {
        targetRatio = progress;
        scheduleRender();
      }

      let matchedIdx = 0;
      for (let i = 0; i < steps.length; i++) {
        const start = parseFloat(steps[i].dataset.start || "0");
        const end = parseFloat(steps[i].dataset.end || "1");
        if (progress >= start && progress <= end) {
          matchedIdx = i;
          break;
        }
      }
      if (matchedIdx !== activeIndex) {
        activateZone(matchedIdx);
      }
    }

    function jumpToZone(idx) {
      if (!stage) return;
      updateLayoutMetrics();
      const clamped = Math.max(0, Math.min(steps.length - 1, idx));
      activateZone(clamped);

      const targetProgress = clamped / Math.max(1, steps.length - 1);
      const destY = cachedStageTop + cachedMaxScroll * targetProgress;

      window.scrollTo({
        top: Math.max(0, destY),
        behavior: reducedMotion ? "auto" : "smooth"
      });
    }

    tabs.forEach(function (btn, idx) {
      btn.addEventListener("click", function () {
        jumpToZone(idx);
      });
      btn.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          const next = (idx + 1) % tabs.length;
          tabs[next].focus();
          jumpToZone(next);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          const prev = (idx - 1 + tabs.length) % tabs.length;
          tabs[prev].focus();
          jumpToZone(prev);
        }
      });
    });

    function initBeforeAfterSliderSafe() {
      const sliders = section.querySelectorAll(".js-ba-slider");
      sliders.forEach(function (slider) {
        if (slider.dataset.baBound === "true") return;
        const beforeLayer = slider.querySelector(".ba-before");
        const handle = slider.querySelector(".ba-handle");
        if (!beforeLayer || !handle) return;

        slider.dataset.baBound = "true";
        let currentPct = 50;
        let isDragging = false;
        let sliderRafId = null;

        function applySplit(pct) {
          currentPct = Math.max(5, Math.min(95, pct));
          const pctStr = currentPct.toFixed(1) + "%";
          const rightClip = (100 - currentPct).toFixed(1) + "%";
          beforeLayer.style.width = "100%";
          beforeLayer.style.clipPath = "inset(0 " + rightClip + " 0 0)";
          beforeLayer.style.webkitClipPath = "inset(0 " + rightClip + " 0 0)";
          handle.style.left = pctStr;
          const rounded = Math.round(currentPct);
          slider.setAttribute("aria-valuenow", String(rounded));
          slider.setAttribute("aria-valuetext", "清洗前後對比比例 " + rounded + "%");
        }

        function updateFromX(clientX) {
          if (sliderRafId !== null) cancelAnimationFrame(sliderRafId);
          sliderRafId = requestAnimationFrame(function () {
            const rect = slider.getBoundingClientRect();
            if (rect.width > 0) {
              applySplit(((clientX - rect.left) / rect.width) * 100);
            }
            sliderRafId = null;
          });
        }

        slider.addEventListener("pointerdown", function (e) {
          if (e.button !== undefined && e.button !== 0) return;
          isDragging = true;
          updateFromX(e.clientX);
          if (slider.setPointerCapture && e.pointerId !== undefined) {
            try { slider.setPointerCapture(e.pointerId); } catch (_) {}
          }
        });

        slider.addEventListener("pointermove", function (e) {
          if (!isDragging) return;
          updateFromX(e.clientX);
        });

        function stopDrag(e) {
          if (!isDragging) return;
          isDragging = false;
          if (slider.releasePointerCapture && e && e.pointerId !== undefined) {
            try { slider.releasePointerCapture(e.pointerId); } catch (_) {}
          }
        }

        slider.addEventListener("pointerup", stopDrag);
        slider.addEventListener("pointercancel", stopDrag);
        slider.addEventListener("lostpointercapture", stopDrag);

        slider.addEventListener("keydown", function (e) {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            applySplit(currentPct - 5);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            applySplit(currentPct + 5);
          } else if (e.key === "Home") {
            e.preventDefault();
            applySplit(5);
          } else if (e.key === "End") {
            e.preventDefault();
            applySplit(95);
          }
        });

        applySplit(50);
      });
    }

    if (mobileQuery) {
      const handleBreakpointChange = function (e) {
        isMobile = e.matches;
        CONFIG.lerpFactor = reducedMotion ? 0.45 : (isMobile ? 0.18 : 0.11);
        resizeCanvas();
      };
      if (mobileQuery.addEventListener) {
        mobileQuery.addEventListener("change", handleBreakpointChange);
      } else if (mobileQuery.addListener) {
        mobileQuery.addListener(handleBreakpointChange);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resizeCanvas, { passive: true });
    window.addEventListener("load", updateLayoutMetrics, { once: true });

    resizeCanvas();
    probeSequenceFrames();
    initBeforeAfterSliderSafe();
    activateZone(0);
    onScroll();
    renderCanvasFrame(currentRatio);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMepScrollWorld, { once: true });
  } else {
    initMepScrollWorld();
  }
})();
