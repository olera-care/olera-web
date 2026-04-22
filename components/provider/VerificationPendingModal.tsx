"use client";

import Modal from "@/components/ui/Modal";

interface VerificationSubmissionData {
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  verification_type?: "linkedin" | "website" | "contact_support" | null;
  linkedin_url?: string | null;
  website_url?: string | null;
  submitted_at?: string;
}

interface VerificationPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSubmission: () => void;
  businessName: string;
  submissionData?: VerificationSubmissionData | null;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  administrator: "Administrator",
  executive_director: "Executive Director",
  office_manager: "Office Manager",
  marketing: "Marketing / Communications",
  staff: "Staff Member",
  other: "Other",
};

const VERIFICATION_TYPE_LABELS: Record<string, string> = {
  linkedin: "LinkedIn profile",
  website: "Business website",
  contact_support: "Manual verification requested",
};

export default function VerificationPendingModal({
  isOpen,
  onClose,
  onUpdateSubmission,
  businessName,
  submissionData,
}: VerificationPendingModalProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getVerificationDisplay = () => {
    if (!submissionData?.verification_type) return null;

    const label = VERIFICATION_TYPE_LABELS[submissionData.verification_type] || submissionData.verification_type;
    const url = submissionData.verification_type === "linkedin"
      ? submissionData.linkedin_url
      : submissionData.verification_type === "website"
        ? submissionData.website_url
        : null;

    return { label, url };
  };

  const verification = getVerificationDisplay();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verification Under Review"
      size="lg"
      footer={
        <div className="space-y-3 pt-5 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all min-h-[52px]"
          >
            Got it
          </button>
          <button
            type="button"
            onClick={onUpdateSubmission}
            className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm"
          >
            Update my submission
          </button>
          <p className="text-xs text-gray-400 text-center">
            Questions? Contact{" "}
            <a href="mailto:support@olera.com" className="text-primary-600 hover:text-primary-700">
              support@olera.com
            </a>
          </p>
        </div>
      }
    >
      <div className="space-y-5 pt-2">
        {/* Status message */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] text-amber-900 leading-relaxed">
              We&apos;re reviewing your verification request for{" "}
              <span className="font-semibold">{businessName}</span>.
              Most reviews complete within 1-2 business days.
            </p>
          </div>
        </div>

        {/* Submission details */}
        {submissionData && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Your Submission
            </p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Submitted</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(submissionData.submitted_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Name</p>
                  <p className="text-sm font-medium text-gray-900">{submissionData.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Role</p>
                  <p className="text-sm text-gray-700">
                    {ROLE_LABELS[submissionData.role] || submissionData.role}
                  </p>
                </div>
                {submissionData.email && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                    <p className="text-sm text-gray-700 truncate">{submissionData.email}</p>
                  </div>
                )}
              </div>

              {verification && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Verification Method</p>
                  <p className="text-sm text-gray-700">{verification.label}</p>
                  {verification.url && (
                    <a
                      href={verification.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-700 break-all"
                    >
                      {verification.url}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* What happens next */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
            What happens next?
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>Our team will verify your connection to this business</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>You&apos;ll receive an email once approved</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>Full access will be unlocked automatically</span>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
