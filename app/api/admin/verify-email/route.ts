import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";
import { verifyAndCache, getCachedVerification, getZeroBounceCredits } from "@/lib/email-verification";

/**
 * Admin Email Verifier.
 *
 * GET  — current ZeroBounce credit balance (for the page's "credits left" readout).
 * POST — verify a small batch of addresses on demand. Reuses verifyAndCache, so
 *        cached verdicts (< 90d) return free/instant and only new addresses spend
 *        a credit. Capped + low concurrency to stay under ZeroBounce's rate limit.
 *
 * Both require an admin session.
 */

const MAX_BATCH = 25;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin(): Promise<NextResponse | null> {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const credits = await getZeroBounceCredits();
  return NextResponse.json({ credits });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const raw: unknown = body.emails ?? body.email;
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/[\s,;]+/)
      : [];
  const emails = [...new Set(list.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];

  if (emails.length === 0) {
    return NextResponse.json({ error: "No email addresses provided" }, { status: 400 });
  }
  if (emails.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Too many addresses — max ${MAX_BATCH} at a time` },
      { status: 400 },
    );
  }

  type Verdict = {
    email: string;
    status: string;
    subStatus: string | null;
    checkedAt: string | null;
    fromCache: boolean;
  };
  const results: Verdict[] = [];

  // Low concurrency: small batches verify fast without tripping ZeroBounce's
  // Cloudflare rate limit (which a high-concurrency burst would).
  let idx = 0;
  async function worker() {
    while (idx < emails.length) {
      const email = emails[idx++];
      if (!EMAIL_RE.test(email)) {
        results.push({ email, status: "invalid", subStatus: "malformed_address", checkedAt: null, fromCache: false });
        continue;
      }
      const verdict = await verifyAndCache(email);
      const cached = await getCachedVerification(email);
      results.push({
        email,
        status: verdict.status,
        subStatus: verdict.subStatus,
        checkedAt: cached?.checkedAt ?? null,
        fromCache: verdict.provider === "cache",
      });
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, emails.length) }, worker));

  // Restore input order (concurrent workers finish out of order).
  const order = new Map(emails.map((e, i) => [e, i]));
  results.sort((a, b) => (order.get(a.email) ?? 0) - (order.get(b.email) ?? 0));

  const credits = await getZeroBounceCredits();
  return NextResponse.json({ results, credits });
}
