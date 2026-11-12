/* akb-etazh-g.js - новая графика (набор inter.js, проба 10.11.2026): стены, пол, свет, двери, стойки. Содержание комнат - как в akb-etazh-new.js.
   akb-etazh.js - модуль 3 "Аккумуляторная" как этаж: холл, коридор и 8 комнат (проба 09.11.2026, вариант А "коридор с комнатами").
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

/* ---------- графика помещений: набор INTER (inter.js) ---------- */
var STYLE = (/[?&]s=([ABC])/.exec(location.search) || [])[1] || 'A';
function autoQ() { var mob = matchMedia('(pointer:coarse)').matches || Math.min(innerWidth, innerHeight) < 600, mem = navigator.deviceMemory || 4, cpu = navigator.hardwareConcurrency || 4;
  if (mob) return (mem <= 3 || cpu <= 4) ? 'low' : 'mid'; return 'high'; }
var QUAL = (/[?&]q=(high|mid|low)/.exec(location.search) || [])[1] || lsG('kursy_grafika') || autoQ();
var G = INTER.create({ renderer: R.renderer, scene: sc, camera: R.camera, style: STYLE, accent: STYLE === 'A' ? '#f2a100' : A, quality: QUAL, tex: 'tex/' }), GS = G.S;
window.AKB_G = G;
/* следим за скоростью: если кадров мало - графика сама становится легче (и запоминает это для телефона) */
var FPRB = (function () { try { return /(new|g)\.html$/.test(parent.location.pathname) || /[?&](new|g)\b/.test(location.search); } catch (e) { return false; } })(), fpsL = 0; /* 12.11: в пробе графика легчает уже при 40 кадрах (сначала резкость), чтобы поворот был плавным */
var fpsN = 0, fpsT = 0, fpsWait = /[?&]q=/.test(location.search) ? 1e9 : 4;
R.renderFn = function (dt) { G.render(dt); if (fpsWait > 0) { fpsWait -= dt; return; } fpsN++; fpsT += dt;
  if (fpsN >= 70) { if (fpsT / fpsN > (FPRB ? (fpsL ? 1 / 26 : 1 / 40) : 1 / 21) && document.visibilityState === 'visible') { fpsL++; var st = G.lower(); if (st === 2) lsS('kursy_grafika', 'low'); fpsWait = 3; } fpsN = 0; fpsT = 0; } };
R.onResize = function (w, h) { G.resize(w, h, Math.min(window.devicePixelRatio || 1, QUAL === 'high' ? 2 : QUAL === 'mid' ? 1.5 : 1.25)); }; R.onResize(innerWidth, innerHeight);
var TH = .24, DW = 1.6, DH = 2.3, HT = TH / 2;
function blockRect(x0, z0, x1, z1) { R.block(x0, z0, x1, z1); }
/* холл */
var SHELLS = {};
SHELLS.L = G.room({ x0: 0, z0: 0, x1: LX - HT, z1: D, h: H, holes: { e: [[CZ0 + HT, CZ1 - HT, H]], s: [[.55, 2.75, 2.7, .7], [LX / 2 - .8, LX / 2 + .8, DH], [5.25, LX - HT - .55, 2.7, .7]] },
  lamps: [[4, 3, 1, 0], [4, 7, 1, 0], [4, 11, 1, 0], [4, 15, 1, 0]], walls: { n: GS.feature } });
