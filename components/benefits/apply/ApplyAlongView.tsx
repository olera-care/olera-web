"use client";

import { useEffect, useRef, useState } from "react";
import type { ApplyAlong, ApplyHousehold } from "@/lib/benefits/apply-along";
import type { FinderWho } from "@/lib/benefits/finder-answers";
import { parseContact, recordApplied as recordAppliedOn, savePlan } from "@/components/benefits/apply/apply-record";
import { telHref } from "@/lib/benefits/call-script";
import { trackBenefitsEvent } from "@/lib/analytics/track-step";
import { getOrCreateSessionId } from "@/lib/analytics/session";

/**
 * The Medicare Savings apply-along sheet (lib/benefits/apply-along.ts):
 * Social Security's Extra Help form, section by section, with the family's
 * answers filled in. (SNAP has its own flow: SnapApplyFlow.tsx.)
 * They submit on Social Security's site; here they tell us they did, so the
 * check-ins can ask what came back. A plan token records it on the family;
 * without one, they give a number or email first (the plan save).
 */

interface Props {
  sheet: ApplyAlong;
  token: string | null;
  stateCode: string | null;
  stateSlug: string | null;
  program: { id: string; name: string; shortName: string | null } | null;
  who: FinderWho | null;
  household: ApplyHousehold;
  income: string | null;
}

const TRACKING_KEY = "benefits-finder";

type Phase = "sheet" | "contact" | "done";

