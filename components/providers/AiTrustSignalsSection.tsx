"use client";

import type { AiTrustSignals } from "@/lib/types";

interface AiTrustSignalsSectionProps {
  signals: AiTrustSignals;
}

const SIGNAL_LABELS: Record<string, { label: string; icon: string }> = {
  state_licensed: { label: "State Licensed", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  accredited: { label: "Accredited", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
  bbb_rated: { label: "BBB Rated", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
  years_in_operation: { label: "Established", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
  regulatory_actions: { label: "Clean Record", icon: "M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" },
};

export default function AiTrustSignalsSection({ signals }: AiTrustSignalsSectionProps) {
  const confirmed = signals.signals.filter((s) => s.status === "confirmed");
  if (confirmed.length === 0) return null;

  return (
    <section id="trust-signals" className="scroll-mt-24">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6">
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          <h2 className="font-serif text-xl font-bold text-gray-900">
            Verified Credentials
          </h2>
        </div>

        <div className="space-y-3">
          {confirmed.map((signal) => {
            const config = SIGNAL_LABELS[signal.signal];
            if (!config) return null;

            // For regulatory_actions, "confirmed" means violations found — show differently
            const isNegative = signal.signal === "regulatory_actions";

            return (
              <div
                key={signal.signal}
                className={`flex items-start gap-3 rounded-lg px-3 py-2 ${
                  isNegative ? "bg-amber-50" : "bg-white"
                }`}
              >
                <svg
                  className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                    isNegative ? "text-amber-500" : "text-emerald-500"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isNegative ? "text-amber-800" : "text-gray-900"}`}>
                    {isNegative ? "Regulatory Actions Noted" : config.label}
                  </p>
                  {signal.detail && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{signal.detail}</p>
                  )}
                </div>
                {signal.source_url && (
                  <a
                    href={signal.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-xs text-emerald-600 hover:text-emerald-700 underline"
                  >
                    Source
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Verified {new Date(signals.last_verified).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </p>
      </div>
    </section>
  );
}
