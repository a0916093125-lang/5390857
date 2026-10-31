/**
 * 皓盛有限公司 (5390857.com) - 雙引擎試算與 A/B 雙軌正式報價單核心系統 (v7.0)
 * 涵蓋模組：
 * 1. Before/After 清洗前後視覺對比拉桿（Pointer Events 手機防跳頁保護）
 * 2. 社區大樓自來水塔 A/B 雙軌試算器 ＋ 跨頁自動帶入報價單生成器 (localStorage)
 * 3. 商用空調冷卻水塔（10RT~500RT+）A/B 雙軌試算器 ＋ 跨頁自動帶入報價單生成器
 * 4. 正式工程報價單生成器 (quote.html)：支援 A/B 雙軌並陳、單一方案鎖定、自訂工項折讓、5% 營業稅、台幣國字大寫金額與 A4 PDF 列印
 */

(function () {
  "use strict";

  const COMPANY_INFO = {
    name: "皓盛有限公司",
    taxId: "90221911",
    owner: "李思遠",
    phone: "0916-093-125",
    lineId: "0916093125",
    lineUrl: "https://line.me/ti/p/~0916093125",
    email: "ssuyuan@kimo.com"
  };

  const DRAFT_STORAGE_KEY = "hs_5390857_quote_draft_v7";

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

  function saveQuoteDraft(draftObj) {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftObj));
    } catch (e) {}
  }

  function loadQuoteDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function copyAndOpenLine(summaryText, customHeader) {
    const header = customHeader || "【皓盛官網 5390857.com 線上工程試算詢價】";
    const fullText = header + "\n" + summaryText + "\n請李先生協助評估現場檔期與正式報價單！";
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText).then(function () {
          showToast("已自動複製完整報價內容！即將為您開啟 LINE 貼上...");
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
      showToast("已複製報價規格！正在開啟 LINE（請直接長按貼上）...");
    } catch (e) {
      showToast("正在開啟 LINE 客服專線 0916-093-125...");
    }
    setTimeout(function () {
      window.open(COMPANY_INFO.lineUrl, "_blank", "noopener,noreferrer");
    }, 800);
  }

  /* 將阿拉伯數字轉換為台灣正式會計國字大寫金額（壹、貳、參...元整） */
  function toTaiwaneseUpperCurrency(amount) {
    let num = Math.round(Number(amount) || 0);
    if (num <= 0) return "零元整";
    const digits = ["零", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖"];
    const units = ["", "拾", "佰", "仟"];
    const bigUnits = ["", "萬", "億"];

    let str = "";
    let groupIndex = 0;
    let needZero = false;

    while (num > 0) {
      const group = num % 10000;
      if (group !== 0) {
        let groupStr = "";
        let temp = group;
        for (let i = 0; i < 4 && temp > 0; i++) {
          const d = temp % 10;
          if (d !== 0) {
            groupStr = digits[d] + units[i] + groupStr;
            needZero = false;
          } else {
            if (!needZero && groupStr.length > 0) {
              groupStr = "零" + groupStr;
              needZero = true;
            }
          }
          temp = Math.floor(temp / 10);
        }
        if (group < 1000 && Math.floor(num / 10000) > 0) {
          groupStr = "零" + groupStr;
        }
        str = groupStr + bigUnits[groupIndex] + str;
      } else if (str.length > 0 && !str.startsWith("零")) {
        str = "零" + str;
      }
      num = Math.floor(num / 10000);
      groupIndex++;
    }
    str = str.replace(/零+/g, "零").replace(/^零|零$/g, "");
    return "新臺幣 " + str + " 元整";
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
    const btnToQuote = document.getElementById("btn-calc-to-quote");

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

      // 儲存跨頁報價單草稿
      saveQuoteDraft({
        serviceCategory: (chkCool && chkCool.checked) ? "both" : "water_tank",
        region: regionVal,
        wtTonnage: String(tonVal),
        wtMaterial: matVal,
        wtPoolCount: String(poolLevel),
        chkPvcValve: Boolean(chkPvcValve && chkPvcValve.checked),
        chkButterfly: Boolean(chkButterfly && chkButterfly.checked),
        chkLevel: Boolean(chkLevel && chkLevel.checked),
        chkTax: Boolean(chkTax && chkTax.checked)
      });

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
    if (btnToQuote) {
      btnToQuote.addEventListener("click", function () {
        calculate();
        window.location.href = "quote.html?from=water-tank";
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
    const btnCtToQuote = document.getElementById("btn-ct-to-quote");

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
        basePrice = isPriority ? 7000 : 5500;
        hours = "2.0 ~ 2.5 小時";
      } else if (rtVal <= 150) {
        basePrice = isPriority ? 13000 : 10500;
        hours = "2.5 ~ 3.5 小時";
      } else if (rtVal <= 350) {
        basePrice = isPriority ? 23000 : 17500;
        hours = "3.5 ~ 4.5 小時";
        crewMode = isPriority
          ? "【A方案：大型塔高處/入塔3人編制】雙人塔內外協作＋職安主管戒護＋500萬團保＋免費風機馬達絕緣與電流測試"
          : "【B方案：平日併單3人編制】雙人塔內外協作＋職安主管戒護＋500萬團保＋免費風機馬達電流測試";
      } else {
        basePrice = isPriority ? 27000 : 24000;
        hours = "4.0 ~ 5.5 小時（雙機高壓水刀與工業吸塵同步施作）";
        crewMode = "【巨型水塔全責3人編制】雙機同步清洗＋高處防墜與入塔職安主管戒護＋500萬職災團保＋空調水系統閥件全檢";
      }

      if (towerType === "closed_circuit") {
        basePrice += isPriority ? 3000 : 2500;
      } else if (towerType === "open_square") {
        basePrice += isPriority ? 1500 : 1000;
      }

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

      saveQuoteDraft({
        serviceCategory: "cooling_tower",
        region: regionVal,
        ctRtScale: String(rtVal),
        ctTowerType: towerType,
        ctTowerCount: String(countLevel),
        chkFill: Boolean(chkFill && chkFill.checked),
        chkButterfly: Boolean(chkButterfly && chkButterfly.checked),
        chkPvcValve: Boolean(chkBallValve && chkBallValve.checked),
        chkInverter: Boolean(chkInverter && chkInverter.checked),
        chkTax: Boolean(chkTax && chkTax.checked)
      });

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
    if (btnCtToQuote) {
      btnCtToQuote.addEventListener("click", function () {
        calcCoolingTower();
        window.location.href = "quote.html?from=cooling-tower";
      });
    }
  }

  /* 4. 第三引擎：A/B 雙軌正式工程報價單生成器 (quote.html) */
  function initQuoteGenerator() {
    const form = document.getElementById("hs-quote-builder-form");
    if (!form) return;

    // 表單控制項
    const elDisplayMode = document.getElementById("q-display-mode"); // "ab_compare", "only_a", "only_b"
    const elCategory = document.getElementById("q-service-category"); // "water_tank", "cooling_tower", "both"
    const elClientName = document.getElementById("q-client-name");
    const elContactPerson = document.getElementById("q-contact-person");
    const elClientAddr = document.getElementById("q-client-addr");
    const elDocNo = document.getElementById("q-doc-no");
    const elDocDate = document.getElementById("q-doc-date");

    // 自來水塔設定區
    const boxWtGroup = document.getElementById("q-wt-group");
    const elWtTonnage = document.getElementById("q-wt-tonnage");
    const elWtMaterial = document.getElementById("q-wt-material");
    const elWtPools = document.getElementById("q-wt-pools");

    // 空調冷卻水塔設定區
    const boxCtGroup = document.getElementById("q-ct-group");
    const elCtRt = document.getElementById("q-ct-rt");
    const elCtType = document.getElementById("q-ct-type");
    const elCtCount = document.getElementById("q-ct-count");

    // 機電閥件與自訂加購區
    const chkPvc = document.getElementById("q-chk-pvc");
    const chkLevel = document.getElementById("q-chk-level");
    const chkButterfly = document.getElementById("q-chk-butterfly");
    const chkFill = document.getElementById("q-chk-fill");
    const chkInverter = document.getElementById("q-chk-inverter");

    const elCustomName = document.getElementById("q-custom-name");
    const elCustomPrice = document.getElementById("q-custom-price");
    const elTaxMode = document.getElementById("q-tax-mode"); // "include_5" or "exclude_5"

    // 右側 A4 報價單預覽 DOM
    const outClientName = document.getElementById("qp-out-client");
    const outContact = document.getElementById("qp-out-contact");
    const outAddr = document.getElementById("qp-out-addr");
    const outDocNo = document.getElementById("qp-out-docno");
    const outDocDate = document.getElementById("qp-out-date");
    const outThead = document.getElementById("qp-table-thead");
    const outTbody = document.getElementById("qp-table-tbody");
    const outSummaryArea = document.getElementById("qp-summary-area");
    const outDecisionArea = document.getElementById("qp-decision-area");

    const btnPrintPdf = document.getElementById("btn-q-print");
    const btnCopyLine = document.getElementById("btn-q-line");
    const btnLoadDraft = document.getElementById("btn-q-load-draft");

    // 初始化預設日期與報價單號
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    if (elDocDate && !elDocDate.value) {
      elDocDate.value = yyyy + "-" + mm + "-" + dd;
    }
    if (elDocNo && !elDocNo.value) {
      elDocNo.value = "HS-" + yyyy + mm + dd + "-01";
    }

    // 若從試算器跳轉過來，自動套用草稿
    function applyStoredDraft(showNotification) {
      const draft = loadQuoteDraft();
      if (!draft) {
        if (showNotification) showToast("目前尚無跨頁試算紀錄，已為您維持預設標準規格！");
        return;
      }
      if (draft.serviceCategory && elCategory) elCategory.value = draft.serviceCategory;
      if (draft.region && elClientAddr && !elClientAddr.value) elClientAddr.value = draft.region;
      if (draft.wtTonnage && elWtTonnage) elWtTonnage.value = draft.wtTonnage;
      if (draft.wtMaterial && elWtMaterial) elWtMaterial.value = draft.wtMaterial;
      if (draft.wtPoolCount && elWtPools) elWtPools.value = draft.wtPoolCount;
      if (draft.ctRtScale && elCtRt) elCtRt.value = draft.ctRtScale;
      if (draft.ctTowerType && elCtType) elCtType.value = draft.ctTowerType;
      if (draft.ctTowerCount && elCtCount) elCtCount.value = draft.ctTowerCount;

      if (chkPvc) chkPvc.checked = Boolean(draft.chkPvcValve);
      if (chkButterfly) chkButterfly.checked = Boolean(draft.chkButterfly);
      if (chkLevel) chkLevel.checked = Boolean(draft.chkLevel);
      if (chkFill) chkFill.checked = Boolean(draft.chkFill);
      if (chkInverter) chkInverter.checked = Boolean(draft.chkInverter);
      if (elTaxMode && draft.chkTax !== undefined) {
        elTaxMode.value = draft.chkTax ? "include_5" : "exclude_5";
      }
      renderQuotation();
      if (showNotification) showToast("✓ 已成功載入您剛才在試算器的勾選規格！");
    }

    function renderQuotation() {
      const displayMode = elDisplayMode ? elDisplayMode.value : "ab_compare";
      const cat = elCategory ? elCategory.value : "water_tank";

      if (boxWtGroup) {
        boxWtGroup.style.display = (cat === "water_tank" || cat === "both") ? "block" : "none";
      }
      if (boxCtGroup) {
        boxCtGroup.style.display = (cat === "cooling_tower" || cat === "both") ? "block" : "none";
      }

      const clientName = (elClientName && elClientName.value.trim()) ? elClientName.value.trim() : "貴社區管理委員會 ／ 貴公司廠務部";
      const contactPerson = (elContactPerson && elContactPerson.value.trim()) ? elContactPerson.value.trim() : "總幹事 ／ 專案負責人 鈞啟";
      const clientAddr = (elClientAddr && elClientAddr.value.trim()) ? elClientAddr.value.trim() : "雙北・桃園・新竹服務案場";
      const docNo = (elDocNo && elDocNo.value.trim()) ? elDocNo.value.trim() : ("HS-" + yyyy + mm + dd + "-01");
      const docDate = (elDocDate && elDocDate.value.trim()) ? elDocDate.value.trim() : (yyyy + "-" + mm + "-" + dd);

      if (outClientName) outClientName.textContent = clientName;
      if (outContact) outContact.textContent = contactPerson;
      if (outAddr) outAddr.textContent = clientAddr;
      if (outDocNo) outDocNo.textContent = docNo;
      if (outDocDate) outDocDate.textContent = docDate + "（報價有效期限 15 天）";

      const items = [];

      // 1. 計算自來水塔主工項
      if (cat === "water_tank" || cat === "both") {
        const ton = parseInt(elWtTonnage ? elWtTonnage.value : "120", 10) || 120;
        const mat = elWtMaterial ? elWtMaterial.value : "concrete";
        const poolLv = parseInt(elWtPools ? elWtPools.value : "0", 10) || 0;

        let priceA = 23000;
        let priceB = 17500;
        let specDesc = "含高壓水刀除垢、50ppm食品級次氯酸鈉消毒、法定缺氧作業主管氣體測定與雙人專責戒護";

        if (ton <= 10) {
          if (mat === "stainless" && poolLv === 0) {
            priceA = 4600;
            priceB = 3800;
            specDesc = "頂樓免入槽單人快洗編制（正職勞健保技師＋高壓水刀除垢＋次氯酸鈉消毒）";
          } else {
            priceA = 13000;
            priceB = 10000;
            specDesc = "10噸內入槽RC水池（依法配置3人局限空間標準編制：缺氧作業主管＋雙人戒護＋送風與氣體測定）";
          }
        } else if (ton <= 50) {
          priceA = (mat === "stainless") ? 12000 : 13000;
          priceB = (mat === "stainless") ? 9800 : 10500;
        } else if (ton <= 120) {
          priceA = (mat === "stainless") ? 21500 : 23000;
          priceB = (mat === "stainless") ? 16500 : 17500;
        } else {
          priceA = (mat === "stainless") ? 25500 : 27000;
          priceB = (mat === "stainless") ? 22500 : 24000;
          specDesc += "（採用雙機大口徑沉水泵浦同步高速抽排，停水控制在 3.5~4 小時內）";
        }

        const matLabel = (mat === "stainless") ? "SUS304 不鏽鋼水塔" : (mat === "frp" ? "FRP 組合式水塔" : "RC 鋼筋水泥上下蓄水池");
        items.push({
          title: "社區／商辦自來水塔與蓄水池高壓清洗消毒工程（約 " + ton + " 噸級）",
          spec: matLabel + "｜" + specDesc,
          unit: "1 式",
          priceA: priceA,
          priceB: priceB
        });

        if (poolLv === 1) {
          items.push({
            title: "雙棟或分區連通水池跨棟移機作業費（共 3 ~ 4 池）",
            spec: "雙套沉水泵浦、高壓機具與水帶跨棟移設及分池排氣復歸",
            unit: "1 式",
            priceA: 4500,
            priceB: 3800
          });
        } else if (poolLv === 2) {
          items.push({
            title: "大型多棟社區連通水池分棟輪洗作業費（共 5 池以上）",
            spec: "分棟分池輪流停水抽排，確保住戶非停水棟別正常供水",
            unit: "1 式",
            priceA: 9000,
            priceB: 7500
          });
        }

        // 免費附贈高價值機電健檢項（錨定價值 NT$4,500）
        items.push({
          title: "【專案贈送】給水機電系統深度安全健檢簽證（原價 NT$4,500）",
          spec: "含 Omron 61F-G2 液位控制器迴路測試、E1~E3 電極棒水垢清除、揚水馬達電流實測與進水閥止水檢查",
          unit: "1 式",
          priceA: 0,
          priceB: 0,
          isFreeGift: true
        });
      }

      // 2. 計算商用空調冷卻水塔主工項
      if (cat === "cooling_tower" || cat === "both") {
        const rt = parseInt(elCtRt ? elCtRt.value : "100", 10) || 100;
        const ctType = elCtType ? elCtType.value : "open_round";
        const ctCount = parseInt(elCtCount ? elCtCount.value : "0", 10) || 0;

        let ctA = 13000;
        let ctB = 10500;
        if (rt <= 50) {
          ctA = 7000; ctB = 5500;
        } else if (rt <= 150) {
          ctA = 13000; ctB = 10500;
        } else if (rt <= 350) {
          ctA = 23000; ctB = 17500;
        } else {
          ctA = 27000; ctB = 24000;
        }

        if (ctType === "closed_circuit") {
          ctA += 3000; ctB += 2500;
        } else if (ctType === "open_square") {
          ctA += 1500; ctB += 1000;
        }

        const typeLabel = (ctType === "closed_circuit") ? "密閉式冷卻水塔" : (ctType === "open_square" ? "方型開放式水塔" : "良機/跨廠牌圓型開放式水塔");
        items.push({
          title: "商用中央空調冷卻水塔深度清洗保養工程（約 " + rt + " RT 冷凍噸）",
          spec: typeLabel + "｜含風機 LOTO 斷電掛牌、播水盆疏通、散熱材定壓沖洗、底盤吸泥與三相電流實測",
          unit: "1 式",
          priceA: ctA,
          priceB: ctB
        });

        if (ctCount === 1) {
          items.push({
            title: "雙座並聯冷卻水塔分批隔離輪洗作業費（共 2 座）",
            spec: "透過進出水蝴蝶閥單塔隔離輪洗，維持主機降載運轉不斷冷氣",
            unit: "1 式",
            priceA: 4500,
            priceB: 3800
          });
        } else if (ctCount === 2) {
          items.push({
            title: "三座以上大型冷卻水塔群分批輪洗作業費（3 座以上）",
            spec: "多座水塔分階段隔離保養與水路平衡復歸",
            unit: "1 式",
            priceA: 9000,
            priceB: 7500
          });
        }
      }

      // 3. 計算機電閥件與選配加購項
      if (chkPvc && chkPvc.checked) {
        items.push({
          title: "2 吋內進水 PVC 球閥 ／ 青銅浮球閥更新工程",
          spec: "含舊閥拆卸、南亞 PVC 雙由令球閥或重型青銅浮球閥換裝與止水測試",
          unit: "1 組",
          priceA: 3800,
          priceB: 3500
        });
      }
      if (chkLevel && chkLevel.checked) {
        items.push({
          title: "Omron 61F-G2 液位控制器 ＋ SUS304 不鏽鋼電極棒整組更新",
          spec: "日本歐姆龍原廠 61F-G2 控制器、電極保持器、304 不鏽鋼電極棒與高低水位連動測試",
          unit: "1 組",
          priceA: 4500,
          priceB: 4200
        });
      }
      if (chkButterfly && chkButterfly.checked) {
        items.push({
          title: "大口徑 6吋~10吋 FCD/SUS304 齒輪式（Gear）蝴蝶閥更換工程",
          spec: "鑄鐵本體＋304不鏽鋼蝶板＋重型齒輪操作箱、EPDM 耐候法蘭墊片與白鐵螺栓連工帶料",
          unit: "1 組",
          priceA: 18000,
          priceB: 16500
        });
      }
      if (chkFill && chkFill.checked) {
        items.push({
          title: "冷卻水塔 PVC 散熱材（膠片填料）局部深度除垢與更新工程",
          spec: "清除嚴重鈣化脆化散熱膠片並換裝高親水性耐溫 PVC 散熱填料",
          unit: "1 式",
          priceA: 8500,
          priceB: 7500
        });
      }
      if (chkInverter && chkInverter.checked) {
        items.push({
          title: "東元（TECO F510）風機/水泵變頻器節能參數調校與溫控連動檢測",
          spec: "回水溫控頻率曲線最佳化、馬達絕緣測試與過載保護點檢",
          unit: "1 式",
          priceA: 4500,
          priceB: 4200
        });
      }

      // 4. 自訂追加項目或專案折讓
      const customPriceVal = parseInt(elCustomPrice ? elCustomPrice.value : "0", 10) || 0;
      const customNameVal = (elCustomName && elCustomName.value.trim()) ? elCustomName.value.trim() : "現場特殊管線改造 ／ 專案折讓調整";
      if (customPriceVal !== 0) {
        items.push({
          title: customNameVal,
          spec: customPriceVal < 0 ? "老客戶續約或管委會專案核定特別折讓" : "依現場實際人孔高度、管徑或特殊動線追加項目",
          unit: "1 式",
          priceA: customPriceVal,
          priceB: customPriceVal
        });
      }

      // 計算未稅小計、5%營業稅與含稅總計
      let subA = 0;
      let subB = 0;
      items.forEach(function (it) {
        subA += it.priceA;
        subB += it.priceB;
      });
      subA = Math.max(0, subA);
      subB = Math.max(0, subB);

      const includeTax = (elTaxMode ? elTaxMode.value : "include_5") === "include_5";
      const taxA = includeTax ? Math.round(subA * 0.05) : 0;
      const taxB = includeTax ? Math.round(subB * 0.05) : 0;
      const totalA = subA + taxA;
      const totalB = subB + taxB;
      const savedDiff = Math.max(0, totalA - totalB);

      // 渲染表格表頭
      if (outThead) {
        if (displayMode === "ab_compare") {
          outThead.innerHTML = "<tr>" +
            "<th style='width:5%;'>項次</th>" +
            "<th style='width:33%;'>工程與機電檢修項目</th>" +
            "<th style='width:32%;'>施工規格與職安配置說明</th>" +
            "<th style='width:8%;'>單位</th>" +
            "<th class='num-col' style='width:11%;'>A方案：專車全責</th>" +
            "<th class='num-col' style='width:11%;'>B方案：平日併單</th>" +
            "</tr>";
        } else {
          const singleTitle = (displayMode === "only_a") ? "A方案：專車全責單價" : "B方案：平日併單單價";
          outThead.innerHTML = "<tr>" +
            "<th style='width:6%;'>項次</th>" +
            "<th style='width:36%;'>工程與機電檢修項目</th>" +
            "<th style='width:36%;'>施工規格與職安配置說明</th>" +
            "<th style='width:8%;'>單位</th>" +
            "<th class='num-col' style='width:14%;'>" + singleTitle + "</th>" +
            "</tr>";
        }
      }

      // 渲染表格內容列
      if (outTbody) {
        const rowsHtml = items.map(function (it, idx) {
          const numStr = String(idx + 1).padStart(2, "0");
          const pAStr = it.isFreeGift ? "<span style='color:#16a34a;font-weight:900;'>免費贈送</span>" : ("NT$ " + it.priceA.toLocaleString());
          const pBStr = it.isFreeGift ? "<span style='color:#16a34a;font-weight:900;'>免費贈送</span>" : ("NT$ " + it.priceB.toLocaleString());

          if (displayMode === "ab_compare") {
            return "<tr>" +
              "<td>" + numStr + "</td>" +
              "<td><strong>" + it.title + "</strong></td>" +
              "<td>" + it.spec + "</td>" +
              "<td>" + it.unit + "</td>" +
              "<td class='num-col'>" + pAStr + "</td>" +
              "<td class='num-col' style='color:#0369a1;'>" + pBStr + "</td>" +
              "</tr>";
          } else {
            const chosenStr = (displayMode === "only_a") ? pAStr : pBStr;
            return "<tr>" +
              "<td>" + numStr + "</td>" +
              "<td><strong>" + it.title + "</strong></td>" +
              "<td>" + it.spec + "</td>" +
              "<td>" + it.unit + "</td>" +
              "<td class='num-col'>" + chosenStr + "</td>" +
              "</tr>";
          }
        });
        outTbody.innerHTML = rowsHtml.join("");
      }

      // 渲染總金額彙整區（含國字大寫金額）
      if (outSummaryArea) {
        if (displayMode === "ab_compare") {
          outSummaryArea.innerHTML =
            "<div class='qp-total-grid'>" +
              "<div class='qp-plan-card'>" +
                "<div class='qp-plan-title'>★ A方案：指定時段專車全責專案（可指定日期/急件）</div>" +
                "<div style='font-size:0.86rem;color:#475569;'>未稅小計：NT$ " + subA.toLocaleString() +
                (includeTax ? (" ＋ 5%營業稅：NT$ " + taxA.toLocaleString()) : "（未稅，開發票另加5%）") + "</div>" +
                "<div class='qp-plan-price'>總計 NT$ " + totalA.toLocaleString() + " 元" + (includeTax ? "（含稅）" : "（未稅）") + "</div>" +
                "<div style='font-size:0.82rem;color:#334155;font-weight:700;'>大寫：" + toTaiwaneseUpperCurrency(totalA) + "</div>" +
              "</div>" +
              "<div class='qp-plan-card' style='border-color:#0284c7;background:#f0f9ff;'>" +
                "<div class='qp-plan-title' style='color:#0369a1;'>⚡ B方案：平日彈性順路併單特惠（現省 NT$ " + savedDiff.toLocaleString() + " 元）</div>" +
                "<div style='font-size:0.86rem;color:#475569;'>未稅小計：NT$ " + subB.toLocaleString() +
                (includeTax ? (" ＋ 5%營業稅：NT$ " + taxB.toLocaleString()) : "（未稅，開發票另加5%）") + "</div>" +
                "<div class='qp-plan-price' style='color:#0284c7;'>總計 NT$ " + totalB.toLocaleString() + " 元" + (includeTax ? "（含稅）" : "（未稅）") + "</div>" +
                "<div style='font-size:0.82rem;color:#334155;font-weight:700;'>大寫：" + toTaiwaneseUpperCurrency(totalB) + "</div>" +
              "</div>" +
            "</div>";
        } else {
          const isA = (displayMode === "only_a");
          const sub = isA ? subA : subB;
          const tax = isA ? taxA : taxB;
          const tot = isA ? totalA : totalB;
          const planTitle = isA
            ? "★ 核定採行【A方案：指定時段專車全責專案】"
            : "⚡ 核定採行【B方案：平日彈性順路併單特惠檔期】";
          outSummaryArea.innerHTML =
            "<div class='qp-plan-card' style='border-width:2px;'>" +
              "<div class='qp-plan-title'>" + planTitle + "</div>" +
              "<div style='font-size:0.9rem;color:#475569;'>未稅工程小計：NT$ " + sub.toLocaleString() + " 元" +
              (includeTax ? (" ｜ 5% 統一發票營業稅：NT$ " + tax.toLocaleString() + " 元") : "（本報價為未稅價，開立統一發票另加 5% 營業稅）") + "</div>" +
              "<div class='qp-plan-price' style='font-size:1.6rem;'>總計金額：NT$ " + tot.toLocaleString() + " 元" + (includeTax ? "（含稅總價）" : "（未稅總價）") + "</div>" +
              "<div style='font-size:0.88rem;color:#0f172a;font-weight:800;margin-top:4px;'>國字大寫：" + toTaiwaneseUpperCurrency(tot) + "</div>" +
            "</div>";
        }
      }

      // 渲染管委會簽核勾選區
      if (outDecisionArea) {
        if (displayMode === "ab_compare") {
          outDecisionArea.innerHTML =
            "<div style='font-weight:900;color:#0f172a;margin-bottom:8px;'>【客戶／社區管委會決議簽核欄（請於下方二選一打勾回傳）】</div>" +
            "<div style='margin-bottom:6px;font-size:0.88rem;'>□ 同意採行 <strong>A方案（指定時段專車全責：NT$ " + totalA.toLocaleString() + "）</strong>，指定施工日期：____年____月____日</div>" +
            "<div style='margin-bottom:12px;font-size:0.88rem;'>□ 同意採行 <strong>B方案（平日彈性順路併單：NT$ " + totalB.toLocaleString() + "）</strong>，授權總幹事與皓盛協調平日順路檔期</div>" +
            "<div style='margin-top:18px;border-top:1px solid #94a3b8;padding-top:8px;font-size:0.88rem;'>管委會主委／客戶代表簽章：________________________　簽署日期：____年____月____日</div>";
        } else {
          const chosenTot = (displayMode === "only_a") ? totalA : totalB;
          outDecisionArea.innerHTML =
            "<div style='font-weight:900;color:#0f172a;margin-bottom:8px;'>【客戶／社區管委會正式委託簽認欄】</div>" +
            "<div style='margin-bottom:14px;font-size:0.88rem;'>茲同意委託皓盛有限公司依本報價單所列規格與職安合規配置進場施作，核定總金額為 <strong>NT$ " + chosenTot.toLocaleString() + " 元</strong>。</div>" +
            "<div style='margin-bottom:14px;font-size:0.88rem;'>預計安排施工日期：2026 年 ____ 月 ____ 日（停水公告將於施工前 3 日張貼）</div>" +
            "<div style='margin-top:18px;border-top:1px solid #94a3b8;padding-top:8px;font-size:0.88rem;'>管委會主委／客戶代表簽章：________________________　簽署日期：____年____月____日</div>";
        }
      }

      // 回傳純文字摘要供 LINE 複製使用
      const lineItemsText = items.map(function (it, i) {
        if (it.isFreeGift) return (i + 1) + ". " + it.title + "：免費附贈";
        if (displayMode === "ab_compare") {
          return (i + 1) + ". " + it.title + "｜A專車 $" + it.priceA.toLocaleString() + " / B平日 $" + it.priceB.toLocaleString();
        }
        const p = (displayMode === "only_a") ? it.priceA : it.priceB;
        return (i + 1) + ". " + it.title + "：NT$ " + p.toLocaleString();
      }).join("\n");

      const priceText = (displayMode === "ab_compare")
        ? ("★ A方案（指定專車）：NT$ " + totalA.toLocaleString() + (includeTax ? " (含5%稅)" : " (未稅)") +
           "\n⚡ B方案（平日併單）：NT$ " + totalB.toLocaleString() + (includeTax ? " (含5%稅，現省$" + savedDiff.toLocaleString() + ")" : " (未稅)"))
        : ("核定總金額：NT$ " + ((displayMode === "only_a") ? totalA : totalB).toLocaleString() + (includeTax ? " (含5%營業稅)" : " (未稅)"));

      return "📄 報價單號：" + docNo +
        "\n🏢 客戶寶號：" + clientName + "（" + contactPerson + "）" +
        "\n📍 案場位置：" + clientAddr +
        "\n-------------------------\n" +
        lineItemsText +
        "\n-------------------------\n" +
        priceText +
        "\n✓ 均含法定缺氧作業主管、雙人專責戒護與500萬雇主職災團保";
    }

    form.addEventListener("change", renderQuotation);
    form.addEventListener("input", renderQuotation);

    // 檢查網址是否帶有 ?from= 參數，若有則自動載入草稿
    if (window.location.search.indexOf("from=") !== -1) {
      applyStoredDraft(true);
    } else {
      renderQuotation();
    }

    if (btnLoadDraft) {
      btnLoadDraft.addEventListener("click", function () {
        applyStoredDraft(true);
      });
    }

    if (btnPrintPdf) {
      btnPrintPdf.addEventListener("click", function () {
        renderQuotation();
        const originalTitle = document.title;
        const cName = (elClientName && elClientName.value.trim()) ? elClientName.value.trim() : "社區與商場專案";
        const dNo = (elDocNo && elDocNo.value.trim()) ? elDocNo.value.trim() : "HS報價單";
        document.title = "皓盛有限公司_正式工程報價單_" + cName + "_" + dNo;
        window.print();
        setTimeout(function () {
          document.title = originalTitle;
        }, 1200);
      });
    }

    if (btnCopyLine) {
      btnCopyLine.addEventListener("click", function () {
        const text = renderQuotation();
        copyAndOpenLine(text, "【皓盛有限公司 統編90221911 正式工程報價單】");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBeforeAfterSlider();
    initWaterTankCalculator();
    initCoolingTowerCalculator();
    initQuoteGenerator();
  });
})();
