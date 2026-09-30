// Вставляет в тренажёр новые уроки (или заменяет переписанные) из файла-части, который пишет помощник.
// Запуск: node scripts/add_topic.js <part.js> [--replace] [--dry]
//   без --replace — урок не должен уже быть в тренажёре (NEW);
//   --replace   — вопросы, понятия и шпаргалки этих уроков заменяются целиком (CHANGED).
//                 Оставляй прежние id у вопросов и понятий, которые не поменялись по смыслу: так сохранится прогресс.
// Часть — CommonJS-модуль:
//   module.exports = {
//     group:  { id: "g-econ", title: "Экономика и бизнес-модель" },   // раздел курса; новый id → новые файлы
//     slug:   "economy",                     // только для нового раздела: trainer/quiz-data-<slug>.js + study-<slug>.js
//     topics: [{ id, title, lesson, after? }],   // lesson — название урока ТОЧНО как в сайдбаре; after — id урока, после которого вставить
//     subs: { "<sub-id>": "Название микротемы" },
//     questions: [ … ],                      // формат — RULES.md и существующие файлы
//     concepts: [ … ], links: [ … ], cheats: { "<topic-id>": { gist, blocks } },   // §10
//     crossLinks: [ { from, to, label } ]    // связи с понятиями других разделов → study-links.js
//   };
// После: node scripts/validate.js, python3 scripts/e2e.py.
const { fs, path, TR, load, quizFiles, studyFiles, writeQuiz, writeStudy } = require("./lib_trainer");
const args = process.argv.slice(2), dry = args.includes("--dry"), replace = args.includes("--replace");
const partFile = args.find(a => !a.startsWith("--"));
if (!partFile) { console.log("node scripts/add_topic.js <part.js> [--replace] [--dry]"); process.exit(1); }
const part = require(path.resolve(partFile));
const die = m => { console.error("✘ " + m); process.exit(1); };
if (!part.group || !part.group.id) die("нет group.id");
const tids = (part.topics || []).map(t => t.id);
if (!tids.length) die("нет topics");
for (const q of part.questions || []) if (!tids.includes(q.topic)) die(`вопрос ${q.id}: topic ${q.topic} не из этой части`);
for (const c of part.concepts || []) if (!tids.includes(c.topic)) die(`понятие ${c.id}: topic ${c.topic} не из этой части`);

// где сейчас лежит раздел
const quiz = {}, study = {};
for (const f of quizFiles()) { const P = load(path.join(TR, f), "QUIZ_PARTS"); quiz[f] = P; }
for (const f of studyFiles()) { const P = load(path.join(TR, f), "STUDY_PARTS"); study[f] = P; }
let qf = Object.keys(quiz).find(f => quiz[f].group.id === part.group.id);
let sf = Object.keys(study).find(f => study[f].group === part.group.id);
const fresh = !qf;
if (fresh) {
  if (!part.slug) die(`раздела ${part.group.id} ещё нет — укажи slug для новых файлов`);
  qf = `quiz-data-${part.slug}.js`; sf = `study-${part.slug}.js`;
  if (quiz[qf] || fs.existsSync(path.join(TR, sf))) die(`файлы для slug ${part.slug} уже есть`);
  quiz[qf] = { group: part.group, topics: [], subs: {}, questions: [] };
  study[sf] = { group: part.group.id, concepts: [], links: [], cheats: {} };
}
if (!sf) { sf = qf.replace("quiz-data", "study"); study[sf] = { group: part.group.id, concepts: [], links: [], cheats: {} }; }
const Q = quiz[qf], S = study[sf];

// уроки: новые не должны существовать, заменяемые — должны
for (const t of part.topics) {
  const where = Object.keys(quiz).find(f => quiz[f].topics.some(x => x.id === t.id));
  if (!replace && where) die(`урок ${t.id} уже есть в ${where} (нужен --replace?)`);
  if (replace && where && where !== qf) die(`урок ${t.id} лежит в другом разделе (${where})`);
}
if (replace) {
  Q.questions = Q.questions.filter(q => !tids.includes(q.topic));
  const goneC = new Set(S.concepts.filter(c => tids.includes(c.topic)).map(c => c.id));
  S.concepts = S.concepts.filter(c => !goneC.has(c.id));
  S.links = (S.links || []).filter(l => !goneC.has(l.from) && !goneC.has(l.to)); // нужные связи придут заново в part.links
  tids.forEach(t => delete (S.cheats || {})[t]);
}

