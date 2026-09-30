#!/usr/bin/env python3
"""Скриншоты экранов тренажёра в headless-Chrome (для проверки интерфейса глазами).
Запуск (из папки проекта): OUT=<куда> ONLY=home,cheat python3 <скилл>/scripts/screens.py [папка тренажёра]
По умолчанию скриншоты — в /tmp/study-quiz-screens, все экраны, тёмная тема (THEME=light — светлая).
Экраны: главная, шпаргалка, карточка, карта (с выбранным понятием), пустая карта. Прогресс — тестовый."""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import trainer_dir, chrome, page, KEY_JS
TR = trainer_dir()
OUT = os.environ.get("OUT", "/tmp/study-quiz-screens")
os.makedirs(OUT, exist_ok=True)
CH = chrome()
src = page(TR)
# тестовый прогресс: часть вопросов отвечена вчера и раньше, часть с ошибкой
seed = r'''<script>
localStorage.clear();
(function(){ const D=864e5, now=Date.now(), q={}, parts=window.QUIZ_PARTS||[];
  parts.forEach(p=>p.questions.forEach((x,i)=>{ if(i%3===0) q[x.id]={n:1,ok:i%9?1:0,last:i%9?1:0,at:now-(i%7+1)*D}; }));
  localStorage.setItem(__KEY__, JSON.stringify({q, sessions:[], ui:{open:[],theme:"__THEME__"}}));
})();
</script>'''
ONLY = os.environ["ONLY"].split(",") if os.environ.get("ONLY") else None
T0 = "TR.D.topics[0].id"   # первый урок с понятиями
TC = "TR.D.topics.find(t=>STUDY_UI.byTopic(t.id).length>=3).id"
SCREENS = {
  "home": "",
  "cheat": f"STUDY_UI.cheat({T0})",
  "card": f"STUDY_UI.cards(STUDY_UI.byTopic({TC}).map(c=>c.id),{{ordered:true}}); document.querySelector('#card').click()",
  "card-back": f"STUDY_UI.cards(STUDY_UI.byTopic({TC}).map(c=>c.id),{{ordered:true}}); setTimeout(()=>document.querySelector('#card').click(),20)",
  "map": "STUDY_UI.map(); setTimeout(()=>document.querySelector('.node').click(),50)",
  "map-blank": "STUDY_UI.map({blank:true})",
  "today": "TR.startToday()",
  "custom": "TR.custom()",
  "wrong": "const q=TR.Q.find(q=>q.type==='mcq'&&q.correct.length===1); TR.run(TR.newSession([q.id],{title:I18N.t('lesson.test')})); setTimeout(()=>{const o=[...document.querySelectorAll('.opt')].find(o=>!o.textContent.includes(q.options[q.correct[0]])); o.click();},30)",
  "finish": "const ids=TR.Q.slice(0,12).map(q=>q.id); const s=TR.newSession(ids,{title:I18N.t('finish.title')}); s.qids.forEach((id,i)=>s.answers[id]=i%3?1:0); s.done=true; TR.run(s)",
  "today-done": "Object.values(TR.S.q).forEach(r=>{r.due=Date.now()+5*864e5}); TR.Q.slice(0,10).forEach(q=>{TR.S.q[q.id]={n:1,ok:1,last:1,at:Date.now(),first:Date.now(),box:1,due:Date.now()+864e5}}); TR.S.cards={}; TR.home()",
  "frame": "const q=TR.Q.find(q=>q.type==='frame'&&q.layout==='grid')||TR.Q.find(q=>q.type==='frame'); if(q) TR.run(TR.newSession([q.id],{title:I18N.t('lesson.test')}))",
  "table": "const q=TR.Q.find(q=>q.type==='table'); if(q) TR.run(TR.newSession([q.id],{title:I18N.t('lesson.test')}))",
}
THEME = os.environ.get("THEME", "dark")
for name, js in SCREENS.items():
  if ONLY and name not in ONLY: continue
  for w, suffix in ((1280, ""), (520, "-narrow")):  # уже ~500 px headless-Chrome не умеет
    # тестовый прогресс — после загрузки данных, перед основным скриптом
    html = src.replace('<script src="srs.js"></script>', seed.replace('__THEME__', THEME).replace('__KEY__', KEY_JS) + '<script src="srs.js"></script>', 1)
    html = html.replace("</body>", f"<script>setTimeout(()=>{{ {js} }},30)</script></body>")
    tmp = os.path.join(TR, f"_shot.html")
    open(tmp, "w", encoding="utf-8").write(html)
    path = os.path.join(OUT, f"{name}{suffix}-{THEME}.png")
    subprocess.run([CH, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--window-size={w},{1800}",
                    "--virtual-time-budget=4000", f"--screenshot={path}", "file://" + tmp], capture_output=True, timeout=120)
    os.remove(tmp)
    print(path)
