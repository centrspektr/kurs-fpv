/* gonki-etazh.js - модуль 5 "FPV-гонки" как гоночный клуб от первого лица (проба 11.11.2026).
   Холл, неоновый коридор с шестью боксами (в каждом своя тема и свои задания) и крытый зал с трассой:
   в зале можно пролететь заезд от первого лица через ворота на время.
   Графика - набор inter.js (стиль "Неоновая станция"), движок - komnata-g.js. Общие куски (стойка задания, модели, нижняя строка)
   взяты из akb-etazh-g.js сборщиком (interier-grafika/kod/m5.py в файлах проекта).
   Нужны: three.min.js, GLTFLoader.js, RoomEnvironment.js, post.js, inter.js, komnata-g.js, golos-new.js. */
(function () {
'use strict';
var T = THREE, A = '#ffd36e', CY = '#7cf3ff', GR = '#9dff7c', OR = '#ff9f5a', RD = '#ff5d6c', PK = '#ff5ad0', VI = '#b7a4ff';
var U = { rr: function (c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); },
  txt: function (c, s, x, y, sz, col, al, wt) { c.font = (wt || 800) + ' ' + sz + 'px Manrope, "Segoe UI", sans-serif'; c.fillStyle = col || '#fff'; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); } };
var CFG = window.KURSY || {};
function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

/* задания модуля 5 (в курсе названия берутся из движка курса) */
var TASKS = [
  ['m5_race', 'Что такое дрон-рейсинг'], ['m5_class', 'Классы гонок'], ['m5_fly1', 'Полёт: разные трассы'],
  ['m5_rules', 'Правила гонки'], ['m5_video', 'Видеоканалы на гонке'], ['m5_roles', 'Роли на гонке'],
  ['m5_fly2', 'Полёт: мини-заезд в зале'], ['m5_rep', 'Повторение: гонка Коли'], ['m5_coach', 'На занятии: мини-гонка и викторина'], ['m5_final', 'Итог модуля']];
var HOST = null; try { if (parent !== window && parent.VZ_KURS_INFO && parent.KURS_KOMNATA) HOST = parent; } catch (e) {}
function exitRoom() { if (HOST) try { HOST.KURS_KOMNATA.close(); return; } catch (e) {} toast('Здесь выход на карту курса'); }
try { if (HOST && HOST.VZ_KURS) TASKS = TASKS.map(function (t) { var L = HOST.VZ_KURS.lib[t[0]]; return [t[0], L ? L.t : t[1]]; }); } catch (e) {}
function taskState(tid) { try { if (HOST) return HOST.VZ_KURS_INFO.task(tid); } catch (e) {} var d = JSON.parse(lsG('gonki_demo_done') || '[]'); return d.indexOf(tid) >= 0 ? 'done' : 'open'; }
function taskNo(tid) { for (var i = 0; i < TASKS.length; i++) if (TASKS[i][0] === tid) return i; return -1; }

/* ---------- план клуба (метры) ----------
   холл x 0..8 (вся глубина), коридор x 8..32, z 7..10.2; боксы 8 x 7: северные z 0..7, южные z 10.2..17.2;
   зал с трассой x 32..50 на всю глубину, потолок выше. Номера боксов идут зигзагом, зал - последний. */
var W = 50, D = 17.2, H = 3.2, HH = 5.6, CZ0 = 7, CZ1 = 10.2, CZM = (CZ0 + CZ1) / 2, LX = 8, RW = 8, RD7 = 7, ZX = 32, ZW = 2.4, ZH = 2.6;
var ROOMS = [
  { id: 'N0', n: 'Дрон-рейсинг', tasks: ['m5_race'] },
  { id: 'S0', n: 'Классы дронов', tasks: ['m5_class'] },
  { id: 'N1', n: 'Симулятор', tasks: ['m5_fly1'] },
  { id: 'S1', n: 'Судейская', tasks: ['m5_rules', 'm5_roles'] },
  { id: 'N2', n: 'Видеоканалы', tasks: ['m5_video'] },
  { id: 'S2', n: 'Брифинг', tasks: ['m5_rep', 'm5_coach'] },
  { id: 'Z', n: 'Зал с трассой', tasks: ['m5_fly2', 'm5_final'], zal: true }];
ROOMS.forEach(function (r, k) { r.k = k; r.no = k + 1;
  if (r.zal) { r.ox = ZX; r.dx = ZX; r.dz = CZM; r.z0 = 0; r.z1 = D; r.inP = [ZX + 1.7, CZM]; r.outP = [ZX - 1.7, CZM]; r.cx = (ZX + W) / 2; return; }
  r.south = r.id[0] === 'S'; r.i = +r.id[1]; r.ox = LX + r.i * RW; r.dx = r.ox + RW / 2; r.cx = r.dx;
  r.z0 = r.south ? CZ1 : 0; r.z1 = r.south ? D : CZ0; r.dz = r.south ? CZ1 : CZ0;
  r.inP = [r.dx, r.south ? CZ1 + 1.1 : CZ0 - 1.1]; r.outP = [r.dx, CZM]; });
function roomById(id) { for (var i = 0; i < ROOMS.length; i++) if (ROOMS[i].id === id) return ROOMS[i]; return null; }
var ZAL = roomById('Z');
function region(x, z) { if (x < LX) return 'L'; if (x >= ZX) return 'Z'; if (z >= CZ0 && z <= CZ1) return 'C'; var i = Math.max(0, Math.min(2, Math.floor((x - LX) / RW))); return (z < CZ0 ? 'N' : 'S') + i; }
/* местные координаты: в боксе u - вдоль двери (0..8), v - вглубь от двери (0..7); в зале u - вдоль стены с воротами (z), v - вглубь зала */
function P(r, u, v) { if (r.zal) return [ZX + v, u]; return r.south ? [r.ox + RW - u, CZ1 + v] : [r.ox + u, CZ0 - v]; }
function RY(r, a) { if (r.zal) return (a || 0) - Math.PI / 2; return (a || 0) + (r.south ? Math.PI : 0); } /* a=0 - предмет смотрит на дверь */

var R = KOMNATA.create({ canvas: document.getElementById('c'), ui: document.getElementById('ui'), size: [W, D, H], color: A,
  start: [4, 15], look: [6.2, 1.5, 4], exposure: 1.0, bg: '#04050c', eye: 1.6 });
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
var STYLE = (/[?&]s=([ABC])/.exec(location.search) || [])[1] || 'B';
function autoQ() { var mob = matchMedia('(pointer:coarse)').matches || Math.min(innerWidth, innerHeight) < 600, mem = navigator.deviceMemory || 4, cpu = navigator.hardwareConcurrency || 4;
  if (mob) return (mem <= 3 || cpu <= 4) ? 'low' : 'mid'; return 'high'; }
var QUAL = (/[?&]q=(high|mid|low)/.exec(location.search) || [])[1] || lsG('kursy_grafika') || autoQ();
var G = INTER.create({ renderer: R.renderer, scene: sc, camera: R.camera, style: STYLE, accent: STYLE === 'B' ? PK : STYLE === 'A' ? '#e0409a' : A, quality: QUAL, tex: 'tex/' }), GS = G.S;
window.AKB_G = G;
var FPRB = (function () { try { return /\/((new|g|index)\.html)?$/.test(parent.location.pathname) || /[?&](new|g)\b/.test(location.search); } catch (e) { return false; } })(), fpsL = 0; /* 12.11: в пробе графика легчает уже при 40 кадрах (сначала резкость), чтобы поворот был плавным */
var fpsN = 0, fpsT = 0, fpsWait = /[?&]q=/.test(location.search) ? 1e9 : 4;
R.renderFn = function (dt) { G.render(dt); if (fpsWait > 0) { fpsWait -= dt; return; } fpsN++; fpsT += dt;
  if (fpsN >= 70) { if (fpsT / fpsN > (FPRB ? (fpsL ? 1 / 26 : 1 / 40) : 1 / 21) && document.visibilityState === 'visible') { fpsL++; var st = G.lower(); if (st === 2) lsS('kursy_grafika', 'low'); fpsWait = 3; } fpsN = 0; fpsT = 0; } };
