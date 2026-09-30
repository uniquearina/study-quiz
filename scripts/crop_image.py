#!/usr/bin/env python3
"""Картинки из учебников, фото и PDF → trainer/img/. Нужен Pillow (для PDF — PyMuPDF: pip3 install pymupdf).

Команды (пути любые; координаты — в пикселях исходника, x0,y0,x1,y1):
  grid  <картинка> [--step 50] [--out grid.png]
        сетка с подписанными координатами поверх картинки: посмотри на неё и выбери рамку
  crop  <картинка> --box x0,y0,x1,y1 --out trainer/img/<префикс>-<имя>.png
        [--pad 12] [--rotate градусы] [--mask x0,y0,x1,y1 ...] [--max 1400] [--min 700] [--no-contrast]
        вырезает рамку с запасом, выпрямляет, чуть поднимает контраст, уменьшает до --max, мелкое увеличивает до --min.
        --mask закрашивает подписи и ставит на их место номера 1, 2, 3… в порядке --mask;
        рядом сохраняется полная версия <имя>-key.png — для разбора (explainImg).
  pdf   <файл.pdf> --page N [--dpi 200] --out page.png
        страница PDF (с 1) → картинка, дальше grid/crop
  dupes <картинки…>
        одинаковые или почти одинаковые кадры (один плакат дважды, повторный снимок)
"""
import argparse, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter, ImageStat


def box(s):
    v = [float(x) for x in s.split(",")]
    if len(v) != 4: raise argparse.ArgumentTypeError("нужно x0,y0,x1,y1")
    return v


def font(size):
    for f in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(f): return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def load(path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)  # фото с телефона: учесть поворот из EXIF
    return im.convert("RGB")


def px(b, im):
    """Рамка в пикселях; доли (все ≤ 1) переводятся в пиксели."""
    if all(0 <= v <= 1 for v in b): b = [b[0] * im.width, b[1] * im.height, b[2] * im.width, b[3] * im.height]
    x0, y0, x1, y1 = b
    return [max(0, min(x0, x1)), max(0, min(y0, y1)), min(im.width, max(x0, x1)), min(im.height, max(y0, y1))]