G.window({ axis: 'x', c: D, a0: .55, a1: 2.75, y0: .7, y1: 2.7, out: 1 }); G.window({ axis: 'x', c: D, a0: 5.25, a1: LX - HT - .55, y0: .7, y1: 2.7, out: 1 });
/* коридор */
(function () { var hn = [], hs = [], lamps = [];
  ROOMS.forEach(function (r) { (r.south ? hs : hn).push([r.dx - DW / 2, r.dx + DW / 2, DH]); });
  for (var x = 10; x < W; x += 4) lamps.push([x, CZM, 1, 0]);
  SHELLS.C = G.room({ x0: LX - HT, z0: CZ0 + HT, x1: W, z1: CZ1 - HT, h: H, holes: { n: hn, s: hs, w: [[CZ0 + HT, CZ1 - HT, H]] }, lamps: lamps });
  /* стены коридора не пускают сквозь себя (кроме дверей) */
  [[CZ0, hn], [CZ1, hs]].forEach(function (q) { var a = LX - HT; q[1].slice().sort(function (m, n) { return m[0] - n[0]; }).forEach(function (h) { blockRect(a, q[0] - HT, h[0], q[0] + HT); a = h[1]; }); blockRect(a, q[0] - HT, W, q[0] + HT); });
  for (var i = 0; i <= 4; i++) { var px = LX + i * RW; if (i < 4 || true) { blockRect(px - HT, 0, px + HT, CZ0 - HT); blockRect(px - HT, CZ1 + HT, px + HT, D); } } })();
/* комнаты */
ROOMS.forEach(function (r) { var x0 = r.ox + HT, x1 = r.i === 3 ? W : r.ox + RW - HT, z0 = r.south ? CZ1 + HT : 0, z1 = r.south ? D : CZ0 - HT, hl = {}, wl = {};
  hl[r.south ? 'n' : 's'] = [[r.dx - DW / 2, r.dx + DW / 2, DH]]; wl[r.south ? 's' : 'n'] = GS.feature;
  if (r.id === 'N3') hl.e = [[1.6, 5.2, 2.7, .85]];
  r.shell = G.room({ x0: x0, z0: z0, x1: x1, z1: z1, h: H, holes: hl, walls: wl, lamps: [[2.2, 2.3], [5.8, 2.3], [2.2, 5.2], [5.8, 5.2]].map(function (q) { var p = P(r, q[0], q[1]); return [p[0], p[1], 1, 0]; }) });
  if (r.id === 'N3') G.window({ axis: 'z', c: W, a0: 1.6, a1: 5.2, y0: .85, y1: 2.7, out: 1 }); });

/* ---------- двери: портал, раздвижные створки, табличка с номером ---------- */
ROOMS.forEach(function (r) { var zc = r.south ? CZ1 : CZ0, f = r.south ? -1 : 1;
  r.doorG = G.door({ x: r.dx, z: zc, axis: 'x', w: DW, h: DH, th: TH, no: r.no, title: r.n, face: f });
  r.sign = r.doorG.userData.signObj;
  G.number({ x: r.dx - f * 1.62, y: 1.5, z: zc + f * (HT + .004), ry: r.south ? Math.PI : 0, n: r.no, size: 1.15 });
  r.doorBlock = [r.dx - DW / 2, zc - HT, r.dx + DW / 2, zc + HT]; r.lockedNow = false; });
function drawSign(r) { r.doorG.userData.sign(r.state === 'next' ? 'open' : r.state, r.state === 'done' ? 'пройдено' : r.state === 'next' ? 'сюда дальше' : r.state === 'lock' ? 'закрыто' : (r.tasks.length > 1 ? r.tasks.length + ' задания' : '1 задание')); }
function setLocked(r, on) { if (r.lockedNow === on) return; r.lockedNow = on; r.doorG.userData.locked = on; var b = r.doorBlock;
  if (on) R.blocks.push(b); else { var i = R.blocks.indexOf(b); if (i >= 0) R.blocks.splice(i, 1); } }

