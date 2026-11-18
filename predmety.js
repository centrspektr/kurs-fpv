/* predmety.js - предметы, которые можно взять в руки и отнести (проба new.html, 18.11.2026, просьба Alexandr: "больше взаимодействия").
   Общий для модулей-помещений: модуль 2 (komnata-new.js + masterskaya-kvest.js) и модули 3, 5 (копия в proba/modul3/, kvesty-m3.js, kvesty-m5.js).
   Предметы рисуются кодом из простых фигур - без файлов моделей, чтобы сайт не рос.
   PREDMETY.model(kind) -> THREE.Group (размер в метрах, низ на y = 0)
     kind: payalnik, otvertki, detali, akb, akb_razr, akb_vzdut, tester, ochki
   PREDMETY.ruki({ camera, scene, root }) -> H: предмет в руке внизу справа и плашка "В руках: ..."
     H.take(o, mesh) - взять (o: { id, name, where }), H.put() -> o (руки пустеют), H.o - что в руке (или null)
   PREDMETY.anim(сек, step(u), done) - плавная анимация (дверцы, крышки)
   PREDMETY.load(key) / PREDMETY.save(key, obj) - прогресс квеста в localStorage */
(function () {
'use strict';
var T = window.THREE; if (!T) return;
function M(c, r, m, em) { var o = new T.MeshStandardMaterial({ color: c, roughness: r == null ? .5 : r, metalness: m || 0 }); if (em) { o.emissive = new T.Color(em); o.emissiveIntensity = 1; } o.envMapIntensity = .6; return o; }
function B(w, h, d, mat, x, y, z, g) { var o = new T.Mesh(new T.BoxGeometry(w, h, d), mat); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; g.add(o); return o; }
function C(r1, r2, h, mat, x, y, z, g, seg) { var o = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 16), mat); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; g.add(o); return o; }
function TX(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; }
function plate(g, w, h, x, y, z, draw, ry, rx, dim) { var p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: TX(256, Math.round(256 * h / w), draw), toneMapped: false, color: dim ? '#9a9a9a' : '#ffffff' })); p.position.set(x, y, z); p.rotation.set(rx || 0, ry || 0, 0); g.add(p); return p; }
var F = '900 {s}px Manrope, "Segoe UI", sans-serif';
function f(s) { return F.replace('{s}', s); }

/* аккумулятор LiPo: банки в плёнке, наклейка, провода и разъём */
function akb(g, body, lab, txt, sub) {
  B(.11, .045, .05, body, 0, .0225, 0, g);
  plate(g, .1, .04, 0, .0226, .0252, function (c, w, h) { c.fillStyle = lab; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = f(44); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h * .38); c.font = f(26); c.fillText(sub, w / 2, h * .78); });
  var red = M('#d22', .5), blk = M('#111', .5), yel = M('#f5c518', .45);
  C(.004, .004, .07, red, -.065, .03, -.01, g).rotation.z = Math.PI / 2; C(.004, .004, .07, blk, -.065, .02, .01, g).rotation.z = Math.PI / 2;
  B(.024, .016, .03, yel, -.105, .025, 0, g);
  B(.012, .006, .03, M('#fff', .6), .06, .036, 0, g); /* балансировочный разъём */
}

