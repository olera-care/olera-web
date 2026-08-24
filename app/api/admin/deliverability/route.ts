import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/deliverability
 *
 * The provider-level half of the deliverability system. /admin/automations
 * answers "are we about to be suspended"; this answers "who is dark right now,
 * and what do I do about them".
 *
 * The unit is the PROVIDER, not the send. A hundred-odd failed sends collapse
 * into a few dozen providers, and every remedy is per-provider — a send-level
 * log makes an operator re-derive that grouping by eye every time.
 *
 * Rows are ranked by what the silence COSTS, not by date. A bounced nudge and a
 * dead paid lead are the same row in the raw log; they are not the same problem.
 */
export const maxDuration = 60;

/** Demand a family generated. Losing one of these costs a real conversation. */
const DEMAND_TYPES = [
  "ad_boost_lead_delivered",
  "first_lead_celebration",
  "connection_request",
  "connection_sent",
  "guest_connection",
  "new_message",
  "question_received",
] as const;

/**
 * Ranked worst-first; the highest-priced loss on a provider sets their tier.
 *
 * `first_lead_celebration` is deliberately NOT paid. It fires on a provider's
 * first lead however that lead arrived, so grouping it with ad_boost put 36
 * providers in the "paid campaign" tier when only 2 involved money. That sends
 * an operator to the wrong rows, which is worse than not ranking at all.
 */
const PRIORITY: Array<{ tier: "paid" | "lead" | "question"; types: string[] }> = [
  { tier: "paid", types: ["ad_boost_lead_delivered"] },
  { tier: "lead", types: ["first_lead_celebration", "connection_request", "connection_sent", "guest_connection", "new_message"] },
  { tier: "question", types: ["question_received"] },
];

const WINDOW_DAYS = 45;
const PAGE = 1000;

/**
 * How long a send may sit without a delivery event before we call it lost.
 *
 * Resend's delivered webhook is near-instant but not synchronous, so a send from
 * two minutes ago legitimately has no delivered_at yet. Without this grace the
 * page would list healthy providers as dark purely because it was refreshed
 * mid-send. Suppressed and bounced rows are definitive and skip the wait.
 *
 * Six hours is deliberately generous: in 45 days of production data, zero rows
 * were still missing a delivery event after 24 hours, so nothing real is hidden.
 */
const DELIVERY_GRACE_MS = 6 * 60 * 60 * 1000;

type Cause = "complaint" | "bounce" | "never_delivered";

interface LogRow {
  recipient: string;
  email_type: string;
  status: string | null;
  error_message: string | null;
  created_at: string;
  delivered_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  provider_id: string | null;
}

/**
 * Read every matching row, not the first 10,000.
 *
 * PostgREST caps a single read at 10,000 rows no matter what .limit() asks for.
 * The admin automations route learned this the expensive way: it summed a
 * truncated pull into a denominator and rendered a false OVER LIMIT. Anything
 * that needs completeness has to page.
 */
