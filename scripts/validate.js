// Проверка всех файлов вопросов trainer/quiz-data*.js.
// Запуск: node scripts/validate.js      (0 ошибок — можно сдавать)
const path = require("path"), fs = require("fs");
const { TR, LOGS } = require("./lib_trainer");
global.window = {};
for (const f of fs.readdirSync(TR).filter(f => /^quiz-data.*\.js$/.test(f))) require(path.join(TR, f));
const L = { truefalse: 1, mcq: 1, match: 1, sort: 2, table: 2, frame: 2, order: 2, cloze: 3, list: 3, recall: 3 };
const html = fs.readFileSync(path.join(TR, "index.html"), "utf8");
let e = 0; const ids = new Set(); const err = (...a) => { console.log(...a); e++; };
for (const f of fs.readdirSync(TR).filter(f => /^quiz-data.*\.js$/.test(f)))
  if (!html.includes(`src="${f}"`)) err("файл не подключён в index.html:", f);
for (const P of window.QUIZ_PARTS) {
  const subs = {};
  for (const q of P.questions) {
    if (ids.has(q.id)) err("повтор id", q.id); ids.add(q.id);
    if (!L[q.type]) err("неизвестный тип", q.id, q.type);
    if (!P.subs[q.sub]) err("нет микротемы", q.id, q.sub);
    if (!P.topics.find(t => t.id === q.topic)) err("нет урока", q.id, q.topic);
    if (q.type === "mcq" && (!q.correct.length || q.correct.some(k => k >= q.options.length))) err("mcq: correct", q.id);
    if (q.type === "cloze" && !q.q.includes("___")) err("cloze без ___", q.id);
    if (q.type === "list" && q.answers.length < q.need) err("list: вариантов меньше need", q.id);
    if (q.type === "table") {
      if (!q.blanks || q.blanks.length < 2) err("table: меньше 2 пропусков", q.id);
      if (q.rows.some(r => r.length !== q.head.length)) err("table: разная длина строк", q.id);
      (q.blanks || []).forEach(k => { const [r, c] = k.split("-").map(Number); if (!q.rows[r] || q.rows[r][c] == null || c === 0) err("table: плохой пропуск", q.id, k); });
    }
    if (q.type === "frame") {
      if (!["grid", "funnel", "steps", "nested", "tree"].includes(q.layout)) err("frame: неизвестная раскладка", q.id, q.layout);
      if (!q.slots || q.slots.length < 3) err("frame: меньше 3 слотов", q.id);
      if (q.layout === "grid") q.slots.forEach(x => { if (!x.area || !q.areas.some(r => r.split(/\s+/).includes(x.area))) err("frame: слот вне сетки", q.id, x.area); });
      if (q.layout === "tree") { if (q.slots.filter(x => x.parent == null).length !== 1) err("frame: у дерева не один корень", q.id);
        q.slots.forEach(x => { if (x.parent != null && !q.slots[x.parent]) err("frame: плохой parent", q.id); }); }
      if (new Set(q.slots.map(x => x.label)).size !== q.slots.length) err("frame: одинаковые названия слотов", q.id);
    }
    if (q.type !== "recall" && !q.explanation) err("нет разбора", q.id);
    if (q.type !== "recall" && !q.hint) err("нет подсказки", q.id);
    if (q.type === "recall" && !q.back) err("recall без эталона", q.id);
    for (const t of [q.explainTable, q.hint && q.hint.table]) if (t && t.rows.some(r => r.length !== t.head.length)) err("таблица: разная длина строк", q.id);
    [].concat(q.img || [], q.explainImg || [], (q.hint && q.hint.img) || [], (q.pairs || []).map(p => p[0] && p[0].img).filter(Boolean))
      .forEach(im => { if (!fs.existsSync(path.join(TR, "img", im))) err("нет картинки", q.id, im); });
    (subs[q.sub] ||= { lv: new Set(), n: 0, base: false, simple: 0, free: 0 }); subs[q.sub].lv.add(L[q.type]); subs[q.sub].n++;
    if (L[q.type] === 1) subs[q.sub].simple++; if (L[q.type] === 3) subs[q.sub].free++;
    if (q.type === "match" || q.type === "mcq") subs[q.sub].base = true;
  }
  for (const [s, v] of Object.entries(subs)) {
    if (v.n < 3) console.log("  внимание: в микротеме меньше 3 вопросов:", s);
    if (v.lv.size < 2) console.log("  внимание: в микротеме один уровень:", s);
    if (!v.base) console.log("  внимание: в микротеме нет базового match/mcq:", s);
    if (v.free && v.simple < 2) console.log("  внимание: в микротеме есть свободные ответы, но меньше 2 простых вопросов:", s);
  }
  const hints = P.questions.filter(q => q.hint).length, im = P.questions.filter(q => q.img).length;
  const simple = P.questions.filter(q => L[q.type] === 1).length;
  console.log(`${P.group.title}: уроков ${P.topics.length}, вопросов ${P.questions.length} (простых ${simple}, ${Math.round(simple / P.questions.length * 100)}%), с подсказкой ${hints}, со схемой в вопросе ${im}`);
}
// ── Учебные материалы: trainer/study-*.js (понятия, связи, шпаргалки) ──
const studyFiles = fs.readdirSync(TR).filter(f => /^study-.*\.js$/.test(f));
for (const f of studyFiles) {
  if (!html.includes(`src="${f}"`)) err("файл не подключён в index.html:", f);
  require(path.join(TR, f));
}
const topicsAll = window.QUIZ_PARTS.flatMap(P => P.topics.map(t => ({ ...t, group: P.group.id })));
const subsAll = Object.assign({}, ...window.QUIZ_PARTS.map(P => P.subs));
const concepts = {}, links = [...(window.STUDY_LINKS || [])];
const cheats = {};
for (const SP of window.STUDY_PARTS || []) {
  if (!window.QUIZ_PARTS.some(P => P.group.id === SP.group)) err("study: нет темы", SP.group);
  for (const c of SP.concepts || []) {
    if (concepts[c.id]) err("study: повтор id понятия", c.id);
    concepts[c.id] = c;
    const t = topicsAll.find(t => t.id === c.topic);
    if (!t) err("study: у понятия нет урока", c.id, c.topic);
    else if (t.group !== SP.group) err("study: урок понятия из другой темы", c.id);
    if (!subsAll[c.sub]) err("study: у понятия нет микротемы", c.id, c.sub);
    if (!c.term || !c.def) err("study: у понятия нет term/def", c.id);
    if (c.img && !fs.existsSync(path.join(TR, "img", c.img))) err("study: нет картинки", c.id, c.img);
  }
  links.push(...(SP.links || []));
  for (const [tid, ch] of Object.entries(SP.cheats || {})) {
    if (cheats[tid]) err("study: две шпаргалки для урока", tid); cheats[tid] = ch;
    if (!topicsAll.find(t => t.id === tid)) err("study: шпаргалка для несуществующего урока", tid);
    if (!ch.gist) err("study: у шпаргалки нет gist", tid);
    for (const b of ch.blocks || []) {
      (b.concepts || []).forEach(id => { if (!concepts[id] && !(SP.concepts || []).some(c => c.id === id)) err("study: в шпаргалке неизвестное понятие", tid, id); });
      if (b.img && !fs.existsSync(path.join(TR, "img", b.img))) err("study: нет картинки", tid, b.img);
      if (b.table && b.table.rows.some(r => r.length !== b.table.head.length)) err("study: таблица шпаргалки: разная длина строк", tid);
    }
  }
}
for (const l of links) {
  if (!concepts[l.from]) err("study: связь из неизвестного понятия", l.from);
  if (!concepts[l.to]) err("study: связь в неизвестное понятие", l.to);
  if (l.from === l.to) err("study: связь понятия с самим собой", l.from);
}
if ((window.STUDY_PARTS || []).length) {
  // У каждого урока: шпаргалка, понятия и хотя бы одна связь с другим уроком — иначе карта распадается.
  const studied = new Set((window.STUDY_PARTS || []).map(SP => SP.group));
  for (const t of topicsAll.filter(t => studied.has(t.group))) {
    const cs = Object.values(concepts).filter(c => c.topic === t.id);
    if (!cheats[t.id]) err("study: у урока нет шпаргалки", t.id);
    if (cs.length < 3) err("study: у урока меньше 3 понятий", t.id, cs.length);
    const ext = links.some(l => concepts[l.from] && concepts[l.to] &&
      ((concepts[l.from].topic === t.id) !== (concepts[l.to].topic === t.id)));
    if (!ext) err("study: у урока нет ни одной связи с другим уроком", t.id);
  }
  for (const P of window.QUIZ_PARTS.filter(P => !studied.has(P.group.id))) console.log("  внимание: у темы нет study-файла:", P.group.id);
  console.log(`Учебные материалы: понятий ${Object.keys(concepts).length}, связей ${links.length}, шпаргалок ${Object.keys(cheats).length}`);
}
console.log(`Всего ${ids.size} вопросов, ошибок: ${e}`);
process.exit(e ? 1 : 0);
