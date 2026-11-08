/**
 * 皓盛有限公司 (5390857.com) - 全站單一真實資料源 (SSOT) 雙軌定價與企業參數設定檔 v24.0
 * 說明：集中管理全站 7 大頁面之公司基本資料、自來水塔、冷卻水塔、冷氣空調、「會轉都會修」馬達閥件與「機電備品商城 (shop.html)」A/B 雙軌價格。
 * 日後調整任何價格或聯絡資訊，僅需修改本檔案即可全站同步生效。
 */
window.HS_PRICING_CONFIG = {
  version: "24.0",
  lastUpdated: "2026-11-05",
  company: {
    name: "皓盛有限公司",
    enName: "HAO SHENG CO., LTD.",
    taxId: "90221911",
    owner: "李思遠",
    phone: "0916-093-125",
    lineId: "0916093125",
    lineUrl: "https://line.me/ti/p/~0916093125",
    email: "ssuyuan@kimo.com",
    address: "11164 臺北市士林區社子里社正路45巷4弄2號（工商登記：1號1樓）",
    placeId: "ChIJ1duZi7GvQjQRUBaotvuDlVg",
    domain: "https://5390857.com"
  },
  waterTank: {
    ton10_stainless: { priceA: 4600, priceB: 3800, multiDiscountB: 3000, hours: "工時須現場確認" },
    ton10_confined:  { priceA: 13000, priceB: 10500, hours: "工時須現場確認" },
    ton50:           { priceA: 13000, priceB: 10500, hours: "工時須現場確認" },
    ton120:          { priceA: 23000, priceB: 17500, hours: "工時須現場確認" },
    ton200:          { priceA: 27000, priceB: 24000, hours: "工時須現場確認" },
    poolSurcharge: {
      level1_3to4pools: { priceA: 4500, priceB: 3800 },
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
    split:    { pkgA: 12500, pkgB: 10000, unitA: 2200, unitB: 1800, inc: "含 4 台內", name: "壁掛分離式冷氣" },
    fcu:      { pkgA: 13000, pkgB: 10500, unitA: 3200, unitB: 2800, inc: "含 3 台內", name: "吊隱式冷氣／冰水送風機(FCU)" },
    cassette: { pkgA: 13500, pkgB: 11000, unitA: 4000, unitB: 3500, inc: "含 3 台內", name: "四方吹嵌入式卡式冷氣" },
    package:  { pkgA: 13500, pkgB: 11000, unitA: 4500, unitB: 3800, inc: "含 2 台內", name: "落地箱型冷氣(氣冷/水冷櫃機)" },
    ahu:      { pkgA: 15000, pkgB: 12500, unitA: 8500, unitB: 7500, inc: "單座大型機房", name: "大型中央空調箱(AHU)" }
  },
  shopProducts: {
    rp258DrainPump: {
      sku: "HS-RP258-INSTALL",
      name: "Realise 瑞林 RP-258 分離式冷氣自動排水器（2.1kg重型蔽極式馬達）連工帶料到府安裝專案",
      standaloneInstallPrice: 3500,
      comboWithAcCleanPriceA: 2500,
      comboWithAcCleanPriceB: 2200,
      sellHardwareOnly: false,
      note: "沿用到府安裝與合併方案試算金額，不單售裸機。設備適配、施工與檢查範圍須現場確認。"
    },
    chlorineTablet25kg: {
      sku: "HS-TCCA90-25KG",
      name: "25公斤 TCCA 氯錠（原設定規格，實際用途與標示待確認）",
      shippedPrice: 3200,
      withServiceTruckPrice: 2680,
      costBase: 2000,
      freightBase: 500,
      sellHardwareOnly: true,
      note: "沿用單購 $3,200／合併方案 $2,680 試算。庫存、產品標示、安全資料、用途及配送承運條件須另行確認，不可逕用於飲用水儲水設備。"
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
    chlorine25kg:     { priceA: 3200,  priceB: 2680 },
    acDrainPump:      { priceA: 2500,  priceB: 2200, standaloneA: 3500, standaloneB: 3500 },
    acOutdoorWash:    { priceA: 2000,  priceB: 1600 },
    acSteamOzone:     { priceA: 1800,  priceB: 1500 },
    mpvElecContactor: { priceA: 3500,  priceB: 2800 },
    mpvUrgent24H:     { priceA: 4500,  priceB: 3500 }
  }
};

