/* akb-komnata.js - модуль 3 "Аккумуляторная лаборатория" (проба 09.11.2026).
   Комната, в которой ходим от первого лица: большой монитор с лекцией, стол с заданиями про АКБ, зарядная станция,
   шкаф хранения с песком и огнетушителем, кресло-симулятор, экраны заданий модуля на стойках.
   Нужны: three.min.js, RoomEnvironment.js, komnata.js, akb-teoriya.js, akb-stol.js, akb-zaryadka.js, golos.js. */
(function () {
'use strict';
var T = THREE, A = '#ffd36e', CY = '#7cf3ff', PK = '#ff7ce0', GR = '#9dff7c', OR = '#ff9f5a', VI = '#a78bfa';
var U = window.AKB_PIC.util;
var CFG = window.KURSY || {};
function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
/* детям или подробнее: класс из входа ученика (5-6 и младше - детям), выбор ученика помнится */
function cls() { try { var p = JSON.parse(lsG(CFG.meKey || 'kursy_fpv_me') || 'null'); return (p && parseInt(p.cls, 10)) || 0; } catch (e) { return 0; } }
var KEYV = (CFG.store || 'kursy') + '_m3_ver';
var VER = lsG(KEYV) || (cls() > 0 && cls() <= 6 ? 'kid' : 'big');
if (/[?&]v=kid/.test(location.search)) VER = 'kid'; if (/[?&]v=big/.test(location.search)) VER = 'big';
window.AKB_VER = function (v) { if (v) { VER = v; lsS(KEYV, v); document.dispatchEvent(new CustomEvent('akb-ver')); } return VER; };

/* задания модуля 3 (в курсе берутся из движка курса; здесь запасной список) */
var TASKS = [
  ['akb_inside', 'АКБ на пальцах'], ['akb_volt', 'Вольты одной банки'], ['fly_sim1', 'Полёт: следим за временем'],
  ['akb_count', 'Считаем всю АКБ'], ['akb_cap', 'Ёмкость и токоотдача'], ['fly_sim2', 'Полёт: плавный газ'],
  ['akb_label', 'Читаем наклейку'], ['akb_care', 'Зарядка и хранение'], ['fly_mob', 'Полёт на Mobula 7 с тренером'],
  ['akb_rep', 'Повторение'], ['akb_final', 'Итог модуля']];
var HOST = null; try { if (parent !== window && parent.VZ_KURS_INFO && parent.KURS_KOMNATA) HOST = parent; } catch (e) {}
function exitRoom() { if (HOST) try { HOST.KURS_KOMNATA.close(); return; } catch (e) {} toast('Здесь выход на карту курса'); }
try { if (HOST && HOST.VZ_KURS) TASKS = TASKS.map(function (t) { var L = HOST.VZ_KURS.lib[t[0]]; return [t[0], L ? L.t : t[1]]; }); } catch (e) {}
function taskState(tid) { try { if (HOST) return HOST.VZ_KURS_INFO.task(tid); } catch (e) {} var d = JSON.parse(lsG('akb_demo_done') || '[]'); return d.indexOf(tid) >= 0 ? 'done' : 'open'; }

var R = KOMNATA.create({ canvas: document.getElementById('c'), ui: document.getElementById('ui'), size: [16, 12, 4.6], color: A,
  start: [8, 10.6], look: [8, 2.0, 0], exposure: .9, bg: '#05060d' });
window.AKB_R = R;
var sc = R.scene, W = R.W, D = R.D, H = R.H;

/* ---------- материалы ---------- */
function std(col, r, m, em, ei) { return new T.MeshStandardMaterial({ color: col, roughness: r == null ? .6 : r, metalness: m || 0, emissive: em || '#000', emissiveIntensity: ei == null ? 1 : ei, envMapIntensity: .35 }); }
function neon(col, k) { return new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k || 1.6), toneMapped: false }); }
function box(w, h, d, mat, x, y, z, par) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (par || sc).add(m); return m; }
function cyl(r1, r2, h, mat, x, y, z, par, seg) { var m = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 20), mat); m.position.set(x, y, z); (par || sc).add(m); return m; }
function grp(x, y, z, ry) { var g = new T.Group(); g.position.set(x, y || 0, z); g.rotation.y = ry || 0; sc.add(g); return g; }

/* ---------- пол, стены, потолок ---------- */
var floorTex = R.tex(1024, 1024, function (c, w, h) { c.fillStyle = '#15172a'; c.fillRect(0, 0, w, h);
  for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#181b31' : '#141629'; c.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); }
  c.strokeStyle = '#262a4a'; c.lineWidth = 3; for (var k = 0; k <= 8; k++) { c.beginPath(); c.moveTo(k * 128, 0); c.lineTo(k * 128, h); c.stroke(); c.beginPath(); c.moveTo(0, k * 128); c.lineTo(w, k * 128); c.stroke(); } });
floorTex.wrapS = floorTex.wrapT = T.RepeatWrapping; floorTex.repeat.set(W / 4, D / 4);
var floor = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ map: floorTex, roughness: .32, metalness: .35, envMapIntensity: .3 }));
floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, D / 2); floor.userData.floor = true; sc.add(floor);

