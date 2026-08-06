"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type CampaignCommunication,
  type CampaignLead,
  type CampaignRequest,
  STATUS_LABELS,
  channelLabel,
  fmtDateOnly,
} from "@/components/admin/AdBoostShared";
import {
  AD_BOOST_PROVIDER_JOURNEY,
  type JourneyStep,
} from "@/lib/family-comms/journey";
import {
  type AdBoostCommunicationTone,
  formatAdBoostRelativeTime,
  getAdBoostStepState,
} from "@/lib/ad-boost/admin-communications";

type EngineJob = {
  id: string;
  name: string;
  humanSchedule: string;
  health: "healthy" | "attention" | "running" | "paused" | "event" | "archived";
  paused: boolean;
  lastRun: { startedAt: string; status: string } | null;
};

type CampaignDetail = {
  request: CampaignRequest;
  leads: CampaignLead[];
  communications: CampaignCommunication[];
  campaignStats: {
    visitors: number;
    leads: number;
    questions: { received: number; unanswered: number };
  } | null;
  receipt: {
    outcomes: { client: number; talking: number; no: number; unanswered: number };
  } | null;
};

type Preview = {
  html: string;
  subject: string;
  from?: string;
  preheader?: string | null;
};

const ENGINE_IDS = [
  "ad-boost-emails",
  "ad-boost-profile-reminders",
  "ad-boost-launch-scheduler",
];

const EMAIL_TYPE_COUNT = new Set(
  AD_BOOST_PROVIDER_JOURNEY.steps.flatMap((step) => step.emailType ? [step.emailType] : []),
).size;
const PHASE_DESCRIPTIONS: Record<string, string> = {
  Request: "Capture intent immediately, then take the path the provider qualifies for.",
  Prepare: "Clear the readiness gate and turn the saved request into launchable work.",
  Run: "Start the campaign and show credible progress without over-messaging.",
  "Prove value": "Connect every inquiry to an outcome and close with a living receipt.",
  Continue: "Let demonstrated value—not a calendar—open the paid-plan decision.",
};

const ENGINE_COPY: Record<string, { eyebrow: string; description: string }> = {
  "ad-boost-emails": {
    eyebrow: "Event-driven",
    description: "Request, lead, traction, and wrap-up messages fire when campaign activity happens.",
  },
  "ad-boost-profile-reminders": {
    eyebrow: "Daily",
    description: "Re-checks queued profiles and follows up on unresolved lead outcomes.",
  },
  "ad-boost-launch-scheduler": {
    eyebrow: "Hourly",
    description: "Delivers launch confirmations at the provider-friendly US Eastern time selected by the concierge.",
  },
};

function stateClasses(tone: AdBoostCommunicationTone): string {
  if (tone === "sent") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (tone === "active") return "bg-teal-50 text-teal-800 ring-teal-200";
  if (tone === "scheduled") return "bg-blue-50 text-blue-700 ring-blue-200";
  if (tone === "waiting") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-gray-50 text-gray-400 ring-gray-200";
}

