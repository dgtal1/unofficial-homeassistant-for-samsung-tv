// Application bootstrap: connects to Home Assistant, loads the dashboard, wires everything together
(function (w) {
  var HAT = w.HAT = w.HAT || {};
  var cfg = HAT.cfg = w.HA_CONFIG || {};
  var UI = HAT.ui, E = HAT.entity, D = HAT.dashboard, store = HAT.store, settings = HAT.settings;

  var client = null;
  var model = { views: [], skipped: {}, source: '' };
  var lastModelJson = '';
  var reloadTimer = 0;
  var firstLoad = true;
  var user = null;              // { id, name, is_admin } of the token's user
  var dashTitles = {};          // url_path ('' = default) -> title, filled from get_panels

  // Device kind: on a real TV the dashboard picker is hidden and js/config.js decides the dashboard.
  // Detected from the Samsung product info / systeminfo (the emulator reports "Emulator").
  var device = { checked: false, tv: false, emulator: false, info: '' };

  function detectDevice(cb) {
    if (device.checked) { cb(); return; }
    if (!w.tizen) { device.checked = true; cb(); return; }     // desktop browser: behaves like the emulator
    var seen = [], t0 = Date.now();
    function finish() {
      if (device.checked) return;
      device.checked = true;
      device.info = seen.join(' | ');
      device.emulator = device.info.toLowerCase().indexOf('emulator') >= 0;
      device.tv = !device.emulator;
      cb();
    }
    function readBuild() {
      try {
        w.tizen.systeminfo.getPropertyValue('BUILD', function (b) {
          seen.push([b.manufacturer, b.model, b.buildVersion].join(' '));
          finish();
        }, finish);
        setTimeout(finish, 1000);
      } catch (e) { finish(); }
    }
    function step() {
      try {
        if (w.webapis && w.webapis.productinfo) { seen.push(String(w.webapis.productinfo.getModel())); readBuild(); return; }
      } catch (e) { /* privilege missing */ }
      if (Date.now() - t0 > 1500) { readBuild(); return; }
      setTimeout(step, 100);
    }
    step();
  }

  // Dashboard assigned to the token's user in the HA profile (server side: frontend/get_user_data, key "core").
  // { found: bool, path: url_path or null (null = the default dashboard) }
  var profile = { found: false, path: null, raw: null, state: 'nieznany' };

  // Dashboard in use: profile dashboard of the user, then js/config.js.
  // Emulator / browser: a choice saved from the picker wins over both. A real TV never uses the saved choice.
  function currentDashboard() {
    if (!device.tv && settings.has('dashboard')) return settings.get('dashboard') || null;
    if (profile.found) return profile.path;
    return cfg.dashboard || null;
  }

  // Built-in dashboards generated in the app are stored as "gen:<kind>"
  function genKind(path) {
    return path && path.indexOf('gen:') === 0 ? path.slice(4) : null;
  }

  function dashboardLabel() {
    var p = currentDashboard();
    var key = p || '';
    if (dashTitles.hasOwnProperty(key)) return dashTitles[key];
    if (genKind(p) && HAT.generated.KINDS[genKind(p)]) return HAT.t(HAT.generated.KINDS[genKind(p)].title);
    return p ? p : HAT.t('dash.default');
  }

  // Samsung TV API (webapis) exists only on Tizen; its script is injected there so desktop browsers do not request it
  function loadWebapis() {
    if (!w.tizen || w.webapis) return;
    try {
      var sc = document.createElement('script');
      sc.src = '$WEBAPIS/webapis/webapis.js';
      document.head.appendChild(sc);
    } catch (e) { /* ignore */ }
  }

  // Device facts for the diagnostics screen; every source is optional. cb(rows) is always called once.
  function collectDevice(cb) {
    var rows = [];
    function add(k, fn) {
      var v;
      try { v = fn(); } catch (e) { v = HAT.t('common.unavailableLc'); }
      rows.push([k, v === undefined || v === null || v === '' ? '—' : String(v)]);
    }
    add(HAT.t('dg.api'), function () { return (w.tizen ? 'tizen' : HAT.t('dg.noTizen')) + ' / ' + (w.webapis ? 'webapis' : HAT.t('dg.noWebapis')); });
    add(HAT.t('dg.model'), function () { return w.webapis.productinfo.getModel(); });
    add(HAT.t('dg.realModel'), function () { return w.webapis.productinfo.getRealModel(); });
    add('Firmware', function () { return w.webapis.productinfo.getFirmware(); });
    add('DUID', function () { return w.webapis.productinfo.getDuid(); });
    var done = false;
    var finish = function () { if (!done) { done = true; cb(rows); } };
    try {
      w.tizen.systeminfo.getPropertyValue('BUILD', function (b) {
        rows.push(['Build (systeminfo)', [b.manufacturer, b.model, b.buildVersion].join(' / ')]);
        finish();
      }, function () { finish(); });
      setTimeout(finish, 1200);
    } catch (e) { finish(); }
  }

  function boot() {
    loadWebapis();
    HAT.i18n.apply();
    HAT.i18n.applyStatic();
    UI.init(cfg);
    if (!cfg.url || !cfg.token || /PASTE_YOUR/.test(cfg.token)) {
      UI.showSplash(HAT.t('boot.noConfig'), HAT.t('boot.noConfigSub'));
      return;
    }
    UI.showSplash('Home Assistant', HAT.t('boot.connecting'));

    client = new HAT.HAClient(cfg);
    HAT.detail.init(client);
    HAT.notify.init(client, cfg);
    HAT.nav.init(cfg, onBack);
    HAT.dialogs.init({
      canPickDashboard: function () { return !device.tv; },
      dashboardLabel: dashboardLabel,
      currentDashboard: currentDashboard,
      listDashboards: listDashboards,
      selectDashboard: selectDashboard,
      openDiag: openDiag,
      reload: function () { loadAll(true, { reset: false }); },
      languageChanged: function () {
        dashTitles = {};          // dashboard names depend on the language
        UI.updateClock();
        if (client) loadAll(true, { reset: false });
      }
    });

    UI.handlers.tile = onTile;
    UI.handlers.settings = function () { HAT.dialogs.openSettings(HAT.nav.current()); };

    client.on('status', function (s) {
      UI.setStatus(s);
      if (s === 'invalid') {
        UI.showSplash(HAT.t('boot.badToken'), HAT.t('boot.badTokenSub'));
      } else if (s === 'closed' && firstLoad) {
        UI.showSplash(HAT.t('boot.noConn'), HAT.t('boot.noConnSub', cfg.url));
      }
    });

    client.on('ready', function () {
      detectDevice(function () { loadAll(false, {}); });
      listDashboards().then(null, function () { /* the picker shows the error when opened */ });
    });

    client.subscribe('state_changed', function (ev) {
      var data = ev && ev.data;
      if (!data || !data.entity_id) return;
      store.set(data.entity_id, data.new_state || null);
      UI.entityChanged(data.entity_id);
      HAT.detail.refresh(data.entity_id);
    });

    // Fired by HA when a dashboard is saved in the editor
    client.subscribe('lovelace_updated', function () {
      clearTimeout(reloadTimer);
      reloadTimer = setTimeout(function () { loadAll(true, { reset: false }); }, 800);
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) client.wake();
    });

    client.connect();
  }

  // ---- dashboards list ---------------------------------------------------
  // Dashboards are panels with component "lovelace"; the list is not limited to administrators
  function listDashboards() {
    return client.request({ type: 'get_panels' }).then(function (panels) {
      var items = [], seen = {};
      for (var k in panels) {
        if (!panels.hasOwnProperty(k)) continue;
        var p = panels[k];
        if (!p || p.component_name !== 'lovelace') continue;
        var isDefault = p.url_path === 'lovelace';
        var path = isDefault ? null : p.url_path;
        if (seen[String(path)]) continue;
        seen[String(path)] = true;
        var title = p.title || (isDefault ? HAT.t('dash.overview') : p.url_path);
        items.push({ path: path, title: isDefault ? title + HAT.t('dash.defaultSuffix') : title, sub: '/' + p.url_path, isDefault: isDefault });
      }
      if (!seen['null']) items.push({ path: null, title: HAT.t('dash.default'), sub: '/lovelace', isDefault: true });
      items.sort(function (a, b) {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
      });
      var K = HAT.generated.KINDS, extra = [];
      for (var kk in K) if (K.hasOwnProperty(kk)) extra.push({ path: 'gen:' + kk, title: HAT.t(K[kk].title), sub: HAT.t(K[kk].sub), isDefault: false });
      items.splice.apply(items, [items.length > 0 ? 1 : 0, 0].concat(extra));
      dashTitles = {};
      for (var i = 0; i < items.length; i++) dashTitles[items[i].path || ''] = items[i].title;
      return items;
    });
  }

  // Saves the choice and reloads the view
  function selectDashboard(path, title) {
    settings.set('dashboard', path);
    lastModelJson = '';
    UI.toast(HAT.t('dash.loading', title || path || HAT.t('dash.defaultShort')), 2500);
    loadAll(false, { reset: true, announce: title || path || HAT.t('dash.defaultShort') });
  }

  // ---- loading -----------------------------------------------------------
  function loadStates() {
    return client.request({ type: 'get_states' }).then(function (list) {
      store.states = {};
      for (var i = 0; i < list.length; i++) store.states[list[i].entity_id] = list[i];
    });
  }

  function loadProfileDashboard() {
    return client.request({ type: 'frontend/get_user_data', key: 'core' }).then(function (res) {
      var v = res && res.value && res.value.default_panel;
      profile.raw = typeof v === 'string' ? v : null;
      if (typeof v === 'string' && v) {
        profile.found = true;
        profile.path = v === 'lovelace' ? null : v;
        profile.state = v;
      } else {
        profile.found = false; profile.path = null; profile.state = HAT.t('dg.noProfileSetting');
      }
    }, function (e) {
      profile.found = false; profile.path = null;
      profile.state = HAT.t('dash.profileFailed', (e && (e.code || e.message)) || HAT.t('common.error'));
    });
  }

  function loadUser() {
    if (user) return Promise.resolve(user);
    return client.request({ type: 'auth/current_user' }).then(function (u) {
      user = u || null;
      HAT.user = user;
      return user;
    }, function () { return null; });     // unknown user: no view is hidden because of it
  }

  // Generated dashboards need the registries; they are read on every (re)load
  function loadGenerated(kind) {
    return HAT.generated.load(client).then(function (reg) {
      var m = HAT.generated.build(kind, reg, store.states);
      if (!m) throw { message: HAT.t('dash.noRegistries') };
      m.source = 'generated';
      return m;
    });
  }

  function loadDashboard() {
    var gk = genKind(currentDashboard());
    if (gk) return loadGenerated(gk);
    var msg = { type: 'lovelace/config', force: false };
    var dash = currentDashboard();
    if (dash) msg.url_path = dash;
    return client.request(msg).then(function (conf) {
      if (conf && conf.strategy && !(conf.views && conf.views.length)) {
        throw { message: HAT.t('dash.autoStrategy', conf.strategy.type || '?') };
      }
      var m = D.parse(conf, { userId: user ? user.id : null });
      m.source = 'dashboard';
      if (!HAT.generated.usesNameModes(m.views)) return m;
      // `name: {type: entity}` needs device and area names from the registries
      return HAT.generated.load(client).then(function (reg) {
        HAT.generated.resolveNames(m.views, reg);
        return m;
      }, function () { return m; });
    });
  }

  // opts: { reset: forget the previous tab/focus, announce: dashboard name to report problems for }
  function loadAll(fromEditor, opts) {
    opts = opts || {};
    Promise.all([loadStates(), loadUser(), loadProfileDashboard()]).then(function () {
      return loadDashboard().then(null, function (err) { return { error: err }; });
    }).then(function (m) {
      var failed = !m || m.error || !m.views || !m.views.length;
      if (!failed) {
        if (opts.announce) UI.toast(HAT.t('dash.loaded', opts.announce));
        applyModel(m, fromEditor === true, opts.reset === true);
        return;
      }
      var reason = m && m.error ? (m.error.message || m.error.code || HAT.t('common.error')) : HAT.t('dash.empty');
      // Fallback: Apple Home style grouped by areas, or by entity type when the registries are not readable
      return HAT.generated.load(client).then(function (reg) {
        var fb = HAT.generated.build('apple', reg, store.states);
        if (fb && fb.views.length) { fb.fallbackKind = HAT.t('fb.areas'); return fb; }
        return null;
      }, function () { return null; }).then(function (fb) {
        if (!fb) { fb = D.fallback(store.states); fb.fallbackKind = HAT.t('fb.types'); }
        fb.source = 'fallback';
        fb.error = reason;
        if (opts.announce) {
          UI.toast(HAT.t('dash.cannotRead', opts.announce, reason), 5000);
        }
        applyModel(fb, fromEditor === true, opts.reset === true);
      });
    }, function () {
      // Request failed (connection dropped); the client reconnects and fires "ready" again
    });
  }

  function applyModel(m, keepPosition, reset) {
    var json = JSON.stringify(m.views);
    model = m;
    if (json === lastModelJson && UI.hasPages() && !reset) {
      UI.refreshAll();
    } else {
      lastModelJson = json;
      if (HAT.detail.isOpen()) HAT.detail.close();
      var prevPath = !reset && (keepPosition || UI.hasPages()) ? UI.activePath() : null;
      var wasFocus = reset ? null : HAT.nav.current();
      var prevEntity = wasFocus && wasFocus._entity;
      UI.build(m.views, prevPath);
      var target = null;
      if (prevEntity) {
        var page = UI.activePage();
        var cand = page ? page.inner.querySelectorAll('.tile') : [];
        for (var i = 0; i < cand.length; i++) if (cand[i]._entity === prevEntity) { target = cand[i]; break; }
      }
      if (UI.layer === 'main') HAT.nav.focus(target || UI.firstTile());
    }
    if (!m.views.length) {
      UI.showSplash(HAT.t('boot.empty'), HAT.t('boot.emptySub'));
      return;
    }
    UI.hideSplash();
    if (firstLoad) {
      firstLoad = false;
      UI.toast(HAT.t('tile.hint'), 4500);
    }
    UI.setStatus(client.status);
  }

  // Tile activation: short press = toggle/activate/detail, long press = detail
  function onTile(node, kind) {
    if (node._link) {
      if (UI.openPath(node._link.link, node)) HAT.nav.focus(UI.firstTile());
      return;
    }
    if (node._nav && kind !== 'long') {
      if (UI.openPath(node._nav, node)) { HAT.nav.focus(UI.firstTile()); return; }
    }
    var id = node._entity;
    var st = store.get(id);
    var action = kind === 'long' ? 'detail' : E.tapAction(id, st, cfg);
    if (action === 'detail') {
      HAT.detail.open(id, node._ov, node);
      return;
    }
    var p = action === 'toggle' ? E.runToggle(client, id) : E.runActivate(client, id);
    p.then(function () {
      if (action === 'activate') UI.toast(HAT.t('tile.started', E.describe(id, st, node._ov).name));
    }, function (e) {
      UI.toast(HAT.t('err.command', (e && e.message) || HAT.t('err.commandFailed')), 2500);
    });
  }

  // Back key: close layers first, then return to the top, and exit only from the top
  function onBack() {
    if (UI.layer === 'diag') { closeDiag(); return; }
    if (HAT.dialogs.isOpen()) { HAT.dialogs.back(); return; }
    if (HAT.detail.isOpen()) { HAT.detail.close(); return; }
    if (UI.isSubView()) {
      var back = UI.leaveSub();
      if (back) HAT.nav.focus(back);
      return;
    }
    var page = UI.activePage();
    var cur = HAT.nav.current();
    var first = UI.firstTile();
    if (page && (page.scrollY > 0 || (cur && cur !== first && cur.classList.contains('tile')))) {
      UI.scrollTop();
      HAT.nav.focus(first);
      return;
    }
    try {
      if (w.tizen && tizen.application) tizen.application.getCurrentApplication().exit();
    } catch (e) { /* desktop browser */ }
  }

  // ---- diagnostics -------------------------------------------------------
  function openDiag() {
    collectDevice(showDiagRows);
  }

  function showDiagRows(devRows) {
    var ua = navigator.userAgent || '';
    var chrome = /Chrom(?:e|ium)\/([\d.]+)/.exec(ua) || /(\d+\.\d+\.\d+\.\d+)\/[\d.]+ TV Safari/.exec(ua);
    var tz = /Tizen ([\d.]+)/.exec(ua);
    var skipped = [];
    for (var k in model.skipped) if (model.skipped.hasOwnProperty(k)) skipped.push(k + ' ×' + model.skipped[k]);
    var tileCount = UI.entities().length;
    var rows = [
      [HAT.t('dg.browser'), chrome ? 'Chromium ' + chrome[1] : HAT.t('common.unknownLc')],
      ['Tizen', tz ? tz[1] : HAT.t('common.unknownLc')],
      [HAT.t('dg.screen'), HAT.t('dg.screenVal', w.innerWidth, w.innerHeight, w.devicePixelRatio || 1)],
      ['@DEVICE', ''],
      ['Home Assistant', client.haVersion || '—'],
      [HAT.t('dg.connection'), client.status + ' · ' + client.url],
      [HAT.t('dg.entities'), String(store.count())],
      [HAT.t('dg.mode'), device.tv ? HAT.t('dg.modeTv') : (device.emulator ? HAT.t('dg.modeEmu') : (w.tizen ? 'Tizen' : HAT.t('dg.modeBrowser')))],
      [HAT.t('dg.profileDash'), profile.state],
      [HAT.t('dg.selectedDash'), dashboardLabel() + (settings.isPersistent() ? '' : HAT.t('dg.noSave'))],
      [HAT.t('dg.layoutSource'), model.source === 'dashboard' ? HAT.t('dg.srcDash') : model.source === 'generated' ? HAT.t('dg.srcGenerated') : HAT.t('dg.srcFallback', (model.fallbackKind || '') + (model.error ? ' – ' + model.error : ''))],
      [HAT.t('dg.tokenUser'), user ? user.name + (user.is_admin ? HAT.t('dg.admin') : '') : HAT.t('common.unknownLc')],
      ['@NOTIFY', ''],
      [HAT.t('dg.views'), model.views.length + ' / ' + tileCount + (model.hiddenViews ? HAT.t('dg.hiddenViews', model.hiddenViews) : '')],
      [HAT.t('dg.skipped'), skipped.length ? skipped.join(', ') : HAT.t('common.none')],
      [HAT.t('dg.fps'), '…', 'fps'],
      ['User-Agent', ua]
    ];
    for (var ri = 0; ri < rows.length; ri++) {
      if (rows[ri][0] === '@DEVICE') { rows.splice.apply(rows, [ri, 1].concat(devRows)); break; }
    }
    for (var rj = 0; rj < rows.length; rj++) {
      if (rows[rj][0] === '@NOTIFY') { rows.splice.apply(rows, [rj, 1].concat(HAT.notify.diagRows())); break; }
    }
    UI.showDiag(rows);
    HAT.nav.focus(document.getElementById('diag-close'));
  }

  function closeDiag() {
    UI.hideDiag();
    HAT.dialogs.openSettings();
  }

  function wireDiagButtons() {
    var close = document.getElementById('diag-close');
    var reload = document.getElementById('diag-reload');
    close._act = closeDiag;
    reload._act = function () {
      UI.hideDiag();
      HAT.dialogs.closeAll();
      UI.toast(HAT.t('dash.refreshing'));
      loadAll(true, { reset: false });
    };
  }

  w.addEventListener('load', function () {
    wireDiagButtons();
    boot();
  });
})(window);
