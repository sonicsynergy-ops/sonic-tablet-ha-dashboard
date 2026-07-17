// Hemma sidebar offset — sets --hemma-sidebar-w on :root so the desktop navbar
// (.navbar.desktop.top) stays centred within the content area when HA's built-in
// sidebar is visible.
//
// Registered as a Lovelace resource (type: module) in configuration.yaml so it
// runs once per page load, completely independent of card render cycles.

(function () {
  if (window._hemmaSidebarOffset) return;
  window._hemmaSidebarOffset = true;

  var html = document.documentElement;
  var lastW = -1;
  var debounce = null;
  var observersReady = false;

  function findSidebar() {
    try {
      var ha = document.querySelector('home-assistant');
      if (!ha || !ha.shadowRoot) return null;
      var ham = ha.shadowRoot.querySelector('home-assistant-main');
      if (!ham || !ham.shadowRoot) return null;
      // Modern HA: ha-sidebar is a direct child of home-assistant-main shadow root
      var sb = ham.shadowRoot.querySelector('ha-sidebar');
      if (sb) return sb;
      // Older HA: ha-sidebar inside ha-drawer
      var dr = ham.shadowRoot.querySelector('ha-drawer');
      if (!dr) return null;
      return dr.shadowRoot ? dr.shadowRoot.querySelector('ha-sidebar') : dr.querySelector('ha-sidebar');
    } catch (e) {
      return null;
    }
  }

  function setWidth(w) {
    if (w !== lastW) {
      lastW = w;
      html.style.setProperty('--hemma-sidebar-w', w + 'px');
    }
  }

  function apply() {
    var sb = findSidebar();
    if (!sb) return false;

    var r = sb.getBoundingClientRect();
    // Sidebar is visible when it has width AND its right edge is on-screen (> 0)
    var w = (r.width > 0 && r.right > 0) ? Math.round(r.width) : 0;

    if (w > 0) {
      if (debounce) { clearTimeout(debounce); debounce = null; }
      setWidth(w);
    } else {
      // Sidebar may be animating closed — debounce to confirm it's really gone
      if (!debounce) {
        debounce = setTimeout(function () {
          debounce = null;
          var sb2 = findSidebar();
          if (sb2) {
            var r2 = sb2.getBoundingClientRect();
            setWidth((r2.width > 0 && r2.right > 0) ? Math.round(r2.width) : 0);
          }
        }, 300);
      }
    }
    return true;
  }

  function setupObservers() {
    if (observersReady) return;
    var sb = findSidebar();
    if (!sb) return;
    observersReady = true;

    // Watch sidebar resize (collapse / expand)
    try { new ResizeObserver(apply).observe(sb); } catch (e) {}

    // Watch attribute changes on sidebar and its parent (e.g. narrow / alwaysExpand)
    try {
      var mo = new MutationObserver(apply);
      mo.observe(sb, { attributes: true });
      if (sb.parentNode) mo.observe(sb.parentNode, { attributes: true, childList: true });
    } catch (e) {}
  }

  function init() {
    if (apply()) {
      setupObservers();
      return;
    }
    // HA hasn't finished rendering yet — poll until sidebar is in the DOM
    var attempts = 0;
    var iv = setInterval(function () {
      if (++attempts > 60) { clearInterval(iv); return; } // give up after ~15 s
      if (apply()) {
        clearInterval(iv);
        setupObservers();
      }
    }, 250);
  }

  // Run at three staggered times to cover slow initial loads
  setTimeout(init, 200);
  setTimeout(init, 1500);
  setTimeout(init, 5000);
})();
