/**
 * Recruitment Partner Portal — `/medjobs/partner/[token]` (Chunk 3.1 scaffold).
 *
 * Token-gated: the signed welcome token in the path is the access credential
 * (partners are stakeholder rows with no account/session). We verify it
 * server-side, load the partner row via the service role, and render the portal
 * shell. Self-activation ("Agree & continue") posts the token to
 * /api/medjobs/partner/activate.
 *
 * This is the SCAFFOLD: header + hero (impact "coming soon") + agree/active
 * states + placeholder sections. Chunk 3.2 brings the polished design-system
 * impact cards; 3.3-3.5 fill in flyer sharing, colleagues/events, and help.
 */

import { createClient } from "@supabase/supabase-js";
import { verifyWelcomeToken } from "@/lib/medjobs/welcome-token";
import { PROGRAM_URL } from "@/lib/student-outreach/templates";
import { PartnerPortalActivate } from "@/components/medjobs/PartnerPortalActivate";
import { PartnerFlyerShare } from "@/components/medjobs/PartnerFlyerShare";

export const dynamic = "force-dynamic";

const STAKEHOLDER_KINDS = ["advisor", "student_org", "dept_head", "professor"];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">{children}</main>
  );
}

function Expired({ reason }: { reason: string }) {
  return (
    <Shell>
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="font-display text-2xl text-gray-900">This link {reason}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Please ask the Olera team for a fresh link, or reply to the email you received.
        </p>
      </div>
    </Shell>
  );
}

export default async function PartnerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken);

  const secret = process.env.MEDJOBS_MAGIC_LINK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !supabaseUrl || !serviceKey) return <Expired reason="is unavailable" />;

  const verified = verifyWelcomeToken(token, secret);
  if (!verified.ok) {
    return <Expired reason={verified.reason === "expired" ? "has expired" : "is invalid"} />;
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: rowRaw } = await db
    .from("student_outreach")
    .select("id, organization_name, status, kind, campuses:campus_id ( name )")
    .eq("id", verified.payload.outreach_id)
    .maybeSingle();
  const row = rowRaw as unknown as {
    organization_name: string | null;
    status: string;
    kind: string;
    campuses: { name: string | null } | null;
  } | null;
  if (!row || !STAKEHOLDER_KINDS.includes(row.kind)) return <Expired reason="is invalid" />;

  const orgName = row.organization_name ?? "Partner";
  const university = row.campuses?.name ?? null;
  const isActive = row.status === "active_partner";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://olera.care").replace(/\/+$/, "");

  return (
    <Shell>
      <header className="mb-8">
        <p className="text-sm font-medium text-primary-700">Recruitment Partner</p>
        <h1 className="font-display text-3xl text-gray-900">{orgName}</h1>
        {university && <p className="mt-1 text-sm text-gray-500">{university}</p>}
      </header>

      {/* Hero — impact. Live metrics wire in later (outcomes data source);
          everything shows as "coming soon" for now to signal what we measure. */}
      <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your impact</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["Students applied", "Students hired", "Hours of experience", "Student rating"].map((m) => (
            <div key={m} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-4 text-center">
              <p className="text-lg font-semibold text-gray-400">—</p>
              <p className="mt-1 text-[11px] text-gray-500">{m}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Also coming soon: students accepted to professional school · letters of
          recommendation · references provided · clinical/caregiving hours ·
          outcomes by semester.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          We track student success, not just sign-ups.
        </p>
      </section>

      {!isActive ? (
        <section className="rounded-xl border border-primary-200 bg-primary-50/50 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Help connect {university ?? "your"} students to a paid, mentored healthcare experience
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            <li>• Share our flyer with students</li>
            <li>• Introduce colleagues we should talk to</li>
            <li>• Tell us about campus events</li>
          </ul>
          <p className="mt-3 text-sm text-gray-600">
            You&apos;re not hiring anyone and can stop anytime.
          </p>
          <div className="mt-4">
            <PartnerPortalActivate token={token} />
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-5">
            <p className="text-sm font-semibold text-primary-800">★ You&apos;re an active Recruitment Partner</p>
            <p className="mt-1 text-sm text-gray-600">Thanks for helping! Here&apos;s how you can help share the program:</p>
          </div>

          <PartnerFlyerShare
            university={university}
            applyUrl={`${siteUrl}/medjobs/apply`}
            programUrl={PROGRAM_URL}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { t: "Add a colleague", d: "Suggest who else we should talk to." },
              { t: "Tell us about an event", d: "Career fairs, org meetings, class visits." },
              { t: "Need help?", d: "Message the team or book a call." },
            ].map((c) => (
              <div key={c.t} className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm font-semibold text-gray-900">{c.t}</p>
                <p className="mt-1 text-xs text-gray-500">{c.d}</p>
                <p className="mt-2 text-[11px] text-gray-400">Coming soon</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Why this exists — trust block. */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Why this exists</p>
        <div className="mt-3 flex gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://olera.care/images/for-providers/team/logan.jpg"
            alt="Dr. Logan DuBose"
            width={72}
            height={72}
            className="h-18 w-18 shrink-0 rounded-lg object-cover"
            style={{ height: 72, width: 72 }}
          />
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Dr. Logan DuBose, MD, MBA</p>
            <p className="text-xs text-gray-500">
              NIH-funded researcher · Chief Research Officer, Olera
            </p>
            <p className="mt-2">
              Olera connects pre-health students with paid, mentored caregiving
              experience for local seniors — building the next generation of
              healthcare workers while strengthening care in the community. Your
              help sharing it with students is what makes it reach them.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ — anticipates partner concerns (S27). */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">FAQ</p>
        <div className="mt-2 divide-y divide-gray-100">
          {[
            { q: "What's in it for students?", a: "Paid, mentored caregiving experience, real patient-facing hours, and recommendation letters toward medical, PA, and nursing school." },
            { q: "What does this cost you?", a: "Nothing — you're simply sharing an opportunity with students." },
            { q: "What's the benefit to the community?", a: "More trained, motivated caregivers supporting local seniors." },
            { q: "What's your role / what are you committing to?", a: "Helping share the program with students. That's it — and you can stop anytime." },
            { q: "Are you responsible for hiring or screening?", a: "No. Olera handles all applications, screening, and hiring decisions." },
            { q: "How much effort is expected?", a: "Minutes — share a flyer, and optionally suggest colleagues or campus events." },
          ].map((f) => (
            <details key={f.q} className="py-2">
              <summary className="cursor-pointer text-sm font-medium text-gray-800">{f.q}</summary>
              <p className="mt-1 text-sm text-gray-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </Shell>
  );
}
