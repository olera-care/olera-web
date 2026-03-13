"use client";

import { useConnectionCard } from "./use-connection-card";
import CardTopSection from "./CardTopSection";
import CardBottomSection from "./CardBottomSection";
import InquiryForm from "./InquiryForm";
import EnrichmentState from "./EnrichmentState";
import ConnectedState from "./ConnectedState";
import ReturningUserState from "./ReturningUserState";
import type { ConnectionCardProps } from "./types";

export type { ConnectionCardProps } from "./types";

export default function ConnectionCard(props: ConnectionCardProps) {
  const {
    providerName,
    priceRange,
    oleraScore,
    reviewCount,
    phone,
    acceptedPayments,
    responseTime,
  } = props;

  const hook = useConnectionCard(props);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* Main content */}
      <div className="px-5 py-5">
        {hook.cardState === "loading" && (
          <div className="animate-pulse space-y-3">
            <div className="h-11 bg-gray-100 rounded-[10px]" />
            <div className="h-10 bg-gray-100 rounded-[10px]" />
          </div>
        )}

        {hook.cardState === "default" && (
          <InquiryForm
            providerName={providerName}
            onSubmit={hook.submitInquiryForm}
            submitting={hook.submitting}
            error={hook.error}
          />
        )}

        {hook.cardState === "enrichment" && (
          <EnrichmentState
            providerName={providerName}
            onSave={hook.saveEnrichment}
            onSkip={hook.skipEnrichment}
            saving={hook.submitting}
          />
        )}

        {hook.cardState === "connected" && (
          <ConnectedState
            phone={phone}
            requestDate={hook.pendingRequestDate}
            connectionId={hook.connectionId}
          />
        )}

        {hook.cardState === "returning" && (
          <ReturningUserState
            phone={phone}
            intentData={hook.intentData}
            onConnect={hook.connect}
            onEdit={hook.editFromReturning}
            submitting={hook.submitting}
          />
        )}
      </div>

      {/* Bottom section — persistent */}
      <CardBottomSection acceptedPayments={acceptedPayments} />
    </div>
  );
}
