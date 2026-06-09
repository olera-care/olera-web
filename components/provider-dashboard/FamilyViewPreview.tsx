"use client";

import Image from "next/image";
import type { Profile, StaffInfo } from "@/lib/types";
import type { ExtendedMetadata } from "@/lib/profile-completeness";
import type { SectionId } from "./edit-modals/types";
import CareServicesList from "@/components/providers/CareServicesList";
import ExpandableText from "@/components/providers/ExpandableText";

/**
 * FamilyViewPreview — the in-dashboard "see your page as families do" surface
 * (engagement Phase 2, "sell the output"). Renders a family-framed preview of
 * the provider's own page: real content where present, and an aspirational
 * GHOST where a high-impact section is empty — each ghost a one-tap invite into
 * that section's editor (onEdit → the dashboard's existing edit modals).
 *
 * Deliberately NOT a clone of the public page's server component (which carries
 * SEO/power-page/CTA-router + the reverted mobile-nav 500 traps). It reuses the
 * low-coupling section pieces (CareServicesList, ExpandableText) and mirrors the
 * public page's section styling so it reads as "their page," not the dashboard.
 *
 * MVP scope: identity + gallery + owner story (centerpiece) + about + services.
 * Heavier sections (Q&A A/B, benefits, reviews, pricing/payment) are follow-ups.
 */

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
      />
    </svg>
  );
}

/**
 * Subtle per-section edit affordance. This is the OWNER's preview, so every
 * section is editable — whether it's already filled or still a ghost — not just
 * the empty ones.
 */
function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="-my-1.5 inline-flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-primary-700 active:bg-gray-100 active:text-primary-700"
    >
      <PencilIcon className="h-4 w-4" />
      Edit
    </button>
  );
}

function SectionHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="font-display text-2xl font-bold text-gray-900">{title}</h2>
      <EditLink onClick={onEdit} />
    </div>
  );
}

/** A restrained, inviting empty-state row — an invitation, not a gray skeleton. */
function GhostRow({
  text,
  cta,
  onClick,
}: {
  text: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col items-start gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 px-5 py-4 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/40 active:bg-primary-50/60 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <span className="text-[15px] text-gray-500">{text}</span>
      <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 transition-colors group-hover:bg-primary-100">
        {cta}
        <span aria-hidden>&rarr;</span>
      </span>
    </button>
  );
}

