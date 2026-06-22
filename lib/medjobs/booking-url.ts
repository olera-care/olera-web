import type { DrawerContext } from "@/lib/student-outreach/types";
import { CALENDLY_URL } from "@/lib/student-outreach/templates";

/**
 * This provider's Calendly link, tagged with the outreach id (so a booking
 * files back to this row) and prefilled with the best contact name/email.
 * Shared by the call-follow-up modal ("Meeting booked") and BookMeetingLink.
 */
export function bookingUrlFor(ctx: DrawerContext): string {
  const dm = ctx.outreach.research_data?.decision_maker;
  const gc = ctx.outreach.research_data?.general_contact;
  const primary =
    ctx.contacts.find((c) => c.is_primary && c.status === "active") ??
    ctx.contacts.find((c) => c.status === "active") ??
    null;
  const email =
    (dm && !dm.unavailable && dm.email ? dm.email : null) ??
    primary?.email ??
    gc?.email ??
    null;
  const name = primary
    ? [primary.first_name, primary.last_name].filter(Boolean).join(" ").trim() ||
      primary.name
    : dm?.name ?? null;
  const params = new URLSearchParams();
  params.set("utm_content", ctx.outreach.id);
  if (name) params.set("name", name);
  if (email) params.set("email", email);
  return `${CALENDLY_URL}?${params.toString()}`;
}
