/* three-zapas.js (12.11.2026): запасная загрузка three.js. Если после three.min.js движка нет (файл пришёл оборванным с GitVerse,
   браузер держит испорченную копию или расширение подменило загрузчик модулей) - качаем файл заново мимо кэша и запускаем так,
   чтобы чужие define/module/exports его не видели. Ставится сразу после three.min.js. */
(function (w) { if (w.THREE) return;
  for (var n = 0; n < 2 && !w.THREE; n++) { try { var x = new XMLHttpRequest(); x.open('GET', 'three.min.js?r=' + Date.now() + n, false); x.send();
    if (x.status === 200 && x.responseText.length > 100000) new Function('define', 'module', 'exports', x.responseText).call(w); } catch (e) {} }
  w.THREE_ZAPAS = !!w.THREE; })(window);
