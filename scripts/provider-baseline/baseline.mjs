#!/usr/bin/env node
/**
 * Provider page baseline: snapshot the fixed page set, then compare two
 * snapshots so a change can prove it altered only what it meant to.
 *
 *   node baseline.mjs snapshot --base https://olera.care --out <dir>
 *   node baseline.mjs compare <before-dir> <after-dir> [--only seo]
 *
 * Each page is loaded in WebKit (Safari's engine) at phone (402 wide) and
 * laptop (1440 wide). From the server's HTML it records the redirect chain,
 * status, title, description, robots, canonical, Open Graph, structured data,
 * H1 and internal link count; it also saves a full-page screenshot per device.
 *
 * Read-only by construction: every non-GET request and every third-party
 * analytics call is aborted, and the page's own view tracker skips automated
 * browsers, so a run adds no page views, questions or requests.
 *
 * Setup once: npm --prefix scripts/provider-baseline install
 *             npx --prefix scripts/provider-baseline playwright install webkit
 * Preview deployments behind Vercel protection: set VERCEL_BYPASS_SECRET.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webkit } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE_SET = JSON.parse(fs.readFileSync(path.join(HERE, "page-set.json"), "utf8"));

const DEVICES = {
  phone: {
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  },
  laptop: {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  },
};

// Third-party hosts that only measure. Aborted so a run is invisible to them.
const BLOCKED_HOSTS = [
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.net",
  "facebook.com/tr",
  "clarity.ms",
  "hotjar",
  "posthog",
  "segment",
  "vitals.vercel-insights.com",
  "/_vercel/insights",
  "/_vercel/speed-insights",
];

// A pixel counts as changed above this colour distance (pixelmatch 0..1), and
// a screenshot is flagged above this many changed pixels. Two runs against
// the same deployment differ by at most 17 pixels; one changed word of text
// is several hundred. A share of the page would hide a relabelled price.
const PIXEL_THRESHOLD = 0.1;
const SCREENSHOT_TOLERANCE_PX = 100;

// Freeze motion so two runs paint the same frame.
const STILL_CSS = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}`;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'");
}

function metaContent(html, attr, key) {
  const tags = html.match(new RegExp(`<meta[^>]*${attr}="${key}"[^>]*>`, "i"));
  if (!tags) return null;
  const c = tags[0].match(/content="([^"]*)"/i);
  return c ? decode(c[1]) : null;
}

/** Read the SEO-facing facts from the HTML the server sent, before hydration. */
function readServerHtml(html, origin, slug) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i);
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    decode(m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()),
  );
  const jsonLd = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
    try {
      return JSON.parse(m[1]);
    } catch {
      return { unparseable: m[1].slice(0, 200) };
    }
  });
  const host = new URL(origin).host;
  const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"#][^"]*)"/gi)].map((m) => decode(m[1]));
  const internal = hrefs.filter((h) => h.startsWith("/") || h.includes(`//${host}`) || h.includes("//olera.care"));
  const paths = internal.map((h) => h.replace(/^https?:\/\/[^/]+/, ""));
  // Links to other providers come from the comparison cards, which are drawn
  // at random on every render, so they are counted, not listed.
  const isOtherProvider = (p) => /^\/provider\/[^/?#]+$/.test(p) && p !== `/provider/${slug}` && p !== "/provider/onboarding";
  return {
    title: title ? decode(title[1].trim()) : null,
    description: metaContent(html, "name", "description"),
    robots: metaContent(html, "name", "robots"),
    canonical: canonical ? canonical[1] : null,
    ogTitle: metaContent(html, "property", "og:title"),
    ogUrl: metaContent(html, "property", "og:url"),
    ogImage: metaContent(html, "property", "og:image"),
    h1: h1s,
    jsonLd,
    internalLinks: internal.length,
    otherProviderLinks: paths.filter(isOtherProvider).length,
    internalLinkTargets: [...new Set(paths.filter((p) => !isOtherProvider(p)))].sort(),
  };
}