R.onResize = function (w, h) { G.resize(w, h, Math.min(window.devicePixelRatio || 1, QUAL === 'high' ? 2 : QUAL === 'mid' ? 1.5 : 1.25)); }; R.onResize(innerWidth, innerHeight);
var TH = .24, DW = 1.6, DH = 2.3, HT = TH / 2;
function blockRect(x0, z0, x1, z1) { R.block(x0, z0, x1, z1); }
function blockP(r, u0, v0, u1, v1) { var a = P(r, u0, v0), b = P(r, u1, v1); R.block(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])); }
var SHELLS = {};
/* холл */
SHELLS.L = G.room({ x0: 0, z0: 0, x1: LX - HT, z1: D, h: H, holes: { e: [[CZ0 + HT, CZ1 - HT, H]], s: [[.55, 2.75, 2.7, .7], [LX / 2 - .8, LX / 2 + .8, DH], [5.25, LX - HT - .55, 2.7, .7]] },
  lamps: [[4, 3, 1, 0], [4, 7, 1, 0], [4, 11, 1, 0], [4, 15, 1, 0]], walls: { n: GS.feature }, glows: [[4, 2, PK, 3, .35], [4, 14, CY, 3, .3]] });
G.window({ axis: 'x', c: D, a0: .55, a1: 2.75, y0: .7, y1: 2.7, out: 1 }); G.window({ axis: 'x', c: D, a0: 5.25, a1: LX - HT - .55, y0: .7, y1: 2.7, out: 1 });
/* коридор */
(function () { var hn = [], hs = [], lamps = [], glows = [];
  ROOMS.forEach(function (r) { if (r.zal) return; (r.south ? hs : hn).push([r.dx - DW / 2, r.dx + DW / 2, DH]); glows.push([r.dx, r.south ? CZ1 - .6 : CZ0 + .6, r.k % 2 ? CY : PK, 2.2, .4]); });
  for (var x = 10; x < ZX; x += 4) lamps.push([x, CZM, 1, 0]);
  SHELLS.C = G.room({ x0: LX - HT, z0: CZ0 + HT, x1: ZX - HT, z1: CZ1 - HT, h: H, holes: { n: hn, s: hs, w: [[CZ0 + HT, CZ1 - HT, H]], e: [[CZM - ZW / 2, CZM + ZW / 2, ZH]] }, lamps: lamps, glows: glows });
  [[CZ0, hn], [CZ1, hs]].forEach(function (q) { var a = LX - HT; q[1].slice().sort(function (m, n) { return m[0] - n[0]; }).forEach(function (h) { blockRect(a, q[0] - HT, h[0], q[0] + HT); a = h[1]; }); blockRect(a, q[0] - HT, ZX, q[0] + HT); });
  for (var i = 0; i <= 3; i++) { var px = LX + i * RW; blockRect(px - HT, 0, px + HT, CZ0 - HT); blockRect(px - HT, CZ1 + HT, px + HT, D); }
  blockRect(ZX - HT, CZ0 - HT, ZX + HT, CZM - ZW / 2); blockRect(ZX - HT, CZM + ZW / 2, ZX + HT, CZ1 + HT); })();
/* боксы */
ROOMS.forEach(function (r) { if (r.zal) return; var x0 = r.ox + HT, x1 = r.ox + RW - HT, z0 = r.south ? CZ1 + HT : 0, z1 = r.south ? D : CZ0 - HT, hl = {}, wl = {};
  hl[r.south ? 'n' : 's'] = [[r.dx - DW / 2, r.dx + DW / 2, DH]]; wl[r.south ? 's' : 'n'] = GS.feature;
  var cc = r.k % 2 ? CY : PK, c1 = P(r, 1.2, 5.8), c2 = P(r, 6.8, 5.8);
  r.shell = G.room({ x0: x0, z0: z0, x1: x1, z1: z1, h: H, holes: hl, walls: wl, glows: [[c1[0], c1[1], cc, 2.6, .4], [c2[0], c2[1], cc, 2.6, .4]],
    lamps: [[2.2, 2.3], [5.8, 2.3], [2.2, 5.2], [5.8, 5.2]].map(function (q) { var p = P(r, q[0], q[1]); return [p[0], p[1], 1, 0]; }) }); });
/* зал с трассой */
(function () { var lamps = [], x, z; for (x = ZX + 3; x < W; x += 4.2) for (z = 2.4; z < D; z += 4.2) lamps.push([x, z, 1.15, 0]);
  ZAL.shell = G.room({ x0: ZX + HT, z0: 0, x1: W, z1: D, h: HH, holes: { w: [[CZM - ZW / 2, CZM + ZW / 2, ZH]], e: [[3, D - 3, 4.4, 1.3]] }, walls: { n: GS.feature, s: GS.feature }, lamps: lamps,
    glows: [[ZX + 4, 3, PK, 4, .35], [W - 4, D - 3, CY, 4, .35], [W - 4, 3, VI, 4, .3], [ZX + 6, D - 3, CY, 4, .3]] });
  G.window({ axis: 'z', c: W, a0: 3, a1: D - 3, y0: 1.3, y1: 4.4, out: 1 }); })();

/* ---------- двери ---------- */
ROOMS.forEach(function (r) {
  if (r.zal) { r.doorG = G.door({ x: ZX, z: CZM, axis: 'z', w: ZW, h: ZH, th: TH, no: r.no, title: r.n, face: -1, color: CY }); r.sign = r.doorG.userData.signObj;
    r.doorBlock = [ZX - HT, CZM - ZW / 2, ZX + HT, CZM + ZW / 2]; r.lockedNow = false; return; }
  var zc = r.south ? CZ1 : CZ0, f = r.south ? -1 : 1;
  r.doorG = G.door({ x: r.dx, z: zc, axis: 'x', w: DW, h: DH, th: TH, no: r.no, title: r.n, face: f });
  r.sign = r.doorG.userData.signObj;
  G.number({ x: r.dx - f * 1.62, y: 1.5, z: zc + f * (HT + .004), ry: r.south ? Math.PI : 0, n: r.no, size: 1.15 });
  r.doorBlock = [r.dx - DW / 2, zc - HT, r.dx + DW / 2, zc + HT]; r.lockedNow = false; });
function drawSign(r) { r.doorG.userData.sign(r.state === 'next' ? 'open' : r.state, r.state === 'done' ? 'пройдено' : r.state === 'next' ? 'сюда дальше' : r.state === 'lock' ? 'закрыто' : (r.tasks.length > 1 ? r.tasks.length + ' задания' : '1 задание')); }
function setLocked(r, on) { if (r.lockedNow === on) return; r.lockedNow = on; r.doorG.userData.locked = on; var b = r.doorBlock;
  if (on) R.blocks.push(b); else { var i = R.blocks.indexOf(b); if (i >= 0) R.blocks.splice(i, 1); } }

/* ---------- свет и что рисовать: тени даёт один источник над тем местом, где ученик; далёкие помещения не рисуем ---------- */
var curReg = '', lightAt = [1e9, 1e9];
R.frame(function () { var p = R.camera.position, rg = region(p.x, p.z), r = roomById(rg);
  if (rg !== curReg) { curReg = rg; lightAt = [1e9, 1e9];
    ROOMS.forEach(function (q) { G.show(q.shell, q.id === rg || (rg === 'C' && (q.zal ? p.x > 14 : true)) || (rg === 'L' && q.i === 0)); });
    G.show(SHELLS.L, rg === 'L' || rg === 'C' || !!(r && !r.zal && r.i < 2)); }
  if (rg === 'C') G.show(ZAL.shell, p.x > 14);
  var lx = r ? r.cx : Math.round(p.x / 2) * 2, lz = r ? (r.z0 + r.z1) / 2 : Math.round(p.z / 2) * 2;
  if (lx !== lightAt[0] || lz !== lightAt[1]) { lightAt = [lx, lz]; if (r && r.zal) G.lightRoom(lx, lz, HH, 11); else G.lightRoom(lx, lz, H, 6); } });