var wallTex = R.tex(512, 512, function (c, w, h) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b1e38'); g.addColorStop(1, '#23274a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#0e1024'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6); c.strokeStyle = '#2f3463'; c.lineWidth = 2; c.strokeRect(14, 14, w - 28, h - 28);
  c.fillStyle = '#2b305a'; for (var i = 0; i < 6; i++) c.fillRect(40 + i * 14, h - 50, 6, 20); });
wallTex.wrapS = wallTex.wrapT = T.RepeatWrapping;
function wall(w, h, x, y, z, ry, rep) { var t = wallTex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep || w / 2, h / 2.3);
  var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: t, roughness: .75, metalness: .1, envMapIntensity: .25 })); m.position.set(x, y, z); m.rotation.y = ry; sc.add(m); return m; }
wall(W, H, W / 2, H / 2, 0, 0);                 /* задняя (монитор) */
wall(W, H, W / 2, H / 2, D, Math.PI);           /* передняя (дверь) */
wall(D, H, W, H / 2, D / 2, -Math.PI / 2);      /* правая (зарядка) */
/* левая стена с окнами в космос */
var WX0 = 5.2, WX1 = 11.4, WY0 = 1.0, WY1 = 3.7;
wall(WX0, H, 0, H / 2, WX0 / 2, Math.PI / 2, WX0 / 2); wall(D - WX1, H, 0, H / 2, (WX1 + D) / 2, Math.PI / 2, (D - WX1) / 2);
wall(WX1 - WX0, WY0, 0, WY0 / 2, (WX0 + WX1) / 2, Math.PI / 2); wall(WX1 - WX0, H - WY1, 0, (H + WY1) / 2, (WX0 + WX1) / 2, Math.PI / 2);
var space = R.tex(2048, 1024, function (c, w, h) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#04030c'); g.addColorStop(.6, '#0b0a26'); g.addColorStop(1, '#2a1640'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (var i = 0; i < 900; i++) { var x = Math.random() * w, y = Math.random() * h * .8, r = Math.random() < .06 ? 2.2 : Math.random() * 1.2; c.fillStyle = 'rgba(255,255,255,' + (.3 + Math.random() * .7) + ')'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  var n = c.createRadialGradient(w * .7, h * .3, 10, w * .7, h * .3, 420); n.addColorStop(0, 'rgba(167,139,250,.35)'); n.addColorStop(1, 'rgba(167,139,250,0)'); c.fillStyle = n; c.fillRect(0, 0, w, h);
  /* город внизу: огни зданий */
  for (var b = 0; b < 46; b++) { var bx = b * 46 + Math.random() * 20, bh = 60 + Math.random() * 180, by = h - bh; c.fillStyle = '#0d1030'; c.fillRect(bx, by, 38, bh);
    for (var wy = by + 10; wy < h - 8; wy += 16) for (var wx = bx + 5; wx < bx + 34; wx += 9) if (Math.random() < .45) { c.fillStyle = ['#ffd36e', '#7cf3ff', '#ff7ce0'][b % 3]; c.globalAlpha = .55; c.fillRect(wx, wy, 4, 6); c.globalAlpha = 1; } } });
var sky = new T.Mesh(new T.PlaneGeometry(26, 13), new T.MeshBasicMaterial({ map: space, toneMapped: false })); sky.position.set(-8, 2.2, (WX0 + WX1) / 2); sky.rotation.y = Math.PI / 2; sky.userData.noPick = true; sc.add(sky);
var glass = new T.Mesh(new T.PlaneGeometry(WX1 - WX0, WY1 - WY0), new T.MeshStandardMaterial({ color: '#8fb8ff', transparent: true, opacity: .07, roughness: .05, metalness: .9 }));
glass.position.set(0.02, (WY0 + WY1) / 2, (WX0 + WX1) / 2); glass.rotation.y = Math.PI / 2; glass.userData.through = true; sc.add(glass);
var frameM = std('#3a3f6a', .4, .7);
for (var fz = WX0; fz <= WX1 + .01; fz += (WX1 - WX0) / 3) box(.12, WY1 - WY0, .1, frameM, .05, (WY0 + WY1) / 2, fz);
box(.16, .1, WX1 - WX0, frameM, .06, WY0, (WX0 + WX1) / 2); box(.16, .1, WX1 - WX0, frameM, .06, WY1, (WX0 + WX1) / 2);
box(.5, .06, WX1 - WX0 + .2, std('#2a2e52', .5, .4), .25, WY0 - .03, (WX0 + WX1) / 2); /* подоконник */
/* потолок и светильники */
var ceil = new T.Mesh(new T.PlaneGeometry(W, D), std('#0f1122', .9)); ceil.rotation.x = Math.PI / 2; ceil.position.set(W / 2, H, D / 2); sc.add(ceil);
var lampM = neon('#fff1d6', 1.1);
[[4, 3.5], [8, 3.5], [12, 3.5], [4, 8.5], [8, 8.5], [12, 8.5]].forEach(function (p) { box(2.2, .05, .5, lampM, p[0], H - .03, p[1]); box(2.4, .08, .7, std('#2a2d48', .5, .6), p[0], H - .01, p[1]); });
/* неоновые полосы: под потолком и плинтус */
var nA = neon(A, 1.4);
box(W, .05, .05, nA, W / 2, H - .25, .04); box(W, .05, .05, nA, W / 2, H - .25, D - .04); box(.05, .05, D, nA, W - .04, H - .25, D / 2); box(.05, .05, D, nA, .04, H - .25, D / 2);
var nB = neon(A, .7);
box(W, .04, .04, nB, W / 2, .12, .03); box(.04, .04, D, nB, W - .03, .12, D / 2); box(.04, .04, D, nB, .03, .12, D / 2); box(W, .04, .04, nB, W / 2, .12, D - .03);
/* свет */
sc.add(new T.HemisphereLight('#8f9fff', '#2a1c10', .35));
var L1 = new T.PointLight('#ffe2b0', .8, 14, 2); L1.position.set(8, H - .4, 5.5); sc.add(L1);
var L2 = new T.PointLight('#ffd36e', .7, 10, 2); L2.position.set(14, 2.8, 5); sc.add(L2);
var L3 = new T.PointLight('#7cf3ff', .55, 12, 2); L3.position.set(8, 2.6, 1.2); sc.add(L3);
var L4 = new T.PointLight('#ff7ce0', .45, 9, 2); L4.position.set(13.6, 2.4, 10); sc.add(L4);

