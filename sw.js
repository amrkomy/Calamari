// sw.js

const CACHE_NAME = 'calamari-complaints-v1';
const urlsToCache = [
  './',
  './index.html',
  './send.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// === التثبيت (Install) ===
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.warn('فشل تثبيت الـ Cache:', err);
      })
  );
});

// === التنشيط (Activate) ===
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// === جلب الموارد (Fetch) ===
self.addEventListener('fetch', (event) => {
  // لا نُخزن طلبات API (خاصة Supabase) لأنها ديناميكية
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إذا وُجد في الكاش، أعد استخدامه
        if (response) {
          return response;
        }
        // وإلا، اطلب من الشبكة
        return fetch(event.request).then((networkResponse) => {
          // لا نخزن طلبات غير GET أو غير ناجحة
          if (
            !event.request.url.startsWith('http') ||
            event.request.method !== 'GET' ||
            networkResponse.status < 200 ||
            networkResponse.status >= 300
          ) {
            return networkResponse;
          }

          // انسخ الاستجابة واحفظها في الكاش
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        });
      })
      .catch(() => {
        // لا نُظهر صفحة خطأ مخصصة هنا لتجنب تعقيد UX
        // فقط نسمح بالفشل الصامت إن لم يُطلب شيء مهم
      })
  );
});