/* ---------- экраны на стенах: картинка по теме помещения ---------- */
function bgScr(c, w, h, title, colr) { var g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0a0c22'); g.addColorStop(1, '#1b0f30'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(124,243,255,.07)'; c.lineWidth = 1; for (var x = 0; x < w; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (var y = 0; y < h; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.fillStyle = colr || PK; c.globalAlpha = .16; c.fillRect(0, 0, w, 92); c.globalAlpha = 1; c.fillStyle = colr || PK; c.fillRect(0, 90, w, 3); U.txt(c, title, 44, 48, 40, '#fff', 'left', 900); }
function roomScreen(r, u, title, draw, colr, w, h) { var p = P(r, u, RD7 - .012); w = w || 3.0; h = h || 1.69;
  return G.screen({ x: p[0], y: 1.78, z: p[1], ry: RY(r, 0), w: w, h: h, glow: colr || PK, draw: function (c, cw, ch) { bgScr(c, cw, ch, title, colr); draw(c, cw, ch); } }); }
function trackPic(c, x, y, w, h, n) { c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
  function path() { c.beginPath(); c.moveTo(w * .12, h * .7); c.bezierCurveTo(w * .02, h * .1, w * .4, -h * .05, w * .5, h * .35); c.bezierCurveTo(w * .58, h * .62, w * .72, h * .05, w * .9, h * .25); c.bezierCurveTo(w * 1.03, h * .45, w * .9, h * .98, w * .6, h * .9); c.bezierCurveTo(w * .4, h * .84, w * .2, h * 1.0, w * .12, h * .7); c.closePath(); }
  path(); c.strokeStyle = 'rgba(255,90,208,.25)'; c.lineWidth = 34; c.stroke(); path(); c.strokeStyle = PK; c.lineWidth = 6; c.stroke();
  [[.12, .7], [.3, .12], [.5, .35], [.72, .2], [.93, .5], [.6, .9], [.33, .88]].slice(0, n || 7).forEach(function (q, i) { c.fillStyle = '#0a0c22'; c.strokeStyle = i ? CY : GR; c.lineWidth = 5; c.beginPath(); c.arc(w * q[0], h * q[1], 22, 0, 7); c.fill(); c.stroke(); U.txt(c, i ? String(i) : 'S', w * q[0], h * q[1] + 2, 24, i ? CY : GR, 'center', 900); });
  c.restore(); }
function flagPic(c, x, y, w, h, kind) { if (kind === 'fin') { var n = 6, s = w / n; for (var i = 0; i < n; i++) for (var j = 0; j * s < h - 1; j++) { c.fillStyle = (i + j) % 2 ? '#fff' : '#111'; c.fillRect(x + i * s, y + j * s, s, Math.min(s, h - j * s)); } }
  else { c.fillStyle = kind; c.fillRect(x, y, w, h); } c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; c.strokeRect(x, y, w, h); }

/* ---------- плакаты ---------- */
function poster(w, h, draw, x, y, z, ry) { var t = R.tex(Math.round(w * 400), Math.round(h * 400), draw); var m = plane(w, h, new T.MeshBasicMaterial({ map: t, toneMapped: false }), x, y, z, ry); m.userData.noShadow = true; return m; }

/* ---------- маленькие вещи: подиум, дрон, кубок ---------- */
function ringN(r, colr, y, par, k) { var m = new T.Mesh(new T.TorusGeometry(r, .012, 8, 64), neon(colr, k || 1.3)); m.rotation.x = Math.PI / 2; m.position.y = y; m.userData.noShadow = true; par.add(m); return m; }
function podium(x, z, h, r, colr) { var g = grp(x, 0, z); cyl(r, r + .06, h, std('#161a2c', .3, .7), 0, h / 2, 0, g, 48); cyl(r - .04, r - .04, .02, std('#0a0c16', .2, .8), 0, h + .01, 0, g, 48); ringN(r - .02, colr, h + .022, g);
  var hl = G.halo(colr, .45, r * 3.4); hl.rotation.x = -Math.PI / 2; hl.position.y = h + .03; g.add(hl); R.block(x - r, z - r, x + r, z + r); return g; }
/* дрон: s - размах между моторами (в метрах сцены), whoop - с кольцами-защитой */
function drone(s, colr, whoop) { var g = new T.Group(), dark = std('#15171d', .45, .4), cm = std(colr, .35, .3), a = s / 2;
  [-1, 1].forEach(function (k) { var arm = G.rbox(s * 1.42, s * .05, s * .13, s * .02, dark); arm.rotation.y = k * Math.PI / 4; g.add(arm); });
  g.add(G.rbox(s * .36, s * .16, s * .62, s * .05, cm, 0, s * .1, 0)); g.add(G.rbox(s * .3, s * .12, s * .5, s * .04, dark, 0, s * .22, -s * .02));
  var cam = cyl(s * .07, s * .07, s * .08, std('#0a0a0c', .15, .8), 0, s * .16, s * .34, g, 20); cam.rotation.x = Math.PI / 2 - .5;
  var props = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { var x = q[0] * a, z = q[1] * a; cyl(s * .075, s * .085, s * .12, std('#b9bec9', .25, .9), x, s * .08, z, g, 20);
    var pr = new T.Group(); pr.position.set(x, s * .16, z); g.add(pr); [0, 1].forEach(function (i) { var b = G.rbox(s * (whoop ? .36 : .62), s * .012, s * .06, s * .005, cm); b.rotation.y = i * Math.PI / 2; pr.add(b); }); props.push(pr);
    if (whoop) { var d = new T.Mesh(new T.TorusGeometry(s * .21, s * .022, 8, 32), cm); d.rotation.x = Math.PI / 2; d.position.set(x, s * .15, z); g.add(d); } });
  g.userData.props = props; return g; }
