/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* grafika-avto.js - Лётная школа (27.11.2026): автонастройка графики по замеру кадров.
   Раньше "Авто" умело только одно: если кадры долгие - один раз опуститься на ступень ниже, и то после перезапуска. Обратно оно не поднималось,
   а слабый телефон получал картинку в четверть точек экрана ("лесенки" на краях, мутный текст на телевизоре).
   Теперь качество - это лестница из ступеней. Ступень = набор эффектов (low: без теней и свечения; mid: тени, свечение; high: ещё отражение в полу и
   сглаживание) + резкость (сколько точек экрана рисуем). Школа меряет время кадра и ходит по лестнице на лету:
     - кадры идут быстро и ровно несколько секунд подряд - пробуем ступень выше; если на ней стало хуже - сразу назад и долго туда не лезем;
     - кадры долгие два замера подряд - ступень ниже (очень долгие - сразу);
     - между "быстро" (от 53 к/с) и "долго" (меньше 42 к/с) есть запас: в нём ничего не меняем, поэтому картинка не скачет туда-сюда.
   Ручной выбор (Низкая / Средняя / Высокая) - это фиксированная ступень, сама она не меняется. Низкая и Средняя - те же, что были раньше.
   Найденная ступень запоминается на устройстве (kursy_grafika_stup), в следующий раз школа начинает с неё.
   Здесь только расчёт (без three.js), рисованием управляет помещение: GRAFIKA_AVTO.make({ ..., apply: function (ступень) {} }). */
