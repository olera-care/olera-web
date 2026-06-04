"use client";

import { useState } from "react";

interface LeadResult {
  campaign_id: number;
  lead_id: number | null;
  email: string | null;
  outreach_id: string | null;
  status: "updated" | "skipped" | "failed";
  reason?: string;
}

interface RefreshResponse {
  dry_run: boolean;
  total_campaigns: number;
  summary: { updated: number; skipped: number; failed: number };
  results: LeadResult[];
}

/**
 * Admin page — backfill `custom_fields.welcome_url` on every existing
 * Smartlead lead.
 *
 * Companion to /admin/medjobs/smartlead-refresh: that page pushes the
 * email BODY templates; this page patches each LEAD'S merge-tag values.
 *
 * Why both are needed: Smartlead's per-recipient `{{welcome_url}}` merge
 * tag is substituted from each lead's `custom_fields.welcome_url` at
 * send time. Leads enrolled BEFORE the magic-link rollout don't have
 * that field — so the tag renders empty and the CTA link breaks.
 *
 * Re-running revokes any previously-issued URLs (new random JTI per
 * token). Old emails still sitting in inboxes will stop working after.
 */
export default function SmartleadRefreshLeadsPage() {
  const [loading, setLoading] = useState<"none" | "preview" | "push">("none");
  const [result, setResult] = useState<RefreshResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(method: "GET" | "POST") {
    setLoading(method === "GET" ? "preview" : "push");
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/medjobs/refresh-smartlead-leads", {
        method,
      });
      const body = (await res.json()) as RefreshResponse & { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setResult(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading("none");
    }
  }

  const updated = result?.results.filter((r) => r.status === "updated") ?? [];
  const failed = result?.results.filter((r) => r.status === "failed") ?? [];
  const skipped = result?.results.filter((r) => r.status === "skipped") ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl text-gray-900">
        Refresh Smartlead lead welcome URLs
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Backfills <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">custom_fields.welcome_url</code> on every existing Smartlead lead. Required because leads enrolled before the magic-link rollout don&apos;t have the field — so the <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{`{{welcome_url}}`}</code> merge tag in the email body has no value to substitute, and the CTA link breaks.
      </p>
      <p className="mt-2 max-w-2xl text-xs text-amber-700">
        Re-running revokes any previously-issued URLs (new random token id per
        recipient). Old emails still in inboxes will stop working after.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => run("GET")}
          disabled={loading !== "none"}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading === "preview" ? "Loading…" : "Preview changes (dry-run)"}
        </button>
        <button
          onClick={() => {
            if (
              !window.confirm(
                "This will rewrite the welcome_url on every existing Smartlead lead, revoking any URLs already in inboxes. Continue?",
              )
            ) {
              return;
            }
            run("POST");
          }}
          disabled={loading !== "none"}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading === "push" ? "Pushing…" : "Push to Smartlead"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div
            className={`rounded-md border px-4 py-3 ${
              result.dry_run
                ? "border-gray-200 bg-gray-50"
                : "border-primary-200 bg-primary-50"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900">
              {result.dry_run
                ? `Preview: ${result.total_campaigns} campaign(s), ${result.summary.skipped} lead(s) would be updated`
                : `Done: ${result.summary.updated} lead(s) updated${
                    result.summary.failed > 0
                      ? `, ${result.summary.failed} failed`
                      : ""
                  }${
                    result.summary.skipped > 0
                      ? `, ${result.summary.skipped} skipped`
                      : ""
                  }`}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Across {result.total_campaigns} campaign(s)
            </p>
          </div>

          {failed.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-red-700">
                Failed ({failed.length})
              </h2>
              <ul className="space-y-2">
                {failed.map((r, i) => (
                  <li
                    key={`${r.campaign_id}-${r.lead_id ?? i}`}
                    className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm"
                  >
                    <p className="font-semibold text-gray-900">
                      Campaign {r.campaign_id} · Lead {r.lead_id ?? "?"} ·{" "}
                      {r.email ?? "(no email)"}
                    </p>
                    {r.reason && (
                      <p className="mt-1 text-red-700">{r.reason}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {updated.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-700">
                Updated ({updated.length})
              </h2>
              <ul className="space-y-1">
                {updated.map((r, i) => (
                  <li
                    key={`${r.campaign_id}-${r.lead_id ?? i}`}
                    className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs"
                  >
                    <span className="text-gray-500">
                      Campaign {r.campaign_id} · Lead {r.lead_id}
                    </span>{" "}
                    <span className="text-gray-900">{r.email}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {skipped.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-500">
                Skipped ({skipped.length})
              </h2>
              <ul className="space-y-1">
                {skipped.map((r, i) => (
                  <li
                    key={`${r.campaign_id}-${r.lead_id ?? i}`}
                    className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
                  >
                    <span className="text-gray-500">
                      Campaign {r.campaign_id} · Lead {r.lead_id ?? "?"}
                    </span>{" "}
                    <span className="text-gray-900">
                      {r.email ?? "(no email)"}
                    </span>
                    {r.reason && (
                      <span className="ml-2 text-gray-500">— {r.reason}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