/* ---------- дверь "в город" (передняя стена) ---------- */
var door = grp(8, 0, D - .02, Math.PI);
box(2.0, 2.7, .08, std('#2a2e52', .4, .6), 0, 1.35, 0, door); box(.06, 2.7, .1, neon(A), -.97, 1.35, -.02, door); box(.06, 2.7, .1, neon(A), .97, 1.35, -.02, door); box(2, .06, .1, neon(A), 0, 2.72, -.02, door);
var doorSign = R.tex(512, 128, function (c, w, h) { c.fillStyle = '#0b0d1e'; c.fillRect(0, 0, w, h); U.txt(c, 'ВЫХОД В ГОРОД', w / 2, h / 2, 44, A); });
var ds = new T.Mesh(new T.PlaneGeometry(1.6, .4), new T.MeshBasicMaterial({ map: doorSign, toneMapped: false })); ds.position.set(0, 3.0, -.06); ds.rotation.y = Math.PI; door.add(ds);
R.item({ obj: door, name: 'Выход в город', sub: 'Вернуться на карту курса.', at: [8, D - 1.1], look: [8, 1.6, D], tagY: 3.4, act: exitRoom });

/* ---------- большой монитор с лекцией ---------- */
var MON = { w: 6.4, h: 3.6, x: 8, y: 2.45 };
var mon = grp(MON.x, 0, .06);
box(MON.w + .3, MON.h + .3, .12, std('#0a0b16', .3, .7), 0, MON.y, 0, mon);
box(MON.w + .36, .04, .14, neon(A), 0, MON.y + MON.h / 2 + .17, 0, mon); box(MON.w + .36, .04, .14, neon(A), 0, MON.y - MON.h / 2 - .17, 0, mon);
var monTex = R.tex(1600, 900, function () {});
var monScr = new T.Mesh(new T.PlaneGeometry(MON.w, MON.h), new T.MeshBasicMaterial({ map: monTex, toneMapped: false })); monScr.position.set(0, MON.y, .07); mon.add(monScr);
var slideI = 0, slideT = 0;
function slides() { return window.AKB_TEORIYA[VER]; }
function drawSlide(c, w, h, s, i, n, t) {
  var g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0c0f26'); g.addColorStop(1, '#1a1030'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(255,211,110,.08)'; c.lineWidth = 1; for (var x = 0; x < w; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (var y = 0; y < h; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.fillStyle = 'rgba(255,211,110,.12)'; c.fillRect(0, 0, w, 86);
  U.txt(c, 'ЛЕКЦИЯ · АККУМУЛЯТОРЫ', 50, 44, 30, A, 'left', 800);
  U.txt(c, VER === 'kid' ? 'ДЕТЯМ' : 'ПОДРОБНЕЕ', w - 50, 44, 28, VER === 'kid' ? GR : CY, 'right', 800);
  U.txt(c, (i + 1) + ' / ' + n, w - 250, 44, 26, '#aab', 'right', 700);
  U.txt(c, s.h, w / 2, 160, 70, '#fff', 'center', 900);
  window.AKB_PIC(c, 120, 230, w - 240, h - 380, s.pic, t);
  if (s.k) { c.font = '900 46px Manrope, sans-serif'; var tw = c.measureText(s.k).width + 60; U.rr(c, w / 2 - tw / 2, h - 120, tw, 76, 38); c.fillStyle = 'rgba(255,211,110,.16)'; c.fill(); c.strokeStyle = A; c.lineWidth = 3; c.stroke(); U.txt(c, s.k, w / 2, h - 82, 46, A); }
  for (var k = 0; k < n; k++) { c.fillStyle = k === i ? A : 'rgba(255,255,255,.2)'; c.fillRect(w / 2 - n * 22 + k * 44, h - 22, 36, 8); }
}
var monAcc = 0;
R.frame(function (dt, t) { monAcc += dt; if (monAcc < .12) return; monAcc = 0;
  var S = slides(); if (!lect.on) { slideT += .12; if (slideT > 9) { slideT = 0; slideI = (slideI + 1) % S.length; } }
  slideI = Math.min(slideI, S.length - 1);
  drawSlide(monTex.userData.x, 1600, 900, S[slideI], slideI, S.length, t); monTex.needsUpdate = true; });
