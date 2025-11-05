const CACHE = "oss-v1";
const FILES = ["/", "/index.html", "/app.js"];   // أيقونة هنضيفها بعدين

self.addEventListener("install", e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)))
);

self.addEventListener("fetch", e => {
  // نخدم فقط الملفات المحلية؛ أى رابط خارجى يروح للشبكة مباشرة
  const isLocal = e.request.url.startsWith(self.location.origin);
  if (!isLocal) return;   // ما نتدخلش

  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
