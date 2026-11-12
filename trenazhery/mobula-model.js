/* mobula-model.js - 3D-модель вупа Mobula 7 (three r128), нарисована кодом по фото владельца от 11.11.2026.
   Одна модель на все тренажёры: "Mobula 7", "Классы дронов", "Пульт". Нужен ../studiya.js (STUDIYA.cnv).
   Что видно на фото и есть в модели: серая рама из четырёх колец с крестом спиц, перемычки и петля спереди,
   открытые моторы 0702 с медными обмотками, прозрачные двухлопастные винты, витые чёрные провода моторов с белыми разъёмами,
   чёрная плата ромбом на резиновых втулках, чёрный колпак-"шлем" с прорезями, камера с наклоном вверх,
   жёлто-красно-чёрный шлейф камеры, антенна в чёрной трубке с белым кончиком, красно-чёрный провод питания, держатель АКБ снизу.
   MOBULA({ env: карта отражений, crack: номер винта с трещиной или -1 }) ->
     { g: группа, props: [4 винта], propY, led, bat, batM, plug, sock, BAT_IN, MX }
   Размер: моторы по углам квадрата со стороной 2 * MX (MX = .29), то есть 1 единица ~ 9 см. Нос (камера) смотрит в -Z. */
(function () {
'use strict';
var T = THREE;
function V(a) { return a.map(function (q) { return new T.Vector2(q[0], q[1]); }); }
window.MOBULA = function (o) {
  o = o || {}; var ENV = o.env || null, crackI = o.crack == null ? -1 : o.crack, cnv = STUDIYA.cnv;
  function std(c, r, m, x) { var q = new T.MeshStandardMaterial({ color: new T.Color(c).convertSRGBToLinear(), roughness: r == null ? .5 : r, metalness: m || 0, envMap: ENV, envMapIntensity: .35 }); if (x) Object.assign(q, x); return q; }
  function phys(c, r, x) { var q = new T.MeshPhysicalMaterial({ color: new T.Color(c).convertSRGBToLinear(), roughness: r, clearcoat: .5, clearcoatRoughness: .3, envMap: ENV, envMapIntensity: .45 }); if (x) Object.assign(q, x); return q; }
  function neon(c, k) { return new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k || 1.5), toneMapped: false }); }
  function add(p, geo, mat, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); p.add(m); return m; }
  function tube(pts, r, mat, seg) { return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), seg || 24, r, 6, false), mat); }
  var G = new T.Group(), MX = .29, MOT = [[MX, -MX], [-MX, -MX], [MX, MX], [-MX, MX]], S2 = Math.SQRT1_2;
  var frameM = phys('#5e636b', .5, { clearcoat: .25, envMapIntensity: .3 }), black = std('#0e0e11', .55, .1), rubber = std('#0a0a0c', .85), steel = std('#b9bcc4', .3, .9, { envMapIntensity: .9 }),
    bellM = std('#3a3c45', .3, .85, { envMapIntensity: .9, side: T.DoubleSide }), copper = std('#d0773a', .32, .9, { envMapIntensity: 1 }), wireM = std('#0b0b0d', .6), white = std('#e9e9e2', .5);
  /* ---- кольцо: тонкая стенка с отогнутой верхней кромкой ---- */
  var ductG = new T.LatheGeometry(V([[.248, -.045], [.26, -.045], [.2605, .03], [.268, .05], [.263, .06], [.253, .058], [.248, .04], [.248, -.045]]), 80);
  var spokeG = new T.BoxGeometry(.2, .022, .007), seatG = new T.CylinderGeometry(.05, .05, .012, 32);
  /* ---- мотор 0702: основание, статор с 9 медными катушками, открытый колокол, вал ---- */
  var coilG = new T.SphereGeometry(.0125, 10, 8), bellG = new T.LatheGeometry(V([[.05, .0], [.05, .018], [.045, .026], [.02, .029], [.013, .04], [0, .04]]), 36);
  /* ---- винт 40 мм, две широкие лопасти ---- */
  var bladeG = (function () { var s = new T.Shape(); s.moveTo(.014, -.012); s.bezierCurveTo(.04, -.07, .15, -.1, .21, -.06); s.bezierCurveTo(.245, -.034, .242, .012, .212, .03); s.bezierCurveTo(.15, .05, .07, .034, .014, .012);
    var g = new T.ExtrudeGeometry(s, { depth: .003, bevelEnabled: true, bevelThickness: .0012, bevelSize: .0015, bevelSegments: 2, curveSegments: 18 }); g.rotateX(-Math.PI / 2);
    var p = g.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i), z = p.getZ(i), tw = .95 - x * 2.7; p.setY(i, p.getY(i) - z * Math.sin(tw)); p.setZ(i, z * Math.cos(tw)); } g.computeVertexNormals(); return g; })();
  var hubG = new T.LatheGeometry(V([[0, -.014], [.02, -.014], [.021, 0], [.015, .028], [.01, .034], [0, .034]]), 24);
  var props = [], PY = .04;
  MOT.forEach(function (q, i) {
    var g = new T.Group(); g.position.set(q[0], 0, q[1]); G.add(g);
    add(g, ductG, frameM);
    for (var k = 0; k < 4; k++) { var a = k * Math.PI / 2, sp = add(g, spokeG, frameM, Math.cos(a) * .15, -.034, Math.sin(a) * .15); sp.rotation.y = -a; }
    add(g, seatG, frameM, 0, -.039, 0);
    var ox = q[0] > 0 ? 1 : -1, oz = q[1] > 0 ? 1 : -1; /* ножка-упор снизу кольца */
    add(g, new T.CylinderGeometry(.011, .008, .03, 10), frameM, ox * S2 * .254, -.058, oz * S2 * .254);
    var mg = new T.Group(); mg.scale.setScalar(1.16); mg.position.y = .004; g.add(mg);
    add(mg, new T.CylinderGeometry(.04, .042, .008, 28), black, 0, -.029, 0);
    add(mg, new T.CylinderGeometry(.021, .021, .024, 20), std('#3a3c42', .5, .6), 0, -.014, 0);
    for (var c = 0; c < 9; c++) { var ca = c * Math.PI * 2 / 9, cm = add(mg, coilG, copper, Math.cos(ca) * .031, -.015, Math.sin(ca) * .031); cm.scale.set(1.05, .95, .72); cm.rotation.y = -ca; }
    add(mg, bellG, bellM);
    add(g, new T.CylinderGeometry(.005, .005, .05, 8), steel, 0, .045, 0);
    /* витая пара проводов мотора к плате и белый разъём */
    var dx = -ox * S2, dz = -oz * S2, base = [[.05, -.03], [.11, -.047], [.24, -.052], [.275, -.022], [.288, .014]];
    for (var w = 0; w < 2; w++) { var pts = []; for (var s = 0; s <= 30; s++) { var u = s / 30 * (base.length - 1), i0 = Math.min(base.length - 2, Math.floor(u)), f = u - i0, d = base[i0][0] + (base[i0 + 1][0] - base[i0][0]) * f, y = base[i0][1] + (base[i0 + 1][1] - base[i0][1]) * f, ph = s * 1.25 + w * Math.PI, off = Math.cos(ph) * .0055;
      pts.push(new T.Vector3(dx * d - dz * off, y + Math.sin(ph) * .0055, dz * d + dx * off)); } g.add(tube(pts, .0048, wireM, 60)); }
    var pl = add(g, new T.BoxGeometry(.042, .018, .026), white, dx * .295, .016, dz * .295); pl.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
    /* винт */
    var pr = new T.Group(); pr.position.y = PY; g.add(pr);
    var pm = phys(i === crackI ? '#d8c9c4' : '#b9c4d0', .12, { transparent: true, opacity: .4, depthWrite: false, side: T.DoubleSide, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: .9 });
    for (var b = 0; b < 2; b++) { var bl = new T.Mesh(bladeG, pm); bl.rotation.y = b * Math.PI; pr.add(bl); }
    pr.add(new T.Mesh(hubG, pm));
    if (i === crackI) { var crack = new T.Mesh(new T.BoxGeometry(.004, .008, .06), neon('#ff3b4e', 1.6)); crack.position.set(.13, .006, -.01); crack.rotation.y = .4; pr.add(crack); pr.userData.crack = crack; }
    props.push(pr);
  });
  /* ---- рама в центре: перемычки между кольцами, лучи к стойкам платы, ромб снизу, петля спереди ---- */
  [[0, -MX, 0], [0, MX, 0], [-MX, 0, 1], [MX, 0, 1]].forEach(function (q) { var sx = q[0] > 0 ? 1 : q[0] < 0 ? -1 : 0, sz = q[1] > 0 ? 1 : q[1] < 0 ? -1 : 0;
    add(G, new T.BoxGeometry(q[2] ? .034 : .085, .062, q[2] ? .085 : .034), frameM, q[0], -.014, q[1]);
    add(G, new T.BoxGeometry(q[2] ? .15 : .03, .02, q[2] ? .03 : .15), frameM, sx * .22, -.035, sz * .22);
    add(G, new T.CylinderGeometry(.02, .024, .05, 16), frameM, sx * .15, -.02, sz * .15);
    add(G, new T.CylinderGeometry(.03, .03, .018, 20), rubber, sx * .15, .006, sz * .15); });
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) { var b = add(G, new T.BoxGeometry(.2, .018, .022), frameM, q[0] * .075, -.036, q[1] * .075); b.rotation.y = q[0] * q[1] > 0 ? Math.PI / 4 : -Math.PI / 4; });
  var loop = add(G, new T.TorusGeometry(.03, .008, 8, 24), frameM, 0, -.036, -.348); loop.rotation.x = Math.PI / 2;
  /* держатель АКБ: две скобы под платой */
  [-.07, .1].forEach(function (z) { add(G, new T.BoxGeometry(.172, .012, .05), frameM, 0, -.134, z); [-1, 1].forEach(function (s) { add(G, new T.BoxGeometry(.012, .1, .05), frameM, s * .08, -.088, z); }); });
  /* ---- плата "всё в одном": чёрная, ромбом, с деталями ---- */
  var fcT = cnv(512, 512, function (c, w, h) { c.fillStyle = '#0a0c0f'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#141b1c'; c.lineWidth = 3; for (var j = 0; j < 60; j++) { var x = Math.random() * w, y = Math.random() * h, l = 30 + Math.random() * 70; c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y); c.lineTo(x + l + 18, y + 18); c.stroke(); }
    function chip(x, y, s, pins) { c.fillStyle = '#9a9ea6'; if (pins) for (var k = 0; k < pins; k++) { var t = s * (k + .5) / pins; c.fillRect(x + t - 2, y - 5, 4, s + 10); c.fillRect(x - 5, y + t - 2, s + 10, 4); } c.fillStyle = '#191b20'; c.fillRect(x, y, s, s); c.fillStyle = '#2a2d34'; c.fillRect(x + 3, y + 3, s - 6, s - 6); c.fillStyle = '#5c626c'; c.beginPath(); c.arc(x + 10, y + 10, 3, 0, 7); c.fill(); }
    chip(196, 200, 108, 11); chip(96, 110, 56, 6); chip(350, 330, 48, 5); chip(330, 120, 40, 0); chip(110, 340, 44, 5);
    for (var m = 0; m < 70; m++) { var px = 30 + Math.random() * 450, py = 30 + Math.random() * 450; if (px > 185 && px < 315 && py > 190 && py < 318) continue; var r = Math.random(); c.fillStyle = r < .4 ? '#b59a6c' : r < .7 ? '#16171b' : '#c9ccd4'; c.fillRect(px, py, r < .4 ? 10 : 8, r < .4 ? 6 : 5); c.fillStyle = '#c9ccd4'; if (r < .7) { c.fillRect(px - 2, py, 2, 6); c.fillRect(px + (r < .4 ? 10 : 8), py, 2, 6); } }
    c.fillStyle = '#d7a640'; [[18, 18], [462, 18], [18, 462], [462, 462]].forEach(function (q) { c.beginPath(); c.arc(q[0] + 16, q[1] + 16, 20, 0, 7); c.fill(); }); for (var e = 0; e < 5; e++) { c.fillRect(200 + e * 24, 474, 14, 22); c.fillRect(200 + e * 24, 16, 14, 22); }
    c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '700 15px sans-serif'; c.fillText('F4 1S AIO', 196, 336); c.fillText('ELRS', 96, 186); });
  fcT.anisotropy = 4;
  var fc = add(G, new T.BoxGeometry(.245, .012, .245), [black, black, std('#ffffff', .5, .25, { map: fcT }), black, black, black], 0, .005, 0); fc.rotation.y = Math.PI / 4;
  var chip = add(G, new T.BoxGeometry(.055, .01, .055), std('#15161a', .35, .2), -.01, .016, .035); chip.rotation.y = Math.PI / 4;
  add(G, new T.BoxGeometry(.06, .02, .045), steel, 0, -.011, .1); /* гнездо USB снизу */
  var led = add(G, new T.BoxGeometry(.018, .01, .018), neon('#222', 1), .075, .016, .04);
  /* ---- колпак-"шлем" с прорезями (прорези - настоящие дырки, сквозь них видно плату и камеру) ---- */
  var holeT = cnv(1024, 512, function (c, w, h) { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#000';
    function rr(x, y, a, b, r) { c.beginPath(); c.moveTo(x - a + r, y - b); c.arcTo(x + a, y - b, x + a, y + b, r); c.arcTo(x + a, y + b, x - a, y + b, r); c.arcTo(x - a, y + b, x - a, y - b, r); c.arcTo(x - a, y - b, x + a, y - b, r); c.fill(); }
    function el(x, y, a, b) { c.beginPath(); c.ellipse(x, y, a, b, 0, 0, 7); c.fill(); }
    function both(f) { f(0); f(w); f(-w); }
    rr(.75 * w, .62 * h, .088 * w, .2 * h, 46); /* окно камеры спереди */
    both(function (d) { [.5, .64, .78].forEach(function (y, k) { rr(d + 0, y * h, (.062 - k * .006) * w, .04 * h, 18); rr(d + .5 * w, y * h, (.062 - k * .006) * w, .04 * h, 18); }); }); /* по три щели слева и справа */
    [.125, .375].forEach(function (u) { [.52, .68].forEach(function (y) { rr(u * w, y * h, .04 * w, .045 * h, 20); }); }); /* щели сзади по бокам */
    el(.25 * w, .7 * h, .03 * w, .07 * h); /* отверстие под антенну сзади */
    [.625, .875].forEach(function (u) { el(u * w, .4 * h, .034 * w, .075 * h); el(u * w, .68 * h, .026 * w, .06 * h); }); /* круглые отверстия у камеры */
    for (var k = 0; k < 6; k++) el((k + .5) / 6 * w, .2 * h, .05 * w, .055 * h); /* шесть отверстий на макушке */
    el(.25 * w, .44 * h, .04 * w, .06 * h); });
  var canM = new T.MeshStandardMaterial({ color: new T.Color('#1d1e23').convertSRGBToLinear(), roughness: .5, metalness: .1, envMap: ENV, envMapIntensity: .4, alphaMap: holeT, alphaTest: .5, side: T.DoubleSide });
  var canopy = add(G, new T.SphereGeometry(.118, 64, 32, 0, Math.PI * 2, 0, Math.PI * .57), canM, 0, .1, 0); canopy.scale.set(1, 1.1, 1.12);
  var canS = std('#1d1e23', .5, .1);
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (q) { var leg = add(G, new T.BoxGeometry(q[0] ? .018 : .032, .07, q[0] ? .032 : .018), canS, q[0] * .132, .05, q[1] * .14); leg.rotation.z = -q[0] * .42; leg.rotation.x = q[1] * .42;
    add(G, new T.CylinderGeometry(.026, .026, .01, 18), canS, q[0] * .15, .019, q[1] * .15); add(G, new T.CylinderGeometry(.013, .013, .012, 12), std('#2b2c31', .3, .9, { envMapIntensity: .9 }), q[0] * .15, .028, q[1] * .15); });
  /* ---- камера внутри колпака, наклон вверх ---- */
  var camG = new T.Group(); camG.position.set(0, .118, -.058); camG.rotation.x = .42; G.add(camG);
  add(camG, new T.BoxGeometry(.086, .086, .012), std('#10151a', .5, .2), 0, 0, .012);
  add(camG, new T.BoxGeometry(.066, .066, .024), black, 0, 0, -.004);
  var barrel = add(camG, new T.CylinderGeometry(.03, .033, .05, 32), std('#0a0a0c', .35, .5, { envMapIntensity: .8 }), 0, 0, -.038); barrel.rotation.x = Math.PI / 2;
  var rim = add(camG, new T.TorusGeometry(.029, .004, 8, 32), std('#18181c', .3, .7, { envMapIntensity: .9 }), 0, 0, -.063);
  var glass = add(camG, new T.SphereGeometry(.027, 24, 12, 0, Math.PI * 2, 0, .95), new T.MeshPhysicalMaterial({ color: new T.Color('#0a1530').convertSRGBToLinear(), roughness: .02, metalness: .6, clearcoat: 1, clearcoatRoughness: 0, envMap: ENV, envMapIntensity: 2 }), 0, 0, -.045); glass.rotation.x = -Math.PI / 2;
  /* шлейф камеры: жёлтый, красный, чёрный */
  ['#e8c21e', '#d2332c', '#111114'].forEach(function (col, k) { var z = -.035 + k * .011; G.add(tube([new T.Vector3(.03, .1, z - .01), new T.Vector3(.085, .085, z - .03), new T.Vector3(.118, .05, z - .03), new T.Vector3(.1, .014, z - .012)], .0045, std(col, .5), 20)); });
  /* ---- антенна: чёрная трубка с белым кончиком, отогнута назад ---- */
  var antG = new T.Group(); antG.position.set(0, .16, .085); antG.rotation.x = .72; G.add(antG);
  add(antG, new T.CylinderGeometry(.012, .017, .06, 12), rubber, 0, .03, 0); add(antG, new T.CylinderGeometry(.0105, .012, .11, 12), rubber, 0, .115, 0);
  add(antG, new T.CylinderGeometry(.003, .003, .1, 6), std('#f2f2f2', .5), 0, .22, 0);
  /* ---- провод питания (красный и чёрный) и разъём дрона сзади ---- */
  var sock = add(G, new T.BoxGeometry(.055, .032, .045), white, 0, -.04, .3);
  [['#d2332c', -.013], ['#111114', .013]].forEach(function (q) { G.add(tube([new T.Vector3(q[1], -.002, .12), new T.Vector3(q[1] * 1.4, .0, .2), new T.Vector3(q[1], -.03, .26), new T.Vector3(q[1], -.04, .285)], .0075, std(q[0], .5), 20)); });
  /* ---- АКБ GNB 850 1S HV: фиолетовая, в держателе снизу ---- */
  var batT = cnv(512, 128, function (c, w, h) { var g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#6b2fbf'); g.addColorStop(1, '#b46bff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff'; c.fillRect(0, h * .62, w, h * .38); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 44px Manrope, sans-serif'; c.fillText('GNB', 60, h * .32); c.font = '900 64px Manrope, sans-serif'; c.fillText('850', 360, h * .32); c.font = '800 22px Manrope, sans-serif'; c.fillText('mAh', 450, h * .4);
    c.fillStyle = '#3a1a6a'; c.font = '800 26px Manrope, sans-serif'; c.fillText('1S 3.8V HV · LiHV · 60C', w / 2, h * .81); });
  var BAT_IN = new T.Vector3(0, -.09, .02), bat = new T.Group(); G.add(bat); bat.position.copy(BAT_IN);
  var side = std('#5a2aa0', .45), batM = new T.Mesh(STUDIYA.rbox(.13, .07, .42, .016, 2), [side, std('#ffffff', .45, 0, { map: batT })]);
  (function () { var p = batM.geometry.attributes.position, uv = batM.geometry.attributes.uv, n = batM.geometry.attributes.normal; for (var i = 0; i < uv.count; i++) uv.setXY(i, p.getZ(i) / .42 + .5, Math.abs(n.getY(i)) > .5 ? p.getX(i) / .13 + .5 : p.getY(i) / .07 + .5); })();
  bat.add(batM);
  [['#d2332c', -.018], ['#111114', .018]].forEach(function (q) { var m = add(bat, new T.CylinderGeometry(.0075, .0075, .12, 6), std(q[0], .5), q[1], .012, .26); m.rotation.x = Math.PI / 2; });
  var plug = add(bat, new T.BoxGeometry(.05, .03, .045), white, 0, .012, .335);
  STUDIYA.shadows(G); canopy.castShadow = true;
  return { g: G, props: props, propY: PY, led: led, bat: bat, batM: batM, plug: plug, sock: sock, BAT_IN: BAT_IN, MX: MX };
};
})();
