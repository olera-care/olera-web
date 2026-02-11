"use client";

import { useConnectionCard } from "./use-connection-card";
import CardTopSection from "./CardTopSection";
import CardBottomSection from "./CardBottomSection";
import DefaultActions from "./DefaultActions";
import IntentCapture from "./IntentCapture";
import ConfirmationState from "./ConfirmationState";
import PendingState from "./PendingState";
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-h-[calc(100vh-120px)] overflow-y-auto">
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
        {hook.cardState === "default" && (
          <DefaultActions
            phone={phone}
            phoneRevealed={hook.phoneRevealed}
            saved={hook.saved}
            onConnect={hook.startFlow}
            onRevealPhone={hook.revealPhone}
            onToggleSave={hook.toggleSave}
          />
        )}

        {hook.cardState === "intent" && (
          <IntentCapture
            providerName={providerName}
            intentStep={hook.intentStep}
            intentData={hook.intentData}
            availableCareTypes={hook.availableCareTypes}
            onSetRecipient={hook.setRecipient}
            onSetCareType={hook.setCareType}
            onSetUrgency={hook.setUrgency}
            onSetNotes={hook.setNotes}
            onNext={hook.goToNextIntentStep}
            onBack={hook.goBackIntentStep}
            onEditStep={hook.editIntentStep}
          />
        )}

        {hook.cardState === "submitting" && (
          <div className="text-center py-6">
            {!hook.error ? (
              <>
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-base font-semibold text-gray-700">
                  Sending your request to {providerName}...
                </p>
              </>
            ) : (
              <>
                <p className="text-base text-red-600 mb-3">{hook.error}</p>
                <button
                  onClick={() => hook.submitRequest()}
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-[10px] text-sm font-semibold cursor-pointer border-none hover:bg-primary-500 transition-colors"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        )}

        {hook.cardState === "confirmation" && (
          <ConfirmationState
            providerName={providerName}
            phone={phone}
            responseTime={responseTime}
            notificationEmail={hook.notificationEmail}
          />
        )}

        {hook.cardState === "pending" && (
          <PendingState
            providerName={providerName}
            phone={phone}
            requestDate={hook.pendingRequestDate}
          />
        )}

        {hook.cardState === "inactive" && (
          <InactiveState
            providerName={providerName}
            saved={hook.saved}
            onToggleSave={hook.toggleSave}
          />
        )}

        {/* State 3: Not reachable until auth is integrated */}
        {hook.cardState === "returning" && (
          <ReturningUserState
            providerName={providerName}
            phone={phone}
            careType="Help with daily activities"
            careRecipient="A loved one"
            urgency="As soon as possible"
            contactInfo="Text me · (512) 555-1234"
            additionalNotes=""
            onSend={hook.submitRequest}
            submitting={hook.submitting}
          />
        )}
      </div>

      {/* Bottom section — persistent */}
      <CardBottomSection acceptedPayments={acceptedPayments} />
    </div>
  );
}
