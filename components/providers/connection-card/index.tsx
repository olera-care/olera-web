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

  // Block non-family profiles from sending care inquiries
  if (hook.isNonFamilyProfile) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 py-6 text-center">
          <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Family account required
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Care consultation requests can only be sent from a family account. Create one to connect with {providerName}.
          </p>
          <button
            onClick={() => hook.openAuth({ defaultMode: "sign-up", intent: "family" })}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
          >
            Create Family Account
          </button>
          <p className="text-xs text-gray-400 mt-3">
            Use a different email than your {hook.accountTypeLabel} account.
          </p>
        </div>
        <CardBottomSection acceptedPayments={acceptedPayments} />
      </div>
    );
  }

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
          hook.userEmail ? (
            /* Logged-in: one-click CTA — no form fields */
            <div className="space-y-3">
              <p className="text-[17px] font-bold text-gray-900">
                What does this cost?
              </p>
              <p className="text-[13px] text-gray-500">
                Signed in as {hook.userEmail}
              </p>
              {hook.error && (
                <p className="text-xs text-red-600" role="alert">
                  {hook.error}
                </p>
              )}
              <button
                onClick={() => hook.submitInquiryForm({ email: hook.userEmail })}
                disabled={hook.submitting}
                className="w-full h-11 rounded-xl text-[14px] font-semibold border-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-default disabled:active:scale-100"
              >
                {hook.submitting && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {hook.submitting ? "Checking..." : "Check cost & availability"}
              </button>
              <div className="space-y-1 pt-0.5">
                <p className="text-[12px] text-gray-500 text-center font-medium">
                  No spam. No sales calls.
                </p>
              </div>
            </div>
          ) : (
            /* Guest: email-only form */
            <InquiryForm
              key="guest"
              providerName={providerName}
              onSubmit={hook.submitInquiryForm}
              submitting={hook.submitting}
              error={hook.error}
              connectionCount={hook.connectionCount ?? undefined}
            />
          )
        )}

        {hook.cardState === "enrichment" && (
          <EnrichmentState
            providerName={providerName}
            onSave={hook.saveEnrichment}
            onSkip={hook.skipEnrichment}
            saving={hook.submitting}
            initialRecipient={hook.initialRecipient}
            initialUrgency={hook.initialUrgency}
            careTypes={props.careTypes}
            priceRange={props.priceRange}
          />
        )}

        {hook.cardState === "connected" && (
          <ConnectedState
            phone={phone}
            requestDate={hook.pendingRequestDate}
            connectionId={hook.connectionId}
          />
        )}

        {hook.cardState === "provider_email_block" && (
          <div className="text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Provider email detected
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              The email <span className="font-medium text-gray-800">{hook.blockedEmail}</span> is linked to a provider account. To send care inquiries, please use a different email.
            </p>
            <div className="space-y-2">
              <button
                onClick={hook.resetFromProviderEmailBlock}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
              >
                Use Different Email
              </button>
              <button
                onClick={() => hook.openAuth({ defaultMode: "sign-in" })}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-colors"
              >
                Sign In Instead
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Family accounts require a separate email from provider accounts.
            </p>
          </div>
        )}
      </div>

      {/* Bottom section — persistent */}
      <CardBottomSection acceptedPayments={acceptedPayments} />
    </div>
  );
}