var MODELS = {
  payalnik: function (g) { /* паяльная станция: корпус, дисплей, подставка с паяльником */
    var body = M('#1e2433', .45, .3); B(.2, .1, .15, body, 0, .05, 0, g); B(.2, .012, .15, M('#c23b2a', .5), 0, .106, 0, g);
    plate(g, .1, .045, -.035, .06, .0752, function (c, w, h) { c.fillStyle = '#120404'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff5a3c'; c.font = f(80); c.textBaseline = 'middle'; c.fillText('330°', 16, h / 2 + 4); });
    C(.014, .014, .012, M('#ddd', .3, .8), .055, .06, .08, g).rotation.x = Math.PI / 2;
    var st = new T.Group(); st.position.set(.16, 0, 0); g.add(st); C(.035, .045, .02, M('#333', .5, .6), 0, .01, 0, st);
    var sp = C(.018, .018, .09, M('#888', .3, .9), 0, .06, 0, st); sp.rotation.z = .5;
    var iron = new T.Group(); iron.position.set(-.02, .07, 0); iron.rotation.z = .5; st.add(iron);
    C(.011, .011, .1, M('#2b6cff', .5), 0, .03, 0, iron); C(.004, .002, .07, M('#bbb', .3, .9), 0, -.055, 0, iron);
    var w = C(.003, .003, .2, M('#222', .6), -.06, .03, 0, g); w.rotation.z = Math.PI / 2.3; },
  otvertki: function (g) { /* кейс с отвёртками и шестигранниками */
    B(.3, .03, .17, M('#b91c1c', .5, .1), 0, .015, 0, g); B(.28, .006, .15, M('#111', .9), 0, .033, 0, g);
    ['#f59e0b', '#22c55e', '#3b82f6', '#a855f7'].forEach(function (c, i) { var z = -.05 + i * .033; var h = C(.011, .011, .08, M(c, .45), -.06, .045, z, g); h.rotation.z = Math.PI / 2; var s = C(.003, .003, .11, M('#ccc', .25, .95), .035, .045, z, g); s.rotation.z = Math.PI / 2; });
    for (var i = 0; i < 4; i++) { var k = B(.006, .006, .05 + i * .01, M('#9aa', .3, .9), .1 + i * .012, .04, 0, g); k.rotation.x = .1; } },
  detali: function (g) { /* картонная коробка с деталями дрона */
    var cb = M('#b98a52', .9); B(.34, .2, .26, cb, 0, .1, 0, g); B(.345, .012, .07, M('#d9c28f', .6), 0, .2, 0, g);
    plate(g, .2, .1, 0, .11, .1305, function (c, w, h) { c.fillStyle = '#f4ead2'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1a1a'; c.font = f(46); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ДЕТАЛИ', w / 2, h * .36); c.font = f(28); c.fillText('рама · моторы · платы', w / 2, h * .76); });
    var top = new T.Group(); top.position.y = .2; g.add(top); /* видно, что внутри */
    C(.02, .02, .02, M('#555', .4, .8), -.1, .015, -.06, top); C(.02, .02, .02, M('#555', .4, .8), -.06, .015, -.08, top); B(.04, .006, .04, M('#14532d', .6), .08, .005, -.06, top); },
  akb: function (g) { akb(g, M('#2a2f3a', .45, .2), '#f5c518', '4S 1300', 'заряжен'); },
  akb_razr: function (g) { akb(g, M('#2a2f3a', .45, .2), '#ef4444', '4S 1300', 'разряжен'); },
  akb_vzdut: function (g) { /* вздутый 1S: плёнка раздулась "подушкой" */
    var m = M('#c8ccd4', .3, .7); var s = new T.Mesh(new T.SphereGeometry(.05, 20, 14), m); s.scale.set(1.15, .55, .75); s.position.y = .03; s.castShadow = true; g.add(s);
    plate(g, .05, .02, 0, .062, 0, function (c, w, h) { c.fillStyle = '#ffd400'; c.fillRect(0, 0, w, h); c.fillStyle = '#000'; c.font = f(70); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1S', w / 2, h / 2 + 4); }, 0, -Math.PI / 2);
    C(.003, .003, .04, M('#d22', .5), -.07, .02, 0, g).rotation.z = Math.PI / 2; B(.02, .01, .014, M('#fff', .5), -.095, .02, 0, g); },
  tester: function (g) { /* тестер банок АКБ с экраном */
    B(.07, .022, .11, M('#1f2937', .5, .2), 0, .011, 0, g);
    plate(g, .05, .04, 0, .0225, -.02, function (c, w, h) { c.fillStyle = '#0b1f12'; c.fillRect(0, 0, w, h); c.fillStyle = '#7dff9a'; c.font = f(70); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('3.80', w / 2, h / 2 + 4); }, 0, -Math.PI / 2);
    B(.06, .006, .012, M('#fff', .6), 0, .022, .045, g); B(.016, .008, .016, M('#f5c518', .4), -.02, .024, .02, g); B(.016, .008, .016, M('#38bdf8', .4), .02, .024, .02, g); },
  ochki: function (g) { /* FPV-очки: корпус, две линзы, антенна, ремешок */
    var b = M('#18181b', .4, .3); B(.18, .07, .09, b, 0, .045, 0, g); B(.17, .02, .02, M('#7cf3ff', .3, 0, '#2aa9c9'), 0, .08, .045, g);
    [-.042, .042].forEach(function (x) { var l = C(.024, .024, .01, M('#0b0d12', .1, .6), x, .045, -.05, g); l.rotation.x = Math.PI / 2; });
    var a = C(.006, .006, .07, M('#333', .5), .075, .1, .02, g); a.rotation.z = -.3; C(.012, .012, .02, M('#e11d48', .5), .086, .135, .02, g);
    var s = new T.Mesh(new T.TorusGeometry(.1, .008, 6, 24, Math.PI), M('#334155', .8)); s.rotation.x = Math.PI / 2; s.position.set(0, .045, -.03); s.scale.set(1, 1.2, 1); g.add(s); }
};
function model(kind) { var g = new T.Group(); (MODELS[kind] || MODELS.detali)(g); g.userData.kind = kind; return g; }

/* плавная анимация */
function anim(d, step, done) { var t0 = performance.now(); (function k(t) { var u = Math.min(1, (t - t0) / (d * 1000)); var e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; step(e); if (u < 1) requestAnimationFrame(k); else if (done) done(); })(t0); }

/* предмет в руке */
var CSS = '.prd-hud{position:absolute;left:50%;top:calc(64px + env(safe-area-inset-top,0px));transform:translateX(-50%) translateY(-8px);opacity:0;transition:opacity .25s,transform .25s;z-index:6;pointer-events:none;' +
  'background:rgba(8,12,28,.82);border:1px solid rgba(124,243,255,.45);border-radius:14px;padding:8px 14px;color:#fff;font:700 14px Manrope,"Segoe UI",system-ui,sans-serif;max-width:min(92vw,520px);text-align:center;line-height:1.3}' +
  '.prd-hud.on{opacity:1;transform:translateX(-50%)}.prd-hud b{color:#ffd36e}.prd-hud small{display:block;color:#cfe9ff;font-weight:600;font-size:12.5px;margin-top:2px}';
function ruki(o) {
  if (!document.getElementById('prd-css')) { var st = document.createElement('style'); st.id = 'prd-css'; st.textContent = CSS; document.head.appendChild(st); }
  var cam = o.camera, hud = document.createElement('div'); hud.className = 'prd-hud'; (o.root || document.body).appendChild(hud);
  var H = { o: null, mesh: null, hud: hud }, holder = new T.Group(); holder.position.set(.2, -.2, -.48); holder.rotation.set(.35, -.5, 0); cam.add(holder);
  function attach() { if (!cam.parent && o.scene) o.scene.add(cam); }
  H.take = function (it, mesh) { attach(); var same = H.mesh === mesh; H.o = it; if (H.mesh && !same) holder.remove(H.mesh); H.mesh = mesh; clearTimeout(sayT);
    if (!same) { mesh.position.set(0, 0, 0); mesh.rotation.set(0, 0, 0); mesh.scale.setScalar(1); mesh.updateMatrixWorld(true); var bb = new T.Box3().setFromObject(mesh), sz = bb.getSize(new T.Vector3()), k = .2 / Math.max(sz.x, sz.y, sz.z, .01);
      mesh.scale.setScalar(Math.min(1.6, k)); mesh.traverse(function (m) { if (m.isMesh) { m.castShadow = false; m.renderOrder = 5; } }); holder.add(mesh); }
    hud.innerHTML = '✋ В руках: <b></b><small></small>'; hud.querySelector('b').textContent = it.name; hud.querySelector('small').textContent = it.where ? 'Отнеси: ' + it.where + '. Подойди и нажми E.' : '';
    hud.classList.add('on'); if (same) return; var y0 = -.32; anim(.35, function (u) { holder.position.y = y0 + (-.2 - y0) * u; }); };
  H.put = function () { var it = H.o; clearTimeout(sayT); if (H.mesh) { holder.remove(H.mesh); H.mesh.scale.setScalar(1); H.mesh.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.renderOrder = 0; } }); } H.o = null; H.mesh = null; hud.classList.remove('on'); return it; };
  var sayT = 0; /* короткое сообщение в той же плашке (для этажей модулей 3 и 5, где нет своей подсказки) */
  H.say = function (txt, ms) { clearTimeout(sayT); hud.innerHTML = '<b></b>'; hud.querySelector('b').textContent = txt; hud.classList.add('on'); golos(txt);
    sayT = setTimeout(function () { if (H.o) H.take(H.o, H.mesh); else hud.classList.remove('on'); }, ms || 4000); };
  H.visible = function (v) { holder.visible = v; hud.style.display = v ? '' : 'none'; };
  var t0 = performance.now(); (function bob(t) { requestAnimationFrame(bob); if (!H.mesh) return; var s = (t - t0) / 1000; holder.rotation.z = Math.sin(s * 1.6) * .03; holder.position.x = .2 + Math.sin(s * 1.1) * .004; })(t0);
  return H;
}
function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

