/* studiya.js - общая "тёмная студия" тренажёров курса (three r128), стиль А, выбран 11.11.2026.
   Даёт всем тренажёрам один современный вид: фон-купол с цветным заревом, матовый пол, мягкие тени,
   тёплый основной свет и два цветных контровых, виньетка.
   STUDIYA(ren, sc, { size: 1, rings: [2.6, 3.4], rimA: '#7cf3ff', rimB: '#c77dff' }) -> { env, key, floor }
   STUDIYA.rbox(w, h, d, r)  - брусок со скруглёнными углами и фаской (лежит в XY, толщина по Z)
   STUDIYA.plate(w, h, d, r) - то же, но лежит плашмя: ширина X, толщина Y, длина Z
   STUDIYA.glow(цвет, размер) - мягкое свечение вокруг лампочки
   STUDIYA.shadows(group)    - включить тени всем непрозрачным деталям группы
   Правило: envMap ставим в каждый материал сами (в r128 сила envMapIntensity работает только так), sc.environment не трогаем.
   Пол матовый: на глянцевом контровой свет даёт белое пятно. */
(function () {
'use strict';
var T = THREE;
function cnv(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; }
window.STUDIYA = function (ren, sc, o) {
  o = o || {}; var R = o.size || 1, cA = o.rimA || '#7cf3ff', cB = o.rimB || '#c77dff';
  var weak = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent); /* на телефоне тень полегче */
  ren.shadowMap.enabled = true; ren.shadowMap.type = T.PCFSoftShadowMap; ren.toneMappingExposure = 1.02;
  sc.background = new T.Color('#070818'); sc.fog = null;
  var env = new T.PMREMGenerator(ren).fromScene(new T.RoomEnvironment(), .03).texture;
  /* фон: большой купол, у горизонта светлее, за предметом цветное зарево */
  var skyT = cnv(1024, 512, function (c, w, h) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#04050d'); g.addColorStop(.34, '#0e1330'); g.addColorStop(.5, '#2c2360'); g.addColorStop(.56, '#070818'); g.addColorStop(1, '#070818'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    [[.5, '#5b3dff', .5], [.2, cA, .22], [.8, cB, .25]].forEach(function (q) { var r = c.createRadialGradient(w * q[0], h * .5, 0, w * q[0], h * .5, w * .22); r.addColorStop(0, q[1]); r.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = q[2]; c.fillStyle = r; c.fillRect(0, 0, w, h * .56); }); c.globalAlpha = 1;
    for (var i = 0; i < 160; i++) { c.fillStyle = 'rgba(255,255,255,' + (.15 + Math.random() * .5) + ')'; c.fillRect(Math.random() * w, Math.random() * h * .42, 1.5, 1.5); } });
  var sky = new T.Mesh(new T.SphereGeometry(60 * R, 48, 24), new T.MeshBasicMaterial({ map: skyT, side: T.BackSide, toneMapped: false, fog: false, depthWrite: false })); sky.rotation.y = Math.PI * 1.5; sc.add(sky);
  /* пол: матовый, к краям растворяется в фоне */
  var fadeT = cnv(512, 512, function (c, w, h) { var g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, '#fff'); g.addColorStop(.45, '#fff'); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  var floor = new T.Mesh(new T.CircleGeometry(14 * R, 64), new T.MeshStandardMaterial({ color: new T.Color('#1b2054').convertSRGBToLinear(), roughness: .97, metalness: 0, envMap: env, envMapIntensity: .07, alphaMap: fadeT, transparent: true }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
  (o.rings || [2.6, 3.4]).forEach(function (q, i) { var r = new T.Mesh(new T.RingGeometry(q * R, (q + .012) * R, 128), new T.MeshBasicMaterial({ color: new T.Color(cA).multiplyScalar(i ? .25 : .55), toneMapped: false, transparent: true, opacity: .8 })); r.rotation.x = -Math.PI / 2; r.position.y = .002 * R; sc.add(r); });
  /* свет */
  sc.add(new T.HemisphereLight('#aab6ff', '#140c22', .34));
  var key = new T.SpotLight('#fff0dc', 1.55, 30 * R, .5, .7, 1); key.position.set(2.4 * R, 5.2 * R, 3 * R); key.target.position.set(0, .2 * R, 0);
  key.castShadow = true; var ms = weak ? 1024 : 2048; key.shadow.mapSize.set(ms, ms); key.shadow.bias = -.0004; key.shadow.normalBias = .012 * R; key.shadow.radius = 7; key.shadow.camera.near = 2 * R; key.shadow.camera.far = 14 * R; sc.add(key, key.target);
  var rimA = new T.DirectionalLight(cA, .9); rimA.position.set(-4 * R, 2.2 * R, -3 * R); sc.add(rimA);
  var rimB = new T.DirectionalLight(cB, .9); rimB.position.set(4 * R, 1.6 * R, -3.5 * R); sc.add(rimB);
  /* виньетка поверх картинки (под кнопками) */
  var v = document.createElement('div'); v.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 50% 55%,transparent 45%,rgba(0,0,0,.5) 100%)'; document.body.insertBefore(v, document.getElementById('ui'));
  return { env: env, key: key, floor: floor };
};
function rbox(w, h, d, r, seg) { var s = new T.Shape(), x = w / 2, y = h / 2; r = Math.min(r, x, y);
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r); s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y); s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r); s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y);
  var b = Math.min(d * .3, r * .5), g = new T.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: seg || 3, curveSegments: 8 }); g.translate(0, 0, -(d - 2 * b) / 2); return g; }
function plate(w, h, d, r) { var g = rbox(w, d, h, r == null ? Math.min(w, d) * .22 : r, 2); g.rotateX(-Math.PI / 2); return g; }
var glowT = null;
function glow(col, size, op) { glowT = glowT || cnv(128, 128, function (c, w) { var g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); });
  var s = new T.Sprite(new T.SpriteMaterial({ map: glowT, color: col, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: op == null ? .8 : op, toneMapped: false })); s.scale.setScalar(size); return s; }
function shadows(g) { g.traverse(function (o) { var m = o.material; if (!o.isMesh || !m) return; if (Array.isArray(m)) m = m[0]; if (m.isMeshBasicMaterial || m.depthWrite === false) return; o.castShadow = true; o.receiveShadow = !m.transparent; }); }
window.STUDIYA.rbox = rbox; window.STUDIYA.plate = plate; window.STUDIYA.glow = glow; window.STUDIYA.shadows = shadows; window.STUDIYA.cnv = cnv;
})();
