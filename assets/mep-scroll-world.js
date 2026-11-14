/**
 * 皓盛有限公司 (5390857.com) - 五站式 3D 微縮機電島嶼滾動視差舞台 & 首頁快選試算引擎 v31.0
 * 核心架構：
 * 1. 五站等距立體剖面微縮島嶼 (Isometric MEP Diorama)：
 *    - 站點 01：RF 頂樓散熱島（圓型／方型冷卻水塔、旋轉播水頭水霧、冰水幹管）
 *    - 站點 02：3F-12F 商空與團購冷氣島（四方吹卡式機、冰水盤管、家用分離式四台團購陣列）
 *    - 站點 03：MECH 機房動力泵閥島（離心水泵、NSK連座軸承、6"~10"齒輪式蝴蝶閥法蘭）
 *    - 站點 04：B2 地下淨水蓄水池島（雙格 RC 水池剖面、Omron 61F-G2 三極不鏽鋼探棒、高壓水刀）
 *    - 站點 05：SHOP 急修排水與氯錠採購島（瑞林 RP-258 自動排水器、25kg 90% TCCA 密封桶棧板）
 * 2. 雙棲序列幀接管：若 assets/frames_desktop 或 assets/frames_mobile 存在 WebP 序列幀自動無縫接管。
 * 3. 節能鎖：IntersectionObserver + visibilitychange 雙重保護，離屏 0% GPU 耗電。
 * 4. 首頁快選試算 × A/B 方案價差漏斗：直連 HS_PRICING_CONFIG 單一真相來源，支援 URL #hq= 分享還原與一鍵帶入 quote.html。
 */