var monItem = R.item({ obj: mon, name: 'Лекция об АКБ', kicker: 'Большой монитор', sub: 'Монитор всё время показывает теорию. Подойди и смотри с голосом, листай сам: детям или подробнее.',
  at: [8, 5.0], look: [8, 2.4, 0], tagY: 4.5, tagFar: 14, actLabel: 'Смотреть лекцию', act: function () { openLecture(); } });
monItem.at3 = [8, 0, .5];

/* ---------- окно лекции ---------- */
var lect = { on: false };
var LP = document.getElementById('lect');
function openLecture() { lect.on = true; slideT = 0;
  R.focus({ pos: [8, 2.45, innerWidth < innerHeight ? 9.2 : 5.6], look: [8, 2.45, 0] }, function () { LP.hidden = false; showSlide(true); }); }
function closeLecture() { lect.on = false; LP.hidden = true; if (window.GOLOS) GOLOS.stop(); R.unfocus(); }
var lpCv = LP.querySelector('canvas'), lpX = lpCv.getContext('2d'), lpAuto = true;
function showSlide(say) { var S = slides(), s = S[slideI];
  LP.querySelector('.lp-n').textContent = 'Слайд ' + (slideI + 1) + ' из ' + S.length;
  LP.querySelector('h2').textContent = s.h; LP.querySelector('p').textContent = s.p;
  LP.querySelectorAll('.lp-ver button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === VER); });
  LP.querySelector('.lp-dots').innerHTML = S.map(function (x, k) { return '<i class="' + (k === slideI ? 'on' : k < slideI ? 'd' : '') + '"></i>'; }).join('');
  LP.querySelector('.lp-prev').disabled = slideI === 0; LP.querySelector('.lp-next').textContent = slideI === S.length - 1 ? '✓' : '→';
  if (say && window.GOLOS && GOLOS.on) GOLOS.say(s.h + '. ' + s.p, { onend: function (ok) { if (ok && lpAuto && lect.on && slideI < S.length - 1) setTimeout(function () { if (lect.on && LP.querySelector('h2').textContent === s.h) { slideI++; showSlide(true); } }, 1200); } });
}
R.frame(function (dt, t) { if (LP.hidden) return; var w = lpCv.width = lpCv.clientWidth * 2, h = lpCv.height = lpCv.clientHeight * 2;
  lpX.clearRect(0, 0, w, h); var k = Math.min(w / 1200, h / 700); lpX.save(); lpX.translate((w - 1200 * k) / 2, (h - 700 * k) / 2); lpX.scale(k, k); window.AKB_PIC(lpX, 0, 0, 1200, 700, slides()[slideI].pic, t); lpX.restore(); });
LP.querySelector('.lp-prev').onclick = function () { if (slideI > 0) { slideI--; showSlide(true); } };
LP.querySelector('.lp-next').onclick = function () { var S = slides(); if (slideI < S.length - 1) { slideI++; showSlide(true); } else { markLecture(); closeLecture(); toast('Лекция просмотрена'); } };
LP.querySelector('.lp-x').onclick = closeLecture;
LP.querySelectorAll('.lp-ver button').forEach(function (b) { b.onclick = function () { AKB_VER(b.dataset.v); slideI = 0; showSlide(true); }; });
LP.querySelector('.lp-snd').onclick = function () { if (!window.GOLOS) return; GOLOS.setOn(!GOLOS.on); this.textContent = GOLOS.on ? '🔊' : '🔇'; if (GOLOS.on) showSlide(true); };
var sw0 = null; LP.addEventListener('touchstart', function (e) { sw0 = e.touches[0].clientX; }, { passive: true });
LP.addEventListener('touchend', function (e) { if (sw0 == null) return; var dx = e.changedTouches[0].clientX - sw0; sw0 = null; if (Math.abs(dx) > 60) (dx < 0 ? LP.querySelector('.lp-next') : LP.querySelector('.lp-prev')).click(); });
function markLecture() { lsS((CFG.store || 'kursy') + '_m3_lect', '1'); }
R.onEsc = function () { if (!LP.hidden) closeLecture(); else if (window.AKB_STOL && AKB_STOL.on) AKB_STOL.close(); else if (window.AKB_ZAR && AKB_ZAR.on) AKB_ZAR.close(); };

/* ---------- стол АКБ (центр) ---------- */
var TB = { x: 8, z: 5.4, w: 4.4, d: 1.7, h: .92 };
var table = grp(TB.x, 0, TB.z);
var legM = std('#3a3f66', .35, .8);
[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { box(.08, TB.h, .08, legM, s[0] * (TB.w / 2 - .12), TB.h / 2, s[1] * (TB.d / 2 - .12), table); });
box(TB.w, .06, TB.d, std('#2b2f52', .35, .5), 0, TB.h, 0, table);
var mat = box(TB.w - .3, .012, TB.d - .3, std('#071417', 1, 0), 0, TB.h + .036, 0, table); /* антистатический коврик */
box(TB.w, .03, .03, neon(A, 1.2), 0, TB.h - .02, TB.d / 2 + .005, table);
box(TB.w - .4, .14, .04, std('#1a1d38', .5, .5), 0, TB.h + .1, -TB.d / 2 + .02, table); /* бортик сзади */
/* голограмма-АКБ над столом */
var holo = new T.Group(); holo.position.set(0, TB.h + .95, 0); table.add(holo);
var hm = new T.MeshBasicMaterial({ color: new T.Color(A).multiplyScalar(1.3), wireframe: true, transparent: true, opacity: .55, toneMapped: false });
for (var hi = 0; hi < 4; hi++) { var cell = new T.Mesh(new T.BoxGeometry(.42, .07, .26), hm); cell.position.y = -0.15 + hi * .1; holo.add(cell); }
var hring = new T.Mesh(new T.TorusGeometry(.42, .008, 6, 48), neon(A, 1.6)); hring.rotation.x = Math.PI / 2; hring.position.y = -.28; holo.add(hring);
var hbeam = new T.Mesh(new T.CylinderGeometry(.42, .2, .5, 24, 1, true), new T.MeshBasicMaterial({ color: A, transparent: true, opacity: .08, side: T.DoubleSide, depthWrite: false })); hbeam.position.y = -.5; holo.add(hbeam);
R.frame(function (dt, t) { holo.rotation.y += dt * .6; holo.children.forEach(function (ch, i) { if (i < 4) ch.position.y = -0.15 + i * (.1 + .03 * Math.sin(t * 1.5)); }); });
/* мелочи на столе: лампа, коробка, лупа (сами игры ставят свои предметы) */
var lamp = new T.Group(); lamp.position.set(-TB.w / 2 + .3, TB.h + .03, -TB.d / 2 + .3); table.add(lamp);
cyl(.1, .12, .03, std('#333a66', .4, .7), 0, .015, 0, lamp); box(.025, .55, .025, std('#555c90', .3, .8), 0, .3, 0, lamp);
var lh = cyl(.04, .11, .12, std('#ffd36e', .5, .3, '#ffd36e', .3), .12, .58, 0, lamp); lh.rotation.z = -.9;
R.block(TB.x - TB.w / 2, TB.z - TB.d / 2, TB.x + TB.w / 2, TB.z + TB.d / 2);
window.AKB_TABLE = { g: table, x: TB.x, z: TB.z, y: TB.h + .045, w: TB.w, d: TB.d, holo: holo };
R.item({ obj: table, name: 'Стол АКБ', kicker: 'Задания руками', sub: 'Собери аккумулятор из банок, проверь тестером, прочитай наклейку, реши, куда положить АКБ.',
  at: [8, 7.0], look: [8, .9, 5.3], tagY: 2.3, actLabel: 'К столу', act: function () { if (window.AKB_STOL) AKB_STOL.open(); } });

/* ---------- зарядная станция (правая стена) ---------- */
var ZB = { x: W - .45, z: 5.0, w: .9, d: 3.0, h: .92 };
var bench = grp(ZB.x, 0, ZB.z);
box(ZB.w, .06, ZB.d, std('#3b2e22', .5, .2), 0, ZB.h, 0, bench); /* верх как негорючая плита */
box(ZB.w, ZB.h - .06, ZB.d, std('#22264a', .6, .4), 0, (ZB.h - .06) / 2, 0, bench);
box(.03, .03, ZB.d, neon(OR, 1.2), -ZB.w / 2 - .005, ZB.h - .02, 0, bench);
var peg = R.tex(512, 512, function (c, w, h) { c.fillStyle = '#1e2242'; c.fillRect(0, 0, w, h); c.fillStyle = '#0b0d1e'; for (var i = 16; i < w; i += 32) for (var j = 16; j < h; j += 32) { c.beginPath(); c.arc(i, j, 4, 0, 7); c.fill(); } });
var pb = new T.Mesh(new T.PlaneGeometry(ZB.d, 1.4), std('#ffffff', .8)); pb.material.map = peg; pb.position.set(ZB.w / 2 - .02, ZB.h + 1.0, 0); pb.rotation.y = -Math.PI / 2; bench.add(pb);
var zSign = R.tex(1024, 200, function (c, w, h) { c.fillStyle = '#0b0d1e'; c.fillRect(0, 0, w, h); U.txt(c, '⚡ ЗАРЯДНАЯ СТАНЦИЯ', w / 2, 70, 64, OR); U.txt(c, 'заряжаем только под присмотром', w / 2, 150, 36, '#ffe3c8', 'center', 700); });
var zs = new T.Mesh(new T.PlaneGeometry(2.4, .47), new T.MeshBasicMaterial({ map: zSign, toneMapped: false })); zs.position.set(ZB.w / 2 - .04, ZB.h + 1.95, 0); zs.rotation.y = -Math.PI / 2; bench.add(zs);
/* жёлто-чёрная разметка на полу у зарядки */
var hz = R.tex(512, 64, function (c, w, h) { for (var i = -2; i < 20; i++) { c.fillStyle = i % 2 ? '#111' : '#e6b800'; c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32 + 32, 0); c.lineTo(i * 32 + 64, h); c.lineTo(i * 32 + 32, h); c.fill(); } });
var hzm = new T.Mesh(new T.PlaneGeometry(ZB.d + .6, .12), new T.MeshStandardMaterial({ map: hz, roughness: .6 })); hzm.rotation.x = -Math.PI / 2; hzm.rotation.z = Math.PI / 2; hzm.position.set(W - 1.6, .006, ZB.z); sc.add(hzm);
R.block(W - ZB.w, ZB.z - ZB.d / 2, W, ZB.z + ZB.d / 2);
window.AKB_BENCH = { g: bench, x: ZB.x, z: ZB.z, y: ZB.h + .03 };
R.item({ obj: bench, name: 'Зарядная станция', kicker: 'Урок на зарядке', sub: 'Зарядка ViFly WhoopStor 3: две кнопки, ток, вольты, заряд и хранение АКБ 1S, как у Mobula 7.',
  at: [W - 2.2, ZB.z], look: [W - .5, 1.0, ZB.z], tagY: 2.6, actLabel: 'Заряжать', act: function () { if (window.AKB_ZAR) AKB_ZAR.open(); } });

