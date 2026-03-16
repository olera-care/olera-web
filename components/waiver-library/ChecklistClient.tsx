"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "olera-doc-checklist";

const CHECKLIST_CATEGORIES = [
  {
    name: "Identity & Personal",
    icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0",
    items: [
      "Government-issued photo ID",
      "Social Security card",
      "Birth certificate",
      "Marriage certificate (if applicable)",
      "Passport-size photo",
    ],
  },
  {
    name: "Medical & Health",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    items: [
      "Medical records or doctor's statement",
      "Diagnosis or disability documentation",
      "Current medication list",
      "Health insurance card (Medicare/Medicaid)",
    ],
  },
  {
    name: "Financial & Income",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    items: [
      "Proof of income (pay stubs, tax return, SSI letter)",
      "Bank statements (last 3 months)",
      "Proof of assets (property, investments)",
      "Proof of expenses (rent, utilities, medical bills)",
    ],
  },
  {
    name: "Residency & Housing",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    items: [
      "Proof of state residency (utility bill, lease)",
      "Current living arrangement documentation",
      "Proof of U.S. citizenship or immigration status",
    ],
  },
];

export function ChecklistClient({
  programName,
  programShortName,
  stateName,
}: {
  programName: string;
  programShortName: string;
  stateName: string;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
    } catch { /* ignore */ }
  }, [checked, loaded]);

  function toggle(item: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  const totalItems = CHECKLIST_CATEGORIES.reduce((s, c) => s + c.items.length, 0);
  const checkedCount = checked.size;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  async function handleEmail() {
    if (!email) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/benefits/email-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          programName,
          programShortName,
          stateName,
          checked: [...checked],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {/* Email to yourself */}
      <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl border border-primary-100 p-6 mb-6 shadow-[0_8px_30px_rgba(25,128,135,0.12),0_2px_8px_rgba(25,128,135,0.08)] ring-1 ring-primary-200/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-600/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Email this checklist to yourself</h3>
        </div>

        {sent ? (
          <div className="flex items-center gap-2 text-success-600 bg-success-50 rounded-xl px-4 py-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium">Checklist sent! Check your inbox.</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onKeyDown={(e) => e.key === "Enter" && handleEmail()}
            />
            <button
              onClick={handleEmail}
              disabled={sending || !email}
              className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-600/30 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 shrink-0"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        )}
        {error && (
          <p className="mt-2 text-sm text-error-600">{error}</p>
        )}
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {CHECKLIST_CATEGORIES.map((category) => {
          const catChecked = category.items.filter((i) => checked.has(i)).length;
          const allDone = catChecked === category.items.length;

          return (
            <div
              key={category.name}
              className={`bg-white rounded-xl border p-5 transition-colors ${
                allDone ? "border-success-200 bg-success-50/30" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    allDone ? "bg-success-100" : "bg-primary-50"
                  }`}>
                    {allDone ? (
                      <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.icon} />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {catChecked}/{category.items.length}
                </span>
              </div>

              <div className="space-y-1">
                {category.items.map((item) => {
                  const isChecked = checked.has(item);
                  return (
                    <label
                      key={item}
                      className={`flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 transition-colors ${
                        isChecked ? "bg-success-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(item)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span
                        className={`text-sm ${
                          isChecked ? "text-gray-400 line-through" : "text-gray-700"
                        }`}
                      >
                        {item}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
