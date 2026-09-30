// Общее для скриптов, которые переписывают файлы тренажёра (add_topic.js, remove_topic.js).
const fs = require("fs"), path = require("path");
// Папка тренажёра: аргумент-папка с index.html, иначе ./trainer (скрипты запускаются из папки проекта).
const TR = (() => { const a = process.argv.slice(2).find(a => fs.existsSync(path.join(a, "index.html"))); const d = path.resolve(a || "trainer");
  if (!fs.existsSync(path.join(d, "index.html"))) { console.error("Не нашла тренажёр: запусти из папки проекта (где trainer/) или передай путь к нему."); process.exit(1); } return d; })();
const ROOT = path.dirname(TR), LOGS = path.join(ROOT, ".study-quiz");

const load = (fp, key) => { global.window = {}; delete require.cache[require.resolve(fp)]; require(fp); return window[key][0]; };
const quizFiles = () => fs.readdirSync(TR).filter(f => /^quiz-data.*\.js$/.test(f));
const studyFiles = () => fs.readdirSync(TR).filter(f => /^study-.*\.js$/.test(f) && f !== "study-links.js");
const headComments = fp => fs.existsSync(fp) ? fs.readFileSync(fp, "utf8").split("\n").filter(l => l.startsWith("//")).slice(0, 8).join("\n") : "";

// JS-литерал в стиле файлов тренажёра: ключи без кавычек, короткое — в строку.
const lit = (v, ind = "") => {
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    if (v.every(x => typeof x !== "object" || x === null)) { const s = "[" + v.map(x => lit(x)).join(", ") + "]"; if (s.length < 110) return s; }
    return "[\n" + v.map(x => ind + "  " + lit(x, ind + "  ")).join(",\n") + ",\n" + ind + "]";
  }
  if (v && typeof v === "object") {
    const ks = Object.keys(v); if (!ks.length) return "{}";
    const key = k => /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
    const one = "{ " + ks.map(k => key(k) + ": " + lit(v[k], ind)).join(", ") + " }";
    if (one.length < 120 && !one.includes("\n")) return one;
    return "{\n" + ks.map(k => ind + "  " + key(k) + ": " + lit(v[k], ind + "  ")).join(",\n") + ",\n" + ind + "}";
  }
  return JSON.stringify(v);
};

// Вопросы — по одному в строку, сгруппированы по урокам (в порядке topics) и микротемам (в порядке subs).
function writeQuiz(fp, P, head) {
  const tOrd = P.topics.map(t => t.id), sOrd = Object.keys(P.subs);
  const qs = P.questions.map((q, i) => [q, i]).sort(([a, i], [b, j]) => tOrd.indexOf(a.topic) - tOrd.indexOf(b.topic) || sOrd.indexOf(a.sub) - sOrd.indexOf(b.sub) || i - j).map(x => x[0]);
  const out = []; let lastT = null, lastS = null;
  for (const q of qs) {
    if (q.topic !== lastT) { out.push(`    // ═════════ ${(P.topics.find(t => t.id === q.topic) || {}).lesson || q.topic} ═════════`); lastT = q.topic; lastS = null; }
    if (q.sub !== lastS) { out.push(`    // ${q.sub} — ${P.subs[q.sub]}`); lastS = q.sub; }
    const { id, ...rest } = q; out.push('    { "id": ' + JSON.stringify(id) + ", " + JSON.stringify(rest).slice(1).replace(/}$/, " }") + ",");
  }
  fs.writeFileSync(fp, `${head || headComments(fp)}
(window.QUIZ_PARTS = window.QUIZ_PARTS || []).push({
  group: ${JSON.stringify(P.group)},
  topics: ${JSON.stringify(P.topics, null, 2).replace(/\n/g, "\n  ")},
  subs: ${JSON.stringify(P.subs, null, 2).replace(/\n/g, "\n  ")},
  questions: [
${out.join("\n").replace(/,$/, "")}
  ]
});
`);
}

function writeStudy(fp, P, head) {
  fs.writeFileSync(fp, `${head || headComments(fp)}
(window.STUDY_PARTS = window.STUDY_PARTS || []).push(${lit(P)});
`);
}

module.exports = { fs, path, ROOT, TR, LOGS, load, quizFiles, studyFiles, headComments, lit, writeQuiz, writeStudy };
