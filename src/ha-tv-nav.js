// Remote-control navigation for Home Assistant on Samsung TV (Tizen).
// Arrow keys move an on-screen cursor, OK (Enter) clicks, near the top/bottom
// edge the cursor scrolls the container under it. Works through shadow DOM.
// Install: copy to <HA config>/www/ha-tv-nav.js and add to configuration.yaml:
//   frontend:
//     extra_module_url:
//       - /local/ha-tv-nav.js
(function () {
  if (window.__haTvNav) return;
  window.__haTvNav = true;

  var STEP_MIN = 24, STEP_MAX = 120, ACCEL = 1.25, EDGE = 80, SCROLL = 220;
  var x = innerWidth / 2, y = innerHeight / 2;
  var step = STEP_MIN, lastKey = 0, lastCode = 0;

  var cur = document.createElement("div");
  cur.style.cssText = "position:fixed;left:0;top:0;width:28px;height:28px;margin:-14px 0 0 -14px;" +
    "border-radius:50%;background:rgba(3,169,244,.45);border:3px solid #fff;" +
    "box-shadow:0 0 0 2px #000;z-index:2147483647;pointer-events:none;";
  function mount() { (document.body || document.documentElement).appendChild(cur); draw(); }
  function draw() { cur.style.transform = "translate(" + x + "px," + y + "px)"; }

  // Element under point, descending into open shadow roots.
  function deepAt(px, py) {
    var el = document.elementFromPoint(px, py);
    while (el && el.shadowRoot) {
      var inner = el.shadowRoot.elementFromPoint(px, py);
      if (!inner || inner === el) break;
      el = inner;
    }
    return el;
  }
  function parentOf(n) {
    return n.parentElement || (n.getRootNode && n.getRootNode().host) || null;
  }
  function scrollableAncestor(el, dy) {
    for (var n = el; n; n = parentOf(n)) {
      var s = getComputedStyle(n);
      var can = /(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 1;
      if (can && (dy < 0 ? n.scrollTop > 0 : n.scrollTop + n.clientHeight < n.scrollHeight - 1)) return n;
    }
    return document.scrollingElement;
  }

  function move(dx, dy, code) {
    var now = Date.now();
    step = (code === lastCode && now - lastKey < 300) ? Math.min(step * ACCEL, STEP_MAX) : STEP_MIN;
    lastKey = now; lastCode = code;
    var nx = x + dx * step, ny = y + dy * step;
    if (dy && ((dy < 0 && ny < EDGE) || (dy > 0 && ny > innerHeight - EDGE))) {
      var sc = scrollableAncestor(deepAt(x, y), dy);
      if (sc) sc.scrollBy({ top: dy * SCROLL, behavior: "auto" });
    }
    x = Math.max(0, Math.min(innerWidth - 1, nx));
    y = Math.max(0, Math.min(innerHeight - 1, ny));
    draw();
  }

  function click() {
    var el = deepAt(x, y);
    if (!el) return;
    var opts = { bubbles: true, composed: true, cancelable: true, clientX: x, clientY: y, view: window };
    try { el.dispatchEvent(new PointerEvent("pointerdown", opts)); } catch (e) {}
    el.dispatchEvent(new MouseEvent("mousedown", opts));
    if (el.focus) el.focus();
    try { el.dispatchEvent(new PointerEvent("pointerup", opts)); } catch (e) {}
    el.dispatchEvent(new MouseEvent("mouseup", opts));
    el.click();
  }

  window.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case 37: move(-1, 0, 37); break;
      case 38: move(0, -1, 38); break;
      case 39: move(1, 0, 39); break;
      case 40: move(0, 1, 40); break;
      case 13: click(); break;
      default: return;
    }
    e.preventDefault(); e.stopPropagation();
  }, true);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
