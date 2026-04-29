#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const STATE_NAMES = {
  AL: 'alabama', AK: 'alaska', AZ: 'arizona', AR: 'arkansas', CA: 'california',
  CO: 'colorado', CT: 'connecticut', DE: 'delaware', DC: 'district-of-columbia',
  FL: 'florida', GA: 'georgia', HI: 'hawaii', ID: 'idaho', IL: 'illinois',
  IN: 'indiana', IA: 'iowa', KS: 'kansas', KY: 'kentucky', LA: 'louisiana',
  ME: 'maine', MD: 'maryland', MA: 'massachusetts', MI: 'michigan', MN: 'minnesota',
  MS: 'mississippi', MO: 'missouri', MT: 'montana', NE: 'nebraska', NV: 'nevada',
  NH: 'new-hampshire', NJ: 'new-jersey', NM: 'new-mexico', NY: 'new-york',
  NC: 'north-carolina', ND: 'north-dakota', OH: 'ohio', OK: 'oklahoma', OR: 'oregon',
  PA: 'pennsylvania', RI: 'rhode-island', SC: 'south-carolina', SD: 'south-dakota',
  TN: 'tennessee', TX: 'texas', UT: 'utah', VT: 'vermont', VA: 'virginia',
  WA: 'washington', WV: 'west-virginia', WI: 'wisconsin', WY: 'wyoming',
};

const SKIP_STATES = new Set(['FL', 'TX']);
const PIPELINE_DIR = path.join(__dirname, '..', 'data', 'pipeline');

function severity(flags) {
  if (!flags || flags.length === 0) return 'none';
  if (flags.some(f => f.severity === 'high')) return 'high';
  if (flags.some(f => f.severity === 'medium')) return 'medium';
  return 'low';
}

function summarizeFlag(f) {
  const fld = f.field;
  const dv = Array.isArray(f.draftValue) ? f.draftValue.join('/') : f.draftValue;
  const vv = f.verifiedValue;
  if (fld === 'phone') return `phone (drafted ${dv}; verified ${vv})`;
  if (fld === 'age') return `age (drafted ${dv} vs verified ${vv})`;
  return `${fld} (drafted ${dv} vs verified ${vv})`;
}

const allPages = [];

for (const stateCode of Object.keys(STATE_NAMES)) {
  if (SKIP_STATES.has(stateCode)) continue;
  const dir = path.join(PIPELINE_DIR, stateCode);
  const draftsPath = path.join(dir, 'drafts.json');
  const classifyPath = path.join(dir, 'classify.json');
  const factcheckPath = path.join(dir, 'factcheck.json');
  if (!fs.existsSync(draftsPath) || !fs.existsSync(classifyPath) || !fs.existsSync(factcheckPath)) continue;

  const drafts = JSON.parse(fs.readFileSync(draftsPath));
  const classify = JSON.parse(fs.readFileSync(classifyPath));
  const factcheck = JSON.parse(fs.readFileSync(factcheckPath));
  const slug = STATE_NAMES[stateCode];
  const lc = stateCode.toLowerCase();

  // Index classify by name for type lookup
  const typeByName = {};
  for (const p of classify.programs) typeByName[p.name] = p.programType;

  // Index factcheck by programId
  const fcByPid = {};
  for (const p of factcheck.programs) fcByPid[p.programId] = p;

  for (const draft of drafts.programs) {
    const programIdNoState = draft.id; // e.g. "snap-food-benefits"
    const fullPid = `${lc}-${programIdNoState}`;
    const fc = fcByPid[fullPid] || { flags: [] };
    const programType = typeByName[draft.name] || 'benefit';
    const flags = fc.flags || [];
    const sev = severity(flags);
    const totalFlags = flags.length;
    const highFlags = flags.filter(f => f.severity === 'high').length;
    const flaggedFields = flags.length > 0 ? flags.map(summarizeFlag).join('; ') : '';

    const props = {
      'Program': `${stateCode} — ${draft.name}`,
      'Program ID': fullPid,
      'State': stateCode,
      'Program Type': programType,
      'Status': 'Not Started',
      'Reviewer': 'Open',
      'Admin': `https://olera.care/admin/benefits?state=${stateCode}`,
      'Live Page': `https://olera.care/benefits/${slug}/${programIdNoState}`,
      'Total Flags': totalFlags,
      'High-Sev Flags': highFlags,
      'Severity': sev,
    };
    if (draft.sourceUrl) props['Source URL'] = draft.sourceUrl;
    if (flaggedFields) props['Flagged Fields'] = flaggedFields;

    allPages.push({ properties: props });
  }
}

const outPath = path.join(__dirname, '..', 'data', 'pipeline', '_qa-rows.json');
fs.writeFileSync(outPath, JSON.stringify(allPages, null, 2));
console.log(`Wrote ${allPages.length} rows to ${outPath}`);

// State + flag summary
const byState = {};
for (const p of allPages) {
  const s = p.properties.State;
  byState[s] = (byState[s] || 0) + 1;
}
const flagged = allPages.filter(p => p.properties['Total Flags'] > 0);
const highSev = allPages.filter(p => p.properties['High-Sev Flags'] > 0);
console.log(`States: ${Object.keys(byState).length}`);
console.log(`Total programs with flags: ${flagged.length}`);
console.log(`High-severity flags: ${highSev.length}`);
