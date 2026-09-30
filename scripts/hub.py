#!/usr/bin/env python3
"""Общая страница для нескольких тренажёров: <папка>/index.html со ссылками на все */trainer/index.html.

Запуск: python3 <скилл>/scripts/hub.py [папка]   (по умолчанию текущая)
На каждой карточке — предмет, число вопросов и, если браузер уже открывал тренажёр, сколько на сегодня
(повторить + новых) и дней подряд. Прогресс читается из того же хранилища браузера, что у тренажёров
(у страниц file:// оно общее в Chrome и Edge; где не общее — карточка просто ведёт в тренажёр).
Перезапускай после добавления предмета или уроков: число вопросов записывается в страницу при сборке.
"""
import glob, html, json, os, re, subprocess, sys

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
JS = ("global.window={};const fs=require('fs'),d=process.argv[1];"
      "for(const f of fs.readdirSync(d).filter(f=>/^quiz-data.*\\.js$/.test(f)&&f!=='quiz-data-example.js'))require(d+'/'+f);"
      "const P=window.QUIZ_PARTS||[];console.log(JSON.stringify({q:P.reduce((n,p)=>n+p.questions.length,0),"
      "topics:P.map(p=>p.group.title),lessons:P.reduce((n,p)=>n+p.topics.length,0)}))")


def cfg(tr):
    s = open(os.path.join(tr, "config.js"), encoding="utf-8").read()
    get = lambda k: (re.search(k + r'\s*:\s*"([^"]*)"', s) or [None, ""])[1]
    return {"title": get("title"), "subtitle": get("subtitle"), "key": get("key"), "lang": get("lang") or "en"}


items = []
for idx in sorted(glob.glob(os.path.join(ROOT, "*", "trainer", "index.html"))):
    tr = os.path.dirname(idx); folder = os.path.basename(os.path.dirname(tr)); c = cfg(tr)
    try: n = json.loads(subprocess.check_output(["node", "-e", JS, tr], text=True))
    except Exception as e: print(f"⚠ {folder}: не прочитала вопросы ({e})"); n = {"q": 0, "topics": [], "lessons": 0}
    items.append({"name": c["subtitle"] or folder, "folder": folder, "href": f"{folder}/trainer/index.html",
                  "key": c["key"], "lang": c["lang"], **n})
if not items: sys.exit(f"В {ROOT} нет подпапок с trainer/index.html")
keys = [i["key"] for i in items]
for k in set(keys):
    if keys.count(k) > 1: print(f"⚠ одинаковый key «{k}» у {[i['folder'] for i in items if i['key'] == k]} — прогресс смешается, задай разные в config.js")
lang = max(set(i["lang"] for i in items), key=[i["lang"] for i in items].count)
T = {"ru": {"title": "Мои тренажёры", "sub": "{n} предметов", "q": ["вопрос", "вопроса", "вопросов"], "l": ["урок", "урока", "уроков"], "today": "На сегодня",
            "rev": "повторить", "new": "новых", "done": "✓ на сегодня всё", "fresh": "ещё не начат",
            "streak": ["день подряд", "дня подряд", "дней подряд"], "open": "Открыть", "note": "Страницу собирает скилл study-quiz (scripts/hub.py). Появился новый предмет или уроки — попроси Claude обновить её."},
     "en": {"title": "My trainers", "sub": "{n} subjects", "q": ["question", "questions"], "l": ["lesson", "lessons"], "today": "Today",
            "rev": "to review", "new": "new", "done": "✓ all done for today", "fresh": "not started yet",
            "streak": ["day in a row", "days in a row"], "open": "Open", "note": "Built by the study-quiz skill (scripts/hub.py). New subject or lessons? Ask Claude to update this page."}}[lang]
if lang == "ru":
    m, k = len(items) % 10, len(items) % 100
    T["sub"] = T["sub"].replace("предметов", "предмет" if m == 1 and k != 11 else "предмета" if 2 <= m <= 4 and not 12 <= k <= 14 else "предметов")
elif len(items) == 1: T["sub"] = "{n} subject"

