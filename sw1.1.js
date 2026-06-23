const CACHE_NAME = "qr-code-cache-v1.3";
const urlsToCache = [
  "./",
  "./index.html",
  "./qr.png",
  "./manifest.json",
  "./sw1.1.js",
  "https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.js",
  "https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js",
];

// Install event - Cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tell the active service worker to take control of the page immediately.
  event.waitUntil(self.clients.claim());
});

// Fetch event - Network First for HTML, Cache First for assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Check if the request is for the main HTML file (navigation or explicitly index.html)
  // or if it's a navigation request.
  const scopePath = new URL(self.registration.scope).pathname;
  if (event.request.mode === "navigate" || requestUrl.pathname.endsWith("index.html") || requestUrl.pathname === scopePath) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If network fetch is successful, update the cache
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
  } else {
    // For everything else (assets), use Cache First.
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
