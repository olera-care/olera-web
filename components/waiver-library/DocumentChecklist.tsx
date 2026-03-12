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

export function DocumentChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setChecked(new Set(JSON.parse(saved)));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
    } catch {
      // ignore
    }
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

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-900">
          Master Document Checklist
        </h2>
        <span className="text-sm text-gray-500">
          {checkedCount}/{totalItems} gathered
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        Gather these documents before applying. Check off what you have ready.
      </p>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-300"
          style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CHECKLIST_CATEGORIES.map((category) => (
          <div
            key={category.name}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-4 h-4 text-primary-600 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={category.icon}
                />
              </svg>
              <h3 className="font-semibold text-gray-900 text-sm">{category.name}</h3>
            </div>
            <div className="space-y-1">
              {category.items.map((item) => {
                const isChecked = checked.has(item);
                return (
                  <label
                    key={item}
                    className={`flex items-start gap-2 cursor-pointer rounded-md px-1.5 py-1 transition-colors ${
                      isChecked ? "bg-success-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(item)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span
                      className={`text-xs leading-snug ${
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
        ))}
      </div>
    </div>
  );
}
