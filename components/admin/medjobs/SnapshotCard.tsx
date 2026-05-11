"use client";

/**
 * SnapshotCard — zone-3 of the unified drawer skeleton.
 *
 * Provider variant (this commit): directory mirror — name, email,
 * phone, address, website, ✓/– coverage, + Add inline writes to the
 * mirrored primary contact, 🔗 link to the live provider page,
 * editable research notes textarea (on-blur persist).
 *
 * Collapse rule per the architecture spec:
 *   - stage = prospect     → prominent (admin is filling gaps before launch)
 *   - any other stage      → caller decides whether to mount it.
 *     Common pattern: post-launch drawers mount the Snapshot inside
 *     a More Details collapse so it stays reachable but doesn't
 *     dominate the operational surface.
 *
 * Partner variant: the existing ResearchSection / ResearchModePanel
 * already serves the equivalent operational role (research-checklist
 * style snapshot). Migrating Partner to this component is deferred —
 * its UX is stakeholder-type-aware in ways the Provider snapshot is
 * not, and rewriting it without operational gain creates risk.
 *
 * v9 architecture: drift prevention is structural — one canonical
 * stage pill, one launch path, one timeline renderer, and now one
 * Snapshot component family. Partner variant lands when there's a
 * concrete simplification to pull from its existing surface.
 */

import { useEffect, useMemo, useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

interface Props {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
}

export function ProviderSnapshotCard({ ctx, action, setError }: Props) {
  const { outreach, provider_business_profile: bp } = ctx;
  const primaryContact = useMemo(
    () => ctx.contacts.find((c) => c.is_primary && c.status === "active"),
    [ctx.contacts],
  );

  // Email + phone source: mirrored contact wins (it's what the cadence
  // pipeline reads); business_profile fallback for legacy rows.
  const initialEmail = primaryContact?.email ?? bp?.contact_email ?? "";
  const initialPhone = primaryContact?.phone ?? bp?.phone ?? "";
  const [email, setEmail] = useState<string>(initialEmail);
  const [phone, setPhone] = useState<string>(initialPhone);
  const [notes, setNotes] = useState<string>(outreach.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    setEmail(primaryContact?.email ?? bp?.contact_email ?? "");
    setPhone(primaryContact?.phone ?? bp?.phone ?? "");
    setNotes(outreach.notes ?? "");
  }, [
    outreach.id,
    primaryContact?.email,
    primaryContact?.phone,
    bp?.contact_email,
    bp?.phone,
    outreach.notes,
  ]);

  const orgName = bp?.display_name || outreach.organization_name;
  const address = bp?.address || null;
  const cityState = [bp?.city, bp?.state].filter(Boolean).join(", ") || null;
  const website = bp?.website || null;
  const slug = bp?.slug || null;
  const livePagePath = slug ? `/provider/${slug}` : null;
  const isPreLaunch =
    outreach.status === "prospect" || outreach.status === "researched";

  const saveContactField = async (
    fieldEmail: string,
    fieldPhone: string,
  ): Promise<void> => {
    const trimmedEmail = fieldEmail.trim();
    const trimmedPhone = fieldPhone.trim();
    const wasEmail = primaryContact?.email ?? bp?.contact_email ?? "";
    const wasPhone = primaryContact?.phone ?? bp?.phone ?? "";
    if (trimmedEmail === wasEmail && trimmedPhone === wasPhone) return;
    setSavingContact(true);
    setError(null);
    try {
      if (primaryContact) {
        await action("update_contact", {
          contact_id: primaryContact.id,
          email: trimmedEmail || null,
          phone: trimmedPhone || null,
        });
      } else if (trimmedEmail || trimmedPhone) {
        await action("add_contact", {
          name: orgName,
          email: trimmedEmail || null,
          phone: trimmedPhone || null,
          is_primary: true,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save contact");
    } finally {
      setSavingContact(false);
    }
  };

  const saveNotes = async () => {
    if (notes === (outreach.notes ?? "")) return;
    setSavingNotes(true);
    setError(null);
    try {
      await action("update_outreach", { notes });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Provider Profile
          </p>
          <h3 className="mt-0.5 truncate text-base font-semibold text-gray-900">
            {orgName}
          </h3>
        </div>
        {livePagePath && (
          <a
            href={livePagePath}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-medium text-emerald-700 hover:underline"
          >
            🔗 Open live page →
          </a>
        )}
      </header>

      <dl className="grid grid-cols-[16px_72px_1fr] gap-x-3 gap-y-2 text-sm">
        <CoverageRow
          checked={Boolean(email)}
          label="Email"
          editable={isPreLaunch}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => saveContactField(email, phone)}
            placeholder="hiring@example.com"
            disabled={!isPreLaunch}
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
          />
        </CoverageRow>
        <CoverageRow
          checked={Boolean(phone)}
          label="Phone"
          editable={isPreLaunch}
        >
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => saveContactField(email, phone)}
            placeholder="(555) 123-4567"
            disabled={!isPreLaunch}
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
          />
        </CoverageRow>
        <CoverageRow checked={Boolean(address || cityState)} label="Address">
          <span className="block truncate text-gray-700">
            {[address, cityState].filter(Boolean).join(" · ") || (
              <span className="text-gray-400">Not on file</span>
            )}
          </span>
        </CoverageRow>
        <CoverageRow checked={Boolean(website)} label="Website">
          {website ? (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-emerald-700 hover:underline"
            >
              {website}
            </a>
          ) : (
            <span className="text-gray-400">Not on file</span>
          )}
        </CoverageRow>
        <CoverageRow checked={false} label="Fax">
          <span className="text-gray-400">Coming soon</span>
        </CoverageRow>
      </dl>

      {(savingContact || !email) && isPreLaunch && (
        <p className="text-[11px] text-gray-500">
          {savingContact
            ? "Saving…"
            : !email
              ? "⚠ Email is required to launch outreach."
              : "Saved on blur — edits update the primary contact."}
        </p>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Research notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Service lines, hiring contact, recent activity, fit notes."
          rows={3}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
        />
        <p className="mt-0.5 text-[11px] text-gray-400">
          {savingNotes ? "Saving…" : "Saved on blur"}
        </p>
      </div>
    </section>
  );
}

function CoverageRow({
  checked,
  label,
  editable: _editable,
  children,
}: {
  checked: boolean;
  label: string;
  editable?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <span
        aria-hidden
        className={`pt-1.5 ${checked ? "text-emerald-600" : "text-gray-300"}`}
      >
        {checked ? "✓" : "—"}
      </span>
      <span className="pt-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </>
  );
}
