const CACHE_NAME = "qr-code-cache-v1.1";
const urlsToCache = [
    "/elevator-qr",
    "/elevator-qr/index.html",
    "/elevator-qr/qr.png",
    "/elevator-qr/manifest.json",
    "/elevator-qr/sw1.1.js",
    "https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.js",
    "https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js",
];

// 在安装阶段缓存应用需要的资源
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        }).then(() => {
            // 确保 Service Worker 安装后立即激活
            self.skipWaiting();
        })
    );
});

// 处理 fetch 事件，提供缓存的资源
self.addEventListener("fetch", (event) => {
    event.respondWith(
        (async () => {
            try {
                const cacheResponse = await caches.match(event.request);
                if (cacheResponse) {
                    return cacheResponse;
                }

                const networkResponse = await fetch(event.request);
                if (networkResponse.ok) {
                    // 将网络响应缓存起来
                    const responseToCache = networkResponse.clone();
                    caches.open('dynamic-cache').then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                } else {
                    throw new Error(`Network request failed with status ${networkResponse.status}`);
                }
            } catch (error) {
                console.error(`Error fetching resource: ${error.message}`);
                // 重试逻辑
                return retryFetch(event.request, 3); // 最多重试3次
            }
        })()
    );
});

/**
 * 重试 fetch 请求
 * @param {Request} request - 要请求的资源
 * @param {number} retries - 剩余的重试次数
 * @returns {Promise<Response>}
 */
async function retryFetch(request, retries) {
    try {
        const response = await fetch(request);
        if (!response.ok) {
            throw new Error(`Network request failed with status ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            console.warn(`Retrying fetch after 2 seconds... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return retryFetch(request, retries - 1);
        } else {
            console.error('Max retries exceeded, giving up.');
            throw error;
        }
    }
}

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

    // 确保 Service Worker 激活后立即控制客户端
    self.clients.claim();
});