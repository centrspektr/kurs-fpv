/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* shkola-inter.js - Лётная школа (проба 24.11.2026): интерьер Мастерской вместо стендов-мониторов.
   Замечание Alexandr: стенды заданий вдоль стен больше не нужны (теория на одном телевизоре, практика за столом), нужен другой приятный интерьер.
   Три варианта для выбора, включаются адресом: shkola.html?inter=A (клуб пилотов), ?inter=B (музей дронов), ?inter=V (уголок пилота-техника).
   Без ?inter Мастерская как была. Работает поверх teoriya-okno.js (хук KOMNATA_OKNO.m2), подключать после него. Всё рисуется кодом. */
(function () {
'use strict';
var VAR = ((/[?&]inter=([ABV0])/.exec(location.search) || [])[1]) || 'A';   /* 24.11 Alexandr выбрал А (клуб пилотов) + подиумы с дронами у правой стены; ?inter=0 - Мастерская как была */
if (VAR === '0') VAR = '';
if (window.KOMNATA_KVEST) delete window.KOMNATA_KVEST.m2;   /* 24.11: в Лётной школе без мини-квеста "Подготовь стол сборки" - стол сразу открывает сборку */
var OK = window.KOMNATA_OKNO && window.KOMNATA_OKNO.m2; if (!OK) return;
var PI = Math.PI, pre0 = OK.pre, build0 = OK.build;

OK.pre = function (cfg) { if (pre0) pre0.call(OK, cfg); if (!VAR) return;
  cfg.stands = [];   /* задания открываются с телевизора и стола, стенды убраны */
  cfg.decor = (cfg.decor || []).filter(function (d) { return d.t !== 'crate'; }); };

OK.build = function (X) { var r = build0.call(OK, X); if (VAR) try { DEC[VAR](X); } catch (e) { if (window.console) console.warn('shkola-inter', e); }
  /* 24.11: сел в кресло - заставка теории (nachalo-teorii.js): название печатается, потом две кнопки "Лера рассказывает" / "Читаю сам" */
  var NT = window.NACHALO_TEORII;
  if (r && NT && X.MON) { var sat0 = r.sat;
    r.sat = function (on) { if (sat0) sat0.apply(r, arguments);
      if (!on) { NT.hide(); NT.busy = false; NT.sam = false; return; }
      var L = X.MON.list || [];   /* список берём при посадке: на телевизоре может быть урок другого модуля (komnata-new.js lesson) */
      var ch = L.reduce(function (a, s) { return a + String(s.say || s.p || '').length; }, 0), min = Math.max(1, Math.round(ch / 800));
      NT.busy = true; NT.sam = false;
      NT.show({ title: X.MON.title || (L[0] && L[0].h) || 'Теория', info: L.length + ' слайдов · ~' + min + ' мин',
        lera: function () { NT.busy = false; NT.sam = false; var G = window.GOLOS; if (G && !G.on && G.setOn) G.setOn(true); X.MON.said = -1; },
        sam: function () { NT.busy = false; NT.sam = true; if (window.GOLOS) GOLOS.stop(); X.MON.talk = false; try { X.hint('Читай сам: нажми на экран - появятся стрелки листания.'); } catch (e) {} } }); }; }
  return r; };

function kit(X) {
  var T = X.T, G = X.GX;
  function std(c, ro, me, o) { return G.std(c, ro, me, o); }
  function add(o, p) { (p || null) ? p.add(o) : G.add(o); return o; }
  function grp(x, y, z, ry, p) { var g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; if (p) p.add(g); else G.add(g); return g; }
  function box(w, h, d, m, x, y, z, p) { var o = G.box(w, h, d, m, x, y, z); p.add(o); return o; }
  function rb(w, h, d, r, m, x, y, z, p) { var o = G.rbox ? G.rbox(w, h, d, r, m, x, y, z) : G.box(w, h, d, m, x, y, z); p.add(o); return o; }
  function cyl(rt, rbt, h, m, x, y, z, p, seg) { var o = new T.Mesh(new T.CylinderGeometry(rt, rbt, h, seg || 24), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; }
  function sph(r, m, x, y, z, p, sx, sy, sz) { var o = new T.Mesh(new T.SphereGeometry(r, 20, 14), m); o.position.set(x, y, z); o.scale.set(sx || 1, sy || 1, sz || 1); o.castShadow = o.receiveShadow = true; p.add(o); return o; }
  function tor(r, t, m, x, y, z, p) { var o = new T.Mesh(new T.TorusGeometry(r, t, 10, 32), m); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; }
  function lathe(pts, m, x, y, z, p) { var o = new T.Mesh(new T.LatheGeometry(pts.map(function (q) { return new T.Vector2(q[0], q[1]); }), 28), m); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; }
  function tex(w, h, fn) { return X.tex(w, h, fn); }
  function plane(w, h, map, x, y, z, p, basic) { var o = new T.Mesh(new T.PlaneGeometry(w, h), basic ? new T.MeshBasicMaterial({ map: map, toneMapped: false }) : std('#ffffff', .8, 0, { map: map })); o.position.set(x, y, z); p.add(o); return o; }
  function glowM(c, k) { return new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k || 1.4), toneMapped: false }); }
  /* растение в горшке */
  function plant(x, z, s, p) { var g = grp(x, 0, z, 0, p); g.scale.setScalar(s || 1);
    lathe([[0, 0], [.2, 0], [.26, .5], [.28, .52], [0, .52]], std('#e9e4da', .6, 0), 0, 0, 0, g); cyl(.25, .25, .02, std('#3b2a1e', .95, 0), 0, .5, 0, g);
    var lf = std('#2f7a45', .6, 0), lf2 = std('#3f9a58', .6, 0);
    for (var i = 0; i < 9; i++) { var a = i / 9 * PI * 2, h = .55 + (i % 3) * .25, l = sph(.16, i % 2 ? lf : lf2, Math.cos(a) * .16, .5 + h, Math.sin(a) * .16, g, .55, 1.9, .25); l.rotation.set(Math.sin(a) * .5, -a, Math.cos(a) * .5); }
    return g; }
  /* модель дрона: k = 'whoop' | '3' | '5' | 'cine' */
  function drone(k, p, s) { var g = new T.Group(); p.add(g); g.scale.setScalar(s || 1);
    var cf = std('#1b1d22', .45, .3), mo = std('#c8ccd4', .3, .9), pr = std(k === '5' ? '#ff6b2c' : k === '3' ? '#7cf3ff' : '#ff7ce0', .4, 0, { transparent: true, opacity: .85 }), arm = k === 'whoop' || k === 'cine' ? .1 : k === '3' ? .14 : .2;
    [PI / 4, 3 * PI / 4].forEach(function (a) { var b = box(arm * 2.9, .012, .025, cf, 0, 0, 0, g); b.rotation.y = a; });
    rb(.09, .04, .12, .015, std('#2a2d35', .5, .2), 0, .03, 0, g);
    for (var i = 0; i < 4; i++) { var a = PI / 4 + i * PI / 2, x = Math.cos(a) * arm, z = Math.sin(a) * arm; cyl(.022, .022, .03, mo, x, .02, z, g, 14);
      var d = new T.Mesh(new T.CylinderGeometry(arm * .62, arm * .62, .004, 24), pr); d.position.set(x, .04, z); g.add(d);
      if (k === 'whoop' || k === 'cine') { var du = new T.Mesh(new T.CylinderGeometry(arm * .7, arm * .7, .035, 24, 1, true), std('#e9ecf2', .4, 0, { side: T.DoubleSide })); du.position.set(x, .035, z); g.add(du); } }
    box(.03, .03, .03, std('#ff9a2c', .4, 0), 0, .06, .06, g);
    return g; }
  return { T: T, G: G, std: std, grp: grp, box: box, rb: rb, cyl: cyl, sph: sph, tor: tor, lathe: lathe, tex: tex, plane: plane, glowM: glowM, plant: plant, drone: drone, W: X.W, D: X.D, block: X.block };
}

