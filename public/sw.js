const CACHE_NAME = "insta-gen-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Network-first strategy — keeps it simple
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
