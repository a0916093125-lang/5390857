'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const context = { window: {} };
vm.runInNewContext(read('assets/pricing-config.js'), context, {
  filename: 'assets/pricing-config.js',
  timeout: 2000
});
const config = context.window.HS_PRICING_CONFIG;
const engine = read('assets/cad-engine.js');

function splitPrice(quantity, plan) {
  assert.ok(Number.isInteger(quantity) && quantity >= 1);
  const split = config.acCleaning.split;
  const isA = plan === 'A';
  assert.ok(isA || plan === 'B');
  const base = isA ? split.pkgA : split.pkgB;
  const extra = isA ? split.unitA : split.unitB;
  return base + Math.max(0, quantity - 4) * extra;
}

function chlorinePrice(quantity, service) {
  assert.ok(Number.isInteger(quantity) && quantity >= 1);
  const product = config.shopProducts.chlorineTablet25kg;
  const freeShipping = service === product.freeShippingService;
  return quantity * (product.productPrice + (freeShipping ? 0 : product.freightPerBucket));
}

test('Pricing configuration loads from the actual source file', () => {
  assert.ok(config);
  assert.equal(config.version, '24.0');
});

test('Split A package preserves four-unit base and average surcharge', () => {
  assert.equal(config.acCleaning.split.pkgA, 12500);
  assert.equal(config.acCleaning.split.unitA, 3125);
  assert.match(config.acCleaning.split.inc, /4/);
});

test('Split B package preserves four-unit base and average surcharge', () => {
  assert.equal(config.acCleaning.split.pkgB, 10000);
  assert.equal(config.acCleaning.split.unitB, 2500);
});

for (const [plan, quantity, expected] of [
  ['B', 1, 10000],
  ['B', 3, 10000],
  ['B', 4, 10000],
  ['B', 5, 12500],
  ['A', 4, 12500],
  ['A', 5, 15625],
  ['B', 6, 15000]
]) {
  test(`Split plan ${plan}: ${quantity} units => NT$ ${expected}`, () => {
    assert.equal(splitPrice(quantity, plan), expected);
  });
}

test('Chlorine prices match the locked price policy', () => {
  const product = config.shopProducts.chlorineTablet25kg;
  assert.equal(product.productPrice, 2900);
  assert.equal(product.freightPerBucket, 500);
  assert.equal(product.shippedPrice, 3400);
  assert.equal(product.withServiceTruckPrice, 2900);
  assert.equal(product.freeShippingService, 'cooling_tower');
});

for (const [quantity, service, expected] of [
  [1, 'standalone', 3400],
  [2, 'standalone', 6800],
  [3, 'standalone', 10200],
  [1, 'cooling_tower', 2900],
  [2, 'cooling_tower', 5800],
  [2, 'water_tank', 6800],
  [2, 'ac_cleaning', 6800],
  [2, 'mpv_repair', 6800]
]) {
  test(`Chlorine x${quantity}, service=${service} => NT$ ${expected}`, () => {
    assert.equal(chlorinePrice(quantity, service), expected);
  });
}

test('Chlorine prices also agree with addon pricing configuration', () => {
  const addon = config.addons.chlorine25kg;
  assert.equal(addon.productPrice, 2900);
  assert.equal(addon.freightPerBucket, 500);
  assert.equal(addon.standalonePrice, 3400);
  assert.equal(addon.withServicePrice, 2900);
  assert.equal(addon.freeShippingService, 'cooling_tower');
});

test('Repair/cooling/water-tank prices retain baseline configuration', () => {
  assert.equal(config.coolingTower.rt50.priceA, 7000);
  assert.equal(config.coolingTower.rt50.priceB, 5500);
  assert.equal(config.waterTank.ton120.priceA, 23000);
  assert.equal(config.waterTank.ton120.priceB, 17500);
  assert.equal(config.shopProducts.rp258DrainPump.standaloneInstallPrice, 3500);
  assert.equal(config.shopProducts.rp258DrainPump.comboWithAcCleanPriceA, 2500);
  assert.equal(config.shopProducts.rp258DrainPump.comboWithAcCleanPriceB, 2200);
});

test('Existing quotation engine still references central pricing', () => {
  assert.match(engine, /window\.HS_PRICING_CONFIG/);
  assert.match(engine, /function clampNumber\(/);
  assert.match(engine, /function setSelectValueSafely\(/);
});

test('Quotation draft excludes customer identity fields', () => {
  assert.match(engine, /PRIVATE_DRAFT_FIELDS\s*=\s*\[/);
  for (const field of ['clientName', 'contactPerson', 'clientAddr', 'customName']) {
    assert.ok(engine.includes('"' + field + '"'));
  }
  assert.match(engine, /function specificationOnly\(/);
});

test('Published price explanations are present on major pages', () => {
  assert.match(read('shop.html'), /單購每桶 \$3,400/);
  assert.match(read('quote.html'), /單購每桶 \$3,400/);
  assert.match(read('ac-cleaning.html'), /未滿4台仍以4台計價/);
  assert.match(read('cooling-tower.html'), /每桶2,900元免運/);
});

test('Index and sitemap retain current canonical business pages', () => {
  assert.match(read('index.html'), /<link href="https:\/\/5390857\.com\/" rel="canonical"\s*\/>/);
  const sitemap = read('sitemap.xml');
  for (const page of [
    'water-tank.html',
    'cooling-tower.html',
    'ac-cleaning.html',
    'motor-pump-valve.html',
    'shop.html',
    'quote.html'
  ]) {
    assert.ok(sitemap.includes('https://5390857.com/' + page), page);
  }
});

test('Public configuration uses registration address without exposing residential address', () => {
  const pricing = read('assets/pricing-config.js');
  assert.equal(config.company.address, '11164 臺北市士林區社子里社正路45巷4弄1號1樓');
  assert.equal((pricing.match(/address:\\s*\"/g) || []).length, 1, 'Keep a single public address in shared configuration');
  assert.match(read('index.html'), /streetAddress/);
});
