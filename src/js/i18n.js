// Translations (Polish / English). HAT.t('key', arg0, arg1) fills {0}, {1}; HAT.i18n holds the language state.
// The language is chosen in Settings: 'auto' (follow the TV / browser language), 'pl' or 'en'.
// Names that come from Home Assistant (areas, entities, dashboards) are never translated.
(function (w) {
  var HAT = w.HAT = w.HAT || {};

  var PL = {
    // ---- common
    'common.close': 'Zamknij', 'common.closeLc': 'zamknij', 'common.error': 'błąd', 'common.none': 'brak',
    'common.unavailable': 'Niedostępne', 'common.unavailableLc': 'niedostępne', 'common.unknownLc': 'nieznany',
    'common.reloadDashboard': 'Odśwież dashboard',

    // ---- static screens
    'settings.title': 'Ustawienia', 'settings.dashboard': 'Dashboard', 'settings.style': 'Styl wizualny',
    'settings.language': 'Język', 'settings.diag': 'Diagnostyka',
    'lang.auto': 'Automatycznie ({0})', 'lang.pl': 'Polski', 'lang.en': 'English', 'lang.choose': 'Język aplikacji',
    'diag.title': 'Diagnostyka', 'diag.scrollHint': '▲ ▼ przewijanie listy',
    'picker.title': 'Wybierz dashboard',
    'picker.loading': 'Ładowanie listy dashboardów…',
    'picker.note': 'Po wybraniu widok zostanie przeładowany. Wybór jest zapamiętywany w aplikacji.',
    'picker.failed': 'Nie udało się pobrać listy dashboardów ({0}). Cofnij – wróć.',
    'notifs.title': 'Powiadomienia', 'notifs.hintOpen': 'OK rozwiń / zwiń · ',
    'notifs.hintDismiss': '▶ odrzuć · ', 'notifs.count': 'Liczba powiadomień: {0}', 'notifs.dismiss': 'Odrzuć',
    'notifs.dismissAll': 'Odrzuć wszystkie ({0})', 'common.cancel': 'Anuluj',
    'notifs.confirmOne': 'Odrzucić powiadomienie?', 'notifs.confirmOneSub': '„{0}” zniknie także w Home Assistant.',
    'notifs.confirmAll': 'Odrzucić wszystkie powiadomienia?',
    'notifs.confirmAllSub': 'Wszystkie widoczne powiadomienia ({0}) znikną także w Home Assistant. Ukryte (lista wykluczeń) zostają.',
    'notifs.dismissed': 'Odrzucono: {0}', 'notifs.dismissedAll': 'Odrzucono powiadomienia ({0})',
    'notifs.dismissFailed': 'Nie udało się odrzucić: {0}',
    'notifs.empty': 'Brak powiadomień', 'notifs.readOnly': 'Tylko do odczytu · {0}', 'notifs.untitled': 'Powiadomienie',
    'detail.hintAdj': '◀ ▶ zmiana wartości · ',
    'banner.offline': 'Brak połączenia z Home Assistant – ponawianie…',

    // ---- boot / connection
    'boot.noConfig': 'Brak konfiguracji',
    'boot.noConfigSub': 'Wpisz adres HA i token w pliku js/config.js, a potem zbuduj aplikację ponownie.',
    'boot.connecting': 'Łączenie z Home Assistant…',
    'boot.badToken': 'Nieprawidłowy token',
    'boot.badTokenSub': 'Wygeneruj nowy token długoterminowy w HA i wpisz go w js/config.js.',
    'boot.noConn': 'Brak połączenia',
    'boot.noConnSub': 'Sprawdź adres {0} i czy TV jest w tej samej sieci. Ponawiam…',
    'boot.empty': 'Pusty dashboard',
    'boot.emptySub': 'Nie znaleziono żadnych obsługiwanych kart ani encji.',
    'dash.default': 'Przegląd (domyślny)', 'dash.defaultShort': 'domyślny', 'dash.overview': 'Przegląd',
    'dash.defaultSuffix': ' (domyślny)',
    'dash.loading': 'Wczytuję dashboard: {0}…', 'dash.loaded': 'Wczytano dashboard: {0}',
    'dash.cannotRead': 'Nie można odczytać dashboardu „{0}”: {1}. Pokazuję układ awaryjny.',
    'dash.refreshing': 'Odświeżanie dashboardu…',
    'dash.profileFailed': 'niedostępne ({0})',
    'dash.noRegistries': 'rejestry obszarów/encji niedostępne dla tego użytkownika',
    'dash.autoStrategy': 'dashboard generowany automatycznie (strategia {0}) – nieobsługiwany',
    'dash.empty': 'pusty dashboard',
    'dash.start': 'Start', 'dash.view': 'Widok {0}',
    'tile.hint': 'OK – przełącz · przytrzymaj OK – szczegóły',
    'tile.started': 'Uruchomiono: {0}',
    'err.command': 'Błąd: {0}', 'err.commandFailed': 'nie udało się wykonać polecenia',

    // ---- states
    'state.on': 'Wł.', 'state.off': 'Wył.', 'state.unavailable': 'Niedostępne', 'state.unknown': 'Nieznany',
    'state.open': 'Otwarte', 'state.closed': 'Zamknięte', 'state.opening': 'Otwieranie…', 'state.closing': 'Zamykanie…',
    'state.locked': 'Zablokowany', 'state.unlocked': 'Odblokowany', 'state.locking': 'Blokowanie…',
    'state.unlocking': 'Odblokowywanie…', 'state.jammed': 'Zablokowany mechanicznie',
    'state.playing': 'Odtwarzanie', 'state.paused': 'Pauza', 'state.idle': 'Bezczynny', 'state.standby': 'Czuwanie',
    'state.buffering': 'Buforowanie', 'state.home': 'W domu', 'state.not_home': 'Poza domem',
    'state.heat': 'Grzanie', 'state.cool': 'Chłodzenie', 'state.auto': 'Auto', 'state.heat_cool': 'Grz./Chł.',
    'state.dry': 'Osuszanie', 'state.fan_only': 'Wentylator',
    'state.above_horizon': 'Nad horyzontem', 'state.below_horizon': 'Pod horyzontem',
    'state.heating': 'Grzeje', 'state.cooling': 'Chłodzi', 'state.drying': 'Osusza', 'state.fan': 'Wentylator',
    'state.recording': 'Nagrywanie',

    'weather.sunny': 'Słonecznie', 'weather.clear-night': 'Pogodnie', 'weather.cloudy': 'Pochmurno',
    'weather.partlycloudy': 'Częściowe zachmurzenie', 'weather.rainy': 'Deszcz', 'weather.pouring': 'Ulewa',
    'weather.snowy': 'Śnieg', 'weather.snowy-rainy': 'Deszcz ze śniegiem', 'weather.fog': 'Mgła',
    'weather.windy': 'Wietrznie', 'weather.windy-variant': 'Wietrznie', 'weather.lightning': 'Burza',
    'weather.lightning-rainy': 'Burza z deszczem', 'weather.hail': 'Grad', 'weather.exceptional': 'Wyjątkowe',

    // binary_sensor device_class -> [on, off]
    'bin.motion': ['Ruch', 'Brak ruchu'], 'bin.occupancy': ['Obecność', 'Brak'], 'bin.presence': ['Obecność', 'Brak'],
    'bin.door': ['Otwarte', 'Zamknięte'], 'bin.window': ['Otwarte', 'Zamknięte'],
    'bin.garage_door': ['Otwarta', 'Zamknięta'], 'bin.opening': ['Otwarte', 'Zamknięte'],
    'bin.smoke': ['Dym', 'Czysto'], 'bin.gas': ['Gaz', 'Czysto'], 'bin.moisture': ['Wilgoć', 'Sucho'],
    'bin.carbon_monoxide': ['Czad', 'Czysto'], 'bin.connectivity': ['Połączony', 'Rozłączony'],
    'bin.battery': ['Słaba', 'OK'], 'bin.plug': ['Podłączone', 'Odłączone'], 'bin.power': ['Zasilanie', 'Brak zasilania'],
    'bin.lock': ['Odblokowany', 'Zablokowany'], 'bin.tamper': ['Naruszenie', 'OK'], 'bin.problem': ['Problem', 'OK'],
    'bin.safety': ['Zagrożenie', 'Bezpiecznie'], 'bin.vibration': ['Wibracje', 'Brak'],
    'bin.light': ['Światło', 'Ciemno'], 'bin.sound': ['Dźwięk', 'Cisza'], 'bin.running': ['Działa', 'Nie działa'],
    'bin.heat': ['Gorąco', 'OK'], 'bin.cold': ['Zimno', 'OK'],

    'tile.run': 'Uruchom', 'tile.running': 'Działa', 'tile.preview': 'Podgląd', 'tile.target': 'cel {0}',
    'tile.onPct': 'Wł. · {0}%',

    // ---- detail screen
    'd.effect': 'Efekt', 'd.effectLine': 'Efekt: {0}', 'd.effectNone': 'brak',
    'd.brightness': 'Jasność', 'd.colorTemp': 'Temperatura barwy', 'd.color': 'Kolor', 'd.speed': 'Prędkość',
    'd.turnOn': 'Włącz', 'd.turnOff': 'Wyłącz', 'd.open': 'Otwórz', 'd.stop': 'Stop', 'd.close': 'Zamknij',
    'd.position': 'Pozycja', 'd.lock': 'Zablokuj', 'd.unlock': 'Odblokuj', 'd.volume': 'Głośność',
    'd.target': 'Cel', 'd.nowTemp': ' · teraz {0}', 'd.noPreview': 'Brak podglądu z kamery.',
    'd.started': 'Uruchomiono', 'd.startFailed': 'Nie udało się uruchomić',
    'd.runScene': 'Uruchom scenę', 'd.runScript': 'Uruchom skrypt', 'd.press': 'Naciśnij',
    'd.state': 'Stan', 'd.lastChanged': 'Ostatnia zmiana',
    'd.lastHour': 'Ostatnia godzina', 'd.lastHourLoading': 'Ostatnia godzina · ładowanie…',
    'd.lastHourNoData': 'Ostatnia godzina · brak danych historii',
    'd.lastHourFailed': 'Ostatnia godzina · historia niedostępna',
    'd.lastChangedBy': 'Ostatnia zmiana: ',
    'd.byThisDevice': '{0} (to urządzenie)', 'd.byOtherUser': 'Inny użytkownik',
    'd.byAutomation': 'Automatyzacja lub skrypt', 'd.bySystem': 'Urządzenie lub system',
    'attr.temperature': 'Temperatura', 'attr.humidity': 'Wilgotność', 'attr.pressure': 'Ciśnienie',
    'attr.wind_speed': 'Wiatr', 'attr.battery': 'Bateria', 'attr.battery_level': 'Bateria',
    'attr.source': 'Źródło', 'attr.latitude': 'Szerokość', 'attr.longitude': 'Długość',

    // ---- time
    'time.justNow': 'przed chwilą', 'time.min': '{0} min temu', 'time.hours': '{0} godz. temu', 'time.days': '{0} dn. temu',
    'time.days.short': ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'],
    'time.months.short': ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],

    // ---- generated dashboards
    'gen.haHome': 'Home Assistant – Przegląd (generowany)', 'gen.haHomeSub': 'odtworzony w aplikacji z obszarów i urządzeń HA',
    'gen.apple': 'Apple Home (pokoje)', 'gen.appleSub': 'wbudowany układ według obszarów',
    'grp.lights': 'Światła', 'grp.switches': 'Przełączniki', 'grp.climate': 'Klimat', 'grp.covers': 'Rolety i bramy',
    'grp.locks': 'Zamki', 'grp.media': 'Media', 'grp.cameras': 'Kamery', 'grp.scenes': 'Sceny',
    'grp.sensors': 'Czujniki', 'grp.weather': 'Pogoda',
    'sum.security': 'Bezpieczeństwo', 'sum.players': 'Odtwarzacze', 'sum.speakers': 'Głośniki i TV',
    'sum.maintenance': 'Konserwacja', 'sum.batteries': 'Baterie', 'sum.unavailable': 'Niedostępne',
    'sum.noArea': 'Bez obszaru', 'sum.home': 'Dom', 'sum.summary': 'Podsumowanie', 'sum.summaries': 'Podsumowania',
    'sum.areas': 'Obszary',
    'sum.lightsOn': '{0} włączone', 'sum.lightsOff': 'Wyłączone', 'sum.active': '{0} aktywne',
    'sum.openOrUnlocked': '{0} otwarte lub odblokowane', 'sum.secured': 'Zabezpieczone',
    'sum.playing': '{0} odtwarza', 'sum.nothingPlaying': 'Nic nie jest odtwarzane',
    'sum.allGood': 'Wszystko w porządku',
    'sum.lowBattery': ['słaba bateria', 'słabe baterie', 'słabych baterii'],
    'sum.unavailableDevice': ['niedostępne urządzenie', 'niedostępne urządzenia', 'niedostępnych urządzeń'],
    'sum.device': ['urządzenie', 'urządzenia', 'urządzeń'],

    // ---- notifications / diagnostics
    'nt.live': 'subskrypcja na żywo', 'nt.poll': 'odczyt co 30 s', 'nt.failed': 'niedostępne ({0})', 'nt.noData': 'brak danych',
    'nt.diag': '{0} · widoczne {1}, ukryte {2}', 'nt.hiddenIds': 'Ukryte powiadomienia (ID)',
    'dg.browser': 'Silnik przeglądarki', 'dg.screen': 'Ekran', 'dg.screenVal': '{0}×{1} (px urządzenia ×{2})',
    'dg.api': 'API Tizen / webapis', 'dg.noTizen': 'brak tizen', 'dg.noWebapis': 'brak webapis',
    'dg.model': 'Model (productinfo)', 'dg.realModel': 'Model rzeczywisty',
    'dg.connection': 'Połączenie', 'dg.entities': 'Encje w HA', 'dg.mode': 'Tryb urządzenia',
    'dg.modeTv': 'telewizor (wybór dashboardu ukryty)', 'dg.modeTvPick': 'telewizor (wybór dashboardu włączony w konfiguracji)', 'dg.modeEmu': 'emulator', 'dg.modeBrowser': 'przeglądarka',
    'dg.profileDash': 'Dashboard z profilu', 'dg.selectedDash': 'Wybrany dashboard',
    'dg.noSave': ' (zapis niedostępny)', 'dg.layoutSource': 'Źródło układu',
    'dg.srcDash': 'dashboard z HA', 'dg.srcGenerated': 'generowany w aplikacji (rejestry obszarów)',
    'dg.srcFallback': 'awaryjne: {0}', 'dg.tokenUser': 'Użytkownik tokenu', 'dg.admin': ' (administrator)',
    'dg.views': 'Widoki / kafelki', 'dg.hiddenViews': ' (ukryte w HA: {0})', 'dg.skipped': 'Pominięte karty',
    'dg.fps': 'FPS', 'dg.fpsVal': '{0} kl./s', 'dg.notifications': 'Powiadomienia',
    'dg.noProfileSetting': 'brak ustawienia w profilu',
    'fb.areas': 'obszary (styl Apple Home)', 'fb.types': 'typy encji'
  };

  var EN = {
    'common.close': 'Close', 'common.closeLc': 'close', 'common.error': 'error', 'common.none': 'none',
    'common.unavailable': 'Unavailable', 'common.unavailableLc': 'unavailable', 'common.unknownLc': 'unknown',
    'common.reloadDashboard': 'Reload dashboard',

    'settings.title': 'Settings', 'settings.dashboard': 'Dashboard', 'settings.style': 'Visual style',
    'settings.language': 'Language', 'settings.diag': 'Diagnostics',
    'lang.auto': 'Automatic ({0})', 'lang.pl': 'Polski', 'lang.en': 'English', 'lang.choose': 'App language',
    'diag.title': 'Diagnostics', 'diag.scrollHint': '▲ ▼ scroll the list',
    'picker.title': 'Choose dashboard',
    'picker.loading': 'Loading the list of dashboards…',
    'picker.note': 'The view reloads after you choose. Your choice is remembered by the app.',
    'picker.failed': 'Could not load the list of dashboards ({0}). Press Back to return.',
    'notifs.title': 'Notifications', 'notifs.hintOpen': 'OK expand / collapse · ',
    'notifs.hintDismiss': '▶ dismiss · ', 'notifs.count': 'Notifications: {0}', 'notifs.dismiss': 'Dismiss',
    'notifs.dismissAll': 'Dismiss all ({0})', 'common.cancel': 'Cancel',
    'notifs.confirmOne': 'Dismiss this notification?', 'notifs.confirmOneSub': '“{0}” will also disappear in Home Assistant.',
    'notifs.confirmAll': 'Dismiss all notifications?',
    'notifs.confirmAllSub': 'All visible notifications ({0}) will also disappear in Home Assistant. Hidden ones (ignore list) are kept.',
    'notifs.dismissed': 'Dismissed: {0}', 'notifs.dismissedAll': 'Dismissed {0} notifications',
    'notifs.dismissFailed': 'Could not dismiss: {0}',
    'notifs.empty': 'No notifications', 'notifs.readOnly': 'Read only · {0}', 'notifs.untitled': 'Notification',
    'detail.hintAdj': '◀ ▶ change value · ',
    'banner.offline': 'No connection to Home Assistant – retrying…',

    'boot.noConfig': 'Not configured',
    'boot.noConfigSub': 'Enter the HA address and token in js/config.js, then rebuild the app.',
    'boot.connecting': 'Connecting to Home Assistant…',
    'boot.badToken': 'Invalid token',
    'boot.badTokenSub': 'Create a new long-lived access token in HA and enter it in js/config.js.',
    'boot.noConn': 'No connection',
    'boot.noConnSub': 'Check the address {0} and that the TV is on the same network. Retrying…',
    'boot.empty': 'Empty dashboard',
    'boot.emptySub': 'No supported cards or entities were found.',
    'dash.default': 'Overview (default)', 'dash.defaultShort': 'default', 'dash.overview': 'Overview',
    'dash.defaultSuffix': ' (default)',
    'dash.loading': 'Loading dashboard: {0}…', 'dash.loaded': 'Dashboard loaded: {0}',
    'dash.cannotRead': 'Could not read dashboard “{0}”: {1}. Showing the fallback layout.',
    'dash.refreshing': 'Reloading dashboard…',
    'dash.profileFailed': 'unavailable ({0})',
    'dash.noRegistries': 'area / entity registries are not available for this user',
    'dash.autoStrategy': 'auto-generated dashboard (strategy {0}) – not supported',
    'dash.empty': 'empty dashboard',
    'dash.start': 'Start', 'dash.view': 'View {0}',
    'tile.hint': 'OK – toggle · hold OK – details',
    'tile.started': 'Started: {0}',
    'err.command': 'Error: {0}', 'err.commandFailed': 'the command failed',

    'state.on': 'On', 'state.off': 'Off', 'state.unavailable': 'Unavailable', 'state.unknown': 'Unknown',
    'state.open': 'Open', 'state.closed': 'Closed', 'state.opening': 'Opening…', 'state.closing': 'Closing…',
    'state.locked': 'Locked', 'state.unlocked': 'Unlocked', 'state.locking': 'Locking…',
    'state.unlocking': 'Unlocking…', 'state.jammed': 'Jammed',
    'state.playing': 'Playing', 'state.paused': 'Paused', 'state.idle': 'Idle', 'state.standby': 'Standby',
    'state.buffering': 'Buffering', 'state.home': 'Home', 'state.not_home': 'Away',
    'state.heat': 'Heat', 'state.cool': 'Cool', 'state.auto': 'Auto', 'state.heat_cool': 'Heat/Cool',
    'state.dry': 'Dry', 'state.fan_only': 'Fan only',
    'state.above_horizon': 'Above horizon', 'state.below_horizon': 'Below horizon',
    'state.heating': 'Heating', 'state.cooling': 'Cooling', 'state.drying': 'Drying', 'state.fan': 'Fan',
    'state.recording': 'Recording',

    'weather.sunny': 'Sunny', 'weather.clear-night': 'Clear night', 'weather.cloudy': 'Cloudy',
    'weather.partlycloudy': 'Partly cloudy', 'weather.rainy': 'Rain', 'weather.pouring': 'Pouring',
    'weather.snowy': 'Snow', 'weather.snowy-rainy': 'Sleet', 'weather.fog': 'Fog',
    'weather.windy': 'Windy', 'weather.windy-variant': 'Windy', 'weather.lightning': 'Thunderstorm',
    'weather.lightning-rainy': 'Thunderstorm with rain', 'weather.hail': 'Hail', 'weather.exceptional': 'Exceptional',

    'bin.motion': ['Motion', 'No motion'], 'bin.occupancy': ['Occupied', 'Clear'], 'bin.presence': ['Present', 'Away'],
    'bin.door': ['Open', 'Closed'], 'bin.window': ['Open', 'Closed'],
    'bin.garage_door': ['Open', 'Closed'], 'bin.opening': ['Open', 'Closed'],
    'bin.smoke': ['Smoke', 'Clear'], 'bin.gas': ['Gas', 'Clear'], 'bin.moisture': ['Wet', 'Dry'],
    'bin.carbon_monoxide': ['CO detected', 'Clear'], 'bin.connectivity': ['Connected', 'Disconnected'],
    'bin.battery': ['Low', 'OK'], 'bin.plug': ['Plugged in', 'Unplugged'], 'bin.power': ['Powered', 'No power'],
    'bin.lock': ['Unlocked', 'Locked'], 'bin.tamper': ['Tampered', 'OK'], 'bin.problem': ['Problem', 'OK'],
    'bin.safety': ['Unsafe', 'Safe'], 'bin.vibration': ['Vibration', 'None'],
    'bin.light': ['Light', 'Dark'], 'bin.sound': ['Sound', 'Quiet'], 'bin.running': ['Running', 'Not running'],
    'bin.heat': ['Hot', 'OK'], 'bin.cold': ['Cold', 'OK'],

    'tile.run': 'Run', 'tile.running': 'Running', 'tile.preview': 'Preview', 'tile.target': 'target {0}',
    'tile.onPct': 'On · {0}%',

    'd.effect': 'Effect', 'd.effectLine': 'Effect: {0}', 'd.effectNone': 'none',
    'd.brightness': 'Brightness', 'd.colorTemp': 'Colour temperature', 'd.color': 'Colour', 'd.speed': 'Speed',
    'd.turnOn': 'Turn on', 'd.turnOff': 'Turn off', 'd.open': 'Open', 'd.stop': 'Stop', 'd.close': 'Close',
    'd.position': 'Position', 'd.lock': 'Lock', 'd.unlock': 'Unlock', 'd.volume': 'Volume',
    'd.target': 'Target', 'd.nowTemp': ' · now {0}', 'd.noPreview': 'No camera preview.',
    'd.started': 'Started', 'd.startFailed': 'Could not start it',
    'd.runScene': 'Run scene', 'd.runScript': 'Run script', 'd.press': 'Press',
    'd.state': 'State', 'd.lastChanged': 'Last changed',
    'd.lastHour': 'Last hour', 'd.lastHourLoading': 'Last hour · loading…',
    'd.lastHourNoData': 'Last hour · no history data',
    'd.lastHourFailed': 'Last hour · history unavailable',
    'd.lastChangedBy': 'Last changed by: ',
    'd.byThisDevice': '{0} (this device)', 'd.byOtherUser': 'Another user',
    'd.byAutomation': 'Automation or script', 'd.bySystem': 'Device or system',
    'attr.temperature': 'Temperature', 'attr.humidity': 'Humidity', 'attr.pressure': 'Pressure',
    'attr.wind_speed': 'Wind', 'attr.battery': 'Battery', 'attr.battery_level': 'Battery',
    'attr.source': 'Source', 'attr.latitude': 'Latitude', 'attr.longitude': 'Longitude',

    'time.justNow': 'just now', 'time.min': '{0} min ago', 'time.hours': '{0} h ago', 'time.days': '{0} d ago',
    'time.days.short': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    'time.months.short': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

    'gen.haHome': 'Home Assistant – Overview (generated)', 'gen.haHomeSub': 'rebuilt in the app from HA areas and devices',
    'gen.apple': 'Apple Home (rooms)', 'gen.appleSub': 'built-in layout by area',
    'grp.lights': 'Lights', 'grp.switches': 'Switches', 'grp.climate': 'Climate', 'grp.covers': 'Blinds and gates',
    'grp.locks': 'Locks', 'grp.media': 'Media', 'grp.cameras': 'Cameras', 'grp.scenes': 'Scenes',
    'grp.sensors': 'Sensors', 'grp.weather': 'Weather',
    'sum.security': 'Security', 'sum.players': 'Media players', 'sum.speakers': 'Speakers and TV',
    'sum.maintenance': 'Maintenance', 'sum.batteries': 'Batteries', 'sum.unavailable': 'Unavailable',
    'sum.noArea': 'No area', 'sum.home': 'Home', 'sum.summary': 'Summary', 'sum.summaries': 'Summaries',
    'sum.areas': 'Areas',
    'sum.lightsOn': '{0} on', 'sum.lightsOff': 'Off', 'sum.active': '{0} active',
    'sum.openOrUnlocked': '{0} open or unlocked', 'sum.secured': 'Secured',
    'sum.playing': '{0} playing', 'sum.nothingPlaying': 'Nothing is playing',
    'sum.allGood': 'All good',
    'sum.lowBattery': ['low battery', 'low batteries'],
    'sum.unavailableDevice': ['unavailable device', 'unavailable devices'],
    'sum.device': ['device', 'devices'],

    'nt.live': 'live subscription', 'nt.poll': 'polling every 30 s', 'nt.failed': 'unavailable ({0})', 'nt.noData': 'no data',
    'nt.diag': '{0} · visible {1}, hidden {2}', 'nt.hiddenIds': 'Hidden notifications (ID)',
    'dg.browser': 'Browser engine', 'dg.screen': 'Screen', 'dg.screenVal': '{0}×{1} (device px ×{2})',
    'dg.api': 'Tizen / webapis API', 'dg.noTizen': 'no tizen', 'dg.noWebapis': 'no webapis',
    'dg.model': 'Model (productinfo)', 'dg.realModel': 'Real model',
    'dg.connection': 'Connection', 'dg.entities': 'HA entities', 'dg.mode': 'Device mode',
    'dg.modeTv': 'TV (dashboard choice hidden)', 'dg.modeTvPick': 'TV (dashboard choice enabled in the config)', 'dg.modeEmu': 'emulator', 'dg.modeBrowser': 'browser',
    'dg.profileDash': 'Dashboard from profile', 'dg.selectedDash': 'Selected dashboard',
    'dg.noSave': ' (cannot be saved)', 'dg.layoutSource': 'Layout source',
    'dg.srcDash': 'dashboard from HA', 'dg.srcGenerated': 'generated in the app (area registries)',
    'dg.srcFallback': 'fallback: {0}', 'dg.tokenUser': 'Token user', 'dg.admin': ' (administrator)',
    'dg.views': 'Views / tiles', 'dg.hiddenViews': ' (hidden in HA: {0})', 'dg.skipped': 'Skipped cards',
    'dg.fps': 'FPS', 'dg.fpsVal': '{0} fps', 'dg.notifications': 'Notifications',
    'dg.noProfileSetting': 'not set in the profile',
    'fb.areas': 'areas (Apple Home style)', 'fb.types': 'entity types'
  };

  var dicts = { pl: PL, en: EN };
  var lang = 'pl';

  function detect() {
    var n = '';
    try { n = String(w.navigator.language || w.navigator.userLanguage || ''); } catch (e) { n = ''; }
    return /^pl/i.test(n) ? 'pl' : 'en';
  }

  function raw(key) {
    var d = dicts[lang];
    if (d.hasOwnProperty(key)) return d[key];
    return PL.hasOwnProperty(key) ? PL[key] : undefined;
  }

  // Translated string with {0}, {1} ... filled from the extra arguments
  HAT.t = function (key) {
    var s = raw(key);
    if (typeof s !== 'string') return s === undefined ? key : String(s);
    for (var i = 1; i < arguments.length; i++) s = s.split('{' + (i - 1) + '}').join(String(arguments[i]));
    return s;
  };

  var I = HAT.i18n = {};

  I.lang = function () { return lang; };
  I.has = function (key) { return raw(key) !== undefined; };
  I.raw = raw;
  I.detected = detect;

  // Setting: 'auto' | 'pl' | 'en'
  I.setting = function () {
    var v = HAT.settings ? HAT.settings.get('lang', 'auto') : 'auto';
    return v === 'pl' || v === 'en' ? v : 'auto';
  };

  I.apply = function () {
    var s = I.setting();
    lang = s === 'auto' ? detect() : s;
    try { document.documentElement.lang = lang; } catch (e) { /* ignore */ }
  };

  // Plural form of an array entry: Polish has three forms (1 / 2-4 / other), English two
  I.plural = function (n, key) {
    var v = raw(key) || [key];
    if (lang === 'pl') {
      var m10 = n % 10, m100 = n % 100;
      if (n === 1) return v[0];
      if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return v[1];
      return v[2];
    }
    return n === 1 ? v[0] : v[1];
  };

  // Fills every element that has data-i18n (text) from the dictionary
  I.applyStatic = function (root) {
    var list = (root || document).querySelectorAll('[data-i18n]');
    for (var i = 0; i < list.length; i++) list[i].textContent = HAT.t(list[i].getAttribute('data-i18n'));
  };

  I.apply();
})(window);