/* ---------- шкаф хранения, песок, огнетушитель (левая стена, у монитора) ---------- */
var cab = grp(.45, 0, 2.6);
box(.85, 2.0, 1.6, std('#5a2420', .45, .6), 0, 1.0, 0, cab);
box(.02, 1.9, .76, std('#6c2c26', .4, .6), .435, 1.0, -.39, cab); box(.02, 1.9, .76, std('#6c2c26', .4, .6), .435, 1.0, .39, cab);
box(.04, .25, .04, std('#ddd', .2, .9), .46, 1.05, -.08, cab); box(.04, .25, .04, std('#ddd', .2, .9), .46, 1.05, .08, cab);
var cabSign = R.tex(512, 256, function (c, w, h) { c.fillStyle = '#e6b800'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = '900 52px Manrope, sans-serif'; c.textAlign = 'center'; c.fillText('ХРАНЕНИЕ АКБ', w / 2, 100); c.font = '800 40px Manrope, sans-serif'; c.fillText('3,8 В на банку', w / 2, 170); c.fillText('🔥 негорючий шкаф', w / 2, 225); });
var csn = new T.Mesh(new T.PlaneGeometry(.9, .45), new T.MeshBasicMaterial({ map: cabSign })); csn.position.set(.45, 1.65, 0); csn.rotation.y = Math.PI / 2; cab.add(csn);
var bucket = cyl(.2, .16, .34, std('#c0392b', .5, .3), 1.05, .17, 4.0); cyl(.18, .18, .02, std('#d8c39a', 1), 1.05, .33, 4.0);
var bsign = R.tex(256, 96, function (c, w, h) { c.fillStyle = '#c0392b'; c.fillRect(0, 0, w, h); U.txt(c, 'ПЕСОК', w / 2, h / 2, 48, '#fff'); });
var bs = new T.Mesh(new T.PlaneGeometry(.3, .11), new T.MeshBasicMaterial({ map: bsign })); bs.position.set(1.05, .2, 4.205); sc.add(bs);
var ext = cyl(.09, .09, .55, std('#d0281e', .35, .4), .22, .55, 4.6); cyl(.04, .05, .12, std('#222', .4, .6), .22, .88, 4.6);
R.block(0, 1.8, .9, 3.4); R.block(.8, 3.75, 1.3, 4.25);
R.item({ obj: cab, name: 'Шкаф хранения', kicker: 'Куда положить АКБ', sub: 'Реши, что делать с каждой АКБ: на хранение, остыть, на зарядку или отдать тренеру.',
  at: [2.0, 2.6], look: [.5, 1.2, 2.6], tagY: 2.5, actLabel: 'Разобрать АКБ', act: function () { if (window.AKB_STOL) AKB_STOL.open('store'); } });

