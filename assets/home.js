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
  // Writes out a heading letter by letter. The cursor stays at the end, blinking, for good.
  function typeOut(heading, onNearlyDone, onDone) {
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
        if (onDone) onDone();
        return;
      }
      var part = parts[i++];
      part.classList.add('on');
      part.after(caret);
      if (onNearlyDone && i > parts.length * 0.7) onNearlyDone();
      setTimeout(tick, /[,.]/.test(part.textContent) ? 280 : 30 + Math.random() * 45);
    })();
  }
  // Splits a heading's words into letters.
  function wrapLetters(heading) {
    var holder = $('[data-type]', heading);
    $$('*', holder).concat([holder]).forEach(function (el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        node.textContent.split('').forEach(function (c) { var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; frag.appendChild(s); });
        node.replaceWith(frag);
      });
    });
    heading.classList.add('typing-on');
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

  if (title.classList.contains('typing-on')) {
    title.dataset.started = '1';
    setTimeout(function () { typeOut(title, showRest); }, 350);
  } else {
    showRest();
  }

  // The closing line is written out when it comes into view, once.
  var endTitle = $('#end-title');
  if (endTitle && !reduce && 'IntersectionObserver' in window) {
    wrapLetters(endTitle);
    paintGrads();
    var endWatch = new IntersectionObserver(function (entries) {
      if (!entries[entries.length - 1].isIntersecting) return;
      endWatch.disconnect();
      typeOut(endTitle);
    }, { threshold: 0.6 });
    endWatch.observe(endTitle);
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
    if (at !== current) {
      current = at;
      lis.forEach(function (li, k) { li.classList.toggle('on', k === at); });
      screens.forEach(function (s, k) {
        s.classList.toggle('on', k === at);
        s.classList.toggle('was', k < at);
      });
    }
    // Each piece plays out with the scroll: the ones before are finished, the ones after not started.
    screens.forEach(function (s, k) { PIECES[k].apply(k < at ? 1 : k > at ? 0 : seg, s); });
    moveCursor(PIECES[at], screens[at], seg);
  }

  // ---------- The pieces, played by the scroll: a cursor goes to work on each one ----------
  var frame = $('.pin-frame', pin);
  var pcursor = $('[data-t="cursor"]', frame);
  var T = function (scr, name) { return $('[data-t="' + name + '"]', scr); };
  var smooth = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var phase = function (seg, a, b) { return clamp((seg - a) / (b - a), 0, 1); };
  var within = function (seg, a, b) { return seg >= a && seg < b; };
  // Where something is, inside the frame. 'out' is just off its bottom right corner.
  function spot(scr, name, dx, dy) {
    return function () {
      var f = frame.getBoundingClientRect();
      if (name === 'out') return [f.width + 30, f.height * 0.82];
      var el = T(scr, name);
      if (!el) return [f.width + 30, f.height * 0.82];
      var r = el.getBoundingClientRect();
      return [r.left - f.left + r.width * (dx == null ? 0.5 : dx), r.top - f.top + r.height * (dy == null ? 0.55 : dy)];
    };
  }
  function moveCursor(piece, scr, seg) {
    var keys = piece.keys(scr);
    var p = keys[keys.length - 1][1]();
    if (seg <= keys[0][0]) p = keys[0][1]();
    else {
      for (var i = 0; i < keys.length - 1; i++) {
        if (seg <= keys[i + 1][0]) {
          var t = smooth(phase(seg, keys[i][0], keys[i + 1][0]));
          var a = keys[i][1](), b = keys[i + 1][1]();
          p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          break;
        }
      }
    }
    pcursor.style.setProperty('--x', Math.round(p[0]) + 'px');
    pcursor.style.setProperty('--y', Math.round(p[1]) + 'px');
    pcursor.classList.toggle('is-down', piece.down.some(function (d) { return within(seg, d[0], d[1]); }));
  }
  var KNOW = 'Yes, we deliver on Sundays, 10 to 2.';
  var PIECES = [
    { // Agents: + New agent, the builder slides in, its steps arrive, then it's switched on.
      down: [[0.3, 0.36], [0.86, 0.9]],
      keys: function (s) { return [[0, spot(s, 'out')], [0.28, spot(s, 'new')], [0.4, spot(s, 'new')], [0.8, spot(s, 'sw')], [0.92, spot(s, 'sw')], [1, spot(s, 'sw')]]; },
      apply: function (seg, s) {
        T(s, 'new').classList.toggle('is-pressed', within(seg, 0.3, 0.36));
        T(s, 'sheet').classList.toggle('open', seg > 0.36);
        ['s0', 's1', 's2', 's3'].forEach(function (n, k) { T(s, n).classList.toggle('show', seg > 0.45 + k * 0.09); });
        T(s, 'sw').classList.toggle('on', seg > 0.9);
      },
    },
    { // Bookings: Ben's booking picked up and dropped on a free slot; Ben is told.
      down: [[0.26, 0.72]],
      keys: function (s) { return [[0, spot(s, 'out')], [0.22, spot(s, 'ben', 0.35, 0.5)], [0.72, spot(s, 'ben', 0.35, 0.5)], [0.95, spot(s, 'out')]]; },
      apply: function (seg, s) {
        var ben = T(s, 'ben');
        var dy = T(s, 'to').offsetTop - T(s, 'from').offsetTop;
        ben.style.transform = 'translateY(' + Math.round(smooth(phase(seg, 0.32, 0.66)) * dy) + 'px)';
        ben.classList.toggle('lift', within(seg, 0.28, 0.72));
        T(s, 'left').style.opacity = phase(seg, 0.3, 0.4);
        T(s, 'free').style.opacity = 1 - phase(seg, 0.58, 0.66);
        T(s, 'bensub').textContent = seg > 0.72 ? 'Moved · Ben was told' : 'Booked on WhatsApp';
        T(s, 'toast').classList.toggle('show', seg > 0.74);
      },
    },
    { // Knowledge: an answer typed in and taught; the question three people asked is answered.
      down: [[0.16, 0.2], [0.69, 0.74]],
      keys: function (s) { return [[0, spot(s, 'out')], [0.14, spot(s, 'box', 0.2, 0.5)], [0.2, spot(s, 'box', 0.2, 0.5)], [0.62, spot(s, 'box', 0.55, 0.6)], [0.69, spot(s, 'teach')], [0.76, spot(s, 'teach')], [0.96, spot(s, 'out')]]; },
      apply: function (seg, s) {
        var taught = seg > 0.74;
        T(s, 'typed').textContent = taught ? '' : KNOW.slice(0, Math.round(KNOW.length * phase(seg, 0.2, 0.6)));
        T(s, 'teach').classList.toggle('is-pressed', within(seg, 0.69, 0.74));
        T(s, 'ans').classList.toggle('show', taught);
        T(s, 'q').classList.toggle('done', taught);
        T(s, 'qsub').textContent = taught ? 'Answered · sent to all 3' : 'Asked by 3 people · it didn’t know';
      },
    },
    { // Inbox: Priya's messages arrive, it's handed to you, and you take it to WhatsApp.
      down: [[0.84, 0.9]],
      keys: function (s) { return [[0, spot(s, 'out')], [0.66, spot(s, 'out')], [0.8, spot(s, 'wa', 0.4)], [1, spot(s, 'wa', 0.4)]]; },
      apply: function (seg, s) {
        ['m0', 'm1', 'm2', 'm3'].forEach(function (n, k) { T(s, n).classList.toggle('show', seg > 0.08 + k * 0.15); });
        T(s, 'wa').classList.toggle('is-pressed', within(seg, 0.84, 0.9));
      },
    },
    { // Messages: Broadcast pressed, the bar fills as you scroll, then it's sent.
      down: [[0.11, 0.16]],
      keys: function (s) { return [[0, spot(s, 'out')], [0.1, spot(s, 'send')], [0.17, spot(s, 'send')], [0.32, spot(s, 'out')]]; },
      apply: function (seg, s) {
        var done = phase(seg, 0.18, 0.85);
        T(s, 'send').classList.toggle('is-pressed', within(seg, 0.11, 0.16));
        T(s, 'bar').style.width = (done * 100).toFixed(1) + '%';
        T(s, 'count').textContent = Math.round(done * 50) + ' of 50 sent' + (done < 1 ? ' · ' + (50 - Math.round(done * 50)) + ' still to go' : '');
        T(s, 'state').textContent = done >= 1 ? 'Sent' : 'Sending';
        T(s, 'toast').classList.toggle('show', seg > 0.87);
      },
    },
    { // Connected apps: switched on one by one.
      down: [0, 1, 2, 3, 4].map(function (k) { return [0.08 + k * 0.17, 0.12 + k * 0.17]; }),
      keys: function (s) {
        var keys = [[0, spot(s, 'out')]];
        [0, 1, 2, 3, 4].forEach(function (k) {
          keys.push([0.06 + k * 0.17, spot(s, 'a' + k, 0.86, 0.5)]);
          keys.push([0.13 + k * 0.17, spot(s, 'a' + k, 0.86, 0.5)]);
        });
        keys.push([1, spot(s, 'out')]);
        return keys;
      },
      apply: function (seg, s) {
        [0, 1, 2, 3, 4].forEach(function (k) {
          var tile = T(s, 'a' + k);
          var on = seg > 0.12 + k * 0.17;
          tile.classList.toggle('on', on);
          tile.querySelector('.sw').classList.toggle('on', on);
          tile.querySelector('small').textContent = on ? 'Connected' : 'Off';
        });
      },
    },
  ];
  $$('.pin-list button', pin).forEach(function (b) {
    b.addEventListener('click', function () {
      var range = pinRange();
      var k = Number(b.getAttribute('data-i'));
      if (reduce) { scrollTo({ top: range.top + (range.total * (k + 0.05)) / count, behavior: 'auto' }); return; }
      heldBack = false;
      if (!playing) setPlaying(true);
      seekTo = k + 0.02;
    });
  });

  // ---------- The pieces play themselves: reach them and the page scrolls on for you, slowly ----------
  // Any scroll of yours (wheel, touch, keys, a click) takes it back; the round button plays or pauses it.
  var PIECE_MS = 7000;
  var playBtn = $('.pin-play', pin);
  var playing = false;
  var heldBack = false; // you took over in this visit; it waits for the button until you leave the pieces
  var autoX = 0;
  var lastFrame = 0;
  var seekTo = null;
  function pinX() {
    var range = pinRange();
    return ((scrollY - range.top) / range.total) * count;
  }
  var loop = 0;
  var expectedY = null;
  function setPlaying(on) {
    playing = on;
    loop++;
    expectedY = null;
    playBtn.classList.toggle('is-playing', on);
    playBtn.setAttribute('aria-label', on ? 'Pause the pieces' : 'Play the pieces');
    if (on) {
      autoX = clamp(pinX(), 0, count);
      lastFrame = 0;
      var mine = loop;
      requestAnimationFrame(function (t) { step(t, mine); });
    }
  }
  function step(now, mine) {
    if (!playing || mine !== loop) return;
    // Moved by something other than this (a key, the find bar, a link): hand it back.
    if (expectedY != null && Math.abs(scrollY - expectedY) > 40) { setPlaying(false); heldBack = true; return; }
    var dt = lastFrame ? Math.min(50, now - lastFrame) : 16;
    lastFrame = now;
    if (seekTo != null) {
      // A jump to a piece glides there quickly, then plays on from it.
      autoX += (seekTo - autoX) * Math.min(1, dt / 120);
      if (Math.abs(seekTo - autoX) < 0.01) { autoX = seekTo; seekTo = null; }
    } else {
      autoX += dt / PIECE_MS;
    }
    if (autoX >= count - 0.001) {
      autoX = count;
      setPlaying(false);
      heldBack = true;
    }
    var range = pinRange();
    expectedY = range.top + (Math.min(autoX, count) / count) * range.total;
    scrollTo({ top: expectedY, behavior: 'instant' });
    if (playing) requestAnimationFrame(function (t) { step(t, mine); });
  }
  function takeBack() {
    if (playing) { setPlaying(false); heldBack = true; }
  }
  addEventListener('wheel', takeBack, { passive: true });
  addEventListener('touchstart', takeBack, { passive: true });
  addEventListener('keydown', function (e) {
    if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(e.key) && !e.target.closest('input, textarea')) takeBack();
  });
  var mouseHeld = false;
  addEventListener('mousedown', function (e) {
    if (e.target.closest('.pin-play, .pin-list button')) return;
    mouseHeld = true;
    takeBack();
  });
  addEventListener('mouseup', function () { mouseHeld = false; });
  // Called on every scroll. Once you've reached the pieces and your own scrolling has settled (a fling's glide
  // included), it plays on from where you are.
  var idleTimer = 0;
  function maybePlay() {
    if (reduce) return;
    var x = pinX();
    playBtn.hidden = !(x > -0.6 && x < count + 0.2);
    if (x < -0.6 || x > count + 0.2) heldBack = false;
    if (playing) return;
    clearTimeout(idleTimer);
    var y = scrollY;
    idleTimer = setTimeout(function () {
      // Still moving (a smooth scroll whose events came slowly): wait for it to settle.
      if (Math.abs(scrollY - y) > 2 || Date.now() < passingUntil) { maybePlay(); return; }
      var at = pinX();
      if (playing || heldBack || mouseHeld || document.hidden) return;
      if (at > -0.02 && at < count - 0.05) setPlaying(true);
    }, 400);
  }
  // A link to somewhere else on the page passes through the pieces without stopping to play them.
  var passingUntil = 0;
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href') !== '#pieces') passingUntil = Date.now() + 1800;
  });
  playBtn.addEventListener('click', function () {
    if (playing) { setPlaying(false); heldBack = true; return; }
    heldBack = false;
    if (pinX() >= count - 0.05) { setPlaying(true); seekTo = 0; return; }
    setPlaying(true);
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
      maybePlay();
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
    cursor.classList.remove('is-gone');
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

    // Its work done, the cursor leaves; the window steps back, and the chat comes up over it.
    if (live) {
      var box = stage.getBoundingClientRect();
      cursor.style.setProperty('--x', Math.round(box.width + 60) + 'px');
      cursor.style.setProperty('--y', Math.round(box.height * 0.7) + 'px');
      cursor.classList.add('is-gone');
    }
    await run.wait(500);
    if (live) {
      mood('');
      toast.classList.remove('is-in');
      stage.classList.add('is-blurred');
    }
    await run.wait(500);
    // Every message is typed first: dots on their side, then the words.
    for (var m = 0; m < s.chat.length; m++) {
      var line = s.chat[m];
      if (line[0] === 'note') {
        await run.wait(500);
        if (live) bubble(line[0], line[1], line[2]);
        continue;
      }
      var ours = line[0] !== 'them';
      await run.wait(350);
      var dots = live ? chat.appendChild(el('div', 'wa typing pop' + (ours ? ' out' : ''), '<b></b><b></b><b></b>')) : null;
      await run.wait(ours ? 1150 : 900);
      if (live) {
        dots.remove();
        bubble(line[0], line[1], line[2]);
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
