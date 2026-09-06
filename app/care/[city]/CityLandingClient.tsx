"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CityConfig, CityCareType, CityRecipient, CityUrgency } from "@/lib/city-ads/config";
import { CITY_FORM_VERSION } from "@/lib/city-ads/config";
import { getOrCreateSessionId } from "@/lib/analytics/session";

export interface CityProviderCard {
  name: string;
  town: string;
  careLabel: string;
  verified: boolean;
  photo: string | null;
}

interface Utm {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  gclid: string | null;
}

type Step = "intro" | "who" | "what" | "when" | "contact" | "done";

const WHO: { v: CityRecipient; label: string }[] = [
  { v: "parent", label: "My parent" },
  { v: "spouse", label: "My spouse or partner" },
  { v: "self", label: "Me" },
  { v: "other", label: "Someone else" },
];

const WHAT: { v: CityCareType; label: string; sub: string }[] = [
  { v: "home_care", label: "Help at home", sub: "A caregiver comes to them" },
  { v: "assisted_living", label: "Assisted living or a care home", sub: "They move somewhere with support" },
  { v: "unsure", label: "Not sure yet", sub: "We will help you work it out" },
  { v: "medical", label: "Nursing or medical care at home", sub: "We will point you to the right place" },
];

const WHEN: { v: CityUrgency; label: string }[] = [
  { v: "this_week", label: "This week" },
  { v: "this_month", label: "This month" },
  { v: "planning", label: "Planning ahead" },
];

const PAY = [
  { v: "private_pay", label: "Private pay" },
  { v: "medicaid", label: "Medicaid" },
  { v: "va", label: "VA" },
  { v: "ltc_insurance", label: "LTC insurance" },
  { v: "unsure", label: "Not sure" },
];

