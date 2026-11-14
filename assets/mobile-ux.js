(() => {
  'use strict';
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const button = document.querySelector('.mobile-menu-toggle');
  const nav = document.getElementById('site-navigation');
  const mobile = matchMedia('(max-width:860px)');

  function syncHeaderOffset() {
    if (!header) return;
    const h = Math.max(56, Math.round(header.getBoundingClientRect().height));
    root.style.setProperty('--hs-header-offset', h + 'px');
  }
  syncHeaderOffset();
  if (header && typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(syncHeaderOffset);
    ro.observe(header);
  } else {
    window.addEventListener('resize', syncHeaderOffset, { passive: true });
  }

  if (button && nav) {
    root.classList.add('mobile-enhanced');
    const setMenu = open => {
      nav.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      syncHeaderOffset();
    };
    button.addEventListener('click', () => setMenu(button.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        button.focus();
      }
    });
    document.addEventListener('click', e => { if (!e.target.closest('.site-header')) setMenu(false); });
    const onResize = () => { setMenu(false); root.classList.remove('is-editing'); syncHeaderOffset(); };
    if (mobile.addEventListener) mobile.addEventListener('change', onResize);
    else mobile.addListener(onResize);
    if (mobile.matches) document.querySelectorAll('.mobile-service-note,.mobile-result-details').forEach(d => { d.open = false; });
    const editable = e => e && e.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]),textarea,select');
    document.addEventListener('focusin', e => { if (mobile.matches && editable(e.target)) root.classList.add('is-editing'); });
    document.addEventListener('focusout', () => setTimeout(() => { if (!editable(document.activeElement)) root.classList.remove('is-editing'); }, 0));
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); }, { once: true });
  }
})();
(function () {
  var panel = document.getElementById('hs-analytics-choice'), settings = document.getElementById('hs-analytics-settings');
  if (!panel || !settings) return;
  var key = 'hs_analytics_consent_v2', veto = 'hs_analytics_denied', ttl = 15552000000;
  function valid(exp) { return Number.isFinite(exp) && exp > Date.now() && exp <= Date.now() + ttl; }
  var prev = null, deniedUntil = 0;
  try { prev = JSON.parse(localStorage.getItem(key)); } catch (_) {}
  try { deniedUntil = Number(sessionStorage.getItem(veto)) || 0; } catch (_) {}
  try {
    document.cookie.split(';').forEach(function (e) {
      var p = e.trim().split('=');
      if (p[0] === veto) deniedUntil = Math.max(deniedUntil, Number(p[1]) || 0);
    });
  } catch (_) {}
  if ((prev && ['granted', 'denied'].includes(prev.choice) && valid(prev.expires)) || valid(deniedUntil)) panel.hidden = true;
  panel.querySelectorAll('[data-analytics-choice]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      panel.hidden = true;
      var det = panel.querySelector('details');
      if (det) det.open = false;
      var ch = btn.getAttribute('data-analytics-choice');
      if (ch !== 'granted' && ch !== 'denied') return;
      var den = ch === 'denied', now = Date.now(), exp = now + ttl;
      if (den) window['ga-disable-G-DXSNKRSPBE'] = true;
      try { localStorage.setItem(key, JSON.stringify({ choice: ch, chosenAt: now, expires: exp })); } catch (_) {}
      try { if (den) sessionStorage.setItem(veto, String(exp)); else sessionStorage.removeItem(veto); } catch (_) {}
      try { document.cookie = veto + '=' + (den ? exp : '') + '; Max-Age=' + (den ? 15552000 : 0) + '; path=/; SameSite=Lax; Secure'; } catch (_) {}
      if (den) {
        try { var bc = new BroadcastChannel('hs-analytics-consent-v1'); bc.postMessage('denied'); bc.close(); } catch (_) {}
      }
    });
  });
  settings.addEventListener('click', function () {
    panel.hidden = false;
    panel.scrollIntoView({ block: 'center' });
    panel.querySelector('[data-analytics-choice]').focus();
  });
})();
