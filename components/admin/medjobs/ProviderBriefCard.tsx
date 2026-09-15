"use client";

/**
 * ProviderBriefCard — the first thing in a provider prospect drawer.
 *
 * Mirrors the Tasks drawer's orienting block (What this is / Why /
 * Steps, see activation/TaskDetail.tsx) so both surfaces read the same
 * way, then puts the call script and the Log call button right where
 * the operator's eye already is. The script used to live inside the
 * outcome modal, which meant you had to open the modal to read the
 * thing you needed before dialling.
 *
 * Log call opens the same PreFlightCallModal the old "Call to Confirm"
 * button opened — same outcomes, same dispatch. The modal no longer
 * repeats the script, because it is on this card.
 */

import { useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";
import { CallScriptBlock } from "@/components/admin/medjobs/CallScriptBlock";
import { PreFlightCallModal } from "@/components/admin/medjobs/PreFlightCallModal";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

/** The confirm-call script. Kept here because this card now owns it. */
export function preFlightScript(campusName?: string | null): string {
  const campus = campusName?.trim() || "campus";
  return `"Hi, this is [your name] from Dr. DuBose's office, calling about his Student Caregiver Program for ${campus} students. I'd like to send your team an email with the details, and wanted to check first on the best address to send it to."`;
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}

const STEPS = [
  "Read the script below, then call the provider's main line.",
  "Confirm the best email address and who the decision maker is.",
  "Log the outcome here — that unlocks the outreach email.",
];

export function ProviderBriefCard({
  ctx,
  action,
  setError,
  onOverrideLaunch,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
  onOverrideLaunch?: () => Promise<void> | void;
}) {
  const [showCall, setShowCall] = useState(false);

  const gc = ctx.outreach.research_data?.general_contact ?? {};
  const phone = gc.phone ?? ctx.provider_business_profile?.phone ?? null;
  const campusName = ctx.campus?.name ?? null;
  const script = preFlightScript(campusName);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="space-y-3">
        <Block
          label="What this is"
          text="A confirmation call before any email goes out — you are checking that you have the right address and the right person."
        />
        <Block
          label="Why"
          text="Cold email to a general inbox rarely reaches the owner. One short call gets you a named contact and a live address, so the email lands."
        />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Steps
          </p>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            {STEPS.map((s) => (
              <li key={s} className="text-[13px] text-gray-700">
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-4">
        <CallScriptBlock label="Call script" script={script} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowCall(true)}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
          title="Log what happened on the confirmation call."
        >
          📞 Log call
        </button>
        {phone ? (
          <a
            href={`tel:${String(phone).replace(/[^\d+]/g, "")}`}
            className="text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
          >
            {String(phone)}
          </a>
        ) : (
          <span className="text-xs text-gray-400">No main number on file</span>
        )}
      </div>

      {showCall && (
        <PreFlightCallModal
          organizationName={ctx.outreach.organization_name}
          phone={phone ? String(phone) : null}
          action={action}
          onCancel={() => setShowCall(false)}
          onDone={() => setShowCall(false)}
          setError={setError}
          onOverrideLaunch={onOverrideLaunch}
        />
      )}
    </section>
  );
}
