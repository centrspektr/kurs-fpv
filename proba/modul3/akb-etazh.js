/* akb-etazh.js - модуль 3 "Аккумуляторная" как этаж: холл, коридор и 8 комнат (проба 09.11.2026, вариант А "коридор с комнатами").
   В каждой комнате своя тема, свой экран теории и свои задания. Ходим по коридору, заходим в двери.
   Обстановка - готовые бесплатные модели (CC0): Poly Haven (настоящие предметы и текстуры) и Kenney Space Station Kit (двери коридора).
   Список авторов - modeli/AVTORY.md.
   Нужны: three.min.js, GLTFLoader.js, RoomEnvironment.js, komnata.js, akb-teoriya.js, golos.js; после него akb-stol.js, akb-zaryadka.js. */
(function () {
'use strict';
var T = THREE, A = '#ffd36e', CY = '#7cf3ff', GR = '#9dff7c', OR = '#ff9f5a', RD = '#ff5d6c';
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

/* задания модуля 3 (в курсе названия берутся из движка курса) */
var TASKS = [
  ['akb_inside', 'АКБ на пальцах'], ['akb_volt', 'Вольты одной банки'], ['fly_sim1', 'Полёт: следим за временем'],
  ['akb_count', 'Считаем всю АКБ'], ['akb_cap', 'Ёмкость и токоотдача'], ['fly_sim2', 'Полёт: плавный газ'],
  ['akb_label', 'Читаем наклейку'], ['akb_care', 'Зарядка и хранение'], ['fly_mob', 'Полёт на Mobula 7 с тренером'],
  ['akb_rep', 'Повторение'], ['akb_final', 'Итог модуля']];
var HOST = null; try { if (parent !== window && parent.VZ_KURS_INFO && parent.KURS_KOMNATA) HOST = parent; } catch (e) {}
function exitRoom() { if (HOST) try { HOST.KURS_KOMNATA.close(); return; } catch (e) {} toast('Здесь выход на карту курса'); }
try { if (HOST && HOST.VZ_KURS) TASKS = TASKS.map(function (t) { var L = HOST.VZ_KURS.lib[t[0]]; return [t[0], L ? L.t : t[1]]; }); } catch (e) {}
function taskState(tid) { try { if (HOST) return HOST.VZ_KURS_INFO.task(tid); } catch (e) {} var d = JSON.parse(lsG('akb_demo_done') || '[]'); return d.indexOf(tid) >= 0 ? 'done' : 'open'; }
function taskNo(tid) { for (var i = 0; i < TASKS.length; i++) if (TASKS[i][0] === tid) return i; return -1; }

/* ---------- план этажа (метры) ----------
   холл x 0..8 (вся глубина), коридор x 8..40, z 7..10.2; комнаты 8 x 7: северные z 0..7, южные z 10.2..17.2.
   Комнаты по номерам идут зигзагом: 1 - север, 2 - юг напротив, 3 - север дальше... */
var W = 40, D = 17.2, H = 3.2, CZ0 = 7, CZ1 = 10.2, CZM = (CZ0 + CZ1) / 2, LX = 8, RW = 8, RD7 = 7;
var ROOMS = [
  { id: 'N0', n: 'Устройство АКБ', tasks: ['akb_inside'], pics: { kid: ['tank', 'types', 'rulet'], big: ['tank', 'types', 'rulet'] } },
  { id: 'S0', n: 'Лаборатория', tasks: ['akb_volt', 'akb_count'], pics: { kid: ['stack', 'hv', 'scale'], big: ['stack', 'hv', 'sag'] } },
  { id: 'N1', n: 'Симулятор', tasks: ['fly_sim1', 'fly_sim2'], pics: { kid: ['scale', 'stack'], big: ['sag', 'stack'] } },
  { id: 'S1', n: 'Склад АКБ', tasks: ['akb_cap', 'akb_label'], pics: { kid: ['types', 'stack', 'hv'], big: ['crate', 'stack', 'hv'] } },
  { id: 'N2', n: 'Зарядная', tasks: ['akb_care'], pics: { kid: ['charge', 'store', 'swell', 'smoke'], big: ['balance', 'charge', 'store', 'swell', 'smoke'] } },
  { id: 'S2', n: 'Полётный зал', tasks: ['fly_mob'], pics: { kid: ['scale', 'charge'], big: ['sag', 'store'] } },
  { id: 'N3', n: 'Повторение', tasks: ['akb_rep'], pics: 'all' },
  { id: 'S3', n: 'Экзамен', tasks: ['akb_final'], pics: 'all' }];
ROOMS.forEach(function (r, k) { r.k = k; r.no = k + 1; r.south = r.id[0] === 'S'; r.i = +r.id[1]; r.ox = LX + r.i * RW; r.dx = r.ox + RW / 2;
  r.z0 = r.south ? CZ1 : 0; r.z1 = r.south ? D : CZ0; r.dz = r.south ? CZ1 : CZ0;
  r.inP = [r.dx, r.south ? CZ1 + 1.1 : CZ0 - 1.1]; r.outP = [r.dx, CZM]; });
function roomById(id) { for (var i = 0; i < ROOMS.length; i++) if (ROOMS[i].id === id) return ROOMS[i]; return null; }
function region(x, z) { if (x < LX) return 'L'; if (z >= CZ0 && z <= CZ1) return 'C'; var i = Math.max(0, Math.min(3, Math.floor((x - LX) / RW))); return (z < CZ0 ? 'N' : 'S') + i; }
/* местные координаты комнаты: u - вдоль двери (0..8, слева направо, если стоять в двери лицом в комнату), v - вглубь от двери (0..7) */
function P(r, u, v) { return r.south ? [r.ox + RW - u, CZ1 + v] : [r.ox + u, CZ0 - v]; }
function RY(r, a) { return (a || 0) + (r.south ? Math.PI : 0); } /* поворот: a=0 - предмет смотрит на дверь */

var R = KOMNATA.create({ canvas: document.getElementById('c'), ui: document.getElementById('ui'), size: [W, D, H], color: A,
  start: [4, 15], look: [6.2, 1.5, 4], exposure: 1.0, bg: '#0b0f16', eye: 1.6 });
window.AKB_R = R;
var sc = R.scene, ENV = sc.environment;

/* ---------- материалы ---------- */
function col(c) { return new T.Color(c).convertSRGBToLinear(); }
function std(c, r, m, em, ei) { var mt = new T.MeshStandardMaterial({ color: col(c), roughness: r == null ? .6 : r, metalness: m || 0, emissive: em ? col(em) : new T.Color(0), emissiveIntensity: ei == null ? 1 : ei });
  if (ENV) { mt.envMap = ENV; mt.envMapIntensity = .5; } return mt; }
function neon(c, k) { return new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k || 1.4), toneMapped: false }); }
function box(w, h, d, mat, x, y, z, par) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (par || sc).add(m); return m; }
function cyl(r1, r2, h, mat, x, y, z, par, seg) { var m = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 20), mat); m.position.set(x, y, z); (par || sc).add(m); return m; }
function grp(x, y, z, ry) { var g = new T.Group(); g.position.set(x, y || 0, z); g.rotation.y = ry || 0; sc.add(g); return g; }
function plane(w, h, mat, x, y, z, ry, rx) { var m = new T.Mesh(new T.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0, 'YXZ'); sc.add(m); return m; }
var TL = new T.TextureLoader();
function ptex(name, rx, ry) { function t(k, lin) { var x = TL.load('tekstury/' + name + '_' + k + '.jpg'); x.wrapS = x.wrapT = T.RepeatWrapping; x.repeat.set(rx, ry); x.anisotropy = 4; if (!lin) x.encoding = T.sRGBEncoding; return x; }
  var m = new T.MeshStandardMaterial({ map: t('diff'), normalMap: t('nor', 1), roughnessMap: t('rough', 1), roughness: 1, metalness: 0 }); if (ENV) { m.envMap = ENV; m.envMapIntensity = .45; } return m; }

/* ---------- готовые модели (GLTF) ---------- */
var GL = new T.GLTFLoader(), cache = {}, pend = 0;
var MOD = { desk: 'metal_office_desk', lamp: 'desk_lamp_arm_01', mmeter: 'retro_multimeter', stool: 'metal_stool_01', cart: 'tool_cart', shelf: 'steel_frame_shelves_01',
  crate: 'plastic_crate_01', cbox: 'cardboard_box_01', chest: 'metal_tool_chest', pbox: 'power_box_01', clock: 'wall_clock', flu: 'mounted_fluorescent_lights', schair: 'SchoolChair_01' };
