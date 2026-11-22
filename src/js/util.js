// Small helpers (kept ES5-friendly for old TV web engines)
(function (w) {
  var HAT = w.HAT = w.HAT || {};
  var U = HAT.util = {};

  U.el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  };

  U.clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };

  U.num = function (v) {
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  // Number format of the current language (decimal comma in Polish, point in English)
  U.fmt = function (n, dec) {
    var f = Math.pow(10, dec === undefined || dec === null ? 1 : dec);
    var s = String(Math.round(n * f) / f);
    return HAT.i18n && HAT.i18n.lang() === 'pl' ? s.replace('.', ',') : s;
  };

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  U.relTime = function (iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return '';
    var s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 45) return HAT.t('time.justNow');
    if (s < 3600) return HAT.t('time.min', Math.round(s / 60));
    if (s < 86400) return HAT.t('time.hours', Math.round(s / 3600));
    return HAT.t('time.days', Math.round(s / 86400));
  };

  U.clock = function (d) {
    var days = HAT.i18n.raw('time.days.short'), months = HAT.i18n.raw('time.months.short');
    return {
      time: pad(d.getHours()) + ':' + pad(d.getMinutes()),
      date: days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()]
    };
  };
})(window);
