// The home page's look on the site's other pages (the beta, for now): the menu that springs into a pill, a headline
// written out letter by letter with its green word, and answers that open with a spring. No library.
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---------- The menu springs into a pill once you scroll ----------
  var nav = $('#nav');
  var small = null;
  var solid = nav.hasAttribute('data-solid'); // pages without a photo on top keep the pill from the start
  function updateNav() {
    var now = solid || scrollY > 40;
    if (now === small) return;
    var first = small === null;
    small = now;
    nav.classList.toggle('is-small', now);
    if (!reduce && !first) {
      nav.classList.remove('is-boing');
      void nav.offsetWidth;
      nav.classList.add('is-boing');
    }
  }
  nav.addEventListener('animationend', function () { nav.classList.remove('is-boing'); });
  addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // ---------- A headline written out as the page loads; the cursor stays at the end, blinking ----------
  function typeOut(heading, onNearlyDone) {
    var parts = $$('.ch', heading);
    var caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    parts[0].before(caret);
    var i = 0;
    (function tick() {
      if (i >= parts.length) {
        heading.classList.add('done');
        if (onNearlyDone) onNearlyDone();
        return;
      }
      var part = parts[i++];
      part.classList.add('on');
      part.after(caret);
      if (onNearlyDone && i > parts.length * 0.7) onNearlyDone();
      setTimeout(tick, /[,.]/.test(part.textContent) ? 280 : 30 + Math.random() * 45);
    })();
  }
  // A green word split into letters: each letter shows its own slice of the word's gradient, so it reads as one.
  function paintGrads() {
    $$('.typing-on .grad').forEach(function (word) {
      var box = word.getBoundingClientRect();
      word.style.setProperty('--gw', box.width.toFixed(1) + 'px');
      $$('.ch', word).forEach(function (ch) { ch.style.setProperty('--gx', (ch.getBoundingClientRect().left - box.left).toFixed(1) + 'px'); });
    });
  }
  paintGrads();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintGrads);
  addEventListener('resize', paintGrads);

  var title = $('[data-typed]');
  var rest = $$('.rise');
  var restShown = false;
  function showRest() {
    if (restShown) return;
    restShown = true;
    rest.forEach(function (el, i) { setTimeout(function () { el.classList.add('is-in'); }, i * 120); });
  }
  if (title && title.classList.contains('typing-on')) {
    title.dataset.started = '1';
    setTimeout(function () { typeOut(title, showRest); }, 350);
  } else {
    showRest();
  }

  // ---------- Questions: answers open and close with a little spring ----------
  $$('.faq details').forEach(function (d) {
    var sum = $('summary', d);
    var ans = $('.ans', d);
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (d._anim) d._anim.cancel();
      if (d.classList.contains('is-open')) {
        d.classList.remove('is-open');
        if (reduce) { d.open = false; return; }
        var from = ans.offsetHeight;
        d._anim = ans.animate([{ height: from + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 280, easing: 'cubic-bezier(.3,.7,0,1)' });
        d._anim.onfinish = function () { d.open = false; d._anim = null; };
      } else {
        d.open = true;
        d.classList.add('is-open');
        if (reduce) return;
        var to = ans.offsetHeight;
        d._anim = ans.animate([{ height: '0px', opacity: 0 }, { height: to + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.34,1.4,.64,1)' });
        d._anim.onfinish = function () { d._anim = null; };
      }
    });
  });

  // ---------- Prices follow the currency last picked. Set per currency, not converted ----------
  var PRICES = {
    USD: { symbol: '$', free: '0', pro: '9', business: '24' },
    NGN: { symbol: '₦', free: '0', pro: '7,500', business: '19,500' },
    GBP: { symbol: '£', free: '0', pro: '7', business: '19' },
    EUR: { symbol: '€', free: '0', pro: '8', business: '22' }
  };
  // Until someone picks, the currency follows the device's time zone: naira in Nigeria, pounds in the UK, euros in the
  // eurozone, dollars everywhere else. A choice made on the pricing page sticks.
  function guessCurrency() {
    var zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (zone === 'Africa/Lagos') return 'NGN';
    if (zone === 'Europe/London' || zone === 'Europe/Belfast') return 'GBP';
    var euro = ['Amsterdam', 'Athens', 'Berlin', 'Bratislava', 'Brussels', 'Dublin', 'Helsinki', 'Lisbon', 'Ljubljana',
      'Luxembourg', 'Madrid', 'Malta', 'Monaco', 'Paris', 'Riga', 'Rome', 'Tallinn', 'Vienna', 'Vilnius', 'Zagreb'];
    if (zone.indexOf('Europe/') === 0 && euro.indexOf(zone.slice(7)) !== -1) return 'EUR';
    return 'USD';
  }
  if ($('[data-price]')) {
    var code = guessCurrency();
    try { if (PRICES[localStorage.getItem('kv-currency')]) code = localStorage.getItem('kv-currency'); } catch (e) {}
    var drawPrices = function () {
      $$('[data-price]').forEach(function (el) { el.textContent = PRICES[code].symbol + PRICES[code][el.getAttribute('data-price')]; });
    };
    var picker = $('[data-currency]');
    if (picker) {
      picker.value = code;
      picker.addEventListener('change', function () {
        code = PRICES[picker.value] ? picker.value : 'USD';
        try { localStorage.setItem('kv-currency', code); } catch (e) {}
        drawPrices();
      });
    }
    drawPrices();
  }

  // ---------- Sections rise in as they come into view ----------
  var ups = $$('.up');
  if (!reduce && 'IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        seen.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    ups.forEach(function (el) { seen.observe(el); });
  } else {
    ups.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