function modelUrl(k) { if (k.indexOf('kenney/') === 0) return 'modeli/' + k + '.glb'; return 'modeli/' + MOD[k] + '/' + MOD[k] + '_1k.gltf'; }
function load(k, cb) { if (cache[k] && cache[k].scene) return cb(cache[k].scene); if (cache[k]) return cache[k].q.push(cb);
  cache[k] = { q: [cb] }; pend++;
  GL.load(modelUrl(k), function (g) { var s = g.scene; s.traverse(function (m) { if (m.isMesh) { (Array.isArray(m.material) ? m.material : [m.material]).forEach(function (mt) { if (ENV) { mt.envMap = ENV; mt.envMapIntensity = .6; } }); } });
    cache[k].scene = s; cache[k].q.forEach(function (f) { f(s); }); cache[k].q = null; if (--pend === 0) loaded(); },
    null, function () { cache[k].scene = new T.Group(); cache[k].q.forEach(function (f) { f(cache[k].scene); }); if (--pend === 0) loaded(); }); }
/* поставить модель: put('desk', x, y, z, ry, s) - s число или [sx,sy,sz] */
function put(k, x, y, z, ry, s, par, cb) { var g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; (par || sc).add(g);
  load(k, function (src) { var o = src.clone(); if (Array.isArray(s)) o.scale.set(s[0], s[1], s[2]); else o.scale.setScalar(s || 1); g.add(o); if (cb) cb(o, g); }); return g; }
function putR(r, k, u, v, y, a, s, cb) { var p = P(r, u, v); return put(k, p[0], y, p[1], RY(r, a), s, null, cb); }
function loaded() { R.frame(function () {}); document.dispatchEvent(new CustomEvent('akb-loaded')); }

/* ---------- пол и потолок ---------- */
var baseFloor = R.tex(512, 512, function (c, w, h) { c.fillStyle = '#5d6478'; c.fillRect(0, 0, w, h);
  for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) { var x = i * 256, y = j * 256; c.fillStyle = '#6a7287'; c.fillRect(x + 6, y + 6, 244, 244); c.fillStyle = '#737b90'; c.fillRect(x + 26, y + 26, 204, 204);
    c.fillStyle = '#4f566a'; [[18, 18], [238, 18], [18, 238], [238, 238]].forEach(function (p) { c.fillRect(x + p[0] - 5, y + p[1] - 5, 10, 10); }); } });
baseFloor.wrapS = baseFloor.wrapT = T.RepeatWrapping;
function floorPlane(x0, z0, x1, z1, mat) { var f = plane(x1 - x0, z1 - z0, mat, (x0 + x1) / 2, 0, (z0 + z1) / 2, 0, -Math.PI / 2); f.userData.floor = true; f.receiveShadow = true; return f; }
var bfm = new T.MeshStandardMaterial({ map: baseFloor, roughness: .55, metalness: .3 }); if (ENV) { bfm.envMap = ENV; bfm.envMapIntensity = .4; }
var t1 = baseFloor.clone(); t1.needsUpdate = true; t1.repeat.set(LX / 1.6, D / 1.6); var lobbyFloor = bfm.clone(); lobbyFloor.map = t1;
var t2 = baseFloor.clone(); t2.needsUpdate = true; t2.repeat.set((W - LX) / 1.6, (CZ1 - CZ0) / 1.6); var corFloor = bfm.clone(); corFloor.map = t2;
floorPlane(0, 0, LX, D, lobbyFloor); floorPlane(LX, CZ0, W, CZ1, corFloor);
var roomFloorM = ptex('garage_floor', RW / 2.5, RD7 / 2.5);
ROOMS.forEach(function (r) { floorPlane(r.ox, r.z0, r.ox + RW, r.z1, roomFloorM); });
var ceilM = std('#d6d8dc', .9); plane(W, D, ceilM, W / 2, H, D / 2, 0, Math.PI / 2);

