"use client";

/**
 * The single, canonical call-script UI (design C). Read-only, gray, with a
 * small uppercase label and the script as pre-wrapped text. Used EVERYWHERE a
 * call script is shown — the pre-flight + call-to-follow-up outcome modals,
 * and the cold + activation pre-launch previews — so there's no design drift.
 * Scripts are no longer edited inline; they render from the cadence defaults.
 */
export function CallScriptBlock({
  label,
  script,
}: {
  label: string;
  script: string;
}) {
  return (
    <section className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <pre className="mt-1 whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-gray-700">
        {script}
      </pre>
    </section>
  );
}
