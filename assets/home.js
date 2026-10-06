// kavedi.com's home page: the headline that writes itself, the hero that folds into a desktop as you scroll, the menu
// that springs into a pill, "Make it an agent" played out with Blink and a cursor, the pinned pieces, and answers that
// open with a spring. No library. Everything still reads with JavaScript off.
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = matchMedia('(max-width: 900px)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var root = document.documentElement;

  // Phones, narrow windows and anyone who asks for less motion get the hero as a photo, with the desk under it.
  var isStatic = false;
  function setStatic() {
    isStatic = reduce || narrow.matches;
    root.classList.toggle('is-static', isStatic);
  }
  setStatic();
  if (narrow.addEventListener) narrow.addEventListener('change', function () { setStatic(); onScroll(); });

  // ---------- The menu springs into a pill once you scroll ----------
  var nav = $('#nav');
  var small = false;
  function updateNav() {
    var now = scrollY > 40;
    if (now === small) return;
    small = now;
    nav.classList.toggle('is-small', now);
    if (!reduce) {
      nav.classList.remove('is-boing');
      void nav.offsetWidth;
      nav.classList.add('is-boing');
    }
  }
  nav.addEventListener('animationend', function () { nav.classList.remove('is-boing'); });

  // ---------- The headline, written out as the page loads ----------
  var title = $('#hero-title');
  var rest = $$('.hero .rise');
  var restShown = false;
  function showRest() {
    if (restShown) return;
    restShown = true;
    rest.forEach(function (el, i) { setTimeout(function () { el.classList.add('is-in'); }, i * 120); });
  }
  if (title.classList.contains('is-typing')) {
    title.dataset.started = '1';
    var chars = $$('.ch', title);
    var caret = document.createElement('span');
    caret.className = 'caret';
    chars[0].before(caret);
    var ci = 0;
    var tick = function () {
      if (ci >= chars.length) {
        title.classList.add('done');
        showRest();
        setTimeout(function () { caret.classList.add('is-gone'); }, 1800);
        return;
      }
      var c = chars[ci++];
      c.classList.add('on');
      c.after(caret);
      if (ci > chars.length * 0.7) showRest();
      setTimeout(tick, /[,.]/.test(c.textContent) ? 280 : 30 + Math.random() * 45);
    };
    setTimeout(tick, 350);
  } else {
    showRest();
  }

  // ---------- The hero folds into a desktop as you scroll (computers only) ----------
  var hero = $('.scene');
  function updateScene() {
    if (isStatic) {
      hero.style.removeProperty('--p');
      hero.style.removeProperty('--q');
      hero.classList.add('is-formed', 'is-awake');
      return;
    }
    var total = Math.max(1, hero.offsetHeight - innerHeight);
    var raw = clamp(-hero.getBoundingClientRect().top / total, 0, 1);
    var t = clamp(raw / 0.68, 0, 1);
    var p = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    var q = clamp((p - 0.42) / 0.5, 0, 1);
    hero.style.setProperty('--p', p.toFixed(4));
    hero.style.setProperty('--q', q.toFixed(4));
    hero.classList.toggle('is-formed', p > 0.9);
    hero.classList.toggle('is-awake', raw > 0.74);
  }

  // ---------- Video slot: the desktop's window plays a video once one is set ----------
  $$('[data-video]').forEach(function (slot) {
    var src = slot.getAttribute('data-video');
    if (!src) return;
    var video = document.createElement('video');
    video.className = 'vid';
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', slot.getAttribute('data-video-label') || '');
    if (reduce) video.controls = true;
    slot.replaceChildren(video);
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? video.play().catch(function () {}) : video.pause();
      }, { threshold: 0.25 }).observe(video);
    }
  });

  // ---------- "The pieces": the page holds still while the list moves on, one picture beside it ----------
  var pin = $('#pieces');
  var lis = $$('.pin-list li', pin);
  var screens = $$('.scr', pin);
  var bars = $$('.pin-bars i', pin);
  var count = lis.length;
  var current = -1;
  function pinRange() {
    return { top: pin.getBoundingClientRect().top + scrollY, total: Math.max(1, pin.offsetHeight - innerHeight) };
  }
  function updatePin() {
    var range = pinRange();
    var x = clamp((scrollY - range.top) / range.total, 0, 1) * count;
    var at = Math.min(count - 1, Math.floor(x));
    var seg = Math.min(1, x - at);
    lis[at].style.setProperty('--seg', seg.toFixed(3));
    bars.forEach(function (b, k) { b.style.setProperty('--f', k < at ? 1 : k === at ? seg.toFixed(3) : 0); });
    if (at === current) return;
    current = at;
    lis.forEach(function (li, k) { li.classList.toggle('on', k === at); });
    screens.forEach(function (s, k) {
      s.classList.toggle('on', k === at);
      s.classList.toggle('was', k < at);
    });
  }
  $$('.pin-list button', pin).forEach(function (b) {
    b.addEventListener('click', function () {
      var range = pinRange();
      var k = Number(b.getAttribute('data-i'));
      scrollTo({ top: range.top + (range.total * (k + 0.05)) / count, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      updateNav();
      updateScene();
      updatePin();
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // ---------- "Make it an agent": say it, Blink thinks, the agent builds itself, then it answers on WhatsApp ----------
  // Made-up people at a made-up studio. Chat lines: ['them', words] what someone sends (left, white), ['us', words]
  // Kavedi's answer (right, green: it's your number talking), ['pic', words] an answer with a picture, ['note', words].
  var SCENES = [
    {
      tab: 'Price list', name: 'Price list', look: ['#C98200', 'i-tag'],
      ask: 'When someone asks for prices, send the price list',
      when: 'They ask about prices, in any words',
      steps: [['Send <span class="tag">price-list.jpg</span>', 'with “Here you go, {first name}!”'], ['Answer follow-ups from <span class="tag">Prices</span>', 'Only what you taught it'], ['Hand over to you', 'when they ask for a discount']],
      reply: 'Done. It sends your price list whenever someone asks.',
      chat: [['them', 'how much is a birthday cake? 🎂', '02:13'], ['pic', 'Here you go, Maya! Birthday cakes start at $38.', '02:13'], ['them', 'perfect, thank you!!', '02:14']],
    },
    {
      tab: 'Bookings', name: 'Booker', look: ['#D9443A', 'i-cal'],
      ask: 'Book cake tastings on Saturdays, 11 to 4',
      when: 'They want to book, move or cancel',
      steps: [['Find <span class="tag">free times</span>', 'Saturdays, 11:00 to 16:00'], ['<span class="tag">Book</span> the one they pick', 'and confirm it'], ['Remind them', 'the day before']],
      reply: 'Done. It offers your free times and books them.',
      chat: [['them', 'can I come in on Saturday?', '12:40'], ['us', 'Saturday I have 11:30 or 14:00. Which works?', '12:40'], ['them', '14:00 pls', '12:41'], ['us', 'Booked ✓ Saturday 4 Oct, 14:00. See you then, Ben!', '12:41']],
    },
    {
      tab: 'Reminders', name: 'Reminder', look: ['#7A5AF8', 'i-bell'],
      ask: 'Remind people the day before their booking',
      when: '24 hours before a booking',
      steps: [['Send', '“Hi {first name}, see you tomorrow at {time} 🙂”'], ['If they reply 2', 'offer them other times']],
      reply: 'Done. Everyone booked gets a reminder.',
      chat: [['note', 'Friday'], ['us', 'Hi Sofia, see you tomorrow at 14:00 🙂 Reply 2 to move it.', '14:00'], ['them', 'can’t wait!', '14:06']],
    },
    {
      tab: 'Handed to you', name: 'Refunds', look: ['#2F6FDE', 'i-hand'],
      ask: 'If someone wants a refund, hand it to me',
      when: 'They’re unhappy with an order',
      steps: [['Say sorry', 'in your own words'], ['Hand over to you', 'with why, in your inbox']],
      reply: 'Done. Refunds come straight to you.',
      chat: [['them', 'my order came squashed, I want a refund', '23:57'], ['us', 'So sorry Priya! I’ve passed this to Nina, she’ll sort it first thing.', '23:58'], ['note', 'In your inbox: they want a refund']],
    },
    {
      tab: 'Get paid', name: 'Payments', look: ['#635BFF', 'i-card'],
      ask: 'When they confirm an order, send a payment link',
      when: 'They confirm an order',
      steps: [['Make a <span class="tag">payment link</span>', 'for the total'], ['Send it', '“Here’s your link: {payment}”'], ['Tell you', 'when they’ve paid']],
      reply: 'Done. Links go out and you hear when they’re paid.',
      chat: [['them', 'yes, 2 boxes of cupcakes please', '16:14'], ['us', 'Here’s your link, Emma: pay.stripe.com/kv-42 · $42.00', '16:14'], ['them', 'done ✅', '16:19'], ['note', 'Paid · $42.00']],
    },
  ];

  var stage = $('#stage');
  var studio = stage.parentElement;
  var tabsBox = $('.studio-tabs', studio);
  var part = function (name) { return $('[data-p="' + name + '"]', stage); };
  var list = part('list'), ask = part('ask'), askText = $('.typed', ask), send = part('send'), doc = part('doc');
  var toast = part('toast'), chat = part('chat'), cursor = part('cursor'), blink = part('blink');
  var visible = false;
  var control = null;
  var STOP = {};
  var esc = function (t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
  var icon = function (id) { return '<svg class="ic"><use href="#' + id + '"/></svg>'; };
  var mood = function (m) { blink.setAttribute('class', 'blink' + (m ? ' is-' + m : '')); };

  var tabs = SCENES.map(function (s, k) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', 'false');
    b.innerHTML = esc(s.tab) + '<i></i>';
    b.addEventListener('click', function () { start(k); });
    tabsBox.appendChild(b);
    return b;
  });

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function say(cls, html) {
    var e = el('div', 'say pop ' + cls, html);
    list.appendChild(e);
    while (list.children.length > 5) list.removeChild(list.firstChild);
    return e;
  }
  function bubble(kind, words, time) {
    var e;
    if (kind === 'note') e = el('div', 'wa note pop', esc(words));
    else if (kind === 'pic') e = el('div', 'wa out pop', '<div class="pic"></div>' + esc(words) + '<time>' + esc(time) + ' ✓✓</time>');
    else e = el('div', 'wa pop' + (kind === 'us' ? ' out' : ''), esc(words) + '<time>' + esc(time) + (kind === 'us' ? ' ✓✓' : '') + '</time>');
    chat.appendChild(e);
    while (chat.children.length > 6) chat.removeChild(chat.firstChild);
    return e;
  }
  function header(s) {
    return '<div class="doc-top spring-in"><span class="tile" style="--c:' + s.look[0] + '">' + icon(s.look[1]) + '</span><h3></h3><span class="sw" data-p="switch"></span></div>';
  }
  function emptyDoc() {
    doc.innerHTML = '<div class="doc-empty">' + icon('i-bot') + '<span>Your agent shows up here</span></div>';
  }
  function reset() {
    stage.classList.remove('is-blurred');
    list.innerHTML = '';
    say('it', 'What should your agent do?');
    askText.textContent = '';
    emptyDoc();
    toast.classList.remove('is-in');
    chat.innerHTML = '';
    mood('');
  }
  // The finished picture of a scene, for anyone who asks for less motion.
  function still(s) {
    reset();
    say('me', esc(s.ask));
    say('it', esc(s.reply));
    doc.innerHTML = header(s) + '<div class="when-card"><b>When to use it</b>' + esc(s.when) + '</div><ol class="steps">' +
      s.steps.map(function (st, k) { return '<li><b>' + (k + 1) + '</b><span>' + st[0] + '<small>' + esc(st[1]) + '</small></span></li>'; }).join('') + '</ol>';
    $('h3', doc).textContent = s.name;
    $('[data-p="switch"]', doc).classList.add('on');
    mood('happy');
  }

  // One run of a scene. `dry` adds up how long it takes (for the tab's progress line) without waiting.
  function runner(ctl, dry) {
    var total = 0, elapsed = 0, fill = null;
    var api = {
      setFill: function (f, est) { fill = f; total = est; },
      spent: function () { return total; },
      wait: function (ms) {
        if (dry) { total += ms; return Promise.resolve(); }
        elapsed += ms;
        if (fill) {
          fill.style.transition = 'width ' + ms + 'ms linear';
          fill.style.width = Math.min(100, (elapsed / total) * 100) + '%';
        }
        return new Promise(function (resolve, reject) {
          var left = ms, last = performance.now();
          (function step() {
            if (ctl.stop) return reject(STOP);
            var now = performance.now();
            if (visible && !document.hidden) left -= now - last;
            last = now;
            if (left <= 0) resolve();
            else setTimeout(step, Math.min(left, 100));
          })();
        });
      },
      move: function (target, dx, dy) {
        if (!dry && target) {
          var s = stage.getBoundingClientRect(), r = target.getBoundingClientRect();
          cursor.style.setProperty('--x', Math.round(r.left - s.left + r.width * (dx == null ? 0.5 : dx)) + 'px');
          cursor.style.setProperty('--y', Math.round(r.top - s.top + r.height * (dy == null ? 0.55 : dy)) + 'px');
        }
        return api.wait(850);
      },
      click: async function () {
        if (!dry) cursor.classList.add('is-down');
        await api.wait(170);
        if (!dry) cursor.classList.remove('is-down');
        await api.wait(130);
      },
    };
    return api;
  }

  async function scene(s, run, dry) {
    var live = !dry;
    if (live) reset();
    await run.wait(600);
    await run.move(ask, 0.3);
    await run.click();
    for (var k = 0; k < s.ask.length; k++) {
      if (live) askText.textContent += s.ask[k];
      await run.wait(27);
    }
    await run.wait(250);
    await run.move(send);
    await run.click();
    if (live) {
      send.classList.add('is-down');
      say('me', esc(s.ask));
      askText.textContent = '';
    }
    await run.wait(160);
    if (live) send.classList.remove('is-down');

    // Blink thinks.
    var think = null;
    if (live) {
      mood('thinking');
      think = say('it think', '<span class="dots"><b></b><b></b><b></b></span><span>Reading what you asked</span>');
    }
    await run.wait(1000);
    if (live) think.lastChild.textContent = 'Picking the steps';
    await run.wait(800);

    // The agent builds itself, part by part.
    if (live) doc.innerHTML = header(s);
    var h3 = live ? $('h3', doc) : null;
    for (var n = 0; n < s.name.length; n++) {
      if (live) h3.textContent += s.name[n];
      await run.wait(40);
    }
    await run.wait(250);
    if (live) doc.appendChild(el('div', 'when-card spring-in', '<b>When to use it</b>' + esc(s.when)));
    await run.wait(450);
    var ol = live ? doc.appendChild(el('ol', 'steps')) : null;
    for (var j = 0; j < s.steps.length; j++) {
      if (live) ol.appendChild(el('li', 'spring-in', '<b>' + (j + 1) + '</b><span>' + s.steps[j][0] + '<small>' + esc(s.steps[j][1]) + '</small></span>'));
      await run.wait(480);
    }
    if (live) {
      think.remove();
      say('it', esc(s.reply));
      mood('happy');
    }
    await run.wait(500);

    // Switch it on.
    var sw = live ? $('[data-p="switch"]', doc) : null;
    await run.move(sw);
    await run.click();
    if (live) {
      sw.classList.add('on');
      toast.innerHTML = '<span class="tile" style="--c:' + s.look[0] + '">' + icon(s.look[1]) + '</span><div><strong>' + esc(s.name) + ' is on</strong><small>Answering on WhatsApp now</small></div>';
      toast.classList.add('is-in');
    }
    await run.wait(1100);

    // The window steps back, and the chat comes up over it.
    if (live) {
      mood('');
      toast.classList.remove('is-in');
      stage.classList.add('is-blurred');
    }
    await run.move(stage, 0.97, 0.97);
    for (var m = 0; m < s.chat.length; m++) {
      var line = s.chat[m];
      if (line[0] === 'them' || line[0] === 'note') {
        await run.wait(line[0] === 'note' ? 500 : 800);
        if (live) bubble(line[0], line[1], line[2]);
      } else {
        await run.wait(450);
        var dots = live ? chat.appendChild(el('div', 'wa out typing pop', '<b></b><b></b><b></b>')) : null;
        await run.wait(1150);
        if (live) {
          dots.remove();
          bubble(line[0], line[1], line[2]);
        }
      }
    }
    await run.wait(3000);
    if (live) $$('.wa', chat).forEach(function (b) { b.classList.add('leave'); });
    await run.wait(400);
  }

  async function start(k) {
    if (control) control.stop = true;
    var ctl = (control = { stop: false });
    tabs.forEach(function (b, n) {
      b.setAttribute('aria-selected', String(n === k));
      var f = b.querySelector('i');
      f.style.transition = 'none';
      f.style.width = '0%';
    });
    if (reduce) return still(SCENES[k]);
    var est = runner(ctl, true);
    await scene(SCENES[k], est, true);
    var run = runner(ctl, false);
    run.setFill(tabs[k].querySelector('i'), est.spent());
    try {
      await scene(SCENES[k], run, false);
    } catch (e) {
      if (e === STOP) return;
      throw e;
    }
    if (!ctl.stop) start((k + 1) % SCENES.length);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[entries.length - 1].isIntersecting; }, { threshold: 0.3 }).observe(stage);
  } else {
    visible = true;
  }
  start(0);

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
})();
