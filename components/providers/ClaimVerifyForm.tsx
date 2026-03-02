"use client";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import OtpInput from "@/components/auth/OtpInput";

interface NoAccessFormProps {
  name: string;
  role: string;
  email: string;
  notes: string;
  onNameChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export interface ClaimVerifyFormProps {
  providerName: string;
  /** Masked email hint (e.g. "j***e@company.com") */
  emailHint: string;
  /** True when provider has no email on file */
  noEmailOnFile: boolean;
  /** True while sending the initial or resend code */
  sending: boolean;
  /** True while checking the entered code */
  checking: boolean;
  /** Error message to display */
  error: string;
  /** Seconds remaining before resend is allowed */
  resendCooldown: number;
  /** Current 6-digit code value */
  code: string;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
  onResend: () => void;
  /** Whether the "no access" section is expanded */
  showNoAccess: boolean;
  onToggleNoAccess: (show: boolean) => void;
  noAccess: NoAccessFormProps;
  /** Show the no-access success state */
  noAccessSuccess: boolean;
}

export default function ClaimVerifyForm({
  providerName,
  emailHint,
  noEmailOnFile,
  sending,
  checking,
  error,
  resendCooldown,
  code,
  onCodeChange,
  onVerify,
  onResend,
  showNoAccess,
  onToggleNoAccess,
  noAccess,
  noAccessSuccess,
}: ClaimVerifyFormProps) {
  if (noAccessSuccess) {
    return (
      <div className="text-center animate-wizard-in">
        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-8 shadow-sm">
          <svg className="w-8 h-8 text-primary-600 animate-success-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
          Request submitted
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed max-w-sm mx-auto">
          We&apos;ve received your request to claim <strong className="text-gray-700">{providerName}</strong>.
          Our team will review it and get back to you within 2–3 business days.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header — icon + title + subtitle */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">
          Verify your organization
        </h1>
        {sending ? (
          <p className="text-gray-500 mt-4 text-lg leading-relaxed">Sending verification code…</p>
        ) : noEmailOnFile ? (
          <p className="text-gray-500 mt-4 text-lg leading-relaxed">
            We don&apos;t have an email on file for <strong className="text-gray-600">{providerName}</strong>.
            <br />Please submit a request below.
          </p>
        ) : emailHint ? (
          <p className="text-gray-500 mt-4 text-lg leading-relaxed">
            We sent a 6-digit code to <strong className="text-gray-600">{emailHint}</strong>.
            <br />Enter it below to verify you represent {providerName}.
          </p>
        ) : error ? (
          <p className="text-gray-500 mt-4 text-lg leading-relaxed">
            There was an issue sending the code. Please try again.
          </p>
        ) : null}
      </div>

      {/* Code input — only show when email was sent */}
      {!noEmailOnFile && emailHint && (
        <div className="space-y-6">
          <fieldset>
            <legend className="sr-only">Enter your 6-digit verification code</legend>
            <OtpInput
              length={6}
              value={code}
              onChange={onCodeChange}
              disabled={checking}
              error={!!error}
            />
          </fieldset>

          {error && (
            <p className="text-base text-red-600 text-center" role="alert">{error}</p>
          )}

          {/* Resend */}
          <div className="text-center">
            {resendCooldown > 0 ? (
              <p className="text-sm text-gray-400">Resend code in {resendCooldown}s</p>
            ) : (
              <button
                type="button"
                onClick={onResend}
                disabled={sending}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
              >
                Resend code
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error state — code sending failed (not no-email) */}
      {!noEmailOnFile && !emailHint && error && !sending && (
        <div className="text-center space-y-4">
          <p className="text-base text-red-600" role="alert">{error}</p>
          <button
            type="button"
            onClick={onResend}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="my-8 border-t border-gray-200" />

      {/* No access to email */}
      {!showNoAccess ? (
        <button
          type="button"
          onClick={() => onToggleNoAccess(true)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 shadow-sm transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              No access to this email?
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Request a manual review instead
            </p>
          </div>
          <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <div className="space-y-5 animate-step-in">
          <div className="mb-1">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Request manual review</h2>
            <p className="text-base text-gray-500 mt-1">
              Tell us a bit about yourself so we can verify your access.
            </p>
          </div>

          <Input
            label="Full name"
            value={noAccess.name}
            onChange={(e) => noAccess.onNameChange((e.target as HTMLInputElement).value)}
            placeholder="e.g. Jane Smith"
            required
          />

          <div className="space-y-2">
            <label htmlFor="no-access-role" className="block text-base font-medium text-gray-700">
              Your role
            </label>
            <div className="relative">
              <select
                id="no-access-role"
                value={noAccess.role}
                onChange={(e) => noAccess.onRoleChange(e.target.value)}
                className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
              >
                <option value="">Select your role…</option>
                <option value="Owner">Owner</option>
                <option value="Administrator">Administrator</option>
                <option value="Executive Director">Executive Director</option>
                <option value="Office Manager">Office Manager</option>
                <option value="Marketing / Communications">Marketing / Communications</option>
                <option value="Staff Member">Staff Member</option>
                <option value="Other">Other</option>
              </select>
              <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <Input
            label="Organization email"
            type="email"
            value={noAccess.email}
            onChange={(e) => noAccess.onEmailChange((e.target as HTMLInputElement).value)}
            placeholder="contact@yourorganization.com"
            required
          />

          <Input
            label="Anything else we should know?"
            as="textarea"
            value={noAccess.notes}
            onChange={(e) => noAccess.onNotesChange((e.target as HTMLTextAreaElement).value)}
            placeholder="Optional — add any additional context"
            rows={2}
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => onToggleNoAccess(false)}
              className="text-base font-medium text-gray-600 hover:text-gray-900 underline underline-offset-4 transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={noAccess.onSubmit}
              disabled={!noAccess.name.trim() || !noAccess.role || !noAccess.email.trim()}
              loading={noAccess.submitting}
            >
              Submit request
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
