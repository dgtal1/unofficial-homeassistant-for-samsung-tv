// Built-in dashboards generated from the area / device / entity registries.
//  - "ha-home": recreation of the generated Home Assistant "Overview" (summaries + areas)
//  - "apple":   Apple Home style (home tab + one tab per room)
// Also used as the fallback when the selected dashboard cannot be read.
(function (w) {
  var HAT = w.HAT = w.HAT || {};
  var U = HAT.util, E = HAT.entity, store = HAT.store;
  var G = HAT.generated = {};

  G.KINDS = {
    // translation keys (resolved when shown, so a language change applies at once)
    'ha-home': { title: 'gen.haHome', sub: 'gen.haHomeSub' },
    'apple': { title: 'gen.apple', sub: 'gen.appleSub' }
  };

  // ---- registries --------------------------------------------------------
  function normalizeDisplay(res) {
    var list = (res && res.entities) || [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      out.push({
        entity_id: e.ei,
        device_id: e.di || null,
        area_id: e.ai || null,
        hidden_by: e.hb ? 'user' : null,
        disabled_by: null,
        entity_category: (e.ec !== undefined && e.ec !== null) ? 'category' : null
      });
    }
    return out;
  }

  function loadEntities(client) {
    return client.request({ type: 'config/entity_registry/list' }).then(null, function () {
      return client.request({ type: 'config/entity_registry/list_for_display' }).then(normalizeDisplay, function () {
        return null;
      });
    });
  }

  // Resolves with { areas, devices, entities }; a field is null when its command was refused
  G.load = function (client) {
    var soft = function (type) {
      return client.request({ type: type }).then(null, function () { return null; });
    };
    return Promise.all([soft('config/area_registry/list'), soft('config/device_registry/list'), loadEntities(client)])
      .then(function (r) { return { areas: r[0], devices: r[1], entities: r[2] }; });
  };

  // Name shown by the tile card option `name: { type: entity | device | area }`.
  // "entity": the friendly name without the device name and area name prefixes (as the HA frontend shows it)
  G.entityName = function (reg, id, st, mode) {
    var fn = (st && st.attributes && st.attributes.friendly_name) || id;
    if (!reg) return fn;
    var i, r = null, dev = null, areaId = null, areaName = null, devName = null;
    for (i = 0; reg.entities && i < reg.entities.length; i++) if (reg.entities[i].entity_id === id) { r = reg.entities[i]; break; }
    if (r && r.device_id && reg.devices) {
      for (i = 0; i < reg.devices.length; i++) if (reg.devices[i].id === r.device_id) { dev = reg.devices[i]; break; }
    }
    areaId = (r && r.area_id) || (dev && dev.area_id) || null;
    if (areaId && reg.areas) {
      for (i = 0; i < reg.areas.length; i++) if (reg.areas[i].area_id === areaId) { areaName = reg.areas[i].name; break; }
    }
    if (dev) devName = dev.name_by_user || dev.name || null;
    if (mode === 'device') return devName || fn;
    if (mode === 'area') return areaName || fn;
    var s = fn, rest;
    if (devName && s.indexOf(devName + ' ') === 0) {
      rest = s.slice(devName.length + 1);
      if (rest) s = rest;
    }
    if (areaName && s.indexOf(areaName + ' ') === 0) {
      rest = s.slice(areaName.length + 1);
      if (rest) s = rest;
    }
    return s;
  };

  // Fills tile.name for tiles that use a name object; needs the registries (left unchanged when unavailable)
  G.resolveNames = function (views, reg) {
    var n = 0;
    for (var a = 0; a < views.length; a++) for (var b = 0; b < views[a].sections.length; b++) {
      var tl = views[a].sections[b].tiles;
      for (var c = 0; c < tl.length; c++) {
        if (!tl[c].nameMode) continue;
        tl[c].name = G.entityName(reg, tl[c].entity, store.get(tl[c].entity), tl[c].nameMode);
        n++;
      }
    }
    return n;
  };

  G.usesNameModes = function (views) {
    for (var a = 0; a < views.length; a++) for (var b = 0; b < views[a].sections.length; b++) {
      var tl = views[a].sections[b].tiles;
      for (var c = 0; c < tl.length; c++) if (tl[c].nameMode) return true;
    }
    return false;
  };

  // ---- classification ----------------------------------------------------
  var CLIMATE = { climate: 1, fan: 1, humidifier: 1, water_heater: 1 };
  var SEC_COVER = { door: 1, garage: 1, gate: 1, window: 1 };
  var SEC_BIN = {
    door: 1, garage_door: 1, window: 1, opening: 1, motion: 1, occupancy: 1, presence: 1,
    smoke: 1, gas: 1, carbon_monoxide: 1, safety: 1, tamper: 1, vibration: 1
  };

  var GROUPS = [
    { tk: 'grp.lights', test: function (it) { return it.d === 'light'; } },
    { tk: 'grp.switches', test: function (it) { return it.d === 'switch' || it.d === 'input_boolean'; } },
    { tk: 'grp.climate', test: function (it) { return !!CLIMATE[it.d]; } },
    { tk: 'grp.covers', test: function (it) { return it.d === 'cover'; } },
    { tk: 'grp.locks', test: function (it) { return it.d === 'lock' || it.d === 'alarm_control_panel'; } },
    { tk: 'grp.media', test: function (it) { return it.d === 'media_player'; } },
    { tk: 'grp.cameras', test: function (it) { return it.d === 'camera'; } },
    { tk: 'grp.scenes', test: function (it) { return it.d === 'scene' || it.d === 'script' || it.d === 'button'; } },
    { tk: 'grp.sensors', sensors: true, test: function (it) { return (it.d === 'sensor' || it.d === 'binary_sensor') && !it.cat; } }
  ];

  function groupIndex(it) {
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].test(it)) return i;
    return -1;
  }

  function isBattery(it) { return (it.d === 'sensor' || it.d === 'binary_sensor') && it.dc === 'battery'; }

  function lowBattery(it) {
    if (it.d === 'binary_sensor') return it.st.state === 'on';
    var n = U.num(it.st.state);
    return n !== null && n <= 20;
  }

  function inSummary(key, it) {
    switch (key) {
      case 'lights': return it.d === 'light';
      case 'climate':
        return !!CLIMATE[it.d] || (it.d === 'sensor' && !it.cat && (it.dc === 'temperature' || it.dc === 'humidity'));
      case 'security':
        return it.d === 'lock' || it.d === 'alarm_control_panel' || it.d === 'camera' ||
          (it.d === 'cover' && !!SEC_COVER[it.dc]) || (it.d === 'binary_sensor' && !!SEC_BIN[it.dc] && !it.cat);
      case 'media': return it.d === 'media_player';
      case 'maintenance': return isBattery(it) || it.st.state === 'unavailable';
    }
    return false;
  }

  var SUMMARIES = {
    'ha-home': [
      { key: 'lights', tk: 'grp.lights', icon: 'bulb' },
      { key: 'climate', tk: 'grp.climate', icon: 'thermo' },
      { key: 'security', tk: 'sum.security', icon: 'shield' },
      { key: 'media', tk: 'sum.players', icon: 'speaker' },
      { key: 'maintenance', tk: 'sum.maintenance', icon: 'gear' }
    ],
    'apple': [
      { key: 'lights', tk: 'grp.lights', icon: 'bulb' },
      { key: 'climate', tk: 'grp.climate', icon: 'thermo' },
      { key: 'security', tk: 'sum.security', icon: 'shield' },
      { key: 'media', tk: 'sum.speakers', icon: 'speaker' },
      { key: 'maintenance', tk: 'sum.maintenance', icon: 'gear' }
    ]
  };


  function byName(a, b) {
    var x = (a.st.attributes && a.st.attributes.friendly_name) || a.id;
    var y = (b.st.attributes && b.st.attributes.friendly_name) || b.id;
    return x.localeCompare ? x.localeCompare(y, HAT.i18n.lang()) : (x < y ? -1 : 1);
  }

  function entityTiles(items) {
    var out = [];
    for (var i = 0; i < items.length; i++) out.push({ entity: items[i].id, name: null, icon: null });
    return out;
  }

  // ---- live subtitle of link tiles ---------------------------------------
  // link: { kind: 'lights' | 'climate' | 'security' | 'media' | 'maintenance' | 'area', members: [entity ids] }
  G.describeLink = function (link) {
    var res = { text: '', active: false, alert: false };
    if (link.kind === 'nav') return res;
    var m = link.members || [];
    var i, st, d, a, n = 0, n2 = 0;
    for (i = 0; i < m.length; i++) {
      st = store.get(m[i]);
      if (!st) continue;
      d = E.domain(m[i]);
      a = st.attributes || {};
      switch (link.kind) {
        case 'lights': if (st.state === 'on') n++; break;
        case 'climate': if (d === 'climate' && st.state !== 'off' && st.state !== 'unavailable') n++; break;
        case 'security':
          if ((d === 'lock' && st.state === 'unlocked') ||
              (d === 'binary_sensor' && st.state === 'on' && (a.device_class === 'door' || a.device_class === 'window' ||
                a.device_class === 'garage_door' || a.device_class === 'opening' || a.device_class === 'smoke' ||
                a.device_class === 'gas' || a.device_class === 'carbon_monoxide' || a.device_class === 'safety' ||
                a.device_class === 'tamper' || a.device_class === 'moisture')) ||
              (d === 'alarm_control_panel' && st.state === 'triggered') ||
              (d === 'cover' && st.state === 'open' && (a.device_class === 'door' || a.device_class === 'garage' || a.device_class === 'gate'))) n++;
          break;
        case 'media': if (d === 'media_player' && st.state === 'playing') n++; break;
        case 'maintenance':
          if (st.state === 'unavailable') n2++;
          else if (a.device_class === 'battery' && (d === 'sensor' || d === 'binary_sensor')) {
            var low = d === 'binary_sensor' ? st.state === 'on' : (U.num(st.state) !== null && U.num(st.state) <= 20);
            if (low) n++;
          }
          break;
        default:   // area
          if (st.state === 'on' || st.state === 'playing' || st.state === 'open' || st.state === 'unlocked') n++;
      }
    }
    switch (link.kind) {
      case 'lights': res.text = n ? HAT.t('sum.lightsOn', n) : HAT.t('sum.lightsOff'); res.active = n > 0; break;
      case 'climate': res.text = n ? HAT.t('sum.active', n) : ''; res.active = n > 0; break;
      case 'security':
        res.text = n ? HAT.t('sum.openOrUnlocked', n) : (m.length ? HAT.t('sum.secured') : '');
        res.alert = n > 0;
        break;
      case 'media': res.text = n ? HAT.t('sum.playing', n) : HAT.t('sum.nothingPlaying'); res.active = n > 0; break;
      case 'maintenance':
        var parts = [];
        if (n) parts.push(n + ' ' + HAT.i18n.plural(n, 'sum.lowBattery'));
        if (n2) parts.push(n2 + ' ' + HAT.i18n.plural(n2, 'sum.unavailableDevice'));
        res.text = parts.length ? parts.join(', ') : HAT.t('sum.allGood');
        res.alert = n > 0;
        break;
      default:
        res.text = n ? HAT.t('sum.lightsOn', n) : (m.length + ' ' + HAT.i18n.plural(m.length, 'sum.device'));
        res.active = n > 0;
    }
    return res;
  };

  // ---- builder -----------------------------------------------------------
  // kind: 'ha-home' | 'apple'; reg: result of G.load; states: entity_id -> state object
  // Returns a dashboard model (same shape as HAT.dashboard.parse) or null when the registries are unavailable
  G.build = function (kind, reg, states) {
    if (!reg || !reg.areas || !reg.entities) return null;
    var apple = kind === 'apple';
    var i, j;

    var devArea = {};
    var devices = reg.devices || [];
    for (i = 0; i < devices.length; i++) if (devices[i].area_id) devArea[devices[i].id] = devices[i].area_id;

    var regById = {};
    for (i = 0; i < reg.entities.length; i++) regById[reg.entities[i].entity_id] = reg.entities[i];

    var areaName = {}, areaIcon = {}, areaIds = [];
    for (i = 0; i < reg.areas.length; i++) {
      areaName[reg.areas[i].area_id] = reg.areas[i].name;
      areaIcon[reg.areas[i].area_id] = reg.areas[i].icon || null;
      areaIds.push(reg.areas[i].area_id);
    }
    areaIds.sort(function (a, b) { return areaName[a].localeCompare ? areaName[a].localeCompare(areaName[b], 'pl') : 0; });

    // eligible entities (not disabled / hidden in the registry)
    var items = [];
    var ids = Object.keys(states);
    for (i = 0; i < ids.length; i++) {
      var id = ids[i], st = states[id], r = regById[id];
      if (r && (r.disabled_by || r.hidden_by)) continue;
      var area = r ? (r.area_id || (r.device_id && devArea[r.device_id]) || null) : null;
      if (area && !areaName[area]) area = null;
      items.push({
        id: id, st: st, d: id.split('.')[0], area: area,
        cat: r ? r.entity_category : null,
        dc: st.attributes ? st.attributes.device_class : null
      });
    }
    items.sort(byName);

    // ---- summaries
    var sums = SUMMARIES[kind];
    var sumItems = {};
    for (i = 0; i < sums.length; i++) {
      sumItems[sums[i].key] = [];
      for (j = 0; j < items.length; j++) if (inSummary(sums[i].key, items[j])) sumItems[sums[i].key].push(items[j]);
    }

    function ids_(list) { var o = []; for (var k = 0; k < list.length; k++) o.push(list[k].id); return o; }

    function summaryView(s) {
      var list = sumItems[s.key];
      var secs = [], k, sec, subset;
      if (s.key === 'maintenance') {
        var bat = [], gone = [];
        for (k = 0; k < list.length; k++) {
          if (list[k].st.state === 'unavailable') gone.push(list[k]); else bat.push(list[k]);
        }
        bat.sort(function (a, b) {
          var la = lowBattery(a) ? 0 : 1, lb = lowBattery(b) ? 0 : 1;
          if (la !== lb) return la - lb;
          return (U.num(a.st.state) || 0) - (U.num(b.st.state) || 0);
        });
        if (bat.length) secs.push({ title: HAT.t('sum.batteries'), tiles: entityTiles(bat.slice(0, 60)) });
        if (gone.length) secs.push({ title: HAT.t('sum.unavailable'), tiles: entityTiles(gone.slice(0, 60)) });
      } else {
        var order = areaIds.concat([null]);
        for (k = 0; k < order.length; k++) {
          subset = [];
          for (j = 0; j < list.length; j++) if (list[j].area === order[k]) subset.push(list[j]);
          if (subset.length) {
            sec = { title: order[k] ? areaName[order[k]] : HAT.t('sum.noArea'), tiles: entityTiles(subset) };
            secs.push(sec);
          }
        }
      }
      return { title: HAT.t(s.tk), path: 'sum-' + s.key, subview: true, sections: secs };
    }

    function summaryLink(s) {
      return { link: 'sum-' + s.key, title: HAT.t(s.tk), icon: s.icon, kind: s.key, members: ids_(sumItems[s.key]) };
    }

    // ---- areas
    var areaItems = {};
    var order2 = areaIds.concat(['none']);
    for (i = 0; i < order2.length; i++) areaItems[order2[i]] = [];
    for (i = 0; i < items.length; i++) {
      if (groupIndex(items[i]) < 0) continue;
      var key = items[i].area || 'none';
      areaItems[key].push(items[i]);
    }

    function areaView(aid) {
      var list = areaItems[aid];
      var secs = [], g, subset, k;
      if (apple) {
        var main = [], sensors = [];
        for (g = 0; g < GROUPS.length; g++) {
          subset = [];
          for (k = 0; k < list.length; k++) if (groupIndex(list[k]) === g) subset.push(list[k]);
          if (GROUPS[g].sensors) sensors = sensors.concat(subset); else main = main.concat(subset);
        }
        if (main.length) secs.push({ title: '', tiles: entityTiles(main) });
        if (sensors.length) secs.push({ title: HAT.t('grp.sensors'), tiles: entityTiles(sensors.slice(0, 48)) });
      } else {
        for (g = 0; g < GROUPS.length; g++) {
          subset = [];
          for (k = 0; k < list.length; k++) if (groupIndex(list[k]) === g) subset.push(list[k]);
          if (subset.length) secs.push({ title: HAT.t(GROUPS[g].tk), tiles: entityTiles(subset.slice(0, 48)) });
        }
      }
      return {
        title: aid === 'none' ? HAT.t('sum.noArea') : areaName[aid],
        path: 'area-' + aid, subview: !apple, sections: secs
      };
    }

    function areaLink(aid) {
      return {
        link: 'area-' + aid, kind: 'area', members: ids_(areaItems[aid]),
        title: aid === 'none' ? HAT.t('sum.noArea') : areaName[aid],
        icon: (aid !== 'none' && areaIcon[aid] && E.mdiIcon(areaIcon[aid])) || 'home'
      };
    }

    var firstWeather = null;
    for (i = 0; i < items.length; i++) if (items[i].d === 'weather') { firstWeather = items[i]; break; }

    var shownAreas = [];
    for (i = 0; i < order2.length; i++) if (areaItems[order2[i]].length) shownAreas.push(order2[i]);

    var shownSums = [];
    for (i = 0; i < sums.length; i++) {
      var s = sums[i];
      if (!sumItems[s.key].length) continue;
      if (apple && s.key === 'maintenance' && !G.describeLink(summaryLink(s)).alert &&
          G.describeLink(summaryLink(s)).text === HAT.t('sum.allGood')) continue;
      shownSums.push(s);
    }

    var views = [], overview = { sections: [] }, tiles = [];
    for (i = 0; i < shownSums.length; i++) tiles.push(summaryLink(shownSums[i]));
    if (firstWeather) tiles.push({ entity: firstWeather.id, name: null, icon: null });

    if (apple) {
      overview = { title: HAT.t('sum.home'), path: 'home', sections: [] };
      if (tiles.length) overview.sections.push({ title: HAT.t('sum.summary'), tiles: tiles });
      var scenes = [];
      for (i = 0; i < items.length; i++) if (items[i].d === 'scene') scenes.push(items[i]);
      if (scenes.length) overview.sections.push({ title: HAT.t('grp.scenes'), tiles: entityTiles(scenes.slice(0, 12)) });
      if (!overview.sections.length) {
        // nothing to summarise: show the first room instead of an empty tab
        overview = null;
      }
      if (overview) views.push(overview);
      for (i = 0; i < shownAreas.length; i++) views.push(areaView(shownAreas[i]));
    } else {
      overview = { title: HAT.t('dash.overview'), path: 'home', sections: [] };
      if (tiles.length) overview.sections.push({ title: HAT.t('sum.summaries'), tiles: tiles });
      var alinks = [];
      for (i = 0; i < shownAreas.length; i++) alinks.push(areaLink(shownAreas[i]));
      if (alinks.length) overview.sections.push({ title: HAT.t('sum.areas'), tiles: alinks });
      if (overview.sections.length) views.push(overview);
      for (i = 0; i < shownAreas.length; i++) views.push(areaView(shownAreas[i]));
    }
    for (i = 0; i < shownSums.length; i++) views.push(summaryView(shownSums[i]));

    // drop views without tiles
    var clean = [];
    for (i = 0; i < views.length; i++) {
      var secs2 = [];
      for (j = 0; j < views[i].sections.length; j++) if (views[i].sections[j].tiles.length) secs2.push(views[i].sections[j]);
      if (secs2.length) { views[i].sections = secs2; clean.push(views[i]); }
    }
    // the first view must be a regular (non sub) view
    if (clean.length && clean[0].subview) clean[0].subview = false;
    return { views: clean, skipped: {}, hiddenViews: 0, kind: kind };
  };
})(window);
