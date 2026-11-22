// Home Assistant TV - user configuration. This is the only file you need to edit.
window.HA_CONFIG = {
  // Address of your Home Assistant (no trailing slash)
  url: "http://192.168.0.100:8123",

  // Long-lived access token: HA profile -> Security -> Long-lived access tokens
  token: "YOUR_LONG_LIVE_ACCESS_TOKEN",

  // Dashboard url_path to mirror (null = the default dashboard).
  // On a real TV this dashboard is always used; the emulator / browser can change it in Settings.
  dashboard: "samsung-tv",

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
  // Play the notification sound when a new notification arrives
  notificationSound: true,

  // Long press threshold in ms (0 = disable long press, OK acts immediately)
  longPressMs: 500
};