/* общий значок-рамка с надписью на стене */
function frameArt(K, w, h, draw, x, y, z, ry) { var g = K.grp(x, y, z, ry); K.rb(w + .12, h + .12, .05, .02, K.std('#1a1a1e', .5, .3), 0, 0, 0, g);
  var t = K.tex(512, Math.round(512 * h / w), draw); K.plane(w, h, t, 0, 0, .03, g); return g; }
function raceArt(seed, col) { return function (x, w, h) { var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1030'); g.addColorStop(1, col); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.strokeStyle = '#ffffff22'; for (var i = 0; i < 12; i++) { x.beginPath(); x.moveTo(0, h * .72 + i * 9); x.lineTo(w, h * .62 + i * 14); x.stroke(); }
  for (var k = 0; k < 3; k++) { var cx = w * (.22 + k * .28), cy = h * (.58 - k * .06), r = h * (.18 - k * .03); x.lineWidth = 10 - k * 2; x.strokeStyle = ['#ff7ce0', '#7cf3ff', '#ffd36e'][(k + seed) % 3]; x.beginPath(); x.arc(cx, cy, r, PI, 0); x.lineTo(cx + r, cy + r * .9); x.moveTo(cx - r, cy); x.lineTo(cx - r, cy + r * .9); x.stroke(); }
  x.lineWidth = 4; x.strokeStyle = '#ffffffaa'; x.beginPath(); x.moveTo(w * .05, h * .8); x.bezierCurveTo(w * .3, h * .2, w * .6, h * .9, w * .95, h * .3); x.stroke(); }; }

