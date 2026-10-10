"use client";

import { useEffect, useRef, useState } from "react";
import type { ApplyHousehold } from "@/lib/benefits/apply-along";
import { finderVoice, type FinderWho } from "@/lib/benefits/finder-answers";
import { telHref } from "@/lib/benefits/call-script";
import { trackBenefitsEvent } from "@/lib/analytics/track-step";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { parseContact, recordApplied, savePlan } from "@/components/benefits/apply/apply-record";

/**
 * The SNAP apply-along (10 Oct 2026): five short screens, one thing at a time,
 * then the state's own application. Approved as a prototype by TJ before this
 * was built (Typeform and Airbnb, not a form page).
 *
 * Specific only where we're sure: rules that are the same in every state, the
 * family's own answers, and each state's verified application link
 * (data/benefits/snap-states.json). No dollar figures about the family and no
 * state fine print, except the state's shorter senior form where one exists.
 *
 * Steps: welcome · have these nearby · costs to list · three things true
 * everywhere · their list and the state's door · did it go through · sent.
 * The place is kept in this browser, so a family who opens the state's site
 * and comes back lands on "Did it go through?".
 */

export interface SnapFlowState {
  code: string;
  name: string;
  applyUrl: string | null;
  phone: string;
  phoneApplies: boolean | null;
  seniorForm: { name: string; url: string | null } | null;
  paperOnly: boolean;
  paperUrl: string | null;
}

interface Props {
  state: SnapFlowState | null;
  stateName: string | null;
  stateSlug: string | null;
  program: { id: string; name: string; shortName: string | null } | null;
  who: FinderWho | null;
  household: ApplyHousehold;
  income: string | null;
  token: string | null;
}

const TRACKING_KEY = "benefits-finder";
const VARIANT = "apply_along_snap_v1";

const GROUPS: { label: string; items: [string, string, string][] }[] = [
  {
    label: "Health",
    items: [
      ["premium", "Medicare premium", "stethoscope"],
      ["rx", "Prescriptions", "pill"],
      ["doctor", "Doctor visits and copays", "clipboard"],
      ["dental", "Dental", "tooth"],
      ["eyes", "Glasses", "glasses"],
      ["ears", "Hearing aids", "ear"],
      ["rides", "Rides to appointments", "car"],
      ["help", "Help at home", "home-help"],
    ],
  },
  {
    label: "Home",
    items: [
      ["rent", "Rent or mortgage", "house"],
      ["tax", "Property tax and insurance", "money-bag"],
      ["power", "Electric, gas and water", "light-bulb"],
      ["phone", "Phone", "phone"],
    ],
  },
];
const ALL = GROUPS.flatMap((g) => g.items);
// Which progress segment each step fills.
const SEG = [0, 0, 1, 2, 3, 4, 4];

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Panel = null | { kind: "contact"; purpose: "applied" | "later" } | { kind: "stuck" };

const Obj = ({ name, size = 48, className = "" }: { name: string; size?: number; className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={`/images/apply-along/3d/${name}.png`} alt="" width={size} height={size} style={{ width: size, height: size }} className={`shrink-0 ${className}`} />
);

function Dock({ children, bar = false }: { children: React.ReactNode; bar?: boolean }) {
  return <div className={`saf-dock ${bar ? "saf-bar" : ""}`}>{children}</div>;
}
function Cta({ children, onClick, disabled, href }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; href?: string | null }) {
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className="saf-cta">{children}</a>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className="saf-cta">{children}</button>
  );
}
function Ghost({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="saf-ghost">{children}</button>;
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.06em] text-primary-700">{children}</p>;
}
function Title({ children, xl = false }: { children: React.ReactNode; xl?: boolean }) {
  return <h1 className={`m-0 font-display text-gray-900 [text-wrap:balance] ${xl ? "text-[44px] leading-[1.02]" : "text-[34px] leading-[1.08]"}`}>{children}</h1>;
}
function Sub({ children }: { children: React.ReactNode }) {
  return <p className="m-0 -mt-1 text-[18px] text-gray-600">{children}</p>;
}
function Opt({ icon, title, sub, onClick, disabled }: { icon: string; title: string; sub: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="saf-tile saf-row">
      <Obj name={icon} size={46} />
      <span className="flex flex-col"><span className="text-[18px] font-semibold text-gray-900">{title}</span><span className="text-[14px] text-gray-500">{sub}</span></span>
    </button>
  );
}

