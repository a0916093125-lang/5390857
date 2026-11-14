/**
 * 皓盛有限公司 (5390857.com) - 全棟空調與水系統流體光影縱深巡檢引擎 v30.0
 * 視覺與效能核心：
 * 1. 「Apple Pro 級・深海流體絲綢光帶與無重力水分子散景 (Fluid Aurora Silk & Hydro-Bokeh)」
 *    徹底移除所有中心幾何消失點、直線網格與八角門框，改以立體流體波紋光帶與柔和景深水光斑呈現潔淨水質與順暢氣流意象。
 * 2. 按需渲染 (Render-on-Demand)：僅在滾動進度實際變化時啟動 requestAnimationFrame，手指停下自動休眠 (0% GPU 閒置耗電)。
 * 3. 零 Layout Thrashing：於 resize 時預先快取舞台絕對座標與底層漸層，scroll 事件僅讀取 window.scrollY，手機滑動極致順暢。
 * 4. 雙棲支援：放入真實 WebP 序列幀時自動啟用併發佇列載入並無縫接管渲染。
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
        primaryColor: [56, 189, 248],   // 冰水青藍
        secondaryColor: [45, 212, 191], // 湖水翠綠
        accentColor: [125, 211, 252]
      },
      {
        title: "3F–12F・商用空調與冷氣保養",
        primaryColor: [14, 165, 233],   // 空調純藍
        secondaryColor: [99, 102, 241], // 深海靛藍
        accentColor: [186, 230, 253]
      },
      {
        title: "機房・馬達水泵與大口徑蝶閥",
        primaryColor: [245, 158, 11],   // 暖琥珀金
        secondaryColor: [14, 165, 233], // 機電冷藍
        accentColor: [253, 230, 138]
      },
      {
        title: "地下室・自來水塔與蓄水池清洗",
        primaryColor: [16, 185, 129],   // 翡翠淨水綠
        secondaryColor: [56, 189, 248], // 清澈水光藍
        accentColor: [167, 243, 208]
      }
    ];

    // 預先定義 5 道立體流體絲綢光帶參數 (象徵水波與空調氣流，無任何中心消失點)
    const silkRibbons = [
      { yBase: 0.24, amp: 0.085, freq: 1.35, speed: 3.4, thickness: 0.16, phaseOffset: 0.0, alphaScale: 0.22 },
      { yBase: 0.39, amp: 0.105, freq: 1.05, speed: -2.8, thickness: 0.20, phaseOffset: 1.7, alphaScale: 0.18 },
      { yBase: 0.54, amp: 0.075, freq: 1.60, speed: 4.1, thickness: 0.14, phaseOffset: 3.1, alphaScale: 0.24 },
      { yBase: 0.69, amp: 0.095, freq: 1.20, speed: -3.2, thickness: 0.18, phaseOffset: 4.5, alphaScale: 0.17 },
      { yBase: 0.83, amp: 0.065, freq: 1.80, speed: 2.6, thickness: 0.13, phaseOffset: 5.4, alphaScale: 0.20 }
    ];

    // 預先生成 24 顆黃金比例微距景深水分子散景光斑 (遠、中、近三層柔和圓斑)
    const hydroBokeh = [];
    for (let i = 0; i < 24; i++) {
      const layer = i % 3; // 0: 遠景小光點, 1: 中景柔光斑, 2: 近景大散景
      hydroBokeh.push({
        xBase: ((i * 37 + 13) % 100) / 100,
        yBase: ((i * 61 + 29) % 100) / 100,
        driftX: (i % 2 === 0 ? 1 : -1) * (0.04 + (i % 5) * 0.012),
        parallaxY: 0.22 + layer * 0.19,
        radius: layer === 0 ? (2.5 + (i % 3)) : (layer === 1 ? (7 + (i % 5) * 1.5) : (18 + (i % 4) * 4)),
        baseAlpha: layer === 0 ? 0.38 : (layer === 1 ? 0.18 : 0.07),
        useSecondary: i % 2 === 1
      });
    }

    let activeIndex = 0;
    let targetRatio = 0;
    let currentRatio = 0;
    let rafId = null;

    let cachedStageTop = 0;
    let cachedMaxScroll = 1;
    let cachedBgGrad = null;

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

    function rebuildBaseGradient(w, h) {
      if (!ctx) return;
      cachedBgGrad = ctx.createLinearGradient(0, 0, w * 0.35, h);
      cachedBgGrad.addColorStop(0, "#030711");
      cachedBgGrad.addColorStop(0.48, "#071122");
      cachedBgGrad.addColorStop(1, "#03060d");
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
        rebuildBaseGradient(w, h);
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

    // Apple Pro 級「深海流體絲綢光帶與水分子散景 (Fluid Aurora Silk & Hydro-Bokeh)」渲染器
    function drawFluidSilkWorld(ratio) {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      if (!cachedBgGrad) {
        rebuildBaseGradient(w, h);
      }

      const scaledZone = Math.max(0, Math.min(2.999, ratio * 3));
      const zIdx = Math.floor(scaledZone);
      const zFrac = scaledZone - zIdx;
      const zCurr = zoneMeta[zIdx];
      const zNext = zoneMeta[Math.min(3, zIdx + 1)];
      const rgbMain = lerpColor(zCurr.primaryColor, zNext.primaryColor, zFrac);
      const rgbSub = lerpColor(zCurr.secondaryColor, zNext.secondaryColor, zFrac);
      const rgbAcc = lerpColor(zCurr.accentColor, zNext.accentColor, zFrac);

      // 1. 深海曜石底圖
      ctx.fillStyle = cachedBgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. 雙核心無邊界極光環境柔光暈 (隨滾動在畫面兩側柔和漫射，完全無中心靶心感)
      const orb1X = w * (0.24 + Math.sin(ratio * Math.PI * 1.6) * 0.14);
      const orb1Y = h * (0.30 + Math.cos(ratio * Math.PI * 1.3) * 0.12);
      const orb1R = Math.max(w, h) * 0.62;
      const gradOrb1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, orb1R);
      gradOrb1.addColorStop(0, "rgba(" + rgbMain[0] + "," + rgbMain[1] + "," + rgbMain[2] + ", 0.18)");
      gradOrb1.addColorStop(0.55, "rgba(" + rgbMain[0] + "," + rgbMain[1] + "," + rgbMain[2] + ", 0.05)");
      gradOrb1.addColorStop(1, "rgba(3, 7, 17, 0)");
      ctx.fillStyle = gradOrb1;
      ctx.fillRect(0, 0, w, h);

      const orb2X = w * (0.76 - Math.cos(ratio * Math.PI * 1.4) * 0.14);
      const orb2Y = h * (0.68 - Math.sin(ratio * Math.PI * 1.5) * 0.12);
      const orb2R = Math.max(w, h) * 0.58;
      const gradOrb2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, orb2R);
      gradOrb2.addColorStop(0, "rgba(" + rgbSub[0] + "," + rgbSub[1] + "," + rgbSub[2] + ", 0.15)");
      gradOrb2.addColorStop(0.55, "rgba(" + rgbSub[0] + "," + rgbSub[1] + "," + rgbSub[2] + ", 0.04)");
      gradOrb2.addColorStop(1, "rgba(3, 7, 17, 0)");
      ctx.fillStyle = gradOrb2;
      ctx.fillRect(0, 0, w, h);

      // 3. 多層次立體流體絲綢光帶 (3D Flowing Hydro-Air Ribbons)
      const stepX = Math.max(24, Math.floor(w / 28));
      for (let r = 0; r < silkRibbons.length; r++) {
        const rib = silkRibbons[r];
        const phase = rib.phaseOffset + ratio * rib.speed;
        const baseY = h * (rib.yBase - (ratio - 0.5) * 0.12 * ((r % 2 === 0) ? 1 : -1));
        const ampY = h * rib.amp;
        const thickY = h * rib.thickness;
        const colorArr = (r % 2 === 0) ? rgbMain : rgbSub;

        const ribbonGrad = ctx.createLinearGradient(0, baseY - ampY, 0, baseY + ampY + thickY);
        ribbonGrad.addColorStop(0, "rgba(" + colorArr[0] + "," + colorArr[1] + "," + colorArr[2] + "," + rib.alphaScale.toFixed(3) + ")");
        ribbonGrad.addColorStop(0.5, "rgba(" + colorArr[0] + "," + colorArr[1] + "," + colorArr[2] + "," + (rib.alphaScale * 0.35).toFixed(3) + ")");
        ribbonGrad.addColorStop(1, "rgba(3, 7, 17, 0)");

        ctx.fillStyle = ribbonGrad;
        ctx.beginPath();

        // 上緣波浪曲線
        for (let x = 0; x <= w + stepX; x += stepX) {
          const nx = x / w;
          const y = baseY +
            Math.sin(nx * Math.PI * 2 * rib.freq + phase) * ampY +
            Math.cos(nx * Math.PI * 3.1 - phase * 0.6) * (ampY * 0.35);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        // 下緣波浪包絡線，圍成絲綢立體切面
        for (let x = w + stepX; x >= 0; x -= stepX) {
          const nx = x / w;
          const y = baseY + thickY +
            Math.sin(nx * Math.PI * 2 * rib.freq + phase + 0.55) * (ampY * 0.82) +
            Math.cos(nx * Math.PI * 2.4 - phase * 0.4) * (ampY * 0.4);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // 絲綢光帶頂部細緻高光稜線 (Crest Rim Light)
        ctx.strokeStyle = "rgba(" + rgbAcc[0] + "," + rgbAcc[1] + "," + rgbAcc[2] + "," + (rib.alphaScale * 1.45).toFixed(3) + ")";
        ctx.lineWidth = Math.max(1, (isMobile ? 1.2 : 1.8));
        ctx.beginPath();
        for (let x = 0; x <= w + stepX; x += stepX) {
          const nx = x / w;
          const y = baseY +
            Math.sin(nx * Math.PI * 2 * rib.freq + phase) * ampY +
            Math.cos(nx * Math.PI * 3.1 - phase * 0.6) * (ampY * 0.35);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 4. 黃金比例微距景深水分子光斑 (Depth-of-Field Hydro Bokeh)
      const dprScale = Math.min(w, h) / 720;
      for (let b = 0; b < hydroBokeh.length; b++) {
        const pt = hydroBokeh[b];
        const bx = ((pt.xBase + Math.sin(ratio * Math.PI * 2 + b) * pt.driftX + 1) % 1) * w;
        const by = ((pt.yBase - ratio * pt.parallaxY + 2) % 1) * h;
        const br = Math.max(1.5, pt.radius * dprScale);
        const cArr = pt.useSecondary ? rgbSub : rgbAcc;

        ctx.fillStyle = "rgba(" + cArr[0] + "," + cArr[1] + "," + cArr[2] + "," + pt.baseAlpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
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

      drawFluidSilkWorld(ratio);
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