// id не должны пересекаться с остальными разделами
const allQ = new Set(Object.values(quiz).flatMap(P => P.questions.map(q => q.id)));
const allC = new Set(Object.values(study).flatMap(P => (P.concepts || []).map(c => c.id)));
const dupQ = (part.questions || []).filter(q => allQ.has(q.id)).map(q => q.id);
const dupC = (part.concepts || []).filter(c => allC.has(c.id)).map(c => c.id);
if (dupQ.length) die("id вопросов уже заняты: " + dupQ.join(" "));
if (dupC.length) die("id понятий уже заняты: " + dupC.join(" "));
const selfDup = (part.questions || []).map(q => q.id).filter((id, i, a) => a.indexOf(id) !== i);
if (selfDup.length) die("повтор id внутри части: " + selfDup.join(" "));

// вставка уроков в нужное место
for (const t of part.topics) {
  const { after, ...topic } = t;
  const i = Q.topics.findIndex(x => x.id === t.id);
  if (i >= 0) { Q.topics[i] = topic; continue; }
  const k = after ? Q.topics.findIndex(x => x.id === after) : -1;
  if (after && k < 0) die(`after: нет урока ${after} в ${qf}`);
  k >= 0 ? Q.topics.splice(k + 1, 0, topic) : Q.topics.push(topic);
}
Object.assign(Q.subs, part.subs || {});
Q.questions.push(...(part.questions || []));
const used = new Set(Q.questions.map(q => q.sub));
for (const s of Object.keys(Q.subs)) if (!used.has(s)) delete Q.subs[s];
for (const q of Q.questions) if (!Q.subs[q.sub]) die(`нет названия микротемы ${q.sub} (вопрос ${q.id})`);
S.concepts.push(...(part.concepts || []));
S.links = [...(S.links || []), ...(part.links || [])];
S.cheats = Object.assign(S.cheats || {}, part.cheats || {});

// картинки: если урок возвращается, достать его картинки из archive/removed/img/
const ROOT = path.join(TR, "..");
for (const im of new Set(JSON.stringify(part).match(/[\w.-]+\.(?:png|jpe?g|gif|webp|svg)/g) || [])) {
  const dst = path.join(TR, "img", im), arc = path.join(ROOT, "archive", "removed", "img", im);
  if (fs.existsSync(dst)) continue;
  if (fs.existsSync(arc)) { if (!dry) fs.renameSync(arc, dst); console.log("картинка возвращена из архива:", im); }
  else console.warn("⚠️  нет картинки trainer/img/" + im);
}

const n = (part.questions || []).length, c = (part.concepts || []).length;
console.log(`${qf}: ${replace ? "заменено" : "добавлено"} уроков ${tids.length} (${tids.join(", ")}), вопросов ${n}, понятий ${c}, шпаргалок ${Object.keys(part.cheats || {}).length}`);
if (dry) { console.log("(--dry: ничего не записано)"); process.exit(0); }

writeQuiz(path.join(TR, qf), Q, fresh ? `// Вопросы: тема «${part.group.title}».\n// Уровень задаётся типом: 1 — truefalse, mcq, match; 2 — sort, order, table, frame; 3 — cloze, list, recall.\n// img — картинка к вопросу, explainImg — картинка к разбору (из папки img/).` : undefined);
writeStudy(path.join(TR, sf), S, fs.existsSync(path.join(TR, sf)) ? undefined : `// Понятия, связи и шпаргалки темы «${part.group.title}». Формат: RULES.md §10.`);

if (part.crossLinks && part.crossLinks.length) {
  const fp = path.join(TR, "study-links.js"); let s = fs.readFileSync(fp, "utf8");
  const have = new Set([...s.matchAll(/from:\s*"([^"]+)".*to:\s*"([^"]+)"/g)].map(m => m[1] + ">" + m[2]));
  const add = part.crossLinks.filter(l => !have.has(l.from + ">" + l.to));
  if (add.length) {
    s = s.replace(/\n\];\s*$/, `\n  // ${part.group.title}: ${tids.join(", ")}\n` + add.map(l => `  { from: ${JSON.stringify(l.from)}, to: ${JSON.stringify(l.to)}, label: ${JSON.stringify(l.label)} },`).join("\n") + "\n];\n");
    fs.writeFileSync(fp, s); console.log(`study-links.js: +${add.length} связей`);
  }
}

// новый раздел — подключить файлы в index.html
const html = path.join(TR, "index.html"); let h = fs.readFileSync(html, "utf8"), changed = false;
const tag = f => `<script src="${f}"></script>`;
if (!h.includes(tag(qf))) {
  const last = [...h.matchAll(/<script src="quiz-data[^"]*"><\/script>\n|<!-- QUIZ-DATA[^\n]*\n/g)].pop();
  h = h.slice(0, last.index + last[0].length) + tag(qf) + "\n" + h.slice(last.index + last[0].length); changed = true;
}
if (!h.includes(tag(sf))) { h = h.replace(tag("study-links.js"), tag(sf) + "\n" + tag("study-links.js")); changed = true; }
if (changed) { fs.writeFileSync(html, h); console.log(`index.html: подключены ${qf}, ${sf}`); }
