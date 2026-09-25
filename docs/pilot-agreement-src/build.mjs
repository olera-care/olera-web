/**
 * Render agreement.html to public/medjobs/pilot-agreement.pdf.
 *
 * Same Chromium-over-CDP approach as docs/medjobs/matrix-src/html2pdf.mjs,
 * but with zero print margins and no Chromium header/footer: this document
 * carries its own page frame, rules and footer so it matches the original
 * signed PDF measurement for measurement.
 *
 *   node docs/pilot-agreement-src/build.mjs
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const CHROME = "/opt/pw-browsers/chromium";
const HTML = resolve("docs/pilot-agreement-src/agreement.html");
const PDF = resolve("public/medjobs/pilot-agreement.pdf");

const userDir = mkdtempSync(join(tmpdir(), "chr-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    // Local file only — keep Chromium off the network or it dials out and hangs.
    "--proxy-server=http://127.0.0.1:1", "--disable-background-networking",
    "--disable-component-update", "--disable-sync", "--disable-domain-reliability",
    "--no-first-run", "--no-default-browser-check", "--metrics-recording-only",
    "--disable-default-apps", "--remote-debugging-port=9345",
    `--user-data-dir=${userDir}`, "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch("http://127.0.0.1:9345/json/version");
      return (await r.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("chromium did not start");
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.waiting = new Map(); this.sessions = new Map();
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.waiting.has(m.id)) {
        const { res, rej } = this.waiting.get(m.id);
        this.waiting.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      } else if (m.method === "Page.loadEventFired") {
        const s = this.sessions.get(m.sessionId);
        if (s) s();
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.waiting.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
}

const ws = new WebSocket(await endpoint());
await new Promise((r) => ws.addEventListener("open", r));
const cdp = new CDP(ws);

const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
await cdp.send("Page.enable", {}, sessionId);
const loaded = new Promise((r) => cdp.sessions.set(sessionId, r));
await cdp.send("Page.navigate", { url: "file://" + HTML }, sessionId);
await Promise.race([loaded, sleep(15000)]);
await sleep(600);

const { data } = await cdp.send(
  "Page.printToPDF",
  {
    printBackground: true, preferCSSPageSize: true,
    paperWidth: 8.5, paperHeight: 11,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    displayHeaderFooter: false,
  },
  sessionId,
);
writeFileSync(PDF, Buffer.from(data, "base64"));
console.log("wrote", PDF, (statSync(PDF).size / 1024).toFixed(0) + "KB");

ws.close();
chrome.kill();
process.exit(0);
