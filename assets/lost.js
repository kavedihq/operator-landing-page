/* The 404 page's drawing: a cat draws itself in one line, then a mouse runs off with the page.
   Colours come from the theme (see .lost-art in kv.css), so it works in light and dark. */
(function () {
  var cat = document.querySelector('.lost-cat');
  var mouse = document.querySelector('.lost-mouse');
  if (!cat || !mouse || !window.lottie) return;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var load = function (el, loop) {
    return window.lottie.loadAnimation({
      container: el, renderer: 'svg', loop: loop, autoplay: false, path: el.getAttribute('data-lottie'),
      rendererSettings: { preserveAspectRatio: 'xMidYMax meet' }
    });
  };
  var catAnim = load(cat, false);
  var mouseAnim = load(mouse, true);

  // The mouse's scene is 1920 × 1080; show just the part it runs through.
  mouseAnim.addEventListener('DOMLoaded', function () {
    var svg = mouse.querySelector('svg');
    // Its whole run, measured frame by frame: a loop at the far left, a dip, then off the right edge.
    if (svg) svg.setAttribute('viewBox', '-170 440 2070 680');
    if (still) mouseAnim.goToAndStop(150, true);
  });
  catAnim.addEventListener('DOMLoaded', function () {
    if (still) { catAnim.goToAndStop(catAnim.totalFrames - 1, true); return; }
    setTimeout(function () { catAnim.play(); }, 300);
  });
  catAnim.addEventListener('complete', function () {
    if (!still) setTimeout(function () { mouseAnim.play(); }, 200);
  });
  window.__lost = { cat: catAnim, mouse: mouseAnim };
})();
