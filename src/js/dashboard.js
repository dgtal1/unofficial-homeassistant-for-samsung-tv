// Converts a Home Assistant dashboard (lovelace) config into a flat view/section/tile model.
// Only standard cards are understood; custom cards (custom:*) are skipped and counted.
(function (w) {
  var HAT = w.HAT = w.HAT || {};
  var D = HAT.dashboard = {};

  function Builder(skipped) {
    this.sections = [];
    this.cur = null;
    this.skipped = skipped;
  }

  Builder.prototype.skip = function (type) {
    var k = type || 'unknown';
    this.skipped[k] = (this.skipped[k] || 0) + 1;
  };

  Builder.prototype.breakGroup = function () { this.cur = null; };

  Builder.prototype.heading = function (text) {
    if (!text || typeof text !== 'string') return;
    if (this.cur && !this.cur.title && this.cur.tiles.length === 0) {
      this.cur.title = text;
      return;
    }
    this.cur = { title: text, tiles: [], closed: false };
    this.sections.push(this.cur);
  };

  // Last path segment of a navigate target: "/lovelace/lights?x=1" -> "lights"
  function navTarget(card) {
    var ta = card && card.tap_action;
    if (!ta || ta.action !== 'navigate' || typeof ta.navigation_path !== 'string') return null;
    var seg = ta.navigation_path.split('?')[0].split('#')[0].replace(/\/+$/, '').split('/').pop();
    return seg || null;
  }

  // Tile that only opens another view (button card without an entity)
  Builder.prototype.linkTile = function (nav, name, icon) {
    if (!this.cur || this.cur.closed) {
      this.cur = { title: '', tiles: [], closed: false };
      this.sections.push(this.cur);
    }
    var E = HAT.entity;
    this.cur.tiles.push({
      link: nav, kind: 'nav', members: [],
      title: typeof name === 'string' ? name : nav,
      icon: (typeof icon === 'string' && E.mdiIcon(icon)) || 'home'
    });
  };

  Builder.prototype.tile = function (entity, name, icon, nav) {
    if (typeof entity !== 'string' || entity.indexOf('.') < 0) return;
    if (!this.cur || this.cur.closed) {
      this.cur = { title: '', tiles: [], closed: false };
      this.sections.push(this.cur);
    }
    for (var i = 0; i < this.cur.tiles.length; i++) {
      if (this.cur.tiles[i].entity === entity) return;
    }
    this.cur.tiles.push({
      entity: entity,
      name: typeof name === 'string' ? name : (name && name.type === 'text' && typeof name.text === 'string' ? name.text : null),
      nameMode: name && typeof name === 'object' && (name.type === 'entity' || name.type === 'device' || name.type === 'area') ? name.type : null,
      icon: typeof icon === 'string' ? icon : null,
      nav: nav || null
    });
  };

  // Entities / glance rows can be "light.x" or { entity, name, icon, type }
  function walkRows(rows, b) {
    if (!rows || !rows.length) return;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (typeof r === 'string') { b.tile(r); continue; }
      if (!r || typeof r !== 'object') continue;
      if (r.type === 'section') { b.heading(r.label); continue; }
      if (r.type === 'conditional' && r.row) { walkRows([r.row], b); continue; }
      if (typeof r.entity === 'string') b.tile(r.entity, r.name, r.icon);
    }
  }

  function walkCard(card, b) {
    if (!card || typeof card !== 'object') return;
    var t = card.type || '';
    var i;
    if (t.indexOf('custom:') === 0) { b.skip(t); return; }

    switch (t) {
      case 'vertical-stack':
      case 'horizontal-stack':
      case 'grid':
        if (card.title) b.heading(card.title);
        for (i = 0; i < (card.cards || []).length; i++) walkCard(card.cards[i], b);
        return;
      case 'conditional':
        // Conditions are not evaluated; the inner card is always shown
        walkCard(card.card, b);
        return;
      case 'heading':
        b.heading(card.heading || card.title);
        return;
      case 'entities':
      case 'glance':
        if (card.title) b.heading(card.title);
        walkRows(card.entities, b);
        return;
      case 'picture-glance':
        if (card.title) b.heading(card.title);
        if (card.camera_image) b.tile(card.camera_image);
        walkRows(card.entities, b);
        return;
      case 'markdown':
      case 'history-graph':
      case 'statistics-graph':
      case 'statistic':
      case 'logbook':
      case 'map':
      case 'iframe':
      case 'webpage':
      case 'calendar':
      case 'todo-list':
      case 'shopping-list':
      case 'energy-distribution':
      case 'picture':
      case 'picture-elements':
      case 'area':
      case 'clock':
        b.skip(t);
        return;
    }
    // Any other standard card that points at a single entity becomes a tile
    var nav = navTarget(card);
    if (typeof card.entity === 'string') {
      b.tile(card.entity, card.name, card.icon, nav);
      return;
    }
    if (nav && (t === 'button' || t === 'tile')) {
      b.linkTile(nav, card.name, card.icon);
      return;
    }
    b.skip(t);
  }

  function isContainer(card) {
    var t = card && card.type;
    return t === 'entities' || t === 'glance' || t === 'picture-glance' ||
      t === 'vertical-stack' || t === 'horizontal-stack' || (t === 'grid' && !!card.title);
  }

  // Top level card of a masonry view
  function walkTop(card, b) {
    walkCard(card, b);
    if (isContainer(card) && b.cur && b.cur.title) b.cur.closed = true;
  }

  // Same rule as the HA frontend: visible is true/undefined (everyone), false (nobody)
  // or a list of { user: id } entries (only those users)
  function viewVisible(v, userId) {
    if (v.visible === undefined || v.visible === null || v.visible === true) return true;
    if (v.visible === false) return false;
    if (Object.prototype.toString.call(v.visible) === '[object Array]') {
      if (userId === null || userId === undefined) return true;   // unknown user: do not hide
      for (var i = 0; i < v.visible.length; i++) {
        if (v.visible[i] && v.visible[i].user === userId) return true;
      }
      return false;
    }
    return true;
  }

  // Picks how a link tile summarises the entities of the view it opens (see generated.js describeLink)
  var SEC_BINARY = { door: 1, garage_door: 1, window: 1, opening: 1, smoke: 1, gas: 1, carbon_monoxide: 1, safety: 1, tamper: 1, motion: 1, occupancy: 1, presence: 1, vibration: 1, moisture: 1 };
  function classifyMembers(ids) {
    var n = { light: 0, media: 0, climate: 0, security: 0, battery: 0, other: 0 };
    for (var i = 0; i < ids.length; i++) {
      var d = ids[i].split('.')[0], st = HAT.store.get(ids[i]);
      var dc = st && st.attributes ? st.attributes.device_class : null;
      if (d === 'light') n.light++;
      else if ((d === 'sensor' || d === 'binary_sensor') && dc === 'battery') n.battery++;
      else if (d === 'media_player') n.media++;
      else if (d === 'climate' || (d === 'sensor' && (dc === 'temperature' || dc === 'humidity'))) n.climate++;
      else if (d === 'lock' || d === 'alarm_control_panel' || d === 'camera' ||
               (d === 'binary_sensor' && SEC_BINARY[dc]) || (d === 'cover' && (dc === 'door' || dc === 'garage' || dc === 'gate'))) n.security++;
      else n.other++;
    }
    var total = ids.length;
    if (!total) return 'area';
    if (n.battery > 0 && n.security === 0 && n.battery >= n.light) return 'maintenance';
    if (n.security > 0 && n.light === 0) return 'security';
    if (n.media === total) return 'media';
    if (n.climate === total) return 'climate';
    if (n.light === total) return 'lights';
    return 'area';
  }

  // cfg: result of the "lovelace/config" WebSocket command
  // opts.userId: id of the user the token belongs to (used for per-user view visibility)
  D.parse = function (cfg, opts) {
    var userId = opts && opts.userId !== undefined ? opts.userId : null;
    var skipped = {};
    var views = [];
    var hiddenViews = 0;
    var list = (cfg && cfg.views) || [];
    for (var vi = 0; vi < list.length; vi++) {
      var v = list[vi];
      if (!v) continue;
      if (!viewVisible(v, userId)) { hiddenViews++; continue; }
      var b = new Builder(skipped);
      var si, ci;
      if (v.sections && v.sections.length) {
        for (si = 0; si < v.sections.length; si++) {
          b.breakGroup();
          var cards = (v.sections[si] && v.sections[si].cards) || [];
          for (ci = 0; ci < cards.length; ci++) walkCard(cards[ci], b);
        }
      }
      if (v.cards && v.cards.length) {
        b.breakGroup();
        for (ci = 0; ci < v.cards.length; ci++) walkTop(v.cards[ci], b);
      }
      var secs = [];
      for (si = 0; si < b.sections.length; si++) {
        if (b.sections[si].tiles.length) secs.push(b.sections[si]);
      }
      if (!secs.length) continue;
      views.push({
        subview: !!v.subview,
        title: v.title || (v.path && v.path !== 'default_view' ? v.path : (v.path ? HAT.t('dash.start') : HAT.t('dash.view', vi + 1))),
        path: v.path || String(vi),
        sections: secs
      });
    }
    // Link tiles without an entity summarise the entities of the view they open (like generated area tiles)
    var byPath = {};
    for (var a = 0; a < views.length; a++) byPath[views[a].path] = views[a];
    for (a = 0; a < views.length; a++) {
      for (var sj = 0; sj < views[a].sections.length; sj++) {
        var tl = views[a].sections[sj].tiles;
        for (var tj = 0; tj < tl.length; tj++) {
          var lt = tl[tj];
          if (!lt.link || lt.kind !== 'nav' || !byPath[lt.link]) continue;
          var members = [], tv = byPath[lt.link];
          for (var s2 = 0; s2 < tv.sections.length; s2++) {
            for (var t2 = 0; t2 < tv.sections[s2].tiles.length; t2++) {
              if (tv.sections[s2].tiles[t2].entity) members.push(tv.sections[s2].tiles[t2].entity);
            }
          }
          lt.kind = classifyMembers(members);
          lt.members = members;
        }
      }
    }
    // The first view must be a regular tab; sub views are only reachable through navigate tiles
    var firstReg = -1;
    for (var q = 0; q < views.length; q++) if (!views[q].subview) { firstReg = q; break; }
    if (firstReg < 0 && views.length) views[0].subview = false;
    return { views: views, skipped: skipped, hiddenViews: hiddenViews };
  };

  // Used when the dashboard cannot be read (e.g. auto-generated dashboard)
  var FALLBACK_GROUPS = [
    ['grp.lights', ['light']],
    ['grp.switches', ['switch', 'input_boolean']],
    ['grp.climate', ['climate', 'fan', 'humidifier']],
    ['grp.covers', ['cover']],
    ['grp.locks', ['lock']],
    ['grp.media', ['media_player']],
    ['grp.cameras', ['camera']],
    ['grp.scenes', ['scene', 'script']],
    ['grp.weather', ['weather']],
    ['grp.sensors', ['binary_sensor', 'sensor']]
  ];

  D.fallback = function (states) {
    var ids = Object.keys(states).sort();
    var secs = [];
    for (var g = 0; g < FALLBACK_GROUPS.length; g++) {
      var tiles = [];
      for (var i = 0; i < ids.length && tiles.length < 48; i++) {
        var dom = ids[i].split('.')[0];
        if (FALLBACK_GROUPS[g][1].indexOf(dom) >= 0) tiles.push({ entity: ids[i], name: null, icon: null });
      }
      if (tiles.length) secs.push({ title: HAT.t(FALLBACK_GROUPS[g][0]), tiles: tiles });
    }
    return {
      views: secs.length ? [{ title: HAT.t('sum.home'), path: 'fallback', sections: secs }] : [],
      skipped: {}
    };
  };
})(window);
