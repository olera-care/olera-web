/**
 * Generate an .ics calendar file content string.
 * No external library needed — simple VCALENDAR format.
 */
export function generateICS(opts: {
  date: string;       // "2026-02-15" ISO date
  time: string;       // "14:00" 24h format
  timezone: string;   // "America/New_York" IANA
  title: string;
  description?: string;
  durationMinutes?: number;
}): string {
  const { date, time, timezone, title, description, durationMinutes = 30 } = opts;

  // Build a Date in the specified timezone to get UTC equivalent
  const dtStr = `${date}T${time}:00`;
  const start = new Date(new Date(dtStr).toLocaleString("en-US", { timeZone: timezone }));

  // Format as YYYYMMDDTHHMMSS (local time with TZID)
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtLocal = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

  // Use raw date/time strings directly (they're already in the specified timezone)
  const [y, m, d] = date.split("-");
  const [h, min] = time.split(":");
  const startLocal = `${y}${m}${d}T${h}${min}00`;

  // Calculate end time
  const endDate = new Date(`${date}T${time}:00`);
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);
  const endLocal = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}${pad(endDate.getSeconds())}`;

  const uid = `olera-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@olera.care`;
  const now = fmtLocal(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Olera//Care Scheduling//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}Z`,
    `DTSTART;TZID=${timezone}:${startLocal}`,
    `DTEND;TZID=${timezone}:${endLocal}`,
    `SUMMARY:${title}`,
    ...(description ? [`DESCRIPTION:${description.replace(/\n/g, "\\n")}`] : []),
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

/** Trigger .ics file download in the browser */
export function downloadICS(icsContent: string, filename = "olera-call.ics") {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
