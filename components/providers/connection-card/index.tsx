"use client";

import { useConnectionCard } from "./use-connection-card";
import CardBottomSection from "./CardBottomSection";
import InquiryForm from "./InquiryForm";
import EnrichmentState from "./EnrichmentState";
import ConnectedState from "./ConnectedState";
import type { ConnectionCardProps } from "./types";

export type { ConnectionCardProps } from "./types";

export default function ConnectionCard(props: ConnectionCardProps) {
  const {
    providerName,
    phone,
    acceptedPayments,
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
            key={hook.userEmail || "guest"}
            providerName={providerName}
            onSubmit={hook.submitInquiryForm}
            submitting={hook.submitting}
            error={hook.error}
            initialEmail={hook.userEmail}
            initialName={hook.userName}
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
      </div>

      {/* Bottom section — persistent */}
      <CardBottomSection acceptedPayments={acceptedPayments} />
    </div>
  );
}
