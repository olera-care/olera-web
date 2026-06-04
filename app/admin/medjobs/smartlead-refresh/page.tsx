"use client";

import { useState } from "react";

interface RefreshResult {
  campaign_id: number;
  campus_slug: string | null;
  cadence_key: string;
  status: "pushed" | "failed" | "skipped";
  error?: string;
  subjects?: string[];
}

interface RefreshResponse {
  dry_run: boolean;
  total_campaigns: number;
  refreshed: RefreshResult[];
  failed: RefreshResult[];
}

/**
 * Admin page — push current `lib/student-outreach/templates.ts` copy to
 * all existing Smartlead campaigns.
 *
 * Why this page exists: Smartlead campaigns are STATEFUL — the email
 * body text gets saved into each campaign at provisioning time. Code-
 * side template updates only affect NEW campaigns; existing ones keep
 * their original sequence text. This page is the one-click way to push
 * the latest templates to every existing campaign.
 *
 * Workflow:
 *   1. Click "Preview changes" → calls GET (dry-run) → shows what
 *      would change
 *   2. Click "Push to Smartlead" → calls POST → actually replaces the
 *      sequences via `saveSequence` → shows what got pushed
 *
 * Idempotent. Safe to re-run after any future template change.
 */
export default function SmartleadRefreshPage() {
  const [loading, setLoading] = useState<"none" | "preview" | "push">("none");
  const [result, setResult] = useState<RefreshResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(method: "GET" | "POST") {
    setLoading(method === "GET" ? "preview" : "push");
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/medjobs/refresh-smartlead-sequences", {
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

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl text-gray-900">
        Refresh Smartlead campaigns
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Push the current email templates (from <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">lib/student-outreach/templates.ts</code>) to all existing Smartlead campaigns. Replaces whatever sequence text was baked in when each campaign was first provisioned. Safe to run any time templates change.
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
                "This will replace the email sequence in every existing Smartlead campaign with the current templates. Continue?",
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
                ? `Preview: ${result.total_campaigns} campaign(s) would be refreshed`
                : `Done: ${result.refreshed.length} campaign(s) pushed${
                    result.failed.length > 0
                      ? `, ${result.failed.length} failed`
                      : ""
                  }`}
            </p>
          </div>

          {result.failed.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-red-700">
                Failed ({result.failed.length})
              </h2>
              <ul className="space-y-2">
                {result.failed.map((r) => (
                  <li
                    key={r.campaign_id}
                    className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm"
                  >
                    <p className="font-semibold text-gray-900">
                      Campaign {r.campaign_id} ·{" "}
                      {r.campus_slug ?? "(no campus)"} · {r.cadence_key}
                    </p>
                    <p className="mt-1 text-red-700">{r.error}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.refreshed.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-700">
                {result.dry_run ? "Would refresh" : "Refreshed"} (
                {result.refreshed.length})
              </h2>
              <ul className="space-y-3">
                {result.refreshed.map((r) => (
                  <li
                    key={r.campaign_id}
                    className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm"
                  >
                    <p className="font-semibold text-gray-900">
                      Campaign {r.campaign_id} ·{" "}
                      {r.campus_slug ?? "(no campus)"} · {r.cadence_key}
                    </p>
                    {r.subjects && r.subjects.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-gray-600">
                        {r.subjects.map((s, i) => (
                          <li key={i}>
                            <span className="text-gray-400">{i + 1}.</span> {s}
                          </li>
                        ))}
                      </ul>
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
