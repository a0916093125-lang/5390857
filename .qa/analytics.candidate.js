/* Minimal opt-in analytics. Keep GA4 Enhanced measurement OFF. No quote-page tag. */
(function () {
  'use strict';
  const ID = 'G-DXSNKRSPBE', KEY = 'hs_analytics_consent_v1';
  const pages = {
    '/': 'home', '/index.html': 'home', '/water-tank.html': 'water_tank',
    '/cooling-tower.html': 'cooling_tower', '/ac-cleaning.html': 'ac_cleaning',
    '/motor-pump-valve.html': 'equipment_repair', '/shop.html': 'shop'
  };
  const current = pages[location.pathname];
  let active = false;
  // Grants are page-local only: no persisted value can restart collection.
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
  function stored() { try { return localStorage.getItem(KEY); } catch (_) { return null; } }
  function save(value) { try { localStorage.setItem(KEY, value); } catch (_) {} }
  function safeFields() {
    return {page_location: 'https://5390857.com' + (current === 'home' ? '/' : location.pathname),
      page_referrer: '', page_title: current, service_type: current};
  }
  function tag() { window.dataLayer.push(arguments); }
  function event(name, extra) {
    if (!active || !allowed()) return;
    tag('event', name, Object.assign({send_to: ID}, safeFields(), extra || {}));
  }
  function start() {
    if (active || !allowed()) return;
    active = true;
    window['ga-disable-' + ID] = false;
    window.dataLayer = window.dataLayer || [];
    tag('consent', 'default', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
    tag('set', Object.assign(safeFields(), {allow_google_signals: false, allow_ad_personalization_signals: false}));
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
    // Persist rejection only. Old or failed-to-update grants are never trusted.
    save(value === 'denied' ? 'denied' : 'ask');
    if (value === 'denied' && !remote && channel) { try { channel.postMessage('denied'); } catch (_) {} }
    if (value === 'granted') start();
    else {
      active = false; window['ga-disable-' + ID] = true;
      // Remove first-party GA cookies at known site scopes. No outbound consent ping.
      document.cookie.split(';').forEach(function (entry) {
        const name = entry.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) return;
        ['', '; domain=5390857.com', '; domain=.5390857.com', '; domain=www.5390857.com'].forEach(function (domain) {
          document.cookie = name + '=; Max-Age=0; path=/' + domain + '; SameSite=Lax; Secure';
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
    document.getElementById('hs-analytics-choice').hidden = false;
  });
  const notice = document.getElementById('hs-analytics-choice');
  if (notice) notice.hidden = stored() === 'denied';
  // Deliberately no stored-grant auto-start, even if storage reads succeed.
  if (channel) channel.onmessage = function (e) { if (e.data === 'denied') choose('denied', true); };
  // Other tabs revoke collection promptly; consent is not a business lead.
  window.addEventListener('storage', function (e) { if ((e.key === KEY && e.newValue === 'denied') || e.key === null) choose('denied', true); });
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
