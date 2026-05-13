/**
 * The one place "what does this email's lifecycle look like" is decided —
 * shared by the automation Recipients table and the provider/seeker email
 * timeline so the status vocabulary is identical everywhere in /admin.
 *
 * Progressive: clicked ⊃ opened ⊃ delivered. We show the furthest state
 * reached; the full timeline is in the title tooltip. A pure span — no
 * "use client" needed.
 */

interface Lifecycle {
  status?: string | null;
  sentAt?: string | null;
  delivered_at?: string | null;
  first_opened_at?: string | null;
  first_clicked_at?: string | null;
  bounced_at?: string | null;
  complained_at?: string | null;
}

function resolve(e: Lifecycle): { label: string; dot: string; text: string } {
  if (e.complained_at) return { label: "complained", dot: "bg-red-500", text: "text-red-700" };
  if (e.bounced_at) return { label: "bounced", dot: "bg-red-500", text: "text-red-700" };
  if (e.status === "failed") return { label: "failed", dot: "bg-red-500", text: "text-red-700" };
  if (e.first_clicked_at) return { label: "clicked", dot: "bg-emerald-500", text: "text-emerald-700" };
  if (e.first_opened_at) return { label: "opened", dot: "bg-teal-500", text: "text-teal-700" };
  if (e.delivered_at) return { label: "delivered", dot: "bg-gray-400", text: "text-gray-600" };
  return { label: e.status || "sent", dot: "bg-gray-300", text: "text-gray-500" };
}

function timeline(e: Lifecycle): string {
  const fmt = (iso: string) => new Date(iso).toLocaleString();
  const rows: string[] = [];
  if (e.sentAt) rows.push(`Sent · ${fmt(e.sentAt)}`);
  if (e.delivered_at) rows.push(`Delivered · ${fmt(e.delivered_at)}`);
  if (e.first_opened_at) rows.push(`Opened · ${fmt(e.first_opened_at)}`);
  if (e.first_clicked_at) rows.push(`Clicked · ${fmt(e.first_clicked_at)}`);
  if (e.bounced_at) rows.push(`Bounced · ${fmt(e.bounced_at)}`);
  if (e.complained_at) rows.push(`Complained · ${fmt(e.complained_at)}`);
  return rows.join("\n");
}

export default function EmailStatusPill(props: Lifecycle & { className?: string }) {
  const { className = "", ...e } = props;
  const r = resolve(e);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={timeline(e) || r.label}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.dot}`} />
      <span className={`text-xs ${r.text}`}>{r.label}</span>
    </span>
  );
}