/* полка с АКБ и коробками у монитора справа */
var shelf = grp(W - .3, 0, 1.0);
for (var sy = 0; sy < 3; sy++) box(.5, .04, 1.4, std('#3a3f66', .4, .7), 0, .7 + sy * .55, 0, shelf);
box(.04, 1.9, .04, legM, -.23, .95, -.68, shelf); box(.04, 1.9, .04, legM, -.23, .95, .68, shelf);
var BC = ['#2b3358', '#5a2a5a', '#2a4a3a', '#4a3a22'];
for (var bi = 0; bi < 9; bi++) { var bx = box(.22, .08, .14, std(BC[bi % 4], .5, .2), -.05, .76 + Math.floor(bi / 3) * .55, -.45 + (bi % 3) * .42, shelf); bx.rotation.y = (bi % 2) * .2; }
R.block(W - .6, .2, W, 1.8);

/* ---------- кресло-симулятор (правый передний угол) ---------- */
var sim = grp(13.4, 0, 10.2, Math.PI * .82);
box(.6, .45, .6, std('#20243f', .5, .5), 0, .25, 0, sim); box(.6, .7, .12, std('#2c3156', .5, .4), 0, .8, .3, sim);
box(.62, .1, .64, std('#12152a', .6), 0, .52, 0, sim);
var simTex = R.tex(800, 450, function (c, w, h) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3d7fd6'); g.addColorStop(.6, '#bfe2ff'); g.addColorStop(.6, '#3d6b3c'); g.addColorStop(1, '#2a4a2a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#ffd36e'; c.lineWidth = 8; c.beginPath(); c.ellipse(w * .55, h * .5, 70, 90, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(w * .3, h * .55, 40, 52, 0, 0, 7); c.stroke();
  U.txt(c, 'СИМУЛЯТОР', 110, 36, 30, '#fff'); U.txt(c, '3,82 В', w - 90, 36, 30, '#9dff7c'); U.txt(c, '01:24', w - 90, 76, 28, '#fff'); });
