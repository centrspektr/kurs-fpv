/* 1) Приём данных со старого адреса (30.10.2026, промт 16).
   Курс живёт на https://centrspektr.gitverse.site/kurs-fpv/, Взлёт и старый адрес - на centrspektr.github.io,
   у них разная память браузера. Старый адрес и кнопка "Открыть курс" во Взлёте передают данные в адресе:
   #perenos=<base64 от JSON {ключ: значение}> (ключи spk_vzlet, kursy*, vz_*).
   - spk_vzlet пишем всегда (это свежий вход во Взлёте) и по нему входим в курс (ключ meKey);
   - прогресс курса (запись с заданиями t) складываем с местным: по каждому заданию остаётся, где пройдено больше;
   - остальные ключи пишем, только если их здесь ещё нет.
   Потом #perenos убираем из адреса. Подключать обычным скриптом сразу после config.js (до остальных). */
(function () {
  'use strict';
  const C = window.KURSY || {};
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const json = v => { try { return JSON.parse(v || 'null'); } catch (e) { return null; } };
  const h = location.hash.slice(1), m = h.match(/(^|&)perenos=([^&]*)/);
  if (!m) return;
  const rest = h.replace(m[0], '').replace(/^&/, '');
  try { history.replaceState(null, '', location.pathname + location.search + (rest ? '#' + rest : '')); } catch (e) {}
  let D = null;
  try { D = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[2]))))); } catch (e) { return; }
  if (!D || typeof D !== 'object') return;
  const score = z => !z ? -1 : (z.done ? 1000 : 0) + Object.keys(z.s || {}).filter(i => z.s[i] && z.s[i].ok).length;
  Object.keys(D).forEach(k => {
    if (!(k === 'spk_vzlet' || /^kursy/.test(k) || /^vz_/.test(k)) || typeof D[k] !== 'string') return;
    const cur = get(k);
    if (k === 'spk_vzlet' || cur == null) return set(k, D[k]);
    /* прогресс курса есть и тут, и там - складываем */
    const a = json(cur), b = json(D[k]);
    if (!a || !b || !a.t || !b.t) return;
    const t = Object.assign({}, a.t);
    Object.keys(b.t).forEach(id => { if (score(b.t[id]) > score(t[id])) t[id] = b.t[id]; });
    const open = [...new Set([...(a.open || []), ...(b.open || [])])];
    set(k, JSON.stringify(Object.assign({}, b, a, { t: t, open: open, lvl: Object.assign({}, b.lvl || {}, a.lvl || {}) })));
  });
  /* вход: ученик принят во Взлёте - входим в курс тем же кодом (номер сброса e берём больший, если код тот же) */
  const v = json(D.spk_vzlet);
  if (C.meKey && v && v.code && v.status === 'принят') {
    const me = json(get(C.meKey)), e = me && me.code === v.code ? Math.max(me.e || 0, v.e || 0) : (v.e || 0);
    set(C.meKey, JSON.stringify({ status: 'принят', code: v.code, first: v.first, cls: v.cls, e: e }));
    try { localStorage.removeItem(C.meKey + '_guest'); } catch (e) {}
  }
})();

/* 2) Перенос ученика из клуба (вкладка "Курс" на сайте клуба) в этот курс - без потерь.
   Работает, когда клуб и курс живут на одном домене (телефон помнит данные клуба и здесь).
   Что делает (один раз на устройстве, при первом открытии курса):
   - вход: если в курсе ещё не входили, а в клубе ученик принят - берём его код, имя и класс (вводить код заново не нужно);
   - прогресс: задания из клуба добавляются к прогрессу курса; по каждому заданию остаётся то, где пройдено больше;
   - данные клуба не меняются и не удаляются; прошлое состояние курса сохраняется в запас (ключ store + "_zapas").
   Настройка в config.js: from: { store: 'vz_kurs', me: 'spk_vzlet' }. Нет from - ничего не делает.
   Подключать обычным скриптом сразу после config.js (до остальных). */
(function () {
  'use strict';
  const C = window.KURSY || {}, F = C.from;
  if (!F || !C.store || !C.meKey) return;
  const FLAG = C.store + '_perenos';
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const json = k => { try { return JSON.parse(get(k) || 'null'); } catch (e) { return null; } };

  /* вход: код из клуба. Номер сброса (e) берём всегда, когда код тот же - иначе сервер не примет прогресс */
  const cm = F.me ? json(F.me) : null, me = json(C.meKey);
  if (cm && cm.code && cm.status === 'принят') {
    if (!me || !me.code) set(C.meKey, JSON.stringify({ status: 'принят', code: cm.code, first: cm.first, cls: cm.cls, e: cm.e || 0 }));
    else if (me.code === cm.code && (cm.e || 0) > (me.e || 0)) { me.e = cm.e; set(C.meKey, JSON.stringify(me)); }
  }

  if (get(FLAG)) return;
  const old = F.store ? json(F.store) : null;
  if (old && old.t && Object.keys(old.t).length) {
    const cur = json(C.store) || {};
    if (cur.t && Object.keys(cur.t).length) set(C.store + '_zapas', JSON.stringify(cur));
    /* сколько пройдено в задании: сдано - главное, потом число пройденных шагов */
    const score = z => !z ? -1 : (z.done ? 1000 : 0) + Object.keys(z.s || {}).filter(i => z.s[i] && z.s[i].ok).length;
    const t = Object.assign({}, cur.t || {});
    Object.keys(old.t).forEach(id => { if (score(old.t[id]) > score(t[id])) t[id] = old.t[id]; });
    const open = [...new Set([...(cur.open || []), ...(old.open || [])])];
    const lvl = Object.assign({}, old.lvl || {}, cur.lvl || {});
    set(C.store, JSON.stringify(Object.assign({}, old, cur, { t: t, open: open, lvl: lvl })));
  }
  set(FLAG, new Date().toISOString().slice(0, 10));
})();
