#!/usr/bin/env node
/**
 * Offline data-quality lint over data/pipeline/<ST>/drafts.json.
 *
 * Every check here is a pure data check — no network, no API keys, seconds to
 * run. It exists because most fact-check findings are instances of a few
 * recurring patterns rather than novel facts, and paying an external model to
 * rediscover them each round is slow and expensive. See
 * .claude/commands/benefits-factcheck.md ("Speed budget").
 *
 * The checks encode findings from the 2026-08-07 round:
 *   medicare-not-required  34 Medicaid/PACE programs demanded a Medicare card
 *   medicare-card-parts    "both parts" implies a second card that never existed
 *   self-contradiction     CT's savingsRange disagreed with its own tagline/FAQ
 *   null-lead-phone        WV VISIONS fell through to 2-1-1 silently
 *   generic-anchor         CO SNAP pointed at the EBT lost-card line
 *   unsourced-savings      AZ/CO presented a ceiling as a typical range
 *   stale                  never verified, or verified long ago
 *
 * Only the FIRST THREE documents reach a family: the composer slices
 * documentsNeeded[0..2] (lib/family-comms/benefits-cascade.server.ts). Document
 * checks therefore only look at that window — a wrong item buried at position 9
 * is not what a family reads.
 *
 * Usage:
 *   node scripts/benefits-lint.js                  # all states, human output
 *   node scripts/benefits-lint.js --state=CO,WV    # only these states
 *   node scripts/benefits-lint.js --check=medicare-not-required
 *   node scripts/benefits-lint.js --high           # high severity only
 *   node scripts/benefits-lint.js --json           # machine-readable
 *   node scripts/benefits-lint.js --stale-days=30  # staleness threshold
 *
 * Exit code is 0 unless --fail-on-high is passed and high findings exist.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'data', 'pipeline');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const has = (name) => args.includes(`--${name}`);

const ONLY_STATES = (flag('state', '') || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
const ONLY_CHECKS = (flag('check', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const STALE_DAYS = Number(flag('stale-days', '180'));
const HIGH_ONLY = has('high');
const AS_JSON = has('json');
const FAIL_ON_HIGH = has('fail-on-high');
const TODAY = new Date(flag('today', new Date().toISOString().slice(0, 10)));

/** Documents beyond this index never reach a family. */
const VISIBLE_DOCS = 3;

/** Phone numbers that are referral or self-service lines, not application doors. */
const GENERIC_PHONE = /^(2-1-1|211|1-?800-?MEDICARE|1-?800-?633-?4227)$/i;
/** Lines that answer but cannot take an application. */
const WRONG_SERVICE = [
  { re: /\(?888\)?[\s.-]?328[\s.-]?2656/, what: 'nationwide EBT card-services line (lost/stolen cards, not applications)' },
];

const findings = [];
function report(f) {
  if (ONLY_CHECKS.length && !ONLY_CHECKS.includes(f.check)) return;
  if (HIGH_ONLY && f.severity !== 'high') return;
  findings.push(f);
}

