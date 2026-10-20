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

  // ---------- Pricing: yearly or monthly, naira or dollars ----------
  // Kavedi charges naira in Nigeria and dollars everywhere else, so those are the only two currencies shown. Prices are
  // set per currency, not converted. Yearly is a third off monthly. Both choices stick on this device.
  var PRICES = {
    USD: { sym: '$', pro: { month: '9', year: '6', yearTotal: '72' }, business: { month: '24', year: '16', yearTotal: '192' } },
    NGN: { sym: '₦', pro: { month: '7,500', year: '5,000', yearTotal: '60,000' }, business: { month: '19,500', year: '13,000', yearTotal: '156,000' } }
  };
  var tiers = $('.tiers');
  if (tiers) {
    var store = function (key, value) { try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); } catch (e) {} return null; };
    var zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var cur = PRICES[store('kv-currency')] ? store('kv-currency') : (zone === 'Africa/Lagos' ? 'NGN' : 'USD');
    var interval = store('kv-interval') === 'month' ? 'month' : 'year';
    var draw = function () {
      var p = PRICES[cur];
      $$('[data-plan]', tiers).forEach(function (card) {
        var plan = p[card.getAttribute('data-plan')];
        var days = interval === 'year' ? 14 : 7;
        $('[data-amt]', card).textContent = p.sym + plan[interval];
        $('[data-billed]', card).textContent = (interval === 'year' ? p.sym + plan.yearTotal + ' billed yearly' : 'Billed monthly') + ' · ' + days + ' days free';
        $('[data-trial]', card).textContent = 'Start my ' + days + '-day free trial';
      });
      var free = $('.t-free .amt b', tiers);
      if (free) free.textContent = p.sym + '0';
      $$('[data-interval]').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-interval') === interval)); });
      $$('[data-cur]').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-cur') === cur)); });
    };
    // The numbers fade out, change and fade back, so a switch reads as a change rather than a jump.
    var swap = function () {
      if (reduce) { draw(); return; }
      tiers.classList.add('is-swapping');
      setTimeout(function () { draw(); tiers.classList.remove('is-swapping'); }, 180);
    };
    $$('[data-interval]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (interval === b.getAttribute('data-interval')) return;
        interval = b.getAttribute('data-interval');
        store('kv-interval', interval);
        swap();
      });
    });
    $$('[data-cur]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (cur === b.getAttribute('data-cur')) return;
        cur = b.getAttribute('data-cur');
        store('kv-currency', cur);
        swap();
      });
    });
    // Arrow keys move between the two choices, like any radio group.
    $$('.seg').forEach(function (group) {
      group.addEventListener('keydown', function (e) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) === -1) return;
        var buttons = $$('button', group);
        var next = buttons[(buttons.indexOf(document.activeElement) + 1) % buttons.length];
        e.preventDefault();
        next.focus();
        next.click();
      });
    });
    draw();
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