/* шкафчик с дверцей на петле (дверь открывается вокруг левого края). w, h, d - размер; col - цвет; label - надпись на двери */
function shkaf(o) { var g = new T.Group(), body = M(o.col || '#3b4256', .45, .45), w = o.w, h = o.h, d = o.d, th = .02;
  B(w, th, d, body, 0, th / 2, 0, g); B(w, th, d, body, 0, h - th / 2, 0, g); B(th, h, d, body, -w / 2 + th / 2, h / 2, 0, g); B(th, h, d, body, w / 2 - th / 2, h / 2, 0, g); B(w, h, th, body, 0, h / 2, -d / 2 + th / 2, g);
  B(w - th * 2, th * .6, d - th, M('#1c2030', .6, .3), 0, h * .5, 0, g); /* полка */
  var hinge = new T.Group(); hinge.position.set(-w / 2, 0, d / 2); g.add(hinge);
  var door = B(w, h, th, M(o.door || o.col || '#4b5470', .4, .5), w / 2, h / 2, th / 2, hinge); B(.02, .12, .03, M('#ddd', .25, .9), w - .06, h * .55, th + .015, hinge);
  if (o.label) plate(hinge, Math.min(w * .8, .5), Math.min(w * .8, .5) * .4, w / 2, h * .78, th + .002, function (c, cw, ch) { c.fillStyle = o.labelBg || '#ffd36e'; c.fillRect(0, 0, cw, ch); c.fillStyle = '#111'; var fs = 38; c.font = f(fs); while (fs > 14 && c.measureText(o.label).width > cw - 16) { fs -= 2; c.font = f(fs); } c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.label, cw / 2, ch / 2 + 2); }, 0, 0, true);
  g.userData.open = false;
  g.userData.toggle = function (on, done) { if (g.userData.open === on) { if (done) done(); return; } g.userData.open = on; var a0 = hinge.rotation.y, a1 = on ? -1.9 : 0; anim(.6, function (u) { hinge.rotation.y = a0 + (a1 - a0) * u; }, done); };
  g.userData.shelfY = h * .5 + th * .3; g.userData.floorY = th; return g; }

