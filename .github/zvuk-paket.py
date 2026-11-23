#!/usr/bin/env python3
# Курс FPV: упаковка записей голоса (19.11.2026).
# Зачем: GitVerse Pages выкладывает файлы по одному и не успевал выложить 2830 записей - публикация обрывалась, сайт оставался пустым.
# Записи лежат в 16 пакетах zvuk/p/0.mp3 ... zvuk/p/f.mp3 (по первой букве имени), где лежит каждая - в zvuk/paket.json:
#   { "v": метка версии, "f": { "3/g-xxxxxxxx.mp3": [начало, длина], ... } }
# zvuk/spisok.json не меняется: { ключ фразы: "3/g-xxxxxxxx.mp3" }. Плеер (golos*.js, G.zget) берёт запись из пакета запросом части файла.
# Новые записи: положить как раньше в zvuk/<первая буква>/g-xxxxxxxx.mp3, дописать в spisok.json и запустить
#   python3 .github/zvuk-paket.py
# Скрипт достанет старые записи из пакетов, добавит новые, пересоберёт пакеты и удалит отдельные файлы.
# 23.11.2026: стартовый пакет zvuk/p/s.mp3 - копии записей из zvuk/start.json (приветствие при входе, ~50 КБ).
#   GitVerse не отдаёт кусок файла (Range), только пакет целиком (~1,8 МБ), и приветствие ждало 4 пакета (до 7 МБ).
#   Маленький стартовый пакет плеер (golos-proba4.js) качает сразу при открытии сайта. В paket.json: "s": { "v": метка, "f": {...} }.
#   Метка "v" считается только по пакетам 0-f, как раньше (старый плеер golos-proba3.js стартовый пакет не знает и не замечает).
import json, os, hashlib, glob, sys
Z = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'zvuk')
spisok = json.load(open(os.path.join(Z, 'spisok.json'), encoding='utf-8'))
nado = sorted(set(spisok.values()))
old = {}
pj = os.path.join(Z, 'paket.json')
if os.path.exists(pj):
    pk = json.load(open(pj, encoding='utf-8'))
    bufs = {}
    for name, (a, n) in pk['f'].items():
        p = name[0]
        if p not in bufs:
            bufs[p] = open(os.path.join(Z, 'p', p + '.mp3'), 'rb').read()
        old[name] = bufs[p][a:a + n]
for name in nado:
    f = os.path.join(Z, name)
    if os.path.exists(f):
        old[name] = open(f, 'rb').read()
net = [x for x in nado if x not in old]
if net:
    print('Нет записей:', len(net), net[:10]); sys.exit(1)
os.makedirs(os.path.join(Z, 'p'), exist_ok=True)
out = {}
h = hashlib.md5()
for p in '0123456789abcdef':
    data = bytearray()
    for name in [x for x in nado if x[0] == p]:
        b = old[name]
        out[name] = [len(data), len(b)]
        data += b
    open(os.path.join(Z, 'p', p + '.mp3'), 'wb').write(data)
    h.update(data)
res = {'v': h.hexdigest()[:8], 'f': out}
sj = os.path.join(Z, 'start.json')
if os.path.exists(sj):
    sdata, sout = bytearray(), {}
    for name in json.load(open(sj, encoding='utf-8')):
        if name in old and name not in sout:
            sout[name] = [len(sdata), len(old[name])]
            sdata += old[name]
    open(os.path.join(Z, 'p', 's.mp3'), 'wb').write(sdata)
    res['s'] = {'v': hashlib.md5(sdata).hexdigest()[:8], 'f': sout}
    print('Стартовый пакет:', len(sout), 'записей,', len(sdata), 'байт')
json.dump(res, open(pj, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for name in nado:
    f = os.path.join(Z, name)
    if os.path.exists(f):
        os.remove(f)
for d in glob.glob(os.path.join(Z, '?')):
    if os.path.isdir(d) and not os.listdir(d):
        os.rmdir(d)
print('Записей:', len(out), 'пакетов: 16, метка', h.hexdigest()[:8])