var spin = [];
function showDrone(pg, h, s, colr, whoop, reg) { var d = drone(s, colr, whoop); d.position.y = h + .35; pg.add(d); spin.push({ d: d, y: h + .35, reg: reg, ph: spin.length }); return d; }
R.frame(function (dt, t) { spin.forEach(function (q) { if (q.reg !== curReg) return; q.d.rotation.y += dt * .5; q.d.position.y = q.y + Math.sin(t * 1.3 + q.ph) * .04; q.d.rotation.z = Math.sin(t * .9 + q.ph) * .06; q.d.userData.props.forEach(function (p) { p.rotation.y += dt * 9; }); }); });
function label(par, text, y, z, w, colr) { var t = R.tex(512, 96, function (c, cw, ch) { c.fillStyle = '#0a0c1c'; c.fillRect(0, 0, cw, ch); c.fillStyle = colr; c.fillRect(0, ch - 8, cw, 8); U.txt(c, text, cw / 2, ch / 2 - 2, 46, '#fff', 'center', 900); });
  var m = new T.Mesh(new T.PlaneGeometry(w, w * 96 / 512), new T.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(0, y, z); m.userData.noShadow = true; par.add(m); return m; }

/* ---------- ХОЛЛ ---------- */
G.screen({ x: LX / 2, y: 1.85, z: .012, ry: 0, w: 4.8, h: 2.7, glow: PK, draw: function (c, w, h) { bgScr(c, w, h, 'МОДУЛЬ 5 · ГОНОЧНЫЙ КЛУБ'); U.txt(c, 'FPV-ГОНКИ', w / 2, 190, 110, '#fff', 'center', 900);
  trackPic(c, w * .1, 270, w * .8, 300); U.txt(c, '6 боксов - 6 тем · в конце коридора зал с трассой', w / 2, h - 60, 34, CY, 'center', 800); } });
var planTex = R.tex(1024, 640, function () {});
var planM = plane(2.4, 1.5, new T.MeshBasicMaterial({ map: planTex, toneMapped: false }), LX - HT - .016, 1.7, 3.6, -Math.PI / 2); planM.userData.noShadow = true;
function drawPlan() { var c = planTex.userData.x, w = 1024, h = 640, kx = (w - 80) / W, kz = (h - 140) / D, ox = 40, oz = 100;
  c.fillStyle = '#0b0d1e'; c.fillRect(0, 0, w, h); U.txt(c, 'ПЛАН КЛУБА · МОДУЛЬ 5', 40, 50, 40, A, 'left', 900);
  c.fillStyle = '#2a2f45'; c.fillRect(ox, oz, LX * kx, D * kz); c.fillRect(ox + LX * kx, oz + CZ0 * kz, (ZX - LX) * kx, (CZ1 - CZ0) * kz);
  U.txt(c, 'ХОЛЛ', ox + LX * kx / 2, oz + D * kz / 2 + 60, 26, '#aab', 'center', 800);
  ROOMS.forEach(function (r) { var cc = r.state === 'done' ? GR : r.state === 'next' ? A : r.state === 'lock' ? '#555a78' : CY, rw = r.zal ? W - ZX : RW, rd = r.zal ? D : RD7;
    c.fillStyle = cc; c.globalAlpha = r.state === 'next' ? .9 : .55; c.fillRect(ox + r.ox * kx + 3, oz + r.z0 * kz + 3, rw * kx - 6, rd * kz - 6); c.globalAlpha = 1;
    U.txt(c, String(r.no), ox + (r.ox + rw / 2) * kx, oz + (r.z0 + rd / 2) * kz - 18, 52, '#0b0d1e', 'center', 900);
    U.txt(c, r.n, ox + (r.ox + rw / 2) * kx, oz + (r.z0 + rd / 2) * kz + 30, 20, '#0b0d1e', 'center', 800); });
  var p = R.camera.position; c.fillStyle = '#ff5d6c'; c.beginPath(); c.arc(ox + p.x * kx, oz + p.z * kz, 10, 0, 7); c.fill();
  planTex.needsUpdate = true; }
var planAcc = 0; R.frame(function (dt) { planAcc += dt; if (planAcc > .5 && curReg === 'L') { planAcc = 0; drawPlan(); } });
/* выход в город */
var GRN = '#7dffb0';
var door = G.door({ x: LX / 2, z: D + HT, axis: 'x', w: 1.6, h: DH, th: TH, no: '➜', title: 'ВЫХОД В ГОРОД', sub: 'на карту курса', face: -1, color: GRN, auto: false });
R.frame(function () { var p = R.camera.position; door.userData.setOpen(curReg === 'L' && Math.abs(p.x - LX / 2) < 1.8 && p.z > D - 3.2 ? 1 : 0); });
var exitIt = R.item({ obj: door, name: 'Выход в город', sub: 'Вернуться на карту курса.', at: [LX / 2, D - 1.2], look: [LX / 2, 1.5, D], tagY: 3.0, act: exitRoom }); exitIt.reg = 'L'; exitIt.noTag = true; exitIt.at3 = [LX / 2, 0, D];
/* витрина в холле: гоночный дрон и кубок */
(function () { var pg = podium(1.5, 9.2, .9, .5, PK); showDrone(pg, .9, .46, '#ff3fa4', false, 'L');
  var kg = podium(1.5, 11.4, .9, .42, A), gold = std('#e9b949', .22, 1), cup = new T.Group(); cup.position.y = .93; kg.add(cup);
  cyl(.11, .13, .04, gold, 0, .02, 0, cup, 32); cyl(.025, .035, .16, gold, 0, .12, 0, cup, 16);
  var pts = []; for (var i = 0; i <= 10; i++) { var f = i / 10; pts.push(new T.Vector2(.03 + .11 * Math.sin(f * 1.45), f * .22)); } var bowl = new T.Mesh(new T.LatheGeometry(pts, 40), gold); bowl.material.side = T.DoubleSide; bowl.position.y = .2; cup.add(bowl);
  [-1, 1].forEach(function (k) { var hd = new T.Mesh(new T.TorusGeometry(.05, .01, 8, 20, Math.PI), gold); hd.position.set(k * .13, .33, 0); hd.rotation.z = -k * Math.PI / 2; cup.add(hd); }); })();
/* фото села Иртыш (снимки Alexandr, без людей) */
function foto(file, title, w, h, x, y, z, ry) { return G.picture({ file: 'foto-selo/' + file + '.jpg', title: title, w: w, h: h, x: x, y: y, z: z, ry: ry }); }
var cN = CZ0 + HT + .005, cS = CZ1 - HT - .005;
foto('02-spektr', 'Центр "Спектр", село Иртыш', 2.3, 2.24, .005, 1.75, 5.2, Math.PI / 2);
foto('01-selo-sverhu', 'Село Иртыш с высоты', 1.6, 1.2, 16, 1.65, cN, 0); foto('05-zakat', 'Закат над площадью', 1.6, 1.2, 24, 1.65, cN, 0);
foto('08-gorodok', 'Детский городок', 1.6, 1.2, 16, 1.65, cS, Math.PI); foto('06-zakat-fonari', 'Фонари на закате', 1.6, 1.2, 24, 1.65, cS, Math.PI);

/* ---------- голос ---------- */
var HELLO = 'Модуль пятый. Гонки. Это гоночный клуб: шесть боксов с заданиями и зал с трассой в конце коридора. Задания можно делать в любом порядке. В зале можно пролететь заезд на время.';
/* 13.11: голос говорит записью (mp3), а не голосом устройства - speechSynthesis.speaking тогда false, и приветствие повторялось на каждое нажатие клавиши */
function talking() { var g = window.GOLOS; return !!(g && (g.zt || g.sp || g.au)) || !!(window.speechSynthesis && speechSynthesis.speaking); }
var heard = {}, helloDone = false;
function sayOk() { return window.GOLOS && GOLOS.on && GOLOS.can && GOLOS.can() && !RC.on; }
function hello() { if (helloDone || !sayOk()) return; helloDone = true; GOLOS.say(HELLO); setTimeout(function () { if (!talking()) helloDone = false; }, 900); }
setTimeout(hello, 1200);
['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, function () { if (!helloDone) hello(); }, { passive: true }); });
R.frame(function () { var r = roomById(curReg); if (!r || heard[r.id] || !sayOk() || (helloDone && talking())) return; heard[r.id] = true; helloDone = true;
  GOLOS.say((r.zal ? '' : 'Бокс ' + r.no + '. ') + r.n + '. ' + (r.tasks.length > 1 ? r.tasks.length + ' задания.' : 'Одно задание.')); });

/* ---------- стойка задания ---------- */
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
  s.item = R.item({ obj: g, name: (i + 1) + '. ' + tk[1], kicker: 'Задание ' + (i + 1), sub: 'Открыть задание модуля 5.', at: [p[0] + f[0] * 1.1, p[1] + f[1] * 1.1], look: [p[0], 1.2, p[1]], tagY: 2.0, tagFar: 7,
    actLabel: 'Начать задание', state: s.st === 'done' ? 'done' : '', act: function () { openTask(tid); } });
  s.item.at3 = [p[0], 0, p[1]]; s.item.reg = r.id;
  R.block(p[0] - .32, p[1] - .32, p[0] + .32, p[1] + .32);
  stands.push(s); return s; }


/* ---------- БОКС 1. Дрон-рейсинг: трасса на экране, гоночный дрон ---------- */
var r1 = roomById('N0');
roomScreen(r1, 4, 'БОКС 1 · ДРОН-РЕЙСИНГ', function (c, w, h) { trackPic(c, w * .08, 150, w * .5, 420); U.txt(c, 'старт', w * .78, 210, 44, GR, 'center', 900); U.txt(c, 'ворота по порядку', w * .78, 290, 40, CY, 'center', 800); U.txt(c, '3 круга', w * .78, 370, 40, '#fff', 'center', 800); U.txt(c, 'финиш', w * .78, 450, 44, A, 'center', 900); U.txt(c, 'побеждает самый быстрый и точный', w * .78, 560, 26, '#aab', 'center', 700); });
(function () { var p = P(r1, 2.2, 4.4), pg = podium(p[0], p[1], .8, .55, PK); showDrone(pg, .8, .5, '#ff3fa4', false, 'N0'); })();
/* маленькие ворота-образец */
(function () { var p = P(r1, 6.4, 5.2), g = grp(p[0], 0, p[1], RY(r1, -.5)); gateMesh(g, 1.1, CY, 1.0); blockP(r1, 5.7, 4.9, 7.1, 5.5); })();
terminal(r1, 'm5_race', 5.0, 2.6, -.3);

/* ---------- БОКС 2. Классы дронов: три подиума ---------- */
var r2 = roomById('S0');
roomScreen(r2, 4, 'БОКС 2 · КЛАССЫ ГОНОК', function (c, w, h) { [['ВУП', '65-75 мм', 'в зале, с защитой', CY, 60], ['3 ДЮЙМА', 'мини', 'зал и улица', GR, 95], ['5 ДЮЙМОВ', 'взрослый класс', 'только улица', PK, 140]].forEach(function (q, i) { var x = w * (.2 + i * .3);
  c.strokeStyle = q[3]; c.lineWidth = 8; c.beginPath(); c.arc(x, 290, q[4], 0, 7); c.stroke(); c.beginPath(); c.moveTo(x - q[4] * .7, 290 - q[4] * .7); c.lineTo(x + q[4] * .7, 290 + q[4] * .7); c.moveTo(x + q[4] * .7, 290 - q[4] * .7); c.lineTo(x - q[4] * .7, 290 + q[4] * .7); c.stroke();
  U.txt(c, q[0], x, 480, 46, '#fff', 'center', 900); U.txt(c, q[1], x, 535, 30, q[3], 'center', 800); U.txt(c, q[2], x, 580, 26, '#aab', 'center', 700); }); U.txt(c, 'начинают с маленького - растут к большому', w / 2, 660, 28, A, 'center', 800); }, CY);
[[1.9, .28, CY, 'ВУП 65 мм', true, '#39d4e6'], [4.0, .4, GR, '3 ДЮЙМА', false, '#56d66a'], [6.1, .56, PK, '5 ДЮЙМОВ', false, '#ff3fa4']].forEach(function (q) { var p = P(r2, q[0], 5.0), pg = podium(p[0], p[1], .95, .4, q[2]); pg.rotation.y = RY(r2, 0);
  showDrone(pg, .95, q[1], q[5], q[4], 'S0'); label(pg, q[3], .55, .47, .62, q[2]); });
terminal(r2, 'm5_class', 1.5, 2.2, .5);

/* ---------- БОКС 3. Симулятор: кресло и большой экран ---------- */
var r3 = roomById('N1');
roomScreen(r3, 4, 'БОКС 3 · СИМУЛЯТОР', function (c, w, h) { var g = c.createLinearGradient(0, 96, 0, h); g.addColorStop(0, '#1b2a6b'); g.addColorStop(.55, '#ff7eb6'); g.addColorStop(.56, '#141a36'); g.addColorStop(1, '#0a0c1c'); c.fillStyle = g; c.fillRect(0, 96, w, h - 96);
  [[.5, .52, 150], [.33, .56, 80], [.24, .58, 46]].forEach(function (q, i) { c.strokeStyle = i ? CY : A; c.lineWidth = 14 - i * 4; c.strokeRect(w * q[0] - q[2], h * q[1] - q[2], q[2] * 2, q[2] * 2); });
  U.txt(c, '01:24.6', w - 150, 150, 46, '#fff', 'center', 900); U.txt(c, 'КРУГ 2/3', 150, 150, 40, GR, 'center', 900); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2 - 30, h * .55); c.lineTo(w / 2 + 30, h * .55); c.moveTo(w / 2, h * .55 - 30); c.lineTo(w / 2, h * .55 + 30); c.stroke(); }, VI, 3.6, 2.02);
