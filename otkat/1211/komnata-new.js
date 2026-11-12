/* komnata-new.js - копия komnata.js с новой графикой помещений (набор inter.js, проба 10.11.2026). Если inter.js не подключён - работает как раньше.
   Собирается из komnata.js скриптом (interier-grafika/kod/m2.py в файлах проекта).
   Движок модуля-помещения (09.11.2026): модуль курса как комната, по которой ходят от первого лица.
   Курс описывает комнату данными (модуль 2 - masterskaya.js) и кладёт её в window.KURS_KOMNATY[id_модуля] = KOMNATA.make({...}).
   Город (kosmos-kurs.js) при входе в здание такого модуля вызывает room.open(api), при закрытии окна задания - room.back(tid, свежее),
   выход в город - api.exit(). Задания открываются тем же окном, что и в городе: api.task(tid).
   Что умеет: ходьба по нажатию на пол (и WASD, Shift - бег, пробел - прыжок, E/Enter - действие, тачпад/колесо - поворот камеры), осмотр перетаскиванием, нажатие на стенд/стол/предмет - подойти и карточка внизу,
   стенды заданий с настоящим прогрессом и номером, большой монитор с теорией (голос читает слайды), стол с мини-игрой
   ("провал" в сборку через trenazhery.js), дрон-проводник и светящийся путь к следующему заданию, вход через ворота, препятствия.
   Нужен THREE r128 (общий с городом). Свои файлы курса: kartinki.js (рисунки для слайдов и плакатов). */
