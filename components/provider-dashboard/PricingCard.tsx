import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface PricingCardProps {
  metadata: ExtendedMetadata;
  completionPercent: number;
  onEdit?: () => void;
}

export default function PricingCard({
  metadata,
  completionPercent,
  onEdit,
}: PricingCardProps) {
  const pricingDetails = metadata.pricing_details || [];
  const priceRange = metadata.price_range;

  const hasData = pricingDetails.length > 0 || priceRange;

  return (
    <DashboardSectionCard
      title="Pricing"
      icon={<svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" /></svg>}
      completionPercent={completionPercent}
      id="pricing"
      onEdit={onEdit}
    >
      {!hasData ? (
        <SectionEmptyState
          icon="clipboard"
          message="No pricing information"
          subMessage="Add pricing details to help families understand your rates."
        />
      ) : (
        <div className="space-y-4">
          {priceRange && (
            <div className="bg-gradient-to-r from-vanilla-50 to-warm-25 rounded-xl px-5 py-4 border border-warm-100/60">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Starting from</p>
              <p className="text-2xl font-display font-bold text-gray-900 tracking-tight">{priceRange}</p>
            </div>
          )}
          {pricingDetails.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200/80">
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="bg-vanilla-50 border-b border-warm-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pricingDetails.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-gray-700">
                        {item.service}
                      </td>
                      <td className="px-4 py-3.5 font-display font-bold text-primary-700">
                        {item.rate}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.rateType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardSectionCard>
  );
}
