// Detail screen: per-domain controls (sliders, steppers, buttons)
(function (w) {
  var HAT = w.HAT = w.HAT || {};
  var U = HAT.util, E = HAT.entity;
  var D = HAT.detail = {};

  var client, root, icoEl, nameEl, stateEl, bodyEl, hintAdjEl, cardEl;
  var cur = null;             // { id, ov, built, camTimer, returnFocus }

  D.init = function (c) {
    client = c;
    root = document.getElementById('detail');
    icoEl = root.querySelector('.dico');
    nameEl = root.querySelector('.dname');
    stateEl = root.querySelector('.dstate');
    bodyEl = root.querySelector('.dbody');
    cardEl = root.querySelector('.dcard');
    hintAdjEl = root.querySelector('.dh-adj');
    root.querySelector('.dh-ico').innerHTML = HAT.iconSvg('back');
  };

  // The arrow-key hint is shown only while the focused control reacts to LEFT / RIGHT
  D.hint = function (el) {
    if (hintAdjEl) hintAdjEl.style.display = el && el._adjust ? '' : 'none';
  };

  D.isOpen = function () { return !!cur; };

  function call(domain, service, data) {
    if (!cur) return;
    client.callService(domain, service, data, cur.id).then(null, function (e) {
      HAT.ui.toast(HAT.t('err.command', (e && e.message) || HAT.t('err.commandFailed')), 2500);
    });
  }

  function latest() { return HAT.store.get(cur ? cur.id : '') || { state: 'unavailable', attributes: {} }; }

  // ---- widgets -----------------------------------------------------------
  function btn(label, cls, fn, iconKey) {
    var b = U.el('div', 'btn focusable' + (cls ? ' ' + cls : ''));
    if (iconKey) {
      var ic = U.el('span', 'btn-ico');
      ic.innerHTML = HAT.iconSvg(iconKey);
      b.appendChild(ic);
    }
    var t = U.el('span', 'btn-txt', label);
    b.appendChild(t);
    b._label = t;
    b._act = fn;
    return b;
  }

  function row(nodes) {
    var r = U.el('div', 'btn-row');
    for (var i = 0; i < nodes.length; i++) r.appendChild(nodes[i]);
    return r;
  }

  // Slider adjusted with LEFT / RIGHT; sends the value after a short pause
  function slider(label, o) {
    var wrap = U.el('div', 'ctl');
    var head = U.el('div', 'ctl-head');
    head.appendChild(U.el('span', 'ctl-label', label));
    var val = U.el('span', 'ctl-val');
    head.appendChild(val);
    var s = U.el('div', 'slider focusable');
    var fill = U.el('div', 'fill');
    s.appendChild(fill);
    wrap.appendChild(head);
    wrap.appendChild(s);
    var value = o.value, timer = 0, busyUntil = 0;
    function render() {
      var p = (value - o.min) / (o.max - o.min);
      fill.style.transform = 'translate3d(' + (U.clamp(p, 0, 1) * 100 - 100) + '%,0,0)';
      val.textContent = o.format(value);
    }
    s._adjust = function (dir) {
      value = U.clamp(Math.round((value + dir * o.step) / o.step) * o.step, o.min, o.max);
      render();
      clearTimeout(timer);
      busyUntil = Date.now() + 1500;
      timer = setTimeout(function () { o.onChange(value); }, 300);
    };
    render();
    return {
      el: wrap, node: s,
      set: function (v) {
        if (v === null || v === undefined || Date.now() < busyUntil) return;
        value = v;
        render();
      }
    };
  }

  function infoRows(pairs) {
    var box = U.el('div', 'info');
    for (var i = 0; i < pairs.length; i++) {
      var r = U.el('div', 'info-row');
      r.appendChild(U.el('span', 'info-k', pairs[i][0]));
      r.appendChild(U.el('span', 'info-v', pairs[i][1]));
      box.appendChild(r);
    }
    return box;
  }

  function hasFeature(a, bit) { return ((U.num(a.supported_features) || 0) & bit) !== 0; }

  // ---- per-domain builders -----------------------------------------------
  // Each returns { nodes: [...], update(st) }

  function toggleButton(domainCall) {
    var b = btn('', 'big', function () { domainCall(); }, 'power');
    return {
      node: b,
      update: function (on, onLabel, offLabel) {
        b._label.textContent = on ? offLabel : onLabel;
        b.classList.toggle('on', on);
      }
    };
  }

  // Preset colours (hue, saturation) offered for lights that can show colours
  var COLOR_PRESETS = [[0, 100], [28, 100], [55, 100], [125, 100], [180, 100], [225, 100], [275, 100], [320, 70]];
  var COLOR_MODES = { hs: 1, xy: 1, rgb: 1, rgbw: 1, rgbww: 1 };

  function hsCss(hs) { return 'hsl(' + hs[0] + ',' + Math.round(hs[1] * 0.9) + '%,' + (hs[1] < 100 ? 62 : 52) + '%)'; }

  function colorPresets() {
    var box = U.el('div', 'swatches');
    var nodes = [];
    for (var i = 0; i < COLOR_PRESETS.length; i++) {
      (function (hs) {
        var n = U.el('div', 'swatch focusable');
        n.style.background = hsCss(hs);
        n._hs = hs;
        n._act = function () { call('light', 'turn_on', { hs_color: hs }); };
        box.appendChild(n);
        nodes.push(n);
      })(COLOR_PRESETS[i]);
    }
    return {
      el: box, first: nodes[0],
      update: function (a) {
        var cur = a.hs_color && a.color_mode !== 'color_temp' ? a.hs_color : null;
        for (var k = 0; k < nodes.length; k++) {
          var hs = nodes[k]._hs;
          var hit = cur && Math.abs(cur[0] - hs[0]) < 14 && Math.abs(cur[1] - hs[1]) < 30;
          nodes[k].classList.toggle('cur', !!hit);
        }
      }
    };
  }

  // Button opening a list of the light's effects
  function effectButton(list) {
    var b = btn('', '', null, 'sparkle');
    b._act = function () {
      var cur = latest().attributes.effect;
      var items = [];
      for (var i = 0; i < list.length; i++) items.push({ title: list[i], value: list[i] });
      HAT.dialogs.openChoice(HAT.t('d.effect'), items, cur, function (v) { call('light', 'turn_on', { effect: v }); },
        function () { HAT.nav.focus(b); });
    };
    return {
      node: b,
      update: function (a) { b._label.textContent = HAT.t('d.effectLine', a.effect && a.effect !== 'None' ? a.effect : HAT.t('d.effectNone')); }
    };
  }

  function bLight(st) {
    var a = st.attributes || {};
    var modes = a.supported_color_modes || [];
    var hasBri = false, i;
    for (i = 0; i < modes.length; i++) if (modes[i] !== 'onoff') hasBri = true;
    var hasCt = modes.indexOf('color_temp') >= 0;
    var hasColor = false;
    for (i = 0; i < modes.length; i++) if (COLOR_MODES[modes[i]]) hasColor = true;
    var effects = a.effect_list && typeof a.effect_list !== 'string' && a.effect_list.length ? a.effect_list : null;
    var tb = toggleButton(function () { call('light', latest().state === 'on' ? 'turn_off' : 'turn_on', {}); });
    var nodes = [tb.node];
    var bri = null, ct = null, cp = null, fx = null;
    if (hasBri) {
      bri = slider(HAT.t('d.brightness'), {
        min: 1, max: 100, step: 5, value: 100,
        format: function (v) { return Math.round(v) + '%'; },
        onChange: function (v) { call('light', 'turn_on', { brightness_pct: v }); }
      });
      nodes.push(bri.el);
    }
    if (hasCt) {
      var lo = U.num(a.min_color_temp_kelvin) || 2000, hi = U.num(a.max_color_temp_kelvin) || 6500;
      ct = slider(HAT.t('d.colorTemp'), {
        min: lo, max: hi, step: 100, value: lo,
        format: function (v) { return Math.round(v) + ' K'; },
        onChange: function (v) { call('light', 'turn_on', { color_temp_kelvin: v }); }
      });
      nodes.push(ct.el);
    }
    if (hasColor) {
      cp = colorPresets();
      var cw = U.el('div', 'ctl');
      cw.appendChild(U.el('div', 'ctl-head', ''));
      cw.firstChild.appendChild(U.el('span', 'ctl-label', HAT.t('d.color')));
      cw.appendChild(cp.el);
      nodes.push(cw);
    }
    if (effects) { fx = effectButton(effects); nodes.push(fx.node); }
    function update(s) {
      var at = s.attributes || {};
      tb.update(s.state === 'on', HAT.t('d.turnOn'), HAT.t('d.turnOff'));
      if (bri && U.num(at.brightness) !== null) bri.set(Math.max(1, Math.round(U.num(at.brightness) / 255 * 100)));
      if (ct && U.num(at.color_temp_kelvin) !== null) ct.set(U.num(at.color_temp_kelvin));
      if (cp) cp.update(at);
      if (fx) fx.update(at);
    }
    update(st);
    return { nodes: nodes, focus: tb.node, update: update };
  }

  function bToggle(domain) {
    return function (st) {
      var tb = toggleButton(function () { call('homeassistant', 'toggle', {}); });
      var nodes = [tb.node], sp = null;
      var a = st.attributes || {};
      if (domain === 'fan' && hasFeature(a, 1)) {
        sp = slider(HAT.t('d.speed'), {
          min: 0, max: 100, step: 10, value: U.num(a.percentage) || 0,
          format: function (v) { return Math.round(v) + '%'; },
          onChange: function (v) { call('fan', 'set_percentage', { percentage: v }); }
        });
        nodes.push(sp.el);
      }
      function update(s) {
        tb.update(s.state === 'on', HAT.t('d.turnOn'), HAT.t('d.turnOff'));
        if (sp) sp.set(U.num((s.attributes || {}).percentage));
      }
      update(st);
      return { nodes: nodes, focus: tb.node, update: update };
    };
  }

  // Group made only of lights: on/off plus one brightness slider that drives every member
  function bLightGroup(st) {
    var members = E.lightGroupMembers(st);
    var tb = toggleButton(function () { call('homeassistant', 'toggle', {}); });
    // Like the official app: the slider only appears when at least one member light can be dimmed
    var dimmable = false;
    for (var mi = 0; mi < members.length; mi++) {
      var ms = HAT.store.get(members[mi]), mm = (ms && ms.attributes && ms.attributes.supported_color_modes) || [];
      for (var mj = 0; mj < mm.length; mj++) if (mm[mj] !== 'onoff') dimmable = true;
    }
    var bri = !dimmable ? null : slider(HAT.t('d.brightness'), {
      min: 1, max: 100, step: 5, value: 100,
      format: function (v) { return Math.round(v) + '%'; },
      onChange: function (v) {
        client.callService('light', 'turn_on', { brightness_pct: v }, members).then(null, function (e) {
          HAT.ui.toast(HAT.t('err.command', (e && e.message) || HAT.t('err.commandFailed')), 2500);
        });
      }
    });
    function update(s) {
      tb.update(s.state === 'on', HAT.t('d.turnOn'), HAT.t('d.turnOff'));
      var m = E.lightGroupMembers(s) || members, b = E.groupBrightness(m);
      if (bri && b !== null) bri.set(Math.max(1, Math.round(b)));
    }
    update(st);
    return { nodes: bri ? [tb.node, bri.el] : [tb.node], focus: tb.node, update: update };
  }

  function bGroup(st) { return E.lightGroupMembers(st) ? bLightGroup(st) : bToggle('group')(st); }

  function bCover(st) {
    var a = st.attributes || {};
    var up = btn(HAT.t('d.open'), '', function () { call('cover', 'open_cover', {}); }, 'up');
    var stop = btn('Stop', '', function () { call('cover', 'stop_cover', {}); }, 'stop');
    var dn = btn(HAT.t('d.close'), '', function () { call('cover', 'close_cover', {}); }, 'down');
    var nodes = [row([up, stop, dn])];
    var pos = null;
    if (hasFeature(a, 4) && U.num(a.current_position) !== null) {
      pos = slider(HAT.t('d.position'), {
        min: 0, max: 100, step: 10, value: U.num(a.current_position),
        format: function (v) { return Math.round(v) + '%'; },
        onChange: function (v) { call('cover', 'set_cover_position', { position: v }); }
      });
      nodes.push(pos.el);
    }
    function update(s) {
      var at = s.attributes || {};
      up.classList.toggle('on', s.state === 'open' || s.state === 'opening');
      dn.classList.toggle('on', s.state === 'closed' || s.state === 'closing');
      if (pos) pos.set(U.num(at.current_position));
    }
    update(st);
    return { nodes: nodes, focus: up, update: update };
  }

  function bLock(st) {
    var lockB = btn(HAT.t('d.lock'), '', function () { call('lock', 'lock', {}); }, 'lock');
    var unlockB = btn(HAT.t('d.unlock'), '', function () { call('lock', 'unlock', {}); }, 'lockopen');
    function update(s) {
      lockB.classList.toggle('on', s.state === 'locked' || s.state === 'locking');
      unlockB.classList.toggle('on', s.state === 'unlocked' || s.state === 'unlocking');
    }
    update(st);
    return { nodes: [row([lockB, unlockB])], focus: lockB, update: update };
  }

  function bClimate(st) {
    var a = st.attributes || {};
    var step = U.num(a.target_temp_step) || 0.5;
    var minT = U.num(a.min_temp) !== null ? U.num(a.min_temp) : 7;
    var maxT = U.num(a.max_temp) !== null ? U.num(a.max_temp) : 35;
    var target = U.num(a.temperature);
    var timer = 0, busyUntil = 0;
    var nodes = [];
    var big = U.el('div', 'bigtemp');
    var cap = U.el('div', 'bigtemp-cap');
    var minus = btn('', 'round', null, 'minus');
    var plus = btn('', 'round', null, 'plus');
    var valBox = U.el('div', 'bigtemp-val');
    var mid = U.el('div', 'bigtemp-mid');
    mid.appendChild(cap);
    mid.appendChild(valBox);
    big.appendChild(minus);
    big.appendChild(mid);
    big.appendChild(plus);

    function renderTarget() {
      valBox.textContent = target !== null ? U.fmt(target) + '°' : '—';
    }
    function change(dir) {
      if (target === null) return;
      target = U.clamp(Math.round((target + dir * step) / step) * step, minT, maxT);
      renderTarget();
      clearTimeout(timer);
      busyUntil = Date.now() + 2000;
      timer = setTimeout(function () { call('climate', 'set_temperature', { temperature: target }); }, 700);
    }
    minus._act = function () { change(-1); };
    plus._act = function () { change(1); };
    if (target !== null) nodes.push(big);

    var modes = a.hvac_modes || [];
    var modeBtns = [];
    var mrow = null;
    if (modes.length) {
      for (var i = 0; i < modes.length; i++) {
        (function (m) {
          var b = btn(E.translate(m), '', function () { call('climate', 'set_hvac_mode', { hvac_mode: m }); });
          b._mode = m;
          modeBtns.push(b);
        })(modes[i]);
      }
      mrow = row(modeBtns);
      mrow.className += ' wrap';
      nodes.push(mrow);
    }

    function update(s) {
      var at = s.attributes || {};
      var curT = U.num(at.current_temperature);
      cap.textContent = HAT.t('d.target') + (curT !== null ? HAT.t('d.nowTemp', U.fmt(curT) + '°') : '') +
        (at.hvac_action && at.hvac_action !== 'idle' && at.hvac_action !== 'off' ? ' · ' + E.translate(at.hvac_action) : '');
      if (Date.now() >= busyUntil && U.num(at.temperature) !== null) {
        target = U.num(at.temperature);
        renderTarget();
      }
      for (var j = 0; j < modeBtns.length; j++) modeBtns[j].classList.toggle('on', modeBtns[j]._mode === s.state);
    }
    renderTarget();
    update(st);
    return { nodes: nodes, focus: nodes.length ? (target !== null ? plus : modeBtns[0]) : null, update: update };
  }

  function bMedia(st) {
    var a = st.attributes || {};
    var title = U.el('div', 'media-title');
    var sub = U.el('div', 'media-sub');
    var prev = btn('', 'round', function () { call('media_player', 'media_previous_track', {}); }, 'prev');
    var pp = btn('', 'round big', function () { call('media_player', 'media_play_pause', {}); }, 'play');
    var next = btn('', 'round', function () { call('media_player', 'media_next_track', {}); }, 'next');
    var ctrl = U.el('div', 'btn-row center');
    ctrl.appendChild(prev); ctrl.appendChild(pp); ctrl.appendChild(next);
    var nodes = [title, sub, ctrl];
    var vol = null;
    if (hasFeature(a, 4)) {
      vol = slider(HAT.t('d.volume'), {
        min: 0, max: 100, step: 5, value: Math.round((U.num(a.volume_level) || 0) * 100),
        format: function (v) { return Math.round(v) + '%'; },
        onChange: function (v) { call('media_player', 'volume_set', { volume_level: v / 100 }); }
      });
      nodes.push(vol.el);
    }
    var pw = null;
    if (hasFeature(a, 128) || hasFeature(a, 256)) {
      pw = btn('', '', function () {
        call('media_player', latest().state === 'off' ? 'turn_on' : 'turn_off', {});
      }, 'power');
      nodes.push(pw);
    }
    function update(s) {
      var at = s.attributes || {};
      title.textContent = at.media_title || E.translate(s.state);
      sub.textContent = [at.media_artist, at.app_name || at.source].filter(Boolean).join(' · ');
      var playing = s.state === 'playing';
      pp.querySelector('.btn-ico').innerHTML = HAT.iconSvg(playing ? 'pause' : 'play');
      if (vol && U.num(at.volume_level) !== null) vol.set(Math.round(U.num(at.volume_level) * 100));
      if (pw) {
        pw._label.textContent = s.state === 'off' ? HAT.t('d.turnOn') : HAT.t('d.turnOff');
        pw.classList.toggle('on', s.state !== 'off');
      }
    }
    update(st);
    return { nodes: nodes, focus: pp, update: update };
  }

  function bCamera(st) {
    var img = U.el('img', 'cam-img');
    var msg = U.el('div', 'info-note', '');
    var nodes = [img, msg];
    var base = '';
    function url(s) {
      var pic = s.attributes && s.attributes.entity_picture;
      return pic ? String(HAT.cfg.url).replace(/\/+$/, '') + pic : '';
    }
    function load() {
      var u = url(latest());
      if (!u) { msg.textContent = HAT.t('d.noPreview'); return; }
      msg.textContent = '';
      img.src = u + (u.indexOf('?') >= 0 ? '&' : '?') + '_=' + Date.now();
    }
    cur.camTimer = setInterval(load, 3000);
    base = url(st);
    load();
    return { nodes: nodes, focus: null, update: function () {} };
  }

  function bActivate(label) {
    return function (st) {
      var b = btn(HAT.t(label), 'big', function () {
        E.runActivate(client, cur.id).then(function () {
          HAT.ui.toast(HAT.t('d.started'));
        }, function () { HAT.ui.toast(HAT.t('d.startFailed')); });
      }, 'play');
      return { nodes: [b], focus: b, update: function () {} };
    };
  }

  var SKIP_ATTR = {
    friendly_name: 1, icon: 1, entity_picture: 1, supported_features: 1, device_class: 1,
    state_class: 1, attribution: 1, assumed_state: 1, editable: 1, id: 1, restored: 1,
    unit_of_measurement: 1, supported_color_modes: 1, color_mode: 1, hvac_modes: 1
  };
  function bInfo(st, maxAttrs) {
    var limit = maxAttrs === undefined ? 6 : maxAttrs;
    var box = U.el('div');
    function update(s) {
      var d = E.describe(cur.id, s, cur.ov);
      var pairs = [[HAT.t('d.state'), d.text]];
      if (s.last_changed) pairs.push([HAT.t('d.lastChanged'), U.relTime(s.last_changed)]);
      var a = s.attributes || {}, n = 0;
      for (var k in a) {
        if (!a.hasOwnProperty(k) || SKIP_ATTR[k] || n >= limit) continue;
        var v = a[k];
        if (v === null || typeof v === 'object') continue;
        var label = HAT.i18n.has('attr.' + k) ? HAT.t('attr.' + k) : k.replace(/_/g, ' ');
        var sv = typeof v === 'number' ? U.fmt(v, 1) : String(v);
        pairs.push([label, sv]);
        n++;
      }
      box.innerHTML = '';
      box.appendChild(infoRows(pairs));
    }
    update(st);
    return { nodes: [box], focus: null, update: update };
  }


  // ---- history chart (last hour) for sensors --------------------------------
  var CHART_MS = 3600 * 1000;
  var PALETTE = ['#ffd25a', '#5ac8fa', '#ff6b6b', '#a78bfa', '#4ade80', '#fb923c'];

  function hhmm(t) {
    var d = new Date(t);
    return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  }

  // Accepts both history formats: {s, lu} (compressed) and {state, last_updated}
  function parseHistory(list, startMs) {
    var out = [];
    for (var i = 0; i < (list || []).length; i++) {
      var it = list[i];
      var st = it.s !== undefined ? it.s : it.state;
      var t = it.lu !== undefined ? it.lu : (it.lc !== undefined ? it.lc : it.last_updated);
      if (typeof t === 'number') t = t * 1000; else t = Date.parse(t);
      if (st === undefined || isNaN(t)) continue;
      out.push({ t: Math.max(t, startMs), s: String(st) });
    }
    return out;
  }

  function svgEl(w_, h_, inner) {
    return '<svg viewBox="0 0 ' + w_ + ' ' + h_ + '" xmlns="http://www.w3.org/2000/svg" font-family="inherit">' + inner + '</svg>';
  }

  function drawLine(pts, now, W, H, unit) {
    var PL = 52, PR = 10, PT = 10, PB = 24;
    var lo = Infinity, hi = -Infinity, i;
    for (i = 0; i < pts.length; i++) { lo = Math.min(lo, pts[i].v); hi = Math.max(hi, pts[i].v); }
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    var t0 = now - CHART_MS;
    function X(t) { return PL + (t - t0) / CHART_MS * (W - PL - PR); }
    function Y(v) { return PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB); }
    // Smooth curve: monotone cubic interpolation (no overshoot between samples)
    var xs = [], ys = [];
    for (i = 0; i < pts.length; i++) { xs.push(X(pts[i].t)); ys.push(Y(pts[i].v)); }
    if (pts.length === 1) { xs.push(X(now)); ys.push(ys[0]); }
    var n = xs.length, m = [], dx = [], sl = [];
    for (i = 0; i < n - 1; i++) { dx[i] = Math.max(xs[i + 1] - xs[i], 0.01); sl[i] = (ys[i + 1] - ys[i]) / dx[i]; }
    m[0] = sl[0] || 0; m[n - 1] = sl[n - 2] || 0;
    for (i = 1; i < n - 1; i++) m[i] = sl[i - 1] * sl[i] <= 0 ? 0 : (sl[i - 1] + sl[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (sl[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      var al = m[i] / sl[i], be = m[i + 1] / sl[i], hh = al * al + be * be;
      if (hh > 9) { var tt = 3 / Math.sqrt(hh); m[i] = tt * al * sl[i]; m[i + 1] = tt * be * sl[i]; }
    }
    var d = 'M' + xs[0].toFixed(1) + ' ' + ys[0].toFixed(1);
    for (i = 0; i < n - 1; i++) {
      var c1x = xs[i] + dx[i] / 3, c2x = xs[i + 1] - dx[i] / 3;
      d += 'C' + c1x.toFixed(1) + ' ' + (ys[i] + m[i] * dx[i] / 3).toFixed(1) + ' ' + c2x.toFixed(1) + ' ' +
        (ys[i + 1] - m[i + 1] * dx[i] / 3).toFixed(1) + ' ' + xs[i + 1].toFixed(1) + ' ' + ys[i + 1].toFixed(1);
    }
    var lastX = xs[n - 1].toFixed(1), lastY = ys[n - 1];
    if (xs[n - 1] < X(now) - 0.5) { d += 'H' + X(now).toFixed(1); lastX = X(now).toFixed(1); }
    var area = d + 'V' + (H - PB) + 'H' + xs[0].toFixed(1) + 'Z';
    var g = '';
    for (i = 0; i < 3; i++) {
      var gv = lo + (hi - lo) * (i / 2), gy = Y(gv).toFixed(1);
      g += '<line x1="' + PL + '" x2="' + (W - PR) + '" y1="' + gy + '" y2="' + gy + '" stroke="rgba(255,255,255,0.12)"/>' +
        '<text x="' + (PL - 6) + '" y="' + (parseFloat(gy) + 4) + '" fill="rgba(255,255,255,0.55)" font-size="12" text-anchor="end">' + U.fmt(gv, hi - lo > 20 ? 0 : 1) + '</text>';
    }
    var xl = '<text x="' + PL + '" y="' + (H - 6) + '" fill="rgba(255,255,255,0.55)" font-size="12">' + hhmm(t0) + '</text>' +
      '<text x="' + ((PL + W - PR) / 2) + '" y="' + (H - 6) + '" fill="rgba(255,255,255,0.55)" font-size="12" text-anchor="middle">' + hhmm(t0 + CHART_MS / 2) + '</text>' +
      '<text x="' + (W - PR) + '" y="' + (H - 6) + '" fill="rgba(255,255,255,0.55)" font-size="12" text-anchor="end">' + hhmm(now) + '</text>';
    return svgEl(W, H, '<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd25a" stop-opacity="0.35"/>' +
      '<stop offset="1" stop-color="#ffd25a" stop-opacity="0"/></linearGradient></defs>' + g +
      '<path d="' + area + '" fill="url(#cg)"/><path d="' + d + '" fill="none" stroke="#ffd25a" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<circle cx="' + lastX + '" cy="' + lastY.toFixed(1) + '" r="4" fill="#ffd25a"/>' + xl);
  }

  function drawTimeline(items, now, W, states) {
    var PL = 10, PR = 10, H = 70, t0 = now - CHART_MS, bar = '', i;
    var colorOf = {};
    for (i = 0; i < states.length; i++) colorOf[states[i]] = states[i] === 'unavailable' || states[i] === 'unknown' ? 'rgba(255,255,255,0.14)' : (states[i] === 'off' ? 'rgba(255,255,255,0.28)' : PALETTE[i % PALETTE.length]);
    for (i = 0; i < items.length; i++) {
      var a = items[i].t, b = i + 1 < items.length ? items[i + 1].t : now;
      var x1 = PL + (a - t0) / CHART_MS * (W - PL - PR), x2 = PL + (b - t0) / CHART_MS * (W - PL - PR);
      if (x2 - x1 < 0.5) continue;
      bar += '<rect x="' + x1.toFixed(1) + '" y="8" width="' + (x2 - x1).toFixed(1) + '" height="32" fill="' + colorOf[items[i].s] + '"/>';
    }
    var tx = '<text x="' + PL + '" y="62" fill="rgba(255,255,255,0.55)" font-size="12">' + hhmm(t0) + '</text>' +
      '<text x="' + ((PL + W - PR) / 2) + '" y="62" fill="rgba(255,255,255,0.55)" font-size="12" text-anchor="middle">' + hhmm(t0 + CHART_MS / 2) + '</text>' +
      '<text x="' + (W - PR) + '" y="62" fill="rgba(255,255,255,0.55)" font-size="12" text-anchor="end">' + hhmm(now) + '</text>';
    return { svg: svgEl(W, H, '<clipPath id="tc"><rect x="' + PL + '" y="8" width="' + (W - PL - PR) + '" height="32" rx="6"/></clipPath><g clip-path="url(#tc)">' + bar + '</g>' + tx), colorOf: colorOf };
  }

  // Fetches the last hour of history and draws it into box; cur.id guards against a closed / changed screen
  function loadChart(box, id) {
    var now = Date.now(), start = now - CHART_MS;
    box.innerHTML = '<div class="chart-cap">' + HAT.t('d.lastHourLoading') + '</div>';
    client.request({
      type: 'history/history_during_period', start_time: new Date(start).toISOString(), end_time: new Date(now).toISOString(),
      entity_ids: [id], minimal_response: true, no_attributes: true, significant_changes_only: false
    }).then(function (res) {
      if (!cur || cur.id !== id) return;
      var list = res && (res[id] || (res.length ? res[0] : null));
      var items = parseHistory(list, start);
      var st = HAT.store.get(id);
      if (st && (!items.length || items[items.length - 1].s !== st.state)) items.push({ t: items.length ? Math.max(now - 1000, items[items.length - 1].t) : start, s: st.state });
      if (!items.length) { box.innerHTML = '<div class="chart-cap">' + HAT.t('d.lastHourNoData') + '</div>'; return; }
      var unit = st && st.attributes && st.attributes.unit_of_measurement;
      var numeric = [], allNum = E.domain(id) === 'sensor', i, v;
      for (i = 0; i < items.length; i++) {
        v = items[i].s === 'unavailable' || items[i].s === 'unknown' ? null : U.num(items[i].s);
        if (v === null) { if (items[i].s !== 'unavailable' && items[i].s !== 'unknown') allNum = false; continue; }
        numeric.push({ t: items[i].t, v: v });
      }
      if (allNum && numeric.length) {
        box.innerHTML = '<div class="chart-cap">' + HAT.t('d.lastHour') + (unit ? ' · ' + unit : '') + '</div>' + drawLine(numeric, now, 570, 170, unit);
      } else {
        var states = [], seen = {};
        for (i = 0; i < items.length; i++) if (!seen[items[i].s]) { seen[items[i].s] = 1; states.push(items[i].s); }
        var tl = drawTimeline(items, now, 570, states), lg = '';
        for (i = 0; i < states.length; i++) lg += '<span><i style="background:' + tl.colorOf[states[i]] + '"></i>' + E.translate(states[i]) + '</span>';
        box.innerHTML = '<div class="chart-cap">' + HAT.t('d.lastHour') + '</div>' + tl.svg + '<div class="chart-legend">' + lg + '</div>';
      }
    }, function () {
      if (!cur || cur.id !== id) return;
      box.innerHTML = '<div class="chart-cap">' + HAT.t('d.lastHourFailed') + '</div>';
    });
  }

  function bSensor(st) {
    var info = bInfo(st, 3);
    var box = U.el('div', 'chart');
    loadChart(box, cur.id);
    return { nodes: [box, info.nodes[0]], focus: null, update: info.update };
  }

  var BUILDERS = {
    light: bLight,
    switch: bToggle('switch'), input_boolean: bToggle('input_boolean'), fan: bToggle('fan'),
    automation: bToggle('automation'), humidifier: bToggle('humidifier'), siren: bToggle('siren'),
    group: bGroup, remote: bToggle('remote'),
    cover: bCover, lock: bLock, climate: bClimate, media_player: bMedia, camera: bCamera,
    scene: bActivate('d.runScene'), script: bActivate('d.runScript'),
    button: bActivate('d.press'), input_button: bActivate('d.press'),
    sensor: bSensor, binary_sensor: bSensor
  };


  // ---- who changed the state ------------------------------------------------
  var WHO_DOMAINS = {
    light: 1, switch: 1, input_boolean: 1, fan: 1, cover: 1, lock: 1, climate: 1, media_player: 1,
    humidifier: 1, siren: 1, automation: 1, group: 1
  };

  // Name of the user that wrote the last state, from state.context.user_id (persons are linked by their user_id)
  function changedBy(s) {
    var c = s.context || {};
    if (c.user_id) {
      var me = HAT.user;
      if (me && me.id === c.user_id) return HAT.t('d.byThisDevice', me.name);
      var all = HAT.store.states;
      for (var k in all) {
        if (all.hasOwnProperty(k) && k.indexOf('person.') === 0 && all[k].attributes && all[k].attributes.user_id === c.user_id) {
          return all[k].attributes.friendly_name || k;
        }
      }
      return HAT.t('d.byOtherUser');
    }
    if (c.parent_id) return HAT.t('d.byAutomation');
    return HAT.t('d.bySystem');
  }

  function updateWho(s) {
    if (!cur || !cur.who) return;
    cur.who.innerHTML = '';
    cur.who.appendChild(U.el('span', '', HAT.t('d.lastChangedBy')));
    var b = U.el('b', '', changedBy(s));
    cur.who.firstChild.appendChild(b);
    cur.who.appendChild(U.el('span', '', s.last_changed ? U.relTime(s.last_changed) : ''));
  }

  // ---- open / close ------------------------------------------------------
  function updateHead(s) {
    var d = E.describe(cur.id, s, cur.ov);
    nameEl.textContent = d.name;
    stateEl.textContent = d.text;
    icoEl.innerHTML = HAT.iconSvg(d.icon);
    icoEl.classList.toggle('on', d.active);
  }

  D.open = function (id, ov, returnFocus) {
    var st = HAT.store.get(id) || { entity_id: id, state: 'unavailable', attributes: {} };
    cur = { id: id, ov: ov || {}, built: null, camTimer: 0, returnFocus: returnFocus || null };
    bodyEl.innerHTML = '';
    updateHead(st);
    var builder = BUILDERS[E.domain(id)] || bInfo;
    if (st.state === 'unavailable') builder = bInfo;
    cur.built = builder(st);
    for (var i = 0; i < cur.built.nodes.length; i++) bodyEl.appendChild(cur.built.nodes[i]);
    cur.who = null;
    if (WHO_DOMAINS[E.domain(id)] && st.state !== 'unavailable') {
      cur.who = U.el('div', 'who');
      bodyEl.appendChild(cur.who);
      updateWho(st);
    }
    cardEl.classList.toggle('wide', E.domain(id) === 'camera');
    root.classList.add('show');
    HAT.ui.layer = 'detail';
    var first = cur.built.focus || bodyEl.querySelector('.focusable');
    HAT.nav.focus(first || null);
    D.hint(first || null);
  };

  D.close = function () {
    if (!cur) return;
    clearInterval(cur.camTimer);
    var rf = cur.returnFocus;
    cur = null;
    root.classList.remove('show');
    HAT.ui.layer = 'main';
    if (rf) HAT.nav.focus(rf);
  };

  D.refresh = function (id) {
    // A change of a light that belongs to the open group refreshes the group's brightness slider
    if (cur && cur.id !== id && E.domain(cur.id) === 'group' && id.indexOf('light.') === 0) {
      var gm = E.lightGroupMembers(HAT.store.get(cur.id));
      if (gm && gm.indexOf(id) >= 0) id = cur.id;
    }
    if (!cur || cur.id !== id) return;
    var s = HAT.store.get(id);
    if (!s) return;
    updateHead(s);
    cur.built.update(s);
    updateWho(s);
  };

  D.currentId = function () { return cur ? cur.id : null; };
})(window);
