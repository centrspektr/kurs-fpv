#!/usr/bin/env bash
# Собирает _site: страница-переход для каждого .html курса, 404.html и sw.js.
# Переход ведёт на тот же путь на NEW_SITE, сохраняя ?код и #метку,
# и передаёт вход и прогресс из памяти браузера в #perenos (принимает perenos.js курса).
set -euo pipefail
NEW_SITE="${NEW_SITE:-https://centrspektr.gitverse.site}"
mkdir -p _site

page() {
  cat <<HTML
<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Курс FPV переехал</title>
<meta name="robots" content="noindex">
<script>
// Память браузера на новом адресе своя: вход (spk_vzlet) и прогресс (kursy*, vz_*) передаём в #perenos=<base64 JSON>.
(function () {
  var d = {}, n = 0, h = location.hash.slice(1);
  try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i);
    if (k === 'spk_vzlet' || /^kursy/.test(k) || /^vz_/.test(k)) { d[k] = localStorage.getItem(k); n++; } } } catch (e) {}
  if (n) try { h = (h ? h + '&' : '') + 'perenos=' + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(d))))); } catch (e) {}
  location.replace('$NEW_SITE' + location.pathname + location.search + (h ? '#' + h : ''));
})();
</script>
<meta http-equiv="refresh" content="0; url=$NEW_SITE/kurs-fpv/">
<style>body{background:#0b0f17;color:#e6edf3;font:16px system-ui,sans-serif;padding:32px 16px;text-align:center}a{color:#5ee7c0}</style>
</head><body>
<p>Курс FPV переехал на новый адрес.</p>
<p><a href="$NEW_SITE/kurs-fpv/">$NEW_SITE/kurs-fpv/</a></p>
</body></html>
HTML
}

find . -name '*.html' -not -path './.git/*' -not -path './_site/*' | while read -r f; do
  mkdir -p "_site/$(dirname "$f")"
  page > "_site/$f"
done
page > _site/404.html

cat > _site/sw.js <<'JS'
// Снимает старую офлайн-копию курса и отпускает страницы на новый адрес.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
})()));
JS
touch _site/.nojekyll
find _site -type f | sort
