// Убирает урок (тему) из тренажёра целиком — когда урок удалили из notes/.
// Запуск: node scripts/remove_topic.js <topic-id> [ещё id…] [--dry]
// Что делает:
//   • quiz-data*.js — вопросы урока, сам урок из topics, микротемы, которые больше нигде не используются;
//   • study-*.js — понятия урока, связи с ними, шпаргалку урока, ссылки на эти понятия в чужих шпаргалках;
//   • study-links.js — межтемные связи с понятиями урока;
//   • картинки trainer/img/, на которые больше никто не ссылается, — переносит в archive/removed/img/;
//   • если в теме (разделе) не осталось уроков — удаляет её файлы и строки <script> из index.html.
// Всё убранное сохраняется в archive/removed/<topic>-<дата>.json (можно вернуть), вопросы пишутся в .study-quiz/deleted.log.
// Прогресс не трогаем: записи об удалённых вопросах просто перестают использоваться.
const { fs, path, ROOT, TR, LOGS, load: load1, quizFiles: qf, studyFiles: sf, writeQuiz, writeStudy } = require("./lib_trainer");
const args = process.argv.slice(2), dry = args.includes("--dry"), ids = args.filter(a => !a.startsWith("--"));
if (!ids.length) { console.log("node scripts/remove_topic.js <topic-id> [...] [--dry]"); process.exit(1); }
const today = new Date().toISOString().slice(0, 10);
if (!dry) fs.mkdirSync(path.join(ROOT, "archive", "removed"), { recursive: true });
const load = (f, key) => [load1(f, key)], quizFiles = qf(), studyFiles = sf();

const archive = { removed: ids, at: today, questions: [], topics: [], subs: {}, concepts: [], links: [], cheats: {}, images: [] };
const goneConcepts = new Set();
const emptiedGroups = [];

// ── вопросы ───────────────────────────────────────────────
for (const f of quizFiles) {
  const fp = path.join(TR, f), P = load(fp, "QUIZ_PARTS")[0];
  if (!P.topics.some(t => ids.includes(t.id))) continue;
  const gone = P.questions.filter(q => ids.includes(q.topic));
  archive.questions.push(...gone); archive.topics.push(...P.topics.filter(t => ids.includes(t.id)));
  P.topics = P.topics.filter(t => !ids.includes(t.id));
  P.questions = P.questions.filter(q => !ids.includes(q.topic));
  const used = new Set(P.questions.map(q => q.sub));
  for (const s of Object.keys(P.subs)) if (!used.has(s)) { archive.subs[s] = P.subs[s]; delete P.subs[s]; }
  console.log(`${f}: −${gone.length} вопросов, −${ids.filter(i => archive.topics.some(t => t.id === i)).length} урок(ов); осталось уроков ${P.topics.length}`);
  if (!P.topics.length) { emptiedGroups.push({ group: P.group.id, quiz: f }); continue; }
  if (!dry) writeQuiz(fp, P);
  if (!dry) { fs.mkdirSync(LOGS, { recursive: true }); fs.appendFileSync(path.join(LOGS, "deleted.log"), gone.map(q => `${today}\t${q.id}\t${f}\tурок удалён из notes/ (${q.topic})\t\n`).join("")); }
}
if (!archive.topics.length) { console.log("Нет таких уроков:", ids.join(" ")); process.exit(1); }