/* ---------- стены ---------- */
var plasterM = ptex('painted_plaster_wall', 2.2, 1.1);
var baseWallTex = R.tex(512, 512, function (c, w, h) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#c9cfe0'); g.addColorStop(1, '#b4bbd0'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#9aa2bb'; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 70, w, 70); c.fillStyle = '#e39a3b'; c.fillRect(0, h - 120, w, 34); c.fillStyle = '#a7aec5'; c.fillRect(0, 250, w, 6); c.fillStyle = '#8c94ad'; c.fillRect(w - 6, 0, 6, h); });
baseWallTex.wrapS = baseWallTex.wrapT = T.RepeatWrapping;
var baseWallM = new T.MeshStandardMaterial({ map: baseWallTex, roughness: .55, metalness: .25 }); if (ENV) { baseWallM.envMap = ENV; baseWallM.envMapIntensity = .4; }
var TH = .24;
/* стена: отрезок по x (axis 'x') или по z, у каждой стороны свой материал; matA - сторона с меньшей координатой */
function wallSeg(axis, c, a0, a1, matA, matB, y0, y1) { y0 = y0 || 0; y1 = y1 || H; var len = a1 - a0, hh = y1 - y0;
  function mk(m, side) { var mm = m === plasterM ? plasterM : m; if (m === baseWallM) { mm = baseWallM.clone(); mm.map = baseWallTex.clone(); mm.map.needsUpdate = true; mm.map.wrapS = mm.map.wrapT = T.RepeatWrapping; mm.map.repeat.set(len / 3.2, hh / H); }
    var p = new T.Mesh(new T.PlaneGeometry(len, hh), mm);
    if (axis === 'x') { p.position.set((a0 + a1) / 2, (y0 + y1) / 2, c + side * TH / 2); p.rotation.y = side < 0 ? Math.PI : 0; }
    else { p.position.set(c + side * TH / 2, (y0 + y1) / 2, (a0 + a1) / 2); p.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2; }
    p.receiveShadow = true; sc.add(p); return p; }
  if (matA) mk(matA, -1); if (matB) mk(matB, 1);
  if (y0 === 0) { if (axis === 'x') R.block(a0, c - TH / 2, a1, c + TH / 2); else R.block(c - TH / 2, a0, c + TH / 2, a1); } }
/* наружные стены */
ROOMS.forEach(function (r) { if (r.south) wallSeg('x', D + TH / 2, r.ox, r.ox + RW, plasterM, null); else wallSeg('x', -TH / 2, r.ox, r.ox + RW, null, plasterM); });
wallSeg('x', -TH / 2, 0, LX, null, baseWallM); wallSeg('x', D + TH / 2, 0, LX, baseWallM, null); wallSeg('z', -TH / 2, 0, D, null, baseWallM);
wallSeg('z', W + TH / 2, CZ0, CZ1, baseWallM, null); wallSeg('z', W + TH / 2, 0, CZ0, plasterM, null); wallSeg('z', W + TH / 2, CZ1, D, plasterM, null);
/* холл - коридор: стена x=8 по комнатам 1 и 2 (со стороны холла - база, со стороны комнат - штукатурка) */
wallSeg('z', LX, 0, CZ0, baseWallM, plasterM); wallSeg('z', LX, CZ1, D, baseWallM, plasterM);
/* перегородки между комнатами */
for (var i = 1; i < 4; i++) { wallSeg('z', LX + i * RW, 0, CZ0, plasterM, plasterM); wallSeg('z', LX + i * RW, CZ1, D, plasterM, plasterM); }
/* стены коридора с дверными проёмами (проём 1,6 м, сам блок двери 3,2 м - модель Kenney) */
var DW = 1.6, DT = 3.2, DH = 2.35;
ROOMS.forEach(function (r) { /* участок стены перед дверью этой комнаты (слева от двери по x) */
  var x0 = r.i === 0 ? LX : r.ox, x1 = r.dx - DT / 2; var zc = r.south ? CZ1 : CZ0;
  if (r.south) wallSeg('x', zc, x0, x1, baseWallM, plasterM); else wallSeg('x', zc, x0, x1, plasterM, baseWallM);
  var x2 = r.dx + DT / 2, x3 = r.ox + RW; if (r.south) wallSeg('x', zc, x2, x3, baseWallM, plasterM); else wallSeg('x', zc, x2, x3, plasterM, baseWallM);
  /* над проёмом и по бокам проёма со стороны комнаты - штукатурка */
  var sgn = r.south ? 1 : -1;
  wallSeg('x', zc, r.dx - DT / 2, r.dx - DW / 2, r.south ? null : plasterM, r.south ? plasterM : null);
  wallSeg('x', zc, r.dx + DW / 2, r.dx + DT / 2, r.south ? null : plasterM, r.south ? plasterM : null);
  wallSeg('x', zc, r.dx - DW / 2, r.dx + DW / 2, r.south ? null : plasterM, r.south ? plasterM : null, DH, H);
});

/* ---------- двери коридора: блок Kenney "wall-door" + сдвижная створка "door-single" ---------- */
ROOMS.forEach(function (r) { var zc = r.south ? CZ1 : CZ0, face = r.south ? Math.PI : 0, off = r.south ? -.16 : .16;
  /* модель смотрит в коридор; 1x1 ед. -> 3,2 x 3,2 м, толщина 0,3 м */
  r.doorG = put('kenney/wall-door', r.dx, 0, zc + off * .01, face, [DT, H, 1.0]);
  var panel = new T.Group(); panel.position.set(r.dx, 0, zc); panel.rotation.y = face; sc.add(panel); r.panel = panel;
  put('kenney/door-single', 0, 0, 0, 0, [DW / .4 * .92, DH / .7 * .98, 1.0], panel);
  /* полоска состояния над дверью и табличка */
  r.lamp = box(DW + .2, .06, .05, neon(A), r.dx, DH + .2, zc + (r.south ? -.2 : .2));
  r.signTex = R.tex(768, 192, function () {});
  var sg = plane(2.4, .6, new T.MeshBasicMaterial({ map: r.signTex, toneMapped: false }), r.dx, 2.8, zc + (r.south ? -.2 : .2), face);
  r.sign = sg;
  r.doorBlock = [r.dx - DW / 2, zc - TH / 2, r.dx + DW / 2, zc + TH / 2];
  r.openK = 0; r.lockedNow = false;
});
function drawSign(r) { var c = r.signTex.userData.x, w = 768, h = 192, colr = r.state === 'done' ? GR : r.state === 'next' ? A : r.state === 'lock' ? '#8088a8' : CY;
  c.fillStyle = '#0b0d1e'; c.fillRect(0, 0, w, h); c.fillStyle = colr; c.fillRect(0, 0, 150, h);
  U.txt(c, String(r.no), 75, h / 2 + 4, 110, '#0b0d1e', 'center', 900);
  U.txt(c, r.n, 180, 70, 62, '#fff', 'left', 900);
  U.txt(c, r.state === 'done' ? '✓ пройдено' : r.state === 'next' ? '★ сюда дальше' : r.state === 'lock' ? '🔒 закрыто' : (r.tasks.length > 1 ? r.tasks.length + ' задания' : '1 задание'), 180, 145, 40, colr, 'left', 800);
  r.signTex.needsUpdate = true; r.lamp.material = neon(colr, 1.5); }
/* створка уезжает в стену, когда рядом игрок */
R.frame(function (dt) { var p = R.camera.position;
  ROOMS.forEach(function (r) { var near = !r.lockedNow && Math.abs(p.x - r.dx) < 2.2 && Math.abs(p.z - r.dz) < 2.6, k = near ? 1 : 0;
    r.openK += (k - r.openK) * Math.min(1, dt * 6); r.panel.position.x = r.dx + (r.south ? -1 : 1) * r.openK * (DW * .95); r.panel.visible = r.openK < .97; }); });
function setLocked(r, on) { if (r.lockedNow === on) return; r.lockedNow = on; var b = r.doorBlock;
  if (on) R.blocks.push(b); else { var i = R.blocks.indexOf(b); if (i >= 0) R.blocks.splice(i, 1); } }

/* ---------- свет: общий + 3 лампы, которые "переезжают" в ту часть этажа, где игрок (так быстро на телефоне) ---------- */
sc.add(new T.HemisphereLight(col('#f4f1ea'), col('#4a4640'), .55));
var PL = [0, 1, 2].map(function () { var l = new T.PointLight(col('#fff3e2'), .9, 11, 1.7); l.position.set(4, H - .25, 8); sc.add(l); return l; });
var LIGHTS = { L: [[4, 4], [4, 13], [4, CZM]], C: [[14, CZM], [24, CZM], [34, CZM]] };
ROOMS.forEach(function (r) { LIGHTS[r.id] = [P(r, 2.2, 2.3), P(r, 5.8, 2.3), P(r, 4, 5.2)]; });
var curReg = '';
R.frame(function () { var p = R.camera.position, rg = region(p.x, p.z); if (rg === curReg) return; curReg = rg;
  var L = LIGHTS[rg] || LIGHTS.C; PL.forEach(function (l, i) { l.position.set(L[i][0], H - .25, L[i][1]); l.intensity = rg === 'C' ? .75 : .95; }); });
/* светильники: в комнатах - модели ламп, в коридоре и холле - полосы */
ROOMS.forEach(function (r) { [[2.2, 2.3], [5.8, 2.3], [2.2, 5.2], [5.8, 5.2]].forEach(function (q) { var p = P(r, q[0], q[1]); put('flu', p[0], H, p[1], RY(r, Math.PI / 2), 1.1); }); });
var stripM = neon('#eef5ff', 1.15);
for (var sx = 10; sx < W; sx += 4) box(1.6, .04, .22, stripM, sx, H - .02, CZM);
[[4, 3], [4, 7], [4, 11], [4, 15]].forEach(function (q) { box(2.4, .04, .3, stripM, q[0], H - .02, q[1]); });

/* ---------- маленькие вещи для экранов ---------- */
function slidesAll() { return window.AKB_TEORIYA[VER]; }
function roomSlides(r) { var S = slidesAll(); if (!r || r.pics === 'all') return S; var want = r.pics[VER] || [];
  var out = S.filter(function (s) { return want.indexOf(s.pic) >= 0; }); return out.length ? out : S; }
function drawSlide(c, w, h, s, i, n, t, title) {
  var g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0c0f26'); g.addColorStop(1, '#1a1030'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(255,211,110,.08)'; c.lineWidth = 1; for (var x = 0; x < w; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (var y = 0; y < h; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.fillStyle = 'rgba(255,211,110,.12)'; c.fillRect(0, 0, w, 86);
  U.txt(c, title || 'ЛЕКЦИЯ · АККУМУЛЯТОРЫ', 50, 44, 30, A, 'left', 800);
  U.txt(c, VER === 'kid' ? 'ДЕТЯМ' : 'ПОДРОБНЕЕ', w - 50, 44, 28, VER === 'kid' ? GR : CY, 'right', 800);
  U.txt(c, (i + 1) + ' / ' + n, w - 250, 44, 26, '#aab', 'right', 700);
  U.txt(c, s.h, w / 2, 160, 70, '#fff', 'center', 900);
  window.AKB_PIC(c, 120, 230, w - 240, h - 380, s.pic, t);
  if (s.k) { c.font = '900 46px Manrope, sans-serif'; var tw = c.measureText(s.k).width + 60; U.rr(c, w / 2 - tw / 2, h - 120, tw, 76, 38); c.fillStyle = 'rgba(255,211,110,.16)'; c.fill(); c.strokeStyle = A; c.lineWidth = 3; c.stroke(); U.txt(c, s.k, w / 2, h - 82, 46, A); }
  for (var k = 0; k < n; k++) { c.fillStyle = k === i ? A : 'rgba(255,255,255,.2)'; c.fillRect(w / 2 - n * 22 + k * 44, h - 22, 36, 8); }
}
/* экран теории на стене: в холле - вся лекция, в комнате - слайды её темы. Рисуем только тот экран, что рядом */
var screens = [];
function wallScreen(o) { /* o: {x,y,z,ry,w,h,room,reg,title} */
  var g = grp(o.x, 0, o.z, o.ry); box(o.w + .2, o.h + .2, .08, std('#1b1f26', .35, .6), 0, o.y, 0, g);
  box(o.w + .26, .03, .1, neon(A), 0, o.y + o.h / 2 + .12, 0, g);
  var tex = R.tex(1280, 720, function () {}); var m = new T.Mesh(new T.PlaneGeometry(o.w, o.h), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); m.position.set(0, o.y, .045); g.add(m);
  var s = { g: g, tex: tex, o: o, i: 0, t: 0 }; screens.push(s);
  setTimeout(function () { var S = roomSlides(o.room); drawSlide(tex.userData.x, 1280, 720, S[0], 0, S.length, 0, o.title); tex.needsUpdate = true; }, 0);
  var fwd = [Math.sin(o.ry), Math.cos(o.ry)], dist = Math.max(2.2, o.w * .95);
  s.item = R.item({ obj: g, name: o.name || 'Теория', kicker: o.kicker || 'Экран', sub: o.sub || 'Смотри слайды этой комнаты с голосом. Листай сам.',
    at: [o.x + fwd[0] * dist, o.z + fwd[1] * dist], look: [o.x, o.y, o.z], tagY: o.y + o.h / 2 + .45, tagFar: 12, actLabel: 'Смотреть', act: function () { openLecture(s); } });
  s.item.at3 = [o.x, 0, o.z]; s.item.reg = o.reg;
  return s; }
var scrAcc = 0;
R.frame(function (dt, t) { scrAcc += dt; if (scrAcc < .14) return; scrAcc = 0; var p = R.camera.position;
  screens.forEach(function (s) { if (s.o.reg !== curReg && !(curReg === 'C' && s.o.reg === 'L')) return; if (Math.hypot(p.x - s.o.x, p.z - s.o.z) > 14) return;
    var S = roomSlides(s.o.room); if (!(lect.on && lect.s === s)) { s.t += .14; if (s.t > 9) { s.t = 0; s.i = (s.i + 1) % S.length; } }
    s.i = Math.min(s.i, S.length - 1); drawSlide(s.tex.userData.x, 1280, 720, S[s.i], s.i, S.length, t, s.o.title); s.tex.needsUpdate = true; }); });

/* ---------- окно лекции ---------- */
var lect = { on: false, s: null };
var LP = document.getElementById('lect');
function curSlides() { return roomSlides(lect.s && lect.s.o.room); }
function openLecture(s) { lect.on = true; lect.s = s; s.t = 0; var o = s.o, f = [Math.sin(o.ry), Math.cos(o.ry)], d = (innerWidth < innerHeight ? 2.6 : 1.55) * o.w / 2.56 * 1.15;
  R.focus({ pos: [o.x + f[0] * d, o.y, o.z + f[1] * d], look: [o.x, o.y, o.z] }, function () { LP.hidden = false; showSlide(true); }); }
function closeLecture() { lect.on = false; LP.hidden = true; if (window.GOLOS) GOLOS.stop(); R.unfocus(); }
var lpCv = LP.querySelector('canvas'), lpX = lpCv.getContext('2d'), lpAuto = true;
function showSlide(say) { var S = curSlides(), s = lect.s, i = Math.min(s.i, S.length - 1), sl = S[i]; s.i = i;
  LP.querySelector('.lp-n').textContent = 'Слайд ' + (i + 1) + ' из ' + S.length;
  LP.querySelector('h2').textContent = sl.h; LP.querySelector('p').textContent = sl.p;
  LP.querySelectorAll('.lp-ver button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === VER); });
  LP.querySelector('.lp-dots').innerHTML = S.map(function (x, k) { return '<i class="' + (k === i ? 'on' : k < i ? 'd' : '') + '"></i>'; }).join('');
  LP.querySelector('.lp-prev').disabled = i === 0; LP.querySelector('.lp-next').textContent = i === S.length - 1 ? '✓' : '→';
  if (say && window.GOLOS && GOLOS.on) GOLOS.say(sl.h + '. ' + sl.p, { onend: function (ok) { if (ok && lpAuto && lect.on && s.i < S.length - 1) setTimeout(function () { if (lect.on && LP.querySelector('h2').textContent === sl.h) { s.i++; showSlide(true); } }, 1200); } });
}
R.frame(function (dt, t) { if (LP.hidden) return; var w = lpCv.width = lpCv.clientWidth * 2, h = lpCv.height = lpCv.clientHeight * 2;
  lpX.clearRect(0, 0, w, h); var k = Math.min(w / 1200, h / 700); lpX.save(); lpX.translate((w - 1200 * k) / 2, (h - 700 * k) / 2); lpX.scale(k, k); window.AKB_PIC(lpX, 0, 0, 1200, 700, curSlides()[lect.s.i].pic, t); lpX.restore(); });
LP.querySelector('.lp-prev').onclick = function () { if (lect.s.i > 0) { lect.s.i--; showSlide(true); } };
LP.querySelector('.lp-next').onclick = function () { var S = curSlides(); if (lect.s.i < S.length - 1) { lect.s.i++; showSlide(true); } else { markLecture(); closeLecture(); toast('Слайды просмотрены'); } };
LP.querySelector('.lp-x').onclick = closeLecture;
LP.querySelectorAll('.lp-ver button').forEach(function (b) { b.onclick = function () { AKB_VER(b.dataset.v); lect.s.i = 0; showSlide(true); }; });
LP.querySelector('.lp-snd').onclick = function () { if (!window.GOLOS) return; GOLOS.setOn(!GOLOS.on); this.textContent = GOLOS.on ? '🔊' : '🔇'; if (GOLOS.on) showSlide(true); };
var sw0 = null; LP.addEventListener('touchstart', function (e) { sw0 = e.touches[0].clientX; }, { passive: true });
LP.addEventListener('touchend', function (e) { if (sw0 == null) return; var dx = e.changedTouches[0].clientX - sw0; sw0 = null; if (Math.abs(dx) > 60) (dx < 0 ? LP.querySelector('.lp-next') : LP.querySelector('.lp-prev')).click(); });
function markLecture() { lsS((CFG.store || 'kursy') + '_m3_lect', '1'); }
R.onEsc = function () { if (!LP.hidden) closeLecture(); else if (window.AKB_STOL && AKB_STOL.on) AKB_STOL.close(); else if (window.AKB_ZAR && AKB_ZAR.on) AKB_ZAR.close(); };

/* ---------- плакаты и таблички ---------- */
function poster(w, h, draw, x, y, z, ry) { var t = R.tex(Math.round(w * 400), Math.round(h * 400), draw); var m = plane(w, h, std('#ffffff', .85), x, y, z, ry); m.material.map = t; m.material.needsUpdate = true; return m; }
function warn(c, w, h, lines, head) { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#c3201b'; c.fillRect(0, 0, w, h * .2); U.txt(c, head || 'ВНИМАНИЕ', w / 2, h * .1, h * .1, '#fff');
  lines.forEach(function (l, i) { U.txt(c, l, w / 2, h * .3 + i * h * .13, h * .075, '#111', 'center', 800); }); }

/* ---------- ХОЛЛ ---------- */
var lobbyScr = wallScreen({ x: LX / 2, y: 1.85, z: .13, ry: 0, w: 4.8, h: 2.7, room: null, reg: 'L', name: 'Лекция об АКБ', kicker: 'Большой экран', sub: 'Вся теория модуля с голосом: детям или подробнее.' });
/* план этажа на стене холла у коридора */
var planTex = R.tex(1024, 640, function () {});
var planM = plane(2.4, 1.5, new T.MeshBasicMaterial({ map: planTex, toneMapped: false }), LX - TH / 2 - .056, 1.7, 3.6, -Math.PI / 2);
box(.04, 1.6, 2.5, std('#22262c', .4, .6), LX - TH / 2 - .03, 1.7, 3.6);
function drawPlan() { var c = planTex.userData.x, w = 1024, h = 640, kx = (w - 80) / W, kz = (h - 140) / D, ox = 40, oz = 100;
  c.fillStyle = '#0b0d1e'; c.fillRect(0, 0, w, h); U.txt(c, 'ПЛАН ЭТАЖА · МОДУЛЬ 3', 40, 50, 40, A, 'left', 900);
  c.fillStyle = '#2a2f45'; c.fillRect(ox, oz, LX * kx, D * kz); c.fillRect(ox + LX * kx, oz + CZ0 * kz, (W - LX) * kx, (CZ1 - CZ0) * kz);
  U.txt(c, 'ХОЛЛ', ox + LX * kx / 2, oz + D * kz / 2 + 60, 26, '#aab', 'center', 800);
  ROOMS.forEach(function (r) { var cc = r.state === 'done' ? GR : r.state === 'next' ? A : r.state === 'lock' ? '#555a78' : CY;
    c.fillStyle = cc; c.globalAlpha = r.state === 'next' ? .9 : .55; c.fillRect(ox + r.ox * kx + 3, oz + r.z0 * kz + 3, RW * kx - 6, RD7 * kz - 6); c.globalAlpha = 1;
    U.txt(c, String(r.no), ox + (r.ox + RW / 2) * kx, oz + (r.z0 + RD7 / 2) * kz - 18, 52, '#0b0d1e', 'center', 900);
    U.txt(c, r.n, ox + (r.ox + RW / 2) * kx, oz + (r.z0 + RD7 / 2) * kz + 30, 22, '#0b0d1e', 'center', 800); });
  var p = R.camera.position; c.fillStyle = '#ff5d6c'; c.beginPath(); c.arc(ox + p.x * kx, oz + p.z * kz, 10, 0, 7); c.fill();
  planTex.needsUpdate = true; }
var planAcc = 0; R.frame(function (dt) { planAcc += dt; if (planAcc > .5 && (curReg === 'L')) { planAcc = 0; drawPlan(); } });
/* выход в город */
var door = grp(LX / 2, 0, D - .13, Math.PI);
box(1.9, 2.5, .08, std('#3a4256', .4, .6), 0, 1.25, 0, door); box(.06, 2.5, .1, neon(A), -.95, 1.25, -.02, door); box(.06, 2.5, .1, neon(A), .95, 1.25, -.02, door); box(1.96, .06, .1, neon(A), 0, 2.52, -.02, door);
var doorSign = R.tex(512, 128, function (c, w, h) { c.fillStyle = '#0b0d1e'; c.fillRect(0, 0, w, h); U.txt(c, 'ВЫХОД В ГОРОД', w / 2, h / 2, 44, A); });
var ds = new T.Mesh(new T.PlaneGeometry(1.6, .4), new T.MeshBasicMaterial({ map: doorSign, toneMapped: false })); ds.position.set(0, 2.85, .06); door.add(ds);
var exitIt = R.item({ obj: door, name: 'Выход в город', sub: 'Вернуться на карту курса.', at: [LX / 2, D - 1.2], look: [LX / 2, 1.5, D], tagY: 3.0, act: exitRoom }); exitIt.reg = 'L';
/* скамья и шкафчик в холле */
box(2.2, .08, .5, std('#8a6a48', .6), 1.0, .45, 12.5).rotation.y = Math.PI / 2; box(.5, .42, .1, std('#3a3f4c', .5, .6), .6, .21, 11.6); box(.5, .42, .1, std('#3a3f4c', .5, .6), .6, .21, 13.4);
R.block(.3, 11.3, 1.3, 13.7);
put('clock', 1.3, 2.75, .02 + .13 / 2, 0, 1.2);
poster(.9, 1.2, function (c, w, h) { warn(c, w, h, ['АКБ - не игрушка.', 'Заряжаем только', 'со взрослым.', 'Вздулась - в песок!'], 'ПРАВИЛА'); }, .02 + TH / 2 - .1, 1.6, 14.6, Math.PI / 2);

/* ---------- терминал задания (стойка с экраном) ---------- */
var stands = [];
var legM = std('#3a3f4c', .35, .8), bodyM = std('#2a3038', .45, .6);
function terminal(r, tid, u, v, a) { var p = P(r, u, v), ry = RY(r, a), g = grp(p[0], 0, p[1], ry), i = taskNo(tid), tk = TASKS[i];
  var b = box(.52, 1.0, .4, bodyM, 0, .5, 0, g); b.castShadow = true;
  var hd = new T.Group(); hd.position.set(0, 1.17, .03); hd.rotation.x = -.42; g.add(hd);
  box(.7, .5, .09, bodyM, 0, 0, 0, hd);
  var tex = R.tex(512, 360, function () {}); var scr = new T.Mesh(new T.PlaneGeometry(.64, .44), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.z = .047; hd.add(scr);
  var rim = box(.72, .025, .1, neon(A), 0, .27, 0, hd);
  var ring = new T.Mesh(new T.RingGeometry(.48, .58, 40), new T.MeshBasicMaterial({ color: col(A), transparent: true, opacity: .7, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .012; g.add(ring);
  var s = { i: i, tid: tid, t: tk[1], g: g, tex: tex, rim: rim, ring: ring, st: taskState(tid), room: r };
  s.draw = function () { var c = tex.userData.x, w = 512, h = 360, cc = s.st === 'done' ? GR : s.st === 'wait' ? A : s.st === 'lock' ? '#666c8a' : A;
    c.fillStyle = s.st === 'done' ? '#0c2416' : '#0b1626'; c.fillRect(0, 0, w, h); c.fillStyle = cc; c.globalAlpha = .2; c.fillRect(0, 0, w, 74); c.globalAlpha = 1;
    U.txt(c, 'ЗАДАНИЕ ' + (i + 1), 26, 38, 36, cc, 'left', 900); U.txt(c, s.st === 'done' ? '✓' : s.st === 'lock' ? '🔒' : s.st === 'wait' ? '⏳' : '', w - 30, 38, 36, cc, 'right');
    var words = s.t.split(' '), lines = [''], k = 0; c.font = '800 42px Manrope, sans-serif';
    words.forEach(function (wd) { if (c.measureText(lines[k] + ' ' + wd).width > w - 50 && lines[k]) { lines[++k] = wd; } else lines[k] = (lines[k] ? lines[k] + ' ' : '') + wd; });
    lines.slice(0, 3).forEach(function (ln, j) { U.txt(c, ln, w / 2, 135 + j * 52, 42, '#fff', 'center', 800); });
    U.r && 0; c.fillStyle = cc; U.rr(c, 90, h - 74, w - 180, 56, 28); c.fill();
    U.txt(c, s.st === 'done' ? 'пройдено · ещё раз' : s.st === 'wait' ? 'ждёт тренера' : s.st === 'lock' ? 'закрыто' : 'начать · E', w / 2, h - 46, 30, '#0b0d1e', 'center', 900);
    tex.needsUpdate = true; s.rim.material = neon(cc); s.ring.material.color = col(cc); };
  s.draw();
  var f = [Math.sin(ry), Math.cos(ry)];
  s.item = R.item({ obj: g, name: (i + 1) + '. ' + tk[1], kicker: 'Задание ' + (i + 1), sub: 'Открыть задание модуля 3.', at: [p[0] + f[0] * 1.1, p[1] + f[1] * 1.1], look: [p[0], 1.2, p[1]], tagY: 2.0, tagFar: 7,
    actLabel: 'Начать задание', state: s.st === 'done' ? 'done' : '', act: function () { openTask(tid); } });
  s.item.at3 = [p[0], 0, p[1]]; s.item.reg = r.id;
  R.block(p[0] - .32, p[1] - .32, p[0] + .32, p[1] + .32);
  stands.push(s); return s; }
function roomScreen(r, u, title) { var p = P(r, u, RD7 - .13), ry = RY(r, 0); return wallScreen({ x: p[0], y: 1.75, z: p[1], ry: ry, w: 2.56, h: 1.44, room: r, reg: r.id, title: title || ('КОМНАТА ' + r.no + ' · ' + r.n.toUpperCase()), name: 'Теория: ' + r.n, kicker: 'Экран комнаты ' + r.no }); }
function roomBanner(r) { var p = P(r, 4, RD7 - .12), t = R.tex(1024, 160, function (c, w, h) { c.fillStyle = '#1d4e74'; c.fillRect(0, 0, w, h); U.txt(c, r.no + '. ' + r.n.toUpperCase(), w / 2, h / 2 + 2, 70, '#fff', 'center', 900); });
  plane(2.6, .4, new T.MeshBasicMaterial({ map: t, toneMapped: false }), p[0], 2.85, p[1] + (r.south ? -.01 : .01), RY(r, 0)); }
function stripe(r) { /* синяя полоса по стенам комнаты, как в мастерской */ var m = std('#3d6e8f', .6), y = 1.0;
  var a = P(r, 0, RD7), b = P(r, RW, RD7); box(RW, .12, .02, m, (a[0] + b[0]) / 2, y, a[1] + (r.south ? -.01 : .01));
  box(.02, .12, RD7, m, r.ox + .01 + TH / 2 * 0, y, (r.z0 + r.z1) / 2); box(.02, .12, RD7, m, r.ox + RW - .01, y, (r.z0 + r.z1) / 2); }

/* ---------- КОМНАТА 1. Устройство АКБ: голограмма банок, разрез ---------- */
var r1 = roomById('N0'); roomBanner(r1); stripe(r1); roomScreen(r1, 4);
(function () { var p = P(r1, 4, 3.6), g = grp(p[0], 0, p[1]);
  cyl(.7, .8, .5, std('#2c323c', .4, .7), 0, .25, 0, g); cyl(.62, .62, .02, neon(CY, .9), 0, .51, 0, g);
  var holo = new T.Group(); holo.position.y = 1.35; g.add(holo);
  var hm = new T.MeshBasicMaterial({ color: new T.Color(A).multiplyScalar(1.3), wireframe: true, transparent: true, opacity: .6, toneMapped: false });
  for (var k = 0; k < 4; k++) { var cell = new T.Mesh(new T.BoxGeometry(.8, .13, .5), hm); cell.position.y = -.3 + k * .19; holo.add(cell); }
  var beam = new T.Mesh(new T.CylinderGeometry(.62, .62, .85, 32, 1, true), new T.MeshBasicMaterial({ color: col(CY), transparent: true, opacity: .07, side: T.DoubleSide, depthWrite: false })); beam.position.y = .95; g.add(beam);
  R.frame(function (dt, t) { if (curReg !== 'N0' && curReg !== 'C') return; holo.rotation.y += dt * .5; holo.children.forEach(function (ch, k) { ch.position.y = -.3 + k * (.19 + .05 * Math.sin(t * 1.4)); }); });
  R.block(p[0] - .8, p[1] - .8, p[0] + .8, p[1] + .8); })();
putR(r1, 'desk', .55, 4.5, 0, Math.PI / 2, 1); putR(r1, 'lamp', .3, 4.0, .79, Math.PI / 2, 1); putR(r1, 'stool', 1.4, 4.4, 0, 0, 1);
(function () { var a = P(r1, 0, 3.5), b = P(r1, 1.05, 5.5); R.block(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])); })();
terminal(r1, 'akb_inside', 6.2, 2.4, -.5);
(function () { var p = P(r1, RW - .02, 3.8); poster(1.0, 1.3, function (c, w, h) { c.fillStyle = '#fdfbf4'; c.fillRect(0, 0, w, h); U.txt(c, 'ЧТО ВНУТРИ', w / 2, 60, 46, '#1d4e74');
  for (var k = 0; k < 7; k++) { c.fillStyle = k % 2 ? '#e9b949' : '#7a8696'; c.fillRect(60, 120 + k * 50, w - 120, 34); } U.txt(c, 'слои как рулет', w / 2, h - 50, 34, '#333', 'center', 700); }, p[0] + (r1.south ? .01 : -.01), 1.6, p[1], RY(r1, -Math.PI / 2)); })();

/* ---------- КОМНАТА 2. Лаборатория: стол АКБ с заданиями руками ---------- */
var r2 = roomById('S0'); roomBanner(r2); stripe(r2); roomScreen(r2, 4);
var TB = { w: 3.0, d: 1.3, h: .9 }; (function () { var p = P(r2, 4, 3.7); TB.x = p[0]; TB.z = p[1]; })();
var table = grp(TB.x, 0, TB.z);
[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { box(.07, TB.h, .07, legM, s[0] * (TB.w / 2 - .1), TB.h / 2, s[1] * (TB.d / 2 - .1), table); });
box(TB.w, .05, TB.d, std('#a7a9ac', .45, .5), 0, TB.h, 0, table);
box(TB.w - .3, .012, TB.d - .3, std('#1f3a3c', .95, 0), 0, TB.h + .031, 0, table);
box(TB.w - .2, .14, .03, std('#cfd2d6', .5, .3), 0, TB.h + .095, -TB.d / 2 + .02, table); /* бортик */
box(TB.w, .025, .03, neon(A, 1.1), 0, TB.h - .02, TB.d / 2 + .005, table);
var holo2 = new T.Group(); holo2.position.set(0, TB.h + .8, 0); table.add(holo2);
var hm2 = new T.MeshBasicMaterial({ color: new T.Color(A).multiplyScalar(1.3), wireframe: true, transparent: true, opacity: .5, toneMapped: false });
for (var hi = 0; hi < 4; hi++) { var cell2 = new T.Mesh(new T.BoxGeometry(.36, .06, .22), hm2); cell2.position.y = -.12 + hi * .085; holo2.add(cell2); }
R.frame(function (dt) { if (curReg === 'S0') holo2.rotation.y += dt * .6; });
put('mmeter', -TB.w / 2 + .35, TB.h + .025, -TB.d / 2 + .3, .3, 1, table); put('lamp', TB.w / 2 - .25, TB.h + .025, -TB.d / 2 + .2, -.4, 1, table);
R.block(TB.x - TB.w / 2, TB.z - TB.d / 2, TB.x + TB.w / 2, TB.z + TB.d / 2);
window.AKB_TABLE = { g: table, x: TB.x, z: TB.z, y: TB.h + .04, w: TB.w, d: TB.d, holo: holo2 };
var tableIt = R.item({ obj: table, name: 'Стол АКБ', kicker: 'Задания руками', sub: 'Собери аккумулятор из банок, проверь тестером, прочитай наклейку, реши, куда положить АКБ.',
  at: [TB.x, TB.z + (r2.south ? 1.5 : -1.5)], look: [TB.x, .9, TB.z], tagY: 2.0, actLabel: 'К столу', act: function () { if (window.AKB_STOL) AKB_STOL.open(); } }); tableIt.reg = 'S0';
putR(r2, 'cart', .6, 5.6, 0, Math.PI / 2, 1); putR(r2, 'stool', 6.4, 4.8, 0, 0, 1);
(function () { var a = P(r2, 0, 4.9), b = P(r2, 1.0, 6.3); R.block(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])); })();
terminal(r2, 'akb_volt', 1.4, 1.9, .5); terminal(r2, 'akb_count', 6.6, 1.9, -.5);

/* ---------- КОМНАТА 3. Симулятор: кресло, большой экран полёта ---------- */
var r3 = roomById('N1'); roomBanner(r3); stripe(r3); roomScreen(r3, 1.8);
var simTex = R.tex(1280, 720, function (c, w, h) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3d7fd6'); g.addColorStop(.58, '#bfe2ff'); g.addColorStop(.58, '#4d7b45'); g.addColorStop(1, '#2a4a2a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#ffd36e'; c.lineWidth = 12; c.beginPath(); c.ellipse(w * .55, h * .5, 110, 140, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(w * .3, h * .56, 60, 78, 0, 0, 7); c.stroke();
  U.txt(c, 'СИМУЛЯТОР', 170, 50, 44, '#fff'); U.txt(c, '3,82 В', w - 140, 50, 44, '#9dff7c'); U.txt(c, '01:24', w - 140, 105, 40, '#fff'); });
(function () { var p = P(r3, 5.6, RD7 - .13); var g = grp(p[0], 0, p[1], RY(r3, 0)); box(3.0, 1.75, .08, std('#15181d', .35, .6), 0, 1.7, 0, g);
  var m = new T.Mesh(new T.PlaneGeometry(2.88, 1.62), new T.MeshBasicMaterial({ map: simTex, toneMapped: false })); m.position.set(0, 1.7, .045); g.add(m); })();
var simG = (function () { var p = P(r3, 5.6, 3.6), g = grp(p[0], 0, p[1], RY(r3, Math.PI));
  box(.62, .45, .62, std('#22262e', .5, .5), 0, .25, 0, g); box(.62, .8, .12, std('#a02828', .55, .2), 0, .9, -.3, g); box(.64, .1, .66, std('#1a1d22', .6), 0, .52, 0, g);
  box(.26, .06, .16, std('#222', .4, .5), 0, .66, .32, g); R.block(p[0] - .45, p[1] - .45, p[0] + .45, p[1] + .45); return g; })();
var simIt = R.item({ obj: simG, name: 'Кресло-симулятор', kicker: 'Полёты модуля', sub: 'Полёты в симуляторе: следим за временем и вольтами, учимся плавному газу.',
  at: (function () { var p = P(r3, 4.2, 3.0); return p; })(), look: (function () { var p = P(r3, 5.6, 3.6); return [p[0], .9, p[1]]; })(), tagY: 1.9, actLabel: 'Сесть',
  act: function () { openTask(taskState('fly_sim1') === 'done' ? 'fly_sim2' : 'fly_sim1'); } }); simIt.reg = 'N1'; simIt.at3 = (function () { var p = P(r3, 5.6, 3.6); return [p[0], 0, p[1]]; })();
terminal(r3, 'fly_sim1', 1.4, 2.4, .5); terminal(r3, 'fly_sim2', 3.3, 5.0, .2);
putR(r3, 'desk', 7.45, 2.6, 0, -Math.PI / 2, 1); putR(r3, 'lamp', 7.7, 2.1, .79, -Math.PI / 2, 1);
(function () { var a = P(r3, 7.0, 1.6), b = P(r3, 8, 3.6); R.block(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])); })();

