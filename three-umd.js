/* three-umd.js (11.11.2026): защита от расширений браузера, которые подкладывают на страницу свой загрузчик модулей (define.amd, module, exports).
   С таким загрузчиком three.min.js не создаёт window.THREE, и город не запускается (у Alexandr в Edge: prosto-new.html?why=three).
   Подключается два раза: перед three.min.js - прячет чужой загрузчик, после - возвращает его на место. */
(function (w) {
  var N = ['define', 'module', 'exports'];
  if (!w.__umdSave) { var s = {}; N.forEach(function (k) { s[k] = w[k]; try { w[k] = undefined; } catch (e) {} }); w.__umdSave = s; }
  else { var s2 = w.__umdSave; N.forEach(function (k) { try { w[k] = s2[k]; } catch (e) {} }); try { delete w.__umdSave; } catch (e) { w.__umdSave = undefined; } }
})(window);
