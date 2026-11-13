/**
 * 皓盛有限公司 (5390857.com) - 原生 3D 沉浸式建築機電滾動穿越引擎 (Scroll-Driven 3D MEP World) v26.0
 * 核心功能：
 * 1. 60fps HTML5 Canvas 3D 建築機電透視隧道渲染器 (RF 冷卻塔 -> 3F-12F 商空 -> MECH 泵閥 -> B2 蓄水池)
 * 2. 雙棲序列幀支援：自動探測 ./assets/frames_desktop/frame_0001.webp (有序列幀播序列幀，無圖自動渲染 3D CAD 隧道)
 * 3. Lerp (0.08) 線性插值物理阻尼與 SVG 垂直剖面連續鏡頭追蹤
 * 4. 內建雙保險 Before/After 蓄水池清洗對比拉桿控制器（支援滑鼠、手機觸控與鍵盤方向鍵）
 * 5. 支援「沉浸全寬劇場模式」與「雙欄工程巡檢模式」一鍵切換
 */
(function () {
  "use strict";

  function initMepScrollWorld() {
    const section = document.getElementById("mep-scroll-world");
    if (!section) return;

    const canvas = document.getElementById("mep-3d-canvas");
    const ctx = canvas ? canvas.getContext("2d", { alpha: false }) : null;
    const steps = Array.from(section.querySelectorAll(".mep-story-step"));
    const panes = Array.from(section.querySelectorAll(".mep-scene-pane"));
    const tabs = Array.from(section.querySelectorAll(".mep-world-tab"));
    const svgZones = Array.from(section.querySelectorAll(".mep-svg-zone"));
    const cameraLens = document.getElementById("mep-camera-lens");
    const zoneLabel = document.getElementById("mep-active-zone-label");
    const progressFill = document.getElementById("mep-scroll-progress-fill");
    const hudElevation = document.getElementById("mep-hud-elevation");
    const hudFrame = document.getElementById("mep-hud-frame");
    const hudCamMode = document.getElementById("mep-hud-cam-mode");
    const hudSpec = document.getElementById("mep-hud-telemetry-spec");
    const theaterBtn = document.getElementById("mep-theater-toggle");
    const theaterLabel = document.getElementById("mep-theater-label");

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;

    const CONFIG = {
      totalFrames: 180,
      lerpFactor: reducedMotion ? 0.35 : 0.085,
      desktopFramePath: "assets/frames_desktop/frame_",
      mobileFramePath: "assets/frames_mobile/frame_",
      frameExt: ".webp"
    };

    const zoneMeta = [
      {
        code: "RF / COOLING TOWER",
        spec: "LOTO ISOLATED / 30 FPS LERP",
        yOffset: 0,
        elevStart: 42.0,
        elevEnd: 28.0,
        primaryColor: [56, 189, 248],   // #38bdf8
        secondaryColor: [94, 234, 212]  // #5eead4
      },
      {
        code: "3F-12F / COMMERCIAL HVAC",
        spec: "CHILLED WATER 7C-12C / FCU",
        yOffset: 86,
        elevStart: 28.0,
        elevEnd: 6.0,
        primaryColor: [14, 165, 233],   // #0ea5e9
        secondaryColor: [125, 211, 252] // #7dd3fc
      },
      {
        code: "MECH / MOTOR & VALVE",
        spec: "ISO-10816 VIBRATION / 2"-10" VALVE",
        yOffset: 172,
        elevStart: 6.0,
        elevEnd: -4.5,
        primaryColor: [245, 158, 11],   // #f59e0b
        secondaryColor: [56, 189, 248]  // #38bdf8
      },
      {
        code: "B2 / RC WATER RESERVOIR",
        spec: "CONFINED SPACE O2 > 19.5% / 61F-G2",
        yOffset: 258,
        elevStart: -4.5,
        elevEnd: -12.0,
        primaryColor: [16, 185, 129],   // #10b981
        secondaryColor: [52, 211, 153]  // #34d399
      }
    ];

    let activeIndex = 0;
    let targetRatio = 0;
    let currentRatio = 0;
    let lastRenderedRatio = -1;
    let ambientPhase = 0;
    let isInViewport = true;

    // 雙棲序列幀快取 (若使用者日後放入 WebP 序列幀則自動啟用)
    const sequenceFrames = new Array(CONFIG.totalFrames);
    let sequenceAvailable = false;

    function padFrameNumber(n) {
      return String(n).padStart(4, "0");
    }

    function probeSequenceFrames() {
      const probeImg = new Image();
      const basePath = isMobile ? CONFIG.mobileFramePath : CONFIG.desktopFramePath;
      probeImg.onload = function () {
        sequenceAvailable = true;
        sequenceFrames[0] = probeImg;
        if (hudCamMode) {
          hudCamMode.textContent = "3D WEBP SEQUENCE + LIVE";
        }
        for (let i = 1; i < CONFIG.totalFrames; i++) {
          const img = new Image();
          img.decoding = "async";
          img.src = basePath + padFrameNumber(i + 1) + CONFIG.frameExt;
          sequenceFrames[i] = img;
        }
      };
      probeImg.onerror = function () {
        sequenceAvailable = false;
      };
      probeImg.src = basePath + "0001" + CONFIG.frameExt;
    }

    function resizeCanvas() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(280, Math.floor(rect.width * dpr));
      const h = Math.max(220, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        lastRenderedRatio = -1;
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

    // 繪製 60fps 3D 建築機電透視穿越隧道 (4 大樓層幾何特徵連續演進)
    function drawProceduralMepTunnel(ratio, phase) {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w * 0.5;
      const cy = h * 0.46;

      // 計算當前所處樓層與跨樓層混合權重
      const scaledZone = Math.max(0, Math.min(2.999, ratio * 3));
      const zIdx = Math.floor(scaledZone);
      const zFrac = scaledZone - zIdx;
      const zCurr = zoneMeta[zIdx];
      const zNext = zoneMeta[Math.min(3, zIdx + 1)];
      const rgbMain = lerpColor(zCurr.primaryColor, zNext.primaryColor, zFrac);
      const rgbSub = lerpColor(zCurr.secondaryColor, zNext.secondaryColor, zFrac);

      // 深海機電藍黑底色
      const bgGrad = ctx.createRadialGradient(cx, cy, w * 0.04, cx, cy, Math.max(w, h) * 0.78);
      bgGrad.addColorStop(0, "rgb(14, 28, 52)");
      bgGrad.addColorStop(0.55, "rgb(7, 15, 29)");
      bgGrad.addColorStop(1, "rgb(4, 8, 16)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 1. 繪製 3D 建築機電立井透視放射導軌 (8 道立體結構樑與冷卻水幹管)
      const rays = 12;
      ctx.save();
      ctx.lineWidth = Math.max(1, w * 0.0018);
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2 + ratio * 0.65;
        const innerR = Math.min(w, h) * 0.04;
        const outerR = Math.max(w, h) * 0.85;
        ctx.strokeStyle = "rgba(" + rgbMain[0] + "," + rgbMain[1] + "," + rgbMain[2] + ", 0.18)";
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.stroke();
      }
      ctx.restore();

      // 2. 繪製由遠而近推進的 3D 景深層環 (Depth Rings / 根據樓層切換圓形風機、方形風管、八角法蘭與蓄水池格柵)
      const totalRings = 14;
      const travel = (ratio * 5.2 + phase * 0.12) % 1;

      for (let i = 0; i < totalRings; i++) {
        const normDepth = ((i + travel) / totalRings) % 1;
        const perspective = Math.pow(normDepth, 2.35);
        const radius = Math.max(w, h) * 0.68 * perspective;
        if (radius < 4) continue;

        const alpha = Math.sin(normDepth * Math.PI) * 0.58;
        ctx.strokeStyle = "rgba(" + rgbMain[0] + "," + rgbMain[1] + "," + rgbMain[2] + "," + alpha.toFixed(3) + ")";
        ctx.lineWidth = Math.max(1, 3.2 * perspective);

        if (ratio < 0.28) {
          // 頂樓 RF：冷卻水塔散熱風機同心渦流環與播水頭葉片
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();

          if (i % 3 === 0) {
            const blades = 6;
            const rot = ratio * Math.PI * 4 + i * 0.4 + phase * 0.5;
            ctx.strokeStyle = "rgba(" + rgbSub[0] + "," + rgbSub[1] + "," + rgbSub[2] + "," + (alpha * 0.75).toFixed(3) + ")";
            for (let b = 0; b < blades; b++) {
              const ba = rot + (b / blades) * Math.PI * 2;
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(ba) * (radius * 0.68), cy + Math.sin(ba) * (radius * 0.68));
              ctx.lineTo(cx + Math.cos(ba + 0.18) * radius, cy + Math.sin(ba + 0.18) * radius);
              ctx.stroke();
            }
          }
        } else if (ratio < 0.58) {
          // 3F-12F 商空：四方吹 FCU 與大型矩形冰水盤管矩陣通道
          const rw = radius * 1.45;
          const rh = radius * 0.92;
          ctx.strokeRect(cx - rw * 0.5, cy - rh * 0.5, rw, rh);

          // 四方吹氣流導風切線
          if (i % 2 === 0) {
            ctx.strokeStyle = "rgba(" + rgbSub[0] + "," + rgbSub[1] + "," + rgbSub[2] + "," + (alpha * 0.65).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(cx - rw * 0.35, cy - rh * 0.5);
            ctx.lineTo(cx + rw * 0.35, cy - rh * 0.5);
            ctx.moveTo(cx - rw * 0.35, cy + rh * 0.5);
            ctx.lineTo(cx + rw * 0.35, cy + rh * 0.5);
            ctx.stroke();
          }
        } else if (ratio < 0.82) {
          // MECH 機房：2"~10" 大口徑蝶閥八角法蘭與連座軸承滾珠環
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

          // 法蘭螺栓孔點綴
          if (i % 3 === 0 && radius > 35) {
            ctx.fillStyle = "rgba(251, 191, 36, " + (alpha * 0.85).toFixed(3) + ")";
            for (let b = 0; b < 8; b++) {
              const ba = (b / 8) * Math.PI * 2;
              ctx.beginPath();
              ctx.arc(cx + Math.cos(ba) * (radius * 0.88), cy + Math.sin(ba) * (radius * 0.88), Math.max(1.5, 3.5 * perspective), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else {
          // B2 地下室 RC 蓄水池：水下結構格柵與 61F-G2 液位探測波紋
          const rw = radius * 1.55;
          const rh = radius * 1.05;
          ctx.strokeRect(cx - rw * 0.5, cy - rh * 0.5, rw, rh);

          // 液位諧波曲線
          ctx.strokeStyle = "rgba(52, 211, 153, " + (alpha * 0.8).toFixed(3) + ")";
          ctx.beginPath();
          const waveY = cy + (normDepth - 0.5) * h * 0.45;
          for (let x = cx - rw * 0.5; x <= cx + rw * 0.5; x += 18) {
            const wy = waveY + Math.sin(x * 0.03 + phase * 2.2 + i) * 6 * perspective;
            if (x === cx - rw * 0.5) ctx.moveTo(x, wy);
            else ctx.lineTo(x, wy);
          }
          ctx.stroke();
        }
      }

      // 3. 中心雷射準星與高壓水分子流體微粒 (Particles)
      ctx.strokeStyle = "rgba(94, 234, 212, 0.32)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * 0.055, 0, Math.PI * 2);
      ctx.moveTo(cx - 16, cy);
      ctx.lineTo(cx + 16, cy);
      ctx.moveTo(cx, cy - 16);
      ctx.lineTo(cx, cy + 16);
      ctx.stroke();
    }

    function renderCanvasFrame(ratio, phase) {
      if (!ctx || !canvas) return;
      const frameIdx = Math.max(0, Math.min(CONFIG.totalFrames - 1, Math.round(ratio * (CONFIG.totalFrames - 1))));

      if (sequenceAvailable) {
        const img = sequenceFrames[frameIdx];
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

      if (zoneLabel) {
        zoneLabel.textContent = zoneMeta[clamped].code;
      }
      if (hudSpec) {
        hudSpec.textContent = zoneMeta[clamped].spec;
      }
    }

    function updateContinuousTelemetry(ratio) {
      // 1. 進度條與管路流動動畫
      if (progressFill) {
        progressFill.style.width = Math.max(8, Math.round(ratio * 100)) + "%";
      }
      if (!reducedMotion) {
        section.style.setProperty("--mep-pipe-offset", String(-Math.round(ratio * 240)));
        const localZoom = 1 + ((ratio * 4) % 1) * 0.08;
        section.style.setProperty("--mep-zoom-scale", localZoom.toFixed(3));
      }

      // 2. SVG 垂直剖面圖鏡頭框平滑滑動 (0 -> 258)
      if (cameraLens) {
        const continuousY = (ratio * 258).toFixed(1);
        cameraLens.setAttribute("transform", "translate(0, " + continuousY + ")");
      }

      // 3. 計算當前海拔高度 (+42.0m RF 至 -12.0m B2) 與序列幀編號
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
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight || document.documentElement.clientHeight || 800;

      // 檢查區塊是否在可視範圍內，節省 GPU 資源
      isInViewport = rect.bottom > -100 && rect.top < viewH + 100;

      const totalScrollable = Math.max(1, rect.height - viewH * 0.55);
      const scrolled = Math.max(0, Math.min(totalScrollable, -rect.top + viewH * 0.32));
      targetRatio = scrolled / totalScrollable;

      // 根據卡片位置決定當前對焦的樓層場景
      let bestIdx = activeIndex;
      let bestDist = Infinity;
      const anchorY = window.innerWidth <= 960 ? viewH * 0.66 : viewH * 0.44;

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

    function animationLoop() {
      if (isInViewport) {
        const diff = targetRatio - currentRatio;
        if (Math.abs(diff) > 0.0004) {
          currentRatio += diff * CONFIG.lerpFactor;
        } else {
          currentRatio = targetRatio;
        }

        if (!reducedMotion) {
          ambientPhase += 0.018;
        }

        if (Math.abs(currentRatio - lastRenderedRatio) > 0.0005 || !reducedMotion) {
          renderCanvasFrame(currentRatio, ambientPhase);
          updateContinuousTelemetry(currentRatio);
          lastRenderedRatio = currentRatio;
        }
      }
      window.requestAnimationFrame(animationLoop);
    }

    // 點擊樓層標籤或 SVG 剖面區域：雙端皆平滑捲動至對應規格卡片並更新鏡頭
    function jumpToZone(idx) {
      activateScene(idx);
      targetRatio = idx / Math.max(1, zoneMeta.length - 1);
      const targetStep = steps[idx];
      if (targetStep) {
        targetStep.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: window.innerWidth <= 960 ? "nearest" : "center"
        });
      }
    }

    tabs.forEach(function (btn, idx) {
      btn.addEventListener("click", function () {
        jumpToZone(idx);
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

    // 全寬沉浸劇場模式切換鈕
    if (theaterBtn) {
      theaterBtn.addEventListener("click", function () {
        const isTheater = section.classList.toggle("is-theater-mode");
        theaterBtn.setAttribute("aria-pressed", isTheater ? "true" : "false");
        if (theaterLabel) {
          theaterLabel.textContent = isTheater ? "返回雙欄巡檢" : "沉浸劇場展開";
        }
        setTimeout(function () {
          resizeCanvas();
          computeScrollTarget();
        }, 60);
      });
    }

    // 內建雙保險 Before/After 對比拉桿防呆綁定（若 cad-engine.js 未綁定到的元素自動接管）
    function ensureBeforeAfterSliders() {
      const sliders = section.querySelectorAll(".ba-slider-wrap");
      sliders.forEach(function (slider) {
        if (slider.dataset.baBound === "true") return;
        const beforeLayer = slider.querySelector(".ba-before");
        const handle = slider.querySelector(".ba-handle");
        if (!beforeLayer || !handle) return;

        slider.dataset.baBound = "true";
        let currentPct = 50;
        let dragging = false;

        function applySplit(pct) {
          currentPct = Math.max(5, Math.min(95, pct));
          const pctStr = currentPct.toFixed(1) + "%";
          const rightClip = (100 - currentPct).toFixed(1) + "%";
          beforeLayer.style.width = "100%";
          beforeLayer.style.clipPath = "inset(0 " + rightClip + " 0 0)";
          beforeLayer.style.webkitClipPath = "inset(0 " + rightClip + " 0 0)";
          handle.style.left = pctStr;
          slider.setAttribute("aria-valuenow", String(Math.round(currentPct)));
        }

        function updateFromX(clientX) {
          const rect = slider.getBoundingClientRect();
          if (rect.width > 0) {
            applySplit(((clientX - rect.left) / rect.width) * 100);
          }
        }

        slider.addEventListener("pointerdown", function (e) {
          dragging = true;
          updateFromX(e.clientX);
        });
        window.addEventListener("pointermove", function (e) {
          if (!dragging) return;
          updateFromX(e.clientX);
        }, { passive: true });
        window.addEventListener("pointerup", function () {
          dragging = false;
        }, { passive: true });

        slider.addEventListener("keydown", function (e) {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            applySplit(currentPct - 5);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            applySplit(currentPct + 5);
          }
        });

        applySplit(50);
      });
    }

    window.addEventListener("scroll", computeScrollTarget, { passive: true });
    window.addEventListener("resize", function () {
      resizeCanvas();
      computeScrollTarget();
    }, { passive: true });

    resizeCanvas();
    probeSequenceFrames();
    ensureBeforeAfterSliders();
    activateScene(0);
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
