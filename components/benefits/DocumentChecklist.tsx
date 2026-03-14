"use client";

import { useState } from "react";

// ─── Grouped document data ──────────────────────────────────────────────────

interface DocItem {
  id: string;
  label: string;
}

interface DocCategory {
  title: string;
  icon: React.ReactNode;
  items: DocItem[];
}

const CATEGORIES: DocCategory[] = [
  {
    title: "Identity & Personal",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
      </svg>
    ),
    items: [
      { id: "photo-id", label: "Government-issued photo ID" },
      { id: "ssn", label: "Social Security card" },
      { id: "birth-cert", label: "Birth certificate" },
      { id: "marriage-cert", label: "Marriage certificate (if applicable)" },
      { id: "passport-photo", label: "Passport-size photo" },
    ],
  },
  {
    title: "Income & Financial",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    items: [
      { id: "ssa-1099", label: "Social Security award letter (SSA-1099)" },
      { id: "pension", label: "Pension statements" },
      { id: "bank-stmts", label: "Bank statements (last 3 months)" },
      { id: "investments", label: "Investment account statements" },
      { id: "life-insurance", label: "Life insurance policy details" },
    ],
  },
  {
    title: "Medical & Health",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    items: [
      { id: "medicare-card", label: "Medicare card (red, white & blue)" },
      { id: "medicaid-card", label: "Medicaid card (if applicable)" },
      { id: "medications", label: "List of current medications" },
      { id: "doctors", label: "List of doctors & specialists" },
      { id: "medical-records", label: "Recent medical records / discharge summaries" },
      { id: "rx-receipts", label: "Prescription receipts (last 3 months)" },
    ],
  },
  {
    title: "Military (if applicable)",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    items: [
      { id: "dd-214", label: "DD-214 (discharge papers)" },
      { id: "va-disability", label: "VA disability rating letter" },
      { id: "service-records", label: "Veteran\u2019s service records" },
      { id: "death-cert-vet", label: "Death certificate of veteran (surviving spouse)" },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function DocumentChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="mb-10 print:mb-6">
      <h3 className="font-display text-display-xs font-medium text-gray-900 mb-1">
        Master Document Checklist
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Gather these documents before applying. Many programs require the same paperwork &mdash; collect once, use everywhere.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.title}
            className="border border-gray-200 rounded-xl p-4 print:border-gray-300"
          >
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-primary-600">{cat.icon}</span>
              <h4 className="text-sm font-semibold text-gray-900">{cat.title}</h4>
            </div>

            {/* Checklist grid — 2 columns inside each card */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {cat.items.map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-start gap-2 cursor-pointer group"
                >
                  <span className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={!!checked[doc.id]}
                      onChange={() => toggle(doc.id)}
                      className="sr-only"
                    />
                    <span
                      className={`flex items-center justify-center w-4 h-4 rounded border-[1.5px] transition-colors print:border-gray-400 ${
                        checked[doc.id]
                          ? "bg-primary-600 border-primary-600"
                          : "bg-white border-gray-300 group-hover:border-gray-400"
                      }`}
                    >
                      {checked[doc.id] && (
                        <svg
                          className="w-2.5 h-2.5 text-white print:hidden"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </span>
                  <span
                    className={`text-xs leading-tight ${
                      checked[doc.id] ? "text-gray-400 line-through" : "text-gray-700"
                    }`}
                  >
                    {doc.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
