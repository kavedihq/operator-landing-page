/* Shared behaviour: the theme switch in the footer, the screenshot gallery's tabs, and the currency switch on pricing.
   Each part does nothing if its markup isn't on the page. The theme itself is applied by a small inline script in the
   <head> of every page, before anything is painted — this file only draws the switch and reacts to it. */
(function () {
  var THEME_KEY = 'kv-theme';
  var THEMES = [
    { id: 'light', label: 'Light', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"></path></svg>' },
    { id: 'dark', label: 'Dark', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path></svg>' },
    { id: 'system', label: 'Auto', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg>' }
  ];

  function stored() {
    try { return localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { return 'system'; }
  }

  function apply(choice) {
    var root = document.documentElement;
    if (choice === 'light' || choice === 'dark') root.setAttribute('data-theme', choice);
    else root.removeAttribute('data-theme');
    var dark = choice === 'dark' || (choice !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0E1A1F' : '#F5F1E9');
    try { localStorage.setItem(THEME_KEY, choice); } catch (e) {}
  }

  document.querySelectorAll('[data-theme-switch]').forEach(function (holder) {
    var current = stored();
    var group = document.createElement('div');
    group.className = 'theme-switch';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Colour theme');
    THEMES.forEach(function (theme) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = theme.icon;
      btn.title = theme.label;
      btn.setAttribute('aria-label', theme.label + ' theme');
      btn.setAttribute('aria-pressed', current === theme.id ? 'true' : 'false');
      btn.addEventListener('click', function () {
        current = theme.id;
        apply(current);
        group.querySelectorAll('button').forEach(function (other, i) {
          other.setAttribute('aria-pressed', THEMES[i].id === current ? 'true' : 'false');
        });
      });
      group.appendChild(btn);
    });
    holder.appendChild(group);
  });

  // The device's own setting can change while the page is open.
  if (window.matchMedia) {
    var watch = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () { if (stored() === 'system') apply('system'); };
    if (watch.addEventListener) watch.addEventListener('change', onChange);
    else if (watch.addListener) watch.addListener(onChange);
  }

  // ===== Currency on the pricing page =====
  // Indicative prices, set per currency rather than converted, so each one is a round local number.
  var PRICES = {
    USD: { symbol: '$', free: '0', pro: '9', business: '24' },
    NGN: { symbol: '₦', free: '0', pro: '7,500', business: '19,500' },
    GBP: { symbol: '£', free: '0', pro: '7', business: '19' },
    EUR: { symbol: '€', free: '0', pro: '8', business: '22' }
  };
  var picker = document.querySelector('[data-currency]');
  if (picker) {
    var draw = function (code) {
      var price = PRICES[code] || PRICES.USD;
      document.querySelectorAll('[data-price]').forEach(function (el) {
        el.textContent = price.symbol + price[el.getAttribute('data-price')];
      });
      try { localStorage.setItem('kv-currency', code); } catch (e) {}
    };
    var saved = null;
    try { saved = localStorage.getItem('kv-currency'); } catch (e) {}
    // Dollars unless someone picks otherwise; the choice sticks per device.
    picker.value = PRICES[saved] ? saved : 'USD';
    draw(picker.value);
    picker.addEventListener('change', function () { draw(picker.value); });
  }

  // ===== Things appearing as you reach them =====
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal, .shot-reveal, .showcase-row');
  if (still || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        seen.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(function (el) { seen.observe(el); });
  }

  // ===== How far down the page you are =====
  var bar = document.querySelector('[data-scroll-bar]');
  if (bar && !still) {
    var drawBar = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    };
    document.addEventListener('scroll', drawBar, { passive: true });
    window.addEventListener('resize', drawBar);
    drawBar();
  }

  // ===== The story: the phone holds still while its chat plays out =====
  // The section is four screens tall. The phone sits pinned in the middle of it, and how far you have scrolled
  // through the section decides how much of the conversation has happened. Scrolling back takes it back.
  var story = document.querySelector('[data-story]');
  if (story) {
    var steps = story.querySelectorAll('[data-story-step]');
    var dots = story.querySelectorAll('.story-progress span');
    var pieces = story.querySelectorAll('[data-story-at]');
    var rail = story.querySelector('.story-rail');
    var last = -1;

    var showStep = function (step) {
      if (step === last) return;
      last = step;
      steps.forEach(function (el) { el.classList.toggle('is-on', Number(el.getAttribute('data-story-step')) === step); });
      dots.forEach(function (dot, i) { dot.classList.toggle('is-on', i <= step); });
      pieces.forEach(function (el) { el.classList.toggle('is-in', Number(el.getAttribute('data-story-at')) <= step); });
    };

    if (still) {
      story.classList.add('is-still');
      rail.style.height = 'auto';
      showStep(steps.length - 1);
    } else {
      rail.style.height = steps.length * 100 + 'vh';
      var follow = function () {
        var box = story.getBoundingClientRect();
        var travelled = -box.top;
        var total = story.offsetHeight - window.innerHeight;
        var progress = total > 0 ? Math.min(1, Math.max(0, travelled / total)) : 0;
        showStep(Math.min(steps.length - 1, Math.floor(progress * steps.length)));
      };
      document.addEventListener('scroll', follow, { passive: true });
      window.addEventListener('resize', follow);
      follow();
    }
  }
})();
