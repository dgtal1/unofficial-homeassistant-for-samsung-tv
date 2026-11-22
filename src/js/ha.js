// Home Assistant WebSocket client + entity state store
(function (w) {
  var HAT = w.HAT = w.HAT || {};

  // ---- state store -------------------------------------------------------
  HAT.store = {
    states: {},
    get: function (id) { return this.states[id] || null; },
    set: function (id, st) {
      if (st) this.states[id] = st; else delete this.states[id];
    },
    count: function () { return Object.keys(this.states).length; }
  };

  // ---- client ------------------------------------------------------------
  function HAClient(cfg) {
    this.cfg = cfg;
    this.url = String(cfg.url).replace(/\/+$/, '').replace(/^http/i, 'ws') + '/api/websocket';
    this.ws = null;
    this.nextId = 1;
    this.pending = {};
    this.subs = [];
    this.status = 'idle';       // idle | connecting | ready | closed | invalid
    this.handlers = {};
    this.attempt = 0;
    this.stopped = false;
    this.haVersion = '';
    this.pingTimer = null;
    this.pongTimer = null;
    this.reconnectTimer = null;
  }

  HAClient.prototype.on = function (ev, fn) {
    (this.handlers[ev] = this.handlers[ev] || []).push(fn);
  };

  HAClient.prototype._emit = function (ev, arg) {
    var list = this.handlers[ev] || [];
    for (var i = 0; i < list.length; i++) {
      try { list[i](arg); } catch (e) { if (w.console) console.error(e); }
    }
  };

  HAClient.prototype._setStatus = function (s) {
    if (this.status === s) return;
    this.status = s;
    this._emit('status', s);
  };

  HAClient.prototype.connect = function () {
    var self = this;
    if (self.stopped) return;
    if (self.ws && (self.ws.readyState === 0 || self.ws.readyState === 1) && self.status !== 'closed') return;
    clearTimeout(self.reconnectTimer);
    self._setStatus('connecting');
    var ws;
    try { ws = new WebSocket(self.url); } catch (e) { self._onClose(); return; }
    self.ws = ws;
    ws.onmessage = function (ev) { if (ws === self.ws) self._onMessage(ev.data); };
    ws.onclose = function () { if (ws === self.ws) self._onClose(); };
    ws.onerror = function () { /* onclose follows */ };
  };

  HAClient.prototype._onMessage = function (data) {
    var msg;
    try { msg = JSON.parse(data); } catch (e) { return; }
    var i, p;
    switch (msg.type) {
      case 'auth_required':
        this.ws.send(JSON.stringify({ type: 'auth', access_token: this.cfg.token }));
        break;
      case 'auth_ok':
        this.haVersion = msg.ha_version || '';
        this.attempt = 0;
        this._setStatus('ready');
        this._startPing();
        this._resubscribe();
        this._emit('ready');
        break;
      case 'auth_invalid':
        this.stopped = true;
        this._setStatus('invalid');
        try { this.ws.close(); } catch (e1) { /* ignore */ }
        break;
      case 'pong':
        clearTimeout(this.pongTimer);
        break;
      case 'result':
        p = this.pending[msg.id];
        if (p) {
          clearTimeout(p.timer);
          delete this.pending[msg.id];
          if (msg.success) p.resolve(msg.result); else p.reject(msg.error || { message: 'error' });
        }
        break;
      case 'event':
        for (i = 0; i < this.subs.length; i++) {
          if (this.subs[i].id === msg.id) this.subs[i].cb(msg.event);
        }
        break;
    }
  };

  HAClient.prototype._onClose = function () {
    var self = this;
    clearInterval(self.pingTimer);
    clearTimeout(self.pongTimer);
    self.ws = null;
    var pend = self.pending;
    self.pending = {};
    for (var k in pend) {
      if (pend.hasOwnProperty(k)) {
        clearTimeout(pend[k].timer);
        pend[k].reject({ message: 'connection closed' });
      }
    }
    if (self.status !== 'invalid') self._setStatus('closed');
    if (self.stopped) return;
    var delay = Math.min(10000, 1000 + self.attempt * 1500);
    self.attempt++;
    clearTimeout(self.reconnectTimer);
    self.reconnectTimer = setTimeout(function () { self.connect(); }, delay);
  };

  // Drop a connection that stopped answering (e.g. after TV standby)
  HAClient.prototype._drop = function () {
    var old = this.ws;
    if (!old) return;
    this.ws = null;
    old.onmessage = old.onclose = old.onerror = null;
    try { old.close(); } catch (e) { /* ignore */ }
    this.ws = null;
    this._onClose();
  };

  HAClient.prototype._startPing = function () {
    var self = this;
    clearInterval(self.pingTimer);
    self.pingTimer = setInterval(function () { self.ping(8000); }, 25000);
  };

  HAClient.prototype.ping = function (timeout) {
    var self = this;
    if (!self.ws || self.ws.readyState !== 1) return;
    try { self.ws.send(JSON.stringify({ id: self.nextId++, type: 'ping' })); } catch (e) { self._drop(); return; }
    clearTimeout(self.pongTimer);
    self.pongTimer = setTimeout(function () { self._drop(); }, timeout);
  };

  // Called when the app becomes visible again
  HAClient.prototype.wake = function () {
    if (this.stopped) return;
    if (this.status === 'ready') this.ping(5000); else this.connect();
  };

  HAClient.prototype._send = function (msg, resolve, reject) {
    var self = this;
    if (!self.ws || self.ws.readyState !== 1 || self.status !== 'ready') {
      if (reject) reject({ message: 'not connected' });
      return 0;
    }
    var id = self.nextId++;
    msg.id = id;
    var timer = setTimeout(function () {
      if (self.pending[id]) {
        delete self.pending[id];
        if (reject) reject({ message: 'timeout' });
      }
    }, 20000);
    self.pending[id] = { resolve: resolve || function () {}, reject: reject || function () {}, timer: timer };
    try { self.ws.send(JSON.stringify(msg)); } catch (e) { self._drop(); }
    return id;
  };

  HAClient.prototype.request = function (msg) {
    var self = this;
    return new Promise(function (resolve, reject) { self._send(msg, resolve, reject); });
  };

  HAClient.prototype.callService = function (domain, service, data, entityId) {
    var msg = { type: 'call_service', domain: domain, service: service, service_data: data || {} };
    if (entityId) msg.target = { entity_id: entityId };
    return this.request(msg);
  };

  HAClient.prototype.subscribe = function (eventType, cb) {
    var sub = { eventType: eventType, cb: cb, id: 0 };
    this.subs.push(sub);
    if (this.status === 'ready') this._subscribeOne(sub);
  };

  // Subscription started by any command that streams events (e.g. persistent_notification/subscribe)
  HAClient.prototype.subscribeMessage = function (msg, cb, onError) {
    var sub = { msg: msg, cb: cb, onError: onError, id: 0 };
    this.subs.push(sub);
    if (this.status === 'ready') this._subscribeOne(sub);
  };

  HAClient.prototype._subscribeOne = function (sub) {
    var m = {}, k;
    if (sub.msg) { for (k in sub.msg) if (sub.msg.hasOwnProperty(k)) m[k] = sub.msg[k]; }
    else m = { type: 'subscribe_events', event_type: sub.eventType };
    sub.id = this._send(m, function () {}, function (e) { if (sub.onError) sub.onError(e); });
  };

  HAClient.prototype._resubscribe = function () {
    for (var i = 0; i < this.subs.length; i++) this._subscribeOne(this.subs[i]);
  };

  HAT.HAClient = HAClient;
})(window);
