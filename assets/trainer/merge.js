// Слияние прогресса двух устройств — общее для тренажёра и облачной функции (cloud/functions).
// Без DOM: в браузере кладёт window.MERGE, в Node/Workers — module.exports.
// merge(target, incoming) меняет target на месте: открытые в тренажёре объекты (идущий тест) не теряются.
//   q, cards — по каждому id берётся более свежая запись (время ответа at или ручной правки mod);
//   sessions — объединение по id, ответы внутри теста складываются;
//   days — максимум по дню; ui — не трогаем (тема и настройки у каждого устройства свои);
//   wipedAt — «стереть прогресс»: всё, что старше, выкидывается на всех устройствах.
(function (root) {
  const dayKey = t => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const stamp = r => Math.max((r && r.at) || 0, (r && r.mod) || 0, (r && r.first) || 0);

  function merge(t, inc) {
    t.q ||= {}; t.cards ||= {}; t.sessions ||= []; t.days ||= {};
    if (!inc || typeof inc !== "object") return t;
    const W = Math.max(t.wipedAt || 0, inc.wipedAt || 0);
    const wk = W ? dayKey(W) : "";
    if (W) {
      t.wipedAt = W;
      ["q", "cards"].forEach(k => Object.keys(t[k]).forEach(id => { if (stamp(t[k][id]) < W) delete t[k][id]; }));
      t.sessions = t.sessions.filter(s => (s.at || 0) >= W);
      Object.keys(t.days).forEach(k => { if (k < wk) delete t.days[k]; });
    }
    ["q", "cards"].forEach(k => Object.entries(inc[k] || {}).forEach(([id, r]) => {
      if (stamp(r) < W) return;
      if (!t[k][id] || stamp(r) > stamp(t[k][id])) t[k][id] = r;
    }));
    const byId = Object.fromEntries(t.sessions.map(s => [s.id, s]));
    (inc.sessions || []).forEach(s => {
      if ((s.at || 0) < W) return;
      const m = byId[s.id];
      if (!m) { t.sessions.push(s); byId[s.id] = s; return; }
      Object.assign(m.answers ||= {}, s.answers || {});
      if (s.done) m.done = true;
      if (s.finishedAt) m.finishedAt = Math.max(m.finishedAt || 0, s.finishedAt);
    });
    t.sessions.sort((a, b) => (b.at || 0) - (a.at || 0));
    if (t.sessions.length > 60) t.sessions.length = 60;
    Object.entries(inc.days || {}).forEach(([k, n]) => { if (k >= wk) t.days[k] = Math.max(t.days[k] || 0, n); });
    return t;
  }

  const api = { merge, stamp };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MERGE = api;
})(typeof window !== "undefined" ? window : globalThis);
