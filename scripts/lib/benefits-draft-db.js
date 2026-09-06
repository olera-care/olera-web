/**
 * Shared plumbing for the navigator-draft scripts (benefits-draft-patch,
 * benefits-draft-schedule). Plain CommonJS so it runs from a bare worktree:
 * a worktree has neither node_modules nor .env.local, so both are located
 * here rather than assumed.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);
const argFlag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const has = (name) => args.includes(`--${name}`);

/** Checkouts that usually carry node_modules and .env.local, in order. */
const FALLBACK_CHECKOUTS = [
  path.resolve(__dirname, '..', '..'),
  path.join(os.homedir(), 'Desktop', 'olera-web'),
];

/** require() a dependency from this checkout, else from a sibling checkout. */
function requireDep(name) {
  for (const root of FALLBACK_CHECKOUTS) {
    try { return require(path.join(root, 'node_modules', name)); } catch { /* next */ }
  }
  try { return require(name); } catch { /* fall through */ }
  throw new Error(`${name} not found. Run from a checkout with node_modules, or npm install in ~/Desktop/olera-web.`);
}

/** Load .env.local into process.env without dotenv: --env, this checkout, then the Desktop checkout. */
function loadEnv(explicit) {
  const candidates = explicit ? [explicit] : FALLBACK_CHECKOUTS.map((r) => path.join(r, '.env.local'));
  const file = candidates.find((f) => fs.existsSync(f));
  if (!file) throw new Error(`No .env.local found (looked in ${candidates.join(', ')}). Pass --env=<path>.`);
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(`${file} lacks NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`);
  }
  return file;
}

const TEXT_FIELDS = ['subject', 'body', 'sms'];

/** Every pending navigator draft. No silent cap: a truncated read is an error. */
async function readPending(db) {
  const LIMIT = 5000;
  const { data, error } = await db
    .from('business_profiles')
    .select('id,metadata')
    .not('metadata->benefits_navigator', 'is', null)
    .limit(LIMIT);
  if (error) throw error;
  if (data.length >= LIMIT) throw new Error(`hit the ${LIMIT}-row cap; raise it`);
  return data.filter((r) => r.metadata?.benefits_navigator?.status === 'pending');
}

/** Map a pipeline stateId slug ("north-carolina") to its abbreviation via the pipeline's own stateName. */
const abbrevCache = {};
function abbrevFor(pipeline, stateId) {
  if (Object.keys(abbrevCache).length === 0) {
    for (const dir of fs.readdirSync(pipeline)) {
      if (!/^[A-Z]{2}$/.test(dir)) continue;
      const f = path.join(pipeline, dir, 'drafts.json');
      if (!fs.existsSync(f)) continue;
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (d.stateName) abbrevCache[d.stateName.toLowerCase().replace(/\s+/g, '-')] = dir;
    }
  }
  return abbrevCache[stateId] || stateId.toUpperCase();
}

/**
 * Rebuild the frozen pick snapshot from the pipeline, using the composer's own
 * rules (toPick in lib/family-comms/benefits-cascade.server.ts): the first
 * contact labelled "start here" with a phone, else the first with a phone;
 * documentsNeeded.slice(0, 3). Throws when the composer would return null,
 * because a letter whose pick is null has silently dropped out of the queue.
 */
function rebuildPick(pipeline, pick) {
  const ab = abbrevFor(pipeline, pick.stateId);
  const f = path.join(pipeline, ab, 'drafts.json');
  const d = JSON.parse(fs.readFileSync(f, 'utf8')).programs.find((p) => p.id === pick.programId);
  if (!d) throw new Error(`pipeline program missing: ${pick.stateId}/${pick.programId} (removed? this draft needs dismiss or recompose, not a patch)`);
  const contacts = d.contacts || [];
  const c = contacts.find((x) => x.phone && /start here/i.test(x.label || '')) || contacts.find((x) => !!x.phone);
  const documents = (d.documentsNeeded || []).slice(0, 3);
  if (!c?.phone || !documents.length) throw new Error(`toPick would be null for ${pick.programId}: no callable contact or no documents`);
  return {
    ...pick,
    name: d.name,
    shortName: d.shortName || d.name,
    savingsRange: d.savingsRange?.trim() || null,
    complexity: d.complexity,
    contactLabel: c.label,
    contactPhone: c.phone,
    contactHours: c.hours ?? null,
    documents,
  };
}

// ── Eastern time, without lib/eastern-time.ts (TypeScript) ─────────────────

/** Mirror of lib/business-day.ts. Update both when the year rolls. */
const US_FEDERAL_HOLIDAYS_ET = new Set([
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25', '2026-06-19', '2026-07-03',
  '2026-09-07', '2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25',
  '2027-01-01', '2027-01-18', '2027-02-15', '2027-05-31', '2027-06-18', '2027-07-05',
  '2027-09-06', '2027-10-11', '2027-11-11', '2027-11-25', '2027-12-24',
]);

const etParts = (date) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(date).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value]),
  );
  return { ymd: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, minute: Number(p.minute), weekday: p.weekday };
};

/** "YYYY-MM-DDTHH:MM" Eastern wall-clock to a UTC ISO string, DST-correct. */
function etWallClockToIso(input) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(input || '');
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  // Try both offsets; keep the one whose Eastern rendering matches the request.
  for (const offset of [4, 5]) {
    const cand = new Date(Date.UTC(y, mo - 1, d, h + offset, mi));
    const e = etParts(cand);
    if (e.ymd === `${m[1]}-${m[2]}-${m[3]}` && e.hour === h && e.minute === mi) return cand.toISOString();
  }
  return null;
}

function isBusinessDayEt(date) {
  const e = etParts(date);
  return !['Sat', 'Sun'].includes(e.weekday) && !US_FEDERAL_HOLIDAYS_ET.has(e.ymd);
}

/** Next `hour:minute` Eastern on a business day, at or after notBefore. */
function nextBusinessSlotEt(notBefore = new Date(), hour = 11, minute = 0) {
  const start = etParts(notBefore).ymd;
  const [y, mo, d] = start.split('-').map(Number);
  for (let i = 0; i < 14; i++) {
    const ymd = new Date(Date.UTC(y, mo - 1, d + i)).toISOString().slice(0, 10);
    const iso = etWallClockToIso(`${ymd}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    if (!iso) continue;
    const at = new Date(iso);
    if (at.getTime() < notBefore.getTime()) continue;
    if (isBusinessDayEt(at)) return iso;
  }
  throw new Error('no business day found in the next 14 days; check the holiday list');
}

function formatEt(iso) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(iso));
}

module.exports = { argFlag, has, requireDep, loadEnv, readPending, rebuildPick, TEXT_FIELDS, etWallClockToIso, nextBusinessSlotEt, isBusinessDayEt, formatEt };
