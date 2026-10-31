/**
 * 皓盛有限公司 (5390857.com) - 核心互動引擎與防呆試算系統 (cad-engine.js v2.5 (Dual-Track 50% Priority & 35% Weekday Flexible Pricing Edition))
 * 功能涵蓋：
 * 1. Before/After 清洗前後視覺對比拉桿（支援 Pointer Events 與鍵盤無障礙操作）
 * 2. 自來水塔噸數費用與停水工時試算器 ＋ 一鍵帶參複製跳轉 LINE 閉環
 * 3. 無軸文丘里物理除垢與空調冷卻水塔 ROI 節能試算器 ＋ 一鍵帶參跳轉 LINE
 * 4. 3D 互動工程施工藍圖渲染引擎（支援良機/跨廠牌水塔、免插電太陽能臭氧機箱雙模式）
 */

(function () {
  "use strict";

  const COMPANY_INFO = {
    name: "皓盛有限公司",
    taxId: "90221911",
    phone: "0916-093-125",
    lineId: "0916093125",
    lineUrl: "https://line.me/ti/p/~0916093125",
    email: "ssuyuan@kimo.com"
  };

  function showToast(message) {
    let toast = document.getElementById("hs-global-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "hs-global-toast";
      toast.className = "toast-msg";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(function () {
      toast.classList.remove("show");
    }, 3400);
  }

  function copyAndOpenLine(summaryText) {
    const fullText = "【皓盛官網 5390857.com 線上工程試算詢價】\n" + summaryText + "\n請李先生協助評估現場檔期與正式報價單！";
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText).then(function () {
          showToast("已自動複製試算規格！即將為您開啟 LINE 貼上詢價...");
          setTimeout(function () {
            window.open(COMPANY_INFO.lineUrl, "_blank", "noopener,noreferrer");
          }, 900);
        }).catch(function () {
          fallbackCopy(fullText);
        });
      } else {
        fallbackCopy(fullText);
      }
    } catch (err) {
      window.open(COMPANY_INFO.lineUrl, "_blank", "noopener,noreferrer");
    }
  }

  function fallbackCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("已複製估價規格！正在開啟 LINE（請直接長按貼上）...");
    } catch (e) {
      showToast("正在開啟 LINE 客服專線 0916-093-125...");
    }
    setTimeout(function () {
      window.open(COMPANY_INFO.lineUrl, "_blank", "noopener,noreferrer");
    }, 800);
  }

  /* 1. 初始化 Before/After 對比拉桿 */
  function initBeforeAfterSlider() {
    const sliders = document.querySelectorAll(".js-ba-slider");
    sliders.forEach(function (slider) {
      const beforeLayer = slider.querySelector(".ba-before");
      const handle = slider.querySelector(".ba-handle");
      if (!beforeLayer || !handle) return;

      let isDragging = false;

      function setPosition(clientX) {
        const rect = slider.getBoundingClientRect();
        if (rect.width <= 0) return;
        let pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(5, Math.min(95, pct));
        beforeLayer.style.width = pct.toFixed(1) + "%";
        handle.style.left = pct.toFixed(1) + "%";
      }

      slider.addEventListener("pointerdown", function (e) {
        isDragging = true;
        setPosition(e.clientX);
        if (slider.setPointerCapture) {
          try { slider.setPointerCapture(e.pointerId); } catch (err) {}
        }
      });

      slider.addEventListener("pointermove", function (e) {
        if (!isDragging) return;
        setPosition(e.clientX);
      });

      function stopDrag() {
        isDragging = false;
      }

      slider.addEventListener("pointerup", stopDrag);
      slider.addEventListener("pointercancel", stopDrag);
    });
  }

  /* 2. 初始化自來水塔噸數費用與停水工時試算器（ARGON v2.5 雙軌排程定價版：預設 50% 純益專車全責 vs 平日彈性併單 35% 純益） */
  function initWaterTankCalculator() {
    const form = document.getElementById("water-tank-calc-form");
    if (!form) return;

    const scheduleSelect = document.getElementById("calc-schedule-mode");
    const tonSelect = document.getElementById("calc-tonnage");
    const matSelect = document.getElementById("calc-material");
    const poolCountSelect = document.getElementById("calc-pool-count");
    const regionSelect = document.getElementById("calc-region");
    const chkPvcValve = document.getElementById("chk-pvc-valve");
    const chkButterfly = document.getElementById("chk-butterfly-valve");
    const chkLevel = document.getElementById("chk-level");
    const chkCool = document.getElementById("chk-cooling");
    const chkTax = document.getElementById("chk-tax");

    const outPrice = document.getElementById("calc-price-output");
    const outHours = document.getElementById("calc-hours-output");
    const outCrew = document.getElementById("calc-crew-output");
    const outSummary = document.getElementById("calc-summary-text");
    const btnCopyLine = document.getElementById("btn-calc-line");

    function calculate() {
      const scheduleMode = scheduleSelect ? scheduleSelect.value : "priority_50"; // "priority_50" or "weekday_35"
      const isPriority = (scheduleMode !== "weekday_35");
      const tonVal = parseInt(tonSelect ? tonSelect.value : "50", 10) || 50;
      const matVal = matSelect ? matSelect.value : "concrete";
      const poolLevel = parseInt(poolCountSelect ? poolCountSelect.value : "0", 10) || 0;
      const regionVal = regionSelect ? regionSelect.value : "台北市 / 新北市";

      let basePrice = isPriority ? 13000 : 10500;
      let hours = "2.5 ~ 3.0 小時";
      let crewMode = isPriority
        ? "【專車全責專案】法定局限空間3人標準編制（雙人施作戒護＋缺氧作業主管氣體測定簽證＋500萬職災團保＋價值4,500元給水機電深度健檢）"
        : "【平日彈性併單檔期】法定局限空間3人標準編制（由本公司安排平日順路時段施作，同享缺氧作業主管＋雙人戒護＋500萬職災團保）";

      if (tonVal <= 10) {
        if (matVal === "stainless" && poolLevel === 0) {
          // 頂樓單顆不鏽鋼塔（免入槽塔外高壓沖洗）
          basePrice = isPriority ? 4600 : 3800;
          hours = "1.5 ~ 2.0 小時";
          crewMode = isPriority
            ? "【指定時段專車】頂樓免入槽單人快洗編制（正職勞健保技師＋長柄高壓水刀＋次氯酸鈉消毒；同棟多顆併洗享3,000起優惠）"
            : "【平日順路併單】頂樓免入槽單人快洗編制（正職勞健保技師＋長柄高壓水刀＋次氯酸鈉消毒；同棟多顆併洗享3,000起優惠）";
        } else {
          // 地下室小型 RC 水泥池或 FRP（須入人孔局限空間作業，啟動全負擔保底價）
          basePrice = isPriority ? 13000 : 10000;
          hours = "2.0 ~ 2.5 小時";
        }
      } else if (tonVal <= 50) {
        // 20 ~ 50 噸中小型華廈上下池：預設 50% 純益 13,000 起 / 平日併單 10,500 起
        basePrice = isPriority ? 13000 : 10500;
        if (matVal === "stainless") basePrice = isPriority ? 12000 : 9800;
        hours = "2.5 ~ 3.0 小時";
      } else if (tonVal <= 120) {
        // 60 ~ 120 噸標準社區大樓上下池：預設 50% 純益 23,000 起 / 平日併單 17,500 起
        basePrice = isPriority ? 23000 : 17500;
        if (matVal === "stainless") basePrice = isPriority ? 21500 : 16500;
        hours = "3.0 ~ 3.5 小時";
      } else {
        // 150 ~ 250 噸以上大型社區上下池：預設 50% 純益 27,000 起 / 平日併單 24,000 起
        basePrice = isPriority ? 27000 : 24000;
        if (matVal === "stainless") basePrice = isPriority ? 25500 : 22500;
        hours = "3.5 ~ 4.0 小時（雙機同步高速抽排不隔夜）";
      }

      // 跨棟/多池移機工資係數（依雙軌排程自動切換：雙棟 4,500 / 3,800；多棟 9,000 / 7,500）
      let poolSurcharge = 0;
      if (poolLevel === 1) {
        poolSurcharge = isPriority ? 4500 : 3800;
        if (tonVal >= 50) hours = "3.5 ~ 4.5 小時";
      } else if (poolLevel === 2) {
        poolSurcharge = isPriority ? 9000 : 7500;
        hours = "4.0 ~ 5.5 小時（分棟分池輪流停水，不影響住戶全天用水）";
      }
      basePrice += poolSurcharge;

      const addons = ["免費附贈：Omron 61F-G2 液位迴路測試＋揚水泵浦電流檢測＋進水蝴蝶閥止水健檢（價值NT$4,500）"];
      if (chkPvcValve && chkPvcValve.checked) {
        const pvcPrice = isPriority ? 3800 : 3500;
        basePrice += pvcPrice;
        addons.push("加購 2吋內進水 PVC 球閥/青銅浮球閥更新 (+NT$" + pvcPrice.toLocaleString() + "起)");
      }
      if (chkButterfly && chkButterfly.checked) {
        const bfPrice = isPriority ? 18000 : 16500;
        basePrice += bfPrice;
        addons.push("加購 6吋~10吋 FCD/SUS304 齒輪式蝴蝶閥更換 (+NT$" + bfPrice.toLocaleString() + "起)");
      }
      if (chkLevel && chkLevel.checked) {
        const lvlPrice = isPriority ? 4500 : 4200;
        basePrice += lvlPrice;
        addons.push("加購 Omron 61F-G2 液位控制器＋304電極棒整組更新 (+NT$" + lvlPrice.toLocaleString() + ")");
      }
      if (chkCool && chkCool.checked) {
        const coolPrice = isPriority ? 6000 : 5500;
        basePrice += coolPrice;
        addons.push("加購商用空調冷卻水塔(50RT內基準)同步清洗保養 (+NT$" + coolPrice.toLocaleString() + "起)");
      }

      let maxPrice = Math.round(basePrice * 1.18);
      let taxNote = "未稅";
      if (chkTax && chkTax.checked) {
        basePrice = Math.round(basePrice * 1.05);
        maxPrice = Math.round(maxPrice * 1.05);
        taxNote = "含 5% 統一發票營業稅";
      }

      const scheduleLabel = isPriority
        ? "指定時段專車全責專案（含職安簽證＋機電深度健檢總包）"
        : "平日彈性併單特惠檔期（由皓盛安排順路時段施作）";

      if (outPrice) {
        outPrice.textContent = "NT$ " + basePrice.toLocaleString() + " ~ " + maxPrice.toLocaleString() + " 元（" + taxNote + "）";
      }
      if (outHours) {
        outHours.textContent = hours;
      }
      if (outCrew) {
        outCrew.textContent = crewMode;
      }

      const matName = matSelect && matSelect.options[matSelect.selectedIndex]
        ? matSelect.options[matSelect.selectedIndex].text
        : "RC 水泥上下池";
      const poolName = poolCountSelect && poolCountSelect.options[poolCountSelect.selectedIndex]
        ? poolCountSelect.options[poolCountSelect.selectedIndex].text
        : "標準單棟（1下池＋1上池）";

      const summary = "📍 地區：" + regionVal +
        "
📅 排程方案：" + scheduleLabel +
        "
💧 水塔規模：約 " + tonVal + " 噸（" + matName + "｜" + poolName + "）" +
        "
👷 出勤編制：" + crewMode +
        "
⏱️ 預估停水工時：" + hours +
        "
🔧 檢修與加購：" + addons.join("、") +
        "
💰 系統預估區間：NT$ " + basePrice.toLocaleString() + " ~ " + maxPrice.toLocaleString() + " 元（" + taxNote + "）";

      if (outSummary) {
        outSummary.textContent = summary.replace(/
/g, " ｜ ");
      }
      return summary;
    }

    form.addEventListener("change", calculate);
    form.addEventListener("input", calculate);
    calculate();

    if (btnCopyLine) {
      btnCopyLine.addEventListener("click", function () {
        const currentSummary = calculate();
        copyAndOpenLine(currentSummary);
      });
    }
  }

  /* 3. 初始化無軸文丘里物理除垢與冷卻水塔 ROI 試算器 */
  function initVenturiRoiCalculator() {
    const form = document.getElementById("venturi-roi-form");
    if (!form) return;

    const rtInput = document.getElementById("roi-rt");
    const hoursInput = document.getElementById("roi-hours");
    const scaleSelect = document.getElementById("roi-scale");
    const outSaveYear = document.getElementById("roi-save-year");
    const outPayback = document.getElementById("roi-payback");
    const btnRoiLine = document.getElementById("btn-roi-line");

    function calcRoi() {
      const rt = Math.max(10, parseInt(rtInput ? rtInput.value : "100", 10) || 100);
      const hrs = Math.max(4, Math.min(24, parseInt(hoursInput ? hoursInput.value : "12", 10) || 12));
      const scaleRate = parseFloat(scaleSelect ? scaleSelect.value : "0.15") || 0.15;

      // 每 RT 約耗電 0.85 kW，水垢每增厚 1mm 壓縮機耗電增加 10%~22%
      const annualKwh = rt * 0.85 * hrs * 300;
      const savedKwh = Math.round(annualKwh * scaleRate);
      const savedNtd = Math.round(savedKwh * 4.2); // 商用平均電價 4.2 元/度
      const chemSaved = Math.round(rt * 180); // 省下化學藥劑與排污費
      const totalSaved = savedNtd + chemSaved;

      const equipEst = rt <= 80 ? 38000 : (rt <= 200 ? 68000 : 115000);
      const months = Math.max(2.5, (equipEst / (totalSaved / 12))).toFixed(1);

      if (outSaveYear) {
        outSaveYear.textContent = "每年約省 NT$ " + totalSaved.toLocaleString() + " 元（省電約 " + savedKwh.toLocaleString() + " 度）";
      }
      if (outPayback) {
        outPayback.textContent = "預估約 " + months + " 個月回收設備投資";
      }

      return "⚡ 系統規模：" + rt + " RT 空調/熱水系統（每日運轉 " + hrs + " 小時）" +
        "\n📈 預估年省電費與藥劑費：NT$ " + totalSaved.toLocaleString() + " 元/年" +
        "\n⏳ 預估回本週期：約 " + months + " 個月";
    }

    form.addEventListener("change", calcRoi);
    form.addEventListener("input", calcRoi);
    calcRoi();

    if (btnRoiLine) {
      btnRoiLine.addEventListener("click", function () {
        copyAndOpenLine(calcRoi());
      });
    }
  }

  /* 4. 初始化 3D 互動施工藍圖 Canvas 引擎 */
  function init3DCadCanvas() {
    const canvas = document.getElementById("hs-cad-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mode = canvas.getAttribute("data-cad-mode") || "tower"; // "tower" or "ozone"
    let rotX = -0.35;
    let rotY = 0.65;
    let zoom = 1.0;
    let exploded = false;
    let wireframe = false;
    let isPointerDown = false;
    let lastX = 0;
    let lastY = 0;

    function resizeCanvas() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderScene();
    }

    function project3D(x, y, z, w, h) {
      // Rotate Y
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY - z * sinY;
      const z1 = z * cosY + x * sinY;
      // Rotate X
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = z1 * cosX + y * sinX;

      const fov = 420 * zoom;
      const scale = fov / (fov + z2 + 320);
      return {
        x: w / 2 + x1 * scale,
        y: h / 2 + y2 * scale,
        scale: scale
      };
    }

    function drawBox(w, h, cx, cy, cz, bw, bh, bd, strokeColor, fillColor, label) {
      const hw = bw / 2, hh = bh / 2, hd = bd / 2;
      const vertices = [
        [cx - hw, cy - hh, cz - hd], [cx + hw, cy - hh, cz - hd],
        [cx + hw, cy + hh, cz - hd], [cx - hw, cy + hh, cz - hd],
        [cx - hw, cy - hh, cz + hd], [cx + hw, cy - hh, cz + hd],
        [cx + hw, cy + hh, cz + hd], [cx - hw, cy + hh, cz + hd]
      ];
      const pts = vertices.map(function (v) { return project3D(v[0], v[1], v[2], w, h); });
      const faces = [
        [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
        [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]
      ];

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.6;
      faces.forEach(function (f) {
        ctx.beginPath();
        ctx.moveTo(pts[f[0]].x, pts[f[0]].y);
        ctx.lineTo(pts[f[1]].x, pts[f[1]].y);
        ctx.lineTo(pts[f[2]].x, pts[f[2]].y);
        ctx.lineTo(pts[f[3]].x, pts[f[3]].y);
        ctx.closePath();
        if (!wireframe && fillColor) {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        ctx.stroke();
      });

      if (label) {
        const centerPt = project3D(cx, cy - hh - 14, cz, w, h);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 12px 'Microsoft JhengHei', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, centerPt.x, centerPt.y);
      }
    }

    function renderScene() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Draw engineering grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.14)";
      ctx.lineWidth = 1;
      for (let g = -160; g <= 160; g += 40) {
        const p1 = project3D(g, 110, -160, w, h);
        const p2 = project3D(g, 110, 160, w, h);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        const p3 = project3D(-160, 110, g, w, h);
        const p4 = project3D(160, 110, g, w, h);
        ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
      }

      const gap = exploded ? 38 : 0;

      if (mode === "tower") {
        // 良機與跨廠牌水塔 3D 施工藍圖結構
        drawBox(w, h, 0, 85 + gap, 0, 150, 26, 150, "#94a3b8", "rgba(148, 163, 184, 0.2)", "防震 H 型鋼基礎底座");
        drawBox(w, h, 0, 10, 0, 125, 115, 125, "#38bdf8", "rgba(14, 165, 233, 0.22)", "水塔主體與散熱材填料區");
        drawBox(w, h, 0, -68 - gap, 0, 95, 28, 95, "#10b981", "rgba(16, 185, 129, 0.28)", "頂部散熱風機與進水播水盆");
        drawBox(w, h, -95 - gap, 45, 0, 42, 32, 42, "#f59e0b", "rgba(245, 158, 11, 0.35)", "8吋/10吋 FCD/304 蝴蝶閥組");
        drawBox(w, h, 95 + gap, -10, 0, 36, 48, 36, "#a855f7", "rgba(168, 85, 247, 0.3)", "Omron 61F-G2 液位控制箱");
      } else {
        // 免插電太陽能負壓自吸臭氧機箱 3D 結構藍圖
        drawBox(w, h, 0, -82 - gap, 0, 165, 12, 120, "#38bdf8", "rgba(14, 165, 233, 0.35)", "高效單晶矽太陽能發電模組");
        drawBox(w, h, 0, 10, 0, 115, 120, 90, "#10b981", "rgba(16, 185, 129, 0.2)", "SUS304 防水防塵臭氧機箱");
        drawBox(w, h, -30 - gap / 2, 10, 0, 40, 55, 45, "#f59e0b", "rgba(245, 158, 11, 0.38)", "MPPT 控制器與磷酸鐵鋰電池");
        drawBox(w, h, 35 + gap / 2, 15, 0, 38, 65, 38, "#ec4899", "rgba(236, 72, 153, 0.35)", "石英管高濃度臭氧發生器");
        drawBox(w, h, 0, 88 + gap, 0, 140, 26, 40, "#06b6d4", "rgba(6, 182, 212, 0.38)", "無軸文丘里負壓自吸混合管路");
      }
    }

    canvas.addEventListener("pointerdown", function (e) {
      isPointerDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    window.addEventListener("pointermove", function (e) {
      if (!isPointerDown) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      rotY += dx * 0.01;
      rotX = Math.max(-1.2, Math.min(1.2, rotX + dy * 0.01));
      renderScene();
    });

    window.addEventListener("pointerup", function () {
      isPointerDown = false;
    });

    const btnExplode = document.getElementById("cad-btn-explode");
    const btnWire = document.getElementById("cad-btn-wire");
    const btnReset = document.getElementById("cad-btn-reset");

    if (btnExplode) {
      btnExplode.addEventListener("click", function () {
        exploded = !exploded;
        btnExplode.classList.toggle("active", exploded);
        renderScene();
      });
    }
    if (btnWire) {
      btnWire.addEventListener("click", function () {
        wireframe = !wireframe;
        btnWire.classList.toggle("active", wireframe);
        renderScene();
      });
    }
    if (btnReset) {
      btnReset.addEventListener("click", function () {
        rotX = -0.35;
        rotY = 0.65;
        zoom = 1.0;
        exploded = false;
        wireframe = false;
        if (btnExplode) btnExplode.classList.remove("active");
        if (btnWire) btnWire.classList.remove("active");
        renderScene();
      });
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBeforeAfterSlider();
    initWaterTankCalculator();
    initVenturiRoiCalculator();
    init3DCadCanvas();
  });
})();
