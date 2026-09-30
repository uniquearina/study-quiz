"""Общее для скриптов на Python: папка тренажёра и поиск Chrome."""
import glob, os, shutil, sys

def trainer_dir():
    """Папка тренажёра: первый аргумент-папка с index.html, иначе ./trainer."""
    for a in sys.argv[1:]:
        if os.path.isfile(os.path.join(a, "index.html")): return os.path.abspath(a)
    d = os.path.abspath("trainer")
    if not os.path.isfile(os.path.join(d, "index.html")):
        sys.exit("Не нашла тренажёр: запусти из папки проекта (где лежит trainer/) или передай путь к нему.")
    return d

def chrome():
    env = os.environ.get("CHROME")
    cands = ([env] if env else []) \
        + sorted(glob.glob(os.path.expanduser("~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/*")), reverse=True) \
        + sorted(glob.glob(os.path.expanduser("~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome")), reverse=True) \
        + ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"] \
        + [shutil.which(n) or "" for n in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser")]
    c = next((c for c in cands if c and os.path.exists(c)), None)
    if not c: sys.exit("Chrome не найден. Установи Google Chrome или укажи путь в переменной CHROME.")
    return c

def page(tr):
    """index.html без внешнего шрифта: без сети headless-Chrome на нём зависает."""
    src = open(os.path.join(tr, "index.html"), encoding="utf-8").read()
    return src.replace('<link rel="stylesheet" href="https://fonts.googleapis.com', '<link rel="x" href="')

# ключ хранилища тренажёра — из config.js (в JS-коде тестов)
KEY_JS = '((window.TRAINER||{}).key||"study-trainer")'
