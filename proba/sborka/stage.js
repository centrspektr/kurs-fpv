/* Этапы игры: раскладка деталей, камера, эффекты. Использует SB() из scene.js */
(function () {
'use strict';
window.SBStage = function (A) {
  var THREE = window.THREE, P = A.P, D = A.D, V = A.V, S = A.S, glow = A.glow, mesh = A.mesh, M = A.M;
  var all = ['frame', 'esc', 'fc', 'vtx', 'so', 'top', 'cam', 'ant', 'rx', 'batt'];
  var home = {}; function rem(o, k) { home[k] = { p: o.position.clone(), r: o.rotation.clone() }; }
  all.forEach(function (k) { rem(P[k], k); }); P.motors.forEach(function (m, i) { rem(m, 'm' + i); }); P.props.forEach(function (m, i) { rem(m, 'p' + i); });
  function put(o, k, on, mp, rot) { var h = home[k]; if (on) { o.position.copy(h.p); o.rotation.copy(h.r); } else { o.position.set(mp[0], mp[1], mp[2]); o.rotation.set(0, rot || 0, 0); } o.visible = true; }
  var fx = new THREE.Group(); S.add(fx);
  function clearFx() { while (fx.children.length) fx.remove(fx.children[0]); }

  /* паяльник: наконечник в точке t, ручка уходит в направлении dir */
  function iron(t, dir) { var g = new THREE.Group(), d = dir.clone().normalize();
    var grip = new THREE.MeshStandardMaterial({ color: 0x8b3dff, roughness: .5, metalness: .2 }); grip.color.convertSRGBToLinear();
    var tip = mesh(new THREE.ConeGeometry(.22, 1.6, 16), M.steel, 0, .8, 0, g); tip.rotation.x = Math.PI;
    mesh(new THREE.CylinderGeometry(.3, .3, 5, 16), M.steel, 0, 4.1, 0, g);
    mesh(new THREE.CylinderGeometry(.75, .65, 3, 20), M.dark, 0, 7.6, 0, g);
    mesh(new THREE.CylinderGeometry(.9, .9, 9, 20), grip, 0, 13.6, 0, g);
    for (var i = 0; i < 6; i++) mesh(new THREE.TorusGeometry(.92, .08, 6, 20), M.dark, 0, 10 + i * 1.3, 0, g).rotation.x = Math.PI / 2;
    A.tube([V(0, 18, 0), V(0, 21, 0), V(2, 24, 3), V(6, 25, 8)], .35, M.wireK, g);
    g.position.copy(t); g.quaternion.setFromUnitVectors(V(0, 1, 0), d); fx.add(g);
    var hot = glow('#ff7a2a', 2.2, .95); hot.position.copy(t); fx.add(hot); var hot2 = glow('#ffd166', .9, 1); hot2.position.copy(t); fx.add(hot2);
    return g; }
  function smoke(t) { for (var i = 0; i < 9; i++) { var s = glow('#d8d2ff', 1.2 + i * .7, .22 - i * .02); s.position.set(t.x + Math.sin(i * 1.7) * .35 * i, t.y + .5 + i * .9, t.z + Math.cos(i * 1.3) * .25 * i); fx.add(s); } }
  function ring(p, col, r) { var m = new THREE.Mesh(new THREE.TorusGeometry(r || 1.25, .07, 8, 48), A.neon(col)); m.rotation.x = Math.PI / 2; m.position.copy(p); fx.add(m); var g = glow('#' + new THREE.Color(col).getHexString(), (r || 1.25) * 4, .55); g.position.copy(p); fx.add(g); return m; }
  function dash(a, b, col) { var g = new THREE.BufferGeometry().setFromPoints([a, b]); var l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: col, dashSize: .35, gapSize: .25, transparent: true, opacity: .9 })); l.computeLineDistances(); fx.add(l); }
  function holo() { var t = A.cTex(1024, 640, function (x, w, h) {
      x.fillStyle = 'rgba(10,40,80,.35)'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(124,243,255,.15)'; x.lineWidth = 1; for (var i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (i = 0; i < h; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
      x.strokeStyle = '#7cf3ff'; x.lineWidth = 4; x.strokeRect(6, 6, w - 12, h - 12); x.shadowColor = '#7cf3ff'; x.shadowBlur = 14;
      x.fillStyle = 'rgba(30,120,90,.45)'; x.strokeStyle = '#5effc4'; x.lineWidth = 3; x.fillRect(330, 150, 360, 360); x.strokeRect(330, 150, 360, 360);
      x.font = '700 30px monospace'; x.fillStyle = '#e9fff6'; x.fillText('ПОЛЁТНЫЙ КОНТРОЛЛЕР', 344, 130);
      var pads = [['M1', 360, 190], ['M2', 640, 190], ['M3', 360, 470], ['M4', 640, 470], ['VBAT', 450, 490], ['GND', 560, 490]];
      pads.forEach(function (p) { x.fillStyle = '#e6b94a'; x.fillRect(p[1] - 22, p[2] - 18, 44, 30); x.fillStyle = '#e9fff6'; x.font = '700 22px monospace'; x.fillText(p[0], p[1] - 24, p[2] + (p[2] > 300 ? -24 : 44)); });
      function wire(c, pts) { x.strokeStyle = c; x.shadowColor = c; x.lineWidth = 9; x.beginPath(); x.moveTo(pts[0], pts[1]); x.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]); x.stroke(); }
      wire('#ff3b4a', [950, 600, 800, 600, 470, 600, 450, 505]);
      x.setLineDash([14, 12]); wire('#bfc6d8', [950, 560, 760, 560, 600, 560, 560, 505]); x.setLineDash([]);
      x.fillStyle = '#ff3b4a'; x.beginPath(); x.arc(950, 600, 16, 0, 7); x.fill(); x.fillStyle = '#20232c'; x.strokeStyle = '#bfc6d8'; x.lineWidth = 3; x.beginPath(); x.arc(950, 560, 16, 0, 7); x.fill(); x.stroke();
      x.font = '800 26px sans-serif'; x.fillStyle = '#ff8a92'; x.fillText('+ ПЛЮС', 860, 640); x.fillStyle = '#e9fff6'; x.fillText('− МИНУС', 820, 545);
      x.strokeStyle = '#5effc4'; x.lineWidth = 5; x.beginPath(); x.arc(450, 505, 34, 0, 7); x.stroke(); x.font = '800 28px sans-serif'; x.fillStyle = '#5effc4'; x.fillText('✓', 434, 470);
      x.strokeStyle = '#ffd166'; x.lineWidth = 4; x.setLineDash([8, 8]); x.beginPath(); x.arc(560, 505, 38, 0, 7); x.stroke(); x.setLineDash([]); });
    var pl = new THREE.Mesh(new THREE.PlaneGeometry(22, 13.75), new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); return pl; }
  function blur(p, col) { var t = A.cTex(256, 256, function (x, w) { var g = x.createRadialGradient(w / 2, w / 2, w * .05, w / 2, w / 2, w / 2); g.addColorStop(0, col + 'aa'); g.addColorStop(.25, col + '22'); g.addColorStop(.85, col + '55'); g.addColorStop(.95, col + 'cc'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.beginPath(); x.arc(w / 2, w / 2, w / 2, 0, 7); x.fill(); });
    var m = new THREE.Mesh(new THREE.CircleGeometry(3.9, 48), new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.copy(p); fx.add(m); }
  function sparks(c, n, r) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, b = Math.random() * 3.14 - 1.2, rr = r * (.5 + Math.random() * .6); var s = glow(['#ffd166', '#c77dff', '#5effc4', '#ff7ce0', '#7cf3ff'][i % 5], .5 + Math.random() * .9, .9); s.position.set(c.x + Math.cos(a) * Math.cos(b) * rr, c.y + Math.sin(b) * rr * .7, c.z + Math.sin(a) * Math.cos(b) * rr); fx.add(s); } }

  function layout(inst, extra) { /* inst: какие детали уже стоят на дроне */
    D.position.set(0, 0, 2); D.rotation.set(0, 0, 0);
    var on = function (k) { return inst.indexOf(k) >= 0; };
    put(P.frame, 'frame', true); put(P.so, 'so', on('so'), [-11, .1, -6], 0); P.so.visible = on('so') || !!(extra && extra.showSo);
    put(P.esc, 'esc', on('esc'), [-11, .06, 6.5], .3); put(P.fc, 'fc', on('fc'), [-11.5, .06, 1], -.2); put(P.vtx, 'vtx', on('vtx'), [-12.5, .05, -3.5], .4);
    put(P.top, 'top', on('top'), [12, .02, -6], .5); put(P.cam, 'cam', on('cam'), [11, 0, 5], -.8); put(P.ant, 'ant', on('ant'), [15, 0, 1], .3); put(P.rx, 'rx', on('rx'), [9, .05, -1], 0); P.rx.visible = on('rx');
    P.batt.visible = on('batt'); P.ant.visible = on('ant') || !!(extra && extra.showAnt);
    P.motors.forEach(function (m, i) { put(m, 'm' + i, on('m' + i), [-4.5 + i * 3, 0, 11.5], i); });
    P.wires.forEach(function (w, i) { w.visible = on('w' + i); });
    P.props.forEach(function (p, i) { put(p, 'p' + i, on('props'), [6 + (i % 2) * 8.5, .3 + i * .12, 12.5 + Math.floor(i / 2) * 1.2], i * .7); p.rotation.x = on('props') ? 0 : 0; }); }
  var all8 = ['so', 'esc', 'fc', 'vtx', 'top', 'cam', 'ant', 'rx', 'batt', 'm0', 'm1', 'm2', 'm3', 'w0', 'w1', 'w2', 'w3', 'props'];
  function W(p) { return V(p.x, p.y, p.z + 2); } /* из координат дрона в мир */

  var ST = {
    1: function () { clearFx(); layout(['so']); A.G.position.set(9, 13, -2); A.G.rotation.set(.1, -.5, .05); return { p: [8, 30, 48], l: [0, 6, -6], f: 50 }; },
    2: function () { clearFx(); layout(['so', 'm0']); var m1 = P.motors[1]; m1.position.set(-4.6, 4.8, -4.6); m1.rotation.set(.15, .6, -.1); P.motors[1].visible = true;
      var slot = W(V(-4.6, .5, -4.6)); ring(slot, 0xc77dff, 1.3); dash(V(-4.6, 4.5, -2.6), V(-4.6, .9, -2.6), 0xc77dff);
      [2, 3].forEach(function (i) { var q = A.MP[i]; ring(W(V(q[0], .5, q[1])), 0x6b4fa8, 1.15); });
      A.G.position.set(6, 12, -7); A.G.rotation.set(.2, .6, 0); return { p: [3, 29, 21], l: [-1, 0, -1.2], f: 40 }; },
    3: function () { clearFx(); layout(['so', 'esc', 'm0', 'm1', 'm2', 'm3', 'w0', 'w2', 'w3']); P.wires[1].visible = true;
      var pad = W(V(-1.33, 1.25, -1.33)); iron(pad, V(.75, 1.1, -.7)); smoke(pad);
      A.tube([V(pad.x - 5, pad.y + 5, pad.z + 2), V(pad.x - 2.2, pad.y + 1.8, pad.z + 1), V(pad.x + .25, pad.y + .15, pad.z + .3)], .07, M.steel, fx);
      var blob = mesh(new THREE.SphereGeometry(.22, 16, 10), M.steel, pad.x, pad.y - .02, pad.z, fx); blob.scale.set(1, .55, 1);
      A.G.visible = false; return { p: [-6.5, 6.5, 8], l: [-1.4, 1.4, .9], f: 34 }; },
    4: function () { clearFx(); A.G.visible = true; layout(['so', 'esc', 'fc', 'm0', 'm1', 'm2', 'm3', 'w0', 'w1', 'w2', 'w3', 'batt']);
      var h = holo(); h.position.set(0, 13.5, 0); h.rotation.x = -.42; fx.add(h);
      var cone = new THREE.Mesh(new THREE.CylinderGeometry(9, 1.4, 10, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x3fd8ff, transparent: true, opacity: .08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); cone.position.set(0, 8, 2); fx.add(cone);
      var pg = glow('#7cf3ff', 7, .7); pg.position.set(0, 3.2, 2); fx.add(pg);
      A.G.position.set(-11, 15, 0); A.G.rotation.set(.1, .9, 0); return { p: [2, 18, 33], l: [0, 9.5, 1], f: 46 }; },
    5: function () { clearFx(); layout(['so', 'esc', 'm0', 'm1', 'm2', 'm3', 'w0', 'w1', 'w2', 'w3', 'batt'], {}); var f = P.fc; f.position.set(0, 6.2, 0); f.rotation.set(0, .25, .06);
      [[1.5, -2.6], [-1.5, -2.6], [1.5, 2.6], [-1.5, 2.6]].forEach(function (q) { dash(W(V(q[0], 6, q[1])), W(V(q[0], 3, q[1])), 0xc77dff); var g = glow('#c77dff', 1.2, .9); g.position.copy(W(V(q[0], 3.05, q[1]))); fx.add(g); });
      var gh = new THREE.Mesh(new THREE.BoxGeometry(3.5, .14, 3.5), new THREE.MeshBasicMaterial({ color: 0xc77dff, transparent: true, opacity: .25, depthWrite: false })); gh.position.copy(W(V(0, 1.96, 0))); fx.add(gh);
      var e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.5, .14, 3.5)), A.neon(0xc77dff)); e.position.copy(gh.position); fx.add(e);
      A.G.position.set(-7, 11, -4); A.G.rotation.set(0, 1.0, 0); return { p: [-12, 9, 15], l: [0, 5.6, 1.5], f: 42 }; },
    6: function () { clearFx(); A.G.visible = true; layout(all8); D.position.set(0, 9, 2); D.rotation.set(.08, .5, -.06);
      P.props.forEach(function (p, i) { p.visible = false; var w = new THREE.Vector3(); P.motors[i].getWorldPosition(w); D.updateMatrixWorld(true); });
      D.updateMatrixWorld(true); P.motors.forEach(function (m, i) { var w = new THREE.Vector3(); m.localToWorld(w.set(0, 2.0, 0)); blur(w, i % 2 ? '#ff4fd8' : '#3ee6ff'); });
      var sh = glow('#7cf3ff', 26, .25); sh.position.set(0, .3, 2); fx.add(sh); sparks(V(0, 10, 2), 40, 16);
      A.G.position.set(-9, 14, -5); A.G.rotation.set(0, .8, .2); return { p: [14, 22, 44], l: [0, 7.5, 0], f: 34 }; }
  };
  var run = function (n) { var c = ST[n](); A.cam.fov = c.f; A.cam.updateProjectionMatrix(); A.cam.position.set(c.p[0], c.p[1], c.p[2]); A.cam.lookAt(c.l[0], c.l[1], c.l[2]); A.render(); return c; };
  run.api = { layout: layout, iron: iron, smoke: smoke, ring: ring, dash: dash, holo: holo, blur: blur, sparks: sparks, clearFx: clearFx, fx: fx, home: home, put: put, W: W, ST: ST, all8: all8 };
  return run;
};
})();