/* ---------- КОМНАТА 4. Склад АКБ: стеллажи, ящики, большая наклейка ---------- */
var r4 = roomById('S1'); roomBanner(r4); stripe(r4); roomScreen(r4, 4);
[[.32, 1.6], [.32, 2.8], [.32, 4.0], [.32, 5.2]].forEach(function (q, k) { var p = P(r4, q[0], q[1]);
  put('shelf', p[0], 0, p[1], RY(r4, Math.PI / 2), .1); var a = P(r4, 0, q[1] - .55), b = P(r4, .6, q[1] + .55); R.block(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]));
  putR(r4, k % 2 ? 'cbox' : 'crate', q[0], q[1] - .2, .03, Math.PI / 2, k % 2 ? .75 : 1); putR(r4, 'crate', q[0], q[1] + .25, .78, Math.PI / 2, .9); });
putR(r4, 'cbox', 6.9, 5.8, 0, .4, 1); putR(r4, 'cbox', 7.2, 5.3, 0, -.2, .8); putR(r4, 'chest', 7.6, 3.4, 0, -Math.PI / 2, 1);
(function () { var a = P(r4, 6.5, 5.0), b = P(r4, 8, 6.3); R.block(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]));
  a = P(r4, 7.2, 3.0); b = P(r4, 8, 3.8); R.block(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])); })();
