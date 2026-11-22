// Entity presentation logic: names, state texts (translated), icons, tap actions, services
(function (w) {
  var HAT = w.HAT = w.HAT || {};
  var U = HAT.util;
  var E = HAT.entity = {};

  var WEATHER_ICON = {
    'sunny': 'sun', 'clear-night': 'moon', 'cloudy': 'cloud', 'partlycloudy': 'cloud',
    'rainy': 'rain', 'pouring': 'rain', 'snowy': 'snow', 'snowy-rainy': 'snow', 'hail': 'snow',
    'fog': 'fog', 'windy': 'wind', 'windy-variant': 'wind', 'lightning': 'storm',
    'lightning-rainy': 'storm', 'exceptional': 'cloud'
  };

  var ALERT_CLASSES = {
    smoke: 1, gas: 1, moisture: 1, carbon_monoxide: 1, safety: 1, tamper: 1, problem: 1, heat: 1
  };

  var CLASS_ICON = {
    temperature: 'thermo', humidity: 'drop', moisture: 'drop', power: 'bolt', energy: 'bolt',
    current: 'bolt', voltage: 'bolt', battery: 'battery', illuminance: 'sun', motion: 'motion',
    occupancy: 'motion', presence: 'motion', door: 'door', garage_door: 'garage', window: 'window',
    opening: 'door', smoke: 'shield', gas: 'shield', carbon_monoxide: 'shield', safety: 'shield',
    tamper: 'shield', plug: 'plug', outlet: 'plug', tv: 'tv', speaker: 'speaker', receiver: 'speaker',
    shutter: 'blinds', blind: 'blinds', curtain: 'blinds', awning: 'blinds', gate: 'door',
    garage: 'garage', damper: 'blinds', pressure: 'gauge'
  };

  var DOMAIN_ICON = {
    light: 'bulb', switch: 'plug', input_boolean: 'plug', fan: 'fan', climate: 'thermo', cover: 'blinds',
    lock: 'lock', sensor: 'gauge', binary_sensor: 'gauge', scene: 'sparkle', script: 'play',
    button: 'play', input_button: 'play', media_player: 'speaker', camera: 'camera', weather: 'cloud',
    automation: 'play', alarm_control_panel: 'shield', person: 'home', device_tracker: 'home',
    sun: 'sun', humidifier: 'drop', siren: 'bell', water_heater: 'flame', remote: 'tv'
  };

  // [regex on the mdi icon name, icon key]; order matters
  var MDI = [
    [/wrench|(^|-)cog|settings|tools|hammer|toolbox|screwdriver|^build/, 'gear'],
    [/sofa|couch/, 'sofa'],
    [/(^|-)bed($|-)|bedroom|sleep/, 'bed'],
    [/silverware|kitchen|fridge|stove|chef|food|coffee|pot-steam/, 'kitchen'],
    [/pine|christmas|conifer|evergreen/, 'tree'],
    [/flower|sprout|leaf|(^|-)tree($|-)|garden|grass/, 'flower'],
    [/(^|-)desk|office|laptop/, 'desk'],
    [/lightning-bolt|flash|bolt|energy|current|voltage|flash/, 'bolt'],
    [/lightning/, 'storm'],
    [/rainy|rain|pouring/, 'rain'],
    [/snow/, 'snow'],
    [/fog|hazy/, 'fog'],
    [/weather-night|moon/, 'moon'],
    [/sunny|sun|brightness/, 'sun'],
    [/cloud/, 'cloud'],
    [/windy|wind/, 'wind'],
    [/thermometer|temperature|thermostat/, 'thermo'],
    [/fire|radiator|heat|flame/, 'flame'],
    [/water|humidity|drop|shower|faucet/, 'drop'],
    [/blinds|shutter|curtain|roller/, 'blinds'],
    [/garage/, 'garage'],
    [/lock-open|lock-off|unlock/, 'lockopen'],
    [/lock/, 'lock'],
    [/door|gate/, 'door'],
    [/window/, 'window'],
    [/motion|run|walk|radar|human|account/, 'motion'],
    [/fan|ventilat|air-conditioner|hvac|air-filter/, 'fan'],
    [/plug|outlet|socket/, 'plug'],
    [/television|tv|monitor|cast/, 'tv'],
    [/speaker|music|volume|audio|radio|soundbar/, 'speaker'],
    [/camera|cctv|webcam|video/, 'camera'],
    [/bell|alarm|siren|bullhorn/, 'bell'],
    [/shield|security|smoke|alert/, 'shield'],
    [/battery/, 'battery'],
    [/home|house/, 'home'],
    [/lightbulb|lamp|ceiling-light|led|light|chandelier/, 'bulb'],
    [/palette|star|auto-fix|sparkles|movie|theater|sofa|bed|sleep/, 'sparkle'],
    [/play|script|button|gesture/, 'play'],
    [/gauge|chart|counter|numeric|sine|meter/, 'gauge'],
    [/power/, 'power']
  ];

  function fromMdi(name) {
    var n = String(name).replace(/^mdi:/, '');
    for (var i = 0; i < MDI.length; i++) {
      if (MDI[i][0].test(n)) return MDI[i][1];
    }
    return null;
  }

  E.mdiIcon = fromMdi;

  E.domain = function (id) { return String(id).split('.')[0]; };

  E.translate = function (s) {
    var k = 'state.' + s;
    return HAT.i18n.has(k) ? HAT.t(k) : s;
  };

  E.iconKey = function (id, st, ov) {
    var d = E.domain(id);
    var a = (st && st.attributes) || {};
    var s = st ? st.state : '';
    if (d === 'lock') return (s === 'unlocked' || s === 'open' || s === 'unlocking') ? 'lockopen' : 'lock';
    if (d === 'weather') return WEATHER_ICON[s] || 'cloud';
    var mdi = (ov && ov.icon) || a.icon;
    // Group of lights only (old-style group or UI light group): bulb-group icon unless a different icon was chosen
    var lightGroup = (d === 'group' && E.lightGroupMembers(st)) || (d === 'light' && a.entity_id && typeof a.entity_id !== 'string' && a.entity_id.length);
    if (mdi) {
      var k = fromMdi(mdi);
      if (k) return lightGroup && k === 'bulb' ? 'bulbgroup' : k;
    }
    if (lightGroup) return 'bulbgroup';
    var dc = a.device_class;
    if (dc && CLASS_ICON[dc]) return CLASS_ICON[dc];
    return DOMAIN_ICON[d] || 'gauge';
  };

  function pct(v) { return Math.round(v); }

  // Members of a group that contains only lights (else null): such a group can be dimmed as a whole
  E.lightGroupMembers = function (st) {
    var m = st && st.attributes && st.attributes.entity_id;
    if (!m || !m.length || typeof m === 'string') return null;
    for (var i = 0; i < m.length; i++) if (String(m[i]).indexOf('light.') !== 0) return null;
    return m;
  };

  // Mean brightness (0-100) of the members that are on and report it; null when unknown
  E.groupBrightness = function (members) {
    var sum = 0, n = 0;
    for (var i = 0; i < members.length; i++) {
      var ms = HAT.store.get(members[i]);
      var b = ms && ms.state === 'on' ? U.num(ms.attributes && ms.attributes.brightness) : null;
      if (b !== null) { sum += b / 255 * 100; n++; }
    }
    return n ? sum / n : null;
  };

  // Returns { name, text, active, alert, unavailable, icon }
  E.describe = function (id, st, ov) {
    ov = ov || {};
    var d = E.domain(id);
    var a = (st && st.attributes) || {};
    var s = st ? st.state : 'unavailable';
    var res = {
      name: ov.name || a.friendly_name || id,
      text: '', active: false, alert: false, unavailable: false,
      icon: E.iconKey(id, st, ov)
    };
    if (!st || s === 'unavailable') {
      res.unavailable = true;
      res.text = HAT.t('state.unavailable');
      return res;
    }
    var n, unit, cur, tgt;
    switch (d) {
      case 'light':
        res.active = s === 'on';
        if (res.active) {
          n = U.num(a.brightness);
          res.text = n !== null ? HAT.t('tile.onPct', pct(n / 255 * 100)) : HAT.t('state.on');
        } else res.text = HAT.t('state.off');
        break;
      case 'fan':
        res.active = s === 'on';
        n = U.num(a.percentage);
        res.text = res.active ? (n !== null ? HAT.t('tile.onPct', pct(n)) : HAT.t('state.on')) : HAT.t('state.off');
        break;
      case 'switch':
      case 'input_boolean':
      case 'automation':
      case 'humidifier':
      case 'siren':
      case 'group':
      case 'remote':
        res.active = s === 'on';
        res.text = E.translate(s);
        if (d === 'group' && res.active) {
          var gm = E.lightGroupMembers(st);
          n = gm ? E.groupBrightness(gm) : null;
          if (n !== null) res.text = HAT.t('tile.onPct', pct(n));
        }
        break;
      case 'climate':
        res.active = s !== 'off';
        cur = U.num(a.current_temperature);
        tgt = U.num(a.temperature);
        if (s === 'off') res.text = HAT.t('state.off');
        else {
          res.text = (cur !== null ? U.fmt(cur) + '°' : '') +
            (tgt !== null ? (cur !== null ? ' · ' : '') + HAT.t('tile.target', U.fmt(tgt) + '°') : '');
          if (!res.text) res.text = E.translate(s);
        }
        break;
      case 'cover':
        res.active = s === 'open' || s === 'opening';
        res.text = E.translate(s);
        n = U.num(a.current_position);
        if (n !== null && n > 0 && n < 100 && (s === 'open' || s === 'opening' || s === 'closing')) {
          res.text += ' · ' + pct(n) + '%';
        }
        break;
      case 'lock':
        res.active = s === 'unlocked' || s === 'open';
        res.text = E.translate(s);
        break;
      case 'sensor':
        unit = a.unit_of_measurement || '';
        n = U.num(s);
        if (a.device_class === 'timestamp') res.text = U.relTime(s);
        else if (n !== null && /^-?[\d.,]+$/.test(s)) {
          var prec = U.num(a.suggested_display_precision);
          res.text = U.fmt(n, prec !== null ? prec : (Math.abs(n) >= 100 ? 0 : 1)) + (unit ? ' ' + unit : '');
        } else res.text = E.translate(s);
        break;
      case 'binary_sensor':
        res.active = s === 'on';
        var pair = HAT.i18n.raw('bin.' + a.device_class);
        res.text = pair ? pair[s === 'on' ? 0 : 1] : E.translate(s);
        res.alert = res.active && !!ALERT_CLASSES[a.device_class];
        break;
      case 'media_player':
        res.active = s === 'playing';
        if (s === 'playing' || s === 'paused') res.text = a.media_title || E.translate(s);
        else res.text = E.translate(s);
        break;
      case 'scene':
      case 'button':
      case 'input_button':
        res.text = HAT.t('tile.run');
        break;
      case 'script':
        res.active = s === 'on';
        res.text = s === 'on' ? HAT.t('tile.running') : HAT.t('tile.run');
        break;
      case 'camera':
        res.text = s === 'recording' ? HAT.t('state.recording') : HAT.t('tile.preview');
        break;
      case 'weather':
        res.text = (HAT.i18n.has('weather.' + s) ? HAT.t('weather.' + s) : s) + (U.num(a.temperature) !== null ? ' · ' + U.fmt(U.num(a.temperature)) + '°' : '');
        break;
      case 'input_number':
      case 'number':
        n = U.num(s);
        res.text = (n !== null ? U.fmt(n, 1) : s) + (a.unit_of_measurement ? ' ' + a.unit_of_measurement : '');
        break;
      default:
        res.text = E.translate(s);
    }
    return res;
  };

  var TOGGLE = { light: 1, switch: 1, input_boolean: 1, fan: 1, automation: 1, humidifier: 1, siren: 1, group: 1, remote: 1, cover: 1 };
  var ACTIVATE = { scene: 1, script: 1, button: 1, input_button: 1 };

  // What a short press on a tile does: 'toggle' | 'activate' | 'detail'
  E.tapAction = function (id, st, cfg) {
    if (cfg.tapOpensDetails) return 'detail';
    var d = E.domain(id);
    if (!st || st.state === 'unavailable') return 'detail';
    if (TOGGLE[d]) return 'toggle';
    if (ACTIVATE[d]) return 'activate';
    return 'detail';
  };

  E.runToggle = function (client, id) {
    var d = E.domain(id);
    if (d === 'cover') return client.callService('cover', 'toggle', {}, id);
    return client.callService('homeassistant', 'toggle', {}, id);
  };

  E.runActivate = function (client, id) {
    var d = E.domain(id);
    if (d === 'button' || d === 'input_button') return client.callService(d, 'press', {}, id);
    return client.callService(d, 'turn_on', {}, id);
  };
})(window);
