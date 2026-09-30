// Интервальное повторение — общая логика для тренажёра и будущего бота.
// Без DOM: в браузере кладёт window.SRS, в Node — module.exports.
// Запись о вопросе или карточке: { n, ok, last, at, box, due, first }.
//   box — ступень лестницы (1…6), due — начало дня, когда пора повторить.
(function (root) {
  const DAY = 864e5;
  const STEPS = [0, 1, 3, 7, 16, 35, 80];      // ступень → через сколько дней повторить
  const LIMITS = { total: 25, fresh: 13 };      // ~10 минут в день: ~пополам повторения и новые (до 13 новых)

  const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return +d; };
  const dayKey = t => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const isDue = (r, now) => !!r && r.due != null && r.due <= now;

  // Ответ на вопрос: верно — ступенью выше, ошибка — на первую ступень (повтор завтра).
  // Новый вопрос, отвеченный верно с первого раза, сразу на ступень 2 (через 3 дня) — иначе после
  // пары тестов назавтра приходит вся пачка. Верный ответ раньше срока ступень не поднимает.
  // Интервалы от 7 дней слегка разбрасываем (±15%), чтобы вопросы одного дня не возвращались пачкой.
  function schedule(r, ok, now, rnd = Math.random) {
    r = r || {};
    if (!ok) r.box = 1;
    else if (!r.box) r.box = 2;
    else if (r.due == null || r.due <= now) r.box = Math.min(r.box + 1, STEPS.length - 1);
    else { r.due = Math.max(r.due, dayStart(now) + DAY); return r; }
    let days = STEPS[r.box];
    if (days >= 7) days = Math.max(1, Math.round(days * (0.85 + rnd() * 0.3)));
    r.due = dayStart(now) + days * DAY;
    return r;
  }

  // Старые записи без ступени: верно → ступень 2 (через 3 дня от ответа), ошибка → ступень 1, срок сегодня.
  function migrate(r, now) {
    if (!r || r.box) return r;
    if (r.last) { r.box = 2; r.due = dayStart(r.at || now) + STEPS[2] * DAY; }
    else { r.box = 1; r.due = dayStart(now); }
    return r;
  }

  // Что повторить: просроченные; сначала с ошибкой, потом самые давние.
  function dueList(records, ids, now) {
    return ids.filter(id => isDue(records[id], now))
      .sort((a, b) => (records[a].last === 0 ? 0 : 1) - (records[b].last === 0 ? 0 : 1) || records[a].due - records[b].due);
  }

  // Разовая поправка: вопросы на ступени 1 с последним верным ответом (по старым правилам вернулись бы завтра,
  // в том числе отвеченные за день несколько раз) переносим на ступень 2 — через 3 дня от ответа.
  function fixV2(records) {
    Object.values(records).forEach(r => { if (r.box === 1 && r.last === 1 && r.at) { r.box = 2; r.due = dayStart(r.at) + STEPS[2] * DAY; } });
  }

  // Сколько новых уже начато сегодня (по полю first).
  const freshToday = (records, now) => { const d0 = dayStart(now); return Object.values(records).filter(r => r.first >= d0).length; };

  // Прогноз: сколько будет к повтору к концу дня через `days` дней.
  const dueBy = (records, ids, now, days) => { const end = dayStart(now) + (days + 1) * DAY; return ids.filter(id => records[id] && records[id].due != null && records[id].due < end).length; };

  // Серия: дни подряд с хотя бы одним ответом, заканчивая сегодня или вчера.
  function streak(days, now) {
    let n = 0, t = dayStart(now);
    if (!days[dayKey(t)]) t -= DAY;
    while (days[dayKey(t)]) { n++; t -= DAY; }
    return n;
  }

  const api = { DAY, STEPS, LIMITS, dayStart, dayKey, isDue, schedule, migrate, fixV2, dueList, freshToday, dueBy, streak };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SRS = api;
})(typeof window !== "undefined" ? window : globalThis);
