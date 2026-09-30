// Ищет признаки «тупых» вопросов во всех trainer/quiz-data*.js.
// Запуск: node scripts/dumb_check.js [--list]   (--list — вывести id и текст)
const path = require("path"), fs = require("fs");
const { TR, LOGS } = require("./lib_trainer"); global.window = {};
for (const f of fs.readdirSync(TR).filter(f => /^quiz-data.*\.js$/.test(f))) require(path.join(TR, f));
const show = process.argv.includes("--list");
// Имена героев примеров из материала (по одному в строке) — в .study-quiz/heroes.txt: вопросы о них не нужны.
const hf = path.join(LOGS, "heroes.txt"), names = fs.existsSync(hf) ? fs.readFileSync(hf, "utf8").split("\n").map(s => s.trim()).filter(Boolean) : [];
const HEROES = names.length ? new RegExp("(^|[^\\p{L}])(" + names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "iu") : null;
for (const P of window.QUIZ_PARTS) {
  const Q = P.questions, flags = {};
  const add = (k, q) => (flags[k] ||= []).push(q);
  const texts = {};
  for (const q of Q) {
    if (q.type === "mcq") {
      const len = q.options.map(o => o.length);
      if (q.correct.length === 1) {
        const c = len[q.correct[0]], rest = len.filter((_, i) => i !== q.correct[0]);
        if (c > 1.5 * Math.max(...rest)) add("правильный вариант в 1.5+ раза длиннее всех остальных", q);
      }
      if (q.options.some(o => /^(все (перечисленн|вышеперечисленн)|ни один|ничего из|всё вышеперечисленное|нет правильного)/i.test(o))) add("вариант «все перечисленные / ни один»", q);
      if (new Set(q.options).size !== q.options.length) add("повторяющиеся варианты", q);
    }
    if (q.type === "match" && q.pairs.length < 3) add("«соедини» из 2 пар — вторая пара угадывается сама", q);
    const k = q.type + "|" + (q.q || q.back || "").trim().toLowerCase();
    (texts[k] ||= []).push(q);
    if (q.type === "truefalse" && q.answer === false && /(?<![\p{L}])(всегда|никогда|только|обязательно|любой|любому|любая|любое|любые|любых|любого|совсем|вообще|единственн\p{L}*|полностью|нельзя)(?![\p{L}])/iu.test(q.q)) add("абсолютное слово (любой/всегда/только…) в неверном утверждении — ответ угадывается", q);
    if (q.type === "truefalse" && /^(Преимуществ|Недостат|Ограничени|Особенност|Польза|Фактор|Вид|Признак|Этап|Пример)[^:«]{0,80}: /.test(q.q || "")) add("шаблонная формулировка «Заголовок: пункт»", q);
    if (/в (этом |данном )?(уроке|лекции|параграфе|учебнике|главе)|в курсе|курс рассчитан|автор(ы)? (курса|урока)/i.test(JSON.stringify(q))) add("упоминание курса/урока", q);
    if (HEROES && HEROES.test(JSON.stringify(q))) add("упоминание героев примеров", q);
    if (/посчитай|рассчитай|вычисли|сколько (будет|составит|получится)|чему равн/i.test(q.q || "")) add("расчёт", q);
  }
  for (const v of Object.values(texts)) if (v.length > 1) v.forEach(q => add("одинаковый текст вопроса того же типа", q));
  console.log(`\n== ${P.group.title}: ${Q.length} вопросов`);
  for (const [k, v] of Object.entries(flags)) {
    console.log(`  ${k}: ${v.length}`);
    if (show) v.forEach(q => console.log(`     ${q.id}: ${(q.q || q.back).slice(0, 110)}`));
  }
  if (!Object.keys(flags).length) console.log("  чисто");
}
