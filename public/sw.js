const CACHE = "fitfundog-v2";

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
self.addEventListener("push", e => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); } catch { data = { title: "Fit Fun Dog", body: e.data.text() }; }

  e.waitUntil(
    self.registration.showNotification(data.title || "Fit Fun Dog 🐾", {
      body: data.body || "Du hast noch offene Übungen!",
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: "fitfundog-reminder",
      renotify: true,
      data: { url: data.url || "/" }
    })
  );
});

// ── Notification click → open app ──
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client)
          return client.focus();
      }
      return clients.openWindow(e.notification.data?.url || "/");
    })
  );
});
