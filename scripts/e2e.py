#!/usr/bin/env python3
"""Автотест тренажёра в headless-Chrome: марафон по всем вопросам.
Запуск (из папки проекта): python3 <скилл>/scripts/e2e.py [папка тренажёра, по умолчанию ./trainer]
Нужен Chrome из кэша Playwright (~/Library/Caches/ms-playwright/chromium-*) или обычный Google Chrome.
Внешний шрифт в тестовой копии отключается (без сети headless-Chrome на нём зависает)."""
import os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import trainer_dir, chrome, page, KEY_JS
TR = trainer_dir()
CH = chrome()
src = page(TR)
test = r'''<script>
window.onerror=(m,s,l)=>{document.title="ERR "+m+" @"+l;};
localStorage.clear();
const w=ms=>new Promise(r=>setTimeout(r,ms)); const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const byId=Object.fromEntries(window.QUIZ_PARTS.flatMap(p=>p.questions).map(q=>[q.id,q]));
const RANK={match:1,mcq:2,truefalse:3,sort:4,table:4.3,frame:4.6,order:5,cloze:6,list:7,recall:8};
(async()=>{ const log=[]; let n=0, ok=0, stuck=[];
 try{ await w(100);
 $("#custom").click(); await w(50);
 if(/Выбрать/.test($("#selall").textContent)) $("#selall").click(); $("[data-len=\"0\"]").click(); $("#start").click(); await w(50);
 const ids=()=>JSON.parse(localStorage.getItem(__KEY__)).sessions[0].qids;
 const order=ids().map(id=>byId[id]); let viol=0, same=0; const seen={};
 // правило порядка: в простой фазе «верно/неверно» только после первого определения (match/mcq) своей микротемы;
 // в фазах 2 и 3 — строго по RANK внутри микротемы
 const R2={match:1,mcq:1,truefalse:1,sort:4,table:4.3,frame:4.6,order:5,cloze:6,list:7,recall:8}; const defDone=new Set();
 order.forEach((q,i)=>{
  if(q.type==="truefalse" && !defDone.has(q.sub) && order.some(p=>p.sub===q.sub&&(p.type==="match"||p.type==="mcq"))) viol++;
  if(q.type==="match"||q.type==="mcq") defDone.add(q.sub);
  if((seen[q.sub]||0)>R2[q.type]) viol++; seen[q.sub]=Math.max(seen[q.sub]||0,R2[q.type]);
  if(i&&order[i-1].type===q.type) same++; });
 const LV={truefalse:1,mcq:1,match:1,sort:2,table:2,frame:2,order:2,cloze:3,list:3,recall:3}; let phase=0;
 order.forEach((q,i)=>{ if(i&&LV[q.type]<LV[order[i-1].type]) phase++; });
 const free=order.filter(q=>LV[q.type]===3), noSimple=free.filter(q=>!order.slice(0,order.indexOf(q)).some(p=>p.sub===q.sub&&LV[p.type]===1));
 log.push("вопросов "+order.length+", нарушений порядка в микротемах "+viol+", откатов между фазами "+phase+", свободных ответов без простых перед ними "+noSimple.length+", одинаковых типов подряд "+same);
 for(let g=0; g<3000 && $(".body"); g++){
  const q=byId[ids()[+$(".qn.cur").dataset.j]]; const a=$(".area");
  $("#hintbtn")?.click();
  if(q.type==="truefalse") a.querySelectorAll(".opt")[q.answer?0:1].click();
  else if(q.type==="mcq" && q.correct.length===1){ [...a.querySelectorAll(".opt")].find(o=>o.textContent.includes(q.options[q.correct[0]]))?.click(); }
  else {
   a.querySelectorAll(".sitem").forEach(e=>e.querySelector(".pill").click());
   a.querySelectorAll("td.slot, .fslot").forEach(e=>{ e.click(); a.querySelector(".chip:not(.used)")?.click(); });
   a.querySelectorAll(".match .R .opt").forEach(o=>o.click());
   a.querySelectorAll(".tin").forEach(i=>{i.value="x"; i.dispatchEvent(new Event("input"));});
   if(a.querySelector(".opts")) a.querySelector(".opt").click();
   if(!$("#chk")||$("#chk").disabled){ stuck.push(q.id); break; }
   $("#chk").click(); if($("#yes")) $("#yes").click();
  }
  n++; if($(".foot.ok")){ ok++; await w(1000); } else { $("#next").click(); await w(5); }
 }
 await w(300);
 log.push("отвечено "+n+", зависаний: "+(stuck.join(",")||"нет")+", экран итогов: "+(!!$(".pct")));
 }catch(e){log.push("ОШИБКА "+e.message)}
 document.title=log.join(" | ");
})();
</script></body>'''
test = test.replace("__KEY__", KEY_JS)
tmp = os.path.join(TR, "_e2e.html")
open(tmp, "w", encoding="utf-8").write(src.replace("</body>", test))
try:
    out = subprocess.run([CH, "--headless=new", "--disable-gpu", "--virtual-time-budget=3000000", "--dump-dom", "file://" + tmp],
                         capture_output=True, text=True, timeout=900).stdout
    m = re.search(r"<title>([^<]*)", out)
    print((m.group(1) if m else "нет результата").replace(" | ", "\n"))
finally:
    os.remove(tmp)
