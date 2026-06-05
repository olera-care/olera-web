/**
 * mint-welcome-link — dev helper to produce a ready-to-click MedJobs
 * magic-link URL pointed at ANY host (e.g. a Vercel branch preview).
 *
 * The token is host-independent: it signs (outreach_id, email, jti) with
 * MEDJOBS_MAGIC_LINK_SECRET and is valid on any deployment that shares the
 * same secret. So you can test the branch-preview build without sending a
 * new outreach email — just mint a token aimed at the preview host.
 *
 * Usage:
 *   MEDJOBS_MAGIC_LINK_SECRET=... \
 *   npx tsx scripts/mint-welcome-link.ts <outreach_id> <recipient_email> <host>
 *
 * Example:
 *   npx tsx scripts/mint-welcome-link.ts \
 *     11111111-2222-3333-4444-555555555555 owner@agency.com \
 *     https://olera-web-git-claude-keen-mendel.vercel.app
 *
 * Notes:
 *   - <host> is optional; defaults to NEXT_PUBLIC_SITE_URL. Pass the PREVIEW
 *     host to test the branch build.
 *   - The PREVIEW must have MEDJOBS_MAGIC_LINK_SECRET set to the SAME value
 *     used here, or verification fails (expired/invalid page).
 *   - <outreach_id> must be a real student_outreach row (kind=provider) and
 *     <recipient_email> should match a contact on it (the email is what the
 *     link authenticates as).
 */

import { buildWelcomeUrl } from "../lib/medjobs/welcome-token";

const [outreachId, email, host] = process.argv.slice(2);
const secret = process.env.MEDJOBS_MAGIC_LINK_SECRET;

if (!outreachId || !email) {
  console.error(
    "Usage: npx tsx scripts/mint-welcome-link.ts <outreach_id> <email> [host]",
  );
  process.exit(1);
}
if (!secret) {
  console.error("MEDJOBS_MAGIC_LINK_SECRET is not set in the environment.");
  process.exit(1);
}

const url = buildWelcomeUrl(
  {
    outreach_id: outreachId,
    email,
    site_url: host || process.env.NEXT_PUBLIC_SITE_URL,
  },
  secret,
);

console.log(url);
