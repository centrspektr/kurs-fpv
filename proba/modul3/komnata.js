/* komnata.js - движок помещения от первого лица (модули-локации курса FPV, проба 09.11.2026).
   Ходим по комнате, смотрим вокруг, подходим к предметам и "проваливаемся" в них (стол с заданиями, монитор, зарядка).
   Управление:
     телефон - провести пальцем: осмотреться; нажать на пол: идти туда; нажать на предмет: подойти, ещё раз - действие.
     компьютер - то же мышью, плюс W A S D / стрелки - идти.
   Использование:
     var R = KOMNATA.create({ canvas, ui, size:[W,D,H], color:'#ffd36e', start:[x,z], look:[x,y,z] });
     R.scene, R.camera, R.renderer, R.THREE
     R.block(x1,z1,x2,z2)                      - препятствие (стол, шкаф), сквозь него не ходим
     R.item({ obj, name, sub, at:[x,z], look:[x,y,z], act:fn, actLabel, tagY, state }) - предмет, к которому подходим
     R.focus({ pos:[x,y,z], look:[x,y,z] }, done) - камера к предмету (ходьба выключена); R.unfocus() - назад
     R.frame(fn(dt,t))                          - вызов каждый кадр
     R.tex(w,h,draw(ctx,w,h))                    - текстура из рисунка на холсте (экраны, плакаты)
   Формат совместим с планом общего движка (engine/komnata.js, тред модуля 2): потом переносим туда. */
