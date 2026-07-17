(function () {
  'use strict';

  const SWIPE_THRESHOLD = 40;   // px of vertical swipe to trigger collapse
  const CLS = 'hemma-scrolled';

  let _cards = [];
  let _state = null;
  let _touchStartY = 0;
  let _touchStartX = 0;
  let _autoCollapseTimer = null;
  let _scrollEl = null; // lazily discovered scroll container

  function walkForCards(root, out, depth) {
    if (!root || depth > 20) return;
    root.querySelectorAll('navbar-card').forEach(el => out.push(el));
    root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) walkForCards(el.shadowRoot, out, depth + 1);
    });
  }

  function setState(s) {
    if (s === _state) return;
    _state = s;
    _cards.forEach(el => el.classList.toggle(CLS, s));
  }


  // Touch events are composed:true — they propagate through shadow DOM.
  // Detect a downward swipe and collapse; upward swipe to expand.
  document.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches[0]) {
      _touchStartY = e.touches[0].clientY;
      _touchStartX = e.touches[0].clientX;
    }
  }, { passive: true, capture: true });

  document.addEventListener('touchmove', function (e) {
    if (!e.touches || !e.touches[0]) return;
    const dy = _touchStartY - e.touches[0].clientY; // positive = scrolled down
    const dx = Math.abs(e.touches[0].clientX - _touchStartX);

    // Only react to primarily vertical movement
    if (Math.abs(dy) > dx) {
      if (dy > SWIPE_THRESHOLD) {
        clearTimeout(_autoCollapseTimer);
        setState(true);
        // Discover the scroll container now so we can track it returning to top
        if (!_scrollEl) _scrollEl = findScrolledEl(document, 0);
      }
    }

    // Real-time top detection — expand the moment scrollTop hits 0
    if (_state && _scrollEl && _scrollEl.scrollTop <= 10) {
      setState(false);
    }
  }, { passive: true, capture: true });

  // Walk shadow DOM to find any element whose scrollTop > threshold —
  // this lazily discovers the real scroll container after the user has scrolled
  function findScrolledEl(root, depth) {
    if (!root || depth > 15) return null;
    var els = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.scrollTop > 10) return el;
      if (el.shadowRoot) {
        var found = findScrolledEl(el.shadowRoot, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  // On finger lift: if collapsed, check whether we're back at the top
  document.addEventListener('touchend', function () {
    if (!_state) return; // already expanded
    if (!_scrollEl) _scrollEl = findScrolledEl(document, 0);
    if (_scrollEl && _scrollEl.scrollTop <= 10) setState(false);
  }, { passive: true, capture: true });

  function attachTapHandlers_inner(el) {
    if (el._hemmaClickHandler) el.removeEventListener('click', el._hemmaClickHandler);
    el._hemmaClickHandler = function () {
      if (el.classList.contains(CLS)) {
        clearTimeout(_autoCollapseTimer); // user explicitly opened it
        setState(false);
      }
    };
    el.addEventListener('click', el._hemmaClickHandler);
  }

  function setup() {
    clearTimeout(_autoCollapseTimer);
    _scrollEl = null; // reset cached container on navigation
    _cards = [];
    walkForCards(document, _cards, 0);
    _cards.forEach(attachTapHandlers_inner);

    // Start expanded, then auto-collapse after 3 seconds
    _state = null;
    setState(false);
    _autoCollapseTimer = setTimeout(function () { setState(true); }, 3000);
  }

  window.addEventListener('location-changed', function () {
    _state = null;
    setTimeout(setup, 400);
  });

  function init() {
    if (!document.querySelector('home-assistant')) return setTimeout(init, 500);
    setTimeout(setup, 2000);
  }

  document.readyState === 'complete' ? init() : window.addEventListener('load', init);
})();
