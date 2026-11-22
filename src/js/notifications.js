// HA persistent notifications: read only list behind a bell in the top bar
(function (w) {
  var HAT = w.HAT = w.HAT || {};
  var U = HAT.util, UI = HAT.ui;
  var N = HAT.notify = {};

  var client, cfg, bellEl, icoEl, badgeEl, overlayEl, listEl, subEl, openHint;
  var items = {};                // id -> { id, title, message, created }
  var known = false;             // first full list received (no sound / animation for it)
  var mode = 'none';             // none | subscribe | poll | failed
  var lastError = '';
  var pollTimer = 0, ringTimer = 0;
  var ignore = [];

  N.init = function (c, config) {
    client = c;
    cfg = config || {};
    ignore = cfg.notificationsIgnore || [];
    bellEl = document.getElementById('btn-bell');
    icoEl = document.getElementById('bell-ico');
    badgeEl = document.getElementById('bell-badge');
    overlayEl = document.getElementById('notifs');
    listEl = overlayEl.querySelector('.nt-list');
    subEl = overlayEl.querySelector('.pick-sub');
    openHint = overlayEl.querySelector('.dh-open');
    overlayEl.querySelector('.dh-ico').innerHTML = HAT.iconSvg('back');
    icoEl.innerHTML = HAT.iconSvg('bell');
    bellEl._act = function () { N.open(); };
    client.subscribeMessage({ type: 'persistent_notification/subscribe' }, onEvent, onSubscribeError);
  };

  // ---- data ---------------------------------------------------------------
  function norm(n, id) {
    if (!n) return null;
    var nid = n.notification_id || id;
    if (!nid) return null;
    return { id: String(nid), title: n.title || '', message: n.message || '', created: n.created_at || '' };
  }

  function listOf(x) {
    var out = [], k;
    if (!x) return out;
    if (x.length !== undefined && typeof x !== 'string') { for (k = 0; k < x.length; k++) { var a = norm(x[k]); if (a) out.push(a); } return out; }
    for (k in x) if (x.hasOwnProperty(k)) { var b = norm(x[k], k); if (b) out.push(b); }
    return out;
  }

  function ignored(it) {
    for (var i = 0; i < ignore.length; i++) {
      var p = String(ignore[i]);
      if (p.indexOf('title:') === 0) {
        if (it.title.toLowerCase().indexOf(p.slice(6).toLowerCase()) >= 0) return true;
      } else if (p.charAt(p.length - 1) === '*') {
        if (it.id.indexOf(p.slice(0, -1)) === 0) return true;
      } else if (it.id === p) return true;
    }
    return false;
  }

  function visible() {
    var out = [];
    for (var k in items) if (items.hasOwnProperty(k) && !ignored(items[k])) out.push(items[k]);
    out.sort(function (a, b) { return Date.parse(b.created) - Date.parse(a.created) || 0; });
    return out;
  }

  function onEvent(ev) {
    if (!ev) return;
    mode = 'subscribe';
    var type = ev.type, list, i, fresh = [];
    if (type === 'removed') {
      list = listOf(ev.notifications || ev.notification);
      for (i = 0; i < list.length; i++) delete items[list[i].id];
      if (ev.notification_id) delete items[ev.notification_id];
    } else {
      list = listOf(ev.notifications || ev.notification);
      if (type === 'current' || !type) {
        items = {};
        for (i = 0; i < list.length; i++) items[list[i].id] = list[i];
        known = true;
      } else {
        for (i = 0; i < list.length; i++) {
          if (type === 'added' && !items[list[i].id] && !ignored(list[i])) fresh.push(list[i]);
          items[list[i].id] = list[i];
        }
      }
    }
    changed(fresh.length > 0);
  }

  // Older / restricted setups: read the list periodically instead
  function onSubscribeError(e) {
    lastError = (e && (e.code || e.message)) || HAT.t('common.error');
    if (mode === 'subscribe') return;
    mode = 'poll';
    clearInterval(pollTimer);
    poll();
    pollTimer = setInterval(poll, 30000);
  }

  function poll() {
    client.request({ type: 'persistent_notification/get' }).then(function (res) {
      var list = listOf(res), next = {}, fresh = [], i;
      for (i = 0; i < list.length; i++) {
        next[list[i].id] = list[i];
        if (known && !items[list[i].id] && !ignored(list[i])) fresh.push(list[i]);
      }
      items = next;
      known = true;
      mode = 'poll';
      changed(fresh.length > 0);
    }, function (e) {
      lastError = (e && (e.code || e.message)) || HAT.t('common.error');
      if (!known) { mode = 'failed'; changed(false); }
    });
  }

  // ---- bell, badge, sound ---------------------------------------------------
  function changed(isNew) {
    var vis = visible(), n = vis.length;
    bellEl.style.display = mode === 'failed' ? 'none' : '';
    if (n > 0) badgeEl.textContent = n > 99 ? '99+' : String(n);   // text stays while the badge shrinks away
    badgeEl.classList.toggle('show', n > 0);
    if (isNew && known) alertNew();
    if (UI.layer === 'notifs') render(vis);
  }

  function alertNew() {
    icoEl.classList.remove('ring');
    void icoEl.offsetWidth;
    icoEl.classList.add('ring');
    clearTimeout(ringTimer);
    ringTimer = setTimeout(function () { icoEl.classList.remove('ring'); }, 1000);
    if (cfg.notificationSound === false) return;
    try {
      var a = new w.Audio('sound/notify.wav');
      var p = a.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked */ });
    } catch (e) { /* no audio */ }
  }

  // ---- list ---------------------------------------------------------------
  // Markdown shown as plain text
  function plain(t) {
    t = String(t || '');
    t = t.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
    t = t.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1');
    t = t.replace(/(\*\*|__|`|~~)/g, '');
    t = t.replace(/^\s{0,3}#{1,6}\s*/gm, '');
    t = t.replace(/^\s*[*-]\s+/gm, '• ');
    t = t.replace(/(^|\s)[*_]([^*_\n]+)[*_](?=\s|$)/g, '$1$2');
    return t.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
  }

  function render(vis) {
    vis = vis || visible();
    var prevId = HAT.nav.current() && HAT.nav.current()._nid, focusRow = null, i;
    listEl.innerHTML = '';
    listEl.scrollTop = 0;
    subEl.textContent = vis.length ? HAT.t('notifs.readOnly', vis.length) : '';
    if (!vis.length) {
      listEl.appendChild(U.el('div', 'nt-empty', HAT.t('notifs.empty')));
      openHint.style.display = 'none';
      HAT.nav.focus(null);
      return;
    }
    openHint.style.display = '';
    for (i = 0; i < vis.length; i++) {
      (function (it) {
        var row = U.el('div', 'nt-row focusable');
        var head = U.el('div', 'nt-head');
        head.appendChild(U.el('span', 'nt-title', it.title || HAT.t('notifs.untitled')));
        head.appendChild(U.el('span', 'nt-time', U.relTime(it.created)));
        row.appendChild(head);
        row.appendChild(U.el('div', 'nt-msg', plain(it.message)));
        row._nid = it.id;
        row._act = function () { row.classList.toggle('open'); HAT.nav.refreshRing(); };
        listEl.appendChild(row);
        if (it.id === prevId) focusRow = row;
      })(vis[i]);
    }
    HAT.nav.focus(focusRow || listEl.querySelector('.nt-row'));
  }

  N.open = function () {
    overlayEl.classList.add('show');
    UI.layer = 'notifs';
    render();
  };

  N.close = function () {
    overlayEl.classList.remove('show');
    UI.layer = 'main';
    HAT.nav.focus(bellEl);
  };

  // Rows for the diagnostics screen
  N.diagRows = function () {
    var hidden = [], k, vis = 0, total = 0;
    for (k in items) if (items.hasOwnProperty(k)) {
      total++;
      if (ignored(items[k])) hidden.push(items[k].id); else vis++;
    }
    var state = mode === 'subscribe' ? HAT.t('nt.live') : mode === 'poll' ? HAT.t('nt.poll') : mode === 'failed' ? HAT.t('nt.failed', lastError) : HAT.t('nt.noData');
    var rows = [[HAT.t('dg.notifications'), HAT.t('nt.diag', state, vis, hidden.length)]];
    if (hidden.length) rows.push([HAT.t('nt.hiddenIds'), hidden.slice(0, 4).join(', ') + (hidden.length > 4 ? '…' : '')]);
    return rows;
  };
})(window);
