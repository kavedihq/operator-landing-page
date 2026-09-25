/* The 404 page's animation: a penguin fishing the missing page out of the water. With reduced motion it stands still. */
(function () {
  var el = document.querySelector('.lost-art');
  if (!el || !window.lottie) return;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anim = window.lottie.loadAnimation({
    container: el, renderer: 'svg', loop: true, autoplay: !still, path: el.getAttribute('data-lottie'),
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
  });
  anim.addEventListener('DOMLoaded', function () {
    // The scene is 500 × 500; everything that moves stays within x 11–484, y 135–366 (measured over the loop).
    var svg = el.querySelector('svg');
    if (svg) svg.setAttribute('viewBox', '3 125 490 252');
    if (still) anim.goToAndStop(0, true);
  });
  window.__lost = anim;
})();
