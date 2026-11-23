/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* shkola.js - "Лётная школа" (проба 23.11.2026, вариант 1 "Башня с лифтом", упор на телефон).
   Вместо летающего города - одно здание: холл, лифт, этажи. Этаж = модуль, на этаже три шага: теория - практика - тест.
   Задания открываются в том же окне задания курса (moduli.js), прогресс общий с основным курсом (config.js: store).
   Комнаты, которые уже есть, открываются с этажа как раньше: модуль 2 - Мастерская (komnata-new.js), 3 и 5 - комнаты (komnaty.js).
   Грузится только то, что на экране: холл или один этаж. Города в памяти нет.
   Ходьба нажатием: нажал на лифт или зону этажа - камера сама подходит. Экран вертикальный или горизонтальный - всё равно.
   Подключать в shkola.html последним, после moduli.js, komnaty.js. */
(function () {
'use strict';
var T = window.THREE, K = window.VZ_KURS, I = window.VZ_KURS_INFO;
if (!T || !K || !I) { location.replace(window.PLAIN_URL || 'prosto-new.html'); return; }
var MODS = K.mods, D = document;
var COL = ['#5effc0', '#7cf3ff', '#facc15', '#9dff7c', '#ff6b86', '#b794ff', '#7cf3ff', '#ffd36e'];
function col(i) { return COL[i % COL.length]; }
function $(id) { return D.getElementById(id); }
function el(tag, cls, html, par) { var e = D.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (par) par.appendChild(e); return e; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var MOB = matchMedia('(pointer:coarse)').matches;

/* ---------- данные этажей: модуль -> теория, практика, тест ---------- */
function kindOf(tid) {
  var L = K.lib[tid]; if (!L) return 'teor';
  if (/_final$|_rep$|_as$/.test(tid)) return 'test';
  var s = L.steps.map(function (x) { return x.s; });
  if (s.indexOf('fly') >= 0 || s.indexOf('coach') >= 0) return 'prak';   /* полёт и задание на занятии */
  if (s.indexOf('game') >= 0 && s.indexOf('cards') < 0) return 'prak';   /* тренажёр без теории ("Собери дрон", "Тренажёр стиков") */
  return 'teor';
}
var ZONES = [{ k: 'teor', n: 'Теория' }, { k: 'prak', n: 'Практика' }, { k: 'test', n: 'Тест' }];
function floorTasks(m, k) { return m.tasks.filter(function (t) { return K.lib[t] && kindOf(t) === k; }); }
function zoneDone(m, k) { var a = floorTasks(m, k); return a.length && a.every(function (t) { return I.task(t) === 'done'; }); }
function roomOf(m) {
  if (window.KURS_KOMNATY && KURS_KOMNATY[m.id]) return { type: 'k', name: 'Мастерская' };
  if (window.KURS_KOMNATA && KURS_KOMNATA.has(m.id)) return { type: 'i', name: m.id === 'm5' ? 'Гоночный клуб' : m.id === 'm3' ? 'Аккумуляторная' : 'Комната модуля' };
  return null;
}
function nextFloor() { var n = I.next(); if (!n) return -1; for (var i = 0; i < MODS.length; i++) if (MODS[i].id === n.m) return i; return -1; }
function modState(i) { return I.mod(MODS[i].id); }

/* ---------- стили ---------- */
var css = el('style', null, null, D.head);
css.textContent = [
'@font-face{font-family:ShU;src:url(trenazhery/shrifty/unbounded-kir.woff2)}@font-face{font-family:ShU;src:url(trenazhery/shrifty/unbounded-lat.woff2);unicode-range:U+0000-00FF}',
'@font-face{font-family:ShM;src:url(trenazhery/shrifty/manrope-kir.woff2)}@font-face{font-family:ShM;src:url(trenazhery/shrifty/manrope-lat.woff2);unicode-range:U+0000-00FF}',
'#shC{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:manipulation;z-index:1}',
'.sh{font-family:ShM,Manrope,system-ui,sans-serif;color:#e8ecff}',
'#shTop{position:fixed;z-index:9;left:12px;right:12px;top:calc(62px + env(safe-area-inset-top,0px));max-width:560px;margin:0 auto;display:flex;align-items:center;gap:10px;background:rgba(8,10,24,.86);border:1.5px solid #2e355e;border-radius:16px;padding:9px 12px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
'#shBack{flex:none;width:40px;height:40px;border-radius:12px;border:1.5px solid #2e355e;background:#141a35;color:#e8ecff;font:700 20px ShM;cursor:pointer}',
'#shBack[hidden]{display:none}',
'#shTT{flex:1;min-width:0}#shT{font:700 15px ShU,Unbounded,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'#shDots{display:flex;gap:5px;margin-top:7px}#shDots i{flex:1;height:7px;border-radius:4px;background:#262c4c;transition:background .4s}',
'#shBot{position:fixed;z-index:6;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom,0px));max-width:560px;margin:0 auto;background:rgba(8,10,24,.9);border:1.5px solid #2e355e;border-radius:18px;padding:14px;font-size:16px;line-height:1.4;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
'.shBtn{display:block;width:100%;margin-top:10px;border:0;border-radius:13px;padding:14px;background:#5effc0;color:#06221a;font:800 15px ShU,Unbounded,sans-serif;letter-spacing:.03em;cursor:pointer}',
'.shBtn.alt{background:#141a35;color:#e8ecff;border:1.5px solid #2e355e;font:700 15px ShM}',
'.shLink{display:block;margin:10px auto 0;background:none;border:0;color:#a7acd2;font:600 14px ShM;text-decoration:underline;cursor:pointer}',
'#shLift{position:fixed;inset:0;z-index:7;display:none;background:linear-gradient(#141a35ee,#0a0c18f5);overflow:auto;padding:calc(140px + env(safe-area-inset-top,0px)) 16px 24px}',
'#shLift.on{display:block}#shLift .in{max-width:520px;margin:0 auto}',
'#shLift h2{font:800 22px ShU,Unbounded,sans-serif;margin:0 0 4px}#shLift .sub{color:#a7acd2;font-size:15px;margin-bottom:16px}',
'.shFl{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:2px solid #2e355e;border-radius:16px;padding:11px 14px;margin-bottom:10px;background:#101530;color:#e8ecff;cursor:pointer;font:inherit}',
'.shFl .n{flex:none;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 19px ShU,Unbounded,sans-serif;border:3px solid var(--c);color:var(--c)}',
'.shFl .t{flex:1;font:700 16px ShM}.shFl .s{display:block;font:600 13px ShM;color:#a7acd2;margin-top:2px}.shFl .r{flex:none;font-size:18px;color:var(--c)}',
'.shFl.done .n{background:var(--c);color:#0a0c18}.shFl.next{border-color:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 25%,transparent)}.shFl.lock{opacity:.5}',
'#shRide{position:fixed;inset:0;z-index:8;display:none;align-items:center;justify-content:center;flex-direction:column;background:#090b16}',
'#shRide.on{display:flex}#shRide b{font:800 84px ShU,Unbounded,sans-serif;color:var(--c,#5effc0);text-shadow:0 0 30px var(--c,#5effc0)}',
'#shRide .t{font:700 18px ShM;margin-top:6px}#shRide .bar{width:min(70vw,320px);height:8px;border-radius:4px;background:#262c4c;margin-top:22px;overflow:hidden}',
'#shRide .bar i{display:block;height:100%;width:0;background:var(--c,#5effc0);border-radius:4px}',
'#shTabs{display:flex;gap:6px;margin-top:9px}#shTabs button{flex:1;border:0;border-radius:10px;padding:8px 0;font:700 13px ShM;background:#1a2040;color:#a7acd2;cursor:pointer}',
'#shTabs button.d{background:#16332d;color:#5effc0}#shTabs button.a{background:var(--c);color:#0a0c18}',
'#shList{max-height:min(34vh,300px);overflow:auto;-webkit-overflow-scrolling:touch;margin:-2px -4px 0;padding:2px 4px}',
'.shTk{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:1.5px solid #2e355e;border-radius:13px;padding:10px 12px;margin-top:8px;background:#121733;color:#e8ecff;cursor:pointer;font:600 15px ShM}',
'.shTk i{flex:none;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 13px ShM;font-style:normal;border:2px solid #4a527a;color:#a7acd2}',
'.shTk.done i{background:#5effc0;border-color:#5effc0;color:#06221a}.shTk.wait i{border-color:#facc15;color:#facc15}.shTk.next{border-color:var(--c)}.shTk.lock{opacity:.5}',
'.shTk span{flex:1}.shTk small{color:#a7acd2;font-size:12px}',
'.shHint{color:#a7acd2;font-size:14px;margin-top:4px}',
'body.sh-hide #shTop,body.sh-hide #shBot,body.sh-room #shTop,body.sh-room #shBot,body.sh-room #shTap{display:none!important}',
'#shTap{position:fixed;z-index:5;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;border:3px solid #5effc0;box-shadow:0 0 0 8px rgba(94,255,192,.22);pointer-events:none;animation:shP 1.6s ease-in-out infinite;display:none}',
'@keyframes shP{0%,100%{transform:scale(.85);opacity:.6}50%{transform:scale(1.05);opacity:1}}'
].join('\n');

/* ---------- интерфейс ---------- */
var C = el('canvas'); C.id = 'shC'; D.body.insertBefore(C, D.body.firstChild);
var top = el('div', 'sh', '<button id="shBack" type="button" aria-label="Назад" hidden>←</button><div id="shTT"><div id="shT"></div><div id="shDots"></div></div>', D.body); top.id = 'shTop';
var bot = el('div', 'sh', '', D.body); bot.id = 'shBot';
var lift = el('div', 'sh', '<div class="in"><div class="sub">Выбери этаж. Этаж = модуль курса.</div><div id="shFls"></div><button class="shBtn alt" id="shLiftX" type="button">Остаться в холле</button></div>', D.body); lift.id = 'shLift';
var ride = el('div', 'sh', '<b id="shRideN">1</b><div class="t" id="shRideT"></div><div class="bar"><i id="shRideB"></i></div>', D.body); ride.id = 'shRide';
var tap = el('div', null, null, D.body); tap.id = 'shTap';
for (var i = 0; i < MODS.length; i++) el('i', null, null, $('shDots'));
function dots() { var ds = $('shDots').children, nf = nextFloor(); for (var i = 0; i < ds.length; i++) { var s = modState(i); ds[i].style.background = s === 'done' ? col(i) : i === nf ? 'rgba(255,255,255,.55)' : ''; } }

/* ---------- 3D ---------- */
var R = new T.WebGLRenderer({ canvas: C, antialias: !MOB || devicePixelRatio < 2.5, powerPreference: 'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio || 1, MOB ? 2 : 1.75)); R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = .9;
var S = null, CAM = new T.PerspectiveCamera(60, 1, .05, 400), PICK = [], need = true, tw = null, anim = [];
function mat(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .75, metalness: .05 }, o || {})); }
function glow(c, k) { return new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k == null ? 1 : k), toneMapped: false }); }
function box(w, h, d, m, x, y, z, par) { var g = new T.Mesh(new T.BoxGeometry(w, h, d), m); g.position.set(x, y, z); (par || S).add(g); return g; }
function cyl(rt, rb, h, m, x, y, z, par) { var g = new T.Mesh(new T.CylinderGeometry(rt, rb, h, 24), m); g.position.set(x, y, z); (par || S).add(g); return g; }
function texT(draw, w, h) { var c = D.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; }
function sign(lines, w, h, x, y, z, ry, o, par) { o = o || {};
  var t = texT(function (g, W, H) { g.fillStyle = o.bg || '#0b0f22'; g.fillRect(0, 0, W, H); if (o.border) { g.strokeStyle = o.border; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8); }
    g.textBaseline = 'middle'; g.textAlign = o.align || 'center';
    lines.forEach(function (l) { g.fillStyle = l.c || '#fff'; g.font = l.f || '700 60px ShU'; g.fillText(l.t, o.align === 'left' ? (l.x || 30) : W / 2, l.y != null ? l.y : H / 2); }); }, o.w || 512, o.h || 128);
  var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, y, z); m.rotation.y = ry || 0; (par || S).add(m); return m; }
