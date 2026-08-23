#!/usr/bin/env node
/**
 * Lint over PENDING navigator drafts in the database.
 *
 * The companion to scripts/benefits-lint.js. That one lints the source data
 * (data/pipeline). This one lints what families are actually about to receive,
 * which is a different artifact with a different set of failure modes.
 *
 * It exists because a fact-check round corrects pipeline data, and the already
 * composed drafts then carry the old facts until someone patches them by hand.
 * Two things went wrong doing that by hand on 2026-08-11:
 *
 *   1. A letter body was corrected and its SMS was not, so the email said
 *      "Elderly and Disabled Waiver Program" while the text still said "CCSP",
 *      the name Georgia retired. Step 6 of the factcheck command said to patch
 *      "the letter body", so the SMS was skipped through compliance rather than
 *      carelessness. cross-field-drift catches that class.
 *   2. The frozen `pick` snapshot kept pre-correction values, so corrected
 *      programs re-surfaced in later AI review exports and the plan page kept
 *      rendering stale contact details. snapshot-drift catches that class.
 *   3. A correction that only renamed a contact left the phone, program name and
 *      documents untouched, so every comparison passed while the letter still
 *      told the family to apply on a line that does not take applications
 *      (CA LIHEAP, 2026-08-22). snapshot-drift now compares contactLabel too.
 *
 * WHAT THIS CANNOT DO: it catches INCONSISTENCY, not WRONGNESS. A draft whose
 * phone is wrong but internally consistent everywhere reads as clean here. That
 * is the SoonerCare case (a real, staffed number that could not take the
 * caller's application), and it still needs someone reading the operator's own
 * page. Do not treat a clean run as verification.
 *
 * Usage:
 *   node scripts/benefits-draft-lint.js                 # all pending, human output
 *   node scripts/benefits-draft-lint.js --state=GA,TX   # only these states
 *   node scripts/benefits-draft-lint.js --check=snapshot-drift
 *   node scripts/benefits-draft-lint.js --high
 *   node scripts/benefits-draft-lint.js --json
 *   node scripts/benefits-draft-lint.js --fail-on-high  # exit 1 if high findings
 *
 * IMPORTANT: it compares drafts against the pipeline data in whatever checkout
 * it reads, so point it at the branch that holds the corrections. A git worktree
 * has neither node_modules nor .env.local, so run the script from a checkout
 * that does and point --pipeline at the worktree:
 *
 *   node scripts/benefits-draft-lint.js \
 *     --pipeline=~/.claude-worktrees/olera-web/<name>/data/pipeline
 *
 * Get this wrong and every corrected program reports snapshot-drift, because you
 * are diffing new drafts against old data.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const argFlag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

// A git worktree carries neither node_modules nor .env.local (both are ignored),
// so this cannot be run from the branch that holds the corrections. Run it from a
// checkout that has both and point --pipeline at the worktree's data. Without
// this you are linting drafts against whatever branch the runnable checkout
// happens to be on, and every corrected program looks like it drifted.
require('dotenv').config({ path: argFlag('env', path.resolve(__dirname, '..', '.env.local')) });
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.resolve(argFlag('pipeline', path.resolve(__dirname, '..', 'data', 'pipeline')));
if (!fs.existsSync(ROOT)) {
  console.error(`No pipeline directory at ${ROOT}. Pass --pipeline=<path to data/pipeline>.`);
  process.exit(1);
}

/** Which checkout, and which branch, the pipeline is being read from.
 *
 *  Every snapshot-drift finding is relative to this. Reading a branch that
 *  predates the corrections turns every corrected program into a false high,
 *  and the failure is otherwise invisible: the output looks like real findings.
 *  So the provenance is printed, never inferred silently. */