var sst = new T.Group(); sst.position.set(0, 0, -1.0); sim.add(sst);
box(.06, 1.1, .06, legM, 0, .55, 0, sst); var simScr = new T.Mesh(new T.PlaneGeometry(1.5, .85), new T.MeshBasicMaterial({ map: simTex, toneMapped: false })); simScr.position.set(0, 1.35, .04); sst.add(simScr);
box(1.6, .95, .05, std('#0a0b16', .3, .7), 0, 1.35, 0, sst);
var pult = box(.24, .06, .14, std('#222', .4, .5), 0, .62, -.28, sim);
R.block(12.6, 9.0, 14.4, 11.4);
R.item({ obj: sim, name: 'Кресло-симулятор', kicker: 'Полёты модуля', sub: 'Здесь полёты в симуляторе: следим за временем и вольтами, учимся плавному газу.',
  at: [12.4, 8.6], look: [13.4, 1.0, 10.2], tagY: 2.3, actLabel: 'Сесть', act: function () { openTask(taskState('fly_sim1') === 'done' ? 'fly_sim2' : 'fly_sim1'); } });

/* ---------- экраны заданий на стойках ---------- */
var SPOS = [[4.4, 1.9, 0], [11.6, 1.9, 0], [12.0, 7.6, -2.3], [11.3, 6.9, -1.0], [4.7, 6.9, 1.0], [14.8, 7.8, -2.8],
  [8.0, 3.4, 0], [13.0, 2.4, -1.2], [3.2, 10.3, 2.4], [2.4, 6.4, 1.5], [5.6, 10.9, 2.9]];