var simG = (function () { var p = P(r3, 4, 3.4), g = grp(p[0], 0, p[1], RY(r3, Math.PI));
  var cm = std('#16181e', .55, .2), ca = std('#ff3fa4', .5, .1), cf = std('#2a2e38', .3, .8);
  cyl(.34, .36, .04, cf, 0, .02, 0, g, 40); cyl(.05, .05, .36, cf, 0, .22, 0, g, 16);
  var st = G.rbox(.6, .58, .14, .06, cm); st.rotation.x = Math.PI / 2; st.position.set(0, .47, .02); g.add(st);
  var bk = new T.Group(); bk.position.set(0, .5, -.27); bk.rotation.x = -.14; g.add(bk);
  bk.add(G.rbox(.58, .86, .12, .1, cm, 0, .45, 0)); bk.add(G.rbox(.22, .7, .13, .06, ca, 0, .43, .005)); bk.add(G.rbox(.3, .2, .12, .07, cm, 0, .98, .02));
  [-1, 1].forEach(function (s) { bk.add(G.rbox(.09, .6, .2, .04, cm, s * .3, .4, .07)); g.add(G.rbox(.07, .05, .4, .02, cf, s * .36, .68, .02)); cyl(.018, .018, .2, cf, s * .36, .57, -.1, g, 10); });
  cyl(.025, .025, .78, cf, 0, .39, .62, g, 12); cyl(.16, .18, .03, cf, 0, .015, .62, g, 28);
  var pl = G.rbox(.3, .17, .05, .04, std('#23262d', .45, .3)); pl.rotation.x = -1.1; pl.position.set(0, .8, .6); g.add(pl);
  ringN(.55, VI, .012, g); R.block(p[0] - .45, p[1] - .6, p[0] + .45, p[1] + .6); return g; })();
var simIt = R.item({ obj: simG, name: 'Кресло-симулятор', kicker: 'Полёт модуля', sub: 'Чистые круги на незнакомых трассах в симуляторе.', at: P(r3, 2.6, 2.8), look: (function () { var p = P(r3, 4, 3.4); return [p[0], .9, p[1]]; })(), tagY: 1.9, actLabel: 'Сесть', act: function () { openTask('m5_fly1'); } }); simIt.reg = 'N1'; simIt.at3 = (function () { var p = P(r3, 4, 3.4); return [p[0], 0, p[1]]; })();
terminal(r3, 'm5_fly1', 1.4, 2.4, .5);
putR(r3, 'desk', 7.45, 2.6, 0, -Math.PI / 2, 1); blockP(r3, 7.0, 1.6, 8, 3.6);

/* ---------- БОКС 4. Судейская: флаги, стартовый светофор, стол судьи ---------- */
var r4 = roomById('S1');
roomScreen(r4, 4, 'БОКС 4 · СУДЕЙСКАЯ', function (c, w, h) { [['#27c24c', 'зелёный', 'старт, трасса свободна'], ['#ffd21f', 'жёлтый', 'внимание, опасность'], ['#e5262b', 'красный', 'стоп, садимся'], ['fin', 'клетчатый', 'финиш']].forEach(function (q, i) { var x = 70 + i * (w - 140) / 4, fw = (w - 140) / 4 - 40;
  flagPic(c, x + 20, 170, fw, 190, q[0]); U.txt(c, q[1], x + 20 + fw / 2, 410, 38, '#fff', 'center', 900); U.txt(c, q[2], x + 20 + fw / 2, 458, 22, '#aab', 'center', 700); });
  U.txt(c, 'пролетел мимо ворот - вернись и пройди их', w / 2, 560, 32, CY, 'center', 800); U.txt(c, 'взлетел до сигнала - фальстарт', w / 2, 620, 32, RD, 'center', 800); }, A);
putR(r4, 'desk', 4, 5.4, 0, Math.PI, 1); putR(r4, 'stool', 4, 6.2, 0, 0, 1); blockP(r4, 3.0, 4.9, 5.0, 6.5);
var svet = (function () { var p = P(r4, 7.0, 4.6), g = grp(p[0], 0, p[1], RY(r4, -.5)); cyl(.2, .24, .05, std('#161a2c', .3, .7), 0, .025, 0, g, 32); cyl(.035, .035, 1.5, std('#8d939e', .3, .9), 0, .78, 0, g, 16);
  g.add(G.rbox(.3, .86, .16, .05, std('#101320', .35, .6), 0, 1.92, 0)); var L = [];
  [[RD, 2.18], [A, 1.92], [GR, 1.66]].forEach(function (q) { var m = new T.Mesh(new T.CircleGeometry(.095, 28), new T.MeshBasicMaterial({ color: new T.Color(q[0]), toneMapped: false })); m.position.set(0, q[1], .082); m.userData.noShadow = true; g.add(m); L.push({ m: m, c: new T.Color(q[0]) }); });
  R.block(p[0] - .25, p[1] - .25, p[0] + .25, p[1] + .25); return L; })();
R.frame(function (dt, t) { if (curReg !== 'S1') return; var ph = Math.floor(t / 1.2) % 4; svet.forEach(function (l, i) { var on = (ph === 0 && i === 0) || (ph === 1 && i < 2) || (ph >= 2 && i === 2); l.m.material.color.copy(l.c).multiplyScalar(on ? 2.6 : .12); }); });
terminal(r4, 'm5_rules', 2.3, 3.0, .4); terminal(r4, 'm5_roles', 5.7, 3.0, -.4);

/* ---------- БОКС 5. Видеоканалы: у каждого пилота свой канал ---------- */
var r5 = roomById('N2'), CHN = [[CY, 'R1', 5658], [GR, 'R2', 5695], [A, 'R3', 5732], [OR, 'R4', 5769], [RD, 'R5', 5806], [PK, 'R6', 5843], [VI, 'R7', 5880], ['#ffffff', 'R8', 5917]];
roomScreen(r5, 4, 'БОКС 5 · ВИДЕОКАНАЛЫ', function (c, w, h) { CHN.forEach(function (q, i) { var x = 70 + i * (w - 140) / 8, bw = (w - 140) / 8 - 16, bh = 170 + 34 * Math.sin(i * 1.7);
  c.fillStyle = q[0]; c.globalAlpha = .85; U.rr(c, x, 470 - bh, bw, bh, 12); c.fill(); c.globalAlpha = 1; U.txt(c, q[1], x + bw / 2, 510, 40, q[0], 'center', 900); U.txt(c, String(q[2]), x + bw / 2, 556, 24, '#aab', 'center', 700); });
  U.txt(c, 'у каждого пилота свой канал - иначе помехи у всех', w / 2, 640, 32, '#fff', 'center', 800); U.txt(c, 'МГц', w - 70, 556, 22, '#aab', 'right', 700); }, CY);
(function () { [1.6, 2.9, 5.1, 6.4].forEach(function (u, i) { var p = P(r5, u, 5.4), g = grp(p[0], 0, p[1], RY(r5, 0)), q = CHN[i * 2];
  cyl(.2, .24, .05, std('#161a2c', .3, .7), 0, .025, 0, g, 32); cyl(.02, .02, 1.25, std('#8d939e', .3, .9), 0, .65, 0, g, 12);
  g.add(G.rbox(.3, .2, .1, .03, std('#101320', .35, .6), 0, 1.0, 0)); var s = G.box(.22, .05, .012, neon(q[0], 1.5), 0, 1.0, .056); s.userData.noShadow = true; g.add(s);
  cyl(.012, .012, .2, std('#222', .4, .5), 0, 1.36, 0, g, 8); var cap = new T.Mesh(new T.SphereGeometry(.06, 20, 12), std(q[0], .35, .1)); cap.scale.y = .55; cap.position.y = 1.48; g.add(cap);
  ringN(.3, q[0], .012, g); label(g, q[1] + ' · ' + q[2], .62, .03, .34, q[0]); R.block(p[0] - .22, p[1] - .22, p[0] + .22, p[1] + .22); }); })();
