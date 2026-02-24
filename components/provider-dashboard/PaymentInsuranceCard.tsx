import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

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
  const payments = metadata.accepted_payments || [];
  const acceptsMedicaid = metadata.accepts_medicaid;
  const acceptsMedicare = metadata.accepts_medicare;

  const hasData =
    payments.length > 0 || acceptsMedicaid || acceptsMedicare;

  return (
    <DashboardSectionCard
      title="Accepted Payment & Insurance"
      icon={<svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>}
      completionPercent={completionPercent}
      id="payment"
      onEdit={onEdit}
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
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-success-50 text-success-700 border border-success-200/60 shadow-xs">
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
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-success-50 text-success-700 border border-success-200/60 shadow-xs">
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
                  className="px-3 py-1.5 rounded-full text-[15px] text-gray-600 bg-vanilla-50 border border-warm-100/60"
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
