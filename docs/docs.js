// Kavedi Docs: search (⌘K or /), the menu on a phone, "On this page" following the scroll, and the theme toggle.
// The search index is written by _docs/build.cjs into search.json beside this file.
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Theme: the device's, unless a choice was saved.
  const root = document.documentElement;
  const saved = (() => { try { return localStorage.getItem('kavedi.docs.theme'); } catch { return null; } })();
  if (saved) root.dataset.theme = saved;
  const isDark = () => root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  $('#d-theme')?.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('kavedi.docs.theme', next); } catch { /* private window: just for now */ }
  });

  // The menu on a phone.
  $('#d-menu')?.addEventListener('click', () => document.body.classList.toggle('is-menu'));
  document.addEventListener('click', (event) => {
    if (document.body.classList.contains('is-menu') && !event.target.closest('.d-side, #d-menu')) document.body.classList.remove('is-menu');
  });
  // The page you're on, in view in the sidebar, without moving the page itself.
  const side = $('.d-side');
  const here = $('.d-side [aria-current="page"]');
  if (side && here && here.offsetTop + here.offsetHeight > side.clientHeight - 40) side.scrollTop = here.offsetTop - side.clientHeight / 2;

  // On this page: the section being read is marked.
  const links = $$('.d-toc a');
  if (links.length) {
    const heads = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
    const mark = () => {
      let current = heads[0];
      for (const head of heads) if (head.getBoundingClientRect().top < 120) current = head;
      links.forEach((a) => a.classList.toggle('is-on', current && a.hash === `#${current.id}`));
    };
    addEventListener('scroll', mark, { passive: true });
    mark();
  }

  // Search.
  const dialog = $('#d-dialog');
  const input = $('#d-find');
  const results = $('#d-results');
  let index = null;
  let picked = 0;
  const load = async () => {
    if (index) return index;
    try {
      index = await (await fetch('/docs/search.json')).json();
    } catch {
      index = [];
    }
    return index;
  };
  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const hl = (text, words) => words.reduce((out, word) => out.replace(new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>'), esc(text));
  const draw = async () => {
    const all = await load();
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    let list;
    if (!words.length) list = all.filter((one) => !one.anchor).slice(0, 8);
    else {
      list = all
        .map((one) => {
          const hay = `${one.title} ${one.page} ${one.text}`.toLowerCase();
          if (!words.every((word) => hay.includes(word))) return null;
          const score = words.reduce((s, word) => s + (one.title.toLowerCase().includes(word) ? 3 : 0) + (one.page.toLowerCase().includes(word) ? 1 : 0), 0) + (one.anchor ? 0 : 1);
          return { one, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map(({ one }) => one);
    }
    picked = 0;
    results.innerHTML = list.length
      ? list.map((one, i) => `<a href="${one.url}"${i === 0 ? ' class="is-on"' : ''}><b>${hl(one.title, words)}</b><span>${esc(one.anchor ? one.page : one.group)}</span></a>`).join('')
      : `<div class="d-empty">Nothing found for “${esc(input.value)}”.</div>`;
  };
  const open = () => {
    dialog.classList.add('is-open');
    input.value = '';
    draw();
    setTimeout(() => input.focus(), 0);
  };
  const close = () => dialog.classList.remove('is-open');
  $$('[data-search]').forEach((button) => button.addEventListener('click', open));
  dialog?.addEventListener('click', (event) => event.target === dialog && close());
  input?.addEventListener('input', draw);
  input?.addEventListener('keydown', (event) => {
    const items = $$('a', results);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      picked = (picked + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % Math.max(items.length, 1);
      items.forEach((a, i) => a.classList.toggle('is-on', i === picked));
      items[picked]?.scrollIntoView({ block: 'nearest' });
    }
    if (event.key === 'Enter' && items[picked]) location.href = items[picked].href;
  });
  document.addEventListener('keydown', (event) => {
    if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !/input|textarea/i.test(document.activeElement?.tagName))) {
      event.preventDefault();
      open();
    }
    if (event.key === 'Escape') {
      close();
      document.body.classList.remove('is-menu');
    }
  });
})();