function podiumy(K, items) { var T = K.T, white = K.std('#eceef2', .4, 0), glass = K.std('#dff0ff', .03, 0, { transparent: true, opacity: .14 }), dark = K.std('#16171c', .5, .3);
    items.forEach(function (it, n) { var g = K.grp(it[3], 0, it[4], it[5]);
      K.rb(.8, 1.05, .8, .05, white, 0, .525, 0, g); K.box(.82, .04, .82, dark, 0, .03, 0, g); K.box(.7, .74, .7, glass, 0, 1.43, 0, g); K.box(.72, .02, .72, K.std('#c9ccd3', .3, .9), 0, 1.81, 0, g);
      var dr = K.drone(it[0], g, it[0] === '5' ? 1.6 : it[0] === '3' ? 2.0 : 2.7); dr.position.set(0, 1.12, 0); dr.rotation.set(.18, n * .7, 0);
      var st = K.cyl(.012, .012, .06, K.std('#c9ccd3', .3, .9), 0, 1.08, 0, g, 8);
      var t = K.tex(512, 192, function (x, w, h) { x.fillStyle = '#14161c'; x.fillRect(0, 0, w, h); x.fillStyle = '#7cf3ff'; x.fillRect(0, 0, 10, h); x.fillStyle = '#fff'; x.font = '800 58px Manrope,system-ui,sans-serif'; x.fillText(it[1], 36, 84); x.fillStyle = '#aab2d8'; x.font = '600 38px Manrope,system-ui,sans-serif'; x.fillText(it[2], 36, 144); });
      var pl = K.plane(.56, .21, t, 0, .86, .47, g, true); pl.rotation.x = -.35;
      var sp = new T.Mesh(new T.CylinderGeometry(.06, .5, 2.3, 24, 1, true), new T.MeshBasicMaterial({ color: '#fff4dc', transparent: true, opacity: .022, depthWrite: false, side: T.DoubleSide })); sp.position.set(0, 2.95, 0); g.add(sp);
      K.cyl(.07, .09, .12, dark, 0, 4.15, 0, g, 16); K.block(it[3], it[4], .45, .45, 0); }); }