/** Real "Facility manager" card — mirrors the public page's owner card. */
function RealOwner({ staff, claimed }: { staff: StaffInfo; claimed: boolean }) {
  return (
    <div className="flex flex-col items-start gap-6 md:flex-row">
      <div className="w-full rounded-2xl border border-gray-100 px-6 pb-6 pt-8 text-center shadow-md md:w-52 md:flex-shrink-0">
        <div className="relative mx-auto mb-5 h-24 w-24">
          {staff.image ? (
            <Image
              src={staff.image}
              alt={staff.name}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <span className="text-3xl font-bold text-gray-500">{getInitials(staff.name)}</span>
            </div>
          )}
          {claimed && (
            <svg className="absolute bottom-0 right-0 h-6 w-6 text-[#198087]" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <p className="text-base font-bold text-gray-900">{staff.name}</p>
        {staff.position && <p className="mt-0.5 text-sm text-gray-500">{staff.position}</p>}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="mb-2 text-base font-semibold text-gray-900">Care motivation</h3>
        {staff.care_motivation || staff.bio ? (
          <ExpandableText text={staff.care_motivation || staff.bio || ""} maxLength={200} />
        ) : (
          <p className="text-[15px] italic text-gray-400">No care motivation yet.</p>
        )}
      </div>
    </div>
  );
}

/** Ghosted "Facility manager" card — the centerpiece "sell the output" moment. */
function GhostOwner({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col items-start gap-6 md:flex-row">
      <div className="w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 px-6 pb-6 pt-8 text-center md:w-52 md:flex-shrink-0">
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75c-2.7 0-5.2-.6-7.5-1.65z"
            />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-400">Your name</p>
        <p className="mt-0.5 text-sm text-gray-400">Your title</p>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="mb-2 text-base font-semibold text-gray-900">Care motivation</h3>
        <p className="mb-5 text-[15px] leading-relaxed text-gray-500">
          A few sentences about why you do this work. It&rsquo;s the first thing families look for
          when they&rsquo;re deciding who to trust with their parent &mdash; and the difference
          between a listing and a person they want to call.
        </p>
        <button
          onClick={onClick}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-50 px-6 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100 active:scale-[0.98]"
        >
          Add your story
          <span aria-hidden>&rarr;</span>
        </button>
      </div>
    </div>
  );
}

export default function FamilyViewPreview({
  profile,
  meta,
  onEdit,
}: {
  profile: Profile;
  meta: ExtendedMetadata;
  onEdit: (section: SectionId) => void;
}) {
  const staff = meta.staff as StaffInfo | undefined;
  // Guard with Array.isArray, not just ??: these come from untyped JSONB /
  // legacy data and can be present-but-not-an-array, which would throw on
  // .filter/.map. Mirrors the shipped GalleryCard's defensive check.
  const images = (Array.isArray(meta.images) ? meta.images : []).filter(Boolean);
  const careTypes = (Array.isArray(profile.care_types) ? profile.care_types : []).filter(Boolean);
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const heroImage = profile.image_url || images[0] || null;
  const claimed = profile.claim_state === "claimed";

  // Mobile: no card chrome — content goes full-width on the flat page bg,
  // separated by horizontal dividers (Robinhood/Wise mobile). The card
  // (border + rounded + centered narrow column) returns only at sm+.
  return (
    <div className="sm:overflow-hidden sm:rounded-2xl sm:border sm:border-gray-200/80 sm:bg-white">
      <div className="mx-auto max-w-2xl py-5 sm:px-6 sm:py-8">
        {/* Framing: one muted line — no box, no eyeball, no "tap to edit"
            instruction (the per-section Edit pencils make that discoverable). */}
        <p className="mb-5 text-[13px] text-gray-400">
          This is your page as <span className="font-medium text-gray-500">families</span> see it.
        </p>

        {/* Identity — the provider's name is the hero title here, so it must be a
            block-level element with NO flex sibling (it ladders one-word-per-line
            otherwise). The Edit rides the short location line, never the name. */}
        <div className="mb-2 flex items-start gap-3 sm:gap-4">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={profile.display_name}
              width={72}
              height={72}
              className="h-14 w-14 flex-shrink-0 rounded-2xl object-cover sm:h-[72px] sm:w-[72px]"
            />
          ) : (
            <button
              onClick={() => onEdit("overview")}
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-[11px] font-medium text-primary-700 transition-colors hover:bg-primary-50/40 active:bg-primary-50/60 sm:h-[72px] sm:w-[72px] sm:text-xs"
            >
              Add logo
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold leading-tight text-gray-900">{profile.display_name}</h1>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm text-gray-500">{location || "Add your location"}</p>
              <EditLink onClick={() => onEdit("overview")} />
            </div>
          </div>
        </div>

        {/* Photos */}
        <section className="border-t border-gray-200 py-7">
          <SectionHeader title="Photos" onEdit={() => onEdit("gallery")} />
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {images.slice(0, 6).map((src, i) => (
                <Image
                  key={i}
                  src={src}
                  alt=""
                  width={220}
                  height={220}
                  className="aspect-square w-full rounded-lg object-cover"
                  // owner-only preview thumb — skip the optimizer so a fresh
                  // upload doesn't render broken/slow (see GalleryCard)
                  unoptimized
                />
              ))}
            </div>
          ) : (
            <GhostRow
              text="Families look for photos of your space and team."
              cta="Add photos"
              onClick={() => onEdit("gallery")}
            />
          )}
        </section>

        {/* Facility manager — centerpiece */}
        <section className="border-t border-gray-200 py-7">
          <SectionHeader title="Facility manager" onEdit={() => onEdit("owner")} />
          {staff?.name ? <RealOwner staff={staff} claimed={claimed} /> : <GhostOwner onClick={() => onEdit("owner")} />}
        </section>

        {/* About */}
        <section className="border-t border-gray-200 py-7">
          <SectionHeader title="About" onEdit={() => onEdit("about")} />
          {profile.description?.trim() ? (
            <ExpandableText text={profile.description} maxLength={300} />
          ) : (
            <GhostRow
              text="Tell families who you are and how you care."
              cta="Write your story"
              onClick={() => onEdit("about")}
            />
          )}
        </section>

        {/* Care services */}
        <section className="border-t border-gray-200 py-7">
          <SectionHeader title="Care services" onEdit={() => onEdit("services")} />
          {careTypes.length > 0 ? (
            <CareServicesList services={careTypes} initialCount={6} />
          ) : (
            <GhostRow
              text="List the care you provide so families know you fit."
              cta="Add services"
              onClick={() => onEdit("services")}
            />
          )}
        </section>
      </div>
    </div>
  );
}
