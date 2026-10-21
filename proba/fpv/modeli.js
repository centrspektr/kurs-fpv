/* Готовые 3D-модели для карты курса (файлы .glb лежат в fpv/modeli/, лицензия CC0, см. modeli/LICENSE.txt).
   Ключ - что заменяем, значение - путь к файлу. Нет ключа или файла - остаётся здание из кода.
   1 школа безопасности, 2 мастерская, 3 аккумуляторная, 4 вышка, 5 стадион, 6 башня аса, k киоски боковых нитей,
   зоны заданий: zs вход, zc материал, zg тренажёр, zq тест, zf полёт, zt тренер, zx итог; drone - дроны над городом и проводник.
   Дрон оставлен из кода: готового FPV-квадрика в наборах нет. */
window.GOROD_MODELS = {
  1: 'modeli/shkola.glb',
  2: 'modeli/masterskaya.glb',
  3: 'modeli/akkumulyatornaya.glb',
  4: 'modeli/vyshka.glb',
  5: 'modeli/stadion.glb',
  6: 'modeli/bashnya-asa.glb',
  k: 'modeli/kiosk.glb',
  zs: 'modeli/vhod.glb',
  zt: 'modeli/trener.glb'
};