var stands = [];
TASKS.forEach(function (tk, i) { var p = SPOS[i]; stands.push(stand(i, tk, p[0], p[1], p[2])); });
function stand(i, tk, x, z, ry) {
  var g = grp(x, 0, z, ry), st = taskState(tk[0]);
  box(.7, .05, .34, std('#2a2e52', .4, .6), 0, .025, 0, g);
  box(.04, 1.3, .04, legM, -.4, .65, 0, g); box(.04, 1.3, .04, legM, .4, .65, 0, g);
  var tex = R.tex(512, 320, function () {}); var scr = new T.Mesh(new T.PlaneGeometry(.96, .6), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.set(0, 1.55, .03); g.add(scr);
  box(1.02, .66, .04, std('#0a0b16', .3, .7), 0, 1.55, 0, g);
  var rim = box(1.06, .02, .05, neon(A), 0, 1.89, 0, g);
  box(.012, .22, .012, legM, 0, 1.98, 0, g); var bulb = new T.Mesh(new T.SphereGeometry(.03, 10, 8), neon(A, 2)); bulb.position.set(0, 2.1, 0); g.add(bulb);
  var s = { i: i, tid: tk[0], t: tk[1], g: g, tex: tex, rim: rim, bulb: bulb, st: st };
  s.draw = function () { var c = tex.userData.x, w = 512, h = 320, col = s.st === 'done' ? GR : s.st === 'wait' ? '#ffd36e' : s.st === 'lock' ? '#555a80' : A;
    c.fillStyle = '#0b0d1e'; c.fillRect(0, 0, w, h); c.fillStyle = col; c.globalAlpha = .18; c.fillRect(0, 0, w, 70); c.globalAlpha = 1;
    U.txt(c, 'ЗАДАНИЕ ' + (i + 1), 24, 36, 34, col, 'left', 900); U.txt(c, s.st === 'done' ? '✓' : s.st === 'lock' ? '🔒' : s.st === 'wait' ? '⏳' : '', w - 30, 36, 34, col, 'right');
    var words = s.t.split(' '), lines = [''], k = 0; c.font = '800 40px Manrope, sans-serif';
    words.forEach(function (wd) { if (c.measureText(lines[k] + ' ' + wd).width > w - 50 && lines[k]) { lines[++k] = wd; } else lines[k] = (lines[k] ? lines[k] + ' ' : '') + wd; });
    lines.slice(0, 3).forEach(function (ln, j) { U.txt(c, ln, w / 2, 130 + j * 50, 40, '#fff', 'center', 800); });
    U.txt(c, s.st === 'done' ? 'пройдено' : s.st === 'wait' ? 'ждёт тренера' : s.st === 'lock' ? 'закрыто' : 'нажми, чтобы начать', w / 2, h - 34, 26, col, 'center', 700);
    tex.needsUpdate = true; s.rim.material = neon(col); s.bulb.material = neon(col, 2); };
  s.draw();
  s.item = R.item({ obj: g, name: (i + 1) + '. ' + tk[1], kicker: 'Задание ' + (i + 1), sub: 'Открыть задание модуля 3.', at: [x + Math.sin(ry) * 1.2, z + Math.cos(ry) * 1.2], look: [x, 1.5, z], tagY: 2.35, tagFar: 5.5,
    actLabel: 'Начать задание', state: st === 'done' ? 'done' : '', act: function () { openTask(tk[0]); } });
  s.item.at3 = [x, 0, z];
  R.block(x - .45, z - .25, x + .45, z + .25);
  return s;
}
function refreshStands() { var nx = null; stands.forEach(function (s) { s.st = taskState(s.tid); s.draw(); s.item.state = s.st === 'done' ? 'done' : ''; if (!nx && s.st === 'open') nx = s; R.setTag(s.item); });
  R.setNext(nx ? nx.item : null); nextBar(nx); }
R.frame(function (dt, t) { if (R.next) { var s = stands.find(function (x) { return x.item === R.next; }); if (s) s.bulb.scale.setScalar(1 + .5 * Math.abs(Math.sin(t * 3))); } });
/* маяк "сюда" над следующим заданием */
var beacon = new T.Mesh(new T.ConeGeometry(.12, .24, 4), neon(A, 2)); beacon.rotation.x = Math.PI; sc.add(beacon);
R.frame(function (dt, t) { var s = R.next && stands.find(function (x) { return x.item === R.next; }); beacon.visible = !!s && R.mode === 'walk';
  if (s) { beacon.position.set(s.g.position.x, 2.55 + Math.sin(t * 3) * .08, s.g.position.z); beacon.rotation.y = t * 2; } });

/* ---------- нижняя строка "Дальше" ---------- */
var NB = document.getElementById('nextb');
function nextBar(s) { if (!s) { NB.hidden = true; return; } NB.hidden = false; NB.querySelector('b').textContent = 'Задание ' + (s.i + 1) + '. ' + s.t;
  NB.querySelector('button').onclick = function () { R.walkTo(s.item.at[0], s.item.at[1], s.item); }; }

/* ---------- открыть задание ---------- */
function openTask(tid) {
  if (HOST) { try { if (HOST.KURS_KOMNATA.task(tid)) return; } catch (e) {} }
  var s = stands.find(function (x) { return x.tid === tid; }); var dlg = document.getElementById('demo');
  dlg.querySelector('b').textContent = 'Задание ' + (s.i + 1) + '. ' + s.t; dlg.hidden = false;
  dlg.querySelector('.d-ok').onclick = function () { var d = JSON.parse(lsG('akb_demo_done') || '[]'); if (d.indexOf(tid) < 0) d.push(tid); lsS('akb_demo_done', JSON.stringify(d)); dlg.hidden = true; refreshStands(); toast('Задание засчитано (проба)'); };
  dlg.querySelector('.d-no').onclick = function () { dlg.hidden = true; };
}
window.AKB_TASK = openTask;

/* ---------- мелочи ---------- */
function toast(s) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = s; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200); }
window.AKB_TOAST = toast;
document.getElementById('snd').onclick = function () { if (!window.GOLOS) return; GOLOS.setOn(!GOLOS.on); this.textContent = GOLOS.on ? '🔊' : '🔇'; };
if (window.GOLOS) document.getElementById('snd').textContent = GOLOS.on ? '🔊' : '🔇';
var volEl = document.getElementById('vol'); if (volEl) { if (window.GOLOS && GOLOS.setVol) volEl.value = Math.round(GOLOS.vol * 100); else volEl.hidden = true;
  volEl.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  volEl.addEventListener('input', function () { if (!window.GOLOS) return; GOLOS.setVol(volEl.value / 100); if (GOLOS.vol > 0 && !GOLOS.on) { GOLOS.setOn(true); document.getElementById('snd').textContent = '🔊'; } }); }
document.getElementById('back').onclick = function () { if (R.mode !== 'walk') { R.onEsc(); return; } exitRoom(); };
document.addEventListener('akb-ver', function () { slideI = 0; });
refreshStands();
/* в курсе: состояние заданий меняется в окне задания - раз в 1,5 с сверяем экраны */
var lastSt = '';
setInterval(function () { if (!HOST) return; var s2 = TASKS.map(function (t) { return taskState(t[0]); }).join(); if (s2 !== lastSt) { lastSt = s2; refreshStands(); } }, 1500);
/* подсказка управления, один раз */
var hintEl = document.getElementById('hint'); setTimeout(function () { hintEl.classList.add('off'); }, 7000);
R.frame(function () { if (R.mode !== 'walk') hintEl.classList.add('off'); });
window.AKB = { R: R, stands: stands, refresh: refreshStands, openLecture: openLecture, closeLecture: closeLecture, std: std, neon: neon, box: box, cyl: cyl };
})();
/* E/Enter и пробел не срабатывают, пока открыто окно (лекция, задание-проба, окно задания курса поверх комнаты) */
AKB.R.busy = function () { var dm = document.getElementById('demo'), lp = document.getElementById('lect');
  if ((dm && !dm.hidden) || (lp && !lp.hidden)) return true;
  try { var w = parent !== window && parent.document.getElementById('win'); if (w && w.classList.contains('on')) return true; } catch (e) {}
  return false; };
