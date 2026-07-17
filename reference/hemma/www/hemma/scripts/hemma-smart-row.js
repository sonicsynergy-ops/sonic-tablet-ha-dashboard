// hemma-smart-row.js
// Smart entity row: on desktop, active cards slide to the left with FLIP transitions.
// Mobile portrait/landscape renders normally without reordering.
//
// Active state is detected via --hemma-active-overlay-opacity: 1 on button-card's
// shadow DOM ha-card. This works for all hemma templates (plant, plex, custom logic).
// Falls back to entity-state matching before DOM is available.
//
// Timeline on page load:
//   t=0             pre-sort from hass state; active cards get position 1,2,3…
//                   hemmaFadeInRight stagger plays active-first, no re-sort needed
//   t=PAGE_ANIM_MS  silent DOM re-seed (catches plant/numeric states); no animation
//   t=PAGE_ANIM_MS+2s / +5s  retries for any remaining undetected active states

const ACTIVE_STATES = new Set([
  'on', 'open', 'opening', 'playing', 'unlocked', 'unlocking',
  'cleaning', 'returning', 'cool', 'heat', 'washing', 'rinsing',
  'spinning', 'drying', 'running', 'active', 'problem',
]);

const PAGE_ANIM_MS  = 900;  // budget for button-card's hemmaFadeInRight to finish
const SORT_DELAY_MS = 2500; // hold time before sort triggers (activation & deactivation)
const SORT_MS       = 450;  // FLIP slide duration
const EASE_FORWARD  = 'cubic-bezier(0.4, 0, 0.2, 1)'; // smooth deceleration, no overshoot
const EASE_BACK     = 'cubic-bezier(0.4, 0, 0.2, 1)'; // same for all cards — cohesive motion
const STAGGER_MS    = 0;    // all cards move together (stagger created cascade that felt bouncy)

function isDesktop() {
  const p = window.matchMedia('(max-width: 767px) and (orientation: portrait), (max-height: 500px) and (orientation: portrait)').matches;
  const l = window.matchMedia('(max-height: 600px) and (orientation: landscape)').matches;
  return !p && !l;
}