/* помощники для этажей модулей 3 и 5 (движок komnata-g.js: R.item, R.card): o = { R, H: ruki(), Pt(r,u,v), RY(r,a) } */
/* невидимая "большая" зона нажатия вокруг маленького предмета: по нему легко попасть щелчком и прицелом (k - размер в единицах модели) */
function proxy(m, k) { var b = new T.Box3().setFromObject(m), c = b.getCenter(new T.Vector3()), z = b.getSize(new T.Vector3()); m.worldToLocal(c);
  var h = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); var sc = m.scale.x || 1;
  h.scale.set(Math.max(z.x / sc, k), Math.max(z.y / sc, k * .7), Math.max(z.z / sc, k)); h.position.copy(c); h.userData.noShadow = true; h.renderOrder = -1; m.add(h); return h; }
/* маяк: светящаяся стрелка над местом и кольцо на полу - "иди сюда" */
function beacon(scene, col) { var g = new T.Group(), c = new T.Color(col || '#ffd36e'), mb = new T.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: .95, depthWrite: false });
  var ar = new T.Mesh(new T.ConeGeometry(.13, .28, 4), mb); ar.rotation.x = Math.PI; g.add(ar);
  var rg = new T.Mesh(new T.RingGeometry(.42, .5, 40), new T.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.4), toneMapped: false, transparent: true, depthWrite: false, side: T.DoubleSide })); rg.rotation.x = -Math.PI / 2; g.add(rg);
  g.visible = false; g.renderOrder = 3; scene.add(g); var y0 = 1.5, t0 = performance.now();
  (function k(t) { requestAnimationFrame(k); if (!g.visible) return; var s = (t - t0) / 1000; ar.position.y = y0 + Math.sin(s * 3) * .08; ar.rotation.y = s * 1.5; rg.position.y = .02 - g.position.y; rg.material.opacity = .45 + Math.sin(s * 4) * .35; var q = 1 + (s * .8 % 1) * .25; rg.scale.set(q, q, 1); })(t0);
  return { g: g, at: function (x, y, z) { g.position.set(x, 0, z); y0 = (y || 0) + .55; g.visible = true; }, off: function () { g.visible = false; } }; }
