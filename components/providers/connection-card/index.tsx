"use client";

import { useConnectionCard } from "./use-connection-card";
import CardTopSection from "./CardTopSection";
import CardBottomSection from "./CardBottomSection";
import DefaultActions from "./DefaultActions";
import IntentCapture from "./IntentCapture";
import PendingState from "./PendingState";
import RespondedState from "./RespondedState";
import InactiveState from "./InactiveState";
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
    <div className="bg-white rounded-xl border border-gray-300 shadow-lg overflow-hidden max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* Top section — persistent across all states */}
      <CardTopSection
        priceRange={priceRange}
        oleraScore={oleraScore}
        reviewCount={reviewCount}
        responseTime={responseTime}
        hideResponseTime={hook.cardState === "inactive"}
      />

      {/* Divider */}
      <div className="h-px bg-gray-200" />

      {/* Middle section — state-dependent */}
      <div className="px-5 py-5">
        {hook.cardState === "loading" && (
          <div className="animate-pulse space-y-3">
            <div className="h-11 bg-gray-100 rounded-[10px]" />
            <div className="h-10 bg-gray-100 rounded-[10px]" />
          </div>
        )}

        {hook.cardState === "default" && (
          <DefaultActions
            phone={phone}
            phoneRevealed={hook.phoneRevealed}
            onConnect={hook.startFlow}
            onRevealPhone={hook.revealPhone}
          />
        )}

        {hook.cardState === "intent" && (
          <IntentCapture
            intentStep={hook.intentStep}
            intentData={hook.intentData}
            availableCareTypes={hook.availableCareTypes}
            onSelectRecipient={hook.selectRecipient}
            onSelectCareType={hook.selectCareType}
            onSelectUrgency={hook.selectUrgency}
            onConnect={hook.connect}
          />
        )}

        {hook.cardState === "pending" && (
          <PendingState
            providerName={providerName}
            phone={phone}
            requestDate={hook.pendingRequestDate}
          />
        )}

        {hook.cardState === "responded" && (
          <RespondedState
            providerName={providerName}
            phone={phone}
            requestDate={hook.pendingRequestDate}
          />
        )}

        {hook.cardState === "inactive" && (
          <InactiveState
            providerName={providerName}
            phone={phone}
            saved={hook.saved}
            onToggleSave={hook.toggleSave}
          />
        )}

        {hook.cardState === "returning" && (
          <ReturningUserState
            phone={phone}
            intentData={hook.intentData}
            onConnect={hook.connect}
            onEdit={hook.editFromReturning}
          />
        )}
      </div>

      {/* Bottom section — persistent */}
      <CardBottomSection acceptedPayments={acceptedPayments} />
    </div>
  );
}
