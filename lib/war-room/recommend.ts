import type {
  WarRoomMetric,
  WarRoomRecommendation,
  WarRoomSignal,
} from "@/lib/war-room/types";

export interface WarRoomFacts {
  windowDays: number;
  leads: number;
  providerPageViews: number;
  questions: number;
  questionsAnswered: number;
  benefitsCompleted: number;
  providerClaims: number;
  activeProviders: number;
  payingProviders: number;
  mrr: number;
  adBoostOpen: number;
  adBoostEndedUnpaid: number;
  supportUnhandled: number;
  supportUrgent: number;
  latestGrowthAt: string | null;
  growthSessions: number | null;
  growthInquiries: number | null;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export function buildWarRoomMetrics(facts: WarRoomFacts): WarRoomMetric[] {
  const responseRate = facts.questions > 0
    ? Math.round((facts.questionsAnswered / facts.questions) * 100)
    : null;

  return [
    {
      key: "revenue",
      label: "Ad Boost MRR",
      value: facts.mrr,
      display: money(facts.mrr),
      detail: `${number(facts.payingProviders)} paying provider${facts.payingProviders === 1 ? "" : "s"}`,
      tone: facts.mrr > 0 ? "good" : "critical",
      href: "/admin/ad-boost",
    },
    {
      key: "leads",
      label: "Care inquiries",
      value: facts.leads,
      display: number(facts.leads),
      detail: `${percent(facts.leads, facts.providerPageViews)} of provider views · ${facts.windowDays}d`,
      tone: facts.leads > 0 ? "good" : "warning",
      href: `/admin/connections?direction=inbound`,
    },
    {
      key: "demand",
      label: "Benefits completed",
      value: facts.benefitsCompleted,
      display: number(facts.benefitsCompleted),
      detail: `${number(facts.questions)} provider questions · ${facts.windowDays}d`,
      tone: facts.benefitsCompleted + facts.questions > 0 ? "good" : "warning",
      href: "/admin/benefits",
    },
    {
      key: "supply",
      label: "Active providers",
      value: facts.activeProviders,
      display: number(facts.activeProviders),
      detail: `${number(facts.providerClaims)} claims · ${responseRate == null ? "—" : `${responseRate}%`} Q&A response`,
      tone: facts.activeProviders > 0 ? "neutral" : "warning",
      href: "/admin/activity?actor=providers",
    },
  ];
}

export function buildWarRoomSignals(facts: WarRoomFacts): WarRoomSignal[] {
  const signals: WarRoomSignal[] = [];
  const growthAgeDays = facts.latestGrowthAt
    ? Math.floor((Date.now() - new Date(facts.latestGrowthAt).getTime()) / 86_400_000)
    : null;

  if (facts.leads >= 10 && facts.mrr === 0) {
    signals.push({
      id: "demand-without-revenue",
      title: "Demand is arriving. Ad Boost revenue is not.",
      detail: `${number(facts.leads)} inquiries landed in ${facts.windowDays} days while Ad Boost MRR stayed at $0. That proves an Ad Boost monetization problem—not the absence of other company revenue.`,
      severity: "urgent",
      href: "/admin/ad-boost",
    });
  }
  if (facts.adBoostEndedUnpaid > 0) {
    signals.push({
      id: "ended-unpaid-campaigns",
      title: "Free value reached the paywall and stopped.",
      detail: `${number(facts.adBoostEndedUnpaid)} ended campaign${facts.adBoostEndedUnpaid === 1 ? " has" : "s have"} no active paid plan. Close the loop before starting another clever experiment.`,
      severity: facts.mrr === 0 ? "urgent" : "watch",
      href: "/admin/ad-boost",
    });
  }
  if (facts.supportUrgent > 0 || facts.supportUnhandled >= 5) {
    signals.push({
      id: "support-backlog",
      title: "Customers are waiting on us.",
      detail: `${number(facts.supportUnhandled)} support thread${facts.supportUnhandled === 1 ? " currently needs" : "s currently need"} attention${facts.supportUrgent ? `, including ${facts.supportUrgent} urgent` : ""}. This is current backlog, not a ${facts.windowDays}-day total.`,
      severity: facts.supportUrgent > 0 ? "urgent" : "watch",
      href: "/admin/support-email",
    });
  }
  if (facts.questions >= 10 && facts.questionsAnswered / facts.questions < 0.25) {
    signals.push({
      id: "question-response",
      title: "The marketplace is collecting unanswered intent.",
      detail: `Only ${percent(facts.questionsAnswered, facts.questions)} of ${number(facts.questions)} new questions were answered in this window. Demand that gets silence is churn with better manners.`,
      severity: "urgent",
      href: "/admin/questions",
    });
  }
  if (growthAgeDays == null || growthAgeDays > 10) {
    signals.push({
      id: "stale-growth",
      title: "Growth telemetry is stale.",
      detail: growthAgeDays == null
        ? "No live growth snapshot is available. We are arguing with the lights off."
        : `The last growth collection is ${growthAgeDays} days old. Refresh it before trusting a traffic narrative.`,
      severity: growthAgeDays == null || growthAgeDays > 17 ? "urgent" : "watch",
      href: "/admin/organic-growth",
    });
  }
  return signals.slice(0, 4);
}

export function chooseWarRoomRecommendation(facts: WarRoomFacts): WarRoomRecommendation {
  const growthAgeDays = facts.latestGrowthAt
    ? Math.floor((Date.now() - new Date(facts.latestGrowthAt).getTime()) / 86_400_000)
    : null;

  if (facts.supportUrgent > 0) {
    return {
      key: `support-${facts.supportUrgent}-${facts.supportUnhandled}`,
      eyebrow: "Stop admiring the dashboard",
      title: "Clear the urgent customer queue today.",
      verdict: `${facts.supportUrgent} urgent customer thread${facts.supportUrgent === 1 ? " is" : "s are"} currently waiting. Nothing we invent today is more real than a customer asking us for help.`,
      move: "Assign an owner, answer or escalate every urgent thread, then write down the repeated failure behind them.",
      kill: "No roadmap debate until the urgent queue is at zero.",
      confidence: "high",
      evidence: [
        `${facts.supportUrgent} urgent support threads in the current backlog`,
        `${facts.supportUnhandled} current threads needing attention`,
      ],
      href: "/admin/support-email",
    };
  }

  if (facts.leads >= 10 && facts.mrr === 0) {
    return {
      key: `monetize-${facts.leads}-${facts.adBoostEndedUnpaid}`,
      eyebrow: "The uncomfortable answer",
      title: "Convert one Ad Boost provider before building another growth feature.",
      verdict: `Olera produced ${number(facts.leads)} care inquiries in ${facts.windowDays} days while Ad Boost remained at ${money(facts.mrr)} MRR. The product shows demand; this paid offer has not converted it yet. Other company revenue is not consolidated here.`,
      move: facts.adBoostEndedUnpaid > 0
        ? `Personally work the ${number(facts.adBoostEndedUnpaid)} ended, unpaid Ad Boost campaign${facts.adBoostEndedUnpaid === 1 ? "" : "s"}. Ask for the sale, record the objection verbatim, and change the offer only after hearing it.`
        : "Put the paid Ad Boost offer in front of the warmest providers, ask for the sale directly, and record every objection verbatim.",
      kill: "Pause net-new acquisition experiments that do not shorten the path from proven provider value to payment.",
      confidence: "high",
      evidence: [
        `${number(facts.leads)} inquiries in ${facts.windowDays} days`,
        `${money(facts.mrr)} Ad Boost MRR`,
        `${number(facts.providerPageViews)} provider page views`,
        `${number(facts.adBoostEndedUnpaid)} ended campaigns without an active plan`,
      ],
      href: "/admin/ad-boost",
    };
  }

  if (facts.questions >= 10 && facts.questionsAnswered / facts.questions < 0.25) {
    return {
      key: `answer-rate-${facts.questions}-${facts.questionsAnswered}`,
      eyebrow: "Demand is not a trophy",
      title: "Fix provider response before buying more attention.",
      verdict: `${number(facts.questions)} people asked providers a question; only ${number(facts.questionsAnswered)} got an answer in the same ${facts.windowDays}-day window. We are generating intent and then teaching customers not to expect a response.`,
      move: "Work the unanswered-provider queue, learn why providers ignore it, and remove the largest response friction this week.",
      kill: "Do not celebrate question volume without response and connection outcomes beside it.",
      confidence: "high",
      evidence: [
        `${number(facts.questions)} questions asked`,
        `${number(facts.questionsAnswered)} questions answered`,
        `${percent(facts.questionsAnswered, facts.questions)} response rate`,
      ],
      href: "/admin/questions",
    };
  }

  if (growthAgeDays == null || growthAgeDays > 10) {
    return {
      key: `telemetry-${growthAgeDays ?? "missing"}`,
      eyebrow: "We do not guess with confidence",
      title: "Restore the growth snapshot before choosing a growth bet.",
      verdict: growthAgeDays == null
        ? "There is no live growth snapshot. A sharp opinion built on missing telemetry is still a guess."
        : `The growth snapshot is ${growthAgeDays} days old. That is stale enough to manufacture a confident but wrong story.`,
      move: "Run the canonical metrics collection, inspect anomalies, then come back and make the call with current evidence.",
      kill: "No traffic diagnosis from memory, anecdotes, or a screenshot with no reporting window.",
      confidence: "high",
      evidence: [growthAgeDays == null ? "No live growth collection" : `Growth data is ${growthAgeDays} days old`],
      href: "/admin/organic-growth",
    };
  }

  return {
    key: `activate-${facts.leads}-${facts.activeProviders}`,
    eyebrow: "No fire. Good. Now move.",
    title: "Turn existing demand into faster provider action.",
    verdict: `The system generated ${number(facts.leads)} inquiries and ${number(facts.questions)} questions in ${facts.windowDays} days. The next compounding move is getting more of that intent answered, connected, and retained.`,
    move: "Interview the providers who responded fastest, copy the behavior that worked, and remove one step for everyone else.",
    kill: "Do not add another top-of-funnel surface until the response loop has a named owner and a measured target.",
    confidence: "medium",
    evidence: [
      `${number(facts.leads)} care inquiries`,
      `${number(facts.questions)} provider questions`,
      `${number(facts.activeProviders)} meaningfully active providers`,
    ],
    href: "/admin/activity?actor=providers",
  };
}