export default function SnapApplyFlow({ state, stateName, stateSlug, program, who, household, income, token }: Props) {
  const saveKey = `olera-snap-apply:${state?.code ?? "none"}:${program?.id ?? "none"}`;
  const [step, setStep] = useState<Step>(0);
  const [history, setHistory] = useState<Step[]>([]);
  const [gather, setGather] = useState<Record<string, boolean>>({});
  const [costs, setCosts] = useState<Record<string, boolean>>({});
  const [panel, setPanel] = useState<Panel>(null);
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [savedTo, setSavedTo] = useState<"sms" | "email" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const loaded = useRef(false);

  // Voice: the family member applying for someone, or for themselves.
  const v = finderVoice(who);
  const self = who === "me" || !who;
  const them = self ? "you" : v.subject;
  const their = self ? "your" : "their";
  const Their = self ? "Your" : "Their";
  const they = self ? "you" : "they";
  const State = stateName ?? "Your state";
  const stateWord = stateName ?? "your state";
  const programName = state?.name && state.name !== "SNAP" ? state.name : "SNAP";

  const track = (event: "benefits_entry_viewed" | "benefits_step_completed", stepName: string, stepNumber = 0) =>
    trackBenefitsEvent({
      event,
      sessionId: getOrCreateSessionId(),
      stateCode: state?.code ?? null,
      stateName,
      providerName: null,
      providerSlug: TRACKING_KEY,
      variant: VARIANT,
      stepName,
      stepNumber,
      entrySource: "/benefits/apply/snap",
    });

  // Restore their place (a family who opened the state's site comes back here).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(saveKey) || "null");
      if (saved) {
        if (typeof saved.step === "number" && saved.step >= 0 && saved.step <= 5) setStep(saved.step as Step);
        if (saved.gather) setGather(saved.gather);
        if (saved.costs) setCosts(saved.costs);
      }
    } catch {
      // Private window or blocked storage: start fresh.
    }
    loaded.current = true;
    track("benefits_entry_viewed", "entry");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      if (step === 6) localStorage.removeItem(saveKey);
      else localStorage.setItem(saveKey, JSON.stringify({ step, gather, costs }));
    } catch {
      // Storage unavailable: nothing to keep.
    }
  }, [step, gather, costs, saveKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (next: Step) => {
    setHistory((h) => [...h, step]);
    setStep(next);
    setPanel(null);
    setError(null);
    window.scrollTo(0, 0);
  };
  const back = () => {
    if (panel) { setPanel(null); setError(null); return; }
    if (!history.length) return;
    setStep(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    window.scrollTo(0, 0);
  };

  const costCount = Object.keys(costs).length;
  const picked = ALL.filter(([k]) => costs[k]);
  const door = state?.paperOnly
    ? { href: state.paperUrl, label: `Get ${stateWord}'s paper form` }
    : { href: state?.applyUrl ?? null, label: `Open ${stateWord}'s application` };

  const openDoor = () => {
    track("benefits_step_completed", "form_opened", costCount);
    // They come back to "Did it go through?", in this tab or a fresh one.
    try { localStorage.setItem(saveKey, JSON.stringify({ step: 5, gather, costs })); } catch { /* storage unavailable */ }
    setTimeout(() => go(5), 600);
  };

  const sent = async () => {
    track("benefits_step_completed", "applied", costCount);
    setError(null);
    if (!token) {
      setPanel({ kind: "contact", purpose: "applied" });
      return;
    }
    setBusy(true);
    try {
      await recordApplied(token, "state_snap", program?.id ?? null, stateSlug);
      setRecorded(true);
      go(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save that just now.");
    } finally {
      setBusy(false);
    }
  };

  const later = () => {
    track("benefits_step_completed", "later", costCount);
    if (token) { setToast("Saved. Come back any time from your plan, and you'll start where you left off."); return; }
    setPanel({ kind: "contact", purpose: "later" });
  };

  const save = async (purpose: "applied" | "later") => {
    const parsed = parseContact(contact);
    if (!parsed) { setError("Enter a 10-digit mobile number or an email address."); return; }
    if (!program || !state || !stateSlug) { setError("We couldn't tell which state this is for. Go back to your plan and try again."); return; }
    setBusy(true);
    setError(null);
    try {
      const { token: newToken } = await savePlan({ contact: parsed, program, stateCode: state.code, stateSlug, who, household, income, entrySource: "/benefits/apply/snap" });
      if (purpose === "applied" && newToken) {
        await recordApplied(newToken, "state_snap", program.id, stateSlug);
        setRecorded(true);
      }
      track("benefits_step_completed", purpose === "applied" ? "applied_saved" : "saved_for_later", costCount);
      setSavedTo(parsed.email ? "email" : "sms");
      if (purpose === "applied") go(6);
      else { setPanel(null); setToast(`Sent. Open the link ${parsed.email ? "in the email" : "in the text"} when you're ready; you'll start where you left off.`); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save that just now.");
    } finally {
      setBusy(false);
    }
  };

  const seg = SEG[step];

  let body: React.ReactNode;

  if (panel?.kind === "contact") {
    const applied = panel.purpose === "applied";
    body = (
      <section className="saf-screen" key="contact">
        <Title>{applied ? "Where should we check in?" : "Where should we send it?"}</Title>
        <Sub>
          {applied
            ? "We'll ask in a few days whether the interview call came, and help if something's stuck."
            : "A link that brings you back here, where you left off."}
        </Sub>
        <label htmlFor="saf-contact" className="sr-only">Mobile number or email</label>
        <input
          id="saf-contact"
          type="text"
          inputMode="email"
          autoComplete="tel"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Mobile number or email"
          className="min-h-[58px] rounded-2xl border border-gray-300 bg-white px-4 text-[18px] text-gray-900"
        />
        {error ? <p role="alert" className="m-0 text-[15px] text-red-700">{error}</p> : null}
        <p className="m-0 text-[13px] text-gray-500">By texting you agree to messages from Olera about this application. Reply STOP to stop.</p>
        <Dock>
          <Cta onClick={() => void save(panel.purpose)} disabled={busy}>{busy ? "Saving…" : applied ? "Check in with me" : "Send it"}</Cta>
          {applied ? <Ghost onClick={() => { setPanel(null); go(6); }}>Skip</Ghost> : null}
        </Dock>
      </section>
    );
  } else if (panel?.kind === "stuck") {
    body = (
      <section className="saf-screen" key="stuck">
        <Obj name="telephone" size={88} className="saf-float" />
        <Title>Stuck? {State} can help.</Title>
        {state ? (
          <>
            <a href={telHref(state.phone)} className="text-[22px] font-semibold text-primary-800 no-underline">Call {state.phone}</a>
            <Sub>
              {state.phoneApplies === true
                ? `${State} can take the application on this call.`
                : state.phoneApplies === false
                  ? `${State} can't take the application by phone, but can answer questions or mail you a paper form.`
                  : "Ask whether they can take the application on the call. If not, they can mail you a paper form."}
            </Sub>
          </>
        ) : <Sub>Call your state&apos;s SNAP office. They can answer questions or mail you a paper form.</Sub>}
        <Dock>
          <Cta onClick={() => { setPanel(null); later(); }}>Save my place for later</Cta>
          <Ghost onClick={() => setPanel(null)}>Back</Ghost>
        </Dock>
      </section>
    );
  } else if (step === 0) {
    body = (
      <section className="saf-screen" key="s0">
        <div className="flex items-end h-[124px]"><Obj name="pot-of-food" size={108} className="saf-float" /><Obj name="cart" size={88} className="saf-float -ml-3 [animation-delay:.5s]" /></div>
        <Eyebrow>{programName}{stateName ? ` · ${stateName}` : ""}</Eyebrow>
        <Title xl>{self ? "Let's get your groceries covered." : `Let's get groceries covered for ${them}.`}</Title>
        <Sub>
          {programName === "SNAP" ? "SNAP" : `${programName}, ${stateWord}'s SNAP,`} puts money for groceries on a card every month. Here&apos;s how to apply, in a few short steps.
        </Sub>
        <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
          {["Free", `Won't lower ${their} Social Security`, `${Their} home doesn't count`].map((f) => (
            <li key={f} className="text-[15px] text-gray-600 bg-white border border-gray-200 rounded-full px-3.5 py-2"><span className="text-primary-700 font-bold mr-1.5" aria-hidden="true">✓</span>{f}</li>
          ))}
        </ul>
        <Dock>
          <Cta onClick={() => go(1)}>Let&apos;s start</Cta>
          <p className="m-0 text-center text-[12px] text-gray-500">Olera isn&apos;t part of {stateName ? `the State of ${stateName}` : "your state"}. You apply on {stateWord}&apos;s own site.</p>
        </Dock>
      </section>
    );
  } else if (step === 1) {
    const items: [string, string, string, string][] = [
      ["ssn", "id-card", `${Their} Social Security number`, `On ${their} card or a Social Security letter`],
      ["income", "receipt", `What ${they} get each month`, "Social Security, any pension"],
      ["bills", "envelope", "Recent bills", "Rent, utilities, medical"],
    ];
    const n = Object.keys(gather).length;
    body = (
      <section className="saf-screen" key="s1">
        <Eyebrow>Get ready</Eyebrow>
        <Title>Have these nearby.</Title>
        <Sub>Tap each one as you find it.</Sub>
        <div className="flex flex-col gap-2.5">
          {items.map(([k, icon, t, a]) => (
            <button key={k} type="button" aria-pressed={!!gather[k]} onClick={() => setGather((g) => { const x = { ...g }; if (x[k]) delete x[k]; else x[k] = true; return x; })} className={`saf-tile saf-row ${gather[k] ? "saf-on" : ""}`}>
              <Obj name={icon} size={48} />
              <span className="flex flex-col"><span className="text-[17px] font-semibold text-gray-900">{t}</span><span className="text-[14px] text-gray-500">{a}</span></span>
              <span className="saf-check" aria-hidden="true">✓</span>
            </button>
          ))}
        </div>
        <Dock>
          <Cta onClick={() => { track("benefits_step_completed", "gather", n); go(2); }}>{n === 3 ? "Got them all" : "Next"}</Cta>
          {n < 3 ? <Ghost onClick={() => { track("benefits_step_completed", "gather", n); go(2); }}>I&apos;ll find them as I go</Ghost> : null}
        </Dock>
      </section>
    );
  } else if (step === 2) {
    body = (
      <section className="saf-screen" key="s2">
        <Eyebrow>The step most people skip</Eyebrow>
        <Title>{self ? "Which of these do you pay for?" : "Which of these do they pay for?"}</Title>
        <Sub>For someone 60 or older, these lower the income the state counts. Leaving them off can cost {them}.</Sub>
        {GROUPS.map((g) => (
          <div key={g.label} className="flex flex-col gap-2.5">
            <p className="m-0 mt-1 text-[14px] font-semibold uppercase tracking-[0.04em] text-gray-500">{g.label}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {g.items.map(([k, t, icon]) => (
                <button key={k} type="button" aria-pressed={!!costs[k]} onClick={() => setCosts((c) => { const x = { ...c }; if (x[k]) delete x[k]; else x[k] = true; return x; })} className={`saf-tile ${costs[k] ? "saf-on" : ""}`}>
                  <Obj name={icon} size={46} />
                  <span className="text-[16px] font-semibold leading-snug text-gray-900">{t}</span>
                  <span className="saf-check" aria-hidden="true">✓</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <Dock bar>
          <div className="flex-1 min-w-0" aria-live="polite">
            <p className="m-0 font-display text-[28px] leading-none text-gray-900">{costCount}<span className="font-sans text-[15px] text-gray-500"> {costCount === 1 ? "cost" : "costs"} to list</span></p>
            <p className="m-0 mt-1 text-[13px] text-gray-500">Keep a bill for each</p>
          </div>
          <Cta onClick={() => { track("benefits_step_completed", "costs", costCount); go(3); }}>Next</Cta>
        </Dock>
      </section>
    );
  } else if (step === 3) {
    const cards: [string, string, string][] = [
      who === "spouse"
        ? ["writing-hand", "You apply together.", "A married couple living together is one household on the form."]
        : self
          ? ["writing-hand", "Someone can apply with you.", "A family member can fill it in and be named to help you, even with the interview."]
          : ["writing-hand", `You can apply for ${them}.`, `Fill it in yourself. The form can name you to help ${them}, even with the interview.`],
      ["envelope", "A name, address and signature is enough to start.", "If something's missing, send it anyway. The state has 30 days from that day."],
      ["telephone", "There'll be a short interview.", "Usually by phone. Answer it: a missed interview ends the application."],
    ];
    body = (
      <section className="saf-screen" key="s3">
        <Eyebrow>Good to know</Eyebrow>
        <Title>Three things before you start.</Title>
        <div className="flex flex-col gap-2.5">
          {cards.map(([icon, t, d]) => (
            <div key={t} className="flex gap-3.5 items-start bg-white rounded-[20px] p-4 shadow-sm">
              <Obj name={icon} size={44} />
              <div><p className="m-0 text-[17px] font-semibold leading-snug text-gray-900">{t}</p><p className="m-0 mt-1 text-[15px] text-gray-600">{d}</p></div>
            </div>
          ))}
        </div>
        {state?.seniorForm ? (
          <p className="m-0 flex gap-2.5 items-start text-[15px] text-gray-600">
            <Obj name="light-bulb" size={26} />
            <span>
              Everyone in {their} home older, with no wages? Ask about {stateWord}&apos;s shorter form for seniors: {state.seniorForm.name}.
              {state.seniorForm.url ? <> <a href={state.seniorForm.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-800">About it</a></> : null}
            </span>
          </p>
        ) : null}
        <Dock><Cta onClick={() => { track("benefits_step_completed", "know"); go(4); }}>Next</Cta></Dock>
      </section>
    );
  } else if (step === 4) {
    body = (
      <section className="saf-screen" key="s4">
        <Eyebrow>Ready</Eyebrow>
        <Title>{self ? "Your list" : `Your list for ${stateWord}'s form.`}</Title>
        <div className="bg-white rounded-[26px] shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 pt-5 pb-2">
            <Obj name="clipboard" size={44} />
            <div>
              <p className="m-0 font-display text-[23px] leading-tight text-gray-900">{self ? "You" : them.charAt(0).toUpperCase() + them.slice(1)}</p>
              <p className="m-0 text-[14px] text-gray-500">{programName} application{stateName ? ` · ${stateName}` : ""}</p>
            </div>
          </div>
          <dl className="m-0 px-5 pb-3">
            <div className="py-3.5 border-t border-gray-100">
              <dt className="text-[13px] font-semibold uppercase tracking-[0.04em] text-gray-500">Have nearby</dt>
              <dd className="m-0 mt-1 text-[17px] text-gray-900">{Their} Social Security number, what {they} get each month, recent bills</dd>
            </div>
            <div className="py-3.5 border-t border-gray-100">
              <dt className="flex justify-between items-baseline text-[13px] font-semibold uppercase tracking-[0.04em] text-gray-500">
                Costs to list on the form
                <button type="button" onClick={() => go(2)} className="bg-transparent border-none p-0 text-[13px] normal-case tracking-normal font-semibold text-primary-800 cursor-pointer">Edit</button>
              </dt>
              <dd className="m-0 mt-2 flex flex-wrap gap-1.5">
                {picked.length
                  ? picked.map(([k, t, icon]) => (
                      <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 pl-1.5 pr-3 py-1 text-[14px] font-semibold text-gray-900"><Obj name={icon} size={22} />{t}</span>
                    ))
                  : <span className="text-[17px] text-gray-500">None picked. Go back if {they} pay for any.</span>}
              </dd>
            </div>
            <div className="py-3.5 border-t border-gray-100">
              <dt className="text-[13px] font-semibold uppercase tracking-[0.04em] text-gray-500">Keep</dt>
              <dd className="m-0 mt-1 text-[17px] text-gray-900">A bill or receipt for each one</dd>
            </div>
          </dl>
        </div>
        <p className="m-0 flex gap-2.5 items-start text-[15px] text-gray-600">
          <Obj name="lock" size={26} />
          <span>
            {state?.paperOnly
              ? `${State} takes applications on paper. Fill in the form with this list, then mail, fax, email or bring it to a local office.`
              : "Most state sites have you make an account first. Use an email you check. You can save and come back."}
          </span>
        </p>
        <Dock>
          {door.href ? <Cta href={door.href} onClick={openDoor}>{door.label} <span aria-hidden="true">↗</span></Cta> : <p className="m-0 text-center text-[15px] text-gray-600">Call your state&apos;s SNAP office to apply.</p>}
          {program ? <Ghost onClick={later}>Save it for later</Ghost> : null}
        </Dock>
      </section>
    );
  } else if (step === 5) {
    body = (
      <section className="saf-screen" key="s5">
        <Eyebrow>Welcome back</Eyebrow>
        <Title>Did it go through?</Title>
        <div className="flex flex-col gap-2.5">
          <Opt icon="check" title={busy ? "Saving…" : "Yes, it's sent"} sub={`${State} got it`} onClick={() => void sent()} disabled={busy} />
          <Opt icon="hourglass" title="Not yet" sub={token ? "Come back any time from your plan" : "We'll send you a link back here"} onClick={later} disabled={busy} />
          <Opt icon="writing-hand" title="I got stuck" sub={`Who to call at ${stateWord}`} onClick={() => { track("benefits_step_completed", "stuck"); setPanel({ kind: "stuck" }); }} disabled={busy} />
        </div>
        {error ? <p role="alert" className="m-0 text-[15px] text-red-700">{error}</p> : null}
        {state?.applyUrl || state?.paperUrl ? (
          <a href={door.href ?? undefined} target="_blank" rel="noopener noreferrer" className="self-start text-[15px] font-semibold text-primary-800">{door.label} again <span aria-hidden="true">↗</span></a>
        ) : null}
      </section>
    );
  } else {
    body = (
      <section className="saf-screen items-center text-center relative" key="s6">
        <div className="saf-confetti" aria-hidden="true">
          {[["#E8806B", 8, 6, 44, 32], ["#F4C35A", 80, 2, 36, 28], ["#9CC9E6", 88, 30, 28, 22], ["#E8806B", 2, 42, 24, 20], ["#F4C35A", 12, 66, 32, 24], ["#9CC9E6", 82, 62, 38, 30]].map(([c, x, y, w, h], i) => (
            <i key={i} style={{ background: c as string, left: `${x}%`, top: `${y}%`, width: w as number, height: h as number, animationDelay: `${i * 0.4}s` }} />
          ))}
        </div>
        <Obj name="check" size={112} className="saf-float relative" />
        <Title xl>You&apos;re all sent!</Title>
        <Sub>{State} will be in touch about a short interview. Answer it, and the rest follows.</Sub>
        <div className="relative flex gap-2.5 items-start text-left bg-white rounded-[18px] p-4 shadow-sm text-[15px] text-gray-600">
          <Obj name="bell" size={30} />
          <span>
            {recorded
              ? <><b className="text-gray-900">We&apos;ll check in{savedTo ? ` by ${savedTo === "email" ? "email" : "text"}` : ""}.</b> In a few days to see if {stateWord} called, and in a few weeks to hear what they decided. A person on our team reads every reply.</>
              : <><b className="text-gray-900">Watch for {stateWord}&apos;s call or letter.</b> If something gets stuck, {state ? <>call {State} at {state.phone}.</> : "call your state's SNAP office."}</>}
          </span>
        </div>
      </section>
    );
  }

  return (
    <div className="saf">
      <style>{`
        .saf{display:flex;flex-direction:column;min-height:calc(100vh - 9rem)}
        .saf-top{display:flex;align-items:center;gap:10px;min-height:40px}
        .saf-back{width:40px;height:40px;margin-left:-8px;border-radius:999px;border:none;background:transparent;color:#4b5563;font-size:24px;cursor:pointer}
        .saf-progress{flex:1;display:flex;gap:5px}
        .saf-progress i{flex:1;height:5px;border-radius:99px;background:#e5e7eb;overflow:hidden;position:relative}
        .saf-progress i::after{content:"";position:absolute;inset:0;background:#385e5e;transform:scaleX(var(--f,0));transform-origin:left;transition:transform .5s cubic-bezier(.2,.8,.2,1)}
        .saf-screen{flex:1;display:flex;flex-direction:column;gap:18px;padding-top:18px;animation:safRise .42s cubic-bezier(.16,1,.3,1) both}
        @keyframes safRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .saf-float{filter:drop-shadow(0 12px 14px rgba(20,32,31,.18));animation:safBob 3.4s ease-in-out infinite}
        @keyframes safBob{50%{transform:translateY(-6px) rotate(-2deg)}}
        .saf-tile{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:8px;text-align:left;background:#fff;border:1.5px solid #e7e1d8;border-radius:22px;padding:14px 12px 13px;min-height:112px;cursor:pointer;box-shadow:0 1px 2px rgba(20,32,31,.05),0 10px 26px -16px rgba(20,32,31,.25);transition:transform .14s,border-color .2s,background .2s}
        .saf-tile:active{transform:scale(.97)}
        .saf-row{flex-direction:row;align-items:center;min-height:0;padding:14px 16px;gap:14px;width:100%}
        .saf-on{border-color:#385e5e;background:#edf7f7}
        .saf-check{position:absolute;top:11px;right:11px;width:24px;height:24px;border-radius:999px;border:1.5px solid #e7e1d8;background:#fff;display:grid;place-items:center;font-size:13px;color:transparent}
        .saf-row .saf-check{top:50%;transform:translateY(-50%);right:16px}
        .saf-on .saf-check{background:#385e5e;border-color:#385e5e;color:#fff}
        .saf-dock{position:sticky;bottom:0;margin:auto -16px 0;padding:14px 16px calc(14px + env(safe-area-inset-bottom,0px));background:linear-gradient(to top,#f9f6f2 80%,rgba(249,246,242,0));display:flex;flex-direction:column;gap:8px;z-index:5}
        .saf-bar{flex-direction:row;align-items:center;gap:14px;background:#f9f6f2;border-top:1px solid #e7e1d8}
        .saf-cta{min-height:58px;border-radius:999px;border:none;background:#385e5e;color:#fff;font-size:18px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 26px;text-decoration:none;cursor:pointer;transition:transform .12s}
        .saf-cta:active{transform:scale(.98)}
        .saf-cta:disabled{opacity:.6}
        .saf-ghost{min-height:46px;border:none;background:transparent;color:#385e5e;font-size:16px;font-weight:600;cursor:pointer}
        .saf :focus-visible{outline:3px solid #96c8c8;outline-offset:2px}
        .saf-confetti{position:absolute;inset:-10px -16px;pointer-events:none;overflow:hidden}
        .saf-confetti i{position:absolute;border-radius:50% 46% 54% 40%;opacity:.9;animation:safDrift 5s ease-in-out infinite}
        @keyframes safDrift{50%{transform:translateY(10px) rotate(14deg)}}
        .saf-toast{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);background:#101828;color:#fff;font-size:15px;padding:12px 16px;border-radius:14px;z-index:30;width:max-content;max-width:min(400px,calc(100% - 32px))}
        /* Wider screens: the next move sits right under the content (Typeform on
           desktop); pinning to the bottom is a phone pattern, where the thumb is.
           The long costs screen keeps a floating bar so Next never leaves view. */
        @media (min-width:768px){
          .saf{min-height:0}
          .saf-screen{flex:0 0 auto}
          .saf-dock{position:static;margin:10px 0 0;padding:0;background:none}
          .saf-bar{position:sticky;bottom:20px;margin-top:14px;background:#fff;border:none;border-radius:22px;padding:12px 12px 12px 20px;box-shadow:0 12px 32px -12px rgba(16,24,40,.3)}
        }
        @media (prefers-reduced-motion:reduce){.saf *{animation:none!important;transition:none!important}}
      `}</style>
      <div className="saf-top">
        <button type="button" className="saf-back" aria-label="Back" onClick={back} style={{ visibility: step === 0 && !panel ? "hidden" : "visible" }}>←</button>
        <div className="saf-progress" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ ["--f" as string]: i < seg ? 1 : i === seg ? (step === 6 ? 1 : 0.5) : 0 }} />)}
        </div>
      </div>
      {body}
      {toast ? <div className="saf-toast" role="status">{toast}</div> : null}
    </div>
  );
}