function drone(x, y, z, s, c, par) { var g = new T.Group(), b = mat('#1d2233', { roughness: .5 });
  box(.5, .16, .5, b, 0, 0, 0, g); box(.3, .12, .22, mat(c, { emissive: c, emissiveIntensity: .5 }), 0, .12, 0, g);
  [[.38, .38], [-.38, .38], [.38, -.38], [-.38, -.38]].forEach(function (a) { var r = new T.Mesh(new T.TorusGeometry(.26, .05, 8, 24), mat('#2a3047')); r.rotation.x = Math.PI / 2; r.position.set(a[0], 0, a[1]); g.add(r); });
  g.position.set(x, y, z); g.scale.setScalar(s || 1); (par || S).add(g); return g; }
function gate(x, y, z, s, c, ry, par) { var g = new T.Group(); g.add(new T.Mesh(new T.TorusGeometry(1, .07, 10, 40), glow(c))); var st = new T.Mesh(new T.CylinderGeometry(.06, .06, 1.2), mat('#3a4060')); st.position.y = -1.55; g.add(st);
  g.position.set(x, y, z); g.rotation.y = ry || 0; g.scale.setScalar(s); (par || S).add(g); return g; }
function desk(x, y, z, par, ry) { var g = new T.Group(); box(1.1, .08, .6, mat('#c9d2e8'), 0, .72, 0, g); box(.06, .7, .5, mat('#59617d'), -.5, .36, 0, g); box(.06, .7, .5, mat('#59617d'), .5, .36, 0, g); box(.45, .06, .4, mat('#424a66'), 0, .45, .55, g); g.position.set(x, y, z); g.rotation.y = ry || 0; (par || S).add(g); return g; }
function spaceTex() { return texT(function (x, W, H) { var gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0a0b1f'); gr.addColorStop(.6, '#2a1d52'); gr.addColorStop(1, '#123044'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  for (var i = 0; i < 260; i++) { x.fillStyle = 'rgba(220,230,255,' + Math.random() + ')'; x.fillRect(Math.random() * W, Math.random() * H, 1.6, 1.6); }
  x.fillStyle = '#2b3557'; x.beginPath(); x.ellipse(330, 360, 120, 18, 0, 0, 7); x.fill(); x.fillStyle = '#1d1830'; x.beginPath(); x.moveTo(210, 362); x.lineTo(450, 362); x.lineTo(330, 470); x.fill();
  x.fillStyle = '#3a4670'; [[270, 300, 30, 60], [310, 270, 34, 90], [350, 290, 30, 70], [390, 315, 26, 45]].forEach(function (r) { x.fillRect(r[0], r[1], r[2], r[3]); });
  x.fillStyle = '#7cf3ff'; for (var k = 0; k < 40; k++) x.fillRect(272 + Math.random() * 140, 280 + Math.random() * 75, 4, 2); }, 512, 512); }