async function newContext(browser, device, base) {
  const bypass = process.env.VERCEL_BYPASS_SECRET;
  const origin = new URL(base).origin;
  const ctx = await browser.newContext({
    ...DEVICES[device],
    reducedMotion: "reduce",
    locale: "en-US",
    timezoneId: "America/Chicago",
  });
  await ctx.route("**/*", (route) => {
    const req = route.request();
    const url = req.url();
    if (req.method() !== "GET") return route.abort();
    if (BLOCKED_HOSTS.some((h) => url.includes(h))) return route.abort();
    // The preview bypass secret goes to our own host only, never to image CDNs.
    if (bypass && url.startsWith(origin)) {
      return route.continue({ headers: { ...req.headers(), "x-vercel-protection-bypass": bypass } });
    }
    return route.continue();
  });
  return ctx;
}

async function snapshotPage(browser, base, slug, device, outDir) {
  const ctx = await newContext(browser, device, base);
  const page = await ctx.newPage();
  const url = `${base}/provider/${slug}`;
  const result = { slug, device, url };
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    // The redirect chain, oldest first.
    const chain = [];
    for (let r = res.request().redirectedFrom(); r; r = r.redirectedFrom()) {
      const rr = await r.response();
      chain.unshift({ url: r.url().replace(base, ""), status: rr ? rr.status() : null });
    }
    result.redirects = chain;
    result.status = res.status();
    result.finalPath = new URL(page.url()).pathname;
    // Only the provider page's own HTML is read; a redirect lands on another
    // page type whose tags are that page's business.
    if (result.finalPath === `/provider/${slug}` || result.status >= 400) {
      result.seo = readServerHtml(await res.text(), base, slug);
    }

    // A redirect lands on a city page; its chain is the fact, not its pixels.
    if (result.redirects.length) return result;

    await page.addStyleTag({ content: STILL_CSS });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    // Walk down the page so lazy images load, then return to the top.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => document.fonts && document.fonts.ready);
    // The comparison cards are drawn at random on every render. Record how
    // many there are, then hide them behind a fixed-height box so the rest of
    // the page can be compared pixel for pixel.
    result.compareCards = await page.evaluate(() => {
      const h = [...document.querySelectorAll("h2")].find((el) => /^Compare /.test(el.textContent.trim()));
      const grid = h && h.nextElementSibling;
      if (!grid) return null;
      const n = grid.children.length;
      grid.style.cssText += ";visibility:hidden;height:360px;overflow:hidden";
      return n;
    });
    await page.waitForTimeout(500);
    const shot = path.join("screens", `${slug}.${device}.png`);
    await page.screenshot({ path: path.join(outDir, shot), fullPage: true, animations: "disabled" });
    result.screenshot = shot;
  } catch (err) {
    result.error = String(err && err.message ? err.message : err).split("\n")[0];
  } finally {
    await ctx.close();
  }
  return result;
}

async function snapshot() {
  const base = (arg("base", "https://olera.care") || "").replace(/\/$/, "");
  const outDir = arg("out");
  if (!outDir) throw new Error("--out <dir> is required");
  const only = arg("slug");
  fs.mkdirSync(path.join(outDir, "screens"), { recursive: true });

  const browser = await webkit.launch();
  const pages = PAGE_SET.pages.filter((p) => !only || p.slug === only);
  const jobs = pages.flatMap((p) => Object.keys(DEVICES).map((device) => ({ slug: p.slug, device })));
  const results = new Array(jobs.length);
  // A few pages at a time: fast enough for every PR, gentle on production.
  const concurrency = Number(arg("concurrency", "4"));
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < jobs.length) {
        const i = next++;
        const { slug, device } = jobs[i];
        const r = await snapshotPage(browser, base, slug, device, outDir);
        results[i] = r;
        const tag = r.error ? `ERROR ${r.error}` : `${r.status}${r.redirects.length ? ` via ${r.redirects.map((x) => x.status).join(">")}` : ""}`;
        console.log(`${device.padEnd(6)} ${slug}  ${tag}`);
      }
    }),
  );
  await browser.close();

  const manifest = { base, takenAt: new Date().toISOString(), pageSetVersion: PAGE_SET.version, results };
  fs.writeFileSync(path.join(outDir, "snapshot.json"), JSON.stringify(manifest, null, 2));
  const errors = results.filter((r) => r.error).length;
  console.log(`\n${results.length} captures, ${errors} errors -> ${outDir}`);
  if (errors) process.exitCode = 1;
}

