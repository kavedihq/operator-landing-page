/* The 404 page's animation: a hand-drawn cat trotting nowhere. With reduced motion it stands still. */
(function () {
  var el = document.querySelector('.lost-art');
  if (!el || !window.lottie) return;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anim = window.lottie.loadAnimation({
    container: el, renderer: 'svg', loop: true, autoplay: !still, path: el.getAttribute('data-lottie'),
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
  });
  anim.addEventListener('DOMLoaded', function () {
    // The scene is 1080 × 1080; the cat and its ground stay within x 149–978, y 180–950 (measured over the loop).
    var svg = el.querySelector('svg');
    if (svg) svg.setAttribute('viewBox', '130 160 870 810');
    if (still) anim.goToAndStop(0, true);
  });
  window.__lost = anim;
})();
