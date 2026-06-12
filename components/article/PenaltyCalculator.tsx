"use client";

import { useState, useMemo } from "react";

// Divisor data — must match the article's STATE_DATA exactly
const STATES: { name: string; divisor: number; special?: string }[] = [
  { name: "Alabama", divisor: 7200 },
  { name: "Alaska", divisor: 22400 },
  { name: "Arizona", divisor: 8500 },
  { name: "Arkansas", divisor: 6500 },
  { name: "California", divisor: 14440, special: "CA has special daily APPR-based rules. This uses an approximate monthly figure." },
  { name: "Colorado", divisor: 9500 },
  { name: "Connecticut", divisor: 14700 },
  { name: "Delaware", divisor: 11000 },
  { name: "Florida", divisor: 10500 },
  { name: "Georgia", divisor: 8400 },
  { name: "Hawaii", divisor: 13500 },
  { name: "Idaho", divisor: 9200 },
  { name: "Illinois", divisor: 8900 },
  { name: "Indiana", divisor: 7800 },
  { name: "Iowa", divisor: 7500 },
  { name: "Kansas", divisor: 6700 },
  { name: "Kentucky", divisor: 9200 },
  { name: "Louisiana", divisor: 5500 },
  { name: "Maine", divisor: 11800 },
  { name: "Maryland", divisor: 11200 },
  { name: "Massachusetts", divisor: 13800 },
  { name: "Michigan", divisor: 9400 },
  { name: "Minnesota", divisor: 9800 },
  { name: "Mississippi", divisor: 6600 },
  { name: "Missouri", divisor: 5800 },
  { name: "Montana", divisor: 8900 },
  { name: "Nebraska", divisor: 7200 },
  { name: "Nevada", divisor: 10200 },
  { name: "New Hampshire", divisor: 11400 },
  { name: "New Jersey", divisor: 13200 },
  { name: "New Mexico", divisor: 8400 },
  { name: "New York", divisor: 14800, special: "NY look-back applies to Nursing Home Medicaid only. No look-back yet for Community Medicaid (HCBS)." },
  { name: "North Carolina", divisor: 9300 },
  { name: "North Dakota", divisor: 10800 },
  { name: "Ohio", divisor: 7800 },
  { name: "Oklahoma", divisor: 6800 },
  { name: "Oregon", divisor: 10400 },
  { name: "Pennsylvania", divisor: 11000 },
  { name: "Rhode Island", divisor: 11600 },
  { name: "South Carolina", divisor: 8000 },
  { name: "South Dakota", divisor: 8400 },
  { name: "Tennessee", divisor: 7600 },
  { name: "Texas", divisor: 7900 },
  { name: "Utah", divisor: 8200 },
  { name: "Vermont", divisor: 11400 },
  { name: "Virginia", divisor: 9700 },
  { name: "Washington", divisor: 11800 },
  { name: "West Virginia", divisor: 9400 },
  { name: "Wisconsin", divisor: 10200 },
  { name: "Wyoming", divisor: 10600 },
  { name: "DC", divisor: 13500 },
];

type Transfer = { id: number; amount: string; date: string; note: string };

let nextId = 1;
function makeTransfer(): Transfer {
  return { id: nextId++, amount: "", date: "", note: "" };
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function PenaltyCalculator() {
  const [stateIdx, setStateIdx] = useState<number>(STATES.findIndex((s) => s.name === "Texas"));
  const [transfers, setTransfers] = useState<Transfer[]>([makeTransfer()]);

  const selectedState = STATES[stateIdx];

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 60);
    return d;
  }, []);

  const results = useMemo(() => {
    let totalInWindow = 0;
    let excludedCount = 0;

    for (const t of transfers) {
      const amt = parseFloat(t.amount.replace(/[^0-9.]/g, ""));
      if (!amt || amt <= 0) continue;
      if (t.date) {
        const d = new Date(t.date);
        if (d < cutoff) {
          excludedCount++;
          continue;
        }
      }
      totalInWindow += amt;
    }

    const divisor = selectedState.divisor;
    const penaltyMonths = divisor > 0 ? totalInWindow / divisor : 0;
    const outOfPocket = penaltyMonths * divisor;

    return { totalInWindow, penaltyMonths, outOfPocket, excludedCount, divisor };
  }, [transfers, selectedState, cutoff]);

  const addTransfer = () => setTransfers((prev) => [...prev, makeTransfer()]);
  const removeTransfer = (id: number) => setTransfers((prev) => prev.length > 1 ? prev.filter((t) => t.id !== id) : prev);
  const updateTransfer = (id: number, field: "amount" | "date" | "note", value: string) => {
    setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const hasInput = results.totalInWindow > 0;

  return (
    <div className="my-10 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
            </svg>
          </span>
          <div>
            <h3 className="text-lg font-semibold text-white">Penalty Calculator</h3>
            <p className="text-sm text-gray-400">Estimate your look-back penalty based on your state and transfers</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* State selector */}
        <div>
          <label htmlFor="calc-state" className="block text-sm font-medium text-gray-700 mb-1.5">
            Your state
          </label>
          <select
            id="calc-state"
            value={stateIdx}
            onChange={(e) => setStateIdx(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {STATES.map((s, i) => (
              <option key={s.name} value={i}>
                {s.name} ({fmt(s.divisor)}/mo)
              </option>
            ))}
          </select>
          {selectedState.special && (
            <p className="mt-1.5 text-xs text-amber-600">{selectedState.special}</p>
          )}
        </div>

        {/* Transfer rows */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Transfers / gifts made
          </label>
          <div className="space-y-3">
            {transfers.map((t, i) => (
              <div key={t.id} className="relative flex flex-col sm:flex-row items-stretch sm:items-start gap-2 sm:gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Amount (e.g. 25000)"
                    value={t.amount}
                    onChange={(e) => updateTransfer(t.id, "amount", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 sm:contents">
                  <div className="flex-1 sm:flex-1">
                    <input
                      type="date"
                      value={t.date}
                      onChange={(e) => updateTransfer(t.id, "date", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1 sm:flex-1">
                    <input
                      type="text"
                      placeholder="Note (e.g. gift to daughter)"
                      value={t.note}
                      onChange={(e) => updateTransfer(t.id, "note", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {transfers.length > 1 && (
                  <button
                    onClick={() => removeTransfer(t.id)}
                    className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto sm:mt-2.5 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove transfer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addTransfer}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add another transfer
          </button>
        </div>

        {/* Results */}
        {hasInput && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 space-y-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Estimated Results</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg bg-white border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Disqualifying Transfers</p>
                <p className="text-xl font-bold text-gray-900">{fmt(results.totalInWindow)}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Penalty Period</p>
                <p className="text-xl font-bold text-red-600">{results.penaltyMonths.toFixed(1)} months</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Out-of-Pocket Exposure</p>
                <p className="text-xl font-bold text-gray-900">{fmt(Math.round(results.outOfPocket))}</p>
              </div>
            </div>

            {results.excludedCount > 0 && (
              <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                {results.excludedCount} transfer{results.excludedCount > 1 ? "s" : ""} excluded (outside the 60-month look-back window).
              </p>
            )}

          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center">
          Estimates only. Penalty divisors update annually. Verify with your state Medicaid agency before making decisions.
        </p>
      </div>
    </div>
  );
}
