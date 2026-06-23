"use client";

import { useEffect, useMemo, useState } from "react";

interface VariantMeta {
  id: string;
  audience: "family" | "provider" | "transactional";
  group: string;
  label: string;
  subject: string;
  emailType: string;
  cron: string | null;
}

type AudienceFilter = "all" | "family" | "provider" | "transactional";
const AUDIENCES: AudienceFilter[] = ["all", "family", "provider", "transactional"];

/** Auto-size a same-origin iframe to its rendered email height on load. */
function PreviewFrame({ id, width }: { id: string; width: number }) {
  const [height, setHeight] = useState(640);
  return (
    <iframe
      title={id}
      src={`/api/admin/emails/sample?id=${encodeURIComponent(id)}&raw=1`}
      width={width}
      height={height}
      onLoad={(e) => {
        try {
          const doc = (e.target as HTMLIFrameElement).contentWindow?.document;
          if (doc) setHeight(Math.min(doc.body.scrollHeight + 24, 4000));
        } catch {
          /* cross-origin guard — same-origin in practice, ignore */
        }
      }}
      style={{ border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff", display: "block", maxWidth: "100%" }}
    />
  );
}

export default function EmailGalleryPage() {
  const [variants, setVariants] = useState<VariantMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<AudienceFilter>("all");
  const [width, setWidth] = useState(620);

  useEffect(() => {
    fetch("/api/admin/emails/sample")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setVariants(d.variants || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => variants.filter((v) => audience === "all" || v.audience === audience),
    [variants, audience],
  );
  const groups = useMemo(() => {
    const m = new Map<string, VariantMeta[]>();
    for (const v of filtered) {
      if (!m.has(v.group)) m.set(v.group, []);
      m.get(v.group)!.push(v);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const slug = (g: string) => g.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Email Gallery</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every email variant rendered from canned sample data — viewable before any real send.{" "}
            <span className="text-gray-400">Each frame is a stable shareable link (open in new tab).</span>
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {AUDIENCES.map((a) => (
              <button
                key={a}
                onClick={() => setAudience(a)}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  audience === a ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-gray-400">width</span>
            {[620, 375].map((w) => (
              <button
                key={w}
                onClick={() => setWidth(w)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  width === w ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {w === 375 ? "mobile" : "desktop"}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading variants…</p>}
        {error && <p className="text-sm text-red-600">Failed to load: {error}</p>}

        <div className="flex gap-8">
          {/* Jump nav */}
          {!loading && groups.length > 1 && (
            <nav className="sticky top-8 hidden h-fit w-44 shrink-0 lg:block">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Sections</p>
              <ul className="space-y-1">
                {groups.map(([g, items]) => (
                  <li key={g}>
                    <a href={`#${slug(g)}`} className="block text-sm text-gray-600 hover:text-gray-900">
                      {g} <span className="text-gray-400">({items.length})</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Gallery */}
          <div className="min-w-0 flex-1 space-y-12">
            {groups.map(([g, items]) => (
              <section key={g} id={slug(g)} className="scroll-mt-8">
                <h2 className="mb-4 text-lg font-semibold text-gray-800">{g}</h2>
                <div className="space-y-8">
                  {items.map((v) => (
                    <div key={v.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-sm font-semibold text-gray-900">{v.label}</span>
                        <span className="text-sm text-gray-500">{v.subject}</span>
                        <a
                          href={`/api/admin/emails/sample?id=${encodeURIComponent(v.id)}&raw=1`}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto text-xs font-medium text-primary-600 hover:underline"
                        >
                          Open raw ↗
                        </a>
                      </div>
                      <div className="mb-3 flex flex-wrap gap-2 text-[11px] text-gray-400">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5">{v.emailType}</code>
                        {v.cron && (
                          <a href={`/admin/automations/${v.cron}`} className="rounded bg-gray-100 px-1.5 py-0.5 hover:text-gray-700">
                            {v.cron}
                          </a>
                        )}
                        <a
                          href={`/admin/emails?type=${encodeURIComponent(v.emailType)}`}
                          className="rounded bg-gray-100 px-1.5 py-0.5 hover:text-gray-700"
                        >
                          see real sends →
                        </a>
                      </div>
                      <div className="overflow-x-auto rounded-lg bg-gray-100 p-3">
                        {/* key on width → remount on toggle so onLoad re-fits height to the reflowed email */}
                        <PreviewFrame key={`${v.id}-${width}`} id={v.id} width={width} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