(function () { var p = P(r4, RW - .02, 1.8); poster(1.5, .75, function (c, w, h) { var g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#1b2147'); g.addColorStop(1, '#3a1d4f'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  U.txt(c, 'VZLET 1300 mAh', 30, 70, 64, '#fff', 'left', 900); U.txt(c, '4S 14,8V · 100C', 30, 150, 54, A, 'left', 900); U.txt(c, 'LiPo · XT60', 30, 225, 46, CY, 'left', 800);
  U.txt(c, 'учимся читать наклейку', w - 30, h - 30, 30, '#ccd', 'right', 700); }, p[0] + (r4.south ? .01 : -.01), 1.65, p[1], RY(r4, -Math.PI / 2)); })();
terminal(r4, 'akb_cap', 2.9, 4.4, .2); terminal(r4, 'akb_label', 5.4, 3.9, -.4);

/* ---------- КОМНАТА 5. Зарядная: станция зарядки, шкаф, песок, огнетушитель ---------- */
var r5 = roomById('N2'); roomBanner(r5); stripe(r5); roomScreen(r5, 3.4);
/* зарядная станция у правой стены (x - максимум комнаты): так считает akb-zaryadka.js */
var ZB = { x: r5.ox + RW - .45 - TH / 2 * 0, z: 3.4, w: .9, d: 3.0, h: .92 };
var bench = grp(ZB.x, 0, ZB.z);
box(ZB.w, .06, ZB.d, std('#5b5e63', .6, .2), 0, ZB.h, 0, bench);
box(ZB.w, ZB.h - .06, ZB.d, std('#3d4a5a', .55, .4), 0, (ZB.h - .06) / 2, 0, bench);
box(.03, .03, ZB.d, neon(OR, 1.1), -ZB.w / 2 - .005, ZB.h - .02, 0, bench);
var peg = R.tex(512, 512, function (c, w, h) { c.fillStyle = '#c9cdd2'; c.fillRect(0, 0, w, h); c.fillStyle = '#6d727a'; for (var i = 16; i < w; i += 32) for (var j = 16; j < h; j += 32) { c.beginPath(); c.arc(i, j, 4, 0, 7); c.fill(); } });
var pb = new T.Mesh(new T.PlaneGeometry(ZB.d, 1.3), std('#ffffff', .8)); pb.material.map = peg; pb.position.set(ZB.w / 2 - .02, ZB.h + .95, 0); pb.rotation.y = -Math.PI / 2; bench.add(pb);
var zSign = R.tex(1024, 200, function (c, w, h) { c.fillStyle = '#0b0d1e'; c.fillRect(0, 0, w, h); U.txt(c, '⚡ ЗАРЯДНАЯ СТАНЦИЯ', w / 2, 70, 64, OR); U.txt(c, 'заряжаем только под присмотром', w / 2, 150, 36, '#ffe3c8', 'center', 700); });
var zs = new T.Mesh(new T.PlaneGeometry(2.2, .43), new T.MeshBasicMaterial({ map: zSign, toneMapped: false })); zs.position.set(ZB.w / 2 - .04, ZB.h + 1.85, 0); zs.rotation.y = -Math.PI / 2; bench.add(zs);
R.block(ZB.x - ZB.w / 2, ZB.z - ZB.d / 2, ZB.x + ZB.w / 2, ZB.z + ZB.d / 2);
window.AKB_BENCH = { g: bench, x: ZB.x, z: ZB.z, y: ZB.h + .03 };
var benchIt = R.item({ obj: bench, name: 'Зарядная станция', kicker: 'Урок на зарядке', sub: 'Зарядка ViFly WhoopStor 3: две кнопки, ток, вольты, заряд и хранение АКБ 1S, как у Mobula 7.',
  at: [ZB.x - 1.6, ZB.z], look: [ZB.x, 1.0, ZB.z], tagY: 2.5, actLabel: 'Заряжать', act: function () { if (window.AKB_ZAR) AKB_ZAR.open(); } }); benchIt.reg = 'N2';
