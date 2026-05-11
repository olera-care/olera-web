"use client";

/**
 * SnapshotCard — zone-3 of the unified drawer skeleton.
 *
 * Provider variant: the operational record for one provider's
 * outreach. Three sections, top to bottom:
 *
 *   1. Directory snapshot
 *      Read-only mirror of the canonical business_profiles record —
 *      address, public phone, public email, website, fax. Marks
 *      coverage with ✓/–. The 🔗 live-page link opens the public
 *      provider page in a new tab.
 *
 *   2. Outreach Contacts
 *      Multi-contact list. Each row: first/last name, title, role
 *      (Owner / Hiring Manager / General Inbox / etc.), email, phone,
 *      and a status toggle (active ↔ stale). The cadence pipeline
 *      reads every active contact with an email and sends to them —
 *      one contact per email address, multiple addresses per
 *      organization supported natively. Status='stale' excludes a
 *      contact from sends without deleting their history (operational
 *      memory preserved). Tagging a contact General Inbox vs Owner
 *      lets future template logic compose the salutation
 *      contextually (see lib/student-outreach/templates.ts).
 *
 *   3. Research notes
 *      Free-form text for context (source of contact info, agency
 *      character, anything the admin learned). Persists on blur
 *      via update_outreach.
 *
 * Collapse rule per the architecture spec:
 *   - stage = prospect → SnapshotCard mounted prominent (admin is
 *     filling gaps before launch).
 *   - any other stage → caller decides; common pattern is to mount
 *     inside a More Details collapse so it stays reachable but
 *     doesn't dominate the operational surface.
 *
 * Partner variant: ResearchSection / ResearchModePanel already serves
 * the equivalent role for stakeholders (stakeholder-type-aware
 * research checklist). Migration deferred — no concrete simplification
 * to pull from its existing surface.
 */

