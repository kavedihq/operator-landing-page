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
  // Runs in the browser. It shows the one rule that matters: answer only from what was taught, and pass everything
  // else to the owner without guessing. Matching is plain keywords on purpose; the real product uses the owner's
  // answers and a model, but it follows this rule.
  var OPERATORS = {
    salon: {
      name: 'Studio Nine', avatar: 'SN',
      taught: [
        { topic: 'Prices', answer: 'A cut is $35, and a cut and colour is $90.', keys: ['price', 'cost', 'how much', 'cut', 'colour', 'color'] },
        { topic: 'Opening hours', answer: 'We’re open Tuesday to Saturday, 9am to 6pm. Closed Sunday and Monday.', keys: ['open', 'hours', 'close', 'sunday', 'monday', 'saturday', 'when'] },
        { topic: 'Booking', answer: 'Send me a day and a time and I’ll check what’s free.', keys: ['book', 'appointment', 'slot', 'available', 'tomorrow', 'space'] }
      ],
      asks: ['How much is a cut?', 'Are you open on Sunday?', 'Can you do it for $20?', 'Do you do braids?']
    },
    tutor: {
      name: 'Ms Reyes, Maths', avatar: 'MR',
      taught: [
        { topic: 'Fees', answer: 'Lessons are $30 an hour, or $100 for four.', keys: ['fee', 'price', 'cost', 'how much', 'charge'] },
        { topic: 'Who I teach', answer: 'I teach maths from age 11 up to final-year exams.', keys: ['subject', 'teach', 'maths', 'math', 'level', 'age', 'year old', 'exam'] },
        { topic: 'Where', answer: 'Online on Zoom, or at the library on Saturdays.', keys: ['where', 'online', 'zoom', 'location', 'library', 'address'] }
      ],
      asks: ['How much per lesson?', 'Do you teach 12 year olds?', 'Can my son start tonight?', 'Do you do physics too?']
    },
    church: {
      name: 'Grace Chapel office', avatar: 'GC',
      taught: [
        { topic: 'Service times', answer: 'Sunday services are at 9am and 11am. Wednesday prayer is at 7pm.', keys: ['service', 'time', 'sunday', 'wednesday', 'when', 'prayer'] },
        { topic: 'Address', answer: '14 Hill Road, next to the post office. There’s parking at the back.', keys: ['address', 'where', 'location', 'parking', 'find'] },
        { topic: 'Youth group', answer: 'Youth group meets on Fridays at 6pm, for ages 12 to 18.', keys: ['youth', 'teen', 'friday', 'kids', 'children'] }
      ],
      asks: ['What time is the service?', 'Where are you?', 'Can I book the hall for a wedding?', 'Is there a choir?']
    }
  };
  // Things that are a decision, not a fact. Even with prices taught, Kavedi never agrees to these.
  var DECISIONS = /\b(discount|cheaper|deal|lower|less|guarantee|promise|refund|tonight|hall|wedding|special)\b|for \$/i;

  var TICK = '<svg viewBox="0 0 12 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 5.8 4.2 9 10.5 1.5"/></svg>';
  var TICKS = '<svg viewBox="0 0 16 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 5.8 4.2 9 10.5 1.5"/><path d="M7.4 8.3 8.2 9 14.5 1.5"/></svg>';

  var demo = document.querySelector('.demo');
  if (demo) {
    var thread = demo.querySelector('[data-thread]');
    var asksEl = demo.querySelector('[data-asks]');
    var knownEl = demo.querySelector('[data-known]');
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

    var clock = function () {
      try { return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; }
    };
    var clockEl = demo.querySelector('[data-clock]');
    if (clockEl) clockEl.textContent = clock().replace(/\s?[AP]M$/i, '');

    var scrollDown = function () { thread.scrollTop = thread.scrollHeight; };

    // A new message takes the tail from the one before it when the same person sent both.
    var addMessage = function (dir, text, metaHtml) {
      var last = thread.querySelector('.wa-msg:last-of-type');
      if (last && last.classList.contains(dir)) last.classList.remove('tail');
      var msg = el('p', 'wa-msg tail is-new ' + dir, text);
      var meta = el('span', 'wa-meta');
      meta.innerHTML = metaHtml;
      msg.appendChild(meta);
      thread.appendChild(msg);
      scrollDown();
      return meta;
    };

    var setBusy = function (on) {
      busy = on;
      asksEl.querySelectorAll('button').forEach(function (b) { b.disabled = on; });
    };

    var drawKnown = function (latest) {
      knownEl.innerHTML = '';
      OPERATORS[who].taught.forEach(function (t) {
        var li = el('li', t === latest ? 'is-new' : null);
        li.appendChild(el('b', null, t.topic));
        li.appendChild(el('span', null, t.answer));
        knownEl.appendChild(li);
      });
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
      drawKnown();
    };

    var answerFor = function (question) {
      var q = ' ' + question.toLowerCase() + ' ';
      if (DECISIONS.test(q)) return { decision: true };
      var hit = OPERATORS[who].taught.find(function (t) { return t.keys.some(function (k) { return q.indexOf(k) !== -1; }); });
      return hit ? { answer: hit.answer } : {};
    };

    var ask = async function (question) {
      question = String(question || '').trim();
      if (!question || busy) return;
      setBusy(true);
      statusEl.textContent = '';
      var op = OPERATORS[who];
      var time = clock();
      var meta = addMessage('out', question, time + ' ' + TICK);
      await wait(450);
      meta.innerHTML = time + ' ' + TICKS;

      var result = answerFor(question);
      if (result.answer) {
        await wait(300);
        subEl.textContent = 'typing…';
        await wait(1100);
        meta.innerHTML = time + ' ' + TICKS.replace('<svg ', '<svg class="tick-read" ');
        subEl.textContent = 'online';
        addMessage('in', result.answer, clock());
        statusEl.textContent = 'Answered from what ' + op.name + ' taught it.';
      } else {
        await wait(900);
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
        body.appendChild(el('span', 'chip-warn', 'Kavedi didn’t know the answer'));
        row.appendChild(body);
        waitEl.insertBefore(row, waitEl.firstChild);
        statusEl.textContent = result.decision
          ? 'Nothing sent. That’s ' + op.name + '’s decision to make, so Kavedi passed it on.'
          : 'Nothing sent. Nobody taught it that, so Kavedi passed it to ' + op.name + '.';
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

    demo.querySelector('[data-teach]').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.currentTarget;
      var topic = form.topic.value.trim();
      var answer = form.answer.value.trim();
      if (!topic || !answer) return;
      // Words from the topic become what it listens for, so asking about it finds it.
      var keys = topic.toLowerCase().split(/[^a-z0-9$]+/).filter(function (w) { return w.length > 2; });
      if (!keys.length) keys = [topic.toLowerCase()];
      var item = { topic: topic, answer: answer, keys: keys };
      OPERATORS[who].taught.push(item);
      drawKnown(item);
      form.reset();
      addAsk('What about ' + topic.toLowerCase() + '?', true);
      statusEl.textContent = 'Taught. Now ask about ' + topic.toLowerCase() + '.';
    });

    choose('salon');

    // The first question plays by itself the first time the phone comes into view, so it never sits there empty.
    var phone = demo.querySelector('.demo-phone .device');
    var playFirst = function () {
      if (!busy && !thread.querySelector('.wa-msg')) ask(OPERATORS[who].asks[0]);
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
