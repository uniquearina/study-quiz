// Точечная правка вопросов по id в trainer/quiz-data*.js, без переписывания остального файла.
// Запуск: node scripts/patch_questions.js patch.json   где patch.json = { "id": { "поле": значение | null (удалить) }, … }
// Вопрос переписывается одной JSON-строкой на месте. Журнал — .study-quiz/patched.log.
const fs = require("fs"), path = require("path");
const { TR, LOGS } = require("./lib_trainer");
const patch = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), left = new Set(Object.keys(patch)), log = [];
for (const f of fs.readdirSync(TR).filter(f => /^quiz-data.*\.js$/.test(f))) {
  const p = path.join(TR, f), lines = fs.readFileSync(p, "utf8").split("\n"), out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)\{ ?"?id"?:\s*"([^"]+)"/);
    if (m && left.has(m[2])) {
      let j = i + 1;
      while (j < lines.length && !/^\s*\{ ?"?id"?:\s*"/.test(lines[j]) && !/^\s*\/\//.test(lines[j]) && lines[j].trim() !== "" && !/^\s*\]/.test(lines[j])) j++;
      const text = lines.slice(i, j).join("\n"), comma = /,\s*$/.test(text);
      const q = eval("(" + text.replace(/,\s*$/, "") + ")");
      for (const [k, v] of Object.entries(patch[m[2]])) { if (v === null) delete q[k]; else q[k] = v; }
      out.push(m[1] + JSON.stringify(q) + (comma ? "," : ""));
      log.push(`${new Date().toISOString().slice(0, 10)}\t${m[2]}\t${Object.keys(patch[m[2]]).join(",")}`);
      left.delete(m[2]); i = j - 1; continue;
    }
    out.push(lines[i]);
  }
  fs.writeFileSync(p, out.join("\n"));
}
fs.mkdirSync(LOGS, { recursive: true }); fs.appendFileSync(path.join(LOGS, "patched.log"), log.map(l => l + "\n").join(""));
console.log("исправлено", log.length, left.size ? "| не найдено: " + [...left].join(" ") : "");
