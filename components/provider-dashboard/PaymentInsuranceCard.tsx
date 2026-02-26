import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

const INSURANCE_ITEMS = ["Medicare", "Medicaid"];

interface PaymentInsuranceCardProps {
  metadata: ExtendedMetadata;
  completionPercent: number;
  onEdit?: () => void;
}

export default function PaymentInsuranceCard({
  metadata,
  completionPercent,
  onEdit,
}: PaymentInsuranceCardProps) {
  // Merge legacy booleans into a unified list
  const allPayments = [...(Array.isArray(metadata.accepted_payments) ? metadata.accepted_payments : [])];
  if (metadata.accepts_medicare && !allPayments.includes("Medicare")) allPayments.push("Medicare");
  if (metadata.accepts_medicaid && !allPayments.includes("Medicaid")) allPayments.push("Medicaid");

  const insurance = allPayments.filter((p) => INSURANCE_ITEMS.includes(p));
  const payments = allPayments.filter((p) => !INSURANCE_ITEMS.includes(p));

  return (
    <DashboardSectionCard
      title="Accepted Payment & Insurance"
      completionPercent={completionPercent}
      id="payment"
      onEdit={onEdit}
    >
      {allPayments.length === 0 ? (
        <SectionEmptyState
          icon="clipboard"
          message="No payment information"
          subMessage="Let families know what payment methods and insurance you accept."
        />
      ) : (
        <div className="space-y-3">
          {insurance.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {insurance.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-success-50 border border-success-200 text-success-700"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          )}
          {payments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {payments.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-medium bg-warm-50 border border-warm-100 text-gray-900"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardSectionCard>
  );
}