export default function ApplyAlongView({ sheet, token, stateCode, stateSlug, program, who, household, income }: Props) {
  // The quiet links under the steps: every screen, or the phone route.
  const [more, setMore] = useState<"screens" | "phone" | null>(null);
  const [phase, setPhase] = useState<Phase>("sheet");
  // What the contact form is for: recording a submission, or sending the sheet for later.
  const [purpose, setPurpose] = useState<"applied" | "later">("applied");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTo, setSavedTo] = useState<"sms" | "email" | null>(null);
  // True once the submission is on the family's record, which is what the
  // check-ins read. A returning family saved from this browser isn't (their
  // record isn't changed from an unverified browser), so no check-in promise.
  const [recorded, setRecorded] = useState(false);
  const entryTracked = useRef(false);

  const track = (event: "benefits_entry_viewed" | "benefits_step_completed", stepName: string) =>
    trackBenefitsEvent({
      event,
      sessionId: getOrCreateSessionId(),
      stateCode,
      stateName: null,
      providerName: null,
      providerSlug: TRACKING_KEY,
      variant: sheet.variant,
      stepName,
      stepNumber: 0,
      entrySource: "/benefits/apply/extra-help",
    });

  useEffect(() => {
    if (entryTracked.current) return;
    entryTracked.current = true;
    track("benefits_entry_viewed", "entry");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordApplied = (t: string) => recordAppliedOn(t, sheet.route, program?.id ?? null, stateSlug);

  const submitted = async () => {
    track("benefits_step_completed", "applied");
    setError(null);
    if (!token) {
      // Nothing to record it on yet: ask where to check in.
      setPurpose("applied");
      setPhase("contact");
      return;
    }
    setBusy(true);
    try {
      await recordApplied(token);
      setRecorded(true);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save that just now.");
    } finally {
      setBusy(false);
    }
  };

  /** The plan save: creates the family's record and texts or emails the plan. */
  const save = async () => {
    const parsed = parseContact(contact);
    if (!parsed) {
      setError("Enter a 10-digit mobile number or an email address.");
      return;
    }
    if (!program || !stateCode || !stateSlug) {
      setError("We couldn't tell which state this is for. Go back to your plan and try again.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { token: newToken } = await savePlan({
        contact: parsed, program, stateCode, stateSlug, who, household, income,
        entrySource: "/benefits/apply/extra-help",
      });
      // A returning family's record isn't changed from an unverified browser;
      // their plan still goes to what's on file.
      if (purpose === "applied" && newToken) {
        await recordApplied(newToken);
        setRecorded(true);
      }
      track("benefits_step_completed", purpose === "applied" ? "applied_saved" : "saved_for_later");
      setSavedTo(parsed.email ? "email" : "sms");
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save that just now.");
    } finally {
      setBusy(false);
    }
  };

  if (phase === "done") {
    return (
      <div className="conv-rise flex flex-col gap-6">
        <style>{`@keyframes convRise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } } .conv-rise { animation: convRise .32s cubic-bezier(.16,1,.3,1) both } @media (prefers-reduced-motion: reduce) { .conv-rise { animation: none } }`}</style>
        <h1 className="font-display text-[32px] leading-[1.08] text-gray-900 m-0">
          {purpose === "later" ? "Sent. It's there when you're ready." : "Done. Here's what happens next."}
        </h1>
        {purpose === "later" ? (
          <p className="m-0 text-[17px] text-gray-700">
            Open the link {savedTo === "email" ? "in the email" : "in the text"} when you&apos;re together. Your answers will be filled in.
          </p>
        ) : (
          <ul className="m-0 pl-5 flex flex-col gap-2.5 text-[17px] text-gray-700">
            {sheet.next.map((n) => <li key={n}>{n}</li>)}
          </ul>
        )}
        {recorded && purpose === "applied" ? (
          <p className="m-0 text-[15px] text-gray-600">
            We&apos;ll check in{savedTo ? ` by ${savedTo === "email" ? "email" : "text"}` : ""} {sheet.doneCheckin}. A person on our team reads every reply.
          </p>
        ) : purpose === "applied" && savedTo ? (
          <p className="m-0 text-[15px] text-gray-600">
            Your plan is on its way. When something comes in the mail, open it and tap what happened.
          </p>
        ) : null}
      </div>
    );
  }

  if (phase === "contact") {
    return (
      <div className="flex flex-col gap-5">
        <button type="button" onClick={() => setPhase("sheet")} className="self-start bg-transparent border-none p-0 text-[14px] text-gray-600 font-medium cursor-pointer">← Back</button>
        <h1 className="font-display text-[30px] leading-[1.1] text-gray-900 m-0">
          {purpose === "applied" ? "Where should we check in?" : "Where should we send it?"}
        </h1>
        <p className="m-0 text-[16px] text-gray-600">
          {purpose === "applied"
            ? sheet.contactLine
            : "A link that opens this list with your answers filled in, for when you're together."}
        </p>
        <input
          type="text"
          inputMode="email"
          autoComplete="tel"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Mobile number or email"
          className="min-h-[56px] rounded-2xl border border-gray-300 bg-white px-4 text-[17px] text-gray-900"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy}
          className="min-h-[56px] rounded-2xl bg-primary-800 text-white text-[17px] font-semibold border-none cursor-pointer disabled:opacity-60"
        >
          {busy ? "Saving…" : purpose === "applied" ? "Check in with me" : "Send it"}
        </button>
        {purpose === "applied" ? (
          <button type="button" onClick={() => setPhase("done")} className="self-start bg-transparent border-none p-0 text-[15px] text-gray-500 cursor-pointer">
            Skip
          </button>
        ) : null}
        {error ? <p role="alert" className="m-0 text-[15px] text-red-700">{error}</p> : null}
        <p className="m-0 text-[13px] text-gray-500">By texting you agree to messages from Olera about this application. Reply STOP to stop.</p>
      </div>
    );
  }

  const Obj = ({ name, size = 40 }: { name: string; size?: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/images/apply-along/${name}.svg`} alt="" width={size} height={size} style={{ width: size, height: size }} className="shrink-0" />
  );
  const Num = ({ n }: { n: number }) => (
    <span aria-hidden="true" className="mt-0.5 w-[26px] h-[26px] shrink-0 rounded-full border-[1.5px] border-primary-700 text-primary-700 text-[13px] font-bold grid place-items-center">{n}</span>
  );

  return (
    <div className="flex flex-col gap-9">
      <header className="flex flex-col gap-2.5">
        <span className="text-[13px] font-semibold text-primary-700">{sheet.eyebrow}</span>
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-[-0.01em] leading-[1.15] text-gray-900 m-0 [text-wrap:balance]">{sheet.heading}</h1>
        <p className="m-0 text-[17px] text-gray-600">{sheet.lede}</p>
      </header>

      <section className="flex flex-col gap-7" aria-label="How it works">
        <h2 className="m-0 text-[15px] font-semibold text-gray-500">How it works</h2>

        <div className="flex gap-3">
          <Num n={1} />
          <div className="flex flex-col gap-3 min-w-0 flex-1">
            <p className="m-0 text-[18px] font-semibold text-gray-900">{sheet.open.title}</p>
            <p className="m-0 text-[16px] text-gray-600">{sheet.formLine}</p>
            <div className="flex items-center gap-3 text-[15px] text-gray-600"><Obj name="id-card" size={32} />{sheet.gatherLine}</div>
            {sheet.open.href ? (
              <a
                href={sheet.open.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("benefits_step_completed", "ssa_opened")}
                className="min-h-[56px] rounded-2xl bg-primary-800 text-white text-[17px] font-semibold flex items-center justify-center text-center px-4 no-underline"
              >
                {sheet.open.label}
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex gap-3">
          <Num n={2} />
          <div className="flex flex-col min-w-0 flex-1">
            <p className="m-0 text-[18px] font-semibold text-gray-900">Answer its questions</p>
            <p className="m-0 mt-2 mb-1 text-[16px] text-gray-600">{sheet.moneyIntro}</p>
            {sheet.money.map((r) => (
              <div key={r.title} className="grid grid-cols-[40px_1fr] gap-3.5 py-3.5 border-t border-gray-200 first-of-type:border-t-0 items-start">
                <Obj name={r.icon} />
                <div className="min-w-0">
                  <p className={`m-0 text-[17px] font-semibold ${r.icon === "check-mark" ? "text-primary-800" : "text-gray-900"}`}>{r.title}</p>
                  <p className="m-0 mt-0.5 text-[15px] text-gray-600">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Num n={3} />
          <div className="flex flex-col gap-3 min-w-0 flex-1">
            <p className="m-0 text-[18px] font-semibold text-gray-900">Send it, then tell us</p>
            <p className="m-0 text-[16px] text-gray-600">{sheet.checkinLine}</p>
            <button
              type="button"
              onClick={() => void submitted()}
              disabled={busy}
              className="self-start min-h-[48px] px-6 rounded-full border-[1.5px] border-primary-800 bg-white text-primary-800 text-[16px] font-semibold cursor-pointer disabled:opacity-60"
            >
              {busy ? "Saving…" : "We sent it"}
            </button>
            {error ? <p role="alert" className="m-0 text-[15px] text-red-700">{error}</p> : null}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-gray-200 pt-5">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[15px] font-medium">
          <button type="button" onClick={() => setMore(more === "screens" ? null : "screens")} aria-expanded={more === "screens"} className="bg-transparent border-none p-0 text-primary-800 cursor-pointer">See every screen</button>
          {sheet.phone ? (
            <button type="button" onClick={() => { setMore(more === "phone" ? null : "phone"); if (more !== "phone") track("benefits_step_completed", "phone_opened"); }} aria-expanded={more === "phone"} className="bg-transparent border-none p-0 text-primary-800 cursor-pointer">Rather call?</button>
          ) : null}
          {program ? (
            <button type="button" onClick={() => { setPurpose("later"); setPhase("contact"); setError(null); track("benefits_step_completed", "later"); }} className="bg-transparent border-none p-0 text-primary-800 cursor-pointer">Do it later</button>
          ) : null}
        </div>
        {more === "screens" ? (
          <ol className="m-0 p-0 list-none">
            {sheet.steps.map((st, i) => (
              <li key={st.title} className="py-3.5 border-t border-gray-200">
                <p className="m-0 text-[15px] font-semibold text-gray-900">{i + 1}. {st.title}</p>
                <p className="m-0 mt-0.5 text-[15px] text-gray-700">{st.answer}</p>
                {st.note ? <p className="m-0 mt-0.5 text-[14px] text-gray-500">{st.note}</p> : null}
              </li>
            ))}
          </ol>
        ) : null}
        {more === "phone" && sheet.phone ? (
          <div className="flex flex-col gap-2 pt-1">
            <a href={telHref(sheet.phone.number)} className="text-[17px] font-semibold text-primary-800 no-underline">{sheet.phone.label}</a>
            {sheet.phone.note ? <p className="m-0 text-[15px] text-gray-600">{sheet.phone.note}</p> : null}
            {sheet.phone.script ? <p className="m-0 text-[15px] text-gray-700">&ldquo;{sheet.phone.script}&rdquo;</p> : null}
          </div>
        ) : null}
      </section>

      <p className="m-0 text-[13px] leading-relaxed text-gray-500">{sheet.disclaimer}</p>
    </div>
  );
}