export default function CityLandingClient({
  cfg,
  providers,
  utm,
}: {
  cfg: CityConfig;
  providers: CityProviderCard[];
  utm: Utm;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [who, setWho] = useState<CityRecipient | null>(null);
  const [what, setWhat] = useState<CityCareType | null>(null);
  const [when, setWhen] = useState<CityUrgency | null>(null);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState(cfg.zipPrefill);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ leadId: string; redirected: boolean; staffed?: boolean } | null>(null);
  const [payment, setPayment] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const stepIndex = useMemo(() => ({ intro: 0, who: 1, what: 2, when: 3, contact: 4, done: 5 })[step], [step]);

  useEffect(() => {
    if (step !== "intro") topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const submit = async () => {
    setError(null);
    if (!firstName.trim()) return setError("Add your first name.");
    if (phone.replace(/\D/g, "").length < 10) return setError("Add a mobile number so the provider can call you.");
    if (!consent) return setError("Tick the box so a provider can contact you.");
    setBusy(true);
    try {
      const res = await fetch("/api/city-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: cfg.slug,
          careRecipient: who,
          careType: what,
          urgency: when,
          zip,
          firstName: firstName.trim(),
          phone,
          email: email.trim() || null,
          consent,
          utm,
          sessionId: safeSession(),
          formVersion: CITY_FORM_VERSION,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setResult({ leadId: data.leadId, redirected: Boolean(data.redirected), staffed: data.staffed });
      setStep("done");
    } catch {
      setError("Could not reach Olera. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const patch = async (fields: Record<string, unknown>) => {
    if (!result) return;
    try {
      await fetch("/api/city-leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: result.leadId, phone, ...fields }),
      });
    } catch {
      /* best effort */
    }
  };

  const pick = <T,>(setter: (v: T) => void, next: Step) => (v: T) => {
    setter(v);
    setStep(next);
  };

  return (
    <div className="min-h-screen bg-vanilla-50 text-gray-900">
      <div ref={topRef} />
      <div className="mx-auto max-w-md px-5 pb-16 pt-5 sm:max-w-lg">
        <header className="flex items-center justify-between text-sm">
          <span className="font-semibold tracking-wide text-primary-700">Olera</span>
          <span className="text-gray-500">
            {step === "intro" || step === "done" ? `${cfg.city}, ${cfg.state}` : `Step ${stepIndex} of 4`}
          </span>
        </header>

        {step !== "intro" && step !== "done" && (
          <div className="mt-4 flex gap-1.5" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <i key={i} className={`h-1 w-7 rounded-full ${i <= stepIndex ? "bg-primary-700" : "bg-primary-100"}`} />
            ))}
          </div>
        )}

        {step === "intro" && (
          <section>
            <h1 className="mt-8 font-display text-[2rem] leading-[1.1] text-gray-900 sm:text-[2.4rem]">
              Looking for senior care in {cfg.city}?
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
              Tell us what you need. A licensed local provider will call you back. Free for families.
            </p>
            <button
              type="button"
              onClick={() => setStep("who")}
              className="mt-6 block w-full rounded-xl bg-primary-700 px-4 py-3.5 text-center text-base font-semibold text-white hover:bg-primary-600 active:bg-primary-800"
            >
              Start, it takes 2 minutes
            </button>
            <p className="mt-4 text-xs leading-relaxed text-gray-500">
              <b className="font-semibold text-gray-600">Home care and assisted living</b> · Serving {cfg.areaLabel} · We share
              your request with one local provider at a time. Never sold.
            </p>

            {providers.length > 0 && (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Local providers on Olera</p>
                <ul className="mt-2 space-y-2">
                  {providers.map((p) => (
                    <li key={p.name} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                      <Avatar name={p.name} photo={p.photo} />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold">{p.name}</div>
                        <div className="mt-0.5 text-xs text-gray-600">
                          {p.careLabel} · {p.town}
                          {p.verified ? " · Verified on Olera" : ""}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 text-sm leading-relaxed text-gray-600">
              <p className="font-semibold text-gray-800">What happens next</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                <li>You answer four quick questions.</li>
                <li>We ask a local provider to take your request. You get a text with their name.</li>
                <li>They call you. If it is not a fit, we send the next one.</li>
              </ol>
            </div>

            <footer className="mt-10 border-t border-gray-200 pt-4 text-[11px] leading-relaxed text-gray-500">
              Olera, Inc. · olera.care · support@olera.care ·{" "}
              <Link className="underline" href="/privacy">
                Privacy
              </Link>{" "}
              ·{" "}
              <Link className="underline" href="/terms">
                Terms
              </Link>
              . Olera is a free matching service for families. Providers are independent businesses.
            </footer>
          </section>
        )}

        {step === "who" && (
          <section>
            <h2 className="mt-5 font-display text-2xl leading-tight">Who needs care?</h2>
            <div className="mt-3 space-y-2">
              {WHO.map((o) => (
                <Option key={o.v} label={o.label} selected={who === o.v} onClick={() => pick(setWho, "what")(o.v)} />
              ))}
            </div>
          </section>
        )}

        {step === "what" && (
          <section>
            <h2 className="mt-5 font-display text-2xl leading-tight">What kind of help?</h2>
            <div className="mt-3 space-y-2">
              {WHAT.map((o) => (
                <Option key={o.v} label={o.label} sub={o.sub} selected={what === o.v} onClick={() => pick(setWhat, "when")(o.v)} />
              ))}
            </div>
            <Back onClick={() => setStep("who")} />
          </section>
        )}

        {step === "when" && (
          <section>
            <h2 className="mt-5 font-display text-2xl leading-tight">How soon?</h2>
            <div className="mt-3 space-y-2">
              {WHEN.map((o) => (
                <Option key={o.v} label={o.label} selected={when === o.v} onClick={() => pick(setWhen, "contact")(o.v)} />
              ))}
            </div>
            <Back onClick={() => setStep("what")} />
          </section>
        )}

        {step === "contact" && (
          <section>
            <h2 className="mt-5 font-display text-2xl leading-tight">Where should they call?</h2>
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <Field label="First name">
                <input
                  className={inputCls}
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={60}
                />
              </Field>
              <Field label="Mobile number" hint="So the provider can call you. We never sell your number.">
                <input
                  className={inputCls}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(704) 555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
              <Field label="ZIP">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                />
              </Field>
              <Field label="Email (optional)">
                <input
                  className={inputCls}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <label className="flex items-start gap-2.5 pt-1 text-[11.5px] leading-snug text-gray-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-400 accent-primary-700"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  I agree that Olera and the {cfg.city} area care provider it matches me with (one at a time, up to three)
                  may call or text me at this number about my request, including with automated technology. Consent is
                  not a condition of service. Msg and data rates may apply. Reply STOP to opt out.
                </span>
              </label>

              {error && (
                <p role="alert" className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="block w-full rounded-xl bg-primary-700 px-4 py-3.5 text-center text-base font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
              >
                {busy ? "Sending…" : `Get my ${cfg.city} match`}
              </button>
            </form>
            <Back onClick={() => setStep("when")} />
          </section>
        )}

        {step === "done" && result && (
          <section>
            <div className="mt-6 flex h-11 w-11 items-center justify-center rounded-full bg-success-50 text-xl text-success-700">✓</div>
            {result.redirected ? (
              <>
                <h2 className="mt-4 font-display text-2xl leading-tight">Thanks, {firstName.trim()}. This one is outside what we arrange.</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                  Olera arranges non-medical help at home and assisted living. For nursing or medical care at home, ask the
                  hospital discharge planner or the doctor for a home health referral. Medicare usually covers it. If you
                  also need help with daily life at home, you can start again and pick &ldquo;Help at home&rdquo;.
                </p>
                <button type="button" onClick={() => window.location.reload()} className="mt-5 block w-full rounded-xl border border-primary-300 bg-white px-4 py-3 text-center text-[15px] font-semibold text-primary-700">
                  Start again
                </button>
              </>
            ) : (
              <>
                <h2 className="mt-4 font-display text-2xl leading-tight">Thanks, {firstName.trim()}. We are finding your match.</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                  {result.staffed === false
                    ? `It is after hours here, so a ${cfg.city} provider will confirm in the morning and call you tomorrow. We will text you their name first.`
                    : `We are asking a ${cfg.city} provider to take your request now. Within the hour you will get a text with their name and the number they will call from.`}
                </p>

                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-600">How would care be paid for? (optional, helps the match)</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PAY.map((p) => (
                      <button
                        key={p.v}
                        type="button"
                        onClick={() => {
                          setPayment(p.v);
                          void patch({ paymentType: p.v });
                        }}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          payment === p.v ? "border-primary-700 bg-primary-50 text-primary-800" : "border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-xs font-semibold text-gray-600">Anything they should know? (optional)</label>
                  <textarea
                    className={`${inputCls} mt-1 min-h-[72px]`}
                    placeholder="Mom is 84, just home from the hospital after a fall, needs help mornings and evenings…"
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      setNoteSaved(false);
                    }}
                    maxLength={600}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void patch({ note });
                      setNoteSaved(true);
                    }}
                    className="mt-2 block w-full rounded-xl border border-primary-300 bg-white px-4 py-2.5 text-center text-[15px] font-semibold text-primary-700"
                  >
                    {noteSaved ? "Saved" : "Add note"}
                  </button>
                </div>

                <p className="mt-6 text-sm leading-relaxed text-gray-600">
                  What happens next: a provider accepts, we text you who it is, they call. If they do not, or it is not a
                  fit, reply to our text and we offer your request to the next one. Nothing is booked or charged.
                </p>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-gray-500">{hint}</span>}
    </label>
  );
}

function Option({ label, sub, selected, onClick }: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-xl border px-4 py-3 text-left text-base ${
        selected ? "border-primary-700 bg-primary-50 ring-1 ring-primary-700" : "border-gray-300 bg-white hover:border-primary-400"
      }`}
    >
      <span className="block">{label}</span>
      {sub && <span className="mt-0.5 block text-xs text-gray-500">{sub}</span>}
    </button>
  );
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-sm font-semibold text-primary-800">
      {photo ? <Image src={photo} alt="" fill sizes="44px" className="object-cover" /> : initials}
    </span>
  );
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-5 text-sm text-gray-500 underline-offset-2 hover:underline">
      Back
    </button>
  );
}

function safeSession(): string | null {
  try {
    return getOrCreateSessionId();
  } catch {
    return null;
  }
}