def cmd_grid(a):
    im = load(a.image); d = ImageDraw.Draw(im, "RGBA"); f = font(max(10, a.step // 4))
    for x in range(0, im.width, a.step):
        d.line([(x, 0), (x, im.height)], fill=(255, 0, 80, 150 if x % (a.step * 2) == 0 else 70), width=1)
        if x % (a.step * 2) == 0: d.text((x + 2, 2), str(x), fill=(255, 0, 80, 255), font=f)
    for y in range(0, im.height, a.step):
        d.line([(0, y), (im.width, y)], fill=(0, 90, 255, 150 if y % (a.step * 2) == 0 else 70), width=1)
        if y % (a.step * 2) == 0: d.text((2, y + 2), str(y), fill=(0, 90, 255, 255), font=f)
    out = a.out or os.path.splitext(a.image)[0] + "-grid.png"
    im.save(out); print(f"{out}  ({im.width}×{im.height})")


def bg_color(im, b):
    """Цвет фона вокруг подписи: медиана полосы по краю рамки."""
    x0, y0, x1, y1 = [int(v) for v in b]; m = 3
    ring = [im.crop((max(0, x0 - m), max(0, y0 - m), min(im.width, x1 + m), max(1, y0))),
            im.crop((max(0, x0 - m), min(im.height - 1, y1), min(im.width, x1 + m), min(im.height, y1 + m)))]
    ring = [r for r in ring if r.width > 0 and r.height > 0]
    if not ring: return (255, 255, 255)
    st = [ImageStat.Stat(r).median for r in ring]
    return tuple(int(sum(c[i] for c in st) / len(st)) for i in range(3))


def finish(im, a):
    if not a.no_contrast: im = ImageOps.autocontrast(im, cutoff=0.5)
    if max(im.size) < a.min:  # мелкий рисунок — увеличиваем, чтобы в тренажёре читался
        k = a.min / max(im.size); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    im.thumbnail((a.max, a.max), Image.LANCZOS)
    return im


def cmd_crop(a):
    src = load(a.image)
    if a.rotate: src = src.rotate(-a.rotate, resample=Image.BICUBIC, expand=True, fillcolor=(255, 255, 255))
    b = px(a.box, src)
    if max(b[2] - b[0], b[3] - b[1]) < 400:
        print(f"⚠ рисунок в исходнике мелкий ({int(b[2] - b[0])}×{int(b[3] - b[1])} px) — увеличу, но лучше переснять его крупно отдельным кадром")
    b = [max(0, b[0] - a.pad), max(0, b[1] - a.pad), min(src.width, b[2] + a.pad), min(src.height, b[3] + a.pad)]
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    masks = [px(m, src) for m in (a.mask or [])]
    if masks:
        key = finish(src.crop(b), a); stem, ext = os.path.splitext(a.out)
        key.save(stem + "-key" + ext); print(f"{stem}-key{ext}  (с подписями, для разбора)")
        work = src.copy(); d = ImageDraw.Draw(work)
        for m in masks:  # +3 px: края букв и сжатие JPEG оставляют серый ореол
            d.rectangle([m[0] - 3, m[1] - 3, m[2] + 3, m[3] + 3], fill=bg_color(src, [m[0] - 3, m[1] - 3, m[2] + 3, m[3] + 3]))
        r = max(7, min(22, max(int(min(m[3] - m[1] for m in masks) * 0.6), int(max(b[2] - b[0], b[3] - b[1]) / 45))))  # все номера одного размера
        for i, m in enumerate(masks, 1):  # номера — после всех заливок, чтобы соседняя не закрыла
            cx, cy = (m[0] + m[2]) / 2, (m[1] + m[3]) / 2
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(20, 120, 110), outline=(255, 255, 255), width=2)
            f = font(int(r * 1.2)); t = str(i); w = d.textlength(t, font=f)
            d.text((cx - w / 2, cy - r * 0.68), t, fill=(255, 255, 255), font=f)
        src = work
    im = finish(src.crop(b), a)
    im.save(a.out); print(f"{a.out}  ({im.width}×{im.height}){'  номера: 1–' + str(len(masks)) if masks else ''}")


def cmd_pdf(a):
    try: import fitz
    except ImportError: sys.exit("Нужен PyMuPDF: pip3 install pymupdf")
    doc = fitz.open(a.pdf)
    if not 1 <= a.page <= len(doc): sys.exit(f"В PDF {len(doc)} стр.")
    pix = doc[a.page - 1].get_pixmap(dpi=a.dpi); pix.save(a.out); print(f"{a.out}  ({pix.width}×{pix.height})")


def ahash(path, n=16):
    im = load(path).convert("L").resize((n, n), Image.LANCZOS); p = list(im.getdata()); m = sum(p) / len(p)
    return [v > m for v in p]


def cmd_dupes(a):
    hs = {}
    for p in a.images:
        try: hs[p] = ahash(p)
        except Exception as e: print(f"✘ не открывается {p}: {e}")
    ps = list(hs); found = False
    for i in range(len(ps)):
        for j in range(i + 1, len(ps)):
            diff = sum(x != y for x, y in zip(hs[ps[i]], hs[ps[j]])) / len(hs[ps[i]])
            if diff <= 0.16:  # повтор с другой обрезкой ≈ 0.11, разные страницы ≥ 0.2
                found = True; si, sj = Image.open(ps[i]).size, Image.open(ps[j]).size
                best = ps[i] if si[0] * si[1] >= sj[0] * sj[1] else ps[j]
                print(f"≈ {ps[i]} {si[0]}×{si[1]}  и  {ps[j]} {sj[0]}×{sj[1]}  (различие {diff:.0%}) → бери {best}")
    if not found: print("повторов нет")


ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
sp = ap.add_subparsers(dest="cmd", required=True)
g = sp.add_parser("grid"); g.add_argument("image"); g.add_argument("--step", type=int, default=50); g.add_argument("--out")
c = sp.add_parser("crop"); c.add_argument("image"); c.add_argument("--box", type=box, required=True); c.add_argument("--out", required=True)
c.add_argument("--pad", type=int, default=12); c.add_argument("--rotate", type=float, default=0); c.add_argument("--mask", type=box, action="append")
c.add_argument("--max", type=int, default=1400); c.add_argument("--min", type=int, default=700); c.add_argument("--no-contrast", action="store_true")
p = sp.add_parser("pdf"); p.add_argument("pdf"); p.add_argument("--page", type=int, required=True); p.add_argument("--dpi", type=int, default=200); p.add_argument("--out", required=True)
d = sp.add_parser("dupes"); d.add_argument("images", nargs="+")
a = ap.parse_args()
{"grid": cmd_grid, "crop": cmd_crop, "pdf": cmd_pdf, "dupes": cmd_dupes}[a.cmd](a)
