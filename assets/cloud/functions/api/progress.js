// Облачный прогресс тренажёра: /api/progress
//   GET  — отдать сохранённый прогресс;
//   POST — слить присланный прогресс с сохранённым (trainer/merge.js), сохранить и вернуть итог.
// Сайт закрыт Cloudflare Access; здесь дополнительно проверяем его подпись (JWT),
// чтобы без входа прогресс нельзя было ни прочитать, ни записать, даже если защиту случайно снимут.
// Настройки — в cloud/wrangler.toml: TEAM (команда Zero Trust), AUD (Application Audience tag; можно несколько через запятую), KV progress.
import M from "../../../trainer/merge.js";

const b64url = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
let certs = null, certsAt = 0;

async function userOf(request, env) {
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt || !env.TEAM || !env.AUD) return null;
  const [h, p, sig] = jwt.split(".");
  const head = JSON.parse(new TextDecoder().decode(b64url(h))), body = JSON.parse(new TextDecoder().decode(b64url(p)));
  if (Date.now() - certsAt > 36e5) {
    certs = (await (await fetch(`https://${env.TEAM}.cloudflareaccess.com/cdn-cgi/access/certs`)).json()).keys; certsAt = Date.now();
  }
  const jwk = certs.find(k => k.kid === head.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(sig), new TextEncoder().encode(h + "." + p));
  const aud = [].concat(body.aud);
  if (!ok || !aud.some(a => env.AUD.split(",").includes(a)) || body.exp * 1000 < Date.now() || !body.email) return null;
  return body.email.toLowerCase();
}

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function onRequest({ request, env }) {
  let user = null;
  try { user = await userOf(request, env); } catch (e) {}
  if (!user) return json({ error: "no access" }, 401);
  const key = "progress:" + user;
  const stored = (await env.progress.get(key, "json")) || {};
  if (request.method === "GET") return json(stored);
  if (request.method !== "POST") return json({ error: "method" }, 405);
  let inc;
  try { inc = await request.json(); } catch (e) { return json({ error: "bad json" }, 400); }
  delete stored.ui; delete inc.ui;
  const merged = M.merge(stored, inc);
  merged.savedAt = Date.now();
  await env.progress.put(key, JSON.stringify(merged));
  return json(merged);
}
