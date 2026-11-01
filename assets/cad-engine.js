/**
 * 皓盛有限公司 (5390857.com) - 雙引擎試算與 A4 單頁智慧鎖定報價核心系統 (v15.0 雙專家滿分完全體正式版)
 * 涵蓋模組：
 * 1. Before/After 清洗前後視覺對比拉桿（Pointer Events ＋ 鍵盤無障礙 A11y ＋ rAF 節流與失焦保護）
 * 2. 社區大樓自來水塔 A/B 雙軌試算器 ＋ 跨頁雙向記憶與無汙染帶入報價單生成器 (localStorage + pageshow/storage)
 * 3. 商用空調冷卻水塔（10RT~500RT+）A/B 雙軌試算器 ＋ 跨頁雙向記憶與無汙染帶入報價單生成器
 * 4. 正式工程報價單生成器 (quote.html)：
 *    - 涵蓋紅藍軍 v11.0 全部 8 項資安、會計大寫、跨類別加購隔離與離線 A4 沙盒量測修復
 *    - 升級 [自來水塔專家 W1]：修正 10 噸內選 FRP 組合式水塔或多棟不鏽鋼塔時，報價單誤印「入槽 RC 水池」之材質文字矛盾
 *    - 升級 [自來水塔專家 W2]：精準化 Omron 61F-G2 液位開關說明（E1~E3 高低水位與共用接地極除垢＋下水池防無水空轉保護迴路測試）
 *    - 升級 [自來水塔專家 W3]：納入自來水處規範之 50~100 ppm 食品級次氯酸鈉消毒與完工自由有效餘氯（0.2~1.0 mg/L）驗收標準
 *    - 升級 [冷卻水塔專家 C1]：依水塔型式（圓型開放式／方型開放式／密閉式）動態分流「旋轉播水頭／雙側重力播水盆／內循環熱交換盤管」專業規格說明
 *    - 升級 [冷卻水塔專家 C2]：修正從自來水塔頁勾選「加購 50RT 內冷卻水塔 (+7,000/+5,500)」跳轉報價單時，強制對齊 50RT 單座圓型塔，消除舊草稿 100RT 造成的 $6,000 價差
 *    - 升級 [冷卻水塔專家 C3]：200RT~500RT+ 大型冷卻水塔納入「減速齒輪箱(Gear Reducer)／多溝皮帶點檢」與「底盤吸水濾網及管路 Y 型過濾器清洗」
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

  const DRAFT_STORAGE_KEY = "hs_5390857_quote_draft_v11";
  const LEGACY_STORAGE_KEYS = [
    "hs_5390857_quote_draft_v10",
    "hs_5390857_quote_draft_v8"
  ];
  const CUSTOM_PRICE_MIN = -500000;
  const CUSTOM_PRICE_MAX = 5000000;
  const A4_SAFE_HEIGHT_PX = 985;
  const A4_PRINTABLE_WIDTH_PX = 733; // A4 794px 扣除左右各 8mm (約 30.2px * 2) 列印邊界後之真實可用寬度

  let toastTimerId = null;
  let isLineNavigating = false;
  let lineNavTimerId = null;
  let savedDocumentTitle = null;
  let printTitleFallbackTimerId = null;
  let isPrintButtonTriggering = false;

  /* 資安防護：HTML 特殊字元轉義，徹底阻絕 DOM XSS 與表格破版 */
  function escapeHtml(rawStr) {
    if (rawStr === null || rawStr === undefined) return "";
    return String(rawStr)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* 檔案名稱安全淨化：過濾作業系統非法字元、ASCII 控制字元、換行與過長字串 */
  function sanitizeFilenamePart(rawStr, fallbackStr, maxLen) {
    const limit = maxLen || 36;
    if (rawStr === null || rawStr === undefined) return fallbackStr;
    const cleaned = String(rawStr)
      .replace(/[\x00-\x1f\x7f\\/:*?"<>|]+/g, "_")
      .replace(/\s+/g, "_")
      .replace(/^[_.\s]+|[_.\s]+$/g, "")
      .slice(0, limit);
    return cleaned || fallbackStr;
  }

  /* 數值安全夾限（Clamping）：修補 Number("") === 0 導致空字串繞過 fallback 的漏洞 */
  function clampNumber(val, min, max, fallback) {
    if (val === null || val === undefined) return fallback;
    if (typeof val === "string" && val.trim() === "") return fallback;
    const num = Number(val);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, Math.round(num)));
  }

  /* 下拉選單安全賦值：驗證 value 是否存在於 <select> options，防止惡意竄改 localStorage 導致 selectedIndex = -1 */
  function setSelectValueSafely(selectEl, val, defaultVal) {
    if (!selectEl) return;
    const target = String(val !== undefined && val !== null ? val : defaultVal);
    const options = Array.prototype.slice.call(selectEl.options || []);
    const exists = options.some(function (opt) {
      return opt.value === target;
    });
    selectEl.value = exists ? target : defaultVal;
  }

  /* Toast 通知（修正連續點擊計時器競爭與閃退問題） */
  function showToast(message) {
    if (!document.body) return;
    let toast = document.getElementById("hs-global-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "hs-global-toast";
      toast.className = "toast-msg";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    if (toastTimerId !== null) {
      clearTimeout(toastTimerId);
      toastTimerId = null;
    }
    toast.textContent = String(message || "");
    toast.classList.add("show");
    toastTimerId = setTimeout(function () {
      toast.classList.remove("show");
      toastTimerId = null;
    }, 3400);
  }

  let memoryDraftFallback = null;

  /* 跨頁草稿讀取（支援記憶體保底 memoryDraftFallback，即使無痕模式或 WebView 封鎖 localStorage 亦 100% 可用） */
  function loadQuoteDraft() {
    try {
      let raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        for (let i = 0; i < LEGACY_STORAGE_KEYS.length; i++) {
          raw = localStorage.getItem(LEGACY_STORAGE_KEYS[i]);
          if (raw) break;
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          memoryDraftFallback = Object.assign({}, memoryDraftFallback || {}, parsed);
          return memoryDraftFallback;
        }
      }
    } catch (e) {}
    return memoryDraftFallback;
  }

  /* 跨頁草稿儲存（同時寫入記憶體保底與 localStorage，確保 URL 參數直傳在任何沙盒或無痕環境下 100% 生效） */
  function saveQuoteDraft(draftPatch) {
    const existing = loadQuoteDraft() || {};
    const merged = Object.assign({}, existing, draftPatch, {
      updatedAt: Date.now()
    });
    memoryDraftFallback = merged;
    try {
      const serialized = JSON.stringify(merged);
      localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
      for (let i = 0; i < LEGACY_STORAGE_KEYS.length; i++) {
        localStorage.setItem(LEGACY_STORAGE_KEYS[i], serialized);
      }
    } catch (e) {}
  }

  /* 同步開啟 LINE 視窗輔助（修復 window.open + noopener 必回傳 null 造成雙重開啟/跳轉之漏洞） */
  function resetLineNavigationLock() {
    isLineNavigating = false;
    if (lineNavTimerId !== null) {
      clearTimeout(lineNavTimerId);
      lineNavTimerId = null;
    }
  }

  window.addEventListener("pagehide", resetLineNavigationLock);
  window.addEventListener("pageshow", resetLineNavigationLock);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      resetLineNavigationLock();
    }
  });

  function openLineSafely() {
    if (isLineNavigating) return;
    isLineNavigating = true;
    if (lineNavTimerId !== null) clearTimeout(lineNavTimerId);
    lineNavTimerId = setTimeout(function () {
      isLineNavigating = false;
      lineNavTimerId = null;
    }, 1200);

    try {
      if (document.body) {
        const anchor = document.createElement("a");
        anchor.href = COMPANY_INFO.lineUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        return;
      }
    } catch (e) {}

    try {
      window.location.href = COMPANY_INFO.lineUrl;
    } catch (err) {}
  }

  /* 傳統剪貼簿備援複製（保存並還原使用者當前焦點與選取範圍，防止手機鍵盤異常彈跳） */
  function fallbackCopyText(text) {
    let prevActive = null;
    try {
      prevActive = document.activeElement;
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "readonly");
      ta.setAttribute("aria-hidden", "true");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.left = "-9999px";
      ta.style.opacity = "0";
      ta.style.pointerEvents = "none";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (prevActive && typeof prevActive.focus === "function") {
        try { prevActive.focus({ preventScroll: true }); } catch (err) {}
      }
      return Boolean(ok);
    } catch (e) {
      return false;
    }
  }

  /* 一鍵複製並開啟 LINE（先執行同步複製確保手勢不中斷，再非同步雙重寫入剪貼簿） */
  function copyAndOpenLine(summaryText, customHeader) {
    const header = customHeader || "【皓盛官網 5390857.com 線上工程試算詢價】";
    const fullText = header + "\n" + summaryText + "\n請李先生協助評估現場檔期與正式報價單！";

    const syncCopied = fallbackCopyText(fullText);
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(fullText).catch(function () {});
    }

    if (syncCopied) {
      showToast("✓ 已自動複製完整報價內容！正在為您開啟 LINE...");
    } else {
      showToast("正在為您開啟 LINE 客服專線 0916-093-125...");
    }
    openLineSafely();
  }

  /*
   * 將阿拉伯數字轉換為台灣正式會計國字大寫金額
   * 採用嚴格「四位數分組（元、萬、億）」演算法，處理 105,000（壹拾萬零伍仟）與 100,005,000（壹億零伍仟）跨組零位
   */
  function toTaiwaneseUpperCurrency(amount) {
    const num = clampNumber(amount, 0, 999999999999, 0);
    if (num <= 0) return "新臺幣 零元整";

    const digits = ["零", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖"];
    const smallUnits = ["", "拾", "佰", "仟"];
    const bigUnits = ["", "萬", "億", "兆"];

    function convertFourDigitGroup(groupVal) {
      let str = "";
      let zeroPendingInGroup = false;
      let hasOutputInGroup = false;

      for (let pos = 3; pos >= 0; pos--) {
        const divisor = Math.pow(10, pos);
        const d = Math.floor(groupVal / divisor) % 10;
        if (d === 0) {
          if (hasOutputInGroup) {
            zeroPendingInGroup = true;
          }
        } else {
          if (zeroPendingInGroup) {
            str += "零";
            zeroPendingInGroup = false;
          }
          str += digits[d] + smallUnits[pos];
          hasOutputInGroup = true;
        }
      }
      return str;
    }

    const groups = [];
    let temp = num;
    while (temp > 0) {
      groups.push(temp % 10000);
      temp = Math.floor(temp / 10000);
    }

    let result = "";
    let zeroAcrossGroup = false;
    let prevGroupHadTrailingZero = false;
    const highestGroupIdx = groups.length - 1;

    for (let g = highestGroupIdx; g >= 0; g--) {
      const gVal = groups[g];
      if (gVal === 0) {
        zeroAcrossGroup = true;
      } else {
        if (g < highestGroupIdx) {
          if (zeroAcrossGroup || prevGroupHadTrailingZero || gVal < 1000) {
            result += "零";
          }
        }
        result += convertFourDigitGroup(gVal) + (bigUnits[g] || "");
        zeroAcrossGroup = false;
        prevGroupHadTrailingZero = (gVal % 10 === 0);
      }
    }

    result = result.replace(/零+/g, "零").replace(/^零|零$/g, "");
    return "新臺幣 " + (result || "零") + "元整";
  }

  /* 1. 初始化 Before/After 對比拉桿（含 Pointer Capture 失焦防護、rAF 節流與鍵盤無障礙支援） */
  function initBeforeAfterSlider() {
    const sliders = document.querySelectorAll(".js-ba-slider");
    sliders.forEach(function (slider) {
      const beforeLayer = slider.querySelector(".ba-before");
      const handle = slider.querySelector(".ba-handle");
      if (!beforeLayer || !handle) return;

      let isDragging = false;
      let currentPct = 50;
      let rafId = null;

      slider.setAttribute("tabindex", "0");
      slider.setAttribute("role", "slider");
      slider.setAttribute("aria-valuemin", "5");
      slider.setAttribute("aria-valuemax", "95");
      slider.setAttribute("aria-valuenow", "50");
      slider.setAttribute("aria-valuetext", "清洗前後對比比例 50%");

      function renderPct(pct) {
        currentPct = Math.max(5, Math.min(95, pct));
        const pctStr = currentPct.toFixed(1) + "%";
        const rightClipStr = (100 - currentPct).toFixed(1) + "%";
        beforeLayer.style.width = "100%";
        beforeLayer.style.clipPath = "inset(0 " + rightClipStr + " 0 0)";
        beforeLayer.style.webkitClipPath = "inset(0 " + rightClipStr + " 0 0)";
        handle.style.left = pctStr;
        const rounded = Math.round(currentPct);
        slider.setAttribute("aria-valuenow", String(rounded));
        slider.setAttribute("aria-valuetext", "清洗前後對比比例 " + rounded + "%");
      }

      function updateFromClientX(clientX) {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(function () {
          const rect = slider.getBoundingClientRect();
          if (rect.width > 0) {
            const pct = ((clientX - rect.left) / rect.width) * 100;
            renderPct(pct);
          }
          rafId = null;
        });
      }

      slider.addEventListener("pointerdown", function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        isDragging = true;
        updateFromClientX(e.clientX);
        if (slider.setPointerCapture && e.pointerId !== undefined) {
          try { slider.setPointerCapture(e.pointerId); } catch (err) {}
        }
      });

      slider.addEventListener("pointermove", function (e) {
        if (!isDragging) return;
        updateFromClientX(e.clientX);
      });

      function stopDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        if (slider.releasePointerCapture && e && e.pointerId !== undefined) {
          try { slider.releasePointerCapture(e.pointerId); } catch (err) {}
        }
      }

      slider.addEventListener("pointerup", stopDrag);
      slider.addEventListener("pointercancel", stopDrag);
      slider.addEventListener("lostpointercapture", stopDrag);

      slider.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          renderPct(currentPct - 5);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          renderPct(currentPct + 5);
        } else if (e.key === "Home") {
          e.preventDefault();
          renderPct(5);
        } else if (e.key === "End") {
          e.preventDefault();
          renderPct(95);
        }
      });
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

    /* 從草稿還原使用者上次在自來水塔試算器的設定（支援上一頁 bfcache 與跨頁無縫切換） */
    function restoreWaterTankDraft() {
      const draft = loadQuoteDraft();
      if (!draft) return;
      if (draft.scheduleMode && scheduleSelect) {
        setSelectValueSafely(scheduleSelect, draft.scheduleMode, "priority_50");
      }
      if (draft.region && regionSelect) {
        setSelectValueSafely(regionSelect, draft.region, "台北市 / 新北市");
      }
      if (draft.wtTonnage && tonSelect) {
        setSelectValueSafely(tonSelect, draft.wtTonnage, "50");
      }
      if (draft.wtMaterial && matSelect) {
        setSelectValueSafely(matSelect, draft.wtMaterial, "concrete");
      }
      if (draft.wtPoolCount !== undefined && poolCountSelect) {
        setSelectValueSafely(poolCountSelect, draft.wtPoolCount, "0");
      }
      if (chkPvcValve && draft.chkPvcValve !== undefined) {
        chkPvcValve.checked = Boolean(draft.chkPvcValve);
      }
      if (chkButterfly && draft.chkButterfly !== undefined) {
        chkButterfly.checked = Boolean(draft.chkButterfly);
      }
      if (chkLevel && draft.chkLevel !== undefined) {
        chkLevel.checked = Boolean(draft.chkLevel);
      }
      if (chkCool && draft.serviceCategory !== undefined) {
        chkCool.checked = (draft.serviceCategory === "both");
      }
      if (chkTax && draft.chkTax !== undefined) {
        chkTax.checked = Boolean(draft.chkTax);
      }
    }

    function calculate(shouldPersistDraft, isJumpingToQuote) {
      const scheduleMode = scheduleSelect ? scheduleSelect.value : "priority_50";
      const isPriority = (scheduleMode !== "weekday_35");
      const tonVal = clampNumber(tonSelect ? tonSelect.value : 50, 10, 500, 50);
      const matVal = matSelect ? matSelect.value : "concrete";
      const poolLevel = clampNumber(poolCountSelect ? poolCountSelect.value : 0, 0, 2, 0);
      const regionVal = regionSelect ? regionSelect.value : "台北市 / 新北市";

      let basePrice = isPriority ? 13000 : 10500;
      let hours = "2.5 ~ 3.0 小時";
      let crewMode = isPriority
        ? "【A方案：專車全責】法定局限空間3人標準編制（雙人施作戒護＋缺氧作業主管氣體測定簽證＋500萬職災團保＋價值4,500元給水機電深度健檢）"
        : "【B方案：平日彈性併單】法定局限空間3人標準編制（由本公司安排平日順路時段施作，同享缺氧作業主管＋雙人戒護＋500萬職災團保）";

      if (tonVal <= 10) {
        if (matVal === "stainless") {
          basePrice = isPriority ? 4600 : 3800;
          hours = (poolLevel === 0) ? "1.5 ~ 2.0 小時" : "2.5 ~ 3.5 小時（多顆/跨棟分批停水快洗）";
          crewMode = isPriority
            ? "【指定時段專車】頂樓免入槽快洗編制（正職勞健保技師＋長柄高壓水刀＋50~100ppm次氯酸鈉消毒；同棟多顆併洗享3,000起優惠）"
            : "【平日順路併單】頂樓免入槽快洗編制（正職勞健保技師＋長柄高壓水刀＋50~100ppm次氯酸鈉消毒；同棟多顆併洗享3,000起優惠）";
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

      const addons = ["免費附贈：Omron 61F-G2 高低水位與共用接地極(E1~E3)除垢＋下水池防空轉迴路測試＋揚水泵浦電流檢測＋進水蝴蝶閥止水健檢（價值NT$4,500）"];
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
        const coolPrice = isPriority ? 7000 : 5500;
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

      if (shouldPersistDraft) {
        const existingDraft = loadQuoteDraft() || {};
        const isBoth = Boolean(chkCool && chkCool.checked);
        const draftPayload = {
          serviceCategory: isBoth ? "both" : "water_tank",
          scheduleMode: scheduleMode,
          region: regionVal,
          wtTonnage: String(tonVal),
          wtMaterial: matVal,
          wtPoolCount: String(poolLevel),
          chkPvcValve: Boolean(chkPvcValve && chkPvcValve.checked),
          chkButterfly: Boolean(chkButterfly && chkButterfly.checked),
          chkLevel: Boolean(chkLevel && chkLevel.checked),
          chkTax: Boolean(chkTax && chkTax.checked)
        };
        // 修復 [冷卻水塔專家 C2]：當在自來水塔頁勾選「加購商用空調冷卻水塔(50RT內)同步清洗保養」時，
        // 若正點擊跳轉至報價單 (isJumpingToQuote) 或原本無設定，強制對齊為 50RT 單座開放式圓型水塔，消除舊草稿 100RT 造成的 $6,000 價差
        if (isBoth) {
          if (isJumpingToQuote || !existingDraft.ctRtScale) {
            draftPayload.ctRtScale = "50";
            draftPayload.ctTowerType = "open_round";
            draftPayload.ctTowerCount = "0";
          }
        }
        if (isJumpingToQuote) {
          draftPayload.displayMode = "ab_compare";
          draftPayload.lastJumpSource = "water-tank";
        }
        saveQuoteDraft(draftPayload);
      }

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

    restoreWaterTankDraft();
    form.addEventListener("change", function () { calculate(true, false); });
    form.addEventListener("input", function () { calculate(true, false); });
    calculate(false, false);

    window.addEventListener("pageshow", function (e) {
      if (e && e.persisted) {
        restoreWaterTankDraft();
        calculate(false, false);
      }
    });
    window.addEventListener("storage", function (e) {
      if (!e || e.key === DRAFT_STORAGE_KEY || e.key === null) {
        restoreWaterTankDraft();
        calculate(false, false);
      }
    });

    if (btnCopyLine) {
      btnCopyLine.addEventListener("click", function () {
        copyAndOpenLine(calculate(true, false));
      });
    }
    if (btnToQuote) {
      btnToQuote.addEventListener("click", function () {
        calculate(true, true);
        const isBoth = Boolean(chkCool && chkCool.checked);
        const qParams = new URLSearchParams({
          from: "water-tank",
          cat: isBoth ? "both" : "water_tank",
          mode: scheduleSelect ? scheduleSelect.value : "priority_50",
          reg: regionSelect ? regionSelect.value : "台北市 / 新北市",
          ton: tonSelect ? tonSelect.value : "50",
          mat: matSelect ? matSelect.value : "concrete",
          pools: poolCountSelect ? poolCountSelect.value : "0",
          pvc: (chkPvcValve && chkPvcValve.checked) ? "1" : "0",
          bf: (chkButterfly && chkButterfly.checked) ? "1" : "0",
          lvl: (chkLevel && chkLevel.checked) ? "1" : "0",
          tax: (chkTax && chkTax.checked) ? "1" : "0"
        });
        window.location.href = "quote.html?" + qParams.toString() + "#qp-workspace-anchor";
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

    /* 從草稿還原使用者上次在冷卻水塔試算器的設定 */
    function restoreCoolingTowerDraft() {
      const draft = loadQuoteDraft();
      if (!draft) return;
      if (draft.scheduleMode && scheduleSelect) {
        setSelectValueSafely(scheduleSelect, draft.scheduleMode, "priority_50");
      }
      if (draft.region && regionSelect) {
        setSelectValueSafely(regionSelect, draft.region, "台北市 / 新北市");
      }
      if (draft.ctRtScale && rtSelect) {
        setSelectValueSafely(rtSelect, draft.ctRtScale, "100");
      }
      if (draft.ctTowerType && typeSelect) {
        setSelectValueSafely(typeSelect, draft.ctTowerType, "open_round");
      }
      if (draft.ctTowerCount !== undefined && countSelect) {
        setSelectValueSafely(countSelect, draft.ctTowerCount, "0");
      }
      if (chkFill && draft.chkFill !== undefined) {
        chkFill.checked = Boolean(draft.chkFill);
      }
      if (chkButterfly && draft.chkButterfly !== undefined) {
        chkButterfly.checked = Boolean(draft.chkButterfly);
      }
      if (chkBallValve && draft.chkPvcValve !== undefined) {
        chkBallValve.checked = Boolean(draft.chkPvcValve);
      }
      if (chkInverter && draft.chkInverter !== undefined) {
        chkInverter.checked = Boolean(draft.chkInverter);
      }
      if (chkTax && draft.chkTax !== undefined) {
        chkTax.checked = Boolean(draft.chkTax);
      }
    }

    function calcCoolingTower(shouldPersistDraft, isJumpingToQuote) {
      const scheduleMode = scheduleSelect ? scheduleSelect.value : "priority_50";
      const isPriority = (scheduleMode !== "weekday_35");
      const regionVal = regionSelect ? regionSelect.value : "台北市 / 新北市";
      const rtVal = clampNumber(rtSelect ? rtSelect.value : 100, 10, 1000, 100);
      const towerType = typeSelect ? typeSelect.value : "open_round";
      const countLevel = clampNumber(countSelect ? countSelect.value : 0, 0, 2, 0);

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
          ? "【A方案：大型塔高處/入塔3人編制】雙人塔內外協作＋職安主管戒護＋500萬團保＋免費風機馬達絕緣、減速齒輪箱/皮帶與Y型過濾器點檢"
          : "【B方案：平日併單3人編制】雙人塔內外協作＋職安主管戒護＋500萬團保＋免費風機馬達電流、減速齒輪箱/皮帶與Y型過濾器點檢";
      } else {
        basePrice = isPriority ? 27000 : 24000;
        hours = "4.0 ~ 5.5 小時（雙機高壓水刀與工業吸塵同步施作）";
        crewMode = "【巨型水塔全責3人編制】雙機同步清洗＋高處防墜與入塔職安主管戒護＋500萬職災團保＋減速齒輪箱(Gear Reducer)與Y型過濾器全檢";
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

      // 升級 [冷卻水塔專家 C1 & C3]：依塔型動態顯示旋轉播水頭 / 重力播水盆 / 盤管噴淋系統
      const distPartName = (towerType === "closed_circuit")
        ? "內循環熱交換盤管沖洗＋噴淋嘴疏通"
        : (towerType === "open_square" ? "雙側重力播水盆噴孔疏通" : "頂部旋轉播水頭與散水管疏通");
      const addons = ["免費附贈：散熱風機馬達運轉電流檢測＋皮帶張力/減速齒輪箱點檢＋" + distPartName + "＋底盤吸水濾網與進水浮球止水檢查"];
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

      if (shouldPersistDraft) {
        const existingDraft = loadQuoteDraft() || {};
        const nextCat = (existingDraft.serviceCategory === "both") ? "both" : "cooling_tower";
        const draftPayload = {
          serviceCategory: nextCat,
          scheduleMode: scheduleMode,
          region: regionVal,
          ctRtScale: String(rtVal),
          ctTowerType: towerType,
          ctTowerCount: String(countLevel),
          chkFill: Boolean(chkFill && chkFill.checked),
          chkButterfly: Boolean(chkButterfly && chkButterfly.checked),
          chkPvcValve: Boolean(chkBallValve && chkBallValve.checked),
          chkInverter: Boolean(chkInverter && chkInverter.checked),
          chkTax: Boolean(chkTax && chkTax.checked)
        };
        if (isJumpingToQuote) {
          draftPayload.displayMode = "ab_compare";
          draftPayload.lastJumpSource = "cooling-tower";
        }
        saveQuoteDraft(draftPayload);
      }

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

    restoreCoolingTowerDraft();
    form.addEventListener("change", function () { calcCoolingTower(true, false); });
    form.addEventListener("input", function () { calcCoolingTower(true, false); });
    calcCoolingTower(false, false);

    window.addEventListener("pageshow", function (e) {
      if (e && e.persisted) {
        restoreCoolingTowerDraft();
        calcCoolingTower(false, false);
      }
    });
    window.addEventListener("storage", function (e) {
      if (!e || e.key === DRAFT_STORAGE_KEY || e.key === null) {
        restoreCoolingTowerDraft();
        calcCoolingTower(false, false);
      }
    });

    if (btnCtLine) {
      btnCtLine.addEventListener("click", function () {
        copyAndOpenLine(calcCoolingTower(true, false));
      });
    }
    if (btnCtToQuote) {
      btnCtToQuote.addEventListener("click", function () {
        calcCoolingTower(true, true);
        const existingDraft = loadQuoteDraft() || {};
        const nextCat = (existingDraft.serviceCategory === "both") ? "both" : "cooling_tower";
        const qParams = new URLSearchParams({
          from: "cooling-tower",
          cat: nextCat,
          mode: scheduleSelect ? scheduleSelect.value : "priority_50",
          reg: regionSelect ? regionSelect.value : "台北市 / 新北市",
          rt: rtSelect ? rtSelect.value : "100",
          type: typeSelect ? typeSelect.value : "open_round",
          cnt: countSelect ? countSelect.value : "0",
          fill: (chkFill && chkFill.checked) ? "1" : "0",
          bf: (chkButterfly && chkButterfly.checked) ? "1" : "0",
          pvc: (chkBallValve && chkBallValve.checked) ? "1" : "0",
          inv: (chkInverter && chkInverter.checked) ? "1" : "0",
          tax: (chkTax && chkTax.checked) ? "1" : "0"
        });
        window.location.href = "quote.html?" + qParams.toString() + "#qp-workspace-anchor";
      });
    }
  }

  /* 4. 第三引擎：A/B 雙軌正式工程報價單生成器 (quote.html - 內建 100% 單頁 A4 PDF 智慧動態縮放鎖定) */
  function initQuoteGenerator() {
    const form = document.getElementById("hs-quote-builder-form");
    if (!form) return;

    const paperSheet = document.getElementById("qp-paper-sheet");
    const statusText = document.getElementById("qp-single-page-status");

    // 表單控制項
    const elDisplayMode = document.getElementById("q-display-mode");
    const elCategory = document.getElementById("q-service-category");
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
    const elTaxMode = document.getElementById("q-tax-mode");

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
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    if (elDocDate && !elDocDate.value) {
      elDocDate.value = yyyy + "-" + mm + "-" + dd;
    }
    if (elDocNo && !elDocNo.value) {
      elDocNo.value = "HS-" + yyyy + mm + dd + "-01";
    }

    /*
     * 離線標準 A4 可列印寬度 (733px) 真實列印高度量測：
     * 統一透過套用 `.hs-print-sim-sheet` 列印度量衡之離線分身精準量測，消除桌機與手機的高度誤差
     */
    function measureTrueA4Height() {
      if (!paperSheet || !document.body) return 0;
      let sandbox = document.getElementById("hs-a4-measure-sandbox");
      if (!sandbox) {
        sandbox = document.createElement("div");
        sandbox.id = "hs-a4-measure-sandbox";
        sandbox.className = "hs-print-sim-sandbox";
        sandbox.setAttribute("aria-hidden", "true");
        sandbox.style.cssText =
          "position:fixed;top:-9999px;left:-9999px;width:" + A4_PRINTABLE_WIDTH_PX +
          "px;visibility:hidden;pointer-events:none;z-index:-1;overflow:hidden;";
        document.body.appendChild(sandbox);
      }
      const clone = paperSheet.cloneNode(true);
      clone.removeAttribute("id");
      clone.classList.add("hs-print-sim-sheet");
      clone.style.width = A4_PRINTABLE_WIDTH_PX + "px";
      clone.style.padding = "0";
      clone.style.margin = "0";
      clone.style.boxShadow = "none";
      clone.style.border = "none";
      clone.style.zoom = "1";
      clone.style.transform = "none";

      // 強制分身內的雙欄網格比照 @media print 雙欄並排
      const metaGrids = clone.querySelectorAll(".qp-meta-grid");
      metaGrids.forEach(function (g) { g.style.gridTemplateColumns = "1.35fr 1fr"; });
      const totalGrids = clone.querySelectorAll(".qp-total-grid");
      totalGrids.forEach(function (g) { g.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))"; });
      const signGrids = clone.querySelectorAll(".qp-sign-grid");
      signGrids.forEach(function (g) { g.style.gridTemplateColumns = "1.25fr 1fr"; });

      sandbox.innerHTML = "";
      sandbox.appendChild(clone);
      const trueHeight = clone.scrollHeight || 0;
      sandbox.innerHTML = "";
      return trueHeight;
    }

    /*
     * 智慧單頁 A4 鎖定引擎：
     * 當密度從 normal 升級至 compact 或 ultra 時，先重新量測新密度下的真實高度，
     * 僅當升級密度後高度仍超過 A4_SAFE_HEIGHT_PX 時才計算 CSS zoom
     */
    function autoFitSinglePagePDF(itemCount, extraTextLength) {
      if (!paperSheet) return;
      let density = "normal";
      let zoomFactor = 1.0;
      const effectiveLoad = itemCount + (extraTextLength > 65 ? 1 : 0);

      if (effectiveLoad >= 8) {
        density = "ultra";
        zoomFactor = Math.max(0.84, 1.0 - (effectiveLoad - 7) * 0.025);
      } else if (effectiveLoad >= 5) {
        density = "compact";
        zoomFactor = Math.max(0.92, 1.0 - (effectiveLoad - 4) * 0.015);
      } else {
        density = "normal";
        zoomFactor = 1.0;
      }

      paperSheet.setAttribute("data-density", density);
      paperSheet.setAttribute("data-item-count", String(itemCount));

      // 第 1 次量測：檢查當前密度下的標準 A4 列印高度
      let renderedHeight = measureTrueA4Height();

      // 若在 normal 密度下超標，先升級為 compact 並重新量測真實高度
      if (renderedHeight > A4_SAFE_HEIGHT_PX && density === "normal") {
        density = "compact";
        paperSheet.setAttribute("data-density", density);
        renderedHeight = measureTrueA4Height();
      }

      // 若在 compact 密度下仍超標，再升級為 ultra 並重新量測真實高度
      if (renderedHeight > A4_SAFE_HEIGHT_PX && density === "compact") {
        density = "ultra";
        paperSheet.setAttribute("data-density", density);
        renderedHeight = measureTrueA4Height();
      }

      // 唯有在目標密度下真實列印高度依然超過 A4_SAFE_HEIGHT_PX 時，才精準計算微縮比例
      if (renderedHeight > A4_SAFE_HEIGHT_PX) {
        const heightRatio = A4_SAFE_HEIGHT_PX / renderedHeight;
        const safeRatio = Math.floor(heightRatio * 100) / 100;
        zoomFactor = Math.max(0.76, Math.min(zoomFactor, safeRatio));
      }

      const zoomStr = zoomFactor.toFixed(2);
      document.documentElement.style.setProperty("--qp-print-zoom", zoomStr);
      paperSheet.style.setProperty("--qp-print-zoom", zoomStr);

      if (statusText) {
        const pct = Math.round(zoomFactor * 100);
        const modeDesc = density === "ultra" ? "超緊湊單頁模式" : (density === "compact" ? "緊湊單頁模式" : "標準單頁模式");
        statusText.textContent = "✓ 單頁 A4 智慧鎖定已啟動：目前共 " + itemCount + " 個工項 ｜ 自動切換「" + modeDesc + "（適配比例 " + pct + "%）」・保證 100% 單頁 PDF 輸出不跨頁";
      }
    }

    /* 依據工程類別動態管控專屬加購項顯示狀態，防止跨類別幽靈計價 */
    function syncAddonAvailability(cat) {
      const isWt = (cat === "water_tank" || cat === "both");
      const isCt = (cat === "cooling_tower" || cat === "both");

      function toggleAddonItem(checkboxEl, enabled, badgeHint) {
        if (!checkboxEl) return;
        const labelEl = checkboxEl.closest(".calc-check-item");
        checkboxEl.disabled = !enabled;
        if (labelEl) {
          labelEl.classList.toggle("is-disabled-addon", !enabled);
          if (!enabled && badgeHint) {
            labelEl.setAttribute("title", badgeHint);
          } else {
            labelEl.removeAttribute("title");
          }
        }
      }

      toggleAddonItem(chkLevel, isWt, "此項為「自來水塔與蓄水池」專屬液位控制設備，切換至自來水塔或雙系統合購即可勾選");
      toggleAddonItem(chkFill, isCt, "此項為「商用空調冷卻水塔」專屬散熱填料工程，切換至冷卻水塔或雙系統合購即可勾選");
      toggleAddonItem(chkInverter, isCt, "此項為「商用空調冷卻水塔」專屬風機變頻調校工程，切換至冷卻水塔或雙系統合購即可勾選");
    }

    function applyStoredDraft(showNotification, fromParamVal) {
      const draft = loadQuoteDraft();
      if (!draft) {
        if (showNotification) showToast("目前尚無跨頁試算紀錄，已為您維持預設標準規格！");
        return;
      }

      if (fromParamVal === "water-tank" && elCategory) {
        const targetCat = (draft.serviceCategory === "both") ? "both" : "water_tank";
        setSelectValueSafely(elCategory, targetCat, "water_tank");
      } else if (fromParamVal === "cooling-tower" && elCategory) {
        const targetCat = (draft.serviceCategory === "both") ? "both" : "cooling_tower";
        setSelectValueSafely(elCategory, targetCat, "cooling_tower");
      } else if (draft.serviceCategory && elCategory) {
        setSelectValueSafely(elCategory, draft.serviceCategory, "water_tank");
      }

      if (elDisplayMode) {
        if (fromParamVal) {
          setSelectValueSafely(elDisplayMode, draft.displayMode || "ab_compare", "ab_compare");
        } else if (draft.displayMode) {
          setSelectValueSafely(elDisplayMode, draft.displayMode, "ab_compare");
        }
      }

      if (draft.clientName && elClientName) {
        elClientName.value = String(draft.clientName);
      }
      if (draft.contactPerson && elContactPerson) {
        elContactPerson.value = String(draft.contactPerson);
      }
      if (draft.region && elClientAddr) {
        const curAddr = elClientAddr.value.trim();
        if (!curAddr || curAddr === "台北市 / 新北市" || curAddr === "桃園市 / 新竹縣市" || curAddr === "其他外縣市專案") {
          elClientAddr.value = String(draft.region);
        }
      }
      if (draft.clientAddr && elClientAddr && !fromParamVal) {
        elClientAddr.value = String(draft.clientAddr);
      } else if (draft.region && elClientAddr && fromParamVal) {
        elClientAddr.value = String(draft.region);
      }
      if (draft.docNo && elDocNo) {
        elDocNo.value = String(draft.docNo);
      }
      if (draft.docDate && elDocDate) {
        elDocDate.value = String(draft.docDate);
      }

      if (draft.wtTonnage && elWtTonnage) setSelectValueSafely(elWtTonnage, draft.wtTonnage, "120");
      if (draft.wtMaterial && elWtMaterial) setSelectValueSafely(elWtMaterial, draft.wtMaterial, "concrete");
      if (draft.wtPoolCount !== undefined && elWtPools) setSelectValueSafely(elWtPools, draft.wtPoolCount, "0");
      if (draft.ctRtScale && elCtRt) setSelectValueSafely(elCtRt, draft.ctRtScale, "100");
      if (draft.ctTowerType && elCtType) setSelectValueSafely(elCtType, draft.ctTowerType, "open_round");
      if (draft.ctTowerCount !== undefined && elCtCount) setSelectValueSafely(elCtCount, draft.ctTowerCount, "0");

      if (chkPvc && draft.chkPvcValve !== undefined) chkPvc.checked = Boolean(draft.chkPvcValve);
      if (chkButterfly && draft.chkButterfly !== undefined) chkButterfly.checked = Boolean(draft.chkButterfly);
      if (chkLevel && draft.chkLevel !== undefined) chkLevel.checked = Boolean(draft.chkLevel);
      if (chkFill && draft.chkFill !== undefined) chkFill.checked = Boolean(draft.chkFill);
      if (chkInverter && draft.chkInverter !== undefined) chkInverter.checked = Boolean(draft.chkInverter);

      if (elCustomName && draft.customName !== undefined) {
        elCustomName.value = String(draft.customName);
      }
      if (elCustomPrice && draft.customPrice !== undefined) {
        elCustomPrice.value = String(draft.customPrice);
      }
      if (elTaxMode && draft.chkTax !== undefined) {
        setSelectValueSafely(elTaxMode, draft.chkTax ? "include_5" : "exclude_5", "include_5");
      }

      renderQuotation(false);
      if (showNotification) {
        const planHint = (draft.scheduleMode === "weekday_35")
          ? "（已同步列出 A/B 雙軌方案與您選擇的 B方案平日併單特惠）"
          : "";
        showToast("✓ 已成功載入您剛才儲存的試算與報價規格！" + planHint);
      }
    }

    function persistCurrentQuoteState() {
      saveQuoteDraft({
        displayMode: elDisplayMode ? elDisplayMode.value : "ab_compare",
        serviceCategory: elCategory ? elCategory.value : "water_tank",
        clientName: elClientName ? elClientName.value.trim() : "",
        contactPerson: elContactPerson ? elContactPerson.value.trim() : "",
        clientAddr: elClientAddr ? elClientAddr.value.trim() : "",
        docNo: elDocNo ? elDocNo.value.trim() : "",
        docDate: elDocDate ? elDocDate.value.trim() : "",
        wtTonnage: elWtTonnage ? elWtTonnage.value : "120",
        wtMaterial: elWtMaterial ? elWtMaterial.value : "concrete",
        wtPoolCount: elWtPools ? elWtPools.value : "0",
        ctRtScale: elCtRt ? elCtRt.value : "100",
        ctTowerType: elCtType ? elCtType.value : "open_round",
        ctTowerCount: elCtCount ? elCtCount.value : "0",
        chkPvcValve: Boolean(chkPvc && chkPvc.checked),
        chkLevel: Boolean(chkLevel && chkLevel.checked),
        chkButterfly: Boolean(chkButterfly && chkButterfly.checked),
        chkFill: Boolean(chkFill && chkFill.checked),
        chkInverter: Boolean(chkInverter && chkInverter.checked),
        customName: elCustomName ? elCustomName.value.trim() : "",
        customPrice: elCustomPrice ? elCustomPrice.value : "0",
        chkTax: (elTaxMode ? elTaxMode.value : "include_5") === "include_5"
      });
    }

    function renderQuotation(shouldPersist) {
      const displayMode = elDisplayMode ? elDisplayMode.value : "ab_compare";
      const cat = elCategory ? elCategory.value : "water_tank";
      const isWtActive = (cat === "water_tank" || cat === "both");
      const isCtActive = (cat === "cooling_tower" || cat === "both");

      if (boxWtGroup) {
        boxWtGroup.style.display = isWtActive ? "block" : "none";
      }
      if (boxCtGroup) {
        boxCtGroup.style.display = isCtActive ? "block" : "none";
      }

      // 同步管控專屬加購項，防止純自來水塔報價單混入冷卻塔散熱材/變頻器費用
      syncAddonAvailability(cat);

      const clientName = (elClientName && elClientName.value.trim()) ? elClientName.value.trim() : "貴社區管理委員會 ／ 貴公司廠務部";
      const contactPerson = (elContactPerson && elContactPerson.value.trim()) ? elContactPerson.value.trim() : "總幹事 ／ 廠務主管 鈞啟";
      const clientAddr = (elClientAddr && elClientAddr.value.trim()) ? elClientAddr.value.trim() : "台北市 / 新北市";
      const docNo = (elDocNo && elDocNo.value.trim()) ? elDocNo.value.trim() : ("HS-" + yyyy + mm + dd + "-01");
      const docDate = (elDocDate && elDocDate.value.trim()) ? elDocDate.value.trim() : (yyyy + "-" + mm + "-" + dd);
      const docYear = /^\d{4}/.test(docDate) ? docDate.slice(0, 4) : yyyy;

      if (outClientName) outClientName.textContent = clientName;
      if (outContact) outContact.textContent = contactPerson;
      if (outAddr) outAddr.textContent = clientAddr;
      if (outDocNo) outDocNo.textContent = docNo;
      if (outDocDate) outDocDate.textContent = docDate + "（效期15天）";

      const items = [];

      // 1. 計算自來水塔主工項（升級 [自來水塔專家 W1/W2/W3]：消除 10 噸 FRP 誤印 RC 水池之矛盾，並補齊餘氯與防空轉極棒規格）
      if (isWtActive) {
        const ton = clampNumber(elWtTonnage ? elWtTonnage.value : 120, 10, 500, 120);
        const mat = elWtMaterial ? elWtMaterial.value : "concrete";
        const poolLv = clampNumber(elWtPools ? elWtPools.value : 0, 0, 2, 0);

        let priceA = 23000;
        let priceB = 17500;
        let specDesc = "高壓水刀除垢、50~100ppm食品級次氯酸鈉消毒（完工餘氯符合0.2~1.0mg/L飲用水標準）、缺氧作業主管氣體測定與雙人專責戒護";

        if (ton <= 10) {
          if (mat === "stainless") {
            priceA = 4600;
            priceB = 3800;
            specDesc = (poolLv === 0)
              ? "頂樓免入槽單人快洗編制（正職勞健保技師＋高壓水刀除垢＋50~100ppm次氯酸鈉消毒，完工餘氯0.2~1.0mg/L）"
              : "10噸內頂樓不鏽鋼水塔基本清洗（正職勞健保技師＋高壓水刀除垢＋50~100ppm次氯酸鈉消毒；跨棟多顆移機費另列於次項）";
          } else if (mat === "frp") {
            priceA = 13000;
            priceB = 10000;
            specDesc = "10噸內入槽FRP組合水塔（配置3人局限空間標準編制：缺氧作業主管＋雙人戒護＋強制通風與50~100ppm次氯酸鈉消毒）";
          } else {
            priceA = 13000;
            priceB = 10000;
            specDesc = "10噸內入槽RC水泥蓄水池（配置3人局限空間標準編制：缺氧作業主管＋雙人戒護＋強制通風與50~100ppm次氯酸鈉消毒）";
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
          specDesc += "（雙機高速抽排，停水控制在3.5~4hr）";
        }

        const matLabel = (mat === "stainless") ? "SUS304不鏽鋼塔" : (mat === "frp" ? "FRP組合水塔" : "RC水泥上下蓄水池");
        items.push({
          title: "自來水塔與蓄水池高壓清洗消毒（約 " + ton + " 噸級）",
          spec: matLabel + "｜" + specDesc,
          unit: "1 式",
          priceA: priceA,
          priceB: priceB
        });

        if (poolLv === 1) {
          items.push({
            title: "雙棟或分區連通水池跨棟移機作業費（共 3~4 池）",
            spec: "雙套沉水泵浦、高壓機具與水帶跨棟移設及分池排氣復歸",
            unit: "1 式",
            priceA: 4500,
            priceB: 3800
          });
        } else if (poolLv === 2) {
          items.push({
            title: "大型多棟社區連通水池分棟輪洗作業費（5 池以上）",
            spec: "分棟分池輪流停水抽排，確保住戶非停水棟別正常供水",
            unit: "1 式",
            priceA: 9000,
            priceB: 7500
          });
        }

        items.push({
          title: "【專案贈送】給水機電系統深度安全健檢（原價 $4,500）",
          spec: "含 Omron 61F-G2 高低水位與共用接地極(E1~E3)除垢、下水池防無水空轉保護迴路測試、揚水馬達電流實測與進水閥止水檢查",
          unit: "1 式",
          priceA: 0,
          priceB: 0,
          isFreeGift: true
        });
      }

      // 2. 計算商用空調冷卻水塔主工項（升級 [冷卻水塔專家 C1 & C3]：依圓型/方型/密閉式與噸數規模動態輸出精準廠務規格）
      if (isCtActive) {
        const rt = clampNumber(elCtRt ? elCtRt.value : 100, 10, 1000, 100);
        const ctType = elCtType ? elCtType.value : "open_round";
        const ctCount = clampNumber(elCtCount ? elCtCount.value : 0, 0, 2, 0);

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

        const driveCheckText = (rt >= 200)
          ? "減速齒輪箱(Gear Reducer)/多溝皮帶與Y型過濾器點檢、三相電流實測"
          : "風機皮帶張力/軸承點檢、底盤吸水濾網清洗與三相電流實測";

        let ctSpecDetail = "";
        if (ctType === "closed_circuit") {
          ctSpecDetail = "密閉式冷卻水塔｜含風機與噴淋泵 LOTO 斷電掛牌、內循環熱交換銅管/不鏽鋼盤管除垢沖洗、噴淋嘴疏通、底盤吸泥與" + driveCheckText;
        } else if (ctType === "open_square") {
          ctSpecDetail = "方型低噪音開放式水塔｜含風機 LOTO 斷電掛牌、雙側重力播水盆與散水孔疏通、雙側百葉與散熱材定壓沖洗、底盤吸泥與" + driveCheckText;
        } else {
          ctSpecDetail = "良機/跨廠牌圓型開放式水塔｜含風機 LOTO 斷電掛牌、頂部旋轉播水頭與散水管疏通、散熱材定壓沖洗、底盤吸泥與" + driveCheckText;
        }

        items.push({
          title: "商用空調冷卻水塔深度清洗保養（約 " + rt + " RT 冷凍噸）",
          spec: ctSpecDetail,
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

      // 3. 計算機電閥件與選配加購項（依類別啟用狀態精準過濾，阻絕跨系統殘留汙染）
      if (chkPvc && chkPvc.checked) {
        items.push({
          title: "2 吋內進水／冷卻塔補給水 PVC 球閥與青銅浮球閥更新工程",
          spec: "含舊閥拆卸、南亞 PVC 雙由令球閥或重型青銅浮球閥換裝與止水測試",
          unit: "1 組",
          priceA: 3800,
          priceB: 3500
        });
      }
      if (isWtActive && chkLevel && chkLevel.checked) {
        items.push({
          title: "Omron 61F-G2 液位控制器 ＋ SUS304 電極棒整組更新",
          spec: "日本歐姆龍原廠 61F-G2 控制器、保持器、304 不鏽鋼電極棒(E1~E3)與高低水位連動測試",
          unit: "1 組",
          priceA: 4500,
          priceB: 4200
        });
      }
      if (chkButterfly && chkButterfly.checked) {
        items.push({
          title: "大口徑 6吋~10吋 FCD/SUS304 齒輪式蝴蝶閥更換工程",
          spec: "鑄鐵本體＋304不鏽鋼蝶板＋重型齒輪箱、EPDM 法蘭墊片與白鐵螺栓連工帶料",
          unit: "1 組",
          priceA: 18000,
          priceB: 16500
        });
      }
      if (isCtActive && chkFill && chkFill.checked) {
        items.push({
          title: "冷卻水塔 PVC 散熱材（膠片填料）局部除垢與更新工程",
          spec: "清除嚴重鈣化脆化散熱膠片並換裝高親水性耐溫 PVC 散熱填料",
          unit: "1 式",
          priceA: 8500,
          priceB: 7500
        });
      }
      if (isCtActive && chkInverter && chkInverter.checked) {
        items.push({
          title: "東元（TECO F510）變頻器節能參數調校與溫控連動檢測",
          spec: "回水溫控頻率曲線最佳化、馬達絕緣測試與過載保護點檢",
          unit: "1 式",
          priceA: 4500,
          priceB: 4200
        });
      }

      // 4. 自訂追加項目或專案折讓（A/B 雙方案與單一方案獨立判定折讓上限提示）
      let baseSubA = 0;
      let baseSubB = 0;
      items.forEach(function (it) {
        baseSubA += it.priceA;
        baseSubB += it.priceB;
      });

      const rawCustomPrice = elCustomPrice ? elCustomPrice.value : "0";
      const customPriceVal = clampNumber(rawCustomPrice, CUSTOM_PRICE_MIN, CUSTOM_PRICE_MAX, 0);
      let customPriceA = customPriceVal;
      let customPriceB = customPriceVal;
      let isCappedA = false;
      let isCappedB = false;

      if (customPriceVal < 0) {
        if (Math.abs(customPriceVal) > baseSubA) {
          customPriceA = -baseSubA;
          isCappedA = true;
        }
        if (Math.abs(customPriceVal) > baseSubB) {
          customPriceB = -baseSubB;
          isCappedB = true;
        }
      }

      const isDiscountCappedForMode = (displayMode === "only_a")
        ? isCappedA
        : ((displayMode === "only_b") ? isCappedB : (isCappedA || isCappedB));

      const customNameVal = (elCustomName && elCustomName.value.trim())
        ? elCustomName.value.trim()
        : (customPriceVal < 0 ? "老客戶續約 ／ 管委會專案核定特別折讓" : "現場特殊管線改造 ／ 追加工程項目");

      if (customPriceVal !== 0) {
        const capHint = isDiscountCappedForMode ? "（已自動依工程小計上限折抵）" : "";
        items.push({
          title: customNameVal,
          spec: (customPriceVal < 0 ? "老客戶續約或管委會專案核定特別折讓（直接扣抵工程小計）" : "依現場實際人孔高度、管徑或特殊動線追加項目") + capHint,
          unit: "1 式",
          priceA: customPriceA,
          priceB: customPriceB
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

      // 輔助格式化單價（正數與負數折讓優雅顯示）
      function formatItemPrice(val, isFreeGift) {
        if (isFreeGift) {
          return "<span style='color:#16a34a;font-weight:900;'>免費贈送</span>";
        }
        if (val < 0) {
          return "<span style='color:#dc2626;font-weight:800;'>- NT$ " + Math.abs(val).toLocaleString() + "</span>";
        }
        return "NT$ " + val.toLocaleString();
      }

      // 渲染表格表頭
      if (outThead) {
        if (displayMode === "ab_compare") {
          outThead.innerHTML = "<tr>" +
            "<th style='width:5%;'>項次</th>" +
            "<th style='width:33%;'>工程與機電檢修項目</th>" +
            "<th style='width:32%;'>施工規格與職安配置說明</th>" +
            "<th style='width:7%;'>單位</th>" +
            "<th class='num-col' style='width:11.5%;'>A方案：專車全責</th>" +
            "<th class='num-col' style='width:11.5%;'>B方案：平日併單</th>" +
            "</tr>";
        } else {
          const singleTitle = (displayMode === "only_a") ? "A方案：專車全責單價" : "B方案：平日併單單價";
          outThead.innerHTML = "<tr>" +
            "<th style='width:6%;'>項次</th>" +
            "<th style='width:36%;'>工程與機電檢修項目</th>" +
            "<th style='width:36%;'>施工規格與職安配置說明</th>" +
            "<th style='width:8%;'>單位</th>" +
            "<th class='num-col' style='width:14%;'>" + escapeHtml(singleTitle) + "</th>" +
            "</tr>";
        }
      }

      // 渲染表格內容列（全欄位強制通過 escapeHtml 防止 DOM XSS 與破版）
      if (outTbody) {
        const rowsHtml = items.map(function (it, idx) {
          const numStr = String(idx + 1).padStart(2, "0");
          const safeTitle = escapeHtml(it.title);
          const safeSpec = escapeHtml(it.spec);
          const safeUnit = escapeHtml(it.unit);
          const pAStr = formatItemPrice(it.priceA, it.isFreeGift);
          const pBStr = formatItemPrice(it.priceB, it.isFreeGift);

          if (displayMode === "ab_compare") {
            return "<tr>" +
              "<td>" + numStr + "</td>" +
              "<td><strong>" + safeTitle + "</strong></td>" +
              "<td>" + safeSpec + "</td>" +
              "<td>" + safeUnit + "</td>" +
              "<td class='num-col'>" + pAStr + "</td>" +
              "<td class='num-col' style='color:#0369a1;'>" + pBStr + "</td>" +
              "</tr>";
          } else {
            const chosenStr = (displayMode === "only_a") ? pAStr : pBStr;
            return "<tr>" +
              "<td>" + numStr + "</td>" +
              "<td><strong>" + safeTitle + "</strong></td>" +
              "<td>" + safeSpec + "</td>" +
              "<td>" + safeUnit + "</td>" +
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
                "<div style='font-size:0.8rem;color:#475569;'>未稅小計：NT$ " + subA.toLocaleString() +
                (includeTax ? (" ＋ 5%營業稅：NT$ " + taxA.toLocaleString()) : "（未稅，開發票另加5%）") + "</div>" +
                "<div class='qp-plan-price'>總計 NT$ " + totalA.toLocaleString() + " 元" + (includeTax ? "（含稅）" : "（未稅）") + "</div>" +
                "<div style='font-size:0.78rem;color:#334155;font-weight:700;'>大寫：" + escapeHtml(toTaiwaneseUpperCurrency(totalA)) + "</div>" +
              "</div>" +
              "<div class='qp-plan-card' style='border-color:#0284c7;background:#f0f9ff;'>" +
                "<div class='qp-plan-title' style='color:#0369a1;'>⚡ B方案：平日彈性順路併單特惠（現省 NT$ " + savedDiff.toLocaleString() + " 元）</div>" +
                "<div style='font-size:0.8rem;color:#475569;'>未稅小計：NT$ " + subB.toLocaleString() +
                (includeTax ? (" ＋ 5%營業稅：NT$ " + taxB.toLocaleString()) : "（未稅，開發票另加5%）") + "</div>" +
                "<div class='qp-plan-price' style='color:#0284c7;'>總計 NT$ " + totalB.toLocaleString() + " 元" + (includeTax ? "（含稅）" : "（未稅）") + "</div>" +
                "<div style='font-size:0.78rem;color:#334155;font-weight:700;'>大寫：" + escapeHtml(toTaiwaneseUpperCurrency(totalB)) + "</div>" +
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
            "<div class='qp-plan-card' style='border-width:1.5px;'>" +
              "<div class='qp-plan-title'>" + escapeHtml(planTitle) + "</div>" +
              "<div style='font-size:0.84rem;color:#475569;'>未稅工程小計：NT$ " + sub.toLocaleString() + " 元" +
              (includeTax ? (" ｜ 5% 統一發票營業稅：NT$ " + tax.toLocaleString() + " 元") : "（本報價為未稅價，開立統一發票另加 5% 營業稅）") + "</div>" +
              "<div class='qp-plan-price' style='font-size:1.35rem;'>總計金額：NT$ " + tot.toLocaleString() + " 元" + (includeTax ? "（含稅總價）" : "（未稅總價）") + "</div>" +
              "<div style='font-size:0.82rem;color:#0f172a;font-weight:800;margin-top:2px;'>國字大寫：" + escapeHtml(toTaiwaneseUpperCurrency(tot)) + "</div>" +
            "</div>";
        }
      }

      // 渲染管委會簽核勾選區（動態帶入報價年份 docYear，消除寫死 2026 跨年誤差）
      if (outDecisionArea) {
        if (displayMode === "ab_compare") {
          outDecisionArea.innerHTML =
            "<div style='font-weight:900;color:#0f172a;margin-bottom:4px;font-size:0.84rem;'>【客戶／社區管委會決議簽核欄（二選一打勾回傳）】</div>" +
            "<div style='margin-bottom:3px;font-size:0.8rem;'>□ 採行 <strong>A方案（指定專車：NT$ " + totalA.toLocaleString() + "）</strong>，預計日期：" + escapeHtml(docYear) + "年____月____日</div>" +
            "<div style='margin-bottom:8px;font-size:0.8rem;'>□ 採行 <strong>B方案（平日併單：NT$ " + totalB.toLocaleString() + "）</strong>，授權協調平日順路檔期</div>" +
            "<div style='margin-top:8px;border-top:1px solid #94a3b8;padding-top:6px;font-size:0.8rem;'>主委／客戶代表簽章：____________________ 日期：____/____/____</div>";
        } else {
          const chosenTot = (displayMode === "only_a") ? totalA : totalB;
          outDecisionArea.innerHTML =
            "<div style='font-weight:900;color:#0f172a;margin-bottom:4px;font-size:0.84rem;'>【客戶／社區管委會正式委託簽認欄】</div>" +
            "<div style='margin-bottom:6px;font-size:0.8rem;'>茲同意委託皓盛有限公司依本報價單規格進場施作，核定總額 <strong>NT$ " + chosenTot.toLocaleString() + " 元</strong>。</div>" +
            "<div style='margin-bottom:8px;font-size:0.8rem;'>預計施工日期：" + escapeHtml(docYear) + " 年 ____ 月 ____ 日（停水公告於施工前3日張貼）</div>" +
            "<div style='margin-top:8px;border-top:1px solid #94a3b8;padding-top:6px;font-size:0.8rem;'>主委／客戶代表簽章：____________________ 日期：____/____/____</div>";
        }
      }

      if (shouldPersist !== false) {
        persistCurrentQuoteState();
      }

      // 啟動智慧單頁 A4 動態縮放計算（傳入工項數與自訂文字總長度）
      const extraTextLen = clientName.length + clientAddr.length + customNameVal.length;
      autoFitSinglePagePDF(items.length, extraTextLen);

      // 回傳純文字摘要供 LINE 複製使用
      const lineItemsText = items.map(function (it, i) {
        if (it.isFreeGift) return (i + 1) + ". " + it.title + "：免費附贈";
        if (it.priceA < 0 || it.priceB < 0) {
          if (displayMode === "ab_compare" && it.priceA !== it.priceB) {
            return (i + 1) + ". " + it.title + "：A專車折讓 -$" + Math.abs(it.priceA).toLocaleString() + " / B平日折讓 -$" + Math.abs(it.priceB).toLocaleString();
          }
          const discVal = (displayMode === "only_b") ? Math.abs(it.priceB) : Math.abs(it.priceA);
          return (i + 1) + ". " + it.title + "：折讓 -NT$ " + discVal.toLocaleString();
        }
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

    // 處理中文輸入法 (IME Composition) 與 rAF 節流，避免打字過程頻繁重繪 DOM 卡頓
    let isComposing = false;
    let renderRafId = null;

    function scheduleRender() {
      if (isComposing) return;
      if (renderRafId !== null) cancelAnimationFrame(renderRafId);
      renderRafId = requestAnimationFrame(function () {
        renderQuotation(true);
        renderRafId = null;
      });
    }

    form.addEventListener("compositionstart", function () {
      isComposing = true;
    });
    form.addEventListener("compositionend", function () {
      isComposing = false;
      scheduleRender();
    });
    form.addEventListener("change", function () { renderQuotation(true); });
    form.addEventListener("input", scheduleRender);

    // 視窗旋轉或尺寸改變時重新計算 A4 單頁縮放比（加防抖保護）
    let resizeRafId = null;
    window.addEventListener("resize", function () {
      if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(function () {
        renderQuotation(false);
        resizeRafId = null;
      });
    });

    // 跨分頁 storage 與 bfcache pageshow 即時同步保護
    window.addEventListener("pageshow", function (e) {
      if (e && e.persisted && loadQuoteDraft()) {
        applyStoredDraft(false, "");
      }
    });
    window.addEventListener("storage", function (e) {
      if (!e || e.key === DRAFT_STORAGE_KEY || e.key === null) {
        if (loadQuoteDraft()) {
          applyStoredDraft(false, "");
        }
      }
    });

    // 列印前後檔名安全鎖定（過濾控制字元與超長檔名，並避免按鈕觸發與 beforeprint 重複重繪）
    function applyPrintDocumentTitle() {
      if (savedDocumentTitle === null) {
        savedDocumentTitle = document.title;
      }
      const cName = sanitizeFilenamePart(elClientName ? elClientName.value : "", "社區與商場專案", 32);
      const dNo = sanitizeFilenamePart(elDocNo ? elDocNo.value : "", "HS報價單", 24);
      document.title = "皓盛有限公司_單頁正式報價單_" + cName + "_" + dNo;

      if (printTitleFallbackTimerId !== null) clearTimeout(printTitleFallbackTimerId);
      printTitleFallbackTimerId = setTimeout(function () {
        restorePrintDocumentTitle();
      }, 8000);
    }

    function restorePrintDocumentTitle() {
      isPrintButtonTriggering = false;
      if (printTitleFallbackTimerId !== null) {
        clearTimeout(printTitleFallbackTimerId);
        printTitleFallbackTimerId = null;
      }
      if (savedDocumentTitle !== null) {
        document.title = savedDocumentTitle;
        savedDocumentTitle = null;
      }
    }

    window.addEventListener("beforeprint", function () {
      if (!isPrintButtonTriggering) {
        renderQuotation(false);
      }
      applyPrintDocumentTitle();
    });

    window.addEventListener("afterprint", function () {
      restorePrintDocumentTitle();
    });

    // 修補 Safari / 行動瀏覽器對 beforeprint/afterprint 支援不完整之問題
    if (window.matchMedia) {
      try {
        const printMediaQuery = window.matchMedia("print");
        const handlePrintMediaChange = function (mql) {
          if (mql.matches) {
            if (!isPrintButtonTriggering) {
              renderQuotation(false);
            }
            applyPrintDocumentTitle();
          } else {
            restorePrintDocumentTitle();
          }
        };
        if (typeof printMediaQuery.addEventListener === "function") {
          printMediaQuery.addEventListener("change", handlePrintMediaChange);
        } else if (typeof printMediaQuery.addListener === "function") {
          printMediaQuery.addListener(handlePrintMediaChange);
        }
      } catch (e) {}
    }

    // 智慧規格收合面板控制（從試算器跳轉過來時自動收合重複的規格選單，直接聚焦客戶寶號與 A4 報價單）
    const btnToggleSpecs = document.getElementById("btn-toggle-tech-specs");
    const boxSpecsCollapse = document.getElementById("q-tech-specs-collapse");
    const lblToggleSpecs = document.getElementById("tech-specs-toggle-label");

    function setSpecsCollapsed(collapsed) {
      if (!boxSpecsCollapse || !btnToggleSpecs) return;
      boxSpecsCollapse.classList.toggle("is-collapsed", Boolean(collapsed));
      btnToggleSpecs.setAttribute("aria-expanded", collapsed ? "false" : "true");
      if (lblToggleSpecs) {
        lblToggleSpecs.textContent = collapsed
          ? "✓ 3. 已自動帶入您剛才選好的水塔與閥件規格（點此展開微調規格 ▸）"
          : "🔧 3. 工程規格與機電加購明細（點此收合規格選單 ▾）";
      }
    }

    if (btnToggleSpecs && boxSpecsCollapse) {
      btnToggleSpecs.addEventListener("click", function () {
        const isCurrentlyCollapsed = boxSpecsCollapse.classList.contains("is-collapsed");
        setSpecsCollapsed(!isCurrentlyCollapsed);
      });
    }

    // 頁面初次進入：解析 URL 參數（支援網址參數直傳＋localStorage 雙重保障，徹底免除手動按載入）
    let fromParamVal = "";
    try {
      const params = new URLSearchParams(window.location.search || "");
      fromParamVal = params.get("from") || "";
      if (fromParamVal === "water-tank") {
        const urlPatch = {
          serviceCategory: params.get("cat") || "water_tank",
          scheduleMode: params.get("mode") || "priority_50",
          displayMode: "ab_compare"
        };
        if (params.get("reg")) urlPatch.region = params.get("reg");
        if (params.get("ton")) urlPatch.wtTonnage = params.get("ton");
        if (params.get("mat")) urlPatch.wtMaterial = params.get("mat");
        if (params.get("pools") !== null) urlPatch.wtPoolCount = params.get("pools");
        if (params.get("pvc") !== null) urlPatch.chkPvcValve = (params.get("pvc") === "1");
        if (params.get("bf") !== null) urlPatch.chkButterfly = (params.get("bf") === "1");
        if (params.get("lvl") !== null) urlPatch.chkLevel = (params.get("lvl") === "1");
        if (params.get("tax") !== null) urlPatch.chkTax = (params.get("tax") === "1");
        if (urlPatch.serviceCategory === "both") {
          urlPatch.ctRtScale = "50";
          urlPatch.ctTowerType = "open_round";
          urlPatch.ctTowerCount = "0";
        }
        saveQuoteDraft(urlPatch);
      } else if (fromParamVal === "cooling-tower") {
        const urlPatch = {
          serviceCategory: params.get("cat") || "cooling_tower",
          scheduleMode: params.get("mode") || "priority_50",
          displayMode: "ab_compare"
        };
        if (params.get("reg")) urlPatch.region = params.get("reg");
        if (params.get("rt")) urlPatch.ctRtScale = params.get("rt");
        if (params.get("type")) urlPatch.ctTowerType = params.get("type");
        if (params.get("cnt") !== null) urlPatch.ctTowerCount = params.get("cnt");
        if (params.get("fill") !== null) urlPatch.chkFill = (params.get("fill") === "1");
        if (params.get("bf") !== null) urlPatch.chkButterfly = (params.get("bf") === "1");
        if (params.get("pvc") !== null) urlPatch.chkPvcValve = (params.get("pvc") === "1");
        if (params.get("inv") !== null) urlPatch.chkInverter = (params.get("inv") === "1");
        if (params.get("tax") !== null) urlPatch.chkTax = (params.get("tax") === "1");
        saveQuoteDraft(urlPatch);
      }
    } catch (e) {
      if (window.location.search.indexOf("from=water-tank") !== -1) fromParamVal = "water-tank";
      else if (window.location.search.indexOf("from=cooling-tower") !== -1) fromParamVal = "cooling-tower";
    }

    if (loadQuoteDraft()) {
      applyStoredDraft(Boolean(fromParamVal), fromParamVal);
    } else {
      renderQuotation(false);
    }

    // 若從試算器跳轉而來，自動收合已選好的重複規格欄並將視線聚焦至報價單工作台
    if (fromParamVal) {
      setSpecsCollapsed(true);
      setTimeout(function () {
        const targetAnchor = document.getElementById("qp-workspace-anchor") || paperSheet;
        if (targetAnchor && typeof targetAnchor.scrollIntoView === "function") {
          try {
            targetAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch (err) {
            targetAnchor.scrollIntoView();
          }
        }
      }, 80);
    }

    if (btnPrintPdf) {
      btnPrintPdf.addEventListener("click", function () {
        isPrintButtonTriggering = true;
        renderQuotation(true);
        applyPrintDocumentTitle();
        window.print();
        setTimeout(function () {
          isPrintButtonTriggering = false;
        }, 500);
      });
    }

    if (btnCopyLine) {
      btnCopyLine.addEventListener("click", function () {
        const text = renderQuotation(true);
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
