import {
  TEMPERATURE_CONFIG,
  dotOpacityForStaleness,
  formatAge,
  type ConnectionTemperature,
} from "@/lib/connection-temperature";

export interface ConnectionRowData {
  id: string;
  family: { display_name: string | null };
  provider: { display_name: string | null };
  temperature: ConnectionTemperature;
}

interface Engagement {
  email_clicked: boolean;
  lead_opened: boolean;
  contact_revealed: boolean;
}

/**
 * One line in the intervention queue. Calm + typographic: a warm temperature
 * dot that fades as the connection cools (no red/amber/green heatmap), the
 * whose-turn label + relative age, and "family → provider". `awaiting_family`
 * rows carry the "provider replied, no answer" prompt — the sub-task 2 moment.
 */
export default function ConnectionRow({
  c,
  engagement,
}: {
  c: ConnectionRowData;
  engagement?: Engagement;
}) {
  const cfg = TEMPERATURE_CONFIG[c.temperature.state];
  const opacity = dotOpacityForStaleness(c.temperature.stalenessMs);
  const family = c.family.display_name || "A family";
  const provider = c.provider.display_name || "Unknown provider";
  const isAwaitingFamily = c.temperature.state === "awaiting_family";

  // Most-engaged signal worth surfacing, quietly.
  const engaged =
    engagement?.contact_revealed
      ? "contact shown"
      : engagement?.email_clicked
        ? "clicked"
        : engagement?.lead_opened
          ? "opened"
          : null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-stone-50/60 transition-colors">
      <span
        className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${cfg.dot}`}
        style={{ opacity }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
          <span className="text-xs text-gray-400">
            · {formatAge(c.temperature.stalenessMs)}
          </span>
        </div>
        <div className="mt-0.5 truncate text-sm text-gray-700">
          {family} <span className="text-gray-300">→</span> {provider}
        </div>
        {isAwaitingFamily && (
          <div className="mt-0.5 text-xs text-gray-400">
            ↳ provider replied, no answer · nudge?
          </div>
        )}
      </div>
      {engaged && (
        <span className="mt-[3px] shrink-0 text-[11px] text-gray-400">{engaged}</span>
      )}
    </div>
  );
}
