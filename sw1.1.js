const CACHE_NAME = "qr-code-cache-v1.1";
const urlsToCache = [
  "./",
  "./index.html",
  "./qr.png",
  "./sw1.1.js",
  "https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.js",
  "https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js",
];

// 在安装阶段缓存应用需要的资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 处理 fetch 事件，提供缓存的资源
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 清理旧的缓存
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
});