terminal(r5, 'm5_video', 4, 3.2, 0);

/* ---------- БОКС 6. Брифинг: стулья и экран ---------- */
var r6 = roomById('S2');
roomScreen(r6, 4, 'БОКС 6 · БРИФИНГ ПИЛОТОВ', function (c, w, h) { [['1', 'Пилот', 'летит и слушает судью', CY], ['2', 'Споттер', 'смотрит за дроном и воротами', GR], ['3', 'Судья', 'даёт старт и считает круги', A]].forEach(function (q, i) { var y = 190 + i * 150; c.fillStyle = q[3]; c.beginPath(); c.arc(140, y, 48, 0, 7); c.fill(); U.txt(c, q[0], 140, y + 3, 54, '#0b0d1e', 'center', 900); U.txt(c, q[1], 230, y - 20, 50, '#fff', 'left', 900); U.txt(c, q[2], 230, y + 30, 30, '#aab', 'left', 700); });
  trackPic(c, w * .62, 190, w * .32, 300, 5); U.txt(c, 'повторяем всё перед заездом', w / 2, 660, 30, PK, 'center', 800); }, GR);
[[2.6, 3.3], [4.0, 3.3], [5.4, 3.3], [2.6, 4.7], [4.0, 4.7], [5.4, 4.7]].forEach(function (q) { var p = P(r6, q[0], q[1]); put('schair', p[0], 0, p[1], RY(r6, Math.PI), 1); R.block(p[0] - .3, p[1] - .3, p[0] + .3, p[1] + .3); });
terminal(r6, 'm5_rep', 6.9, 1.8, -.6); terminal(r6, 'm5_coach', 1.1, 1.8, .6);

/* ---------- ЗАЛ С ТРАССОЙ ---------- */
/* ворота: светящаяся рамка на стойках; локальная ось z - куда лететь */
function gateMesh(g, s, colr, y) { var mt = neon(colr, 1.15), dm = std('#161a2c', .35, .7), a = s / 2, th = .07;
  [[0, y + a, s + th, th], [0, y - a, s + th, th], [-a, y, th, s], [a, y, th, s]].forEach(function (q) { var b = G.box(q[2], q[3], th, mt, q[0], q[1], 0); b.userData.noShadow = true; g.add(b); });
  [-a, a].forEach(function (x) { if (y - a > .05) cyl(.03, .03, y - a, dm, x, (y - a) / 2, 0, g, 10); cyl(.14, .16, .03, dm, x, .015, 0, g, 20); });
  var hl = G.halo(colr, .1, s * 2.0); hl.position.set(0, y, 0); g.add(hl); var h2 = G.halo(colr, .1, s * 2.0); h2.position.set(0, y, 0); h2.rotation.y = Math.PI; g.add(h2); g.userData.mt = mt; return g; }
var GATES = [[40.5, 13.6, 1.6, Math.PI / 2], [46.6, 11.2, 2.4, Math.PI], [46.4, 4.6, 3.3, Math.PI], [41.2, 2.8, 1.7, -Math.PI / 2], [36.6, 6.0, 2.6, 0]].map(function (q, i) {
  var g = grp(q[0], 0, q[1], q[3]); gateMesh(g, 1.7, CY, q[2]); G.number({ x: q[0] - Math.sin(q[3]) * .02 + Math.cos(q[3]) * 1.25, y: q[2], z: q[1] - Math.cos(q[3]) * .02 - Math.sin(q[3]) * 1.25, ry: q[3] + Math.PI, n: i + 1, size: .7 });
  R.block(q[0] - .25, q[1] - .25, q[0] + .25, q[1] + .25);
  return { g: g, x: q[0], z: q[1], y: q[2], ry: q[3], n: [Math.sin(q[3]), Math.cos(q[3])], col: g.userData.mt.color }; });
