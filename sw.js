/* Hold It — Service Worker
   缓存所有静态资源，支持完全离线运行 */

const CACHE = 'holdit-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

/* 安装：预缓存所有资源 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* 激活：清理旧版本缓存 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

/* 拦截请求：优先用缓存，失败再走网络 */
self.addEventListener('fetch', event => {
  /* 只处理 GET 请求 */
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .then(response => {
            /* 缓存成功的同源响应 */
            if (
              response.ok &&
              response.type === 'basic' &&
              event.request.url.startsWith(self.location.origin)
            ) {
              const clone = response.clone();
              caches.open(CACHE).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            /* 离线且缓存没有 → 返回主页面 */
            return caches.match('./index.html');
          });
      })
  );
});