(function () {
'use strict';
var T = window.THREE;

function create(o) {
  var W = o.size[0], D = o.size[1], H = o.size[2], EYE = o.eye || 1.62, PR = 0.32;
  var cv = o.canvas, ui = o.ui;
  var ren = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  var dpr = Math.min(window.devicePixelRatio || 1, o.maxDpr || 2); ren.setPixelRatio(dpr);
  ren.outputEncoding = T.sRGBEncoding; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = o.exposure || 1.0;
  var sc = new T.Scene(); sc.background = new T.Color(o.bg || '#06070f');
  if (T.RoomEnvironment) { var pm = new T.PMREMGenerator(ren); sc.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture; }
  var cam = new T.PerspectiveCamera(o.fov || 66, 1, 0.05, 400);
  var st = o.start || [W / 2, D - 1.5], yaw = 0, pitch = -0.05;
  cam.position.set(st[0], EYE, st[1]);
  if (o.look) lookAtYP(o.look);
  cam.rotation.order = 'YXZ';

  var R = { THREE: T, scene: sc, camera: cam, renderer: ren, W: W, D: D, H: H, eye: EYE, items: [], blocks: [], frames: [], mode: 'walk' };

  function lookAtYP(p) { var dx = p[0] - cam.position.x, dz = p[2] - cam.position.z, dy = p[1] - cam.position.y;
    yaw = Math.atan2(-dx, -dz); pitch = Math.atan2(dy, Math.hypot(dx, dz)); }
  R.lookAt = lookAtYP;

  /* ---------- размеры экрана ---------- */
  function resize() { var w = innerWidth, h = innerHeight; ren.setSize(w, h, false); cam.aspect = w / h;
    cam.fov = (w < h ? (o.fovP || 78) : (o.fov || 66)); cam.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  /* ---------- препятствия ---------- */
  R.block = function (x1, z1, x2, z2) { R.blocks.push([Math.min(x1, x2), Math.min(z1, z2), Math.max(x1, x2), Math.max(z1, z2)]); };
  function free(x, z) {
    if (x < PR || z < PR || x > W - PR || z > D - PR) return false;
    for (var i = 0; i < R.blocks.length; i++) { var b = R.blocks[i];
      if (x > b[0] - PR && x < b[2] + PR && z > b[1] - PR && z < b[3] + PR) return false; }
    return true;
  }
  R.free = free;
  function moveBy(dx, dz) { var p = cam.position;
    if (free(p.x + dx, p.z + dz)) { p.x += dx; p.z += dz; return true; }
    if (free(p.x + dx, p.z)) { p.x += dx; return true; }      /* скользим вдоль стены */
    if (free(p.x, p.z + dz)) { p.z += dz; return true; }
    return false; }
  /* ближайшая свободная точка (если нажали на стол - встаём рядом) */
  function nearFree(x, z) { if (free(x, z)) return [x, z];
    for (var r = 0.2; r < 4; r += 0.2) for (var a = 0; a < 6.28; a += 0.4) { var X = x + Math.cos(a) * r, Z = z + Math.sin(a) * r; if (free(X, Z)) return [X, Z]; }
    return [cam.position.x, cam.position.z]; }

  /* ---------- текстуры из рисунка ---------- */
  R.tex = function (w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); draw(x, w, h);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; t.userData = { c: c, x: x, draw: draw };
    t.redraw = function (d) { (d || draw)(x, w, h); t.needsUpdate = true; }; return t; };

  /* ---------- предметы ---------- */
  var tags = document.createElement('div'); tags.className = 'k-tags'; ui.appendChild(tags);
  R.item = function (it) { it.tag = document.createElement('div'); it.tag.className = 'k-tag';
    it.tag.innerHTML = '<b></b><small></small>'; tags.appendChild(it.tag); R.items.push(it); it.obj.traverse(function (m) { m.userData.item = it; });
    R.setTag(it); return it; };
  R.setTag = function (it) { it.tag.querySelector('b').textContent = it.name || ''; it.tag.querySelector('small').textContent = it.small || '';
    it.tag.className = 'k-tag' + (it.state ? ' ' + it.state : '') + (it === R.next ? ' nx' : ''); };
  R.setNext = function (it) { var old = R.next; R.next = it; if (old) R.setTag(old); if (it) R.setTag(it); };

  /* ---------- карточка "подошёл к предмету" ---------- */
  var card = document.createElement('div'); card.className = 'k-card'; card.hidden = true;
  card.innerHTML = '<div class="k-c-t"><small></small><b></b></div><p></p><button class="k-go"></button>'; ui.appendChild(card);
  var near = null;
  function showCard(it) { near = it; if (!it) { card.hidden = true; return; }
    card.querySelector('small').textContent = it.kicker || ''; card.querySelector('b').textContent = it.name;
    card.querySelector('p').textContent = it.sub || ''; card.querySelector('.k-go').textContent = it.actLabel || 'Открыть';
    card.hidden = false; }
  card.querySelector('.k-go').onclick = function () { if (near && near.act) { var it = near; showCard(null); it.act(it); } };
  R.card = showCard;

  /* ---------- ходьба к точке ---------- */
  var walk = null; /* {x,z,item,face} */
  /* R.route(x0,z0,x1,z1) (если задан) - точки пути через двери между комнатами; последняя точка - цель. Вернул null - туда нельзя */
  R.walkTo = function (x, z, item) { var p = nearFree(x, z), q = R.route ? R.route(cam.position.x, cam.position.z, p[0], p[1], item) : null;
    if (R.route && !q) return; q = q && q.length ? q.slice() : [p]; var f = q.shift();
    walk = { x: f[0], z: f[1], item: item || null, q: q }; showCard(null); var last = q.length ? q[q.length - 1] : f; marker(last[0], last[1]); };
  function arrive() { var it = walk.item; walk = null; hideMarker();
    if (it) { if (it.look) turnTo(it.look); showCard(it); } }
  var turn = null;
  function turnTo(p) { var dx = p[0] - cam.position.x, dz = p[2] - cam.position.z, dy = p[1] - cam.position.y;
    var ty = Math.atan2(-dx, -dz), tp = Math.atan2(dy, Math.hypot(dx, dz));
    while (ty - yaw > Math.PI) ty -= Math.PI * 2; while (ty - yaw < -Math.PI) ty += Math.PI * 2;
    turn = { y0: yaw, p0: pitch, y1: ty, p1: Math.max(-1.2, Math.min(1.0, tp)), t: 0 }; }
  R.turnTo = turnTo;

  /* кружок на полу, куда идём */
  var mk = new T.Mesh(new T.RingGeometry(0.16, 0.24, 32), new T.MeshBasicMaterial({ color: o.color || '#ffd36e', transparent: true, opacity: 0.9, depthWrite: false }));
  mk.rotation.x = -Math.PI / 2; mk.visible = false; sc.add(mk);
  function marker(x, z) { mk.position.set(x, 0.015, z); mk.visible = true; mk.scale.setScalar(1); }
  function hideMarker() { mk.visible = false; }

  /* ---------- фокус: камера к предмету ---------- */
  var fly = null, back = null;
  R.focus = function (pose, done) { if (R.mode === 'walk') back = { p: cam.position.clone(), y: yaw, pi: pitch };
    R.mode = 'focus'; walk = null; turn = null; showCard(null); document.body.classList.add('k-focus');
    var q0 = cam.quaternion.clone(), p0 = cam.position.clone(), p1 = new T.Vector3().fromArray(pose.pos);
    var m = new T.Matrix4().lookAt(p1, new T.Vector3().fromArray(pose.look), new T.Vector3(0, 1, 0)), q1 = new T.Quaternion().setFromRotationMatrix(m);
    fly = { p0: p0, p1: p1, q0: q0, q1: q1, t: 0, d: pose.dur || 1.1, done: done }; };
  R.unfocus = function (done) { if (!back) return; var b = back; back = null;
    var e = new T.Euler(b.pi, b.y, 0, 'YXZ'), q1 = new T.Quaternion().setFromEuler(e);
    fly = { p0: cam.position.clone(), p1: b.p, q0: cam.quaternion.clone(), q1: q1, t: 0, d: 0.9, done: function () { yaw = b.y; pitch = b.pi; R.mode = 'walk'; document.body.classList.remove('k-focus'); done && done(); } };
    R.mode = 'fly'; };

  /* ---------- указатель: осмотр, нажатия ---------- */
  var ray = new T.Raycaster(), v2 = new T.Vector2(), down = null, keys = {};
  function pick(cx, cy) { v2.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(v2, cam);
    var hits = ray.intersectObjects(R.pickables || sc.children, true);
    for (var i = 0; i < hits.length; i++) { var h = hits[i], o2 = h.object; if (!o2.visible || o2.userData.noPick) continue;
      var it = o2.userData.item; if (it) return { item: it, p: h.point };
      if (o2.userData.floor) return { floor: true, p: h.point };
      if (h.distance < 60 && !o2.userData.through) return { wall: true, p: h.point }; }
    return null; }
  R.pick = pick;
  cv.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, y0: yaw, p0: pitch, moved: false, id: e.pointerId, t: performance.now() };
    try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
  cv.addEventListener('pointermove', function (e) {
    if (!down) { if (e.pointerType === 'mouse' && R.mode === 'walk') hover(e.clientX, e.clientY); return; }
    var dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 7) down.moved = true;
    if (down.moved && R.mode === 'walk') { var k = (e.pointerType === 'touch' ? 0.0062 : 0.0042);
      yaw = down.y0 + dx * k; pitch = Math.max(-1.2, Math.min(1.0, down.p0 + dy * k * 0.9)); turn = null; }
    if (R.onDrag && R.mode === 'focus') R.onDrag(dx, dy, e); });
  cv.addEventListener('pointerup', function (e) { var d = down; down = null; if (!d) return;
    if (d.moved) { if (R.onDragEnd) R.onDragEnd(); return; }
    if (R.mode === 'focus') { if (R.onTap) R.onTap(e.clientX, e.clientY); return; }
    if (R.mode !== 'walk') return;
    var h = pick(e.clientX, e.clientY); if (!h) return;
    if (h.item) { var it = h.item, dd = Math.hypot(cam.position.x - it.at[0], cam.position.z - it.at[1]);
      if (dd < 0.6 || near === it) { if (it.act) { showCard(null); it.act(it); } } else R.walkTo(it.at[0], it.at[1], it); return; }
    if (h.floor) R.walkTo(h.p.x, h.p.z, null); });
  var hov = null;
  function hover(x, y) { var h = pick(x, y), it = h && h.item; if (it === hov) return;
    if (hov) hov.tag.classList.remove('hv'); hov = it; if (it) it.tag.classList.add('hv'); cv.style.cursor = it ? 'pointer' : (h && h.floor ? 'crosshair' : 'grab'); }
  /* тачпад и колесо: поворот камеры; Ctrl + колесо (щипок) - шаг вперёд-назад */
  cv.addEventListener('wheel', function (e) { if (R.mode !== 'walk') return; e.preventDefault(); var k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1, dx = e.deltaX * k, dy = e.deltaY * k;
    function cl(v) { return Math.max(-.12, Math.min(.12, v)); }
    if (e.ctrlKey) { moveBy(-Math.sin(yaw) * (dy < 0 ? .5 : -.5), -Math.cos(yaw) * (dy < 0 ? .5 : -.5)); return; }
    yaw -= cl(dx * .0025); pitch = Math.max(-1.2, Math.min(1.0, pitch - cl(dy * .0025))); turn = null; }, { passive: false });
  /* E или Enter: подойти к тому, на что смотришь (или ближнему впереди), у предмета - открыть */
  function interact() {
    if (near && near.act) { var it0 = near; showCard(null); it0.act(it0); return; }
    var h = pick(innerWidth / 2, innerHeight / 2); if (h && h.item) { R.walkTo(h.item.at[0], h.item.at[1], h.item); return; }
    var best = null, bs = 1e9, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    R.items.forEach(function (it) { if (!it.at || it.hidden) return; var c = it.look || [it.at[0], 0, it.at[1]], dx = c[0] - cam.position.x, dz = c[2] - cam.position.z, L = Math.hypot(dx, dz); if (L < .01 || L > 9) return;
      var cos = (dx * fx + dz * fz) / L; if (cos < .8) return; var sc = L * (2 - cos); if (sc < bs) { bs = sc; best = it; } });
    if (best) R.walkTo(best.at[0], best.at[1], best); }
  R.interact = interact;
  var jy = 0, jv = 0;
  addEventListener('keydown', function (e) { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && e.code !== 'Escape') return; keys[e.code] = 1; if (e.code === 'Escape' && R.mode === 'focus' && R.onEsc) R.onEsc();
    if (R.mode !== 'walk' || (R.busy && R.busy())) return;
    if (e.code === 'Space') { e.preventDefault(); if (jy <= 0) jv = 3.6; }
    if ((e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyE') && !e.repeat) { e.preventDefault(); interact(); } });
  addEventListener('keyup', function (e) { keys[e.code] = 0; });
  addEventListener('blur', function () { keys = {}; });

  R.frame = function (fn) { R.frames.push(fn); };

  /* ---------- кадр ---------- */
  var clock = new T.Clock(), tmp = new T.Vector3();
  function loop() { requestAnimationFrame(loop); var rdt = Math.min(clock.getDelta(), 0.12), dt = Math.min(rdt, 0.05), t = clock.elapsedTime;
    if (R.mode === 'walk') {
      var f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      if (keys.ArrowLeft) yaw += dt * 1.8; if (keys.ArrowRight) yaw -= dt * 1.8;
      if (f || s) { walk = null; hideMarker(); showCard(null); var sp = (keys.ShiftLeft || keys.ShiftRight ? 5.2 : 2.6) * dt;
        moveBy((-Math.sin(yaw) * f + Math.cos(yaw) * s) * sp, (-Math.cos(yaw) * f - Math.sin(yaw) * s) * sp); }
      if (walk) { var dx = walk.x - cam.position.x, dz = walk.z - cam.position.z, dist = Math.hypot(dx, dz), sp2 = Math.min(dist, 3.4 * dt);
        if (dist < 0.05) { if (walk.q && walk.q.length) { var nx = walk.q.shift(); walk.x = nx[0]; walk.z = nx[1]; } else arrive(); } else {
          var ty = Math.atan2(-dx, -dz); var dyaw = ty - yaw; while (dyaw > Math.PI) dyaw -= Math.PI * 2; while (dyaw < -Math.PI) dyaw += Math.PI * 2;
          if (dist > 0.8) { yaw += dyaw * Math.min(1, dt * 3.2); pitch += (-0.06 - pitch) * Math.min(1, dt * 2); }
          if (!moveBy(dx / dist * sp2, dz / dist * sp2)) { if (walk.q && walk.q.length) { var nx2 = walk.q.shift(); walk.x = nx2[0]; walk.z = nx2[1]; } else arrive(); } } }
      if (turn) { turn.t = Math.min(1, turn.t + dt * 2.2); var k = 1 - Math.pow(1 - turn.t, 3); yaw = turn.y0 + (turn.y1 - turn.y0) * k; pitch = turn.p0 + (turn.p1 - turn.p0) * k; if (turn.t >= 1) turn = null; }
      if (jy > 0 || jv > 0) { jv -= 11 * dt; jy += jv * dt; if (jy <= 0) { jy = 0; jv = 0; } }
      cam.position.y = EYE + jy + (walk && !jy ? Math.sin(t * 9) * 0.018 : 0);
      cam.rotation.set(pitch, yaw, 0, 'YXZ');
      if (near && Math.hypot(cam.position.x - near.at[0], cam.position.z - near.at[1]) > 1.6) showCard(null);
    }
    if (fly) { fly.t = Math.min(1, fly.t + rdt / fly.d); var k2 = fly.t < .5 ? 4 * fly.t * fly.t * fly.t : 1 - Math.pow(-2 * fly.t + 2, 3) / 2;
      cam.position.lerpVectors(fly.p0, fly.p1, k2); cam.quaternion.slerpQuaternions ? cam.quaternion.slerpQuaternions(fly.q0, fly.q1, k2) : T.Quaternion.slerp(fly.q0, fly.q1, cam.quaternion, k2);
      if (fly.t >= 1) { var d = fly.done; fly = null; if (d) d(); } }
    if (mk.visible) { mk.material.opacity = 0.55 + Math.sin(t * 6) * 0.35; }
    for (var i = 0; i < R.frames.length; i++) R.frames[i](dt, t);
    /* подписи над предметами */
    var show = R.mode === 'walk';
    for (var j = 0; j < R.items.length; j++) { var it = R.items[j], el = it.tag;
      if (!show || it.noTag || (R.tagOk && !R.tagOk(it))) { el.style.display = 'none'; continue; }
      tmp.set(it.at3 ? it.at3[0] : it.obj.position.x, it.tagY || 2.2, it.at3 ? it.at3[2] : it.obj.position.z);
      var dist2 = tmp.distanceTo(cam.position); tmp.project(cam);
      if (tmp.z > 1 || Math.abs(tmp.x) > 1.1 || Math.abs(tmp.y) > 1.1 || (dist2 > (it.tagFar || 9) && it !== R.next)) { el.style.display = 'none'; continue; }
      el.style.display = 'block'; el.style.transform = 'translate(' + ((tmp.x + 1) / 2 * innerWidth).toFixed(1) + 'px,' + ((1 - tmp.y) / 2 * innerHeight).toFixed(1) + 'px) translate(-50%,-100%) scale(' + Math.max(0.72, Math.min(1, 4 / dist2)).toFixed(2) + ')'; }
    ren.render(sc, cam);
  }
  setTimeout(loop, 0);
  return R;
}
window.KOMNATA = { create: create };
})();
