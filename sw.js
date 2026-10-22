// Курс FPV: офлайн-копия страницы. Данные (ученики, рейтинг, курс) всегда берутся с сервера напрямую.
// Работает на любом адресе: кэширует только файлы из своей папки (scope), без вложенных папок.
const C = 'kursfpv-v1';
const BASE = new URL('./', self.registration.scope).pathname;
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['./', './manifest.webmanifest', './icon-192.png'])).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('kursfpv-') && k !== C).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(BASE)) return;
  if (u.pathname.slice(BASE.length).includes('/')) return;   // только файлы курса в корне папки; proba/, fpv/ и другие папки не трогаем
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./'))));
});
