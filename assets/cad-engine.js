/**
 * 皓盛有限公司 (5390857.com) - 雙引擎試算與視覺互動核心系統 (v6.0 Golden Dual-Engine Edition)
 * 100% 專攻：
 * 1. Before/After 清洗前後視覺對比拉桿（支援 Pointer Events 與手機防跳頁保護）
 * 2. 社區大樓自來水塔 A/B 雙軌排程費用與停水工時試算器 ＋ 一鍵帶參複製跳轉 LINE
 * 3. 商用空調冷卻水塔（10RT~500RT+）A/B 雙軌排程費用與閥件檢修試算器 ＋ 一鍵帶參跳轉 LINE
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

  /* 2. 第一引擎：自來水塔噸數費用與停水工時 A/B 雙軌試算器 */
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
      const scheduleMode = scheduleSelect ? scheduleSelect.value : "priority_50";
      const isPriority = (scheduleMode !== "weekday_35");
      const tonVal = parseInt(tonSelect ? tonSelect.value : "50", 10) || 50;
      const matVal = matSelect ? matSelect.value : "concrete";
      const poolLevel = parseInt(poolCountSelect ? poolCountSelect.value : "0", 10) || 0;
      const regionVal = regionSelect ? regionSelect.value : "台北市 / 新北市";

      let basePrice = isPriority ? 13000 : 10500;
      let hours = "2.5 ~ 3.0 小時";
      let crewMode = isPriority
        ? "【A方案：專車全責】法定局限空間3人標準編制（雙人施作戒護＋缺氧作業主管氣體測定簽證＋500萬職災團保＋價值4,500元給水機電深度健檢）"
        : "【B方案：平日彈性併單】法定局限空間3人標準編制（由本公司安排平日順路時段施作，同享缺氧作業主管＋雙人戒護＋500萬職災團保）";

      if (tonVal <= 10) {
        if (matVal === "stainless" && poolLevel === 0) {
          basePrice = isPriority ? 4600 : 3800;
          hours = "1.5 ~ 2.0 小時";
          crewMode = isPriority
            ? "【指定時段專車】頂樓免入槽單人快洗編制（正職勞健保技師＋長柄高壓水刀＋次氯酸鈉消毒；同棟多顆併洗享3,000起優惠）"
            : "【平日順路併單】頂樓免入槽單人快洗編制（正職勞健保技師＋長柄高壓水刀＋次氯酸鈉消毒；同棟多顆併洗享3,000起優惠）";
        } else {
          basePrice = isPriority ? 13000 : 10000;
          hours = "2.0 ~ 2.5 小時";
        }
      } else if (tonVal <= 50) {
        basePrice = isPriority ? 13000 : 10500;
        if (matVal === "stainless") basePrice = isPriority ? 12000 : 9800;
        hours = "2.5 ~ 3.0 小時";
      } else if (tonVal <= 120) {
        basePrice = isPriority ? 23000 : 17500;
        if (matVal === "stainless") basePrice = isPriority ? 21500 : 16500;
        hours = "3.0 ~ 3.5 小時";
      } else {
        basePrice = isPriority ? 27000 : 24000;
        if (matVal === "stainless") basePrice = isPriority ? 25500 : 22500;
        hours = "3.5 ~ 4.0 小時（雙機同步高速抽排不隔夜）";
      }

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
        ? "A方案：指定時段專車全責專案（含職安簽證＋機電深度健檢總包）"
        : "B方案：平日彈性併單特惠檔期（由皓盛安排順路時段施作）";

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

      const summary = "【自來水塔與蓄水池清洗詢價】" +
        "\n📍 地區：" + regionVal +
        "\n📅 排程方案：" + scheduleLabel +
        "\n💧 水塔規模：約 " + tonVal + " 噸（" + matName + "｜" + poolName + "）" +
        "\n👷 出勤編制：" + crewMode +
        "\n⏱️ 預估停水工時：" + hours +
        "\n🔧 檢修與加購：" + addons.join("、") +
        "\n💰 系統預估區間：NT$ " + basePrice.toLocaleString() + " ~ " + maxPrice.toLocaleString() + " 元（" + taxNote + "）";

      if (outSummary) {
        outSummary.textContent = summary.replace(/\n/g, " ｜ ");
      }
      return summary;
    }

    form.addEventListener("change", calculate);
    form.addEventListener("input", calculate);
    calculate();

    if (btnCopyLine) {
      btnCopyLine.addEventListener("click", function () {
        copyAndOpenLine(calculate());
      });
    }
  }

  /* 3. 第二引擎：商用空調冷卻水塔（10RT~500RT+）A/B 雙軌排程與閥件試算器 */
  function initCoolingTowerCalculator() {
    const form = document.getElementById("cooling-tower-calc-form");
    if (!form) return;

    const scheduleSelect = document.getElementById("ct-schedule-mode");
    const regionSelect = document.getElementById("ct-region");
    const rtSelect = document.getElementById("ct-rt-scale");
    const typeSelect = document.getElementById("ct-tower-type");
    const countSelect = document.getElementById("ct-tower-count");

    const chkFill = document.getElementById("ct-chk-fill");
    const chkButterfly = document.getElementById("ct-chk-butterfly");
    const chkBallValve = document.getElementById("ct-chk-ballvalve");
    const chkInverter = document.getElementById("ct-chk-inverter");
    const chkTax = document.getElementById("ct-chk-tax");

    const outPrice = document.getElementById("ct-price-output");
    const outHours = document.getElementById("ct-hours-output");
    const outCrew = document.getElementById("ct-crew-output");
    const outSummary = document.getElementById("ct-summary-text");
    const btnCtLine = document.getElementById("btn-ct-line");

    function calcCoolingTower() {
      const scheduleMode = scheduleSelect ? scheduleSelect.value : "priority_50";
      const isPriority = (scheduleMode !== "weekday_35");
      const regionVal = regionSelect ? regionSelect.value : "台北市 / 新北市";
      const rtVal = parseInt(rtSelect ? rtSelect.value : "100", 10) || 100;
      const towerType = typeSelect ? typeSelect.value : "open_round";
      const countLevel = parseInt(countSelect ? countSelect.value : "0", 10) || 0;

      let basePrice = isPriority ? 13000 : 10500;
      let hours = "2.5 ~ 3.5 小時";
      let crewMode = isPriority
        ? "【A方案：專車全責】正職勞健保雙人機電技師＋風機斷電上鎖(LOTO)戒護＋500萬職災團保＋風機電流與軸承點檢"
        : "【B方案：平日彈性併單】由本公司安排平日順路時段進場，同享正職勞健保雙人技師＋風機電流點檢＋500萬職災團保";

      if (rtVal <= 50) {
        // 50RT 以內小型冷卻水塔
        basePrice = isPriority ? 7000 : 5500;
        hours = "2.0 ~ 2.5 小時";
      } else if (rtVal <= 150) {
        // 60RT ~ 150RT 中型商場/商辦冷卻水塔（半日併單成本 6,500 -> 專車 13,000 實拿 50% 純益）
        basePrice = isPriority ? 13000 : 10500;
        hours = "2.5 ~ 3.5 小時";
      } else if (rtVal <= 350) {
        // 200RT ~ 350RT 中大型廠房/量販店冷卻水塔（全日3人高處與入塔編制成本 11,500 -> 專車 23,000 實拿 50% 純益）
        basePrice = isPriority ? 23000 : 17500;
        hours = "3.5 ~ 4.5 小時";
        crewMode = isPriority
          ? "【A方案：大型塔高處/入塔3人編制】雙人塔內外協作＋職安主管戒護＋500萬團保＋免費風機馬達絕緣與電流測試"
          : "【B方案：平日併單3人編制】雙人塔內外協作＋職安主管戒護＋500萬團保＋免費風機馬達電流測試";
      } else {
        // 400RT ~ 500RT 以上巨型水塔組（全日雙機成本 13,500 -> 專車 27,000 實拿 50% 純益）
        basePrice = isPriority ? 27000 : 24000;
        hours = "4.0 ~ 5.5 小時（雙機高壓水刀與工業吸塵同步施作）";
        crewMode = "【巨型水塔全責3人編制】雙機同步清洗＋高處防墜與入塔職安主管戒護＋500萬職災團保＋空調水系統閥件全檢";
      }

      // 密閉式水塔或方型多格水塔結構加權
      if (towerType === "closed_circuit") {
        basePrice += isPriority ? 3000 : 2500;
      } else if (towerType === "open_square") {
        basePrice += isPriority ? 1500 : 1000;
      }

      // 多座並聯冷卻水塔移機加價
      if (countLevel === 1) {
        basePrice += isPriority ? 4500 : 3800;
        hours = "3.5 ~ 5.0 小時（雙塔輪流清洗，主機可降載不斷空調）";
      } else if (countLevel === 2) {
        basePrice += isPriority ? 9000 : 7500;
        hours = "5.0 ~ 6.5 小時（多塔分批輪洗，維持商場/廠房空調運轉）";
      }

      const addons = ["免費附贈：散熱風機馬達運轉電流檢測＋皮帶張力點檢＋播水盆噴孔疏通＋進水浮球止水檢查"];
      if (chkFill && chkFill.checked) {
        const fillPrice = isPriority ? 8500 : 7500;
        basePrice += fillPrice;
        addons.push("加購散熱材(PVC膠片填料)局部深度除垢或更新預估 (+NT$" + fillPrice.toLocaleString() + "起)");
      }
      if (chkButterfly && chkButterfly.checked) {
        const bfPrice = isPriority ? 18000 : 16500;
        basePrice += bfPrice;
        addons.push("加購 6吋~10吋 FCD/SUS304 齒輪式蝴蝶閥更換 (+NT$" + bfPrice.toLocaleString() + "起)");
      }
      if (chkBallValve && chkBallValve.checked) {
        const bvPrice = isPriority ? 3800 : 3500;
        basePrice += bvPrice;
        addons.push("加購補給水 PVC 球閥 / 青銅浮球閥更新 (+NT$" + bvPrice.toLocaleString() + "起)");
      }
      if (chkInverter && chkInverter.checked) {
        const invPrice = isPriority ? 4500 : 4200;
        basePrice += invPrice;
        addons.push("加購東元 TECO F510 變頻器參數節能調校與溫控連動點檢 (+NT$" + invPrice.toLocaleString() + ")");
      }

      let maxPrice = Math.round(basePrice * 1.18);
      let taxNote = "未稅";
      if (chkTax && chkTax.checked) {
        basePrice = Math.round(basePrice * 1.05);
        maxPrice = Math.round(maxPrice * 1.05);
        taxNote = "含 5% 統一發票營業稅";
      }

      const scheduleLabel = isPriority
        ? "A方案：指定時段專車全責專案（含職安戒護＋空調機電深度點檢）"
        : "B方案：平日彈性併單特惠檔期（由皓盛安排平日順路時段施作）";

      if (outPrice) {
        outPrice.textContent = "NT$ " + basePrice.toLocaleString() + " ~ " + maxPrice.toLocaleString() + " 元（" + taxNote + "）";
      }
      if (outHours) {
        outHours.textContent = hours;
      }
      if (outCrew) {
        outCrew.textContent = crewMode;
      }

      const typeName = typeSelect && typeSelect.options[typeSelect.selectedIndex]
        ? typeSelect.options[typeSelect.selectedIndex].text
        : "良機/跨廠牌圓型開放式水塔";
      const countName = countSelect && countSelect.options[countSelect.selectedIndex]
        ? countSelect.options[countSelect.selectedIndex].text
        : "單座標準冷卻水塔";

      const summary = "【商用空調冷卻水塔清洗保養詢價】" +
        "\n📍 地區：" + regionVal +
        "\n📅 排程方案：" + scheduleLabel +
        "\n❄️ 水塔規模：約 " + rtVal + " RT 冷凍噸（" + typeName + "｜" + countName + "）" +
        "\n👷 出勤編制：" + crewMode +
        "\n⏱️ 預估施工工時：" + hours +
        "\n🔧 檢修與加購：" + addons.join("、") +
        "\n💰 系統預估區間：NT$ " + basePrice.toLocaleString() + " ~ " + maxPrice.toLocaleString() + " 元（" + taxNote + "）";

      if (outSummary) {
        outSummary.textContent = summary.replace(/\n/g, " ｜ ");
      }
      return summary;
    }

    form.addEventListener("change", calcCoolingTower);
    form.addEventListener("input", calcCoolingTower);
    calcCoolingTower();

    if (btnCtLine) {
      btnCtLine.addEventListener("click", function () {
        copyAndOpenLine(calcCoolingTower());
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBeforeAfterSlider();
    initWaterTankCalculator();
    initCoolingTowerCalculator();
  });
})();
