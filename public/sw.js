const CACHE = "fitfundog-v4";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // passthrough – no offline caching needed
});

// ── Push notification received ──
// WICHTIG: Es muss IMMER eine Notification gezeigt werden – auch wenn der
// Payload fehlt oder nicht entschluesselt werden kann. iOS entzieht der App
// sonst nach ~3 "stillen" Pushes heimlich die Push-Berechtigung.
self.addEventListener("push", e => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    try { data = { title: "Fit Fun Dog", body: e.data.text() }; }
    catch { data = {}; }
  }

  e.waitUntil(
    self.registration.showNotification(data.title || "Fit Fun Dog", {
      body: data.body || "Du hast noch offene Uebungen!",
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: "fitfundog-reminder",
      renotify: true,
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: { url: data.url || "/" }
    })
  );
});

// ── Notification click → open app ──
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