page = """<!doctype html>
<html lang="__LANG__"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__</title>
<style>
:root { --bg:#f4f2ee; --card:#fff; --ink:#1b1b19; --muted:#8b8983; --line:#e4e1da; --accent:#0f9f96; --accent-ink:#fff; --accent-soft:#dcf3f0; --bad:#d4452f;
  --shadow:0 1px 0 rgba(0,0,0,.04),0 8px 24px -12px rgba(40,30,10,.18); }
@media (prefers-color-scheme: dark) { :root { --bg:#121211; --card:#1e1e1c; --ink:#efeee9; --muted:#8f8d86; --line:#33322e; --accent:#2fc4b8; --accent-ink:#0b1f1d; --accent-soft:#163734; --bad:#f07a63; --shadow:none; } }
* { box-sizing:border-box } body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
main { max-width:760px; margin:0 auto; padding:28px 16px 40px; }
h1 { margin:0; font-size:28px; } .muted { color:var(--muted); } .small { font-size:13px; }
.grid { display:grid; gap:14px; margin-top:22px; grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr)); }
a.card { display:flex; flex-direction:column; gap:10px; padding:18px; border-radius:18px; background:var(--card); border:1px solid var(--line);
  box-shadow:var(--shadow); color:inherit; text-decoration:none; transition:transform .12s; }
a.card:hover { transform:translateY(-2px); border-color:var(--accent); }
.name { font-weight:700; font-size:19px; } .today { padding:10px 12px; border-radius:12px; background:var(--accent-soft); }
.today b { font-size:18px; } .lbl { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); font-weight:700; }
.go { margin-top:auto; align-self:flex-start; background:var(--accent); color:var(--accent-ink); font-weight:600; padding:8px 16px; border-radius:12px; }
</style></head><body><main>
<h1>__TITLE__</h1><div class="muted">__SUB__</div>
<div class="grid" id="grid"></div>
<p class="small muted" style="margin-top:26px">__NOTE__</p>
</main>
<script>
const T = __T__, ITEMS = __ITEMS__;
const DAY = 864e5, day0 = (() => { const d = new Date(); d.setHours(0,0,0,0); return +d; })(), now = Date.now();
const pl = (n, f) => { if (f.length === 2) return f[n === 1 ? 0 : 1]; const m = n % 10, k = n % 100; return f[m === 1 && k !== 11 ? 0 : m >= 2 && m <= 4 && (k < 10 || k >= 20) ? 1 : 2]; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const dk = t => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); };
document.getElementById("grid").innerHTML = ITEMS.map(it => {
  let S = null; try { S = JSON.parse(localStorage.getItem(it.key) || "null"); } catch (e) {}
  let today = `<div class="small muted">${T.fresh}</div>`;
  if (S && S.q && Object.keys(S.q).length) {
    const rs = Object.values(S.q), due = rs.filter(r => r.due != null && r.due <= now).length;
    const freshToday = rs.filter(r => r.first >= day0).length, left = Math.max(0, it.q - rs.length);
    const fresh = Math.min(left, Math.max(0, 13 - freshToday)), total = Math.min(25, due + fresh);
    let streak = 0, t = now; const days = S.days || {}; if (!days[dk(t)]) t -= DAY; while (days[dk(t)]) { streak++; t -= DAY; }
    today = total ? `<div class="today"><div class="lbl">${T.today}</div><b>~${total}</b> <span class="small">${[due && `${due} ${T.rev}`, fresh && `${fresh} ${T.new}`].filter(Boolean).map(x => "· " + x).join(" ")}</span></div>`
                  : `<div class="today"><b class="small">${T.done}</b></div>`;
    if (streak) today += `<div class="small muted">🔥 ${streak} ${pl(streak, T.streak)}</div>`;
  }
  return `<a class="card" href="${encodeURI(it.href)}"><div><div class="name">${esc(it.name)}</div>
    <div class="small muted">${it.lessons} ${pl(it.lessons, T.l)} · ${it.q} ${pl(it.q, T.q)}</div></div>${today}<span class="go">${T.open} →</span></a>`;
}).join("");
</script></body></html>"""
title = T["title"]
out = (page.replace("__LANG__", lang).replace("__TITLE__", html.escape(title)).replace("__SUB__", T["sub"].format(n=len(items)))
       .replace("__NOTE__", html.escape(T["note"])).replace("__T__", json.dumps(T, ensure_ascii=False))
       .replace("__ITEMS__", json.dumps(items, ensure_ascii=False)))
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(out)
print(f"{os.path.join(ROOT, 'index.html')}: {len(items)} — " + ", ".join(f"{i['name']} ({i['q']})" for i in items))