function newScene(bg) { if (S) S.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
  S = new T.Scene(); S.background = new T.Color(bg || '#0a0c18'); PICK = []; anim = []; need = true; }
function fit() { var w = innerWidth, h = innerHeight, a = w / h; R.setSize(w, h, false); CAM.aspect = a;
  CAM.fov = Math.min(88, 2 * Math.atan(Math.tan(32 * Math.PI / 180) / Math.min(a, 1.25)) * 180 / Math.PI); CAM.updateProjectionMatrix(); need = true; }
addEventListener('resize', fit);
/* камера: позиция + точка взгляда; переходы плавно */
var camL = new T.Vector3();
function camSet(p, l) { CAM.position.copy(p); camL.copy(l); CAM.lookAt(camL); need = true; }
function camGo(p, l, dur, done) { tw = { p0: CAM.position.clone(), l0: camL.clone(), p1: p, l1: l, t: 0, d: dur || 1.1, done: done }; need = true; }
var last = performance.now();
function loop(now) { requestAnimationFrame(loop); var dt = Math.min(.05, (now - last) / 1000); last = now;
  if (tw) { tw.t += dt / tw.d; var k = Math.min(1, tw.t), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    CAM.position.lerpVectors(tw.p0, tw.p1, e); camL.lerpVectors(tw.l0, tw.l1, e); CAM.lookAt(camL); need = true; if (k >= 1) { var f = tw.done; tw = null; if (f) f(); } }
  for (var i = 0; i < anim.length; i++) if (anim[i](dt, now / 1000)) need = true;
  if (need && S && !paused()) { R.render(S, CAM); need = false; } }