/* ---------- свет: запечён в стены и пол (inter.js); тени даёт один источник, он стоит над тем местом, где ученик ---------- */
var curReg = '', lightAt = [1e9, 1e9];
R.frame(function () { var p = R.camera.position, rg = region(p.x, p.z), r = roomById(rg);
  if (rg !== curReg) { curReg = rg; lightAt = [1e9, 1e9];
    /* комнаты, куда сейчас не заглянуть, не рисуем (быстрее на телефоне) */
    ROOMS.forEach(function (q) { G.show(q.shell, q.id === rg || rg === 'C' || (rg === 'L' && q.i === 0) || !!(r && Math.abs(q.i - r.i) <= 0 && q !== r)); });
    G.show(SHELLS.L, rg === 'L' || rg === 'C' || !!(r && r.i < 2)); }
  var lx = r ? r.dx : Math.round(p.x / 2) * 2, lz = r ? (r.z0 + r.z1) / 2 : Math.round(p.z / 2) * 2;
  if (lx !== lightAt[0] || lz !== lightAt[1]) { lightAt = [lx, lz]; G.lightRoom(lx, lz, H); } });

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
  var g = grp(o.x, 0, o.z, o.ry); g.add(G.rbox(o.w + .12, o.h + .12, .17, .035, std('#0c0e16', .3, .6), 0, o.y, -.045));
  var hl = G.halo(A, .2, o.w * 1.8, o.h * 1.9); hl.position.set(0, o.y, -.1); g.add(hl);
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
function poster(w, h, draw, x, y, z, ry) { var pk = Math.round((x - LX) / RW) * RW + LX; if (x > LX - .2 && Math.abs(x - pk) < .07 && pk < W - 1) x = pk + Math.sin(ry) * (HT + .012); else if (x > W - .1) x = W - .012;
  var t = R.tex(Math.round(w * 400), Math.round(h * 400), draw); var m = plane(w, h, std('#ffffff', .85), x, y, z, ry); m.material.map = t; m.material.needsUpdate = true; return m; }
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
/* выход в город: такая же дверь, зелёная; за ней - летающий город */
var GRN = '#7dffb0', EDW = 1.6;
var door = G.door({ x: LX / 2, z: D + HT, axis: 'x', w: EDW, h: DH, th: TH, no: '➜', title: 'ВЫХОД В ГОРОД', sub: 'на карту курса', face: -1, color: GRN, auto: false });
R.frame(function () { var p = R.camera.position; door.userData.setOpen(curReg === 'L' && Math.abs(p.x - LX / 2) < 1.8 && p.z > D - 3.2 ? 1 : 0); });
var exitIt = R.item({ obj: door, name: 'Выход в город', sub: 'Вернуться на карту курса.', at: [LX / 2, D - 1.2], look: [LX / 2, 1.5, D], tagY: 3.0, act: exitRoom }); exitIt.reg = 'L'; exitIt.noTag = true; exitIt.at3 = [LX / 2, 0, D];   /* над дверью своя табличка */
/* скамья и шкафчик в холле */
box(2.2, .08, .5, std('#8a6a48', .6), 1.0, .45, 12.5).rotation.y = Math.PI / 2; box(.5, .42, .1, std('#3a3f4c', .5, .6), .6, .21, 11.6); box(.5, .42, .1, std('#3a3f4c', .5, .6), .6, .21, 13.4);
R.block(.3, 11.3, 1.3, 13.7);
put('clock', 1.3, 2.75, .02 + .13 / 2, 0, 1.2);
poster(.9, 1.2, function (c, w, h) { warn(c, w, h, ['АКБ - не игрушка.', 'Заряжаем только', 'со взрослым.', 'Вздулась - в песок!'], 'ПРАВИЛА'); }, .02 + TH / 2 - .1, 1.6, 14.6, Math.PI / 2);

/* ---------- фото села Иртыш на стенах (снимки Alexandr, без людей) ---------- */
function foto(file, title, w, h, x, y, z, ry) { return G.picture({ file: 'foto-selo/' + file + '.jpg', title: title, w: w, h: h, x: x, y: y, z: z, ry: ry }); }
var FW = 1.6, FH = 1.2, PW = .9, PH = 1.2, FY = 1.65, cN = CZ0 + TH / 2 + .005, cS = CZ1 - TH / 2 - .005;
/* холл: большое фото у западной стены */
foto('02-spektr', 'Центр "Спектр", село Иртыш', 2.3, 2.24, TH / 2 - .1 + .005, 1.75, 5.6, Math.PI / 2);
/* коридор: между дверями комнат */
foto('03-arka', 'Арка в сквере', PW, PH, 16, FY, cN, 0);
foto('05-zakat', 'Закат над площадью', FW, FH, 24, FY, cN, 0);
foto('07-hram', 'Храм в селе Иртыш', PW, PH, 32, FY, cN, 0);
foto('08-gorodok', 'Детский городок', FW, FH, 16, FY, cS, Math.PI);
foto('04-izylbash', 'Парк "История станицы Изылбаш"', PW * .87, PH * 1.1, 24, FY, cS, Math.PI);
foto('06-zakat-fonari', 'Фонари на закате', FW, FH, 32, FY, cS, Math.PI);
/* торец коридора: фотообои - село с высоты */
foto('01-selo-sverhu', 'Село Иртыш с высоты', 2.7, 2.02, W - .005, 1.72, CZM, -Math.PI / 2);

