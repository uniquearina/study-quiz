// Синхронизация прогресса между устройствами через облако (cloud/functions/api/progress.js).
// Работает только на сайте; при открытии файла двойным кликом ничего не делает — прогресс остаётся в localStorage.
// Весь прогресс отправляется целиком и сливается на сервере (merge.js), поэтому заниматься можно
// на любом устройстве, в том числе без сети: несохранённое уйдёт при следующей связи.
(function () {
  const on = /^https?:$/.test(location.protocol) && !/^(localhost|127\.|\[?::1)/.test(location.hostname);
  const DELAY = 20e3; // после ответа ждём 20 с, чтобы отправлять пачкой
  let T, busy = false, again = false, timer = null, quiet = false, lastOk = 0, err = "";

  const strip = S => { const o = Object.assign({}, S); delete o.ui; return o; };
  const hhmm = t => new Date(t).toTimeString().slice(0, 5);
  const text = () => !on ? "" : err || (lastOk ? "☁ синхронизировано в " + hhmm(lastOk) : "☁ синхронизация…");
  const show = () => { const el = document.getElementById("sync-st"); if (el) el.textContent = text(); };

  async function sync() {
    if (!on || !T) return;
    if (busy) { again = true; return; }
    busy = true; clearTimeout(timer); timer = null;
    try {
      const S = T.S, sent = JSON.stringify(strip(S));
      const r = await fetch("api/progress", { method: "POST", body: sent, headers: { "content-type": "application/json" },
        credentials: "same-origin", redirect: "manual", keepalive: sent.length < 6e4 });
      if (r.type === "opaqueredirect" || r.status === 401) throw "login";
      if (!r.ok) throw "net";
      const remote = await r.json();
      const before = JSON.stringify(strip(S));
      MERGE.merge(S, remote);
      const changed = JSON.stringify(strip(S)) !== before;
      quiet = true; T.save(); quiet = false;
      lastOk = Date.now(); err = "";
      // пришло новое с другого устройства — перерисуем главную (если она сейчас открыта)
      if (changed && document.getElementById("export")) { const y = scrollY; T.home(); scrollTo(0, y); }
    } catch (e) {
      err = e === "login" ? "☁ вход истёк — обнови страницу" : "☁ нет связи — сохраню позже";
    }
    busy = false; show();
    if (again) { again = false; sync(); }
  }

  window.SYNC = {
    text,
    init(tr) { T = tr; if (!on) return; sync();
      document.addEventListener("visibilitychange", () => sync()); // ушли со страницы — отправить; вернулись — забрать новое
      addEventListener("online", () => sync());
    },
    dirty() { if (!on || quiet || !T) return; if (!timer) timer = setTimeout(sync, DELAY); }
  };
})();
