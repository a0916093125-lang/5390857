/**
 * 皓盛有限公司｜空調冷卻水塔清洗保養 × 無軸文丘里太陽能除垢系統
 * 全站互動、節能 ROI 試算、Before/After 視覺對比與雙 3D CAD 工程引擎 (assets/cad-engine.js)
 */
(function() {
    if (window.__HAOSHENG_ENGINE_INITIALIZED__) return;
    window.__HAOSHENG_ENGINE_INITIALIZED__ = true;

        // 0. 跨瀏覽器 Canvas 圓角矩形相容保護
        function drawSafeRoundRect(ctx, x, y, w, h, r) {
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(x, y, w, h, r);
            } else {
                const radius = Math.min(r, w / 2, h / 2);
                ctx.moveTo(x + radius, y);
                ctx.arcTo(x + w, y, x + w, y + h, radius);
                ctx.arcTo(x + w, y + h, x, y + h, radius);
                ctx.arcTo(x, y + h, x, y, radius);
                ctx.arcTo(x, y, x + w, y, radius);
                ctx.closePath();
            }
        }

        // 1. 手機版選單切換
        const menuBtn = document.getElementById('menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });

        // 2. FAQ 折疊展開
        document.querySelectorAll('.faq-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const content = btn.nextElementSibling;
                const icon = btn.querySelector('.fa-chevron-down');
                content.classList.toggle('hidden');
                btn.classList.toggle('text-teal-600');
                if (icon) {
                    icon.classList.toggle('rotate-180');
                }
            });
        });

        // 3. 方案卡片點擊連動聯絡表單
        const serviceSelect = document.getElementById('input-service');
        const messageInput = document.getElementById('input-message');
        document.querySelectorAll('.plan-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const planName = btn.getAttribute('data-plan');
                if (planName && serviceSelect) {
                    for (let i = 0; i < serviceSelect.options.length; i++) {
                        if (serviceSelect.options[i].value === planName) {
                            serviceSelect.selectedIndex = i;
                            break;
                        }
                    }
                    if (messageInput && !messageInput.value.trim()) {
                        messageInput.value = `您好，我想諮詢「${planName}」，請協助安排現場勘查與報價。`;
                    }
                }
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // 4. 表單送出與複製加 LINE 功能
        const contactForm = document.getElementById('contact-form');
        const formSuccess = document.getElementById('form-success');
        const btnCopyLineMsg = document.getElementById('btnCopyLineMsg');

        function buildInquiryText() {
            const name = document.getElementById('input-name').value.trim() || '貴客';
            const phone = document.getElementById('input-phone').value.trim() || '未填寫';
            const service = document.getElementById('input-service').value;
            const message = document.getElementById('input-message').value.trim() || '請與我聯繫討論細節';
            return {
                name,
                phone,
                service,
                message,
                fullText: `【皓盛網站工程諮詢】\n姓名/稱謂：${name}\n聯絡電話：${phone}\n諮詢項目：${service}\n需求說明：\n${message}`
            };
        }

        if (contactForm) contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const info = buildInquiryText();
            const subject = encodeURIComponent(`【網站諮詢】來自 ${info.name} 的水塔保養/文丘里工程需求`);
            const body = encodeURIComponent(info.fullText);
            window.location.href = `mailto:ssuyuan@kimo.com?subject=${subject}&body=${body}`;

            formSuccess.innerHTML = `✅ 已為您喚起郵件軟體寄送至 <strong>ssuyuan@kimo.com</strong>！您也可以直接撥打 <strong>0916-093-125</strong> 或加 LINE 與李先生聯繫。`;
            formSuccess.classList.remove('hidden');
        });

        async function copyTextSafe(text) {
            if (navigator.clipboard && window.isSecureContext) {
                try {
                    await navigator.clipboard.writeText(text);
                    return true;
                } catch (e) {}
            }
            const tempArea = document.createElement('textarea');
            tempArea.value = text;
            tempArea.style.position = 'fixed';
            tempArea.style.opacity = '0';
            document.body.appendChild(tempArea);
            tempArea.focus();
            tempArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {}
            document.body.removeChild(tempArea);
            return true;
        }

        window.shareToClient = async function() {
            const shareData = {
                title: '皓盛有限公司｜會轉的都會修！冷卻水塔清洗保養 × 無軸文丘里除垢系統',
                text: '皓盛有限公司（會轉的都會修！）專精空調冷卻水塔清洗保養、馬達水泵減速機檢修、免插電太陽能無軸文丘里除垢系統（開放14天免費試裝）。專線 / LINE ID：0916093125',
                url: window.location.href.startsWith('http') ? window.location.href : 'https://line.me/ti/p/~0916093125'
            };
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    return;
                } catch (err) {}
            }
            await copyTextSafe(`${shareData.title}\n${shareData.text}\n加 LINE 諮詢：https://line.me/ti/p/~0916093125`);
            alert('已複製「皓盛有限公司 LINE 與名片連結」！可直接貼上 LINE 傳送給客戶或同事。');
        };

        if (btnCopyLineMsg) btnCopyLineMsg.addEventListener('click', async () => {
            const info = buildInquiryText();
            await copyTextSafe(info.fullText);

            formSuccess.innerHTML = `✅ 已複製您的諮詢內容！請點擊 <a href="https://line.me/ti/p/~0916093125" target="_blank" rel="noopener noreferrer" class="underline font-bold text-amber-300">開啟 LINE 好友 (ID: 0916093125)</a> 並直接貼上傳送。`;
            formSuccess.classList.remove('hidden');
        });


        // =========================================================================
        // 11. 自來水塔清洗專頁模組：Before/After 拉桿 ＆ 水塔噸數/停水工時試算器
        // =========================================================================
        const wtBaRange = document.getElementById('wtBaSliderInput');
        const wtBaBeforeClip = document.getElementById('wtBaBeforeClip');
        const wtBaHandle = document.getElementById('wtBaHandle');
        if (wtBaRange && wtBaBeforeClip && wtBaHandle) {
            const updateWtBa = (val) => {
                const pct = Math.max(5, Math.min(95, Number(val)));
                wtBaBeforeClip.style.width = pct + '%';
                wtBaHandle.style.left = pct + '%';
            };
            wtBaRange.addEventListener('input', (e) => updateWtBa(e.target.value));
            wtBaRange.addEventListener('change', (e) => updateWtBa(e.target.value));
            updateWtBa(wtBaRange.value || 50);
        }

        const wtTonRange = document.getElementById('wtTonRange');
        const wtCountRange = document.getElementById('wtCountRange');
        const wtTypeBtns = document.querySelectorAll('.wt-type-btn');
        const wtTonPresetBtns = document.querySelectorAll('.wt-ton-preset');
        let currentWtType = "COMMUNITY";
        let currentWtTypeName = "社區大樓 / 商辦（地下室 RC 蓄水池 ＋ 頂樓水塔）";

        function updateWaterTankCalculator() {
            if (!wtTonRange || !wtCountRange) return;
            const tons = parseInt(wtTonRange.value, 10) || 50;
            const count = parseInt(wtCountRange.value, 10) || 2;

            let crew = "2 名持證專業技師";
            let downtime = "約 2.0 ~ 3.0 小時";
            let inspectItems = "揚水馬達電流檢測 ＋ 61F 液位電極棒除垢 ＋ 進水浮球閥測試 ＋ 加壓馬達排氣復水";
            let safetySpec = "標準高壓水刀精洗 ＋ 食品級次氯酸鈉 (50~100 ppm) 消毒 ＋ 前後對比驗收報告";

            if (currentWtType === "APARTMENT") {
                if (tons <= 15 && count <= 2) {
                    crew = "1 ~ 2 名專業技師";
                    downtime = "約 1.5 ~ 2.5 小時（快速復水）";
                } else {
                    crew = "2 名專業技師";
                    downtime = "約 2.0 ~ 3.5 小時";
                }
                inspectItems = "頂樓恆壓加壓馬達健檢 ＋ 雷達液位開關/浮球閥檢查 ＋ 管路排氣（防氣鎖不出水）";
                safetySpec = "SUS304 不鏽鋼/FRP 專用無刮傷刷洗 ＋ 食品級次氯酸鈉消毒 ＋ LINE 拍照驗收";
            } else if (currentWtType === "COMMUNITY") {
                if (tons <= 60) {
                    crew = "2 ~ 3 名持證專業技師";
                    downtime = "約 2.5 ~ 3.5 小時（支援上/下水池錯開清洗縮短停水）";
                } else {
                    crew = "3 ~ 4 名持證專業技師（雙機高揚程抽排）";
                    downtime = "約 3.0 ~ 4.5 小時（若具連通雙槽可分槽不斷水施作）";
                }
                inspectItems = "地下室揚水泵浦（抽水馬達）軸承/電流檢測 ＋ 61F-GP 電極棒除垢 ＋ 頂樓加壓泵與減壓閥點檢 ＋ 管路排氣復水";
                safetySpec = "地下池局限空間強制通風換氣 ＋ 食品級次氯酸鈉消毒 ＋ 管委會公告用前後對比照片報告";
            } else {
                // FACTORY
                crew = tons >= 150 ? "4 ~ 6 名持證技師（含缺氧作業合規配置）" : "3 ~ 4 名持證專業技師";
                downtime = "約 3.5 ~ 5.0 小時（支援假日停機或雙槽不斷水輪洗）";
                inspectItems = "工業級揚水泵浦組與控制盤電流/絕緣檢測 ＋ 61F 液位系統與電磁閥點檢 ＋ 大口徑蝶閥/定水位閥檢查";
                safetySpec = "勞動部局限空間作業規範（強制通風機＋四用氣體偵測器）＋ 合規消毒 ＋ 廠務稽核完整驗收報告（可加選水質送驗）";
            }

            const elTonVal = document.getElementById('wtTonValue');
            const elCountVal = document.getElementById('wtCountValue');
            const elDowntime = document.getElementById('wtResDowntime');
            const elCrew = document.getElementById('wtResCrew');
            const elInspect = document.getElementById('wtResInspect');
            const elSafety = document.getElementById('wtResSafety');

            if (elTonVal) elTonVal.textContent = `約 ${tons} 噸（約 ${Math.max(5, Math.round(tons * 1.2))} 戶規模）`;
            if (elCountVal) elCountVal.textContent = `共 ${count} 座水塔/水池`;
            if (elDowntime) elDowntime.textContent = downtime;
            if (elCrew) elCrew.textContent = crew;
            if (elInspect) elInspect.textContent = inspectItems;
            if (elSafety) elSafety.textContent = safetySpec;
        }

        if (wtTonRange && wtCountRange) {
            wtTonRange.addEventListener('input', updateWaterTankCalculator);
            wtCountRange.addEventListener('input', updateWaterTankCalculator);
            wtTonPresetBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    wtTonRange.value = btn.getAttribute('data-ton');
                    wtCountRange.value = btn.getAttribute('data-count') || 2;
                    updateWaterTankCalculator();
                });
            });
            wtTypeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    currentWtType = btn.getAttribute('data-wttype') || "COMMUNITY";
                    currentWtTypeName = btn.getAttribute('data-wtlabel') || "";
                    wtTypeBtns.forEach(b => {
                        b.className = "wt-type-btn px-3.5 py-2.5 rounded-xl text-xs font-bold transition bg-slate-800 text-slate-300 border border-slate-700 hover:border-sky-400 text-left";
                    });
                    btn.className = "wt-type-btn px-3.5 py-2.5 rounded-xl text-xs font-black transition bg-sky-400 text-slate-950 shadow-lg text-left";
                    updateWaterTankCalculator();
                });
            });

            const btnApplyWt = document.getElementById('btnApplyWtToForm');
            if (btnApplyWt) {
                btnApplyWt.addEventListener('click', () => {
                    const tons = wtTonRange.value;
                    const count = wtCountRange.value;
                    const downtime = document.getElementById('wtResDowntime')?.textContent || '';
                    if (messageInput) {
                        messageInput.value = `您好，我想預約「自來水塔與蓄水池清洗保養（含抽水/加壓馬達健檢）」：
• 場所類型：${currentWtTypeName}
• 總儲水規模：約 ${tons} 噸（共 ${count} 座水塔/水池）
• 預估作業模式：${downtime}
請協助評估報價與安排清洗時間！`;
                    }
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                });
            }
            updateWaterTankCalculator();
        }

        if (document.getElementById('cad3dCanvas') && document.getElementById('box3dCanvas')) {
        // =========================================================================
        // 5. 3D 互動工程藍圖系統 — 分頁切換 (Tab 1: 文丘里管 3D / Tab 2: 太陽能臭氧箱 3D)
        // =========================================================================
        const tabBtnVenturi = document.getElementById('tabBtnVenturi');
        const tabBtnSolarBox = document.getElementById('tabBtnSolarBox');
        const panelVenturi3D = document.getElementById('panelVenturi3D');
        const panelSolarBox3D = document.getElementById('panelSolarBox3D');
        let active3DTab = 'VENTURI';

        tabBtnVenturi.addEventListener('click', () => {
            active3DTab = 'VENTURI';
            panelVenturi3D.classList.remove('hidden');
            panelSolarBox3D.classList.add('hidden');
            tabBtnVenturi.className = "w-full px-4 py-3.5 rounded-xl font-black text-xs sm:text-base transition flex items-center justify-center gap-2 bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30";
            tabBtnSolarBox.className = "w-full px-4 py-3.5 rounded-xl font-black text-xs sm:text-base transition flex items-center justify-center gap-2 bg-slate-800 text-slate-300 border border-slate-700 hover:border-emerald-400 hover:text-white";
            resizeVenturiCanvas();
        });

        tabBtnSolarBox.addEventListener('click', () => {
            active3DTab = 'SOLAR';
            panelSolarBox3D.classList.remove('hidden');
            panelVenturi3D.classList.add('hidden');
            tabBtnSolarBox.className = "w-full px-4 py-3.5 rounded-xl font-black text-xs sm:text-base transition flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30";
            tabBtnVenturi.className = "w-full px-4 py-3.5 rounded-xl font-black text-xs sm:text-base transition flex items-center justify-center gap-2 bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-400 hover:text-white";
            resizeBoxCanvas();
        });

        // =========================================================================
        // 6. 引擎一：無軸文丘里管 3D 結構與良機水塔 5 大型號選型系統
        // =========================================================================
        const MODELS = {
            "HC-100S": {
                id: "HC-100S",
                title: "HC-100S (良機 LRC-N / LUC-C 125~175 RT 雙分管 50% 分流 / 4寸管×2支)",
                hydraulics: "單管 48.8~68.3 m³/h｜空管 5.8~8.1 m/s (有效截面 7.2~10.1 m/s)｜負壓 -0.10~-0.22 bar",
                pipeInch: '4"',
                t_pipeInch: '2"',
                D1: 114.3,
                Dt: 60.5,
                Dt_ID: 54.5,
                L_stub: 55,
                L_red: 100,
                L_thr_short: 40,
                L_thr_long: 60,
                L_cone_short: 100,
                L_cone_long: 320,
                t_cone: 2.0,
                t_thr: 3.0,
                injPipe: '1/2" PT (Ø21.3mm)',
                injOD: 21.3,
                injDepth: 22,
                injTip: 32,
                injHeel: 11,
                o3Spec: "太陽能臭氧組 3~5 g/h (間歇均耗 4.5W，雙路針閥節流各 2.5~4.0 L/min)",
                R1: 349.2,
                R2: 670.3,
                s: 321.1,
                theta: 30.16,
                arc1: 183.8,
                arc2: 352.8,
                coneDegLong: 9.61,
                coneDegShort: 30.1
            },
            "HC-125L": {
                id: "HC-125L",
                title: "HC-125L (良機 LRC-N / LUC-C 300~350 RT 四分管 25% 分流專用增速型 / 5寸管×4支)",
                hydraulics: "單管 58.5~68.3 m³/h｜空管 7.0~8.1 m/s (有效截面 8.7~10.1 m/s)｜負壓 -0.14~-0.22 bar",
                pipeInch: '5"',
                t_pipeInch: '2"',
                D1: 139.8,
                Dt: 60.5,
                Dt_ID: 54.5,
                L_stub: 55,
                L_red: 125,
                L_thr_short: 40,
                L_thr_long: 60,
                L_cone_short: 125,
                L_cone_long: 380,
                t_cone: 2.0,
                t_thr: 3.0,
                injPipe: '1/2" PT (Ø21.3mm)',
                injOD: 21.3,
                injDepth: 22,
                injTip: 32,
                injHeel: 11,
                o3Spec: "6~10 g/h 四路太陽能箱 (四路針閥節流各 2.5~3.5 L/min 獨立平衡)",
                R1: 281.8,
                R2: 663.9,
                s: 382.1,
                theta: 37.36,
                arc1: 183.8,
                arc2: 432.9,
                coneDegLong: 11.91,
                coneDegShort: 35.2
            },
            "HC-125S": {
                id: "HC-125S",
                title: "HC-125S (良機 LRC-N 200~250 RT 雙分管×2支 ／ LRC-N 400~500 RT 四分管×4支)",
                hydraulics: "單管 78.0~97.5 m³/h｜空管 5.6~7.0 m/s (有效截面 6.9~8.6 m/s)｜負壓 -0.08~-0.16 bar",
                pipeInch: '5"',
                t_pipeInch: '2.5"',
                D1: 139.8,
                Dt: 76.3,
                Dt_ID: 70.3,
                L_stub: 55,
                L_red: 125,
                L_thr_short: 45,
                L_thr_long: 70,
                L_cone_short: 125,
                L_cone_long: 380,
                t_cone: 2.0,
                t_thr: 3.0,
                injPipe: '1/2" PT (Ø21.3mm)',
                injOD: 21.3,
                injDepth: 28,
                injTip: 38,
                injHeel: 17,
                o3Spec: "雙管配 3~5 g/h；四管配 6~10 g/h (針閥節流各 3.0~4.0 L/min)",
                R1: 446.2,
                R2: 827.5,
                s: 381.3,
                theta: 29.97,
                arc1: 233.4,
                arc2: 432.9,
                coneDegLong: 9.55,
                coneDegShort: 28.5
            },
            "HC-150S": {
                id: "HC-150S",
                title: "HC-150S (良機 LRC-N 600~800 RT 四分管×4支 ／ 跨廠牌 300~400 RT 6寸雙分管×2支)",
                hydraulics: "單管 117.0~156.0 m³/h｜空管 6.1~8.2 m/s (有效截面 7.6~10.2 m/s)｜負壓 -0.11~-0.22 bar",
                pipeInch: '6"',
                t_pipeInch: '3"',
                D1: 165.2,
                Dt: 89.1,
                Dt_ID: 82.1,
                L_stub: 60,
                L_red: 140,
                L_thr_short: 50,
                L_thr_long: 80,
                L_cone_short: 140,
                L_cone_long: 450,
                t_cone: 2.5,
                t_thr: 3.5,
                injPipe: '3/4" PT (Ø27.2mm)',
                injOD: 27.2,
                injDepth: 34,
                injTip: 47,
                injHeel: 20,
                o3Spec: "6~10 g/h 太陽能臭氧組 (針閥節流各 3.5~4.5 L/min)＋矽膠乾燥筒",
                R1: 513.9,
                R2: 965.5,
                s: 451.6,
                theta: 30.33,
                arc1: 272.1,
                arc2: 511.1,
                coneDegLong: 9.67,
                coneDegShort: 30.4
            },
            "HC-150H": {
                id: "HC-150H",
                title: "HC-150H (良機 LDC-N 200~250 RT 逆流塔單一 6寸母管 ／ 跨廠牌 500 RT 6寸雙分管)",
                hydraulics: "單管 156.0~195.0 m³/h｜空管 6.2~7.7 m/s (有效截面 7.5~9.4 m/s)｜負壓 -0.11~-0.20 bar",
                pipeInch: '6"',
                t_pipeInch: '3.5"',
                D1: 165.2,
                Dt: 101.6,
                Dt_ID: 94.6,
                L_stub: 60,
                L_red: 140,
                L_thr_short: 55,
                L_thr_long: 80,
                L_cone_short: 140,
                L_cone_long: 360,
                t_cone: 2.5,
                t_thr: 3.5,
                injPipe: '3/4" PT (Ø27.2mm)',
                injOD: 27.2,
                injDepth: 38,
                injTip: 51,
                injHeel: 24,
                o3Spec: "6~10 g/h 太陽能臭氧組 (若為有背壓噴嘴塔則改配市電微正壓注氣箱)",
                R1: 563.1,
                R2: 924.5,
                s: 361.4,
                theta: 31.68,
                arc1: 311.3,
                arc2: 511.1,
                coneDegLong: 10.10,
                coneDegShort: 25.6
            }
        };

        let currentModel = MODELS["HC-100S"];
        let currentScheme = "ELBOW"; // Default to B2 (Tower Top Recommended)
        let isCutaway = true;
        let showDim3D = true;
        let isExploded = false;
        let vRotY = -0.38, vRotX = 0.22, vZoom = 1.08, vPanX = 0, vPanY = 0;
        let vDragging = false, vDragBtn = 0, vLastX = 0, vLastY = 0;
        let animTick = 0;

        function getActiveDims(m) {
            const isLong = (currentScheme === "LONG");
            const L_thr = isLong ? m.L_thr_long : m.L_thr_short;
            const L_cone = isLong ? m.L_cone_long : m.L_cone_short;
            const total_L = m.L_red + L_thr + L_cone;
            const total_with_stubs = (currentScheme === "ELBOW") ? (total_L + m.L_stub) : (total_L + m.L_stub * 2);
            const coneDeg = isLong ? m.coneDegLong : m.coneDegShort;
            return { isLong, L_thr, L_cone, total_L, total_with_stubs, coneDeg };
        }

        function updateVenturiUI() {
            const m = currentModel;
            const d = getActiveDims(m);

            let schemeName = "";
            if (currentScheme === "SHORT") {
                schemeName = `【方案A】極短雙現成大小頭萬用版 (縮擴本體 ${d.total_L}mm ＋ 兩端 ${m.L_stub}mm 快拆袖管)`;
                document.getElementById('td_cone').textContent = `${m.t_pipeInch} × ${m.pipeInch} 現成標準同心大小頭 (Ø${m.Dt} → Ø${m.D1} mm)，長 ${d.L_cone} mm ＋ 尾端 ${m.L_stub}mm 袖管`;
                document.getElementById('td_bracket').textContent = `搭配無擋環滑套快拆接頭；${m.o3Spec}`;
            } else if (currentScheme === "ELBOW") {
                schemeName = `★【方案B2】極短主體＋尾端焊死全新 SUS304 90° 下水彎頭與消能盤 (塔頂首推)`;
                document.getElementById('td_cone').textContent = `${m.t_pipeInch} × ${m.pipeInch} 現成大小頭 (長 ${d.L_cone} mm) ＋ 直接對焊 90° 不鏽鋼下水彎頭`;
                document.getElementById('td_bracket').textContent = `一刀切掉舊生鏽彎頭！前端焊 ${m.L_stub}mm 袖管僅鎖 1 顆快拆；${m.o3Spec}`;
            } else {
                schemeName = `【長錐版】後段 9.5°~11.9° 雷射鈑金捲圓緩擴版 (最低壓損構型，兩端含 ${m.L_stub}mm 快拆袖管)`;
                document.getElementById('td_cone').textContent = `雷射鈑金捲圓長錐管 Ø${m.Dt} → Ø${m.D1} mm，長 ${d.L_cone} mm (板厚 ${m.t_cone}mm / 錐角 ${d.coneDeg}°)`;
                document.getElementById('td_bracket').textContent = `尾端底部點焊 SUS304 倒T型支撐座 + M10 高低調整螺絲；${m.o3Spec}`;
            }

            document.getElementById('modelTitleBadge').textContent = `目前顯示：${m.id} ｜ 縮擴本體 ${d.total_L}mm (含快拆袖管 ${d.total_with_stubs}mm)`;
            document.getElementById('td_scheme').textContent = schemeName;
            document.getElementById('td_name').textContent = m.title;
            document.getElementById('td_hydraulics').textContent = m.hydraulics;
            document.getElementById('td_total').textContent = `Ø${m.D1} mm (${m.pipeInch}) ／ 縮擴本體 ${d.total_L} mm (含快拆直管袖管總長 ${d.total_with_stubs} mm)`;
            document.getElementById('td_coupling').textContent = `SUS304 無擋環滑套型雙螺栓快拆 (夾持 ${m.L_stub}mm 直管袖管段，容許管端間隙 5~15mm)`;
            document.getElementById('td_reducer').textContent = `${m.pipeInch} × ${m.t_pipeInch} 標準同心大小頭 (Ø${m.D1} → Ø${m.Dt} mm)，長 ${m.L_red} mm`;
            document.getElementById('td_throat').textContent = `${m.t_pipeInch} 不鏽鋼無縫管 (外徑 Ø${m.Dt} × 厚 ${m.t_thr} mm，內徑 ${m.Dt_ID} mm)，長 ${d.L_thr} mm`;
            document.getElementById('td_injector').textContent = `${m.injPipe} 自管內壁起算：前緣長尖端深 ${m.injTip} mm / 後緣短邊深 ${m.injHeel} mm (中心深 ${m.injDepth} mm)`;
            document.getElementById('unfoldBadge').textContent = d.isLong ? `板厚 ${m.t_cone} mm 中立軸展開｜全錐角 ${m.coneDegLong}° (半錐角 ${(m.coneDegLong/2).toFixed(2)}°)` : `現成標準管件對焊（免雷射捲圓）`;

            render2DBlueprint(m, d);
            renderUnfoldSVG(m, d);
        }

        document.querySelectorAll('.v-scheme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentScheme = btn.getAttribute('data-scheme');
                document.querySelectorAll('.v-scheme-btn').forEach(b => {
                    b.className = "v-scheme-btn px-3.5 py-2 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-400";
                });
                btn.className = "v-scheme-btn px-3.5 py-2 rounded-lg text-xs font-bold transition bg-emerald-500 text-slate-950 shadow";
                updateVenturiUI();
            });
        });

        document.querySelectorAll('.v-model-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.getAttribute('data-model');
                currentModel = MODELS[key];
                document.querySelectorAll('.v-model-btn').forEach(b => {
                    b.className = "v-model-btn px-3.5 py-2 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-400";
                });
                btn.className = "v-model-btn px-3.5 py-2 rounded-lg text-xs font-bold transition bg-cyan-400 text-slate-950 shadow";
                updateVenturiUI();
            });
        });

        document.getElementById('btnCutaway').addEventListener('click', function() {
            isCutaway = !isCutaway;
            this.className = isCutaway
                ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-slate-950"
                : "px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-600";
        });

        document.getElementById('btnDim3D').addEventListener('click', function() {
            showDim3D = !showDim3D;
            this.className = showDim3D
                ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-slate-950"
                : "px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-600";
        });

        document.getElementById('btnExplode').addEventListener('click', function() {
            isExploded = !isExploded;
            this.className = isExploded
                ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-slate-950"
                : "px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-600";
        });

        document.querySelectorAll('.v-cam-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-cam');
                if (mode === 'iso') { vRotY = -0.38; vRotX = 0.22; vZoom = 1.1; vPanX = 0; vPanY = 0; }
                else if (mode === 'front') { vRotY = 0.0; vRotX = 0.0; vZoom = 1.2; vPanX = 0; vPanY = 0; }
                else if (mode === 'nozzle') { vRotY = -0.15; vRotX = 0.12; vZoom = 1.85; vPanX = 30; vPanY = -15; }
                else if (mode === 'top') { vRotY = 0.0; vRotX = 1.52; vZoom = 1.1; vPanX = 0; vPanY = 0; }
            });
        });

        document.getElementById('btnQuoteCurrentModel').addEventListener('click', () => {
            const m = currentModel;
            if (messageInput) {
                messageInput.value = `您好，我們現場水塔欲評估安裝「${m.title}（構型：${currentScheme === 'ELBOW' ? '方案B2 自帶90度彎頭消能盤版' : currentScheme === 'SHORT' ? '方案A 極短雙大小頭版' : '長錐緩擴版'}）」及冷卻水塔清洗保養，請協助安排現場勘查或 14 天免費試裝。`;
            }
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        });

        function render2DBlueprint(m, d) {
            const coneEndX = d.isLong ? 650 : 455;
            const thrEndX = d.isLong ? 355 : 335;
            const tailSVG = (currentScheme === "ELBOW") ? `
                <path d="M ${coneEndX} 115 A 150 150 0 0 1 ${coneEndX+150} 265 L ${coneEndX+150} 280 L ${coneEndX+15} 280 L ${coneEndX+15} 270 A 15 15 0 0 0 ${coneEndX} 255 Z"
                      fill="rgba(168,85,247,0.22)" stroke="#a855f7" stroke-width="2.5"/>
                <line x1="${coneEndX+45}" y1="280" x2="${coneEndX+45}" y2="292" stroke="#e2e8f0" stroke-width="2.5"/>
                <line x1="${coneEndX+82}" y1="280" x2="${coneEndX+82}" y2="292" stroke="#e2e8f0" stroke-width="2.5"/>
                <line x1="${coneEndX+120}" y1="280" x2="${coneEndX+120}" y2="292" stroke="#e2e8f0" stroke-width="2.5"/>
                <ellipse cx="${coneEndX+82}" cy="295" rx="68" ry="7" fill="rgba(168,85,247,0.5)" stroke="#d8b4fe" stroke-width="2"/>
                <text x="${coneEndX+82}" y="316" fill="#d8b4fe" font-size="11" text-anchor="middle" font-weight="bold">⑤對焊 90° 無縫彎頭+三腳傘狀消能盤</text>
            ` : `
                <rect x="${coneEndX}" y="115" width="38" height="140" fill="rgba(56,189,248,0.18)" stroke="#38bdf8" stroke-width="2"/>
                <rect x="${coneEndX+10}" y="106" width="52" height="158" fill="rgba(245,158,11,0.16)" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="4,3" rx="4"/>
                <text x="${coneEndX+36}" y="98" fill="#f59e0b" font-size="10.5" text-anchor="middle">尾端袖管(${m.L_stub}mm)+滑套快拆</text>
                ${d.isLong ? `<rect x="${coneEndX-25}" y="255" width="14" height="38" fill="#a855f7"/><rect x="${coneEndX-40}" y="293" width="44" height="7" fill="#a855f7"/>` : ''}
            `;

            const svg = `
            <svg viewBox="0 0 820 365" class="w-full h-auto max-h-80" role="img" aria-label="無軸文丘里管2D軸向剖面施工藍圖（含55mm快拆袖管與45度尾流引射嘴插深）" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <marker id="arrowCyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8"/>
                    </marker>
                    <marker id="arrowAmber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b"/>
                    </marker>
                </defs>
                <rect width="820" height="365" fill="#070b14"/>
                <line x1="35" y1="185" x2="785" y2="185" stroke="#334155" stroke-width="1.5" stroke-dasharray="10,5"/>
                <text x="40" y="178" fill="#64748b" font-size="10.5">管中心軸線 (Centerline)</text>
                <line x1="38" y1="185" x2="88" y2="185" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrowCyan)"/>
                <text x="42" y="206" fill="#38bdf8" font-size="11.5" font-weight="bold">進水</text>
                <rect x="112" y="115" width="38" height="140" fill="rgba(56,189,248,0.22)" stroke="#38bdf8" stroke-width="2"/>
                <rect x="92" y="106" width="54" height="158" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" stroke-width="2" rx="4"/>
                <text x="122" y="96" fill="#f59e0b" font-size="10.5" text-anchor="middle" font-weight="bold">①滑套快拆+袖管(${m.L_stub}mm)</text>
                <polygon points="150,115 270,148 270,222 150,255" fill="rgba(56,189,248,0.14)" stroke="#38bdf8" stroke-width="2.5"/>
                <line x1="270" y1="143" x2="270" y2="227" stroke="#f43f5e" stroke-width="2.5" stroke-dasharray="3,2"/>
                <rect x="270" y="148" width="${thrEndX-270}" height="74" fill="rgba(244,63,94,0.14)" stroke="#f43f5e" stroke-width="2.5"/>
                <line x1="${thrEndX}" y1="143" x2="${thrEndX}" y2="227" stroke="#f43f5e" stroke-width="2.5" stroke-dasharray="3,2"/>
                <polygon points="296,72 314,72 314,164 296,184" fill="rgba(245,158,11,0.4)" stroke="#f59e0b" stroke-width="2.2"/>
                <text x="305" y="62" fill="#f59e0b" font-size="11.5" text-anchor="middle" font-weight="bold">${m.injPipe} 吸氣嘴</text>
                <circle cx="325" cy="176" r="3" fill="#67e8f9"/>
                <circle cx="338" cy="184" r="3.5" fill="#67e8f9"/>
                <circle cx="355" cy="172" r="4" fill="#67e8f9"/>
                <circle cx="372" cy="190" r="3.5" fill="#67e8f9"/>
                <polygon points="${thrEndX},148 ${coneEndX},115 ${coneEndX},255 ${thrEndX},222" fill="rgba(16,185,129,0.14)" stroke="#10b981" stroke-width="2.5"/>
                <text x="${(thrEndX+coneEndX)/2}" y="182" fill="#10b981" font-size="12" text-anchor="middle" font-weight="bold">④ 復壓段 (${d.L_cone}mm)</text>
                ${tailSVG}
                <line x1="150" y1="265" x2="150" y2="305" stroke="#64748b" stroke-width="1"/>
                <line x1="270" y1="230" x2="270" y2="305" stroke="#64748b" stroke-width="1"/>
                <line x1="155" y1="295" x2="265" y2="295" stroke="#38bdf8" stroke-width="1.8" marker-start="url(#arrowCyan)" marker-end="url(#arrowCyan)"/>
                <text x="210" y="288" fill="#38bdf8" font-size="11.5" text-anchor="middle" font-weight="bold">縮口 ${m.L_red}mm</text>
                <line x1="${thrEndX}" y1="230" x2="${thrEndX}" y2="305" stroke="#64748b" stroke-width="1"/>
                <line x1="275" y1="295" x2="${thrEndX-5}" y2="295" stroke="#f43f5e" stroke-width="1.8" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)"/>
                <text x="${(270+thrEndX)/2}" y="288" fill="#f43f5e" font-size="11.5" text-anchor="middle" font-weight="bold">喉部 ${d.L_thr}mm</text>
                <line x1="${coneEndX}" y1="260" x2="${coneEndX}" y2="305" stroke="#64748b" stroke-width="1"/>
                <line x1="${thrEndX+5}" y1="295" x2="${coneEndX-5}" y2="295" stroke="#10b981" stroke-width="1.8" marker-start="url(#arrowCyan)" marker-end="url(#arrowCyan)"/>
                <text x="${(thrEndX+coneEndX)/2}" y="288" fill="#10b981" font-size="11.5" text-anchor="middle" font-weight="bold">擴張段 ${d.L_cone}mm</text>
                <line x1="155" y1="336" x2="${coneEndX-5}" y2="336" stroke="#f59e0b" stroke-width="2" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)"/>
                <text x="${(150+coneEndX)/2}" y="354" fill="#f59e0b" font-size="12.5" text-anchor="middle" font-weight="bold">縮擴本體長：${d.total_L} mm（含快拆直管袖管總長：${d.total_with_stubs} mm）</text>
                <text x="86" y="145" fill="#fff" font-size="11.5" text-anchor="end" font-weight="bold">母管外徑</text>
                <text x="86" y="162" fill="#38bdf8" font-size="12.5" text-anchor="end" font-weight="bold">Ø${m.D1}mm</text>
                <text x="${(270+thrEndX)/2}" y="140" fill="#fb7185" font-size="11.5" text-anchor="middle" font-weight="bold">喉部 Ø${m.Dt}mm</text>
                <rect x="420" y="10" width="388" height="88" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.8"/>
                <line x1="314" y1="168" x2="420" y2="55" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,4"/>
                <text x="432" y="31" fill="#f59e0b" font-size="12" font-weight="bold">🔍 吸氣嘴前/後緣插深與袖管防呆：</text>
                <text x="432" y="52" fill="#f8fafc" font-size="11.5">• 自喉管內壁起算：<tspan fill="#38bdf8" font-weight="bold">前緣尖端深 ${m.injTip}mm ／ 後緣短邊深 ${m.injHeel}mm</tspan></text>
                <text x="432" y="72" fill="#f8fafc" font-size="11.5">• 45°斜口朝右下游；前端必焊 <tspan fill="#34d399" font-weight="bold">${m.L_stub}mm 直管袖管</tspan> 供快拆夾持！</text>
                <text x="432" y="90" fill="#94a3b8" font-size="10.5">• 快拆選用無擋環滑套型 (Slip-type)，管端間隙 5~15mm</text>
            </svg>`;
            document.getElementById('svgBlueprintWrap').innerHTML = svg;
        }

        function renderUnfoldSVG(m, d) {
            const halfDeg = (m.coneDegLong / 2).toFixed(2);
            if (!d.isLong) {
                const isElbow = (currentScheme === "ELBOW");
                const svg = `
                <svg viewBox="0 0 680 365" class="w-full h-auto max-h-80" role="img" aria-label="無軸文丘里管標準管件組立圖與長錐版1比1雷射鈑金扇形展開圖" xmlns="http://www.w3.org/2000/svg">
                    <rect width="680" height="365" fill="#070b14"/>
                    <text x="24" y="30" fill="#34d399" font-size="13" font-weight="bold">🔧 當前選用【${isElbow ? '方案B2 自帶90°彎頭版' : '方案A 極短雙大小頭版'}】標準管件對焊組立圖（免雷射切板捲圓）</text>
                    <line x1="30" y1="130" x2="650" y2="130" stroke="#334155" stroke-width="1.5" stroke-dasharray="8,4"/>
                    <!-- 前端直管袖管 -->
                    <rect x="55" y="85" width="60" height="90" fill="rgba(245,158,11,0.22)" stroke="#f59e0b" stroke-width="2"/>
                    <text x="85" y="75" fill="#f59e0b" font-size="11" text-anchor="middle" font-weight="bold">①前端袖管 ${m.L_stub}mm</text>
                    <!-- 前段現成同心大小頭 -->
                    <polygon points="115,85 235,106 235,154 115,175" fill="rgba(56,189,248,0.18)" stroke="#38bdf8" stroke-width="2.2"/>
                    <text x="175" y="196" fill="#38bdf8" font-size="11" text-anchor="middle" font-weight="bold">②現成大小頭 (${m.L_red}mm)</text>
                    <!-- 中段喉管與 45度尾流引射嘴 -->
                    <rect x="235" y="106" width="70" height="48" fill="rgba(244,63,94,0.18)" stroke="#f43f5e" stroke-width="2.2"/>
                    <polygon points="262,48 278,48 278,118 262,132" fill="rgba(245,158,11,0.45)" stroke="#f59e0b" stroke-width="2"/>
                    <text x="270" y="40" fill="#fbbf24" font-size="10.5" text-anchor="middle" font-weight="bold">45°尾流引射嘴</text>
                    <text x="270" y="172" fill="#fb7185" font-size="11" text-anchor="middle" font-weight="bold">③喉管 (${d.L_thr}mm)</text>
                    <!-- 後段現成同心大小頭 -->
                    <polygon points="305,106 425,85 425,175 305,154" fill="rgba(16,185,129,0.18)" stroke="#10b981" stroke-width="2.2"/>
                    <text x="365" y="196" fill="#34d399" font-size="11" text-anchor="middle" font-weight="bold">④現成大小頭 (${d.L_cone}mm)</text>
                    ${isElbow ? `
                    <path d="M 425 85 A 105 105 0 0 1 530 190 L 530 208 L 440 208 L 440 190 A 15 15 0 0 0 425 175 Z" fill="rgba(168,85,247,0.22)" stroke="#a855f7" stroke-width="2.2"/>
                    <line x1="458" y1="208" x2="458" y2="220" stroke="#e2e8f0" stroke-width="2"/>
                    <line x1="485" y1="208" x2="485" y2="220" stroke="#e2e8f0" stroke-width="2"/>
                    <line x1="512" y1="208" x2="512" y2="220" stroke="#e2e8f0" stroke-width="2"/>
                    <ellipse cx="485" cy="223" rx="52" ry="7" fill="rgba(168,85,247,0.5)" stroke="#d8b4fe" stroke-width="2"/>
                    <text x="575" y="155" fill="#d8b4fe" font-size="11.5" font-weight="bold">⑤直接對焊 90° 彎頭</text>
                    <text x="575" y="173" fill="#cbd5e1" font-size="10.5">+ 底部傘狀消能盤</text>
                    ` : `
                    <rect x="425" y="85" width="60" height="90" fill="rgba(245,158,11,0.22)" stroke="#f59e0b" stroke-width="2"/>
                    <text x="455" y="75" fill="#f59e0b" font-size="11" text-anchor="middle" font-weight="bold">⑤尾端袖管 ${m.L_stub}mm</text>
                    `}
                    <!-- 下方採購下料與長錐版展開參數對照框 -->
                    <rect x="20" y="236" width="640" height="114" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
                    <text x="34" y="258" fill="#34d399" font-size="12" font-weight="bold">✅ 標準管件直接採購 TIG 外部環縫對焊清單（${m.id}）：</text>
                    <text x="34" y="279" fill="#f8fafc" font-size="11.5">• 前後縮擴段：直接採購市售 <tspan fill="#38bdf8" font-weight="bold">${m.pipeInch} × ${m.t_pipeInch} SUS304 標準同心大小頭</tspan> × 2 顆（單顆長 ${m.L_red}mm）</text>
                    <text x="34" y="299" fill="#f8fafc" font-size="11.5">• 中段與袖管：${m.t_pipeInch} 厚管長 ${d.L_thr}mm ＋ 前端（及方案A尾端）對焊 <tspan fill="#fbbf24" font-weight="bold">${m.pipeInch} 直管袖管 ${m.L_stub}mm</tspan></text>
                    <text x="34" y="321" fill="#94a3b8" font-size="11">📐 若改選【長錐緩擴版 (軸向長 ${m.L_cone_long}mm / 全錐角 ${m.coneDegLong}° / 半錐角 ${halfDeg}°)】之 1:1 雷射展開參考參數：</text>
                    <text x="34" y="339" fill="#cbd5e1" font-size="11">• 板厚 ${m.t_cone}mm 中立軸展開：內弧 R1 = ${m.R1}mm｜外弧 R2 = ${m.R2}mm｜斜邊 s = ${m.s}mm｜扇形角 θ = ${m.theta}° (點擊上方【長錐版】按鈕可切換展開圖)</text>
                </svg>`;
                document.getElementById('svgUnfoldWrap').innerHTML = svg;
                return;
            }
            const svg = `
            <svg viewBox="0 0 680 365" class="w-full h-auto max-h-80" role="img" aria-label="無軸文丘里管標準管件組立圖與長錐版1比1雷射鈑金扇形展開圖" xmlns="http://www.w3.org/2000/svg">
                <rect width="680" height="365" fill="#070b14"/>
                <circle cx="75" cy="175" r="4.5" fill="#f59e0b"/>
                <text x="75" y="200" fill="#f59e0b" font-size="12" text-anchor="middle" font-weight="bold">展開圓心 O</text>
                <line x1="75" y1="175" x2="545" y2="50" stroke="#475569" stroke-width="1.5" stroke-dasharray="6,4"/>
                <line x1="75" y1="175" x2="545" y2="300" stroke="#475569" stroke-width="1.5" stroke-dasharray="6,4"/>
                <path d="M 275 122 A 202 202 0 0 1 275 228 L 520 295 A 456 456 0 0 0 520 55 Z"
                      fill="rgba(16,185,129,0.2)" stroke="#10b981" stroke-width="3"/>
                <path d="M 162 152 A 88 88 0 0 1 162 198" fill="none" stroke="#f59e0b" stroke-width="2"/>
                <text x="205" y="179" fill="#f59e0b" font-size="13" font-weight="bold">扇形夾角 θ = ${m.theta}°</text>
                <text x="178" y="122" fill="#38bdf8" font-size="12.5" font-weight="bold" transform="rotate(-15 178,122)">內弧半徑 R1 = ${m.R1} mm</text>
                <text x="395" y="66" fill="#10b981" font-size="12.5" font-weight="bold" transform="rotate(-15 395,66)">展開母線斜邊長 L = ${m.s} mm</text>
                <text x="360" y="280" fill="#f8fafc" font-size="12.5" font-weight="bold" transform="rotate(15 360,280)">外弧總半徑 R2 = ${m.R2} mm</text>
                <text x="302" y="179" fill="#67e8f9" font-size="12" font-weight="bold">內弧長 ${m.arc1} mm</text>
                <text x="532" y="179" fill="#6ee7b7" font-size="13" font-weight="bold">外弧長 ${m.arc2} mm</text>
                <rect x="18" y="242" width="430" height="112" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
                <text x="30" y="263" fill="#f59e0b" font-size="12" font-weight="bold">📋【長錐緩擴版】1:1 雷射鈑金扇形切板參數 (${m.id})：</text>
                <text x="30" y="283" fill="#f8fafc" font-size="11.5">• 復壓錐管軸向長 ${d.L_cone}mm｜全擴張角 2α = ${m.coneDegLong}° (單邊半錐角 α = ${halfDeg}°)</text>
                <text x="30" y="303" fill="#cbd5e1" font-size="11">• 板厚 ${m.t_cone}mm 中立軸展開：R1=${m.R1}mm / R2=${m.R2}mm / 展開角 θ=${m.theta}°</text>
                <text x="30" y="323" fill="#34d399" font-size="11">• 捲圓焊接後，大頭端對焊 ${m.L_stub}mm 直管袖管供雙螺栓滑套快拆水平夾持</text>
                <text x="30" y="342" fill="#94a3b8" font-size="10.5">* 註：上方扇形為幾何比例示意，雷射切板請直接輸入 R1、R2 與 θ 數值</text>
            </svg>`;
            document.getElementById('svgUnfoldWrap').innerHTML = svg;
        }

        const vCanvas = document.getElementById('cad3dCanvas');
        const vCtx = vCanvas.getContext('2d');
        const vContainer = document.getElementById('venturiCanvasContainer');

        function resizeVenturiCanvas() {
            const rect = vContainer.getBoundingClientRect();
            if (rect.width === 0) return;
            const dpr = window.devicePixelRatio || 1;
            vCanvas.width = rect.width * dpr;
            vCanvas.height = rect.height * dpr;
            vCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        vContainer.addEventListener('contextmenu', e => e.preventDefault());
        vContainer.addEventListener('mousedown', e => {
            vDragging = true; vDragBtn = e.button; vLastX = e.clientX; vLastY = e.clientY;
        });
        vContainer.addEventListener('wheel', e => {
            e.preventDefault();
            vZoom = Math.max(0.5, Math.min(2.5, vZoom - e.deltaY * 0.0012));
        }, { passive: false });
        let vPinchDist = 0;
        let mobile3DUnlocked = false;
        vContainer.addEventListener('touchstart', e => {
            if (e.touches.length === 1 && (mobile3DUnlocked || window.innerWidth >= 640)) {
                vDragging = true; vDragBtn = 0; vLastX = e.touches[0].clientX; vLastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                vDragging = false;
                vPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            }
        }, { passive: true });

        function projectVenturi3D(x, y, z, cx, cy, scale) {
            const cosY = Math.cos(vRotY), sinY = Math.sin(vRotY);
            const x1 = x * cosY - z * sinY;
            const z1 = x * sinY + z * cosY;
            const cosX = Math.cos(vRotX), sinX = Math.sin(vRotX);
            const y2 = y * cosX - z1 * sinX;
            const z2 = y * sinX + z1 * cosX;
            const p = 950 / (720 + z2);
            return { sx: cx + vPanX + x1 * scale * p, sy: cy + vPanY - y2 * scale * p, z: z2 };
        }

        function drawVLine(p1, p2, cx, cy, scale, color, width, dash) {
            const a = projectVenturi3D(p1.x, p1.y, p1.z, cx, cy, scale);
            const b = projectVenturi3D(p2.x, p2.y, p2.z, cx, cy, scale);
            vCtx.save();
            vCtx.beginPath();
            if (dash) vCtx.setLineDash(dash);
            vCtx.moveTo(a.sx, a.sy);
            vCtx.lineTo(b.sx, b.sy);
            vCtx.strokeStyle = color;
            vCtx.lineWidth = width || 1.5;
            vCtx.stroke();
            vCtx.restore();
            return { a, b };
        }

        function drawVDim(pStart, pEnd, offsetVec, labelText, color, cx, cy, scale) {
            const p1Ext = { x: pStart.x + offsetVec.x, y: pStart.y + offsetVec.y, z: pStart.z + offsetVec.z };
            const p2Ext = { x: pEnd.x + offsetVec.x, y: pEnd.y + offsetVec.y, z: pEnd.z + offsetVec.z };
            drawVLine(pStart, p1Ext, cx, cy, scale, "rgba(148,163,184,0.55)", 1, [3, 3]);
            drawVLine(pEnd, p2Ext, cx, cy, scale, "rgba(148,163,184,0.55)", 1, [3, 3]);
            const seg = drawVLine(p1Ext, p2Ext, cx, cy, scale, color, 2, null);
            vCtx.fillStyle = color;
            vCtx.beginPath();
            vCtx.arc(seg.a.sx, seg.a.sy, 3, 0, Math.PI * 2);
            vCtx.arc(seg.b.sx, seg.b.sy, 3, 0, Math.PI * 2);
            vCtx.fill();
            const mx = (seg.a.sx + seg.b.sx) / 2;
            const my = (seg.a.sy + seg.b.sy) / 2;
            vCtx.font = "bold 11.5px 'Noto Sans TC', sans-serif";
            const tw = vCtx.measureText(labelText).width;
            vCtx.fillStyle = "rgba(15, 23, 42, 0.9)";
            vCtx.strokeStyle = color;
            vCtx.lineWidth = 1.2;
            vCtx.beginPath();
            drawSafeRoundRect(vCtx, mx - tw / 2 - 6, my - 10, tw + 12, 20, 4);
            vCtx.fill();
            vCtx.stroke();
            vCtx.fillStyle = color;
            vCtx.textAlign = "center";
            vCtx.textBaseline = "middle";
            vCtx.fillText(labelText, mx, my);
        }

        function generateElbow90Polys(xStart, rPipe, colorRGB, alpha, cutaway) {
            const polys = [];
            const R_bend = rPipe * 1.32; // 標準 90° 彎頭曲率半徑 (R > rPipe 確保內弧平滑不自交)
            const segArc = 14;
            const segTheta = 24;
            const yCenter = -R_bend;

            // (1) 90° 圓環掃掠彎管段 (phi: 0 -> pi/2)
            for (let i = 0; i < segArc; i++) {
                const phi0 = (i / segArc) * (Math.PI / 2);
                const phi1 = ((i + 1) / segArc) * (Math.PI / 2);
                const cx0 = xStart + R_bend * Math.sin(phi0), cy0 = yCenter + R_bend * Math.cos(phi0);
                const cx1 = xStart + R_bend * Math.sin(phi1), cy1 = yCenter + R_bend * Math.cos(phi1);
                const nx0_x = Math.sin(phi0), nx0_y = Math.cos(phi0);
                const nx1_x = Math.sin(phi1), nx1_y = Math.cos(phi1);

                for (let j = 0; j < segTheta; j++) {
                    const a0 = (j / segTheta) * Math.PI * 2;
                    const a1 = ((j + 1) / segTheta) * Math.PI * 2;
                    const midA = (a0 + a1) / 2;
                    if (cutaway && Math.sin(midA) < -0.05) continue;

                    const cosA0 = Math.cos(a0), sinA0 = Math.sin(a0);
                    const cosA1 = Math.cos(a1), sinA1 = Math.sin(a1);

                    const p00 = { x: cx0 + rPipe * cosA0 * nx0_x, y: cy0 + rPipe * cosA0 * nx0_y, z: rPipe * sinA0 };
                    const p10 = { x: cx1 + rPipe * cosA0 * nx1_x, y: cy1 + rPipe * cosA0 * nx1_y, z: rPipe * sinA0 };
                    const p11 = { x: cx1 + rPipe * cosA1 * nx1_x, y: cy1 + rPipe * cosA1 * nx1_y, z: rPipe * sinA1 };
                    const p01 = { x: cx0 + rPipe * cosA1 * nx0_x, y: cy0 + rPipe * cosA1 * nx0_y, z: rPipe * sinA1 };

                    const midPhi = (phi0 + phi1) / 2;
                    const ny = Math.cos(midA) * Math.cos(midPhi);
                    const nz = Math.sin(midA);
                    polys.push({
                        pts: [p00, p10, p11, p01],
                        color: colorRGB,
                        alpha: alpha,
                        nx: Math.cos(midA) * Math.sin(midPhi),
                        ny: ny,
                        nz: nz
                    });
                }
            }

            // (2) 彎頭下方垂直出水直管段 (y: -R_bend -> -R_bend - L_skirt)
            const xOut = xStart + R_bend;
            const ySkirtTop = -R_bend;
            const L_skirt = rPipe * 0.42;
            const ySkirtBot = ySkirtTop - L_skirt;
            const segSkirt = 3;
            for (let i = 0; i < segSkirt; i++) {
                const y0 = ySkirtTop - (i / segSkirt) * L_skirt;
                const y1 = ySkirtTop - ((i + 1) / segSkirt) * L_skirt;
                for (let j = 0; j < segTheta; j++) {
                    const a0 = (j / segTheta) * Math.PI * 2;
                    const a1 = ((j + 1) / segTheta) * Math.PI * 2;
                    const midA = (a0 + a1) / 2;
                    if (cutaway && Math.sin(midA) < -0.05) continue;
                    polys.push({
                        pts: [
                            { x: xOut + rPipe * Math.cos(a0), y: y0, z: rPipe * Math.sin(a0) },
                            { x: xOut + rPipe * Math.cos(a0), y: y1, z: rPipe * Math.sin(a0) },
                            { x: xOut + rPipe * Math.cos(a1), y: y1, z: rPipe * Math.sin(a1) },
                            { x: xOut + rPipe * Math.cos(a1), y: y0, z: rPipe * Math.sin(a1) }
                        ],
                        color: colorRGB,
                        alpha: alpha,
                        nx: Math.cos(midA),
                        ny: 0,
                        nz: Math.sin(midA)
                    });
                }
            }

            // (3) 3 支 SUS304 消能盤固定支撐連桿 (連接彎頭下水口與傘狀消能盤)
            const gapBaffle = rPipe * 0.48;
            const yBaffleTop = ySkirtBot - gapBaffle;
            const yBaffleBot = yBaffleTop - rPipe * 0.14;
            const strutAngles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
            const rStrut = Math.max(2.2, rPipe * 0.055);
            for (const sa of strutAngles) {
                const sx = xOut + (rPipe * 0.86) * Math.cos(sa);
                const sz = (rPipe * 0.86) * Math.sin(sa);
                polys.push({
                    pts: [
                        { x: sx - rStrut, y: ySkirtBot, z: sz },
                        { x: sx + rStrut, y: ySkirtBot, z: sz },
                        { x: sx + rStrut, y: yBaffleBot + 1, z: sz },
                        { x: sx - rStrut, y: yBaffleBot + 1, z: sz }
                    ],
                    color: [226, 232, 240],
                    alpha: 0.96,
                    nx: Math.cos(sa),
                    ny: 0,
                    nz: Math.sin(sa)
                });
            }

            // (4) 底部傘狀消能盤 (微拱形導流圓盤，將向下衝擊水流平緩分散至散水盤)
            const rBaffleOuter = rPipe * 1.48;
            const rBaffleInner = rPipe * 0.18;
            for (let j = 0; j < segTheta; j++) {
                const a0 = (j / segTheta) * Math.PI * 2;
                const a1 = ((j + 1) / segTheta) * Math.PI * 2;
                const midA = (a0 + a1) / 2;
                // 傘頂錐面
                polys.push({
                    pts: [
                        { x: xOut + rBaffleInner * Math.cos(a0), y: yBaffleTop + 4, z: rBaffleInner * Math.sin(a0) },
                        { x: xOut + rBaffleOuter * Math.cos(a0), y: yBaffleBot, z: rBaffleOuter * Math.sin(a0) },
                        { x: xOut + rBaffleOuter * Math.cos(a1), y: yBaffleBot, z: rBaffleOuter * Math.sin(a1) },
                        { x: xOut + rBaffleInner * Math.cos(a1), y: yBaffleTop + 4, z: rBaffleInner * Math.sin(a1) }
                    ],
                    color: [216, 180, 254],
                    alpha: 0.94,
                    nx: Math.cos(midA) * 0.3,
                    ny: 0.9,
                    nz: Math.sin(midA) * 0.3
                });
            }

            return { polys, R_bend, xOut, ySkirtBot, yBaffleTop };
        }

        function generateFrustumPolys(xStart, xEnd, rStart, rEnd, colorRGB, alpha, cutaway) {
            const polys = [];
            const segX = 9, segTheta = 24;
            for (let i = 0; i < segX; i++) {
                const t0 = i / segX, t1 = (i + 1) / segX;
                const x0 = xStart + (xEnd - xStart) * t0, x1 = xStart + (xEnd - xStart) * t1;
                const r0 = rStart + (rEnd - rStart) * t0, r1 = rStart + (rEnd - rStart) * t1;
                for (let j = 0; j < segTheta; j++) {
                    const a0 = (j / segTheta) * Math.PI * 2, a1 = ((j + 1) / segTheta) * Math.PI * 2;
                    const midA = (a0 + a1) / 2;
                    if (cutaway && Math.sin(midA) < -0.05) continue;
                    polys.push({
                        pts: [
                            { x: x0, y: r0 * Math.cos(a0), z: r0 * Math.sin(a0) },
                            { x: x1, y: r1 * Math.cos(a0), z: r1 * Math.sin(a0) },
                            { x: x1, y: r1 * Math.cos(a1), z: r1 * Math.sin(a1) },
                            { x: x0, y: r0 * Math.cos(a1), z: r0 * Math.sin(a1) }
                        ],
                        color: colorRGB, alpha: alpha, nx: 0, ny: Math.cos(midA), nz: Math.sin(midA)
                    });
                }
            }
            return polys;
        }

        function drawVenturiScene() {
            const rect = vContainer.getBoundingClientRect();
            const W = rect.width, H = rect.height;
            if (W === 0 || H === 0) return;
            vCtx.clearRect(0, 0, W, H);

            const m = currentModel;
            const d = getActiveDims(m);
            const cx = W / 2, cy = H / 2 + 5;
            const scale = (Math.min(W, H) / 530) * vZoom;

            const expGap = isExploded ? 38 : 0;
            const totalLen = d.total_L;
            const xOrigin = -totalLen / 2 - (currentScheme === "ELBOW" ? 25 : 0);
            const rMain = m.D1 / 2, rThroat = m.Dt / 2;

            const xStub0 = xOrigin - m.L_stub - expGap * 0.6;
            const xRed0 = xOrigin - expGap * 0.6;
            const xRed1 = xRed0 + m.L_red;
            const xCoup0 = xStub0 - 30 - expGap * 0.8;
            const xCoup1 = xStub0 + 35 - expGap * 0.8;
            const xThr0 = xOrigin + m.L_red;
            const xThr1 = xThr0 + d.L_thr;
            const xCone0 = xThr1 + expGap * 0.6;
            const xCone1 = xCone0 + d.L_cone;
            const xTailStub1 = xCone1 + m.L_stub;

            drawVLine({ x: xCoup0 - 30, y: 0, z: 0 }, { x: xCone1 + 110, y: 0, z: 0 }, cx, cy, scale, "rgba(100,116,139,0.5)", 1.2, [6, 4]);

            let allPolys = [];
            allPolys.push(...generateFrustumPolys(xStub0, xRed0, rMain, rMain, [56, 189, 248], 0.9, isCutaway));
            allPolys.push(...generateFrustumPolys(xCoup0, xCoup1, rMain * 1.12, rMain * 1.12, [245, 158, 11], 0.88, isCutaway));
            allPolys.push(...generateFrustumPolys(xRed0, xRed1, rMain, rThroat, [56, 189, 248], 0.86, isCutaway));
            allPolys.push(...generateFrustumPolys(xThr0, xThr1, rThroat, rThroat, [244, 63, 94], 0.88, isCutaway));
            allPolys.push(...generateFrustumPolys(xCone0, xCone1, rThroat, rMain, [16, 185, 129], 0.85, isCutaway));

            const xInjCenter = (xThr0 + xThr1) / 2;
            const rInj = m.injOD / 2;
            const yTop = rThroat + 56 + (isExploded ? 30 : 0);
            const yBotBase = rThroat - m.injDepth + (isExploded ? 30 : 0);
            for (let j = 0; j < 18; j++) {
                const a0 = (j / 18) * Math.PI * 2, a1 = ((j + 1) / 18) * Math.PI * 2;
                const dx0 = rInj * Math.cos(a0), dz0 = rInj * Math.sin(a0);
                const dx1 = rInj * Math.cos(a1), dz1 = rInj * Math.sin(a1);
                allPolys.push({
                    pts: [
                        { x: xInjCenter + dx0, y: yTop, z: dz0 },
                        { x: xInjCenter + dx0, y: yBotBase + dx0, z: dz0 },
                        { x: xInjCenter + dx1, y: yBotBase + dx1, z: dz1 },
                        { x: xInjCenter + dx1, y: yTop, z: dz1 }
                    ],
                    color: [251, 191, 36], alpha: 0.98, nx: Math.cos(a0), ny: 0, nz: Math.sin(a0)
                });
            }

            let elbowMeta = null;
            if (currentScheme === "ELBOW") {
                const xElb = xCone1 + expGap * 0.6;
                elbowMeta = generateElbow90Polys(xElb, rMain, [168, 85, 247], 0.88, isCutaway);
                allPolys.push(...elbowMeta.polys);
            } else {
                allPolys.push(...generateFrustumPolys(xCone1, xTailStub1, rMain, rMain, [16, 185, 129], 0.9, isCutaway));
            }

            const projected = allPolys.map(poly => {
                const projPts = poly.pts.map(pt => projectVenturi3D(pt.x, pt.y, pt.z, cx, cy, scale));
                const avgZ = projPts.reduce((acc, p) => acc + p.z, 0) / projPts.length;
                return { ...poly, projPts, avgZ };
            });
            projected.sort((a, b) => b.avgZ - a.avgZ);

            for (const poly of projected) {
                const shade = 0.65 + 0.35 * Math.max(-0.5, (poly.ny * 0.6 - poly.nz * 0.5));
                const r = Math.min(255, Math.floor(poly.color[0] * shade));
                const g = Math.min(255, Math.floor(poly.color[1] * shade));
                const b = Math.min(255, Math.floor(poly.color[2] * shade));
                vCtx.beginPath();
                vCtx.moveTo(poly.projPts[0].sx, poly.projPts[0].sy);
                for (let k = 1; k < poly.projPts.length; k++) vCtx.lineTo(poly.projPts[k].sx, poly.projPts[k].sy);
                vCtx.closePath();
                vCtx.fillStyle = `rgba(${r},${g},${b},${poly.alpha})`;
                vCtx.fill();
                vCtx.strokeStyle = "rgba(255,255,255,0.12)";
                vCtx.lineWidth = 0.6;
                vCtx.stroke();
            }

            for (let b = 0; b < 30; b++) {
                const progress = ((animTick * 0.42 + b * (1 / 30)) % 1.0);
                const angle = b * 2.4 + animTick * 2.0;
                let bx, by, bz;
                if (currentScheme === "ELBOW" && elbowMeta) {
                    const xElbStart = xCone1 + expGap * 0.6;
                    if (progress < 0.58) {
                        const t = progress / 0.58;
                        bx = xInjCenter + 8 + t * (xElbStart - xInjCenter - 8);
                        const spreadR = (rThroat * 0.55) * (0.3 + 0.7 * t);
                        by = Math.cos(angle) * spreadR;
                        bz = Math.sin(angle) * spreadR;
                    } else if (progress < 0.88) {
                        const t = (progress - 0.58) / 0.30;
                        const phi = t * (Math.PI / 2);
                        const Rb = elbowMeta.R_bend;
                        const cxArc = xElbStart + Rb * Math.sin(phi);
                        const cyArc = -Rb + Rb * Math.cos(phi);
                        const spreadR = rMain * 0.48;
                        bx = cxArc + Math.cos(angle) * spreadR * Math.sin(phi);
                        by = cyArc + Math.cos(angle) * spreadR * Math.cos(phi);
                        bz = Math.sin(angle) * spreadR;
                    } else {
                        const t = (progress - 0.88) / 0.12;
                        const splashR = rMain * (0.35 + t * 0.95);
                        bx = elbowMeta.xOut + Math.cos(angle) * splashR;
                        by = elbowMeta.ySkirtBot - t * (elbowMeta.ySkirtBot - elbowMeta.yBaffleTop);
                        bz = Math.sin(angle) * splashR;
                    }
                } else {
                    bx = xInjCenter + 8 + progress * (xCone1 - xInjCenter - 10);
                    const spreadR = (rThroat * 0.65) * progress;
                    by = Math.cos(angle) * spreadR;
                    bz = Math.sin(angle) * spreadR;
                }
                const pt = projectVenturi3D(bx, by, bz, cx, cy, scale);
                vCtx.beginPath();
                vCtx.arc(pt.sx, pt.sy, 2.2 + progress * 2.2, 0, Math.PI * 2);
                vCtx.fillStyle = `rgba(103, 232, 249, ${0.9 - progress * 0.45})`;
                vCtx.fill();
            }

            if (showDim3D) {
                drawVDim({ x: xStub0, y: -rMain, z: 0 }, { x: xRed0, y: -rMain, z: 0 }, { x: 0, y: -42, z: 0 }, `袖管 ${m.L_stub}mm`, "#f59e0b", cx, cy, scale);
                drawVDim({ x: xRed0, y: -rMain, z: 0 }, { x: xRed1, y: -rThroat, z: 0 }, { x: 0, y: -42, z: 0 }, `縮口 ${m.L_red}mm`, "#38bdf8", cx, cy, scale);
                drawVDim({ x: xThr0, y: -rThroat, z: 0 }, { x: xThr1, y: -rThroat, z: 0 }, { x: 0, y: -65, z: 0 }, `喉部 ${d.L_thr}mm (Ø${m.Dt})`, "#fb7185", cx, cy, scale);
                drawVDim({ x: xCone0, y: -rThroat, z: 0 }, { x: xCone1, y: -rMain, z: 0 }, { x: 0, y: -42, z: 0 }, `擴張段 ${d.L_cone}mm`, "#34d399", cx, cy, scale);
                drawVDim({ x: xRed0, y: -rMain, z: 0 }, { x: xCone1, y: -rMain, z: 0 }, { x: 0, y: -95, z: 0 }, `縮擴本體 ${d.total_L}mm (含袖管 ${d.total_with_stubs}mm)`, "#fbbf24", cx, cy, scale);
            }
        }

        // =========================================================================
        // 7. 引擎二：免插電太陽能負壓自吸臭氧箱 3D 結構與氣電模擬器
        // =========================================================================
        let isFlowRunning = true;
        let isDoorOpen = true;
        let showBoxDim3D = true;
        let bRotY = -0.42, bRotX = 0.24, bZoom = 1.05, bPanX = 0, bPanY = 15;
        let bDragging = false, bDragBtn = 0, bLastX = 0, bLastY = 0;

        const btnSimRun = document.getElementById('btnSimRun');
        const btnSimStop = document.getElementById('btnSimStop');
        const statusBadge = document.getElementById('statusBadge');

        function setFlowSim(running) {
            isFlowRunning = running;
            if (running) {
                btnSimRun.className = "px-4 py-2 rounded-lg text-xs font-bold transition bg-emerald-500 text-slate-950 shadow";
                btnSimStop.className = "px-4 py-2 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-300 border border-slate-700 hover:border-rose-400";
                statusBadge.textContent = "🟢 狀態：針閥下游負壓吸合中 (-0.15 bar ➔ 12V 臭氧常壓放電 + 雙路 3.5 L/min 自吸)";
                statusBadge.className = "text-xs font-bold text-emerald-400";
            } else {
                btnSimRun.className = "px-4 py-2 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-300 border border-slate-700 hover:border-emerald-400";
                btnSimStop.className = "px-4 py-2 rounded-lg text-xs font-bold transition bg-rose-500 text-white shadow";
                statusBadge.textContent = "🔴 狀態：水塔停水待機中 (針閥約 0.5~1.5 秒補氣歸零 ➔ 真空開關彈開斷電，0W 耗電)";
                statusBadge.className = "text-xs font-bold text-rose-400";
            }
            renderSolarSchematics();
        }

        btnSimRun.addEventListener('click', () => setFlowSim(true));
        btnSimStop.addEventListener('click', () => setFlowSim(false));

        document.getElementById('btnDoorOpen').addEventListener('click', function() {
            isDoorOpen = !isDoorOpen;
            this.className = isDoorOpen
                ? "px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-400 text-slate-950"
                : "px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-600";
        });

        document.getElementById('btnBoxDim3D').addEventListener('click', function() {
            showBoxDim3D = !showBoxDim3D;
            this.className = showBoxDim3D
                ? "px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-400 text-slate-950"
                : "px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-600";
        });

        document.querySelectorAll('.b-cam-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-boxcam');
                if (mode === 'iso') { bRotY = -0.42; bRotX = 0.24; bZoom = 1.05; bPanX = 0; bPanY = 15; }
                else if (mode === 'front') { bRotY = 0.0; bRotX = 0.05; bZoom = 1.25; bPanX = 0; bPanY = 20; }
                else if (mode === 'side') { bRotY = -1.15; bRotX = 0.18; bZoom = 1.1; bPanX = 0; bPanY = 15; }
                else if (mode === 'bottom') { bRotY = 0.0; bRotX = -0.45; bZoom = 1.25; bPanX = 0; bPanY = -10; }
            });
        });

        function renderSolarSchematics() {
            const swColor = isFlowRunning ? "#10b981" : "#f43f5e";
            const swText = isFlowRunning ? "已吸合導通 (ON)" : "彈開斷路 (OFF)";
            const swContactY = isFlowRunning ? 155 : 132;
            const o3Glow = isFlowRunning ? "rgba(168,85,247,0.45)" : "rgba(51,65,85,0.2)";
            const o3Stroke = isFlowRunning ? "#c084fc" : "#64748b";
            const flowAnim = isFlowRunning ? "#67e8f9" : "#475569";

            const elecSVG = `
            <svg viewBox="0 0 760 360" class="w-full h-auto max-h-80" role="img" aria-label="免插電太陽能負壓自吸臭氧機箱氣電接線與三重防回水氣動迴路工程藍圖" xmlns="http://www.w3.org/2000/svg">
                <rect width="760" height="360" fill="#060912"/>
                <polygon points="35,40 175,20 190,95 50,115" fill="rgba(59,130,246,0.25)" stroke="#3b82f6" stroke-width="2.5"/>
                <line x1="85" y1="33" x2="100" y2="108" stroke="#60a5fa" stroke-width="1"/>
                <line x1="130" y1="26" x2="145" y2="101" stroke="#60a5fa" stroke-width="1"/>
                <line x1="42" y1="78" x2="182" y2="58" stroke="#60a5fa" stroke-width="1"/>
                <text x="112" y="136" fill="#60a5fa" font-size="12" text-anchor="middle" font-weight="bold">① 50W 單晶矽太陽能板</text>
                <text x="112" y="153" fill="#94a3b8" font-size="11" text-anchor="middle">(67×53cm / 18°傾角 / 日發電140Wh)</text>
                <rect x="230" y="38" width="145" height="88" rx="6" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
                <text x="302" y="62" fill="#34d399" font-size="12" text-anchor="middle" font-weight="bold">MPPT 控制器＋脈衝模組</text>
                <text x="302" y="82" fill="#cbd5e1" font-size="10.5" text-anchor="middle">12V 穩壓輸出 (雙模式切換)</text>
                <text x="302" y="100" fill="#fbbf24" font-size="10.5" text-anchor="middle">• 24h水塔：開15m/休45m (均4.5W)</text>
                <text x="302" y="116" fill="#94a3b8" font-size="10" text-anchor="middle">• 商辦/試裝：連續放電 (18W)</text>
                <line x1="185" y1="65" x2="230" y2="65" stroke="#ef4444" stroke-width="2.5"/>
                <line x1="185" y1="85" x2="230" y2="85" stroke="#3b82f6" stroke-width="2.5"/>
                <rect x="230" y="195" width="145" height="100" rx="8" fill="rgba(16,185,129,0.18)" stroke="#10b981" stroke-width="2.5"/>
                <text x="302" y="225" fill="#34d399" font-size="12.5" text-anchor="middle" font-weight="bold">③ 12.8V 20Ah 鋰鐵電池</text>
                <text x="302" y="246" fill="#e2e8f0" font-size="11" text-anchor="middle">實足儲電量 256 Wh (內建BMS)</text>
                <text x="302" y="266" fill="#67e8f9" font-size="10.5" text-anchor="middle">間歇模式無日照約續航 48~56h (逾2天)</text>
                <text x="302" y="284" fill="#94a3b8" font-size="10" text-anchor="middle">連續模式滿電供電 14 小時</text>
                <line x1="285" y1="126" x2="285" y2="195" stroke="#ef4444" stroke-width="2.5"/>
                <line x1="320" y1="126" x2="320" y2="195" stroke="#3b82f6" stroke-width="2.5"/>
                <rect x="435" y="95" width="135" height="95" rx="8" fill="rgba(244,63,94,0.12)" stroke="${swColor}" stroke-width="2.5"/>
                <text x="502" y="118" fill="${swColor}" font-size="12.5" text-anchor="middle" font-weight="bold">④ 真空負壓開關</text>
                <circle cx="465" cy="155" r="4" fill="#ef4444"/>
                <circle cx="535" cy="155" r="4" fill="#ef4444"/>
                <line x1="465" y1="155" x2="532" y2="${swContactY}" stroke="#fbbf24" stroke-width="3.5"/>
                <text x="502" y="178" fill="#fbbf24" font-size="11.5" text-anchor="middle" font-weight="bold">${swText}</text>
                <line x1="502" y1="190" x2="502" y2="285" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6,4"/>
                <text x="502" y="305" fill="#38bdf8" font-size="11.5" text-anchor="middle" font-weight="bold">▲ 接「流量計針閥下游」OR 感測三通</text>
                <text x="502" y="323" fill="#94a3b8" font-size="10.5" text-anchor="middle">(開水達 -0.08bar 吸合；停水經針閥 約0.5~1.5s 補氣斷電)</text>
                <path d="M 375 65 L 410 65 L 410 155 L 465 155" fill="none" stroke="#ef4444" stroke-width="2.5"/>
                <path d="M 535 155 L 605 155" fill="none" stroke="${isFlowRunning ? '#ef4444' : '#475569'}" stroke-width="2.5"/>
                <path d="M 375 95 L 395 95 L 395 245 L 605 245" fill="none" stroke="#3b82f6" stroke-width="2.5"/>
                <rect x="605" y="115" width="135" height="160" rx="8" fill="${o3Glow}" stroke="${o3Stroke}" stroke-width="2.5"/>
                <text x="672" y="142" fill="#e9d5ff" font-size="12.5" text-anchor="middle" font-weight="bold">⑤ 12V 常壓石英臭氧管</text>
                <text x="672" y="164" fill="#fbbf24" font-size="11.5" text-anchor="middle" font-weight="bold">瞬時 18W / 間歇均 4.5W</text>
                <text x="672" y="185" fill="#cbd5e1" font-size="11" text-anchor="middle">臭氧產量：3~5 g/h</text>
                <text x="672" y="206" fill="#67e8f9" font-size="10.5" text-anchor="middle">位於針閥上游 (~1 atm 常壓)</text>
                <text x="672" y="230" fill="${isFlowRunning ? '#34d399' : '#f43f5e'}" font-size="12" text-anchor="middle" font-weight="bold">${isFlowRunning ? '⚡ 高壓電暈產臭氧中' : '💤 斷電休息中 (0W)'}</text>
                <text x="672" y="256" fill="#94a3b8" font-size="10" text-anchor="middle">內建散熱風扇同步啟停</text>
            </svg>`;
            document.getElementById('svgElectricWrap').innerHTML = elecSVG;

            const pneuSVG = `
            <svg viewBox="0 0 760 360" class="w-full h-auto max-h-80" role="img" aria-label="免插電太陽能負壓自吸臭氧機箱氣電接線與三重防回水氣動迴路工程藍圖" xmlns="http://www.w3.org/2000/svg">
                <rect width="760" height="360" fill="#060912"/>
                <rect x="20" y="95" width="70" height="165" rx="10" fill="rgba(56,189,248,0.18)" stroke="#38bdf8" stroke-width="2.5"/>
                <text x="55" y="82" fill="#38bdf8" font-size="11.5" text-anchor="middle" font-weight="bold">⑦ 矽膠乾燥筒</text>
                <circle cx="42" cy="128" r="5.5" fill="#3b82f6"/><circle cx="68" cy="133" r="5.5" fill="#3b82f6"/>
                <circle cx="50" cy="158" r="5.5" fill="#3b82f6"/><circle cx="65" cy="182" r="5.5" fill="#3b82f6"/>
                <circle cx="40" cy="202" r="5.5" fill="#3b82f6"/><circle cx="62" cy="226" r="5.5" fill="#3b82f6"/>
                <text x="55" y="280" fill="#94a3b8" font-size="10.5" text-anchor="middle">直通大氣 (0 bar)</text>
                <text x="55" y="296" fill="#fbbf24" font-size="10.5" text-anchor="middle">濾除水霧防硝酸</text>
                <path d="M 90 140 L 135 140" fill="none" stroke="${flowAnim}" stroke-width="4"/>
                <rect x="135" y="108" width="135" height="64" rx="8" fill="${o3Glow}" stroke="${o3Stroke}" stroke-width="2.5"/>
                <text x="202" y="131" fill="#f8fafc" font-size="11.5" text-anchor="middle" font-weight="bold">⑤ 封閉式石英臭氧管</text>
                <text x="202" y="149" fill="#d8b4fe" font-size="10.5" text-anchor="middle">常壓穩定放電 (3~5 g/h)</text>
                <text x="202" y="165" fill="#67e8f9" font-size="9.5" text-anchor="middle">防低壓電弧擊穿保護</text>
                <path d="M 270 140 L 305 140" fill="none" stroke="${isFlowRunning ? '#c084fc' : '#475569'}" stroke-width="4"/>
                <path d="M 305 140 L 305 85 L 340 85" fill="none" stroke="${isFlowRunning ? '#c084fc' : '#475569'}" stroke-width="3.5"/>
                <path d="M 305 140 L 305 205 L 340 205" fill="none" stroke="${isFlowRunning ? '#c084fc' : '#475569'}" stroke-width="3.5"/>
                <rect x="340" y="52" width="108" height="64" rx="6" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
                <text x="394" y="73" fill="#34d399" font-size="11" text-anchor="middle" font-weight="bold">⑥ 左路流量計+針閥</text>
                <text x="394" y="91" fill="#f8fafc" font-size="10.5" text-anchor="middle">${isFlowRunning ? '節流：3.5 L/min' : '浮球：0 L/min'}</text>
                <text x="394" y="107" fill="#fbbf24" font-size="9.5" text-anchor="middle">針閥節流產生壓差</text>
                <rect x="340" y="172" width="108" height="64" rx="6" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
                <text x="394" y="193" fill="#34d399" font-size="11" text-anchor="middle" font-weight="bold">⑥ 右路流量計+針閥</text>
                <text x="394" y="211" fill="#f8fafc" font-size="10.5" text-anchor="middle">${isFlowRunning ? '節流：3.5 L/min' : '浮球：0 L/min'}</text>
                <text x="394" y="227" fill="#fbbf24" font-size="9.5" text-anchor="middle">獨立微調防偏流</text>
                <rect x="462" y="118" width="118" height="54" rx="6" fill="rgba(244,63,94,0.16)" stroke="${swColor}" stroke-width="2"/>
                <text x="521" y="138" fill="${swColor}" font-size="11" text-anchor="middle" font-weight="bold">④ 真空開關(針閥後)</text>
                <text x="521" y="154" fill="#cbd5e1" font-size="9.5" text-anchor="middle">雙單向閥 OR 隔離感測</text>
                <text x="521" y="167" fill="#fbbf24" font-size="9.5" text-anchor="middle">${isFlowRunning ? '實測 -0.15 bar [ON]' : '約0.5~1.5s 補氣歸零 [OFF]'}</text>
                <path d="M 521 85 L 521 118" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-dasharray="4,2"/>
                <path d="M 521 205 L 521 172" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-dasharray="4,2"/>
                <path d="M 448 85 L 635 85" fill="none" stroke="#f8fafc" stroke-width="3.5"/>
                <path d="M 448 205 L 635 205" fill="none" stroke="#f8fafc" stroke-width="3.5"/>
                <text x="585" y="73" fill="#e2e8f0" font-size="10" text-anchor="middle">PTFE管+雙逆止閥</text>
                <text x="585" y="195" fill="#e2e8f0" font-size="10" text-anchor="middle">PTFE管+雙逆止閥</text>
                <rect x="635" y="55" width="108" height="60" rx="8" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" stroke-width="2.5"/>
                <text x="689" y="78" fill="#67e8f9" font-size="11" text-anchor="middle" font-weight="bold">左散水盤文丘里</text>
                <text x="689" y="98" fill="#fbbf24" font-size="10.5" text-anchor="middle">${isFlowRunning ? '尾流 -0.18 bar' : '停水 0 bar'}</text>
                <rect x="635" y="175" width="108" height="60" rx="8" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" stroke-width="2.5"/>
                <text x="689" y="198" fill="#67e8f9" font-size="11" text-anchor="middle" font-weight="bold">右散水盤文丘里</text>
                <text x="689" y="218" fill="#fbbf24" font-size="10.5" text-anchor="middle">${isFlowRunning ? '尾流 -0.18 bar' : '停水 0 bar'}</text>
                <rect x="135" y="268" width="608" height="72" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
                <text x="150" y="290" fill="#38bdf8" font-size="11.5" font-weight="bold">🛡️ 氣電迴路兩大防呆設計（工業級防呆設計）：</text>
                <text x="150" y="310" fill="#e2e8f0" font-size="10.5">1. 真空開關設於「流量計針閥下游、防回水逆止閥上游」：開水穩抽 -0.15 bar 啟動；停水瞬間大氣經微開針閥 0.5 秒補氣斷電！</text>
                <text x="150" y="328" fill="#6ee7b7" font-size="10.5">2. 三重防回水：機箱高於散水盤 30cm ＋ 文丘里端 SUS304 彈簧逆止閥 ＋ 機箱底 PVDF 止回閥，三重止回防倒灌保護，有效阻絕冷卻水倒灌！</text>
            </svg>`;
            document.getElementById('svgPneumaticWrap').innerHTML = pneuSVG;
        }

        const bCanvas = document.getElementById('box3dCanvas');
        const bCtx = bCanvas.getContext('2d');
        const bContainer = document.getElementById('boxCanvasContainer');

        function resizeBoxCanvas() {
            const rect = bContainer.getBoundingClientRect();
            if (rect.width === 0) return;
            const dpr = window.devicePixelRatio || 1;
            bCanvas.width = rect.width * dpr;
            bCanvas.height = rect.height * dpr;
            bCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        bContainer.addEventListener('contextmenu', e => e.preventDefault());
        bContainer.addEventListener('mousedown', e => {
            bDragging = true; bDragBtn = e.button; bLastX = e.clientX; bLastY = e.clientY;
        });
        bContainer.addEventListener('wheel', e => {
            e.preventDefault();
            bZoom = Math.max(0.5, Math.min(2.4, bZoom - e.deltaY * 0.0012));
        }, { passive: false });
        let bPinchDist = 0;
        bContainer.addEventListener('touchstart', e => {
            if (e.touches.length === 1 && (mobile3DUnlocked || window.innerWidth >= 640)) {
                bDragging = true; bDragBtn = 0; bLastX = e.touches[0].clientX; bLastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                bDragging = false;
                bPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            }
        }, { passive: true });

        window.addEventListener('mouseup', () => { vDragging = false; bDragging = false; });
        window.addEventListener('touchend', () => { vDragging = false; bDragging = false; });
        window.addEventListener('mousemove', e => {
            if (vDragging) {
                const dx = e.clientX - vLastX, dy = e.clientY - vLastY;
                if (vDragBtn === 2) { vPanX += dx; vPanY += dy; }
                else { vRotY += dx * 0.008; vRotX = Math.max(-1.45, Math.min(1.45, vRotX + dy * 0.008)); }
                vLastX = e.clientX; vLastY = e.clientY;
            }
            if (bDragging) {
                const dx = e.clientX - bLastX, dy = e.clientY - bLastY;
                if (bDragBtn === 2) { bPanX += dx; bPanY += dy; }
                else { bRotY += dx * 0.008; bRotX = Math.max(-1.4, Math.min(1.4, bRotX + dy * 0.008)); }
                bLastX = e.clientX; bLastY = e.clientY;
            }
        });
        vContainer.addEventListener('touchmove', e => {
            if (e.touches.length === 1 && vDragging && (mobile3DUnlocked || window.innerWidth >= 640)) {
                if (e.cancelable) e.preventDefault();
                const dx = e.touches[0].clientX - vLastX, dy = e.touches[0].clientY - vLastY;
                vRotY += dx * 0.009; vRotX = Math.max(-1.45, Math.min(1.45, vRotX + dy * 0.009));
                vLastX = e.touches[0].clientX; vLastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                if (e.cancelable) e.preventDefault();
                const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                if (vPinchDist > 0) {
                    vZoom = Math.max(0.55, Math.min(2.5, vZoom * (dist / vPinchDist)));
                }
                vPinchDist = dist;
            }
        }, { passive: false });

        bContainer.addEventListener('touchmove', e => {
            if (e.touches.length === 1 && bDragging && (mobile3DUnlocked || window.innerWidth >= 640)) {
                if (e.cancelable) e.preventDefault();
                const dx = e.touches[0].clientX - bLastX, dy = e.touches[0].clientY - bLastY;
                bRotY += dx * 0.009; bRotX = Math.max(-1.4, Math.min(1.4, bRotX + dy * 0.009));
                bLastX = e.touches[0].clientX; bLastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                if (e.cancelable) e.preventDefault();
                const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                if (bPinchDist > 0) {
                    bZoom = Math.max(0.55, Math.min(2.4, bZoom * (dist / bPinchDist)));
                }
                bPinchDist = dist;
            }
        }, { passive: false });

        function projectBox3D(x, y, z, cx, cy, scale) {
            const cosY = Math.cos(bRotY), sinY = Math.sin(bRotY);
            const x1 = x * cosY - z * sinY;
            const z1 = x * sinY + z * cosY;
            const cosX = Math.cos(bRotX), sinX = Math.sin(bRotX);
            const y2 = y * cosX - z1 * sinX;
            const z2 = y * sinX + z1 * cosX;
            const p = 1000 / (900 + z2);
            return { sx: cx + bPanX + x1 * scale * p, sy: cy + bPanY - y2 * scale * p, z: z2 };
        }

        function createBoxPolys(xc, yc, zc, w, h, d, colorRGB, alpha, skipFront) {
            const hw = w / 2, hh = h / 2, hd = d / 2;
            const v = [
                { x: xc - hw, y: yc - hh, z: zc - hd }, { x: xc + hw, y: yc - hh, z: zc - hd },
                { x: xc + hw, y: yc + hh, z: zc - hd }, { x: xc - hw, y: yc + hh, z: zc - hd },
                { x: xc - hw, y: yc - hh, z: zc + hd }, { x: xc + hw, y: yc - hh, z: zc + hd },
                { x: xc + hw, y: yc + hh, z: zc + hd }, { x: xc - hw, y: yc + hh, z: zc + hd }
            ];
            const faces = [
                { idx: [4, 5, 6, 7], nx: 0, ny: 0, nz: 1 },
                { idx: [0, 4, 7, 3], nx: -1, ny: 0, nz: 0 },
                { idx: [1, 5, 6, 2], nx: 1, ny: 0, nz: 0 },
                { idx: [3, 2, 6, 7], nx: 0, ny: 1, nz: 0 },
                { idx: [0, 1, 5, 4], nx: 0, ny: -1, nz: 0 }
            ];
            if (!skipFront) faces.push({ idx: [0, 1, 2, 3], nx: 0, ny: 0, nz: -1 });
            return faces.map(f => ({ pts: f.idx.map(i => v[i]), color: colorRGB, alpha, nx: f.nx, ny: f.ny, nz: f.nz }));
        }

        function createTiltedSolarPolys(xc, yc, zc, w, d, t, tiltRad) {
            const hw = w / 2, hd = d / 2, ht = t / 2;
            const cosT = Math.cos(tiltRad), sinT = Math.sin(tiltRad);
            function rotPt(lx, ly, lz) {
                return { x: xc + lx, y: yc + ly * cosT - lz * sinT, z: zc + ly * sinT + lz * cosT };
            }
            const v = [
                rotPt(-hw, -ht, -hd), rotPt(hw, -ht, -hd), rotPt(hw, ht, -hd), rotPt(-hw, ht, -hd),
                rotPt(-hw, -ht, hd),  rotPt(hw, -ht, hd),  rotPt(hw, ht, hd),  rotPt(-hw, ht, hd)
            ];
            return [
                { pts: [v[3], v[2], v[6], v[7]], color: [37, 99, 235], alpha: 0.95, nx: 0, ny: 1, nz: -0.3 },
                { pts: [v[0], v[1], v[5], v[4]], color: [148, 163, 184], alpha: 0.9, nx: 0, ny: -1, nz: 0 },
                { pts: [v[0], v[1], v[2], v[3]], color: [203, 213, 225], alpha: 0.95, nx: 0, ny: 0, nz: -1 },
                { pts: [v[4], v[5], v[6], v[7]], color: [203, 213, 225], alpha: 0.95, nx: 0, ny: 0, nz: 1 },
                { pts: [v[0], v[4], v[7], v[3]], color: [203, 213, 225], alpha: 0.95, nx: -1, ny: 0, nz: 0 },
                { pts: [v[1], v[5], v[6], v[2]], color: [203, 213, 225], alpha: 0.95, nx: 1, ny: 0, nz: 0 }
            ];
        }

        function drawBLine(p1, p2, cx, cy, scale, color, width, dash) {
            const a = projectBox3D(p1.x, p1.y, p1.z, cx, cy, scale);
            const b = projectBox3D(p2.x, p2.y, p2.z, cx, cy, scale);
            bCtx.save();
            bCtx.beginPath();
            if (dash) bCtx.setLineDash(dash);
            bCtx.moveTo(a.sx, a.sy);
            bCtx.lineTo(b.sx, b.sy);
            bCtx.strokeStyle = color;
            bCtx.lineWidth = width || 1.5;
            bCtx.stroke();
            bCtx.restore();
            return { a, b };
        }

        function drawBDim(pStart, pEnd, offsetVec, labelText, color, cx, cy, scale) {
            const p1Ext = { x: pStart.x + offsetVec.x, y: pStart.y + offsetVec.y, z: pStart.z + offsetVec.z };
            const p2Ext = { x: pEnd.x + offsetVec.x, y: pEnd.y + offsetVec.y, z: pEnd.z + offsetVec.z };
            drawBLine(pStart, p1Ext, cx, cy, scale, "rgba(148,163,184,0.5)", 1, [3, 3]);
            drawBLine(pEnd, p2Ext, cx, cy, scale, "rgba(148,163,184,0.5)", 1, [3, 3]);
            const seg = drawBLine(p1Ext, p2Ext, cx, cy, scale, color, 2, null);
            bCtx.fillStyle = color;
            bCtx.beginPath();
            bCtx.arc(seg.a.sx, seg.a.sy, 3, 0, Math.PI * 2);
            bCtx.arc(seg.b.sx, seg.b.sy, 3, 0, Math.PI * 2);
            bCtx.fill();
            const mx = (seg.a.sx + seg.b.sx) / 2, my = (seg.a.sy + seg.b.sy) / 2;
            bCtx.font = "bold 11.5px 'Noto Sans TC', sans-serif";
            const tw = bCtx.measureText(labelText).width;
            bCtx.fillStyle = "rgba(15, 23, 42, 0.92)";
            bCtx.strokeStyle = color;
            bCtx.lineWidth = 1.2;
            bCtx.beginPath();
            drawSafeRoundRect(bCtx, mx - tw / 2 - 6, my - 10, tw + 12, 20, 4);
            bCtx.fill();
            bCtx.stroke();
            bCtx.fillStyle = color;
            bCtx.textAlign = "center";
            bCtx.textBaseline = "middle";
            bCtx.fillText(labelText, mx, my);
        }

        function drawSolarBoxScene() {
            const rect = bContainer.getBoundingClientRect();
            const W = rect.width, H = rect.height;
            if (W === 0 || H === 0) return;
            bCtx.clearRect(0, 0, W, H);

            const cx = W / 2, cy = H / 2 + 15;
            const scale = (Math.min(W, H) / 760) * bZoom;

            let allPolys = [];
            allPolys.push(...createBoxPolys(0, 140, 125, 760, 32, 32, [100, 116, 139], 0.7, false));
            allPolys.push(...createBoxPolys(0, -140, 125, 760, 32, 32, [100, 116, 139], 0.7, false));
            allPolys.push(...createBoxPolys(0, -20, 0, 300, 400, 200, [148, 163, 184], isDoorOpen ? 0.32 : 0.88, isDoorOpen));
            allPolys.push(...createBoxPolys(-65, -150, 20, 130, 110, 90, [16, 185, 129], 0.95, false));
            allPolys.push(...createBoxPolys(-65, -35, 45, 100, 70, 35, [52, 211, 153], 0.95, false));
            const swRGB = isFlowRunning ? [16, 185, 129] : [244, 63, 94];
            allPolys.push(...createBoxPolys(-65, 95, 30, 68, 68, 50, swRGB, 0.96, false));
            const o3RGB = isFlowRunning ? [168, 85, 247] : [100, 116, 139];
            allPolys.push(...createBoxPolys(68, 25, 25, 78, 220, 78, o3RGB, 0.95, false));
            allPolys.push(...createBoxPolys(45, -145, -85, 32, 95, 32, [56, 189, 248], 0.92, false));
            allPolys.push(...createBoxPolys(95, -145, -85, 32, 95, 32, [56, 189, 248], 0.92, false));
            allPolys.push(...createBoxPolys(-185, -15, 0, 52, 240, 52, [59, 130, 246], 0.85, false));
            allPolys.push(...createTiltedSolarPolys(0, 235, 0, 670, 530, 28, 0.314));
            allPolys.push(...createBoxPolys(-120, 205, -50, 16, 55, 16, [203, 213, 225], 0.9, false));
            allPolys.push(...createBoxPolys(120, 205, -50, 16, 55, 16, [203, 213, 225], 0.9, false));

            const projected = allPolys.map(poly => {
                const projPts = poly.pts.map(pt => projectBox3D(pt.x, pt.y, pt.z, cx, cy, scale));
                const avgZ = projPts.reduce((acc, p) => acc + p.z, 0) / projPts.length;
                return { ...poly, projPts, avgZ };
            });
            projected.sort((a, b) => b.avgZ - a.avgZ);

            for (const poly of projected) {
                const shade = 0.7 + 0.3 * Math.max(-0.4, (poly.ny * 0.5 - poly.nz * 0.5));
                const r = Math.min(255, Math.floor(poly.color[0] * shade));
                const g = Math.min(255, Math.floor(poly.color[1] * shade));
                const b = Math.min(255, Math.floor(poly.color[2] * shade));
                bCtx.beginPath();
                bCtx.moveTo(poly.projPts[0].sx, poly.projPts[0].sy);
                for (let k = 1; k < poly.projPts.length; k++) bCtx.lineTo(poly.projPts[k].sx, poly.projPts[k].sy);
                bCtx.closePath();
                bCtx.fillStyle = `rgba(${r},${g},${b},${poly.alpha})`;
                bCtx.fill();
                bCtx.strokeStyle = "rgba(255,255,255,0.18)";
                bCtx.lineWidth = 0.7;
                bCtx.stroke();
            }

            drawBLine({ x: 45, y: -220, z: -20 }, { x: 45, y: -330, z: -20 }, cx, cy, scale, "#f8fafc", 4, null);
            drawBLine({ x: 95, y: -220, z: -20 }, { x: 95, y: -330, z: -20 }, cx, cy, scale, "#f8fafc", 4, null);

            if (isFlowRunning) {
                for (let k = 0; k < 5; k++) {
                    const prog = ((animTick * 0.5 + k * 0.2) % 1.0);
                    const py = -220 - prog * 110;
                    const pt1 = projectBox3D(45, py, -20, cx, cy, scale);
                    const pt2 = projectBox3D(95, py, -20, cx, cy, scale);
                    bCtx.fillStyle = "#c084fc";
                    bCtx.beginPath();
                    bCtx.arc(pt1.sx, pt1.sy, 3.5, 0, Math.PI * 2);
                    bCtx.arc(pt2.sx, pt2.sy, 3.5, 0, Math.PI * 2);
                    bCtx.fill();
                }
            }

            bCtx.font = "bold 11.5px 'Noto Sans TC', sans-serif";
            bCtx.textAlign = "center";
            const lblSolar = projectBox3D(0, 290, -80, cx, cy, scale);
            bCtx.fillStyle = "#60a5fa";
            bCtx.fillText("① 50W 太陽能 18° 遮陽頂蓋 (670×530mm)", lblSolar.sx, lblSolar.sy);
            const lblSw = projectBox3D(-65, 95, -10, cx, cy, scale);
            bCtx.fillStyle = isFlowRunning ? "#34d399" : "#fb7185";
            bCtx.fillText(isFlowRunning ? "④ 針閥後負壓開關 [ON]" : "④ 針閥後負壓開關 [OFF]", lblSw.sx, lblSw.sy);
            const lblO3 = projectBox3D(68, 35, -20, cx, cy, scale);
            bCtx.fillStyle = "#e9d5ff";
            bCtx.fillText("⑤ 12V常壓石英臭氧管(均4.5W)", lblO3.sx, lblO3.sy);
            const lblBat = projectBox3D(-65, -150, -30, cx, cy, scale);
            bCtx.fillStyle = "#6ee7b7";
            bCtx.fillText("③ 12.8V 20Ah (256Wh) 鋰鐵", lblBat.sx, lblBat.sy);

            if (showBoxDim3D) {
                drawBDim({ x: -335, y: 265, z: -240 }, { x: 335, y: 265, z: -240 }, { x: 0, y: 45, z: 0 }, "太陽能板寬 670 mm (18°傾角)", "#38bdf8", cx, cy, scale);
                drawBDim({ x: 335, y: 295, z: -265 }, { x: 335, y: 175, z: 265 }, { x: 65, y: 0, z: 0 }, "太陽能板深 530 mm", "#60a5fa", cx, cy, scale);
                drawBDim({ x: -150, y: 180, z: -100 }, { x: -150, y: -220, z: -100 }, { x: -95, y: 0, z: 0 }, "機箱高 400 mm", "#fbbf24", cx, cy, scale);
                drawBDim({ x: -150, y: -220, z: -100 }, { x: 150, y: -220, z: -100 }, { x: 0, y: -55, z: 0 }, "機箱寬 300 × 深 200 mm", "#34d399", cx, cy, scale);
            }
        }


        // =========================================================================
        // 8. 智慧離屏省電引擎 (IntersectionObserver) + 手機 3D 觸控鎖切換
        // =========================================================================
        let is3DSectionVisible = true;
        const section3DEl = document.getElementById('interactive-3d');
        if ('IntersectionObserver' in window && section3DEl) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    is3DSectionVisible = entry.isIntersecting;
                });
            }, { threshold: 0.02 });
            io.observe(section3DEl);
        }

        document.querySelectorAll('.btn-toggle-touch-3d').forEach(btn => {
            btn.addEventListener('click', () => {
                mobile3DUnlocked = !mobile3DUnlocked;
                vContainer.classList.toggle('touch-unlocked', mobile3DUnlocked);
                bContainer.classList.toggle('touch-unlocked', mobile3DUnlocked);
                document.querySelectorAll('.btn-toggle-touch-3d').forEach(b => {
                    if (mobile3DUnlocked) {
                        b.className = "btn-toggle-touch-3d sm:hidden bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded text-[11px] shadow";
                        b.innerHTML = '<i class="fa-solid fa-rotate mr-1"></i>單指3D旋轉中 (點此鎖定滑頁)';
                    } else {
                        b.className = "btn-toggle-touch-3d sm:hidden bg-slate-900/90 text-amber-300 border border-amber-400/50 font-bold px-2.5 py-1 rounded text-[11px]";
                        b.innerHTML = '<i class="fa-solid fa-hand-pointer mr-1"></i>點此啟用單指3D旋轉';
                    }
                });
            });
        });

        // =========================================================================
        // 9. 新增 CRO 模組一：散水盤除苔 ＆ 水塔精洗 Before / After 互動拖曳對比器
        // =========================================================================
        const baRange = document.getElementById('baSliderInput');
        const baBeforeClip = document.getElementById('baBeforeClip');
        const baHandle = document.getElementById('baHandle');
        if (baRange && baBeforeClip && baHandle) {
            const updateBaSlider = (val) => {
                const pct = Math.max(5, Math.min(95, Number(val)));
                baBeforeClip.style.width = pct + '%';
                baHandle.style.left = pct + '%';
            };
            baRange.addEventListener('input', (e) => updateBaSlider(e.target.value));
            baRange.addEventListener('change', (e) => updateBaSlider(e.target.value));
            updateBaSlider(baRange.value || 50);
        }

        // =========================================================================
        // 10. 新增 CRO 模組二：水塔節能省電 ＆ 14 天免費試裝效益 (ROI) 即時試算器
        // =========================================================================
        const roiRtRange = document.getElementById('roiRtRange');
        const roiHoursRange = document.getElementById('roiHoursRange');
        const roiScaleBtns = document.querySelectorAll('.roi-scale-btn');
        const roiRtPresetBtns = document.querySelectorAll('.roi-rt-preset');
        let currentScalePenalty = 0.15; // 預設 0.45mm 中度結垢約多耗電 15%
        let currentScaleLabel = "中度水垢 (~0.45mm｜額外耗電約 15%)";

        function updateRoiCalculator() {
            if (!roiRtRange || !roiHoursRange) return;
            const rt = parseInt(roiRtRange.value, 10) || 250;
            const hours = parseInt(roiHoursRange.value, 10) || 16;
            const daysPerYear = 300;
            const kwPerRt = 0.65; // 水冷式冰水主機平均每冷凍噸耗電約 0.65 kW
            const elecRate = 4.2; // 工業/商業平均電價約 NT$ 4.2 / kWh
            const co2Factor = 0.000494; // 台電電力排碳係數 0.494 kg CO2e / kWh = 0.000494 公噸

            const baseAnnualKwh = rt * kwPerRt * hours * daysPerYear;
            const savedKwh = Math.round(baseAnnualKwh * currentScalePenalty);
            const savedNtd = Math.round(savedKwh * elecRate);
            const savedCo2 = (savedKwh * co2Factor).toFixed(1);

            // 自動推薦對應文丘里型號與配置
            let recModel = 'HC-125S（5"×2支｜雙分管太陽能旗艦版）';
            if (rt <= 175) {
                recModel = 'HC-100S（4"×2支｜良機 125~175 RT 雙分管太陽能旗艦版）';
            } else if (rt <= 275) {
                recModel = 'HC-125S（5"×2支｜良機 200~250 RT 雙分管太陽能旗艦版）';
            } else if (rt <= 375) {
                recModel = 'HC-125L（5"×4支增速｜良機 300~350 RT 四分管四路平衡版）';
            } else if (rt <= 550) {
                recModel = 'HC-125S（5"×4支｜良機 400~500 RT 四分管四路平衡版）';
            } else {
                recModel = 'HC-150S（6"×4支｜良機 600~800 RT 大型四路平衡旗艦版）';
            }

            const elRtVal = document.getElementById('roiRtValue');
            const elHoursVal = document.getElementById('roiHoursValue');
            const elSavedNtd = document.getElementById('roiSavedNtd');
            const elSavedKwh = document.getElementById('roiSavedKwh');
            const elSavedCo2 = document.getElementById('roiSavedCo2');
            const elRecModel = document.getElementById('roiRecModel');

            if (elRtVal) elRtVal.textContent = `${rt} RT`;
            if (elHoursVal) elHoursVal.textContent = `每日 ${hours} 小時`;
            if (elSavedNtd) elSavedNtd.textContent = `NT$ ${savedNtd.toLocaleString()}`;
            if (elSavedKwh) elSavedKwh.textContent = `${savedKwh.toLocaleString()} 度/年`;
            if (elSavedCo2) elSavedCo2.textContent = `${savedCo2} 公噸 CO₂e`;
            if (elRecModel) elRecModel.textContent = recModel;
        }

        if (roiRtRange && roiHoursRange) {
            roiRtRange.addEventListener('input', updateRoiCalculator);
            roiHoursRange.addEventListener('input', updateRoiCalculator);
            roiRtPresetBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    roiRtRange.value = btn.getAttribute('data-rt');
                    updateRoiCalculator();
                });
            });
            roiScaleBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    currentScalePenalty = parseFloat(btn.getAttribute('data-penalty')) || 0.15;
                    currentScaleLabel = btn.getAttribute('data-label') || "";
                    roiScaleBtns.forEach(b => {
                        b.className = "roi-scale-btn px-3 py-2 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-300 border border-slate-700 hover:border-teal-400";
                    });
                    btn.className = "roi-scale-btn px-3 py-2 rounded-lg text-xs font-bold transition bg-teal-500 text-slate-950 shadow";
                    updateRoiCalculator();
                });
            });

            const btnApplyRoi = document.getElementById('btnApplyRoiToForm');
            if (btnApplyRoi) {
                btnApplyRoi.addEventListener('click', () => {
                    const rt = roiRtRange.value;
                    const hours = roiHoursRange.value;
                    const recModel = document.getElementById('roiRecModel')?.textContent || '';
                    const savedNtd = document.getElementById('roiSavedNtd')?.textContent || '';
                    if (messageInput) {
                        messageInput.value = `您好，我透過官網節能試算器評估現場水塔：約 ${rt} RT（每日運轉 ${hours} 小時，工況：${currentScaleLabel}，預估維持潔淨每年可減少約 ${savedNtd} 額外耗電損耗）。推薦匹配型號為「${recModel}」，想預約水塔清洗保養與 14 天單邊散水盤免費試裝評估！`;
                    }
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                });
            }
            updateRoiCalculator();
        }

        function masterLoop() {
            if (!document.hidden && is3DSectionVisible) {
                animTick += 0.04;
                if (active3DTab === 'VENTURI') {
                    drawVenturiScene();
                } else {
                    drawSolarBoxScene();
                }
            }
            requestAnimationFrame(masterLoop);
        }


        window.addEventListener('resize', () => {
            if (active3DTab === 'VENTURI') resizeVenturiCanvas();
            else resizeBoxCanvas();
        });

        function initVenturi3DEngines() {
            resizeVenturiCanvas();
            updateVenturiUI();
            renderSolarSchematics();
            requestAnimationFrame(masterLoop);
        }
        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(initVenturi3DEngines, 20);
        } else {
            window.addEventListener("DOMContentLoaded", initVenturi3DEngines);
        }
        window.addEventListener("load", () => {
            resizeVenturiCanvas();
            resizeBoxCanvas();
        });
    
        } // end 3D canvas guard
})();
