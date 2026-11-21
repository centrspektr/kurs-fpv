#!/usr/bin/env python3
# Список файлов курса для кнопки "Сохранить курс на устройство" (pwa.js, sw-kurs.js). 21.11.2026.
# Запуск из корня репозитория: python3 .github/fayly-kursa.py  -> fayly.json
# Пересобирать после добавления или удаления файлов (если забыть - лишнее просто не скачается, новое докачается при первом открытии).
import os, json
SKIP_DIR = {'.git', '.github', 'otkat', 'node_modules'}
SKIP_EXT = {'.md', '.py', '.sh', '.txt'}
SKIP_FILE = {'LICENSE', 'fayly.json', 'sw-kurs.js', 'CNAME'}
files, total = [], 0
for root, dirs, names in os.walk('.'):
    dirs[:] = sorted(d for d in dirs if d not in SKIP_DIR and not d.startswith('.'))
    for n in sorted(names):
        if n in SKIP_FILE or n.startswith('.') or os.path.splitext(n)[1].lower() in SKIP_EXT: continue
        p = os.path.join(root, n)[2:].replace(os.sep, '/')
        files.append(p); total += os.path.getsize(p)
json.dump({'bytes': total, 'files': files}, open('fayly.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(files), 'files', round(total / 1e6, 1), 'MB')