put('pbox', r5.ox + RW - TH / 2 * 0 - .02, 1.75, 5.6, -Math.PI / 2, 1);
/* шкаф хранения АКБ у левой стены, песок и огнетушитель */
var cab = grp(r5.ox + .45, 0, 2.2);
box(.85, 2.0, 1.4, std('#8a2b24', .45, .5), 0, 1.0, 0, cab);
box(.02, 1.9, .66, std('#9c332b', .4, .5), .435, 1.0, -.34, cab); box(.02, 1.9, .66, std('#9c332b', .4, .5), .435, 1.0, .34, cab);
box(.04, .25, .04, std('#ddd', .2, .9), .46, 1.05, -.07, cab); box(.04, .25, .04, std('#ddd', .2, .9), .46, 1.05, .07, cab);
var cabSign = R.tex(512, 256, function (c, w, h) { c.fillStyle = '#e6b800'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = '900 52px Manrope, sans-serif'; c.textAlign = 'center'; c.fillText('ХРАНЕНИЕ АКБ', w / 2, 100); c.font = '800 40px Manrope, sans-serif'; c.fillText('3,8 В на банку', w / 2, 170); c.fillText('негорючий шкаф', w / 2, 225); });
var csn = new T.Mesh(new T.PlaneGeometry(.8, .4), new T.MeshBasicMaterial({ map: cabSign })); csn.position.set(.45, 1.62, 0); csn.rotation.y = Math.PI / 2; cab.add(csn);
R.block(r5.ox, 1.5, r5.ox + .9, 2.9);
var redM = std('#c3201b', .4, .2);
var bucket = cyl(.2, .16, .34, redM, r5.ox + .5, .17, 3.6); cyl(.18, .18, .02, std('#d8c39a', 1), r5.ox + .5, .33, 3.6);
var ext = cyl(.09, .09, .55, redM, r5.ox + .3, .5, 4.2); cyl(.04, .05, .12, std('#222', .4, .6), r5.ox + .3, .83, 4.2);
R.block(r5.ox, 3.3, r5.ox + .8, 4.45);
poster(.6, .8, function (c, w, h) { warn(c, w, h, ['Не заряжай', 'без присмотра.', 'Вздулась АКБ -', 'в песок!']); }, r5.ox + TH / 2 * 0 + .015, 1.6, 4.0, Math.PI / 2);
terminal(r5, 'akb_care', 2.2, 4.6, .4);

