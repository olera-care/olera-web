"use client";

/**
 * PartnerPreFlightPanel — partner-specific pre-flight surface (Chunk 1.4, full).
 *
 * Rendered in the drawer for stakeholder rows (providers never see it), additive
 * to the existing SnapshotCard so the 2,439-line provider component stays
 * untouched. Surfaces what partners need that providers don't:
 *   - AI research sources (source/profile URLs) for verification (R4/S7)
 *   - student-org contact list with the faculty advisor starred (R6/S11)
 *   - professor outreach lock until the dept head grants permission (S8)
 *
 * The phone-conditional launch (R5) is handled in ProviderProspectDrawerBody's
 * gating (partners launch on email alone); this panel just reflects it.
 */

import { useEffect, useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";

interface SiteSource {
  title: string;
  url: string;
}

interface Officer {
  name?: string | null;
  role?: string | null;
  email?: string | null;
  source_url?: string | null;
}

export function PartnerPreFlightPanel({ ctx }: { ctx: DrawerContext }) {
  const kind = ctx.outreach.kind;
  if (!kind || kind === "provider") return null;

  const rd = (ctx.outreach.research_data ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const sourceUrl = str(rd.source_url);
  const profileUrl = str(rd.profile_url);
  const aiSourced = rd.ai_sourced === true;
  const website = str(rd.website);
  const directory = str(rd.directory_url);
  const officers = (Array.isArray(rd.officers) ? rd.officers : []) as Officer[];
  const advisor = (rd.faculty_advisor && typeof rd.faculty_advisor === "object"
    ? rd.faculty_advisor
    : null) as Officer | null;
  const socials = (Array.isArray(rd.socials) ? rd.socials : []) as { platform?: string; url?: string }[];

  const isOrg = kind === "student_org";
  const isProfessor = kind === "professor";

  // All the AI source links found for this Site (every subtype), so the admin
  // can check any page while filling in research — not just this prospect's
  // source. Persisted on the Site in partner_research.sources (Chunk 1.3).
  const [siteSources, setSiteSources] = useState<SiteSource[]>([]);
  const campusSlug = ctx.campus?.slug ?? null;
  useEffect(() => {
    if (!campusSlug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/medjobs/source-partners?campus_slug=${encodeURIComponent(campusSlug)}`);
        if (!res.ok) return;
        const d = await res.json();
        const byType = (d.partner_research?.sources ?? {}) as Record<string, SiteSource[]>;
        const seen = new Set<string>();
        const flat: SiteSource[] = [];
        for (const list of Object.values(byType)) {
          for (const s of list ?? []) {
            if (s?.url && !seen.has(s.url)) {
              seen.add(s.url);
              flat.push({ title: s.title ?? s.url, url: s.url });
            }
          }
        }
        if (!cancelled) setSiteSources(flat);
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campusSlug]);

  const gcPhone = str((rd.general_contact as Record<string, unknown> | undefined)?.phone);

  // Professor lock: blocked until the gating dept head is an active partner.
  const dep = ctx.permission_dependency;
  const professorLocked = isProfessor && dep != null && dep.status !== "active_partner";

  const linkCls = "text-xs text-primary-600 hover:underline";

  return (
    <section className="rounded-lg border border-primary-100 bg-primary-50/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
        Partner pre-flight
      </p>

      {professorLocked && (
        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          🔒 Outreach blocked — waiting on{" "}
          <span className="font-medium">{dep?.organization_name ?? "the department"}</span>{" "}
          to grant permission to contact professors.
        </div>
      )}

      {/* Launch readiness note (R5): partners can launch on email alone. */}
      <p className="mt-2 text-xs text-gray-600">
        {gcPhone ? "Phone on file — a confirm call is recommended." : "No phone on file — email-only outreach is fine."}
      </p>

      {/* AI research sources (verify before launch). */}
      {(aiSourced || sourceUrl || profileUrl) && (
        <div className="mt-3">
          <p className="text-[11px] font-medium text-gray-700">
            Research sources {aiSourced ? "(AI-sourced — verify)" : ""}
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>source ↗</a>}
            {profileUrl && <a href={profileUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>profile ↗</a>}
            {website && <a href={website} target="_blank" rel="noopener noreferrer" className={linkCls}>website ↗</a>}
            {directory && <a href={directory} target="_blank" rel="noopener noreferrer" className={linkCls}>directory ↗</a>}
          </div>
        </div>
      )}

      {/* Student-org contact list — faculty advisor starred (continuity). */}
      {isOrg && (advisor || officers.length > 0 || socials.length > 0) && (
        <div className="mt-3">
          <p className="text-[11px] font-medium text-gray-700">Organization contacts</p>
          <ul className="mt-1 space-y-0.5 text-xs text-gray-700">
            {advisor && (advisor.name || advisor.email) && (
              <li>
                ★ <span className="font-medium">Faculty Advisor</span>{" "}
                {advisor.name ?? ""} {advisor.email ? `· ${advisor.email}` : ""}{" "}
                <span className="text-gray-400">(year-to-year continuity)</span>
              </li>
            )}
            {officers.map((o, i) =>
              o.name || o.email ? (
                <li key={i}>
                  {o.role ? `${o.role}: ` : ""}
                  {o.name ?? ""} {o.email ? `· ${o.email}` : ""}
                </li>
              ) : null,
            )}
          </ul>
          {socials.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-3">
              {socials.map((s, i) =>
                s.url ? (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className={linkCls}>
                    {s.platform ?? "social"} ↗
                  </a>
                ) : null,
              )}
            </div>
          )}
        </div>
      )}

      {/* All source links found for this Site — handy for checking pages while
          filling in research (e.g. confirming the general inbox on an advising
          page). */}
      {siteSources.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] font-medium text-gray-700">
            Site research sources ({siteSources.length}) — check while researching
          </summary>
          <ul className="mt-1 space-y-0.5">
            {siteSources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  {s.title} ↗
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
