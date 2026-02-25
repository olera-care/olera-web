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
  const pricingDetails = Array.isArray(metadata.pricing_details) ? metadata.pricing_details : [];
  const priceRange = metadata.price_range;
  const contactForPricing = metadata.contact_for_pricing;

  const hasData = pricingDetails.length > 0 || priceRange || contactForPricing;

  return (
    <DashboardSectionCard
      title="Pricing"
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
          {/* Price range or contact for pricing */}
          {(contactForPricing || priceRange) && (
            <div className="rounded-lg bg-gray-50 px-5 py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                {contactForPricing ? "Pricing" : "Starting from"}
              </p>
              <p className="text-2xl font-display font-bold text-gray-900 tracking-tight">
                {contactForPricing ? "Contact for pricing" : priceRange}
              </p>
            </div>
          )}

          {/* Service pricing rows */}
          {pricingDetails.length > 0 && (
            <div className="space-y-2">
              {pricingDetails.filter(Boolean).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3.5 px-4 bg-gray-50 rounded-lg"
                >
                  <span className="text-base font-medium text-gray-900">
                    {item.service || "Service"}
                  </span>
                  <span className="text-base font-semibold text-gray-900 shrink-0">
                    {item.rate || "—"}{" "}
                    {item.rateType && (
                      <span className="font-normal text-gray-500">
                        /{item.rateType.replace("per ", "").replace("flat rate", "flat")}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardSectionCard>
  );
}