import { useEffect, useMemo, useState } from "react";
import type { Contact, DrawerContext } from "@/lib/student-outreach/types";
import { OTHER, PROVIDER_CONTACT_ROLES } from "@/lib/student-outreach/presets";

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
  const orgName = bp?.display_name || outreach.organization_name;
  const address = bp?.address || null;
  const cityState = [bp?.city, bp?.state].filter(Boolean).join(", ") || null;
  const website = bp?.website || null;
  const slug = bp?.slug || null;
  const livePagePath = slug ? `/provider/${slug}` : null;
  const isPreLaunch =
    outreach.status === "prospect" || outreach.status === "researched";

  const activeContacts = useMemo(
    () => ctx.contacts.filter((c) => c.status === "active"),
    [ctx.contacts],
  );
  const inactiveContacts = useMemo(
    () => ctx.contacts.filter((c) => c.status !== "active"),
    [ctx.contacts],
  );

  const [notes, setNotes] = useState<string>(outreach.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    setNotes(outreach.notes ?? "");
  }, [outreach.id, outreach.notes]);

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
    <section className="space-y-5 rounded-lg border border-gray-200 bg-white p-4">
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

      {/* ── 1. Directory snapshot (read-only) ─────────────────────── */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Directory
        </p>
        <dl className="grid grid-cols-[16px_88px_1fr] gap-x-3 gap-y-1.5 text-sm">
          <CoverageRow checked={Boolean(address || cityState)} label="Address">
            <span className="block truncate text-gray-700">
              {[address, cityState].filter(Boolean).join(" · ") || (
                <span className="text-gray-400">Not on file</span>
              )}
            </span>
          </CoverageRow>
          <CoverageRow checked={Boolean(bp?.phone)} label="Phone">
            {bp?.phone ? (
              <a
                href={`tel:${bp.phone}`}
                className="block truncate text-emerald-700 hover:underline"
              >
                {bp.phone}
              </a>
            ) : (
              <span className="text-gray-400">Not on file</span>
            )}
          </CoverageRow>
          <CoverageRow checked={Boolean(bp?.email)} label="Email">
            <span className="block truncate text-gray-700">
              {bp?.email || <span className="text-gray-400">Not on file</span>}
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
            <span className="text-gray-400">Not on file · coming soon</span>
          </CoverageRow>
        </dl>
        <p className="mt-1.5 text-[11px] text-gray-400">
          From the directory record. Outreach contacts are managed below.
        </p>
      </div>

      {/* ── 2. Outreach Contacts (multi-contact editor) ──────────── */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Outreach Contacts
          </p>
          <span className="text-[11px] text-gray-400">
            {activeContacts.length} active · {inactiveContacts.length} inactive
          </span>
        </div>

        {ctx.contacts.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-center text-xs text-gray-500">
            No contacts yet. Add at least one with an email to enable outreach.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...activeContacts, ...inactiveContacts].map((c) => (
              <li key={c.id}>
                <ContactRow
                  contact={c}
                  action={action}
                  setError={setError}
                  editable={isPreLaunch}
                />
              </li>
            ))}
          </ul>
        )}

        {isPreLaunch && (
          <AddContactInline
            orgName={orgName}
            action={action}
            setError={setError}
          />
        )}
      </div>

      {/* ── 3. Research notes ─────────────────────────────────────── */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Research notes
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Source of contact info, agency character, hiring activity, anything else worth remembering."
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

// ── ContactRow ──────────────────────────────────────────────────────────

function ContactRow({
  contact,
  action,
  setError,
  editable,
}: {
  contact: Contact;
  action: ActionFn;
  setError: (m: string | null) => void;
  editable: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [firstName, setFirstName] = useState(contact.first_name ?? "");
  const [lastName, setLastName] = useState(contact.last_name ?? "");
  const [title, setTitle] = useState(contact.title ?? "");
  const [role, setRole] = useState<string>(
    contact.role && PROVIDER_CONTACT_ROLES.includes(contact.role)
      ? contact.role
      : contact.role
        ? OTHER
        : "",
  );
  const [roleOther, setRoleOther] = useState(
    contact.role && !PROVIDER_CONTACT_ROLES.includes(contact.role)
      ? contact.role
      : "",
  );
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [saving, setSaving] = useState(false);

  const isActive = contact.status === "active";
  const displayName =
    [contact.title, contact.first_name, contact.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || contact.name;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const resolvedRole =
        role === OTHER ? roleOther.trim() || null : role || null;
      await action("update_contact", {
        contact_id: contact.id,
        first_name: firstName || null,
        last_name: lastName || null,
        title: title || null,
        role: resolvedRole,
        email: email.trim() || null,
        phone: phone.trim() || null,
      });
      setExpanded(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    setError(null);
    try {
      if (isActive) {
        await action("mark_contact_stale", { contact_id: contact.id });
      } else {
        await action("update_contact", {
          contact_id: contact.id,
          status: "active",
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  if (!expanded) {
    return (
      <div
        className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 ${
          isActive
            ? "border-gray-200 bg-white"
            : "border-gray-100 bg-gray-50 text-gray-400"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-gray-900">
              {displayName || "(unnamed)"}
            </span>
            {contact.is_primary && (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                PRIMARY
              </span>
            )}
            {!isActive && (
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-600">
                {contact.status}
              </span>
            )}
          </div>
          {contact.role && (
            <p className="mt-0.5 truncate text-[11px] text-gray-500">
              {contact.role}
            </p>
          )}
          <p className="mt-0.5 truncate text-xs text-gray-600">
            {contact.email || (
              <span className="text-gray-400">No email</span>
            )}
            {contact.phone && (
              <span className="text-gray-400"> · {contact.phone}</span>
            )}
          </p>
        </div>
        {editable && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <button
              onClick={() => setExpanded(true)}
              className="text-[11px] font-medium text-emerald-700 hover:underline"
            >
              Edit
            </button>
            <button
              onClick={toggleStatus}
              title={
                isActive
                  ? "Exclude from outreach sends (preserves history)."
                  : "Reactivate this contact for outreach sends."
              }
              className="text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:underline"
            >
              {isActive ? "Mark inactive" : "Reactivate"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-gray-300 bg-white px-3 py-3">
      <div className="grid grid-cols-2 gap-2">
        <LabeledInput
          label="First name"
          value={firstName}
          onChange={setFirstName}
        />
        <LabeledInput
          label="Last name"
          value={lastName}
          onChange={setLastName}
        />
      </div>
      <LabeledInput
        label="Title (Dr., Mr., etc.)"
        value={title}
        onChange={setTitle}
      />
      <div>
        <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
        >
          <option value="">(no role)</option>
          {PROVIDER_CONTACT_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {role === OTHER && (
          <input
            type="text"
            value={roleOther}
            onChange={(e) => setRoleOther(e.target.value)}
            placeholder="Custom role"
            className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
          />
        )}
      </div>
      <LabeledInput label="Email" value={email} onChange={setEmail} type="email" />
      <LabeledInput label="Phone" value={phone} onChange={setPhone} type="tel" />
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={() => setExpanded(false)}
          className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── AddContactInline ────────────────────────────────────────────────────

function AddContactInline({
  orgName,
  action,
  setError,
}: {
  orgName: string;
  action: ActionFn;
  setError: (m: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [roleOther, setRoleOther] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const resolvedRole =
      role === OTHER ? roleOther.trim() || null : role || null;
    setSaving(true);
    setError(null);
    try {
      const derivedName =
        [firstName, lastName].filter(Boolean).join(" ").trim() ||
        resolvedRole ||
        orgName;
      await action("add_contact", {
        name: derivedName,
        first_name: firstName || null,
        last_name: lastName || null,
        role: resolvedRole,
        email: email.trim() || null,
        phone: phone.trim() || null,
      });
      setFirstName("");
      setLastName("");
      setRole("");
      setRoleOther("");
      setEmail("");
      setPhone("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add contact");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-medium text-emerald-700 hover:underline"
      >
        + Add contact
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border border-emerald-200 bg-emerald-50/30 px-3 py-3">
      <div className="grid grid-cols-2 gap-2">
        <LabeledInput
          label="First name"
          value={firstName}
          onChange={setFirstName}
        />
        <LabeledInput
          label="Last name"
          value={lastName}
          onChange={setLastName}
        />
      </div>
      <div>
        <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
        >
          <option value="">(no role)</option>
          {PROVIDER_CONTACT_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {role === OTHER && (
          <input
            type="text"
            value={roleOther}
            onChange={(e) => setRoleOther(e.target.value)}
            placeholder="Custom role"
            className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
          />
        )}
      </div>
      <LabeledInput label="Email" value={email} onChange={setEmail} type="email" />
      <LabeledInput label="Phone" value={phone} onChange={setPhone} type="tel" />
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={() => setOpen(false)}
          className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add contact"}
        </button>
      </div>
    </div>
  );
}

// ── Small helpers ───────────────────────────────────────────────────────

function CoverageRow({
  checked,
  label,
  children,
}: {
  checked: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <span
        aria-hidden
        className={`pt-0.5 ${checked ? "text-emerald-600" : "text-gray-300"}`}
      >
        {checked ? "✓" : "—"}
      </span>
      <span className="pt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
      />
    </div>
  );
}