/* ---------- КОМНАТА 6. Полётный зал: сетка, ворота, площадка ---------- */
var r6 = roomById('S2'); roomBanner(r6); stripe(r6); roomScreen(r6, 1.6);
(function () { var c0 = P(r6, 5.9, 3.9), g = grp(c0[0], 0, c0[1], RY(r6, 0)); /* клетка 3 x 3 м */
  var netT = R.tex(256, 256, function (c, w, h) { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(30,30,30,.85)'; c.lineWidth = 3; for (var i = 0; i <= w; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } });
  netT.wrapS = netT.wrapT = T.RepeatWrapping; netT.repeat.set(9, 7);
  var netM = new T.MeshBasicMaterial({ map: netT, transparent: true, side: T.DoubleSide, depthWrite: false });
  [[0, -1.5, 0], [0, 1.5, Math.PI], [-1.5, 0, Math.PI / 2], [1.5, 0, -Math.PI / 2]].forEach(function (q) { var m = new T.Mesh(new T.PlaneGeometry(3, 2.6), netM); m.position.set(q[0], 1.3, q[1]); m.rotation.y = q[2]; m.userData.through = true; g.add(m); });
  [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(function (q) { box(.06, 2.6, .06, std('#2a2e34', .4, .7), q[0], 1.3, q[1], g); });
  var gm = std('#ff7a1a', .5, .1);
  [[-.6, -.5], [.6, .5]].forEach(function (q) { var ring = new T.Mesh(new T.TorusGeometry(.42, .04, 10, 32), gm); ring.position.set(q[0], .9, q[1]); ring.rotation.y = .6; g.add(ring); cyl(.02, .02, .5, legM, q[0], .25, q[1], g); });
  var pad = new T.Mesh(new T.CircleGeometry(.35, 24), std('#1f2a36', .6)); pad.rotation.x = -Math.PI / 2; pad.position.set(0, .01, 1.0); g.add(pad);
  var dr = new T.Group(); dr.position.set(0, .06, 1.0); g.add(dr); box(.12, .03, .12, std('#e8e8e8', .5), 0, 0, 0, dr);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { var duct = new T.Mesh(new T.TorusGeometry(.045, .008, 6, 16), std('#e8e8e8', .5)); duct.rotation.x = Math.PI / 2; duct.position.set(s[0] * .06, .01, s[1] * .06); dr.add(duct); });
  var a = P(r6, 4.4, 2.4), b = P(r6, 7.4, 5.4); R.block(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])); })();
