/* The beta page: the demo and the application. */
(function () {
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, still ? 0 : ms); }); };
  var el = function (tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  // ============================== THE DEMO ==============================
  // Runs in the browser with made-up businesses. You're the customer; beside the phone are the owner's triggers,
  // which light up as they run. The same rules as the real thing: someone new gets the welcome, words set off the
  // trigger that listens for them, and anything no trigger covers is sent nowhere and waits for the owner.
  var OPERATORS = {
    salon: {
      name: 'Studio Nine', avatar: 'SN',
      triggers: [
        { name: 'Welcome', when: 'Someone messages you for the first time', first: true,
          send: [{ text: 'Hi! Welcome to Studio Nine 👋 Ask for our prices any time, or send a day and a time to book.' }] },
        { name: 'Price list', when: 'Someone sends “price” or “how much”', keys: ['price', 'prices', 'how much', 'cost'],
          send: [{ pic: '/assets/sample-price-list.webp' }, { text: 'Here’s our price list. Which one would you like?' }] },
        { name: 'Opening hours', when: 'Someone sends “open” or “hours”', keys: ['open', 'hours', 'close', 'sunday', 'monday', 'saturday'],
          send: [{ text: 'We’re open Tuesday to Saturday, 9am to 7pm. Closed Sunday and Monday.' }] },
        { name: 'Bookings', when: 'Someone sends “book” or “appointment”', keys: ['book', 'appointment', 'slot', 'available', 'tomorrow'],
          send: [{ text: 'Send me a day and a time and I’ll check what’s free.' }], label: 'Wants to book' }
      ],
      asks: ['Hi!', 'How much is a silk press?', 'Are you open on Sunday?', 'Can you do it for $20?']
    },
    tutor: {
      name: 'Ms Reyes, Maths', avatar: 'MR',
      triggers: [
        { name: 'Welcome', when: 'Someone messages you for the first time', first: true,
          send: [{ text: 'Hi! Thanks for getting in touch. Ask about fees or lesson times, or tell me which year your child is in.' }] },
        { name: 'Fees', when: 'Someone sends “fees” or “how much”', keys: ['fee', 'fees', 'price', 'how much', 'cost', 'charge'],
          send: [{ doc: 'Fees 2026.pdf' }, { text: 'Here are my fees. The first lesson is free.' }] },
        { name: 'Where', when: 'Someone sends “where” or “online”', keys: ['where', 'online', 'zoom', 'library', 'address'],
          send: [{ text: 'Online on Zoom, or at the library on Saturdays.' }] },
        { name: 'Free lesson', when: 'Someone sends “book” or “trial”', keys: ['book', 'trial', 'start', 'first lesson'],
          send: [{ text: 'Send me a day and a time for a free first lesson.' }], label: 'Trial lesson' }
      ],
      asks: ['Hello', 'How much per lesson?', 'Do you teach online?', 'Do you do physics too?']
    },
    church: {
      name: 'Grace Chapel office', avatar: 'GC',
      triggers: [
        { name: 'Welcome', when: 'Someone messages you for the first time', first: true,
          send: [{ text: 'Welcome to Grace Chapel! Ask about service times, where we are, or youth group.' }] },
        { name: 'Service times', when: 'Someone sends “service” or “Sunday”', keys: ['service', 'services', 'time', 'sunday', 'wednesday', 'prayer'],
          send: [{ text: 'Sunday services are at 9am and 11am. Wednesday prayer is at 7pm.' }] },
        { name: 'Directions', when: 'Someone sends “where” or “address”', keys: ['address', 'where', 'location', 'parking', 'find'],
          send: [{ text: 'We’re at 14 Hill Road, next to the post office. There’s parking at the back.' }] },
        { name: 'Youth group', when: 'Someone sends “youth” or “kids”', keys: ['youth', 'teen', 'friday', 'kids', 'children'],
          send: [{ text: 'Youth group meets on Fridays at 6pm, for ages 12 to 18.' }] }
      ],
      asks: ['Good morning', 'What time is the service?', 'Where are you?', 'Can I book the hall for a wedding?']
    }
  };
  // A greeting on its own is answered by the welcome and needs nothing from the owner.
  var GREETING = /^(hi|hello|hey|hiya|good (morning|afternoon|evening)|morning|evening)\b[\s!.,]*$/i;

  var TICK = '<svg viewBox="0 0 12 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 5.8 4.2 9 10.5 1.5"/></svg>';
  var TICKS = '<svg viewBox="0 0 16 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 5.8 4.2 9 10.5 1.5"/><path d="M7.4 8.3 8.2 9 14.5 1.5"/></svg>';
  var DOC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';

  var demo = document.querySelector('.demo');
  if (demo) {
    var thread = demo.querySelector('[data-thread]');
    var asksEl = demo.querySelector('[data-asks]');
    var trigEl = demo.querySelector('[data-triggers]');
    var waitEl = demo.querySelector('[data-wait]');
    var waitEmpty = demo.querySelector('[data-wait-empty]');
    var waitCount = demo.querySelector('[data-wait-count]');
    var statusEl = demo.querySelector('[data-status]');
    var subEl = demo.querySelector('[data-sub]');
    var input = demo.querySelector('#ask-input');
    var sendBtn = demo.querySelector('[data-send]');
    var mic = demo.querySelector('[data-mic]');
    var who = 'salon';
    var busy = false;
    var waiting = 0;
    var spoken = false;

    var clock = function () {
      try { return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; }
    };
    var clockEl = demo.querySelector('[data-clock]');
    if (clockEl) clockEl.textContent = clock().replace(/\s?[AP]M$/i, '');

    var scrollDown = function () { thread.scrollTop = thread.scrollHeight; };

    // A new message takes the tail from the one before it when the same person sent both.
    var addBubble = function (dir, extraClass) {
      var last = thread.querySelector('.wa-msg:last-of-type');
      if (last && last.classList.contains(dir)) last.classList.remove('tail');
      var msg = el('p', 'wa-msg tail is-new ' + dir + (extraClass ? ' ' + extraClass : ''));
      thread.appendChild(msg);
      return msg;
    };
    var addMeta = function (msg, html) {
      var meta = el('span', 'wa-meta');
      meta.innerHTML = html;
      msg.appendChild(meta);
      scrollDown();
      return meta;
    };

    // What a trigger sends, drawn as WhatsApp would: a photo, a file, or a message.
    var addSent = function (item) {
      if (item.pic) {
        var pic = addBubble('in', 'is-pic');
        var img = el('img');
        img.src = item.pic;
        img.alt = 'A price list';
        img.width = 480;
        img.height = 576;
        img.addEventListener('load', scrollDown);
        pic.appendChild(img);
        addMeta(pic, clock());
        return;
      }
      if (item.doc) {
        var doc = addBubble('in', 'is-doc');
        var card = el('span', 'wa-doc');
        card.innerHTML = DOC_ICON;
        var name = el('span');
        name.appendChild(el('b', null, item.doc));
        name.appendChild(el('small', null, 'PDF · 2 pages'));
        card.appendChild(name);
        doc.appendChild(card);
        addMeta(doc, clock());
        return;
      }
      var msg = addBubble('in');
      msg.appendChild(document.createTextNode(item.text));
      addMeta(msg, clock());
    };

    var setBusy = function (on) {
      busy = on;
      asksEl.querySelectorAll('button').forEach(function (b) { b.disabled = on; });
    };

    var drawTriggers = function (latest) {
      trigEl.innerHTML = '';
      OPERATORS[who].triggers.forEach(function (t, i) {
        var li = el('li', 'trg-item' + (t === latest ? ' is-new' : ''));
        li.setAttribute('data-trigger', String(i));
        var top = el('div', 'trg-item-top');
        top.appendChild(el('b', null, t.name));
        var ran = el('span', 'trg-ran', t.runs ? 'Ran ' + t.runs + '×' : '');
        top.appendChild(ran);
        li.appendChild(top);
        var when = el('p', 'trg-line');
        when.appendChild(el('span', 'trg-tag', 'When'));
        when.appendChild(document.createTextNode(t.when));
        li.appendChild(when);
        var does = el('p', 'trg-line');
        does.appendChild(el('span', 'trg-tag is-do', 'Do'));
        var steps = t.send.map(function (s) {
          return s.pic ? 'send the price list' : s.doc ? 'send ' + s.doc : 'send a message';
        }).join(', then ') + (t.label ? ', and label them “' + t.label + '”' : '');
        does.appendChild(document.createTextNode(steps.charAt(0).toUpperCase() + steps.slice(1)));
        li.appendChild(does);
        trigEl.appendChild(li);
      });
    };

    var flash = function (t) {
      t.runs = (t.runs || 0) + 1;
      var i = OPERATORS[who].triggers.indexOf(t);
      var li = trigEl.querySelector('[data-trigger="' + i + '"]');
      if (!li) return;
      li.querySelector('.trg-ran').textContent = 'Ran ' + t.runs + '×';
      li.classList.remove('is-running');
      void li.offsetWidth;
      li.classList.add('is-running');
    };

    var addAsk = function (q, first) {
      var b = el('button', null, q);
      b.type = 'button';
      b.addEventListener('click', function () { ask(q); });
      if (first) asksEl.insertBefore(b, asksEl.firstChild); else asksEl.appendChild(b);
    };

    var choose = function (next) {
      who = next;
      var op = OPERATORS[who];
      op.triggers.forEach(function (t) { t.runs = 0; });
      spoken = false;
      demo.querySelectorAll('[data-who]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-who') === who)); });
      demo.querySelector('[data-name]').textContent = op.name;
      demo.querySelector('[data-avatar]').textContent = op.avatar;
      demo.querySelectorAll('[data-owner]').forEach(function (s) { s.textContent = op.name; });
      thread.querySelectorAll('.wa-msg').forEach(function (m) { m.remove(); });
      waitEl.innerHTML = '';
      waiting = 0;
      waitCount.textContent = '0';
      waitEmpty.hidden = false;
      statusEl.textContent = '';
      asksEl.innerHTML = '';
      op.asks.forEach(function (q) { addAsk(q); });
      drawTriggers();
    };

    // Whole words, as the real triggers match: "cat" is not in "catalogue".
    var said = function (text) { return ' ' + text.toLowerCase().replace(/[^\p{L}\p{N}$]+/gu, ' ').trim() + ' '; };
    var matchFor = function (question) {
      var q = said(question);
      return OPERATORS[who].triggers.find(function (t) {
        return !t.first && t.keys.some(function (k) { return q.indexOf(' ' + k + ' ') !== -1; });
      });
    };

    var run = async function (t) {
      flash(t);
      subEl.textContent = 'typing…';
      await wait(900);
      subEl.textContent = 'online';
      for (var i = 0; i < t.send.length; i += 1) {
        addSent(t.send[i]);
        if (i < t.send.length - 1) await wait(500);
      }
    };

    var ask = async function (question) {
      question = String(question || '').trim();
      if (!question || busy) return;
      setBusy(true);
      statusEl.textContent = '';
      var op = OPERATORS[who];
      var time = clock();
      var mine = addBubble('out');
      mine.appendChild(document.createTextNode(question));
      var meta = addMeta(mine, time + ' ' + TICK);
      await wait(450);
      meta.innerHTML = time + ' ' + TICKS;

      var ran = [];
      var welcome = !spoken && op.triggers.find(function (t) { return t.first; });
      spoken = true;
      var hit = matchFor(question);
      if (welcome || hit) {
        await wait(300);
        meta.innerHTML = time + ' ' + TICKS.replace('<svg ', '<svg class="tick-read" ');
      }
      if (welcome) { await run(welcome); ran.push(welcome.name); }
      if (hit) {
        if (welcome) await wait(600);
        await run(hit);
        ran.push(hit.name);
      }

      if (hit) {
        statusEl.textContent = ran.map(function (n) { return '“' + n + '”'; }).join(' and ') + ' ran' + (hit.label ? ', and labelled you “' + hit.label + '”.' : '.');
      } else if (GREETING.test(question)) {
        statusEl.textContent = welcome ? '“Welcome” ran, because this was your first message.' : 'A hello needs nothing from ' + op.name + '.';
      } else {
        await wait(welcome ? 300 : 900);
        waiting += 1;
        waitCount.textContent = String(waiting);
        waitEmpty.hidden = true;
        var row = el('li', 'wait-row is-new');
        row.appendChild(el('span', 'avatar', 'You'));
        var body = el('div');
        var name = el('div', 'wait-name', 'You');
        name.appendChild(el('span', null, 'now'));
        body.appendChild(name);
        body.appendChild(el('p', 'wait-q', question));
        body.appendChild(el('span', 'chip-warn', 'No trigger for this'));
        row.appendChild(body);
        waitEl.insertBefore(row, waitEl.firstChild);
        statusEl.textContent = (welcome ? '“Welcome” ran. ' : '') + 'No trigger covers that, so nothing else was sent. It’s waiting for ' + op.name + '.';
      }
      setBusy(false);
    };

    demo.querySelectorAll('[data-who]').forEach(function (b) {
      b.addEventListener('click', function () { if (!busy) choose(b.getAttribute('data-who')); });
    });

    // WhatsApp shows the microphone until you type, then the send button.
    var syncSend = function () {
      var typing = input.value.trim().length > 0;
      sendBtn.hidden = !typing;
      mic.hidden = typing;
    };
    input.addEventListener('input', syncSend);
    demo.querySelector('[data-ask]').addEventListener('submit', function (e) {
      e.preventDefault();
      ask(input.value);
      input.value = '';
      syncSend();
    });

    demo.querySelector('[data-add-trigger]').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.currentTarget;
      var word = form.word.value.trim();
      var reply = form.reply.value.trim();
      if (!word || !reply) return;
      var key = said(word).trim();
      if (!key) return;
      var item = { name: word.charAt(0).toUpperCase() + word.slice(1), when: 'Someone sends “' + word + '”', keys: [key], send: [{ text: reply }] };
      OPERATORS[who].triggers.push(item);
      drawTriggers(item);
      form.reset();
      addAsk('Is there ' + key + '?', true);
      statusEl.textContent = 'Added. Now send “' + word + '”.';
    });

    choose('salon');

    // The first message plays by itself the first time the phone comes into view, so it never sits there empty.
    var phone = demo.querySelector('.demo-phone .device');
    var playFirst = function () {
      if (!busy && !thread.querySelector('.wa-msg')) ask(OPERATORS[who].asks[1]);
    };
    if ('IntersectionObserver' in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { seen.disconnect(); setTimeout(playFirst, still ? 0 : 500); }
      }, { threshold: 0.5 });
      seen.observe(phone);
    } else {
      playFirst();
    }
  }

  // ============================== THE APPLICATION ==============================
  // Posts to Kavedi's own server. If that can't be reached (a slow start, a network blip), it goes through Web3Forms
  // instead, so an application is never lost.
  var form = document.querySelector('[data-apply]');
  if (!form) return;
  var LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var ENDPOINT = LOCAL ? 'http://localhost:3001/api/beta/apply' : 'https://app.kavedi.com.ng/api/beta/apply';
  var WEB3FORMS_KEY = 'f04060d7-7b1b-4650-860a-60f03e66933a';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var steps = form.querySelectorAll('[data-step]');
  var bars = form.querySelectorAll('.progress-bar span');
  var stepLabel = form.querySelector('[data-step-label]');
  var errorEl = form.querySelector('[data-error]');
  var emailInput = form.querySelector('#email');
  var current = 1;
  var picked = { role: '', whatsapp: 'unsure' };

  // A guess at where they are, from the device's time zone ("America/New_York" becomes "New York"). They can change it.
  try {
    var zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    var city = zone.split('/').pop().replace(/_/g, ' ');
    if (city && !/^(UTC|GMT|Etc)/i.test(zone)) form.querySelector('#country').value = city;
  } catch (e) {}

  var showError = function (message) { errorEl.textContent = message; errorEl.hidden = !message; };
  var go = function (n) {
    current = n;
    steps.forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== n; });
    bars.forEach(function (b, i) { b.classList.toggle('is-on', i < n); });
    stepLabel.textContent = 'Step ' + n + ' of ' + steps.length;
    showError('');
    var first = form.querySelector('[data-step="' + n + '"] input:not([type=hidden]), [data-step="' + n + '"] textarea, [data-step="' + n + '"] [role=radio]');
    if (first) first.focus({ preventScroll: true });
  };

  form.querySelectorAll('[data-choices]').forEach(function (group) {
    var key = group.getAttribute('data-choices');
    var options = Array.prototype.slice.call(group.querySelectorAll('[role=radio]'));
    var pick = function (b) {
      picked[key] = b.getAttribute('data-value');
      options.forEach(function (o) { o.setAttribute('aria-checked', String(o === b)); });
    };
    options.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = options[(i + 1) % options.length];
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = options[(i - 1 + options.length) % options.length];
        if (next) { e.preventDefault(); pick(next); next.focus(); }
      });
    });
  });

  var emailOk = function () {
    if (EMAIL_RE.test(emailInput.value.trim())) { emailInput.removeAttribute('aria-invalid'); return true; }
    emailInput.setAttribute('aria-invalid', 'true');
    return false;
  };
  form.querySelectorAll('[data-next]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (current === 1 && !emailOk()) {
        showError('That email address doesn’t look right.');
        emailInput.focus();
        return;
      }
      go(current + 1);
    });
  });
  form.querySelectorAll('[data-back]').forEach(function (b) { b.addEventListener('click', function () { go(current - 1); }); });
  // Enter in a text field moves on rather than sending half an application.
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    var next = form.querySelector('[data-step="' + current + '"] [data-next]');
    if (next) next.click();
  });

  // Where they came from: ?utm_source=instagram becomes "beta:instagram". Without a tag, the site that sent them to the
  // first Kavedi page they opened in this tab, so a plain kavedi.com.ng/beta in a bio is still counted.
  var REFERRERS = [
    [/(^|\.)instagram\.com$/, 'instagram'], [/^t\.co$|(^|\.)(x|twitter)\.com$/, 'x'], [/(^|\.)youtube\.com$|^youtu\.be$/, 'youtube'],
    [/(^|\.)facebook\.com$|^fb\.me$/, 'facebook'], [/(^|\.)linkedin\.com$|^lnkd\.in$/, 'linkedin'], [/(^|\.)tiktok\.com$/, 'tiktok'],
    [/(^|\.)google\.[a-z.]+$/, 'google']
  ];
  var fromReferrer = function (url) {
    var host = '';
    try { host = new URL(url).hostname; } catch (e) { return ''; }
    for (var i = 0; i < REFERRERS.length; i++) if (REFERRERS[i][0].test(host)) return REFERRERS[i][1];
    return '';
  };
  var source = function () {
    var utm = new URLSearchParams(location.search).get('utm_source');
    if (!utm && window.kvGetAttribution) {
      var seen = window.kvGetAttribution();
      utm = seen.utm_source || fromReferrer(seen.referrer || '');
    }
    return utm ? 'beta:' + utm.replace(/[^a-z0-9_-]/gi, '').slice(0, 30) : 'beta-page';
  };
  var application = function () {
    return {
      email: emailInput.value.trim(),
      name: form.querySelector('#name').value.trim(),
      role: picked.role,
      whatsapp: picked.whatsapp,
      country: form.querySelector('#country').value.trim(),
      about: form.querySelector('#about').value.trim(),
      website: form.querySelector('#website').value,
      source: source()
    };
  };

  var viaKavedi = function (data) {
    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 12000) : null;
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.json().catch(function () { return {}; }).then(function (body) { return { status: res.status, body: body }; });
    });
  };
  var viaWeb3Forms = function (data) {
    var fd = new FormData();
    fd.append('access_key', WEB3FORMS_KEY);
    fd.append('subject', 'New Kavedi beta application');
    fd.append('from_name', 'Kavedi beta');
    Object.keys(data).forEach(function (k) { if (k !== 'website') fd.append(k, data[k]); });
    if (window.kvAppendAttribution) window.kvAppendAttribution(fd, 'beta');
    return fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (body) { if (!body || !body.success) throw new Error('web3forms'); });
  };

  var done = function (email) {
    var card = document.querySelector('[data-form-card]');
    var box = el('div', 'done');
    box.setAttribute('tabindex', '-1');
    var mark = el('div', 'done-mark');
    mark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
    box.appendChild(mark);
    box.appendChild(el('h3', null, 'You’re on the list.'));
    box.appendChild(el('p', null, 'We’ll email ' + email + ' when it’s your turn. The link in that email opens Kavedi and signs you straight in.'));
    card.innerHTML = '';
    card.appendChild(box);
    box.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = application();
    if (!EMAIL_RE.test(data.email)) { go(1); emailOk(); showError('That email address doesn’t look right.'); return; }
    var btn = form.querySelector('[data-submit]');
    var label = form.querySelector('[data-submit-label]');
    btn.disabled = true;
    label.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending';
    var reset = function (message) { btn.disabled = false; label.textContent = 'Send application'; showError(message); };

    viaKavedi(data).then(function (result) {
      if (result.status === 200 && result.body && result.body.ok) return done(data.email);
      if (result.status === 400) { go(1); return reset((result.body && result.body.error) || 'Check your email address.'); }
      if (result.status === 429) return reset((result.body && result.body.error) || 'That’s a lot of tries. Wait a little and try again.');
      // Anything else (a 5xx, the server not reached): don't lose them.
      return viaWeb3Forms(data).then(function () { done(data.email); });
    }).catch(function () {
      return viaWeb3Forms(data).then(function () { done(data.email); });
    }).catch(function () {
      reset('That didn’t go through. Try again, or email support@kavedi.com.ng and we’ll add you by hand.');
    });
  });
})();
