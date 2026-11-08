/**
 * 皓盛有限公司 (5390857.com) - 雙引擎試算與 A4 單頁智慧鎖定報價核心系統 (v21.1 雙專家滿分完全體正式版)
 * 涵蓋模組：
 * 1. Before/After 清洗前後視覺對比拉桿（Pointer Events ＋ 鍵盤無障礙 A11y ＋ rAF 節流與失焦保護）
 * 2. 社區大樓自來水塔 A/B 雙軌試算器 ＋ 跨頁雙向記憶與無汙染帶入報價單生成器 (localStorage + pageshow/storage)
 * 3. 商用空調冷卻水塔（10RT~500RT+）A/B 雙軌試算器 ＋ 跨頁雙向記憶與無汙染帶入報價單生成器
 * 4. 線上立即估價 (quote.html)：
 *    - 涵蓋紅藍軍 v11.0 全部 8 項資安、會計大寫、跨類別加購隔離與離線 A4 沙盒量測修復
 *    - 升級 [自來水塔專家 W1]：修正 10 噸內選 FRP 組合式水塔或多棟不鏽鋼塔時，報價單誤印「入槽 RC 水池」之材質文字矛盾
 *    - 升級 [自來水塔專家 W2]：精準化 Omron 61F-G2 液位開關說明（E1~E3 高低水位與共用接地極除垢＋下水池防無水空轉保護迴路測試）
 *    - 水質、藥劑使用與驗收需求須依實際用途、標示及適用規範確認
 *    - 升級 [冷卻水塔專家 C1]：依水塔型式（圓型開放式／方型開放式／密閉式）動態分流「旋轉播水頭／雙側重力播水盆／內循環熱交換盤管」專業規格說明
 *    - 升級 [冷卻水塔專家 C2]：修正從自來水塔頁勾選「加購 50RT 內冷卻水塔 (+7,000/+5,500)」跳轉報價單時，強制對齊 50RT 單座圓型塔，消除舊草稿 100RT 造成的 $6,000 價差
 *    - 升級 [冷卻水塔專家 C3]：200RT~500RT+ 大型冷卻水塔納入「減速齒輪箱(Gear Reducer)／多溝皮帶點檢」與「底盤吸水濾網及管路 Y 型過濾器清洗」
 */

