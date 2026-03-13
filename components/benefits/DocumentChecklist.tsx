"use client";

import { useState } from "react";

const DOCUMENTS = [
  { id: "id", label: "Government-issued photo ID", detail: "Driver's license, passport, or state ID" },
  { id: "ssn", label: "Social Security card or number", detail: "Or proof of SSN" },
  { id: "income", label: "Proof of income", detail: "Pay stubs, tax return, Social Security statement, or pension letter" },
  { id: "residence", label: "Proof of residence", detail: "Utility bill, lease, or bank statement with address" },
  { id: "medical", label: "Medical records or doctor's letter", detail: "For programs requiring disability or health documentation" },
  { id: "insurance", label: "Insurance cards", detail: "Medicare, Medicaid, or private insurance" },
  { id: "bank", label: "Bank statements", detail: "For asset verification (some programs)" },
  { id: "birth", label: "Birth certificate or proof of age", detail: "For age-based programs" },
];

export default function DocumentChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="mb-10 print:mb-6">
      <h3 className="font-display text-display-xs font-medium text-gray-900 mb-1">
        Documents You&apos;ll Need
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Gather these before applying. Not every program requires all documents.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {DOCUMENTS.map((doc) => (
          <label
            key={doc.id}
            className="flex items-start gap-3 py-2.5 cursor-pointer group"
          >
            {/* Checkbox — interactive on screen, empty square for print */}
            <span className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={!!checked[doc.id]}
                onChange={() => toggle(doc.id)}
                className="sr-only peer"
              />
              <span className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors print:border-gray-400 ${
                checked[doc.id]
                  ? "bg-primary-600 border-primary-600"
                  : "bg-white border-gray-300 group-hover:border-gray-400"
              }`}>
                {checked[doc.id] && (
                  <svg className="w-3 h-3 text-white print:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </span>

            <div className="min-w-0">
              <span className={`text-sm font-medium block leading-tight ${
                checked[doc.id] ? "text-gray-400 line-through" : "text-gray-900"
              }`}>
                {doc.label}
              </span>
              <span className="text-xs text-gray-400 block mt-0.5">
                {doc.detail}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