function paused() { var w = $('win'); return (w && w.classList.contains('on')) || roomOn(); }

/* нажатие по 3D: луч в предметы с userData.go */
var ray = new T.Raycaster(), ndc = new T.Vector2(), downP = null;
C.addEventListener('pointerdown', function (e) { downP = [e.clientX, e.clientY]; });
C.addEventListener('pointerup', function (e) { if (!downP || Math.hypot(e.clientX - downP[0], e.clientY - downP[1]) > 12) return; downP = null;
  ndc.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(ndc, CAM);
  var h = ray.intersectObjects(PICK, true)[0]; if (!h) return; var o = h.object; while (o && !o.userData.go) o = o.parent; if (o) o.userData.go(); });

/* ============ ХОЛЛ ============ */
var HALL = { start: [new T.Vector3(0, 1.65, 5.6), new T.Vector3(.5, 2.1, -7)], lift: [new T.Vector3(0, 1.6, -3.2), new T.Vector3(0, 1.7, -7)] };
var doors = null, boardMesh = null;
function boardTex() { var nf = nextFloor();
  return texT(function (g, W, H) { g.fillStyle = '#141c40'; g.fillRect(0, 0, W, H); g.strokeStyle = '#7cf3ff'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
    g.fillStyle = '#e8ecff'; g.font = '800 54px ShU'; g.textBaseline = 'middle'; g.fillText('МОЙ ПУТЬ', 40, 62);
    MODS.forEach(function (m, i) { var s = modState(i), y = 135 + i * (330 / Math.max(6, MODS.length));
      g.fillStyle = s === 'done' ? col(i) : i === nf ? '#fff' : '#6b7394'; g.font = '700 40px ShM';
      g.fillText((s === 'done' ? '✓ ' : i === nf ? '→ ' : '   ') + m.n + '  ' + m.t, 40, y); }); }, 620, 480); }
function hallScene() {
  newScene('#0a0c18'); var w = 16, d = 14, h = 5;
  box(w, .2, d, mat('#4a5274', { roughness: .3, metalness: .2 }), 0, -.1, 0); box(w, .2, d, mat('#262c48'), 0, h, 0);
  box(w, h, .2, mat('#363e62'), 0, h / 2, -d / 2); box(.2, h, d, mat('#30385a'), -w / 2, h / 2, 0); box(.2, h, d, mat('#30385a'), w / 2, h / 2, 0); box(w, h, .2, mat('#30385a'), 0, h / 2, d / 2);
  box(w, .1, .25, glow('#7cf3ff', .9), 0, h - .1, -d / 2 + .15);
  box(.2, .02, 8.4, glow('#5effc0', .9), 0, .01, -2);
  /* лифт */
  var lg = new T.Group(); lg.position.set(0, 0, -d / 2 + .2); S.add(lg);
  box(3.6, 3.8, .2, mat('#1a1f36'), 0, 1.9, -.12, lg);
  var dl = box(1.7, 3.6, .14, mat('#aab3cc', { metalness: .8, roughness: .25 }), -.86, 1.8, 0, lg), dr = box(1.7, 3.6, .14, mat('#aab3cc', { metalness: .8, roughness: .25 }), .86, 1.8, 0, lg);
  box(3.9, .12, .3, glow('#5effc0'), 0, 3.7, .05, lg); box(.12, 3.7, .3, glow('#5effc0'), -1.9, 1.85, .05, lg); box(.12, 3.7, .3, glow('#5effc0'), 1.9, 1.85, .05, lg);
  sign([{ t: 'ЛИФТ', f: '800 64px ShU', c: '#5effc0' }], 1.4, .35, 0, 4.15, -.05, 0, { bg: '#0a1a16' }, lg);
  doors = { l: dl, r: dr, open: 0, want: 0 };
  anim.push(function (dt) { if (Math.abs(doors.open - doors.want) < .001) return false; doors.open += Math.sign(doors.want - doors.open) * Math.min(Math.abs(doors.want - doors.open), dt * 1.4); dl.position.x = -.86 - doors.open * 1.6; dr.position.x = .86 + doors.open * 1.6; return true; });
  lg.userData.go = toLift; PICK.push(lg);
  /* панель этажей */
  var px = 3.35, pg = new T.Group(); pg.position.set(px, 0, -d / 2 + .15); S.add(pg);
  box(1.7, 2.5, .1, mat('#11152a'), 0, 1.9, 0, pg); box(1.74, 2.54, .08, glow('#5effc0', .5), 0, 1.9, -.03, pg);
  sign([{ t: 'ЭТАЖИ', f: '800 46px ShU', c: '#e8ecff' }], 1.1, .22, 0, 2.95, .06, 0, { bg: '#11152a', w: 512, h: 100 }, pg);
  var nf = nextFloor(), n = MODS.length;
  for (var i = 0; i < n; i++) { var f = n - 1 - i, yy = 2.62 - i * (1.7 / n), s = modState(f), on = s === 'done', nx = f === nf;
    var b = cyl(.11, .11, .05, glow(col(f), on ? 1 : nx ? .8 : .2), -.55, yy, .07, pg); b.rotation.x = Math.PI / 2;
    sign([{ t: (on ? '✓ ' : '') + MODS[f].n, f: '800 80px ShU', c: on || nx ? col(f) : '#59607e' }], .7, .26, .25, yy, .06, 0, { bg: '#11152a', w: 250, h: 100, align: 'left' }, pg); }
  pg.userData.go = toLift; PICK.push(pg);
  /* стойка входа */
  var rx = -4.4, rz = -2.6; box(3.4, 1.1, 1.1, mat('#aab2c8'), rx, .55, rz); box(3.5, .08, 1.2, glow('#5effc0', .8), rx, 1.12, rz);
  var me = window.SPK_ME ? SPK_ME() : null;
  sign([{ t: 'ЛЁТНАЯ ШКОЛА', f: '800 52px ShU', c: '#5effc0', y: 52 }, { t: (window.KURSY && KURSY.name) || 'Курс FPV', f: '700 44px ShM', c: '#e8ecff', y: 112 }], 1.6, .5, rx, 1.85, rz - .3, 0, { bg: '#06221a', w: 640, h: 160 });
  box(1.7, .62, .05, mat('#111'), rx, 1.85, rz - .34);
  /* мой путь */
  boardMesh = new T.Mesh(new T.PlaneGeometry(3.4, 2.6), new T.MeshBasicMaterial({ map: boardTex(), toneMapped: false })); boardMesh.position.set(6, 2.3, -d / 2 + .12); S.add(boardMesh);
  /* окно в космос с летающим городом */
  var sp = new T.Mesh(new T.PlaneGeometry(4.6, 2.2), new T.MeshBasicMaterial({ map: spaceTex() })); sp.position.set(-4.4, 3.3, -d / 2 + .12); S.add(sp);
  box(4.8, .12, .15, mat('#8c95b3'), -4.4, 4.45, -d / 2 + .15); box(4.8, .12, .15, mat('#8c95b3'), -4.4, 2.15, -d / 2 + .15);
  cyl(.35, .45, 1, mat('#d9deea'), -5.6, .5, 2.4); var dr2 = drone(-5.6, 1.2, 2.4, 1.1, '#5effc0');
  anim.push(function (dt, t) { dr2.position.y = 1.25 + Math.sin(t * 1.6) * .06; dr2.rotation.y += dt * .5; return true; });
  cyl(.35, .3, .7, mat('#5a6382'), 6.8, .35, 2.5); var bush = new T.Mesh(new T.IcosahedronGeometry(.7, 1), mat('#2f8f62', { flatShading: true })); bush.position.set(6.8, 1.2, 2.5); S.add(bush);
  S.add(new T.HemisphereLight('#dfe6ff', '#30344a', .55));
  [[-4, 4.5, 0], [4, 4.5, 0], [0, 4.5, -4], [0, 4.5, 3]].forEach(function (p) { var l = new T.PointLight('#fff', .45, 16); l.position.set(p[0], p[1], p[2]); S.add(l); });
  for (var k = -1; k <= 1; k++) box(3, .05, .4, glow('#ffffff', .9), k * 4.5, h - .12, 0);
}

