import type { Metadata } from "next";
import { getServiceClient } from "@/lib/admin";
import { validateCityThreadToken } from "@/lib/claim-tokens";
import { getThreadLead, getFamilyTimeline, threadProvider, firstWordOf, type ThreadEntry } from "@/lib/city-ads/thread.server";
import ThreadReply from "./ThreadReply";

/**
 * /f/thread/{token} — a family reading and answering messages about their
 * care request, from the provider whose ad they answered and from Olera.
 *
 * The text we send carries only this link (see thread.server.ts for the
 * carrier rule), so this page is the conversation. No sign-in: the signed token
 * is the credential and unlocks one family's thread. Messages only; calls,
 * hand-overs and outcomes are team context and never shown here.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your care request | Olera", robots: { index: false, follow: false } };

type Params = { token: string };

export default async function FamilyThreadPage({ params }: { params: Promise<Params> }) {
  const { token } = await params;
  const v = validateCityThreadToken(token);
  if (!v.valid) return <Shell title="This link isn't valid">Ask us to resend it at support@olera.care.</Shell>;

  const db = getServiceClient();
  const lead = await getThreadLead(db, v.leadId);
  if (!lead) return <Shell title="This conversation isn't available">Nothing to do here.</Shell>;
  const provider = await threadProvider(db, lead);
  const providerName = provider?.name ?? "Your care provider";
  const entries = await getFamilyTimeline(db, lead, { audience: "family", providerName });
  const first = firstWordOf(lead.first_name);

  return (
    <Shell title={`Your messages, ${first}`} eyebrow="Your care request">
      <p className="text-gray-600">
        About the help you asked for. {providerName} and the Olera team can both see this conversation.
      </p>
      <ol className="mt-6 space-y-3">
        {entries.map((e, i) => (
          <Bubble key={i} entry={e} providerName={providerName} />
        ))}
      </ol>
      {lead.archived_at ? (
        <p className="mt-6 text-sm text-gray-500">This conversation is closed.</p>
      ) : (
        <ThreadReply token={token} providerName={providerName} />
      )}
    </Shell>
  );
}

function Bubble({ entry: e, providerName }: { entry: ThreadEntry; providerName: string }) {
  const mine = e.author === "family";
  const who = mine ? "You" : e.author === "provider" ? providerName : "Olera";
  const when = new Date(e.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <li className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {who} · {when}
      </span>
      <p
        className={`mt-1 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
          mine ? "bg-primary-600 text-white" : e.author === "provider" ? "bg-white border border-gray-200 text-gray-900" : "bg-gray-100 text-gray-800"
        }`}
      >
        {e.text}
      </p>
    </li>
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