/** Money figures in a string, normalized for comparison ("$1,500" -> 1500). */
function moneyIn(str) {
  if (typeof str !== 'string') return [];
  return [...str.matchAll(/\$([\d,]+(?:\.\d+)?)/g)]
    .map((m) => Number(m[1].replace(/,/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/** Every string in a record except the excluded top-level keys. */
function stringsExcept(program, excludeKeys) {
  const out = [];
  for (const [k, v] of Object.entries(program)) {
    if (excludeKeys.includes(k)) continue;
    (function walk(node) {
      if (typeof node === 'string') out.push(node);
      else if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === 'object') Object.values(node).forEach(walk);
    })(v);
  }
  return out;
}

function isMedicareProgram(p) {
  const hay = `${p.name || ''} ${p.shortName || ''}`;
  // Programs where Medicare enrollment genuinely is an eligibility condition.
  return /medicare savings|qmb|slmb|\bqi\b|ship|shine|medicare counseling|senior care options|medicare advantage/i.test(hay);
}

function isMedicaidOrPace(p) {
  const elig = (p.structuredEligibility?.summary || []).join(' ');
  const hay = `${p.name || ''} ${p.shortName || ''} ${elig}`;
  return /waiver|medicaid|nursing[- ]facility level|nursing home level|all-inclusive care|\bpace\b/i.test(hay);
}

// ── checks ──────────────────────────────────────────────────────────────────

function checkMedicareNotRequired(st, p) {
  const docs = (p.documentsNeeded || []).slice(0, VISIBLE_DOCS);
  docs.forEach((d, i) => {
    if (!/parts?\s+a\s+and\s+b/i.test(d)) return;
    if (isMedicareProgram(p)) return; // legitimately Medicare-gated
    if (!isMedicaidOrPace(p)) return;
    if (/not required|if you have|if they have/i.test(d)) return; // already softened
    report({
      state: st, programId: p.id, program: p.name, check: 'medicare-not-required', severity: 'high',
      detail: `documentsNeeded[${i}] demands a Medicare card with Parts A and B, but this is a Medicaid waiver or PACE program where Medicare is not an eligibility requirement.`,
      value: d,
      fix: 'Soften to "Medicare card if they have one (not required for this program)" and move a genuinely needed document into the visible top three.',
    });
  });
}

/** Dollar figures with each one annualized by its OWN local context. A source
 *  note routinely states both forms ("$202.90/month ($2,434.80/year)"), so
 *  scaling the whole string by 12 turns $2,434.80 into $29,217.60 and invents a
 *  contradiction. Scale per figure, never per string.
 *
 *  `benefitOnly` additionally drops eligibility thresholds ("income below
 *  $2,742/month"), which are not comparable to a benefit amount at all. */
function annualizedAmounts(str, { benefitOnly = false } = {}) {
  if (typeof str !== 'string') return [];
  const out = [];
  for (const m of str.matchAll(/\$([\d,]+(?:\.\d+)?)/g)) {
    const n = Number(m[1].replace(/,/g, ''));
    if (!Number.isFinite(n) || n <= 0) continue;
    const before = str.slice(Math.max(0, m.index - 60), m.index).toLowerCase();
    const after = str.slice(m.index + m[0].length, m.index + m[0].length + 30).toLowerCase();
    if (benefitOnly) {
      if (/\b(income|asset|resource|limit|below|under|less than|no more than|equity|countable|threshold|earn)\b[^.]*$/.test(before)) continue;
      if (/^\s*(or less|or below|limit|threshold)/.test(after)) continue;
      const benefitBefore = /\b(up to|pays?|provides?|covers?|worth|save[sd]?|savings|benefit|award|subsidy|receive|reimburse|allotment|maximum of|as much as)\b[^.]*$/.test(before);
      const benefitAfter = /^\s*(per year|a year|annually|per month|a month|\/year|\/month|toward|in (?:benefits|assistance|help))/.test(after);
      if (!benefitBefore && !benefitAfter) continue;
    }
    // "Monthly cash payments up to $450" states the period BEFORE the figure,
    // so checking only the trailing context annualizes nothing and makes a
    // correct record ($5,400–$6,840 = $450 and $570 a month) look contradictory.
    const isMonthly =
      /^\s*(?:\/\s*mo|per month|a month|monthly|\/month)/.test(after) ||
      /\b(?:monthly|per month|a month)\b[^.$]*$/.test(before);
    out.push(isMonthly ? n * 12 : n);
  }
  return out;
}

function headlineAmount(nums) {
  return nums.length ? Math.max(...nums) : null;
}

/** Only compare savingsRange against savingsSource — the field whose entire job
 *  is to justify it. Comparing against intro/FAQ prose produced false positives
 *  on rounding ($2,435 vs $2,434.80) and on unit mismatches, and a lint people
 *  learn to ignore is worse than no lint. CT 2026-08-07 (range $1,500–$6,000,
 *  source "up to $7,500 annual subsidy") is the case this must catch. */
function checkSelfContradiction(st, p) {
  const range = p.savingsRange;
  const source = p.savingsSource;
  if (typeof range !== 'string' || !range.trim()) return;
  if (typeof source !== 'string' || !source.trim()) return; // unsourced-savings owns this
  // Corroborated if the source repeats ANY figure the range quotes, raw or
  // annualized. A range and its source often describe different household
  // sizes ("up to $298/month for one person" vs a source listing one- through
  // five-person allotments); comparing only the maxima calls that a conflict
  // when the range is in fact well-formed and sourced.
  const near = (a, b) => Math.abs(a - b) / Math.max(a, b) <= 0.02;
  const rangeTop = Math.max(...moneyIn(range), 0);
  const sourceFigures = moneyIn(source);
  if (rangeTop > 0 && sourceFigures.some((s) => near(rangeTop, s) || near(rangeTop, s * 12))) return;

  const rangeMax = headlineAmount(annualizedAmounts(range));
  const sourceMax = headlineAmount(annualizedAmounts(source, { benefitOnly: true }));
  if (rangeMax === null || sourceMax === null) return;
  if (rangeMax < 100 || sourceMax < 100) return;
  const drift = Math.abs(sourceMax - rangeMax) / Math.max(sourceMax, rangeMax);
  if (drift <= 0.15) return; // rounding, or the same figure stated differently
  report({
    state: st, programId: p.id, program: p.name, check: 'self-contradiction', severity: 'high',
    detail: `savingsRange tops out at $${rangeMax.toLocaleString()} but savingsSource describes the benefit as reaching $${sourceMax.toLocaleString()} — a ${Math.round(drift * 100)}% gap between a field and the note that is supposed to justify it.`,
    value: `savingsRange: "${range}"  |  savingsSource: "${source.slice(0, 120)}"`,
    fix: 'The outlier is almost always savingsRange. Settle it by reading the record, not by searching the web.',
  });
}

function checkNullLeadPhone(st, p) {
  const contacts = p.contacts || [];
  if (!contacts.length) return;
  const lead = contacts[0];
  if (lead.phone) return;
  const fallback = contacts.find((c) => c.phone);
  if (!fallback) return;
  report({
    state: st, programId: p.id, program: p.name, check: 'null-lead-phone', severity: 'high',
    detail: `contacts[0] ("${lead.label || 'unlabeled'}") has no phone, so the composer silently falls through to "${fallback.label}" (${fallback.phone}). Letters name the fallback, not the program's own line.`,
    value: `contacts[0].phone = null`,
    fix: 'Find the program operator\'s own number and put it on contacts[0]. A null lead phone is a data error, not a blank.',
  });
}

function checkGenericAnchor(st, p) {
  const contacts = p.contacts || [];
  const lead = contacts.find((c) => c.phone);
  if (!lead) return;
  const phone = String(lead.phone).trim();
  for (const w of WRONG_SERVICE) {
    if (w.re.test(phone)) {
      report({
        state: st, programId: p.id, program: p.name, check: 'generic-anchor', severity: 'high',
        detail: `The call anchor is the ${w.what}.`,
        value: `${lead.label} — ${phone}`,
        fix: 'Replace with a line that can actually start an application, and demote this one with an honest label.',
      });
      return;
    }
  }
  if (GENERIC_PHONE.test(phone.replace(/\s/g, ''))) {
    const labelled = /locator|find|refer|directory|connects you/i.test(`${lead.description || ''} ${lead.label || ''}`);
    report({
      state: st, programId: p.id, program: p.name, check: 'generic-anchor', severity: labelled ? 'medium' : 'high',
      detail: labelled
        ? `The call anchor is ${phone}, a general referral line, but it is honestly labelled as a locator.`
        : `The call anchor is ${phone}, a general referral line presented as the program's door.`,
      value: `${lead.label} — ${phone}`,
      fix: labelled
        ? 'Acceptable if this line genuinely routes to the program. Confirm it does.'
        : 'Either find the program\'s own line, or relabel this one plainly as a locator that will transfer you.',
    });
  }
}

function checkUnsourcedSavings(st, p) {
  const range = (p.savingsRange || '').trim();
  if (!range) return;
  const source = (p.savingsSource || '').trim();
  const vague = !source || source.length < 25 || /^(free service|paid caregiving service|comprehensive care service|varies)$/i.test(source);
  if (vague) {
    report({
      state: st, programId: p.id, program: p.name, check: 'unsourced-savings', severity: 'medium',
      detail: `savingsRange is set but savingsSource ${source ? `is thin ("${source}")` : 'is empty'}, so there is no basis on record for the figure.`,
      value: range,
      fix: 'Put the official basis in savingsSource, naming the issuing body and what the figure is (maximum, standard benefit, premium offset).',
    });
    return;
  }
  // A ceiling phrased as a typical range: "$1,200 – $4,800/year" with nothing
  // in the source calling it a maximum.
  const isRange = /[–-]\s*\$/.test(range);
  const claimsMax = /\b(max|maximum|up to|ceiling)\b/i.test(`${range} ${source}`);
  if (isRange && !claimsMax) {
    report({
      state: st, programId: p.id, program: p.name, check: 'unsourced-savings', severity: 'medium',
      detail: 'savingsRange reads as a typical range but neither it nor savingsSource says whether the figures are maximums.',
      value: range,
      fix: 'Label maximums as maximums. Letters turn this field into "families that qualify often save X", which overpromises when X is a ceiling.',
    });
  }
}

function checkStale(st, p) {
  const d = p.lastVerifiedDate;
  if (!d) {
    report({
      state: st, programId: p.id, program: p.name, check: 'stale', severity: 'low',
      detail: 'lastVerifiedDate is not set, so nothing records when this program was last checked.',
      value: 'null',
      fix: 'Stamp lastVerifiedDate when the program is next verified.',
    });
    return;
  }
  const age = Math.floor((TODAY - new Date(d)) / 86400000);
  if (age > STALE_DAYS) {
    report({
      state: st, programId: p.id, program: p.name, check: 'stale', severity: 'low',
      detail: `Last verified ${age} days ago (threshold ${STALE_DAYS}).`,
      value: d,
      fix: 'Include in the next fact-check round.',
    });
  }
}

/**
 * A program that offers to pay a family member, but never says whether a SPOUSE
 * can be one.
 *
 * From the 2026-08-08 Louisiana case: a woman caring for her husband was routed
 * to "Caregiver Voucher", whose intro said family members living with the
 * recipient can be paid. Louisiana treats a spouse as a legally responsible
 * individual, payable only under an Extraordinary Care standard with written
 * state approval. She was the one reader that page could never help, and the
 * program's own applicationNotes contradicted its intro.
 *
 * Most state HCBS waivers carry the same carve-out, and a sweep on 08-08 found
 * 36 of 37 paid-caregiver programs across 28 states silent on it. Silence is
 * the finding here: some states genuinely do pay spouses, so this flags an
 * unanswered question rather than asserting the answer.
 */
function checkSpouseCaveatMissing(st, p) {
  const blob = JSON.stringify(p).toLowerCase();
  const promisesPay = /get paid to care|paid family caregiver|paid caregiver|become a paid|pay you to (provide|care)/.test(blob);
  if (!promisesPay) return;
  if (/legally responsible|extraordinary care|spouses? (cannot|may not|are not|is not)/.test(blob)) return;
  report({
    state: st, programId: p.id, program: p.name, check: 'spouse-caveat-missing', severity: 'high',
    detail: 'Offers payment to a family caregiver but never says whether a spouse can be one. Most HCBS waivers treat a spouse as a legally responsible individual.',
    value: 'no mention of legally responsible individual or Extraordinary Care',
    fix: 'Check the state rule. If spouses are restricted, say so in the intro and the first FAQ. If they are not, say that explicitly so the question is answered either way.',
  });
}

/**
 * A slow program that never says it is slow.
 *
 * Same case: the letter framed a Medicaid waiver as one phone call. The real
 * path was a 45 to 90 day application behind a registry waitlist. She spent 45
 * minutes on hold discovering that herself. An unstated timeline is not a
 * neutral omission, because the reader supplies an optimistic one.
 *
 * Scoped to `deep` complexity only. An earlier draft also caught anything
 * mentioning Medicaid anywhere in the record, which flagged 48% of the library
 * (305 of 642) including programs that only mention Medicaid to say it is not
 * required. A lint that flags half of everything gets ignored. Deep programs
 * are the slow ones by definition, which lands at 187 and is a real backlog
 * rather than noise.
 */
function checkNoTimeline(st, p) {
  if (p.complexity !== 'deep') return;
  const guide = p.applicationGuide || {};
  const timelineFields = `${guide.processingTime || ''} ${guide.waitlist || ''}`.toLowerCase();
  const statesDuration = /\b\d+\s*(to|-|–)\s*\d+\s*(day|week|month|year)|\b\d+\s*(day|week|month|year)s?\b|waitlist|waiting list|registry|first-come/.test(timelineFields);
  if (statesDuration) return;
  report({
    state: st, programId: p.id, program: p.name, check: 'no-timeline', severity: 'medium',
    detail: 'A deep program with no processing time and no waitlist note, so the letter cannot tell the family how long this takes.',
    value: `processingTime: ${JSON.stringify(guide.processingTime ?? null)}, waitlist: ${JSON.stringify(guide.waitlist ?? null)}`,
    fix: 'Fill processingTime with a real range and waitlist with whether one exists. Families who expect an answer this week and wait three months stop replying to us.',
  });
}

/**
 * Medicare issues ONE card, showing Part A and/or Part B. "Both parts A and B"
 * implies a second card that does not exist, or that both enrollments are a
 * prerequisite. Neither is true, and a family who cannot find their "Part B
 * card" may not make the call at all.
 *
 * Distinct from medicare-not-required, which asks whether a Medicare card
 * belongs in this program's list at all. This check assumes it does and only
 * objects to the count. It therefore stays quiet when the more severe check
 * already fires, and it deliberately catches the "(both parts)" phrasing that
 * medicare-not-required's /parts a and b/ pattern misses -- that gap is how
 * AL medicare-savings-programs shipped a pending letter on 2026-08-11.
 */
function checkMedicareCardParts(st, p) {
  const docs = (p.documentsNeeded || []).slice(0, VISIBLE_DOCS);
  docs.forEach((d, i) => {
    if (!/\bboth\s+parts?\b|parts?\s+a\s+and\s+b/i.test(d)) return;
    if (!/medicare/i.test(d)) return;
    // Defer to medicare-not-required, which reports the same document as high.
    if (/parts?\s+a\s+and\s+b/i.test(d) && !isMedicareProgram(p) && isMedicaidOrPace(p)) return;
    report({
      state: st, programId: p.id, program: p.name, check: 'medicare-card-parts', severity: 'low',
      detail: `documentsNeeded[${i}] describes the Medicare card as having two parts. Medicare issues one card that lists Part A and/or Part B.`,
      value: d,
      fix: 'Say "Medicare card". Drop the parts wording entirely rather than explaining it, since the letter has no room to teach Medicare structure.',
    });
  });
}

const CHECKS = [
  checkMedicareNotRequired,
  checkMedicareCardParts,
  checkSelfContradiction,
  checkNullLeadPhone,
  checkGenericAnchor,
  checkUnsourcedSavings,
  checkSpouseCaveatMissing,
  checkNoTimeline,
  checkStale,
];

// ── run ─────────────────────────────────────────────────────────────────────

const states = fs.readdirSync(ROOT)
  .filter((d) => /^[A-Z]{2}$/.test(d))
  .filter((d) => !ONLY_STATES.length || ONLY_STATES.includes(d))
  .sort();

if (!states.length) {
  console.error(`No states matched${ONLY_STATES.length ? ` --state=${ONLY_STATES.join(',')}` : ''}.`);
  process.exit(1);
}

let programCount = 0;
for (const st of states) {
  const fp = path.join(ROOT, st, 'drafts.json');
  if (!fs.existsSync(fp)) continue;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch (e) {
    console.error(`FAILED to parse ${fp}: ${e.message}`);
    process.exit(1);
  }
  for (const p of data.programs || []) {
    programCount++;
    for (const check of CHECKS) check(st, p);
  }
}

const SEV_RANK = { high: 0, medium: 1, low: 2 };
findings.sort((a, b) =>
  SEV_RANK[a.severity] - SEV_RANK[b.severity] ||
  a.check.localeCompare(b.check) ||
  a.state.localeCompare(b.state));

if (AS_JSON) {
  console.log(JSON.stringify({
    scanned: { states: states.length, programs: programCount },
    counts: findings.reduce((acc, f) => ((acc[f.severity] = (acc[f.severity] || 0) + 1), acc), {}),
    findings,
  }, null, 2));
} else {
  const counts = findings.reduce((acc, f) => ((acc[f.severity] = (acc[f.severity] || 0) + 1), acc), {});
  console.log(`\nScanned ${programCount} programs across ${states.length} states.`);
  console.log(`Findings: ${counts.high || 0} high, ${counts.medium || 0} medium, ${counts.low || 0} low\n`);
  let lastCheck = null;
  for (const f of findings) {
    if (f.check !== lastCheck) {
      const n = findings.filter((x) => x.check === f.check).length;
      console.log(`\n${'='.repeat(76)}\n${f.check.toUpperCase()}  (${n})\n${'='.repeat(76)}`);
      lastCheck = f.check;
    }
    console.log(`\n[${f.severity.toUpperCase()}] ${f.state} · ${f.programId}`);
    console.log(`  ${f.program}`);
    console.log(`  ${f.detail}`);
    if (f.value) console.log(`  value: ${f.value}`);
    console.log(`  fix:   ${f.fix}`);
  }
  if (!findings.length) console.log('Nothing flagged.\n');
  else console.log('');
}

if (FAIL_ON_HIGH && findings.some((f) => f.severity === 'high')) process.exit(1);