/* ============ ЭТАЖ ============ */
var FL = null; /* { i, m, zone, cams } */
function practiceProps(i, g, x, z, w, d, c) {
  var id = MODS[i].id;
  if (id === 'm1') { cyl(1.3, 1.3, .04, glow(c, .5), x, .03, z, g); drone(x, .9, z, .9, c, g); box(.8, .5, .4, mat('#2b3150'), x + w / 2 - .9, .25, z - d / 2 + .6, g); }
  else if (id === 'm2') { box(2.6, .1, 1.1, mat('#a7774a'), x, .86, z, g); [[-1.2, -.45], [1.2, -.45], [-1.2, .45], [1.2, .45]].forEach(function (a) { box(.08, .84, .08, mat('#444c66'), x + a[0], .42, z + a[1], g); }); drone(x - .4, 1.02, z, 1.1, c, g); box(.35, .2, .3, mat('#2d6cdf'), x + .6, .99, z + .1, g); }
  else if (id === 'm3') { box(2.8, 1.6, .5, mat('#3a3f57'), x, .8, z - d / 2 + .45, g); for (var r = 0; r < 3; r++) for (var k = 0; k < 6; k++) box(.32, .18, .22, mat(k % 2 ? '#facc15' : '#ffb02e'), x - 1.1 + k * .44, .35 + r * .5, z - d / 2 + .55, g); box(1.6, .8, .8, mat('#2b3048'), x + .4, .4, z + .6, g); box(.6, .25, .4, glow('#7cf3ff', .8), x + .4, .95, z + .6, g); }
  else if (id === 'm4') { for (var q = 0; q < 3; q++) { box(.9, .55, .05, glow('#3ec7ff', .8), x - w / 2 + 1 + q * 1.05, 1.25, z - d / 2 + .5, g); desk(x - w / 2 + 1 + q * 1.05, 0, z - d / 2 + .9, g, Math.PI); } gate(x + w * .18, 1.5, z + .3, .55, c, 0, g); drone(x + w * .18 - .8, 1.6, z + .6, .7, c, g); }
  else if (id === 'm5') { for (var j = 0; j < 3; j++) gate(x - w / 2 + 1.3 + j * (w - 2.6) / 2, 1.25, z + (j % 2 ? -.4 : .5), .45, j === 1 ? '#ffd36e' : c, 0, g); box(w - 1.5, .02, .18, glow(c, .6), x, .02, z + .05, g); drone(x - .6, 1.1, z + .3, .6, c, g); }
  else { gate(x - 1, 1.5, z, .6, c, 0, g); gate(x + 1.2, 1.7, z - .6, .6, '#ffd36e', .4, g); drone(x, 1.4, z + .4, .7, c, g); }
}
function floorScene(i) {
  var m = MODS[i], c = col(i); newScene('#0a0c18');
  var w = 15, d = 8, h = 3.6, wt = w * .32, wp = w * .44, wx = w * .24, x1 = -w / 2 + wt, x2 = x1 + wp;
  box(w, .3, d, mat('#8a93b3'), 0, -.15, 0); box(w, .2, d, mat('#262c48'), 0, h, 0);
  box(w, h, .25, mat('#4c557a'), 0, h / 2, -d / 2); box(.25, h, d, mat('#565f85'), -w / 2, h / 2, 0); box(.25, h, d, mat('#565f85'), w / 2, h / 2, 0); box(w, h, .25, mat('#3a4266'), 0, h / 2, d / 2);
  box(.12, h * .85, d * .75, mat('#6f789c'), x1, h * .425, -d * .125); box(.12, h * .85, d * .75, mat('#6f789c'), x2, h * .425, -d * .125);
  box(w, .12, .27, glow(c, .9), 0, h - .25, -d / 2 + .02);
  /* зоны: теория, практика, тест - на каждую можно нажать */
  var zx = [-w / 2 + wt / 2, x1 + wp / 2, x2 + wx / 2], zw = [wt, wp, wx];
  ZONES.forEach(function (Z, k) { var g = new T.Group(); S.add(g); var pad = new T.Mesh(new T.PlaneGeometry(zw[k] - .4, d - .6), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .07 })); pad.rotation.x = -Math.PI / 2; pad.position.set(zx[k], .02, 0); g.add(pad);
    sign([{ t: Z.n.toUpperCase(), f: '700 64px ShU', c: c }], Math.min(2.6, zw[k] * .55), Math.min(2.6, zw[k] * .55) * .25, zx[k], 2.95, -d / 2 + .14, 0, { bg: '#121a38' });
    g.userData.go = function () { zone(Z.k); }; PICK.push(g); });
  /* теория: парты и экран */
  for (var r = 0; r < 2; r++) for (var k2 = 0; k2 < 2; k2++) desk(zx[0] - wt / 4 + k2 * (wt / 2) - .2, 0, -.1 + r * 1.3);
  box(wt * .7, 1.15, .06, glow('#24305a', .9), zx[0], 1.75, -d / 2 + .15);
  sign([{ t: m.n + '. ' + m.t, f: '700 40px ShM', c: '#e8ecff' }], wt * .62, wt * .62 * .2, zx[0], 1.75, -d / 2 + .19, 0, { bg: '#1a2450', w: 640, h: 128 });
  /* практика */
  practiceProps(i, S, zx[1], 0, wp - .4, d, c);
  /* тест: терминал и дверь */
  box(.7, 1.2, .1, mat('#30365a'), zx[2], .6, -d / 2 + .45); box(.6, .4, .04, glow(c, .9), zx[2], 1.5, -d / 2 + .48);
  box(.06, 2.6, 1.7, glow(c, .9), w / 2 - .22, 1.3, 0); box(.12, 2.4, 1.5, mat('#2a2f47'), w / 2 - .15, 1.2, 0);
  /* окно в космос */
  var sp = new T.Mesh(new T.PlaneGeometry(2.6, 1.6), new T.MeshBasicMaterial({ map: spaceTex() })); sp.position.set(-w / 2 + .14, 2, 1.6); sp.rotation.y = Math.PI / 2; S.add(sp);
  S.add(new T.HemisphereLight('#dfe6ff', '#30344a', .55));
  [zx[0], zx[1], zx[2]].forEach(function (x) { var l = new T.PointLight('#fff', .5, 9); l.position.set(x, h - .5, .5); S.add(l); });
  var cams = {}; ZONES.forEach(function (Z, k) { cams[Z.k] = [new T.Vector3(zx[k], 2.0, 3.6), new T.Vector3(zx[k], .35, -4)]; });
  cams.all = [new T.Vector3(0, 2.4, 3.75), new T.Vector3(0, .6, -4)];
  return cams;
}