var DEC = {
  /* А. Клуб пилотов: диван с журнальным столиком, очки и пульт, ковёр, торшер, растения; справа шкаф с кубками и фото гонок */
  A: function (X) { var K = kit(X), T = K.T, W = K.W, D = K.D;
    var L = K.grp(-W / 2 + 1.25, 0, 1.6, PI / 2), fab = K.std('#3d4b5c', .9, 0), fab2 = K.std('#4c5d70', .9, 0), wood = K.std('#5b3b26', .45, .05), blk = K.std('#16171c', .5, .3), metal = K.std('#2a2d35', .35, .8);
    K.rb(2.6, .4, .95, .08, fab, 0, .32, 0, L); [-.64, .64].forEach(function (x) { K.rb(1.24, .16, .82, .07, fab2, x, .6, .04, L); K.rb(1.2, .55, .2, .08, fab2, x, .82, -.36, L); });
    [-1.38, 1.38].forEach(function (x) { K.rb(.2, .62, .95, .07, fab, x, .43, 0, L); }); [-1.2, 1.2].forEach(function (x) { [-.36, .36].forEach(function (z) { K.cyl(.025, .02, .12, metal, x, .06, z, L, 10); }); });
    K.rb(.4, .4, .12, .06, K.std('#ff7ce0', .9, 0), -.9, .78, -.18, L).rotation.z = .2;   /* подушка */
    var rugT = K.tex(512, 384, function (x, w, h) { x.fillStyle = '#2a2f45'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7cf3ff55'; x.lineWidth = 6; x.strokeRect(24, 24, w - 48, h - 48); x.strokeStyle = '#ff7ce044'; x.strokeRect(44, 44, w - 88, h - 88); for (var i = 0; i < 2000; i++) { x.fillStyle = 'rgba(255,255,255,' + (Math.random() * .04) + ')'; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
    var rug = K.plane(3.2, 2.4, rugT, 0, .008, 1.25, L); rug.rotation.x = -PI / 2;
    K.rb(1.3, .05, .7, .03, wood, 0, .42, 1.25, L); [-.55, .55].forEach(function (x) { [-.28, .28].forEach(function (z) { K.cyl(.018, .018, .4, metal, x, .2, 1.25 + z, L, 8); }); });
    var gog = K.grp(-.25, .45, 1.2, .3, L); K.rb(.2, .07, .1, .025, blk, 0, .035, 0, gog); [-.05, .05].forEach(function (x) { var le = K.cyl(.03, .03, .02, K.std('#3a6aff', .1, .4), x, .035, .05, gog, 16); le.rotation.x = PI / 2; }); K.tor(.11, .012, K.std('#24262c', .8, 0), 0, .04, -.05, gog).rotation.x = PI / 2;
    var rc = K.grp(.28, .45, 1.28, -.25, L); K.rb(.22, .05, .13, .03, K.std('#202227', .5, .2), 0, .025, 0, rc); [-.06, .06].forEach(function (x) { K.cyl(.006, .006, .05, metal, x, .07, 0, rc, 8); K.cyl(.014, .014, .01, K.std('#555a66', .5, .3), x, .095, 0, rc, 12); }); K.cyl(.008, .006, .12, blk, .09, .1, -.06, rc, 8).rotation.z = -.4;
    /* торшер-дуга */
    var lm = K.grp(1.75, 0, -.25, 0, L); K.cyl(.18, .2, .04, metal, 0, .02, 0, lm); var cv = new T.CatmullRomCurve3([new T.Vector3(0, .04, 0), new T.Vector3(0, 1.4, 0), new T.Vector3(.35, 1.95, .2), new T.Vector3(.75, 1.8, .55)]);
    var tb = new T.Mesh(new T.TubeGeometry(cv, 30, .018, 8, false), metal); lm.add(tb); var sh = new T.Mesh(new T.SphereGeometry(.2, 20, 10, 0, PI * 2, 0, PI / 2), K.std('#e9e4da', .5, 0, { side: T.DoubleSide })); sh.position.set(.75, 1.78, .55); lm.add(sh);
    var bulb = new T.Mesh(new T.SphereGeometry(.06, 12, 8), K.glowM('#ffe2b0', 1.6)); bulb.position.set(.75, 1.72, .55); lm.add(bulb);
    K.plant(-W / 2 + .6, -1.0, 1.1); K.plant(-W / 2 + .6, 4.6, .9);
    frameArt(K, 1.2, .8, raceArt(0, '#46206a'), -W / 2 + .06, 2.3, 4.4, PI / 2); frameArt(K, .8, 1.1, raceArt(2, '#1e4a6a'), -W / 2 + .06, 2.2, -1.2, PI / 2);
    var nT = K.tex(1024, 256, function (x, w, h) { x.shadowColor = '#ff7ce0'; x.shadowBlur = 28; x.strokeStyle = '#ffd2f2'; x.lineWidth = 10; x.font = 'italic 800 170px Unbounded,Manrope,system-ui,sans-serif'; x.textAlign = 'center'; x.strokeText('FPV CLUB', w / 2, 190); x.strokeText('FPV CLUB', w / 2, 190); });
    var neon = new T.Mesh(new T.PlaneGeometry(2.6, .65), new T.MeshBasicMaterial({ map: nT, transparent: true, toneMapped: false, depthWrite: false })); neon.position.set(-W / 2 + .05, 2.45, 1.6); neon.rotation.y = PI / 2; K.G.add(neon);
    var wsh = K.grp(-W / 2 + .2, 1.75, 4.4, PI / 2); K.box(1.3, .04, .25, wood, 0, -.55, 0, wsh); var gg = K.drone('whoop', wsh, 2.2); gg.position.set(-.35, -.52, 0); gg.rotation.y = .6; K.lathe([[0, 0], [.07, 0], [.07, .02], [.02, .04], [.02, .1], [.08, .15], [.09, .25], [0, .25]], K.std('#e6b84a', .25, .95), .35, -.53, 0, wsh);
    K.block(-W / 2 + 1.25, 1.6, .55, 1.4, 0);
    /* справа: шкаф с кубками */
    var C = K.grp(W / 2 - .35, 0, 1.4, -PI / 2), glass = K.std('#cfe6ff', .05, 0, { transparent: true, opacity: .16 }), gold = K.std('#e6b84a', .25, .95), silv = K.std('#cfd5de', .25, .95);
    K.box(2.2, .12, .5, wood, 0, .06, 0, C); K.box(2.2, .08, .5, wood, 0, 2.26, 0, C); [-1.07, 1.07].forEach(function (x) { K.box(.06, 2.3, .5, wood, x, 1.15, 0, C); }); K.box(2.1, 2.2, .03, K.std('#20160f', .8, 0), 0, 1.2, -.235, C);   /* шкаф полый: задняя стенка, бока, верх и низ */ K.box(2.02, 2.1, .02, glass, 0, 1.2, .25, C);
    for (var i = 0; i < 3; i++) { var y = .45 + i * .62; K.box(1.98, .025, .4, glass, 0, y, .02, C); var led = K.box(1.96, .01, .01, K.glowM('#fff1d6', 1.2), 0, y + .55, .18, C);
      for (var j = 0; j < 3; j++) { var x = -.62 + j * .62, m = (i + j) % 3 === 0 ? gold : (i + j) % 3 === 1 ? silv : K.std('#c47a3c', .3, .9);
        if ((i * 3 + j) % 4 === 3) { var dr = K.drone(j === 1 ? '5' : '3', C, .9); dr.position.set(x, y + .02, .02); dr.rotation.y = .5; continue; }
        K.lathe([[0, 0], [.09, 0], [.09, .03], [.03, .05], [.025, .14], [.1, .2], [.11, .32], [0, .32]], m, x, y + .015, .02, C); K.box(.14, .03, .1, K.std('#111', .5, .2), x, y + .03, .02, C); } }
    podiumy(K, [['whoop', 'Вуп', '65-75 мм · комната', W / 2 - 1.2, -2.8, -PI / 2], ['3', '3 дюйма', 'зал и двор', W / 2 - 1.2, 4.3, -PI / 2], ['5', '5 дюймов', 'гонки на улице', W / 2 - 1.2, 6.4, -PI / 2]]);   /* музей дронов у правой стены */
    K.plant(W / 2 - .6, 3.0, .9); K.block(W / 2 - .35, 1.4, 1.1, .3, 0);
    /* у окна по углам - кресла-мешки */
    [[-8.6, -6.9, '#2f6f8f'], [8.9, -6.8, '#8f3f6f']].forEach(function (q) { var g = K.grp(q[0], 0, q[1], 0); K.sph(.55, K.std(q[2], .95, 0), 0, .34, 0, g, 1, .62, 1); K.sph(.42, K.std(q[2], .95, 0), 0, .62, -.28, g, 1, .7, .55); K.block(q[0], q[1], .5, .5, 0); });
  },
  /* Б. Музей дронов: подиумы со стеклянными колпаками, в каждом дрон своего класса, подсветка сверху, таблички */
  B: function (X) { var K = kit(X), T = K.T, W = K.W, D = K.D, white = K.std('#eceef2', .4, 0), glass = K.std('#dff0ff', .03, 0, { transparent: true, opacity: .14 }), dark = K.std('#16171c', .5, .3);
    var items = [['whoop', 'Вуп', '65-75 мм · комната', -W / 2 + 1.4, 5.2, PI / 2], ['3', '3 дюйма', 'зал и двор', -W / 2 + 1.4, 1.4, PI / 2], ['cine', 'Синевуп', 'съёмка кино', -W / 2 + 1.4, -2.4, PI / 2], ['5', '5 дюймов', 'гонки на улице', W / 2 - 1.4, -2.4, -PI / 2], ['5', 'Фристайл', 'трюки', W / 2 - 1.4, 1.4, -PI / 2], ['3', 'Гоночный 3"', 'гонки в зале', W / 2 - 1.4, 5.2, -PI / 2]];
    podiumy(K, items);
    /* у окна: большая карта трассы на подставке и растения */
    [[-8.6, -7.0, 0], [8.9, -7.0, 1]].forEach(function (q) { var g = K.grp(q[0], 0, q[1], 0); K.cyl(.03, .03, 1.3, K.std('#2a2d35', .35, .8), 0, .65, 0, g, 8); K.cyl(.3, .32, .04, K.std('#2a2d35', .35, .8), 0, .02, 0, g);
      var t = K.tex(512, 360, raceArt(q[2], '#24305a')); var p2 = K.plane(1.3, .9, t, 0, 1.75, .02, g); K.rb(1.4, 1.0, .04, .02, K.std('#1a1a1e', .5, .3), 0, 1.75, 0, g); K.plant(q[0] + (q[2] ? -1.1 : 1.1), q[1] + .2, 1.0); K.block(q[0], q[1], .5, .3, 0); });
    var hT = K.tex(1024, 160, function (x, w, h) { x.fillStyle = '#e9ecf2'; x.font = '800 64px Unbounded,Manrope,system-ui,sans-serif'; x.textAlign = 'center'; x.fillText('ДРОНЫ РАЗНЫХ КЛАССОВ', w / 2, 112); });
    var hl = new T.Mesh(new T.PlaneGeometry(4.2, .66), new T.MeshBasicMaterial({ map: hT, transparent: true, toneMapped: false })); hl.position.set(-W / 2 + .05, 3.3, 1.4); hl.rotation.y = PI / 2; K.G.add(hl);
  },
  /* В. Уголок пилота-техника: перфопанель с инструментом и верстак с 3D-принтером слева, зарядная станция справа, растения */
  V: function (X) { var K = kit(X), T = K.T, W = K.W, D = K.D, wood = K.std('#c9a678', .7, 0), dark = K.std('#1c1e24', .5, .3), metal = K.std('#2a2d35', .35, .8), steel = K.std('#b9c0cc', .3, .9);
    var L = K.grp(-W / 2 + .05, 0, 2.2, PI / 2);
    var pT = K.tex(1024, 512, function (x, w, h) { x.fillStyle = '#3a4150'; x.fillRect(0, 0, w, h); x.fillStyle = '#20242d'; for (var i = 16; i < w; i += 32) for (var j = 16; j < h; j += 32) { x.beginPath(); x.arc(i, j, 5, 0, PI * 2); x.fill(); } });
    K.plane(3.2, 1.6, pT, 0, 2.0, .02, L); K.rb(3.3, 1.7, .04, .02, metal, 0, 2.0, 0, L);
    var hand = ['#e04848', '#3a7bd5', '#e8c33c', '#3fbf7f', '#e04848', '#3a7bd5'];
    for (var i = 0; i < 6; i++) { var x = -1.3 + i * .22, hk = K.box(.03, .5 - i * .04, .03, steel, x, 2.25, .06, L); K.box(.05, .12, .05, K.std(hand[i], .5, 0), x, 2.25 + (.5 - i * .04) / 2 + .05, .06, L); }
    [[.1, '#e04848'], [.45, '#3a7bd5']].forEach(function (q) { var pl = K.grp(q[0], 2.2, .07, 0, L); [-1, 1].forEach(function (s) { var a = K.box(.035, .32, .03, K.std(q[1], .5, 0), s * .03, -.12, 0, pl); a.rotation.z = s * .12; }); K.box(.07, .14, .03, steel, 0, .1, 0, pl); });
    [[.9, '#e8c33c'], [1.15, '#20242d'], [1.38, '#3fbf7f']].forEach(function (q) { K.tor(.08, .035, K.std(q[1], .6, 0), q[0], 2.45, .07, L); });
    K.cyl(.12, .12, .1, K.std('#9aa3b5', .3, .9), 1.0, 1.75, .09, L, 20).rotation.x = PI / 2;
    /* верстак с ящиками и 3D-принтер */
    K.rb(3.0, .06, .8, .02, wood, 0, .92, .45, L); K.rb(.9, .86, .74, .02, dark, -1.0, .45, .45, L); for (var d = 0; d < 3; d++) { K.box(.8, .22, .01, K.std('#2a2d35', .5, .3), -1.0, .2 + d * .26, .83, L); K.box(.2, .02, .03, steel, -1.0, .24 + d * .26, .85, L); }
    [1.3, -.4].forEach(function (x) { K.box(.06, .86, .06, metal, x, .45, .8, L); K.box(.06, .86, .06, metal, x, .45, .12, L); });
    var P = K.grp(.5, .95, .4, .2, L), pf = K.std('#22252c', .4, .4), acc = K.std('#ff7a2a', .5, 0);
    K.box(.5, .05, .5, pf, 0, .025, 0, P); [-.23, .23].forEach(function (x) { K.box(.04, .6, .04, pf, x, .32, -.2, P); }); K.box(.5, .04, .06, pf, 0, .62, -.2, P); K.box(.5, .025, .04, steel, 0, .42, -.12, P);
    K.box(.09, .1, .08, acc, .05, .42, -.08, P); K.box(.4, .015, .4, K.std('#141518', .3, .5), 0, .06, .02, P); K.cyl(.06, .08, .1, K.std('#7cf3ff', .4, 0), .05, .12, .02, P, 6);
    K.cyl(.12, .12, .07, K.std('#ff7a2a', .5, 0), .3, .65, -.2, P, 20).rotation.z = PI / 2;
    K.block(-W / 2 + .45, 2.2, .45, 1.6, 0);
    /* справа: зарядная станция LiPo */
    var R = K.grp(W / 2 - .45, 0, 1.6, -PI / 2);
    K.rb(2.6, .06, .8, .02, K.std('#e9ecf2', .5, 0), 0, .92, 0, R); [-1.2, 1.2].forEach(function (x) { K.box(.06, .9, .7, metal, x, .45, 0, R); });
    var ch = K.grp(-.6, .95, -.05, 0, R); K.rb(.42, .14, .3, .03, K.std('#202227', .5, .2), 0, .07, 0, ch);
    var lcd = K.tex(256, 128, function (x, w, h) { x.fillStyle = '#0a2a3a'; x.fillRect(0, 0, w, h); x.fillStyle = '#7cf3ff'; x.font = 'bold 34px monospace'; x.fillText('4S 15.6V', 18, 52); x.fillText('1.2A  62%', 18, 100); });
    var sc = K.plane(.2, .1, lcd, 0, .085, .151, ch, true);
    [0, 1, 2].forEach(function (k) { var bag = K.grp(.05 + k * .36, .95, 0, (k - 1) * .1, R); K.rb(.3, .16, .2, .05, K.std(k === 1 ? '#202227' : '#c0392b', .85, 0), 0, .08, 0, bag); K.box(.26, .02, .01, K.std('#e8c33c', .6, 0), 0, .13, .101, bag);
      var led = new T.Mesh(new T.SphereGeometry(.012, 8, 6), K.glowM(k === 2 ? '#9dff7c' : '#ff4f6a', 1.8)); led.position.set(.11, .12, .1); bag.add(led); });
    K.cyl(.11, .11, .55, K.std('#d42a2a', .4, .2), 1.05, .3, .1, R, 18); K.cyl(.05, .05, .1, dark, 1.05, .62, .1, R, 12);
    var sT = K.tex(512, 160, function (x, w, h) { x.fillStyle = '#ffd36e'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1a1a'; x.font = '800 54px Manrope,system-ui,sans-serif'; x.textAlign = 'center'; x.fillText('ЗАРЯДКА АКБ', w / 2, 72); x.font = '700 32px Manrope,system-ui,sans-serif'; x.fillText('только под присмотром', w / 2, 124); });
    K.plane(1.1, .34, sT, 0, 2.0, -.38, R);
    K.box(2.4, .03, .3, wood, 0, 2.5, -.25, R); for (var b = 0; b < 6; b++) K.box(.16, .24, .04, K.std(['#ff6b2c', '#7cf3ff', '#ff7ce0'][b % 3], .6, 0), -1.0 + b * .4, 2.64, -.25, R);
    K.block(W / 2 - .45, 1.6, .45, 1.4, 0);
    /* у окна: дрон висит под потолком и растения */
    [[-8.6, -7.0], [8.9, -7.0]].forEach(function (q, n) { K.plant(q[0], q[1], 1.15); var hg = K.grp(q[0] + (n ? -1.2 : 1.2), 3.0, q[1] + .3, 0); var dr = K.drone(n ? '5' : 'cine', hg, 3.2); dr.rotation.set(.25, .6, .1);
      [-1, 1].forEach(function (s) { K.cyl(.004, .004, 1.6, steel, s * .3, .9, 0, hg, 4); }); });
  }
};
})();