async function readAll<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await fetchPage(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    out.push(...batch);
    if (batch.length < PAGE) return out;
    // Runaway guard. Well above any real window; a hit means the filter is wrong.
    if (out.length >= 60_000) return out;
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const db = getServiceClient();
  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") || "", 10) || WINDOW_DAYS, 1), 180);
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  try {
    // Every demand notification to a provider in the window. We need the
    // delivered ones too — a provider whose mail lands is not dark, and the
    // per-recipient history is what separates "the mailbox broke" from "this
    // address has never once worked", which have different remedies.
    const rows = await readAll<LogRow>((from, to) =>
      db
        .from("email_log")
        .select("recipient, email_type, status, error_message, created_at, delivered_at, bounced_at, complained_at, provider_id")
        .eq("channel", "email")
        .eq("recipient_type", "provider")
        .in("email_type", DEMAND_TYPES as unknown as string[])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .range(from, to),
    );

    interface Acc {
      recipient: string;
      lost: Record<string, number>;
      lostCount: number;
      delivered: number;
      lastLostAt: string | null;
      providerIds: Set<string>;
    }
    const byRecipient = new Map<string, Acc>();
    for (const r of rows) {
      const key = r.recipient.toLowerCase();
      const acc = byRecipient.get(key) ?? {
        recipient: r.recipient,
        lost: {},
        lostCount: 0,
        delivered: 0,
        lastLostAt: null,
        providerIds: new Set<string>(),
      };
      if (r.provider_id) acc.providerIds.add(r.provider_id);
      // "Lost" is anything that did not reach the inbox: suppressed before send,
      // hard-bounced after, or a send old enough that a missing delivery event
      // means it never landed rather than that the webhook is still in flight.
      const settled = Date.now() - new Date(r.created_at).getTime() > DELIVERY_GRACE_MS;
      const lost = r.status === "failed" || !!r.bounced_at || (!r.delivered_at && settled);
      if (lost) {
        acc.lost[r.email_type] = (acc.lost[r.email_type] ?? 0) + 1;
        acc.lostCount += 1;
        if (!acc.lastLostAt || r.created_at > acc.lastLostAt) acc.lastLostAt = r.created_at;
      } else {
        acc.delivered += 1;
      }
      byRecipient.set(key, acc);
    }

    const dark = [...byRecipient.values()].filter((a) => a.lostCount > 0);
    if (dark.length === 0) {
      return NextResponse.json({ windowDays: days, generatedAt: new Date().toISOString(), counts: { total: 0, paid: 0, connection: 0, question: 0, claimed: 0, neverDelivered: 0 }, providers: [] });
    }

    // All-time history per address decides the CAUSE, and therefore the remedy.
    // Window-scoped history would misread a long-dead address as a fresh bounce.
    const addresses = dark.map((d) => d.recipient);
    const history = new Map<string, { delivered: number; bounced: number; complained: number }>();
    for (let i = 0; i < addresses.length; i += 100) {
      const slice = addresses.slice(i, i + 100);
      const hist = await readAll<{ recipient: string; delivered_at: string | null; bounced_at: string | null; complained_at: string | null }>(
        (from, to) =>
          db
            .from("email_log")
            .select("recipient, delivered_at, bounced_at, complained_at")
            .in("recipient", slice)
            .range(from, to),
      );
      for (const h of hist) {
        const k = h.recipient.toLowerCase();
        const e = history.get(k) ?? { delivered: 0, bounced: 0, complained: 0 };
        if (h.delivered_at) e.delivered += 1;
        if (h.bounced_at) e.bounced += 1;
        if (h.complained_at) e.complained += 1;
        history.set(k, e);
      }
    }

    // Identity + the phone, which is the only other channel we hold. Directory
    // rows fill the gaps: plenty of scraped listings never got a business_profile.
    const profiles = new Map<string, { name: string; city: string | null; state: string | null; phone: string | null; claimed: boolean; slug: string | null }>();
    for (let i = 0; i < addresses.length; i += 100) {
      const slice = addresses.slice(i, i + 100);
      const [bp, dir] = await Promise.all([
        db.from("business_profiles").select("email, display_name, city, state, phone, claim_state, slug").in("email", slice),
        db.from("olera-providers").select("email, provider_name, city, state, phone").in("email", slice),
      ]);
      for (const p of (bp.data ?? []) as Array<{ email: string; display_name: string | null; city: string | null; state: string | null; phone: string | null; claim_state: string | null; slug: string | null }>) {
        const k = (p.email || "").toLowerCase();
        const prev = profiles.get(k);
        // A claimed profile always wins the row — it is the one with a human behind it.
        if (!prev || (p.claim_state === "claimed" && !prev.claimed)) {
          profiles.set(k, {
            name: p.display_name || prev?.name || "(unnamed listing)",
            city: p.city ?? prev?.city ?? null,
            state: p.state ?? prev?.state ?? null,
            phone: (p.phone || "").trim() || prev?.phone || null,
            claimed: p.claim_state === "claimed" || !!prev?.claimed,
            slug: p.slug ?? prev?.slug ?? null,
          });
        }
      }
      for (const d of (dir.data ?? []) as Array<{ email: string; provider_name: string | null; city: string | null; state: string | null; phone: string | null }>) {
        const k = (d.email || "").toLowerCase();
        const prev = profiles.get(k);
        if (!prev) {
          profiles.set(k, { name: d.provider_name || "(unnamed listing)", city: d.city, state: d.state, phone: (d.phone || "").trim() || null, claimed: false, slug: null });
        } else if (!prev.phone && (d.phone || "").trim()) {
          profiles.set(k, { ...prev, phone: (d.phone || "").trim() });
        }
      }
    }

    const providers = dark.map((d) => {
      const key = d.recipient.toLowerCase();
      const h = history.get(key) ?? { delivered: 0, bounced: 0, complained: 0 };
      const p = profiles.get(key);
      const cause: Cause =
        h.complained > 0 && h.bounced === 0 ? "complaint" : h.delivered > 0 ? "bounce" : "never_delivered";
      const tier =
        PRIORITY.find((t) => t.types.some((ty) => d.lost[ty]))?.tier ?? "question";
      return {
        recipient: d.recipient,
        name: p?.name ?? "(no profile)",
        location: p ? [p.city, p.state].filter(Boolean).join(", ") : "",
        phone: p?.phone ?? null,
        slug: p?.slug ?? null,
        claimed: p?.claimed ?? false,
        tier,
        cause,
        lost: d.lost,
        lostCount: d.lostCount,
        lastLostAt: d.lastLostAt,
        everDelivered: h.delivered > 0,
        history: h,
      };
    });

    const rank = { paid: 0, lead: 1, question: 2 } as const;
    providers.sort(
      (a, b) =>
        rank[a.tier] - rank[b.tier] ||
        Number(b.claimed) - Number(a.claimed) ||
        b.lostCount - a.lostCount ||
        (b.lastLostAt ?? "").localeCompare(a.lastLostAt ?? ""),
    );

    return NextResponse.json({
      windowDays: days,
      generatedAt: new Date().toISOString(),
      counts: {
        total: providers.length,
        paid: providers.filter((p) => p.tier === "paid").length,
        lead: providers.filter((p) => p.tier === "lead").length,
        question: providers.filter((p) => p.tier === "question").length,
        claimed: providers.filter((p) => p.claimed).length,
        neverDelivered: providers.filter((p) => p.cause === "never_delivered").length,
        eventsLost: providers.reduce((n, p) => n + p.lostCount, 0),
        withPhone: providers.filter((p) => p.phone).length,
      },
      providers,
    });
  } catch (err) {
    console.error("[admin/deliverability] failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
