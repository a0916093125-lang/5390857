/**
 * 皓盛有限公司 (5390857.com) - 全站單一真實資料源 (SSOT) 與同步報價預覽核心 v25.0
 * 說明：
 * 1. 集中管理全站 7 大頁面之公司登記資料、自來水塔、冷卻水塔、冷氣空調、機電馬達閥件與商城雙軌價格。
 * 2. 提供零 iframe 負擔之 window.hsBuildInlineQuoteDocument(urlHref)，於各試算子頁即時同步產出報價單 DOM。
 */
(function () {
  "use strict";

  const CONFIG = {
    version: "25.0",
    lastUpdated: "2026-11-14",
    company: {
      name: "皓盛有限公司",
      enName: "HAO SHENG CO., LTD.",
      taxId: "90221911",
      owner: "李思遠",
      phone: "0916-093-125",
      lineId: "0916093125",
      lineUrl: "https://line.me/ti/p/~0916093125",
      email: "ssuyuan@kimo.com",
      address: "11164 臺北市士林區社子里社正路45巷4弄1號1樓",
      domain: "https://5390857.com"
    },
    waterTank: {
      ton10_stainless: { priceA: 4600, priceB: 3800, multiDiscountB: 3000, hours: "工時須現場確認" },
      ton10_confined:  { priceA: 13000, priceB: 10500, hours: "工時須現場確認" },
      ton50:           { priceA: 13000, priceB: 10500, hours: "工時須現場確認" },
      ton120:          { priceA: 23000, priceB: 17500, hours: "工時須現場確認" },
      ton200:          { priceA: 27000, priceB: 24000, hours: "工時須現場確認" },
      poolSurcharge: {
        level1_3to4pools:  { priceA: 4500, priceB: 3800 },
        level2_5plusPools: { priceA: 9000, priceB: 7500 }
      }
    },
    coolingTower: {
      rt50:  { priceA: 7000,  priceB: 5500,  hours: "工時須現場確認" },
      rt150: { priceA: 13000, priceB: 10500, hours: "工時須現場確認" },
      rt350: { priceA: 23000, priceB: 17500, hours: "工時須現場確認" },
      rt500: { priceA: 27000, priceB: 24000, hours: "工時須現場確認" },
      typeSurcharge: {
        open_round:     { priceA: 0,    priceB: 0 },
        open_square:    { priceA: 1500, priceB: 1000 },
        closed_circuit: { priceA: 3000, priceB: 2500 }
      },
      multiTowerSurcharge: {
        twoTowers:   { priceA: 4500, priceB: 3800 },
        threeTowers: { priceA: 9000, priceB: 7500 }
      }
    },
    acCleaning: {
      split:    { pkgA: 12500, pkgB: 10000, unitA: 3125, unitB: 2500, inc: "含 4 台內", name: "壁掛分離式冷氣", spec: "拆洗外殼、濾網、貫流風鼓葉輪、蒸發器親水藥洗與排水管疏通。家用分離式未滿4台仍以4台計價，未使用台數可轉給隔壁鄰居家團購" },
      fcu:      { pkgA: 13000, pkgB: 10500, unitA: 3200, unitB: 2800, inc: "含 3 台內", name: "吊隱式冷氣／冰水送風機(FCU)", spec: "天花板維修孔拆洗風車葉輪、鰭片高壓藥洗、集水盤果凍淤泥抽除與浮球點檢" },
      cassette: { pkgA: 13500, pkgB: 11000, unitA: 4000, unitB: 3500, inc: "含 3 台內", name: "四方吹嵌入式卡式冷氣", spec: "拆卸四方出風面板、內建排水泵浦與浮球清潔、全方位蒸發器鰭片精洗與電流實測" },
      package:  { pkgA: 13500, pkgB: 11000, unitA: 4500, unitB: 3800, inc: "含 2 台內", name: "落地箱型冷氣(氣冷/水冷櫃機)", spec: "大型排管蒸發器高壓藥洗、雙風鼓葉輪除垢、冷凝水盤與排水管疏通" },
      ahu:      { pkgA: 15000, pkgB: 12500, unitA: 8500, unitB: 7500, inc: "單座大型機房", name: "大型中央空調箱(AHU)", spec: "多排式冰水盤管高壓除垢、大型離心風車清潔、皮帶張力校正與馬達三相電流實測" }
    },
    mpvSpecs: {
      rp258_install: {
        cat: "cat1_split_ac", comboCleanCat: "ac_cleaning", comboAcType: "split", unitName: "組",
        name: "Realise 瑞林 RP-258 冷氣排水器到府安裝＋排水管疏通（設備適配及檢查範圍於施工前確認）",
        spec: "到府安裝服務（不單售裸機）：依設備適配更換瑞林 RP-258 排水器並疏通排水管；產品性能、管路範圍與冷氣檢查項目於施工前確認。與冷氣清洗同日順換的價格依所選方案計算。",
        rangeLabel: "NT$ 3,500 起 / 組（排水管疏通及檢查範圍於施工前確認）", hours: "1.0 ~ 1.5 小時",
        tiers: {
          tier_std:   { minB: 3500, maxB: 3500, minA: 3500, maxA: 3500, qB: 3500, qA: 3500, label: "標準單台到府安裝＋通管；冷氣檢查範圍施工前確認" },
          tier_mid:   { minB: 3500, maxB: 4200, minA: 3500, maxA: 4500, qB: 3500, qA: 4200, label: "挑高天花板／長距離明管重拉配電安裝" },
          tier_heavy: { minB: 4200, maxB: 4800, minA: 4500, maxA: 5200, qB: 4500, qA: 5000, label: "大型落地箱型／多台冷氣共用大水量排水工程" }
        }
      },
      split_minor: {
        cat: "cat1_split_ac", comboCleanCat: "ac_cleaning", comboAcType: "split", unitName: "台",
        name: "分離式冷氣（室內外機）啟動/運轉電容・步進馬達・靜音排水器或軸套檢修",
        spec: "現場檢測更換耐高溫防爆啟動/運轉電容、導風板步進馬達、高揚程靜音排水器或風鼓耐溫軸套，含運轉電流實測",
        rangeLabel: "$2,500 ~ $4,500 起 / 台", hours: "1.5 ~ 2.5 小時",
        tiers: {
          tier_std:   { minB: 2500, maxB: 3200, minA: 3000, maxA: 3800, qB: 2500, qA: 3500, label: "標準壁掛/小型機" },
          tier_mid:   { minB: 3200, maxB: 3900, minA: 3800, maxA: 4600, qB: 3500, qA: 4500, label: "中大型變頻/挑高安裝" },
          tier_heavy: { minB: 3900, maxB: 4500, minA: 4600, maxA: 5500, qB: 4500, qA: 5500, label: "特殊高空/大能力商用分離式" }
        }
      },
      split_major: {
        cat: "cat1_split_ac", comboCleanCat: "ac_cleaning", comboAcType: "split", unitName: "台",
        name: "分離式冷氣（室內外機）DC/AC 風扇馬達・貫流扇風鼓總成或NSK（品牌與產地須確認） 培林更換",
        spec: "拆機更換原廠規格室內/室外風扇馬達、貫流扇風鼓葉輪或NSK／SKF（品牌及實際產地依料件確認） 精密靜音滾珠軸承（培林），檢查異音與不轉跳機的原因",
        rangeLabel: "$4,500 ~ $11,000 起 / 台", hours: "2.0 ~ 3.5 小時",
        tiers: {
          tier_std:   { minB: 4500, maxB: 5800, minA: 5500, maxA: 7000,  qB: 4500, qA: 6000,  label: "標準 2.8~5.0kW 機種" },
          tier_mid:   { minB: 5800, maxB: 7200, minA: 7000, maxA: 9000,  qB: 6500, qA: 8500,  label: "中大型 6.3~10kW 變頻機種" },
          tier_heavy: { minB: 7200, maxB: 8500, minA: 9000, maxA: 11000, qB: 8500, qA: 11000, label: "大型落地箱型/高空外牆機種" }
        }
      },
      fcu_repair: {
        cat: "cat2_ahu_fcu", comboCleanCat: "ac_cleaning", comboAcType: "fcu", unitName: "台",
        name: "商用吊隱式送風機(FCU)／四方吹 多翼式離心風鼓・雙軸送風馬達培林或電動二通閥更新",
        spec: "天花板維修孔拆卸多翼式離心風鼓（松鼠籠風車）校正更新、雙軸馬達NSK（品牌與產地須確認） 培林更換、冷凝排水器或冰水電動二通閥驅動頭更新",
        rangeLabel: "$4,500 ~ $11,000 起 / 台", hours: "2.5 ~ 4.0 小時",
        tiers: {
          tier_std:   { minB: 4500, maxB: 5800, minA: 5500, maxA: 7000,  qB: 4500, qA: 6000,  label: "標準 200~600 CFM 送風機" },
          tier_mid:   { minB: 5800, maxB: 7200, minA: 7000, maxA: 9000,  qB: 6500, qA: 8500,  label: "大型 800~1200 CFM 雙風鼓/挑高" },
          tier_heavy: { minB: 7200, maxB: 8500, minA: 9000, maxA: 11000, qB: 8500, qA: 11000, label: "特大風量/狹窄天花板全總成翻修" }
        }
      },
      ahu_overhaul: {
        cat: "cat2_ahu_fcu", comboCleanCat: "ac_cleaning", comboAcType: "ahu", unitName: "組",
        name: "大型中央空調箱(AHU)／大樓排風車傳動大修（重型連座軸承＋皮帶輪對心＋三相送風馬達）",
        spec: "依設備現況使用拔輪工具拆卸更換重型連座軸承(Pillow Block Bearing)、雷射/直尺皮帶輪平行對心、抗靜電三角皮帶更新與三相馬達絕緣電流實測（級距 $28,000~$38,000 起/組）",
        rangeLabel: "$28,000 ~ $38,000 起 / 組", hours: "4.0 ~ 6.5 小時",
        tiers: {
          tier_std:   { minB: 28000, maxB: 31000, minA: 29500, maxA: 33000, qB: 28000, qA: 30000, label: "標準 5~10HP 空調箱傳動組" },
          tier_mid:   { minB: 31000, maxB: 34500, minA: 33000, maxA: 36000, qB: 32000, qA: 35000, label: "中大型 15~25HP 空調箱連座軸承大修" },
          tier_heavy: { minB: 34500, maxB: 36500, minA: 36000, maxA: 38000, qB: 35000, qA: 38000, label: "特大型 30HP+ 重型空調箱/排風車傳動大修" }
        }
      },
      ct_sprinkler: {
        cat: "cat3_ct_drive", comboCleanCat: "cooling_tower", unitName: "組",
        name: "冷卻水塔旋轉播水頭（散水頭）總成更新（中小型鋁合金至大型工業級青銅/不鏽鋼散水頭）",
        spec: "拆除中心軸承卡死之舊散水頭，換裝全新塑鋼/鋁合金或大型高噸數青銅/SUS304不鏽鋼重型旋轉播水頭總成，含散水管水平角度與水壓轉速校正（級距 $4,500~$38,000 起/組）",
        rangeLabel: "$4,500 ~ $38,000 起 / 組", hours: "2.0 ~ 4.5 小時",
        tiers: {
          tier_std:   { minB: 4500,  maxB: 8500,  minA: 5500,  maxA: 10500, qB: 4500,  qA: 6000,  label: "中小型 10~80RT 塑鋼/鋁合金散水頭" },
          tier_mid:   { minB: 12000, maxB: 20000, minA: 15000, maxA: 24000, qB: 16000, qA: 19500, label: "商空大型 100~250RT 重型鋁合金/青銅散水頭" },
          tier_heavy: { minB: 26000, maxB: 34000, minA: 30000, maxA: 38000, qB: 32000, qA: 38000, label: "工業巨型 300~500RT+ 法蘭式青銅/304不鏽鋼散水頭總成" }
        }
      },
      ct_motor_pump: {
        cat: "cat3_ct_drive", comboCleanCat: "cooling_tower", unitName: "台",
        name: "冷卻水塔散熱風機馬達／減速齒輪箱（Gear Reducer）／冰水與冷卻水循環泵軸封培林大修",
        spec: "涵蓋水塔頂部防滴型風機馬達防水培林更新、減速齒輪箱換油與油封齒輪大修、以及機房立臥式冰水/冷卻水/熱水循環大泵機械軸封與聯軸器對心校正（級距 $9,000~$98,000 起/台）",
        rangeLabel: "$9,000 ~ $98,000 起 / 台", hours: "3.5 ~ 7.0 小時",
        tiers: {
          tier_std:   { minB: 9000,  maxB: 16000, minA: 11000, maxA: 20000, qB: 9000,  qA: 12000, label: "標準 3~7.5HP 風機馬達/循環泵軸封培林檢修" },
          tier_mid:   { minB: 32000, maxB: 48000, minA: 38000, maxA: 56000, qB: 38000, qA: 45000, label: "商空大型 10~25HP 減速齒輪箱/立臥式大泵翻修" },
          tier_heavy: { minB: 68000, maxB: 88000, minA: 78000, maxA: 98000, qB: 85000, qA: 98000, label: "廠房特大 30~60HP+ 重型減速機/大馬力馬達/主循環泵吊裝大修" }
        }
      },
      pump_seal_bearing: {
        cat: "cat4_water_pump", comboCleanCat: "water_tank", unitName: "台",
        name: "社區大樓揚水（抽水）馬達／頂樓恆壓加壓泵浦 耐磨碳化矽機械軸封與滾珠培林現場搶修",
        spec: "關水洩壓拆解泵浦本體，換裝耐磨碳化矽(SiC)機械軸封處理漏水問題、更新NSK（品牌與產地須確認） 前後滾珠軸承處理異音問題，並點檢穩壓壓力桶與壓力開關",
        rangeLabel: "$5,500 ~ $13,500 起 / 台", hours: "2.5 ~ 4.0 小時",
        tiers: {
          tier_std:   { minB: 5500, maxB: 7200,  minA: 6800,  maxA: 8800,  qB: 5500,  qA: 7500,  label: "標準 1~3HP 抽水/加壓馬達軸封培林" },
          tier_mid:   { minB: 7200, maxB: 9000,  minA: 8800,  maxA: 11000, qB: 8000,  qA: 10500, label: "中型 5~7.5HP 多段離心揚水泵軸封培林" },
          tier_heavy: { minB: 9000, maxB: 10500, minA: 11000, maxA: 13500, qB: 10500, qA: 13500, label: "大型 10~15HP 高揚程聯軸式揚水泵大修" }
        }
      },
      pump_replace: {
        cat: "cat4_water_pump", comboCleanCat: "water_tank", unitName: "台",
        name: "社區大樓地下室揚水（抽水）馬達／頂樓恆壓變頻加壓泵浦 整機換新升級工程",
        spec: "舊泵吊拆清運、換裝高效靜音多段離心泵或 SUS304 不鏽鋼微電腦恆壓變頻加壓泵浦，含進出水由令/法蘭配管銜接、排氣試水與三相電流設定",
        rangeLabel: "$10,500 ~ $30,000 起 / 台", hours: "3.0 ~ 5.5 小時",
        tiers: {
          tier_std:   { minB: 10500, maxB: 14500, minA: 12500, maxA: 17500, qB: 10500, qA: 13500, label: "標準 1~2HP 恆壓加壓/抽水泵整機換新" },
          tier_mid:   { minB: 15000, maxB: 19500, minA: 18000, maxA: 23500, qB: 17500, qA: 21500, label: "中大型 3~5HP 多段不鏽鋼/變頻泵浦換新" },
          tier_heavy: { minB: 20000, maxB: 24000, minA: 24000, maxA: 30000, qB: 24000, qA: 30000, label: "大型社區 7.5~15HP 重型揚水主泵吊裝換新" }
        }
      },
      valve_2_4: {
        cat: "cat5_valves", comboCleanCat: "water_tank", unitName: "處",
        name: "2吋~4吋 蝶閥／不鏽鋼無聲逆止閥（水錘原因與改善方式另評估）／高壓防震軟管／減壓閥抽換",
        spec: "管路排空洩壓、舊閥拆卸、法蘭密封面除鏽清潔、換裝 規格待核對的 2吋~4吋蝶閥/無聲逆止閥/防震軟管、更新 EPDM 墊片與 SUS304 不鏽鋼螺栓及復水耐壓測試（級距 $11,000~$15,000 起/處）",
        rangeLabel: "$11,000 ~ $15,000 起 / 處", hours: "2.0 ~ 3.5 小時",
        tiers: {
          tier_std:   { minB: 11000, maxB: 12200, minA: 11800, maxA: 13000, qB: 11000, qA: 12000, label: "2吋~2.5吋 手柄式蝶閥/逆止閥/軟管" },
          tier_mid:   { minB: 12200, maxB: 13500, minA: 13000, maxA: 14200, qB: 12500, qA: 13800, label: "3吋 法蘭式無聲逆止閥/蝶閥/減壓閥" },
          tier_heavy: { minB: 13500, maxB: 14500, minA: 14200, maxA: 15000, qB: 14000, qA: 15000, label: "4吋 重型無聲逆止閥/齒輪蝶閥/高處管道間" }
        }
      },
      valve_6_10: {
        cat: "cat5_valves", comboCleanCat: "cooling_tower", unitName: "處",
        name: "6吋~10吋 大口徑齒輪式蝴蝶閥／無聲逆止閥吊裝抽換工程",
        spec: "現場作業安排搭配手拉吊車吊裝、拆除鏽死舊閥、換裝 6吋~10吋 FCD鑄鐵本體＋SUS304不鏽鋼蝶板重型齒輪式蝴蝶閥或無聲逆止閥，含 EPDM 墊片與 304 白鐵螺栓對角鎖固試壓（級距 $22,000~$32,000 起/處）",
        rangeLabel: "$22,000 ~ $32,000 起 / 處", hours: "3.0 ~ 5.0 小時",
        tiers: {
          tier_std:   { minB: 22000, maxB: 24500, minA: 23500, maxA: 26000, qB: 22000, qA: 24500, label: "6吋 大口徑齒輪式蝴蝶閥/逆止閥" },
          tier_mid:   { minB: 25000, maxB: 28000, minA: 26500, maxA: 29500, qB: 26000, qA: 28500, label: "8吋 重型齒輪式蝴蝶閥/無聲逆止閥吊裝" },
          tier_heavy: { minB: 28500, maxB: 31000, minA: 29500, maxA: 32000, qB: 29500, qA: 32000, label: "10吋 巨型法蘭齒輪蝶閥/逆止閥高空吊裝抽換" }
        }
      },
      ctrl_float_omron: {
        cat: "cat6_level_ctrl", comboCleanCat: "water_tank", unitName: "組",
        name: "大口徑青銅/不鏽鋼複動式浮球閥・Omron 61F-G2 液位控制器＋304電極棒或電磁接觸器搶修",
        spec: "更換水池進水複動式浮球閥、Omron 61F-G2（規格與來源待核對）液位保持繼電器、SUS304 不鏽鋼電極棒座或控制盤電磁接觸器/積熱電驛，含滿水斷電與防空轉測試",
        rangeLabel: "$3,500 ~ $8,500 起 / 組", hours: "1.5 ~ 2.5 小時",
        tiers: {
          tier_std:   { minB: 3500, maxB: 4500, minA: 4200, maxA: 5500, qB: 3500, qA: 4800, label: "標準 1吋~1.5吋 浮球閥 / 61F-G2 液位器" },
          tier_mid:   { minB: 4500, maxB: 5800, minA: 5500, maxA: 7000, qB: 5000, qA: 6500, label: "2吋 重型複動式不鏽鋼浮球閥＋304極棒全套" },
          tier_heavy: { minB: 5800, maxB: 6800, minA: 7000, maxA: 8500, qB: 6800, qA: 8500, label: "大口徑浮球閥＋控制盤電磁接觸器/積熱電驛全修" }
        }
      },
      ctrl_altitude_valve: {
        cat: "cat6_level_ctrl", comboCleanCat: "water_tank", unitName: "組",
        name: "大口徑水力定水位閥（主閥＋導閥膜片總成）或雙泵交替自動控制盤檢修更新",
        spec: "拆檢更換水塔進水大口徑水力定水位閥（主閥膜片、導閥與過濾器清洗更新）或揚水泵雙泵交替控制盤改造，檢查水塔溢流與單泵過載的原因",
        rangeLabel: "$7,500 ~ $18,500 起 / 組", hours: "2.5 ~ 4.5 小時",
        tiers: {
          tier_std:   { minB: 7500,  maxB: 9800,  minA: 8800,  maxA: 11500, qB: 7500,  qA: 9500,  label: "2吋~2.5吋 定水位閥導閥膜片總成檢修" },
          tier_mid:   { minB: 10000, maxB: 12800, minA: 11800, maxA: 15000, qB: 11500, qA: 14000, label: "3吋~4吋 水力定水位閥整組更新或雙泵控制盤翻修" },
          tier_heavy: { minB: 13000, maxB: 15000, minA: 15000, maxA: 18500, qB: 15000, qA: 18500, label: "6吋 大口徑法蘭定水位閥總成抽換＋全盤電控改造" }
        }
      }
    },
    shopProducts: {
      rp258DrainPump: {
        sku: "HS-RP258-INSTALL",
        name: "Realise 瑞林 RP-258 分離式冷氣自動排水器（型號及馬達規格待核對）連工帶料到府安裝專案",
        standaloneInstallPrice: 3500,
        comboWithAcCleanPriceA: 2500,
        comboWithAcCleanPriceB: 2200,
        sellHardwareOnly: false,
        note: "沿用到府安裝與合併方案試算金額，不單售裸機。設備適配、施工與檢查範圍須現場確認。"
      },
      chlorineTablet25kg: {
        sku: "HS-TCCA90-25KG",
        name: "25公斤 TCCA 氯錠（實際用途與標示待確認）",
        productPrice: 2900,
        freightPerBucket: 500,
        shippedPrice: 3400,
        withServiceTruckPrice: 2900,
        freeShippingService: "cooling_tower",
        sellHardwareOnly: true,
        note: "氯錠每桶 $2,900，運費每桶 $500；單購每桶 $3,400，僅搭配空調冷卻水塔清洗免運。庫存、產品標示、安全資料、用途及配送承運條件須另行確認，不可逕用於飲用水儲水設備。"
      }
    },
    addons: {
      pvcValve2Inch:    { priceA: 3800,  priceB: 3500 },
      omron61FG2:       { priceA: 4500,  priceB: 4200 },
      valve2To4Inch:    { priceA: 12500, priceB: 11000 },
      butterfly6To10:   { priceA: 25000, priceB: 22000 },
      coolingFill:      { priceA: 8500,  priceB: 7500 },
      ctSprinklerAddon: { priceA: 6000,  priceB: 4500 },
      tecoInverter:     { priceA: 4500,  priceB: 4200 },
      sgsLabTest:       { priceA: 3500,  priceB: 3000 },
      chlorine25kg:     { standalonePrice: 3400, productPrice: 2900, freightPerBucket: 500, withServicePrice: 2900, freeShippingService: "cooling_tower" },
      acDrainPump:      { priceA: 2500,  priceB: 2200, standaloneA: 3500, standaloneB: 3500 },
      acOutdoorWash:    { priceA: 2000,  priceB: 1600 },
      acSteamOzone:     { priceA: 1800,  priceB: 1500 },
      mpvElecContactor: { priceA: 3500,  priceB: 2800 },
      mpvUrgent24H:     { priceA: 4500,  priceB: 3500 }
    }
  };

  window.HS_PRICING_CONFIG = CONFIG;

  function escapeHtml(rawStr) {
    if (rawStr === null || rawStr === undefined) return "";
    return String(rawStr)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clampNum(val, min, max, fallback) {
    if (val === null || val === undefined) return fallback;
    if (typeof val === "string" && val.trim() === "") return fallback;
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
  }

  function computeVerifyHash(cat, itemCount, totalA, totalB, includeTax) {
    const payload = [
      String(cat || "wt"),
      String(itemCount || 0),
      String(totalA || 0),
      String(totalB || 0),
      includeTax ? "T1" : "T0",
      "HS90221911"
    ].join("|");
    let hash = 2166136261;
    for (let i = 0; i < payload.length; i++) {
      hash ^= payload.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  }

  function toUpperCurrency(amount) {
    const num = Math.max(0, Math.round(Number(amount) || 0));
    if (num === 0) return "新臺幣零元整";
    const digits = ["零", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖"];
    const units = ["", "拾", "佰", "仟"];
    const bigUnits = ["", "萬", "億"];
    function groupToText(g) {
      let res = "";
      let zeroFlag = false;
      for (let i = 3; i >= 0; i--) {
        const d = Math.floor(g / Math.pow(10, i)) % 10;
        if (d === 0) {
          if (res.length > 0) zeroFlag = true;
        } else {
          if (zeroFlag) { res += "零"; zeroFlag = false; }
          res += digits[d] + units[i];
        }
      }
      return res;
    }
    let remain = num;
    const groups = [];
    while (remain > 0) {
      groups.push(remain % 10000);
      remain = Math.floor(remain / 10000);
    }
    let out = "";
    for (let idx = groups.length - 1; idx >= 0; idx--) {
      const g = groups[idx];
      if (g === 0) {
        if (out.length > 0 && idx > 0 && groups[idx - 1] > 0 && !out.endsWith("零")) {
          out += "零";
        }
      } else {
        if (out.length > 0 && g < 1000 && !out.endsWith("零")) {
          out += "零";
        }
        out += groupToText(g) + (bigUnits[idx] || "");
      }
    }
    out = out.replace(/零+/g, "零").replace(/零$/, "");
    return "新臺幣" + out + "元整";
  }

  function parseUrlToQuoteState(urlHref) {
    const u = new URL(urlHref, window.location.href);
    const p = u.searchParams;
    const from = p.get("from") || "water-tank";
    const st = {
      displayMode: p.get("dmode") || "ab_compare",
      cat: p.get("cat") || "water_tank",
      region: p.get("reg") || "台北市 / 新北市",
      wtTon: 120, wtMat: "concrete", wtPools: 0,
      ctRt: 100, ctType: "open_round", ctCount: 0,
      acType: "cassette", acQty: "base",
      chkAddMpv: false, mpvSpec: "split_major", mpvTier: "tier_std", mpvQty: 1,
      shopMode: "", shopQty: 1,
      chkPvc: false, chkLevel: false, chkButterfly: false, chkFill: false,
      chkCtSprinkler: false, chkInverter: false, chkSgs: false, chkChlorine25kg: false,
      chkAcDrain: false, chkAcRepair: false, chkAcOutdoor: false, chkAcSteam: false,
      chkValve24: false, chkMpvElec: false, chkMpvUrgent: false,
      includeTax: p.get("tax") !== null ? p.get("tax") === "1" : true
    };

    if (from === "water-tank") {
      st.wtTon = clampNum(p.get("ton") || 120, 10, 500, 120);
      st.wtMat = p.get("mat") || "concrete";
      st.wtPools = clampNum(p.get("pools") || 0, 0, 2, 0);
      st.chkPvc = p.get("pvc") === "1";
      st.chkValve24 = p.get("v24") === "1";
      if (p.get("wtpump") === "1") {
        st.chkAddMpv = true; st.mpvSpec = "pump_seal_bearing"; st.mpvTier = "tier_std";
      }
      st.chkButterfly = p.get("bf") === "1";
      st.chkLevel = p.get("lvl") === "1";
      st.chkSgs = p.get("sgs") === "1";
      st.chkChlorine25kg = p.get("cl25") === "1";
      if (st.cat === "both" || st.cat === "all_three") {
        st.ctRt = 50; st.ctType = "open_round"; st.ctCount = 0;
      }
      if (st.cat === "wt_ac" || st.cat === "all_three") {
        st.acType = "split"; st.acQty = "base";
      }
    } else if (from === "cooling-tower") {
      st.cat = p.get("cat") || "cooling_tower";
      st.ctRt = clampNum(p.get("rt") || 100, 10, 1000, 100);
      st.ctType = p.get("type") || "open_round";
      st.ctCount = clampNum(p.get("cnt") || 0, 0, 2, 0);
      st.chkFill = p.get("fill") === "1";
      st.chkCtSprinkler = p.get("ctspr") === "1";
      if (p.get("ctmot") === "1") {
        st.chkAddMpv = true; st.mpvSpec = "ct_motor_pump"; st.mpvTier = "tier_std";
      }
      st.chkButterfly = p.get("bf") === "1";
      st.chkPvc = p.get("pvc") === "1";
      st.chkInverter = p.get("inv") === "1";
      st.chkSgs = p.get("sgs") === "1";
      st.chkChlorine25kg = p.get("cl25") === "1";
      if (st.cat === "ct_ac") { st.acType = "cassette"; st.acQty = "base"; }
    } else if (from === "ac-cleaning") {
      st.cat = p.get("cat") || "ac_cleaning";
      st.acType = p.get("actype") || "cassette";
      st.acQty = p.get("acqty") || "base";
      st.chkAcDrain = p.get("acdrain") === "1";
      st.chkAcRepair = p.get("acmpv") === "1";
      st.chkAcOutdoor = p.get("acout") === "1";
      st.chkAcSteam = p.get("acsteam") === "1";
    } else if (from === "motor-pump-valve") {
      st.cat = p.get("cat") || "mpv_repair";
      st.chkAddMpv = true;
      st.mpvSpec = p.get("mpvspec") || "split_major";
      st.mpvTier = p.get("mpvtier") || "tier_std";
      st.mpvQty = clampNum(p.get("mpvqty") || 1, 1, 10, 1);
      if (p.get("actype")) st.acType = p.get("actype");
      st.chkMpvUrgent = p.get("mpvurg") === "1";
      st.chkMpvElec = p.get("mpvelec") === "1";
    } else if (from === "shop") {
      const rawMode = p.get("shopmode") || "rp258_standalone";
      st.shopMode = rawMode === "rp258_combo" ? "rp258_with_ac" : (rawMode === "chlorine_ct_combo" ? "chlorine_with_ct" : rawMode);
      st.shopQty = clampNum(p.get("qty") || 1, 1, 20, 1);
      if (st.shopMode === "rp258_standalone") {
        st.cat = "mpv_repair"; st.chkAddMpv = true; st.mpvSpec = "rp258_install"; st.mpvTier = "tier_std"; st.mpvQty = 1;
      } else if (st.shopMode === "rp258_with_ac") {
        st.cat = "ac_cleaning"; st.acType = "split"; st.acQty = "base"; st.chkAcDrain = true;
      } else if (st.shopMode === "chlorine_only") {
        st.cat = "shop_chlorine"; st.chkChlorine25kg = true;
      } else if (st.shopMode === "chlorine_with_ct") {
        st.cat = "cooling_tower"; st.ctRt = 100; st.ctType = "open_round"; st.ctCount = 0; st.chkChlorine25kg = true;
      } else if (st.shopMode === "chlorine_with_wt") {
        st.cat = "water_tank"; st.wtTon = 120; st.wtMat = "concrete"; st.wtPools = 0; st.chkChlorine25kg = true;
      } else if (st.shopMode === "both_shop_items") {
        st.cat = "mpv_repair"; st.chkAddMpv = true; st.mpvSpec = "rp258_install"; st.mpvTier = "tier_std"; st.mpvQty = 1; st.chkChlorine25kg = true;
      }
    }
    return st;
  }

  window.hsBuildInlineQuoteDocument = function (urlHref) {
    const st = parseUrlToQuoteState(urlHref);
    const cat = st.cat;
    const isWt = (cat === "water_tank" || cat === "both" || cat === "wt_ac" || cat === "all_three");
    const isCt = (cat === "cooling_tower" || cat === "both" || cat === "ct_ac" || cat === "all_three");
    const isAc = (cat === "ac_cleaning" || cat === "wt_ac" || cat === "ct_ac" || cat === "all_three");
    const isMpvStandalone = (cat === "mpv_repair");
    const isMpv = isMpvStandalone || st.chkAddMpv;
    const isShopInstall = st.shopMode === "rp258_standalone" || st.shopMode === "both_shop_items";
    const items = [];

    if (isWt) {
      let pA = CONFIG.waterTank.ton120.priceA, pB = CONFIG.waterTank.ton120.priceB;
      let desc = "清洗範圍、消毒方式與檢驗項目依設備用途、產品標示及現場條件確認；入槽作業須另評估人員、監視、通風與氣體測定需求";
      if (st.wtTon <= 10) {
        if (st.wtMat === "stainless") {
          pA = CONFIG.waterTank.ton10_stainless.priceA; pB = CONFIG.waterTank.ton10_stainless.priceB;
          desc = st.wtPools === 0
            ? "開放式白鐵水塔、已確認全程不入槽之清洗方案；若需入槽、出入受限或通風條件有疑慮，本試算不適用，須另評估作業配置與費用"
            : "10噸內開放式白鐵水塔基本清洗（限已確認全程不入槽；需入槽者另評估，跨棟多顆移機費另列於次項）";
        } else {
          pA = CONFIG.waterTank.ton10_confined.priceA; pB = CONFIG.waterTank.ton10_confined.priceB;
          desc = st.wtMat === "frp"
            ? "10噸內FRP組合水塔清洗；是否入槽、空間條件、作業資格及安全配置須另依現場確認"
            : "10噸內RC水泥蓄水池清洗；是否入槽、空間條件、作業資格及安全配置須另依現場確認";
        }
      } else if (st.wtTon <= 50) {
        pA = CONFIG.waterTank.ton50.priceA; pB = CONFIG.waterTank.ton50.priceB;
      } else if (st.wtTon <= 120) {
        pA = CONFIG.waterTank.ton120.priceA; pB = CONFIG.waterTank.ton120.priceB;
      } else {
        pA = CONFIG.waterTank.ton200.priceA; pB = CONFIG.waterTank.ton200.priceB;
        desc += "（停水與作業時段依現場確認）";
      }
      const matLabel = st.wtMat === "stainless" ? "SUS304不鏽鋼塔" : (st.wtMat === "frp" ? "FRP組合水塔" : "RC水泥上下蓄水池");
      items.push({ title: "自來水塔與蓄水池高壓清洗消毒（約 " + st.wtTon + " 噸級）", spec: matLabel + "｜" + desc, unit: "1 式", priceA: pA, priceB: pB });
      if (st.wtPools === 1) {
        items.push({ title: "雙棟或分區連通水池跨棟移機作業費（共 3~4 池）", spec: "雙套沉水泵浦、高壓機具與水帶跨棟移設及分池排氣復歸", unit: "1 式", priceA: 4500, priceB: 3800 });
      } else if (st.wtPools === 2) {
        items.push({ title: "大型多棟社區連通水池分棟輪洗作業費（5 池以上）", spec: "分棟分池停水與抽排方式須依現場管路條件確認", unit: "1 式", priceA: 9000, priceB: 7500 });
      }
      items.push({ title: "【洽詢項目】給水設備檢查與水質量測", spec: "可洽詢餘氯、pH、TDS 與給水設備檢查；方法及費用另行確認，現場指標不能單獨證明飲用水安全", unit: "1 式", priceA: 0, priceB: 0, isFreeGift: true });
    }

    if (isCt) {
      let ctA = 13000, ctB = 10500;
      if (st.ctRt <= 50) { ctA = 7000; ctB = 5500; }
      else if (st.ctRt <= 150) { ctA = 13000; ctB = 10500; }
      else if (st.ctRt <= 350) { ctA = 23000; ctB = 17500; }
      else { ctA = 27000; ctB = 24000; }
      const sur = CONFIG.coolingTower.typeSurcharge[st.ctType] || CONFIG.coolingTower.typeSurcharge.open_round;
      ctA += sur.priceA; ctB += sur.priceB;
      const driveTxt = st.ctRt >= 200
        ? "減速齒輪箱(Gear Reducer)/多溝皮帶與Y型過濾器點檢、三相電流實測"
        : "風機皮帶張力/軸承點檢、底盤吸水濾網清洗與三相電流實測";
      const specDetail = st.ctType === "closed_circuit"
        ? "密閉式冷卻水塔｜含風機與噴淋泵 LOTO 斷電掛牌、內循環熱交換銅管/不鏽鋼盤管定壓除垢沖洗、噴淋嘴疏通、底盤吸泥與" + driveTxt
        : (st.ctType === "open_square"
          ? "方型低噪音開放式水塔｜含風機 LOTO 斷電掛牌、雙側重力播水盆與散水孔疏通、低壓大流量扇形水刀定壓沖洗（依材質與現況選擇工法）、底盤吸泥與" + driveTxt
          : "良機/跨廠牌圓型開放式水塔｜含風機 LOTO 斷電掛牌、頂部旋轉播水頭與散水管疏通、低壓大流量扇形水刀定壓沖洗（依材質與現況選擇工法）、底盤吸泥與" + driveTxt);
      items.push({ title: "商用空調冷卻水塔深度清洗保養（約 " + st.ctRt + " RT 冷凍噸）", spec: specDetail, unit: "1 式", priceA: ctA, priceB: ctB });
      if (st.ctCount === 1) {
        items.push({ title: "雙座並聯冷卻水塔分批隔離輪洗作業費（共 2 座）", spec: "依閥件隔離、剩餘散熱容量與運轉負載評估分塔輪洗；停機及降載安排須於施工前確認，不保證供冷不中斷", unit: "1 式", priceA: 4500, priceB: 3800 });
      } else if (st.ctCount === 2) {
        items.push({ title: "三座以上大型冷卻水塔群分批輪洗作業費（3 座以上）", spec: "多座水塔分階段隔離保養與水路平衡復歸", unit: "1 式", priceA: 9000, priceB: 7500 });
      }
    }

    if (isAc) {
      const acCfg = CONFIG.acCleaning[st.acType] || CONFIG.acCleaning.cassette;
      const extraCnt = /^add_([1-9][0-9]?|100)$/.test(st.acQty) ? Number(st.acQty.slice(4)) : 0;
      items.push({
        title: acCfg.name + "深層拆洗保養專案包套（機電專車・" + acCfg.inc + "）",
        spec: "技術人員（配置與資格於派工前確認）出勤｜LOTO斷電與電腦板防水保護（依設備現況確認）、" + acCfg.spec,
        unit: "1 式", priceA: acCfg.pkgA, priceB: acCfg.pkgB
      });
      if (extraCnt > 0) {
        items.push({
          title: acCfg.name + "同案場追加清洗台數（追加 " + extraCnt + " 台）",
          spec: "同趟工程車連續施作追加台數（每台 A:$" + acCfg.unitA.toLocaleString() + " / B:$" + acCfg.unitB.toLocaleString() + "）",
          unit: extraCnt + " 台", priceA: extraCnt * acCfg.unitA, priceB: extraCnt * acCfg.unitB
        });
      }
    }

    if (isMpv) {
      const mCfg = CONFIG.mpvSpecs[st.mpvSpec] || CONFIG.mpvSpecs.split_major;
      const tCfg = mCfg.tiers[st.mpvTier] || mCfg.tiers.tier_std;
      const mQty = isShopInstall ? st.shopQty : st.mpvQty;
      const disc = mQty >= 2 ? 0.90 : 1;
      const pA = isShopInstall ? 3500 * mQty : Math.round(tCfg.qA * mQty * disc);
      const pB = isShopInstall ? 3500 * mQty : Math.round(tCfg.qB * mQty * disc);
      const prefix = isMpvStandalone ? "【機電檢修】" : "【機電檢修・清洗同日順修】";
      items.push({
        title: prefix + mCfg.name + "（" + tCfg.label + "｜基準級距 " + mCfg.rangeLabel + "）",
        spec: mCfg.spec + (!isShopInstall && mQty >= 2 ? "｜同項維修滿2件，全部維修件數打9折（不含其他加購或清洗費）" : "") + (isMpvStandalone ? "" : "｜與清洗保養工程同日施作，檢測與出工費另確認"),
        unit: mQty + " " + mCfg.unitName, priceA: pA, priceB: pB
      });
      if (isMpvStandalone) {
        items.push({ title: "【另行洽詢】機電技術人員儀器查修 ＋ 三相電流／絕緣阻抗實測驗收（範圍待確認）", spec: "檢測與出工費另確認｜含 LOTO 斷電掛牌、三用電錶/鉤錶/高阻計實測；後續服務條件另行確認", unit: "1 式", priceA: 0, priceB: 0, isFreeGift: true });
      }
    }

    if ((isWt || isCt) && st.chkPvc) items.push({ title: "2 吋內進水／冷卻塔補給水 PVC 球閥與青銅浮球閥更新工程", spec: "含舊閥拆卸、南亞 PVC 雙由令球閥或重型青銅浮球閥換裝與止水測試", unit: "1 組", priceA: 3800, priceB: 3500 });
    if (isWt && st.chkLevel && !(isMpv && st.mpvSpec === "ctrl_float_omron")) items.push({ title: "Omron 61F-G2 液位控制器 ＋ SUS304 電極棒整組更新", spec: "Omron 61F-G2（規格待核對）控制器、保持器、304 不鏽鋼電極棒(E1~E3)與高低水位連動測試", unit: "1 組", priceA: 4500, priceB: 4200 });
    if ((isWt || isCt) && st.chkButterfly && !(isMpv && st.mpvSpec === "valve_6_10")) items.push({ title: "大口徑 6吋~10吋 FCD/SUS304 齒輪式蝴蝶閥／無聲逆止閥抽換（級距 $22,000~$32,000起）", spec: "鑄鐵/不鏽鋼本體＋304蝶板＋重型齒輪箱、EPDM 法蘭墊片與304白鐵螺栓連工帶料吊裝試壓", unit: "1 處", priceA: 25000, priceB: 22000 });
    if (isCt && st.chkFill) items.push({ title: "冷卻水塔 PVC 散熱材（膠片填料）局部除垢與更新工程", spec: "清除嚴重鈣化脆化散熱膠片並換裝高親水性耐溫 PVC 散熱填料", unit: "1 式", priceA: 8500, priceB: 7500 });
    if (isCt && st.chkCtSprinkler && !(isMpv && st.mpvSpec === "ct_sprinkler")) items.push({ title: "【機電檢修・清洗同日順修】冷卻水塔旋轉播水頭（散水頭）總成更新（級距 $4,500~$38,000起）", spec: "與冷卻水塔保養同日施作檢測與出工費另確認｜拆除中心軸承卡死舊散水頭、換裝全新旋轉播水頭總成並校正散水管水平角度", unit: "1 組", priceA: 6000, priceB: 4500 });
    if (isCt && st.chkInverter) items.push({ title: "東元（TECO F510）變頻器節能參數調校與溫控連動檢測", spec: "回水溫控頻率曲線最佳化、馬達絕緣測試與過載保護點檢", unit: "1 式", priceA: 4500, priceB: 4200 });
    if ((isWt || isCt) && st.chkSgs) items.push({ title: "水質送驗需求（實驗室、測項與安排另確認）", spec: "採樣方法、檢驗項目、受託機構與報告形式須依用途先行確認；本試算不代表水質已合格或可直接飲用", unit: "1 式", priceA: 3500, priceB: 3000 });
    if (cat === "shop_chlorine") {
      items.push({ title: "工業級 90% TCCA 氯錠（用途與標示待確認）（25 公斤原裝密封大桶）", spec: "25kg TCCA 氯錠單購每桶 $3,400（商品 $2,900＋運費 $500／桶）；實際標示、用途、安全資料及承運條件待確認，不可逕用於飲用水設備", unit: st.shopQty + " 桶(25kg)", priceA: 3400 * st.shopQty, priceB: 3400 * st.shopQty });
      items.push({ title: "【洽詢項目】水系統與藥劑使用條件評估", spec: "檢查範圍及費用待確認；投藥須依產品標示、水質及現場條件由專業人員評估，不能僅依設備 RT 決定", unit: "1 式", priceA: 0, priceB: 0, isFreeGift: true });
    }
    if (cat !== "shop_chlorine" && st.chkChlorine25kg) {
      items.push({
        title: isCt ? "【搭配空調冷卻水塔清洗免運】工業級 90% TCCA 氯錠（用途與標示待確認）（25公斤大桶裝）" : "工業級 90% TCCA 氯錠（用途與標示待確認）（25公斤大桶裝｜每桶商品 $2,900＋運費 $500）",
        spec: isCt ? "搭配空調冷卻水塔清洗每桶 $2,900，免運費；產品用途及承運條件須確認，不表示可用於飲用水設備" : "單購每桶 $3,400（商品 $2,900＋運費 $500／桶），不因排程改變；產品標示、用途、安全資料及配送條件另行確認",
        unit: st.shopQty + " 桶(25kg)", priceA: (isCt ? 2900 : 3400) * st.shopQty, priceB: (isCt ? 2900 : 3400) * st.shopQty
      });
    }
    if (isAc && st.chkAcDrain && !(isMpv && st.mpvSpec === "rp258_install")) {
      const q = st.shopMode === "rp258_with_ac" ? st.shopQty : 1;
      items.push({ title: "【洗冷氣同日順換現折 $1,000】Realise 瑞林 RP-258 冷氣自動排水器換新＋排水管高壓疏通", spec: "單獨到府安裝價 $3,500；冷氣清洗同日順換依所選方案計價。更換瑞林 RP-258 排水器並疏通排水管，設備適配、產品性能與施工範圍於施工前確認。", unit: q + " 組", priceA: 2500 * q, priceB: 2200 * q });
    }
    if (isAc && st.chkAcRepair) items.push({ title: "【冷氣清洗同日加購】風鼓異音／馬達培林／啟動電容或 FCU 二通閥順修", spec: "依冷氣清洗頁原加購項目帶入；不等同 AHU 大修或整組機電設備更換，實際故障與工作範圍須另確認", unit: "1 式", priceA: 4500, priceB: 3500 });
    if (isAc && st.chkAcOutdoor) items.push({ title: "分離式／箱型冷氣室外機散熱鰭片高壓沖洗（4 台內）", spec: "清洗室外機冷凝器鰭片；工法、可達範圍及設備狀況須先評估，不承諾固定節電幅度", unit: "1 式", priceA: 2000, priceB: 1600 });
    if (isAc && st.chkAcSteam) items.push({ title: "冷氣蒸氣／臭氧處理需求（適用性待評估）", spec: "是否採用及作業方法須依設備、產品資料與現場安全評估；不保證除菌、除過敏原或健康效果", unit: "1 式", priceA: 1800, priceB: 1500 });
    if ((isWt || isCt || isMpv) && st.chkValve24 && !(isMpv && st.mpvSpec === "valve_2_4")) items.push({ title: "2吋~4吋 蝶閥／不鏽鋼無聲逆止閥（水錘原因與改善方式另評估）／防震軟管抽換（級距 $11,000~$15,000起）", spec: "含管路排空洩壓、舊閥拆卸、規格待核對的閥體、EPDM墊片與SUS304不鏽鋼螺栓換裝試壓", unit: "1 處", priceA: 12500, priceB: 11000 });
    if ((isMpv || isWt || isCt || isAc) && st.chkMpvElec) items.push({ title: "機電控制盤電磁接觸器／積熱電驛／啟動電容更新 ＋ 三相絕緣阻抗實測", spec: "更換老化燒熔之電磁接觸器(Magnetic Contactor)、過載積熱電驛或防爆運轉電容，並實測迴路絕緣", unit: "1 組", priceA: 3500, priceB: 2800 });
    if (isMpv && st.chkMpvUrgent) items.push({ title: "急件調度洽詢 ／ 夜間（18:00後）與例假日緊急出勤調度費", spec: "針對緊急停水、冰水機跳高壓或營業場所空調停擺，優先調度機電工程車與備品救火", unit: "1 趟", priceA: 4500, priceB: 3500 });

    let subA = 0, subB = 0;
    items.forEach(function (it) { subA += it.priceA; subB += it.priceB; });
    subA = Math.max(0, subA); subB = Math.max(0, subB);
    const taxA = st.includeTax ? Math.round(subA * 0.05) : 0;
    const taxB = st.includeTax ? Math.round(subB * 0.05) : 0;
    const totalA = subA + taxA, totalB = subB + taxB;
    const savedDiff = Math.max(0, totalA - totalB);
    const verifyHash = computeVerifyHash(cat, items.length, totalA, totalB, st.includeTax);
    const now = new Date();
    const dateStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    const refNo = "HS-PREVIEW [檢核:" + verifyHash + "]";

    const colLabels = ["項次", "工程與機電檢修項目", "施工規格與職安配置說明", "單位", "指定時間方案：指定時段專車", "平日順路方案：平日併單"];
    const rowsHtml = items.map(function (it, idx) {
      const pAStr = it.isFreeGift ? "<span style='color:#16a34a;font-weight:900;'>另行洽詢，未計入本報價</span>" : ("NT$ " + it.priceA.toLocaleString());
      const pBStr = it.isFreeGift ? "<span style='color:#16a34a;font-weight:900;'>另行洽詢，未計入本報價</span>" : ("NT$ " + it.priceB.toLocaleString());
      return "<tr role='row'>" +
        "<td role='cell' data-column-label='" + colLabels[0] + "'>" + String(idx + 1).padStart(2, "0") + "</td>" +
        "<td role='cell' data-column-label='" + colLabels[1] + "'><strong>" + escapeHtml(it.title) + "</strong></td>" +
        "<td role='cell' data-column-label='" + colLabels[2] + "'>" + escapeHtml(it.spec) + "</td>" +
        "<td role='cell' data-column-label='" + colLabels[3] + "'>" + escapeHtml(it.unit) + "</td>" +
        "<td role='cell' class='num-col' data-column-label='" + colLabels[4] + "'>" + pAStr + "</td>" +
        "<td role='cell' class='num-col' style='color:#0369a1;' data-column-label='" + colLabels[5] + "'>" + pBStr + "</td>" +
      "</tr>";
    }).join("");

    const article = document.createElement("article");
    article.id = "hs-inline-paper-document";
    article.className = "quote-paper-sheet";
    article.setAttribute("aria-label", "皓盛有限公司報價單A4預覽");
    article.setAttribute("data-density", "normal");
    article.setAttribute("data-item-count", String(items.length));
    article.innerHTML =
      "<div class='qp-header'>" +
        "<div>" +
          "<div class='qp-company-title'>皓盛有限公司 HAO SHENG CO., LTD.</div>" +
          "<div class='qp-company-sub'>統一編號：<strong>90221911</strong> ｜ 專案負責人：<strong>李思遠</strong> ｜ 聯絡專線 / LINE：<strong>0916-093-125</strong><br/>公司登記地址：<strong>臺北市士林區社子里社正路45巷4弄1號1樓</strong> ｜ 信箱：<strong>ssuyuan@kimo.com</strong> ｜ 官網：<strong>https://5390857.com</strong></div>" +
        "</div>" +
        "<div class='qp-doc-badge'><div class='qp-doc-type'>報價單</div><div style='font-size:0.67rem;color:#9a3412;line-height:1.4;margin-top:3px;'>四台團購僅限家用分離式，其他機型依原方案</div><div style='font-size:0.75rem;color:#475569;margin-top:3px;font-weight:700;'>QUOTATION</div></div>" +
      "</div>" +
      "<div class='qp-meta-grid'>" +
        "<div class='qp-meta-row'><span class='qp-meta-label'>客戶寶號：</span><span class='qp-meta-val'>待填客戶名稱</span></div>" +
        "<div class='qp-meta-row'><span class='qp-meta-label'>參考編號／日期：</span><span class='qp-meta-val'>" + escapeHtml(refNo) + " ｜ " + escapeHtml(dateStr) + "（報價單）</span></div>" +
        "<div class='qp-meta-row'><span class='qp-meta-label'>聯 絡 人：</span><span class='qp-meta-val'>待填聯絡人</span></div>" +
        "<div class='qp-meta-row'><span class='qp-meta-label'>施工案場：</span><span class='qp-meta-val'>" + escapeHtml(st.region) + "</span></div>" +
      "</div>" +
      "<div class='qp-table-wrap'><table class='qp-table' role='table'><thead role='rowgroup'><tr role='row'>" +
        "<th scope='col' role='columnheader' style='width:5%;'>" + colLabels[0] + "</th>" +
        "<th scope='col' role='columnheader' style='width:33%;'>" + colLabels[1] + "</th>" +
        "<th scope='col' role='columnheader' style='width:32%;'>" + colLabels[2] + "</th>" +
        "<th scope='col' role='columnheader' style='width:7%;'>" + colLabels[3] + "</th>" +
        "<th scope='col' role='columnheader' class='num-col' style='width:11.5%;'>" + colLabels[4] + "</th>" +
        "<th scope='col' role='columnheader' class='num-col' style='width:11.5%;'>" + colLabels[5] + "</th>" +
      "</tr></thead><tbody role='rowgroup'>" + rowsHtml + "</tbody></table></div>" +
      "<div class='qp-summary-box'><div class='qp-total-grid'>" +
        "<div class='qp-plan-card'><div class='qp-plan-title'>[A] 指定時間方案：指定時段專車專案</div><div style='font-size:0.8rem;color:#475569;'>未稅小計：NT$ " + subA.toLocaleString() + (st.includeTax ? (" ＋ 5%營業稅：NT$ " + taxA.toLocaleString()) : "（未稅，開發票另加5%）") + "</div><div class='qp-plan-price'>總計 NT$ " + totalA.toLocaleString() + " 元" + (st.includeTax ? "（含稅）" : "（未稅）") + "</div><div style='font-size:0.78rem;color:#334155;font-weight:700;'>大寫：" + escapeHtml(toUpperCurrency(totalA)) + "</div></div>" +
        "<div class='qp-plan-card' style='border-color:#0284c7;background:#f0f9ff;'><div class='qp-plan-title' style='color:#0369a1;'>[B] 平日順路方案：平日彈性併單（現省 NT$ " + savedDiff.toLocaleString() + " 元）</div><div style='font-size:0.8rem;color:#475569;'>未稅小計：NT$ " + subB.toLocaleString() + (st.includeTax ? (" ＋ 5%營業稅：NT$ " + taxB.toLocaleString()) : "（未稅，開發票另加5%）") + "</div><div class='qp-plan-price' style='color:#0284c7;'>總計 NT$ " + totalB.toLocaleString() + " 元" + (st.includeTax ? "（含稅）" : "（未稅）") + "</div><div style='font-size:0.78rem;color:#334155;font-weight:700;'>大寫：" + escapeHtml(toUpperCurrency(totalB)) + "</div></div>" +
      "</div></div>" +
      "<div class='qp-compliance-box'><div style='font-weight:900;color:#0369a1;margin-bottom:2px;font-size:0.84rem;'>施工前確認事項</div><ol style='padding-left:16px;margin:0;'><li><strong>範圍與報價</strong>：依客戶填寫的資料報價；若現場條件不同，施工前由雙方確認調整。設備、料件、施工範圍、排程、驗收、付款及保固條件由雙方確認。</li><li><strong>作業安全</strong>：進場方式、人員配置、資格與訓練、停機隔離、防墜及入槽監視、通風、氣體測定需求，須依現場風險與適用規範評估。各方依法應負的義務不因本報價而免除。</li><li><strong>清洗、水質與產品</strong>：藥劑用途、產品標示及安全資料、清洗方法與檢驗項目須先核對。工業用氯錠不可直接套用於飲用水儲水設備；餘氯、pH、TDS 等現場指標不能單獨證明飲用水安全。配送方式及承運條件另行確認。</li></ol></div>" +
      "<div class='qp-sign-grid'>" +
        "<div class='qp-stamp-box'><div style='font-weight:900;color:#0f172a;margin-bottom:4px;font-size:0.84rem;'>【方案選擇與備註】</div><div style='margin-bottom:3px;font-size:0.8rem;'>□ 選擇 <strong>指定時間方案（指定專車：NT$ " + totalA.toLocaleString() + "）</strong>，預計日期：" + now.getFullYear() + "年____月____日</div><div style='margin-bottom:8px;font-size:0.8rem;'>□ 選擇 <strong>平日順路方案（平日併單：NT$ " + totalB.toLocaleString() + "）</strong>，可洽詢平日排程</div><div style='margin-top:8px;border-top:1px solid #94a3b8;padding-top:6px;font-size:0.8rem;'>需求備註：____________________ 日期：____/____/____</div></div>" +
        "<div class='qp-stamp-box' style='display:flex;flex-direction:column;justify-content:space-between;'><div style='font-weight:900;color:#0f172a;font-size:0.84rem;'>【公司聯絡資料】</div><div style='display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0;'><div style='font-size:0.8rem;color:#334155;line-height:1.4;'>承攬商：<strong>皓盛有限公司</strong>（統編：<strong>90221911</strong>）<br/>負 責 人：<strong>李思遠</strong>（聯絡窗口）<br/>專線/LINE：<strong>0916-093-125</strong></div><div class='qp-red-stamp'>皓盛有限公司<br/>統編 90221911<br/>報價資料</div></div><div style='font-size:0.72rem;color:#475569;border-top:1px solid #cbd5e1;padding-top:4px;line-height:1.35;'><span class='qp-verify-badge'>計算參考碼：" + verifyHash + "｜僅供數值比對，不具簽章或身分驗證效力</span><br/>* 依客戶填寫的資料報價；若現場條件不同，施工前由雙方確認調整。</div></div>" +
      "</div>";
    return article;
  };
})();
