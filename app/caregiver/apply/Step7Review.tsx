"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProfileFormState } from "./Step2Profile";
import type { IdentityFormState } from "./Step3Identity";
import type { BackgroundFormState } from "./Step4Background";
import type { StudentFormState } from "./Step5Student";
import type { AvailabilityFormState } from "./Step6Availability";

/* ─── Helpers ─────────────────────────────────────────────── */

const EXPERIENCE_LABELS: Record<string, string> = {
  first_time: "First time",
  some: "Some experience (1-2 years)",
  several: "Several years (3-5 years)",
  extensive: "Extensive experience (5+ years)",
};

const VERIFY_METHOD_LABELS: Record<string, string> = {
  edu: ".edu email verification",
  id: "Student ID upload",
  document: "Enrollment document upload",
};

const DAY_FULL: Record<string, string> = {
  Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday",
};

/* ─── Shared UI ───────────────────────────────────────────── */

function ReviewCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 sm:w-32 flex-shrink-0 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: "submitted" | "pending" | "awaiting" }) {
  if (status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-medium text-primary-700">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Submitted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-50 border border-warning-100 text-xs font-medium text-warning-700">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      {status === "awaiting" ? "Awaiting payment" : "Pending"}
    </span>
  );
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">{item}</span>
      ))}
    </div>
  );
}

/* ─── Conduct Items ───────────────────────────────────────── */

const CONDUCT_ITEMS = [
  "I will not administer medications, only provide reminders",
  "I will not perform medical procedures or transfer non-ambulatory clients",
  "I will check in via QR code at every visit",
  "I will communicate respectfully and professionally",
  "I will give 24 hours notice if I need to cancel a visit",
  "I will report any safety concerns to Olera immediately",
];

/* ─── Component ───────────────────────────────────────────── */