(function () {
  "use strict";

  const DRAFT_KEY = "hs_5390857_quote_draft_v11";

  function showGlobalToast(msg) {
    if (!document.body) return;
    let el = document.getElementById("hs-global-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "hs-global-toast";
      el.className = "toast-msg";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = String(msg || "");
    el.classList.add("show");
    if (el._hideTimer) clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 3200);
  }

  function copyTextSafe(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showGlobalToast(okMsg);
      }).catch(function () {
        legacyCopy(text, okMsg);
      });
    } else {
      legacyCopy(text, okMsg);
    }
  }

  function legacyCopy(text, okMsg) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showGlobalToast(okMsg);
    } catch (_) {
      showGlobalToast("請手動複製內容或直接點擊加 LINE 洽詢。");
    }
  }

  // =========================================================================
  // Part A: 五站式 3D 微縮機電島嶼滾動舞台
  // =========================================================================
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

    const hotspotCluster = document.getElementById("mep-hotspot-cluster");
    const hotspotPopover = document.getElementById("mep-hotspot-popover");
    const popTitle = document.getElementById("mep-pop-title");
    const popDesc = document.getElementById("mep-pop-desc");
    const popCta = document.getElementById("mep-pop-cta");
    const popClose = document.getElementById("mep-pop-close");

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileQuery = window.matchMedia ? window.matchMedia("(max-width: 768px)") : null;
    let isMobile = mobileQuery ? mobileQuery.matches : window.innerWidth <= 768;

    const CONFIG = {
      totalFrames: 200,
      lerpFactor: reducedMotion ? 0.48 : (isMobile ? 0.18 : 0.12),
      desktopFramePath: "assets/frames_desktop/frame_",
      mobileFramePath: "assets/frames_mobile/frame_",
      frameExt: ".webp",
      unlockThreshold: 0.25,
      maxConcurrency: 6
    };

    const zoneMeta = [
      {
        title: "01 頂樓・大型冷卻水塔散熱島",
        side: "right",
        primary: [56, 189, 248],
        secondary: [45, 212, 191],
        accent: [186, 230, 253],
        hotspots: [
          { label: "旋轉播水頭校正", desc: "拆檢散水頭中心軸承與散水孔堵塞，恢復均勻布水效率；軸承卡死可同日順修更新（平日 $4,500 起）。", preset: { track: "cooling_tower", scale: "100", cl25: false } },
          { label: "散熱材低壓水刀", desc: "施作前先檢查 PVC 散熱膠片鈣化脆化程度，以扇形定壓水刀沖除生物膜與底盤淤泥。", preset: { track: "cooling_tower", scale: "100", cl25: false } },
          { label: "搭洗水塔氯錠 $2,900 免運", desc: "25kg 90% TCCA 大桶裝氯錠單購含運 $3,400；搭配冷卻水塔清洗享每桶 $2,900 免運費。", preset: { track: "cooling_tower", scale: "100", cl25: true } }
        ]
      },
      {
        title: "02 商辦與住宅・空調盤管團購島",
        side: "left",
        primary: [14, 165, 233],
        secondary: [99, 102, 241],
        accent: [199, 210, 254],
        hotspots: [
          { label: "四方吹／吊隱式包套", desc: "含電腦板防水罩保護、風車葉輪精洗、冷凝集水盤果凍淤泥抽除與運轉電流實測（3台內平日 $10,500 起）。", preset: { track: "ac_cleaning", acModel: "cassette", rp258: false } },
          { label: "家用分離式四台團購", desc: "家用分離式採 4 台包套（平日 $10,000／專車 $12,500），未滿四台可將剩餘台數轉給隔壁鄰居一起湊團購。", preset: { track: "ac_cleaning", acModel: "split", rp258: false } },
          { label: "順換 RP-258 現折 $1,000", desc: "單獨到府換裝瑞林 RP-258 排水器 $3,500；洗冷氣同日順換平日僅 +$2,200（專車 +$2,500）。", preset: { track: "ac_cleaning", acModel: "split", rp258: true } }
        ]
      },
      {
        title: "03 機房・馬達水泵與大口徑蝶閥島",
        side: "right",
        primary: [245, 158, 11],
        secondary: [56, 189, 248],
        accent: [253, 230, 138],
        hotspots: [
          { label: "AHU 重型連座軸承", desc: "拔輪拆卸更換重型連座軸承、皮帶輪平行對心校正與三相馬達絕緣阻抗檢測（$28,000 起／組）。", preset: { track: "mpv_repair", mpvItem: "ahu_overhaul", mpvQty: 1 } },
          { label: "6吋~10吋 齒輪式蝴蝶閥", desc: "搭配手拉吊車拆除鏽死舊閥，換裝 FCD/SUS304 齒輪蝶閥、EPDM 墊片與 304 螺栓試壓（$22,000 起）。", preset: { track: "mpv_repair", mpvItem: "valve_6_10", mpvQty: 1 } },
          { label: "同項維修滿 2 件 9 折", desc: "同案場同項目馬達、泵浦或閥件檢修達 2 件以上，該維修項目全部件數直接享 9 折優惠。", preset: { track: "mpv_repair", mpvItem: "pump_seal_bearing", mpvQty: 2 } }
        ]
      },
      {
        title: "04 地下室・自來水塔與蓄水池淨水島",
        side: "left",
        primary: [16, 185, 129],
        secondary: [56, 189, 248],
        accent: [167, 243, 208],
        hotspots: [
          { label: "入槽通風與氣體測定", desc: "依水塔構造與是否入槽評估通風換氣、四用氣體測定與外部監視配置；10噸內白鐵不入槽平日 $3,800 起。", preset: { track: "water_tank", wtScale: "120" } },
          { label: "Omron 61F-G2 液位極棒", desc: "蓄水池清洗可一併點檢或換新 Omron 61F-G2 液位保持器與 SUS304 不鏽鋼電極棒，防範溢流與空轉。", preset: { track: "water_tank", wtScale: "120", lvl: true } },
          { label: "公共管路排氣復歸", desc: "清洗前執行揚水泵 LOTO 斷電隔離，完工注水後執行排氣復歸，避免氣塞導致社區高樓層停水。", preset: { track: "water_tank", wtScale: "50" } }
        ]
      },
      {
        title: "05 急修商城・RP-258 排水器與 25kg 氯錠島",
        side: "right",
        primary: [45, 212, 191],
        secondary: [245, 158, 11],
        accent: [204, 251, 241],
        hotspots: [
          { label: "瑞林 RP-258 到府換裝 $3,500", desc: "連工帶料到府換裝＋高壓疏通果凍淤泥排水管（不單售裸機），現場升級洗冷氣現折 $1,000。", preset: { track: "shop", shopItem: "rp258_standalone", shopQty: 1 } },
          { label: "25kg 90% TCCA 氯錠單購", desc: "每桶商品 $2,900＋運費 $500＝單購 $3,400／桶；工業用產品不可逕用於飲用水設備，承運與標示先核對。", preset: { track: "shop", shopItem: "chlorine_only", shopQty: 1 } },
          { label: "洗冷卻水塔合購省運費", desc: "預約商用空調冷卻水塔清洗並加購 25kg 氯錠，每桶享 $2,900 免運合併交付評估。", preset: { track: "cooling_tower", scale: "100", cl25: true } }
        ]
      }
    ];

    const ambientParticles = [];
    for (let i = 0; i < 22; i++) {
      ambientParticles.push({
        u: ((i * 41 + 17) % 100) / 100,
        v: ((i * 67 + 23) % 100) / 100,
        r: 1.6 + (i % 4) * 1.3,
        speed: 0.14 + (i % 3) * 0.08
      });
    }

    let activeIndex = 0;
    let targetRatio = 0;
    let currentRatio = 0;
    let rafId = null;
    let isStageVisible = true;
    let currentHotspotPreset = null;

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
      if (preloader) preloader.classList.add("is-hidden");
    }

    function updatePreloaderUI() {
      if (isUnlocked || !preloader || !preloaderBar || !preloaderText) return;
      const unlockTarget = Math.max(1, Math.ceil(CONFIG.totalFrames * CONFIG.unlockThreshold));
      const pct = Math.min(100, Math.round((loadedCount / unlockTarget) * 100));
      preloaderBar.style.width = pct + "%";
      preloaderText.textContent = "載入立體場景 " + pct + "%";
      if (loadedCount >= unlockTarget) hidePreloader();
    }

    function startQueuedPreload(basePath) {
      if (preloader) preloader.classList.remove("is-hidden");
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
            if (Math.abs(idx / CONFIG.totalFrames - currentRatio) < 0.05) scheduleRender();
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
      cachedBgGrad = ctx.createLinearGradient(0, 0, w * 0.25, h);
      cachedBgGrad.addColorStop(0, "#030712");
      cachedBgGrad.addColorStop(0.5, "#071225");
      cachedBgGrad.addColorStop(1, "#03060e");
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
      renderCanvasFrame(currentRatio);
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

    // -----------------------------------------------------------------------
    // Isometric 3D Geometry Helpers (True 2.5D Isometric Projection)
    // -----------------------------------------------------------------------
    function isoPoint(cx, cy, unit, x, y, z) {
      const cos30 = 0.8660254;
      const sin30 = 0.5;
      return {
        px: cx + (x - y) * cos30 * unit,
        py: cy + (x + y) * sin30 * unit - z * unit
      };
    }

    function drawIsoBox(cx, cy, unit, x0, y0, z0, dx, dy, dz, topFill, leftFill, rightFill, strokeCol) {
      const p001 = isoPoint(cx, cy, unit, x0, y0, z0 + dz);
      const p101 = isoPoint(cx, cy, unit, x0 + dx, y0, z0 + dz);
      const p111 = isoPoint(cx, cy, unit, x0 + dx, y0 + dy, z0 + dz);
      const p011 = isoPoint(cx, cy, unit, x0, y0 + dy, z0 + dz);
      const p100 = isoPoint(cx, cy, unit, x0 + dx, y0, z0);
      const p110 = isoPoint(cx, cy, unit, x0 + dx, y0 + dy, z0);
      const p010 = isoPoint(cx, cy, unit, x0, y0 + dy, z0);

      // Left face (y = y0 + dy)
      ctx.fillStyle = leftFill;
      ctx.beginPath();
      ctx.moveTo(p011.px, p011.py);
      ctx.lineTo(p111.px, p111.py);
      ctx.lineTo(p110.px, p110.py);
      ctx.lineTo(p010.px, p010.py);
      ctx.closePath();
      ctx.fill();
      if (strokeCol) { ctx.strokeStyle = strokeCol; ctx.stroke(); }

      // Right face (x = x0 + dx)
      ctx.fillStyle = rightFill;
      ctx.beginPath();
      ctx.moveTo(p101.px, p101.py);
      ctx.lineTo(p111.px, p111.py);
      ctx.lineTo(p110.px, p110.py);
      ctx.lineTo(p100.px, p100.py);
      ctx.closePath();
      ctx.fill();
      if (strokeCol) { ctx.strokeStyle = strokeCol; ctx.stroke(); }

      // Top face (z = z0 + dz)
      ctx.fillStyle = topFill;
      ctx.beginPath();
      ctx.moveTo(p001.px, p001.py);
      ctx.lineTo(p101.px, p101.py);
      ctx.lineTo(p111.px, p111.py);
      ctx.lineTo(p011.px, p011.py);
      ctx.closePath();
      ctx.fill();
      if (strokeCol) { ctx.strokeStyle = strokeCol; ctx.stroke(); }
    }

    function drawIsoCylinder(cx, cy, unit, x, y, z0, radius, height, bodyFill, topFill, ringStroke) {
      const bot = isoPoint(cx, cy, unit, x, y, z0);
      const top = isoPoint(cx, cy, unit, x, y, z0 + height);
      const rx = radius * 0.88 * unit;
      const ry = radius * 0.48 * unit;

      ctx.fillStyle = bodyFill;
      ctx.beginPath();
      ctx.ellipse(bot.px, bot.py, rx, ry, 0, 0, Math.PI);
      ctx.lineTo(top.px - rx, top.py);
      ctx.ellipse(top.px, top.py, rx, ry, 0, Math.PI, 0, true);
      ctx.closePath();
      ctx.fill();
      if (ringStroke) {
        ctx.strokeStyle = ringStroke;
        ctx.stroke();
      }

      ctx.fillStyle = topFill;
      ctx.beginPath();
      ctx.ellipse(top.px, top.py, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      if (ringStroke) {
        ctx.strokeStyle = ringStroke;
        ctx.stroke();
      }
    }

    function drawIsoPipe(cx, cy, unit, pts, widthPx, colorStr) {
      if (pts.length < 2) return;
      ctx.strokeStyle = colorStr;
      ctx.lineWidth = widthPx;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const p = isoPoint(cx, cy, unit, pts[i][0], pts[i][1], pts[i][2]);
        if (i === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();
    }

    // 繪製單座微縮島嶼模型 (stationIdx: 0..4)
    function drawSingleIsland(stationIdx, cx, cy, unit, phase, alpha) {
      if (alpha <= 0.02) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.lineWidth = Math.max(1, unit * 0.035);

      const strokeBase = "rgba(125, 211, 252, 0.34)";
      // 共用立體浮空建築基座島嶼 (Isometric Floating Slab)
      drawIsoBox(cx, cy, unit, -3.2, -3.2, -0.55, 6.4, 6.4, 0.55, "#0d1f38", "#071224", "#0a182e", strokeBase);
      drawIsoBox(cx, cy, unit, -2.95, -2.95, 0.0, 5.9, 5.9, 0.14, "#122947", "#0b192e", "#0e213b", "rgba(94, 234, 212, 0.28)");

      // 等距結構基準格線
      ctx.strokeStyle = "rgba(56, 189, 248, 0.11)";
      ctx.lineWidth = Math.max(1, unit * 0.02);
      ctx.beginPath();
      for (let g = -2; g <= 2; g++) {
        const a1 = isoPoint(cx, cy, unit, g * 1.2, -2.8, 0.15);
        const a2 = isoPoint(cx, cy, unit, g * 1.2, 2.8, 0.15);
        ctx.moveTo(a1.px, a1.py); ctx.lineTo(a2.px, a2.py);
        const b1 = isoPoint(cx, cy, unit, -2.8, g * 1.2, 0.15);
        const b2 = isoPoint(cx, cy, unit, 2.8, g * 1.2, 0.15);
        ctx.moveTo(b1.px, b1.py); ctx.lineTo(b2.px, b2.py);
      }
      ctx.stroke();

      if (stationIdx === 0) {
        // Station 01: RF 頂樓大型冷卻水塔散熱島 (雙座圓塔 + 旋轉播水頭水霧 + 冰水幹管)
        drawIsoPipe(cx, cy, unit, [[-2.4, 1.8, 0.25], [1.8, 1.8, 0.25], [1.8, -1.2, 0.25]], unit * 0.22, "#0ea5e9");
        drawIsoPipe(cx, cy, unit, [[-2.4, 2.25, 0.25], [2.25, 2.25, 0.25], [2.25, -1.2, 0.25]], unit * 0.18, "#34d399");

        // 主冷卻水塔 (FRP 圓塔)
        drawIsoCylinder(cx, cy, unit, -0.7, -0.5, 0.15, 1.45, 2.15, "#163554", "#0c1f36", "rgba(56, 189, 248, 0.68)");
        drawIsoCylinder(cx, cy, unit, -0.7, -0.5, 2.30, 0.92, 0.45, "#1e466e", "#061120", "rgba(94, 234, 212, 0.85)");
        // 副冷卻水塔 (並聯二號塔)
        drawIsoCylinder(cx, cy, unit, 1.45, -1.05, 0.15, 1.05, 1.75, "#132e4a", "#0a1b30", "rgba(56, 189, 248, 0.52)");

        // 旋轉播水頭十字水花動態角度
        const fanCenter = isoPoint(cx, cy, unit, -0.7, -0.5, 2.76);
        const rot = phase * Math.PI * 4;
        ctx.strokeStyle = "#5eead4";
        ctx.lineWidth = Math.max(1.5, unit * 0.06);
        for (let arm = 0; arm < 4; arm++) {
          const ang = rot + arm * (Math.PI * 0.5);
          ctx.beginPath();
          ctx.moveTo(fanCenter.px, fanCenter.py);
          ctx.lineTo(fanCenter.px + Math.cos(ang) * unit * 0.72, fanCenter.py + Math.sin(ang) * unit * 0.36);
          ctx.stroke();
        }
        // 25kg 氯錠桶示意
        drawIsoCylinder(cx, cy, unit, 1.7, 1.1, 0.15, 0.48, 0.85, "#0f766e", "#5eead4", "#fde68a");
      } else if (stationIdx === 1) {
        // Station 02: 商辦四方吹卡式冷氣 + 家用分離式四台團購島
        // 中央商辦天花板四方吹卡式機
        drawIsoBox(cx, cy, unit, -1.55, -1.55, 1.35, 2.2, 2.2, 0.42, "#1e3a5f", "#132845", "#173154", "#38bdf8");
        drawIsoBox(cx, cy, unit, -1.25, -1.25, 1.78, 1.6, 1.6, 0.12, "#091526", "#091526", "#091526", "#5eead4");

        // 四向冷氣潔淨氣流弧線
        const airOrigin = isoPoint(cx, cy, unit, -0.45, -0.45, 1.32);
        ctx.strokeStyle = "rgba(94, 234, 212, 0.65)";
        ctx.lineWidth = Math.max(1.4, unit * 0.05);
        for (let k = 0; k < 4; k++) {
          const shift = ((phase * 2 + k * 0.25) % 1) * unit * 1.1;
          ctx.beginPath();
          ctx.arc(airOrigin.px + (k - 1.5) * unit * 0.48, airOrigin.py + shift, unit * 0.32, 0.15 * Math.PI, 0.85 * Math.PI);
          ctx.stroke();
        }

        // 家用分離式四台包套團購陣列 (4 台壁掛室內機模組)
        for (let s = 0; s < 4; s++) {
          const sx = -2.3 + s * 1.35;
          drawIsoBox(cx, cy, unit, sx, 1.35, 0.35, 1.05, 0.55, 0.48, "#1e293b", "#0f172a", "#334155", "#7dd3fc");
        }
      } else if (stationIdx === 2) {
        // Station 03: 機房馬達水泵、連座軸承與 6"~10" 大口徑齒輪式蝴蝶閥島
        // 重型減震基座
        drawIsoBox(cx, cy, unit, -2.3, -1.4, 0.15, 4.4, 2.4, 0.32, "#1e293b", "#0f172a", "#172033", "rgba(245, 158, 11, 0.5)");
        // 三相感應馬達 + 聯軸器 + 離心泵浦
        drawIsoCylinder(cx, cy, unit, -1.15, -0.2, 0.48, 0.78, 1.35, "#0369a1", "#38bdf8", "#bae6fd");
        drawIsoBox(cx, cy, unit, -0.25, -0.55, 0.48, 0.65, 0.7, 0.75, "#92400e", "#78350f", "#b45309", "#fbbf24"); // NSK 連座軸承座
        drawIsoCylinder(cx, cy, unit, 0.85, -0.2, 0.48, 0.88, 1.15, "#0f766e", "#34d399", "#99f6e4");

        // 大口徑冰水立管與 8" 齒輪式蝴蝶閥手輪
        drawIsoPipe(cx, cy, unit, [[0.85, -0.2, 1.65], [0.85, -1.9, 1.65], [2.2, -1.9, 1.65]], unit * 0.3, "#38bdf8");
        const valvePos = isoPoint(cx, cy, unit, 1.55, -1.9, 1.65);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = Math.max(2, unit * 0.08);
        ctx.beginPath();
        ctx.arc(valvePos.px, valvePos.py - unit * 0.45, unit * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      } else if (stationIdx === 3) {
        // Station 04: 地下室 RC 雙格蓄水池與 Omron 61F-G2 液位極棒島
        // RC 水池外牆剖面
        drawIsoBox(cx, cy, unit, -2.5, -2.2, 0.15, 5.0, 4.2, 1.65, "rgba(15, 35, 58, 0.45)", "rgba(8, 22, 38, 0.78)", "rgba(12, 29, 48, 0.82)", "rgba(52, 211, 153, 0.65)");
        // 潔淨水體層 (動態微幅水波高度)
        const waterH = 0.92 + Math.sin(phase * Math.PI * 2) * 0.08;
        drawIsoBox(cx, cy, unit, -2.3, -2.0, 0.2, 4.6, 3.8, waterH, "rgba(16, 185, 129, 0.38)", "rgba(6, 182, 212, 0.28)", "rgba(14, 165, 233, 0.32)", "rgba(110, 231, 183, 0.7)");
        // 中央隔牆
        drawIsoBox(cx, cy, unit, -0.12, -2.0, 0.2, 0.24, 3.8, 1.55, "#334155", "#1e293b", "#0f172a", "#64748b");
        // Omron 61F-G2 保持器與三支 SUS304 不鏽鋼電極棒 (E1/E2/E3)
        drawIsoBox(cx, cy, unit, 1.55, -1.85, 1.82, 0.65, 0.55, 0.42, "#0284c7", "#0369a1", "#075985", "#fde68a");
        for (let p = 0; p < 3; p++) {
          drawIsoPipe(cx, cy, unit, [[1.7 + p * 0.18, -1.6, 1.82], [1.7 + p * 0.18, -1.6, 0.45 + p * 0.32]], Math.max(1.5, unit * 0.045), "#e2e8f0");
        }
      } else {
        // Station 05: 瑞林 RP-258 自動排水器與 25kg 90% TCCA 氯錠商城島
        // 左側：瑞林 RP-258 冷氣自動排水器精巧機體 + 透明揚程排水管
        drawIsoBox(cx, cy, unit, -2.2, -1.2, 0.2, 1.65, 1.15, 1.25, "#0ea5e9", "#0369a1", "#0284c7", "#bae6fd");
        drawIsoPipe(cx, cy, unit, [[-1.4, -0.6, 1.45], [-1.4, -0.6, 2.35], [0.2, -0.6, 2.35]], unit * 0.12, "#5eead4");

        // 右側：25kg 大桶裝 90% TCCA 氯錠雙桶棧板
        drawIsoBox(cx, cy, unit, 0.2, -1.3, 0.15, 2.35, 2.35, 0.22, "#78350f", "#451a03", "#92400e", "#f59e0b");
        drawIsoCylinder(cx, cy, unit, 0.85, -0.65, 0.38, 0.58, 1.25, "#0f766e", "#34d399", "#fde68a");
        drawIsoCylinder(cx, cy, unit, 1.90, -0.65, 0.38, 0.58, 1.25, "#0f766e", "#34d399", "#fde68a");
        drawIsoCylinder(cx, cy, unit, 1.38, 0.42, 0.38, 0.58, 1.25, "#115e59", "#5eead4", "#fde68a");
      }

      ctx.restore();
    }

    function drawIsometricDioramaWorld(ratio) {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      if (!cachedBgGrad) rebuildBaseGradient(w, h);

      const maxIdx = zoneMeta.length - 1; // 4
      const scaled = Math.max(0, Math.min(maxIdx - 0.0001, ratio * maxIdx));
      const zIdx = Math.floor(scaled);
      const zFrac = scaled - zIdx;
      const zCurr = zoneMeta[zIdx];
      const zNext = zoneMeta[Math.min(maxIdx, zIdx + 1)];
      const rgbMain = lerpColor(zCurr.primary, zNext.primary, zFrac);
      const rgbSub = lerpColor(zCurr.secondary, zNext.secondary, zFrac);

      // 1. 深邃機電夜空底層
      ctx.fillStyle = cachedBgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. 動態環境雙光暈
      const islandX = isMobile ? w * 0.5 : w * lerp(zCurr.side === "right" ? 0.66 : 0.34, zNext.side === "right" ? 0.66 : 0.34, zFrac);
      const islandY = isMobile ? h * 0.36 : h * 0.54;
      const glowR = Math.max(w, h) * 0.52;
      const glow = ctx.createRadialGradient(islandX, islandY, 0, islandX, islandY, glowR);
      glow.addColorStop(0, "rgba(" + rgbMain[0] + "," + rgbMain[1] + "," + rgbMain[2] + ", 0.22)");
      glow.addColorStop(0.55, "rgba(" + rgbSub[0] + "," + rgbSub[1] + "," + rgbSub[2] + ", 0.06)");
      glow.addColorStop(1, "rgba(3, 7, 18, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // 3. 微距水氣／潔淨氣流粒子
      const unit = Math.min(w, h) * (isMobile ? 0.082 : 0.095);
      for (let i = 0; i < ambientParticles.length; i++) {
        const pt = ambientParticles[i];
        const px = ((pt.u + Math.sin(ratio * 5 + i) * 0.04 + 1) % 1) * w;
        const py = ((pt.v - ratio * pt.speed * 2.4 + 3) % 1) * h;
        ctx.fillStyle = "rgba(" + rgbMain[0] + "," + rgbMain[1] + "," + rgbMain[2] + ", 0.24)";
        ctx.beginPath();
        ctx.arc(px, py, pt.r * (unit / 48), 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. 繪製當前與下一站 3D 等距微縮島嶼 (垂直視差電梯過渡)
      const verticalSpan = h * 0.42;
      drawSingleIsland(zIdx, islandX, islandY - zFrac * verticalSpan, unit, ratio * 3, 1 - zFrac * 0.92);
      if (zFrac > 0.04 && zIdx + 1 <= maxIdx) {
        drawSingleIsland(zIdx + 1, islandX, islandY + (1 - zFrac) * verticalSpan, unit, ratio * 3, zFrac);
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
          const cw = canvas.width, ch = canvas.height;
          const iw = img.naturalWidth, ih = img.naturalHeight;
          const scale = Math.max(cw / iw, ch / ih);
          const dw = iw * scale, dh = ih * scale;
          ctx.drawImage(img, (cw - dw) * 0.5, (ch - dh) * 0.5, dw, dh);
          return;
        }
      }
      drawIsometricDioramaWorld(ratio);
    }

    function closeHotspotPopover() {
      if (!hotspotPopover) return;
      hotspotPopover.hidden = true;
      if (hotspotCluster) {
        hotspotCluster.querySelectorAll(".mep-hotspot-pin").forEach(function (b) {
          b.setAttribute("aria-expanded", "false");
        });
      }
    }

    function renderHotspotsForZone(idx) {
      if (!hotspotCluster) return;
      const meta = zoneMeta[idx];
      if (!meta) return;
      closeHotspotPopover();
      hotspotCluster.setAttribute("data-side", meta.side);
      if (hotspotPopover) hotspotPopover.setAttribute("data-side", meta.side);
      hotspotCluster.replaceChildren();

      meta.hotspots.forEach(function (hs, hIdx) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mep-hotspot-pin";
        btn.setAttribute("aria-expanded", "false");
        const dot = document.createElement("span");
        dot.className = "mep-hotspot-beacon";
        dot.setAttribute("aria-hidden", "true");
        const txt = document.createElement("span");
        txt.textContent = hs.label;
        btn.appendChild(dot);
        btn.appendChild(txt);

        btn.addEventListener("click", function () {
          const wasOpen = btn.getAttribute("aria-expanded") === "true";
          hotspotCluster.querySelectorAll(".mep-hotspot-pin").forEach(function (other) {
            other.setAttribute("aria-expanded", "false");
          });
          if (wasOpen) {
            if (hotspotPopover) hotspotPopover.hidden = true;
            return;
          }
          btn.setAttribute("aria-expanded", "true");
          currentHotspotPreset = hs.preset || null;
          if (popTitle) popTitle.textContent = hs.label;
          if (popDesc) popDesc.textContent = hs.desc;
          if (hotspotPopover) hotspotPopover.hidden = false;
        });

        btn.dataset.hotspotIndex = String(hIdx);
        hotspotCluster.appendChild(btn);
      });
    }

    if (popClose) {
      popClose.addEventListener("click", closeHotspotPopover);
    }
    if (popCta) {
      popCta.addEventListener("click", function () {
        if (currentHotspotPreset && typeof window.hsApplyHomeQuickPreset === "function") {
          window.hsApplyHomeQuickPreset(currentHotspotPreset, true);
        }
        closeHotspotPopover();
      });
    }

    // 卡片內「帶入首頁試算」按鈕委派
    section.addEventListener("click", function (e) {
      const quickBtn = e.target.closest && e.target.closest("[data-quick-preset]");
      if (!quickBtn) return;
      try {
        const preset = JSON.parse(quickBtn.getAttribute("data-quick-preset"));
        if (typeof window.hsApplyHomeQuickPreset === "function") {
          window.hsApplyHomeQuickPreset(preset, true);
        }
      } catch (_) {}
    });

    function activateZone(idx) {
      const clamped = Math.max(0, Math.min(zoneMeta.length - 1, idx));
      const changed = (activeIndex !== clamped);
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

      if (zoneLabel) zoneLabel.textContent = zoneMeta[clamped].title;
      if (changed || (hotspotCluster && hotspotCluster.children.length === 0)) {
        renderHotspotsForZone(clamped);
      }
    }

    function updateTelemetry(ratio) {
      if (progressFill) {
        progressFill.style.width = Math.max(8, Math.round(ratio * 100)) + "%";
      }
    }

    function stopRaf() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function tick() {
      rafId = null;
      if (!isStageVisible || document.hidden) return;
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
      if (!isStageVisible || document.hidden) return;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    }

    function onScroll() {
      if (!isStageVisible) return;
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
      btn.addEventListener("click", function () { jumpToZone(idx); });
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
            if (rect.width > 0) applySplit(((clientX - rect.left) / rect.width) * 100);
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
          if (e.key === "ArrowLeft") { e.preventDefault(); applySplit(currentPct - 5); }
          else if (e.key === "ArrowRight") { e.preventDefault(); applySplit(currentPct + 5); }
          else if (e.key === "Home") { e.preventDefault(); applySplit(5); }
          else if (e.key === "End") { e.preventDefault(); applySplit(95); }
        });
        applySplit(50);
      });
    }

    // IntersectionObserver + visibilitychange 節能保護鎖
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isStageVisible = entry.isIntersecting;
          if (isStageVisible) {
            updateLayoutMetrics();
            onScroll();
            renderCanvasFrame(currentRatio);
          } else {
            stopRaf();
          }
        });
      }, { rootMargin: "200px 0px" });
      io.observe(section);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopRaf();
      } else if (isStageVisible) {
        updateLayoutMetrics();
        scheduleRender();
      }
    });

    if (mobileQuery) {
      const onBp = function (e) {
        isMobile = e.matches;
        CONFIG.lerpFactor = reducedMotion ? 0.48 : (isMobile ? 0.18 : 0.12);
        resizeCanvas();
      };
      if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", onBp);
      else if (mobileQuery.addListener) mobileQuery.addListener(onBp);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resizeCanvas, { passive: true });
    window.addEventListener("load", updateLayoutMetrics, { once: true });

    resizeCanvas();
    probeSequenceFrames();
    initBeforeAfterSliderSafe();
    activateZone(0);
    renderHotspotsForZone(0);
    onScroll();
    renderCanvasFrame(currentRatio);
  }

  // =========================================================================
  // Part B: 首頁「五站快選試算 × A/B 方案即時比價漏斗」
  // =========================================================================
  function initHomeQuickQuote() {
    const wrap = document.getElementById("home-quick-quote");
    if (!wrap) return;

    const pillBtns = Array.from(wrap.querySelectorAll(".hq-pill-btn"));
    const selPrimary = document.getElementById("hq-primary-spec");
    const lblPrimary = document.getElementById("hq-primary-label");
    const selQty = document.getElementById("hq-qty-select");
    const lblQty = document.getElementById("hq-qty-label");
    const selRegion = document.getElementById("hq-region-select");

    const chkRp258 = document.getElementById("hq-chk-rp258");
    const chkCl25 = document.getElementById("hq-chk-cl25");
    const selClQty = document.getElementById("hq-cl-qty");
    const chkLvl = document.getElementById("hq-chk-lvl");
    const chkTax = document.getElementById("hq-chk-tax");

    const outPlanA = document.getElementById("hq-out-plan-a");
    const outPlanB = document.getElementById("hq-out-plan-b");
    const outSaveDiff = document.getElementById("hq-out-save-diff");
    const outItemList = document.getElementById("hq-item-list");
    const outRuleHint = document.getElementById("hq-rule-hint");

    const btnToQuote = document.getElementById("btn-hq-to-quote");
    const btnLine = document.getElementById("btn-hq-line");
    const btnShareHash = document.getElementById("btn-hq-share-hash");

    const dock = document.getElementById("hq-floating-dock");
    const dockPriceB = document.getElementById("hq-dock-price-b");
    const dockSave = document.getElementById("hq-dock-save");
    const btnDockQuote = document.getElementById("btn-hq-dock-quote");

    const TRACK_OPTIONS = {
      cooling_tower: {
        label: "選擇冷卻水塔冷凍噸數規格",
        qtyLabel: "水塔座數規模",
        specs: [
          { val: "50", text: "50RT 以內小型商用開放式圓塔（平日 $5,500 / 專車 $7,000）", a: 7000, b: 5500 },
          { val: "100", text: "60~150RT 商辦／商場標準冷卻水塔（平日 $10,500 / 專車 $13,000）", a: 13000, b: 10500 },
          { val: "300", text: "200~350RT 廠房大型冷卻水塔（平日 $17,500 / 專車 $23,000）", a: 23000, b: 17500 },
          { val: "500", text: "350~500RT+ 特大型冷卻水塔（平日 $24,000 / 專車 $27,000）", a: 27000, b: 24000 }
        ],
        qtys: [
          { val: "0", text: "單座標準施作（+$0）", addA: 0, addB: 0 },
          { val: "1", text: "雙座並聯分批輪洗（平日 +$3,800 / 專車 +$4,500）", addA: 4500, addB: 3800 },
          { val: "2", text: "三座以上輪洗專案（平日 +$7,500 / 專車 +$9,000）", addA: 9000, addB: 7500 }
        ]
      },
      ac_cleaning: {
        label: "選擇冷氣機型與包套方案",
        qtyLabel: "包套外追加清洗台數",
        specs: [
          { val: "split", text: "家用／公設壁掛分離式 4 台內包套（平日 $10,000 / 專車 $12,500｜可鄰居湊團購）", a: 12500, b: 10000, uA: 3125, uB: 2500 },
          { val: "cassette", text: "四方吹嵌入式卡式冷氣 3 台內包套（平日 $11,000 / 專車 $13,500）", a: 13500, b: 11000, uA: 4000, uB: 3500 },
          { val: "fcu", text: "吊隱式送風機 FCU 3 台內包套（平日 $10,500 / 專車 $13,000）", a: 13000, b: 10500, uA: 3200, uB: 2800 },
          { val: "package", text: "落地箱型冷氣 2 台內包套（平日 $11,000 / 專車 $13,500）", a: 13500, b: 11000, uA: 4500, uB: 3800 },
          { val: "ahu", text: "大型中央空調箱 AHU 單座專案（平日 $12,500 / 專車 $15,000）", a: 15000, b: 12500, uA: 8500, uB: 7500 }
        ],
        qtys: [
          { val: "base", text: "標準基本包套台數內（不追加）", extra: 0 },
          { val: "add_1", text: "基本包套外追加 1 台", extra: 1 },
          { val: "add_2", text: "基本包套外追加 2 台", extra: 2 },
          { val: "add_4", text: "基本包套外追加 4 台（雙倍團購／多間辦公室）", extra: 4 }
        ]
      },
      mpv_repair: {
        label: "選擇馬達、風機、水泵或閥件檢修項目",
        qtyLabel: "同項目檢修數量（滿 2 件享 9 折）",
        specs: [
          { val: "pump_seal_bearing", text: "社區揚水／加壓馬達碳化矽機械軸封與培林搶修（平日 $5,500 / 專車 $7,500）", a: 7500, b: 5500 },
          { val: "split_major", text: "分離式／吊隱式 FCU 風扇馬達與滾珠培林更換（平日 $4,500 / 專車 $6,000）", a: 6000, b: 4500 },
          { val: "ct_sprinkler", text: "冷卻水塔旋轉播水頭總成更新（平日 $4,500 / 專車 $6,000）", a: 6000, b: 4500 },
          { val: "valve_2_4", text: "2吋~4吋 蝶閥／不鏽鋼無聲逆止閥／防震軟管抽換（平日 $11,000 / 專車 $12,000）", a: 12000, b: 11000 },
          { val: "valve_6_10", text: "6吋~10吋 大口徑齒輪式蝴蝶閥／逆止閥吊裝抽換（平日 $22,000 / 專車 $24,500）", a: 24500, b: 22000 },
          { val: "ahu_overhaul", text: "大型空調箱 AHU 重型連座軸承與皮帶輪對心大修（平日 $28,000 / 專車 $30,000）", a: 30000, b: 28000 }
        ],
        qtys: [
          { val: "1", text: "1 件／處（標準單件計價）", count: 1 },
          { val: "2", text: "2 件／處（同項滿 2 件享 9 折優惠）", count: 2 },
          { val: "3", text: "3 件／處（同項滿 2 件享 9 折優惠）", count: 3 }
        ]
      },
      water_tank: {
        label: "選擇自來水塔與蓄水池總噸數規格",
        qtyLabel: "跨棟或分池數量",
        specs: [
          { val: "10_ss", text: "10 噸內開放式白鐵單塔・全程不入槽（平日 $3,800 / 專車 $4,600）", a: 4600, b: 3800, ton: "10", mat: "stainless" },
          { val: "50", text: "20~50 噸中小型華廈上下水池（平日 $10,500 / 專車 $13,000）", a: 13000, b: 10500, ton: "50", mat: "concrete" },
          { val: "120", text: "60~120 噸標準社區大樓上下水池（平日 $17,500 / 專車 $23,000）", a: 23000, b: 17500, ton: "120", mat: "concrete" },
          { val: "200", text: "150~250 噸以上大型社區／商場雙池（平日 $24,000 / 專車 $27,000）", a: 27000, b: 24000, ton: "200", mat: "concrete" }
        ],
        qtys: [
          { val: "0", text: "單棟標準上下雙池內（+$0）", addA: 0, addB: 0 },
          { val: "1", text: "雙棟連通共 3~4 池移機（平日 +$3,800 / 專車 +$4,500）", addA: 4500, addB: 3800 },
          { val: "2", text: "多棟大型 5 池以上輪洗（平日 +$7,500 / 專車 +$9,000）", addA: 9000, addB: 7500 }
        ]
      },
      shop: {
        label: "選擇瑞林 RP-258 到府換裝或 25kg 氯錠採購",
        qtyLabel: "購買／安裝組數（桶數）",
        specs: [
          { val: "rp258_standalone", text: "瑞林 RP-258 冷氣排水器連工帶料到府換裝＋通管（每組 $3,500）", a: 3500, b: 3500 },
          { val: "chlorine_only", text: "25kg 大桶裝 90% TCCA 氯錠單購（每桶 $3,400＝商品 $2,900＋運費 $500）", a: 3400, b: 3400 }
        ],
        qtys: [
          { val: "1", text: "1 組 ／ 1 桶", count: 1 },
          { val: "2", text: "2 組 ／ 2 桶", count: 2 },
          { val: "3", text: "3 組 ／ 3 桶", count: 3 },
          { val: "5", text: "5 組 ／ 5 桶", count: 5 }
        ]
      }
    };

    let currentTrack = "cooling_tower";

    function populateTrackSelects(trackKey, keepValues) {
      currentTrack = TRACK_OPTIONS[trackKey] ? trackKey : "cooling_tower";
      const cfg = TRACK_OPTIONS[currentTrack];

      pillBtns.forEach(function (b) {
        const active = b.dataset.hqTrack === currentTrack;
        b.classList.toggle("is-selected", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });

      if (lblPrimary) lblPrimary.textContent = "1. " + cfg.label;
      if (lblQty) lblQty.textContent = "2. " + cfg.qtyLabel;

      const prevSpec = keepValues && selPrimary ? selPrimary.value : "";
      const prevQty = keepValues && selQty ? selQty.value : "";

      if (selPrimary) {
        selPrimary.innerHTML = "";
        cfg.specs.forEach(function (sp, idx) {
          const opt = document.createElement("option");
          opt.value = sp.val;
          opt.textContent = sp.text;
          if ((prevSpec && sp.val === prevSpec) || (!prevSpec && idx === (currentTrack === "cooling_tower" ? 1 : 0))) {
            opt.selected = true;
          }
          selPrimary.appendChild(opt);
        });
      }

      if (selQty) {
        selQty.innerHTML = "";
        cfg.qtys.forEach(function (qt, idx) {
          const opt = document.createElement("option");
          opt.value = qt.val;
          opt.textContent = qt.text;
          if ((prevQty && qt.val === prevQty) || (!prevQty && idx === 0)) {
            opt.selected = true;
          }
          selQty.appendChild(opt);
        });
      }
    }

    function computeState() {
      const cfg = TRACK_OPTIONS[currentTrack];
      const specVal = selPrimary ? selPrimary.value : cfg.specs[0].val;
      const qtyVal = selQty ? selQty.value : cfg.qtys[0].val;
      const specObj = cfg.specs.find(function (s) { return s.val === specVal; }) || cfg.specs[0];
      const qtyObj = cfg.qtys.find(function (q) { return q.val === qtyVal; }) || cfg.qtys[0];
      const region = selRegion ? selRegion.value : "台北市 / 新北市";
      const includeTax = Boolean(chkTax && chkTax.checked);

      const lineItems = [];
      let subA = 0, subB = 0;
      let ruleNote = "";

      if (currentTrack === "cooling_tower") {
        subA += specObj.a + (qtyObj.addA || 0);
        subB += specObj.b + (qtyObj.addB || 0);
        lineItems.push({ name: "冷卻水塔清洗（" + specObj.val + "RT 級）", a: specObj.a + (qtyObj.addA || 0), b: specObj.b + (qtyObj.addB || 0) });
        ruleNote = "搭配空調冷卻水塔清洗加購 25kg 氯錠享每桶 NT$2,900 免運費（每桶現省 $500 運費）。";
      } else if (currentTrack === "ac_cleaning") {
        const extra = qtyObj.extra || 0;
        const pA = specObj.a + extra * specObj.uA;
        const pB = specObj.b + extra * specObj.uB;
        subA += pA; subB += pB;
        lineItems.push({ name: "冷氣拆洗包套" + (extra > 0 ? "（含追加 " + extra + " 台）" : ""), a: pA, b: pB });
        ruleNote = specObj.val === "split"
          ? "家用分離式採四台包套；三台以下以四台計價，未使用台數可轉給隔壁鄰居湊團購。同日順換 RP-258 現折 $1,000 起。"
          : "四台團購規則僅適用家用分離式；商用機型依各包套台數計價。同日順換 RP-258 排水器享優惠加購價。";
      } else if (currentTrack === "mpv_repair") {
        const cnt = qtyObj.count || 1;
        const disc = cnt >= 2 ? 0.9 : 1;
        const pA = Math.round(specObj.a * cnt * disc);
        const pB = Math.round(specObj.b * cnt * disc);
        subA += pA; subB += pB;
        lineItems.push({ name: "機電檢修 × " + cnt + (cnt >= 2 ? "（滿2件9折）" : ""), a: pA, b: pB });
        ruleNote = "北部常態服務（雙北、桃園、新竹以北）；同項設備維修達 2 件以上，該維修項目全部件數享 9 折。";
      } else if (currentTrack === "water_tank") {
        const pA = specObj.a + (qtyObj.addA || 0);
        const pB = specObj.b + (qtyObj.addB || 0);
        subA += pA; subB += pB;
        lineItems.push({ name: "自來水塔與蓄水池清洗", a: pA, b: pB });
        ruleNote = "入槽作業依現場構造與風險確認通風、氣體測定及監視配置；工業級氯錠不可逕用於飲用水儲水設備。";
      } else if (currentTrack === "shop") {
        const cnt = qtyObj.count || 1;
        const pA = specObj.a * cnt;
        const pB = specObj.b * cnt;
        subA += pA; subB += pB;
        lineItems.push({ name: (specObj.val === "rp258_standalone" ? "瑞林 RP-258 到府安裝 × " : "25kg TCCA 氯錠單購含運 × ") + cnt, a: pA, b: pB });
        ruleNote = specObj.val === "rp258_standalone"
          ? "瑞林 RP-258 僅提供連工帶料到府服務（不單售裸機）；現場若決定同步洗冷氣，當場現折 $1,000。"
          : "單購氯錠每桶商品 $2,900＋運費 $500＝$3,400／桶；只有搭配空調冷卻水塔清洗才享 $2,900 免運。";
      }

      // Add-on 1: RP-258 Drain Pump
      const rpChecked = Boolean(chkRp258 && chkRp258.checked) && !(currentTrack === "shop" && specVal === "rp258_standalone");
      if (rpChecked) {
        const isAcCombo = (currentTrack === "ac_cleaning");
        const rpA = isAcCombo ? 2500 : 3500;
        const rpB = isAcCombo ? 2200 : 3500;
        subA += rpA; subB += rpB;
        lineItems.push({ name: isAcCombo ? "加購：瑞林 RP-258 順換（現折優惠）" : "加購：瑞林 RP-258 到府安裝", a: rpA, b: rpB });
      }

      // Add-on 2: 25kg TCCA Chlorine Drum
      const clChecked = Boolean(chkCl25 && chkCl25.checked) && !(currentTrack === "shop" && specVal === "chlorine_only");
      const clBuckets = Math.max(1, Math.min(10, parseInt(selClQty ? selClQty.value : "1", 10) || 1));
      if (clChecked) {
        const isFreeShip = (currentTrack === "cooling_tower");
        const unitPrice = isFreeShip ? 2900 : 3400;
        subA += unitPrice * clBuckets;
        subB += unitPrice * clBuckets;
        lineItems.push({
          name: "加購：25kg 氯錠 × " + clBuckets + " 桶" + (isFreeShip ? "（搭洗冷卻塔免運）" : "（含運 $500/桶）"),
          a: unitPrice * clBuckets,
          b: unitPrice * clBuckets
        });
      }

      // Add-on 3: Omron 61F-G2
      const lvlChecked = Boolean(chkLvl && chkLvl.checked);
      if (lvlChecked) {
        subA += 4500; subB += 4200;
        lineItems.push({ name: "加購：Omron 61F-G2 液位器＋304極棒", a: 4500, b: 4200 });
      }

      const taxA = includeTax ? Math.round(subA * 0.05) : 0;
      const taxB = includeTax ? Math.round(subB * 0.05) : 0;
      const totalA = subA + taxA;
      const totalB = subB + taxB;
      const saveDiff = Math.max(0, totalA - totalB);

      return {
        track: currentTrack,
        specVal: specVal,
        qtyVal: qtyVal,
        region: region,
        rpChecked: rpChecked,
        clChecked: clChecked,
        clBuckets: clBuckets,
        lvlChecked: lvlChecked,
        includeTax: includeTax,
        lineItems: lineItems,
        totalA: totalA,
        totalB: totalB,
        saveDiff: saveDiff,
        ruleNote: ruleNote
      };
    }

    function buildQuoteJumpUrl(st) {
      const q = new URLSearchParams();
      q.set("from", "share");
      q.set("dmode", "ab_compare");
      q.set("reg", st.region);
      q.set("tax", st.includeTax ? "1" : "0");

      const draftPatch = {
        displayMode: "ab_compare",
        region: st.region,
        chkTax: st.includeTax,
        chkLevel: st.lvlChecked,
        chkChlorine25kg: false,
        chkAcDrain: false,
        chkAddMpv: false,
        shopMode: "",
        shopQty: "1",
        updatedAt: Date.now()
      };

      if (st.track === "cooling_tower") {
        q.set("cat", "cooling_tower");
        q.set("rt", st.specVal);
        q.set("type", "open_round");
        q.set("cnt", st.qtyVal);
        draftPatch.serviceCategory = "cooling_tower";
        draftPatch.ctRtScale = st.specVal;
        draftPatch.ctTowerType = "open_round";
        draftPatch.ctTowerCount = st.qtyVal;
      } else if (st.track === "ac_cleaning") {
        q.set("cat", "ac_cleaning");
        q.set("actype", st.specVal);
        q.set("acqty", st.qtyVal);
        draftPatch.serviceCategory = "ac_cleaning";
        draftPatch.acType = st.specVal;
        draftPatch.acQty = st.qtyVal;
      } else if (st.track === "mpv_repair") {
        q.set("cat", "mpv_repair");
        q.set("addmpv", "1");
        q.set("mpvspec", st.specVal);
        q.set("mpvtier", "tier_std");
        q.set("mpvqty", st.qtyVal);
        draftPatch.serviceCategory = "mpv_repair";
        draftPatch.chkAddMpv = true;
        draftPatch.mpvSpec = st.specVal;
        draftPatch.mpvTier = "tier_std";
        draftPatch.mpvQty = st.qtyVal;
      } else if (st.track === "water_tank") {
        const tonVal = st.specVal === "10_ss" ? "10" : st.specVal;
        const matVal = st.specVal === "10_ss" ? "stainless" : "concrete";
        if (st.specVal === "10_ss") q.set("noentry", "1");
        q.set("cat", "water_tank");
        q.set("ton", tonVal);
        q.set("mat", matVal);
        q.set("pools", st.qtyVal);
        draftPatch.serviceCategory = "water_tank";
        draftPatch.wtTonnage = tonVal;
        draftPatch.wtMaterial = matVal;
        draftPatch.wtPoolCount = st.qtyVal;
      } else if (st.track === "shop") {
        if (st.specVal === "rp258_standalone") {
          q.set("cat", "mpv_repair");
          q.set("addmpv", "1");
          q.set("mpvspec", "rp258_install");
          q.set("mpvtier", "tier_std");
          q.set("shopmode", "rp258_standalone");
          q.set("shopqty", st.qtyVal);
          draftPatch.serviceCategory = "mpv_repair";
          draftPatch.chkAddMpv = true;
          draftPatch.mpvSpec = "rp258_install";
          draftPatch.mpvTier = "tier_std";
          draftPatch.shopMode = "rp258_standalone";
          draftPatch.shopQty = st.qtyVal;
        } else {
          q.set("cat", "shop_chlorine");
          q.set("cl25", "1");
          q.set("shopmode", "chlorine_only");
          q.set("shopqty", st.qtyVal);
          draftPatch.serviceCategory = "shop_chlorine";
          draftPatch.chkChlorine25kg = true;
          draftPatch.shopMode = "chlorine_only";
          draftPatch.shopQty = st.qtyVal;
        }
      }

      if (st.rpChecked) {
        if (st.track === "ac_cleaning") {
          q.set("acdrain", "1");
          draftPatch.chkAcDrain = true;
        } else {
          q.set("addmpv", "1");
          q.set("mpvspec", "rp258_install");
          q.set("mpvtier", "tier_std");
          q.set("mpvqty", "1");
          draftPatch.chkAddMpv = true;
          draftPatch.mpvSpec = "rp258_install";
          draftPatch.mpvTier = "tier_std";
          draftPatch.mpvQty = "1";
        }
      }

      if (st.clChecked) {
        q.set("cl25", "1");
        q.set("shopqty", String(st.clBuckets));
        draftPatch.chkChlorine25kg = true;
        draftPatch.shopQty = String(st.clBuckets);
        if (st.track === "cooling_tower") {
          q.set("shopmode", "chlorine_with_ct");
          draftPatch.shopMode = "chlorine_with_ct";
        } else if (st.track === "water_tank") {
          q.set("shopmode", "chlorine_with_wt");
          draftPatch.shopMode = "chlorine_with_wt";
        }
      }

      if (st.lvlChecked) {
        q.set("lvl", "1");
      }

      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftPatch));
      } catch (_) {}

      return "quote.html?" + q.toString() + "#qp-workspace-anchor";
    }

    function renderQuickQuote() {
      const st = computeState();
      const taxTag = st.includeTax ? "（含 5% 稅）" : "（未稅）";

      if (outPlanA) outPlanA.textContent = "NT$ " + st.totalA.toLocaleString();
      if (outPlanB) outPlanB.textContent = "NT$ " + st.totalB.toLocaleString();
      if (outSaveDiff) {
        outSaveDiff.textContent = st.saveDiff > 0
          ? "選平日順路方案現省 NT$ " + st.saveDiff.toLocaleString() + " " + taxTag
          : "此項目單一定價 " + taxTag;
      }
      if (outRuleHint) outRuleHint.textContent = st.ruleNote;

      if (outItemList) {
        outItemList.replaceChildren();
        st.lineItems.forEach(function (item) {
          const li = document.createElement("li");
          const s1 = document.createElement("span");
          s1.textContent = item.name;
          const s2 = document.createElement("strong");
          s2.textContent = "平日 $" + item.b.toLocaleString() + " / 專車 $" + item.a.toLocaleString();
          li.appendChild(s1);
          li.appendChild(s2);
          outItemList.appendChild(li);
        });
      }

      if (dockPriceB) dockPriceB.textContent = "NT$ " + st.totalB.toLocaleString();
      if (dockSave) {
        dockSave.textContent = st.saveDiff > 0 ? "（比專車省 $" + st.saveDiff.toLocaleString() + "）" : taxTag;
      }

      const jumpUrl = buildQuoteJumpUrl(st);
      if (btnToQuote) btnToQuote.setAttribute("data-target-url", jumpUrl);
      if (btnDockQuote) btnDockQuote.setAttribute("data-target-url", jumpUrl);
      return st;
    }

    pillBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        populateTrackSelects(btn.dataset.hqTrack, false);
        renderQuickQuote();
      });
    });

    [selPrimary, selQty, selRegion, chkRp258, chkCl25, selClQty, chkLvl, chkTax].forEach(function (el) {
      if (el) {
        el.addEventListener("change", renderQuickQuote);
      }
    });

    function goQuote() {
      const st = renderQuickQuote();
      const targetUrl = buildQuoteJumpUrl(st);
      if (typeof window.hsCanvasOpenQuotePreview === "function") {
        window.hsCanvasOpenQuotePreview(targetUrl);
        return;
      }
      window.location.href = targetUrl;
    }

    if (btnToQuote) btnToQuote.addEventListener("click", goQuote);
    if (btnDockQuote) btnDockQuote.addEventListener("click", goQuote);

    if (btnLine) {
      btnLine.addEventListener("click", function () {
        const st = renderQuickQuote();
        const lines = [
          "【皓盛官網首頁快選詢價單】",
          "案場地區：" + st.region,
          "試算項目："
        ];
        st.lineItems.forEach(function (it) {
          lines.push("- " + it.name + "（平日 $" + it.b.toLocaleString() + " / 專車 $" + it.a.toLocaleString() + "）");
        });
        lines.push("平日順路總計：NT$ " + st.totalB.toLocaleString() + (st.includeTax ? "（含稅）" : "（未稅）"));
        lines.push("指定專車總計：NT$ " + st.totalA.toLocaleString() + (st.includeTax ? "（含稅）" : "（未稅）"));
        lines.push("（依填寫資料初步試算，請協助確認現場條件與可排程時段）");
        copyTextSafe(lines.join("\n"), "已複製試算明細！正在開啟官方 LINE，貼上即可洽詢。");
        setTimeout(function () {
          window.open("https://line.me/ti/p/~0916093125", "_blank", "noopener,noreferrer");
        }, 420);
      });
    }

    if (btnShareHash) {
      btnShareHash.addEventListener("click", function () {
        const st = renderQuickQuote();
        const p = new URLSearchParams();
        p.set("t", st.track);
        p.set("s", st.specVal);
        p.set("q", st.qtyVal);
        p.set("r", st.region);
        if (st.rpChecked) p.set("rp", "1");
        if (st.clChecked) { p.set("cl", "1"); p.set("clq", String(st.clBuckets)); }
        if (st.lvlChecked) p.set("lv", "1");
        p.set("tx", st.includeTax ? "1" : "0");
        const hashStr = "#hq=" + p.toString();
        try { history.replaceState(null, "", hashStr); } catch (_) {}
        const shareUrl = window.location.origin + window.location.pathname + hashStr;
        copyTextSafe(shareUrl, "已複製專屬湊單／管委會分享網址（不含個資，打開即自動還原此試算規格）！");
      });
    }

    // 支援外部熱點或卡片一鍵套用預設組合
    window.hsApplyHomeQuickPreset = function (preset, scrollIntoViewFlag) {
      if (!preset) return;
      populateTrackSelects(preset.track || "cooling_tower", false);
      if (preset.scale && selPrimary) selPrimary.value = preset.scale;
      if (preset.acModel && selPrimary) selPrimary.value = preset.acModel;
      if (preset.mpvItem && selPrimary) selPrimary.value = preset.mpvItem;
      if (preset.wtScale && selPrimary) selPrimary.value = preset.wtScale;
      if (preset.shopItem && selPrimary) selPrimary.value = preset.shopItem;
      if (preset.mpvQty && selQty) selQty.value = String(preset.mpvQty);
      if (preset.shopQty && selQty) selQty.value = String(preset.shopQty);
      if (chkRp258) chkRp258.checked = Boolean(preset.rp258);
      if (chkCl25) chkCl25.checked = Boolean(preset.cl25);
      if (chkLvl) chkLvl.checked = Boolean(preset.lvl);
      renderQuickQuote();
      if (scrollIntoViewFlag) {
        wrap.scrollIntoView({ behavior: "smooth", block: "start" });
        showGlobalToast("已將所選工程方案帶入快選試算面板！");
      }
    };

    // 網址 #hq= 狀態自動還原
    function restoreFromHash() {
      const h = window.location.hash || "";
      if (!h.startsWith("#hq=")) return false;
      try {
        const p = new URLSearchParams(h.slice(4));
        const t = p.get("t") || "cooling_tower";
        populateTrackSelects(t, false);
        if (p.get("s") && selPrimary) selPrimary.value = p.get("s");
        if (p.get("q") && selQty) selQty.value = p.get("q");
        if (p.get("r") && selRegion) selRegion.value = p.get("r");
        if (chkRp258) chkRp258.checked = p.get("rp") === "1";
        if (chkCl25) chkCl25.checked = p.get("cl") === "1";
        if (p.get("clq") && selClQty) selClQty.value = p.get("clq");
        if (chkLvl) chkLvl.checked = p.get("lv") === "1";
        if (chkTax && p.get("tx") !== null) chkTax.checked = p.get("tx") === "1";
        renderQuickQuote();
        return true;
      } catch (_) {
        return false;
      }
    }

    // 浮動即時比價列顯示控制（進入首頁中下段時浮現，在快選面板正中間時收起避免重複）
    if (dock && "IntersectionObserver" in window) {
      let inHero = true;
      let inMep = false;
      let inFunnel = false;
      const syncDock = function () {
        dock.hidden = (inHero || inMep || inFunnel);
      };
      const heroEl = document.querySelector(".stage1-hero");
      const mepEl = document.getElementById("mep-scroll-world");
      if (heroEl) {
        new IntersectionObserver(function (entries) {
          inHero = entries[0].isIntersecting;
          syncDock();
        }, { threshold: 0.02 }).observe(heroEl);
      }
      if (mepEl) {
        new IntersectionObserver(function (entries) {
          inMep = entries[0].isIntersecting;
          syncDock();
        }, { threshold: 0.02 }).observe(mepEl);
      }
      new IntersectionObserver(function (entries) {
        inFunnel = entries[0].isIntersecting;
        syncDock();
      }, { threshold: 0.15 }).observe(wrap);
    }

    if (!restoreFromHash()) {
      populateTrackSelects("cooling_tower", false);
      renderQuickQuote();
    }
    window.addEventListener("hashchange", restoreFromHash);
  }

  function bootAll() {
    initMepScrollWorld();
    initHomeQuickQuote();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAll, { once: true });
  } else {
    bootAll();
  }
})();
