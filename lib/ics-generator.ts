/**
 * Generate an .ics (iCalendar) file for interview scheduling.
 * Attached to confirmation emails for both parties.
 */

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatICSDate(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

export function generateICS({
  title,
  description,
  location,
  startTime,
  durationMinutes = 30,
  organizerEmail,
  attendeeEmail,
}: {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  durationMinutes?: number;
  organizerEmail?: string;
  attendeeEmail?: string;
}): string {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  const uid = `medjobs-${Date.now()}-${Math.random().toString(36).slice(2)}@olera.care`;
  const now = new Date();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Olera//MedJobs//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startTime)}`,
    `DTEND:${formatICSDate(endTime)}`,
    `SUMMARY:${title}`,
  ];

  if (description) {
    // ICS requires line folding for long descriptions
    const escaped = description.replace(/\n/g, "\\n").replace(/,/g, "\\,");
    lines.push(`DESCRIPTION:${escaped}`);
  }

  if (location) {
    lines.push(`LOCATION:${location.replace(/,/g, "\\,")}`);
  }

  if (organizerEmail) {
    lines.push(`ORGANIZER;CN=Olera MedJobs:mailto:${organizerEmail}`);
  }

  if (attendeeEmail) {
    lines.push(`ATTENDEE;RSVP=TRUE:mailto:${attendeeEmail}`);
  }

  lines.push(
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.join("\r\n");
}