/* ============ СОСТОЯНИЯ ЭКРАНА ============ */
var MODE = 'hall';
function setTop(t, back) { $('shT').textContent = t; $('shBack').hidden = !back; dots(); }
function hall(fromLift) {
  MODE = 'hall'; FL = null; lift.classList.remove('on'); hallScene(); fit();
  if (fromLift) camSet(HALL.lift[0].clone(), HALL.lift[1].clone()), camGo(HALL.start[0].clone(), HALL.start[1].clone(), 1); else camSet(HALL.start[0].clone(), HALL.start[1].clone());
  setTop('Холл', false); var nf = nextFloor(), done = MODS.filter(function (m, i) { return modState(i) === 'done'; }).length;
  bot.innerHTML = (nf < 0 ? 'Все этажи пройдены. Ты - ас!' : done ? 'Пройдено этажей: <b>' + done + ' из ' + MODS.length + '</b>. Дальше - <b style="color:' + col(nf) + '">' + esc(MODS[nf].n + ' ' + MODS[nf].t) + '</b>.' : 'Добро пожаловать в лётную школу! Учёба идёт снизу вверх: этаж за этажом.') +
    '<button class="shBtn" id="shGoLift" type="button">К ЛИФТУ</button><button class="shLink" id="shCode" type="button">Вход по коду и мой прогресс</button>';
  $('shGoLift').onclick = toLift; $('shCode').onclick = function () { openWin(null, 'Мой прогресс'); };
  showTap();
}
function showTap() { if (MODE !== 'hall' || !S) { tap.style.display = 'none'; return; } var v = new T.Vector3(0, 1.4, -6.8).project(CAM); tap.style.left = ((v.x + 1) / 2 * innerWidth) + 'px'; tap.style.top = ((1 - v.y) / 2 * innerHeight) + 'px'; tap.style.display = v.z < 1 ? 'block' : 'none'; }
function toLift() { if (MODE !== 'hall') return; MODE = 'walk'; tap.style.display = 'none'; bot.innerHTML = 'Идём к лифту...';
  camGo(HALL.lift[0].clone(), HALL.lift[1].clone(), 1.2, function () { doors.want = 1; setTimeout(function () { openLift(true); }, 500); }); }