export default function Step7Review({
  form,
  profile,
  identity,
  background,
  student,
  availability,
  onGoTo,
  onBack,
}: {
  form: { email: string; firstName: string; lastName: string };
  profile: ProfileFormState;
  identity: IdentityFormState;
  background: BackgroundFormState;
  student: StudentFormState;
  availability: AvailabilityFormState;
  onGoTo: (step: number) => void;
  onBack: () => void;
}) {
  const [conductChecks, setConductChecks] = useState<boolean[]>(new Array(CONDUCT_ITEMS.length + 1).fill(false));
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardZip, setCardZip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const allConductChecked = conductChecks.every(Boolean);
  const paymentFilled = cardNumber.length >= 15 && cardExpiry.length >= 4 && cardCvc.length >= 3;
  const canSubmit = true; // TODO: re-enable when Stripe is live → allConductChecked && paymentFilled

  const toggleConduct = (index: number) => {
    setConductChecks((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 2000);
  };

  /* ── Profile completeness ── */
  const boostItems: { label: string; step: number }[] = [];
  if (!profile.videoPreview) boostItems.push({ label: "Add a video intro (caregivers with videos get 3x more requests)", step: 2 });
  if (!profile.whyCare) boostItems.push({ label: "Write about why you want to provide care", step: 2 });
  if (profile.careSpecialties.length < 3) boostItems.push({ label: "Add more care specialties", step: 3 });
  if (profile.languages.length < 2) boostItems.push({ label: "Add another language you speak", step: 3 });
  if (profile.aboutMe.length < 200) boostItems.push({ label: "Expand your 'About me' section", step: 2 });
  const profileComplete = boostItems.length === 0;

  /* Recurring availability summary */
  const recurringDays = Object.entries(availability.recurringDays || {}).filter(([, slots]) => slots.length > 0);
  const dateSlotCount = Object.values(availability.dateSlots || {}).filter((slots) => slots.length > 0).length;

  /* ── Submitted success state ── */
  if (submitted) {
    const fullName = `${form.firstName} ${form.lastName}`.trim() || "New Caregiver";
    const initials = fullName.split(" ").map((n) => n[0]).join("").toUpperCase();
    const specialties = profile.careSpecialties.slice(0, 3);
    const completedCount = [
      true, // application
      true, // payment
    ].filter(Boolean).length;
    const totalChecks = 5;

    return (
      <div className="max-w-4xl mx-auto">
        {/* Confetti burst — CSS-only celebration */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-8 sm:p-12 mb-8 text-center">
          {/* Sparkle dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              "top-4 left-[10%]", "top-8 left-[25%]", "top-3 left-[45%]", "top-6 left-[65%]", "top-4 left-[80%]",
              "top-12 left-[15%]", "top-16 left-[35%]", "top-10 left-[55%]", "top-14 left-[75%]", "top-8 left-[90%]",
              "bottom-8 left-[8%]", "bottom-4 left-[30%]", "bottom-10 left-[50%]", "bottom-6 left-[70%]", "bottom-4 left-[88%]",
            ].map((pos, i) => (
              <div
                key={i}
                className={`absolute ${pos} w-1.5 h-1.5 rounded-full opacity-40`}
                style={{
                  backgroundColor: ["#fbbf24", "#f472b6", "#a78bfa", "#34d399", "#60a5fa", "#fb923c"][i % 6],
                  animation: `sparkle ${1.5 + (i % 3) * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes sparkle {
              0%, 100% { opacity: 0.2; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.8); }
            }
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes scaleIn {
              from { opacity: 0; transform: scale(0.8); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>

          {/* Animated check */}
          <div
            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 ring-4 ring-white/10"
            style={{ animation: "scaleIn 0.5s ease-out" }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1
            className="font-serif text-3xl sm:text-5xl font-bold text-white mb-3"
            style={{ animation: "slideUp 0.6s ease-out 0.2s both" }}
          >
            You&apos;re in!
          </h1>
          <p
            className="text-base text-white/80 max-w-lg mx-auto"
            style={{ animation: "slideUp 0.6s ease-out 0.4s both" }}
          >
            Your application is submitted. We&apos;re reviewing your info and running verifications now.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column — Profile glance */}
          <div className="lg:col-span-2 space-y-5">
            {/* Profile preview card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              {/* Cover gradient */}
              <div className="h-20 bg-gradient-to-r from-primary-400 to-primary-600 relative">
                <div className="absolute -bottom-8 left-5">
                  <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-sm flex items-center justify-center overflow-hidden">
                    {profile.photoPreview ? (
                      <img src={profile.photoPreview} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-700">{initials}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-12 px-5 pb-5">
                <h3 className="text-lg font-bold text-gray-900">{fullName}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {student.school && student.school !== "Other" ? student.school : "Student caregiver"}
                  {student.program && student.program !== "Other" && <> &middot; {student.program}</>}
                </p>

                {/* Rate + availability */}
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-semibold text-primary-700">
                    ${availability.hourlyRate}/hr
                  </span>
                  {availability.travelDistance > 0 && (
                    <span className="text-xs text-gray-400">
                      {availability.travelDistance === 25 ? "25+" : availability.travelDistance} mi radius
                    </span>
                  )}
                </div>

                {/* Specialties */}
                {specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {specialties.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium text-gray-600">{s}</span>
                    ))}
                    {profile.careSpecialties.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium text-gray-400">+{profile.careSpecialties.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Bio snippet */}
                {profile.aboutMe && (
                  <p className="text-xs text-gray-500 mt-3 line-clamp-3 leading-relaxed">
                    {profile.aboutMe}
                  </p>
                )}

                {/* Languages */}
                {profile.languages.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Speaks {profile.languages.join(", ")}
                  </p>
                )}
              </div>
              <div className="border-t border-gray-100 px-5 py-3">
                <p className="text-[11px] text-gray-400 text-center">This is how families will see your profile</p>
              </div>
            </div>

            {/* Boost your profile */}
            {!profileComplete && (
              <div className="bg-vanilla-50 rounded-2xl border border-vanilla-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Boost your profile</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Complete profiles get up to 3x more requests.
                </p>
                <div className="space-y-2">
                  {boostItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-warning-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">{item.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onGoTo(item.step)}
                        className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors flex-shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profileComplete && (
              <div className="bg-primary-50 rounded-2xl border border-primary-100 p-5 text-center">
                <svg className="w-7 h-7 text-primary-500 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
                <p className="text-sm font-semibold text-primary-800">Profile looks great!</p>
              </div>
            )}
          </div>

          {/* Right column — Status + next steps */}
          <div className="lg:col-span-3 space-y-5">
            {/* Verification progress */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Verification status</h3>
                <span className="text-xs font-medium text-gray-400">{completedCount}/{totalChecks} complete</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(completedCount / totalChecks) * 100}%` }}
                />
              </div>
              <div className="space-y-3">
                {[
                  { label: "Application submitted", done: true },
                  { label: "Payment processed", done: true },
                  { label: "Identity verification", done: false, note: "Usually 1-2 business days" },
                  { label: "Background check", done: false, note: "Usually 2-3 business days" },
                  { label: "Student verification", done: false, note: "Usually 1 business day" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 py-1.5">
                    {item.done ? (
                      <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-warning-50 border border-warning-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${item.done ? "text-gray-900" : "text-gray-700"}`}>{item.label}</p>
                      {item.note && <p className="text-xs text-gray-400">{item.note}</p>}
                    </div>
                    {item.done && (
                      <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                We&apos;ll email you as each check clears. Once all three are complete, your profile goes live.
              </p>
            </div>

            {/* What to expect */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
              <h3 className="text-base font-semibold text-gray-900 mb-4">What happens next</h3>
              <div className="space-y-4">
                {[
                  { icon: "M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75", text: "We'll email you when each verification clears", detail: "Check your inbox over the next few days" },
                  { icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0", text: "Your profile goes live", detail: "Families in your area will be able to find and request you" },
                  { icon: "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0", text: "You get notified for every request", detail: "Accept or decline on your own schedule" },
                  { icon: "M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z", text: "Start earning within the first week", detail: "Most caregivers get their first request in days" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4.5 h-4.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.text}</p>
                      <p className="text-xs text-gray-400">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href={`/caregiver/dashboard?name=${encodeURIComponent(form.firstName)}`}
                className="w-full sm:flex-1 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-[15px] font-semibold rounded-xl transition-colors shadow-sm shadow-primary-600/20 text-center"
              >
                Go to my dashboard
              </Link>
              <button type="button" className="w-full sm:flex-1 px-8 py-3.5 border border-gray-200 hover:border-gray-300 text-[15px] font-semibold text-gray-700 rounded-xl transition-colors text-center">
                Refer a friend, earn $50
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading state ── */
  if (submitting) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <svg className="w-8 h-8 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Processing your application...</h2>
        <p className="text-sm text-gray-500">This will only take a moment.</p>
      </div>
    );
  }

  /* ── Review form ── */
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
          Review and submit
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Make sure everything looks right. You can edit any section before submitting.
        </p>
      </div>

      <div className="space-y-4">

        {/* ── Card 1: Account ── */}
        <ReviewCard title="Account" onEdit={() => onGoTo(1)}>
          <Field label="Name" value={`${form.firstName} ${form.lastName}`.trim() || "Not provided"} />
          <Field label="Email" value={form.email || "Not provided"} />
        </ReviewCard>

        {/* ── Card 2: About you ── */}
        <ReviewCard title="About you" onEdit={() => onGoTo(2)}>
          <div className="flex items-start gap-4 mb-3">
            {profile.photoPreview ? (
              <img src={profile.photoPreview} alt="Profile" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {profile.aboutMe ? (
                <div>
                  <p className="text-sm text-gray-700">
                    {aboutExpanded || profile.aboutMe.length <= 150
                      ? profile.aboutMe
                      : `${profile.aboutMe.slice(0, 150)}...`}
                  </p>
                  {profile.aboutMe.length > 150 && (
                    <button
                      type="button"
                      onClick={() => setAboutExpanded(!aboutExpanded)}
                      className="text-xs text-primary-600 font-medium mt-1"
                    >
                      {aboutExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No bio added</p>
              )}
            </div>
          </div>
          {profile.careSpecialties.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Specialties</span>
              <div className="mt-1.5"><Chips items={profile.careSpecialties} /></div>
            </div>
          )}
          <Field label="Experience" value={EXPERIENCE_LABELS[profile.experienceLevel]} />
          {profile.languages.length > 0 && <Field label="Languages" value={profile.languages.join(", ")} />}
          {profile.hobbies.length > 0 && <Field label="Hobbies" value={profile.hobbies.join(", ")} />}
          {profile.videoPreview && (
            <div className="mt-2 pt-2 border-t border-gray-50">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Video intro</span>
              <div className="mt-1.5 rounded-xl overflow-hidden bg-black max-w-xs">
                <video src={profile.videoPreview} controls className="w-full max-h-32 object-contain" />
              </div>
            </div>
          )}
        </ReviewCard>

        {/* ── Card 3: Experience ── */}
        {profile.workExperience.length > 0 && (
          <ReviewCard title="Work experience" onEdit={() => onGoTo(3)}>
            <div className="space-y-2">
              {profile.workExperience.map((job, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.company} &middot; {job.startYear}&ndash;{job.current ? "Present" : job.endYear}</p>
                  </div>
                </div>
              ))}
            </div>
          </ReviewCard>
        )}

        {/* ── Card 4: Verification ── */}
        <ReviewCard title="Identity and student verification" onEdit={() => onGoTo(4)}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Identity verification</span>
              <StatusBadge status={identity.submitted ? "submitted" : "pending"} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-700">Student verification</span>
                {student.school && <p className="text-xs text-gray-400">{student.school === "Other" ? student.schoolOther : student.school} &middot; {student.year} &middot; {student.program === "Other" ? student.programOther : student.program}</p>}
                {student.verifyMethod && <p className="text-xs text-gray-400">{VERIFY_METHOD_LABELS[student.verifyMethod]}</p>}
              </div>
              <StatusBadge status={student.submitted ? "submitted" : "pending"} />
            </div>
          </div>
        </ReviewCard>

        {/* ── Card 5: Background check ── */}
        <ReviewCard title="Background check" onEdit={() => onGoTo(5)}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Background check</span>
            <StatusBadge status={background.submitted ? "submitted" : "awaiting"} />
          </div>
          {background.legalName && <Field label="Legal name" value={background.legalName} />}
          {!background.submitted && (
            <p className="text-xs text-gray-400 mt-2">The background check will run after payment is processed below.</p>
          )}
        </ReviewCard>

        {/* ── Card 6: Availability ── */}
        <ReviewCard title="Availability and rates" onEdit={() => onGoTo(6)}>
          {recurringDays.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Recurring</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {recurringDays.map(([day, slots]) => (
                  <span key={day} className="px-2.5 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-medium text-primary-700">
                    Every {DAY_FULL[day]} {slots.map((s) => `${s.start}–${s.end}`).join(", ")}
                  </span>
                ))}
              </div>
            </div>
          )}
          {dateSlotCount > 0 && <Field label="Specific dates" value={`${dateSlotCount} date${dateSlotCount > 1 ? "s" : ""} with times set`} />}
          <Field label="Hourly rate" value={`$${availability.hourlyRate}/hour`} />
          {availability.showOvernightRate && <Field label="Overnight rate" value={`$${availability.overnightRate}/hour`} />}
          <Field label="Visit length" value={`${availability.minVisit} – ${availability.maxVisit}`} />
          {availability.overnightVisits && <Field label="Overnight" value="Available for overnight visits" />}
          <Field label="Travel radius" value={`${availability.travelDistance === 25 ? "25+" : availability.travelDistance} miles`} />
          {availability.zipCode && <Field label="Zip code" value={availability.zipCode} />}
        </ReviewCard>

        {/* ── Card 7: Driver's license (conditional) ── */}
        {availability.willDrive && (
          <ReviewCard title="Driver's license and insurance" onEdit={() => onGoTo(6)}>
            {availability.licenseNumber && <Field label="License" value={`${availability.licenseState} ${availability.licenseNumber}`} />}
            {availability.licenseExpiry && <Field label="Expires" value={availability.licenseExpiry} />}
            {availability.vehicleMake && <Field label="Vehicle" value={`${availability.vehicleYear} ${availability.vehicleMake} ${availability.vehicleModel}`} />}
            {availability.insuranceCarrier && <Field label="Insurance" value={`${availability.insuranceCarrier} — ${availability.insurancePolicyNumber}`} />}
            <Field label="Acknowledgment" value={availability.driveAcknowledgment ? "Confirmed" : "Not confirmed"} />
          </ReviewCard>
        )}

        {/* ── Payment section ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Pay for your background check</h3>
          <p className="text-sm text-gray-400 mb-5">
            One-time fee of <span className="font-semibold text-gray-700">$34.99</span>. Covers your background check and identity verification.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Card number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                placeholder="4242 4242 4242 4242"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiration</label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d/]/g, "").slice(0, 5))}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CVC</label>
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing ZIP</label>
                <input
                  type="text"
                  value={cardZip}
                  onChange={(e) => setCardZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="77001"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Your card will only be charged once when you submit. We use Stripe for secure payment processing.
          </div>
        </div>

        {/* ── Code of conduct ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Code of conduct</h3>
          <p className="text-sm text-gray-400 mb-5">Please acknowledge each item to continue.</p>

          <div className="space-y-3">
            {CONDUCT_ITEMS.map((item, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conductChecks[i]}
                  onChange={() => toggleConduct(i)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  style={{ accentColor: "#4d8a8a" }}
                />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-gray-100">
              <input
                type="checkbox"
                checked={conductChecks[CONDUCT_ITEMS.length]}
                onChange={() => toggleConduct(CONDUCT_ITEMS.length)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  style={{ accentColor: "#4d8a8a" }}
              />
              <span className="text-sm text-gray-700">
                I accept Olera&apos;s{" "}
                <Link href="/terms" className="text-primary-600 font-medium hover:text-primary-700">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-primary-600 font-medium hover:text-primary-700">Privacy Policy</Link>
              </span>
            </label>
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div className="text-center pt-4 pb-2">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Ready to make a difference?
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Submit your application and pay $34.99 for the background check. You&apos;ll hear back within 3 business days.
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full sm:w-auto px-10 py-4 rounded-xl text-[15px] font-semibold transition-colors shadow-sm ${
              canSubmit
                ? "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Start caring, start earning
          </button>
          <p className="text-xs text-gray-400 mt-3">
            By clicking, you authorize a $34.99 charge for the background check.
          </p>
        </div>
      </div>
    </div>
  );
}
