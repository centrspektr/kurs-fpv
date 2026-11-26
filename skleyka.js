/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* skleyka.js - "склейка" неподвижных предметов помещения (21.11.2026, тред "Ускорить курс на слабых устройствах").
   Причина лагов в комнате модуля 2: в кадре ~1200 отдельных предметов (стол сборки - 543, город за окном - 406), на "высоком"
   качестве с отражением в полу и тенями это ~2500 команд рисования на кадр. Слабый ноутбук тратит на них весь кадр.
   Склейка: предметы с одинаковым видом (материал, фактура) внутри неподвижной части сцены сливаются в один объект.
   Картинка та же, команд рисования в разы меньше.
   SKLEYKA.watch(scene, steps) - заметить, что движется / мигает / меняет цвет (такое не склеиваем, склеиваем внутри него)
   SKLEYKA.merge(root, opt) -> { before, after } - склеить; opt.skip(o) - не трогать o и всё внутри
   Не склеиваются: помеченные userData.noMerge (и всё внутри), невидимые, прозрачные (кроме светящихся наложением),
   спрайты, линии, точки, предметы из нескольких материалов, модели со сжатыми координатами. */
(function () {
'use strict';
var T = window.THREE; if (!T) return;
var MAPS = ['map', 'specularMap', 'displacementMap', 'normalMap', 'bumpMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'emissiveMap', 'clearcoatMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap'];
var MAPS2 = ['aoMap', 'lightMap'];
var DEDUP = { MeshStandardMaterial: 1, MeshBasicMaterial: 1, MeshLambertMaterial: 1, MeshPhongMaterial: 1 };
/* на странице бывает две копии three (запасная) - сравниваем функции по тексту, а не по ссылке */
function fs(f) { return typeof f === 'function' ? f.toString().replace(/\s+/g, '').replace(/^(function)?[^(]*/, '') : String(f); }
var NOOP = fs(T.Object3D.prototype.onBeforeRender), OBC = fs(T.Material.prototype.onBeforeCompile), CPK = fs(T.Material.prototype.customProgramCacheKey);

/* ---------- кто движется ---------- */
function msig(m) { if (!m) return ''; if (Array.isArray(m)) return m.map(msig).join(';');
  return [m.uuid, m.color ? m.color.getHex() : '', m.emissive ? m.emissive.getHex() : '', m.emissiveIntensity, m.opacity, m.visible, m.map ? m.map.uuid : '', m.map ? m.map.offset.x + ',' + m.map.offset.y : ''].join(); }
function snap(sc) { var s = new Map(); sc.traverse(function (o) { s.set(o, [o.matrix.elements.join(), o.visible, o.isMesh ? msig(o.material) : '']); }); return s; }
/* снимок до и после шагов анимации: что поменялось - движется */
function watch(sc, step, n) { var dyn = new Set(), dynMat = new Set(), a;
  sc.updateMatrixWorld(true); a = snap(sc);
  for (var i = 0; i < (n || 1); i++) { if (step) step(i); sc.updateMatrixWorld(true); var b = snap(sc);
    b.forEach(function (v, o) { var w = a.get(o); if (!w) { dyn.add(o); return; } if (v[0] !== w[0] || v[1] !== w[1]) dyn.add(o); if (v[2] !== w[2]) dynMat.add(o); }); a = b; }
  return { dyn: dyn, mat: dynMat }; }

/* ---------- фактуры и материалы: одинаковые - в один ---------- */
var imgId = new WeakMap(), nImg = 0;
function iid(im) { if (!im) return 'x'; if (!imgId.has(im)) imgId.set(im, ++nImg); return imgId.get(im); }
function tkey(t) { return [iid(t.image), t.wrapS, t.wrapT, t.magFilter, t.minFilter, t.encoding, t.flipY, t.format, t.type, t.anisotropy, t.generateMipmaps, t.premultiplyAlpha, t.isCanvasTexture ? 'c' : '', t.isVideoTexture ? t.uuid : '', t.isCubeTexture ? t.uuid : ''].join(); }
function ident(t) { t.updateMatrix(); var e = t.matrix.elements; return Math.abs(e[0] - 1) < 1e-9 && Math.abs(e[4] - 1) < 1e-9 && Math.abs(e[1]) < 1e-9 && Math.abs(e[3]) < 1e-9 && Math.abs(e[6]) < 1e-9 && Math.abs(e[7]) < 1e-9; }
function make(C) {
  var canon = {}, mats = {};
  /* фактура с тем же рисунком, но без сдвига/повтора (повтор переносим в координаты) */
  function ctex(t) { if (!t) return null; var k = tkey(t); if (canon[k]) return canon[k];
    if (ident(t)) return (canon[k] = t);
    var c = t.clone(); c.offset.set(0, 0); c.repeat.set(1, 1); c.rotation = 0; c.center.set(0, 0); c.updateMatrix(); c.needsUpdate = true; C.made.push(c); return (canon[k] = c); }
  function uvMap(m) { for (var i = 0; i < MAPS.length; i++) if (m[MAPS[i]]) return m[MAPS[i]]; return null; }
  function uv2Map(m) { return m.aoMap || m.lightMap || null; }
  /* можно ли повтор фактуры перенести в координаты: только при RepeatWrapping (или без повтора) */
  function bakeOk(t) { return !t || ident(t) || (t.wrapS === T.RepeatWrapping && t.wrapT === T.RepeatWrapping); }
  function key(m) {
    if (!DEDUP[m.type] || fs(m.onBeforeCompile) !== OBC || fs(m.customProgramCacheKey) !== CPK || m.userData.noDedup || C.dynMats.has(m)) return { k: m.uuid, m: m, bake: false };
    var a = uvMap(m), b = uv2Map(m); if (!bakeOk(a) || !bakeOk(b)) return { k: m.uuid, m: m, bake: false };
    var p = [m.type, m.side, m.transparent, m.opacity, m.blending, m.depthWrite, m.depthTest, m.colorWrite, m.alphaTest, m.toneMapped, m.fog, m.vertexColors, m.wireframe, m.flatShading, m.visible, m.polygonOffset, m.polygonOffsetFactor, m.polygonOffsetUnits, m.premultipliedAlpha, m.dithering, m.skinning, m.morphTargets];
    ['color', 'emissive', 'specular'].forEach(function (c) { p.push(m[c] ? m[c].getHexString() : ''); });
    ['roughness', 'metalness', 'emissiveIntensity', 'envMapIntensity', 'aoMapIntensity', 'lightMapIntensity', 'shininess', 'reflectivity', 'refractionRatio', 'combine', 'bumpScale', 'displacementScale', 'displacementBias', 'normalMapType'].forEach(function (c) { p.push(m[c]); });
    p.push(m.normalScale ? m.normalScale.x + ',' + m.normalScale.y : '');
    MAPS.concat(MAPS2).forEach(function (n) { p.push(m[n] ? tkey(m[n]) : ''); });
    p.push(m.envMap ? m.envMap.uuid : '');
    var k = p.join('|'); return { k: k, m: m, bake: true }; }
  /* общий материал для группы: фактуры без повтора */
  function canonMat(info) { if (!info.bake) return info.m; if (mats[info.k]) return mats[info.k]; var m = info.m, need = false;
    MAPS.concat(MAPS2).forEach(function (n) { if (m[n] && ctex(m[n]) !== m[n]) need = true; });
    if (!need) return (mats[info.k] = m);
    var c = m.clone(); MAPS.concat(MAPS2).forEach(function (n) { if (m[n]) c[n] = ctex(m[n]); }); C.made.push(c); return (mats[info.k] = c); }
  return { key: key, canonMat: canonMat, uvMap: uvMap, uv2Map: uv2Map }; }

/* ---------- можно ли склеить этот предмет ---------- */
function okWhy(o, tr) {
  if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || o.userData.noMerge) return 'r1';
  var m = o.material, g = o.geometry; if (!m || Array.isArray(m) || !m.isMaterial || m.isShaderMaterial || m.isRawShaderMaterial || m.isMeshDepthMaterial || m.isPointsMaterial) return 'r2';
  if (!g || !g.isBufferGeometry || !g.attributes.position) return 'r3';
  if (fs(o.onBeforeRender) !== NOOP || fs(o.onAfterRender) !== NOOP || !o.frustumCulled || o.layers.mask !== 1) return 'r4';
  if (m.transparent && !(m.blending === T.AdditiveBlending && !m.depthWrite) && !(tr && m.depthWrite && m.depthTest && m.blending === T.NormalBlending)) return 'r5';   /* tr (opt.transp, 26.11): полупрозрачное, которое пишет глубину (неоновые полосы зданий), тоже можно - внутри одного здания */
  if (g.drawRange.start !== 0 || g.drawRange.count !== Infinity) return 'r6';   /* группы граней при одном материале three не учитывает */
  for (var k in g.morphAttributes) if (g.morphAttributes[k] && g.morphAttributes[k].length) return 'r7';
  for (var n in g.attributes) { var a = g.attributes[n]; if (!a.isBufferAttribute || a.isInterleavedBufferAttribute || !(a.array instanceof Float32Array) || a.normalized) return 'r8';
    if (n !== 'position' && n !== 'normal' && n !== 'uv' && n !== 'uv2' && n !== 'color') return 'r9'; }
  if (g.index && !(g.index.array instanceof Uint16Array || g.index.array instanceof Uint32Array)) return 'r10';
  return ''; }
function okMesh(o, tr) { return !okWhy(o, tr); }

/* ---------- склейка ---------- */
var _m = new T.Matrix4(), _n = new T.Matrix3(), _v = new T.Vector3(), _u = new T.Vector3();
function build(list, mat, C) {
  var g0 = list[0].o.geometry, names = Object.keys(g0.attributes), nv = 0, ni = 0;
  list.forEach(function (it) { var g = it.o.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
  var out = {}, sizes = {}; names.forEach(function (n) { sizes[n] = g0.attributes[n].itemSize; out[n] = new Float32Array(nv * sizes[n]); });
  var idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), vo = 0, io = 0;
  list.forEach(function (it) { var o = it.o, g = o.geometry, M = it.M, cnt = g.attributes.position.count, flip = M.determinant() < 0;
    _n.getNormalMatrix(M);
    var P = g.attributes.position, A = out.position; for (var i = 0; i < cnt; i++) { _v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(M); A[(vo + i) * 3] = _v.x; A[(vo + i) * 3 + 1] = _v.y; A[(vo + i) * 3 + 2] = _v.z; }
    if (out.normal) { var N = g.attributes.normal, B = out.normal; for (i = 0; i < cnt; i++) { _u.set(N.getX(i), N.getY(i), N.getZ(i)).applyMatrix3(_n).normalize(); B[(vo + i) * 3] = _u.x; B[(vo + i) * 3 + 1] = _u.y; B[(vo + i) * 3 + 2] = _u.z; } }
    ['uv', 'uv2'].forEach(function (n) { if (!out[n]) return; var U = g.attributes[n], D = out[n], t = n === 'uv' ? it.t1 : it.t2, e = t && !ident(t) ? t.matrix.elements : null;
      for (var j = 0; j < cnt; j++) { var x = U.getX(j), y = U.getY(j); if (e) { var x2 = e[0] * x + e[3] * y + e[6], y2 = e[1] * x + e[4] * y + e[7]; x = x2; y = y2; } D[(vo + j) * 2] = x; D[(vo + j) * 2 + 1] = y; } });
    if (out.color) { var Cc = g.attributes.color, s = sizes.color, E = out.color; for (i = 0; i < cnt; i++) for (var q = 0; q < s; q++) E[(vo + i) * s + q] = Cc.array[i * s + q]; }
    if (g.index) { var I = g.index.array; for (i = 0; i < I.length; i += 3) { idx[io++] = I[i] + vo; if (flip) { idx[io++] = I[i + 2] + vo; idx[io++] = I[i + 1] + vo; } else { idx[io++] = I[i + 1] + vo; idx[io++] = I[i + 2] + vo; } } }
    else for (i = 0; i < cnt; i += 3) { idx[io++] = vo + i; if (flip) { idx[io++] = vo + i + 2; idx[io++] = vo + i + 1; } else { idx[io++] = vo + i + 1; idx[io++] = vo + i + 2; } }
    vo += cnt; });
  var geo = new T.BufferGeometry(); names.forEach(function (n) { geo.setAttribute(n, new T.BufferAttribute(out[n], sizes[n])); }); geo.setIndex(new T.BufferAttribute(idx, 1));
  geo.computeBoundingBox(); geo.computeBoundingSphere();
  var me = new T.Mesh(geo, mat); var f = list[0].o; me.castShadow = f.castShadow; me.receiveShadow = f.receiveShadow; me.renderOrder = f.renderOrder; me.name = 'skleyka';
  me.userData.skleyka = list.length; me.userData.adopted = true; return me; }

/* root - неподвижная часть сцены (сама может двигаться целиком). opt.watch - результат watch().
   opt.anchor(o) - true: склеенное внутри o кладём в o (например, предмет, на который нажимают - нажатие должно попадать в него).
   opt.tag(o, tagРодителя) - метка (например, "отражается в полу"): предметы с разными метками не смешиваем; в ответе made: [{ mesh, tag }] */
function merge(root, opt) { opt = opt || {}; var w = opt.watch || { dyn: new Set(), mat: new Set() }, C = { made: [], dynMats: new Set() };
  w.mat.forEach(function (o) { if (o.material) [].concat(o.material).forEach(function (m) { C.dynMats.add(m); }); });
  var K = make(C), before = 0, after = 0, inner = [], groups = {}, order = [], invs = new Map(), made = [];
  root.updateMatrixWorld(true);
  function inv(a) { var m = invs.get(a); if (!m) { m = new T.Matrix4().copy(a.matrixWorld).invert(); invs.set(a, m); } return m; }
  function walk(o, top, anc, tag) {
    if (!top) { if (o.userData.noMerge || !o.visible || (opt.skip && opt.skip(o))) return;
      if (w.dyn.has(o)) { inner.push([o, tag]); return; }   /* движется - склеиваем внутри него отдельно */
      if (opt.anchor && opt.anchor(o)) anc = o; }
    if (opt.tag) tag = opt.tag(o, tag);
    if (o.isMesh) { before++;
      if (!top && okMesh(o, opt.transp) && !w.mat.has(o) && o.children.length === 0) {
        var info = K.key(o.material), m = o.material, g = o.geometry;
        var t1 = info.bake ? K.uvMap(m) : null, t2 = info.bake ? K.uv2Map(m) : null;
        var ak = Object.keys(g.attributes).sort().map(function (n) { return n + g.attributes[n].itemSize; }).join();
        if ((t1 && !g.attributes.uv) || (t2 && !g.attributes.uv2)) { info = { k: m.uuid, m: m, bake: false }; t1 = t2 = null; }
        var k = info.k + '#' + ak + '#' + o.castShadow + o.receiveShadow + o.renderOrder + '#' + anc.id + '#' + (tag || '');
        if (!groups[k]) { groups[k] = { info: info, list: [], anc: anc, tag: tag }; order.push(k); }
        groups[k].list.push({ o: o, M: new T.Matrix4().multiplyMatrices(inv(anc), o.matrixWorld), t1: t1, t2: t2 });
        return; }
      after++; }
    for (var i = 0; i < o.children.length; i++) walk(o.children[i], false, anc, tag); }
  walk(root, true, root, opt.tag0);
  order.forEach(function (k) { var G = groups[k]; if (G.list.length < 2) { after++; return; }
    var me = build(G.list, K.canonMat(G.info), C); G.anc.add(me); after++; made.push({ mesh: me, tag: G.tag });
    if (opt.audit) G.list.forEach(function (it) { var ch = []; for (var p = it.o.parent; p && p !== G.anc; p = p.parent) ch.push(p); opt.audit.push({ o: it.o, up: ch, mesh: me, m0: msig(it.o.material) }); });
    G.list.forEach(function (it) { if (it.o.parent) it.o.parent.remove(it.o); }); });
  var res = { before: before, after: after, made: made };
  inner.forEach(function (e) { var r = merge(e[0], { watch: w, skip: opt.skip, anchor: opt.anchor, tag: opt.tag, tag0: e[1], transp: opt.transp, audit: opt.audit }); res.before += r.before; res.after += r.after; res.made = res.made.concat(r.made); });
  return res; }

/* отладка: почему предметы не склеились */
function why(root, w) { var r = {}; function c(k) { r[k] = (r[k] || 0) + 1; }
  (function walk(o, top) { if (!top) { if (o.userData.noMerge) return c('noMerge'); if (!o.visible) return c('hidden'); if (w && w.dyn.has(o)) c('dyn'); }
    if (o.isMesh) { var y = okWhy(o); if (y) c('notOk:' + y); else if (w && w.mat.has(o)) c('matChange'); else c('ok'); }
    o.children.forEach(function (k) { walk(k, false); }); })(root, true); return r; }
/* проверка (26.11, ?skdbg): после склейки исходные предметы больше не рисуются. Если код потом прячет, двигает или перекрашивает такой предмет
   (или группу, в которой он лежал) - на экране это уже не видно. audit(list) запоминает состояние, auditCheck() возвращает список таких случаев:
   их надо пометить userData.noMerge. list - то, что merge сложил в opt.audit. */
var AUD = [];
function path(o) { var s = []; for (var p = o; p; p = p.parent) s.push(p.name || p.type); return s.reverse().join('/'); }
function audit(list) { list.forEach(function (a) { a.up.concat([a.o]).forEach(function (x) { if (x.__aud) return; x.updateMatrix(); x.__aud = { v: x.visible, m: x.matrix.elements.join(), s: x.isMesh ? msig(x.material) : '', p: path(x), who: a.mesh.name + ':' + (a.o.geometry ? a.o.geometry.type : '') }; AUD.push(x); }); }); }
function auditCheck() { var out = []; AUD.forEach(function (x) { var a = x.__aud; if (a.bad) return; x.updateMatrix(); var why = x.visible !== a.v ? 'visible' : x.matrix.elements.join() !== a.m ? 'matrix' : (x.isMesh && msig(x.material) !== a.s) ? 'material' : ''; if (why) { a.bad = why; out.push(why + ' ' + a.p + ' [' + a.who + ']' + (x.isMesh && x.material && x.material.color ? ' #' + x.material.color.getHexString() : '')); } }); return out; }
window.SKLEYKA = { watch: watch, merge: merge, okMesh: okMesh, why: why, audit: audit, auditCheck: auditCheck };
})();
