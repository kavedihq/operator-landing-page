/* Kavedi — shared behaviour for the home, beta and 404 pages: the theme switch, prices in the chosen currency,
   the header, the phone menu and the tabs. Each part does nothing if its markup isn't on the page. The theme itself
   is applied by a small inline script in each page's <head>, before anything is painted. */
(function () {
  var THEME_KEY = 'kv-theme';
  var ICONS = {
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
  };
  var THEMES = [['light', 'Light'], ['dark', 'Dark'], ['system', 'Match device']];

  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { return 'system'; }
  }
  function applyTheme(choice) {
    var root = document.documentElement;
    if (choice === 'light' || choice === 'dark') root.setAttribute('data-theme', choice);
    else root.removeAttribute('data-theme');
    var dark = choice === 'dark' || (choice !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0E1A1F' : '#F5F1E9');
    try { localStorage.setItem(THEME_KEY, choice); } catch (e) {}
  }

  document.querySelectorAll('[data-theme-switch]').forEach(function (holder) {
    var current = storedTheme();
    var group = document.createElement('div');
    group.className = 'theme-switch';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Colour theme');
    THEMES.forEach(function (theme) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = ICONS[theme[0]];
      btn.title = theme[1];
      btn.setAttribute('aria-label', theme[1]);
      btn.setAttribute('aria-pressed', String(current === theme[0]));
      btn.addEventListener('click', function () {
        current = theme[0];
        applyTheme(current);
        group.querySelectorAll('button').forEach(function (other, i) { other.setAttribute('aria-pressed', String(THEMES[i][0] === current)); });
      });
      group.appendChild(btn);
    });
    holder.appendChild(group);
  });
  if (window.matchMedia) {
    var scheme = window.matchMedia('(prefers-color-scheme: dark)');
    var follow = function () { if (storedTheme() === 'system') applyTheme('system'); };
    if (scheme.addEventListener) scheme.addEventListener('change', follow); else if (scheme.addListener) scheme.addListener(follow);
  }

  // Prices follow the currency last picked on the pricing page. Set per currency, not converted.
  var PRICES = {
    USD: { symbol: '$', free: '0', pro: '9', business: '24' },
    NGN: { symbol: '₦', free: '0', pro: '7,500', business: '19,500' },
    GBP: { symbol: '£', free: '0', pro: '7', business: '19' },
    EUR: { symbol: '€', free: '0', pro: '8', business: '22' }
  };
  var code = 'USD';
  try { if (PRICES[localStorage.getItem('kv-currency')]) code = localStorage.getItem('kv-currency'); } catch (e) {}
  var drawPrices = function () {
    document.querySelectorAll('[data-price]').forEach(function (el) {
      el.textContent = PRICES[code].symbol + PRICES[code][el.getAttribute('data-price')];
    });
  };
  drawPrices();
  // The picker is on the pricing page only; the choice sticks on this device.
  var picker = document.querySelector('[data-currency]');
  if (picker) {
    picker.value = code;
    picker.addEventListener('change', function () {
      code = PRICES[picker.value] ? picker.value : 'USD';
      drawPrices();
      try { localStorage.setItem('kv-currency', code); } catch (e) {}
    });
  }

  // The header gains a line once the page moves under it.
  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function () { head.classList.toggle('is-scrolled', window.scrollY > 4); };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var menuBtn = head.querySelector('.menu-btn');
    var menu = head.querySelector('.menu');
    if (menuBtn && menu) {
      var setOpen = function (open) {
        head.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      };
      menuBtn.addEventListener('click', function () { setOpen(menuBtn.getAttribute('aria-expanded') !== 'true'); });
      menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && head.classList.contains('is-open')) { setOpen(false); menuBtn.focus(); }
      });
      document.addEventListener('click', function (e) { if (!head.contains(e.target)) setOpen(false); });
    }
  }

  // Tabs: arrow keys move between them, as a tab list should.
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      // On a phone the tabs are a sideways strip: keep the chosen one in view.
      var list = tab.parentElement;
      if (list.scrollWidth > list.clientWidth) {
        var left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
        list.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      }
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  });
})();
