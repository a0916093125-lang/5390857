/**
 * 皓盛有限公司 (5390857.com) - Apple 官網級滿版 3D 沉浸式機電滾動穿越引擎 v27.0
 * 核心架構：
 * 1. 100vw x 440vh Sticky 100dvh 視窗滾動進度追蹤 + Lerp (0.08) 物理阻尼平滑渲染
 * 2. 雙棲渲染引擎：自動探測 WebP 序列幀（具優先級預載進度條、前 25% 解鎖門檻、併發連線池節流）
 *    無序列幀時自動啟用 60fps 高 DPI (dpr <= 2) 3D 建築機電立井透視隧道 + 流體粒子引擎
 * 3. 4 幕 SEO/GEO 毛玻璃敘事卡片與右側建築垂直剖面 HUD 同步聯動（含完整 WAI-ARIA tabpanel 切換）
 * 4. 單一統一指標事件控制器管理蓄水池 Before/After 對比拉桿，徹底根除雙重綁定與手機觸控衝突
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
    const svgZones = Array.from(section.querySelectorAll(".mep-svg-zone"));
    const cameraLens = document.getElementById("mep-camera-lens");

    const zoneLabel = document.getElementById("mep-active-zone-label");
    const progressFill = document.getElementById("mep-scroll-progress-fill");
    const hudElevation = document.getElementById("mep-hud-elevation");
    const hudFrame = document.getElementById("mep-hud-frame");
    const hudCamMode = document.getElementById("mep-hud-cam-mode");
    const hudSpec = document.getElementById("mep-hud-telemetry-spec");

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileQuery = window.matchMedia ? window.matchMedia("(max-width: 768px)") : null;
    let isMobile = mobileQuery ? mobileQuery.matches : window.innerWidth <= 768;

    const CONFIG = {
      totalFrames: 180,
      lerpFactor: reducedMotion ? 0.35 : 0.08,
      desktopFramePath: "assets/frames_desktop/frame_",
      mobileFramePath: "assets/frames_mobile/frame_",
      frameExt: ".webp",
      unlockThreshold: 0.25,
      maxConcurrency: 6
    };

    const zoneMeta = [
      {
        code: "RF / COOLING TOWER",
        spec: "LOTO ISOLATED / 60 FPS LERP",
        primaryColor: [56, 189, 248],
        secondaryColor: [94, 234, 212]
      },
      {
        code: "3F-12F / COMMERCIAL HVAC",
        spec: "CHILLED WATER 7C-12C / FCU",
        primaryColor: [14, 165, 233],
        secondaryColor: [125, 211, 252]
      },
      {
        code: "MECH / MOTOR & VALVE",
        spec: "ISO-10816 VIBRATION / 2\"-10\" VALVE",
        primaryColor: [245, 158, 11],
        secondaryColor: [56, 189, 248]
      },
      {
        code: "B2 / RC WATER RESERVOIR",
        spec: "CONFINED SPACE O2 > 19.5% / 61F-G2",
        primaryColor: [16, 185, 129],
        secondaryColor: [52, 211, 153]
      }
    ];

    // 預先生成 48 顆 3D 空間流體微粒座標，創造穿越景深速度感
    const particles = [];
    for (let p = 0; p < 48; p++) {
      particles.push({
        angle: (p * 2.39996) % (Math.PI * 2),
        distRatio: 0.14 + ((p * 37) % 80) / 100,
        zOffset: (p / 48),
        size: 1.2 + (p % 3) * 0.7
      });
    }

    let activeIndex = 0;
    let targetRatio = 0;
    let currentRatio = 0;
    let lastDrawnRatio = -1;
    let ambientPhase = 0;
    let isInViewport = true;

    // 雙棲 WebP 序列幀快取與併發佇列狀態
    const sequenceFrames = new Array(CONFIG.totalFrames);
    let sequenceAvailable = false;
    let loadedCount = 0;
    let isUnlocked = false;
    let activeBasePath = isMobile ? CONFIG.mobileFramePath : CONFIG.desktopFramePath;

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
      preloaderText.textContent = "載入 3D 機電場景 " + pct + "%";
      if (loadedCount >= unlockTarget) {
        hidePreloader();
      }
    }

    // 併發連線池預載器（避免行動網路瞬間發出 180 個請求導致塞車與 iOS 記憶體尖峰）
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
            pump();
          };
          img.src = basePath + padFrameNumber(idx + 1) + CONFIG.frameExt;
          sequenceFrames[idx] = img;
        }
      }

      pump();
    }

    function probeSequenceFrames() {
      activeBasePath = isMobile ? CONFIG.mobileFramePath : CONFIG.desktopFramePath;
      const probeImg = new Image();
      probeImg.decoding = "async";
      probeImg.onload = function () {
        sequenceAvailable = true;
        sequenceFrames[0] = probeImg;
        loadedCount = 1;
        lastDrawnRatio = -1;
        if (hudCamMode) {
          hudCamMode.textContent = isMobile ? "3D WEBP MOBILE (1080P)" : "3D WEBP SEQUENCE (1920P)";
        }
        updatePreloaderUI();
        startQueuedPreload(activeBasePath);
      };
      probeImg.onerror = function () {
        sequenceAvailable = false;
        hidePreloader();
        if (hudCamMode) {
          hudCamMode.textContent = "3D CAD TUNNEL · 60FPS";
        }
      };
      probeImg.src = activeBasePath + "0001" + CONFIG.frameExt;
    }

    function resizeCanvas() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      // 鎖定 devicePixelRatio 上限為 2，防止 iOS Safari 視網膜螢幕 Canvas 記憶體超載
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(300, Math.floor(rect.width * dpr));
      const h = Math.max(240, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        lastDrawnRatio = -1;
      }
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

    // 繪製 60fps 高精度 3D 建築機電立井透視隧道（無 WebP 序列幀時提供完整沉浸視覺）
    function drawProceduralMepTunnel(ratio, phase) {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      // 桌機中心微偏右避開左側卡片；手機中心偏上避開底部卡片
      const cx = isMobile ? w * 0.5 : w * 0.54;
      const cy = isMobile ? h * 0.34 : h * 0.48;

      const scaledZone = Math.max(0, Math.min(2.999, ratio * 3));
      const zIdx = Math.floor(scaledZone);
      const zFrac = scaledZone - zIdx;
      const zCurr = zoneMeta[zIdx];
      const zNext = zoneMeta[Math.min(3, zIdx + 1)];
      const rgbMain = lerpColor(zCurr.primaryColor, zNext.primaryColor, zFrac);
      const rgbSub = lerpColor(zCurr.secondaryColor, zNext.secondaryColor, zFrac);

      const bgGrad = ctx.createRadialGradient(cx, cy, w * 0.03, cx, cy, Math.max(w, h) * 0.85);
      bgGrad.addColorStop(0, "rgb(14, 30, 56)");
      bgGrad.addColorStop(0.5, "rgb(6, 13, 27)");
      bgGrad.addColorStop(1, "rgb(3, 6, 14)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 1. 建築機電管道間 12 道縱深透視導軌
      const rays = 12;
      ctx.lineWidth = Math.max(1, w * 0.0014);
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2 + ratio * 0.75;
        const innerR = Math.min(w, h) * 0.035;
        const outerR = Math.max(w, h) * 0.9;
        ctx.strokeStyle = "rgba(" + rgbMain[0] + "," + rgbMain[1] + "," + rgbMain[2] + ", 0.16)";
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.stroke();
      }

      // 2. 由遠而近推進的 3D 結構景深層環（依樓層自動切換風機葉片、冰水盤管矩陣、八角蝶閥法蘭、RC蓄水池波紋）
      const totalRings = 16;
      const travel = (ratio * 5.6 + phase * 0.1) % 1;

      for (let i = 0; i < totalRings; i++) {
        const normDepth = ((i + travel) / totalRings) % 1;
        const perspective = Math.pow(normDepth, 2.3);
        const radius = Math.max(w, h) * 0.72 * perspective;
        if (radius < 4) continue;

        const alpha = Math.sin(normDepth * Math.PI) * 0.62;
        ctx.strokeStyle = "rgba(" + rgbMain[0] + "," + rgbMain[1] + "," + rgbMain[2] + "," + alpha.toFixed(3) + ")";
        ctx.lineWidth = Math.max(1, 3.4 * perspective);

        if (ratio < 0.27) {
          // 頂樓 RF：冷卻水塔散熱風筒同心圓環與旋轉播水頭葉片
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();

          if (i % 3 === 0) {
            const blades = 6;
            const rot = ratio * Math.PI * 4.5 + i * 0.35 + phase * 0.45;
            ctx.strokeStyle = "rgba(" + rgbSub[0] + "," + rgbSub[1] + "," + rgbSub[2] + "," + (alpha * 0.78).toFixed(3) + ")";
            for (let b = 0; b < blades; b++) {
              const ba = rot + (b / blades) * Math.PI * 2;
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(ba) * (radius * 0.66), cy + Math.sin(ba) * (radius * 0.66));
              ctx.lineTo(cx + Math.cos(ba + 0.16) * radius, cy + Math.sin(ba + 0.16) * radius);
              ctx.stroke();
            }
          }
        } else if (ratio < 0.54) {
          // 3F-12F 商空：四方吹 FCU 導風框與高密度銅管散熱鰭片通道
          const rw = radius * 1.48;
          const rh = radius * 0.94;
          ctx.strokeRect(cx - rw * 0.5, cy - rh * 0.5, rw, rh);

          if (i % 2 === 0) {
            ctx.strokeStyle = "rgba(" + rgbSub[0] + "," + rgbSub[1] + "," + rgbSub[2] + "," + (alpha * 0.68).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(cx - rw * 0.36, cy - rh * 0.5);
            ctx.lineTo(cx + rw * 0.36, cy - rh * 0.5);
            ctx.moveTo(cx - rw * 0.36, cy + rh * 0.5);
            ctx.lineTo(cx + rw * 0.36, cy + rh * 0.5);
            ctx.stroke();
          }
        } else if (ratio < 0.80) {
          // MECH 機房：大口徑齒輪式蝶閥八角法蘭與 8 孔 SUS304 螺栓環
          const sides = 8;
          ctx.beginPath();
          for (let s = 0; s <= sides; s++) {
            const sa = (s / sides) * Math.PI * 2 + Math.PI * 0.125;
            const px = cx + Math.cos(sa) * radius;
            const py = cy + Math.sin(sa) * radius;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          if (i % 3 === 0 && radius > 36) {
            ctx.fillStyle = "rgba(251, 191, 36, " + (alpha * 0.88).toFixed(3) + ")";
            for (let b = 0; b < 8; b++) {
              const ba = (b / 8) * Math.PI * 2;
              ctx.beginPath();
              ctx.arc(cx + Math.cos(ba) * (radius * 0.88), cy + Math.sin(ba) * (radius * 0.88), Math.max(1.5, 3.6 * perspective), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else {
          // B2 地下室 RC 蓄水池：無塵池體構造框與 Omron 61F-G2 液位諧波曲線
          const rw = radius * 1.56;
          const rh = radius * 1.04;
          ctx.strokeRect(cx - rw * 0.5, cy - rh * 0.5, rw, rh);

          ctx.strokeStyle = "rgba(52, 211, 153, " + (alpha * 0.82).toFixed(3) + ")";
          ctx.beginPath();
          const waveY = cy + (normDepth - 0.5) * h * 0.44;
          for (let x = cx - rw * 0.5; x <= cx + rw * 0.5; x += 18) {
            const wy = waveY + Math.sin(x * 0.028 + phase * 2.1 + i) * 6 * perspective;
            if (x === cx - rw * 0.5) ctx.moveTo(x, wy);
            else ctx.lineTo(x, wy);
          }
          ctx.stroke();
        }
      }

      // 3. 3D 空間冷卻水霧／氣流粒子推進效果
      const maxSpread = Math.max(w, h) * 0.65;
      for (let p = 0; p < particles.length; p++) {
        const pt = particles[p];
        const pDepth = (pt.zOffset + ratio * 4.2 + phase * 0.08) % 1;
        const pScale = Math.pow(pDepth, 2.1);
        const r = maxSpread * pt.distRatio * pScale;
        if (r < 6) continue;
        const px = cx + Math.cos(pt.angle + ratio * 0.5) * r;
        const py = cy + Math.sin(pt.angle + ratio * 0.5) * r;
        const pAlpha = Math.sin(pDepth * Math.PI) * 0.55;
        ctx.fillStyle = "rgba(" + rgbSub[0] + "," + rgbSub[1] + "," + rgbSub[2] + "," + pAlpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, pt.size * pScale * 2.2), 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. 中心雷射工程對準十字準星
      ctx.strokeStyle = "rgba(94, 234, 212, 0.34)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * 0.048, 0, Math.PI * 2);
      ctx.moveTo(cx - 18, cy);
      ctx.lineTo(cx + 18, cy);
      ctx.moveTo(cx, cy - 18);
      ctx.lineTo(cx, cy + 18);
      ctx.stroke();
    }

    // Object-Fit: Cover 等比例居中裁切繪製，確保任何螢幕比例皆零變形、無黑邊
    function renderCanvasFrame(ratio, phase) {
      if (!ctx || !canvas) return;
      const frameIdx = Math.max(0, Math.min(CONFIG.totalFrames - 1, Math.round(ratio * (CONFIG.totalFrames - 1))));

      if (sequenceAvailable) {
        let img = sequenceFrames[frameIdx];
        // 若目標幀仍在背景下載中，向前搜尋最近已就緒的幀避免閃爍
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

      drawProceduralMepTunnel(ratio, phase);
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

      svgZones.forEach(function (g, i) {
        g.classList.toggle("is-active", i === clamped);
      });

      if (zoneLabel) {
        zoneLabel.textContent = zoneMeta[clamped].code;
      }
      if (hudSpec) {
        hudSpec.textContent = zoneMeta[clamped].spec;
      }
    }

    function updateTelemetry(ratio) {
      if (progressFill) {
        progressFill.style.width = Math.max(4, Math.round(ratio * 100)) + "%";
      }
      if (!reducedMotion) {
        section.style.setProperty("--mep-pipe-offset", String(-Math.round(ratio * 240)));
      }
      if (cameraLens) {
        const continuousY = (ratio * 258).toFixed(1);
        cameraLens.setAttribute("transform", "translate(0, " + continuousY + ")");
      }
      if (hudElevation) {
        const elev = lerp(42.0, -12.0, ratio);
        const sign = elev >= 0 ? "+" : "";
        const tag = elev > 25 ? " RF" : elev > 2 ? " FL" : elev > -6 ? " B1" : " B2";
        hudElevation.textContent = sign + elev.toFixed(1) + "m" + tag;
      }
      if (hudFrame) {
        const fNum = Math.max(1, Math.min(CONFIG.totalFrames, Math.round(ratio * (CONFIG.totalFrames - 1)) + 1));
        hudFrame.textContent = String(fNum).padStart(3, "0") + " / " + CONFIG.totalFrames;
      }
    }

    function computeScrollTarget() {
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const viewH = window.innerHeight || document.documentElement.clientHeight || 800;

      isInViewport = rect.bottom > -120 && rect.top < viewH + 120;

      const maxScroll = Math.max(1, stage.offsetHeight - viewH);
      const scrolled = Math.max(0, Math.min(maxScroll, -rect.top));
      const progress = scrolled / maxScroll;
      targetRatio = progress;

      // 依滾動區間決定當前啟動之樓層卡片
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

    function animationLoop() {
      if (isInViewport) {
        const diff = targetRatio - currentRatio;
        if (Math.abs(diff) > 0.0003) {
          currentRatio += diff * CONFIG.lerpFactor;
        } else {
          currentRatio = targetRatio;
        }

        if (!reducedMotion) {
          ambientPhase += 0.016;
        }

        if (Math.abs(currentRatio - lastDrawnRatio) > 0.0004 || (!sequenceAvailable && !reducedMotion)) {
          renderCanvasFrame(currentRatio, ambientPhase);
          updateTelemetry(currentRatio);
          lastDrawnRatio = currentRatio;
        }
      }
      window.requestAnimationFrame(animationLoop);
    }

    // 點擊樓層標籤或右側 SVG 垂直剖面：平滑捲動至該樓層對應的舞台進度座標
    function jumpToZone(idx) {
      if (!stage) return;
      const clamped = Math.max(0, Math.min(steps.length - 1, idx));
      activateZone(clamped);

      const viewH = window.innerHeight || document.documentElement.clientHeight || 800;
      const maxScroll = Math.max(1, stage.offsetHeight - viewH);
      const targetProgress = clamped / Math.max(1, steps.length - 1);
      const stageTopDoc = window.scrollY + stage.getBoundingClientRect().top;
      const destY = stageTopDoc + maxScroll * targetProgress;

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

    svgZones.forEach(function (zoneEl, idx) {
      zoneEl.addEventListener("click", function () {
        jumpToZone(idx);
      });
      zoneEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          jumpToZone(idx);
        }
      });
    });

    // 單一統一指標事件控制器管理蓄水池 Before/After 對比拉桿（與 cad-engine.js 共享 dataset.baBound 旗標零衝突）
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
        let rafId = null;

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
          if (rafId !== null) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(function () {
            const rect = slider.getBoundingClientRect();
            if (rect.width > 0) {
              applySplit(((clientX - rect.left) / rect.width) * 100);
            }
            rafId = null;
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
        resizeCanvas();
        if (sequenceAvailable) {
          loadedCount = 0;
          isUnlocked = false;
          probeSequenceFrames();
        }
      };
      if (mobileQuery.addEventListener) {
        mobileQuery.addEventListener("change", handleBreakpointChange);
      } else if (mobileQuery.addListener) {
        mobileQuery.addListener(handleBreakpointChange);
      }
    }

    if (window.ResizeObserver && canvas && canvas.parentElement) {
      const ro = new ResizeObserver(function () {
        resizeCanvas();
      });
      ro.observe(canvas.parentElement);
    }

    window.addEventListener("scroll", computeScrollTarget, { passive: true });
    window.addEventListener("resize", function () {
      resizeCanvas();
      computeScrollTarget();
    }, { passive: true });

    resizeCanvas();
    probeSequenceFrames();
    initBeforeAfterSliderSafe();
    activateZone(0);
    computeScrollTarget();
    renderCanvasFrame(currentRatio, 0);
    window.requestAnimationFrame(animationLoop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMepScrollWorld, { once: true });
  } else {
    initMepScrollWorld();
  }
})();
