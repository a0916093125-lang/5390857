(() => {
'use strict';
function initChoiceCards() {
const params = new URLSearchParams(location.search);
if (window.self !== window.top && params.get('_preview') === '1') return;
const form = document.querySelector('#water-tank-calc-form,#cooling-tower-calc-form,#ac-cleaning-calc-form,#mpv-calc-form,#shop-calc-form,#hs-quote-builder-form');
if (!form || !window.hsPendingPrice) return;
const loading = document.getElementById('hs-estimate-loading');
if (loading) loading.hidden = true;
const isQuote = form.id === 'hs-quote-builder-form';
const selects = [...form.querySelectorAll('select')];
const states = new Map();
function applicable(s) {
if (!s || s.disabled) return false;
for (let p = s.parentElement; p && p !== form; p = p.parentElement) {
if (p.hidden || p.style.display === 'none') return false;
}
return true;
}
function validImport() {
if (!isQuote) return false;
const from = params.get('from');
const regions = ['台北市 / 新北市', '桃園市 / 新竹縣市', '其他外縣市專案'];
const options = id => [...document.getElementById(id).options].map(o => o.value);
const common = { mode: ['priority_50', 'weekday_35'], reg: regions, tax: ['0', '1'] };
const rules = {
'water-tank': { ...common, cat: ['water_tank', 'both'], ton: options('q-wt-tonnage'), mat: options('q-wt-material'), pools: options('q-wt-pools') },
'cooling-tower': { ...common, cat: ['cooling_tower', 'both'], rt: options('q-ct-rt'), type: options('q-ct-type'), cnt: options('q-ct-count') },
'ac-cleaning': { ...common, cat: ['ac_cleaning'], actype: options('q-ac-type'), acqty: options('q-ac-qty') },
'motor-pump-valve': { ...common, cat: options('q-service-category'), mpvspec: options('q-mpv-spec'), mpvtier: options('q-mpv-tier'), mpvqty: options('q-mpv-qty') },
shop: { reg: regions, tax: ['0', '1'], shopmode: ['rp258_standalone', 'rp258_with_ac', 'chlorine_only', 'chlorine_with_ct', 'chlorine_with_wt', 'both_shop_items', 'rp258_combo', 'chlorine_ct_combo'], qty: options('q-shop-qty') }
};
if (from === 'share') {
const r = { dmode: options('q-display-mode'), cat: options('q-service-category'), tax: ['0', '1'] };
const map = { 'q-wt-tonnage': 'ton', 'q-wt-material': 'mat', 'q-wt-pools': 'pools', 'q-ct-rt': 'rt', 'q-ct-type': 'type', 'q-ct-count': 'cnt', 'q-ac-type': 'actype', 'q-ac-qty': 'acqty', 'q-mpv-spec': 'mpvspec', 'q-mpv-tier': 'mpvtier', 'q-mpv-qty': 'mpvqty' };
Object.entries(map).forEach(([id, key]) => {
const el = document.getElementById(id);
if (applicable(el)) r[key] = options(id);
});
rules.share = r;
}
const r = rules[from];
if (from === 'share' && r && r.mpvqty && !params.get('mpvqty')) {
  return Object.entries(r).every(([key, allowed]) => key === 'mpvqty' ? true : allowed.includes(params.get(key)));
}
return !!r && Object.entries(r).every(([key, allowed]) => allowed.includes(params.get(key)));
}
const forwarded = validImport();
if (!forwarded) {
form.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = false; });
}
const root = document.documentElement;
root.classList.add('hs-choice-enhanced');
form.classList.add('hs-choice-form');
const result = isQuote ? document.getElementById('qp-paper-sheet') : form.querySelector('.calc-result-box');
const quoteActions = isQuote ? document.getElementById('quote-actions') : null;
const layoutStatus = isQuote ? document.getElementById('qp-layout-status') : null;
const gate = document.createElement('p');
gate.className = 'hs-choice-progress';
gate.setAttribute('role', 'status');
gate.textContent = '請逐項點選符合案場的規格，完成後下方直接顯示報價單。';
form.prepend(gate);
const confirmDraftBtn = document.createElement('button');
confirmDraftBtn.type = 'button';
confirmDraftBtn.id = 'btn-confirm-loaded-draft';
confirmDraftBtn.className = 'hs-confirm-select';
confirmDraftBtn.style.marginBottom = '16px';
confirmDraftBtn.hidden = true;
confirmDraftBtn.textContent = '已核對上述載入規格無誤，立即顯示報價單';
gate.after(confirmDraftBtn);
const warning = document.createElement('p');
warning.className = 'hs-choice-warning';
warning.textContent = '選配預設不勾選，請依本次需求選取。不確定或未列出的規格，請用右下角 LINE 傳照片詢問，勿套用相近選項。';
form.prepend(warning);
const safety = document.createElement('label');
safety.className = 'calc-check-item hs-entry-check';
safety.hidden = true;
const entry = document.createElement('input');
entry.type = 'checkbox';
entry.id = 'hs-confirm-no-entry';
const entryText = document.createElement('span');
entryText.textContent = '我已確認這個 10 噸內白鐵水塔是開放式，且施工全程不入槽。未確認或需要入槽，請先詢問，不套用此價格。';
safety.append(entry, entryText);
const material = document.getElementById(isQuote ? 'q-wt-material' : 'calc-material');
if (material) material.closest('.calc-form-group').after(safety);
else form.append(safety);
let preview = null, paper = null, openLink = null, frame = null, generation = 0, timer = null, lastUrl = '', completed = false, lastExtras = '';
const extrasSignature = () => [...form.querySelectorAll('input[type=checkbox]')].map(c => c.id + ':' + c.checked).join('|');
if (!isQuote) {
if (result) result.hidden = true;
preview = document.createElement('section');
preview.className = 'hs-inline-quote no-print';
preview.hidden = true;
preview.id = 'hs-inline-quote';
preview.innerHTML = '<h2>您的報價單</h2><p class="hs-preview-note">客戶資料尚待填寫，施工條件與排程須另行確認；手機可逐項查看明細。需要加購可回上方選取，不會自動預約、列印或傳送。</p><div class="hs-inline-paper"></div><div class="btn-group" style="margin-top:12px;"><a class="btn btn-primary hs-open-quote">填寫客戶資料／下載 PDF／LINE 確認</a><button type="button" class="btn btn-outline hs-copy-subshare" style="border-color:rgba(94,234,212,0.5);color:#6ee7b7;">複製鄰居湊團購／管委會分享連結</button></div><p class="hs-preview-status" role="status"></p>';
paper = preview.querySelector('.hs-inline-paper');
openLink = preview.querySelector('.hs-open-quote');
const copyShareBtn = preview.querySelector('.hs-copy-subshare');
if (copyShareBtn) {
  copyShareBtn.addEventListener('click', () => {
    const shareHref = openLink && openLink.href ? openLink.href : location.href;
    const doneMsg = '已複製本方案報價分享連結（不含個資，傳給鄰居湊團購或委員點開即可直接檢視報價單）！';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareHref).then(() => {
        preview.querySelector('.hs-preview-status').textContent = doneMsg;
      }).catch(() => {});
    } else {
      preview.querySelector('.hs-preview-status').textContent = '分享連結：' + shareHref;
    }
  });
}
const grid = form.closest('section.grid-2');
if (grid) grid.after(preview);
else form.after(preview);
}
const shortText = s => s.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\s]+/gu, '').split(/[（(｜]/)[0].trim();
function activeStates() {
return [...states.values()].filter(st => applicable(st.select));
}
function sync(st) {
const valid = st.confirmed === st.select.value;
st.wrap.classList.toggle('is-confirmed', valid);
st.wrap.querySelectorAll('input[type=radio]').forEach(r => {
r.checked = valid && r.value === st.select.value;
});
const option = st.select.options[st.select.selectedIndex];
st.detail.textContent = valid && option ? option.textContent.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\s]+/gu, '') : '請點選一項，未選擇前不產生報價。';
}
function build(st) {
const s = st.select;
const options = [...s.options].filter(o => o.value !== '');
const signature = options.map(o => o.value + '|' + o.textContent).join('\n');
if (st.signature === signature) { sync(st); return; }
if (st.signature !== undefined) st.confirmed = null;
st.signature = signature;
st.wrap.replaceChildren();
const label = document.querySelector('label[for="' + s.id + '"]');
st.wrap.setAttribute('role', 'group');
st.wrap.setAttribute('aria-label', label ? label.textContent : s.id);
if (options.length <= 6) {
s.classList.add('hs-native-choice');
const grid = document.createElement('div');
grid.className = 'hs-choice-grid';
options.forEach(o => {
const l = document.createElement('label');
l.className = 'hs-choice-card';
const r = document.createElement('input');
r.type = 'radio';
r.name = 'hs-choice-' + s.id;
r.value = o.value;
const title = document.createElement('span');
title.textContent = shortText(o.textContent);
l.append(r, title);
grid.append(l);
r.addEventListener('change', () => {
if (!r.checked) return;
st.confirmed = o.value;
s.value = o.value;
s.dispatchEvent(new Event('change', { bubbles: true }));
});
});
st.wrap.append(grid);
} else {
s.classList.remove('hs-native-choice');
const confirm = document.createElement('button');
confirm.type = 'button';
confirm.className = 'hs-confirm-select';
confirm.textContent = '確認使用目前選項';
confirm.addEventListener('click', () => {
st.confirmed = s.value;
sync(st);
refresh(true);
});
st.wrap.append(confirm);
}
const detail = document.createElement('p');
detail.className = 'hs-choice-description';
st.detail = detail;
st.wrap.append(detail);
const unsure = document.createElement('button');
unsure.type = 'button';
unsure.className = 'hs-unsure';
unsure.textContent = '不確定／未列出';
unsure.addEventListener('click', () => {
st.confirmed = null;
sync(st);
refresh(false);
gate.textContent = '此項規格尚未確認，暫不產生報價。請透過右下角 LINE 傳照片詢問。';
});
st.wrap.append(unsure);
sync(st);
}
selects.forEach(s => {
const wrap = document.createElement('div');
wrap.className = 'hs-choice-control';
s.after(wrap);
const st = { select: s, wrap, confirmed: forwarded ? s.value : null, signature: undefined, detail: null };
states.set(s.id, st);
build(st);
});
function needsEntry() {
const ton = document.getElementById(isQuote ? 'q-wt-tonnage' : 'calc-tonnage');
const mat = document.getElementById(isQuote ? 'q-wt-material' : 'calc-material');
return !!(ton && mat && applicable(ton) && ton.value === '10' && mat.value === 'stainless' && states.get(ton.id)?.confirmed && states.get(mat.id)?.confirmed);
}
function invalidate() {
generation++;
clearTimeout(timer);
if (frame) { frame.remove(); frame = null; }
if (preview) preview.hidden = true;
if (isQuote) {
if (result) result.hidden = true;
if (quoteActions) quoteActions.hidden = true;
if (layoutStatus) layoutStatus.hidden = true;
const live = document.getElementById('qp-live-summary-bar');
if (live) live.hidden = true;
}
}
function renderPreview(scroll) {
const detail = {};
form.dispatchEvent(new CustomEvent('hs:quote-request', { detail }));
if (!detail.url) {
gate.textContent = '報價功能尚未載入，請重新整理後再試。';
return;
}
const url = new URL(detail.url, location.href);
url.hash = 'qp-paper-sheet';
if (needsEntry() && entry.checked) url.searchParams.set('noentry', '1');
openLink.href = url.href;
if (url.href === lastUrl && paper.children.length) {
preview.hidden = false;
return;
}
lastUrl = url.href;
const statusEl = preview.querySelector('.hs-preview-status');
if (typeof window.hsBuildInlineQuoteDocument === 'function') {
try {
const docNode = window.hsBuildInlineQuoteDocument(url.href);
paper.replaceChildren(docNode);
preview.hidden = false;
statusEl.textContent = '更改上方選項，報價單會即時同步更新。';
if (scroll) {
preview.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
return;
} catch (_) {}
}
const token = ++generation;
paper.replaceChildren();
preview.hidden = false;
statusEl.textContent = '正在產生報價單…';
frame = document.createElement('iframe');
frame.className = 'hs-quote-render-frame';
frame.title = '報價單計算';
frame.setAttribute('aria-hidden', 'true');
frame.tabIndex = -1;
url.searchParams.set('_preview', '1');
frame.src = url.href;
frame.addEventListener('load', () => {
if (token !== generation) return;
try {
const doc = frame.contentDocument;
const source = doc && doc.getElementById('qp-paper-sheet');
if (!source || !source.querySelector('#qp-table-tbody tr')) throw Error('no quote');
const clone = source.cloneNode(true);
clone.id = 'hs-inline-paper-document';
clone.hidden = false;
paper.replaceChildren(clone);
statusEl.textContent = '更改上方選項，報價單會同步更新。';
frame.remove();
frame = null;
if (scroll) {
preview.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
} catch (e) {
statusEl.textContent = '預覽暫時無法載入，可按上方按鈕開啟完整報價單。';
}
});
document.body.append(frame);
}
function refresh(user) {
states.forEach(build);
lastExtras = extrasSignature();
const active = activeStates();
const pending = active.filter(st => st.confirmed !== st.select.value);
const needs = needsEntry();
safety.hidden = !needs;
const ready = !pending.length && (!needs || entry.checked);
if (ready) confirmDraftBtn.hidden = true;
gate.textContent = ready
? '規格已選好，下方為依您選項產生的報價單。'
: ('已確認 ' + (active.length - pending.length) + '／' + active.length + ' 項' + (needs && !entry.checked ? '，請確認是否全程不入槽。' : '，完成後直接顯示報價單。'));
if (!ready) { completed = false; invalidate(); return; }
const pendingPrice = window.hsPendingPrice?.();
if (pendingPrice) { completed = false; invalidate(); gate.textContent = pendingPrice; return; }
const first = !completed;
completed = true;
if (isQuote) {
if (result) result.hidden = false;
if (quoteActions) quoteActions.hidden = false;
if (layoutStatus) layoutStatus.hidden = false;
const live = document.getElementById('qp-live-summary-bar');
if (live) live.hidden = false;
if (first && user && result) result.scrollIntoView({ behavior: 'smooth', block: 'start' });
} else {
invalidate();
timer = setTimeout(() => renderPreview(first && user), 40);
}
}
form.addEventListener('change', e => {
if (e.target.name && e.target.name.startsWith('hs-choice-')) return;
const st = states.get(e.target.id);
if (st) st.confirmed = e.target.value;
if (['calc-tonnage', 'calc-material', 'q-wt-tonnage', 'q-wt-material'].includes(e.target.id)) entry.checked = false;
if (e.target.id === 'mpv-main-cat') {
const sub = states.get('mpv-sub-spec');
if (sub) sub.confirmed = null;
}
if (e.target.id === 'q-service-category') {
states.forEach((v, k) => {
if (!['q-service-category', 'q-display-mode', 'q-tax-mode'].includes(k)) v.confirmed = null;
});
}
refresh(true);
});
window.addEventListener('storage', () => {
setTimeout(() => {
states.forEach(sync);
const mismatch = activeStates().some(st => st.confirmed !== st.select.value) || lastExtras !== extrasSignature();
if (mismatch) {
states.forEach(st => { st.confirmed = null; });
entry.checked = false;
refresh(false);
gate.textContent = '其他頁面的規格或選配已變更，請重新確認此頁選項。';
}
}, 0);
});
window.addEventListener('pageshow', e => { if (e.persisted) refresh(false); });
if (isQuote) {
const load = document.getElementById('btn-q-load-draft');
if (load) {
load.addEventListener('click', () => {
const collapseBox = document.getElementById('q-tech-specs-collapse');
const toggleBtn = document.getElementById('btn-toggle-tech-specs');
if (collapseBox && collapseBox.classList.contains('is-collapsed')) {
collapseBox.classList.remove('is-collapsed');
if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
}
states.forEach(st => { st.confirmed = null; });
entry.checked = false;
refresh(false);
let hasSaved = false;
try { hasSaved = !!localStorage.getItem('hs_5390857_quote_draft_v11'); } catch (_) {}
if (hasSaved) {
confirmDraftBtn.hidden = false;
gate.textContent = '已帶入儲存規格預設值，請核對下方選項或點選按鈕確認顯示報價單。';
}
});
}
confirmDraftBtn.addEventListener('click', () => {
activeStates().forEach(st => { st.confirmed = st.select.value; });
confirmDraftBtn.hidden = true;
refresh(true);
});
const clear = document.getElementById('btn-q-clear-draft');
if (clear) {
clear.addEventListener('click', () => {
confirmDraftBtn.hidden = true;
states.forEach(st => { st.confirmed = null; });
entry.checked = false;
refresh(false);
});
}
}
if (forwarded && needsEntry() && params.get('noentry') === '1') entry.checked = true;
refresh(false);
}
if (document.readyState === 'complete') initChoiceCards();
else document.addEventListener('DOMContentLoaded', initChoiceCards, { once: true });
})();
