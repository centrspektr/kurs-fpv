/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* holl-zvuki.js - звуки холла Лётной школы вместо фоновой музыки (28.11.2026, просьба Alexandr).
   1) Появление у лифта - короткий мягкий звук (вход в холл).
   2) За окнами изредка пролетают корабли - гул проходит слева направо или справа налево.
   3) Голос Леры объясняет, где ты и куда идти (файлы zvuk/holl/*.mp3; пока файлов нет - молчит, всё остальное работает).
   Звуки синтезируются в браузере (Web Audio), своих и чужих звуковых файлов для них нет.
   Громкость - ползунок "Звуки" в меню (бывший "Музыка", muzyka.js хранит его значение). Только при KMN_UL (shkola.html). */
(function () {
'use strict';
if (!window.KMN_UL) return;
var D = document, AC = window.AudioContext || window.webkitAudioContext, ctx = null, out = null, noiseB = null;
function vol() { var M = window.MUZYKA; var v = M && M.vol != null ? M.vol : .5; return v * v * 4.6; }   /* 50% на ползунке: появление около -27 дБ, корабли около -30 дБ (голос Леры около -20 дБ) */
function init() { if (ctx || !AC) return; try { ctx = new AC(); } catch (e) { ctx = null; return; }
  out = ctx.createGain(); out.gain.value = vol(); out.connect(ctx.destination);
  var n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), s = 22222; for (var i = 0; i < n; i++) { s = (s * 16807) % 2147483647; d[i] = s / 1073741823.5 - 1; } noiseB = b; }
function ready() { return ctx && ctx.state === 'running'; }
function unlock() { init(); if (ctx && ctx.state === 'suspended' && !D.hidden) ctx.resume().catch(function () {}); }
D.addEventListener('visibilitychange', function () { if (!ctx) return; if (D.hidden) ctx.suspend().catch(function () {}); else ctx.resume().catch(function () {}); });
setInterval(function () { if (out) out.gain.setTargetAtTime(vol(), ctx.currentTime, .1); }, 400);
function noise(t, dur) { var s = ctx.createBufferSource(); s.buffer = noiseB; s.loop = true; s.start(t, Math.random() * 1.5); s.stop(t + dur + .1); return s; }
function pan(p) { if (ctx.createStereoPanner) { var q = ctx.createStereoPanner(); q.pan.value = p || 0; return q; } var g = ctx.createGain(); g.pan = { value: 0, setValueAtTime: function () {}, linearRampToValueAtTime: function () {} }; return g; }

/* 1. появление: тихий вдох шума вверх и мягкий аккорд с затуханием */
function appear() { if (!ready()) return false; var t = ctx.currentTime + .05;
  var n = noise(t, 1.3), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3800, t + .9);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.11, t + .55); g.gain.linearRampToValueAtTime(0, t + 1.2);
  n.connect(f); f.connect(g); g.connect(out);
  [523.25, 659.25, 783.99, 1046.5].forEach(function (hz, i) { var o = ctx.createOscillator(), og = ctx.createGain(), ts = t + .45 + i * .07;
    o.type = 'sine'; o.frequency.value = hz; og.gain.setValueAtTime(0, ts); og.gain.linearRampToValueAtTime(.05 - i * .007, ts + .05); og.gain.exponentialRampToValueAtTime(.0005, ts + 1.8);
    o.connect(og); og.connect(out); o.start(ts); o.stop(ts + 1.9); });
  return true; }

