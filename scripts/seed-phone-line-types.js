/**
 * Seed phone_line_types from Twilio send history (migration 167).
 *
 * We already know the answer for hundreds of numbers: we texted them and saw
 * what happened. A delivery proves the number takes SMS; error 30003/30005/
 * 30006 proves it doesn't. That is strictly better evidence than a Lookup
 * prediction, and it costs nothing.
 *
 * Run this before relying on the gate so we don't pay to re-learn what the
 * send log already tells us. Numbers with no history stay unknown and get a
 * paid Lookup on their next send.
 *
 *   node scripts/seed-phone-line-types.js --dry
 *   node scripts/seed-phone-line-types.js
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const twilio = require("twilio");

const UNREACHABLE = new Set(["30003", "30005", "30006"]);
const DAYS = 180;

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tw = twilio(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
});

const last10 = (p) => {
  const d = (p || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : null;
};

(async () => {
  const dry = process.argv.includes("--dry");
  console.log(dry ? "=== DRY RUN ===" : "=== APPLYING ===");

  const msgs = await tw.messages.list({
    from: process.env.TWILIO_FROM_NUMBER,
    dateSentAfter: new Date(Date.now() - DAYS * 864e5),
    limit: 5000,
  });
  console.log(`Read ${msgs.length} outbound messages (${DAYS}d)`);

  // A number that EVER delivered is capable, even if other attempts failed —
  // a later failure is usually a transient carrier issue, not the line type.
  const delivered = new Set();
  const failed = new Set();
  for (const m of msgs) {
    const key = last10(m.to);
    if (!key) continue;
    if (m.status === "delivered") delivered.add(key);
    else if (UNREACHABLE.has(String(m.errorCode))) failed.add(key);
  }
  for (const k of delivered) failed.delete(k);

  console.log(`  capable (delivered at least once): ${delivered.size}`);
  console.log(`  incapable (only unreachable errors): ${failed.size}`);

  if (dry) {
    console.log("\nNo writes. Re-run without --dry to apply.");
    return;
  }

  const rows = [
    ...[...delivered].map((k) => ({ phone_last10: k, sms_capable: true, source: "send_history" })),
    ...[...failed].map((k) => ({ phone_last10: k, sms_capable: false, source: "send_history" })),
  ].map((r) => ({ ...r, line_type: null, carrier: null, checked_at: new Date().toISOString() }));

  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await db.from("phone_line_types").upsert(batch, { onConflict: "phone_last10" });
    if (error) {
      console.error("  batch failed:", error.message);
      continue;
    }
    written += batch.length;
  }

  const { count } = await db.from("phone_line_types").select("phone_last10", { count: "exact", head: true });
  console.log(`\nSeeded ${written} rows. Table now holds ${count}.`);
  const { count: blocked } = await db
    .from("phone_line_types")
    .select("phone_last10", { count: "exact", head: true })
    .eq("sms_capable", false);
  console.log(`Numbers we will now skip instead of texting: ${blocked}`);
})().catch((e) => console.error("ERR", e.message));
