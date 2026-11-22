// Persistent app settings (stored in the web storage of the app; survives restarts of the app/TV)
(function (w) {
  var HAT = w.HAT = w.HAT || {};
  var KEY = 'hatv.settings.v1';
  var data = {};
  var persistent = true;

  try {
    var raw = w.localStorage.getItem(KEY);
    if (raw) data = JSON.parse(raw) || {};
  } catch (e) {
    persistent = false;
    data = {};
  }

  function save() {
    try {
      w.localStorage.setItem(KEY, JSON.stringify(data));
      persistent = true;
    } catch (e) {
      persistent = false;       // keeps working in memory until the app is closed
    }
  }

  HAT.settings = {
    has: function (k) { return Object.prototype.hasOwnProperty.call(data, k); },
    get: function (k, def) { return this.has(k) ? data[k] : def; },
    set: function (k, v) { data[k] = v; save(); },
    remove: function (k) { delete data[k]; save(); },
    isPersistent: function () { return persistent; }
  };
})(window);
