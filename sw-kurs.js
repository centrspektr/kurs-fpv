/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* sw-kurs.js - курс как приложение (проба 21.11.2026): файлы курса хранятся на устройстве, курс открывается и без интернета.
   Ставит pwa.js. Только файлы своей папки (и вложенных), чужие сайты и сервер spektr-api не трогаем - данные учеников всегда с сервера.
   - файлы с ?v=... (скрипты) - сначала с устройства (версия в адресе меняется при каждой правке);
   - остальное (страницы, фактуры, голос, музыка, списки) - сначала из сети, без сети - с устройства;
   - запросы куска файла (голос Леры из пакета) без сети отрезаем из сохранённого файла;
   - "Сохранить курс" (pwa.js) присылает сообщение { save: [адреса] } - качаем всё по списку fayly.json. */
var C = 'kursfpv-p1';
var BASE = new URL('./', self.location).pathname;
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('kursfpv-p') === 0 && k !== C; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });

function mine(u) { return u.origin === location.origin && u.pathname.indexOf(BASE) === 0 && u.pathname.indexOf(BASE + 'otkat/') !== 0 && !/\/sw-kurs\.js$/.test(u.pathname); }
function put(req, res) { if (!res || res.status !== 200 || res.type === 'opaque') return; var cp = res.clone(); caches.open(C).then(function (c) { return c.put(req, cp); }).catch(function () {}); }
function fromCache(req) { return caches.open(C).then(function (c) { return c.match(req).then(function (r) { return r || c.match(req, { ignoreSearch: true }); }); }); }
/* кусок файла (Range) из сохранённого целого */
function slice(full, range) { var m = /bytes=(\d+)-(\d*)/.exec(range || ''); if (!m) return full;
  return full.arrayBuffer().then(function (b) { var a = +m[1], z = m[2] ? Math.min(+m[2], b.byteLength - 1) : b.byteLength - 1;
    return new Response(b.slice(a, z + 1), { status: 206, statusText: 'Partial Content', headers: { 'Content-Type': full.headers.get('Content-Type') || 'application/octet-stream', 'Content-Range': 'bytes ' + a + '-' + z + '/' + b.byteLength, 'Content-Length': String(z - a + 1) } }); }); }
function timeout(p, ms) { return new Promise(function (ok, no) { var t = setTimeout(function () { no(new Error('timeout')); }, ms); p.then(function (r) { clearTimeout(t); ok(r); }, function (e) { clearTimeout(t); no(e); }); }); }

self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var u = new URL(req.url); if (!mine(u)) return;
  var range = req.headers.get('range');
  if (range) { /* голос из пакета: в сети - как обычно, без сети - кусок из сохранённого файла */
    e.respondWith(fetch(req).catch(function () { return fromCache(new Request(u.origin + u.pathname)).then(function (r) { if (!r) throw new Error('нет файла'); return slice(r, range); }); }));
    return; }
  if (/[?&]v=/.test(u.search) && req.mode !== 'navigate') {   /* скрипт с версией - с устройства, если уже есть */
    e.respondWith(caches.open(C).then(function (c) { return c.match(req).then(function (r) { return r || fetch(req).then(function (n) { put(req, n); return n; }, function () { return c.match(req, { ignoreSearch: true }); }); }); }));
    return; }
  /* остальное - сеть (до 8 с на страницу), без сети - с устройства */
  var net = fetch(req).then(function (n) { if (req.cache !== 'no-store' || /\.json$/.test(u.pathname)) put(req, n); return n; });
  e.respondWith((req.mode === 'navigate' ? timeout(net, 8000) : net).catch(function () { return fromCache(req).then(function (r) { if (r) return r;
    if (req.mode === 'navigate') return caches.open(C).then(function (c) { return c.match(BASE).then(function (x) { return x || c.match(BASE + 'index.html'); }).then(function (x) { return x || c.match(BASE + 'new.html'); }); });
    return Response.error(); }); }));
});

/* "Сохранить курс на устройство": качаем по списку, сообщаем, сколько готово */
self.addEventListener('message', function (e) {
  var d = e.data || {}, src = e.source; if (!d.save) return;
  var list = d.save, done = 0, bad = 0, i = 0, N = 4;
  function tell(fin) { if (src) src.postMessage({ saved: done, bad: bad, total: list.length, fin: !!fin }); }
  e.waitUntil(caches.open(C).then(function (c) {
    function one() { if (i >= list.length) return Promise.resolve(); var url = list[i++];
      return c.match(url).then(function (have) { if (have && !d.force) return null; return fetch(url, { cache: 'no-cache' }).then(function (r) { if (r.status === 200) return c.put(url, r); bad++; }); })
        .catch(function () { bad++; }).then(function () { done++; if (done % 5 === 0) tell(); return one(); }); }
    var w = []; for (var k = 0; k < N; k++) w.push(one()); return Promise.all(w); }).then(function () { tell(true); }));
});
