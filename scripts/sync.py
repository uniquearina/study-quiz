#!/usr/bin/env python3
"""Что изменилось в notes/ по сравнению с тренажёром. Первый шаг при обновлении тренажёра.

Запуск (из папки проекта):
  python3 <скилл>/scripts/sync.py          — отчёт
  python3 <скилл>/scripts/sync.py --lock   — после сборки: запомнить состояние и копию текстов для будущих diff

Урок тренажёра связан с конспектом полем lesson у topics в trainer/quiz-data*.js: lesson = имя файла notes/<урок>.md
(«:» и «/» в имени файла заменяются на «_»). Статусы:
  NEW      — конспект есть, урока в тренажёре нет
  CHANGED  — текст конспекта изменился после последней сборки (старый — в .study-quiz/snapshot/)
  REMOVED  — урок в тренажёре есть, конспекта нет
  OK       — всё совпадает
Ещё скрипт смотрит в sources/ (файлы, положенные туда вручную):
  📥 новый исходник   — появился после прошлого --lock и не упомянут ни в одном конспекте (<!-- source: … -->)
  ✏️ исходник изменён — файл пересохранили после --lock: проверь, что поменялось в уроках из него
  ❔ исходника нет    — был при --lock, теперь пропал (сам урок не трогается)
"""
import glob, hashlib, json, os, re, shutil, subprocess, sys, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import trainer_dir
TR = trainer_dir()
ROOT = os.path.dirname(TR)
NOTES, STATE = os.path.join(ROOT, "notes"), os.path.join(ROOT, ".study-quiz")
LOCK, SNAP = os.path.join(STATE, "lock.json"), os.path.join(STATE, "snapshot")
fname = lambda t: unicodedata.normalize("NFC", t).replace(":", "_").replace("/", "_")
sha = lambda p: hashlib.sha1(open(p, "rb").read()).hexdigest()[:12]

js = ("global.window={};const fs=require('fs');for(const f of fs.readdirSync(%r).filter(f=>/^quiz-data.*\\.js$/.test(f)))"
      "{const n=(window.QUIZ_PARTS||[]).length;require(%r+'/'+f);for(const p of window.QUIZ_PARTS.slice(n))p.file=f;}"
      "console.log(JSON.stringify((window.QUIZ_PARTS||[]).map(p=>({file:p.file,group:p.group,topics:p.topics.map(t=>({...t,n:p.questions.filter(q=>q.topic===t.id).length}))}))))") % (TR, TR)
parts = json.loads(subprocess.check_output(["node", "-e", js], text=True))
example = {"quiz-data-example.js"}
in_tr = {fname(t.get("lesson") or t["title"]): {"topic": t["id"], "group": p["group"]["title"], "file": p["file"], "n": t["n"]}
         for p in parts if p["file"] not in example for t in p["topics"]}
notes = {fname(os.path.basename(f)[:-3]): f for f in sorted(glob.glob(os.path.join(NOTES, "*.md")))}
lock = json.load(open(LOCK)) if os.path.exists(LOCK) else {}
rows = []
for les in list(dict.fromkeys(list(notes) + list(in_tr))):
    t, f = in_tr.get(les), notes.get(les)
    h = sha(f) if f else None
    st = "REMOVED" if not f else "NEW" if not t else "CHANGED" if lock.get(les) and lock[les] != h else "OK"
    rows.append({"lesson": les, "status": st, "sha": h, **(t or {})})
# ── sources/: что положили вручную ──
SRC = os.path.join(ROOT, "sources")
def src_files():
    out = {}
    for d, dirs, files in os.walk(SRC):
        dirs[:] = [x for x in dirs if not x.startswith(".") and not x.endswith("_files")]  # _files — ресурсы сохранённой страницы
        for f in files:
            if f.startswith(".") or f.startswith("~$"): continue
            full = os.path.join(d, f); out[unicodedata.normalize("NFC", os.path.relpath(full, SRC))] = full
    return out
srcs = src_files() if os.path.isdir(SRC) else {}
refs = ""  # пометки <!-- source: … --> / <!-- источник: … --> из конспектов
for f in notes.values():
    head = open(f, encoding="utf-8", errors="ignore").read(2000)
    refs += " ".join(re.findall(r"<!--\s*(?:source|источник)\s*:(.*?)-->", head, re.I)) + " "
refs = unicodedata.normalize("NFC", refs)
known = lock.get("__sources__")
if known is None and lock:  # lock записан старой версией: всё, что старше lock, считаем обработанным
    t = os.path.getmtime(LOCK); known = {k: sha(v) for k, v in srcs.items() if os.path.getmtime(v) <= t}
known = known or {}
src_rows = []
for rel, full in sorted(srcs.items()):
    if rel in known:
        if known[rel] != sha(full): src_rows.append(("✏️  исходник изменён", rel))
    elif not any(x in refs for x in [rel, os.path.basename(rel)] + [os.path.dirname(rel)] * bool(os.path.dirname(rel))):  # фото лекции — по имени подпапки
        src_rows.append(("📥 новый исходник", rel))
src_rows += [("❔ исходника нет", rel) for rel in sorted(set(known) - set(srcs))]

icon = {"NEW": "🆕", "CHANGED": "✏️ ", "REMOVED": "🗑 ", "OK": "✅"}
for r in rows:
    extra = f"{r['topic']} · {r['n']} вопр. · {r['file']}" if r.get("topic") else ""
    print(f"  {icon[r['status']]} {r['status']:8} {r['lesson']}  {extra}")
    if r["status"] == "CHANGED": print(f"             diff \".study-quiz/snapshot/{r['lesson']}.md\" \"notes/{r['lesson']}.md\"")
print("\nИтого:", ", ".join(f"{k} {sum(r['status'] == k for r in rows)}" for k in icon))
if src_rows:
    print("\nsources/:")
    for st, rel in src_rows: print(f"  {st}  {rel}")
    print("  → новое перепиши в notes/ (с пометкой <!-- source: … -->), изменённое сверь с уроками из него.")
if any(p["file"] in example for p in parts): print("ℹ️  В тренажёре ещё лежит пример (quiz-data-example.js, study-example.js) — убери его, когда появится первая своя тема.")
if not lock and in_tr and "--lock" not in sys.argv: print("ℹ️  lock ещё не записан — CHANGED не определяется. После сборки запусти --lock.")
if "--lock" in sys.argv:
    bad = [r["lesson"] for r in rows if r["status"] in ("NEW", "REMOVED")]
    if bad: sys.exit("Не записываю lock: в тренажёре не отражены " + "; ".join(bad))
    os.makedirs(SNAP, exist_ok=True)
    new_src = [rel for st, rel in src_rows if st.startswith("📥")]
    if new_src: print("ℹ️  исходники без урока записаны как просмотренные (если это не так — перепиши их в notes/ и запусти --lock снова): " + "; ".join(new_src))
    data = {r["lesson"]: r["sha"] for r in rows if r["sha"]}; data["__sources__"] = {rel: sha(full) for rel, full in srcs.items()}
    json.dump(data, open(LOCK, "w"), ensure_ascii=False, indent=1)
    for r in rows:
        if r["sha"]: shutil.copyfile(notes[r["lesson"]], os.path.join(SNAP, r["lesson"] + ".md"))
    print("lock записан; копия текстов — .study-quiz/snapshot/")
