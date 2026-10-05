/**
 * Timezone utilities for MedJobs interview scheduling.
 *
 * Students set availability in plain times ("9:00 AM") with no timezone context.
 * These times should be interpreted in the student's university timezone.
 * This module provides the mapping from student → university → timezone.
 *
 * Default fallback: America/Chicago (Central Time) for backwards compatibility.
 */

import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";

export const DEFAULT_TIMEZONE = "America/Chicago";

/**
 * Get timezone by university slug (e.g., "ut-austin" → "America/Chicago").
 */
export function getTimezoneBySlug(slug: string): string {
  const uni = PARTNER_UNIVERSITIES.find((u) => u.slug === slug);
  return uni?.timezone ?? DEFAULT_TIMEZONE;
}

/**
 * Get timezone by university name (case-insensitive exact match).
 * Used when we have the university name from medjobs_universities but need
 * the timezone from PARTNER_UNIVERSITIES.
 */
export function getTimezoneByName(name: string): string {
  const lower = name.toLowerCase();
  const uni = PARTNER_UNIVERSITIES.find((u) => u.name.toLowerCase() === lower);
  return uni?.timezone ?? DEFAULT_TIMEZONE;
}

/**
 * Student metadata shape (partial, just what we need for timezone lookup).
 */
interface StudentMetadata {
  university_id?: string;
  university?: string; // Some profiles store the name directly
  campus?: string;     // Campus slug from magic link
}

/**
 * Get timezone from student metadata.
 *
 * Tries multiple fields in order:
 * 1. metadata.campus (slug from magic link) → PARTNER_UNIVERSITIES lookup
 * 2. metadata.university (name) → PARTNER_UNIVERSITIES lookup by name
 * 3. Falls back to DEFAULT_TIMEZONE
 *
 * Note: metadata.university_id is a UUID referencing medjobs_universities,
 * which requires a DB lookup. Use getStudentTimezoneWithDb for that case.
 */
export function getStudentTimezone(metadata: StudentMetadata | null | undefined): string {
  if (!metadata) return DEFAULT_TIMEZONE;

  // 1. Try campus slug (from magic link)
  if (metadata.campus) {
    const uni = PARTNER_UNIVERSITIES.find((u) => u.slug === metadata.campus);
    if (uni) return uni.timezone;
  }

  // 2. Try university name
  if (metadata.university) {
    return getTimezoneByName(metadata.university);
  }

  return DEFAULT_TIMEZONE;
}

/**
 * Format a Date or ISO string in a specific timezone for display.
 * Returns a human-readable string like "Monday, October 7 at 2:00 PM CT".
 */
export function formatTimeInTimezone(
  date: Date | string,
  timezone: string,
  options?: {
    includeDate?: boolean;
    includeTimezone?: boolean;
  },
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const { includeDate = true, includeTimezone = true } = options ?? {};

  const parts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  };

  if (includeDate) {
    parts.weekday = "long";
    parts.month = "long";
    parts.day = "numeric";
  }

  if (includeTimezone) {
    parts.timeZoneName = "short";
  }

  return d.toLocaleString("en-US", parts);
}

/**
 * Get the short timezone abbreviation (e.g., "CT", "ET", "MT", "PT").
 */
export function getTimezoneAbbreviation(timezone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  }).formatToParts(now);
  const tzPart = parts.find((p) => p.type === "timeZoneName");
  return tzPart?.value ?? timezone;
}

/**
 * Get a user-friendly timezone label (e.g., "Central Time (CT)").
 */
export function getTimezoneLabel(timezone: string): string {
  const abbr = getTimezoneAbbreviation(timezone);

  // Map common IANA zones to friendly names
  const friendlyNames: Record<string, string> = {
    "America/New_York": "Eastern Time",
    "America/Chicago": "Central Time",
    "America/Denver": "Mountain Time",
    "America/Phoenix": "Arizona Time",
    "America/Los_Angeles": "Pacific Time",
    "America/Detroit": "Eastern Time",
    "America/Indiana/Indianapolis": "Eastern Time",
  };

  const friendly = friendlyNames[timezone];
  if (friendly) {
    return `${friendly} (${abbr})`;
  }

  return `${timezone} (${abbr})`;
}
