import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface PaymentInsuranceCardProps {
  metadata: ExtendedMetadata;
  completionPercent: number;
}

export default function PaymentInsuranceCard({
  metadata,
  completionPercent,
}: PaymentInsuranceCardProps) {
  const payments = metadata.accepted_payments || [];
  const acceptsMedicaid = metadata.accepts_medicaid;
  const acceptsMedicare = metadata.accepts_medicare;

  const hasData =
    payments.length > 0 || acceptsMedicaid || acceptsMedicare;

  return (
    <DashboardSectionCard
      title="Accepted Payment & Insurance"
      completionPercent={completionPercent}
      id="payment"
    >
      {!hasData ? (
        <SectionEmptyState
          icon="clipboard"
          message="No payment information"
          subMessage="Let families know what payment methods and insurance you accept."
        />
      ) : (
        <div className="space-y-4">
          {(acceptsMedicaid || acceptsMedicare) && (
            <div className="flex flex-wrap gap-2">
              {acceptsMedicare && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 text-primary-700 border border-primary-100">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Medicare
                </span>
              )}
              {acceptsMedicaid && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 text-primary-700 border border-primary-100">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Medicaid
                </span>
              )}
            </div>
          )}
          {payments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {payments.map((method) => (
                <span
                  key={method}
                  className="px-3 py-1.5 rounded-full text-sm text-gray-600 bg-gray-50 border border-gray-200"
                >
                  {method}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardSectionCard>
  );
}
