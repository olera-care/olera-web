import type { Metadata } from "next";
import { getServiceClient } from "@/lib/admin";
import { validateCityOfferToken } from "@/lib/claim-tokens";
import { CARE_LABEL, PAYMENT_LABEL, RECIPIENT_LABEL, URGENCY_LABEL, formatUSPhone, getCityConfig, hourIn } from "@/lib/city-ads/config";

/**
 * /p/offer/{token} — what a provider sees when they open an offer link.
 *
 * Reads only. The two buttons POST to /api/city-offers/respond. Four states:
 * open (take or pass), taken by this provider (the family's details), taken by
 * someone else or closed, passed (ask the reason if missing). No sign-in: the
 * signed token is the credential, and it only ever unlocks one offer.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "A family's request | Olera", robots: { index: false, follow: false } };

type Params = { token: string };

export default async function OfferPage({ params }: { params: Promise<Params> }) {
  const { token } = await params;
  const v = validateCityOfferToken(token);
  if (!v.valid) return <Shell title="This link is not valid">Ask Olera to resend it: support@olera.care.</Shell>;

  const db = getServiceClient();
  const { data: offer } = await db.from("city_lead_offers").select("*").eq("id", v.offerId).maybeSingle();
  if (!offer) return <Shell title="This request is no longer available">It may have been withdrawn. Nothing to do.</Shell>;

  const [{ data: lead }, { data: provider }] = await Promise.all([
    db.from("city_leads").select("*").eq("id", offer.lead_id).maybeSingle(),
    db.from("business_profiles").select("id, display_name").eq("id", offer.provider_id).maybeSingle(),
  ]);
  if (!lead) return <Shell title="This request is no longer available">Nothing to do.</Shell>;

  const cfg = getCityConfig(lead.slug);
  const city = cfg?.city ?? lead.slug;
  const careLabel = CARE_LABEL[lead.care_type as keyof typeof CARE_LABEL] ?? "care";
  const who = RECIPIENT_LABEL[(lead.care_recipient ?? "other") as keyof typeof RECIPIENT_LABEL];
  const when = lead.urgency ? URGENCY_LABEL[lead.urgency as keyof typeof URGENCY_LABEL] : "";
  const pay = lead.payment_type ? PAYMENT_LABEL[lead.payment_type] : null;
  const callBy = hourIn(cfg?.timeZone ?? "America/New_York") < 17 ? "today" : "by noon tomorrow";
  const providerName = provider?.display_name ?? "your team";

  const summary = (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-[15px] leading-relaxed text-gray-800">
      A family in <b>{city}</b> is looking for <b>{careLabel}</b> for {who}
      {when ? `, ${when}` : ""}
      {pay ? `, ${pay}` : ""}
      {lead.zip ? ` · ZIP ${lead.zip}` : ""}.
    </div>
  );

  // 1. Taken by this provider: the details.
  if (offer.accepted_at && lead.accepted_offer_id === offer.id) {
    return (
      <Shell title={`It is yours. Call ${lead.first_name} ${callBy}.`} eyebrow={`Olera · ${city}`}>
        <div className="rounded-xl border border-primary-200 bg-primary-25 p-4">
          <div className="text-xl font-semibold text-gray-900">{lead.first_name}</div>
          <a className="mt-1 block text-lg font-semibold text-primary-700" href={`tel:${lead.phone}`}>
            {formatUSPhone(lead.phone)}
          </a>
          {lead.email && <div className="mt-1 text-sm text-gray-600">{lead.email}</div>}
          <div className="mt-3 text-[15px] text-gray-800">
            {careLabel} for {who}
            {when ? `, ${when}` : ""}
            {pay ? ` · ${pay}` : ""}
            {lead.zip ? ` · ZIP ${lead.zip}` : ""}
          </div>
          {lead.note && <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-gray-700">“{lead.note}”</p>}
        </div>
        <p className="mt-4 text-sm text-gray-600">
          We told {lead.first_name} to expect your call {callBy}. We will check with them tomorrow, and pass the request to another provider if they have not heard from you.
        </p>
      </Shell>
    );
  }

  // 2. Taken by someone else, or the lead is closed.
  const closed = ["client", "no_fit", "stopped", "unreachable", "redirected"].includes(lead.status);
  if ((lead.accepted_offer_id && lead.accepted_offer_id !== offer.id) || closed) {
    return (
      <Shell title="This one was already taken" eyebrow={`Olera · ${city}`}>
        {summary}
        <p className="mt-4 text-sm text-gray-600">Another provider took it first, or the family&rsquo;s request has closed. The next offer will come the same way.</p>
      </Shell>
    );
  }

  // 3. Passed: ask the reason once.
  if (offer.declined_at) {
    return (
      <Shell title="You passed on this one" eyebrow={`Olera · ${city}`}>
        {summary}
        {!offer.decline_reason && (
          <form method="post" action="/api/city-offers/respond" className="mt-4">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="reason" />
            <p className="mb-2 text-sm text-gray-700">One thing that helps us send you better ones. Why?</p>
            <div className="flex flex-wrap gap-2">
              {[
                ["capacity", "No capacity right now"],
                ["area", "Outside our area"],
                ["payment", "Payment type"],
                ["medical", "Needs medical care"],
                ["other", "Something else"],
              ].map(([v2, label]) => (
                <button key={v2} name="reason" value={v2} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:border-primary-400">
                  {label}
                </button>
              ))}
            </div>
          </form>
        )}
        {offer.decline_reason && <p className="mt-4 text-sm text-gray-600">Noted, thank you. The next offer will come the same way.</p>}
      </Shell>
    );
  }

  // 4. Open. Take or pass. A late click may still win; the claim decides.
  const late = new Date(offer.expires_at) < new Date();
  return (
    <Shell title={`A family in ${city} needs ${careLabel}`} eyebrow={`Olera · offered to ${providerName}`}>
      {summary}
      <p className="mt-3 text-sm text-gray-600">
        {late
          ? "Your 30 minutes have passed, but if nobody else has taken it yet, you still can."
          : "You have 30 minutes before we offer it to the next provider. Take it and their name and number appear here; you call them today."}
      </p>
      <form method="post" action="/api/city-offers/respond" className="mt-5 grid gap-2">
        <input type="hidden" name="token" value={token} />
        <button name="action" value="take" className="block w-full rounded-xl bg-primary-700 px-4 py-3.5 text-center text-base font-semibold text-white hover:bg-primary-600">
          Take this family
        </button>
        <button name="action" value="pass" className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-[15px] font-medium text-gray-700 hover:bg-gray-50">
          Pass, offer it to the next provider
        </button>
      </form>
      <p className="mt-4 text-xs text-gray-500">Free during the pilot. Olera does not sell this request. Questions: support@olera.care.</p>
    </Shell>
  );
}

function Shell({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-vanilla-50 text-gray-900">
      <div className="mx-auto max-w-md px-5 pb-16 pt-6 sm:max-w-lg">
        <div className="text-sm font-semibold tracking-wide text-primary-700">Olera</div>
        {eyebrow && <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-[1.75rem] leading-[1.15] text-gray-900">{title}</h1>
        <div className="mt-5 text-[15px] text-gray-700">{children}</div>
      </div>
    </div>
  );
}