// ---------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------

function diffValues(a, b, at, out) {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (a && b && typeof a === "object" && typeof b === "object" && Array.isArray(a) === Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diffValues(a[k], b[k], `${at}.${k}`, out);
    return;
  }
  out.push({ field: at.replace(/^\./, ""), before: a, after: b });
}

function comparePng(fileA, fileB) {
  const a = PNG.sync.read(fs.readFileSync(fileA));
  const b = PNG.sync.read(fs.readFileSync(fileB));
  if (a.width !== b.width || a.height !== b.height) {
    return { sizeChanged: true, before: `${a.width}x${a.height}`, after: `${b.width}x${b.height}` };
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: PIXEL_THRESHOLD });
  return { changed, diff };
}

function compare() {
  const [, , , dirA, dirB] = process.argv;
  if (!dirA || !dirB) throw new Error("usage: compare <before-dir> <after-dir> [--only seo]");
  const seoOnly = arg("only") === "seo";
  const A = JSON.parse(fs.readFileSync(path.join(dirA, "snapshot.json"), "utf8"));
  const B = JSON.parse(fs.readFileSync(path.join(dirB, "snapshot.json"), "utf8"));
  const key = (r) => `${r.slug}.${r.device}`;
  const mapB = new Map(B.results.map((r) => [key(r), r]));
  // The two runs may hit different hosts (production against a preview).
  const norm = (o, base) => JSON.parse(JSON.stringify(o ?? null).split(base).join("{base}"));

  const report = [];
  fs.mkdirSync(path.join(dirB, "diffs"), { recursive: true });
  for (const a of A.results) {
    const b = mapB.get(key(a));
    const differences = [];
    if (!b) {
      report.push({ page: key(a), differences: [{ field: "missing from after" }] });
      continue;
    }
    for (const f of ["status", "finalPath", "redirects", "error", "compareCards"]) diffValues(a[f], b[f], f, differences);
    // SEO tags are identical on both devices, so read them once, from phone.
    if (a.device === "phone") diffValues(norm(a.seo, A.base), norm(b.seo, B.base), "seo", differences);
    if (!seoOnly && a.screenshot && b.screenshot) {
      const s = comparePng(path.join(dirA, a.screenshot), path.join(dirB, b.screenshot));
      if (s.sizeChanged) {
        differences.push({ field: "screenshot size", before: s.before, after: s.after });
      } else if (s.changed > SCREENSHOT_TOLERANCE_PX) {
        const diffFile = path.join("diffs", `${key(a)}.png`);
        fs.writeFileSync(path.join(dirB, diffFile), PNG.sync.write(s.diff));
        differences.push({ field: "screenshot", changedPixels: s.changed, diff: diffFile });
      }
    }
    if (differences.length) report.push({ page: key(a), differences });
  }
  // A page added to the set after the baseline has nothing to compare against.
  const keysA = new Set(A.results.map(key));
  for (const b of B.results) {
    if (!keysA.has(key(b))) report.push({ page: key(b), differences: [{ field: "not in before (take a new baseline)" }] });
  }

  fs.writeFileSync(path.join(dirB, "compare.json"), JSON.stringify({ before: dirA, after: dirB, report }, null, 2));
  if (!report.length) {
    console.log(`Clean: ${A.results.length} captures match.`);
    return;
  }
  for (const r of report) {
    console.log(`\n${r.page}`);
    for (const d of r.differences) {
      const detail = "before" in d ? `\n    before: ${JSON.stringify(d.before)}\n    after:  ${JSON.stringify(d.after)}` : Object.keys(d).length > 1 ? ` ${JSON.stringify({ ...d, field: undefined })}` : "";
      console.log(`  ${d.field}${detail}`);
    }
  }
  console.log(`\n${report.length} of ${A.results.length} captures differ. Details: ${path.join(dirB, "compare.json")}`);
  process.exitCode = 1;
}

const cmd = process.argv[2];
if (cmd === "snapshot") await snapshot();
else if (cmd === "compare") compare();
else {
  console.log("usage:\n  node baseline.mjs snapshot --base <url> --out <dir> [--slug <slug>]\n  node baseline.mjs compare <before-dir> <after-dir> [--only seo]");
  process.exitCode = 1;
}
