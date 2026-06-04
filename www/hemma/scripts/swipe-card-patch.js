// Syncs the active swiper pagination bullet color to match the slide's
// TV SHOW (purple) or MOVIE (amber) badge color.
//
// Bullet size/shape is handled by card_mod CSS injected into swipe-card's
// shadow root. This script only overrides the active bullet's background color.
//
// Strategy: watch document.body for popup elements being appended (browser-mod
// adds a top-level element when a popup opens). Once found, deep-walk its shadow
// DOM tree to locate swipe-card, then attach a MutationObserver on its shadow
// root to react to slide changes.
(function () {
  const TV_COLOR    = '#9333ea';
  const MOVIE_COLOR = '#e5a00d';

  function getActiveColor(swipeRoot) {
    const slide = swipeRoot.querySelector('.swiper-slide-active');
    if (!slide) return null;
    const card = slide.firstElementChild;
    if (!card || !card.shadowRoot) return null;
    // Badge div has inline style containing "border-radius:16px"
    const badge = card.shadowRoot.querySelector('div[style*="border-radius:16px"]');
    if (!badge) return null;
    const span = badge.querySelector('span');
    return span && span.textContent.trim() === 'TV SHOW' ? TV_COLOR : MOVIE_COLOR;
  }

  function syncColor(swipeRoot) {
    const color = getActiveColor(swipeRoot);
    if (!color) return;
    swipeRoot.querySelectorAll('.swiper-pagination-bullet-active').forEach(b => {
      b.style.setProperty('background', color, 'important');
    });
  }

  function attachToSwipeCard(el) {
    const root = el.shadowRoot;
    if (!root || root._hemmaSync) return;
    root._hemmaSync = true;
    syncColor(root);
    new MutationObserver(() => syncColor(root)).observe(root, {
      subtree: true,
      childList: true,
      attributeFilter: ['class'],
    });
  }

  // Recursively walk light DOM and shadow roots to find swipe-card elements.
  // Returns true if at least one swipe-card was found.
  function deepFind(node) {
    if (!node || node.nodeType !== 1) return false;
    let found = false;
    if (node.localName === 'swipe-card') {
      attachToSwipeCard(node);
      found = true;
    }
    const all = node.querySelectorAll ? Array.from(node.querySelectorAll('*')) : [];
    for (const child of all) {
      if (child.localName === 'swipe-card') {
        attachToSwipeCard(child);
        found = true;
      }
      if (child.shadowRoot && deepFind(child.shadowRoot)) found = true;
    }
    return found;
  }

  function scanWithRetry(node, retries) {
    if (deepFind(node) || retries <= 0) return;
    setTimeout(() => scanWithRetry(node, retries - 1), 350);
  }

  // Watch for new top-level elements added to body (popup opens)
  new MutationObserver(muts => {
    muts.forEach(m => m.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        setTimeout(() => scanWithRetry(node, 4), 300);
      }
    }));
  }).observe(document.body, { childList: true });
})();
