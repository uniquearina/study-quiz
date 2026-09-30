#!/usr/bin/env python3
"""Автотест «На сегодня», шпаргалок, карточек и карты в headless-Chrome.
Запуск (из папки проекта): python3 <скилл>/scripts/e2e_study.py [папка тренажёра]
Проверяет: лимит новых в день, появление повторов на следующий день (подмена Date.now),
что карточки идут после вопросов, а не в начале, что шпаргалка каждого урока, карта и карточки открываются без ошибок JS."""
import os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import trainer_dir, chrome, page, KEY_JS
TR = trainer_dir()
CH = chrome()
src = page(TR)
# подмена времени — до загрузки всех скриптов
clock = '<script>localStorage.clear(); window.__shift=0; const __now=Date.now; Date.now=()=>__now()+window.__shift;</script>'
src = src.replace('<script src="config.js">', clock + '<script src="config.js">', 1)
test = r'''<script>
window.onerror=(m,s,l)=>{document.title="ERR "+m+" @"+l;};
const w=ms=>new Promise(r=>setTimeout(r,ms)); const D=864e5; const log=[]; let fails=0;
const ok=(c,msg)=>{ log.push((c?"✓ ":"✗ ")+msg); if(!c) fails++; };
(async()=>{ try{ await w(100);
  const S=()=>TR.S;
  // день 0: чистый прогресс
  const F=SRS.LIMITS.fresh; let p=TR.todayPlan(); ok(p.due.length===0 && p.fresh.length===F, "день 0: 0 повторов, "+F+" новых ("+p.due.length+"/"+p.fresh.length+")");
  const tl=p.fresh.map(id=>TR.byId[id].topic); ok(tl.includes(TR.D.topics[0].id) && tl.includes(TR.D.topics[TR.D.topics.length-1].id), "новые — и из первых уроков, и из последних");
  ok(STUDY_UI.todayCards().length===0, "день 0: карточек нет, пока не было вопросов");
  ok(p.fresh.every(id=>{const q=TR.byId[id]; return q.level===1 || p.fresh.some(j=>TR.byId[j].sub===q.sub&&TR.byId[j].level===1);}), "сложные новые — только после простого той же микротемы");
  // отвечаем на все 10: половина верно
  p.fresh.forEach((id,i)=>{ const r={n:1,ok:i%2?0:1,last:i%2?0:1,at:Date.now(),first:Date.now()}; S().q[id]=SRS.schedule(r,!!r.last,r.at); });
  p=TR.todayPlan(); ok(p.fresh.length===0, "день 0 после ответов: новых больше нет (лимит) — "+p.fresh.length);
  ok(STUDY_UI.todayCards().length>0, "день 0: появились карточки по пройденным микротемам — "+STUDY_UI.todayCards().length);
  // день 1: все 10 к повтору (ступень 1 = через день), снова 10 новых
  const nBad=Math.floor(F/2), nOk=F-nBad;
  window.__shift=D; p=TR.todayPlan(); ok(p.due.length===nBad && p.fresh.length===F, "день 1: повторяются только ошибки ("+nBad+"), верные — через 3 дня; + "+F+" новых ("+p.due.length+"/"+p.fresh.length+")");
  p.due.forEach(id=>{ S().q[id]=SRS.schedule(S().q[id],true,Date.now()); });
  window.__shift=2*D; ok(TR.todayPlan().due.length===0, "день 2: повторов нет");
  window.__shift=3*D; ok(TR.todayPlan().due.length===nOk, "день 3: возвращаются верные с первого раза — "+TR.todayPlan().due.length);
  window.__shift=4*D; ok(TR.todayPlan().queue===F, "день 4: в очереди и исправленные ошибки — всего "+F+" (очередь "+TR.todayPlan().queue+", в сессии "+TR.todayPlan().due.length+")");
  // большая очередь: 60 просроченных → в сессии ~пополам
  window.__shift=10*D; const bak=JSON.stringify(S().q); const big=TR.Q.length>=100; if(big) TR.Q.slice(TR.Q.length-60).forEach(q=>{S().q[q.id]={n:1,ok:1,last:1,at:Date.now()-5*D,box:2,due:Date.now()-D};});
  p=TR.todayPlan(); if(big) ok(p.ids.length===SRS.LIMITS.total && p.due.length>=12 && p.fresh.length>=12, "большая очередь: сессия "+p.ids.length+" = "+p.due.length+" повторов + "+p.fresh.length+" новых");
  Object.keys(S().q).forEach(k=>delete S().q[k]); Object.assign(S().q, JSON.parse(bak)); window.__shift=4*D;
  ok(TR.todayPlan().tomorrow>=10, "прогноз «завтра» считается");
  window.__shift=0;
  // экраны
  TR.home(); await w(20); ok(!!document.querySelector(".today"), "главная: карточка «На сегодня»");
  ok(!!document.querySelector("#t-map") && !!document.querySelector("#custom"), "главная: карта курса и «Свой тест»");
  ok(document.querySelectorAll("#start").length===0, "главная: нет второй кнопки «Начать»");
  document.querySelector("[data-lesson]").click(); await w(20);
  ok(!!document.querySelector(".cheat h1") && !!document.querySelector("#train") && !!document.querySelector("#cards"), "урок: шпаргалка + тест + карточки");
  document.querySelector("#x").click(); await w(20);
  document.querySelector("#custom").click(); await w(20);
  ok(!!document.querySelector("#start") && !!document.querySelector("[data-gsel]"), "свой тест: выбор уроков и старт");
  document.querySelector("#selall").click(); await w(20); if(/Выбрать/.test(document.querySelector("#selall").textContent)) { document.querySelector("#selall").click(); await w(20); }
  ok(/Карточки · \d+/.test(document.querySelector("#cards")?.textContent||""), "свой тест: карточки по смеси уроков");
  document.querySelector("#cards").click(); await w(20); ok(!!document.querySelector("#card"), "свой тест → карточки открываются");
  let bad=[]; TR.D.topics.forEach(t=>{ STUDY_UI.cheat(t.id); if(!document.querySelector(".cheat h1")) bad.push(t.id); });
  ok(!bad.length, "шпаргалки всех уроков открываются "+(bad.join(",")||""));
  STUDY_UI.cheatList(); ok(document.querySelectorAll("[data-cheat]").length===TR.D.topics.length, "список шпаргалок: все уроки");
  STUDY_UI.map(); await w(30); const nodes=document.querySelectorAll(".node"); ok(nodes.length===STUDY_UI.ST.list.length, "карта: все понятия ("+nodes.length+")");
  let edges=0; for(const n of [...nodes].slice(0,60)){ n.click(); edges=Math.max(edges,document.querySelectorAll("svg.edges path").length); }
  ok(edges>0 && !!document.querySelector(".mpanel"), "карта: связи рисуются, панель открывается");
  STUDY_UI.map({blank:true}); await w(20); document.querySelector(".node").click(); document.querySelector("#byes")?.click();
  ok(Object.keys(S().cards).length>0, "пустая карта: отметка «помню» записывается в карточки");
  let done=false; STUDY_UI.cards(STUDY_UI.byTopic(TR.D.topics.find(t=>STUDY_UI.byTopic(t.id).length>=3).id).map(c=>c.id),{max:3,onDone:()=>{done=true;}});
  for(let k=0;k<3;k++){ document.querySelector("#flip").click(); document.querySelector("#yes").click(); }
  ok(done, "карточки: 3 ответа «знаю» → переход дальше");
  const hasQ = TR.todayPlan().ids.length>0; TR.startToday(); await w(20); ok(hasQ ? !!document.querySelector(".qtt") && !/карточки/i.test(document.querySelector(".brand").textContent) : /карточки/i.test(document.querySelector(".brand").textContent), "«На сегодня» начинается с вопросов, карточки — в конце");
  { const ss={qids:[TR.Q[0].id],answers:{[TR.Q[0].id]:1},title:"На сегодня",mode:"today"}; TR.finish(ss); await w(20); const b=document.querySelector("#tcards"); ok(!STUDY_UI.todayCards().length || !!b, "итоги «На сегодня»: кнопка карточек в конце"); if(b){ b.click(); await w(20); ok(!!document.querySelector("#card"), "итоги → карточки открываются"); } }
 }catch(e){ log.push("ОШИБКА "+e.message+" "+e.stack); fails++; }
 document.title=(fails?"FAIL ":"OK ")+log.join(" | ");
})();
</script></body>'''
tmp = os.path.join(TR, "_e2e_study.html")
open(tmp, "w", encoding="utf-8").write(src.replace("</body>", test))
try:
    out = subprocess.run([CH, "--headless=new", "--disable-gpu", "--virtual-time-budget=60000", "--dump-dom", "file://" + tmp],
                         capture_output=True, text=True, timeout=300).stdout
    m = re.search(r"<title>([^<]*)", out)
    print((m.group(1) if m else "нет результата").replace(" | ", "\n"))
finally:
    os.remove(tmp)