terminal(r6, 'fly_mob', 1.5, 2.2, .5);
putR(r6, 'chest', .4, 5.0, 0, Math.PI / 2, 1);

/* ---------- КОМНАТА 7. Повторение: парты и экран со всей теорией ---------- */
var r7 = roomById('N3'); roomBanner(r7); stripe(r7); roomScreen(r7, 4, 'ПОВТОРЕНИЕ · ВСЯ ТЕОРИЯ');
[[2.3, 3.2], [4.0, 3.2], [5.7, 3.2], [2.3, 4.7], [4.0, 4.7], [5.7, 4.7]].forEach(function (q) { var p = P(r7, q[0], q[1]); put('schair', p[0], 0, p[1], RY(r7, Math.PI), 1); R.block(p[0] - .3, p[1] - .3, p[0] + .3, p[1] + .3); });
terminal(r7, 'akb_rep', 6.9, 1.8, -.6);

/* ---------- КОМНАТА 8. Экзамен: стол экзаменатора, итоговый терминал ---------- */
var r8 = roomById('S3'); roomBanner(r8); stripe(r8); roomScreen(r8, 4, 'ИТОГ МОДУЛЯ 3');
putR(r8, 'desk', 4, 5.6, 0, Math.PI, 1); putR(r8, 'lamp', 4.6, 5.8, .79, Math.PI, 1); putR(r8, 'stool', 4, 6.4, 0, 0, 1);
(function () { var a = P(r8, 3.0, 5.1), b = P(r8, 5.0, 6.6); R.block(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])); })();
terminal(r8, 'akb_final', 4, 3.7, 0);
(function () { var p = P(r8, .02, 3.5); poster(.9, 1.2, function (c, w, h) { c.fillStyle = '#fffaf0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9a227'; c.lineWidth = 12; c.strokeRect(14, 14, w - 28, h - 28);
  U.txt(c, 'ДИПЛОМ', w / 2, 110, 60, '#7a5a10'); U.txt(c, 'Аккумуляторы', w / 2, 200, 36, '#333', 'center', 700); U.txt(c, 'модуль 3', w / 2, 250, 32, '#555', 'center', 700); U.txt(c, '★', w / 2, h - 110, 90, '#c9a227'); },
  p[0] + (r8.south ? -.01 : .01), 1.6, p[1], RY(r8, Math.PI / 2)); })();

/* ---------- двери как предметы (из коридора): подойти и войти ---------- */
ROOMS.forEach(function (r) { var it = R.item({ obj: r.sign, name: r.no + '. ' + r.n, kicker: 'Комната ' + r.no, sub: '', at: r.outP, look: [r.dx, 1.6, r.dz], tagY: 3.3, tagFar: 30, actLabel: 'Войти',
  act: function () { if (r.state === 'lock') { toast('Комната пока закрыта'); return; } R.walkTo(r.inP[0], r.inP[1], null); } });
  it.at3 = [r.dx, 0, r.dz]; it.reg = 'C'; it.noTag = true; r.item = it;
  it.sub = r.tasks.map(function (tid) { var i = taskNo(tid); return 'Задание ' + (i + 1) + ': ' + TASKS[i][1]; }).join(' · '); });

/* ---------- путь через двери ---------- */
R.route = function (x0, z0, x1, z1, item) { var a = region(x0, z0), b = region(x1, z1), q = [];
  if (a === b) return [[x1, z1]];
  var ra = roomById(a), rb = roomById(b);
  if (ra) { q.push(ra.inP, ra.outP); a = 'C'; }
  if (a === 'L' && b !== 'L') { q.push([LX + .2, CZM]); a = 'C'; }
  if (rb) { if (rb.state === 'lock') { toast('Комната ' + rb.no + ' пока закрыта'); q.push(rb.outP); return q; } q.push(rb.outP, rb.inP); }
  if (b === 'L') q.push([LX - .4, CZM]);
  q.push([x1, z1]); return q; };
/* подписи: только у того, что в этой же части этажа */
R.tagOk = function (it) { return !it.reg || it.reg === curReg || (it.reg === 'L' && curReg === 'C' && R.camera.position.x < 14); };

/* ---------- состояние комнат и заданий ---------- */
var beacon = new T.Mesh(new T.ConeGeometry(.13, .26, 4), neon(A, 2)); beacon.rotation.x = Math.PI; sc.add(beacon);
var nextStand = null;
function refreshAll() { var nx = null;
  stands.forEach(function (s) { s.st = taskState(s.tid); s.draw(); s.item.state = s.st === 'done' ? 'done' : ''; R.setTag(s.item); });
  TASKS.forEach(function (t) { if (nx) return; var s = stands.find(function (x) { return x.tid === t[0]; }); if (s && s.st === 'open') nx = s; });
  nextStand = nx;
  ROOMS.forEach(function (r) { var st = r.tasks.map(taskState), all = st.every(function (x) { return x === 'done'; }), lock = st.every(function (x) { return x === 'lock'; });
    r.state = all ? 'done' : (nx && nx.room === r) ? 'next' : lock ? 'lock' : 'open'; setLocked(r, r.state === 'lock'); drawSign(r); });
  R.setNext(nx ? nx.item : null); nextBar(nx); drawPlan(); }
R.frame(function (dt, t) { var s = nextStand; beacon.visible = !!s && R.mode === 'walk'; if (!s) return;
  var inRoom = curReg === s.room.id; if (inRoom) beacon.position.set(s.g.position.x, 2.35 + Math.sin(t * 3) * .07, s.g.position.z);
  else beacon.position.set(s.room.dx, 3.0 + Math.sin(t * 3) * .07, s.room.dz + (s.room.south ? -.4 : .4));
  beacon.rotation.y = t * 2; s.ring.material.opacity = .45 + .35 * Math.abs(Math.sin(t * 3)); });

/* ---------- нижняя строка "Дальше" ---------- */
var NB = document.getElementById('nextb');
function nextBar(s) { if (!s) { NB.hidden = true; return; } NB.hidden = false; NB.querySelector('b').textContent = 'Комната ' + s.room.no + ' · Задание ' + (s.i + 1) + '. ' + s.t;
  NB.querySelector('button').onclick = function () { R.walkTo(s.item.at[0], s.item.at[1], s.item); }; }

/* ---------- открыть задание ---------- */
function openTask(tid) {
  if (HOST) { try { if (HOST.KURS_KOMNATA.task(tid)) return; } catch (e) {} }
  var i = taskNo(tid), dlg = document.getElementById('demo');
  dlg.querySelector('b').textContent = 'Задание ' + (i + 1) + '. ' + TASKS[i][1]; dlg.hidden = false;
  dlg.querySelector('.d-ok').onclick = function () { var d = JSON.parse(lsG('akb_demo_done') || '[]'); if (d.indexOf(tid) < 0) d.push(tid); lsS('akb_demo_done', JSON.stringify(d)); dlg.hidden = true; refreshAll(); toast('Задание засчитано (проба)'); };
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
document.addEventListener('akb-ver', function () { screens.forEach(function (s) { s.i = 0; }); });
refreshAll();
/* в курсе: состояние заданий меняется в окне задания - раз в 1,5 с сверяем */
var lastSt = '';
setInterval(function () { if (!HOST) return; var s2 = TASKS.map(function (t) { return taskState(t[0]); }).join(); if (s2 !== lastSt) { lastSt = s2; refreshAll(); } }, 1500);
var hintEl = document.getElementById('hint'); setTimeout(function () { hintEl.classList.add('off'); }, 7000);
R.frame(function () { if (R.mode !== 'walk') hintEl.classList.add('off'); });
/* для проверки: AKB.go('S0') - перейти в комнату */
function go(id) { var r = roomById(id), p = r ? r.inP : id === 'C' ? [20, CZM] : [3.2, CZM]; R.camera.position.x = p[0]; R.camera.position.z = p[1]; if (r) R.lookAt([r.dx, 1.4, (r.z0 + r.z1) / 2]); }
window.AKB = { R: R, stands: stands, rooms: ROOMS, refresh: refreshAll, back: function () { refreshAll(); }, openLecture: function () { openLecture(lobbyScr); }, closeLecture: closeLecture, std: std, neon: neon, box: box, cyl: cyl, go: go, region: region };
})();
/* E/Enter и пробел не срабатывают, пока открыто окно (лекция, задание-проба, окно задания курса поверх комнаты) */
AKB.R.busy = function () { var dm = document.getElementById('demo'), lp = document.getElementById('lect');
  if ((dm && !dm.hidden) || (lp && !lp.hidden)) return true;
  try { var w = parent !== window && parent.document.getElementById('win'); if (w && w.classList.contains('on')) return true; } catch (e) {}
  return false; };
