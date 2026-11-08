/* Minimal opt-in analytics. Keep GA4 Enhanced measurement OFF. No quote-page tag. */
(function () {
  'use strict';
  const ID = 'G-DXSNKRSPBE', KEY = 'hs_analytics_consent_v2', TTL = 180 * 24 * 60 * 60 * 1000;
  const pages = {
    '/': 'home', '/index.html': 'home', '/water-tank.html': 'water_tank',
    '/cooling-tower.html': 'cooling_tower', '/ac-cleaning.html': 'ac_cleaning',
    '/motor-pump-valve.html': 'equipment_repair', '/shop.html': 'shop'
  };
  const current = pages[location.pathname];
  let active = false, activeUntil = 0;
  // Versioned, expiring choices. Never interpret legacy page-local grants as consent.
  const VETO = 'hs_analytics_denied';
  let expiryTimer;
  function vetoUntil() {
    let until = 0;
    try { until = Number(sessionStorage.getItem(VETO)) || 0; } catch (_) {}
    let cookies = '';
    try { cookies = document.cookie; } catch (_) {}
    cookies.split(';').forEach(function (v) {
      const pair = v.trim().split('=');
      if (pair[0] === VETO) until = Math.max(until, Number(pair[1]) || 0);
    });
    return until > Date.now() && until <= Date.now() + TTL ? until : 0;
  }
  function veto(on) {
    const until = on ? Date.now() + TTL : 0;
    try { if (on) sessionStorage.setItem(VETO, String(until)); else sessionStorage.removeItem(VETO); } catch (_) {}
    try { document.cookie = VETO + '=' + (on ? until : '') + '; Max-Age=' + (on ? 15552000 : 0) + '; path=/; SameSite=Lax; Secure'; } catch (_) {}
  }
  let channel = null;
  try { if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel('hs-analytics-consent-v1'); } catch (_) {}
  function allowed() {
    if (location.protocol !== 'https:' || !['5390857.com', 'www.5390857.com'].includes(location.hostname)) return false;
    if (!current || location.search || location.hash || navigator.globalPrivacyControl === true) return false;
    // Fail closed on legacy/sensitive referring URLs, even though referrer is overridden.
    if (document.referrer) {
      try { const r = new URL(document.referrer); if (r.search || r.hash || (r.pathname !== '/' && !(r.hostname === location.hostname && pages[r.pathname]))) return false; }
      catch (_) { return false; }
    }
    return true;
  }
  function parse(raw) {
    try { const v = JSON.parse(raw); return v && ['granted','denied'].includes(v.choice) && Number.isFinite(v.expires) && v.expires > Date.now() && v.expires <= Date.now() + TTL ? v : null; } catch (_) { return null; }
  }
  function stored() {
    const until = vetoUntil();
    try {
      const v = parse(localStorage.getItem(KEY));
      if (until && !(v && v.choice === 'granted' && v.chosenAt > until - TTL)) return {choice:'denied', expires:until};
      if (until) { try { sessionStorage.removeItem(VETO); } catch (_) {} }
      if (!v) return null;
      // Verify storage remains writable before trusting a persisted grant.
      if (v.choice === 'granted') {
        const probe = JSON.stringify(Object.assign({}, v, {probe: Math.random().toString(36)}));
        localStorage.setItem(KEY, probe);
        if (localStorage.getItem(KEY) !== probe) return null;
      }
      return v;
    } catch (_) { return until ? {choice:'denied', expires:until} : null; }
  }
  function save(value) {
    const v = {choice:value, chosenAt:Date.now(), expires:Date.now() + TTL};
    try { const raw = JSON.stringify(v); localStorage.setItem(KEY, raw); if (localStorage.getItem(KEY) !== raw) return null; return v; } catch (_) { return null; }
  }
  function expireAt(expires) {
    clearTimeout(expiryTimer);
    // Browser timers are capped at roughly 24 days. Recheck without extending consent.
    const remaining = expires - Date.now();
    if (remaining <= 0) {
      // Expiry is not a new refusal. Leave the expired record so the next page asks again.
      active = false; window['ga-disable-' + ID] = true;
      if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) location.reload();
      const panel = document.getElementById('hs-analytics-choice');
      if (panel) panel.hidden = false;
      return;
    }
    expiryTimer = setTimeout(function () { expireAt(expires); }, Math.min(remaining, 2147483647));
  }
  function safeFields() {
    return {page_location: 'https://5390857.com' + (current === 'home' ? '/' : location.pathname),
      page_referrer: '', page_title: current, service_type: current};
  }
  function tag() { window.dataLayer.push(arguments); }
  function event(name, extra) {
    if (!active || Date.now() >= activeUntil || !allowed()) return;
    tag('event', name, Object.assign({send_to: ID}, safeFields(), extra || {}));
  }
  function start(expires) {
    if (!allowed()) return;
    activeUntil = expires || Date.now() + TTL;
    if (active) return;
    active = true;
    window['ga-disable-' + ID] = false;
    window.dataLayer = window.dataLayer || [];
    tag('consent', 'default', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
    tag('set', Object.assign(safeFields(), {send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false}));
    tag('consent', 'update', {analytics_storage: 'granted'});
    tag('js', new Date());
    tag('config', ID, Object.assign(safeFields(), {send_page_view: false,
      allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_expires: 15552000, cookie_update: false}));
    event('page_view');
    const script = document.createElement('script');
    script.async = true; script.referrerPolicy = 'no-referrer';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(script);
  }
  function choose(value, remote) {
    // Withdraw synchronously, before any storage or cookie operation can fail.
    if (value !== 'granted') { active = false; window['ga-disable-' + ID] = true; }
    const panel = document.getElementById('hs-analytics-choice');
    if (panel) panel.hidden = true;
    const saved = remote ? null : save(value);
    veto(value === 'denied');
    clearTimeout(expiryTimer);
    if (value === 'denied' && !remote && channel) { try { channel.postMessage('denied'); } catch (_) {} }
    if (value === 'granted') { const expires = saved ? saved.expires : Date.now() + TTL; start(expires); expireAt(expires); }
    else {
      active = false; window['ga-disable-' + ID] = true;
      // Remove first-party GA cookies at known site scopes. No outbound consent ping.
      let cookies = '';
      try { cookies = document.cookie; } catch (_) {}
      cookies.split(';').forEach(function (entry) {
        const name = entry.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) return;
        ['', '; domain=5390857.com', '; domain=.5390857.com', '; domain=www.5390857.com'].forEach(function (domain) {
          try { document.cookie = name + '=; Max-Age=0; path=/' + domain + '; SameSite=Lax; Secure'; } catch (_) {}
        });
      });
      // Unload already-running Google code immediately after withdrawal.
      if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) location.reload();
    }
    const notice = document.getElementById('hs-analytics-choice');
    if (notice) notice.hidden = true;
  }
  document.querySelectorAll('[data-analytics-choice]').forEach(function (button) {
    button.addEventListener('click', function () { choose(button.getAttribute('data-analytics-choice')); });
  });
  const settings = document.getElementById('hs-analytics-settings');
  if (settings) settings.addEventListener('click', function () {
    const panel = document.getElementById('hs-analytics-choice');
    panel.hidden = false;
    panel.scrollIntoView({block:'center'});
    panel.querySelector('[data-analytics-choice]').focus();
  });
  const notice = document.getElementById('hs-analytics-choice');
  const previous = stored();
  if (notice) notice.hidden = !!previous;
  if (previous && previous.choice === 'granted') { start(previous.expires); expireAt(previous.expires); }
  if (channel) channel.onmessage = function (e) { if (e.data === 'denied') choose('denied', true); };
  // Other tabs revoke collection promptly; consent is not a business lead.
  window.addEventListener('storage', function (e) { if ((e.key === KEY && (!parse(e.newValue) || parse(e.newValue).choice === 'denied')) || e.key === null) choose('denied', true); });
  // A back/forward cache restore must not revive withdrawn or expired consent.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    const latest = stored();
    if (!latest || latest.choice !== 'granted') {
      active = false; window['ga-disable-' + ID] = true;
      clearTimeout(expiryTimer);
      if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) location.reload();
      if (notice) notice.hidden = !!latest;
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (active && Date.now() >= activeUntil) expireAt(activeUntil);
  });
  document.addEventListener('click', function (e) {
    const target = e.target.closest && e.target.closest('a[href],button[id]');
    if (!target) return;
    // Known calculator buttons only; never read labels, amounts or customer inputs.
    if (['btn-ac-to-quote','btn-calc-to-quote','btn-ct-to-quote','btn-mpv-to-quote','btn-shop-to-quote'].includes(target.id)) { event('quote_intent'); return; }
    const href = target.getAttribute('href') || '';
    if (!href) return;
    if (/^tel:/i.test(href)) { event('contact_click', {contact_method: 'phone'}); return; }
    try {
      const url = new URL(href, location.href);
      if (url.protocol === 'https:' && ['line.me', 'lin.ee'].includes(url.hostname)) {
        event('contact_click', {contact_method: 'line'}); return;
      }
      if (url.origin === location.origin && url.pathname === '/quote.html') {
        event('quote_intent'); return;
      }
      if (url.origin === location.origin && pages[url.pathname]) {
        event('service_intent', {target_service: pages[url.pathname]}); return;
      }
    } catch (_) {}
  }, true);
})();