function openLift(fwd) { MODE = 'lift'; tap.style.display = 'none'; if (fwd) push('lift'); setTop('Лифт', true); var nf = nextFloor(), h = '';
  for (var i = MODS.length - 1; i >= 0; i--) { var m = MODS[i], s = modState(i), p = Math.round(I.prog(m.id) * 100);
    var sub = s === 'done' ? 'пройден' : s === 'lock' ? 'откроет педагог' : s === 'wait' ? 'ждёт проверки педагога' : i === nf ? 'сюда дальше' + (p ? ', сделано ' + p + '%' : '') : p ? 'сделано ' + p + '%' : '';
    h += '<button type="button" class="shFl ' + (s === 'done' ? 'done ' : '') + (s === 'lock' ? 'lock ' : '') + (i === nf ? 'next' : '') + '" style="--c:' + col(i) + '" data-i="' + i + '"><span class="n">' + esc(m.n) + '</span><span class="t">' + esc(m.t) + (sub ? '<span class="s">' + sub + '</span>' : '') + '</span><span class="r">' + (s === 'done' ? '✓' : s === 'lock' ? '🔒' : '›') + '</span></button>'; }
  $('shFls').innerHTML = h; lift.classList.add('on'); lift.scrollTop = 0;
  bot.innerHTML = ''; bot.style.display = 'none'; }
$('shFls').addEventListener('click', function (e) { var b = e.target.closest('.shFl'); if (!b) return; var i = +b.dataset.i; if (modState(i) === 'lock') { toast('Этот этаж откроет педагог'); return; } goFloor(i); });
$('shLiftX').onclick = function () { back(); };
function goFloor(i) { lift.classList.remove('on'); ride.style.setProperty('--c', col(i)); $('shRideN').textContent = MODS[i].n; $('shRideT').textContent = MODS[i].t; ride.classList.add('on');
  var b = $('shRideB'); b.style.transition = 'none'; b.style.width = '0'; void b.offsetWidth; b.style.transition = 'width 1.1s ease-in-out'; b.style.width = '100%';
  setTimeout(function () { floor(i, null); setTimeout(function () { ride.classList.remove('on'); }, 150); }, 1150); }
function floor(i, z) {
  MODE = 'floor'; push('floor'); tap.style.display = 'none'; lift.classList.remove('on'); var m = MODS[i]; FL = { i: i, m: m, zone: null, cams: floorScene(i) }; fit(); bot.style.display = ''; doors = null;
  camSet(FL.cams.all[0].clone(), FL.cams.all[1].clone());
  setTop(m.n + '. ' + m.t, true); $('shT').style.color = col(i);
  zone(z || firstZone(m), true);
}
function firstZone(m) { var n = I.next(); if (n && n.m === m.id) return kindOf(n.t); for (var k = 0; k < 3; k++) if (!zoneDone(m, ZONES[k].k)) return ZONES[k].k; return 'teor'; }
function zone(k, first) { if (!FL) return; FL.zone = k; var m = FL.m, c = col(FL.i), cm = FL.cams[k]; camGo(cm[0].clone(), cm[1].clone(), first ? 1.3 : .9);
  var tabs = '<div id="shTabs">' + ZONES.map(function (Z) { var d = zoneDone(m, Z.k), n = floorTasks(m, Z.k).length; return '<button type="button" data-z="' + Z.k + '" class="' + (Z.k === k ? 'a' : d ? 'd' : '') + '" style="--c:' + c + '"' + (n ? '' : ' disabled') + '>' + (d ? '✓ ' : '') + Z.n + '</button>'; }).join('') + '</div>';
  var nt = I.next(), list = floorTasks(m, k).map(function (t, j) { var s = I.task(t), L = K.lib[t];
    return '<button type="button" class="shTk ' + s + (nt && nt.t === t ? ' next' : '') + '" style="--c:' + c + '" data-t="' + t + '"><i>' + (s === 'done' ? '✓' : s === 'wait' ? '•' : s === 'lock' ? '🔒' : j + 1) + '</i><span>' + esc(L.t) + (s === 'wait' ? '<br><small>ждёт проверки педагога</small>' : '') + '</span>›</button>'; }).join('');
  var room = k === 'prak' ? roomOf(m) : null;
  bot.innerHTML = tabs + (room ? '<button class="shBtn" id="shRoom" type="button" style="background:' + c + '">ВОЙТИ: ' + esc(room.name.toUpperCase()) + '</button><div class="shHint">Или выбери задание из списка:</div>' : '') + '<div id="shList">' + (list || '<div class="shHint">Здесь пока нет заданий.</div>') + '</div>';
  var tb = $('shTabs'); tb.onclick = function (e) { var b = e.target.closest('button'); if (b && !b.disabled) zone(b.dataset.z); };
  $('shList').onclick = function (e) { var b = e.target.closest('.shTk'); if (!b) return; var t = b.dataset.t; if (I.task(t) === 'lock') { toast('Это задание пока закрыто'); return; } openWin(t); };
  if (room) $('shRoom').onclick = function () { enterRoom(FL.i); };
}
/* назад: этаж -> лифт -> холл */
function back() { if ($('win').classList.contains('on')) { closeWin(); return; }
  if (MODE === 'floor') { $('shT').style.color = ''; hallScene(); fit(); camSet(HALL.lift[0].clone(), HALL.lift[1].clone()); doors.open = doors.want = 1; FL = null; openLift(false); return; }
  if (MODE === 'lift') { lift.classList.remove('on'); bot.style.display = ''; if (doors) doors.want = 0; hall(true); return; } }
