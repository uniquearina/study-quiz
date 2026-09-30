#!/usr/bin/env python3
"""Текст из сохранённых HTML-страниц → notes/<урок>.md и проверка, что страницы сохранились целиком.

Запуск (из папки проекта):
  python3 <скилл>/scripts/extract_html.py [папка с html] ["Урок 1" "Урок 2" ...] [--root CSS-класс] [--end "фраза"]
  • папка по умолчанию — ./sources; название урока берётся из имени файла до « — » (так браузер называет файл по <title>);
  • --root — класс контейнера с текстом урока (иначе <main>, <article> или <body>);
  • --end — фраза, которой заканчивается каждый урок (например «Итоги»): поймает страницы, сохранённые не до конца;
  • список ожидаемых уроков (скопируй из оглавления курса) — покажет, каких не хватает.
Страницы сохраняются вручную: открыть урок, прокрутить до конца, Cmd+S / Ctrl+S → «Веб-страница, полностью».
Жирный текст сохраняется как **термин**, картинки — строкой [IMG путь] (путь от папки с html).
"""
import glob, os, re, sys, unicodedata
try:
    import lxml.html as LH
except ImportError:
    sys.exit("Нужен lxml:  pip3 install lxml")

args, opts, i = [], {}, 1
while i < len(sys.argv):
    a = sys.argv[i]
    if a in ("--root", "--end"): opts[a] = sys.argv[i + 1]; i += 2
    else: args.append(a); i += 1
SRC = next((a for a in args if os.path.isdir(a)), "sources")
expected = [unicodedata.normalize("NFC", a) for a in args if a != SRC]
OUT = "notes"
BLK = {"p", "li", "h1", "h2", "h3", "h4", "h5", "tr", "div", "pre", "blockquote", "td", "th", "summary", "section", "figcaption"}
SKIP = re.compile(r"sidebar|navbar|header|footer|cookie|modal|chat|comments", re.I)
os.makedirs(OUT, exist_ok=True)

def extract(path):
    raw = open(path, "rb").read()
    m = re.search(rb'charset=["\']?([\w-]+)', raw[:4000])
    d = LH.document_fromstring(raw, parser=LH.HTMLParser(encoding=(m.group(1).decode() if m else "utf-8")))
    for bad in d.xpath("//script|//style|//svg|//noscript|//nav|//footer"): bad.drop_tree()
    roots = (opts.get("--root") and d.xpath(f'//*[contains(concat(" ",@class," ")," {opts["--root"]} ")]')) \
        or d.xpath("//main") or d.xpath("//article") or d.xpath("//body")
    if not roots: return []
    buf, cur = [], [""]
    def nl():
        t = re.sub(r"\s+", " ", cur[0]).strip()
        if t: buf.append(t)
        cur[0] = ""
    def walk(el, root=False):
        tag = el.tag if isinstance(el.tag, str) else ""
        if tag and not root and SKIP.search(el.get("class", "") + " " + el.get("id", "")): return
        if tag == "img":
            src = el.get("src", "")
            if src and not src.startswith("data:"): nl(); buf.append(f"[IMG {src}]")
        else:
            if tag in BLK: nl()
            if tag in ("h1", "h2", "h3", "h4"): cur[0] += "#" * int(tag[1]) + " "
            if tag == "li": cur[0] += "- "
            bold = tag in ("strong", "b")
            if bold: cur[0] += " **"
            if el.text: cur[0] += el.text
            for c in el: walk(c)
            if bold: cur[0] = cur[0].rstrip() + "** "
            if tag in BLK: nl()
        if el.tail: cur[0] += el.tail
    walk(roots[0], True); nl()
    lines = []
    for l in (re.sub(r"\*\*\s*\*\*", "", l) for l in buf):
        if l and (not lines or lines[-1] != l): lines.append(l)
    return lines

found = {}
files = sorted(glob.glob(os.path.join(SRC, "*.html")) + glob.glob(os.path.join(SRC, "*.htm")))
if not files: sys.exit(f"В {SRC}/ нет сохранённых страниц .html")
print(f"{'файл':44} | {'заголовок внутри':40} | симв. | картинки лок/сеть | статус")
for f in files:
    name = unicodedata.normalize("NFC", os.path.basename(f)).rsplit(".", 1)[0].split(" — ")[0].split(" | ")[0].strip()
    lines = extract(f); txt = "\n".join(lines)
    h1 = unicodedata.normalize("NFC", next((l[2:].replace("**", "").strip() for l in lines if l.startswith("# ")), ""))
    imgs = [l[5:-1] for l in lines if l.startswith("[IMG")]
    local = sum(1 for i in imgs if not i.startswith("http") and os.path.exists(os.path.join(SRC, i)))
    remote = sum(1 for i in imgs if i.startswith("http"))
    same = not h1 or h1.replace(":", "_").replace("/", "_") == name or h1 == name
    end = opts.get("--end")
    problems = [p for p, bad in [("внутри другой урок", not same), ("не до конца", end and end not in txt),
                                 ("картинки не скачаны", remote > 0), ("мало текста", len(txt) <= 1500)] if bad]
    print(f"{name[:44]:44} | {h1[:40]:40} | {len(txt):5} | {local}/{remote} | {'✅' if not problems else '⚠️ ' + ', '.join(problems)}")
    open(os.path.join(OUT, name + ".md"), "w", encoding="utf-8").write(f"<!-- источник: {f} -->\n" + txt + "\n")
    found[h1 or name] = not problems
if expected:
    miss = [e for e in expected if e not in found and e.replace(":", "_") not in found]
    bad = [e for e in expected if not found.get(e, True)]
    print("\nНе сохранены:", ", ".join(miss) or "—")
    print("Сохранены с проблемами:", ", ".join(bad) or "—")
print(f"\nТекст — в {OUT}/. Картинки: пути в строках [IMG …] — от папки {SRC}/.")
