// Удаляет вопросы по id из trainer/quiz-data*.js, не переписывая остальной файл.
// Запуск: node scripts/delete_questions.js "причина" id1 id2 ...
// Каждое удаление записывается в .study-quiz/deleted.log (id, текст вопроса, причина, дата).
const fs = require("fs"), path = require("path");
const { TR, LOGS } = require("./lib_trainer");
const [reason, ...ids] = process.argv.slice(2);
if (!reason || !ids.length) { console.log('node scripts/delete_questions.js "причина" id1 id2 ...'); process.exit(1); }
const want = new Set(ids), done = [];
for (const f of fs.readdirSync(TR).filter(f => /^quiz-data.*\.js$/.test(f))) {
  const p = path.join(TR, f);
  const lines = fs.readFileSync(p, "utf8").split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*\{ ?"?id"?:\s*"([^"]+)"/);
    if (m && want.has(m[1])) {
      const start = i; let j = i + 1;
      // вопрос тянется до следующего вопроса, комментария, пустой строки или конца массива
      while (j < lines.length && !/^\s*\{ ?"?id"?:\s*"/.test(lines[j]) && !/^\s*\/\//.test(lines[j]) && lines[j].trim() !== "" && !/^\s*\]/.test(lines[j])) j++;
      const text = lines.slice(start, j).join(" ");
      const q = (text.match(/"?q"?: "([^"]*)"/) || [])[1] || "";
      done.push(`${new Date().toISOString().slice(0, 10)}\t${m[1]}\t${f}\t${reason}\t${q}`);
      want.delete(m[1]); i = j - 1; continue;
    }
    out.push(lines[i]);
  }
  if (out.length !== lines.length) fs.writeFileSync(p, out.join("\n"));
}
fs.mkdirSync(LOGS, { recursive: true }); fs.appendFileSync(path.join(LOGS, "deleted.log"), done.map(d => d + "\n").join(""));
console.log("удалено", done.length, want.size ? "| не найдено: " + [...want].join(" ") : "");
