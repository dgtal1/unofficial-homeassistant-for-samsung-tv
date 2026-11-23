// Settings dialog and dashboard picker
(function (w) {
  var HAT = w.HAT = w.HAT || {};
  var U = HAT.util, UI = HAT.ui;
  var Dlg = HAT.dialogs = {};

  var hooks = {};
  var settingsEl, pickerEl, listEl, subEl, dashValEl, styleValEl, langValEl;
  var returnFocus = null;

  Dlg.init = function (h) {
    hooks = h;
    settingsEl = document.getElementById('settings');
    pickerEl = document.getElementById('picker');
    listEl = pickerEl.querySelector('.pick-list');
    subEl = pickerEl.querySelector('.pick-sub');
    dashValEl = document.querySelector('#set-dashboard .set-v');

    styleValEl = document.querySelector('#set-style .set-v');
    Dlg.applyStyle();
    document.getElementById('set-style')._act = function () {
      HAT.settings.set('style', HAT.settings.get('style', 'cupertino') === 'glass' ? 'cupertino' : 'glass');
      Dlg.applyStyle();
    };
    langValEl = document.querySelector('#set-lang .set-v');
    document.getElementById('set-lang')._act = function () { Dlg.openLanguage(); };
    document.getElementById('set-dashboard')._act = function () { Dlg.openPicker(); };
    document.getElementById('set-diag')._act = function () { Dlg.hideSettings(); hooks.openDiag(); };
    document.getElementById('set-reload')._act = function () {
      Dlg.closeAll();
      UI.toast(HAT.t('dash.refreshing'));
      hooks.reload();
    };
    document.getElementById('set-close')._act = function () { Dlg.closeAll(); };
    Dlg.applyLanguage();
  };

  // Name of a language setting value ('auto' shows the detected language)
  function langName(v) {
    if (v === 'auto') return HAT.t('lang.auto', HAT.t('lang.' + HAT.i18n.detected()));
    return HAT.t('lang.' + v);
  }

  // Re-translates the static screens and the values shown in the settings list (after a language change / at start)
  Dlg.applyLanguage = function () {
    HAT.i18n.apply();
    HAT.i18n.applyStatic();
    if (langValEl) langValEl.textContent = langName(HAT.i18n.setting()) + '  \u203a';
  };

  // Language choice: Automatic / Polski / English; the dashboard is rebuilt in the new language
  Dlg.openLanguage = function () {
    settingsEl.classList.remove('show');
    var items = [
      { title: langName('auto'), value: 'auto' },
      { title: langName('pl'), value: 'pl' },
      { title: langName('en'), value: 'en' }
    ];
    Dlg.openChoice(HAT.t('lang.choose'), items, HAT.i18n.setting(), function (v) {
      HAT.settings.set('lang', v);
      Dlg.applyLanguage();
      if (hooks.languageChanged) hooks.languageChanged();
      Dlg.openSettings();       // again, so the dashboard name is shown in the new language
    }, function () { Dlg.openSettings(); });
  };

  // Visual style: 'cupertino' (default) or 'glass' (Simple Glass); stored in the app settings
  Dlg.applyStyle = function () {
    var glass = HAT.settings.get('style', 'cupertino') === 'glass';
    document.body.className = document.body.className.replace(/\bglass\b/g, '').replace(/\s+$/, '');
    if (glass) document.body.className += (document.body.className ? ' ' : '') + 'glass';
    if (styleValEl) styleValEl.textContent = (glass ? 'Simple Glass' : 'Cupertino') + '  \u203a';
    if (HAT.nav.refreshRing) HAT.nav.refreshRing();
  };

  Dlg.hideSettings = function () { settingsEl.classList.remove('show'); };

  Dlg.openSettings = function (ret) {
    if (ret !== undefined) returnFocus = ret;
    var rowDash = document.getElementById('set-dashboard');
    var canPick = hooks.canPickDashboard ? hooks.canPickDashboard() : true;
    rowDash.style.display = canPick ? '' : 'none';
    dashValEl.textContent = hooks.dashboardLabel() + '  \u203a';
    settingsEl.classList.add('show');
    UI.layer = 'settings';
    HAT.nav.focus(canPick ? rowDash : document.getElementById('set-diag'));
  };

  Dlg.closeAll = function () {
    settingsEl.classList.remove('show');
    pickerEl.classList.remove('show');
    UI.layer = 'main';
    if (returnFocus) HAT.nav.focus(returnFocus);
  };

  var choice = null;   // { onClose } while the picker overlay is used as a generic choice list

  // Generic list of choices (e.g. light effects). items: [{ title, value }]; onPick(value)
  Dlg.openChoice = function (title, items, current, onPick, onClose, sub) {
    choice = { onClose: onClose };
    pickerEl.querySelector('.dname').textContent = title;
    subEl.textContent = sub || '';
    listEl.innerHTML = '';
    listEl.scrollTop = 0;
    var focusRow = null;
    for (var i = 0; i < items.length; i++) {
      (function (it) {
        var row = U.el('div', 'pick-row focusable');
        var txt = U.el('div', 'pick-txt');
        txt.appendChild(U.el('div', 'pick-title', it.title));
        row.appendChild(txt);
        var chk = U.el('div', 'pick-check');
        if (it.value === current) { chk.innerHTML = HAT.iconSvg('check'); row.classList.add('current'); focusRow = row; }
        row.appendChild(chk);
        row._act = function () { Dlg.closeChoice(); onPick(it.value); };
        listEl.appendChild(row);
      })(items[i]);
    }
    pickerEl.classList.add('show');
    UI.layer = 'picker';
    HAT.nav.focus(focusRow || listEl.querySelector('.pick-row'));
  };

  Dlg.closeChoice = function () {
    if (!choice) return;
    var c = choice; choice = null;
    pickerEl.classList.remove('show');
    UI.layer = 'detail';
    if (c.onClose) c.onClose();
  };

  Dlg.isOpen = function () { return UI.layer === 'settings' || UI.layer === 'picker' || UI.layer === 'notifs'; };

  // Back key: picker -> settings -> main
  Dlg.back = function () {
    if (UI.layer === 'notifs') HAT.notify.close();
    else if (choice) Dlg.closeChoice();
    else if (UI.layer === 'picker') Dlg.closePicker();
    else Dlg.closeAll();
  };

  Dlg.closePicker = function () {
    pickerEl.classList.remove('show');
    Dlg.openSettings();
  };

  function renderRows(items, currentPath) {
    listEl.innerHTML = '';
    listEl.scrollTop = 0;
    var focusRow = null;
    for (var i = 0; i < items.length; i++) {
      (function (it) {
        var row = U.el('div', 'pick-row focusable');
        var txt = U.el('div', 'pick-txt');
        txt.appendChild(U.el('div', 'pick-title', it.title));
        txt.appendChild(U.el('div', 'pick-path', it.sub));
        row.appendChild(txt);
        var cur = it.path === currentPath;
        var chk = U.el('div', 'pick-check');
        chk.innerHTML = cur ? HAT.iconSvg('check') : '';
        row.appendChild(chk);
        if (cur) { row.classList.add('current'); focusRow = row; }
        row._act = function () {
          Dlg.closeAll();
          hooks.selectDashboard(it.path, it.title);
        };
        listEl.appendChild(row);
      })(items[i]);
    }
    return focusRow || listEl.querySelector('.pick-row');
  }

  Dlg.openPicker = function () {
    choice = null;
    pickerEl.querySelector('.dname').textContent = HAT.t('picker.title');
    settingsEl.classList.remove('show');
    pickerEl.classList.add('show');
    UI.layer = 'picker';
    listEl.innerHTML = '';
    subEl.textContent = HAT.t('picker.loading');
    HAT.nav.focus(null);
    var cur = hooks.currentDashboard();
    hooks.listDashboards().then(function (items) {
      if (UI.layer !== 'picker') return;
      subEl.textContent = HAT.t('picker.note');
      var first = renderRows(items, cur);
      if (first) HAT.nav.focus(first);
    }, function (e) {
      if (UI.layer !== 'picker') return;
      subEl.textContent = HAT.t('picker.failed', (e && e.message) || HAT.t('common.error'));
    });
  };

  // Keeps the focused row inside the scrolling list
  Dlg.ensureRowVisible = function (row) {
    var lst = row.parentNode;
    if (!lst || !lst.classList || !lst.classList.contains('pick-list')) return;
    var top = row.offsetTop, bottom = top + row.offsetHeight;
    var vh = lst.clientHeight;
    if (top < lst.scrollTop) lst.scrollTop = top - 8;
    else if (bottom > lst.scrollTop + vh) lst.scrollTop = bottom - vh + 8;
  };

})(window);