export default function AdBoostJourneyExperience() {
  const searchParams = useSearchParams();
  const requestedCampaignId = searchParams.get("campaign") ?? "";
  const requestedStepKey = searchParams.get("step");
  const validRequestedStep = AD_BOOST_PROVIDER_JOURNEY.steps.some(
    (step) => step.key === requestedStepKey,
  )
    ? requestedStepKey!
    : "campaign_launched";
  const [campaigns, setCampaigns] = useState<CampaignRequest[]>([]);
  const [engines, setEngines] = useState<EngineJob[]>([]);
  const [campaignId, setCampaignId] = useState(requestedCampaignId);
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStepKey, setSelectedStepKey] = useState(validRequestedStep);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([validRequestedStep]));
  const [preview, setPreview] = useState<Preview | "loading" | "none" | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const journeyRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [automationResponse, campaignResponse] = await Promise.all([
        fetch("/api/admin/automations"),
        fetch("/api/admin/ad-boost"),
      ]);
      if (!automationResponse.ok || !campaignResponse.ok) throw new Error("Could not load the Ad Boost journey");
      const automationPayload = await automationResponse.json() as { jobs: EngineJob[] };
      const campaignPayload = await campaignResponse.json() as { requests: CampaignRequest[] };
      const nextCampaigns = campaignPayload.requests ?? [];
      setEngines(ENGINE_IDS.map((id) => automationPayload.jobs.find((job) => job.id === id)).filter((job): job is EngineJob => Boolean(job)));
      setCampaigns(nextCampaigns);
      if (nextCampaigns.length > 0) {
        const rank: Record<string, number> = { live: 0, scheduled: 1, requested: 2, pending_profile: 3, ended: 4, cancelled: 5 };
        const first = [...nextCampaigns].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))[0];
        setCampaignId((current) =>
          current && nextCampaigns.some((campaign) => campaign.id === current)
            ? current
            : first.id,
        );
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the Ad Boost journey");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Journey links from a campaign detail page arrive with both the correct
  // step and the preview anchor. The preview is client-rendered after the
  // Suspense boundary, so repeat the browser's anchor scroll once it exists.
  useEffect(() => {
    if (window.location.hash !== "#ad-boost-message-preview") return;
    const frame = window.requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!campaignId) {
      setDetail(null);
      return;
    }
    let active = true;
    setDetail(null);
    setDetailLoading(true);
    setError(null);
    fetch(`/api/admin/ad-boost?id=${encodeURIComponent(campaignId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load this campaign");
        return response.json() as Promise<CampaignDetail>;
      })
      .then((payload) => { if (active) setDetail(payload); })
      .catch((detailError) => { if (active) setError(detailError instanceof Error ? detailError.message : "Could not load this campaign"); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [campaignId]);

  const selectedStep = AD_BOOST_PROVIDER_JOURNEY.steps.find((step) => step.key === selectedStepKey) ?? AD_BOOST_PROVIDER_JOURNEY.steps[0];

  useEffect(() => {
    if (!selectedStep.emailSampleId || !selectedStep.ownedBy) {
      setPreview(null);
      return;
    }
    let active = true;
    setPreview("loading");
    setPreviewExpanded(false);
    fetch(`/api/admin/automations/${selectedStep.ownedBy}/preview?variant=${encodeURIComponent(selectedStep.emailSampleId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("preview unavailable");
        return response.json() as Promise<Preview>;
      })
      .then((payload) => { if (active) setPreview(payload); })
      .catch(() => { if (active) setPreview("none"); });
    return () => { active = false; };
  }, [selectedStep]);

  const phases = useMemo(() => {
    const order: string[] = [];
    const grouped = new Map<string, JourneyStep[]>();
    for (const step of AD_BOOST_PROVIDER_JOURNEY.steps) {
      const phase = step.phase ?? "Journey";
      if (!grouped.has(phase)) order.push(phase);
      grouped.set(phase, [...(grouped.get(phase) ?? []), step]);
    }
    return order.map((phase) => ({ phase, steps: grouped.get(phase) ?? [] }));
  }, []);

  const selectedCampaign = detail?.request ?? campaigns.find((campaign) => campaign.id === campaignId) ?? null;
  const allExpanded = expanded.size === AD_BOOST_PROVIDER_JOURNEY.steps.length;

  function selectStep(step: JourneyStep) {
    setSelectedStepKey(step.key);
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(step.key)) next.delete(step.key);
      else next.add(step.key);
      return next;
    });
  }

  function previewStep(step: JourneyStep) {
    setSelectedStepKey(step.key);
    setExpanded((current) => new Set(current).add(step.key));
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.setTimeout(
        () => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    }
  }

  return (
    <div className="max-w-6xl pb-16">
      <Link href="/admin/automations" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-700">
        <span aria-hidden="true">←</span> Automations
      </Link>

      <header className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">Provider journey</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.03em] text-gray-950 sm:text-4xl">
            See every Ad Boost message in order.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
            One provider experience across request, launch, live results, and outcome follow-up. Ad Boost is the internal program name; providers see it as their Find Families campaign.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-gray-700">
            <span><strong className="text-xl text-gray-950">{EMAIL_TYPE_COUNT}</strong> email types</span>
            <span><strong className="text-xl text-gray-950">{ENGINE_IDS.length}</strong> delivery engines</span>
            <span className="text-gray-500">Email-only journey</span>
          </div>
        </div>
        <Link href="/admin/ad-boost" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-gray-950 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
          Open campaign queue →
        </Link>
      </header>

      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Follow a real campaign</h2>
            <p className="mt-0.5 text-xs text-gray-500">Overlay what has actually sent, what is waiting, and which path did not apply.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              aria-label="Campaign overlay"
              value={campaignId}
              disabled={loading}
              onChange={(event) => setCampaignId(event.target.value)}
              className="min-h-10 min-w-64 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
            >
              <option value="">Canonical journey · no overlay</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.display_name || campaign.provider_slug || campaign.provider_id} · {STATUS_LABELS[campaign.status] ?? campaign.status}
                </option>
              ))}
            </select>
            {campaignId && <Link href={`/admin/ad-boost/${campaignId}`} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100">Open campaign ↗</Link>}
          </div>
        </div>
        {selectedCampaign && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-200 pt-4 text-xs sm:grid-cols-4">
            <CampaignFact label="Provider" value={selectedCampaign.display_name || selectedCampaign.provider_slug || "Unknown"} />
            <CampaignFact label="Campaign state" value={detailLoading ? "Loading…" : STATUS_LABELS[selectedCampaign.status] ?? selectedCampaign.status} />
            <CampaignFact label="Flight" value={`${fmtDateOnly(selectedCampaign.requested_setup_week)}${selectedCampaign.flight_end_date ? ` → ${fmtDateOnly(selectedCampaign.flight_end_date)}` : ""}`} />
            <CampaignFact label="Channel" value={channelLabel(selectedCampaign.channel) ?? "Not chosen"} />
          </div>
        )}
      </section>

      <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
        <section ref={journeyRef} className="scroll-mt-5 overflow-hidden rounded-2xl border border-teal-200/70 bg-white shadow-sm shadow-teal-950/5">
          <div className="flex flex-col gap-3 border-b border-teal-100 bg-gradient-to-br from-teal-50/80 via-white to-white px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">The campaign story</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-950">From request to proof</h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-gray-500">Branches are alternatives. Lead delivery and outcome checks repeat for each family.</p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(allExpanded ? new Set() : new Set(AD_BOOST_PROVIDER_JOURNEY.steps.map((step) => step.key)))}
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-white px-3.5 text-xs font-semibold text-teal-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
          </div>

          <div className="px-3 py-4 sm:px-5">
            {phases.map(({ phase, steps }, phaseIndex) => (
              <div key={phase} className={phaseIndex === 0 ? "" : "mt-6 border-t border-gray-100 pt-6"}>
                <div className="mb-2 px-3 sm:px-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">{phaseIndex + 1} · {phase}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{PHASE_DESCRIPTIONS[phase]}</p>
                </div>
                <ol>
                  {steps.map((step, stepIndex) => {
                    const isSelected = selectedStepKey === step.key;
                    const isExpanded = expanded.has(step.key);
                    const state = detail
                      ? getAdBoostStepState(step, detail.request, detail.communications, {
                          leadCount: detail.leads.length,
                          unresolvedOutcomes: detail.receipt?.outcomes.unanswered ?? 0,
                        })
                      : null;
                    return (
                      <li key={step.key} className="relative flex gap-2.5 sm:gap-3">
                        <div className="flex w-7 shrink-0 flex-col items-center" aria-hidden="true">
                          <span className={`mt-4 h-3 w-3 rounded-full ring-4 ring-white transition-colors ${isSelected ? "bg-teal-600" : state?.tone === "sent" ? "bg-emerald-400" : "bg-gray-200"}`} />
                          {stepIndex < steps.length - 1 && <span className="w-px flex-1 bg-gray-200" />}
                        </div>
                        <div className="min-w-0 flex-1 pb-1">
                          <button
                            type="button"
                            onClick={() => selectStep(step)}
                            aria-expanded={isExpanded}
                            className={`my-1.5 flex min-h-16 w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 sm:px-4 ${isSelected ? "bg-teal-50/80 ring-1 ring-inset ring-teal-100" : "hover:bg-gray-50"}`}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[10px] font-semibold uppercase tracking-wide ${isSelected ? "text-teal-700" : "text-gray-400"}`}>{step.timing}</span>
                                {step.traits?.map((trait) => <span key={trait} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500 ring-1 ring-inset ring-gray-200">{trait}</span>)}
                              </span>
                              <span className="mt-1 block text-sm font-semibold text-gray-900 sm:text-[15px]">{step.title}</span>
                            </span>
                            {state && <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${stateClasses(state.tone)}`} title={state.detail}>{state.label}</span>}
                            <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
                          </button>
                          {isExpanded && (
                            <div className="px-3 pb-5 pt-1 text-[13px] leading-relaxed text-gray-600 sm:px-4">
                              <p>{step.description}</p>
                              {state?.detail && <p className="mt-2 text-xs font-medium text-gray-400">This campaign: {state.detail}</p>}
                              {step.gate && <p className="mt-2 rounded-lg bg-amber-50/70 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-100"><strong>Gate:</strong> {step.gate}</p>}
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                                {step.emailSampleId && (
                                  <button
                                    type="button"
                                    onClick={() => previewStep(step)}
                                    className="inline-flex min-h-7 items-center rounded-md bg-teal-50 px-2.5 font-semibold text-teal-800 ring-1 ring-inset ring-teal-100 transition-colors hover:bg-teal-100"
                                  >
                                    Preview email ↓
                                  </button>
                                )}
                                {step.emailType && <Link href={`/admin/emails?email_type=${encodeURIComponent(step.emailType)}`} className="rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-500 hover:text-gray-800">✉ {step.emailType}</Link>}
                                {step.ownedBy && <Link href={`/admin/automations/${step.ownedBy}`} className="font-semibold text-teal-700 hover:underline">Runs in {ENGINE_COPY[step.ownedBy]?.eyebrow ?? step.ownedBy} →</Link>}
                                {!step.ownedBy && step.ownerNote && <span className="text-gray-400">{step.ownerNote}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <aside ref={previewRef} id="ad-boost-message-preview" className="scroll-mt-5 lg:sticky lg:top-5">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Representative email</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-gray-950">{selectedStep.title}</h2>
              {preview && typeof preview === "object" && <p className="mt-1 text-xs text-gray-500">&ldquo;{preview.subject}&rdquo;</p>}
              <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                {selectedCampaign
                  ? `Campaign status reflects ${selectedCampaign.display_name || selectedCampaign.provider_slug || "the selected provider"}; the message below uses representative sample data.`
                  : "This is representative content. Open a campaign overlay to compare it with real delivery state."}
              </p>
            </div>
            {!selectedStep.emailSampleId ? (
              <div className="flex min-h-80 flex-col items-center justify-center px-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400" aria-hidden="true">—</span>
                <h3 className="mt-4 text-base font-semibold text-gray-900">No message at this step</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">This state matters to the campaign, but it does not create another provider interruption.</p>
              </div>
            ) : preview === "loading" ? (
              <div className="min-h-80 animate-pulse bg-gray-50" />
            ) : preview === "none" || !preview ? (
              <div className="flex min-h-80 items-center justify-center px-8 text-center text-sm text-gray-400">This message sample is unavailable.</div>
            ) : (
              <>
                {(preview.from || preview.preheader) && (
                  <div className="space-y-1 border-b border-gray-100 bg-gray-50/60 px-5 py-3 text-xs text-gray-400">
                    {preview.from && <p><span className="font-semibold text-gray-500">From</span> {preview.from}</p>}
                    {preview.preheader && <p className="truncate"><span className="font-semibold text-gray-500">Preview</span> {preview.preheader}</p>}
                  </div>
                )}
                <div className="relative bg-white">
                  <iframe srcDoc={preview.html} title={`${selectedStep.title} email sample`} className={`w-full bg-white transition-[height] ${previewExpanded ? "h-[720px]" : "h-[440px]"}`} sandbox="" />
                  {!previewExpanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3">
                    <button type="button" onClick={() => setPreviewExpanded((current) => !current)} className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow">
                      {previewExpanded ? "Collapse message" : "Read full message"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => journeyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 lg:hidden"
          >
            ↑ Back to campaign journey
          </button>
        </aside>
      </div>

      <section className="mt-14">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">Delivery engines</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">The machinery behind the journey</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">These remain separate so scheduling, health, pause controls, and run history stay honest. They no longer have to teach the provider story.</p>
        </div>
        <div className="mt-5 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {engines.map((engine) => {
            const copy = ENGINE_COPY[engine.id];
            return (
              <Link key={engine.id} href={`/admin/automations/${engine.id}`} className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-700">{copy?.eyebrow}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${engine.paused || engine.health === "paused" ? "bg-amber-50 text-amber-700" : engine.health === "attention" ? "bg-red-50 text-red-700" : engine.health === "running" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>{engine.paused ? "Paused" : engine.health === "attention" ? "Needs attention" : engine.health === "running" ? "Running" : "Healthy"}</span>
                  </span>
                  <span className="mt-1 block font-semibold text-gray-900">{engine.name}</span>
                  <span className="mt-1 block max-w-2xl text-xs leading-relaxed text-gray-500">{copy?.description}</span>
                </span>
                <span className="flex shrink-0 items-center gap-5 text-xs text-gray-400">
                  <span className="text-right">
                    <strong className="block text-sm text-gray-700">
                      {engine.lastRun ? `Last run ${formatAdBoostRelativeTime(engine.lastRun.startedAt)}` : engine.id === "ad-boost-emails" ? "Activity-triggered" : "No run recorded"}
                    </strong>
                    {engine.paused ? "delivery paused" : engine.lastRun?.status === "running" ? "currently running" : "operational detail"}
                  </span>
                  <span className="transition-transform group-hover:translate-x-0.5 group-hover:text-gray-700" aria-hidden="true">→</span>
                </span>
              </Link>
            );
          })}
          {!loading && engines.length === 0 && <div className="px-5 py-8 text-center text-sm text-gray-400">Delivery-engine health is unavailable.</div>}
        </div>
      </section>
    </div>
  );
}

function CampaignFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="mt-1 block truncate font-semibold text-gray-700" title={value}>{value}</span>
    </div>
  );
}
