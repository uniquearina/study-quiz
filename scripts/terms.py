#!/usr/bin/env python3
"""Сверка покрытия: термины из конспектов должны встречаться в вопросах своего урока.

Запуск (из папки проекта): python3 <скилл>/scripts/terms.py ["часть названия урока" ...]
Конспекты — notes/<урок>.md; урок тренажёра находится по полю lesson (совпадает с именем файла).
Термин — это **жирный текст** или начало строки «X — это …». Пропуски часто ложные
(служебные слова, целые фразы), поэтому каждый проверь глазами."""
import glob, json, os, re, subprocess, sys, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import trainer_dir
TR = trainer_dir()
NOTES = os.path.join(os.path.dirname(TR), "notes")
def norm(s): return re.sub(r"\s+", " ", s.lower().replace("ё", "е")).strip(" .,:;«»\"()—-*")
def stem(w): return w[:max(4, len(w) - 2)] if len(w) > 5 else w
fname = lambda t: unicodedata.normalize("NFC", t).replace(":", "_").replace("/", "_")
js = subprocess.run(["node", "-e", "global.window={}; for (const f of process.argv.slice(1)) { try { require(f) } catch(e){} }"
                     "console.log(JSON.stringify(window.QUIZ_PARTS||[]))", *glob.glob(TR + "/quiz-data*.js")], capture_output=True, text=True).stdout
lesson2text = {}
for p in json.loads(js):
    for t in p["topics"]:
        qs = [q for q in p["questions"] if q["topic"] == t["id"]]
        lesson2text[norm(fname(t.get("lesson") or t["title"]))] = norm(json.dumps(qs, ensure_ascii=False))
only = [a for a in sys.argv[1:] if not os.path.isdir(a)]
for f in sorted(glob.glob(NOTES + "/*.md")):
    title = fname(os.path.basename(f)[:-3])
    if only and not any(o.lower() in title.lower() for o in only): continue
    text = open(f, encoding="utf-8").read()
    terms = {t.strip() for t in re.findall(r"\*\*([^*\n]{3,60}?)\*\*", text) if not t.strip().endswith("?")}
    for line in text.splitlines():
        m = re.match(r"^[-#\s]*\**([А-ЯЁA-Z][^—.*]{2,50}?)\**\s+—\s+это\s", line)
        if m: terms.add(m.group(1).strip())
    qtext = lesson2text.get(norm(title))
    if qtext is None:
        print(f"\n## {title}: НЕТ ВОПРОСОВ ({len(terms)} терминов)"); continue
    miss = []
    for t in sorted(terms):
        words = [stem(w) for w in re.findall(r"[\wа-яё/&]+", norm(t)) if len(w) > 2]
        if words and sum(1 for w in words if w in qtext) / len(words) < 0.67: miss.append(t)
    print(f"\n## {title}: терминов {len(terms)}, не найдено {len(miss)}")
    for m in miss: print("   -", m)
