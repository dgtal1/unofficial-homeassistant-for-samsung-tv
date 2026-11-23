// Remote control navigation: spatial D-pad focus, long press OK, Back handling
(function (w) {
  var HAT = w.HAT = w.HAT || {};
  var UI = HAT.ui;
  var N = HAT.nav = {};

  var KEY = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13,
    BACK_TV: 10009, ESC: 27, BACKSPACE: 8, INFO: 457
  };

  var current = null;
  var cfg = { longPressMs: 500 };
  var enterState = 0;          // 0 idle, 1 pressed, 2 long press already fired
  var enterTimer = 0;
  var onBack = function () {};

  N.init = function (config, backHandler) {
    cfg = config;
    onBack = backHandler;
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('click', onClick);
    // Ask the TV to deliver the Info key to the page (ignored on desktop browsers)
    try {
      if (w.tizen && tizen.tvinputdevice) {
        tizen.tvinputdevice.registerKey('Info');
      }
    } catch (e) { /* not available */ }
  };

  N.current = function () { return current; };

  function isTile(n) { return n && n.classList && n.classList.contains('tile'); }
  function isTab(n) { return n && n._tabIdx !== undefined; }

  N.focus = function (el) {
    if (current) current.classList.remove('focused');
    current = el || null;
    if (!el) { updateRing(null); return; }
    el.classList.add('focused');
    if (el.classList.contains('pick-row') || el.classList.contains('nt-row')) HAT.dialogs.ensureRowVisible(el);
    else if (el.classList.contains('nt-x')) HAT.dialogs.ensureRowVisible(el.parentNode);
    if (isTab(el)) {
      if (el._tabIdx !== UI.activeIdx()) UI.selectView(el._tabIdx);
      UI.ensureTabVisible(el);
    } else if (isTile(el)) {
      var p = UI.activePage();
      if (p) p.lastFocus = el;
      UI.ensureVisible(el);
    }
    if (UI.layer === 'detail' && HAT.detail.hint) HAT.detail.hint(el);
    updateRing(el);
  };

  function candidates() {
    var sel;
    if (UI.layer !== 'main') sel = '#' + UI.layer + ' .focusable';
    else sel = '#topbar .focusable, .page.active .tile';
    var all = document.querySelectorAll(sel), out = [];
    for (var i = 0; i < all.length; i++) {
      if (!all[i].offsetWidth && !all[i].offsetHeight) continue;   // hidden elements (sub view tabs, hidden settings rows)
      out.push(all[i]);
    }
    return out;
  }

  // Layout box of an element relative to #app (offsets, not getBoundingClientRect, so running transitions do not disturb it)
  function rectOf(n) {
    var x = 0, y = 0, o = n;
    while (o && o.id !== 'app') {
      x += o.offsetLeft;
      y += o.offsetTop;
      o = o.offsetParent;
      if (o && o.scrollTop) y -= o.scrollTop;     // scrolling lists (picker)
    }
    var page = UI.activePage();
    if (page && page.inner.contains(n)) y -= page.scrollY;
    if (isTab(n)) x -= UI.tabsX();
    return { x: x, y: y, w: n.offsetWidth, h: n.offsetHeight };
  }

  function center(n) {
    var r = rectOf(n);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2, w: r.w, h: r.h };
  }

  // ---- focus ring ----------------------------------------------------------
  // A single element laid over the focused element. Its box equals the focused element after its focus scale-up,
  // so it always fits exactly, and it glides between elements instead of jumping.
  var ringEl = null, ringLayer = '', ringTimer = 0;

  function focusScale(n) {
    if (n.classList.contains('tile')) return 1.045;
    if (n.classList.contains('slider')) return 1.02;
    return 1;
  }

  function placeRing(n) {
    var r = rectOf(n), sc = focusScale(n);
    var w0 = r.w * sc, h0 = r.h * sc;
    var left = Math.round(r.x + r.w / 2 - w0 / 2), top = Math.round(r.y + r.h / 2 - h0 / 2);
    var rad = parseFloat(w.getComputedStyle(n).borderTopLeftRadius) || 0;
    ringEl.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0)';
    ringEl.style.width = Math.round(w0) + 'px';
    ringEl.style.height = Math.round(h0) + 'px';
    ringEl.style.borderRadius = Math.round(rad * sc) + 'px';
  }

  function updateRing(n) {
    if (!ringEl) {
      ringEl = document.getElementById('focus-ring');
      if (!ringEl) return;
      w.addEventListener('resize', function () { if (current) { ringEl.style.transition = 'none'; placeRing(current); void ringEl.offsetWidth; ringEl.style.transition = ''; } });
    }
    clearTimeout(ringTimer);
    if (!n) { ringEl.classList.remove('on'); return; }
    var layerChanged = ringLayer !== UI.layer || !ringEl.classList.contains('on');
    ringLayer = UI.layer;
    var content = document.getElementById('content');
    var sliding = UI.layer === 'main' && UI.pageBusyUntil > Date.now() && content && content.contains(n);
    if (!layerChanged && !sliding) { placeRing(n); return; }
    // New layer (dialog opening / closing): wait for its own animation, then fade in without gliding across the screen
    ringEl.classList.remove('on');
    ringTimer = setTimeout(function () {
      if (current !== n) return;
      ringEl.style.transition = 'none';
      placeRing(n);
      void ringEl.offsetWidth;
      ringEl.style.transition = '';
      ringEl.classList.add('on');
    }, sliding ? UI.pageBusyUntil - Date.now() + 20 : (UI.layer === 'main' ? 30 : 300));
  }

  N.refreshRing = function () { if (current) updateRing(current); };

  function activeTab() {
    return UI.activeTab();
  }

  function move(dir) {
    if (!current) {
      var first = UI.layer === 'main' ? (UI.firstTile() || activeTab()) : candidates()[0];
      if (first) N.focus(first);
      return;
    }
    var gear = document.getElementById('btn-settings');
    if (UI.layer === 'diag' && (dir === 'up' || dir === 'down')) { UI.scrollDiag(dir); return; }
    if (UI.layer === 'main') {
      // Shortcut to diagnostics: UP from the tab bar; LEFT from the gear returns to the active tab
      if (isTab(current) && dir === 'up') { N.focus(gear); return; }
      var bell = document.getElementById('btn-bell');
      var bellOn = bell && bell.offsetWidth > 0;
      if (current === (bellOn ? bell : gear) && dir === 'left') { N.focus(activeTab()); return; }
    }
    // From the tab bar going down: return to the last focused tile of the page
    if (UI.layer === 'main' && dir === 'down' && !isTile(current)) {
      var pg = UI.activePage();
      var target = (pg && pg.lastFocus) || UI.firstTile();
      if (target) N.focus(target);
      return;
    }
    var list = candidates();
    var c = center(current);
    var best = null, bestScore = Infinity;
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (n === current) continue;
      var r = center(n);
      var dx = r.x - c.x, dy = r.y - c.y, prim, sec;
      if (dir === 'left' || dir === 'right') {
        prim = dir === 'right' ? dx : -dx;
        sec = Math.abs(dy);
        if (prim <= 2 || sec > Math.max(c.h, r.h) * 0.6) continue;
      } else {
        prim = dir === 'down' ? dy : -dy;
        sec = Math.abs(dx);
        if (prim <= 2) continue;
      }
      var score = prim + sec * 2.5;
      if (score < bestScore) { bestScore = score; best = n; }
    }
    // Notifications: DOWN from the list lands on "Dismiss all" (the first footer button), not on "Close"
    if (UI.layer === 'notifs' && dir === 'down' && best && best.id === 'nt-close' && current.id !== 'nt-all') best = document.getElementById('nt-all');
    if (UI.layer === 'main' && dir === 'up' && isTile(current)) {
      // Going up from a tile reaches the tab bar only through the active tab
      if (!best || !isTile(best)) best = activeTab() || best;
    }
    if (best) N.focus(best);
  }

  function adjustable(dir) {
    return current && current._adjust && (dir === 'left' || dir === 'right');
  }

  function activate(kind) {
    if (current && current._act) current._act(kind);
  }

  function onKeyDown(e) {
    var k = e.keyCode;
    var dir = k === KEY.LEFT ? 'left' : k === KEY.RIGHT ? 'right' : k === KEY.UP ? 'up' : k === KEY.DOWN ? 'down' : null;
    if (dir) {
      e.preventDefault();
      if (adjustable(dir)) current._adjust(dir === 'right' ? 1 : -1);
      else move(dir);
      return;
    }
    if (k === KEY.ENTER) {
      e.preventDefault();
      if (enterState !== 0) return;             // key repeat while held
      if (!isTile(current) || !cfg.longPressMs) { activate('short'); enterState = 1; return; }
      enterState = 1;
      clearTimeout(enterTimer);
      enterTimer = setTimeout(function () {
        if (enterState === 1) { enterState = 2; activate('long'); }
      }, cfg.longPressMs);
      return;
    }
    if (k === KEY.INFO) {
      e.preventDefault();
      if (isTile(current)) activate('long');
      return;
    }
    if (k === KEY.BACK_TV || k === KEY.ESC || k === KEY.BACKSPACE) {
      e.preventDefault();
      onBack();
    }
  }

  function onKeyUp(e) {
    if (e.keyCode !== KEY.ENTER) return;
    clearTimeout(enterTimer);
    var was = enterState;
    enterState = 0;
    if (was === 1 && isTile(current) && cfg.longPressMs) activate('short');
  }

  // Mouse / pointer support (desktop testing, Magic Remote)
  function onClick(e) {
    var n = e.target;
    while (n && n !== document.body && !(n.classList && n.classList.contains('focusable'))) n = n.parentNode;
    if (!n || n === document.body) return;
    var inLayer = false, list = candidates();
    for (var i = 0; i < list.length; i++) if (list[i] === n) inLayer = true;
    if (!inLayer) return;
    N.focus(n);
    if (!isTab(n)) activate('short');
  }
})(window);
