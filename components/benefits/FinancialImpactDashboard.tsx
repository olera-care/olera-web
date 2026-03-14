"use client";

import type { BenefitMatch } from "@/lib/types/benefits";
import { getEstimatedSavings } from "@/lib/types/benefits";

interface FinancialImpactDashboardProps {
  matchedPrograms: BenefitMatch[];
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

      {/* Disclaimer */}
      <p className="text-[11px] text-gray-300 mt-2 print:text-gray-400">
        Estimates based on typical program values. Actual amounts depend on individual circumstances.
      </p>
    </div>
  );
}