(function () {
'use strict';
var T = window.THREE; if (!T) return;
var FONT = '"Manrope","Segoe UI",Roboto,system-ui,sans-serif', DISP = '"Unbounded","Manrope",system-ui,sans-serif', MONO = '"JetBrains Mono",ui-monospace,Menlo,monospace';
var MOB = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700;
var RED = matchMedia('(prefers-reduced-motion:reduce)').matches;
function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

/* ---------- стили оверлея ---------- */
var css = document.createElement('style');
css.textContent = [
'#kmn{position:fixed;inset:0;z-index:9;display:none;background:#05060f;touch-action:none;user-select:none;-webkit-user-select:none}',
'#kmn.on{display:block}#kmn canvas{position:absolute;inset:0;width:100%;height:100%;display:block;transition:filter .5s}',
'body.kmn-lock #kmn::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(0,0,0,.45),0 0 10px #7cf3ff;pointer-events:none;z-index:4}',
'body.kmn-win #kmn canvas{filter:blur(3px) brightness(.62)}body.kmn-win .wbg{opacity:0!important}body.kmn-win #c{visibility:hidden}',
'#kmn .k-top{position:absolute;left:0;right:0;top:0;padding:calc(12px + env(safe-area-inset-top,0px)) max(14px,env(safe-area-inset-right,0px)) 26px max(14px,env(safe-area-inset-left,0px));display:flex;align-items:center;gap:10px;background:linear-gradient(#05060fd0,#05060f00);pointer-events:none}',
'#kmn .k-top>*{pointer-events:auto}',
'#kmn .k-vol{flex:none;width:84px;height:24px;accent-color:var(--kc);cursor:pointer}@media (max-width:420px){#kmn .k-vol{width:60px}}',
'#kmn .k-ic{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(10,14,32,.6);color:#fff;font-size:19px;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(10px)}',
'#kmn .k-ttl{flex:1;min-width:0}#kmn .k-ttl small{display:block;font:800 10.5px ' + FONT + ';letter-spacing:.18em;color:var(--kc)}#kmn .k-ttl b{display:block;font:700 16px ' + DISP + ';color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'#kmn .k-st{flex:none;padding:7px 13px;border-radius:99px;border:1px solid rgba(255,211,110,.45);background:rgba(10,14,32,.6);color:#ffd36e;font:800 14px ' + FONT + ';backdrop-filter:blur(10px)}',
'#kmn .k-card{position:absolute;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);width:min(calc(100vw - 24px),460px);padding:14px 16px 14px;border-radius:20px;border:1px solid rgba(var(--kr),.55);background:rgba(8,11,28,.88);backdrop-filter:blur(14px);box-shadow:0 0 0 1px rgba(255,255,255,.04),0 0 30px rgba(var(--kr),.25),0 20px 50px -20px #000;opacity:0;pointer-events:none;transition:opacity .3s,transform .35s cubic-bezier(.2,.8,.2,1);color:#e8ecff;font:500 14.5px/1.45 ' + FONT + '}',
'#kmn .k-card.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}',
'#kmn .k-card small{display:block;font:800 10.5px ' + FONT + ';letter-spacing:.16em;color:rgb(var(--kr));margin-bottom:3px}#kmn .k-card h3{margin:0 0 4px;font:700 18px ' + DISP + ';color:#fff}',
'#kmn .k-card p{margin:0;color:#c9d1f5}#kmn .k-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}#kmn .k-acts:empty{display:none}',
'#kmn .k-b{min-height:44px;padding:0 18px;border-radius:99px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#fff;font:800 14.5px ' + FONT + ';cursor:pointer}',
'#kmn .k-b.pri{border-color:transparent;background:linear-gradient(90deg,rgb(var(--kr)),#a78bfa);color:#12061c;box-shadow:0 0 22px rgba(var(--kr),.55)}#kmn .k-b.dis{opacity:.5}',
'#kmn .k-card.shake{animation:kshk .4s}@keyframes kshk{25%{transform:translate(calc(-50% - 8px),0)}75%{transform:translate(calc(-50% + 8px),0)}}',
'#kmn .k-hint{position:absolute;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);padding:9px 16px;border-radius:99px;background:rgba(8,11,28,.8);border:1px solid rgba(255,255,255,.14);color:#cfd6ff;font:600 13px ' + FONT + ';white-space:nowrap;max-width:calc(100vw - 24px);overflow:hidden;text-overflow:ellipsis;transition:opacity .6s;pointer-events:none}',
'#kmn .k-hello{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;opacity:0;transition:opacity .8s}#kmn .k-hello.on{opacity:1}',
'#kmn .k-hello small{display:block;font:800 13px ' + MONO + ';letter-spacing:.3em;color:var(--kc);text-shadow:0 0 14px var(--kc)}#kmn .k-hello b{display:block;margin-top:8px;font:800 clamp(30px,7vw,60px) ' + DISP + ';color:#fff;text-shadow:0 0 30px var(--kc)}#kmn .k-hello span{display:block;margin-top:6px;font:600 16px ' + FONT + ';color:#cfd6ff}',
'#kmn .k-fade{position:absolute;inset:0;background:#05060f;opacity:1;pointer-events:none;transition:opacity .9s}',
'#kmn .k-star{position:absolute;left:0;top:0;z-index:3;color:#ffd36e;font-size:30px;text-shadow:0 0 16px #ffd36e;pointer-events:none}',
'#kmn .k-toast{position:absolute;left:50%;top:calc(76px + env(safe-area-inset-top,0px));transform:translateX(-50%);padding:9px 16px;border-radius:99px;background:rgba(15,42,38,.92);border:1px solid #5effc4;color:#5effc4;font:800 14px ' + FONT + ';opacity:0;transition:opacity .4s;pointer-events:none;white-space:nowrap}#kmn .k-toast.on{opacity:1}',
'@media (max-width:600px){#kmn .k-ttl b{font-size:14px}}'
].join('\n');
document.head.appendChild(css);

/* ================================================================= */
function make(cfg) {
  var W = cfg.size[0], D = cfg.size[1], H = cfg.size[2], EYE = 1.62;
  var api = null, built = false, on = false, R, S, CAM, root, cv, ui = {}, TICK = [], CLICK = [], BOX = [], STANDS = {}, FLOOR, clock = new T.Clock();
  var MC = cfg.color || '#ff7ce0', MCr = hexRgb(MC);
  var pos = new T.Vector3(), vel = new T.Vector3(), yaw = 0, pitch = -.05, target = null, lookAt = null, sel = null, arrived = false, path = null, bob = 0;
  var anim = null; /* сценарий камеры (вход, провал в стол) */
  var paused = false, winP = false, winObs = null, K = window.VZ_KURS, I = window.VZ_KURS_INFO;
  var mod = K && K.mods.find(function (m) { return m.id === cfg.mid; });

  function hexRgb(h) { var c = new T.Color(h); return Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255); }

  /* ---------- помощники сцены ---------- */
  function tex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); if (draw) draw(x, w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; t.userData = { c: c, x: x }; return t; }
  function M(o) { var m = new T.MeshStandardMaterial(o); if (o.envMapIntensity == null) m.envMapIntensity = .45; return m; }
  function glow(col, op) { if (GX && op == null) col = new T.Color(col).multiplyScalar(1.7); return new T.MeshBasicMaterial({ color: col, toneMapped: false, transparent: op != null, opacity: op == null ? 1 : op }); }
  function box(w, h, d, m, x, y, z, g, ns) { var o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x || 0, y || 0, z || 0); if (!ns) { o.castShadow = true; o.receiveShadow = true; } (g || S).add(o); return o; }
  function cyl(rt, rb, h, m, x, y, z, g, seg) { var o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 24), m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = o.receiveShadow = true; (g || S).add(o); return o; }
  function grp(x, y, z, ry, p) { var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); g.rotation.y = ry || 0; (p || S).add(g); return g; }
  function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function wrap(x, s, X, Y, maxW, lh, maxL) { var w = String(s).split(' '), line = '', n = 0; for (var i = 0; i < w.length; i++) { var t = line ? line + ' ' + w[i] : w[i]; if (x.measureText(t).width > maxW && line) { if (maxL && ++n >= maxL) { x.fillText(line + '...', X, Y); return Y; } x.fillText(line, X, Y); Y += lh; line = w[i]; } else line = t; } if (line) x.fillText(line, X, Y); return Y; }
  /* препятствие: прямоугольник в мире (cx, cz, полуширины) с поворотом 0 или 90 градусов */
  function block(x, z, hw, hd, ry) { var s = Math.abs(Math.sin(ry || 0)) > .7; BOX.push([x, z, s ? hd : hw, s ? hw : hd]); }
  function fwd(ry, d, x, z) { return [x + Math.sin(ry) * d, z + Math.cos(ry) * d]; }
  function label(txt, sub, col, x, y, z, s) {
    var t = tex(1024, 256, function (c, w, h) { var fs = 92; c.font = '900 92px ' + DISP; while (fs > 40 && c.measureText(txt).width > w - 80) { fs -= 4; c.font = '900 ' + fs + 'px ' + DISP; }   /* длинная надпись не обрезается по краям */ c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = col; c.shadowBlur = 40; c.fillStyle = col; c.fillText(txt, w / 2, sub ? 96 : h / 2); c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillText(txt, w / 2, sub ? 96 : h / 2);
      if (sub) { c.shadowBlur = 0; c.font = '700 44px ' + FONT; c.fillStyle = '#dbe3ff'; c.fillText(sub, w / 2, 200); } });
    var sp = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false })); sp.scale.set(4 * (s || 1), 1 * (s || 1), 1); sp.position.set(x, y, z); S.add(sp); return sp;
  }
  function ring(x, z, r, col, g) { var o = new T.Mesh(new T.RingGeometry(r * .86, r, 64), glow(col, .85)); o.rotation.x = -Math.PI / 2; o.position.set(x, .014, z); (g || S).add(o);
    var o2 = new T.Mesh(new T.CircleGeometry(r * .86, 48), glow(col, .06)); o2.rotation.x = -Math.PI / 2; o2.position.set(x, .013, z); (g || S).add(o2);
    var ph = Math.random() * 6; TICK.push(function (t) { o.material.opacity = .5 + Math.sin(t * 2.2 + ph) * .3; }); return o; }

  /* рисунок курса (kartinki.js) -> картинка для canvas */
  var IMG = {}, SVGCSS = '.kk-t{fill:#cbd5ff;font:600 12px system-ui,sans-serif;text-anchor:middle}.kk-tb{fill:#fff;font:800 12px system-ui,sans-serif;text-anchor:middle}.kk-ts{fill:#cbd5ff;font:700 10px system-ui,sans-serif;text-anchor:middle}.kk-m{font-family:ui-monospace,monospace}';
  function svgImg(k, cb) {
    if (IMG[k]) { if (IMG[k].complete && IMG[k].naturalWidth) cb(IMG[k]); else IMG[k].addEventListener('load', function () { cb(IMG[k]); }); return; }
    var s = (K && K.pic && K.pic(k)) || ''; if (!s) return;
    s = s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" ').replace('class="kpic"', '').replace('>', '><style>' + SVGCSS + '</style>');
    var im = new Image(); IMG[k] = im; im.onload = function () { cb(im); }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  /* ---------- материалы ---------- */
  var mFloor, mWall, mDark, mMetal, mSteel, mWood, mMat;
  function mats() {
    var floorTx = tex(1024, 1024, function (x, w) {
      x.fillStyle = '#0a0c18'; x.fillRect(0, 0, w, w);
      for (var i = 0; i < 2600; i++) { x.fillStyle = 'rgba(255,255,255,' + (Math.random() * .025) + ')'; x.fillRect(Math.random() * w, Math.random() * w, 2, 2); }
      x.strokeStyle = 'rgba(124,243,255,.10)'; x.lineWidth = 2; for (i = 0; i <= w; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, w); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    });
    floorTx.wrapS = floorTx.wrapT = T.RepeatWrapping; floorTx.repeat.set(W / 4, D / 4);
    mFloor = M({ map: floorTx, roughness: .26, metalness: .5, envMapIntensity: .35 });
    var wallTx = tex(512, 512, function (x, w) {
      x.fillStyle = '#0f1226'; x.fillRect(0, 0, w, w); x.fillStyle = '#151a33'; for (var i = 0; i < 4; i++) x.fillRect(8 + i * 128, 8, 112, 496);
      x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 4; for (i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, w); x.stroke(); }
      x.fillStyle = 'rgba(255,255,255,.05)'; for (i = 0; i < 4; i++) for (var j = 0; j < 6; j++) { x.beginPath(); x.arc(20 + i * 128, 30 + j * 85, 3, 0, 7); x.fill(); }
    });
    wallTx.wrapS = wallTx.wrapT = T.RepeatWrapping; mWall = M({ map: wallTx, roughness: .8, metalness: .2 });
    mDark = M({ color: '#0e1224', roughness: .7, metalness: .4 }); mMetal = M({ color: '#8b93b0', roughness: .35, metalness: .85 }); mSteel = M({ color: '#2a3048', roughness: .45, metalness: .7 });
    mWood = M({ color: '#6b4a32', roughness: .6 }); mMat = M({ color: '#13532f', roughness: .9 });
  }

  /* ---------- помещение ---------- */
  var doorL, doorR, GX = null;
  function gq() { var m = /[?&]q=(high|mid|low)/.exec(location.search); if (m) return m[1]; var s = lsG('kursy_grafika'); if (s) return s; var mem = navigator.deviceMemory || 4, cpu = navigator.hardwareConcurrency || 4; return MOB ? ((mem <= 3 || cpu <= 4) ? 'low' : 'mid') : 'high'; }
  function gfit() { if (GX) GX.resize(innerWidth, innerHeight, Math.min(devicePixelRatio || 1, GX.quality === 'high' ? 2 : GX.quality === 'mid' ? 1.5 : 1.25)); }
  /* помещение в новой графике: зал, ворота, тамбур за воротами, окно на город */
  function roomG() { var gw = 3.2, gh = 3.5, lamps = [], ww = Math.min(14, D - 3), i, k;
    for (i = -1; i <= 1; i++) for (k = -1.5; k <= 1.5; k++) lamps.push([i * W / 3.2, k * D / 4.4, 1.35, 0]);
    var g = GX.room({ x0: -W / 2, z0: -D / 2, x1: W / 2, z1: D / 2, h: H, holes: { s: [[-gw / 2, gw / 2, gh]], e: cfg.window !== false ? [[-1 - ww / 2, -1 + ww / 2, H - 1.0, H - 3.3]] : [] }, lamps: lamps, walls: { n: GX.S.feature } });
    g.traverse(function (m) { if (m.userData.floor) FLOOR = m; });
    if (cfg.window !== false) GX.window({ axis: 'z', c: W / 2, a0: -1 - ww / 2, a1: -1 + ww / 2, y0: H - 3.3, y1: H - 1.0, out: 1 });
    GX.room({ x0: -gw / 2, z0: D / 2 + .24, x1: gw / 2, z1: D / 2 + 3.4, h: gh + .1, holes: { n: [[-gw / 2, gw / 2, gh]] }, lamps: [[0, D / 2 + 1.8, .8, 0]] });
    var dg = GX.door({ x: 0, z: D / 2 + .12, axis: 'x', w: gw, h: gh, th: .24, auto: false, face: -1 });
    /* старый код двигает створки по position.x (0.8 закрыто .. 2.4 открыто) - переводим в долю открытия */
    var dx = .8; doorR = { position: { get x() { return dx; }, set x(v) { dx = v; dg.userData.setK((v - .8) / 1.6); } } }; doorL = { position: { x: -.8 } };
    block(0, -D / 2 - 1, W, 1); block(0, D / 2 + 1, W, 1); block(-W / 2 - 1, 0, 1, D); block(W / 2 + 1, 0, 1, D);
    var la = [1e9, 1e9]; TICK.push(function () { var lx = Math.round(pos.x / 2) * 2, lz = Math.round(pos.z / 2) * 2; if (lx !== la[0] || lz !== la[1]) { la = [lx, lz]; GX.lightRoom(lx, lz, H, 9); } });
    if (GX.quality !== 'low' && !RED) { var n = 160, g2 = new T.BufferGeometry(), P = new Float32Array(n * 3); for (i = 0; i < n; i++) { P[i * 3] = (Math.random() - .5) * W; P[i * 3 + 1] = Math.random() * H; P[i * 3 + 2] = (Math.random() - .5) * D; }
      g2.setAttribute('position', new T.BufferAttribute(P, 3)); var dust = new T.Points(g2, new T.PointsMaterial({ color: '#ffffff', size: .025, transparent: true, opacity: .35, depthWrite: false })); S.add(dust);
      TICK.push(function (t, dt) { for (var j = 0; j < n; j++) { P[j * 3 + 1] += dt * .05; if (P[j * 3 + 1] > H) P[j * 3 + 1] = 0; } g2.attributes.position.needsUpdate = true; }); }
  }
  function adoptG() { if (!GX) return; S.children.slice().forEach(function (o) { if (o === GX.world || o === GX.mirrorGroup || o.isLight || o.isPoints || o.isSprite) return; GX.adopt(o); }); }
  function room() {
    if (GX) return roomG();
    var f = new T.Mesh(new T.PlaneGeometry(W, D), mFloor); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; S.add(f); FLOOR = f;
    var c = new T.Mesh(new T.PlaneGeometry(W, D), mDark); c.rotation.x = Math.PI / 2; c.position.y = H; S.add(c);
    function wall(w, h, x, y, z, ry, rx) { var t = mWall.map.clone(); t.needsUpdate = true; t.repeat.set(w / 3.4, h / 3.9); var m = mWall.clone(); m.map = t; var o = new T.Mesh(new T.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.y = ry; o.receiveShadow = true; S.add(o); return o; }
    wall(D, H, -W / 2, H / 2, 0, Math.PI / 2); wall(D, H, W / 2, H / 2, 0, -Math.PI / 2); wall(W, H, 0, H / 2, -D / 2, 0);
    /* ближняя стена с воротами (3 x 3.4 м) */
    var gw = 3.2, gh = 3.5, side = (W - gw) / 2;
    wall(side, H, -W / 2 + side / 2, H / 2, D / 2, Math.PI); wall(side, H, W / 2 - side / 2, H / 2, D / 2, Math.PI); wall(gw, H - gh, 0, gh + (H - gh) / 2, D / 2, Math.PI);
    box(gw + .5, .3, .4, mSteel, 0, gh + .15, D / 2); box(.25, gh, .4, mSteel, -gw / 2 - .12, gh / 2, D / 2); box(.25, gh, .4, mSteel, gw / 2 + .12, gh / 2, D / 2);
    box(gw + .6, .05, .05, glow(MC), 0, gh + .32, D / 2 - .2, null, 1);
    var dm = M({ color: '#1b2140', roughness: .4, metalness: .6 });
    doorL = box(gw / 2, gh, .12, dm, -gw / 4, gh / 2, D / 2 + .1); doorR = box(gw / 2, gh, .12, dm, gw / 4, gh / 2, D / 2 + .1);
    [doorL, doorR].forEach(function (d, i) { var s = box(.05, gh * .8, .02, glow(MC), i ? -gw / 4 + .12 : gw / 4 - .12, 0, .07, d, 1); });
    /* снаружи ворот - коридор в космос (виден при входе) */
    var cor = new T.Mesh(new T.PlaneGeometry(gw, gh), new T.MeshBasicMaterial({ color: '#0b0e22' })); cor.position.set(0, gh / 2, D / 2 + 3); cor.rotation.y = Math.PI; S.add(cor);
    box(gw, .05, 3, mDark, 0, 0, D / 2 + 1.5); box(.1, gh, 3, mDark, -gw / 2, gh / 2, D / 2 + 1.5); box(.1, gh, 3, mDark, gw / 2, gh / 2, D / 2 + 1.5); box(gw, .1, 3, mDark, 0, gh, D / 2 + 1.5);
    [-1, 1].forEach(function (k) { box(.03, .04, 3, glow(MC), k * (gw / 2 - .06), .1, D / 2 + 1.5, null, 1); box(.03, .04, 3, glow('#7cf3ff'), k * (gw / 2 - .06), gh - .1, D / 2 + 1.5, null, 1); });
    /* окно в космос на правой стене */
    if (cfg.window !== false) {
      var starTx = tex(2048, 512, function (x, w, h) {
        var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#02030a'); g.addColorStop(1, '#0a0620'); x.fillStyle = g; x.fillRect(0, 0, w, h);
        var n = x.createRadialGradient(w * .7, h * .45, 10, w * .7, h * .45, h * .9); n.addColorStop(0, 'rgba(255,124,224,.30)'); n.addColorStop(.5, 'rgba(124,90,255,.12)'); n.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = n; x.fillRect(0, 0, w, h);
        for (var i = 0; i < 1400; i++) { var r = Math.random(); x.fillStyle = 'rgba(255,255,255,' + (.3 + r * .7) + ')'; x.fillRect(Math.random() * w, Math.random() * h, r > .97 ? 3 : 1.5, r > .97 ? 3 : 1.5); }
        x.fillStyle = '#ffb3e8'; x.beginPath(); x.arc(w * .22, h * .35, 26, 0, 7); x.fill();
      });
      starTx.wrapS = T.RepeatWrapping;
      var ww = Math.min(14, D - 3), win = new T.Mesh(new T.PlaneGeometry(ww, 2.2), new T.MeshBasicMaterial({ map: starTx, toneMapped: false })); win.position.set(W / 2 - .03, H - 2.1, -1); win.rotation.y = -Math.PI / 2; S.add(win);
      for (var i = 0; i <= 7; i++) box(.12, 2.4, .14, mSteel, W / 2 - .08, H - 2.1, -1 - ww / 2 + i * ww / 7);
      box(.16, .14, ww + .2, mSteel, W / 2 - .08, H - .95, -1); box(.16, .14, ww + .2, mSteel, W / 2 - .08, H - 3.25, -1);
      TICK.push(function (t) { starTx.offset.x = t * .004; });
    }
    /* подсветка по низу и под потолком */
    [[W, 0, -D / 2 + .02, 0], [D, -W / 2 + .02, 0, Math.PI / 2], [D, W / 2 - .02, 0, Math.PI / 2]].forEach(function (s) { var o = box(s[0], .05, .04, glow(MC), s[1], .12, s[2], null, 1); o.rotation.y = s[3]; });
    [[W, 0, -D / 2 + .02, 0], [D, -W / 2 + .02, 0, Math.PI / 2]].forEach(function (s) { var o = box(s[0], .04, .04, glow('#7cf3ff'), s[1], H - .5, s[2], null, 1); o.rotation.y = s[3]; });
    /* потолок: фермы и световые панели */
    for (i = -2; i <= 2; i++) { var z = i * D / 5; box(W, .3, .3, mSteel, 0, H - .25, z); for (var k = -6; k <= 6; k++) { var d = box(.06, .42, .06, mSteel, k * W / 12, H - .48, z, null, 1); d.rotation.z = (k % 2 ? 1 : -1) * .7; } }
    for (i = -2; i <= 1; i++) for (k = -1; k <= 1; k++) box(3.4, .06, .5, glow('#cfd8ff'), k * W / 3.4, H - .3, i * D / 5 + D / 10, null, 1);
    /* свет */
    S.add(new T.HemisphereLight('#8090ff', '#140a26', .38));
    var key = new T.DirectionalLight('#fff4e8', .85); key.position.set(6, 14, 8); key.castShadow = true; key.shadow.mapSize.set(MOB ? 1024 : 2048, MOB ? 1024 : 2048);
    var sc = key.shadow.camera; sc.left = -W / 2 - 2; sc.right = W / 2 + 2; sc.top = D / 2 + 2; sc.bottom = -D / 2 - 2; sc.far = 40; key.shadow.bias = -.0005; S.add(key);
    [[-W / 3.4, -D / 5], [W / 3.4, -D / 5], [0, D / 4]].forEach(function (p) { var l = new T.PointLight('#c7d2ff', .45, 16, 2); l.position.set(p[0], H - .6, p[1]); S.add(l); });
    block(0, -D / 2 - 1, W, 1); block(0, D / 2 + 1, W, 1); block(-W / 2 - 1, 0, 1, D); block(W / 2 + 1, 0, 1, D);
    /* пылинки в свете */
    if (!MOB) { var n = 260, g2 = new T.BufferGeometry(), P = new Float32Array(n * 3); for (i = 0; i < n; i++) { P[i * 3] = (Math.random() - .5) * W; P[i * 3 + 1] = Math.random() * H; P[i * 3 + 2] = (Math.random() - .5) * D; }
      g2.setAttribute('position', new T.BufferAttribute(P, 3)); var dust = new T.Points(g2, new T.PointsMaterial({ color: '#cfd8ff', size: .03, transparent: true, opacity: .45, depthWrite: false })); S.add(dust);
      TICK.push(function (t, dt) { for (var j = 0; j < n; j++) { P[j * 3 + 1] += dt * .05; if (P[j * 3 + 1] > H) P[j * 3 + 1] = 0; P[j * 3] += Math.sin(t * .3 + j) * dt * .02; } g2.attributes.position.needsUpdate = true; }); }
  }

  /* ---------- модель квадрокоптера ---------- */
  function droneWallP(o) { var g = grp(o.x, 0, o.z, o.ry), fr = M({ color: '#15171d', roughness: .45, metalness: .5 }), shots = [], lab = o.labels || ['75 мм', '3 дюйма', '5 дюймов'];
    ['vup', 'tri', 'five'].forEach(function (k, i) { var x = (i - 1) * 1.5; box(1.38, 1.06, .05, fr, x, 2.72, 0, g);
      var rt = new T.WebGLRenderTarget(1024, 1024); rt.texture.encoding = T.sRGBEncoding; rt.texture.generateMipmaps = true; rt.texture.minFilter = T.LinearMipmapLinearFilter; rt.texture.anisotropy = 8;
      var p = new T.Mesh(new T.PlaneGeometry(1.28, .96), new T.MeshBasicMaterial({ map: rt.texture, toneMapped: false })); p.position.set(x, 2.72, .03); g.add(p); shots.push([k, rt]);
      var t = tex(512, 96, function (c) { c.fillStyle = '#15171d'; c.fillRect(0, 8, 512, 80); c.fillStyle = '#f2f4fa'; c.font = '800 40px ' + FONT; c.textAlign = 'center'; c.fillText(lab[i] || '', 256, 62); });
      var lp = new T.Mesh(new T.PlaneGeometry(1.3, .244), new T.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); lp.position.set(x, 2.04, .03); g.add(lp); });
    setTimeout(function () { try { var st = new T.Scene(); st.background = new T.Color('#9aa3b3').convertSRGBToLinear();
      st.add(new T.HemisphereLight(0xffffff, 0x9aa0ad, .95)); var dl = new T.DirectionalLight(0xffffff, 1.7); dl.position.set(18, 40, 26); st.add(dl); var d2 = new T.DirectionalLight(0xbfd4ff, .5); d2.position.set(-30, 12, -10); st.add(d2);
      var sh = new T.Mesh(new T.CircleGeometry(13, 48), new T.MeshBasicMaterial({ map: tex(256, 256, function (c) { var q = c.createRadialGradient(128, 128, 10, 128, 128, 128); q.addColorStop(0, 'rgba(40,46,60,.55)'); q.addColorStop(1, 'rgba(40,46,60,0)'); c.fillStyle = q; c.fillRect(0, 0, 256, 256); }), transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = -.4; st.add(sh);
      var cm = new T.PerspectiveCamera(30, 4 / 3, 1, 300); cm.position.set(13.5, 12.5, 19); cm.lookAt(0, 1.9, 0);
      var old = R.getRenderTarget(), sc = R.shadowMap.enabled; R.shadowMap.enabled = false;
      shots.forEach(function (q) { var d = window.SBDron(q[0]); d.rotation.y = .25; st.add(d); R.setRenderTarget(q[1]); R.clear(); R.render(st, cm); st.remove(d); });
      R.setRenderTarget(old); R.shadowMap.enabled = sc; } catch (e) {} }, 60);
    return g; }
  function quad(s, col) {
    var g = new T.Group(), arm = M({ color: '#16181e', roughness: .4, metalness: .3 });
    [Math.PI / 4, -Math.PI / 4].forEach(function (a) { var b = box(1.3 * s, .03 * s, .14 * s, arm, 0, 0, 0, g); b.rotation.y = a; });
    box(.34 * s, .05 * s, .34 * s, arm, 0, .02 * s, 0, g); box(.26 * s, .12 * s, .3 * s, M({ color: col || '#333a52', roughness: .5 }), 0, .1 * s, 0, g);
    var props = [];
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (p, i) { var x = p[0] * .46 * s, z = p[1] * .46 * s;
      cyl(.07 * s, .07 * s, .09 * s, M({ color: '#a855f7', roughness: .3, metalness: .6 }), x, .06 * s, z, g);
      var pr = new T.Mesh(new T.BoxGeometry(.62 * s, .006 * s, .06 * s), M({ color: i % 3 ? '#38bdf8' : '#ff7ce0', transparent: true, opacity: .85 })); pr.position.set(x, .12 * s, z); g.add(pr); props.push([pr, i % 3 ? 1 : -1]); });
    g.userData.props = props; g.userData.spin = function (k) { props.forEach(function (p) { p[0].rotation.y += k * p[1]; }); }; return g;
  }

  /* ---------- стенды заданий ---------- */
  var STC = { done: '#9dff7c', now: '#ffd36e', open: '#7cf3ff', wait: '#facc15', lock: '#64748b' };
  function stState(tid) { var s = api ? api.state(tid) : 'lock'; if (s === 'open' && NEXT === tid) return 'now'; return s; }
  var NEXT = null;
  function drawStand(st) {
    var x = st.tx.userData.x, w = 768, h = 480, L = K.lib[st.tid], s = stState(st.tid), col = STC[s];
    x.clearRect(0, 0, w, h); x.fillStyle = '#060a18'; x.fillRect(0, 0, w, h);
    var g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(' + MCr + ',.18)'); g.addColorStop(1, 'rgba(124,243,255,.10)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = s === 'lock' ? '#334155' : MC; x.fillRect(0, 0, w, 74); x.fillStyle = s === 'lock' ? '#cbd5e1' : '#14051f'; x.font = '900 40px ' + MONO; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText('ЗАДАНИЕ ' + st.n, 30, 39);
    x.textAlign = 'right'; x.font = '900 40px ' + FONT; x.fillText(s === 'done' ? '✓' : s === 'lock' ? '🔒' : s === 'wait' ? '⏳' : '▶', w - 30, 40); x.textAlign = 'left';
    x.fillStyle = s === 'lock' ? '#94a3b8' : '#fff'; x.font = '800 54px ' + FONT; x.textBaseline = 'top'; var y = wrap(x, L.t, 30, 104, w - 60, 62, 3);
    x.fillStyle = '#b9c3ef'; x.font = '600 30px ' + FONT; wrap(x, L.sub || '', 30, y + 76, w - 60, 38, 2);
    x.fillStyle = col; rr(x, 30, h - 84, 300, 52, 26); x.fill(); x.fillStyle = '#0b1020'; x.font = '800 28px ' + FONT; x.textBaseline = 'middle';
    x.fillText(s === 'done' ? 'Пройдено' : s === 'now' ? 'Сейчас - начни' : s === 'wait' ? 'Ждёт тренера' : s === 'open' ? 'Открыто' : 'Откроется позже', 52, h - 57);
    x.fillStyle = 'rgba(255,255,255,.75)'; x.font = '800 26px ' + FONT; x.textAlign = 'right'; x.fillText('⭐ ' + L.pts, w - 30, h - 57); x.textAlign = 'left';
    x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 1; for (var i = 0; i < h; i += 4) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    st.tx.needsUpdate = true; st.bulb.material.color.set(col); st.ring.material.color.set(col); st.ring2.material.color.set(col); st.edge.material.color.set(s === 'lock' ? '#334155' : MC); st.s = s;
  }
  function stand(o) {
    var tid = o.task, n = mod.tasks.indexOf(tid) + 1, g = grp(o.x, 0, o.z, o.ry || 0);
    box(1.5, .1, .8, mSteel, 0, .05, 0, g); box(.14, 1.2, .14, mMetal, -.5, .65, 0, g); box(.14, 1.2, .14, mMetal, .5, .65, 0, g);
    var fr = grp(0, 1.65, 0, 0, g); fr.rotation.x = -.18; box(1.86, 1.2, .1, mDark, 0, 0, 0, fr);
    var tx = tex(768, 480), sc = new T.Mesh(new T.PlaneGeometry(1.7, 1.06), new T.MeshBasicMaterial({ map: tx, toneMapped: false })); sc.position.z = .056; fr.add(sc);
    var edge = box(1.92, 1.26, .04, glow(MC), 0, 0, -.04, fr, 1);
    box(.04, .5, .04, mMetal, 0, .85, 0, fr); var bulb = new T.Mesh(new T.SphereGeometry(.07, 16, 12), glow('#fff')); bulb.position.set(0, 1.13, 0); fr.add(bulb);
    var num = label(String(n), '', MC, 0, 0, 0, .5); num.position.set(0, 3.25, 0); g.add(num); S.remove(num); g.add(num); num.position.set(0, 3.2, 0);
    var rg = new T.Mesh(new T.RingGeometry(.6, .7, 64), glow('#fff', .85)); rg.rotation.x = -Math.PI / 2; rg.position.set(0, .014, .95); g.add(rg);
    var rg2 = new T.Mesh(new T.CircleGeometry(.6, 48), glow('#fff', .06)); rg2.rotation.x = -Math.PI / 2; rg2.position.set(0, .013, .95); g.add(rg2);
    var st = STANDS[tid] = { tid: tid, n: n, g: g, tx: tx, bulb: bulb, ring: rg, ring2: rg2, edge: edge, s: 'lock' };
    TICK.push(function (t) { var now = st.s === 'now'; rg.material.opacity = now ? .55 + Math.sin(t * 4) * .4 : .55; bulb.visible = !now || Math.sin(t * 7) > -.4; var k = now ? 1 + Math.sin(t * 4) * .06 : 1; rg.scale.set(k, k, 1); });
    var at = fwd(o.ry || 0, 2.3, o.x, o.z); block(o.x, o.z, .8, .45, o.ry);
    CLICK.push({ o: g, kind: 'stand', tid: tid, at: at, look: [o.x, 1.55, o.z] });
  }

  /* ---------- большой монитор с теорией ---------- */
  var MON = null;
  function monitor(o) {
    var w = o.w, h = o.h, g = grp(o.x, o.y, o.z, o.ry || 0); box(w + .3, h + .3, .2, mDark, 0, 0, -.1, g); box(w + .36, h + .36, .05, glow(MC), 0, 0, -.2, g, 1);
    var cw = 1600, ch = Math.round(1600 * h / w), tx = tex(cw, ch), cx = tx.userData.x;
    var sc = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx, toneMapped: false })); sc.position.z = .01; g.add(sc);
    var pl = new T.PointLight(MC, .55, 10, 2); pl.position.set(0, 0, 1.6); g.add(pl);
    var list = o.slides;
    MON = { k: 0, t0: 0, a: 1, list: list, talk: false, said: -1, g: g,
      draw: function (a) {
        var s = list[MON.k], i = MON.k; cx.globalAlpha = 1; cx.fillStyle = '#050816'; cx.fillRect(0, 0, cw, ch);
        var gr = cx.createRadialGradient(cw * .2, ch * .1, 10, cw * .2, ch * .1, cw * .9); gr.addColorStop(0, 'rgba(' + MCr + ',.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, cw, ch);
        cx.globalAlpha = a; cx.textAlign = 'left';
        cx.fillStyle = MC; cx.font = '800 30px ' + MONO; cx.textBaseline = 'top'; cx.fillText((o.tag || 'ТЕОРИЯ') + ' · ' + (i + 1) + '/' + list.length, 60, 46);
        cx.fillStyle = '#fff'; cx.font = '800 72px ' + DISP; var y = wrap(cx, s.h, 60, 104, cw * .5, 84, 3);
        cx.fillStyle = '#cfd7ff'; cx.font = '600 40px ' + FONT; wrap(cx, s.p, 60, Math.max(ch * .48, y + 110), cw * .45, 54, 6);
        if (s.pic) svgImg(s.pic, function (im) { if (list[MON.k] !== s) return; cx.globalAlpha = a; var iw = cw * .44, ih = iw * 420 / 720; cx.drawImage(im, cw * .53, (ch - ih) / 2 + 10, iw, ih); tx.needsUpdate = true; });
        cx.globalAlpha = 1; for (var j = 0; j < list.length; j++) { cx.fillStyle = j === i ? MC : 'rgba(255,255,255,.18)'; cx.fillRect(60 + j * 64, ch - 54, 52, 8); }
        if (MON.talk) { cx.fillStyle = MC; for (j = 0; j < 5; j++) { var hh = 10 + Math.abs(Math.sin(Date.now() / 160 + j)) * 26; cx.fillRect(cw - 110 + j * 14, ch - 46 - hh, 8, hh); } }
        cx.strokeStyle = 'rgba(255,255,255,.035)'; cx.lineWidth = 1; for (j = 0; j < ch; j += 4) { cx.beginPath(); cx.moveTo(0, j); cx.lineTo(cw, j); cx.stroke(); }
        tx.needsUpdate = true;
      },
      go: function (k) { MON.k = (k + list.length) % list.length; MON.t0 = 0; MON.a = .1; MON.said = -1; if (window.GOLOS && MON.talk) { MON.talk = false; GOLOS.stop(); } }
    };
    MON.draw(1);
    var at = fwd(o.ry || 0, Math.max(5, w * .75), o.x, o.z);
    CLICK.push({ o: g, kind: 'mon', at: at, look: [o.x, o.y - .2, o.z] });
  }
  /* монитор: листает сам, голос читает слайд, если ученик рядом и голос включён */
  function monTick(t, dt) {
    if (!MON) return;
    if (MON.a < 1) { MON.a = Math.min(1, MON.a + dt * 2); MON.draw(MON.a); }
    else if (MON.talk && Math.floor(t * 6) !== MON.tb) { MON.tb = Math.floor(t * 6); MON.draw(1); }
    var G = window.GOLOS, near = pos.distanceTo(MON.g.position) < 11 && !paused && !anim, can = G && G.on && G.can && G.can();
    if (can && near && MON.said !== MON.k && !SPEAK) { var s = MON.list[MON.k]; MON.said = MON.k; MON.talk = true; G.say(s.say || (s.h + '. ' + s.p), { onend: function () { MON.talk = false; MON.draw(1); setTimeout(function () { if (on && !paused && MON.said === MON.k) MON.go(MON.k + 1); }, 1800); } }); return; }
    if (!MON.talk) { MON.t0 += dt; if (MON.t0 > (can && near ? 30 : 9)) MON.go(MON.k + 1); }
  }
  var SPEAK = false; /* приветствие говорит - монитор ждёт */

  /* ---------- стол с мини-игрой ---------- */
  var PROBA = /\/(new|g)\.html$/.test(location.pathname);   /* правки 11.11 сначала в пробе курса */
  var TABLE = null;
  function table(o) {
    var g = grp(o.x, 0, o.z, o.ry || 0);
    var SBT = null; if (PROBA && window.SBStol) try { SBT = window.SBStol(); } catch (e) { SBT = null; }
    if (SBT) { SBT.scale.setScalar(.02); SBT.position.y = .95; g.add(SBT);
      [[-1.4, -.6], [1.4, -.6], [-1.4, .6], [1.4, .6]].forEach(function (p) { box(.09, .9, .09, mSteel, p[0], .45, p[1], g); }); box(2.8, .05, 1.2, mSteel, 0, .25, 0, g);
    } else {
    box(3.4, .1, 1.6, mWood, 0, .92, 0, g); box(3.2, .02, 1.4, mMat, 0, .98, 0, g);
    [[-1.55, -.7], [1.55, -.7], [-1.55, .7], [1.55, .7]].forEach(function (p) { box(.1, .9, .1, mSteel, p[0], .45, p[1], g); });
    box(3.2, .06, 1.4, mSteel, 0, .25, 0, g);
    var q = quad(1.1); q.position.set(0, 1.0, 0); g.add(q); q.userData.props.forEach(function (p) { p[0].visible = false; });
    for (var i = 0; i < 4; i++) cyl(.07, .07, .09, M({ color: '#a855f7', metalness: .6, roughness: .3 }), -1.25 + i * .2, 1.04, .45, g);
    box(.36, .02, .36, M({ color: '#0f5132', roughness: .6 }), .9, 1.0, .35, g); box(.12, .03, .12, M({ color: '#111' }), .9, 1.02, .35, g);
    box(.3, .02, .3, M({ color: '#1e3a8a', roughness: .6 }), 1.25, 1.0, -.1, g);
    box(.1, .1, .1, M({ color: '#222' }), -1.1, 1.04, -.35, g);
    box(.5, .28, .36, M({ color: '#1f2433', roughness: .5 }), 1.25, 1.12, -.5, g);
    var dsp = new T.Mesh(new T.PlaneGeometry(.3, .12), new T.MeshBasicMaterial({ map: tex(256, 100, function (c) { c.fillStyle = '#100'; c.fillRect(0, 0, 256, 100); c.fillStyle = '#ff5a3c'; c.font = '900 72px ' + MONO; c.fillText('330°', 20, 78); }), toneMapped: false })); dsp.position.set(1.25, 1.14, -.315); g.add(dsp);
    /* паяльник в подставке и дымок */
    var iron = cyl(.015, .015, .5, mMetal, 1.0, 1.25, -.5, g); iron.rotation.z = .6;
    var smoke = []; for (i = 0; i < 6; i++) { var sp = new T.Sprite(new T.SpriteMaterial({ map: SMOKE(), transparent: true, opacity: 0, depthWrite: false })); sp.scale.set(.15, .15, 1); g.add(sp); smoke.push(sp); }
    TICK.push(function (t) { smoke.forEach(function (s, j) { var u = (t * .35 + j / 6) % 1; s.position.set(.82 + Math.sin(u * 6 + j) * .04, 1.1 + u * .7, -.5); s.material.opacity = Math.sin(u * Math.PI) * .25; var k = .1 + u * .25; s.scale.set(k, k, 1); }); });
    /* лампа */
    box(.05, .9, .05, mMetal, -1.5, 1.4, -.6, g); box(.05, .05, .9, mMetal, -1.5, 1.85, -.2, g); cyl(.18, .1, .16, mDark, -1.5, 1.78, .22, g);
    var bl = new T.Mesh(new T.CircleGeometry(.16, 24), glow('#fff6dc')); bl.rotation.x = Math.PI / 2; bl.position.set(-1.5, 1.69, .22); g.add(bl);
    var sl = new T.SpotLight('#fff1d6', 1.5, 5, .7, .5, 1.5); sl.position.set(-1.5, 1.7, .22); sl.target.position.set(0, 1, 0); g.add(sl); g.add(sl.target);
    }
    /* голограмма */
    var holo = quad(.55, MC); holo.position.set(0, SBT ? 2.25 : 1.72, 0); var holoY = holo.position.y; holo.traverse(function (m) { if (m.material) m.material = new T.MeshBasicMaterial({ color: '#7cf3ff', wireframe: true, transparent: true, opacity: .55, toneMapped: false }); }); g.add(holo);
    var cone = new T.Mesh(new T.ConeGeometry(.5, .6, 32, 1, true), glow('#7cf3ff', .08)); cone.position.set(0, 1.36, 0); cone.visible = !SBT; cone.rotation.x = Math.PI; g.add(cone);
    TICK.push(function (t) { holo.rotation.y = t * .6; holo.position.y = holoY + Math.sin(t * 1.6) * .04; });
    ring(0, 0, 2.4, '#7cf3ff', g);
    var n = mod.tasks.indexOf(o.task) + 1;
    var ptx = tex(1024, 192, function (c, w, h) { c.fillStyle = '#060a18'; c.fillRect(0, 0, w, h); c.fillStyle = MC; c.fillRect(0, 0, 14, h); c.fillRect(w - 14, 0, 14, h);
      c.textBaseline = 'middle'; c.font = '900 76px ' + DISP; c.fillStyle = '#7cf3ff'; c.shadowColor = '#7cf3ff'; c.shadowBlur = 24; c.fillText(o.title || 'СОБЕРИ ДРОН', 48, 74);
      c.shadowBlur = 0; c.font = '700 38px ' + FONT; c.fillStyle = '#cfd7ff'; c.fillText('задание ' + n + ' · нажми на стол', 50, 150); c.font = '900 110px ' + FONT; c.textAlign = 'right'; c.fillText('🛠', w - 40, 100); });
    var pan = new T.Mesh(new T.PlaneGeometry(2.6, .49), new T.MeshBasicMaterial({ map: ptx, toneMapped: false })); pan.position.set(0, .6, SBT ? .735 : .81); g.add(pan);
    box(2.7, .58, .04, mDark, 0, .6, SBT ? .705 : .78, g);
    block(o.x, o.z, 1.8, .9, o.ry);
    var at = fwd(o.ry || 0, 2.0, o.x, o.z);
    TABLE = { o: o, g: g, n: n, center: new T.Vector3(o.x, 1.0, o.z) };
    CLICK.push({ o: g, kind: 'table', tid: o.task, at: at, look: [o.x, 1.0, o.z] });
  }
  var smokeTx = null;
  function SMOKE() { return smokeTx || (smokeTx = tex(64, 64, function (c) { var g = c.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); })); }

  /* ---------- декорации ---------- */
  var DECOR = {
    shelf: function (o) { var g = grp(o.x, 0, o.z, o.ry), cols = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
      [-1, 1].forEach(function (s) { box(.08, 3.2, .6, mSteel, s * 1.5, 1.6, 0, g); });
      for (var i = 0; i < 5; i++) { box(3.1, .05, .6, mSteel, 0, .3 + i * .7, 0, g); for (var j = 0; j < 5; j++) { box(.48, .3, .45, M({ color: cols[(i + j * 2) % cols.length], roughness: .55 }), -1.15 + j * .58, .48 + i * .7, .02, g); box(.3, .06, .01, M({ color: '#fff', roughness: .9 }), -1.15 + j * .58, .5 + i * .7, .25, g); } }
      block(o.x, o.z, 1.6, .4, o.ry); return g; },
    droneWall: function (o) { if (PROBA && window.SBDron) return droneWallP(o); var g = grp(o.x, 0, o.z, o.ry), pb = M({ color: '#141829', roughness: .85 }); box(4.4, 2.4, .05, mSteel, 0, 2.6, -.02, g); box(4.2, 2.2, .06, pb, 0, 2.6, 0, g); box(4.4, .04, .04, glow(MC), 0, 3.8, .04, g, 1);
      ['#ea580c', '#7cf3ff', '#ffd36e'].forEach(function (c, i) { var q = quad([.45, .7, .95][i], c); q.rotation.x = Math.PI / 2; q.position.set(-1.35 + i * 1.35, 2.65, .12); g.add(q); });
      var t = tex(1024, 96, function (c) { c.fillStyle = '#dbe3ff'; c.font = '800 40px ' + FONT; c.textAlign = 'center'; (o.labels || ['75 мм', '3 дюйма', '5 дюймов']).forEach(function (l, i) { c.fillText(l, 512 + (i - 1) * 345, 62); }); });
      var p = new T.Mesh(new T.PlaneGeometry(4, .38), new T.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); p.position.set(0, 1.62, .05); g.add(p); return g; },
    cage: function (o) { var g = grp(o.x, 0, o.z), s = o.s || 3.4, h = 2.8;
      var e = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(s, h, s)), new T.LineBasicMaterial({ color: '#9dff7c' })); e.position.y = h / 2; g.add(e);
      var net = tex(256, 256, function (c) { c.strokeStyle = 'rgba(157,255,124,.45)'; c.lineWidth = 2; for (var i = 0; i <= 256; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(256, i); c.stroke(); } });
      net.wrapS = net.wrapT = T.RepeatWrapping; net.repeat.set(3, 3);
      var nm = new T.MeshBasicMaterial({ map: net, transparent: true, side: T.DoubleSide, depthWrite: false, toneMapped: false });
      [[0, s / 2, 0], [0, -s / 2, 0], [s / 2, 0, Math.PI / 2], [-s / 2, 0, Math.PI / 2]].forEach(function (p) { var m = new T.Mesh(new T.PlaneGeometry(s, h), nm); m.position.set(p[0], h / 2, p[1]); m.rotation.y = p[2]; g.add(m); });
      for (var i = 0; i < 2; i++) { var gate = new T.Mesh(new T.TorusGeometry(.42, .04, 8, 32), glow('#ff9f5a')); gate.position.set(i ? .8 : -.8, 1.1, 0); gate.rotation.y = Math.PI / 2; g.add(gate); }
      var q = quad(.32, '#ea580c'); g.add(q);
      TICK.push(function (t) { q.position.set(Math.sin(t * .9) * .9, 1.1 + Math.sin(t * 1.7) * .25, Math.cos(t * .9) * .9); q.rotation.y = -t * .9; q.rotation.z = Math.sin(t * .9) * .2; q.userData.spin(.9); });
      label('ПОЛЁТНАЯ КЛЕТКА', 'вуп летает в зале', '#9dff7c', o.x, 3.4, o.z, .7); block(o.x, o.z, s / 2 + .1, s / 2 + .1, 0); return g; },
    batt: function (o) { var g = grp(o.x, 0, o.z, o.ry); box(1.6, 2.2, .7, M({ color: '#3a2a12', roughness: .5, metalness: .4 }), 0, 1.1, 0, g);
      for (var i = 0; i < 3; i++) for (var j = 0; j < 4; j++) { box(.3, .14, .3, M({ color: '#facc15', roughness: .5 }), -.54 + j * .36, .55 + i * .55, .25, g); var l = box(.05, .05, .01, glow(j % 3 ? '#9dff7c' : '#ffd36e'), -.54 + j * .36, .55 + i * .55, .41, g, 1); (function (l, k) { TICK.push(function (t) { l.visible = Math.sin(t * 2 + k) > -.6; }); })(l, i * 4 + j); }
      var t = tex(512, 96, function (c) { c.fillStyle = '#facc15'; c.fillRect(0, 0, 512, 96); c.fillStyle = '#1a1300'; c.font = '900 52px ' + FONT; c.textAlign = 'center'; c.fillText('⚡ LiPo', 256, 66); });
      var p = new T.Mesh(new T.PlaneGeometry(1.4, .26), new T.MeshBasicMaterial({ map: t, toneMapped: false })); p.position.set(0, 2.0, .36); g.add(p); block(o.x, o.z, .8, .35, o.ry); return g; },
    poster: function (o) { var w = o.w || 2.2, t = tex(720, 420, function (c, cw, ch) { c.fillStyle = '#0b1028'; c.fillRect(0, 0, cw, ch); });
      if (o.img) { /* фото (своё, из папки курса): справа квадрат, слева подпись o.cap = [заголовок, строка, строка...] */
        var ph = new Image(); ph.onload = function () { var c = t.userData.x; c.drawImage(ph, 300, 0, 420, 420); var g = c.createLinearGradient(300, 0, 380, 0); g.addColorStop(0, '#0b1028'); g.addColorStop(1, 'rgba(11,16,40,0)'); c.fillStyle = g; c.fillRect(300, 0, 80, 420);
          var cp = o.cap || []; c.fillStyle = MC; c.fillRect(24, 34, 6, 60); c.fillStyle = '#fff'; c.font = '800 40px ' + DISP; c.textBaseline = 'top'; c.fillText(cp[0] || '', 42, 36); c.font = '600 22px ' + FONT; c.fillStyle = '#cfd7ff';
          for (var i = 1; i < cp.length; i++) c.fillText(cp[i], 26, 120 + (i - 1) * 34); t.needsUpdate = true; }; ph.src = o.img; }
      else svgImg(o.pic, function (im) { t.userData.x.drawImage(im, 0, 0, 720, 420); t.needsUpdate = true; });
      var g = grp(o.x, o.y, o.z, o.ry); box(w + .12, w * .58 + .12, .04, mDark, 0, 0, -.03, g); g.add(new T.Mesh(new T.PlaneGeometry(w, w * .58), new T.MeshBasicMaterial({ map: t, toneMapped: false }))); return g; },
    crate: function (o) { var s = o.s || .8, g = grp(o.x, 0, o.z, o.ry || 0); box(s, s * .7, s * .8, M({ color: '#4b5563', roughness: .7 }), 0, s * .35, 0, g); box(s * 1.02, .06, s * .82, M({ color: '#f59e0b' }), 0, s * .5, 0, g); block(o.x, o.z, s * .6, s * .6, 0); return g; },
    sofa: function (o) { var g = grp(o.x, 0, o.z, o.ry || 0), m = M({ color: '#241a44', roughness: .95, metalness: 0 }), cu = M({ color: '#33255e', roughness: 1, metalness: 0 });
      box(2.4, .3, .9, m, 0, .25, 0, g); box(2.4, .62, .22, m, 0, .66, -.36, g); box(.22, .42, .9, m, -1.1, .5, 0, g); box(.22, .42, .9, m, 1.1, .5, 0, g);
      [-.5, .5].forEach(function (x) { box(.96, .14, .66, cu, x, .47, .06, g); box(.9, .42, .14, cu, x, .76, -.2, g); }); box(.36, .3, .1, M({ color: MC, roughness: .9 }), .7, .72, -.1, g).rotation.z = .3;
      [[-1.1, -.38], [1.1, -.38], [-1.1, .38], [1.1, .38]].forEach(function (p) { box(.06, .1, .06, mMetal, p[0], .05, p[1], g); }); block(o.x, o.z, 1.3, .5, o.ry); return g; }
  };
  function decor(o) { var f = DECOR[o.t]; if (!f) return; var g = f(o); if (o.info && g) { var at = o.at || fwd(o.ry || 0, 2.2, o.x, o.z); CLICK.push({ o: g, kind: 'info', info: o.info, at: at, look: [o.x, o.y || 1.4, o.z] }); } }

  /* ---------- дрон-проводник и путь ---------- */
  var GUIDE, gTo = new T.Vector3(), DOTS = [], dotG;
  function guideBuild() {
    GUIDE = quad(.5, MC); GUIDE.position.set(0, 2.4, 0); S.add(GUIDE); var gl = new T.PointLight(MC, .6, 4, 2); GUIDE.add(gl);
    dotG = new T.Group(); S.add(dotG); var dm = glow('#ffd36e', .8), dg = new T.CircleGeometry(.07, 12);
    for (var i = 0; i < 40; i++) { var d = new T.Mesh(dg, dm.clone()); d.rotation.x = -Math.PI / 2; d.position.y = .02; dotG.add(d); DOTS.push(d); }
  }
  function nextTarget() { NEXT = null; var nx = I && I.next && I.next(); if (nx && nx.m === cfg.mid) NEXT = nx.t;
    /* общий "дальше" ведёт в другой модуль - в комнате ведём к первому открытому непройденному заданию этого модуля */
    if (!NEXT && api) NEXT = mod.tasks.find(function (t) { return api.state(t) === 'open'; }) || null; return NEXT; }
  function guideTick(t, dt) {
    var c = NEXT && (CLICK.find(function (z) { return (z.kind === 'stand' || z.kind === 'table') && z.tid === NEXT; }));
    if (c) gTo.set(c.look[0], 2.9, c.look[2]); else gTo.set(pos.x - Math.sin(yaw + .5) * 4.5, 3.3, pos.z - Math.cos(yaw + .5) * 4.5);
    GUIDE.position.lerp(gTo, Math.min(1, dt * 1.2)); GUIDE.position.y += Math.sin(t * 2) * .004; GUIDE.rotation.y += dt * .5; GUIDE.userData.spin(.8);
    /* светящийся путь от ученика к стоянке у следующего задания */
    var show = c && !(sel && sel.tid === NEXT && arrived) && pos.distanceTo(new T.Vector3(c.at[0], EYE, c.at[1])) > 1.6;
    dotG.visible = !!show; if (!show) return;
    var a = new T.Vector2(pos.x, pos.z), b = new T.Vector2(c.at[0], c.at[1]), L = a.distanceTo(b), n = Math.min(DOTS.length, Math.floor(L / .45));
    for (var i = 0; i < DOTS.length; i++) { var d = DOTS[i]; if (i >= n || i < 2) { d.visible = false; continue; } d.visible = true; var u = i / n; d.position.x = a.x + (b.x - a.x) * u; d.position.z = a.y + (b.y - a.y) * u; d.material.opacity = .25 + .6 * Math.max(0, Math.sin(u * 12 - t * 5)); }
  }

  /* ---------- оверлей ---------- */
  function buildUI() {
    root = document.createElement('div'); root.id = 'kmn'; root.style.setProperty('--kc', MC); root.style.setProperty('--kr', MCr);
    root.innerHTML = '<div class="k-top"><button class="k-ic" data-k="exit" title="В город" aria-label="В город">←</button><div class="k-ttl"><small></small><b></b></div><div class="k-st"></div><button class="k-ic" data-k="snd" title="Голос"></button><input class="k-vol" type="range" min="0" max="100" step="5" title="Громкость" aria-label="Громкость"></div>' +
      '<div class="k-hello"><small></small><b></b><span></span></div><div class="k-hint"></div><div class="k-card"><small></small><h3></h3><p></p><div class="k-acts"></div></div><div class="k-toast"></div><div class="k-fade"></div>';
    document.body.appendChild(root);
    ['top', 'hello', 'hint', 'card', 'toast', 'fade', 'st'].forEach(function (k) { ui[k] = root.querySelector('.k-' + k); });
    ui.ttlS = root.querySelector('.k-ttl small'); ui.ttlB = root.querySelector('.k-ttl b'); ui.snd = root.querySelector('[data-k="snd"]'); ui.vol = root.querySelector('.k-vol');
    ui.vol.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    ui.vol.addEventListener('input', function () { var G = window.GOLOS; if (!G || !G.setVol) return; G.setVol(ui.vol.value / 100); if (G.vol > 0 && !G.on) { G.setOn(true); sndUI(); } });
    root.querySelector('[data-k="exit"]').onclick = function () { if (anim) return; leave(); };
    ui.snd.onclick = function () { var G = window.GOLOS; if (!G) return; G.setOn(!G.on); sndUI(); if (!G.on && MON) { MON.talk = false; } else if (MON) MON.said = -1; };
    ui.card.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    ui.card.addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (b) doAct(b.dataset.a); });
  }
  function sndUI() { var G = window.GOLOS; ui.snd.textContent = G && G.on ? '🔊' : '🔇'; ui.snd.hidden = !G; ui.vol.hidden = !G || !G.setVol; if (G && G.vol != null) ui.vol.value = Math.round(G.vol * 100); }
  function hud() { var d = 0; mod.tasks.forEach(function (t) { if (api && api.state(t) === 'done') d++; }); ui.st.textContent = '★ ' + d + ' / ' + mod.tasks.length; }
  var hintT = 0;
  function hint(s, ms) { ui.hint.textContent = s; ui.hint.style.opacity = 1; clearTimeout(hintT); hintT = setTimeout(function () { ui.hint.style.opacity = 0; }, ms || 6000); }
  function toast(s) { ui.toast.textContent = s; ui.toast.classList.add('on'); setTimeout(function () { ui.toast.classList.remove('on'); }, 2600); }

  /* карточка внизу: что выбрано и что можно сделать */
  function card(c) {
    if (!c) { ui.card.classList.remove('on'); return; }
    var sm = '', h = '', p = '', acts = '';
    if (c.kind === 'stand') { var L = K.lib[c.tid], s = stState(c.tid), st = STANDS[c.tid];
      sm = 'ЗАДАНИЕ ' + st.n + (s === 'done' ? ' · ПРОЙДЕНО' : s === 'lock' ? ' · ЗАКРЫТО' : s === 'wait' ? ' · ЖДЁТ ТРЕНЕРА' : ''); h = L.t; p = (L.sub || '') + (s === 'lock' ? '. Откроется после предыдущего задания.' : '');
      acts = s === 'lock' ? '<button class="k-b dis" data-a="lock">🔒 Пока закрыто</button>' : '<button class="k-b pri" data-a="task">' + (s === 'done' ? '↻ Повторить' : s === 'wait' ? 'Открыть' : '▶ Начать') + '</button>'; }
    else if (c.kind === 'table') { var L2 = K.lib[c.tid], s2 = stState(c.tid), kf = kidFirst();
      sm = 'ЗАДАНИЕ ' + TABLE.n + ' · СТОЛ СБОРКИ'; h = L2.t; p = s2 === 'lock' ? 'Задание откроется позже, а собрать дрон для тренировки можно уже сейчас.' : 'Собери дрон сам: детали, винты, пайка, разъёмы. Когда дрон взлетит, сборка засчитается в задание.';
      var a1 = '<button class="k-b ' + (kf ? '' : 'pri') + '" data-a="game0">🛠 Собрать дрон</button>', a2 = '<button class="k-b ' + (kf ? 'pri' : '') + '" data-a="game1">🧒 Для младших</button>';
      acts = (kf ? a2 + a1 : a1 + a2) + (s2 !== 'lock' ? '<button class="k-b" data-a="task">📖 Задание: теория и проверка</button>' : ''); }
    else if (c.kind === 'mon') { var sl = MON.list[MON.k]; sm = 'ТЕОРИЯ · ' + (MON.k + 1) + ' ИЗ ' + MON.list.length; h = sl.h; p = sl.p;
      acts = '<button class="k-b" data-a="prev">‹</button><button class="k-b" data-a="next">›</button>' + (window.GOLOS && GOLOS.can && GOLOS.can() ? '<button class="k-b pri" data-a="listen">🔊 Слушать</button>' : ''); }
    else if (c.kind === 'info') { sm = c.info[0]; h = c.info[1]; p = c.info[2]; }
    ui.card.querySelector('small').textContent = sm; ui.card.querySelector('h3').textContent = h; ui.card.querySelector('p').textContent = p;
    ui.card.querySelector('.k-acts').innerHTML = acts; ui.card.classList.add('on'); ui.hint.style.opacity = 0;
  }
  function kidFirst() { try { var P = JSON.parse(lsG((window.KURSY || {}).meKey || 'spk_vzlet') || 'null'), c = P && parseInt(P.cls, 10); return c > 0 && c <= 6; } catch (e) { return false; } }
  function doAct(a) {
    var c = sel; if (!c) return;
    if (a === 'lock') { ui.card.classList.remove('shake'); void ui.card.offsetWidth; ui.card.classList.add('shake'); return; }
    if (a === 'task') { stopTalk(); if (api.task(c.tid) === false) doAct('lock'); return; }
    if (a === 'game0' || a === 'game1') { diveTable(a === 'game1'); return; }
    if (a === 'prev' || a === 'next') { MON.go(MON.k + (a === 'next' ? 1 : -1)); card(c); return; }
    if (a === 'listen') { var G = window.GOLOS; if (G) { if (!G.on) { G.setOn(true); sndUI(); } MON.said = -1; MON.talk = false; G.stop(); } return; }
  }
  function stopTalk() { if (window.GOLOS) GOLOS.stop(); if (MON) MON.talk = false; SPEAK = false; }

  /* снимок комнаты во все стороны от стола (без самого стола): его показывает игра "Собери дрон" вместо своего фона */
  function fonCube(x, y, z, hide) { var N = MOB ? 384 : 768, faces = [], sv = { p: CAM.position.clone(), q: CAM.quaternion.clone(), f: CAM.fov, a: CAM.aspect, up: CAM.up.clone() };
    GX.show(hide, false); R.setSize(N, N, false); GX.resize(N, N, 1); CAM.fov = 90; CAM.aspect = 1; CAM.updateProjectionMatrix(); CAM.position.set(x, y, z);
    /* порядок и повороты - как их читает THREE.CubeTexture (проверено): -x, +x, +y, -y, +z, -z */
    [[-1, 0, 0, 0, 1, 0], [1, 0, 0, 0, 1, 0], [0, 1, 0, 0, 0, -1], [0, -1, 0, 0, 0, 1], [0, 0, 1, 0, 1, 0], [0, 0, -1, 0, 1, 0]].forEach(function (d) {
      CAM.up.set(d[3], d[4], d[5]); CAM.lookAt(x + d[0], y + d[1], z + d[2]); CAM.updateMatrixWorld(); GX.render(0);
      var c = document.createElement('canvas'); c.width = c.height = N; c.getContext('2d').drawImage(R.domElement, 0, 0, N, N); faces.push(c); });
    GX.show(hide, true); CAM.up.copy(sv.up); CAM.position.copy(sv.p); CAM.quaternion.copy(sv.q); CAM.fov = sv.f; CAM.aspect = sv.a; CAM.updateProjectionMatrix(); R.setSize(innerWidth, innerHeight); gfit();
    return faces; }
  /* ---------- провал в стол: камера ныряет к столу, вспышка, игра; назад - выныриваем ---------- */
  function diveTable(kid) {
    if (!TABLE || !window.KURS_TREN) return; stopTalk(); card(null); unlock();
    var c = TABLE.center, from = pos.clone(), fy = yaw, fp = pitch, to = new T.Vector3(c.x + Math.sin(TABLE.o.ry || 0) * .5, 2.2, c.z + Math.cos(TABLE.o.ry || 0) * .5);
    var dyaw = Math.atan2(-(c.x - to.x), -(c.z - to.z));
    anim = { t: 0, d: RED ? .3 : 1.4, step: function (u) { var e = ease(u); pos.lerpVectors(from, to, e); yaw = fy + angD(fy, dyaw) * e; pitch = fp + (-1.25 - fp) * e; CAM.fov = fov0() - 26 * e; CAM.updateProjectionMatrix(); ui.fade.style.background = '#fff'; ui.fade.style.transition = 'none'; ui.fade.style.opacity = Math.max(0, (u - .7) / .3); },
      end: function () {
        var tid = TABLE.o.task, step = TABLE.o.step, fresh = false, built = false, gm = TABLE.o.game || 'sborka';
        if (step == null && K.lib[tid]) step = K.lib[tid].steps.findIndex(function (x) { return x.g === gm; }); if (step < 0) step = null;
        window.KURS_FON = null; if (PROBA && GX && gm === 'sborka') try { window.KURS_FON = { faces: fonCube(c.x, 1.7, c.z + .45, TABLE.g) }; GX.render(0); } catch (e) { window.KURS_FON = null; }
        KURS_TREN.open(gm, kid, function () { built = true; if (api.state(tid) !== 'lock' && I && I.step && step != null) fresh = I.step(tid, step, {}); },
          function () { paused = false; ui.fade.style.transition = 'opacity .7s'; ui.fade.style.opacity = 0; setTimeout(function () { ui.fade.style.background = '#05060f'; }, 800);
            var back = from.clone(); anim = { t: 0, d: RED ? .3 : 1.2, step: function (u) { var e = ease(u); pos.lerpVectors(to, back, e); pitch = -1.25 + (fp + 1.25) * e; CAM.fov = fov0() - 26 + 26 * e; CAM.updateProjectionMatrix(); },
              end: function () { refreshAll(); if (built) toast(fresh ? 'Задание пройдено! +' + K.lib[tid].pts + ' очков' : 'Дрон собран!'); if (fresh) celebrate(tid); sel = CLICK.find(function (z) { return z.kind === 'table'; }); arrived = true; card(sel); } }; });
        paused = true;
      } };
  }
  /* угол обзора: на телефоне стоя (узкий экран) шире, чтобы стенд и стол влезали */
  function fov0() { var a = innerWidth / innerHeight; return a < .8 ? 80 : a < 1.2 ? 72 : 64; }
  function angD(a, b) { return ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; }

  /* праздник: искры у стенда и звезда в счётчик */
  function celebrate(tid) {
    var c = CLICK.find(function (z) { return z.tid === tid; }); if (!c) return;
    var p0 = new T.Vector3(c.look[0], 2.2, c.look[2]), parts = [], geo = new T.SphereGeometry(.04, 6, 6);
    for (var i = 0; i < 40; i++) { var m = new T.Mesh(geo, glow(i % 2 ? '#ffd36e' : MC)); m.position.copy(p0); m.userData.v = new T.Vector3((Math.random() - .5) * 4, Math.random() * 4 + 1, (Math.random() - .5) * 4); S.add(m); parts.push(m); }
    var t0 = clock.elapsedTime; TICK.push(function burst(t, dt) { var u = t - t0; parts.forEach(function (m) { m.userData.v.y -= dt * 6; m.position.addScaledVector(m.userData.v, dt); m.scale.setScalar(Math.max(.01, 1 - u / 1.4)); });
      if (u > 1.4) { parts.forEach(function (m) { S.remove(m); }); TICK.splice(TICK.indexOf(burst), 1); } });
    var v = p0.clone().project(CAM), x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight, r = ui.st.getBoundingClientRect(), s = document.createElement('div'); s.className = 'k-star'; s.textContent = '★'; root.appendChild(s);
    if (s.animate) s.animate([{ transform: 'translate(' + x + 'px,' + y + 'px) scale(1.4)', opacity: 1 }, { transform: 'translate(' + (r.left + r.width / 2 - 12) + 'px,' + (r.top) + 'px) scale(.6)', opacity: .9 }], { duration: 1100, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = function () { s.remove(); hud(); };
    else s.remove();
  }

  /* ---------- построение сцены (один раз) ---------- */
  function build() {
    buildUI();
    R = new T.WebGLRenderer({ antialias: !MOB, powerPreference: 'high-performance' });
    R.setPixelRatio(Math.min(devicePixelRatio, MOB ? 1.5 : 2)); R.setSize(innerWidth, innerHeight);
    R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = .92;
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap; cv = R.domElement; root.prepend(cv);
    S = new T.Scene(); S.background = new T.Color('#05060f'); S.fog = new T.Fog('#070914', 28, 70);
    if (T.RoomEnvironment) { var pm = new T.PMREMGenerator(R); S.environment = pm.fromScene(new T.RoomEnvironment(), .04).texture; }
    CAM = new T.PerspectiveCamera(64, innerWidth / innerHeight, .05, 200);
    if (window.INTER && cfg.grafika !== false) { var gs = (/[?&]s=([ABC])/.exec(location.search) || [])[1] || cfg.style || 'C';
      try { GX = INTER.create({ renderer: R, scene: S, camera: CAM, style: gs, accent: gs === 'A' ? '#e0409a' : MC, quality: gq(), tex: cfg.tex || 'proba/modul3/tex/' }); gfit(); } catch (e) { GX = null; } }
    mats(); room();
    if (cfg.monitor) monitor(cfg.monitor);
    (cfg.stands || []).forEach(stand);
    if (cfg.table) table(cfg.table);
    (cfg.decor || []).forEach(decor);
    if (cfg.signs) cfg.signs.forEach(function (s) { label(s[0], s[1], s[2] || MC, s[3], s[4], s[5], s[6]); });
    guideBuild(); adoptG(); if (GX) setTimeout(function () { adoptG(); try { GX.bakeEnv(0, 1.6, 0); } catch (e) {} }, 1500);
    addEventListener('resize', function () { if (!on) return; CAM.aspect = innerWidth / innerHeight; if (!anim) CAM.fov = fov0(); CAM.updateProjectionMatrix(); R.setSize(innerWidth, innerHeight); gfit(); });
    input(); built = true;
  }

  /* ---------- управление ---------- */
  var ray = new T.Raycaster(), mp = new T.Vector2(), drag = null, keys = {};
  var MLOOK = PROBA && !MOB && !!document.documentElement.requestPointerLock, lockHint = false;
  function locked() { return document.pointerLockElement === cv; }
  function unlock() { if (locked()) try { document.exitPointerLock(); } catch (e) {} }
  function input() {
    cv.addEventListener('pointerdown', function (e) { if (anim) return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: yaw, pitch: pitch, moved: false }; });
    addEventListener('pointermove', function (e) { if (!on) return; if (!drag || drag.id !== e.pointerId) { hover(e); return; } var dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > (PROBA ? 3 : 8)) drag.moved = true; if (drag.moved) { yaw = drag.yaw + (PROBA ? -dx : dx) * .0055; pitch = Math.max(-1.1, Math.min(.85, drag.pitch + dy * .0045)); lookAt = null; } });
    addEventListener('pointerup', function (e) { if (!on || !drag || drag.id !== e.pointerId) return; var d = drag; drag = null; if (d.moved || anim || paused) return;
      if (MLOOK && e.pointerType === 'mouse') { if (locked()) interact(); else { if (sel && arrived) tap(e.clientX, e.clientY); else { try { cv.requestPointerLock(); } catch (er) {} } } return; }
      tap(e.clientX, e.clientY); });
    if (MLOOK) { addEventListener('mousemove', function (e) { if (!on || !locked() || anim || paused) return; var mx = e.movementX || 0, my = e.movementY || 0; if (Math.abs(mx) > 250 || Math.abs(my) > 250) return; /* браузер иногда присылает ложный рывок */ yaw -= mx * .0023; pitch = Math.max(-1.1, Math.min(.85, pitch - my * .0023)); lookAt = null; });
      document.addEventListener('pointerlockchange', function () { var L = locked(); document.body.classList.toggle('kmn-lock', L); if (L && !lockHint) { lockHint = true; hint('Мышь поворачивает камеру. Щелчок или E - подойти и открыть. Esc - вернуть стрелку.', 6000); } }); }
    /* тачпад и колесо мыши: два пальца по тачпаду (или колесо) - поворот камеры вверх-вниз и влево-вправо; щипок (Ctrl + колесо) - шаг вперёд-назад */
    cv.addEventListener('wheel', function (e) { if (anim || paused) return; e.preventDefault(); var k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1, dx = e.deltaX * k, dy = e.deltaY * k;
      if (e.ctrlKey) { var f = new T.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)); target = pos.clone().addScaledVector(f, dy < 0 ? .8 : -.8); clampP(target); sel = null; card(null); return; }
      function cl(v) { return Math.max(-.12, Math.min(.12, v)); } yaw -= cl(dx * .0025); pitch = Math.max(-1.1, Math.min(.85, pitch - cl(dy * .0025))); lookAt = null; }, { passive: false });
    addEventListener('keydown', function (e) { if (!on || paused) return; if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && e.code !== 'Escape') return; keys[e.code] = 1; if (e.code === 'Escape' && sel) { sel = null; card(null); }
      /* пробел - прыжок, Enter или E - действие */
      if (e.code === 'Space') { e.preventDefault(); if (!anim && jy <= 0) jv = 3.6; }
      if ((e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyE') && !e.repeat && !anim) { e.preventDefault(); interact(); } });
    addEventListener('keyup', function (e) { keys[e.code] = 0; });
    if (PROBA && window.FPSUPR) FU = FPSUPR.create({ canvas: cv, root: root, noMouse: true, walk: function () { return on && !paused && !anim; }, act: function () { if (!anim) interact(); }, jump: function () { if (!anim && jy <= 0) jv = 3.6; },
      look: function (dx, dy) { yaw += dx; pitch = Math.max(-1.1, Math.min(.85, pitch + dy)); lookAt = null; } });
  }
  var FU = null;
  /* Enter / E: если уже подошли - главное действие карточки (начать задание, собрать дрон, слушать); если нет - подойти к тому, что в центре взгляда или ближе всего впереди */
  var jy = 0, jv = 0;
  function interact() {
    if (sel && arrived) { var b = ui.card.querySelector('.k-b.pri') || ui.card.querySelector('.k-b[data-a]'); if (b) doAct(b.dataset.a); else if (sel.kind === 'info') { sel = null; card(null); } return; }
    var h = pick(innerWidth / 2, innerHeight / 2); if (h && h.c && h.d < 9) { go(h.c); return; }
    var best = null, bs = 1e9, f = new T.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    CLICK.forEach(function (c) { var d = new T.Vector3(c.look[0] - pos.x, 0, c.look[2] - pos.z), L = d.length(); if (L < .01 || L > 9) return; var cos = d.dot(f) / L; if (cos < .8) return; var sc = L * (2 - cos); if (sc < bs) { bs = sc; best = c; } });
    if (best) go(best); else hint('Подойди ближе и посмотри на стенд, стол или предмет - потом E или Enter.', 3500);
  }
  var hovO = null;
  function pick(cx, cy) { mp.set(cx / innerWidth * 2 - 1, -cy / innerHeight * 2 + 1); ray.setFromCamera(mp, CAM);
    var hit = ray.intersectObjects(CLICK.map(function (c) { return c.o; }).concat([FLOOR]), true)[0]; if (!hit) return null;
    var o = hit.object, c = null; while (o && !c) { c = CLICK.find(function (z) { return z.o === o; }); o = o.parent; } return { c: c, p: hit.point, d: hit.distance }; }
  function hover(e) { if (MOB || paused || anim) return; var h = pick(e.clientX, e.clientY); cv.style.cursor = h && h.c ? 'pointer' : 'default'; }
  function tap(cx, cy) {
    var h = pick(cx, cy); if (!h) return;
    if (h.c) { if (sel === h.c && arrived) { var a = h.c.kind === 'stand' ? 'task' : h.c.kind === 'table' ? 'game' + (kidFirst() ? 1 : 0) : null; if (a) { if (a === 'task' && stState(h.c.tid) === 'lock') doAct('lock'); else doAct(a); } return; }
      go(h.c); return; }
    sel = null; card(null); target = h.p.clone(); clampP(target); target.y = EYE; lookAt = null; arrived = false;
  }
  function go(c) { sel = c; arrived = false; target = new T.Vector3(c.at[0], EYE, c.at[1]); clampP(target); lookAt = new T.Vector3(c.look[0], c.look[1], c.look[2]); card(c); stopTalkIfNotMon(c); }
  function stopTalkIfNotMon(c) { if (c.kind !== 'mon' && MON && MON.talk) { /* голос монитора не обрываем, он тихо дочитает */ } }
  function clampP(p) { p.x = Math.max(-W / 2 + .7, Math.min(W / 2 - .7, p.x)); p.z = Math.max(-D / 2 + .7, Math.min(D / 2 - .7, p.z)); }
  function blocked(x, z, fx, fz) { if (fx != null && inBox(fx, fz)) return inBox(x, z) && depth(x, z) > depth(fx, fz) + 1e-4; return inBox(x, z); }
  function inBox(x, z) { return depth(x, z) > 0; }
  /* насколько точка залезла в препятствие (0 - свободна); если игрок уже внутри, выпускаем его наружу */
  function depth(x, z) { var m = 0; for (var i = 0; i < BOX.length; i++) { var b = BOX[i], dx = b[2] + .35 - Math.abs(x - b[0]), dz = b[3] + .35 - Math.abs(z - b[1]); if (dx > 0 && dz > 0) m = Math.max(m, Math.min(dx, dz)); } return m; }

  /* ---------- кадр ---------- */
  var last = 0, raf = 0;
  function frame() {
    if (!on) return; raf = requestAnimationFrame(frame);
    var raw = clock.getDelta(), dt = Math.min(.05, raw), t = clock.elapsedTime;
    if (paused && !anim) return;
    TICK.forEach(function (f) { f(t, dt); }); monTick(t, dt); guideTick(t, dt);
    if (anim) { anim.t += Math.min(.25, raw); var u = Math.min(1, anim.t / anim.d); anim.step(u); if (u >= 1) { var a = anim; anim = null; a.end && a.end(); } }
    else {
      /* WASD / стрелки */
      var kx = (keys.KeyD || 0) - (keys.KeyA || 0), kz = (keys.KeyW || keys.ArrowUp || 0) - (keys.KeyS || keys.ArrowDown || 0);
      if (FU) { kx = Math.max(-1, Math.min(1, kx + FU.joy.s)); kz = Math.max(-1, Math.min(1, kz + FU.joy.f)); }
      if (keys.ArrowLeft) yaw += dt * 1.8; if (keys.ArrowRight) yaw -= dt * 1.8;
      var run = keys.ShiftLeft || keys.ShiftRight || (FU && FU.joy.run), st = run ? 1.5 : .6;
      if (kx || kz) { var f = new T.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), r = new T.Vector3(-f.z, 0, f.x); target = pos.clone().addScaledVector(f, kz * st).addScaledVector(r, kx * st); clampP(target); target.y = EYE; lookAt = null; if (sel) { sel = null; card(null); } }
      /* ходьба к цели: плавный разгон и торможение, обход препятствий скольжением */
      if (target) { var d = target.clone().sub(pos); d.y = 0; var L = d.length();
        if (L < .04) { target = null; vel.set(0, 0, 0); if (sel) { arrived = true; unlock(); } }
        else { var want = d.normalize().multiplyScalar(Math.min(run ? 6.0 : 3.0, L * (run ? 3.6 : 2.2) + .25)); vel.lerp(want, Math.min(1, dt * 5)); var nx = pos.x + vel.x * dt, nz = pos.z + vel.z * dt;
          if (!blocked(nx, nz, pos.x, pos.z)) { pos.x = nx; pos.z = nz; } else if (!blocked(nx, pos.z, pos.x, pos.z)) pos.x = nx; else if (!blocked(pos.x, nz, pos.x, pos.z)) pos.z = nz; else { target = null; vel.set(0, 0, 0); if (sel) arrived = true; }
          bob += vel.length() * dt * 2.4; } }
      /* прыжок */
      if (jy > 0 || jv > 0) { jv -= 11 * dt; jy += jv * dt; if (jy <= 0) { jy = 0; jv = 0; } }
      if (lookAt) { var dd = lookAt.clone().sub(pos), ty = Math.atan2(-dd.x, -dd.z), tp = Math.atan2(dd.y, Math.hypot(dd.x, dd.z)); yaw += angD(yaw, ty) * Math.min(1, dt * 3.2); pitch += (tp - pitch) * Math.min(1, dt * 3.2); if (!target && Math.abs(angD(yaw, ty)) < .01) lookAt = null; }
    }
    CAM.position.set(pos.x, (anim ? pos.y : EYE + jy) + (anim || jy > 0 ? 0 : Math.sin(bob * 2) * .022), pos.z); CAM.rotation.order = 'YXZ'; CAM.rotation.set(pitch, yaw, 0);
    if (GX) { GX.render(dt); fpsG(raw); } else R.render(S, CAM);
  }
  var fL = 0, fN = 0, fT = 0, fW = /[?&]q=/.test(location.search) ? 1e9 : 5;
  function fpsG(dt) { if (fW > 0) { fW -= dt; return; } fN++; fT += dt; if (fN >= 70) { if (fT / fN > (PROBA ? (fL ? 1 / 26 : 1 / 40) : 1 / 21) && document.visibilityState === 'visible' && !paused) { fL++; if (GX.lower() === 2) lsS('kursy_grafika', 'low'); fW = 3; } fN = 0; fT = 0; } }

  /* ---------- состояние заданий ---------- */
  function refreshAll() { nextTarget(); Object.keys(STANDS).forEach(function (k) { drawStand(STANDS[k]); }); hud(); }

  /* ---------- вход и выход ---------- */
  function open(a) {
    api = a; I = window.VZ_KURS_INFO; K = window.VZ_KURS; if (!built) build();
    on = true; paused = false; root.classList.add('on'); sel = null; card(null); sndUI();
    CAM.aspect = innerWidth / innerHeight; CAM.fov = fov0(); CAM.updateProjectionMatrix(); R.setSize(innerWidth, innerHeight); gfit();
    ui.ttlS.textContent = 'МОДУЛЬ ' + mod.n; ui.ttlB.textContent = cfg.title || mod.t;
    refreshAll();
    /* вход: за воротами, ворота разъезжаются, шагаем внутрь */
    var st = cfg.start, lk = cfg.look, from = new T.Vector3(0, EYE, D / 2 + 2.6), to = new T.Vector3(st[0], EYE, st[1]);
    pos.copy(from); yaw = Math.atan2(-(lk[0] - from.x), -(lk[2] - from.z)); pitch = -.04; target = null; lookAt = null; vel.set(0, 0, 0);
    doorL.position.x = -.8; doorR.position.x = .8;
    ui.fade.style.background = '#05060f'; ui.fade.style.transition = 'opacity .9s'; ui.fade.style.opacity = 1; requestAnimationFrame(function () { ui.fade.style.opacity = 0; });
    ui.hello.querySelector('small').textContent = 'МОДУЛЬ ' + mod.n; ui.hello.querySelector('b').textContent = cfg.title || mod.t; ui.hello.querySelector('span').textContent = mod.t;
    ui.hello.classList.add('on'); setTimeout(function () { ui.hello.classList.remove('on'); }, 2600);
    anim = { t: 0, d: RED ? .4 : 3.2, step: function (u) { var dO = Math.min(1, u / .35), e = ease(dO); doorL.position.x = -.8 - e * 1.6; doorR.position.x = .8 + e * 1.6;
        var w = ease(Math.max(0, (u - .25) / .75)); pos.lerpVectors(from, to, w); bob = w * 8; },
      end: function () { var first = !lsG('kmn_hi_' + cfg.mid); lsS('kmn_hi_' + cfg.mid, '1');
        doorAnim(0);
        hint(MOB ? 'Нажми на пол - иди. Нажми на стенд или стол - подойди. Тяни пальцем - осмотрись.' : 'W A S D - идти, Shift - бегом, пробел - прыжок. Мышь или два пальца по тачпаду - осмотреться. E или Enter - подойти и открыть.', 7000);
        var G = window.GOLOS; if (first && cfg.hello && G && G.on && G.can && G.can()) { SPEAK = true; G.say(cfg.hello, { onend: function () { SPEAK = false; } }); } } };
    clock.getDelta(); frame();
    /* окно задания поверх: комната размыта и стоит */
    winObs = new MutationObserver(function () { var w = document.getElementById('win'), o = w && w.classList.contains('on'); document.body.classList.toggle('kmn-win', !!o); if (o) { stopTalk(); paused = true; winP = true; card(null); unlock(); }
      else if (winP) { winP = false; if (!anim) { paused = false; clock.getDelta(); } } });   /* окно закрыли любым способом - комната снова живая (раньше без back() всё замирало) */
    var w = document.getElementById('win'); if (w) winObs.observe(w, { attributes: true, attributeFilter: ['class'] });
  }
  /* ворота: закрыть после входа (0) или открыть (1) за секунду */
  function doorAnim(open) { var a0 = doorR.position.x, a1 = open ? 2.4 : .8, t0 = clock.elapsedTime;
    TICK.push(function dA(t) { var u = Math.min(1, (t - t0) / 1.1), e = ease(u), x = a0 + (a1 - a0) * e; doorR.position.x = x; doorL.position.x = -x; if (u >= 1) TICK.splice(TICK.indexOf(dA), 1); }); }
  function close() { unlock(); on = false; cancelAnimationFrame(raf); stopTalk(); root.classList.remove('on'); document.body.classList.remove('kmn-win'); if (winObs) winObs.disconnect(); card(null); }
  function leave() { stopTalk(); if (api) api.exit(); }
  /* окно задания закрыто: обновляем стенды, при свежем прохождении - праздник и проводник к следующему */
  function back(tid, fresh) {
    document.body.classList.remove('kmn-win'); paused = false; clock.getDelta();
    if (tid && mod.tasks.indexOf(tid) < 0) { leave(); return; }
    refreshAll(); if (fresh && tid) { celebrate(tid); toast('Задание пройдено! +' + K.lib[tid].pts + ' очков'); sel = null; card(null); if (NEXT) setTimeout(function () { hint('Дальше - задание ' + (mod.tasks.indexOf(NEXT) + 1) + ': иди за светящейся дорожкой', 5000); }, 1500); }
    else if (sel) card(sel);
  }
  return { open: open, close: close, back: back };
}

window.KOMNATA = { make: make };
})();
