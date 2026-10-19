// Bump VERSION whenever the app files change so phones pick up the update.
const VERSION = "trip-wallet-v2";
const CORE = ["./", "index.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // The app page: try the network for updates, fall back to the cached copy offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put("index.html", copy)); return res; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  // Everything else (icons, Google Fonts): cache first, save new files as they load.
  const cacheable = url.origin === location.origin || url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("gstatic.com");
  if (!cacheable) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
