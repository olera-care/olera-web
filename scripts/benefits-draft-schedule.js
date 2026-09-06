#!/usr/bin/env node
/**
 * Schedule pending navigator drafts for the next civil send slot.
 *
 * The scheduler cron (/api/cron/benefits-navigator-scheduler, hourly at :10)
 * fires any pending draft whose metadata.benefits_navigator.scheduled_at is
 * due, through the same send path as the manual button. This script writes
 * that field the way the admin batch route does (pending only, future, within
 * 30 days, scheduled_by stamped, schedule_failed_* cleared) and adds the two
 * checks the route leaves to fire time:
 *
 *   - the packet gate: a draft whose packet route is `recompose` or `ask` is
 *     skipped, because the cron would refuse it on Tuesday morning, clear the
 *     schedule and ping Slack. Those need a human decision (recompose from the
 *     staging admin, or Send anyway in the drawer), not a schedule.
 *   - capacity: the cron sends at most 20 per run, so the script reports how
 *     many drafts are already due at or before the chosen slot.
 *
 * Default slot: the next business day (Mon-Fri, not a US federal holiday,
 * America/New_York) at 11:00 AM Eastern. Fired at 11:10 ET that is 8:10 AM
 * Pacific, inside every recipient's 8am-8pm text window, so no SMS defers.
 *
 * Usage (from any checkout; node_modules and .env.local are located for you):
 *   node scripts/benefits-draft-schedule.js --patched=2026-09-06            # dry run
 *   node scripts/benefits-draft-schedule.js --patched=2026-09-06 --apply
 *   --ids=4c0be218,eb84bef6   explicit profile-id prefixes instead of --patched
 *   --at=2026-09-08T11:00     override the slot, given as Eastern wall-clock
 *   --by="TJ"                 scheduled_by stamp (default: "TJ (benefits-draft-schedule)")
 */
'use strict';

const { loadEnv, requireDep, argFlag, has, readPending, etWallClockToIso, nextBusinessSlotEt, formatEt } = require('./lib/benefits-draft-db');

loadEnv(argFlag('env'));
const { createClient } = requireDep('@supabase/supabase-js');

const APPLY = has('apply');
const PATCHED = argFlag('patched');
const IDS = (argFlag('ids', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
if (!PATCHED && !IDS.length) {
  console.error('Pass --patched=<YYYY-MM-DD> (drafts stamped factcheck_patched_at that day) or --ids=<prefix,...>.');
  process.exit(1);
}
const AT_ARG = argFlag('at');
const SCHEDULED_AT = AT_ARG ? etWallClockToIso(AT_ARG) : nextBusinessSlotEt(new Date(), 11, 0);
if (!SCHEDULED_AT) { console.error(`Could not parse --at=${AT_ARG}. Use YYYY-MM-DDTHH:MM, Eastern wall-clock.`); process.exit(1); }
const SCHEDULED_BY = argFlag('by', 'TJ (benefits-draft-schedule)');

(async () => {
  const now = Date.now();
  const at = new Date(SCHEDULED_AT).getTime();
  if (at < now - 60_000) throw new Error(`${SCHEDULED_AT} is in the past`);
  if (at > now + 30 * 86400e3) throw new Error(`${SCHEDULED_AT} is more than 30 days out; the letters go stale`);

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const all = await readPending(db);
  const dueBefore = all.filter((r) => { const s = r.metadata.benefits_navigator.scheduled_at; return s && s <= SCHEDULED_AT; }).length;
  console.log(`Slot: ${formatEt(SCHEDULED_AT)} (${SCHEDULED_AT}). Already due at or before it: ${dueBefore}. Cron cap is 20 per run.`);
  if (dueBefore >= 20) console.log('WARNING: that hour is already at the cron cap; some of these will slip to the next run.');

  const rows = all.filter((r) => {
    const nav = r.metadata.benefits_navigator;
    if (IDS.length) return IDS.some((p) => r.id.startsWith(p));
    return (nav.factcheck_patched_at || '').startsWith(PATCHED);
  });
  if (!rows.length) throw new Error('no matching pending drafts');
  if (IDS.length && rows.length !== IDS.length) throw new Error(`--ids named ${IDS.length} drafts, matched ${rows.length}`);

  const skipped = [];
  let scheduled = 0;
  for (const row of rows) {
    const nav = row.metadata.benefits_navigator;
    const tag = `${row.id.slice(0, 8)} ${nav.pick?.stateId}/${nav.pick?.programId}`;
    const route = nav.packet?.route;
    let reason = null;
    if (!nav.body) reason = 'no letter body';
    else if (route === 'recompose' || route === 'ask') reason = `packet says ${route}: ${(nav.packet.holds || [])[0] || 'no hold text'}`;
    else if ((nav.edited_body ?? nav.body).trim().length < 40) reason = 'letter too short';
    else if (nav.scheduled_at) reason = `already scheduled for ${formatEt(nav.scheduled_at)}`;
    if (reason) { skipped.push(`${tag}: ${reason}`); console.log(`skip     ${tag}`); continue; }

    console.log(`SCHEDULE ${tag}`);
    scheduled++;
    if (APPLY) {
      const { data: fresh, error: e1 } = await db.from('business_profiles').select('metadata').eq('id', row.id).single();
      if (e1) throw e1;
      const freshNav = fresh.metadata.benefits_navigator;
      if (freshNav.status !== 'pending') throw new Error(`${tag}: no longer pending`);
      const next = { ...freshNav, scheduled_at: SCHEDULED_AT, scheduled_by: SCHEDULED_BY };
      delete next.schedule_failed_at;
      delete next.schedule_failed_reason;
      const { error: e2 } = await db.from('business_profiles').update({ metadata: { ...fresh.metadata, benefits_navigator: next } }).eq('id', row.id);
      if (e2) throw e2;
      console.log('  WRITTEN');
    }
  }
  console.log(`\n${scheduled} ${APPLY ? 'scheduled' : 'to schedule'} for ${formatEt(SCHEDULED_AT)}, ${skipped.length} skipped${APPLY ? '' : ' [dry run; add --apply]'}`);
  for (const s of skipped) console.log('  - ' + s);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
