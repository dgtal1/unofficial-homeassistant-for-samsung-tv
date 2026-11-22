// Main screen: tabs (dashboard views), pages with sections and tiles, toast, splash, diagnostics
(function (w) {
  var HAT = w.HAT = w.HAT || {};
  var U = HAT.util, E = HAT.entity;
  var UI = HAT.ui = {};

  UI.layer = 'main';          // main | detail | diag
  UI.handlers = { tile: function () {}, settings: function () {} };

  var tabsX = 0;
  var cfg, tabsEl, tabsWrapEl, viewportEl, contentEl, toastEl, statusEl, bannerEl, splashEl, clockEl, dateEl;
  var pages = [];
  var active = -1;
  var tileMap = {};           // entity_id -> [tile nodes]
  var camTimer = null;
  var toastTimer = null;
  var dirty = {};
  var linkTiles = [];         // tiles that open another view
  var linkMembers = {};       // entity_id -> true for entities summarised by link tiles
  var dirtyQueued = false;

  UI.init = function (config) {
    cfg = config;
    tabsEl = document.getElementById('tabs');
    tabsWrapEl = document.getElementById('tabs-wrap');
    viewportEl = document.getElementById('viewport');
    contentEl = document.getElementById('content');
    toastEl = document.getElementById('toast');
    statusEl = document.getElementById('status-dot');
    bannerEl = document.getElementById('banner');
    splashEl = document.getElementById('splash');
    clockEl = document.getElementById('clock-time');
    dateEl = document.getElementById('clock-date');
    document.documentElement.style.setProperty('--cols', String(cfg.columns || 5));

    var gear = document.getElementById('btn-settings');
    gear.innerHTML = HAT.iconSvg('gear');
    gear._act = function () { UI.handlers.settings(); };

    UI.updateClock();
    setInterval(UI.updateClock, 20000);
    applyScale();
    w.addEventListener('resize', applyScale);
  };

  // Layout is designed for 1920x1080 and scaled through the root font size (rem)
  function applyScale() {
    var size = Math.max(6, w.innerWidth / 120);
    document.documentElement.style.fontSize = size + 'px';
  }

  UI.updateClock = function () {
    var c = U.clock(new Date());
    if (clockEl.textContent !== c.time) clockEl.textContent = c.time;
    if (dateEl.textContent !== c.date) dateEl.textContent = c.date;
  };

  // ---- splash / status / toast -------------------------------------------
  UI.showSplash = function (title, sub) {
    splashEl.querySelector('.splash-title').textContent = title || '';
    splashEl.querySelector('.splash-sub').textContent = sub || '';
    splashEl.classList.add('show');
  };

  UI.hideSplash = function () { splashEl.classList.remove('show'); };

  UI.setStatus = function (status) {
    statusEl.className = 'dot ' + status;
    var show = status === 'closed' || status === 'connecting';
    bannerEl.textContent = show ? HAT.t('banner.offline') : '';
    bannerEl.classList.toggle('show', show && pages.length > 0);
  };

  UI.toast = function (text, ms) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 1800);
  };

  // ---- build -------------------------------------------------------------
  UI.build = function (views, preferredPath) {
    var i, j, k;
    tabsEl.innerHTML = '';
    tabsEl.classList.remove('insub');
    tabsX = 0;
    tabsEl.style.transform = '';
    contentEl.innerHTML = '';
    pages = [];
    tileMap = {};
    linkTiles = [];
    linkMembers = {};
    active = -1;

    var pref = 0;
    for (i = 0; i < views.length; i++) {
      var v = views[i];
      if (v.path === preferredPath) pref = i;

      // Sub views get a tab of their own that is only shown while the sub view is open
      var tab = U.el('div', v.subview ? 'tab sub focusable' : 'tab focusable', (v.subview ? '\u2039  ' : '') + v.title);
      tab._tabIdx = i;
      tabsEl.appendChild(tab);

      var pageEl = U.el('div', 'page');
      var inner = U.el('div', 'page-inner');
      pageEl.appendChild(inner);
      var page = { el: pageEl, inner: inner, tab: tab, scrollY: 0, lastFocus: null, path: v.path, sub: !!v.subview, returnIdx: 0, returnNode: null };

      for (j = 0; j < v.sections.length; j++) {
        var sec = v.sections[j];
        var secEl = U.el('div', 'sec');
        var title = null;
        if (sec.title) {
          title = U.el('div', 'sec-title', sec.title);
          secEl.appendChild(title);
        }
        var grid = U.el('div', 'grid');
        for (k = 0; k < sec.tiles.length; k++) {
          var tile = createTile(sec.tiles[k]);
          tile._title = title;
          grid.appendChild(tile);
          if (tile._link) {
            linkTiles.push(tile);
            var mem = tile._link.members || [];
            for (var m = 0; m < mem.length; m++) linkMembers[mem[m]] = true;
          } else {
            (tileMap[sec.tiles[k].entity] = tileMap[sec.tiles[k].entity] || []).push(tile);
          }
        }
        secEl.appendChild(grid);
        inner.appendChild(secEl);
      }
      contentEl.appendChild(pageEl);
      pages.push(page);
    }

    for (var id in tileMap) {
      if (tileMap.hasOwnProperty(id)) updateTiles(id);
    }
    updateLinks();
    if (pages.length) {
      if (pages[pref].sub) pref = 0;
      pages[pref].el.className = 'page active';
      active = pref;
      pages[pref].tab.classList.add('active');
      UI.ensureTabVisible(pages[pref].tab);
    }
    startCamTimer();
    return pref;
  };

  // Keeps the given tab inside the visible part of the tab strip
  UI.ensureTabVisible = function (tab) {
    if (!tab) return;
    var rem = parseFloat(document.documentElement.style.fontSize) || 16;
    var wrapW = tabsWrapEl.clientWidth;
    var margin = rem * 3;
    var left = tab.offsetLeft, right = left + tab.offsetWidth;
    var x = tabsX;
    if (left - margin < x) x = Math.max(0, left - margin);
    else if (right + margin > x + wrapW) x = right + margin - wrapW;
    x = Math.max(0, Math.min(x, Math.max(0, tabsEl.scrollWidth - wrapW)));
    if (x !== tabsX) {
      tabsX = x;
      tabsEl.style.transform = 'translate3d(' + (-x) + 'px,0,0)';
    }
  };

  UI.tabsX = function () { return tabsX; };

  UI.hasPages = function () { return pages.length > 0; };
  UI.activeIdx = function () { return active; };
  UI.activePage = function () { return pages[active] || null; };
  UI.activePath = function () { return pages[active] ? pages[active].path : null; };
  UI.entities = function () { return Object.keys(tileMap); };

  function createTile(t) {
    var node = U.el('div', 'tile focusable');
    node._entity = t.link ? null : t.entity;
    node._link = t.link ? t : null;
    node._nav = t.nav || null;
    node._ov = { name: t.name, icon: t.icon };
    node._cache = {};
    node.appendChild(U.el('div', 'tile-bg')).appendChild(U.el('div', 'tile-on'));
    node.appendChild(U.el('div', 'tile-ico'));
    var txt = U.el('div', 'tile-txt');
    txt.appendChild(U.el('div', 'tile-name'));
    txt.appendChild(U.el('div', 'tile-state'));
    node.appendChild(txt);
    node._ico = node.querySelector('.tile-ico');
    node._name = node.querySelector('.tile-name');
    node._state = node.querySelector('.tile-state');
    node._act = function (kind) { UI.handlers.tile(node, kind); };
    if (!t.link && E.domain(t.entity) === 'camera') {
      node.classList.add('cam');
      var img = U.el('div', 'tile-img');
      node.querySelector('.tile-bg').insertBefore(img, node.querySelector('.tile-on'));
      node._img = img;
    }
    return node;
  }

  // Link tiles (summaries / areas) open another view of the generated dashboard
  function updateLink(node) {
    var d = HAT.generated.describeLink(node._link);
    var c = node._cache;
    if (c.name !== node._link.title) { node._name.textContent = node._link.title; c.name = node._link.title; }
    if (c.text !== d.text) { node._state.textContent = d.text; c.text = d.text; }
    if (c.icon !== node._link.icon) { node._ico.innerHTML = HAT.iconSvg(node._link.icon); c.icon = node._link.icon; }
    if (c.active !== d.active) { node.classList.toggle('on', d.active); c.active = d.active; }
    if (c.alert !== d.alert) { node.classList.toggle('alert', d.alert); c.alert = d.alert; }
  }

  function updateLinks() {
    for (var i = 0; i < linkTiles.length; i++) updateLink(linkTiles[i]);
  }

  function updateTile(node) {
    var st = HAT.store.get(node._entity);
    var d = E.describe(node._entity, st, node._ov);
    var c = node._cache;
    if (c.name !== d.name) { node._name.textContent = d.name; c.name = d.name; }
    if (c.text !== d.text) { node._state.textContent = d.text; c.text = d.text; }
    if (c.icon !== d.icon) { node._ico.innerHTML = HAT.iconSvg(d.icon); c.icon = d.icon; }
    if (c.active !== d.active) { node.classList.toggle('on', d.active); c.active = d.active; }
    if (c.alert !== d.alert) { node.classList.toggle('alert', d.alert); c.alert = d.alert; }
    if (c.unavail !== d.unavailable) { node.classList.toggle('unavail', d.unavailable); c.unavail = d.unavailable; }
    if (node._img) refreshCamTile(node, false);
  }

  function updateTiles(id) {
    var list = tileMap[id];
    if (!list) return;
    for (var i = 0; i < list.length; i++) updateTile(list[i]);
  }

  // Entity changes are batched into one update per animation frame
  function dirtyHas() { for (var k in dirty) if (dirty.hasOwnProperty(k)) return true; return false; }

  UI.entityChanged = function (id) {
    if (linkMembers[id]) dirty['\u0000links'] = true;
    // A light group tile shows the brightness of its members
    if (id.indexOf('light.') === 0) {
      for (var gk in tileMap) {
        if (!tileMap.hasOwnProperty(gk) || gk.indexOf('group.') !== 0) continue;
        var gm = E.lightGroupMembers(HAT.store.get(gk));
        if (gm && gm.indexOf(id) >= 0) dirty[gk] = true;
      }
    }
    if (!tileMap[id] && !linkMembers[id] && !dirtyHas()) return;
    dirty[id] = true;
    if (dirtyQueued) return;
    dirtyQueued = true;
    var run = function () {
      dirtyQueued = false;
      var d = dirty;
      dirty = {};
      for (var k in d) if (d.hasOwnProperty(k) && k !== '\u0000links') updateTiles(k);
      if (d['\u0000links']) updateLinks();
    };
    if (w.requestAnimationFrame) w.requestAnimationFrame(run); else setTimeout(run, 16);
  };

  UI.refreshAll = function () {
    for (var id in tileMap) if (tileMap.hasOwnProperty(id)) updateTiles(id);
    updateLinks();
  };

  // ---- camera snapshots on tiles -----------------------------------------
  function refreshCamTile(node, force) {
    var st = HAT.store.get(node._entity);
    var pic = st && st.attributes && st.attributes.entity_picture;
    if (!pic) return;
    var now = Date.now();
    if (!force && node._camAt && now - node._camAt < 30000) return;
    node._camAt = now;
    var url = cfg.url.replace(/\/+$/, '') + pic + (pic.indexOf('?') >= 0 ? '&' : '?') + '_=' + now;
    node._img.style.backgroundImage = 'url("' + url + '")';
    node.classList.add('has-img');
  }

  function startCamTimer() {
    clearInterval(camTimer);
    camTimer = setInterval(function () {
      var p = pages[active];
      if (!p || UI.layer !== 'main') return;
      var cams = p.inner.querySelectorAll('.tile.cam');
      for (var i = 0; i < cams.length; i++) refreshCamTile(cams[i], false);
    }, 10000);
  }

  // ---- views -------------------------------------------------------------
  var PAGE_MS = 360;                      // keep in sync with the .page transition in style.css
  var afterTimer = 0;
  UI.pageBusyUntil = 0;                   // nav.js keeps the focus ring hidden while pages slide

  // dir: 1 = new page comes from the right (deeper / next tab), -1 = from the left (back / previous tab)
  UI.selectView = function (idx, dir) {
    if (idx === active || !pages[idx]) return;
    var oldP = pages[active], newP = pages[idx];
    if (!dir) {
      if (newP.sub && !(oldP && oldP.sub)) dir = 1;
      else if (oldP && oldP.sub && !newP.sub) dir = -1;
      else dir = idx > active ? 1 : -1;
    }
    // Start position on the side it comes from (no transition for this jump)
    newP.el.style.transition = 'none';
    newP.el.className = 'page' + (dir < 0 ? ' before' : '');
    void newP.el.offsetWidth;
    newP.el.style.transition = '';
    newP.el.className = 'page active';
    if (oldP) {
      oldP.el.className = 'page' + (dir > 0 ? ' before' : '');
      if (oldP.tab) oldP.tab.classList.remove('active');
    }
    if (newP.tab) newP.tab.classList.add('active');
    active = idx;
    tabsEl.classList.toggle('insub', !!newP.sub);
    if (newP.sub && tabsX !== 0) { tabsX = 0; tabsEl.style.transform = ''; }
    UI.ensureTabVisible(UI.activeTab());
    UI.pageBusyUntil = Date.now() + PAGE_MS;
    // Work that is not needed for the slide itself runs after it, so it cannot steal frames from it
    clearTimeout(afterTimer);
    afterTimer = setTimeout(function () {
      for (var k = 0; k < pages.length; k++) {
        var pg = pages[k];
        if (k !== active && pg.resetScroll) { pg.resetScroll = false; scrollInstant(pg, 0); }
      }
      var cams = pages[active].inner.querySelectorAll('.tile.cam');
      for (var i = 0; i < cams.length; i++) refreshCamTile(cams[i], false);
    }, PAGE_MS + 20);
  };

  function scrollInstant(page, y) {
    page.inner.style.transition = 'none';
    UI.setScroll(page, y);
    void page.inner.offsetWidth;
    page.inner.style.transition = '';
  }

  // Tab shown as current: a sub view reports the tab of the view it was opened from
  UI.activeTab = function () {
    var p = pages[active];
    if (!p) return null;
    if (p.tab) return p.tab;
    return pages[p.returnIdx] ? pages[p.returnIdx].tab : null;
  };

  UI.isSubView = function () { return !!(pages[active] && pages[active].sub); };

  // Opens a view by path (link tiles), remembering where to return to
  UI.openPath = function (path, fromNode) {
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].path !== path) continue;
      pages[i].returnIdx = pages[active] && !pages[active].sub ? active : pages[i].returnIdx;
      pages[i].returnNode = fromNode || null;
      scrollInstant(pages[i], 0);          // the sub view always slides in from its top
      UI.selectView(i, 1);
      return true;
    }
    return false;
  };

  // Leaves a sub view; returns the tile to focus
  UI.leaveSub = function () {
    var p = pages[active];
    if (!p || !p.sub) return null;
    var node = p.returnNode, idx = p.returnIdx;
    p.resetScroll = true;                  // reset once it has slid out of view
    UI.selectView(idx, -1);
    return node || UI.firstTile();
  };

  function offsetWithin(node, ancestor) {
    var y = 0, n = node;
    while (n && n !== ancestor) {
      y += n.offsetTop;
      n = n.offsetParent;
    }
    return y;
  }

  UI.setScroll = function (page, y) {
    page.scrollY = y;
    page.inner.style.transform = 'translate3d(0,' + (-y) + 'px,0)';
  };

  // Keeps the focused tile (and its section title when in the first row) inside the viewport
  UI.ensureVisible = function (node) {
    var page = pages[active];
    if (!page || !page.inner.contains(node)) return;
    var rem = parseFloat(document.documentElement.style.fontSize) || 16;
    var margin = rem * 1.4;
    var top = offsetWithin(node, page.inner);
    var h = node.offsetHeight;
    var refTop = top;
    if (node._title && node.offsetTop < 5) refTop = offsetWithin(node._title, page.inner);
    var vh = viewportEl.clientHeight;
    var y = page.scrollY;
    if (refTop - margin < y) y = Math.max(0, refTop - margin);
    else if (top + h + margin > y + vh) y = top + h + margin - vh;
    if (y !== page.scrollY) UI.setScroll(page, y);
  };

  UI.scrollTop = function () {
    var page = pages[active];
    if (page) UI.setScroll(page, 0);
  };

  UI.firstTile = function () {
    var page = pages[active];
    return page ? page.inner.querySelector('.tile') : null;
  };

  // ---- diagnostics -------------------------------------------------------
  var diagEl, fpsRaf = 0, fpsFrames = 0, fpsStart = 0, fpsEl = null;

  UI.showDiag = function (rows) {
    diagEl = document.getElementById('diag');
    var list = diagEl.querySelector('.diag-rows');
    list.innerHTML = '';
    for (var i = 0; i < rows.length; i++) {
      var r = U.el('div', 'diag-row');
      r.appendChild(U.el('span', 'diag-k', rows[i][0]));
      var val = U.el('span', 'diag-v', rows[i][1]);
      if (rows[i][2] === 'fps') fpsEl = val;
      r.appendChild(val);
      list.appendChild(r);
    }
    diagEl.classList.add('show');
    UI.layer = 'diag';
    list.scrollTop = 0;
    // Show the scroll hint only when the rows do not fit (rows are laid out once the overlay is displayed)
    diagEl.classList.toggle('scrolls', list.scrollHeight > list.clientHeight + 2);
    fpsFrames = 0;
    fpsStart = Date.now();
    var tick = function () {
      fpsFrames++;
      var dt = Date.now() - fpsStart;
      if (dt >= 1000) {
        if (fpsEl) fpsEl.textContent = HAT.t('dg.fpsVal', Math.round(fpsFrames * 1000 / dt));
        fpsFrames = 0;
        fpsStart = Date.now();
      }
      fpsRaf = w.requestAnimationFrame(tick);
    };
    if (w.requestAnimationFrame) fpsRaf = w.requestAnimationFrame(tick);
  };

  // UP / DOWN on the diagnostics screen scrolls the row list (the buttons stay put)
  UI.scrollDiag = function (dir) {
    var list = document.querySelector('#diag .diag-rows');
    if (list) list.scrollTop += (dir === 'down' ? 1 : -1) * Math.round(list.clientHeight * 0.6);
  };

  UI.hideDiag = function () {
    if (diagEl) diagEl.classList.remove('show');
    if (fpsRaf && w.cancelAnimationFrame) w.cancelAnimationFrame(fpsRaf);
    fpsRaf = 0;
    fpsEl = null;
    UI.layer = 'main';
  };
})(window);
