// kavedi.com's home page: the headline that writes itself, the video slots, the pinned pieces, the little films in
// "In practice" and answers that open smoothly. No library. Everything still reads with JavaScript off.
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // The menu shrinks into a pill once you scroll.
  var nav = $('#nav');

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
    var i = 0;
    var tick = function () {
      if (i >= chars.length) {
        title.classList.add('done');
        showRest();
        setTimeout(function () { caret.classList.add('is-gone'); }, 1800);
        return;
      }
      var c = chars[i++];
      c.classList.add('on');
      c.after(caret);
      if (i > chars.length * 0.7) showRest();
      setTimeout(tick, /[,.]/.test(c.textContent) ? 280 : 30 + Math.random() * 45);
    };
    setTimeout(tick, 300);
  } else {
    showRest();
  }

  // ---------- Video slots: a frame with data-video set plays that video instead of the drawing ----------
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
    else video.autoplay = true;
    slot.replaceChildren(video);
    // Plays only while it's on screen.
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? video.play().catch(function () {}) : video.pause();
      }, { threshold: 0.25 }).observe(video);
    }
  });

  // ---------- "Make it an agent": the document builds itself while it's on screen (until the video comes) ----------
  var doc = $('#agent-doc');
  if (doc && !reduce && 'IntersectionObserver' in window) {
    var typed = $('.typed', doc);
    var words = typed.getAttribute('data-text');
    var go = $('.doc-go', doc);
    var items = $$('li', doc);
    var docSeen = false;
    var docBusy = false;
    var nap = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var build = async function () {
      docBusy = true;
      while (docSeen) {
        typed.textContent = '';
        items.forEach(function (li) { li.classList.add('is-hidden'); });
        await nap(500);
        for (var k = 0; k < words.length; k++) {
          typed.textContent += words[k];
          await nap(26 + Math.random() * 34);
        }
        await nap(350);
        go.classList.add('is-down');
        await nap(160);
        go.classList.remove('is-down');
        for (var j = 0; j < items.length; j++) {
          await nap(420);
          items[j].classList.remove('is-hidden');
        }
        await nap(5200);
      }
      docBusy = false;
    };
    new IntersectionObserver(function (entries) {
      docSeen = entries[0].isIntersecting;
      if (docSeen && !docBusy) build();
    }, { threshold: 0.45 }).observe(doc);
  }

  // ---------- "The pieces": the page holds still while the list moves on, one picture beside it ----------
  var pin = $('#pieces');
  var lis = $$('.pin-list li', pin);
  var screens = $$('.scr', pin);
  var bars = $$('.pin-bars i', pin);
  var count = lis.length;
  var current = -1;
  function pinRange() {
    var top = pin.getBoundingClientRect().top + scrollY;
    return { top: top, total: Math.max(1, pin.offsetHeight - innerHeight) };
  }
  function updatePin() {
    var range = pinRange();
    var p = Math.min(1, Math.max(0, (scrollY - range.top) / range.total));
    var x = p * count;
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
      nav.classList.toggle('is-small', scrollY > 60);
      updatePin();
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // ---------- "In practice": say it, watch it work ----------
  // Made-up people at a made-up studio. Each scene: what's typed, the steps it becomes, then the chat on someone's phone.
  // Chat lines: ['out', words] they send, ['in', words] the agent's reply, ['pic', file, words], ['day', label],
  // ['toast', colour, icon, title, line] what pops up in the app.
  var SCENES = [
    {
      tab: 'Price list',
      ask: 'When someone asks for prices, send the price list',
      steps: ['They ask about prices, in any words', 'Send <span class="tag">price-list.jpg</span> with “Here you go, {first name}!”', 'Hand over to you when they ask for a discount'],
      chat: [['out', 'how much is a birthday cake? 🎂', '02:13'], ['pic', 'price-list.jpg', 'Here you go, Maya! Birthday cakes start at $38.', '02:13'], ['out', 'perfect, thank you!!', '02:14']],
    },
    {
      tab: 'Bookings',
      ask: 'Book cake tastings on Saturdays, between 11 and 4',
      steps: ['They want to book, move or cancel', 'Find <span class="tag">free times</span> on Saturday, 11:00 to 16:00', '<span class="tag">Book</span> the one they pick and confirm it'],
      chat: [['out', 'can I come in on Saturday?', '12:40'], ['in', 'Saturday I have 11:30 or 14:00. Which works?', '12:40'], ['out', '14:00 pls', '12:41'], ['in', 'Booked ✓ Saturday 4 Oct, 14:00. See you then, Ben!', '12:41'], ['toast', '#D9443A', 'i-cal', 'New booking', 'Ben Carter · Sat 14:00']],
    },
    {
      tab: 'Reminders',
      ask: 'Remind people the day before their booking',
      steps: ['24 hours before a booking', 'Send “Hi {first name}, see you tomorrow at {time} 🙂 Reply 2 to move it.”'],
      chat: [['day', 'Friday'], ['in', 'Hi Sofia, see you tomorrow at 14:00 🙂 Reply 2 to move it.', '14:00'], ['out', 'can’t wait!', '14:06']],
    },
    {
      tab: 'Handed to you',
      ask: 'If someone wants a refund, hand it to me',
      steps: ['Answer from what you know', 'Hand over to you when they want a refund'],
      chat: [['out', 'my order came squashed, I want a refund', '23:57'], ['in', 'So sorry Priya! I’ve passed this to Nina, she’ll sort it first thing.', '23:58'], ['toast', '#2F6FDE', 'i-inbox', 'In your inbox', 'Priya Nair · they want a refund']],
    },
    {
      tab: 'Get paid',
      ask: 'When they confirm an order, send a payment link',
      steps: ['They confirm an order', 'Make a <span class="tag">payment link</span> for the total', 'Send “Here’s your link: {payment}”'],
      chat: [['out', 'yes, 2 boxes of cupcakes please', '16:14'], ['in', 'Here’s your link, Emma: pay.stripe.com/kv-42 · $42.00', '16:14'], ['out', 'done ✅', '16:19'], ['toast', '#635BFF', 'i-card', 'Someone paid', 'Emma Clarke · $42.00']],
    },
  ];

  var play = $('#play');
  var stage = $('.play-stage', play);
  var tabsBox = $('.play-tabs', play);
  var part = function (name) { return $('[data-p="' + name + '"]', stage); };
  var ask = part('ask'), askText = $('.typed', ask), buildBtn = part('build'), steps = part('steps'), sw = part('switch');
  var chat = part('chat'), status = part('status'), toast = part('toast'), cursor = part('cursor');
  var visible = false;
  var control = null;
  var STOP = {};
  var esc = function (t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };

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

  function bubble(kind, a, b, c) {
    var el = document.createElement('div');
    if (kind === 'day') {
      el.className = 'skip-day pop';
      el.textContent = a;
    } else {
      el.className = 'wa pop' + (kind === 'out' ? ' out' : '');
      el.innerHTML = (kind === 'pic' ? '<div class="pic">' + esc(a) + '</div>' + esc(b) : esc(a)) + '<time>' + esc(kind === 'pic' ? c : b) + '</time>';
    }
    chat.appendChild(el);
    while (chat.children.length > 6) chat.removeChild(chat.firstChild);
    return el;
  }
  function showToast(colour, icon, head, line) {
    toast.innerHTML = '<span class="tile" style="--c:' + colour + '"><svg class="ic"><use href="#' + icon + '"/></svg></span><div><strong>' + esc(head) + '</strong><small>' + esc(line) + '</small></div>';
    toast.classList.add('is-in');
  }
  function reset(s) {
    askText.textContent = '';
    steps.innerHTML = '';
    sw.classList.remove('on');
    chat.innerHTML = '';
    toast.classList.remove('is-in');
    status.textContent = 'online';
  }
  function addStep(html, n) {
    var li = document.createElement('li');
    li.className = 'pop';
    li.innerHTML = '<b>' + n + '</b><span>' + html + '</span>';
    steps.appendChild(li);
  }
  // The finished picture of a scene, for anyone who asks for less motion.
  function still(s) {
    reset(s);
    askText.textContent = s.ask;
    s.steps.forEach(function (h, k) { addStep(h, k + 1); });
    sw.classList.add('on');
    s.chat.forEach(function (line) {
      if (line[0] === 'toast') showToast(line[1], line[2], line[3], line[4]);
      else bubble(line[0], line[1], line[2], line[3]);
    });
  }

  // One run of a scene. `dry` counts how long it takes (to draw the tab's progress) without waiting.
  function runner(ctl, dry) {
    var total = 0;
    var elapsed = 0;
    var fill = null;
    var api = {
      setFill: function (el, est) { fill = el; total = est; },
      spent: function () { return total; },
      wait: function (ms) {
        if (dry) { total += ms; return Promise.resolve(); }
        elapsed += ms;
        if (fill) {
          fill.style.transition = 'width ' + ms + 'ms linear';
          fill.style.width = Math.min(100, (elapsed / total) * 100) + '%';
        }
        return new Promise(function (resolve, reject) {
          var left = ms;
          var last = performance.now();
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
      move: function (el, dx, dy) {
        if (!dry) {
          var s = stage.getBoundingClientRect();
          var r = el.getBoundingClientRect();
          cursor.style.setProperty('--x', Math.round(r.left - s.left + r.width * (dx == null ? 0.5 : dx)) + 'px');
          cursor.style.setProperty('--y', Math.round(r.top - s.top + r.height * (dy == null ? 0.55 : dy)) + 'px');
        }
        return api.wait(800);
      },
      click: async function () {
        if (!dry) cursor.classList.add('is-down');
        await api.wait(160);
        if (!dry) cursor.classList.remove('is-down');
        await api.wait(120);
      },
    };
    return api;
  }

  async function scene(s, run, dry) {
    if (!dry) reset(s);
    await run.wait(500);
    await run.move(ask, 0.3);
    await run.click();
    for (var k = 0; k < s.ask.length; k++) {
      if (!dry) askText.textContent += s.ask[k];
      await run.wait(28);
    }
    await run.wait(250);
    await run.move(buildBtn);
    await run.click();
    if (!dry) buildBtn.classList.add('is-down');
    await run.wait(140);
    if (!dry) buildBtn.classList.remove('is-down');
    for (var j = 0; j < s.steps.length; j++) {
      await run.wait(420);
      if (!dry) addStep(s.steps[j], j + 1);
    }
    await run.wait(300);
    await run.move(sw);
    await run.click();
    if (!dry) sw.classList.add('on');
    await run.wait(300);
    await run.move(chat, 0.15, 0.95);
    for (var m = 0; m < s.chat.length; m++) {
      var line = s.chat[m];
      if (line[0] === 'out' || line[0] === 'day') {
        await run.wait(line[0] === 'day' ? 400 : 750);
        if (!dry) bubble(line[0], line[1], line[2]);
      } else if (line[0] === 'toast') {
        await run.wait(500);
        if (!dry) showToast(line[1], line[2], line[3], line[4]);
        await run.wait(400);
      } else {
        await run.wait(400);
        var dots = null;
        if (!dry) {
          status.textContent = 'typing…';
          dots = document.createElement('div');
          dots.className = 'wa typing pop';
          dots.innerHTML = '<b></b><b></b><b></b>';
          chat.appendChild(dots);
        }
        await run.wait(1100);
        if (!dry) {
          dots.remove();
          status.textContent = 'online';
          bubble(line[0], line[1], line[2], line[3]);
        }
      }
    }
    await run.wait(2800);
  }

  var currentScene = 0;
  async function start(k) {
    if (control) control.stop = true;
    var ctl = (control = { stop: false });
    currentScene = k;
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
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.3 }).observe(stage);
  } else {
    visible = true;
  }
  start(0);

  // ---------- Questions: answers open and close smoothly ----------
  $$('.faq details').forEach(function (d) {
    var sum = $('summary', d);
    var ans = $('.ans', d);
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (d._anim) d._anim.cancel();
      var easing = 'cubic-bezier(.3,.7,0,1)';
      if (d.classList.contains('is-open')) {
        d.classList.remove('is-open');
        if (reduce) { d.open = false; return; }
        var from = ans.offsetHeight;
        d._anim = ans.animate([{ height: from + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 280, easing: easing });
        d._anim.onfinish = function () { d.open = false; d._anim = null; };
      } else {
        d.open = true;
        d.classList.add('is-open');
        if (reduce) return;
        var to = ans.offsetHeight;
        d._anim = ans.animate([{ height: '0px', opacity: 0 }, { height: to + 'px', opacity: 1 }], { duration: 380, easing: easing });
        d._anim.onfinish = function () { d._anim = null; };
      }
    });
  });
})();
