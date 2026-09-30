// Шпаргалки, флэшкарты и карта курса. Всё собирается из trainer/study-*.js (формат — docs/FORMAT.md, правила — RULES.md §10):
// новый урок = новые записи в данных, этот файл трогать не нужно.
// Доступ к состоянию тренажёра — через window.TR (его выставляет index.html перед первым показом главной).
(() => {
const PARTS = window.STUDY_PARTS || [];
const ST = { concepts: {}, list: [], links: [...(window.STUDY_LINKS || [])], cheats: {} };
PARTS.forEach(p => {
  (p.concepts || []).forEach(c => { ST.concepts[c.id] = c; ST.list.push(c); });
  ST.links.push(...(p.links || []));
  Object.assign(ST.cheats, p.cheats || {});
});
ST.links = ST.links.filter(l => ST.concepts[l.from] && ST.concepts[l.to]);

const css = `
.cheat { background: var(--card); border: 1px solid var(--line); border-radius: var(--r); padding: 22px 22px 18px; box-shadow: var(--shadow); }
.cheat h1 { margin: 0; font-size: 24px; letter-spacing: -.02em; line-height: 1.2; }
.cheat .gist { margin: 8px 0 4px; color: var(--ink2); font-size: 16px; }
.cheat h3 { margin: 18px 0 8px; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); }
.cdef { display: grid; grid-template-columns: 10px 1fr; gap: 0 10px; padding: 7px 0; border-top: 1px dashed var(--line); font-size: 15px; line-height: 1.45; }
.cdef:first-of-type { border-top: 0; }
.cdef .st { width: 8px; height: 8px; border-radius: 50%; margin-top: 8px; background: var(--line); }
.st.ok { background: var(--ok) !important; } .st.bad { background: var(--bad) !important; } .st.learn { background: var(--l2) !important; }
.cdef b { font-weight: 700; } .cdef .fx, .fxrow .fx { font-variant-numeric: tabular-nums; background: var(--bg2); border-radius: 8px; padding: 1px 7px; font-size: 14px; }
.cheat ul, .cheat ol { margin: 0; padding-left: 22px; font-size: 15px; line-height: 1.5; } .cheat li { margin: 2px 0; }
.fxrow { display: flex; gap: 10px; align-items: baseline; padding: 5px 0; font-size: 15px; flex-wrap: wrap; }
.cheat figure { margin: 12px 0 0; } .cheat figure img { display: block; max-width: 100%; max-height: 380px; margin: 0 auto; border-radius: 12px; border: 1px solid var(--line); }
.cheat figcaption { font-size: 12.5px; color: var(--muted); margin-top: 4px; }
.lacts { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-bottom: 14px; }
.lacts .btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 10px; }
.lacts .btn small { font-size: 12px; font-weight: 500; opacity: .8; }
.cnav { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.cnav .btn { flex: 1 1 160px; }
.clist { display: grid; gap: 14px; }
.clist .topics { margin-top: 8px; }
.fcard { min-height: 280px; background: var(--card); border: 2px solid var(--line); border-radius: 22px; padding: 26px 22px; box-shadow: var(--press);
  display: flex; flex-direction: column; justify-content: center; text-align: center; cursor: pointer; user-select: none; }
.fcard .ctx { font-size: 12.5px; color: var(--muted); margin-bottom: 14px; }
.fcard .front { font-size: 26px; font-weight: 800; letter-spacing: -.02em; line-height: 1.2; }
.fcard .front.long { font-size: 18px; font-weight: 600; letter-spacing: 0; line-height: 1.45; }
.fcard .back { margin-top: 18px; padding-top: 16px; border-top: 1px dashed var(--line); font-size: 16px; line-height: 1.5; color: var(--ink2); text-align: left; }
.fcard .back b.t { display: block; font-size: 22px; color: var(--ink); text-align: center; margin-bottom: 4px; }
.fcard .back img { width: 100%; margin-top: 10px; border-radius: 10px; }
.fcard .tap { margin-top: 16px; font-size: 13px; color: var(--muted); }
.cdir { display: flex; justify-content: center; margin: 12px 0 0; }
.wrap.wide { max-width: 1240px; }
.map { position: relative; display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 16px; align-items: start; }
.map svg.edges { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; z-index: 2; }
.map .gcol h3 { margin: 0 0 8px; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
.mlesson { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 10px 12px 12px; margin-bottom: 12px; box-shadow: var(--shadow); }
.mlesson .lt { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; font-weight: 700; font-size: 14.5px; margin-bottom: 8px; }
.mlesson .lt button { font-size: 12px; }
.nodes { display: flex; flex-wrap: wrap; gap: 6px; }
.node { position: relative; z-index: 3; border: 1.5px solid var(--line); background: var(--bg); border-radius: 99px; padding: 4px 10px 4px 8px; font-size: 13px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 6px; color: var(--ink); text-align: left; line-height: 1.25; }
.node .st { width: 8px; height: 8px; border-radius: 50%; background: var(--line); flex: none; }
.node.hl { border-color: var(--pick); background: var(--pick-soft); }
.node.sel { border-color: var(--pick); background: var(--pick); color: #fff; }
.node.dim { opacity: .35; }
.node.blank span.t { filter: blur(5px); }
.edges path { fill: none; stroke: var(--pick); stroke-width: 1.6; opacity: .75; }
.edges text { font-size: 11px; fill: var(--pick); paint-order: stroke; stroke: var(--bg); stroke-width: 4px; font-weight: 600; }
.mpanel { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; background: var(--card); border-top: 1px solid var(--line); box-shadow: 0 -10px 30px -12px rgba(0,0,0,.25);
  padding: 14px 16px calc(14px + env(safe-area-inset-bottom)); max-height: 55vh; overflow: auto; }
.mpanel .in { max-width: 780px; margin: 0 auto; }
.mpanel .rel { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.mlegend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12.5px; color: var(--muted); margin: 0 0 14px; align-items: center; }
.mlegend i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--line); margin-right: 5px; }
@media print {
  body { background: #fff !important; } .top, .cnav, .noprint { display: none !important; }
  .cheat { box-shadow: none; border: 0; padding: 0; } .cheat figure img { max-height: 320px; width: auto; max-width: 100%; }
}`;
document.head.append(Object.assign(document.createElement("style"), { textContent: css }));

const T = () => window.TR;
const $app = () => document.getElementById("app");
const byTopic = tid => ST.list.filter(c => c.topic === tid);
const cardStatus = id => { const r = T().S.cards[id]; return !r ? "new" : r.last === 0 ? "bad" : r.box >= 3 ? "ok" : "learn"; };
// Состояние понятия для точек и карты: карточка + вопросы его микротемы.
function conceptStatus(c) {
  const cs = cardStatus(c.id), st = T().Q.filter(q => q.sub === c.sub).map(q => T().status(q.id));
  if (cs === "bad" || st.includes("bad")) return "bad";
  if (cs === "ok" || (cs === "new" && st.length && st.every(x => x === "ok"))) return "ok";
  if (cs === "learn" || st.includes("ok")) return "learn";
  return "new";
}
const fx = s => T().esc(s);
const topBar = (title, sub) => `<div class="top"><div class="brand"><button class="iconbtn" id="x" title="Назад">←</button>
  <div><div>${fx(title)}</div>${sub ? `<div class="tiny muted" style="font-weight:500">${fx(sub)}</div>` : ""}</div></div>
  <button class="iconbtn noprint" id="theme2" title="Светлая / тёмная тема">◐</button></div>`;
const bindTop = (el, back) => {
  el.querySelector("#x").onclick = back;
  el.querySelector("#theme2").onclick = () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    T().S.ui.theme = document.documentElement.dataset.theme = cur === "dark" ? "light" : "dark"; T().save();
  };
};
const mount = (html, wide) => { const a = $app(); a.classList.toggle("wide", !!wide); document.onkeydown = null; a.style.paddingBottom = ""; a.innerHTML = ""; const el = T().h(html); a.append(el); scrollTo(0, 0); return el; };
const trainTopic = tid => { const { Q, run, newSession, pickSubset, topicOf } = T(); const ids = Q.filter(q => q.topic === tid).map(q => q.id);
  run(newSession(pickSubset(ids, 20), { title: topicOf(tid).title, mode: "topics" })); };
const trainSub = sub => { const { Q, D, run, newSession } = T(); run(newSession(Q.filter(q => q.sub === sub).map(q => q.id), { title: D.subs[sub] || sub, mode: "topics" })); };

// ── СТРАНИЦА УРОКА = ШПАРГАЛКА + ДЕЙСТВИЯ ──────────────────
// Сверху — что делать с уроком (тест, карточки, ошибки), ниже шпаргалка и прогресс по микротемам.
// Урок без шпаргалки (данные ещё не готовы) тоже открывается: только действия и микротемы.
function lesson(tid, opt = {}) {
  const { D, Q, topicOf, esc, tableHtml, plural, status, run, newSession } = T();
  const t = topicOf(tid), ch = ST.cheats[tid];
  const back = opt.back || T().home;
  const g = D.groups.find(g => g.id === t.group), ts = D.topics.filter(x => x.group === t.group);
  const k = ts.findIndex(x => x.id === tid), prev = ts[k - 1], next = ts[k + 1];
  const tq = Q.filter(q => q.topic === tid), bad = tq.filter(q => status(q.id) === "bad"), fresh = tq.filter(q => status(q.id) === "new");
  const cs = byTopic(tid), nTest = Math.min(20, tq.length);
  const fxBlock = (ch?.blocks || []).some(b => b.formulas); // есть блок «Формулы» — у понятий их не повторяем
  const block = b => {
    let body = "";
    if (b.concepts) body += b.concepts.map(id => ST.concepts[id]).filter(Boolean).map(c => `<div class="cdef"><span class="st ${conceptStatus(c)}"></span>
      <div><b>${esc(c.term)}</b> — ${esc(c.def)}${c.formula && !fxBlock ? `<div style="margin-top:3px"><span class="fx">${esc(c.formula)}</span></div>` : ""}</div></div>`).join("");
    if (b.list) body += `<${b.ordered ? "ol" : "ul"}>${b.list.map(x => `<li>${esc(x)}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`;
    if (b.formulas) body += b.formulas.map(([n, f]) => `<div class="fxrow"><b>${esc(n)}</b><span class="fx">${esc(f)}</span></div>`).join("");
    if (b.table) body += tableHtml(b.table);
    if (b.text) body += `<p style="margin:0;font-size:15px">${esc(b.text)}</p>`;
    if (b.img) body += `<figure><img class="zoomable" src="img/${b.img}" alt="">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}</figure>`;
    return (b.title ? `<h3>${esc(b.title)}</h3>` : "") + body;
  };
  const subs = [...new Set(tq.map(q => q.sub))];
  const el = mount(`<div>${topBar(t.title, `${g ? g.title + " · " : ""}урок ${k + 1} из ${ts.length}`)}
    <div class="lacts noprint">
      <button class="btn primary" id="train">Тест по уроку<small>${nTest} ${plural(nTest, "вопрос", "вопроса", "вопросов")}${fresh.length ? ` · ${fresh.length} новых` : ""}</small></button>
      ${cs.length ? `<button class="btn" id="cards">Карточки<small>${cs.length} ${plural(cs.length, "понятие", "понятия", "понятий")}</small></button>` : ""}
      ${bad.length ? `<button class="btn" id="mist" style="color:var(--bad)">Ошибки<small>${bad.length} ${plural(bad.length, "вопрос", "вопроса", "вопросов")}</small></button>` : ""}
    </div>
    ${ch ? `<div class="cheat"><div class="tiny muted">Шпаргалка · ${esc(t.lesson || t.title)}</div><h1>${esc(t.title)}</h1>
      <p class="gist">${esc(ch.gist)}</p>${(ch.blocks || []).map(block).join("")}</div>
      <p class="tiny muted noprint" style="margin:8px 2px 0">Точка у понятия: <span style="color:var(--ok)">●</span> выучено, <span style="color:var(--l2)">●</span> учишь, <span style="color:var(--bad)">●</span> были ошибки, серая — ещё не встречалось.</p>`
      : `<div class="empty cheat">Шпаргалки к этому уроку пока нет — тест и прогресс уже работают.</div>`}
    <h2 class="sec noprint">Микротемы</h2>
    <div class="subs noprint">${subs.map(sb => { const qs = tq.filter(q => q.sub === sb), ok = qs.filter(q => status(q.id) === "ok").length, b2 = qs.filter(q => status(q.id) === "bad").length;
      return `<button class="srow" data-sub="${sb}" style="width:100%;background:none;border-left:0;border-right:0;border-bottom:0;text-align:left"><span>${esc(D.subs[sb] || sb)}</span>
        <span class="tiny muted" style="white-space:nowrap">${ok}/${qs.length}${b2 ? ` · <span style="color:var(--bad)">${b2} ✕</span>` : ""} →</span></button>`; }).join("")}</div>
    <div class="cnav noprint">${prev ? `<button class="btn" id="prev">← ${esc(prev.title)}</button>` : ""}${next ? `<button class="btn" id="next">${esc(next.title)} →</button>` : ""}</div>
    ${ch ? `<div class="noprint" style="text-align:center;margin-top:10px"><button class="link" id="print">Распечатать шпаргалку</button></div>` : ""}
  </div>`);
  bindTop(el, back);
  const self = () => lesson(tid, opt);
  el.querySelector("#train").onclick = () => trainTopic(tid);
  el.querySelector("#cards")?.addEventListener("click", () => cards(cs.map(c => c.id), { title: "Карточки · " + t.title, back: self }));
  el.querySelector("#mist")?.addEventListener("click", () => run(newSession(bad.map(q => q.id), { title: t.title + " · работа над ошибками", mode: "topics" })));
  el.querySelectorAll("[data-sub]").forEach(b => b.onclick = () => trainSub(b.dataset.sub));
  el.querySelector("#print")?.addEventListener("click", () => print());
  el.querySelector("#prev")?.addEventListener("click", () => lesson(prev.id, opt));
  el.querySelector("#next")?.addEventListener("click", () => lesson(next.id, opt));
}
const cheat = lesson;

function cheatList() {
  const { D, esc, plural } = T();
  const el = mount(`<div>${topBar("Шпаргалки", "Перечитать урок за 2 минуты")}
    <div class="clist">${D.groups.map((g, gi) => { const ts = D.topics.filter(t => t.group === g.id && ST.cheats[t.id]); if (!ts.length) return "";
      return `<div class="group"><div class="num tiny muted" style="font-weight:600">Тема ${gi + 1}</div><b>${esc(g.title)}</b>
        <div class="topics">${ts.map(t => { const cs = byTopic(t.id), ok = cs.filter(c => conceptStatus(c) === "ok").length, bad = cs.filter(c => conceptStatus(c) === "bad").length;
          return `<button class="topic" data-cheat="${t.id}"><div class="num">${cs.length} ${plural(cs.length, "понятие", "понятия", "понятий")}</div><b>${esc(t.title)}</b>
            <div class="mbar"><i class="g" style="width:${ok / (cs.length || 1) * 100}%"></i><i class="r" style="width:${bad / (cs.length || 1) * 100}%"></i></div>
            <div class="tstat"><span>${ok}/${cs.length} выучено</span>${bad ? `<span style="color:var(--bad)">${bad} с ошибками</span>` : ""}</div></button>`; }).join("")}</div></div>`; }).join("")}</div></div>`);
  bindTop(el, T().home);
  el.querySelectorAll("[data-cheat]").forEach(b => b.onclick = () => cheat(b.dataset.cheat, { back: cheatList }));
}

// ── ФЛЭШКАРТЫ ─────────────────────────────────────────────
// Приоритет: просроченные → с ошибкой → новые → остальные по давности. Лимит — max карточек.
function orderCards(ids, max = 20) {
  const S = T().S, now = Date.now();
  const pr = id => { const r = S.cards[id]; return !r ? 2 : SRS.isDue(r, now) ? 0 : r.last === 0 ? 1 : 3 + (r.due || 0) / 1e13; };
  return T().shuffle(ids).sort((a, b) => pr(a) - pr(b)).slice(0, max);
}
// Карточки для «На сегодня»: просроченные + до 10 новых из микротем, где уже были вопросы.
function todayCards(now = Date.now()) {
  const S = T().S, all = ST.list.map(c => c.id);
  const due = SRS.dueList(S.cards, all, now).slice(0, 15);
  const d0 = SRS.dayStart(now), freshDone = Object.values(S.cards).filter(r => r.first >= d0).length;
  const seenSub = new Set(T().Q.filter(q => S.q[q.id]).map(q => q.sub));
  const fresh = ST.list.filter(c => !S.cards[c.id] && seenSub.has(c.sub)).slice(0, Math.max(0, Math.min(10 - freshDone, 15 - due.length))).map(c => c.id);
  return [...due, ...fresh];
}

function cards(ids, opt = {}) {
  const { esc, topicOf, D, plural, save } = T();
  const list = opt.ordered ? ids.slice() : orderCards(ids, opt.max || 20);
  if (!list.length) return (opt.onDone || opt.back || T().home)();
  const back = opt.back || T().home;
  let i = 0, flipped = false, rev = !!T().S.ui.cardsRev;
  const res = {};
  const show = () => {
    const c = ST.concepts[list[i]], t = topicOf(c.topic);
    const front = rev ? c.def : c.term;
    const el = mount(`<div>${topBar(opt.title || "Карточки", `${i + 1} из ${list.length}`)}
      <div class="fcard" id="card"><div class="ctx">${esc(t.title)} · ${esc(D.subs[c.sub] || "")}</div>
        <div class="front ${rev ? "long" : ""}">${esc(front)}</div>
        ${flipped ? `<div class="back">${rev ? `<b class="t">${esc(c.term)}</b>` : esc(c.def)}${c.formula ? `<div style="margin-top:8px;text-align:center"><span class="fx" style="background:var(--bg2);border-radius:8px;padding:2px 8px">${esc(c.formula)}</span></div>` : ""}${c.img ? `<img class="zoomable" src="img/${c.img}" alt="">` : ""}</div>`
          : `<div class="tap">${rev ? "Какой это термин? Вспомни и нажми" : "Вспомни определение и нажми на карточку"}</div>`}</div>
      <div class="cdir"><button class="chipbtn" id="dir">${rev ? "Определение → термин" : "Термин → определение"} ⇄</button></div>
      <div class="startbar"><div class="in">${flipped
        ? `<button class="btn big" id="no" style="flex:1">Не знаю</button><button class="btn primary big" id="yes" style="flex:1">Знаю</button>`
        : `<button class="btn primary big" id="flip" style="flex:1">Показать ответ</button>`}</div></div></div>`);
    $app().style.paddingBottom = "110px";
    bindTop(el, () => { document.onkeydown = null; back(); });
    const flip = () => { if (!flipped) { flipped = true; show(); } };
    el.querySelector("#card").onclick = e => { if (!e.target.closest("img")) flip(); };
    el.querySelector("#flip")?.addEventListener("click", flip);
    el.querySelector("#dir").onclick = () => { rev = T().S.ui.cardsRev = !rev; save(); show(); };
    const answer = ok => {
      const S = T().S, now = Date.now(), r = S.cards[c.id] || { n: 0, ok: 0, first: now };
      r.n++; if (ok) r.ok++; r.last = ok ? 1 : 0; r.at = now; S.cards[c.id] = SRS.schedule(r, ok, now); T().markDay(); save();
      res[c.id] = ok ? 1 : 0; flipped = false;
      if (++i < list.length) show(); else done();
    };
    el.querySelector("#yes")?.addEventListener("click", () => answer(true));
    el.querySelector("#no")?.addEventListener("click", () => answer(false));
    document.onkeydown = e => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flipped ? answer(true) : flip(); }
      else if (flipped && (e.key === "1" || e.key === "ArrowLeft")) answer(false);
      else if (flipped && (e.key === "2" || e.key === "ArrowRight")) answer(true);
    };
  };
  const done = () => {
    document.onkeydown = null;
    const ok = Object.values(res).filter(Boolean).length, bad = list.filter(id => res[id] === 0);
    if (opt.onDone && !bad.length) return opt.onDone();
    const el = mount(`<div>${topBar(opt.title || "Карточки", "Итог")}
      <div class="res"><div class="pct">${ok}/${list.length}</div><div class="muted">${plural(ok, "карточка знакома", "карточки знакомы", "карточек знакомо")}</div></div>
      ${bad.length ? `<h2 class="sec">Не знаю</h2><div class="subs">${bad.map(id => { const c = ST.concepts[id];
        return `<div class="mist"><div class="mq">${esc(c.term)}</div><div class="ma">${esc(c.def)}</div></div>`; }).join("")}</div>` : ""}
      <div class="startbar"><div class="in">
        ${bad.length ? `<button class="btn" id="again" style="flex:1">Ещё раз · ${bad.length}</button>` : ""}
        <button class="btn primary" id="go" style="flex:1.4">${opt.onDone ? "Дальше — вопросы" : "Готово"}</button></div></div></div>`);
    $app().style.paddingBottom = "110px";
    bindTop(el, back);
    el.querySelector("#again")?.addEventListener("click", () => cards(bad, { ...opt, ordered: true }));
    el.querySelector("#go").onclick = opt.onDone || back;
  };
  show();
}

// ── КАРТА КУРСА ───────────────────────────────────────────
// Раскладка из данных: колонки — темы, в колонке уроки по порядку, в уроке — понятия.
// Стрелки рисуются поверх по координатам узлов, только для выбранного понятия или урока,
// поэтому новый урок или тема просто добавляют колонку/блок, ничего не нужно расставлять руками.
function map(opt = {}) {
  const { D, esc } = T();
  let blank = !!opt.blank, sel = null;
  const groups = D.groups.map(g => ({ g, ts: D.topics.filter(t => t.group === g.id && byTopic(t.id).length) })).filter(x => x.ts.length);
  const el = mount(`<div>${topBar("Карта курса", `${ST.list.length} понятий · ${ST.links.length} связей`)}
    <div class="seg noprint" id="mode" style="margin-bottom:12px"><button data-m="0" class="${blank ? "" : "on"}">Карта<small>нажми на понятие — увидишь связи</small></button>
      <button data-m="1" class="${blank ? "on" : ""}">Пустая карта<small>вспомни, что скрыто</small></button></div>
    <div class="mlegend"><span><i style="background:var(--ok)"></i>выучено</span><span><i style="background:var(--l2)"></i>учишь</span><span><i style="background:var(--bad)"></i>ошибки</span><span><i></i>новое</span></div>
    <div class="map" id="map"><svg class="edges"></svg>${groups.map(({ g, ts }) => `<div class="gcol"><h3>${esc(g.title)}</h3>${ts.map(t => `
      <div class="mlesson" data-lesson="${t.id}"><div class="lt"><span>${esc(t.title)}</span>${ST.cheats[t.id] ? `<button class="link" data-ch="${t.id}">урок →</button>` : ""}</div>
        <div class="nodes">${byTopic(t.id).map(c => `<button class="node ${blank ? "blank" : ""}" data-c="${c.id}"><span class="st ${conceptStatus(c)}"></span><span class="t">${esc(c.term)}</span></button>`).join("")}</div></div>`).join("")}</div>`).join("")}</div>
    <div style="height:40vh"></div></div>`, true);
  bindTop(el, () => { removeEventListener("resize", draw); $app().classList.remove("wide"); T().home(); });
  const svg = el.querySelector("svg.edges"), box = el.querySelector("#map");
  const nodeEl = id => el.querySelector(`.node[data-c="${CSS.escape(id)}"]`);
  const rel = id => ST.links.filter(l => l.from === id || l.to === id);
  function draw() {
    if (!box.isConnected) return removeEventListener("resize", draw);
    svg.innerHTML = "";
    if (!sel) return;
    const B = box.getBoundingClientRect();
    const ls = sel.type === "c" ? rel(sel.id) : ST.links.filter(l => (ST.concepts[l.from].topic === sel.id) !== (ST.concepts[l.to].topic === sel.id));
    const ns = "http://www.w3.org/2000/svg";
    const used = [];
    ls.forEach(l => {
      const a = nodeEl(l.from)?.getBoundingClientRect(), b = nodeEl(l.to)?.getBoundingClientRect(); if (!a || !b) return;
      const x1 = a.left + a.width / 2 - B.left, y1 = a.top + a.height / 2 - B.top, x2 = b.left + b.width / 2 - B.left, y2 = b.top + b.height / 2 - B.top;
      const dx = Math.abs(x2 - x1), bend = Math.max(40, Math.min(160, dx * .35 + Math.abs(y2 - y1) * .15));
      const p = document.createElementNS(ns, "path");
      p.setAttribute("d", `M${x1},${y1} C${x1 + (x2 >= x1 ? bend : -bend) * (dx < 30 ? 1.4 : 1)},${y1} ${x2 - (x2 >= x1 ? bend : -bend) * (dx < 30 ? -1.4 : 1)},${y2} ${x2},${y2}`);
      svg.append(p);
      // подпись — в середине кривой, но не поверх уже поставленной
      let lx = (x1 + x2) / 2 + (dx < 30 ? 30 : 0), ly = (y1 + y2) / 2 - 4;
      while (used.some(([ux, uy]) => Math.abs(ux - lx) < 70 && Math.abs(uy - ly) < 13)) ly += 14;
      used.push([lx, ly]);
      if (!blank) { const tx = document.createElementNS(ns, "text"); tx.setAttribute("x", lx); tx.setAttribute("y", ly);
        tx.setAttribute("text-anchor", "middle"); tx.textContent = l.label || ""; svg.append(tx); }
    });
  }
  const paint = () => {
    const on = new Set();
    if (sel && sel.type === "c") { on.add(sel.id); rel(sel.id).forEach(l => { on.add(l.from); on.add(l.to); }); }
    if (sel && sel.type === "t") ST.links.forEach(l => { const a = ST.concepts[l.from].topic === sel.id, b = ST.concepts[l.to].topic === sel.id; if (a !== b) { on.add(l.from); on.add(l.to); } });
    el.querySelectorAll(".node").forEach(n => { const id = n.dataset.c;
      n.classList.toggle("sel", !!sel && sel.type === "c" && sel.id === id);
      n.classList.toggle("hl", on.has(id) && !(sel.type === "c" && sel.id === id));
      n.classList.toggle("dim", !!sel && !on.has(id) && !(sel.type === "t" && ST.concepts[id].topic === sel.id)); });
    draw();
  };
  const panel = html => { el.querySelector(".mpanel")?.remove(); if (!html) return; const p = T().h(`<div class="mpanel"><div class="in">${html}</div></div>`); el.append(p); return p; };
  const openConcept = (id, reveal) => {
    const c = ST.concepts[id]; sel = { type: "c", id }; paint();
    const n = nodeEl(id); n.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const shown = !blank || reveal;
    if (shown && blank) n.classList.remove("blank");
    const rs = rel(id);
    const p = panel(`<div style="display:flex;justify-content:space-between;gap:10px;align-items:start">
        <div><div class="tiny muted">${esc(T().topicOf(c.topic).title)} · ${esc(D.subs[c.sub] || "")}</div>
        <b style="font-size:19px">${shown ? esc(c.term) : "Что это за понятие?"}</b></div><button class="iconbtn" id="pclose">✕</button></div>
      <div style="margin-top:6px;font-size:15px;color:var(--ink2)">${esc(c.def)}</div>
      ${c.formula && shown ? `<div style="margin-top:6px"><span class="fx" style="background:var(--bg2);border-radius:8px;padding:2px 8px">${esc(c.formula)}</span></div>` : ""}
      ${shown && rs.length ? `<div class="rel">${rs.map(l => { const o = l.from === id ? l.to : l.from, oc = ST.concepts[o];
        return `<button class="chipbtn" data-go="${o}">${l.from === id ? `${esc(l.label || "")} → <b>${esc(oc.term)}</b>` : `<b>${esc(oc.term)}</b> → ${esc(l.label || "")}`}</button>`; }).join("")}</div>` : ""}
      <div class="row" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${blank && !reveal
        ? `<button class="btn" id="bno">Не помню</button><button class="btn primary" id="byes">Помню</button>`
        : `<button class="btn" id="psub">Потренировать микротему</button>${ST.cheats[c.topic] ? `<button class="btn" id="pch">Открыть урок</button>` : ""}`}</div>`);
    p.querySelector("#pclose").onclick = () => { sel = null; panel(); paint(); };
    p.querySelectorAll("[data-go]").forEach(b => b.onclick = () => openConcept(b.dataset.go, true));
    p.querySelector("#psub")?.addEventListener("click", () => trainSub(c.sub));
    p.querySelector("#pch")?.addEventListener("click", () => cheat(c.topic, { back: () => map({ blank }) }));
    const grade = ok => { const S = T().S, now = Date.now(), r = S.cards[id] || { n: 0, ok: 0, first: now };
      r.n++; if (ok) r.ok++; r.last = ok ? 1 : 0; r.at = now; S.cards[id] = SRS.schedule(r, ok, now); T().markDay(); T().save();
      n.querySelector(".st").className = "st " + conceptStatus(c); openConcept(id, true); };
    p.querySelector("#byes")?.addEventListener("click", () => grade(true));
    p.querySelector("#bno")?.addEventListener("click", () => grade(false));
  };
  el.querySelectorAll(".node").forEach(n => n.onclick = () => openConcept(n.dataset.c));
  el.querySelectorAll(".mlesson .lt span").forEach(s => { s.style.cursor = "pointer"; s.onclick = () => { const id = s.closest(".mlesson").dataset.lesson;
    sel = sel && sel.type === "t" && sel.id === id ? null : { type: "t", id }; panel(); paint(); }; });
  el.querySelectorAll("[data-ch]").forEach(b => b.onclick = () => cheat(b.dataset.ch, { back: () => map({ blank }) }));
  el.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { removeEventListener("resize", draw); map({ blank: b.dataset.m === "1" }); });
  addEventListener("resize", draw);
}

window.STUDY_UI = { ST, has: () => ST.list.length > 0, hasCheat: tid => !!ST.cheats[tid], byTopic, cheat, lesson, cheatList, cards, todayCards, map, conceptStatus };
})();
