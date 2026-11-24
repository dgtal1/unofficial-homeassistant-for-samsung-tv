// Home Assistant TV - user configuration. This is the only file you need to edit.
window.HA_CONFIG = {
  // Address of your Home Assistant (no trailing slash)
  url: "http://192.168.0.14:8123",

  // Long-lived access token: HA profile -> Security -> Long-lived access tokens
  token: "PASTE_YOUR_LONG_LIVED_TOKEN_HERE",

  // Dashboard to show: a url_path such as "samsung-tv", or a built-in one ("gen:apple", "gen:ha-home").
  // null (default) = use the dashboard assigned to the token's user in the HA profile, or the default dashboard.
  // A value set here always wins over the profile; the emulator / browser (or a TV with allowDashboardChange)
  // can still override it with a choice saved in Settings.
  dashboard: null,

  // false (default): on a real TV the dashboard cannot be changed (the Settings row is hidden).
  // true: show Settings -> Dashboard on the TV too; a choice saved there wins over "dashboard" and the profile.
  allowDashboardChange: false,

  // Number of tile columns (4-6 works well on a 1080p layout)
  columns: 5,

  // true: OK always opens the details screen
  // false: OK toggles / activates, long OK (or the Info key) opens details
  tapOpensDetails: false,

  // HA notifications (bell in the top bar, read only). Entries that match are hidden:
  //   "notification_id"          exact id (see Settings -> Diagnostics for the ids of hidden ones)
  //   "prefix*"                  every id starting with prefix
  //   "title:fragment"           title contains the fragment (case-insensitive)
  notificationsIgnore: ["http-login"],
  // false (default): the notification list is read only.
  // true: each notification gets a × button (RIGHT, then OK) and the list has "Dismiss all"; both ask for
  //       confirmation. Dismissing removes the notification in Home Assistant too (needs a user allowed to call the service).
  notificationsDismiss: false,
  // Play the notification sound when a new notification arrives
  notificationSound: true,

  // Long press threshold in ms (0 = disable long press, OK acts immediately)
  longPressMs: 500
};