(function () {
  "use strict";

  const SSOT_CFG = (typeof window !== "undefined" && window.HS_PRICING_CONFIG) ? window.HS_PRICING_CONFIG : null;
  const COMPANY_INFO = (SSOT_CFG && SSOT_CFG.company) ? SSOT_CFG.company : {
    name: "皓盛有限公司",
    taxId: "90221911",
    owner: "李思遠",
    phone: "0916-093-125",
    lineId: "0916093125",
    lineUrl: "https://line.me/ti/p/~0916093125",
    email: "ssuyuan@kimo.com"
  };

  /* [v23.0 新增] 報價單 4 碼動態計算參考碼演算法 (Calculation Reference Hash) */
  function computeQuoteVerifyHash(cat, itemCount, totalA, totalB, includeTax) {
    const rawPayload = [
      String(cat || "wt"),
      String(itemCount || 0),
      String(totalA || 0),
      String(totalB || 0),
      includeTax ? "T1" : "T0",
      "HS90221911"
    ].join("|");
    let hash = 2166136261;
    for (let i = 0; i < rawPayload.length; i++) {
      hash ^= rawPayload.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  }

  /* [v23.0 新增] 報價單完整狀態網址序列化 (1-Click Shareable URL Builder) */
  function buildShareableQuoteUrl(stateObj) {
    if (!stateObj) return "https://5390857.com/quote.html";
    const q = new URLSearchParams();
    q.set("from", "share");
    if (stateObj.displayMode) q.set("dmode", stateObj.displayMode);
    if (stateObj.serviceCategory) q.set("cat", stateObj.serviceCategory);
    // Share only specifications and amounts. Keep personal/free-text fields in the local draft.
    // URLs may be retained in browser history, server logs, forwarded messages and analytics.
    if (stateObj.wtTonnage) q.set("ton", stateObj.wtTonnage);
    if (stateObj.wtMaterial) q.set("mat", stateObj.wtMaterial);
    if (stateObj.wtPoolCount !== undefined) q.set("pools", stateObj.wtPoolCount);
    if (stateObj.ctRtScale) q.set("rt", stateObj.ctRtScale);
    if (stateObj.ctTowerType) q.set("type", stateObj.ctTowerType);
    if (stateObj.ctTowerCount !== undefined) q.set("cnt", stateObj.ctTowerCount);
    if (stateObj.acType) q.set("actype", stateObj.acType);
    if (stateObj.acQty) q.set("acqty", stateObj.acQty);
    if (stateObj.chkAddMpv) q.set("addmpv", "1");
    if (stateObj.mpvSpec) q.set("mpvspec", stateObj.mpvSpec);
    if (stateObj.mpvTier) q.set("mpvtier", stateObj.mpvTier);
    if (stateObj.mpvQty) q.set("mpvqty", stateObj.mpvQty);
    if (stateObj.chkPvcValve) q.set("pvc", "1");
    if (stateObj.chkLevel) q.set("lvl", "1");
    if (stateObj.chkButterfly) q.set("bf", "1");
    if (stateObj.chkFill) q.set("fill", "1");
    if (stateObj.chkCtSprinkler) q.set("ctspr", "1");
    if (stateObj.chkInverter) q.set("inv", "1");
    if (stateObj.chkSgs) q.set("sgs", "1");
    if (stateObj.chkChlorine25kg) q.set("cl25", "1");
    if (stateObj.chkAcDrain) q.set("acdrain", "1");
    if (stateObj.chkAcRepair) q.set("acrepair", "1");
    if (stateObj.shopMode) {
      q.set("shopmode", stateObj.shopMode);
      q.set("shopqty", stateObj.shopQty || "1");
    }
    if (stateObj.chkAcOutdoor) q.set("acout", "1");
    if (stateObj.chkAcSteam) q.set("acsteam", "1");
    if (stateObj.chkValve24) q.set("v24", "1");
    if (stateObj.chkMpvElec) q.set("mpvelec", "1");
    if (stateObj.chkMpvUrgent) q.set("mpvurg", "1");
    // Public quotes never accept client-supplied price adjustments.
    q.set("tax", stateObj.chkTax ? "1" : "0");
    const quoteBase = window.location && /^https?:$/.test(window.location.protocol)
      ? window.location.origin + window.location.pathname
      : "quote.html";
    return quoteBase + "?" + q.toString() + "#qp-workspace-anchor";
  }

  const DRAFT_STORAGE_KEY = "hs_5390857_quote_draft_v11";
  const LEGACY_STORAGE_KEYS = [
    "hs_5390857_quote_draft_v10",
    "hs_5390857_quote_draft_v8"
  ];
  const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
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

  // Only remove this site's known quote draft keys, never unrelated browser data.
  function clearQuoteDraft() {
    memoryDraftFallback = null;
    [DRAFT_STORAGE_KEY].concat(LEGACY_STORAGE_KEYS).forEach(function (key) {
      try { localStorage.removeItem(key); } catch (e) {}
    });
  }

  function isFreshQuoteDraft(draft) {
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) return false;
    const savedAt = Number(draft.updatedAt);
    const age = Date.now() - savedAt;
    return Number.isFinite(savedAt) && savedAt > 0 && age >= 0 && age <= DRAFT_MAX_AGE_MS;
  }

  /* Expire saved drafts after seven days without an update. */
  function loadQuoteDraft() {
    try {
      let raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        for (let i = 0; i < LEGACY_STORAGE_KEYS.length; i++) {
          raw = localStorage.getItem(LEGACY_STORAGE_KEYS[i]);
          if (raw) break;
        }
      }
      if (!raw) {
        memoryDraftFallback = null;
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!isFreshQuoteDraft(parsed)) {
        clearQuoteDraft();
        return null;
      }
      memoryDraftFallback = Object.assign({}, parsed);
      return memoryDraftFallback;
    } catch (e) {}
    if (!isFreshQuoteDraft(memoryDraftFallback)) memoryDraftFallback = null;
    return memoryDraftFallback;
  }

  /* 跨頁草稿儲存（同時寫入記憶體保底與 localStorage，確保 URL 參數直傳在任何沙盒或無痕環境下 依瀏覽器狀態生效） */
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
    const fullText = header + "\n" + summaryText + "\n請李先生協助評估現場檔期與報價單！";

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
    const chkWtValve24 = document.getElementById("chk-wt-valve24");
    const chkWtPumpSeal = document.getElementById("chk-wt-pump-seal");
    const chkButterfly = document.getElementById("chk-butterfly-valve");
    const chkLevel = document.getElementById("chk-level");
    const chkSgsWater = document.getElementById("chk-sgs-water");
    const chkWtChlorine = document.getElementById("chk-wt-chlorine");
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
      if (chkWtValve24 && draft.chkValve24 !== undefined) {
        chkWtValve24.checked = Boolean(draft.chkValve24);
      }
      if (chkWtPumpSeal && draft.chkWtPumpSeal !== undefined) {
        chkWtPumpSeal.checked = Boolean(draft.chkWtPumpSeal);
      }
      if (chkButterfly && draft.chkButterfly !== undefined) {
        chkButterfly.checked = Boolean(draft.chkButterfly);
      }
      if (chkLevel && draft.chkLevel !== undefined) {
        chkLevel.checked = Boolean(draft.chkLevel);
      }
      if (chkSgsWater && draft.chkSgs !== undefined) {
        chkSgsWater.checked = Boolean(draft.chkSgs);
      }
      if (chkWtChlorine && draft.chkChlorine25kg !== undefined) {
        chkWtChlorine.checked = Boolean(draft.chkChlorine25kg);
      }
      if (chkCool && draft.serviceCategory !== undefined) {
        chkCool.checked = (draft.serviceCategory === "both" || draft.serviceCategory === "all_three");
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
        ? "【A方案：指定時段專車】依進入方式與空間條件確認人員、資格、監視、通風及氣體測定；保險與實際配置於進場前核對"
        : "【B方案：平日彈性併單】平日順路時段；依進入方式與空間條件確認人員、資格、監視、通風及氣體測定，保險與實際配置於進場前核對";

      if (tonVal <= 10) {
        if (matVal === "stainless") {
          basePrice = isPriority ? 4600 : 3800;
          hours = (poolLevel === 0) ? "1.5 ~ 2.0 小時" : "2.5 ~ 3.5 小時（多顆/跨棟分批停水快洗）";
          crewMode = isPriority
            ? "【指定時段專車】10噸內白鐵方案限已確認開放式且全程不入槽；若需入槽或條件未明須另評估，作業資格依適用法規及現場危害評估"
            : "【平日順路併單】10噸內白鐵方案限已確認開放式且全程不入槽；若需入槽或條件未明須另評估，作業資格依適用法規及現場危害評估";
        } else {
          basePrice = isPriority ? 13000 : 10500;
          hours = "2.0 ~ 2.5 小時";
        }
      } else if (tonVal <= 50) {
        basePrice = isPriority ? 13000 : 10500;
        hours = "2.5 ~ 3.0 小時";
      } else if (tonVal <= 120) {
        basePrice = isPriority ? 23000 : 17500;
        hours = "3.0 ~ 3.5 小時";
      } else {
        basePrice = isPriority ? 27000 : 24000;
        hours = "3.5 ~ 4.0 小時（雙機同步高速抽排時程待確認）";
      }

      let poolSurcharge = 0;
      if (poolLevel === 1) {
        poolSurcharge = isPriority ? 4500 : 3800;
        if (tonVal >= 50) hours = "3.5 ~ 4.5 小時";
      } else if (poolLevel === 2) {
        poolSurcharge = isPriority ? 9000 : 7500;
        hours = "4.0 ~ 5.5 小時（分棟分池輪流停水，停水安排待確認）";
      }
      basePrice += poolSurcharge;

      const addons = ["可洽詢水質指標量測與給水設備檢查；項目、方法及費用以確認後的書面明細為準，現場少數指標不能單獨證明飲用水安全"];
      if (chkPvcValve && chkPvcValve.checked) {
        const pvcPrice = isPriority ? 3800 : 3500;
        basePrice += pvcPrice;
        addons.push("加購 2吋內進水 PVC 球閥/青銅浮球閥更新 (+NT$" + pvcPrice.toLocaleString() + "起)");
      }
      if (chkWtValve24 && chkWtValve24.checked) {
        const v24Price = isPriority ? 12500 : 11000;
        basePrice += v24Price;
        addons.push("加購 2吋~4吋 蝶閥／不鏽鋼無聲逆止閥(消水錘)／防震軟管抽換 (+NT$" + v24Price.toLocaleString() + "~15,000起)");
      }
      if (chkWtPumpSeal && chkWtPumpSeal.checked) {
        const pumpPrice = isPriority ? 7500 : 5500;
        basePrice += pumpPrice;
        addons.push("加購【會轉都會修】揚水／加壓馬達機械軸封漏水與培林異音順修 (+NT$" + pumpPrice.toLocaleString() + "起・免$2,500檢測費)");
      }
      if (chkButterfly && chkButterfly.checked) {
        const bfPrice = isPriority ? 25000 : 22000;
        basePrice += bfPrice;
        addons.push("加購 6吋~10吋 大口徑齒輪式蝴蝶閥／無聲逆止閥抽換 (+NT$" + bfPrice.toLocaleString() + "~32,000起)");
      }
      if (chkLevel && chkLevel.checked) {
        const lvlPrice = isPriority ? 4500 : 4200;
        basePrice += lvlPrice;
        addons.push("加購 Omron 61F-G2 液位控制器＋304電極棒整組更新 (+NT$" + lvlPrice.toLocaleString() + ")");
      }
      if (chkSgsWater && chkSgsWater.checked) {
        const sgsPrice = isPriority ? 3500 : 3000;
        basePrice += sgsPrice;
        addons.push("加購代客無菌採樣送驗 SGS 飲用水水質檢驗報告（大腸桿菌群／總菌落數）(+NT$" + sgsPrice.toLocaleString() + ")");
      }
      if (chkWtChlorine && chkWtChlorine.checked) {
        basePrice += 2680;
        addons.push("順載 25公斤大桶裝 90% TCCA 氯錠（用途與標示待確認）（原合併方案報價 +NT$2,680/桶；用途、交付方式與費用待確認）");
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
        ? "A方案：指定時段專車專案（作業資格及檢查項目待確認）"
        : "B方案：平日彈性併單特惠檔期（由皓盛安排順路時段施作）";

      if (outPrice) {
        outPrice.textContent = "NT$ " + basePrice.toLocaleString() + " ~ " + maxPrice.toLocaleString() + " 元（" + taxNote + "）";
      }
      if (outHours) {
        outHours.textContent = "施工與停水時段須依現場條件確認";
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
        const isCoolChecked = Boolean(chkCool && chkCool.checked);
        const nextCatWt = isCoolChecked ? "both" : "water_tank";
        const isBoth = isCoolChecked;
        const draftPayload = {
          serviceCategory: nextCatWt,
          scheduleMode: scheduleMode,
          region: regionVal,
          wtTonnage: String(tonVal),
          wtMaterial: matVal,
          wtPoolCount: String(poolLevel),
          chkPvcValve: Boolean(chkPvcValve && chkPvcValve.checked),
          chkValve24: Boolean(chkWtValve24 && chkWtValve24.checked),
          chkWtPumpSeal: Boolean(chkWtPumpSeal && chkWtPumpSeal.checked),
          chkAddMpv: Boolean(chkWtPumpSeal && chkWtPumpSeal.checked),
          mpvSpec: (chkWtPumpSeal && chkWtPumpSeal.checked) ? "pump_seal_bearing" : (existingDraft.mpvSpec || "split_major"),
          chkButterfly: Boolean(chkButterfly && chkButterfly.checked),
          chkLevel: Boolean(chkLevel && chkLevel.checked),
          chkSgs: Boolean(chkSgsWater && chkSgsWater.checked),
          chkChlorine25kg: Boolean(chkWtChlorine && chkWtChlorine.checked),
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
        "\n⏱️ 施工與停水時段：依現場條件另行確認" +
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
        const isCoolChecked = Boolean(chkCool && chkCool.checked);
        const nextCatWt = isCoolChecked ? "both" : "water_tank";
        const qParams = new URLSearchParams({
          from: "water-tank",
          cat: nextCatWt,
          mode: scheduleSelect ? scheduleSelect.value : "priority_50",
          reg: regionSelect ? regionSelect.value : "台北市 / 新北市",
          ton: tonSelect ? tonSelect.value : "50",
          mat: matSelect ? matSelect.value : "concrete",
          pools: poolCountSelect ? poolCountSelect.value : "0",
          pvc: (chkPvcValve && chkPvcValve.checked) ? "1" : "0",
          v24: (chkWtValve24 && chkWtValve24.checked) ? "1" : "0",
          wtpump: (chkWtPumpSeal && chkWtPumpSeal.checked) ? "1" : "0",
          bf: (chkButterfly && chkButterfly.checked) ? "1" : "0",
          lvl: (chkLevel && chkLevel.checked) ? "1" : "0",
          sgs: (chkSgsWater && chkSgsWater.checked) ? "1" : "0",
          cl25: (chkWtChlorine && chkWtChlorine.checked) ? "1" : "0",
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
    const chkCtSprinkler = document.getElementById("ct-chk-sprinkler");
    const chkCtMotorReducer = document.getElementById("ct-chk-motor-reducer");
    const chkButterfly = document.getElementById("ct-chk-butterfly");
    const chkBallValve = document.getElementById("ct-chk-ballvalve");
    const chkInverter = document.getElementById("ct-chk-inverter");
    const chkCtSgs = document.getElementById("ct-chk-sgs");
    const chkCtChlorine = document.getElementById("ct-chk-chlorine");
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
      if (chkCtSprinkler && draft.chkCtSprinkler !== undefined) {
        chkCtSprinkler.checked = Boolean(draft.chkCtSprinkler);
      }
      if (chkCtMotorReducer && draft.chkCtMotorReducer !== undefined) {
        chkCtMotorReducer.checked = Boolean(draft.chkCtMotorReducer);
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
      if (chkCtSgs && draft.chkSgs !== undefined) {
        chkCtSgs.checked = Boolean(draft.chkSgs);
      }
      if (chkCtChlorine && draft.chkChlorine25kg !== undefined) {
        chkCtChlorine.checked = Boolean(draft.chkChlorine25kg);
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
        ? "【A方案：指定時段專車】技術人員（配置與資格於派工前確認）＋風機斷電上鎖(LOTO)戒護＋風機電流與軸承點檢"
        : "【B方案：平日彈性併單】由本公司安排平日順路時段進場，同享技術人員（配置與資格於派工前確認）＋風機電流點檢";

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
          ? "【A方案：大型塔高處/入塔配置待確認】入塔人員、監視與安全措施依現場評估＋可洽詢風機馬達絕緣、減速齒輪箱/皮帶與Y型過濾器點檢"
          : "【B方案：平日併單配置待確認】入塔人員、監視與安全措施依現場評估＋可洽詢風機馬達電流、減速齒輪箱/皮帶與Y型過濾器點檢";
      } else {
        basePrice = isPriority ? 27000 : 24000;
        hours = "4.0 ~ 5.5 小時（雙機高壓水刀與工業吸塵同步施作）";
        crewMode = "【巨型水塔作業配置待確認】雙機同步清洗＋高處防墜與入塔職安主管戒護＋減速齒輪箱(Gear Reducer)與Y型過濾器全檢";
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
      const addons = ["可洽詢循環水量測與設備檢查，實際範圍及費用須另行確認"];
      if (chkFill && chkFill.checked) {
        const fillPrice = isPriority ? 8500 : 7500;
        basePrice += fillPrice;
        addons.push("加購散熱材(PVC膠片填料)局部深度除垢或更新預估 (+NT$" + fillPrice.toLocaleString() + "起)");
      }
      if (chkCtSprinkler && chkCtSprinkler.checked) {
        const sprPrice = isPriority ? 6000 : 4500;
        basePrice += sprPrice;
        addons.push("加購【會轉都會修】冷卻水塔旋轉播水頭(散水頭)總成順修更新 (+NT$" + sprPrice.toLocaleString() + "~38,000起・免$2,500檢測費)");
      }
      if (chkCtMotorReducer && chkCtMotorReducer.checked) {
        const motPrice = isPriority ? 12000 : 9000;
        basePrice += motPrice;
        addons.push("加購【會轉都會修】散熱風機馬達／減速齒輪箱／循環泵軸封培林順修 (+NT$" + motPrice.toLocaleString() + "~98,000起・免$2,500檢測費)");
      }
      if (chkButterfly && chkButterfly.checked) {
        const bfPrice = isPriority ? 25000 : 22000;
        basePrice += bfPrice;
        addons.push("加購 6吋~10吋 大口徑齒輪式蝴蝶閥／無聲逆止閥抽換 (+NT$" + bfPrice.toLocaleString() + "~32,000起)");
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
      if (chkCtSgs && chkCtSgs.checked) {
        const sgsPrice = isPriority ? 3500 : 3000;
        basePrice += sgsPrice;
        addons.push("加購代客採樣送驗 SGS 冷卻水塔水質／退伍軍人菌（Legionella）檢測報告 (+NT$" + sgsPrice.toLocaleString() + ")");
      }
      if (chkCtChlorine && chkCtChlorine.checked) {
        basePrice += 2680;
        addons.push("順載 25公斤大桶裝 90% TCCA 氯錠（用途與標示待確認）（原合併方案報價 +NT$2,680/桶；用途、交付方式與費用待確認）");
      }

      let maxPrice = Math.round(basePrice * 1.18);
      let taxNote = "未稅";
      if (chkTax && chkTax.checked) {
        basePrice = Math.round(basePrice * 1.05);
        maxPrice = Math.round(maxPrice * 1.05);
        taxNote = "含 5% 統一發票營業稅";
      }

      const scheduleLabel = isPriority
        ? "A方案：指定時段專車專案（含職安戒護＋空調機電深度點檢）"
        : "B方案：平日彈性併單特惠檔期（由皓盛安排平日順路時段施作）";

      if (outPrice) {
        outPrice.textContent = "NT$ " + basePrice.toLocaleString() + " ~ " + maxPrice.toLocaleString() + " 元（" + taxNote + "）";
      }
      if (outHours) {
        outHours.textContent = "施工與停水時段須依現場條件確認";
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
          chkCtSprinkler: Boolean(chkCtSprinkler && chkCtSprinkler.checked),
          chkCtMotorReducer: Boolean(chkCtMotorReducer && chkCtMotorReducer.checked),
          chkAddMpv: Boolean((chkCtSprinkler && chkCtSprinkler.checked) || (chkCtMotorReducer && chkCtMotorReducer.checked)),
          mpvSpec: (chkCtMotorReducer && chkCtMotorReducer.checked) ? "ct_motor_pump" : ((chkCtSprinkler && chkCtSprinkler.checked) ? "ct_sprinkler" : "split_major"),
          chkButterfly: Boolean(chkButterfly && chkButterfly.checked),
          chkPvcValve: Boolean(chkBallValve && chkBallValve.checked),
          chkInverter: Boolean(chkInverter && chkInverter.checked),
          chkSgs: Boolean(chkCtSgs && chkCtSgs.checked),
          chkChlorine25kg: Boolean(chkCtChlorine && chkCtChlorine.checked),
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
        "\n⏱️ 施工時段：依現場條件另行確認" +
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
          ctspr: (chkCtSprinkler && chkCtSprinkler.checked) ? "1" : "0",
          ctmot: (chkCtMotorReducer && chkCtMotorReducer.checked) ? "1" : "0",
          bf: (chkButterfly && chkButterfly.checked) ? "1" : "0",
          pvc: (chkBallValve && chkBallValve.checked) ? "1" : "0",
          inv: (chkInverter && chkInverter.checked) ? "1" : "0",
          sgs: (chkCtSgs && chkCtSgs.checked) ? "1" : "0",
          cl25: (chkCtChlorine && chkCtChlorine.checked) ? "1" : "0",
          tax: (chkTax && chkTax.checked) ? "1" : "0"
        });
        window.location.href = "quote.html?" + qParams.toString() + "#qp-workspace-anchor";
      });
    }
  }


  /* 3B. 新增引擎：冷氣與商用中央空調（四方吹/吊隱FCU/大型AHU/分離式）A/B 雙軌包套試算器 (v21.1) */
  function initAcCleaningCalculator() {
    const form = document.getElementById("ac-cleaning-calc-form");
    if (!form) return;

    const scheduleSelect = document.getElementById("ac-schedule-mode");
    const regionSelect = document.getElementById("ac-region");
    const typeSelect = document.getElementById("ac-unit-type");
    const qtySelect = document.getElementById("ac-qty-tier");

    const chkDrain = document.getElementById("ac-chk-drain");
    const chkAcMpv = document.getElementById("ac-chk-mpv-repair");
    const chkOutdoor = document.getElementById("ac-chk-outdoor");
    const chkSteam = document.getElementById("ac-chk-steam");
    const chkTax = document.getElementById("ac-chk-tax");

    const outPrice = document.getElementById("ac-price-output");
    const outHours = document.getElementById("ac-hours-output");
    const outCrew = document.getElementById("ac-crew-output");
    const outSummary = document.getElementById("ac-summary-text");

    const btnAcToQuote = document.getElementById("btn-ac-to-quote");
    const btnAcLine = document.getElementById("btn-ac-line");

    function restoreAcDraft() {
      const draft = loadQuoteDraft();
      if (!draft) return;
      if (draft.acScheduleMode && scheduleSelect) {
        setSelectValueSafely(scheduleSelect, draft.acScheduleMode, "priority_50");
      }
      if (draft.region && regionSelect) {
        setSelectValueSafely(regionSelect, draft.region, "台北市 / 新北市");
      }
      if (draft.acType && typeSelect) {
        setSelectValueSafely(typeSelect, draft.acType, "cassette");
      }
      if (draft.acQty && qtySelect) {
        setSelectValueSafely(qtySelect, draft.acQty, "base");
      }
      if (chkDrain && draft.chkAcDrain !== undefined) chkDrain.checked = Boolean(draft.chkAcDrain);
      if (chkAcMpv && draft.chkAcMpv !== undefined) chkAcMpv.checked = Boolean(draft.chkAcMpv);
      if (chkOutdoor && draft.chkAcOutdoor !== undefined) chkOutdoor.checked = Boolean(draft.chkAcOutdoor);
      if (chkSteam && draft.chkAcSteam !== undefined) chkSteam.checked = Boolean(draft.chkAcSteam);
      if (chkTax && draft.chkTax !== undefined) chkTax.checked = Boolean(draft.chkTax);
    }

    function calcAcCleaning(shouldPersistDraft, isJumpingToQuote) {
      const modeVal = scheduleSelect && scheduleSelect.value === "weekday_35" ? "weekday_35" : "priority_50";
      const isPriority = (modeVal === "priority_50");
      const regionVal = regionSelect ? regionSelect.value : "台北市 / 新北市";
      const acType = typeSelect ? typeSelect.value : "cassette";
      const acQty = qtySelect ? qtySelect.value : "base";

      // 各機型：基本包套價 (A/B) 與 超出台數單台價 (A/B)
      const acPricingMap = {
        split:    { pkgA: 12500, pkgB: 10000, unitA: 2200, unitB: 1800, baseIncluded: "4 台內", name: "壁掛分離式冷氣" },
        fcu:      { pkgA: 13000, pkgB: 10500, unitA: 3200, unitB: 2800, baseIncluded: "3 台內", name: "吊隱式冷氣／冰水送風機(FCU)" },
        cassette: { pkgA: 13500, pkgB: 11000, unitA: 4000, unitB: 3500, baseIncluded: "3 台內", name: "四方吹嵌入式卡式冷氣" },
        package:  { pkgA: 13500, pkgB: 11000, unitA: 4500, unitB: 3800, baseIncluded: "2 台內", name: "落地箱型冷氣(氣冷/水冷櫃機)" },
        ahu:      { pkgA: 15000, pkgB: 12500, unitA: 8500, unitB: 7500, baseIncluded: "1 座大型機房", name: "大型中央空調箱(AHU)" }
      };
      const cfg = acPricingMap[acType] || acPricingMap.cassette;

      let extraCount = 0;
      if (acQty === "add_2") extraCount = 2;
      else if (acQty === "add_3") extraCount = 3;
      else if (acQty === "add_4") extraCount = 4;
      else if (acQty === "add_6") extraCount = 6;
      else if (acQty === "add_8") extraCount = 8;

      // 動態同步第 4 題下拉選單文字：包套台數與追加台數。
      if (qtySelect && qtySelect.options.length >= 6) {
        qtySelect.options[0].text = "標準基本包套（" + cfg.name + "含 " + cfg.baseIncluded + " 精洗）";
        qtySelect.options[1].text = "基本包套外追加 2 台";
        qtySelect.options[2].text = "基本包套外追加 3 台";
        qtySelect.options[3].text = "基本包套外追加 4 台";
        qtySelect.options[4].text = "基本包套外追加 6 台";
        qtySelect.options[5].text = "基本包套外追加 8 台";
      }

      let basePrice = 0;
      let hours = "3.0 ~ 4.5 小時";
      let crewMode = "";

      // 原單獨派車包套計價模式，金額不變
      const pkgBase = isPriority ? cfg.pkgA : cfg.pkgB;
      const unitAdd = isPriority ? cfg.unitA : cfg.unitB;
      basePrice = pkgBase + (extraCount * unitAdd);
      if (extraCount === 0) {
        hours = "2.5 ~ 4.0 小時";
      } else if (extraCount <= 4) {
        hours = "4.0 ~ 6.0 小時";
      } else {
        hours = "6.0 ~ 8.0 小時（機電技術人員全天駐場精洗）";
      }
      crewMode = isPriority
        ? "【A方案：指定時段／假日夜間機電專車】空調技術人員（配置與資格於派工前確認）＋LOTO 斷電掛牌＋電腦板防水保護（依設備現況確認）"
        : "【B方案：平日彈性併單機電專車】由本公司安排平日順路時段機電技術人員施作，同享電腦板防水保護＋集水盤疏通";

      const addons = ["可洽詢：LOTO斷電與電腦機板防水罩保護＋集水盤果凍淤泥抽除與排水管疏通＋出風溫差(ΔT)與運轉電流實測"];
      if (chkDrain && chkDrain.checked) {
        const dPrice = isPriority ? 2500 : 2200;
        basePrice += dPrice;
        addons.push("加購冷凝水自動排水器(Drain Pump)換新＋管路高壓疏通 (+NT$" + dPrice.toLocaleString() + ")");
      }
      if (chkAcMpv && chkAcMpv.checked) {
        const mPrice = isPriority ? 4500 : 3500;
        basePrice += mPrice;
        addons.push("加購【會轉都會修】冷氣風鼓異音／馬達滾珠培林／啟動電容或FCU二通閥順修 (+NT$" + mPrice.toLocaleString() + "起・免$2,500檢測費)");
      }
      if (chkOutdoor && chkOutdoor.checked) {
        const oPrice = isPriority ? 2000 : 1600;
        basePrice += oPrice;
        addons.push("加購室外機散熱鰭片高壓沖洗 (+NT$" + oPrice.toLocaleString() + ")");
      }
      if (chkSteam && chkSteam.checked) {
        const sPrice = isPriority ? 1800 : 1500;
        basePrice += sPrice;
        addons.push("冷氣蒸氣／臭氧處理需求（適用性與安全措施待評估） (+NT$" + sPrice.toLocaleString() + ")");
      }

      let maxPrice = Math.round(basePrice * 1.15);
      let taxNote = "未稅";
      if (chkTax && chkTax.checked) {
        basePrice = Math.round(basePrice * 1.05);
        maxPrice = Math.round(maxPrice * 1.05);
        taxNote = "含 5% 統一發票營業稅";
      }

      if (outPrice) {
        outPrice.textContent = "NT$ " + basePrice.toLocaleString() + " ~ " + maxPrice.toLocaleString() + " 元（" + taxNote + "）";
      }
      if (outHours) {
        outHours.textContent = "施工與停水時段須依現場條件確認";
      }
      if (outCrew) {
        outCrew.textContent = crewMode;
      }

      const qtyLabel = qtySelect && qtySelect.options[qtySelect.selectedIndex]
        ? qtySelect.options[qtySelect.selectedIndex].text
        : "標準基本包套規模";

      if (shouldPersistDraft) {
        const targetCat = "ac_cleaning";
        const draftPayload = {
          serviceCategory: targetCat,
          scheduleMode: modeVal,
          acScheduleMode: modeVal,
          region: regionVal,
          acType: acType,
          acQty: acQty,
          chkAcDrain: Boolean(chkDrain && chkDrain.checked),
          chkAcMpv: Boolean(chkAcMpv && chkAcMpv.checked),
          chkAcRepair: Boolean(chkAcMpv && chkAcMpv.checked),
          chkAddMpv: false,
          chkAcOutdoor: Boolean(chkOutdoor && chkOutdoor.checked),
          chkAcSteam: Boolean(chkSteam && chkSteam.checked),
          chkTax: Boolean(chkTax && chkTax.checked)
        };
        if (isJumpingToQuote) {
          draftPayload.displayMode = "ab_compare";
          draftPayload.lastJumpSource = "ac-cleaning";
        }
        saveQuoteDraft(draftPayload);
      }

      const summary = "【冷氣與中央空調深層清洗保養詢價】" +
        "\n📍 地區：" + regionVal +
        "\n❄️ 空調機型：" + cfg.name + "（" + qtyLabel + "）" +
        "\n👷 出勤編制：" + crewMode +
        "\n⏱️ 施工時段：依現場條件另行確認" +
        "\n🔧 檢修與選配：" + addons.join("、") +
        "\n💰 系統預估區間：NT$ " + basePrice.toLocaleString() + " ~ " + maxPrice.toLocaleString() + " 元（" + taxNote + "）";

      if (outSummary) {
        outSummary.textContent = summary.replace(/\n/g, " ｜ ");
      }
      return summary;
    }

    restoreAcDraft();
    form.addEventListener("change", function () { calcAcCleaning(true, false); });
    form.addEventListener("input", function () { calcAcCleaning(true, false); });
    calcAcCleaning(false, false);

    if (btnAcLine) {
      btnAcLine.addEventListener("click", function () {
        copyAndOpenLine(calcAcCleaning(true, false));
      });
    }
    if (btnAcToQuote) {
      btnAcToQuote.addEventListener("click", function () {
        calcAcCleaning(true, true);
        const modeVal = scheduleSelect && scheduleSelect.value === "weekday_35" ? "weekday_35" : "priority_50";
        const qParams = new URLSearchParams({
          from: "ac-cleaning",
          cat: "ac_cleaning",
          mode: modeVal,
          reg: regionSelect ? regionSelect.value : "台北市 / 新北市",
          actype: typeSelect ? typeSelect.value : "cassette",
          acqty: qtySelect ? qtySelect.value : "base",
          acdrain: (chkDrain && chkDrain.checked) ? "1" : "0",
          acmpv: (chkAcMpv && chkAcMpv.checked) ? "1" : "0",
          acout: (chkOutdoor && chkOutdoor.checked) ? "1" : "0",
          acsteam: (chkSteam && chkSteam.checked) ? "1" : "0",
          tax: (chkTax && chkTax.checked) ? "1" : "0"
        });
        window.location.href = "quote.html?" + qParams.toString() + "#qp-workspace-anchor";
      });
    }
  }

  
  // ============================================================================
  // 3B. 第四引擎：「會轉都會修！」機電馬達・風鼓軸承・幫浦與蝶閥逆止閥試算器 (v22.2 嚴格遞增 3 檔級距＋雙向連動)
  // ============================================================================
  const MPV_SPEC_MAP = {
    rp258_install: {
      cat: "cat1_split_ac",
      comboCleanCat: "ac_cleaning",
      comboAcType: "split",
      name: "Realise 瑞林 RP-258 冷氣排水器到府安裝＋排水管疏通（設備適配及檢查範圍於施工前確認）",
      spec: "到府安裝服務（不單售裸機）：依設備適配更換瑞林 RP-258 排水器並疏通排水管；產品性能、管路範圍與冷氣檢查項目於施工前確認。與冷氣清洗同日順換的價格依所選方案計算。",
      unitName: "組",
      tiers: {
        tier_std:   { minB: 3500, maxB: 3500, minA: 3500, maxA: 3500, qB: 3500, qA: 3500, label: "標準單台到府安裝＋通管；冷氣檢查範圍施工前確認" },
        tier_mid:   { minB: 3500, maxB: 4200, minA: 3500, maxA: 4500, qB: 3500, qA: 4200, label: "挑高天花板／長距離明管重拉配電安裝" },
        tier_heavy: { minB: 4200, maxB: 4800, minA: 4500, maxA: 5200, qB: 4500, qA: 5000, label: "大型落地箱型／多台冷氣共用大水量排水工程" }
      },
      rangeLabel: "NT$ 3,500 起 / 組（排水管疏通及檢查範圍於施工前確認）",
      hours: "1.0 ~ 1.5 小時"
    },
    split_minor: {
      cat: "cat1_split_ac",
      comboCleanCat: "ac_cleaning",
      comboAcType: "split",
      name: "分離式冷氣（室內外機）啟動/運轉電容・步進馬達・靜音排水器或軸套檢修",
      spec: "現場檢測更換耐高溫防爆啟動/運轉電容、導風板步進馬達、高揚程靜音排水器或風鼓耐溫軸套，含運轉電流實測",
      unitName: "台",
      tiers: {
        tier_std:   { minB: 2500, maxB: 3200, minA: 3000, maxA: 3800, qB: 2500, qA: 3500, label: "標準壁掛/小型機" },
        tier_mid:   { minB: 3200, maxB: 3900, minA: 3800, maxA: 4600, qB: 3500, qA: 4500, label: "中大型變頻/挑高安裝" },
        tier_heavy: { minB: 3900, maxB: 4500, minA: 4600, maxA: 5500, qB: 4500, qA: 5500, label: "特殊高空/大能力商用分離式" }
      },
      rangeLabel: "$2,500 ~ $4,500 起 / 台",
      hours: "1.5 ~ 2.5 小時"
    },
    split_major: {
      cat: "cat1_split_ac",
      comboCleanCat: "ac_cleaning",
      comboAcType: "split",
      name: "分離式冷氣（室內外機）DC/AC 風扇馬達・貫流扇風鼓總成或日本 NSK 培林更換",
      spec: "拆機更換原廠規格室內/室外風扇馬達、貫流扇風鼓葉輪或NSK／SKF（品牌及實際產地依料件確認） 精密靜音滾珠軸承（培林），檢查異音與不轉跳機的原因",
      unitName: "台",
      tiers: {
        tier_std:   { minB: 4500, maxB: 5800, minA: 5500, maxA: 7000,  qB: 4500, qA: 6000,  label: "標準 2.8~5.0kW 機種" },
        tier_mid:   { minB: 5800, maxB: 7200, minA: 7000, maxA: 9000,  qB: 6500, qA: 8500,  label: "中大型 6.3~10kW 變頻機種" },
        tier_heavy: { minB: 7200, maxB: 8500, minA: 9000, maxA: 11000, qB: 8500, qA: 11000, label: "大型落地箱型/高空外牆機種" }
      },
      rangeLabel: "$4,500 ~ $11,000 起 / 台",
      hours: "2.0 ~ 3.5 小時"
    },
    fcu_repair: {
      cat: "cat2_ahu_fcu",
      comboCleanCat: "ac_cleaning",
      comboAcType: "fcu",
      name: "商用吊隱式送風機(FCU)／四方吹 多翼式離心風鼓・雙軸送風馬達培林或電動二通閥更新",
      spec: "天花板維修孔拆卸多翼式離心風鼓（松鼠籠風車）校正更新、雙軸馬達日本 NSK 培林更換、冷凝排水器或冰水電動二通閥驅動頭更新",
      unitName: "台",
      tiers: {
        tier_std:   { minB: 4500, maxB: 5800, minA: 5500, maxA: 7000,  qB: 4500, qA: 6000,  label: "標準 200~600 CFM 送風機" },
        tier_mid:   { minB: 5800, maxB: 7200, minA: 7000, maxA: 9000,  qB: 6500, qA: 8500,  label: "大型 800~1200 CFM 雙風鼓/挑高" },
        tier_heavy: { minB: 7200, maxB: 8500, minA: 9000, maxA: 11000, qB: 8500, qA: 11000, label: "特大風量/狹窄天花板全總成翻修" }
      },
      rangeLabel: "$4,500 ~ $11,000 起 / 台",
      hours: "2.5 ~ 4.0 小時"
    },
    ahu_overhaul: {
      cat: "cat2_ahu_fcu",
      comboCleanCat: "ac_cleaning",
      comboAcType: "ahu",
      name: "大型中央空調箱(AHU)／大樓排風車傳動大修（重型連座軸承＋皮帶輪對心＋三相送風馬達）",
      spec: "依設備現況使用拔輪工具拆卸更換重型連座軸承(Pillow Block Bearing)、雷射/直尺皮帶輪平行對心、抗靜電三角皮帶更新與三相馬達絕緣電流實測（級距 $28,000~$38,000 起/組）",
      unitName: "組",
      tiers: {
        tier_std:   { minB: 28000, maxB: 31000, minA: 29500, maxA: 33000, qB: 28000, qA: 30000, label: "標準 5~10HP 空調箱傳動組" },
        tier_mid:   { minB: 31000, maxB: 34500, minA: 33000, maxA: 36000, qB: 32000, qA: 35000, label: "中大型 15~25HP 空調箱連座軸承大修" },
        tier_heavy: { minB: 34500, maxB: 36500, minA: 36000, maxA: 38000, qB: 35000, qA: 38000, label: "特大型 30HP+ 重型空調箱/排風車傳動大修" }
      },
      rangeLabel: "$28,000 ~ $38,000 起 / 組",
      hours: "4.0 ~ 6.5 小時"
    },
    ct_sprinkler: {
      cat: "cat3_ct_drive",
      comboCleanCat: "cooling_tower",
      name: "冷卻水塔旋轉播水頭（散水頭）總成更新（中小型鋁合金至大型工業級青銅/不鏽鋼散水頭）",
      spec: "拆除中心軸承卡死之舊散水頭，換裝全新塑鋼/鋁合金或大型高噸數青銅/SUS304不鏽鋼重型旋轉播水頭總成，含散水管水平角度與水壓轉速校正（級距 $4,500~$38,000 起/組）",
      unitName: "組",
      tiers: {
        tier_std:   { minB: 4500,  maxB: 8500,  minA: 5500,  maxA: 10500, qB: 4500,  qA: 6000,  label: "中小型 10~80RT 塑鋼/鋁合金散水頭" },
        tier_mid:   { minB: 12000, maxB: 20000, minA: 15000, maxA: 24000, qB: 16000, qA: 19500, label: "商空大型 100~250RT 重型鋁合金/青銅散水頭" },
        tier_heavy: { minB: 26000, maxB: 34000, minA: 30000, maxA: 38000, qB: 32000, qA: 38000, label: "工業巨型 300~500RT+ 法蘭式青銅/304不鏽鋼散水頭總成" }
      },
      rangeLabel: "$4,500 ~ $38,000 起 / 組",
      hours: "2.0 ~ 4.5 小時"
    },
    ct_motor_pump: {
      cat: "cat3_ct_drive",
      comboCleanCat: "cooling_tower",
      name: "冷卻水塔散熱風機馬達／減速齒輪箱（Gear Reducer）／冰水與冷卻水循環泵軸封培林大修",
      spec: "涵蓋水塔頂部防滴型風機馬達防水培林更新、減速齒輪箱換油與油封齒輪大修、以及機房立臥式冰水/冷卻水/熱水循環大泵機械軸封與聯軸器對心校正（級距 $9,000~$98,000 起/台）",
      unitName: "台",
      tiers: {
        tier_std:   { minB: 9000,  maxB: 16000, minA: 11000, maxA: 20000, qB: 9000,  qA: 12000, label: "標準 3~7.5HP 風機馬達/循環泵軸封培林檢修" },
        tier_mid:   { minB: 32000, maxB: 48000, minA: 38000, maxA: 56000, qB: 38000, qA: 45000, label: "商空大型 10~25HP 減速齒輪箱/立臥式大泵翻修" },
        tier_heavy: { minB: 68000, maxB: 88000, minA: 78000, maxA: 98000, qB: 85000, qA: 98000, label: "廠房特大 30~60HP+ 重型減速機/大馬力馬達/主循環泵吊裝大修" }
      },
      rangeLabel: "$9,000 ~ $98,000 起 / 台",
      hours: "3.5 ~ 7.0 小時"
    },
    pump_seal_bearing: {
      cat: "cat4_water_pump",
      comboCleanCat: "water_tank",
      name: "社區大樓揚水（抽水）馬達／頂樓恆壓加壓泵浦 耐磨碳化矽機械軸封與滾珠培林現場搶修",
      spec: "關水洩壓拆解泵浦本體，換裝耐磨碳化矽(SiC)機械軸封處理漏水問題、更新日本 NSK 前後滾珠軸承處理異音問題，並點檢穩壓壓力桶與壓力開關",
      unitName: "台",
      tiers: {
        tier_std:   { minB: 5500, maxB: 7200,  minA: 6800,  maxA: 8800,  qB: 5500,  qA: 7500,  label: "標準 1~3HP 抽水/加壓馬達軸封培林" },
        tier_mid:   { minB: 7200, maxB: 9000,  minA: 8800,  maxA: 11000, qB: 8000,  qA: 10500, label: "中型 5~7.5HP 多段離心揚水泵軸封培林" },
        tier_heavy: { minB: 9000, maxB: 10500, minA: 11000, maxA: 13500, qB: 10500, qA: 13500, label: "大型 10~15HP 高揚程聯軸式揚水泵大修" }
      },
      rangeLabel: "$5,500 ~ $13,500 起 / 台",
      hours: "2.5 ~ 4.0 小時"
    },
    pump_replace: {
      cat: "cat4_water_pump",
      comboCleanCat: "water_tank",
      name: "社區大樓地下室揚水（抽水）馬達／頂樓恆壓變頻加壓泵浦 整機換新升級工程",
      spec: "舊泵吊拆清運、換裝高效靜音多段離心泵或 SUS304 不鏽鋼微電腦恆壓變頻加壓泵浦，含進出水由令/法蘭配管銜接、排氣試水與三相電流設定",
      unitName: "台",
      tiers: {
        tier_std:   { minB: 10500, maxB: 14500, minA: 12500, maxA: 17500, qB: 10500, qA: 13500, label: "標準 1~2HP 恆壓加壓/抽水泵整機換新" },
        tier_mid:   { minB: 15000, maxB: 19500, minA: 18000, maxA: 23500, qB: 17500, qA: 21500, label: "中大型 3~5HP 多段不鏽鋼/變頻泵浦換新" },
        tier_heavy: { minB: 20000, maxB: 24000, minA: 24000, maxA: 30000, qB: 24000, qA: 30000, label: "大型社區 7.5~15HP 重型揚水主泵吊裝換新" }
      },
      rangeLabel: "$10,500 ~ $30,000 起 / 台",
      hours: "3.0 ~ 5.5 小時"
    },
    valve_2_4: {
      cat: "cat5_valves",
      comboCleanCat: "water_tank",
      name: "2吋~4吋 蝶閥／不鏽鋼無聲逆止閥（消除停泵水錘巨響）／高壓防震軟管／減壓閥抽換",
      spec: "管路排空洩壓、舊閥拆卸、法蘭密封面除鏽清潔、換裝 規格待核對的 2吋~4吋蝶閥/無聲逆止閥/防震軟管、更新 EPDM 墊片與 SUS304 不鏽鋼螺栓及復水耐壓測試（級距 $11,000~$15,000 起/處）",
      unitName: "處",
      tiers: {
        tier_std:   { minB: 11000, maxB: 12200, minA: 11800, maxA: 13000, qB: 11000, qA: 12000, label: "2吋~2.5吋 手柄式蝶閥/逆止閥/軟管" },
        tier_mid:   { minB: 12200, maxB: 13500, minA: 13000, maxA: 14200, qB: 12500, qA: 13800, label: "3吋 法蘭式無聲逆止閥/蝶閥/減壓閥" },
        tier_heavy: { minB: 13500, maxB: 14500, minA: 14200, maxA: 15000, qB: 14000, qA: 15000, label: "4吋 重型無聲逆止閥/齒輪蝶閥/高處管道間" }
      },
      rangeLabel: "$11,000 ~ $15,000 起 / 處",
      hours: "2.0 ~ 3.5 小時"
    },
    valve_6_10: {
      cat: "cat5_valves",
      comboCleanCat: "cooling_tower",
      name: "6吋~10吋 大口徑齒輪式蝴蝶閥／無聲逆止閥吊裝抽換工程",
      spec: "現場作業安排搭配手拉吊車吊裝、拆除鏽死舊閥、換裝 6吋~10吋 FCD鑄鐵本體＋SUS304不鏽鋼蝶板重型齒輪式蝴蝶閥或無聲逆止閥，含 EPDM 墊片與 304 白鐵螺栓對角鎖固試壓（級距 $22,000~$32,000 起/處）",
      unitName: "處",
      tiers: {
        tier_std:   { minB: 22000, maxB: 24500, minA: 23500, maxA: 26000, qB: 22000, qA: 24500, label: "6吋 大口徑齒輪式蝴蝶閥/逆止閥" },
        tier_mid:   { minB: 25000, maxB: 28000, minA: 26500, maxA: 29500, qB: 26000, qA: 28500, label: "8吋 重型齒輪式蝴蝶閥/無聲逆止閥吊裝" },
        tier_heavy: { minB: 28500, maxB: 31000, minA: 29500, maxA: 32000, qB: 29500, qA: 32000, label: "10吋 巨型法蘭齒輪蝶閥/逆止閥高空吊裝抽換" }
      },
      rangeLabel: "$22,000 ~ $32,000 起 / 處",
      hours: "3.0 ~ 5.0 小時"
    },
    ctrl_float_omron: {
      cat: "cat6_level_ctrl",
      comboCleanCat: "water_tank",
      name: "大口徑青銅/不鏽鋼複動式浮球閥・Omron 61F-G2 液位控制器＋304電極棒或電磁接觸器搶修",
      spec: "更換水池進水複動式浮球閥、日本歐姆龍原廠 Omron 61F-G2 液位保持繼電器、SUS304 不鏽鋼電極棒座或控制盤電磁接觸器/積熱電驛，含滿水斷電與防空轉測試",
      unitName: "組",
      tiers: {
        tier_std:   { minB: 3500, maxB: 4500, minA: 4200, maxA: 5500, qB: 3500, qA: 4800, label: "標準 1吋~1.5吋 浮球閥 / 61F-G2 液位器" },
        tier_mid:   { minB: 4500, maxB: 5800, minA: 5500, maxA: 7000, qB: 5000, qA: 6500, label: "2吋 重型複動式不鏽鋼浮球閥＋304極棒全套" },
        tier_heavy: { minB: 5800, maxB: 6800, minA: 7000, maxA: 8500, qB: 6800, qA: 8500, label: "大口徑浮球閥＋控制盤電磁接觸器/積熱電驛全修" }
      },
      rangeLabel: "$3,500 ~ $8,500 起 / 組",
      hours: "1.5 ~ 2.5 小時"
    },
    ctrl_altitude_valve: {
      cat: "cat6_level_ctrl",
      comboCleanCat: "water_tank",
      name: "大口徑水力定水位閥（主閥＋導閥膜片總成）或雙泵交替自動控制盤檢修更新",
      spec: "拆檢更換水塔進水大口徑水力定水位閥（主閥膜片、導閥與過濾器清洗更新）或揚水泵雙泵交替控制盤改造，檢查水塔溢流與單泵過載的原因",
      unitName: "組",
      tiers: {
        tier_std:   { minB: 7500,  maxB: 9800,  minA: 8800,  maxA: 11500, qB: 7500,  qA: 9500,  label: "2吋~2.5吋 定水位閥導閥膜片總成檢修" },
        tier_mid:   { minB: 10000, maxB: 12800, minA: 11800, maxA: 15000, qB: 11500, qA: 14000, label: "3吋~4吋 水力定水位閥整組更新或雙泵控制盤翻修" },
        tier_heavy: { minB: 13000, maxB: 15000, minA: 15000, maxA: 18500, qB: 15000, qA: 18500, label: "6吋 大口徑法蘭定水位閥總成抽換＋全盤電控改造" }
      },
      rangeLabel: "$7,500 ~ $18,500 起 / 組",
      hours: "2.5 ~ 4.5 小時"
    }
  };

  function initMpvCalculator() {
    const form = document.getElementById("mpv-calc-form");
    if (!form) return;

    const scheduleSelect = document.getElementById("mpv-schedule-mode");
    const regionSelect = document.getElementById("mpv-region");
    const mainCatSelect = document.getElementById("mpv-main-cat");
    const subSpecSelect = document.getElementById("mpv-sub-spec");
    const scaleTierSelect = document.getElementById("mpv-scale-tier");
    const qtySelect = document.getElementById("mpv-qty");

    const chkUrgent = document.getElementById("mpv-chk-urgent");
    const chkElec = document.getElementById("mpv-chk-elec");
    const chkComboClean = document.getElementById("mpv-chk-combo-clean");
    const chkTax = document.getElementById("mpv-chk-tax");

    const outPrice = document.getElementById("mpv-price-output");
    const outHours = document.getElementById("mpv-hours-output");
    const outCrew = document.getElementById("mpv-crew-output");
    const outSummary = document.getElementById("mpv-summary-text");

    const btnToQuote = document.getElementById("btn-mpv-to-quote") ||
      document.getElementById("btn-shop-to-quote");
    const btnLine = document.getElementById("btn-mpv-line");

    const catDefaultSpec = {
      cat1_split_ac: "split_major",
      cat2_ahu_fcu: "ahu_overhaul",
      cat3_ct_drive: "ct_motor_pump",
      cat4_water_pump: "pump_seal_bearing",
      cat5_valves: "valve_6_10",
      cat6_level_ctrl: "ctrl_float_omron"
    };

    if (mainCatSelect && subSpecSelect) {
      mainCatSelect.addEventListener("change", function () {
        const targetSpec = catDefaultSpec[mainCatSelect.value];
        if (targetSpec) {
          setSelectValueSafely(subSpecSelect, targetSpec, "split_major");
        }
        calcMpv(true, false);
      });
      subSpecSelect.addEventListener("change", function () {
        const specObj = MPV_SPEC_MAP[subSpecSelect.value];
        if (specObj && mainCatSelect.value !== specObj.cat) {
          setSelectValueSafely(mainCatSelect, specObj.cat, "cat1_split_ac");
        }
      });
    }

    function restoreMpvDraft() {
      const draft = loadQuoteDraft();
      if (!draft) return;
      if (draft.mpvScheduleMode && scheduleSelect) {
        setSelectValueSafely(scheduleSelect, draft.mpvScheduleMode, "priority_50");
      }
      if (draft.region && regionSelect) {
        setSelectValueSafely(regionSelect, draft.region, "台北市 / 新北市");
      }
      if (draft.mpvSpec && subSpecSelect && MPV_SPEC_MAP[draft.mpvSpec]) {
        setSelectValueSafely(subSpecSelect, draft.mpvSpec, "split_major");
        if (mainCatSelect) {
          setSelectValueSafely(mainCatSelect, MPV_SPEC_MAP[draft.mpvSpec].cat, "cat1_split_ac");
        }
      }
      if (draft.mpvTier && scaleTierSelect) {
        setSelectValueSafely(scaleTierSelect, draft.mpvTier, "tier_std");
      }
      if (draft.mpvQty && qtySelect) {
        setSelectValueSafely(qtySelect, String(draft.mpvQty), "1");
      }
      if (chkUrgent && draft.chkMpvUrgent !== undefined) chkUrgent.checked = Boolean(draft.chkMpvUrgent);
      if (chkElec && draft.chkMpvElec !== undefined) chkElec.checked = Boolean(draft.chkMpvElec);
      if (chkComboClean && draft.chkMpvComboClean !== undefined) chkComboClean.checked = Boolean(draft.chkMpvComboClean);
      if (chkTax && draft.chkTax !== undefined) chkTax.checked = Boolean(draft.chkTax);
    }

    function calcMpv(shouldPersistDraft, isJumpingToQuote) {
      syncMpvTierLabels(subSpecSelect, scaleTierSelect);
      const modeVal = scheduleSelect ? scheduleSelect.value : "priority_50";
      const isAddonClean = (modeVal === "addon_with_clean") || Boolean(chkComboClean && chkComboClean.checked);
      const isPriority = (modeVal === "priority_50");
      const regionVal = regionSelect ? regionSelect.value : "台北市 / 新北市";
      const specKey = (subSpecSelect && MPV_SPEC_MAP[subSpecSelect.value]) ? subSpecSelect.value : "split_major";
      const specCfg = MPV_SPEC_MAP[specKey];
      const tierKey = (scaleTierSelect && specCfg.tiers[scaleTierSelect.value]) ? scaleTierSelect.value : "tier_std";
      const tierCfg = specCfg.tiers[tierKey] || specCfg.tiers.tier_std;
      const qtyNum = clampNumber(qtySelect ? qtySelect.value : 1, 1, 10, 1);

      let discountFactor = 1.0;
      if (qtyNum === 2) discountFactor = 0.90;
      else if (qtyNum === 3) discountFactor = 0.88;
      else if (qtyNum >= 4) discountFactor = 0.85;

      // 每一檔位 (tier_std / tier_mid / tier_heavy) 均嚴格遞增，並隨 A方案 / B方案 動態切換
      let lowPrice = Math.round((isPriority ? tierCfg.minA : tierCfg.minB) * qtyNum * discountFactor);
      let highPrice = Math.round((isPriority ? tierCfg.maxA : tierCfg.maxB) * qtyNum * discountFactor);

      const addons = [
        isAddonClean
          ? "同日搭配清洗保養順修特惠：免收 $2,500 單獨查修出工底價（自動合併清洗＋維修同單報價）"
          : "含機電技術人員到場儀器診斷（單獨叫修基本出工檢測保底 $2,000~$2,500 起/趟，確認委修全額併入折抵）"
      ];

      if (chkElec && chkElec.checked) {
        const elecAdd = isPriority ? 3500 : 2800;
        lowPrice += elecAdd;
        highPrice += elecAdd;
        addons.push("加購控制盤電磁接觸器／積熱電驛／啟動電容更新＋三相絕緣阻抗實測 (+NT$" + elecAdd.toLocaleString() + ")");
      }
      if (chkUrgent && chkUrgent.checked) {
        const urgAdd = isPriority ? 4500 : 3500;
        lowPrice += urgAdd;
        highPrice += Math.round(urgAdd * 1.35);
        addons.push("⚡ 急件調度洽詢／夜間與例假日緊急出勤調度 (+NT$" + urgAdd.toLocaleString() + "起)");
      }

      let taxNote = "未稅";
      if (chkTax && chkTax.checked) {
        lowPrice = Math.round(lowPrice * 1.05);
        highPrice = Math.round(highPrice * 1.05);
        taxNote = "含 5% 統一發票營業稅";
      }

      if (outPrice) {
        outPrice.textContent = "NT$ " + lowPrice.toLocaleString() + " ~ " + highPrice.toLocaleString() + " 元起（" + taxNote + "｜" + tierCfg.label + "｜全跨度 " + specCfg.rangeLabel + "）";
      }
      if (outHours) {
        outHours.textContent = specCfg.hours + (qtyNum > 1 ? ("（共 " + qtyNum + " " + specCfg.unitName + "同趟施作）") : "");
      }
      if (outCrew) {
        outCrew.textContent = isPriority
          ? "【A方案：指定時段檢修專車】技術人員（配置與資格於派工前確認）＋LOTO斷電掛牌＋日本NSK/原廠級料件＋電流絕緣簽認報告（料件與後續服務條件另行確認）"
          : (isAddonClean
            ? "【清洗客戶同日順修特惠】由駐場機電技術人員趁排空或拆機時同步檢修（免收 $2,500 單獨查修出工費！）"
            : "【B方案：平日彈性檢修排程】技術人員（配置與資格於派工前確認）＋工業級標準新品料件＋運轉測試（後續服務條件另行確認）");
      }

      const targetCategory = isAddonClean ? (specCfg.comboCleanCat || "water_tank") : "mpv_repair";

      if (shouldPersistDraft) {
        const draftPayload = {
          serviceCategory: targetCategory,
          scheduleMode: isPriority ? "priority_50" : "weekday_35",
          mpvScheduleMode: modeVal,
          region: regionVal,
          chkAddMpv: true,
          mpvSpec: specKey,
          mpvTier: tierKey,
          mpvQty: String(qtyNum),
          chkMpvUrgent: Boolean(chkUrgent && chkUrgent.checked),
          chkMpvElec: Boolean(chkElec && chkElec.checked),
          chkMpvComboClean: Boolean(chkComboClean && chkComboClean.checked),
          chkTax: Boolean(chkTax && chkTax.checked)
        };
        if (isAddonClean && specCfg.comboAcType) {
          draftPayload.acType = specCfg.comboAcType;
          draftPayload.acQty = "base";
        }
        if (isJumpingToQuote) {
          draftPayload.displayMode = "ab_compare";
          draftPayload.lastJumpSource = "motor-pump-valve";
        }
        saveQuoteDraft(draftPayload);
      }

      const summary = "【會轉都會修！機電馬達・風鼓軸承・幫浦閥件搶修詢價】" +
        "\n📍 地區：" + regionVal +
        "\n⚡ 檢修項目：" + specCfg.name + "（規格檔位：" + tierCfg.label + "｜數量：" + qtyNum + " " + specCfg.unitName + "｜全級距：" + specCfg.rangeLabel + "）" +
        "\n👷 作業安排：" + (outCrew ? outCrew.textContent : "") +
        "\n⏱️ 預估完修工時：" + (outHours ? outHours.textContent : specCfg.hours) +
        "\n🔧 附加設定：" + addons.join("、") +
        "\n💰 系統預估浮動區間：NT$ " + lowPrice.toLocaleString() + " ~ " + highPrice.toLocaleString() + " 元起（" + taxNote + "）";

      if (outSummary) {
        outSummary.textContent = summary.replace(/\n/g, " ｜ ");
      }
      return summary;
    }

    restoreMpvDraft();
    form.addEventListener("change", function () { calcMpv(true, false); });
    form.addEventListener("input", function () { calcMpv(true, false); });
    calcMpv(false, false);

    if (btnLine) {
      btnLine.addEventListener("click", function () {
        copyAndOpenLine(calcMpv(true, false));
      });
    }
    if (btnToQuote) {
      btnToQuote.addEventListener("click", function () {
        calcMpv(true, true);
        const modeVal = scheduleSelect ? scheduleSelect.value : "priority_50";
        const isAddonClean = (modeVal === "addon_with_clean") || Boolean(chkComboClean && chkComboClean.checked);
        const specKey = (subSpecSelect && MPV_SPEC_MAP[subSpecSelect.value]) ? subSpecSelect.value : "split_major";
        const specCfg = MPV_SPEC_MAP[specKey];
        const targetCategory = isAddonClean ? (specCfg.comboCleanCat || "water_tank") : "mpv_repair";
        const qParams = new URLSearchParams({
          from: "motor-pump-valve",
          cat: targetCategory,
          mode: (modeVal === "priority_50") ? "priority_50" : "weekday_35",
          reg: regionSelect ? regionSelect.value : "台北市 / 新北市",
          mpvspec: specKey,
          mpvtier: scaleTierSelect ? scaleTierSelect.value : "tier_std",
          mpvqty: qtySelect ? qtySelect.value : "1",
          mpvcombo: isAddonClean ? "1" : "0",
          mpvurg: (chkUrgent && chkUrgent.checked) ? "1" : "0",
          mpvelec: (chkElec && chkElec.checked) ? "1" : "0",
          tax: (chkTax && chkTax.checked) ? "1" : "0"
        });
        if (isAddonClean && specCfg.comboAcType) {
          qParams.set("actype", specCfg.comboAcType);
        }
        window.location.href = "quote.html?" + qParams.toString() + "#qp-workspace-anchor";
      });
    }
  }

  /* 4. 第三引擎：A/B 雙軌線上立即估價 (quote.html - 內建 A4 PDF 排版 智慧動態縮放鎖定) */
  function syncMpvTierLabels(specSelect, tierSelect) {
    if (!specSelect || !tierSelect || !tierSelect.options) return;
    const cfg = MPV_SPEC_MAP[specSelect.value];
    if (!cfg) return;
    Array.from(tierSelect.options).forEach(function (option) {
      const tier = cfg.tiers[option.value];
      if (tier) option.textContent = tier.label + "｜單件未稅 A: NT$ " + tier.qA.toLocaleString() + " / B: NT$ " + tier.qB.toLocaleString();
    });
  }

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
    const chkQCtSprinkler = document.getElementById("q-chk-ct-sprinkler");
    const chkInverter = document.getElementById("q-chk-inverter");
    const chkSgs = document.getElementById("q-chk-sgs");
    const chkChlorine25kg = document.getElementById("q-chk-chlorine-25kg");
    const lblSgsText = document.getElementById("q-lbl-sgs-text");
    const boxAcGroup = document.getElementById("q-ac-group");
    const elAcType = document.getElementById("q-ac-type");
    const elAcQty = document.getElementById("q-ac-qty");
    const chkAcDrain = document.getElementById("q-chk-ac-drain");
    const chkAcRepair = document.getElementById("q-chk-ac-repair");
    const elShopMode = document.getElementById("q-shop-mode");
    const elShopQty = document.getElementById("q-shop-qty");
    const boxShopQty = document.getElementById("q-shop-qty-group");
    const chkAcOutdoor = document.getElementById("q-chk-ac-outdoor");
    const chkAcSteam = document.getElementById("q-chk-ac-steam");
    const chkAddMpv = document.getElementById("q-chk-add-mpv");
    const boxMpvGroup = document.getElementById("q-mpv-group");
    const elMpvSpec = document.getElementById("q-mpv-spec");
    const elMpvTier = document.getElementById("q-mpv-tier");
    const elMpvQty = document.getElementById("q-mpv-qty");
    const chkValve24 = document.getElementById("q-chk-valve-24");
    const chkMpvElec = document.getElementById("q-chk-mpv-elec");
    const chkMpvUrgent = document.getElementById("q-chk-mpv-urgent");

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
    const outComplianceArea = document.getElementById("qp-compliance-area");
    const outDecisionArea = document.getElementById("qp-decision-area");

    const btnPrintPdf = document.getElementById("btn-q-print");
    const btnCopyLine = document.getElementById("btn-q-line");
    const btnLoadDraft = document.getElementById("btn-q-load-draft");
    const btnClearDraft = document.getElementById("btn-q-clear-draft");

    // Each new page creates a reference, not an authenticated company sequence.
    const generatedReference = "HS-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    // 初始化預設日期與報價參考編號
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    if (elDocDate && !elDocDate.value) {
      elDocDate.value = yyyy + "-" + mm + "-" + dd;
    }
    if (elDocNo && !elDocNo.value) {
      elDocNo.value = generatedReference;
    }

    // Keep readable A4 typography. Long estimates may span pages; never shrink or clip content.
    function autoFitSinglePagePDF(itemCount, extraTextLength) {
      if (!paperSheet) return;
      paperSheet.setAttribute("data-density", "normal");
      paperSheet.setAttribute("data-item-count", String(itemCount));
      // Conservative content-density hint, not a promise of exact page count.
      // Keep all text and readable font sizes; compact only vertical whitespace.
      const contentLength = String(paperSheet.textContent || "").replace(/\s/g, "").length;
      const compact = itemCount >= 8 || contentLength > 2300 || extraTextLength > 300;
      const roomy = itemCount <= 3 && contentLength <= 1400 && extraTextLength <= 100;
      const layout = compact ? "compact" : (roomy ? "roomy" : "standard");
      paperSheet.setAttribute("data-print-layout", layout);
      document.documentElement.style.setProperty("--qp-print-zoom", "1");
      paperSheet.style.setProperty("--qp-print-zoom", "1");
      if (statusText) {
        statusText.textContent = "A4 排版預覽：目前共 " + itemCount + " 個工項，採" + (compact ? "緊湊間距" : (roomy ? "較大字級與舒適間距" : "標準間距")) + "優先排入一頁；維持可讀字級，內容較多時自動分頁，請確認列印預覽。";
      }
    }

    /* 依據工程類別動態管控專屬加購項顯示狀態，防止跨類別幽靈計價 */
    function syncAddonAvailability(cat) {
      const isWt = (cat === "water_tank" || cat === "both" || cat === "wt_ac" || cat === "all_three");
      const isCt = (cat === "cooling_tower" || cat === "both" || cat === "ct_ac" || cat === "all_three");
      const isAc = (cat === "ac_cleaning" || cat === "wt_ac" || cat === "ct_ac" || cat === "all_three");
      const isMpv = (cat === "mpv_repair") || Boolean(chkAddMpv && chkAddMpv.checked);

      function toggleAddonItem(checkboxEl, enabled) {
        if (!checkboxEl) return;
        const labelEl = checkboxEl.closest(".calc-check-item");
        checkboxEl.disabled = !enabled;
        if (labelEl) {
          labelEl.classList.toggle("is-disabled-addon", !enabled);
          labelEl.style.display = enabled ? "flex" : "none";
        }
      }

      toggleAddonItem(chkPvc, isWt || isCt);
      toggleAddonItem(chkButterfly, isWt || isCt);
      toggleAddonItem(chkLevel, isWt);
      toggleAddonItem(chkFill, isCt);
      toggleAddonItem(chkQCtSprinkler, isCt);
      toggleAddonItem(chkInverter, isCt);
      toggleAddonItem(chkSgs, isWt || isCt);
      toggleAddonItem(chkChlorine25kg, isWt || isCt || (cat === "shop_chlorine") || isAc || isMpv);
      toggleAddonItem(chkAcDrain, isAc);
      toggleAddonItem(chkAcRepair, isAc);
      toggleAddonItem(chkAcOutdoor, isAc);
      toggleAddonItem(chkAcSteam, isAc);
      toggleAddonItem(chkValve24, isWt || isCt || isMpv);
      toggleAddonItem(chkMpvElec, isMpv || isWt || isCt || isAc);
      toggleAddonItem(chkMpvUrgent, isMpv);
      if (lblSgsText) {
        if (cat === "water_tank") {
          lblSgsText.textContent = "🧪 代客無菌採樣送驗 SGS 飲用水水質檢驗報告（大腸桿菌群／總菌落數｜專車+3,500 / 平日+3,000）";
        } else if (cat === "cooling_tower") {
          lblSgsText.textContent = "🧪 代客採樣送驗 SGS 冷卻水塔水質／退伍軍人菌（Legionella）檢測報告（專車+3,500 / 平日+3,000）";
        } else {
          lblSgsText.textContent = "🧪 代客採樣送驗 SGS 實驗室水質檢驗報告（自來水大腸桿菌群／冷卻塔退伍軍人菌｜專車+3,500 / 平日+3,000）";
        }
      }
    }

    function applyStoredDraft(showNotification, fromParamVal, restoreDocumentIdentity) {
      const draft = loadQuoteDraft();
      if (!draft) {
        if (showNotification) showToast("目前尚無跨頁試算紀錄，已為您維持預設標準規格！");
        return;
      }

      if (fromParamVal === "water-tank" && elCategory) {
        const targetCat = draft.serviceCategory || "water_tank";
        setSelectValueSafely(elCategory, targetCat, "water_tank");
      } else if (fromParamVal === "cooling-tower" && elCategory) {
        const targetCat = draft.serviceCategory || "cooling_tower";
        setSelectValueSafely(elCategory, targetCat, "cooling_tower");
      } else if (fromParamVal === "ac-cleaning" && elCategory) {
        const targetCat = (draft.serviceCategory === "wt_ac") ? "wt_ac" : "ac_cleaning";
        setSelectValueSafely(elCategory, targetCat, "ac_cleaning");
      } else if (fromParamVal === "motor-pump-valve" && elCategory) {
        const targetCat = draft.serviceCategory || "mpv_repair";
        setSelectValueSafely(elCategory, targetCat, "mpv_repair");
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
      if (draft.clientAddr && elClientAddr && (!fromParamVal || fromParamVal === "share")) {
        elClientAddr.value = String(draft.clientAddr);
      } else if (draft.region && elClientAddr && fromParamVal) {
        elClientAddr.value = String(draft.region);
      }
      if (restoreDocumentIdentity && draft.docNo && elDocNo) {
        elDocNo.value = String(draft.docNo);
      }
      if (restoreDocumentIdentity && draft.docDate && elDocDate) {
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
      if (chkQCtSprinkler && draft.chkCtSprinkler !== undefined) chkQCtSprinkler.checked = Boolean(draft.chkCtSprinkler);
      if (chkInverter && draft.chkInverter !== undefined) chkInverter.checked = Boolean(draft.chkInverter);
      if (chkSgs && draft.chkSgs !== undefined) chkSgs.checked = Boolean(draft.chkSgs);
      if (chkChlorine25kg && draft.chkChlorine25kg !== undefined) chkChlorine25kg.checked = Boolean(draft.chkChlorine25kg);
      if (draft.acType && elAcType) setSelectValueSafely(elAcType, draft.acType, "cassette");
      if (draft.acQty && elAcQty) setSelectValueSafely(elAcQty, draft.acQty, "base");
      if (chkAcDrain && draft.chkAcDrain !== undefined) chkAcDrain.checked = Boolean(draft.chkAcDrain);
      if (chkAcRepair && draft.chkAcRepair !== undefined) chkAcRepair.checked = Boolean(draft.chkAcRepair);
      if (elShopMode) elShopMode.value = String(draft.shopMode || "");
      if (elShopQty) setSelectValueSafely(elShopQty, String(draft.shopQty || "1"), "1");
      if (chkAcOutdoor && draft.chkAcOutdoor !== undefined) chkAcOutdoor.checked = Boolean(draft.chkAcOutdoor);
      if (chkAcSteam && draft.chkAcSteam !== undefined) chkAcSteam.checked = Boolean(draft.chkAcSteam);
      if (chkAddMpv && draft.chkAddMpv !== undefined) chkAddMpv.checked = Boolean(draft.chkAddMpv);
      if (draft.mpvSpec && elMpvSpec) setSelectValueSafely(elMpvSpec, draft.mpvSpec, "split_major");
      if (draft.mpvTier && elMpvTier) setSelectValueSafely(elMpvTier, draft.mpvTier, "tier_std");
      if (draft.mpvQty && elMpvQty) setSelectValueSafely(elMpvQty, String(draft.mpvQty), "1");
      if (chkValve24 && draft.chkValve24 !== undefined) chkValve24.checked = Boolean(draft.chkValve24);
      if (chkMpvElec && draft.chkMpvElec !== undefined) chkMpvElec.checked = Boolean(draft.chkMpvElec);
      if (chkMpvUrgent && draft.chkMpvUrgent !== undefined) chkMpvUrgent.checked = Boolean(draft.chkMpvUrgent);


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
      const snapshot = {
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
        chkCtSprinkler: Boolean(chkQCtSprinkler && chkQCtSprinkler.checked),
        chkInverter: Boolean(chkInverter && chkInverter.checked),
        chkSgs: Boolean(chkSgs && chkSgs.checked),
        chkChlorine25kg: Boolean(chkChlorine25kg && chkChlorine25kg.checked),
        acType: elAcType ? elAcType.value : "cassette",
        acQty: elAcQty ? elAcQty.value : "base",
        chkAcDrain: Boolean(chkAcDrain && chkAcDrain.checked),
        chkAcRepair: Boolean(chkAcRepair && chkAcRepair.checked),
        chkAcMpv: Boolean(chkAcRepair && chkAcRepair.checked),
        shopMode: elShopMode ? elShopMode.value : "",
        shopQty: elShopQty ? elShopQty.value : "1",
        chkAcOutdoor: Boolean(chkAcOutdoor && chkAcOutdoor.checked),
        chkAcSteam: Boolean(chkAcSteam && chkAcSteam.checked),
        chkAddMpv: Boolean(chkAddMpv && chkAddMpv.checked),
        mpvSpec: elMpvSpec ? elMpvSpec.value : "split_major",
        mpvTier: elMpvTier ? elMpvTier.value : "tier_std",
        mpvQty: elMpvQty ? elMpvQty.value : "1",
        chkValve24: Boolean(chkValve24 && chkValve24.checked),
        chkMpvElec: Boolean(chkMpvElec && chkMpvElec.checked),
        chkMpvUrgent: Boolean(chkMpvUrgent && chkMpvUrgent.checked),
        customName: "",
        customPrice: "0",
        chkTax: (elTaxMode ? elTaxMode.value : "include_5") === "include_5"
      };
      saveQuoteDraft(snapshot);
      return snapshot;
    }

    function renderQuotation(shouldPersist) {
      syncMpvTierLabels(elMpvSpec, elMpvTier);
      const displayMode = elDisplayMode ? elDisplayMode.value : "ab_compare";
      const cat = elCategory ? elCategory.value : "water_tank";
      const isWtActive = (cat === "water_tank" || cat === "both" || cat === "wt_ac" || cat === "all_three");
      const isCtActive = (cat === "cooling_tower" || cat === "both" || cat === "ct_ac" || cat === "all_three");
      const isAcActive = (cat === "ac_cleaning" || cat === "wt_ac" || cat === "ct_ac" || cat === "all_three");

      if (boxWtGroup) {
        boxWtGroup.style.display = isWtActive ? "block" : "none";
      }
      if (boxCtGroup) {
        boxCtGroup.style.display = isCtActive ? "block" : "none";
      }
      if (boxAcGroup) {
        boxAcGroup.style.display = isAcActive ? "block" : "none";
      }
      // Keep storefront quantities and its published per-unit price distinct from repair bulk pricing.
      const shopCategories = { rp258_standalone: "mpv_repair", rp258_with_ac: "ac_cleaning", chlorine_only: "shop_chlorine", chlorine_with_ct: "cooling_tower", chlorine_with_wt: "water_tank", both_shop_items: "mpv_repair" };
      let shopMode = elShopMode ? elShopMode.value : "";
      if (shopCategories[shopMode] !== cat ||
          ((shopMode === "rp258_standalone" || shopMode === "both_shop_items") &&
           (!elMpvSpec || elMpvSpec.value !== "rp258_install" || !elMpvTier || elMpvTier.value !== "tier_std"))) {
        shopMode = "";
        if (elShopMode) elShopMode.value = "";
      }
      const shopQty = shopMode ? clampNumber(elShopQty ? elShopQty.value : 1, 1, 20, 1) : 1;
      const isShopInstall = shopMode === "rp258_standalone" || shopMode === "both_shop_items";
      if (boxShopQty) boxShopQty.style.display = shopMode ? "block" : "none";
      if (elMpvQty) {
        if (isShopInstall) setSelectValueSafely(elMpvQty, String(shopQty), "1");
        elMpvQty.disabled = isShopInstall;
        const qtyWrap = elMpvQty.closest(".calc-form-group");
        if (qtyWrap) qtyWrap.style.display = isShopInstall ? "none" : "block";
      }
      const isMpvStandalone = (cat === "mpv_repair");
      const isMpvActive = isMpvStandalone || Boolean(chkAddMpv && chkAddMpv.checked);
      if (chkAddMpv) {
        const addWrap = chkAddMpv.closest("div");
        if (addWrap) addWrap.style.display = isMpvStandalone ? "none" : "block";
      }
      if (boxMpvGroup) {
        boxMpvGroup.style.display = isMpvActive ? "block" : "none";
      }

      // 同步管控專屬加購項，防止純自來水塔報價單混入冷卻塔散熱材/變頻器費用
      syncAddonAvailability(cat);

      const clientName = (elClientName && elClientName.value.trim()) ? elClientName.value.trim() : "貴社區管理委員會 ／ 貴公司廠務部";
      const contactPerson = (elContactPerson && elContactPerson.value.trim()) ? elContactPerson.value.trim() : "總幹事 ／ 廠務主管 鈞啟";
      const clientAddr = (elClientAddr && elClientAddr.value.trim()) ? elClientAddr.value.trim() : "台北市 / 新北市";
      const docNo = (elDocNo && elDocNo.value.trim()) ? elDocNo.value.trim() : generatedReference;
      const docDate = (elDocDate && elDocDate.value.trim()) ? elDocDate.value.trim() : (yyyy + "-" + mm + "-" + dd);
      const docYear = /^\d{4}/.test(docDate) ? docDate.slice(0, 4) : yyyy;

      if (outClientName) outClientName.textContent = clientName;
      if (outContact) outContact.textContent = contactPerson;
      if (outAddr) outAddr.textContent = clientAddr;
      if (outDocNo) outDocNo.textContent = docNo;
      if (outDocDate) outDocDate.textContent = docDate + "（報價單）";

      const items = [];

      // 1. 計算自來水塔主工項（升級 [自來水塔專家 W1/W2/W3]：消除 10 噸 FRP 誤印 RC 水池之矛盾，並補齊餘氯與防空轉極棒規格）
      if (isWtActive) {
        const ton = clampNumber(elWtTonnage ? elWtTonnage.value : 120, 10, 500, 120);
        const mat = elWtMaterial ? elWtMaterial.value : "concrete";
        const poolLv = clampNumber(elWtPools ? elWtPools.value : 0, 0, 2, 0);

        let priceA = 23000;
        let priceB = 17500;
        let specDesc = "清洗範圍、消毒方式與檢驗項目依設備用途、產品標示及現場條件確認；入槽作業須另評估人員、監視、通風與氣體測定需求";

        if (ton <= 10) {
          if (mat === "stainless") {
            priceA = 4600;
            priceB = 3800;
            specDesc = (poolLv === 0)
              ? "開放式白鐵水塔、已確認全程不入槽之清洗方案；若需入槽、出入受限或通風條件有疑慮，本試算不適用，須另評估作業配置與費用"
              : "10噸內開放式白鐵水塔基本清洗（限已確認全程不入槽；需入槽者另評估，跨棟多顆移機費另列於次項）";
          } else if (mat === "frp") {
            priceA = 13000;
            priceB = 10500;
            specDesc = "10噸內FRP組合水塔清洗；是否入槽、空間條件、作業資格及安全配置須另依現場確認";
          } else {
            priceA = 13000;
            priceB = 10500;
            specDesc = "10噸內RC水泥蓄水池清洗；是否入槽、空間條件、作業資格及安全配置須另依現場確認";
          }
        } else if (ton <= 50) {
          priceA = 13000;
          priceB = 10500;
        } else if (ton <= 120) {
          priceA = 23000;
          priceB = 17500;
        } else {
          priceA = 27000;
          priceB = 24000;
          specDesc += "（停水與作業時段依現場確認）";
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
            spec: "分棟分池停水與抽排方式須依現場管路條件確認",
            unit: "1 式",
            priceA: 9000,
            priceB: 7500
          });
        }

        items.push({
          title: "【洽詢項目】給水設備檢查與水質量測",
          spec: "可洽詢餘氯、pH、TDS 與給水設備檢查；方法及費用另行確認，現場指標不能單獨證明飲用水安全",
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
          ctSpecDetail = "密閉式冷卻水塔｜含風機與噴淋泵 LOTO 斷電掛牌、內循環熱交換銅管/不鏽鋼盤管定壓除垢沖洗、噴淋嘴疏通、底盤吸泥與" + driveCheckText;
        } else if (ctType === "open_square") {
          ctSpecDetail = "方型低噪音開放式水塔｜含風機 LOTO 斷電掛牌、雙側重力播水盆與散水孔疏通、低壓大流量扇形水刀定壓沖洗（依材質與現況選擇工法）、底盤吸泥與" + driveCheckText;
        } else {
          ctSpecDetail = "良機/跨廠牌圓型開放式水塔｜含風機 LOTO 斷電掛牌、頂部旋轉播水頭與散水管疏通、低壓大流量扇形水刀定壓沖洗（依材質與現況選擇工法）、底盤吸泥與" + driveCheckText;
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
            spec: "依閥件隔離、剩餘散熱容量與運轉負載評估分塔輪洗；停機及降載安排須於施工前確認，不保證供冷不中斷",
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


      // 2B. 計算室內冷氣與中央空調主工項（所有報價類別均使用相同基本包套與追加台數計價）
      if (isAcActive) {
        const acTypeVal = elAcType ? elAcType.value : "cassette";
        const acQtyVal = elAcQty ? elAcQty.value : "base";

        const acMap = {
          split:    { pkgA: 12500, pkgB: 10000, unitA: 2200, unitB: 1800, inc: "含 4 台內", name: "壁掛分離式冷氣", spec: "拆洗外殼、濾網、貫流風鼓葉輪、蒸發器親水藥洗與排水管疏通。家用分離式未滿4台仍以4台計價，未使用台數可轉給隔壁鄰居家團購" },
          fcu:      { pkgA: 13000, pkgB: 10500, unitA: 3200, unitB: 2800, inc: "含 3 台內", name: "吊隱式冷氣／冰水送風機(FCU)", spec: "天花板維修孔拆洗風車葉輪、鰭片高壓藥洗、集水盤果凍淤泥抽除與浮球點檢" },
          cassette: { pkgA: 13500, pkgB: 11000, unitA: 4000, unitB: 3500, inc: "含 3 台內", name: "四方吹嵌入式卡式冷氣", spec: "拆卸四方出風面板、內建排水泵浦與浮球清潔、全方位蒸發器鰭片精洗與電流實測" },
          package:  { pkgA: 13500, pkgB: 11000, unitA: 4500, unitB: 3800, inc: "含 2 台內", name: "落地箱型冷氣(氣冷/水冷櫃機)", spec: "大型排管蒸發器高壓藥洗、雙風鼓葉輪除垢、冷凝水盤與排水管疏通" },
          ahu:      { pkgA: 15000, pkgB: 12500, unitA: 8500, unitB: 7500, inc: "單座大型機房", name: "大型中央空調箱(AHU)", spec: "多排式冰水盤管高壓除垢、大型離心風車清潔、皮帶張力校正與馬達三相電流實測" }
        };
        const acCfg = acMap[acTypeVal] || acMap.cassette;

        let extraCnt = 0;
        if (acQtyVal === "add_2") extraCnt = 2;
        else if (acQtyVal === "add_3") extraCnt = 3;
        else if (acQtyVal === "add_4") extraCnt = 4;
        else if (acQtyVal === "add_6") extraCnt = 6;
        else if (acQtyVal === "add_8") extraCnt = 8;

        // 單獨派車專案包套模式（機電工程車基本出勤包套）
        items.push({
          title: acCfg.name + "深層拆洗保養專案包套（機電專車・" + acCfg.inc + "）",
          spec: "技術人員（配置與資格於派工前確認）出勤｜LOTO斷電與電腦板防水保護（依設備現況確認）、" + acCfg.spec,
          unit: "1 式",
          priceA: acCfg.pkgA,
          priceB: acCfg.pkgB
        });
        if (extraCnt > 0) {
          items.push({
            title: acCfg.name + "同案場追加清洗台數（追加 " + extraCnt + " 台量販優惠）",
            spec: "同趟工程車連續施作追加台數（每台 A:$" + acCfg.unitA.toLocaleString() + " / B:$" + acCfg.unitB.toLocaleString() + "）",
            unit: extraCnt + " 台",
            priceA: extraCnt * acCfg.unitA,
            priceB: extraCnt * acCfg.unitB
          });
        }
      }

      
      // 2C. 計算「會轉都會修！」機電馬達・風鼓軸承・幫浦與蝶閥逆止閥主工項 (v22.1 支援 3 檔馬力噸數級距＋同單順修)
      if (isMpvActive) {
        const specKey = (elMpvSpec && MPV_SPEC_MAP[elMpvSpec.value]) ? elMpvSpec.value : "split_major";
        const mCfg = MPV_SPEC_MAP[specKey];
        const tierKey = (elMpvTier && mCfg.tiers[elMpvTier.value]) ? elMpvTier.value : "tier_std";
        const tCfg = mCfg.tiers[tierKey] || mCfg.tiers.tier_std;
        const mQty = isShopInstall ? shopQty : clampNumber(elMpvQty ? elMpvQty.value : 1, 1, 10, 1);
        let disc = 1.0;
        if (mQty === 2) disc = 0.90;
        else if (mQty === 3) disc = 0.88;
        else if (mQty >= 4) disc = 0.85;

        const pA = isShopInstall ? 3500 * mQty : Math.round(tCfg.qA * mQty * disc);
        const pB = isShopInstall ? 3500 * mQty : Math.round(tCfg.qB * mQty * disc);
        const prefixTag = isMpvStandalone ? "【會轉都會修】" : "【會轉都會修・清洗同日順修特惠】";

        items.push({
          title: prefixTag + mCfg.name + "（" + tCfg.label + "｜基準級距 " + mCfg.rangeLabel + "）",
          spec: mCfg.spec + (isMpvStandalone ? "" : "｜與清洗保養工程同日施作，享免收 $2,500 單獨查修出工底價"),
          unit: mQty + " " + mCfg.unitName,
          priceA: pA,
          priceB: pB
        });

        if (isMpvStandalone) {
          items.push({
            title: "【專案包含】機電技術人員儀器查修 ＋ 三相電流／絕緣阻抗實測驗收（範圍待確認）",
            spec: "確認委修直接免除 $2,500 單獨出工檢測費｜含 LOTO 斷電掛牌、三用電錶/鉤錶/高阻計實測；後續服務條件另行確認",
            unit: "1 式",
            priceA: 0,
            priceB: 0,
            isFreeGift: true
          });
        }
      }

      // 3. 計算機電閥件與選配加購項（依類別啟用狀態精準過濾，阻絕跨系統殘留汙染）
      if ((isWtActive || isCtActive) && chkPvc && chkPvc.checked) {
        items.push({
          title: "2 吋內進水／冷卻塔補給水 PVC 球閥與青銅浮球閥更新工程",
          spec: "含舊閥拆卸、南亞 PVC 雙由令球閥或重型青銅浮球閥換裝與止水測試",
          unit: "1 組",
          priceA: 3800,
          priceB: 3500
        });
      }
      if (isWtActive && chkLevel && chkLevel.checked && !(isMpvActive && elMpvSpec && elMpvSpec.value === "ctrl_float_omron")) {
        items.push({
          title: "Omron 61F-G2 液位控制器 ＋ SUS304 電極棒整組更新",
          spec: "日本歐姆龍原廠 61F-G2 控制器、保持器、304 不鏽鋼電極棒(E1~E3)與高低水位連動測試",
          unit: "1 組",
          priceA: 4500,
          priceB: 4200
        });
      }
      if ((isWtActive || isCtActive) && chkButterfly && chkButterfly.checked && !(isMpvActive && elMpvSpec && elMpvSpec.value === "valve_6_10")) {
        items.push({
          title: "大口徑 6吋~10吋 FCD/SUS304 齒輪式蝴蝶閥／無聲逆止閥抽換（級距 $22,000~$32,000起）",
          spec: "鑄鐵/不鏽鋼本體＋304蝶板＋重型齒輪箱、EPDM 法蘭墊片與304白鐵螺栓連工帶料吊裝試壓",
          unit: "1 處",
          priceA: 25000,
          priceB: 22000
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
      if (isCtActive && chkQCtSprinkler && chkQCtSprinkler.checked && !(isMpvActive && elMpvSpec && elMpvSpec.value === "ct_sprinkler")) {
        items.push({
          title: "【會轉都會修・清洗同日順修特惠】冷卻水塔旋轉播水頭（散水頭）總成更新（級距 $4,500~$38,000起）",
          spec: "與冷卻水塔保養同日施作免收 $2,500 單獨查修出工底價｜拆除中心軸承卡死舊散水頭、換裝全新旋轉播水頭總成並校正散水管水平角度",
          unit: "1 組",
          priceA: 6000,
          priceB: 4500
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
      if (chkSgs && chkSgs.checked) {
        let sgsTitle = "代客無菌採樣送驗 SGS 飲用水水質檢驗報告（大腸桿菌群／總菌落數）";
        let sgsSpec = "採樣方法、檢驗項目、受託機構與報告形式須依用途先行確認；本試算不代表水質已合格或可直接飲用";
        if (cat === "cooling_tower" || cat === "ct_ac") {
          sgsTitle = "代客採樣送驗 SGS 冷卻水塔水質／退伍軍人菌（Legionella）檢測報告";
          sgsSpec = "採樣方法、檢驗項目、受託機構與報告形式須依用途先行確認；本試算不代表水質已合格或可直接飲用";
        } else if (cat === "both" || cat === "all_three") {
          sgsTitle = "代客無菌採樣送驗 SGS 實驗室水質檢驗報告（大腸桿菌群／退伍軍人菌）";
          sgsSpec = "採樣方法、檢驗項目、受託機構與報告形式須依用途先行確認；本試算不代表水質已合格或可直接飲用";
        }
        items.push({
          title: sgsTitle,
          spec: sgsSpec,
          unit: "1 式",
          priceA: 3500,
          priceB: 3000
        });
      }
      if (cat === "shop_chlorine") {
        items.push({
          title: "工業級 90% TCCA 氯錠（用途與標示待確認）（25 公斤原裝密封大桶）",
          spec: "25kg TCCA 氯錠加購報價；實際標示、用途、安全資料及承運條件待確認，不可逕用於飲用水設備",
          unit: shopQty + " 桶(25kg)",
          priceA: 3200 * shopQty,
          priceB: 2680 * shopQty
        });
        items.push({
          title: "【洽詢項目】水系統與藥劑使用條件評估",
          spec: "檢查範圍及費用待確認；投藥須依產品標示、水質及現場條件由專業人員評估，不能僅依設備 RT 決定",
          unit: "1 式",
          priceA: 0,
          priceB: 0,
          isFreeGift: true
        });
      }
      if (cat !== "shop_chlorine" && chkChlorine25kg && chkChlorine25kg.checked) {
        const isWithTankTruck = (isWtActive || isCtActive || shopMode === "both_shop_items");
        items.push({
          title: isWithTankTruck
            ? "【水塔工程合併方案特惠】工業級 90% TCCA 氯錠（用途與標示待確認）（25公斤大桶裝）"
            : "工業級 90% TCCA 氯錠（用途與標示待確認）（25公斤大桶裝｜配送條件待確認）",
          spec: isWithTankTruck
            ? "依原合併方案報價；實際產品用途、配送方式及承運條件待確認，不表示可用於飲用水設備"
            : "單購 A 方案每桶 $3,200／B 方案每桶 $2,680；產品標示、用途、安全資料及配送條件另行確認",
          unit: shopQty + " 桶(25kg)",
          priceA: (isWithTankTruck ? 2680 : 3200) * shopQty,
          priceB: 2680 * shopQty
        });
      }
      if (isAcActive && chkAcDrain && chkAcDrain.checked && !(isMpvActive && elMpvSpec && elMpvSpec.value === "rp258_install")) {
        items.push({
          title: "【洗冷氣同日順換現折 $1,000】Realise 瑞林 RP-258 冷氣自動排水器換新＋排水管高壓疏通",
          spec: "單獨到府安裝價 $3,500；冷氣清洗同日順換依所選方案計價。更換瑞林 RP-258 排水器並疏通排水管，設備適配、產品性能與施工範圍於施工前確認。",
          unit: (shopMode === "rp258_with_ac" ? shopQty : 1) + " 組",
          priceA: 2500 * (shopMode === "rp258_with_ac" ? shopQty : 1),
          priceB: 2200 * (shopMode === "rp258_with_ac" ? shopQty : 1)
        });
      }
      if (isAcActive && chkAcRepair && chkAcRepair.checked) {
        items.push({
          title: "【冷氣清洗同日加購】風鼓異音／馬達培林／啟動電容或 FCU 二通閥順修",
          spec: "依冷氣清洗頁原加購項目帶入；不等同 AHU 大修或整組機電設備更換，實際故障與工作範圍須另確認",
          unit: "1 式",
          priceA: 4500,
          priceB: 3500
        });
      }
      if (isAcActive && chkAcOutdoor && chkAcOutdoor.checked) {
        items.push({
          title: "分離式／箱型冷氣室外機散熱鰭片高壓沖洗（4 台內）",
          spec: "清洗室外機冷凝器鰭片；工法、可達範圍及設備狀況須先評估，不承諾固定節電幅度",
          unit: "1 式",
          priceA: 2000,
          priceB: 1600
        });
      }
      if (isAcActive && chkAcSteam && chkAcSteam.checked) {
        items.push({
          title: "冷氣蒸氣／臭氧處理需求（適用性待評估）",
          spec: "是否採用及作業方法須依設備、產品資料與現場安全評估；不保證除菌、除過敏原或健康效果",
          unit: "1 式",
          priceA: 1800,
          priceB: 1500
        });
      }
      if ((isWtActive || isCtActive || isMpvActive) && chkValve24 && chkValve24.checked && !(isMpvActive && elMpvSpec && elMpvSpec.value === "valve_2_4")) {
        items.push({
          title: "2吋~4吋 蝶閥／不鏽鋼無聲逆止閥（消除停泵水錘）／防震軟管抽換（級距 $11,000~$15,000起）",
          spec: "含管路排空洩壓、舊閥拆卸、規格待核對的閥體、EPDM墊片與SUS304不鏽鋼螺栓換裝試壓",
          unit: "1 處",
          priceA: 12500,
          priceB: 11000
        });
      }
      if ((isMpvActive || isWtActive || isCtActive || isAcActive) && chkMpvElec && chkMpvElec.checked) {
        items.push({
          title: "機電控制盤電磁接觸器／積熱電驛／啟動電容更新 ＋ 三相絕緣阻抗實測",
          spec: "更換老化燒熔之電磁接觸器(Magnetic Contactor)、過載積熱電驛或防爆運轉電容，並實測迴路絕緣",
          unit: "1 組",
          priceA: 3500,
          priceB: 2800
        });
      }
      if (isMpvActive && chkMpvUrgent && chkMpvUrgent.checked) {
        items.push({
          title: "⚡ 急件調度洽詢 ／ 夜間（18:00後）與例假日緊急出勤調度費",
          spec: "針對緊急停水、冰水機跳高壓或營業場所空調停擺，優先調度機電工程車與備品救火",
          unit: "1 趟",
          priceA: 4500,
          priceB: 3500
        });
      }

      // Public prices are computed only from configured service selections.
      // Special additions or discounts require separate confirmation with 皓盛.

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
          return "<span style='color:#16a34a;font-weight:900;'>範圍待確認</span>";
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
            "<th class='num-col' style='width:11.5%;'>A方案：指定時段專車</th>" +
            "<th class='num-col' style='width:11.5%;'>B方案：平日併單</th>" +
            "</tr>";
        } else {
          const singleTitle = (displayMode === "only_a") ? "A方案：指定時段專車項目金額" : "B方案：平日併單項目金額";
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
                "<div class='qp-plan-title'>★ A方案：指定時段專車專案（可指定日期/急件）</div>" +
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
            ? "★ 目前選擇【A方案：指定時段專車專案】"
            : "⚡ 目前選擇【B方案：平日彈性順路併單特惠檔期】";
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

      // Nonbinding scope and safety checklist, not a contract or qualification assurance.
      if (outComplianceArea) {
        outComplianceArea.innerHTML =
          "<div style='font-weight:900;color:#0369a1;margin-bottom:2px;font-size:0.84rem;'>施工前確認事項</div>" +
          "<ol style='padding-left:16px;margin:0;'>" +
          "<li><strong>範圍與報價</strong>：依客戶填寫的資料報價；若現場條件不同，施工前由雙方確認調整。設備、料件、施工範圍、排程、驗收、付款及保固條件由雙方確認。</li>" +
          "<li><strong>作業安全</strong>：進場方式、人員配置、資格與訓練、停機隔離、防墜及入槽監視、通風、氣體測定需求，須依現場風險與適用規範評估。各方依法應負的義務不因本報價而免除。</li>" +
          "<li><strong>清洗、水質與產品</strong>：藥劑用途、產品標示及安全資料、清洗方法與檢驗項目須先核對。工業用氯錠不可直接套用於飲用水儲水設備；餘氯、pH、TDS 等現場指標不能單獨證明飲用水安全。配送方式及承運條件另行確認。</li>" +
          "</ol>";
      }

      // 渲染管委會／客戶簽核勾選區（依類別智慧調整停水公告或空調斷電提示）
      if (outDecisionArea) {
        const scheduleNotice = (cat === "ac_cleaning")
          ? "（施工前協調分區空調斷電與施作動線）"
          : (cat === "cooling_tower" ? "（施工前協調冷卻水塔分塔隔離或停機時段）" : "（停水公告及施工時段另行協調）");
        if (displayMode === "ab_compare") {
          outDecisionArea.innerHTML =
            "<div style='font-weight:900;color:#0f172a;margin-bottom:4px;font-size:0.84rem;'>【方案選擇與備註】</div>" +
            "<div style='margin-bottom:3px;font-size:0.8rem;'>□ 選擇 <strong>A方案（指定專車：NT$ " + totalA.toLocaleString() + "）</strong>，預計日期：" + escapeHtml(docYear) + "年____月____日</div>" +
            "<div style='margin-bottom:8px;font-size:0.8rem;'>□ 選擇 <strong>B方案（平日併單：NT$ " + totalB.toLocaleString() + "）</strong>，可洽詢平日排程</div>" +
            "<div style='margin-top:8px;border-top:1px solid #94a3b8;padding-top:6px;font-size:0.8rem;'>需求備註：____________________ 日期：____/____/____</div>";
        } else {
          const chosenTot = (displayMode === "only_a") ? totalA : totalB;
          outDecisionArea.innerHTML =
            "<div style='font-weight:900;color:#0f172a;margin-bottom:4px;font-size:0.84rem;'>【施工安排與備註】</div>" +
            "<div style='margin-bottom:6px;font-size:0.8rem;'>本頁依所填資料報價，報價總額 <strong>NT$ " + chosenTot.toLocaleString() + " 元</strong>。</div>" +
            "<div style='margin-bottom:8px;font-size:0.8rem;'>預計施工日期：" + escapeHtml(docYear) + " 年 ____ 月 ____ 日" + scheduleNotice + "</div>" +
            "<div style='margin-top:8px;border-top:1px solid #94a3b8;padding-top:6px;font-size:0.8rem;'>需求備註：____________________ 日期：____/____/____</div>";
        }
      }

      const verifyHash = computeQuoteVerifyHash(cat, items.length, totalA, totalB, includeTax);
      if (outDocNo) {
        outDocNo.textContent = docNo + " [檢核:" + verifyHash + "]";
      }
      const outVerifyEl = document.getElementById("qp-out-verify-hash");
      if (outVerifyEl) {
        outVerifyEl.textContent = "計算參考碼：" + verifyHash + "｜僅供數值比對，不具簽章或身分驗證效力";
      }

      // 同步更新手機/桌機即時懸浮總價列 (#qp-live-summary-text)
      const liveBarText = document.getElementById("qp-live-summary-text");
      if (liveBarText) {
        if (displayMode === "ab_compare") {
          liveBarText.innerHTML =
            "已選 <strong>" + items.length + "</strong> 項｜A專車 <strong style='color:#fde68a;'>$" + totalA.toLocaleString() +
            "</strong> ／ B平日 <strong style='color:#34d399;'>$" + totalB.toLocaleString() +
            "</strong> <span style='font-size:0.75rem;color:#94a3b8;'>(省$" + savedDiff.toLocaleString() + ")</span>";
        } else {
          const singleTot = (displayMode === "only_a") ? totalA : totalB;
          liveBarText.innerHTML =
            "已選 <strong>" + items.length + "</strong> 項｜報價總計 <strong style='color:#34d399;'>NT$ " + singleTot.toLocaleString() + "</strong>";
        }
      }

      let currentSnapshot = null;
      if (shouldPersist !== false) {
        currentSnapshot = persistCurrentQuoteState();
      } else {
        currentSnapshot = loadQuoteDraft();
      }
      const shareUrl = buildShareableQuoteUrl(currentSnapshot);

      // 啟動智慧單頁 A4 動態縮放計算（傳入工項數與自訂文字總長度）
      const extraTextLen = clientName.length + clientAddr.length;
      autoFitSinglePagePDF(items.length, extraTextLen);

      // 回傳純文字摘要供 LINE 複製使用（附帶一鍵還原報價單連結與計算參考碼）
      const lineItemsText = items.map(function (it, i) {
        if (it.isFreeGift) return (i + 1) + ". " + it.title + "：可洽詢";
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
           "\n⚡ B方案（平日併單）：NT$ " + totalB.toLocaleString() + (includeTax ? " (含5%稅，現省$" + savedDiff.toLocaleString() + ")" : " (未稅，現省$" + savedDiff.toLocaleString() + ")"))
        : ("報價總金額：NT$ " + ((displayMode === "only_a") ? totalA : totalB).toLocaleString() + (includeTax ? " (含5%營業稅)" : " (未稅)"));

      return "📄 報價參考編號（非公司流水號）：" + docNo + " [計算參考:" + verifyHash + "]" +
        "\n🏢 客戶寶號：" + clientName + "（" + contactPerson + "）" +
        "\n📍 案場位置：" + clientAddr +
        "\n-------------------------\n" +
        lineItemsText +
        "\n-------------------------\n" +
        priceText +
        (cat === "ac_cleaning" ? "\n✓ 人員、作業方式、範圍與後續服務條件須另行確認" : "\n✓ 人員資格、職安訓練、戒護配置與保險文件，須依實際工程及派工另行核對") +
        "\n依客戶填寫的資料報價；若現場條件不同，施工前由雙方確認調整。" +
        "\n🔗 還原規格與金額（不含客戶資料及自訂項目名稱）：\n" + shareUrl;
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

    function clearVisibleDraft() {
      if (renderRafId !== null) cancelAnimationFrame(renderRafId);
      renderRafId = null;
      isComposing = false;
      form.reset();
      if (elClientName) elClientName.value = "";
      if (elContactPerson) elContactPerson.value = "";
      if (elClientAddr) elClientAddr.value = "";
      if (elDocNo) elDocNo.value = generatedReference;
      if (elDocDate) elDocDate.value = yyyy + "-" + mm + "-" + dd;
      renderQuotation(false);
    }
    if (btnClearDraft) {
      btnClearDraft.addEventListener("click", function () {
        clearQuoteDraft();
        clearVisibleDraft();
        showToast("已清除此瀏覽器保存的報價草稿與目前客戶資料；已下載或傳送的文件不受影響。");
      });
    }

    // Clear stale on-screen customer data as well as storage after removal/expiry.
    window.addEventListener("pageshow", function (e) {
      if (e && e.persisted) {
        if (loadQuoteDraft()) applyStoredDraft(false, "");
        else clearVisibleDraft();
      }
    });
    window.addEventListener("storage", function (e) {
      if (!e || e.key === DRAFT_STORAGE_KEY || e.key === null || LEGACY_STORAGE_KEYS.indexOf(e.key) !== -1) {
        if (loadQuoteDraft()) applyStoredDraft(false, "");
        else clearVisibleDraft();
      }
    });

    // 列印前後檔名安全鎖定（過濾控制字元與超長檔名，並避免按鈕觸發與 beforeprint 重複重繪）
    function applyPrintDocumentTitle() {
      if (savedDocumentTitle === null) {
        savedDocumentTitle = document.title;
      }
      const cName = sanitizeFilenamePart(elClientName ? elClientName.value : "", "社區與商場專案", 32);
      const dNo = sanitizeFilenamePart(elDocNo ? elDocNo.value : "", "HS報價單", 24);
      document.title = "皓盛有限公司_報價單_" + cName + "_" + dNo;

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
        const curCat = elCategory ? elCategory.value : "water_tank";
        let catShort = "水塔、空調與機電閥件規格";
        if (curCat === "mpv_repair") catShort = "「會轉都會修」機電馬達與閥件搶修規格";
        else if (curCat === "ac_cleaning") catShort = "冷氣與中央空調清洗及順修規格";
        else if (curCat === "cooling_tower") catShort = "商用冷卻水塔與傳動閥件規格";
        else if (curCat === "water_tank") catShort = "自來水塔與給水閥件規格";
        lblToggleSpecs.textContent = collapsed
          ? ("✓ 3. 已自動帶入您剛才選好的" + catShort + "（點此展開微調規格 ▸）")
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
      // A new calculator selection must not inherit unrelated extras or old custom charges.
      if (["shop", "water-tank", "cooling-tower", "ac-cleaning", "motor-pump-valve"].indexOf(fromParamVal) !== -1) {
        saveQuoteDraft({
          chkPvcValve: false, chkLevel: false, chkButterfly: false, chkFill: false,
          chkCtSprinkler: false, chkInverter: false, chkSgs: false, chkChlorine25kg: false,
          chkAcDrain: false, chkAcRepair: false, chkAcOutdoor: false, chkAcSteam: false,
          chkAddMpv: false, chkValve24: false, chkMpvElec: false, chkMpvUrgent: false,
          mpvQty: "1", shopMode: "", shopQty: "1", customName: "", customPrice: "0"
        });
      }
      if (fromParamVal === "share") {
        const urlPatch = {
          displayMode: params.get("dmode") || "ab_compare",
          serviceCategory: params.get("cat") || "water_tank",
          // Clear omitted identity fields instead of borrowing a different customer's stored draft.
          // Legacy links remain readable; all newly generated links omit these fields.
          clientName: params.get("cname") || "貴社區管理委員會 ／ 貴公司廠務部",
          contactPerson: params.get("cperson") || "總幹事 ／ 廠務主管 鈞啟",
          clientAddr: params.get("caddr") || "台北市 / 新北市",
          customName: "",
          customPrice: "0"
        };
        if (params.get("ton")) urlPatch.wtTonnage = params.get("ton");
        if (params.get("mat")) urlPatch.wtMaterial = params.get("mat");
        if (params.get("pools") !== null) urlPatch.wtPoolCount = params.get("pools");
        if (params.get("rt")) urlPatch.ctRtScale = params.get("rt");
        if (params.get("type")) urlPatch.ctTowerType = params.get("type");
        if (params.get("cnt") !== null) urlPatch.ctTowerCount = params.get("cnt");
        if (params.get("actype")) urlPatch.acType = params.get("actype");
        if (params.get("acqty")) urlPatch.acQty = params.get("acqty");
        urlPatch.chkAddMpv = (params.get("addmpv") === "1");
        if (params.get("mpvspec")) urlPatch.mpvSpec = params.get("mpvspec");
        if (params.get("mpvtier")) urlPatch.mpvTier = params.get("mpvtier");
        if (params.get("mpvqty")) urlPatch.mpvQty = params.get("mpvqty");
        urlPatch.chkPvcValve = (params.get("pvc") === "1");
        urlPatch.chkLevel = (params.get("lvl") === "1");
        urlPatch.chkButterfly = (params.get("bf") === "1");
        urlPatch.chkFill = (params.get("fill") === "1");
        urlPatch.chkCtSprinkler = (params.get("ctspr") === "1");
        urlPatch.chkInverter = (params.get("inv") === "1");
        urlPatch.chkSgs = (params.get("sgs") === "1");
        urlPatch.chkChlorine25kg = (params.get("cl25") === "1");
        urlPatch.chkAcDrain = (params.get("acdrain") === "1");
        urlPatch.chkAcRepair = (params.get("acrepair") === "1");
        urlPatch.shopMode = params.get("shopmode") || "";
        urlPatch.shopQty = params.get("shopqty") || "1";
        urlPatch.chkAcOutdoor = (params.get("acout") === "1");
        urlPatch.chkAcSteam = (params.get("acsteam") === "1");
        urlPatch.chkValve24 = (params.get("v24") === "1");
        urlPatch.chkMpvElec = (params.get("mpvelec") === "1");
        urlPatch.chkMpvUrgent = (params.get("mpvurg") === "1");
        if (params.get("tax") !== null) urlPatch.chkTax = (params.get("tax") === "1");
        saveQuoteDraft(urlPatch);
      } else if (fromParamVal === "shop") {
        const shopMode = params.get("shopmode") || "rp258_standalone";
        const urlPatch = {
          displayMode: "ab_compare",
          region: params.get("reg") || "台北市 / 新北市",
          shopMode: shopMode === "rp258_combo" ? "rp258_with_ac" : (shopMode === "chlorine_ct_combo" ? "chlorine_with_ct" : shopMode),
          shopQty: params.get("qty") || "1",
          chkTax: (params.get("tax") !== null) ? (params.get("tax") === "1") : true
        };
        if (shopMode === "rp258_standalone") {
          urlPatch.serviceCategory = "mpv_repair";
          urlPatch.chkAddMpv = true;
          urlPatch.mpvSpec = "rp258_install";
          urlPatch.mpvTier = "tier_std";
          urlPatch.mpvQty = "1";
          urlPatch.chkChlorine25kg = false;
        } else if (shopMode === "rp258_combo" || shopMode === "rp258_with_ac") {
          urlPatch.serviceCategory = "ac_cleaning";
          urlPatch.acType = "split";
          urlPatch.acQty = "base";
          urlPatch.chkAcDrain = true;
          urlPatch.chkAddMpv = false;
          urlPatch.chkChlorine25kg = false;
        } else if (shopMode === "chlorine_only") {
          urlPatch.serviceCategory = "shop_chlorine";
          urlPatch.chkChlorine25kg = true;
          urlPatch.chkAddMpv = false;
        } else if (shopMode === "chlorine_ct_combo" || shopMode === "chlorine_with_ct") {
          urlPatch.serviceCategory = "cooling_tower";
          urlPatch.ctRtScale = "100";
          urlPatch.ctTowerType = "open_round";
          urlPatch.ctTowerCount = "0";
          urlPatch.chkChlorine25kg = true;
          urlPatch.chkAddMpv = false;
        } else if (shopMode === "chlorine_with_wt") {
          urlPatch.serviceCategory = "water_tank";
          urlPatch.wtTonnage = "120";
          urlPatch.wtMaterial = "concrete";
          urlPatch.wtPoolCount = "0";
          urlPatch.chkChlorine25kg = true;
          urlPatch.chkAddMpv = false;
        } else if (shopMode === "both_shop_items") {
          urlPatch.serviceCategory = "mpv_repair";
          urlPatch.chkAddMpv = true;
          urlPatch.mpvSpec = "rp258_install";
          urlPatch.mpvTier = "tier_std";
          urlPatch.mpvQty = "1";
          urlPatch.chkChlorine25kg = true;
        }
        saveQuoteDraft(urlPatch);
      } else if (fromParamVal === "water-tank") {
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
        if (params.get("v24") !== null) urlPatch.chkValve24 = (params.get("v24") === "1");
        if (params.get("wtpump") === "1") { urlPatch.chkAddMpv = true; urlPatch.mpvSpec = "pump_seal_bearing"; urlPatch.mpvTier = "tier_std"; } else { urlPatch.chkAddMpv = false; }
        if (params.get("bf") !== null) urlPatch.chkButterfly = (params.get("bf") === "1");
        if (params.get("lvl") !== null) urlPatch.chkLevel = (params.get("lvl") === "1");
        if (params.get("sgs") !== null) urlPatch.chkSgs = (params.get("sgs") === "1");
        if (params.get("cl25") !== null) urlPatch.chkChlorine25kg = (params.get("cl25") === "1");
        if (params.get("tax") !== null) urlPatch.chkTax = (params.get("tax") === "1");
        if (urlPatch.serviceCategory === "both" || urlPatch.serviceCategory === "all_three") {
          urlPatch.ctRtScale = "50";
          urlPatch.ctTowerType = "open_round";
          urlPatch.ctTowerCount = "0";
        }
        if (urlPatch.serviceCategory === "wt_ac" || urlPatch.serviceCategory === "all_three") {
          urlPatch.acType = "split";
          urlPatch.acQty = "base";
        }
        saveQuoteDraft(urlPatch);
      } else if (fromParamVal === "motor-pump-valve") {
        const isComboClean = (params.get("mpvcombo") === "1");
        const urlPatch = {
          serviceCategory: params.get("cat") || "mpv_repair",
          scheduleMode: params.get("mode") || "priority_50",
          displayMode: "ab_compare",
          chkAddMpv: true,
          chkMpvComboClean: isComboClean
        };
        if (params.get("reg")) urlPatch.region = params.get("reg");
        if (params.get("mpvspec")) urlPatch.mpvSpec = params.get("mpvspec");
        if (params.get("mpvtier")) urlPatch.mpvTier = params.get("mpvtier");
        if (params.get("mpvqty")) urlPatch.mpvQty = params.get("mpvqty");
        if (params.get("actype")) urlPatch.acType = params.get("actype");
        if (params.get("mpvurg") !== null) urlPatch.chkMpvUrgent = (params.get("mpvurg") === "1");
        if (params.get("mpvelec") !== null) urlPatch.chkMpvElec = (params.get("mpvelec") === "1");
        if (params.get("tax") !== null) urlPatch.chkTax = (params.get("tax") === "1");
        saveQuoteDraft(urlPatch);
      } else if (fromParamVal === "ac-cleaning") {
        const urlPatch = {
          serviceCategory: params.get("cat") || "ac_cleaning",
          scheduleMode: params.get("mode") || "priority_50",
          displayMode: "ab_compare"
        };
        if (params.get("reg")) urlPatch.region = params.get("reg");
        if (params.get("actype")) urlPatch.acType = params.get("actype");
        if (params.get("acqty")) urlPatch.acQty = params.get("acqty");
        if (params.get("acdrain") !== null) urlPatch.chkAcDrain = (params.get("acdrain") === "1");
        urlPatch.chkAcRepair = (params.get("acmpv") === "1");
        urlPatch.chkAddMpv = false;
        if (params.get("acout") !== null) urlPatch.chkAcOutdoor = (params.get("acout") === "1");
        if (params.get("acsteam") !== null) urlPatch.chkAcSteam = (params.get("acsteam") === "1");
        if (params.get("tax") !== null) urlPatch.chkTax = (params.get("tax") === "1");
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
        if (params.get("ctspr") !== null) urlPatch.chkCtSprinkler = (params.get("ctspr") === "1");
        if (params.get("ctmot") === "1") {
          urlPatch.chkAddMpv = true;
          urlPatch.mpvSpec = "ct_motor_pump";
          urlPatch.mpvTier = "tier_std";
        } else {
          urlPatch.chkAddMpv = false;
        }
        if (params.get("bf") !== null) urlPatch.chkButterfly = (params.get("bf") === "1");
        if (params.get("pvc") !== null) urlPatch.chkPvcValve = (params.get("pvc") === "1");
        if (params.get("inv") !== null) urlPatch.chkInverter = (params.get("inv") === "1");
        if (params.get("sgs") !== null) urlPatch.chkSgs = (params.get("sgs") === "1");
        if (params.get("cl25") !== null) urlPatch.chkChlorine25kg = (params.get("cl25") === "1");
        if (params.get("tax") !== null) urlPatch.chkTax = (params.get("tax") === "1");
        if (urlPatch.serviceCategory === "ct_ac") {
          urlPatch.acType = "cassette";
          urlPatch.acQty = "base";
        }
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

    if (btnLoadDraft) {
      btnLoadDraft.addEventListener("click", function () {
        applyStoredDraft(true, "", true);
        showToast("已載入儲存草稿（含原日期與參考編號），請確認是否適用本次報價。");
      });
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
        copyAndOpenLine(text, "【皓盛有限公司 統編90221911 報價單】");
      });
    }
    const btnShareLink = document.getElementById("btn-q-share-url");
    if (btnShareLink) {
      btnShareLink.addEventListener("click", function () {
        renderQuotation(true);
        const snap = persistCurrentQuoteState();
        const url = buildShareableQuoteUrl(snap);
        const manualBox = document.getElementById("quote-share-fallback");
        const manualField = document.getElementById("quote-share-link-value");
        if (manualBox) manualBox.hidden = true;
        if (manualField) manualField.value = url;
        const syncCopied = fallbackCopyText(url);
        let copyConfirmed = false;
        function confirmCopy() {
          if (copyConfirmed) return;
          copyConfirmed = true;
          if (manualBox) manualBox.hidden = true;
          showToast("✓ 已複製規格與金額連結；不含客戶資料及自訂項目名稱，開啟後請另填。");
        }
        function showManualCopy() {
          if (copyConfirmed) return;
          if (manualBox) manualBox.hidden = false;
          if (manualField) {
            try { manualField.focus(); manualField.select(); } catch (err) {}
          }
          showToast("瀏覽器未允許自動複製；請複製下方顯示的連結。");
        }
        if (syncCopied) confirmCopy();
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          try {
            navigator.clipboard.writeText(url).then(confirmCopy, showManualCopy);
          } catch (err) { showManualCopy(); }
        } else if (!syncCopied) {
          showManualCopy();
        }
      });
    }
    const btnLiveJump = document.getElementById("btn-qp-live-jump");
    if (btnLiveJump && paperSheet) {
      btnLiveJump.addEventListener("click", function () {
        paperSheet.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }


  // ============================================================================
  // 5. 首頁 Google 地圖官方地標 (MEO) 雙模式切換與離線防破版保護 (v21.1)
  // ============================================================================
  function initMeoMapTabs() {
    const btnGmap = document.getElementById("btn-meo-tab-gmap");
    const btnRadar = document.getElementById("btn-meo-tab-radar");
    const paneGmap = document.getElementById("meo-pane-gmap");
    const paneRadar = document.getElementById("meo-pane-radar");
    const iframe = document.getElementById("meo-gmap-iframe");
    if (!btnGmap || !btnRadar || !paneGmap || !paneRadar) return;

    function switchTab(mode) {
      if (mode === "radar") {
        btnRadar.classList.add("active");
        btnGmap.classList.remove("active");
        btnRadar.setAttribute("aria-selected", "true");
        btnGmap.setAttribute("aria-selected", "false");
        paneRadar.style.display = "flex";
        paneGmap.style.display = "none";
      } else {
        btnGmap.classList.add("active");
        btnRadar.classList.remove("active");
        btnGmap.setAttribute("aria-selected", "true");
        btnRadar.setAttribute("aria-selected", "false");
        paneGmap.style.display = "block";
        paneRadar.style.display = "none";
      }
    }

    btnGmap.addEventListener("click", function () { switchTab("gmap"); });
    btnRadar.addEventListener("click", function () { switchTab("radar"); });

    // 防禦性工程：若於無外網環境（如內部封閉網路或離線預覽 about:/file:）自動切換呈現高解析 SVG 地標雷達圖，避免出現瀏覽器斷網圖示
    const isOfflineEnv = (window.location.protocol === "about:" || window.location.protocol === "file:" || navigator.onLine === false);
    if (isOfflineEnv) {
      if (iframe) iframe.removeAttribute("src");
      switchTab("radar");
    }
  }

  
  function initStickyQuoteButton() {
    const stickyQuoteBtn = document.getElementById("btn-sticky-to-quote");
    if (!stickyQuoteBtn) return;
    const calcQuoteBtn =
      document.getElementById("btn-calc-to-quote") ||
      document.getElementById("btn-ct-to-quote") ||
      document.getElementById("btn-ac-to-quote") ||
      document.getElementById("btn-mpv-to-quote") ||
      document.getElementById("btn-shop-to-quote");
    if (calcQuoteBtn) {
      stickyQuoteBtn.addEventListener("click", function (e) {
        e.preventDefault();
        calcQuoteBtn.click();
      });
    }
  }


  // ============================================================================
  // 3D. 第五引擎：機電嚴選商城（瑞林 RP-258 排水器到府安裝 ＆ 25kg 桶裝氯錠（用途與標示待確認））試算器 (v24.0)
  // ============================================================================
  function initShopCalculator() {
    const form = document.getElementById("shop-calc-form");
    if (!form) return;

    const itemSelect = document.getElementById("shop-item-select");
    const regionSelect = document.getElementById("shop-region");
    const qtySelect = document.getElementById("shop-qty");
    const chkInspect = document.getElementById("shop-chk-free-inspect");
    const chkTax = document.getElementById("shop-chk-tax");

    const outPrice = document.getElementById("shop-price-output");
    const outDelivery = document.getElementById("shop-delivery-output");
    const outBonus = document.getElementById("shop-bonus-output");
    const outSummary = document.getElementById("shop-summary-text");

    const btnToQuote = document.getElementById("btn-shop-to-quote");
    const btnLine = document.getElementById("btn-shop-line");

    function calcShop() {
      const mode = itemSelect ? itemSelect.value : "rp258_standalone";
      const reg = regionSelect ? regionSelect.value : "台北市 / 新北市";
      const qty = clampNumber(qtySelect ? qtySelect.value : 1, 1, 20, 1);
      const includeTax = Boolean(chkTax && chkTax.checked);
      const freeInspect = Boolean(chkInspect && chkInspect.checked);

      let priceStr = "";
      let deliveryStr = "";
      let bonusStr = "";
      let itemTitle = "";

      if (mode === "rp258_standalone") {
        let tot = 3500 * qty;
        if (includeTax) tot = Math.round(tot * 1.05);
        priceStr = "NT$ " + tot.toLocaleString() + " 元（" + (includeTax ? "含 5% 營業稅" : "未稅") + "｜連工帶料到府完工價）";
        deliveryStr = "RP-258 排水器到府安裝及排水管檢查；設備適配、工法與工時待現場確認";
        bonusStr = "可洽詢冷氣檢查及合併清洗方案；實際範圍另行確認。排水器單獨與合併方案依原試算價格列示。";
        itemTitle = "Realise 瑞林 RP-258 冷氣排水器到府安裝＋通排水管＋全室冷氣檢查項目待確認（共 " + qty + " 組）";
      } else if (mode === "rp258_with_ac") {
        let baseB = 10000 + (2200 * qty);
        let baseA = 12500 + (2500 * qty);
        if (includeTax) {
          baseB = Math.round(baseB * 1.05);
          baseA = Math.round(baseA * 1.05);
        }
        priceStr = "平日併單 NT$ " + baseB.toLocaleString() + " ／ 指定專車 NT$ " + baseA.toLocaleString() + "（" + (includeTax ? "含 5% 稅" : "未稅") + "）";
        deliveryStr = "機電工程車到府：含 4 台內分離式冷氣深層拆洗包套 ＋ 同日順換瑞林 RP-258 排水器（已現折 $1,000~$1,300/組！）";
        bonusStr = "冷氣排水與排水器問題須先查明原因；施工範圍及後續服務條件另行確認。";
        itemTitle = "冷氣深層拆洗包套 ＋ 順換瑞林 RP-258 排水器（" + qty + " 組・已折抵出車費）";
      } else if (mode === "chlorine_only") {
        let tot = 3200 * qty;
        if (includeTax) tot = Math.round(tot * 1.05);
        priceStr = "NT$ " + tot.toLocaleString() + " 元（" + (includeTax ? "含 5% 營業稅" : "未稅") + "｜配送方式與費用另行確認）";
        deliveryStr = "25kg 氯錠交付評估；庫存、包裝、交付地點、配送方式與承運條件均待確認";
        bonusStr = "單購報價 $3,200、合併方案 $2,680，每桶價差 $520；此為方案價差，不視為已確認的運費或可承運保證。";
        itemTitle = "單買 25 公斤大桶裝 90% TCCA 氯錠（用途與標示待確認）（共 " + qty + " 桶・配送另行確認）";
      } else if (mode === "chlorine_with_ct") {
        let baseB = 10500 + (2680 * qty);
        let baseA = 13000 + (2680 * qty);
        if (includeTax) {
          baseB = Math.round(baseB * 1.05);
          baseA = Math.round(baseA * 1.05);
        }
        priceStr = "平日併單 NT$ " + baseB.toLocaleString() + " ／ 指定專車 NT$ " + baseA.toLocaleString() + "（含 100RT 水塔清洗＋" + qty + "桶氯錠，配送待確認）";
        deliveryStr = "冷卻水塔清洗與 25kg 氯錠合併方案報價；產品用途及配送條件須分別確認（氯錠每桶 $2,680）";
        bonusStr = "藥劑用途、標示、水質及現場條件須先確認，不提供僅依 RT 噸數推定的投藥量。";
        itemTitle = "商用空調冷卻水塔清洗保養 ＋ 合併方案加購 25kg 氯錠（用途與標示待確認）（" + qty + " 桶）";
      } else if (mode === "chlorine_with_wt") {
        let baseB = 17500 + (2680 * qty);
        let baseA = 23000 + (2680 * qty);
        if (includeTax) {
          baseB = Math.round(baseB * 1.05);
          baseA = Math.round(baseA * 1.05);
        }
        priceStr = "平日併單 NT$ " + baseB.toLocaleString() + " ／ 指定專車 NT$ " + baseA.toLocaleString() + "（含標準社區洗水塔＋" + qty + "桶氯錠，配送待確認）";
        deliveryStr = "水池清洗與氯錠分開評估用途；每桶 $2,680 的合併方案，不表示適用於飲用水儲水設備，實際配送待確認";
        bonusStr = "工業用氯錠不可直接套用於飲用水儲水設備，產品用途與交付條件須先確認。";
        itemTitle = "社區大樓自來水塔清洗消毒 ＋ 合併方案加購 25kg 氯錠（用途與標示待確認）（" + qty + " 桶）";
      } else {
        let tot = (3500 * qty) + (2680 * qty);
        if (includeTax) tot = Math.round(tot * 1.05);
        priceStr = "NT$ " + tot.toLocaleString() + " 元（" + (includeTax ? "含 5% 營業稅" : "未稅") + "｜RP-258 到府安裝＋順載 25kg 氯錠，配送待確認）";
        deliveryStr = "RP-258 安裝與 25kg 氯錠合併方案報價；設備適配、施工範圍與藥劑配送條件須分別確認";
        bonusStr = "可一併洽詢冷氣排水與水系統需求；實際診斷、服務範圍及費用須另行確認。";
        itemTitle = "瑞林 RP-258 冷氣排水器到府安裝 ＋ 合併方案順載 25kg 氯錠（用途與標示待確認）（各 " + qty + " 組/桶）";
      }

      if (outPrice) outPrice.textContent = priceStr;
      if (outDelivery) outDelivery.textContent = deliveryStr;
      if (outBonus) outBonus.textContent = bonusStr;

      const summary = "【皓盛機電商城：瑞林RP-258排水器安裝 ＆ 25kg氯錠（用途與標示待確認）採購】" +
        "\n📍 地區：" + reg +
        "\n🛒 選購方案：" + itemTitle +
        "\n🚚 交付與施工：" + deliveryStr +
        (freeInspect ? "\n🔍 檢查項目待確認：已勾選請師傅順便提供冷氣空調／冷卻水塔專業診斷建議" : "") +
        "\n💰 預估金額：" + priceStr;

      if (outSummary) {
        outSummary.textContent = summary.replace(/\n/g, " ｜ ");
      }
      return summary;
    }

    form.addEventListener("change", calcShop);
    form.addEventListener("input", calcShop);
    calcShop();

    if (btnLine) {
      btnLine.addEventListener("click", function () {
        copyAndOpenLine(calcShop(), "【皓盛機電商城 5390857.com 排水器安裝／25kg氯錠訂購單】");
      });
    }
    if (btnToQuote) {
      btnToQuote.addEventListener("click", function () {
        calcShop();
        const mode = itemSelect ? itemSelect.value : "rp258_standalone";
        const qParams = new URLSearchParams({
          from: "shop",
          shopmode: mode,
          reg: regionSelect ? regionSelect.value : "台北市 / 新北市",
          qty: qtySelect ? qtySelect.value : "1",
          tax: (chkTax && chkTax.checked) ? "1" : "0"
        });
        window.location.href = "quote.html?" + qParams.toString() + "#qp-workspace-anchor";
      });
    }
  }

  function bootAllModules() {
    initStickyQuoteButton();
    initBeforeAfterSlider();
    initMeoMapTabs();
    initWaterTankCalculator();
    initCoolingTowerCalculator();
    initAcCleaningCalculator();
    initMpvCalculator();
    initShopCalculator();
    initQuoteGenerator();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAllModules);
  } else {
    bootAllModules();
  }
})();
