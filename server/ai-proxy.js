// Optional: use this only if you host Curio OUTSIDE claude.ai.
// (Inside a published claude.ai artifact the buddy talks to Claude directly, with no key at all.)
//
// The API key lives ONLY here, in an environment variable. Never in the browser, never in git.
//   AI_API_KEY=... AI_MODEL=claude-sonnet-4-6 node server/ai-proxy.js
//   then put VITE_AI_PROXY_URL=http://localhost:8787/ai in .env.local
import http from "node:http";

const KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL || "claude-sonnet-4-6";
const PORT = Number(process.env.PORT || 8787);
const ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";
if (!KEY) {
  console.error("Set AI_API_KEY first. Without it the app uses its built-in simple buddy.");
  process.exit(1);
}

http
  .createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", ORIGIN);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.end();
    if (req.method !== "POST") return res.writeHead(405).end();
    let body = "";
    for await (const c of req) body += c;
    try {
      const { input } = JSON.parse(body);
      const messages = typeof input === "string" ? [{ role: "user", content: input }] : input;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages }),
      });
      const data = await r.json();
      const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ text }));
    } catch {
      res.writeHead(500, { "Content-Type": "application/json" }).end(JSON.stringify({ text: "" }));
    }
  })
  .listen(PORT, () => console.log(`Curio AI proxy on http://localhost:${PORT}/ai`));