function pipelineProvenance() {
  try {
    const { execFileSync } = require('child_process');
    const cwd = path.resolve(ROOT, '..', '..');
    const run = (a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const branch = run(['rev-parse', '--abbrev-ref', 'HEAD']);
    const sha = run(['rev-parse', '--short', 'HEAD']);
    const dirty = run(['status', '--porcelain', '--', 'data/pipeline']).length > 0;
    return `${branch} @ ${sha}${dirty ? ' (uncommitted pipeline changes)' : ''}`;
  } catch {
    return 'not a git checkout';
  }
}
const flag = argFlag;
const has = (name) => args.includes(`--${name}`);

const ONLY_STATES = (flag('state', '') || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
const ONLY_CHECKS = (flag('check', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const HIGH_ONLY = has('high');
const AS_JSON = has('json');
const FAIL_ON_HIGH = has('fail-on-high');
const PROFILE_LIMIT = Number(flag('limit', '5000'));

const findings = [];
function report(f) {
  if (ONLY_CHECKS.length && !ONLY_CHECKS.includes(f.check)) return;
  if (HIGH_ONLY && f.severity !== 'high') return;
  findings.push(f);
}

// ── pipeline index ──────────────────────────────────────────────────────────
// Build slug -> abbrev from the pipeline itself rather than duplicating the map
// in lib/program-data.ts, which this plain-JS script cannot import.
const byAbbrev = {};
const slugToAbbrev = {};
for (const dir of fs.readdirSync(ROOT)) {
  if (!/^[A-Z]{2}$/.test(dir)) continue;
  const f = path.join(ROOT, dir, 'drafts.json');
  if (!fs.existsSync(f)) continue;
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  byAbbrev[dir] = d;
  if (d.stateName) slugToAbbrev[d.stateName.toLowerCase().replace(/\s+/g, '-')] = dir;
}
const programFor = (stateId, programId) => {
  const ab = slugToAbbrev[stateId] || (stateId || '').toUpperCase();
  return { abbrev: ab, program: byAbbrev[ab]?.programs?.find((p) => p.id === programId) || null };
};

// ── helpers ─────────────────────────────────────────────────────────────────

/** Loose phone matcher. Deliberately catches vanity forms (1-800-96-ELDER) and
 *  3-digit services (2-1-1, 3-1-1) because letters legitimately use both. */
// The leading \b must not sit before an optional "(", or the match starts at the
// first digit and reports "888) 233-0326" instead of "(888) 233-0326".
const PHONE_RE = /(?:\b\d-\d-\d\b|\b1-\d{3}-[\dA-Z][\dA-Z-]{4,}\b|\(\d{3}\)\s?\d{3}[-.\s]\d{4}|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b)/g;
const normPhone = (s) => String(s || '').replace(/[^\dA-Za-z]/g, '').toUpperCase();

/** A value that a family could actually dial. Prose in a phone field renders as
 *  "Call X at Contact information not specified in available sources." */
function isDialable(v) {
  const s = String(v || '').trim();
  if (!s) return false;
  // Short codes: 2-1-1, 3-1-1, 7-1-1.
  if (/^\d-\d-\d$/.test(s)) return true;
  // Vanity numbers (1-800-96-ELDER, 1-800-MEDICARE) are dialable even though
  // letters stand in for digits, so count alphanumerics rather than digits.
  if (/^1-\d{3}-[\dA-Z][\dA-Z-]*$/i.test(s)) {
    return (s.replace(/[^0-9A-Za-z]/g, '').length) >= 9;
  }
  // Otherwise a plain number, optionally with an extension.
  if (/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(\s*(x|ext\.?)\s*\d+)?$/i.test(s)) return true;
  // Anything else with letters in it is prose or an email address, not a number.
  return false;
}

/** Reproduce what benefits-navigator-send.server.ts actually transmits. The
 *  stored SMS is not the sent SMS: the send path appends a progress prompt and
 *  a STOP line unless the draft already carries them. */
const SMS_SAMPLE_URL = 'https://olera.care/m/XXXXXXXXXXXX?src=benefits_first_step_sms';

function assembleSms(draftSms) {
  if (!draftSms) return null;
  const progress = !/\bCALLED\b/i.test(draftSms) ? ' Reply CALLED, NO ANSWER, or STUCK.' : '';
  const stop = /reply stop/i.test(draftSms) ? '' : ' Reply STOP to opt out.';
  // Mirrors substituteSmsLink() in benefits-navigator-send.server.ts: punctuation
  // flush against the placeholder is dropped so it cannot be pulled into the
  // tapped URL. Keep the two in step or every downstream length/STOP check here
  // is measuring a message the send path no longer transmits.
  const body = draftSms.replace(/\{link\}[.,;:!?]*\s*/g, SMS_SAMPLE_URL + ' ').trimEnd();
  return body + progress + stop;
}

/** Names the record itself marks as retired, e.g. "formerly called the Community
 *  Care Services Program (CCSP)". Using the record as its own authority avoids a
 *  hand-maintained list of dead program names. */
function retiredNames(program) {
  const out = new Set();
  const hay = JSON.stringify(program);
  for (const m of hay.matchAll(/formerly (?:called|known as)\s+(?:the\s+)?([^",.(]+)(?:\s*\(([A-Z]{2,8})\))?/gi)) {
    const full = (m[1] || '').trim();
    if (full.length > 3) out.add(full);
    if (m[2]) out.add(m[2].trim());
  }
  return [...out];
}

// ── checks ──────────────────────────────────────────────────────────────────

/** The frozen pick snapshot vs live pipeline data. Drift here is why corrected
 *  programs re-appeared in later review exports with pre-correction values. */
function checkSnapshotDrift(ctx) {
  const { row, nav, program } = ctx;
  if (!program || !nav.pick) return;
  const live = {
    name: program.name,
    shortName: program.shortName || program.name,
    documents: (program.documentsNeeded || []).slice(0, 3),
    savingsRange: program.savingsRange?.trim() || null,
  };
  const contacts = program.contacts || [];
  const c =
    contacts.find((x) => x.phone && /start here/i.test(x.label || '')) ||
    contacts.find((x) => !!x.phone);
  live.contactPhone = c?.phone ?? null;
  live.contactHours = c?.hours ?? null;
  // The LABEL matters as much as the number. A correction that only renames a
  // contact (CA 2026-08-22: "LIHEAP Application Line" -> "CSD Call Center",
  // because that line answers questions and does not take applications) leaves
  // the phone, name and documents all identical, so every other comparison here
  // passes and the letter keeps telling the family to apply on a line that
  // cannot take an application. Label drift is a routing claim, not cosmetics.
  live.contactLabel = c?.label ?? null;

  for (const key of ['name', 'shortName', 'contactLabel', 'contactPhone', 'contactHours', 'savingsRange']) {
    if ((nav.pick[key] ?? null) !== (live[key] ?? null)) {
      report({
        id: row.id, state: nav.pick.stateId, programId: nav.pick.programId,
        check: 'snapshot-drift', severity: 'high',
        detail: `pick.${key} disagrees with current pipeline data.`,
        value: `snapshot: ${JSON.stringify(nav.pick[key] ?? null)}`,
        fix: `Refresh the pick snapshot in the same write as the body. Live value: ${JSON.stringify(live[key] ?? null)}`,
      });
    }
  }
  if (JSON.stringify(nav.pick.documents || []) !== JSON.stringify(live.documents)) {
    report({
      id: row.id, state: nav.pick.stateId, programId: nav.pick.programId,
      check: 'snapshot-drift', severity: 'high',
      detail: 'pick.documents disagrees with the current first three documentsNeeded.',
      value: JSON.stringify(nav.pick.documents || []),
      fix: `Refresh the snapshot. Live: ${JSON.stringify(live.documents)}`,
    });
  }
}

/** A phone number printed in the letter that is not on the program's contact
 *  list. Catches a body patched while the SMS was left behind, and a number that
 *  was corrected in the pipeline but never in the prose. */
function checkStalePhoneInText(ctx) {
  const { row, nav, program } = ctx;
  if (!program) return;
  const known = new Set((program.contacts || []).map((c) => normPhone(c.phone)).filter(Boolean));
  // The plan-page URL and the program's own phone are the only numbers a draft
  // should contain, so anything else is either stale or invented.
  for (const [field, text] of Object.entries({
    subject: nav.edited_subject || nav.subject,
    body: nav.edited_body || nav.body,
    sms: nav.edited_sms || nav.sms,
  })) {
    if (!text) continue;
    for (const m of String(text).match(PHONE_RE) || []) {
      if (known.has(normPhone(m))) continue;
      report({
        id: row.id, state: nav.pick?.stateId, programId: nav.pick?.programId,
        check: 'stale-phone-in-text', severity: 'high',
        detail: `${field} prints ${m}, which is not on this program's contact list.`,
        value: m,
        fix: 'Either the prose is stale or the pipeline contact was changed without patching the draft. Fix whichever is wrong; do not assume the prose.',
      });
    }
  }
}

/** The email and the text disagreeing about the same program. This is the
 *  Georgia case: body corrected to EDWP, SMS left on the retired CCSP. */
function checkCrossFieldDrift(ctx) {
  const { row, nav, program } = ctx;
  const body = nav.edited_body || nav.body || '';
  const sms = nav.edited_sms || nav.sms || '';
  if (!body || !sms) return;

  const bodyPhones = new Set((body.match(PHONE_RE) || []).map(normPhone));
  const smsPhones = new Set((sms.match(PHONE_RE) || []).map(normPhone));
  for (const p of smsPhones) {
    if (bodyPhones.size && !bodyPhones.has(p)) {
      report({
        id: row.id, state: nav.pick?.stateId, programId: nav.pick?.programId,
        check: 'cross-field-drift', severity: 'high',
        detail: 'The text message names a phone number the email does not.',
        value: `sms: ${p}`,
        fix: 'Patch the body and the SMS in the same write. A family reading both sees two different instructions.',
      });
    }
  }
  for (const dead of retiredNames(program || {})) {
    const inBody = new RegExp(`\\b${dead.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(body);
    const inSms = new RegExp(`\\b${dead.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(sms);
    if (inSms && !inBody) {
      report({
        id: row.id, state: nav.pick?.stateId, programId: nav.pick?.programId,
        check: 'cross-field-drift', severity: 'high',
        detail: `The text message uses "${dead}", a name this program's own record marks as retired, but the email does not.`,
        value: dead,
        fix: 'Update the SMS to the current program name. Body and SMS must move together.',
      });
    }
  }
}

/** Problems in what is actually transmitted, not what is stored. */
function checkSmsAssembly(ctx) {
  const { row, nav } = ctx;
  const draft = nav.edited_sms || nav.sms;
  if (!draft) return;
  const meta = { id: row.id, state: nav.pick?.stateId, programId: nav.pick?.programId };

  if (!/\{link\}/.test(draft)) {
    report({ ...meta, check: 'sms-assembly', severity: 'high',
      detail: 'The SMS has no {link} placeholder, so the family gets no plan page.',
      value: draft, fix: 'Add {link} where the plan URL belongs.' });
  }
  // Tests the ASSEMBLED message, not the stored draft. The send path strips
  // punctuation flush against the link, so a draft written as "{link}." is
  // transmitted correctly and is not a finding. A hit here means the send path
  // regressed, which is worth shouting about: the plan link is the only
  // tappable thing in the text.
  const sentForLink = assembleSms(draft);
  const linkAt = sentForLink ? sentForLink.indexOf(SMS_SAMPLE_URL) : -1;
  const afterLink = linkAt >= 0 ? sentForLink[linkAt + SMS_SAMPLE_URL.length] || '' : '';
  if (linkAt >= 0 && /[.,;:!?]/.test(afterLink)) {
    report({ ...meta, check: 'sms-assembly', severity: 'high',
      detail: 'The transmitted message has punctuation flush against the plan URL. Some SMS clients pull the trailing character into the tapped link and it 404s. The send path is supposed to strip this.',
      value: SMS_SAMPLE_URL + afterLink,
      fix: 'Check substituteSmsLink() in benefits-navigator-send.server.ts.' });
  }
  if (/[‘’“”—]/.test(draft)) {
    report({ ...meta, check: 'sms-assembly', severity: 'medium',
      detail: 'Smart quotes or an em dash in the SMS. Em dashes are banned in shipped copy and smart quotes break exact-match patching.',
      value: draft, fix: 'Use straight quotes and periods.' });
  }
  const sent = assembleSms(draft);
  if ((sent.match(/Reply STOP/gi) || []).length !== 1) {
    report({ ...meta, check: 'sms-assembly', severity: 'high',
      detail: `The assembled message contains ${(sent.match(/Reply STOP/gi) || []).length} STOP lines. The send path appends one unless the draft already says "reply stop".`,
      value: sent, fix: 'Remove the hand-written STOP line and let the send path add it.' });
  }
  if ((sent.match(/\bCALLED\b/gi) || []).length !== 1) {
    report({ ...meta, check: 'sms-assembly', severity: 'medium',
      detail: `The assembled message contains ${(sent.match(/\bCALLED\b/gi) || []).length} CALLED prompts.`,
      value: sent, fix: 'Keep exactly one reply prompt.' });
  }
  const segs = Math.ceil(sent.length / 153);
  if (segs > 3) {
    report({ ...meta, check: 'sms-assembly', severity: 'low',
      detail: `The assembled message is ${sent.length} characters, ${segs} segments.`,
      value: `${sent.length} chars`, fix: 'Trim. Every segment is billed and long texts get truncated by some carriers.' });
  }
}

/** "Have three things nearby" followed by a list that is not three. The count
 *  drifts whenever a document is added or removed during a correction. This is
 *  advisory: prose lists are not reliably parseable, so it asks for an eyeball
 *  rather than asserting a miscount. */
function checkCountWords(ctx) {
  const { row, nav } = ctx;
  const body = nav.edited_body || nav.body || '';
  const m = body.match(/\b(two|three|four|five)\s+things\b/i);
  if (!m) return;
  if (!nav.factcheck_patched_at) return; // only drifts once something was edited
  report({
    id: row.id, state: nav.pick?.stateId, programId: nav.pick?.programId,
    check: 'count-word', severity: 'low',
    detail: `This letter was patched and states a count ("${m[0]}"). Counts drift when a document is added or removed.`,
    value: m[0],
    fix: 'Read the list that follows and confirm it still has that many items.',
  });
}

/** Prose or an email address sitting where the phone number goes. */
function checkNonDialableAnchor(ctx) {
  const { row, nav } = ctx;
  const v = nav.pick?.contactPhone;
  if (!v || isDialable(v)) return;
  report({
    id: row.id, state: nav.pick?.stateId, programId: nav.pick?.programId,
    check: 'non-dialable-anchor', severity: 'high',
    detail: 'The call anchor is not a dialable number, so the letter prints prose where the phone number belongs.',
    value: String(v),
    fix: 'Find the program\'s real number. A non-empty phone field is not the same as a usable one.',
  });
}

/**
 * Words and promises the navigator voice spec forbids, checked against what is
 * actually queued rather than trusting the composer to have obeyed.
 *
 * The speed promises matter most. A family told this is quick, who then waits
 * three months, feels lied to and stops answering us, which costs far more than
 * the one letter. "One phone call" is the same promise as the banned "just one
 * call" with the qualifier removed.
 */
const BANNED = [
  [/\bjourney\b/i, 'banned word "journey"'],
  [/\bnavigate\b/i, 'banned word "navigate"'],
  [/\bunlock\b/i, 'banned word "unlock"'],
  [/\bempower\b/i, 'banned word "empower"'],
  [/\bamazing\b|\bexciting\b/i, 'hype word'],
  [/\bI hope this (email )?finds you well\b/i, 'filler greeting'],
  [/(^|[^a-z])(just|only)\s+one\s+(phone\s+)?call\b/i, 'speed promise "just one call"'],
  [/\bit'?s\s+(just\s+)?one\s+(phone\s+)?call\b/i, 'speed promise "it is one phone call"'],
  [/\b(quick|easy|simple|fast)\b(?![a-z])/i, 'speed or ease promise'],
  [/\btakes? (only |about )?(a few|ten|5|five|10) minutes\b/i, 'unsupported duration promise'],
  [/—/, 'em dash (banned in shipped copy)'],
];
function checkBannedPhrases(ctx) {
  const { row, nav } = ctx;
  for (const [field, text] of Object.entries({
    subject: nav.edited_subject || nav.subject,
    body: nav.edited_body || nav.body,
    sms: nav.edited_sms || nav.sms,
  })) {
    if (!text) continue;
    for (const [re, label] of BANNED) {
      const m = String(text).match(re);
      if (!m) continue;
      report({
        id: row.id, state: nav.pick?.stateId, programId: nav.pick?.programId,
        check: 'banned-phrase', severity: 'medium',
        detail: `${field} contains a ${label}.`,
        value: m[0],
        fix: 'Rewrite per the navigator voice spec. Speed and ease promises are the ones that cost us replies.',
      });
    }
  }
}

const CHECKS = [
  checkSnapshotDrift,
  checkBannedPhrases,
  checkStalePhoneInText,
  checkCrossFieldDrift,
  checkSmsAssembly,
  checkCountWords,
  checkNonDialableAnchor,
];

// ── run ─────────────────────────────────────────────────────────────────────

(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local)');
    process.exit(1);
  }
  const db = createClient(url, key);
  const { data, error } = await db
    .from('business_profiles')
    .select('id,metadata')
    .not('metadata->benefits_navigator', 'is', null)
    .limit(PROFILE_LIMIT);
  if (error) { console.error(error.message); process.exit(1); }
  // No silent caps: a truncated scan that reports "nothing flagged" is worse
  // than no scan, because it reads as a clean bill of health.
  if ((data || []).length >= PROFILE_LIMIT) {
    console.error(`WARNING: hit the ${PROFILE_LIMIT}-row fetch cap, so some drafts were not scanned. Raise --limit.`);
  }

  let scanned = 0;
  for (const row of data || []) {
    const nav = row.metadata?.benefits_navigator;
    if (!nav || nav.status !== 'pending') continue;
    const { abbrev, program } = programFor(nav.pick?.stateId, nav.pick?.programId);
    if (ONLY_STATES.length && !ONLY_STATES.includes(abbrev)) continue;
    scanned++;
    if (!program) {
      report({
        id: row.id, state: nav.pick?.stateId, programId: nav.pick?.programId,
        check: 'program-missing', severity: 'high',
        detail: 'The draft references a program that no longer exists in the pipeline.',
        value: `${nav.pick?.stateId}/${nav.pick?.programId}`,
        fix: 'A removed program cannot be text-patched. Dismiss the draft, or recompose after the data change deploys.',
      });
      continue;
    }
    const ctx = { row, nav, program, abbrev };
    for (const check of CHECKS) check(ctx);
  }

  if (AS_JSON) {
    console.log(JSON.stringify({ pipeline: ROOT, branch: pipelineProvenance(), scanned, findings }, null, 2));
  } else {
    const by = { high: 0, medium: 0, low: 0 };
    findings.forEach((f) => { by[f.severity] = (by[f.severity] || 0) + 1; });
    console.log(`\nPipeline: ${ROOT}`);
    console.log(`Branch:   ${pipelineProvenance()}`);
    console.log(`\nScanned ${scanned} pending drafts.`);
    console.log(`Findings: ${by.high} high, ${by.medium} medium, ${by.low} low\n`);
    const groups = {};
    findings.forEach((f) => { (groups[f.check] = groups[f.check] || []).push(f); });
    for (const [check, list] of Object.entries(groups)) {
      console.log('='.repeat(76));
      console.log(`${check.toUpperCase()}  (${list.length})`);
      console.log('='.repeat(76));
      for (const f of list) {
        console.log(`\n[${f.severity.toUpperCase()}] ${String(f.id).slice(0, 8)} · ${f.state}/${f.programId}`);
        console.log(`  ${f.detail}`);
        if (f.value !== undefined) console.log(`  value: ${String(f.value).slice(0, 200)}`);
        console.log(`  fix:   ${f.fix}`);
      }
      console.log('');
    }
    if (!findings.length) console.log('Nothing flagged.\n');
    console.log('Reminder: this catches inconsistency, not wrongness. A draft whose');
    console.log('phone is wrong but consistent everywhere reads as clean here.\n');
  }

  if (FAIL_ON_HIGH && findings.some((f) => f.severity === 'high')) process.exit(1);
})();