(function () {
'use strict';
var KEY = 'kursy_grafika_stup';
/* лестница: t - эффекты (0 low, 1 mid, 2 high), d - резкость (доля от точек экрана, не больше devicePixelRatio) */
var PHONE = [[0, .75], [0, 1], [0, 1.25], [0, 1.5], [1, 1.25], [1, 1.5], [2, 1.5], [2, 1.75]];
var PC = [[0, .75], [0, 1], [1, 1], [1, 1.25], [2, 1.25], [2, 1.5], [2, 2]];
var MAN = { low: [0, 1], mid: [1, 1.25], high: [2, 9] };
function ladder(mob, dprMax, canFx) { var src = mob ? PHONE : PC, out = [], seen = {};
  src.forEach(function (r) { var t = canFx ? r[0] : 0, d = Math.min(r[1], Math.max(.75, dprMax)), id = t + ':' + d; if (seen[id]) return; seen[id] = 1; out.push({ t: t, d: d, id: id }); });
  out.sort(function (a, b) { return a.t - b.t || a.d - b.d; });
  return out; }
/* ближайшая ступень лестницы к паре (t, d): не дороже запрошенной */
function near(L, t, d) { var best = 0; for (var i = 0; i < L.length; i++) if (L[i].t < t || (L[i].t === t && L[i].d <= d + 1e-6)) best = i; return best; }

function make(o) {
  o = o || {};
  var mob = !!o.mob, L = ladder(mob, o.dprMax || 1, o.canFx !== false), st = o.store || { get: function () { return null; }, set: function () {} };
  var now = o.now || function () { return Date.now(); };
  var WIN = 1500, BAD = 1000 / 42, SEVERE = 1000 / 28, GOODMAX = 18.7;
  var manual = o.manual || null, idx, saved = null, caps = {}, fails = {};
  try { saved = JSON.parse(st.get(KEY) || 'null'); } catch (e) { saved = null; }
  function startAuto() { var g = MAN[o.guess] || MAN.mid, i = near(L, g[0], mob && g[0] === 2 ? 1.5 : g[1]);
    if (saved && saved.r && saved.mob === mob) { for (var k = 0; k < L.length; k++) if (L[k].id === saved.r) i = k;
      if (saved.cap && saved.capTs && now() - saved.capTs < 864e5) { for (k = 0; k < L.length; k++) if (L[k].id === saved.cap) caps[saved.cap] = now() + (tierUp(k) ? 6 * 3600e3 : 20 * 60e3); } }
    return i; }
  function tierUp(i) { return i > 0 && L[i].t !== L[i - 1].t; }
  function manIdx(m) { var g = MAN[m] || MAN.mid; return near(L, g[0], g[1]); }
  idx = manual ? manIdx(manual) : startAuto();
  var n = 0, sum = 0, slow = 0, vslow = 0, cool = o.warm == null ? 4000 : o.warm, good = 0, bad = 0, trial = 0, from = -1, best = 16.7, last = null, changes = 0, log = [];
  function save(capId) { if (manual) return; var v = { r: L[idx].id, mob: mob, ts: now() }; if (capId) { v.cap = capId; v.capTs = now(); } else if (saved && saved.cap) { v.cap = saved.cap; v.capTs = saved.capTs; } saved = v; try { st.set(KEY, JSON.stringify(v)); } catch (e) {} }
  function go(i, why) { i = Math.max(0, Math.min(L.length - 1, i)); if (i === idx) return false; var was = L[idx]; idx = i; changes++; n = sum = slow = vslow = 0; good = bad = 0;
    cool = was.t !== L[idx].t ? 2600 : 1200; log.push([why, was.id, L[idx].id]); if (log.length > 30) log.shift();
    try { if (o.apply) o.apply(L[idx], was, why); } catch (e) {} return true; }
  /* ступень не потянули: резкость пробуем снова через 1, 2, 4... минуты (не чаще раза в 10 минут); смену эффектов (она даёт заметную заминку) - через 5 минут и потом уже только при следующем входе.
     Возвращает true, если неудачу стоит запомнить на устройстве. */
  function capRung(i) { var id = L[i].id, f = fails[id] = (fails[id] || 0) + 1, tu = tierUp(i); caps[id] = now() + (tu ? (f > 1 ? 6 * 3600e3 : 300e3) : Math.min(600e3, 60e3 * Math.pow(2, f - 1))); return tu || f >= 2; }
  function capped(i) { var c = caps[L[i].id]; return !!c && c > now(); }
  function down(k, why) { var was = idx; if (idx <= 0) { bad = 0; return; } var keep = capRung(idx); trial = 0; if (go(idx - (k || 1), why)) save(keep ? L[was].id : null); }
  /* dt - время кадра в мс; ok = false - сейчас не меряем (пауза, загрузка, вкладка скрыта); calm - можно ли сейчас менять эффекты (ученик стоит или сидит) */
  function push(dt, ok, calm) {
    if (ok === false || dt > 400) { n = sum = slow = vslow = 0; if (cool < 600) cool = 600; return; }
    if (cool > 0) { cool -= dt; return; }
    n++; sum += dt; if (dt > 28) slow++; if (dt > 33.4) vslow++;
    if (sum < WIN || n < 8) return;
    var avg = sum / n, sShare = slow / n, vShare = vslow / n; last = { avg: avg, fps: 1000 / avg, slow: sShare }; n = sum = slow = vslow = 0;
    if (avg < best) best = Math.max(6.9, avg);
    if (manual) return;
    var isSev = avg > SEVERE, isBad = isSev || avg > BAD || vShare > .25, isGood = !isBad && avg <= Math.max(GOODMAX, best * 1.12) && sShare < .06;
    if (trial > 0) { if (isBad) { var back = from, cid = L[idx].id, keep = capRung(idx); trial = 0; if (back >= 0) { go(back, 'назад'); save(keep ? cid : null); } return; }
      if (--trial === 0) { save(null); } }
    if (isSev) { down(avg > 50 ? 2 : 1, 'долгие кадры'); return; }
    if (isBad) { good = 0; if (++bad >= 2) down(1, 'долгие кадры'); return; }
    bad = 0; if (!isGood) { good = 0; return; }
    good++;
    var up = idx + 1; if (up >= L.length || capped(up)) return;
    var tier = L[up].t !== L[idx].t;
    if (good >= (tier ? 8 : 3) && (!tier || calm !== false)) { from = idx; if (go(up, 'вверх')) trial = tier ? 4 : 3; }
  }
  var A = {
    push: push, ladder: L,
    rung: function () { return L[idx]; }, index: function () { return idx; },
    get manual() { return manual; },
    /* выбор в шестерёнке: 'auto' | 'low' | 'mid' | 'high' */
    set: function (m) { var was = L[idx]; manual = m === 'auto' || !m ? null : m; trial = 0; good = bad = 0; n = sum = slow = vslow = 0; cool = 1500;
      if (manual) idx = manIdx(manual); else { caps = {}; fails = {}; saved = null; try { st.set(KEY, null); } catch (e) {} idx = startAuto(); }
      if (L[idx] !== was) { changes++; try { if (o.apply) o.apply(L[idx], was, 'выбор'); } catch (e) {} } },
    /* вход в комнату, возврат из окна задания: первые секунды не меряем (догружаются программы видеокарты) */
    rest: function (ms) { n = sum = slow = vslow = 0; good = bad = 0; if (cool < ms) cool = ms; },
    info: function () { return { rung: L[idx].id, idx: idx, of: L.length, manual: manual, last: last, changes: changes, trial: trial, log: log.slice() }; }
  };
  return A;
}
window.GRAFIKA_AVTO = { make: make, ladder: ladder, KEY: KEY };
})();
