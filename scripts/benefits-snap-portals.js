#!/usr/bin/env node
/**
 * Puts each state's verified SNAP application link and phone on its SNAP
 * program draft (data/pipeline/{ST}/drafts.json), from
 * data/benefits/snap-states.json (verified 10 Oct 2026 from official sources).
 *
 * Why: the drafted links were wrong in places (Kansas's "apply" link went to
 * an Arkansas site, New Jersey's to a dead domain, Arizona's to a nonprofit).
 * The verified link goes first, and links to the known-wrong hosts go.
 *
 *   node scripts/benefits-snap-portals.js            # dry run: what would change
 *   node scripts/benefits-snap-portals.js --write    # write drafts.json
 *   node scripts/benefits-pipeline.js --regen-index  # then rebuild drafts.ts
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WRITE = process.argv.includes("--write");
const { states } = JSON.parse(fs.readFileSync(path.join(ROOT, "data/benefits/snap-states.json"), "utf8"));

// Hosts found wrong on 10 Oct 2026: another state's site, a dead domain, a nonprofit.
const WRONG_HOSTS = ["benefitsparkansas.org", "njhelps.org", "arizonaselfhelp.org"];
const SNAP = /\bsnap\b|food stamps?|supplemental nutrition|calfresh|3squares|foodshare|basic food|food supplement program|nutrition assistance|food assistance|food and nutrition services/i;
const NOT_SNAP = /farmers|commodity|csfp|meals|congregate|tefap|emergency food|summer/i;

const host = (u) => { try { return new URL(u).host.toLowerCase().replace(/^www\./, ""); } catch { return ""; } };

let changed = 0;
for (const st of states) {
  const file = path.join(ROOT, "data/pipeline", st.code, "drafts.json");
  if (!fs.existsSync(file)) { console.log(`${st.code}: no drafts file`); continue; }
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  const list = Array.isArray(doc) ? doc : doc.programs;
  let touched = false;
  for (const p of list) {
    const text = `${p.name || ""} ${p.id || ""}`;
    if (!SNAP.test(text) || NOT_SNAP.test(text)) continue;
    const guide = (p.applicationGuide ||= {});
    const before = JSON.stringify({ urls: guide.urls, phone: p.phone });
    const link = st.paperOnly
      ? { label: "Get the paper application", url: st.paperUrl }
      : { label: "Apply online", url: st.applyUrl };
    const kept = (guide.urls || []).filter((u) => !WRONG_HOSTS.includes(host(u.url)) && u.url !== link.url);
    guide.urls = [link, ...kept];
    if (!p.phone || /^2-1-1$/.test(String(p.phone).trim())) p.phone = st.phone;
    const after = JSON.stringify({ urls: guide.urls, phone: p.phone });
    if (before !== after) {
      touched = true;
      changed++;
      console.log(`${st.code} ${p.id}: ${link.url}${p.phone === st.phone ? ` · ${st.phone}` : ""}`);
    }
  }
  if (touched && WRITE) fs.writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
}
console.log(`\n${changed} SNAP programs ${WRITE ? "updated" : "would change"}.`);