/* ---------- голос: приветствие этажа и название комнаты при входе ---------- */
var HELLO = 'Модуль третий. Аккумуляторная. Это этаж с восемью комнатами. В холле - большой экран с теорией и план этажа. Задания можно делать в любом порядке: заходи в любую комнату.';
var heard = {}, helloDone = false;
function sayOk() { return window.GOLOS && GOLOS.on && GOLOS.can && GOLOS.can() && !lect.on; }
function hello() { if (helloDone || !sayOk()) return; helloDone = true; GOLOS.say(HELLO); setTimeout(function () { if (!window.speechSynthesis || !speechSynthesis.speaking) helloDone = false; }, 900); }
/* браузер разрешает голос только после нажатия: пробуем сразу, а если молчит - при первом касании или клавише */
setTimeout(hello, 1200);
['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, function () { if (!helloDone) hello(); }, { passive: true }); });
/* 10.11: название комнаты не обрывает приветствие на полуслове - ждёт, пока голос договорит (если ученик ещё в комнате) */
R.frame(function () { var r = roomById(curReg); if (!r || heard[r.id] || !sayOk() || (helloDone && window.speechSynthesis && speechSynthesis.speaking)) return; heard[r.id] = true; helloDone = true;
  GOLOS.say('Комната ' + r.no + '. ' + r.n + '. ' + (r.tasks.length > 1 ? r.tasks.length + ' задания.' : 'Одно задание.')); });

/* ---------- терминал задания (стойка с экраном) ---------- */
var stands = [];
var legM = std('#3a3f4c', .35, .8), bodyM = std('#2a3038', .45, .6);
function terminal(r, tid, u, v, a) { var p = P(r, u, v), ry = RY(r, a), g = grp(p[0], 0, p[1], ry), i = taskNo(tid), tk = TASKS[i];
  var KB = std(GS.dark ? '#1a1f33' : '#eef1f6', .35, GS.dark ? .7 : .15); var kb = new T.Mesh(new T.CylinderGeometry(.3, .34, .05, 40), KB); kb.position.y = .025; g.add(kb); g.add(G.rbox(.12, 1.0, .05, .02, KB, 0, .55, 0));
  var hd = new T.Group(); hd.position.set(0, 1.17, .03); hd.rotation.x = -.42; g.add(hd);
  hd.add(G.rbox(.74, .54, .05, .04, std('#0c0e16', .3, .6)));
  var tex = R.tex(512, 360, function () {}); var scr = new T.Mesh(new T.PlaneGeometry(.64, .44), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.z = .028; hd.add(scr);
  var rim = box(.5, .012, .012, neon(A), 0, .285, .0, hd);
  var ring = new T.Mesh(new T.RingGeometry(.6, .66, 56), new T.MeshBasicMaterial({ color: col(A), transparent: true, opacity: .7, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, .012, .5); g.add(ring); var kh = G.halo(A, .3, 2.0); kh.rotation.x = -Math.PI / 2; kh.position.set(0, .014, .5); g.add(kh);
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
function roomBanner(r) { return; var p = P(r, 4, RD7 - .12), t = R.tex(1024, 160, function (c, w, h) { c.fillStyle = '#1d4e74'; c.fillRect(0, 0, w, h); U.txt(c, r.no + '. ' + r.n.toUpperCase(), w / 2, h / 2 + 2, 70, '#fff', 'center', 900); });
  plane(2.6, .4, new T.MeshBasicMaterial({ map: t, toneMapped: false }), p[0], 2.85, p[1] + (r.south ? -.01 : .01), RY(r, 0)); }
function stripe(r) { return; /* синяя полоса по стенам комнаты, как в мастерской */ var m = std('#3d6e8f', .6), y = 1.0;
  var a = P(r, 0, RD7), b = P(r, RW, RD7); box(RW, .12, .02, m, (a[0] + b[0]) / 2, y, a[1] + (r.south ? -.01 : .01));
  box(.02, .12, RD7, m, r.ox + .01 + TH / 2 * 0, y, (r.z0 + r.z1) / 2); box(.02, .12, RD7, m, r.ox + RW - .01, y, (r.z0 + r.z1) / 2); }

function holoCell(w, h, d, c) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(.55), transparent: true, opacity: .32, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); m.userData.noShadow = true;
  var e = new T.LineSegments(new T.EdgesGeometry(m.geometry), new T.LineBasicMaterial({ color: new T.Color(c).multiplyScalar(1.5), toneMapped: false })); m.add(e);
  var t = new T.Mesh(new T.BoxGeometry(w * .12, h * .5, d * .5), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(1.6), toneMapped: false })); t.position.x = w * .56; t.userData.noShadow = true; m.add(t); return m; }
/* ---------- КОМНАТА 1. Устройство АКБ: голограмма банок, разрез ---------- */
var r1 = roomById('N0'); roomBanner(r1); stripe(r1); roomScreen(r1, 4);
(function () { var p = P(r1, 4, 3.6), g = grp(p[0], 0, p[1]);
  cyl(.62, .7, .42, std(GS.dark ? '#1a1f33' : '#e9edf3', .3, GS.dark ? .7 : .2), 0, .21, 0, g, 48); cyl(.56, .56, .02, std('#0c0e16', .25, .6), 0, .43, 0, g, 48); var hr = new T.Mesh(new T.TorusGeometry(.5, .012, 8, 64), neon(CY, 1.2)); hr.rotation.x = Math.PI / 2; hr.position.y = .445; g.add(hr); var hh = G.halo(CY, .5, 1.5); hh.rotation.x = -Math.PI / 2; hh.position.y = .45; g.add(hh);
  var holo = new T.Group(); holo.position.y = 1.35; g.add(holo);
  var hm = new T.MeshBasicMaterial({ color: new T.Color(A).multiplyScalar(1.3), wireframe: true, transparent: true, opacity: .6, toneMapped: false });
  for (var k = 0; k < 4; k++) { var cell = holoCell(.8, .13, .5, A); cell.position.y = -.3 + k * .19; holo.add(cell); }
  var beam = new T.Mesh(new T.CylinderGeometry(.5, .5, .95, 48, 1, true), new T.MeshBasicMaterial({ color: col(CY), transparent: true, opacity: .045, blending: T.AdditiveBlending, side: T.DoubleSide, depthWrite: false })); beam.position.y = .95; g.add(beam);
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
(function () { var t = G.rbox(TB.w, TB.d, .06, .05, std(GS.dark ? '#2a2f3d' : '#f1f3f6', .4, GS.dark ? .5 : .1)); t.rotation.x = Math.PI / 2; t.position.y = TB.h; table.add(t); })();
box(TB.w - .3, .012, TB.d - .3, std('#1f3a3c', .95, 0), 0, TB.h + .031, 0, table);

box(TB.w, .025, .03, neon(A, 1.1), 0, TB.h - .02, TB.d / 2 + .005, table);
var holo2 = new T.Group(); holo2.position.set(0, TB.h + .8, 0); table.add(holo2);
var hm2 = new T.MeshBasicMaterial({ color: new T.Color(A).multiplyScalar(1.3), wireframe: true, transparent: true, opacity: .5, toneMapped: false });
for (var hi = 0; hi < 4; hi++) { var cell2 = holoCell(.36, .06, .22, A); cell2.position.y = -.12 + hi * .085; holo2.add(cell2); }
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
(function () { var p = P(r3, 5.6, RD7 - .13); var g = grp(p[0], 0, p[1], RY(r3, 0)); g.add(G.rbox(2.98, 1.72, .06, .05, std('#0c0e16', .3, .6), 0, 1.7, 0));
  var m = new T.Mesh(new T.PlaneGeometry(2.88, 1.62), new T.MeshBasicMaterial({ map: simTex, toneMapped: false })); m.position.set(0, 1.7, .045); g.add(m); })();
var simG = (function () { var p = P(r3, 5.6, 3.6), g = grp(p[0], 0, p[1], RY(r3, Math.PI));
  var cm = std('#16181e', .55, .2), ca = std(STYLE === 'A' ? '#f2a100' : '#d8342c', .5, .1), cf = std('#2a2e38', .3, .8);
  cyl(.34, .36, .04, cf, 0, .02, 0, g, 40); cyl(.05, .05, .36, cf, 0, .22, 0, g, 16);
  var st = G.rbox(.6, .58, .14, .06, cm); st.rotation.x = Math.PI / 2; st.position.set(0, .47, .02); g.add(st);
  var bk = new T.Group(); bk.position.set(0, .5, -.27); bk.rotation.x = -.14; g.add(bk);
  bk.add(G.rbox(.58, .86, .12, .1, cm, 0, .45, 0)); bk.add(G.rbox(.22, .7, .13, .06, ca, 0, .43, .005)); bk.add(G.rbox(.3, .2, .12, .07, cm, 0, .98, .02));
  [-1, 1].forEach(function (s) { bk.add(G.rbox(.09, .6, .2, .04, cm, s * .3, .4, .07)); g.add(G.rbox(.07, .05, .4, .02, cf, s * .36, .68, .02)); cyl(.018, .018, .2, cf, s * .36, .57, -.1, g, 10); });
  /* стойка с пультом перед креслом */
  cyl(.025, .025, .78, cf, 0, .39, .62, g, 12); cyl(.16, .18, .03, cf, 0, .015, .62, g, 28);
  var pl = G.rbox(.3, .17, .05, .04, std('#23262d', .45, .3)); pl.rotation.x = -1.1; pl.position.set(0, .8, .6); g.add(pl);
  [-1, 1].forEach(function (s) { var k = cyl(.012, .012, .05, std('#c9ccd2', .3, .9), s * .08, .84, .6, g, 10); k.rotation.x = .47; }); R.block(p[0] - .45, p[1] - .45, p[0] + .45, p[1] + .45); return g; })();
var simIt = R.item({ obj: simG, name: 'Кресло-симулятор', kicker: 'Полёты модуля', sub: 'Полёты в симуляторе: следим за временем и вольтами, учимся плавному газу.',
  at: (function () { var p = P(r3, 4.2, 3.0); return p; })(), look: (function () { var p = P(r3, 5.6, 3.6); return [p[0], .9, p[1]]; })(), tagY: 1.9, actLabel: 'Сесть',
  act: function () { openTask(taskState('fly_sim1') === 'done' ? 'fly_sim2' : 'fly_sim1'); } }); simIt.reg = 'N1'; simIt.at3 = (function () { var p = P(r3, 5.6, 3.6); return [p[0], 0, p[1]]; })();
foto('09-klass-spektr', 'Наш класс в "Спектре"', 2.4, 1.8, r3.ox + TH / 2 + .005, 1.7, CZ0 - 4.3, Math.PI / 2);
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
(function () { var top = G.rbox(ZB.w + .04, ZB.d + .04, .05, .03, G.pbr ? std(GS.dark ? '#2b3040' : '#c9a57a', .55, 0) : std('#c9a57a', .55)); top.rotation.x = Math.PI / 2; top.position.y = ZB.h - .005; bench.add(top);
  var bm = std(GS.dark ? '#1c2132' : '#eef1f5', .4, GS.dark ? .6 : .1), hm = std('#8d939e', .3, .9), fx = -ZB.w / 2;
  box(ZB.w - .06, .1, ZB.d - .04, std('#14161f', .5, .4), .02, .05, 0, bench);
  for (var i = 0; i < 3; i++) { var z = (i - 1) * (ZB.d / 3); box(ZB.w - .04, ZB.h - .16, ZB.d / 3 - .03, bm, .01, .1 + (ZB.h - .16) / 2, z, bench);
    for (var j = 0; j < 3; j++) { var y = .22 + j * .235; box(.012, .2, ZB.d / 3 - .1, bm, fx + .012, y + .04, z, bench); box(.02, .016, .3, hm, fx - .002, y + .11, z, bench); } } })();
box(.03, .03, ZB.d, neon(OR, 1.1), -ZB.w / 2 - .005, ZB.h - .02, 0, bench);
var peg = R.tex(512, 512, function (c, w, h) { c.fillStyle = '#c9cdd2'; c.fillRect(0, 0, w, h); c.fillStyle = '#6d727a'; for (var i = 16; i < w; i += 32) for (var j = 16; j < h; j += 32) { c.beginPath(); c.arc(i, j, 4, 0, 7); c.fill(); } });
var pb = new T.Mesh(new T.PlaneGeometry(ZB.d, 1.3), std('#ffffff', .8)); pb.material.map = peg; pb.position.set(.45 - HT - .012, ZB.h + .85, 0); pb.rotation.y = -Math.PI / 2; bench.add(pb);
var zSign = R.tex(1024, 200, function (c, w, h) { c.fillStyle = '#0b0d1e'; c.fillRect(0, 0, w, h); U.txt(c, '⚡ ЗАРЯДНАЯ СТАНЦИЯ', w / 2, 70, 64, OR); U.txt(c, 'заряжаем только под присмотром', w / 2, 150, 36, '#ffe3c8', 'center', 700); });
var zs = new T.Mesh(new T.PlaneGeometry(2.2, .43), new T.MeshBasicMaterial({ map: zSign, toneMapped: false })); zs.position.set(.45 - HT - .014, ZB.h + 1.78, 0); zs.rotation.y = -Math.PI / 2; bench.add(zs);
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
var guideG, guideKey; var beacon = new T.Mesh(new T.ConeGeometry(.13, .26, 4), neon(A, 2)); beacon.rotation.x = Math.PI; sc.add(beacon);
var nextStand = null;
function refreshAll() { var nx = null;
  stands.forEach(function (s) { s.st = taskState(s.tid); s.draw(); s.item.state = s.st === 'done' ? 'done' : ''; R.setTag(s.item); });
  TASKS.forEach(function (t) { if (nx) return; var s = stands.find(function (x) { return x.tid === t[0]; }); if (s && s.st === 'open') nx = s; });
  nextStand = nx;
  ROOMS.forEach(function (r) { var st = r.tasks.map(taskState), all = st.every(function (x) { return x === 'done'; }), lock = st.every(function (x) { return x === 'lock'; });
    r.state = all ? 'done' : (nx && nx.room === r) ? 'next' : lock ? 'lock' : 'open'; setLocked(r, r.state === 'lock'); drawSign(r); });
  R.setNext(nx ? nx.item : null); nextBar(nx); drawPlan();
  var gk = nx ? nx.room.id : ''; if (gk !== guideKey) { guideKey = gk; G.remove(guideG); guideG = nx ? G.guide([[LX + .6, CZM], [nx.room.dx, CZM], [nx.room.dx, nx.room.dz + (nx.room.south ? -.3 : .3)]]) : null; } }
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
function adoptAll() { sc.children.slice().forEach(function (o) { if (o === G.world || o === G.mirrorGroup || o.isLight || o === beacon) return; G.adopt(o); }); }
var envDone = false; function finish() { adoptAll(); if (!envDone) { envDone = true; try { G.bakeEnv(LX / 2, 1.5, CZM); } catch (e) {} } window.AKB_READY = true; }
document.addEventListener('akb-loaded', function () { setTimeout(finish, 150); }); setTimeout(finish, 6000);
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
