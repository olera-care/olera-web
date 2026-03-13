"use client";

import type { BenefitMatch } from "@/lib/types/benefits";
import { getEstimatedSavings } from "@/lib/types/benefits";

interface FinancialImpactDashboardProps {
  matchedPrograms: BenefitMatch[];
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatCurrencyFull(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export default function FinancialImpactDashboard({ matchedPrograms }: FinancialImpactDashboardProps) {
  // Sum savings across all matched programs
  let totalMonthly = 0;
  let programsWithSavings = 0;

  for (const m of matchedPrograms) {
    const savings = getEstimatedSavings(m.program.name);
    if (savings) {
      totalMonthly += savings.monthly;
      programsWithSavings++;
    }
  }

  // Don't render if no programs have savings data
  if (programsWithSavings === 0) return null;

  const totalAnnual = totalMonthly * 12;
  const costOfInaction = totalAnnual * 5;

  return (
    <div className="mb-10 print:mb-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Monthly savings */}
        <div className="bg-primary-50/60 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 mb-1 tracking-wide uppercase">
            Est. Monthly Savings
          </p>
          <p className="font-display text-display-xs font-medium text-gray-900">
            {formatCurrencyFull(totalMonthly)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            across {programsWithSavings} program{programsWithSavings !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Annual savings */}
        <div className="bg-primary-50/60 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 mb-1 tracking-wide uppercase">
            Est. Annual Savings
          </p>
          <p className="font-display text-display-xs font-medium text-gray-900">
            {formatCurrencyFull(totalAnnual)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            if all programs applied for
          </p>
        </div>
      </div>

      {/* Cost of inaction */}
      <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-900">
              Cost of not applying: up to {formatCurrency(costOfInaction)} over 5 years
            </p>
            <p className="text-xs text-amber-700/80 mt-0.5">
              Every month without these benefits is money left on the table.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-gray-300 mt-2 print:text-gray-400">
        Estimates based on typical program values. Actual amounts depend on individual circumstances.
      </p>
    </div>
  );
}