/* 2. корабль за окном: низкий гул и шум, громче в середине пролёта, панорама через всю сцену, тон чуть падает (как будто удаляется) */
function ship() { if (!ready()) return; var t = ctx.currentTime + .05, dur = 3.2 + Math.random() * 2.2, dir = Math.random() < .5 ? -1 : 1, big = Math.random() < .35;
  var p = pan(), mg = ctx.createGain(), base = (big ? 55 : 82) + Math.random() * 20;
  if (p.pan && p.pan.setValueAtTime) { p.pan.setValueAtTime(-.9 * dir, t); p.pan.linearRampToValueAtTime(.9 * dir, t + dur); }
  var top = (big ? .2 : .13) * (.7 + Math.random() * .3);
  mg.gain.setValueAtTime(0, t); mg.gain.linearRampToValueAtTime(top, t + dur * .5); mg.gain.linearRampToValueAtTime(0, t + dur);
  var n = noise(t, dur), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .7;
  lp.frequency.setValueAtTime(380, t); lp.frequency.linearRampToValueAtTime(big ? 900 : 1500, t + dur * .5); lp.frequency.linearRampToValueAtTime(300, t + dur);
  n.connect(lp); lp.connect(mg);
  [1, 1.5, 2.01].forEach(function (k, i) { var o = ctx.createOscillator(), og = ctx.createGain(); o.type = i ? 'sine' : 'triangle';
    o.frequency.setValueAtTime(base * k * 1.04, t); o.frequency.linearRampToValueAtTime(base * k * .95, t + dur);
    og.gain.value = [.5, .22, .12][i]; o.connect(og); og.connect(mg); o.start(t); o.stop(t + dur + .1); });
  mg.connect(p); p.connect(out); }

/* 3. голос Леры: фразы по событиям холла. Нет файла - GOLOS молча идёт дальше */
var SEEN = 'kursy_holl_privet';
function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
var said = {}, q = [];
function say(name, then) { var G = window.GOLOS; if (!G || !G.play) { if (then) then(); return; }
  G.play('holl/' + name + '.mp3', { onend: function () { if (then) setTimeout(then, 350); } }); }
function once(name, then) { if (said[name]) return; said[name] = 1; say(name, then); }

/* что сейчас: холл открыт, ученик в холле (не в лифте/комнате) */
function inHall() { return D.body.classList.contains('sh-holl') && !D.body.classList.contains('sh-rd') && !(window.KURS_ZAGRUZKA && KURS_ZAGRUZKA.on); }
function hk() { return window.KOMNATA_OKNO && KOMNATA_OKNO.hall; }
function allDone() { var I = window.VZ_KURS_INFO, K = window.VZ_KURS; try { return !!(K && K.mods && I && K.mods.every(function (m) { return m.tasks.every(function (t) { return I.task(t) === 'done'; }); })); } catch (e) { return false; } }

var was = false, greeted = false, nextShip = 0, menuSeen = false, lastSt = '';
function onEnter() {   /* ученик появился в холле */
  var first = !greeted; greeted = true; appear();
  setTimeout(function () { if (!inHall()) return;
    if (allDone()) { once('vse'); return; }
    if (first && !lsG(SEEN)) { lsS(SEEN, '1'); once('privet', function () { if (inHall() && hk() && hk().state() !== 'menu') once('lift'); }); }
    else if (!said.snova) once('snova'); }, 1300); }
setInterval(function () {
  var h = inHall();
  if (h && !was) { if (ready()) onEnter(); else pendEnter = true; }
  was = h;
  if (!h) return;
  var st = hk() && hk().state ? hk().state() : '';
  if (st === 'menu' && lastSt !== 'menu' && !menuSeen) { menuSeen = true; if (!allDone()) once('etazh'); }
  lastSt = st;
  var now = Date.now(); if (!nextShip) nextShip = now + 9000 + Math.random() * 9000;
  if (now > nextShip) { nextShip = now + 16000 + Math.random() * 22000; ship(); }
}, 250);
/* звук включается только после первого нажатия (правило браузеров): тогда и приветствие */
var pendEnter = false;
function gesture() { unlock(); if (pendEnter && inHall()) { pendEnter = false; setTimeout(function () { if (ready()) onEnter(); }, 60); } }
['pointerdown', 'keydown', 'touchend'].forEach(function (t) { addEventListener(t, gesture, true); });
/* закрытый этаж: shkola.js показывает "Этот этаж откроет педагог" - говорим то же голосом */
function watchToast() { var t = D.getElementById('toast'); if (!t) return;
  new MutationObserver(function () { if (t.classList.contains('show') && /откроет педагог/.test(t.textContent) && (!said.zakryt || Date.now() - said.zakryt > 15000)) { said.zakryt = Date.now(); say('zakryt'); } })
    .observe(t, { attributes: true, attributeFilter: ['class'] }); }
if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', watchToast); else watchToast();

window.HOLL_ZVUKI = { appear: appear, ship: ship, say: say, get ctx() { return ctx; }, get out() { return out; } };
})();