/* старт: клетчатая полоса и площадка */
var START = [36.6, 13.6, 1.3];
(function () { var t = R.tex(256, 64, function (c, w, h) { for (var i = 0; i < 16; i++) for (var j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#9a9aa2' : '#101018'; c.fillRect(i * 16, j * 16, 16, 16); } });
  var m = plane(.6, 2.4, std('#ffffff', .6), 38.2, .012, 13.6, 0, -Math.PI / 2); m.material.map = t; t.wrapS = t.wrapT = T.RepeatWrapping; t.rotation = Math.PI / 2; t.center.set(.5, .5); m.userData.noShadow = true;
  var pd = grp(START[0], 0, START[1]); cyl(.5, .5, .03, std('#0a0c16', .3, .7), 0, .015, 0, pd, 40); ringN(.5, GR, .034, pd); var d = drone(.3, '#39d4e6', true); d.position.y = .07; d.rotation.y = Math.PI / 2; pd.add(d); START.d = d; })();
/* табло на стене */
var best = +lsG('kursy_m5_krug') || 0, lastT = 0;
function fmt(t) { var m = Math.floor(t / 60), s = t - m * 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s.toFixed(1).replace('.', ','); }
function drawTablo(c, w, h) { c.fillStyle = '#05060f'; c.fillRect(0, 0, w, h); c.fillStyle = PK; c.fillRect(0, 0, w, 8); c.fillRect(0, h - 8, w, 8);
  U.txt(c, 'ЛУЧШИЙ КРУГ', w * .27, 80, 44, CY, 'center', 900); U.txt(c, best ? fmt(best) : '--:--,-', w * .27, 210, 130, '#fff', 'center', 900);
  U.txt(c, 'ПОСЛЕДНИЙ', w * .75, 80, 44, A, 'center', 900); U.txt(c, lastT ? fmt(lastT) : '--:--,-', w * .75, 210, 130, lastT && lastT <= best ? GR : '#fff', 'center', 900);
  U.txt(c, '5 ворот по порядку · финиш в воротах 1', w / 2, h - 60, 34, '#aab', 'center', 800); }
var tablo = G.screen({ x: 41, y: 3.7, z: .012, ry: 0, w: 6.4, h: 2.0, glow: PK, px: 1280, draw: drawTablo });
function tabloUp() { var t = tablo.userData.tex; drawTablo(t.userData.x, t.image.width, t.image.height); t.needsUpdate = true; }
/* трибуна у южной стены */
(function () { var m = std('#1a1f36', .4, .5), i; for (i = 0; i < 3; i++) { var z = D - 2.0 + i * .8; box(8, .42 * (i + 1), .8, m, 42, .21 * (i + 1), z);
    var s = G.box(8, .03, .02, neon(i % 2 ? CY : PK, 1.3), 42, .42 * (i + 1) + .005, z - .39); s.userData.noShadow = true; sc.add(s); }
  R.block(38, D - 2.4, 46, D); })();
/* стойка пилота: отсюда начинается заезд */
var pilotG = (function () { var g = grp(34.4, 0, 13.6, Math.PI / 2); g.add(G.rbox(1.1, .06, .6, .03, std('#1c2136', .35, .6), 0, .95, 0)); cyl(.04, .04, .92, std('#8d939e', .3, .9), 0, .46, 0, g, 12); cyl(.3, .34, .04, std('#161a2c', .3, .7), 0, .02, 0, g, 32);
  g.add(G.rbox(.2, .09, .14, .03, std('#101014', .4, .3), -.25, 1.03, 0)); g.add(G.rbox(.24, .1, .16, .04, std('#23262d', .45, .3), .2, 1.03, .02));
  var s = G.box(1.0, .02, .012, neon(GR, 1.5), 0, .93, .31); s.userData.noShadow = true; g.add(s); ringN(.75, GR, .012, g); R.block(34.1, 13.0, 34.7, 14.2); return g; })();
var raceIt = R.item({ obj: pilotG, name: 'Заезд на время', kicker: 'Стойка пилота', sub: 'Надень очки и пролети 5 ворот по порядку от первого лица. Финиш - снова в воротах 1.', at: [33.9, 12.4], look: [36.6, 1.2, 13.6], tagY: 1.9, tagFar: 14, actLabel: 'Лететь', act: function () { raceStart(); } }); raceIt.reg = 'Z'; raceIt.at3 = [34.4, 0, 13.6];
terminal(ZAL, 'm5_fly2', 5.6, 2.6, .25); terminal(ZAL, 'm5_final', 11.6, 2.6, -.25);
putR(ZAL, 'chest', 1.2, .5, 0, Math.PI / 2, 1); blockP(ZAL, .7, .1, 1.7, 1.0);

/* ---------- заезд от первого лица ---------- */
var RC = { on: false, t: 0, go: false, cd: 0, gi: 0, x: 0, y: 0, z: 0, yaw: 0, vx: 0, vy: 0, vz: 0, back: null };
var ax = { thr: 0, yaw: 0, pit: 0, rol: 0 }, kd = {};
var hud = document.createElement('div'); hud.id = 'race'; hud.hidden = true;
hud.innerHTML = '<style>#race{position:absolute;inset:0;z-index:8;pointer-events:none!important;font-weight:900;color:#fff;text-shadow:0 0 8px #000}#race>*{pointer-events:auto}' +
  '#race .r-t{position:absolute;left:50%;top:14px;transform:translateX(-50%);font:900 30px/1 ui-monospace,Menlo,monospace;padding:8px 16px;border-radius:14px;background:#05060dc0;border:1px solid #7cf3ff66;pointer-events:none}' +
  '#race .r-g{position:absolute;left:14px;top:16px;font-size:15px;padding:8px 12px;border-radius:12px;background:#05060dc0;border:1px solid #ff5ad066;pointer-events:none}' +
  '#race .r-x{position:absolute;right:14px;top:12px;padding:10px 14px;border-radius:20px;background:#05060dd0;border:1px solid #ffffff44;font-size:14px;color:#fff}' +
  '#race .r-c{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font-size:min(22vw,150px);color:#ffd36e;pointer-events:none}' +
  '#race .r-h{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);font-size:12.5px;font-weight:700;padding:7px 12px;border-radius:14px;background:#05060dc0;border:1px solid #ffffff22;width:max-content;max-width:calc(100vw - 24px);text-align:center;pointer-events:none}' +
  '#race .r-cr{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px;border:2px solid #ffffffaa;border-radius:50%;pointer-events:none}' +
  '#race .r-s{position:absolute;bottom:26px;width:132px;height:132px;border-radius:50%;background:#ffffff12;border:2px solid #ffffff44;touch-action:none;display:none}#race .r-s i{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px;border-radius:50%;background:#7cf3ffaa;box-shadow:0 0 16px #7cf3ff}' +
  '#race .r-sl{left:22px}#race .r-sr{right:22px}@media (pointer:coarse){#race .r-s{display:block}#race .r-h{bottom:auto;top:62px}}body.k-race .top,body.k-race #nextb,body.k-race #hint,body.k-race .k-tags{display:none!important}</style>' +
  '<div class="r-g"></div><div class="r-t">00:00,0</div><button class="r-x">✕ Выйти</button><div class="r-cr"></div><div class="r-c"></div><div class="r-h"></div><div class="r-s r-sl"><i></i></div><div class="r-s r-sr"><i></i></div>';
document.getElementById('ui').appendChild(hud);
var hT = hud.querySelector('.r-t'), hG = hud.querySelector('.r-g'), hC = hud.querySelector('.r-c'), hH = hud.querySelector('.r-h');
hH.textContent = matchMedia('(pointer:coarse)').matches ? 'Левый стик: вверх-вниз и поворот · правый стик: вперёд-назад и вбок' : 'W S - выше и ниже · A D - поворот · стрелки - вперёд, назад и вбок · Esc - выйти';
hud.querySelector('.r-x').onclick = function () { raceStop(); };
/* стики на экране (как на пульте: левый - газ и поворот, правый - наклоны) */
[['.r-sl', 'yaw', 'thr'], ['.r-sr', 'rol', 'pit']].forEach(function (q) { var el = hud.querySelector(q[0]), nub = el.querySelector('i'), id = null;
  function set(e) { var b = el.getBoundingClientRect(), x = (e.clientX - b.left - b.width / 2) / (b.width / 2), y = (e.clientY - b.top - b.height / 2) / (b.height / 2), L = Math.hypot(x, y); if (L > 1) { x /= L; y /= L; }
    ax[q[1]] = x; ax[q[2]] = -y; nub.style.transform = 'translate(' + x * 40 + 'px,' + y * 40 + 'px)'; }
  function end() { id = null; ax[q[1]] = 0; ax[q[2]] = 0; nub.style.transform = ''; }
  el.addEventListener('pointerdown', function (e) { id = e.pointerId; try { el.setPointerCapture(id); } catch (er) {} set(e); e.preventDefault(); e.stopPropagation(); });
  el.addEventListener('pointermove', function (e) { if (e.pointerId === id) set(e); }); el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); });
addEventListener('keydown', function (e) { if (!RC.on) return; kd[e.code] = 1; if (e.code === 'Escape') raceStop(); if (/^Arrow|Space/.test(e.code)) e.preventDefault(); });
addEventListener('keyup', function (e) { kd[e.code] = 0; }); addEventListener('blur', function () { kd = {}; });
function gateCol() { GATES.forEach(function (g, i) { var k = RC.on ? (i === RC.gi % GATES.length ? 1 : .22) : 1; g.col.set(RC.on && i === RC.gi % GATES.length ? GR : CY).multiplyScalar(1.15 * k); }); }
function raceStart() { if (RC.on) return; var cam = R.camera; RC.back = { p: cam.position.clone(), fov: cam.fov, mode: R.mode };
  RC.on = true; RC.go = false; RC.cd = 3.4; RC.t = 0; RC.gi = 0; RC.x = START[0]; RC.y = START[2]; RC.z = START[1]; RC.yaw = -Math.PI / 2; RC.vx = RC.vy = RC.vz = 0; kd = {};
  R.mode = 'race'; if (R.card) R.card(null); document.body.classList.add('k-race'); hud.hidden = false; START.d.visible = false; cam.fov = Math.min(100, RC.back.fov + 16); cam.updateProjectionMatrix(); gateCol();
  if (window.GOLOS && GOLOS.on && GOLOS.say) try { GOLOS.say('Заезд. Пролети ворота по порядку. Зелёные ворота - следующие.'); } catch (e) {} }
function raceStop() { if (!RC.on) return; var cam = R.camera; RC.on = false; hud.hidden = true; document.body.classList.remove('k-race'); START.d.visible = true;
  cam.position.copy(RC.back.p); cam.fov = RC.back.fov; cam.updateProjectionMatrix(); R.mode = 'walk'; gateCol(); }
function raceFinish() { lastT = RC.t; var rec = !best || lastT < best; if (rec) { best = lastT; lsS('kursy_m5_krug', String(best)); } tabloUp();
  RC.go = false; hC.textContent = '🏁'; hT.textContent = fmt(lastT); toast(rec ? 'Новый лучший круг: ' + fmt(lastT) : 'Круг: ' + fmt(lastT) + ' · лучший ' + fmt(best));
  if (window.GOLOS && GOLOS.on && GOLOS.say) try { GOLOS.say(rec ? 'Финиш. Это твой лучший круг.' : 'Финиш.'); } catch (e) {}
  RC.fin = 2.6; }
R.frame(function (dt) { if (!RC.on) return; var cam = R.camera;
  var thr = ax.thr + (kd.KeyW ? 1 : 0) - (kd.KeyS ? 1 : 0), yw = ax.yaw + (kd.KeyD ? 1 : 0) - (kd.KeyA ? 1 : 0), pt = ax.pit + (kd.ArrowUp ? 1 : 0) - (kd.ArrowDown ? 1 : 0), rl = ax.rol + (kd.ArrowRight ? 1 : 0) - (kd.ArrowLeft ? 1 : 0);
  if (RC.fin) { RC.fin -= dt; if (RC.fin <= 0) { RC.fin = 0; raceStop(); return; } thr = yw = pt = rl = 0; }
  if (!RC.go && !RC.fin) { RC.cd -= dt; hC.textContent = RC.cd > .4 ? String(Math.ceil(RC.cd - .4)) : 'СТАРТ'; if (RC.cd <= 0) { RC.go = true; hC.textContent = ''; } else { thr = pt = rl = 0; } }
  RC.yaw -= yw * 2.1 * dt; var fx = -Math.sin(RC.yaw), fz = -Math.cos(RC.yaw), rx = Math.cos(RC.yaw), rz = -Math.sin(RC.yaw), k = Math.min(1, dt * 3.2);
  RC.vx += ((fx * pt * 6.5 + rx * rl * 4.2) - RC.vx) * k; RC.vz += ((fz * pt * 6.5 + rz * rl * 4.2) - RC.vz) * k; RC.vy += (thr * 2.8 - RC.vy) * Math.min(1, dt * 4);
  var px = RC.x, pz = RC.z; RC.x += RC.vx * dt; RC.z += RC.vz * dt; RC.y += RC.vy * dt;
  if (RC.x < ZX + .7) { RC.x = ZX + .7; RC.vx = 0; } if (RC.x > W - .7) { RC.x = W - .7; RC.vx = 0; } if (RC.z < .7) { RC.z = .7; RC.vz = 0; } if (RC.z > D - .7) { RC.z = D - .7; RC.vz = 0; }
  if (RC.y < .3) { RC.y = .3; RC.vy = 0; } if (RC.y > HH - .45) { RC.y = HH - .45; RC.vy = 0; }
  /* ворота: пересекли плоскость в нужную сторону внутри рамки */
  if (RC.go) { RC.t += dt; var g = GATES[RC.gi % GATES.length], a = (px - g.x) * g.n[0] + (pz - g.z) * g.n[1], b = (RC.x - g.x) * g.n[0] + (RC.z - g.z) * g.n[1];
    if (a < 0 && b >= 0) { var lat = Math.abs((RC.x - g.x) * g.n[1] - (RC.z - g.z) * g.n[0]); if (lat < 1.0 && Math.abs(RC.y - g.y) < 1.0) { RC.gi++; if (RC.gi > GATES.length) raceFinish(); else gateCol(); } }
    hT.textContent = fmt(RC.t); }
  hG.textContent = RC.gi >= GATES.length ? 'Финиш: ворота 1' : 'Ворота ' + (RC.gi + 1) + ' из ' + GATES.length;
  cam.position.set(RC.x, RC.y, RC.z); cam.rotation.set(-pt * .1 + RC.vy * .02, RC.yaw, -rl * .22 - yw * .12, 'YXZ'); });

/* ---------- двери как предметы (из коридора): подойти и войти ---------- */
ROOMS.forEach(function (r) { var it = R.item({ obj: r.sign, name: r.no + '. ' + r.n, kicker: r.zal ? 'Зал' : 'Бокс ' + r.no, sub: '', at: r.outP, look: [r.dx, 1.6, r.dz], tagY: 3.3, tagFar: 30, actLabel: 'Войти',
  act: function () { if (r.state === 'lock') { toast('Пока закрыто'); return; } R.walkTo(r.inP[0], r.inP[1], null); } });
  it.at3 = [r.dx, 0, r.dz]; it.reg = 'C'; it.noTag = true; r.item = it;
  it.sub = r.tasks.map(function (tid) { var i = taskNo(tid); return 'Задание ' + (i + 1) + ': ' + TASKS[i][1]; }).join(' · '); });

/* ---------- путь через двери ---------- */
R.route = function (x0, z0, x1, z1) { var a = region(x0, z0), b = region(x1, z1), q = [];
  if (a === b) return [[x1, z1]];
  var ra = roomById(a), rb = roomById(b);
  if (ra) { q.push(ra.inP, ra.outP); a = 'C'; }
  if (a === 'L' && b !== 'L') { q.push([LX + .2, CZM]); a = 'C'; }
  if (rb) { if (rb.state === 'lock') { toast(rb.n + ': пока закрыто'); q.push(rb.outP); return q; } q.push(rb.outP, rb.inP); }
  if (b === 'L') q.push([LX - .4, CZM]);
  q.push([x1, z1]); return q; };
R.tagOk = function (it) { return !it.reg || it.reg === curReg || (it.reg === 'L' && curReg === 'C' && R.camera.position.x < 14); };

/* ---------- состояние боксов и заданий ---------- */
var guideG = null, guideKey = ''; var beacon = new T.Mesh(new T.ConeGeometry(.13, .26, 4), neon(A, 2)); beacon.rotation.x = Math.PI; sc.add(beacon);
var nextStand = null;
function refreshAll() { var nx = null;
  stands.forEach(function (s) { s.st = taskState(s.tid); s.draw(); s.item.state = s.st === 'done' ? 'done' : ''; R.setTag(s.item); });
  TASKS.forEach(function (t) { if (nx) return; var s = stands.find(function (x) { return x.tid === t[0]; }); if (s && s.st === 'open') nx = s; });
  nextStand = nx;
  ROOMS.forEach(function (r) { var st = r.tasks.map(taskState), all = st.every(function (x) { return x === 'done'; }), lock = st.every(function (x) { return x === 'lock'; });
    r.state = all ? 'done' : (nx && nx.room === r) ? 'next' : lock ? 'lock' : 'open'; setLocked(r, r.state === 'lock'); drawSign(r); });
  R.setNext(nx ? nx.item : null); nextBar(nx); drawPlan();
  var gk = nx ? nx.room.id : ''; if (gk !== guideKey) { guideKey = gk; G.remove(guideG); var nr = nx && nx.room;
    guideG = !nr ? null : nr.zal ? G.guide([[LX + .6, CZM], [ZX - .4, CZM]]) : G.guide([[LX + .6, CZM], [nr.dx, CZM], [nr.dx, nr.dz + (nr.south ? -.3 : .3)]]); } }
R.frame(function (dt, t) { var s = nextStand; beacon.visible = !!s && R.mode === 'walk'; if (!s) return;
  var inRoom = curReg === s.room.id; if (inRoom) beacon.position.set(s.g.position.x, 2.35 + Math.sin(t * 3) * .07, s.g.position.z);
  else if (s.room.zal) beacon.position.set(ZX - .5, 3.0 + Math.sin(t * 3) * .07, CZM);
  else beacon.position.set(s.room.dx, 3.0 + Math.sin(t * 3) * .07, s.room.dz + (s.room.south ? -.4 : .4));
  beacon.rotation.y = t * 2; s.ring.material.opacity = .45 + .35 * Math.abs(Math.sin(t * 3)); });

/* ---------- нижняя строка "Дальше" ---------- */
var NB = document.getElementById('nextb');
function nextBar(s) { if (!s) { NB.hidden = true; return; } NB.hidden = false; NB.querySelector('b').textContent = (s.room.zal ? 'Зал' : 'Бокс ' + s.room.no) + ' · Задание ' + (s.i + 1) + '. ' + s.t;
  NB.querySelector('button').onclick = function () { R.walkTo(s.item.at[0], s.item.at[1], s.item); }; }

/* ---------- открыть задание ---------- */
function openTask(tid) {
  if (HOST) { try { if (HOST.KURS_KOMNATA.task(tid)) return; } catch (e) {} }
  var i = taskNo(tid), dlg = document.getElementById('demo');
  dlg.querySelector('b').textContent = 'Задание ' + (i + 1) + '. ' + TASKS[i][1]; dlg.hidden = false;
  dlg.querySelector('.d-ok').onclick = function () { var d = JSON.parse(lsG('gonki_demo_done') || '[]'); if (d.indexOf(tid) < 0) d.push(tid); lsS('gonki_demo_done', JSON.stringify(d)); dlg.hidden = true; refreshAll(); toast('Задание засчитано (проба)'); };
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

document.getElementById('back').onclick = function () { if (RC.on) { raceStop(); return; } if (R.mode !== 'walk') { if (R.onEsc) R.onEsc(); return; } exitRoom(); };
refreshAll(); gateCol();
function adoptAll() { sc.children.slice().forEach(function (o) { if (o === G.world || o === G.mirrorGroup || o.isLight || o === beacon) return; G.adopt(o); }); }
var envDone = false; function finish() { adoptAll(); if (!envDone) { envDone = true; try { G.bakeEnv(LX / 2, 1.5, CZM); } catch (e) {} } window.AKB_READY = true; }
document.addEventListener('akb-loaded', function () { setTimeout(finish, 150); }); setTimeout(finish, 6000);
var lastSt = '';
setInterval(function () { if (!HOST) return; var s2 = TASKS.map(function (t) { return taskState(t[0]); }).join(); if (s2 !== lastSt) { lastSt = s2; refreshAll(); } }, 1500);
var hintEl = document.getElementById('hint'); setTimeout(function () { hintEl.classList.add('off'); }, 7000);
R.frame(function () { if (R.mode !== 'walk') hintEl.classList.add('off'); });
/* для проверки: AKB.go('S0') - перейти в бокс, AKB.go('Z') - в зал */
function go(id) { var r = roomById(id), p = r ? r.inP : id === 'C' ? [20, CZM] : [3.2, CZM]; R.camera.position.x = p[0]; R.camera.position.z = p[1]; if (r) R.lookAt([r.cx, 1.4, (r.z0 + r.z1) / 2]); }
window.AKB = { R: R, stands: stands, rooms: ROOMS, refresh: refreshAll, back: function () { refreshAll(); }, go: go, region: region, race: { start: raceStart, stop: raceStop, s: RC, gates: GATES } };
})();
/* E/Enter и пробел не срабатывают, пока открыто окно (задание-проба, окно задания курса поверх клуба) или идёт заезд */
AKB.R.busy = function () { var dm = document.getElementById('demo'); if (dm && !dm.hidden) return true; if (AKB.race.s.on) return true;
  try { if (parent !== window) { var w = parent.document.getElementById('win'); if (w && w.classList.contains('on')) return true; } } catch (e) {} return false; };
