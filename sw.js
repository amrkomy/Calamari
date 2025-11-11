const CACHE = "calamari";
const FILES = [
  "/",
  "/index.html",
  "/app.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

self.addEventListener("fetch", (e) => {
  // تجاهل الطلبات غير المحلية
  if (!e.request.url.startsWith(self.location.origin)) return;

  // تجاهل جميع الطلبات غير GET (مثل POST إلى Functions)
  if (e.request.method !== "GET") return;

  // خدّم الملفات من الـ Cache أولاً
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
