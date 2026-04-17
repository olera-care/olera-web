"use client";

import Modal from "@/components/ui/Modal";

interface GoLiveCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileSlug: string;
}

export default function GoLiveCelebrationModal({
  isOpen,
  onClose,
  profileSlug,
}: GoLiveCelebrationModalProps) {
  const handleViewProfile = () => {
    window.open(`/medjobs/candidates/${profileSlug}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideHeader size="md">
      <div className="text-center py-8 px-4">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-emerald-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          You're live!
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
          Your profile is now visible to care providers. They can view your
          intro video, background, and reach out about opportunities.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleViewProfile}
            className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors"
          >
            See how providers see you
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Continue to profile
          </button>
        </div>
      </div>
    </Modal>
  );
}
