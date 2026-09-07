// Service worker for Web Push notifications (new-email alerts).
// Intentionally minimal — no offline caching, just push handling.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Avero Saas", body: event.data.text() };
  }

  const title = payload.title || "Avero Saas";
  const options = {
    body: payload.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: payload.url || "/emails" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/emails";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      for (const client of clientList) {
        if ("navigate" in client && "focus" in client) {
          return client.navigate(url).then(() => client.focus());
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