// ── понятия, связи, шпаргалки ─────────────────────────────
for (const f of studyFiles) {
  const fp = path.join(TR, f), P = load(fp, "STUDY_PARTS")[0];
  const gone = (P.concepts || []).filter(c => ids.includes(c.topic));
  gone.forEach(c => goneConcepts.add(c.id));
}
for (const f of studyFiles) {
  const fp = path.join(TR, f), P = load(fp, "STUDY_PARTS")[0];
  const before = JSON.stringify(P);
  archive.concepts.push(...P.concepts.filter(c => goneConcepts.has(c.id)));
  P.concepts = P.concepts.filter(c => !goneConcepts.has(c.id));
  archive.links.push(...(P.links || []).filter(l => goneConcepts.has(l.from) || goneConcepts.has(l.to)));
  P.links = (P.links || []).filter(l => !goneConcepts.has(l.from) && !goneConcepts.has(l.to));
  for (const t of Object.keys(P.cheats || {})) {
    if (ids.includes(t)) { archive.cheats[t] = P.cheats[t]; delete P.cheats[t]; continue; }
    (P.cheats[t].blocks || []).forEach(b => { if (b.concepts) b.concepts = b.concepts.filter(c => !goneConcepts.has(c)); });
  }
  if (JSON.stringify(P) === before) continue;
  const grp = emptiedGroups.find(g => g.group === P.group);
  if (grp) { grp.study = f; console.log(`${f}: тема опустела — файл будет удалён`); continue; }
  console.log(`${f}: −${archive.concepts.filter(c => ids.includes(c.topic)).length} понятий, шпаргалки обновлены`);
  if (!dry) writeStudy(fp, P);
}
{ // межтемные связи — построчно, чтобы не потерять комментарии
  const fp = path.join(TR, "study-links.js"), lines = fs.readFileSync(fp, "utf8").split("\n");
  const keep = lines.filter(l => { const m = l.match(/from:\s*"([^"]+)".*to:\s*"([^"]+)"/); if (m && (goneConcepts.has(m[1]) || goneConcepts.has(m[2]))) { archive.links.push(l.trim()); return false; } return true; });
  if (keep.length !== lines.length) { console.log(`study-links.js: −${lines.length - keep.length} связей`); if (!dry) fs.writeFileSync(fp, keep.join("\n")); }
}

// ── опустевшие темы ───────────────────────────────────────
for (const g of emptiedGroups) {
  const html = path.join(TR, "index.html");
  let s = fs.readFileSync(html, "utf8");
  for (const f of [g.quiz, g.study].filter(Boolean)) {
    s = s.replace(new RegExp(`^<script src="${f.replace(/\./g, "\\.")}"></script>\\n`, "m"), "");
    if (!dry) fs.renameSync(path.join(TR, f), path.join(ROOT, "archive", "removed", `${f}.${today}`)); // файл целиком — в архив
  }
  if (!dry) fs.writeFileSync(html, s);
  console.log(`тема ${g.group}: файлы ${[g.quiz, g.study].filter(Boolean).join(", ")} → archive/removed/, строки <script> убраны`);
}

// ── картинки, на которые больше никто не ссылается ────────
const refs = new Set();
for (const f of fs.readdirSync(TR).filter(f => f.endsWith(".js") || f.endsWith(".html")))
  for (const m of fs.readFileSync(path.join(TR, f), "utf8").matchAll(/[\w.-]+\.(?:png|jpe?g|gif|webp|svg)/g)) refs.add(m[0]);
const was = new Set(JSON.stringify([archive.questions, archive.concepts, archive.cheats]).match(/[\w.-]+\.(?:png|jpe?g|gif|webp|svg)/g) || []);
for (const im of was) if (!refs.has(im) && fs.existsSync(path.join(TR, "img", im))) {
  archive.images.push(im);
  if (!dry) { fs.mkdirSync(path.join(ROOT, "archive", "removed", "img"), { recursive: true }); fs.renameSync(path.join(TR, "img", im), path.join(ROOT, "archive", "removed", "img", im)); }
}
if (archive.images.length) console.log(`картинки → archive/removed/img/: ${archive.images.join(", ")}`);

if (!dry) {
  fs.mkdirSync(path.join(ROOT, "archive", "removed"), { recursive: true });
  const af = path.join(ROOT, "archive", "removed", `${ids.join("+")}-${today}.json`);
  fs.writeFileSync(af, JSON.stringify(archive, null, 1));
  console.log("архив:", path.relative(ROOT, af));
} else console.log("(--dry: ничего не записано)");