$('shBack').onclick = function () { if (history.state && history.state.sh) history.back(); else back(); };
function push(k) { try { history.pushState({ sh: k }, ''); } catch (e) {} }
var ignorePop = false, roomShut = 0;
addEventListener('popstate', function () {
  if (ignorePop) { ignorePop = false; return; }
  if (ROOM) { exitRoom(true); return; }   /* Мастерская: "назад" телефона - выход из комнаты на этаж */
  if (roomOn() || Date.now() - roomShut < 400) return;   /* комнаты-iframe сами ловят "назад" (komnaty.js) */
  back(); });

/* ============ ОКНО ЗАДАНИЯ (moduli.js) ============ */
var win = $('win'), winTid = null, winWas = null;
function openWin(tid, title) { winTid = tid; winWas = tid ? I.task(tid) : null; var L = tid && K.lib[tid];
  $('winT').textContent = title || (L ? L.t : ''); win.classList.add('on'); var p = $('wpane'); if (p) p.scrollTop = 0;
  if (tid) I.go.task(tid); else I.go.home(); D.body.classList.add('sh-hide'); tap.style.display = 'none'; }
function closeWin() { if (!win.classList.contains('on')) return; win.classList.remove('on'); D.body.classList.remove('sh-hide'); var t = winTid, fresh = t && winWas !== 'done' && I.task(t) === 'done'; winTid = null;
  if (ROOM) { try { ROOM.back(t, fresh); } catch (e) {} return; }
  if (window.KURS_KOMNATA && KURS_KOMNATA.on) { try { KURS_KOMNATA.back(t, fresh); } catch (e) {} return; }
  if (MODE === 'floor' && FL) zone(FL.zone); else if (MODE === 'hall') hall(); need = true; if (fresh) toast('Задание пройдено!'); }
$('winX').addEventListener('click', function (e) { e.stopImmediatePropagation(); closeWin(); }, true);
var gb = $('gearB'); if (gb) gb.hidden = true; var nx = $('nxB'); if (nx) nx.hidden = true;
/* комнаты от первого лица (iframe, komnaty.js) просят окно задания */
window.KURS_OPEN_TASK = function (tid) { if (!K.lib[tid]) return false; openWin(tid); return true; };
window.KURS_KOMNATA_OUT = function () { roomShut = Date.now(); D.body.classList.remove('sh-room'); if (FL) zone(FL.zone); need = true; };

/* ============ КОМНАТЫ ============ */
var ROOM = null;
function roomOn() { return !!ROOM || !!(window.KURS_KOMNATA && KURS_KOMNATA.on); }
function enterRoom(i) { var m = MODS[i], r = roomOf(m); if (!r) return; D.body.classList.add('sh-room');
  if (r.type === 'k') { ROOM = KURS_KOMNATY[m.id];
    ROOM.open({ mid: m.id, color: col(i), name: m.n + '. ' + m.t, state: function (tid) { return I.task(tid); },
      task: function (tid) { if (I.task(tid) === 'lock') return false; openWin(tid); return true; },
      exit: function () { exitRoom(false); } });
    push('room');
  } else KURS_KOMNATA.open(m.id); }
function exitRoom(byBack) { if (!ROOM) return; var r = ROOM; ROOM = null; D.body.classList.remove('sh-room'); try { r.close(); } catch (e) {}
  if (!byBack && history.state && history.state.sh === 'room') { ignorePop = true; history.back(); }
  if (FL) zone(FL.zone); need = true; }
/* комнаты рассчитаны на горизонтальный экран телефона: в комнате просим повернуть (povorot.js), в здании - любое положение */
window.POVOROT_GAME = function () { return roomOn(); };

/* ---------- мелочи ---------- */
var tst = null; function toast(t) { var e = $('toast'); if (!e) return; e.textContent = t; e.classList.add('show'); clearTimeout(tst); tst = setTimeout(function () { e.classList.remove('show'); }, 2200); }
addEventListener('storage', function (e) { if (e.key === ((window.KURSY && KURSY.store) || 'vz_kurs')) { dots(); if (MODE === 'floor' && FL) zone(FL.zone); } });
setInterval(function () { if (MODE === 'hall') showTap(); }, 300);

/* старт: шрифты для вывесок, потом холл */
var go = function () { fit(); hall(); requestAnimationFrame(loop); var z = $('shLoad'); if (z) { z.style.opacity = '0'; setTimeout(function () { z.remove(); }, 500); } };
var fp = D.fonts && D.fonts.load ? Promise.all(['800 40px ShU', '700 40px ShM'].map(function (f) { return D.fonts.load(f, 'АБВ 123 abc'); })) : Promise.resolve();
var started = false; fp.then(function () { if (!started) { started = true; go(); } }, function () { if (!started) { started = true; go(); } });
setTimeout(function () { if (!started) { started = true; go(); } }, 2500);
window.SHKOLA = { hall: function () { hall(); }, floor: function (i, z) { floor(i, z); }, lift: function () { toLift(); }, mode: function () { return MODE; }, cam: function () { return [CAM.position.toArray(), camL.toArray(), CAM.fov]; } };
})();
