/* Перенос ученика из клуба (вкладка "Курс" на сайте клуба) в этот курс - без потерь.
   Клуб и курс живут на одном домене (centrspektr.github.io), поэтому телефон помнит данные клуба и здесь.
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