/* список "что найти" в углу экрана */
var CSS2 = '.prd-list{position:absolute;left:max(14px,env(safe-area-inset-left,0px));top:calc(70px + env(safe-area-inset-top,0px));z-index:5;pointer-events:none;background:rgba(8,12,28,.72);border:1px solid rgba(255,211,110,.4);border-radius:12px;padding:8px 12px;color:#fff;font:600 13px/1.4 Manrope,"Segoe UI",system-ui,sans-serif;max-width:min(78vw,330px)}' +
  '.prd-list b{display:block;color:#ffd36e;font-size:12px;letter-spacing:.04em;margin-bottom:2px}.prd-list div.ok{opacity:.55;text-decoration:line-through}.prd-list small{color:#cfe9ff;font-weight:600}' +
  '@media (max-width:700px){.prd-list{font-size:11.5px;top:calc(58px + env(safe-area-inset-top,0px));padding:6px 9px}}';
function spisok(root) { if (!document.getElementById('prd-css2')) { var st = document.createElement('style'); st.id = 'prd-css2'; st.textContent = CSS2; document.head.appendChild(st); }
  var el = document.createElement('div'); el.className = 'prd-list'; el.style.display = 'none'; (root || document.body).appendChild(el);
  return { set: function (title, rows) { var h = '<b></b>'; rows.forEach(function () { h += '<div><span></span> <small></small></div>'; }); el.innerHTML = h; el.querySelector('b').textContent = title;
      var ds = el.querySelectorAll('div'); rows.forEach(function (r, i) { ds[i].className = r.ok ? 'ok' : ''; ds[i].querySelector('span').textContent = (r.ok ? '✓ ' : '○ ') + r.t; ds[i].querySelector('small').textContent = r.ok ? '' : (r.w || ''); }); el.style.display = ''; },
    hide: function () { el.style.display = 'none'; }, el: el }; }