class HemmaSmartRow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass            = null;
    this._config          = null;
    this._helpers         = null;
    this._cards           = [];
    this._wrappers        = [];
    this._cardsCreated    = false;
    this._initialized     = false;
    this._initializing    = false;
    this._activeSet       = new Set();
    this._activationOrder = [];
    this._sortTimer       = null;
    this._rafId           = null;
    this._sortEnabled     = true;
  }

  connectedCallback() {
    if (!this._initialized || !this._wrappers.length) return;

    // Navigating back to this view: button-card will replay hemmaFadeInRight.
    // Rewrite --hemma-anim-delay on every wrapper to reflect the CURRENT sort
    // order so the animation sweep always matches what's actually on screen.
    // connectedCallback fires synchronously before button-card's Lit render,
    // so the correct delays are in place before any animation frame runs.
    const inactive = this._config.cards.map((_, i) => i)
      .filter(i => !this._activeSet.has(i));
    const currentOrder = [...this._activationOrder, ...inactive];
    currentOrder.forEach((origIdx, pos) => {
      this._wrappers[origIdx].style.setProperty(
        '--hemma-anim-delay', `${(pos * 0.04).toFixed(2)}s`
      );
    });
  }

  disconnectedCallback() {
    // Cancel pending async work only — do not reset card/init state.
    // Lovelace reuses the same element instance when navigating back to a view,
    // so resetting _cardsCreated/_initialized would cause _init() to double-append.
    if (this._sortTimer) { clearTimeout(this._sortTimer); this._sortTimer = null; }
    if (this._rafId)     { cancelAnimationFrame(this._rafId); this._rafId = null; }
  }

  static getConfigElement() { return document.createElement('div'); }
  static getStubConfig()    { return { cards: [] }; }

  setConfig(config) {
    if (!Array.isArray(config.cards)) throw new Error('hemma-smart-row: cards array required');
    this._config      = config;
    this._sortEnabled = config.sort !== false; // default true; set sort: false to disable
  }

  set hass(hass) {
    this._hass = hass;

    if (!this._cardsCreated) {
      // Cards don't exist yet — start init if not already running
      if (!this._initializing) this._init();
      return;
    }

    // Always propagate hass to child cards so their states stay current
    for (const card of this._cards) {
      if (card) card.hass = hass;
    }

    // Don't sort until page-load animations are done
    if (!this._initialized) return;

    // Throttle sort checks to one per frame so Lit microtasks finish first
    if (!this._rafId) {
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        this._updateSort();
      });
    }
  }

  get hass() { return this._hass; }

  async _init() {
    this._initializing = true;

    if (!this._helpers) this._helpers = await window.loadCardHelpers();

    const styleEl = document.createElement('style');
    styleEl.textContent = this._css();
    this.shadowRoot.appendChild(styleEl);

    const container = document.createElement('div');
    container.id = 'container';
    this.shadowRoot.appendChild(container);
    this._container = container;

    // ── Sort disabled: render cards in config order, no detection or reordering ──
    if (!this._sortEnabled) {
      this._cards = this._config.cards.map((cfg) => {
        try {
          const card = this._helpers.createCardElement(cfg);
          card.hass = this._hass;
          return card;
        } catch (e) {
          console.warn('hemma-smart-row: failed to create card', cfg, e);
          return null;
        }
      });
      this._wrappers = this._cards.map((card, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'card-wrapper';
        wrapper.dataset.idx = String(i);
        if (card) wrapper.appendChild(card);
        container.appendChild(wrapper);
        return wrapper;
      });
      this._cardsCreated = true;
      this._initialized  = true;
      this._initializing = false;
      return;
    }

    // All card animations are PAUSED via --hemma-init-play on each wrapper.
    // This holds every card at the FROM keyframe (opacity:0) until we run a DOM
    // detection pass at 100ms — after every button-card has rendered its
    // state-dependent styles, including complex conditions like plant moisture
    // thresholds and Plex count that _isActiveByState() cannot evaluate.
    // Then we correct CSS order, set --hemma-anim-delay:0s on ALL active wrappers
    // (overrides button-card's inline --delay-d via CSS cascade), and release the
    // pause. Every active card fires simultaneously; inactive cards stagger after.
    this._cards = this._config.cards.map((cfg) => {
      try {
        const card = this._helpers.createCardElement(cfg);
        card.hass = this._hass;
        return card;
      } catch (e) {
        console.warn('hemma-smart-row: failed to create card', cfg, e);
        return null;
      }
    });

    this._wrappers = this._cards.map((card, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'card-wrapper';
      wrapper.dataset.idx = String(i);
      wrapper.style.setProperty('--hemma-init-play', 'paused');
      if (card) wrapper.appendChild(card);
      container.appendChild(wrapper);
      return wrapper;
    });

    this._cardsCreated = true;
    this._initializing = false;

    setTimeout(() => {
      // Full DOM detection — catches every card type including plant and Plex
      const active = [], inactive = [];
      this._config.cards.forEach((_, i) => {
        (this._isActive(i) ? active : inactive).push(i);
      });
      const order = [...active, ...inactive];

      this._activeSet       = new Set(active);
      this._activationOrder = [...active];

      // CSS order — active cards sort to front in config order
      order.forEach((origIdx, pos) => { this._wrappers[origIdx].style.order = pos; });

      // Set stagger delay for every card based on its sorted position (0, 1, 2…).
      // Active cards lead (0s, 0.04s, 0.08s…), inactive continue seamlessly after.
      // --hemma-anim-delay cascades through shadow DOM, overriding button-card's
      // inline --delay-d so the stagger reflects sorted order, not config position.
      order.forEach((origIdx, sortedPos) => {
        this._wrappers[origIdx].style.setProperty('--hemma-anim-delay', `${(sortedPos * 0.04).toFixed(2)}s`);
      });

      if (!!window._hemmaFromBg) {
        this._wrappers.forEach(w => w.style.removeProperty('--hemma-init-play'));
        this._initialized = true;
        return;
      }

      // Release — active cards animate at delay:0 together, inactive stagger after
      this._wrappers.forEach(w => w.style.removeProperty('--hemma-init-play'));

      setTimeout(() => {
        this._initialized = true;
        setTimeout(() => this._updateSort(), 2000);
        setTimeout(() => this._updateSort(), 5000);
      }, PAGE_ANIM_MS);

    }, 100);
  }

  // ── Active detection ────────────────────────────────────────────────────────

  _isActiveByDom(index) {
    const card = this._cards[index];
    if (!card?.shadowRoot) return null;
    const ha = card.shadowRoot.querySelector('ha-card');
    if (!ha) return null;
    // Read inline style first (set by button-card styleMap when state is active)
    let v = ha.style.getPropertyValue('--hemma-active-overlay-opacity').trim();
    // Fall back to computed style (catches edge cases where inline isn't set yet)
    if (!v) v = getComputedStyle(ha).getPropertyValue('--hemma-active-overlay-opacity').trim();
    if (!v) return null; // not yet painted — fall through to state check
    return v === '1';
  }

  _isActiveByState(index) {
    const cfg = this._config.cards[index];
    if (!cfg?.entity || !this._hass) return false;
    const st = this._hass.states[cfg.entity];
    return st ? ACTIVE_STATES.has((st.state || '').toLowerCase()) : false;
  }

  _isActive(index) {
    const dom = this._isActiveByDom(index);
    return dom !== null ? dom : this._isActiveByState(index);
  }

  // ── Sort logic ──────────────────────────────────────────────────────────────

  // Called once at PAGE_ANIM_MS: seeds tracking from current DOM without changing layout.
  _seedFromDom() {
    const active = [];
    this._config.cards.forEach((_, i) => {
      if (this._isActive(i)) active.push(i);
    });
    // Preserve config order for cards that are simultaneously active at load time
    this._activeSet       = new Set(active);
    this._activationOrder = active;
  }

  // Called on each hass update (after initialized). Detects changes and schedules sort.
  _updateSort() {
    if (!this._sortEnabled || !this._wrappers.length) return;

    const newActive = new Set();
    this._config.cards.forEach((_, i) => {
      if (this._isActive(i)) newActive.add(i);
    });

    let changed = false;
    for (const i of newActive)      { if (!this._activeSet.has(i)) { changed = true; break; } }
    if (!changed) for (const i of this._activeSet) { if (!newActive.has(i)) { changed = true; break; } }
    if (!changed) return;

    // Always sort active cards by config order (position in hemma.yaml).
    // This ensures e.g. Thermostat (position 1) always leads the active group,
    // regardless of which card was most recently toggled.
    this._activationOrder = [...newActive].sort((a, b) => a - b);
    this._activeSet = newActive;

    this._scheduleSort();
  }

  _scheduleSort() {
    if (!this._sortEnabled) return;
    if (this._sortTimer) clearTimeout(this._sortTimer);
    this._sortTimer = setTimeout(() => {
      this._sortTimer = null;
      this._applyOrder(true);
    }, SORT_DELAY_MS);
  }

  // ── FLIP animation ──────────────────────────────────────────────────────────

  _applyOrder(animate) {
    if (!this._wrappers.length) return;

    const inactive = this._config.cards.map((_, i) => i).filter(i => !this._activeSet.has(i));
    const newOrder  = [...this._activationOrder, ...inactive];

    if (!animate) {
      newOrder.forEach((origIdx, pos) => { this._wrappers[origIdx].style.order = pos; });
      return;
    }

    // Respect system accessibility preference — skip animation, just reorder
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      newOrder.forEach((origIdx, pos) => { this._wrappers[origIdx].style.order = pos; });
      if (isDesktop()) this._container.scrollTo({ left: 0, behavior: 'instant' });
      return;
    }

    // FLIP — snapshot positions before reorder
    const firstRects = this._wrappers.map(w => w.getBoundingClientRect());

    // Apply new order (immediate reflow)
    newOrder.forEach((origIdx, pos) => { this._wrappers[origIdx].style.order = pos; });

    // FLIP — snapshot positions after reorder
    const lastRects = this._wrappers.map(w => w.getBoundingClientRect());

    // Only scroll if the front card isn't already at or near the left edge
    if (isDesktop() && this._container.scrollLeft > 10) {
      this._container.scrollTo({ left: 0, behavior: 'smooth' });
    }

    const deltas = this._wrappers.map((_, i) => ({
      dx: firstRects[i].left - lastRects[i].left,
      dy: firstRects[i].top  - lastRects[i].top,
    }));

    // Pause spinning animations (e.g. fan) before applying transforms so they
    // don't drift visually due to compound transform compositing during FLIP.
    this._wrappers.forEach(w => w.style.setProperty('--hsr-anim-paused', 'paused'));

    // Invert: push each card back to its old visual position instantly
    deltas.forEach(({ dx, dy }, i) => {
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      this._wrappers[i].style.transition = 'none';
      this._wrappers[i].style.transform  = `translate(${dx}px, ${dy}px)`;
    });

    // Play: animate each card to its new position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        deltas.forEach(({ dx, dy }, i) => {
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
          const toFront = dx > 0 || dy > 0;
          this._wrappers[i].style.transition =
            `transform ${SORT_MS}ms ${toFront ? EASE_FORWARD : EASE_BACK} ${toFront ? 0 : STAGGER_MS}ms`;
          this._wrappers[i].style.transform = '';
        });

        // Clean up after animation completes, resume spinning animations
        setTimeout(() => {
          this._wrappers.forEach(w => {
            w.style.transition = '';
            w.style.removeProperty('--hsr-anim-paused');
          });
        }, SORT_MS + STAGGER_MS + 50);
      });
    });
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  _css() {
    return `
      :host {
        display: block;
        position: absolute;
        z-index: 3;
        inset: auto
          var(--hemma-entity-right-inset-current, var(--hemma-entity-right-inset-desktop, var(--hemma-rail-left, var(--page-gutter, 8vw))))
          var(--hemma-entity-bottom-current, var(--hemma-entity-bottom-desktop, 0px))
          var(--hemma-entity-left-inset-current, var(--hemma-entity-left-inset-desktop, var(--hemma-rail-left, var(--page-gutter, 8vw))));
        box-sizing: border-box;
        overflow-x: auto;
        overflow-y: clip;
        touch-action: pan-x;
        overscroll-behavior: none;
        scroll-snap-type: x proximity;
        overflow-anchor: none;
        scrollbar-width: none;
        -ms-overflow-style: none;
        direction: ltr;
      }
      :host::-webkit-scrollbar { display: none; }

      /* Host never blocks taps on navbar/background; only card wrappers receive events */
      .card-wrapper { pointer-events: auto; }

      #container {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        gap: 8px;
        padding: 20px var(--hemma-entity-shadow-pad-right-current, var(--hemma-entity-shadow-pad-right-desktop, 0px)) 40px 0;
        min-width: max-content;
        box-sizing: border-box;
      }

      .card-wrapper {
        flex: 0 0 var(--hemma-entity-col-width-current, var(--hemma-entity-col-width-desktop, 300px));
        width: var(--hemma-entity-col-width-current, var(--hemma-entity-col-width-desktop, 300px));
        scroll-snap-align: start;
      }

      @media (max-width: 767px) and (orientation: portrait),
             (max-height: 500px) and (orientation: portrait) {
        :host {
          position: absolute; z-index: 4;
          inset:
            var(--hemma-tiles-top-portrait, calc(env(safe-area-inset-top, 0px) + 350px))
            var(--hemma-rail-left, var(--page-gutter-mobile, 11px))
            auto
            var(--hemma-rail-left, var(--page-gutter-mobile, 11px));
          overflow-x: visible; overflow-y: visible;
          scroll-snap-type: none; touch-action: auto; overscroll-behavior: auto;
          pointer-events: none;
        }
        #container {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-auto-rows: min-content;
          align-content: end; align-items: start;
          gap: 8px;
          padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + var(--hemma-nav-height, 148px) + 8px) 0;
          min-width: unset; overflow-x: visible;
          box-sizing: content-box;
          min-height: calc(100dvh
            - var(--hemma-tiles-top-portrait, calc(env(safe-area-inset-top, 0px) + 350px))
            - env(safe-area-inset-bottom, 0px)
            - var(--hemma-nav-height, 148px)
            + 15px);
        }
        .card-wrapper { flex: unset; width: auto; scroll-snap-align: none; will-change: auto; }
      }

      @media (max-height: 600px) and (orientation: landscape) {
        :host {
          position: absolute; z-index: 4;
          inset:
            calc(var(--hemma-tiles-top-landscape, calc(env(safe-area-inset-top, 0px) + 105px)))
            var(--hemma-tiles-right-pad-landscape, 0px) auto auto;
          width: calc((2 * var(--hemma-entity-col-width-landscape, 160px)) + 8px);
          overflow-x: visible; overflow-y: clip;
          scroll-snap-type: none; touch-action: auto;
          pointer-events: none;
        }
        #container {
          display: grid;
          grid-template-columns: repeat(2, var(--hemma-entity-col-width-landscape, 160px));
          grid-auto-rows: min-content;
          gap: 8px; align-content: start; align-items: start;
          padding: 0 0 20px 0; min-width: unset; overflow-x: visible;
        }
        .card-wrapper { flex: unset; width: auto; scroll-snap-align: none; will-change: auto; }
      }
    `;
  }
}

customElements.define('hemma-smart-row', HemmaSmartRow);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'hemma-smart-row',
  name: 'Hemma Smart Row',
  description: 'Smart entity row — active cards slide to the front on desktop',
});