function etazh(o) { var R = o.R, H = o.H, Pt = o.Pt, RY = o.RY, P = window.PREDMETY;
  function findItem(name) { for (var i = 0; i < R.items.length; i++) if (R.items[i].name === name) return R.items[i]; return null; }
  function hideIt(it) { it.hidden = true; it.noTag = true; it.obj.visible = false; }
  function showIt(it) { it.hidden = false; it.noTag = false; it.obj.visible = true; }

  /* предмет, который берут в руки */
  function pickable(o) { /* o: { id, kind, name, sub, where, pos:[x,y,z], ry, s, at, reg, hidden } */
    var m = P.model(o.kind); m.scale.setScalar(o.s || 1.5); m.position.set(o.pos[0], o.pos[1], o.pos[2]); m.rotation.y = o.ry || 0; R.scene.add(m);
    var it = R.item({ obj: m, name: o.name, kicker: 'Предмет', sub: o.sub, at: o.at, look: [o.pos[0], o.pos[1] + .1, o.pos[2]], tagY: o.pos[1] + .45, tagFar: 6, actLabel: '✋ Взять', act: function () {
      if (H.o) { H.say('Руки заняты: ' + H.o.name + '. Сначала отнеси.', 3000); return; }
      it.taken = true; hideIt(it); if (it.beacon) it.beacon.off(); H.take({ id: o.id, name: o.name, where: o.where }, P.model(o.kind)); H.say('Взял: ' + o.name + '. Отнеси: ' + o.where + '.', 3500); } });
    proxy(m, .5 / (o.s || 1.5)); it.reg = o.reg; it.at3 = o.pos; it.kv = o; if (o.hidden) hideIt(it); return it; }

  /* ящик или шкафчик с дверцей: открыть - внутри появляется предмет */
  function locker(o) { /* o: { r, u, v, a, w, h, d, col, label, inside: it, y } */
    var p = Pt(o.r, o.u, o.v), ry = RY(o.r, o.a || 0), g = P.shkaf({ w: o.w, h: o.h, d: o.d, col: o.col, door: o.door, label: o.label, labelBg: o.labelBg });
    g.position.set(p[0], o.y || 0, p[1]); g.rotation.y = ry; R.scene.add(g); g.updateMatrixWorld(true);
    if (!o.noBlock) R.block(p[0] - .4, p[1] - .4, p[0] + .4, p[1] + .4);
    var f = [Math.sin(ry), Math.cos(ry)], it = R.item({ obj: g, name: o.name, kicker: o.kicker || 'Шкафчик', sub: o.sub, at: [p[0] + f[0] * 1.3, p[1] + f[1] * 1.3], look: [p[0], (o.y || 0) + o.h * .55, p[1]], tagY: (o.y || 0) + o.h + .35, tagFar: 7, actLabel: '🚪 Открыть',
      act: function () { var ins = L.inside, can = ins && !ins.taken && g.userData.open;
        /* 18.11: открытый шкафчик - E сразу берёт то, что внутри (раньше E закрывал дверцу, и предмет было не взять) */
        if (can) { if (H.o) { H.say('Руки заняты: ' + H.o.name + '. Сначала отнеси.', 3000); return; } ins.act(ins); lab(); return; }
        var on = !g.userData.open; g.userData.toggle(on, function () { if (ins && !ins.taken) { if (on) showIt(ins); else hideIt(ins); } lab(); R.card(it); }); } });
    function lab() { var ins = L.inside, can = ins && !ins.taken && g.userData.open; it.actLabel = can ? '✋ Взять: ' + ins.name : g.userData.open ? 'Закрыть' : '🚪 Открыть'; }
    var L = { g: g, it: it, ry: ry, inside: null, setInside: function (x) { L.inside = x; lab(); } };
    it.reg = o.r.id; it.at3 = [p[0], 0, p[1]];
    g.localPt = function (x, y, z) { var v = new T.Vector3(x, y, z); g.localToWorld(v); return [v.x, v.y, v.z]; };
    return L; }

  /* место, куда кладут: обёртка над уже существующим предметом этажа */
  function target(it, o) { /* o: { need: id, put(), lock: текст, ok(): готово ли } */
    var act0 = it.act, label0 = it.actLabel, sub0 = it.sub;
    function upd() { if (o.ok()) { it.actLabel = label0; it.sub = sub0; return; } var hold = H.o && H.o.id === o.need; it.actLabel = hold ? '⬇ Положить' : (o.lockLabel || '🔒 Сначала принеси'); it.sub = hold ? 'У тебя в руках: ' + H.o.name + '. Положи сюда.' : o.lock; }
    it.act = function (x) { if (o.ok()) { act0.call(it, x); return; }
      if (H.o && H.o.id === o.need) { H.put(); o.put(); upd(); return; }
      if (H.o) { H.say('Это нужно не здесь: ' + H.o.name + '.', 3000); return; }
      H.say(o.lock, 4500); };
    upd(); setInterval(upd, 500); return upd; }
  return { findItem: findItem, hideIt: hideIt, showIt: showIt, pickable: pickable, locker: locker, target: target }; }

/* 18.11: сообщения квестов читает Лера (записи zvuk/); soft - не перебивать, если голос уже говорит */
function golos(t, soft) { try { var G = window.GOLOS; if (!G || !G.on || !G.say) return; if (soft && (G.au || G.zt)) return; G.say(t); } catch (e) {} }
window.PREDMETY = { model: model, golos: golos, proxy: proxy, beacon: beacon, spisok: spisok, ruki: ruki, anim: anim, load: load, save: save, shkaf: shkaf, etazh: etazh };
})();
