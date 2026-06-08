"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";

interface ProviderFactSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string; // slug, source_provider_id, or profile id
  providerName: string; // For modal title
}

interface Lead {
  id: string;
  familyName: string;
  familyEmail: string | null;
  familyPhone: string | null;
  careType: string | null;
  createdAt: string;
  daysSinceInquiry: number;
  engagementLevel: string;
}

interface Question {
  id: string;
  question: string;
  askerName: string;
  createdAt: string;
  daysSinceAsked: number;
}

interface FactSheetData {
  provider: {
    name: string;
    email: string | null;
    phone: string | null;
    totalLeads: number;
    totalUnansweredQuestions: number;
  };
  leads: Lead[];
  questions: Question[];
}

function formatDaysAgo(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function ProviderFactSheetModal({
  isOpen,
  onClose,
  providerId,
  providerName,
}: ProviderFactSheetModalProps) {
  const [data, setData] = useState<FactSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !providerId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/admin/provider-fact-sheet?provider_id=${encodeURIComponent(providerId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load fact sheet");
        return res.json();
      })
      .then((json) => {
        setData(json);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, providerId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Fact Sheet: ${providerName}`}
      size="lg"
      footer={
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Contact Info Section */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Contact Info
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-16">Phone:</span>
                  {data.provider.phone ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {data.provider.phone}
                      </span>
                      <a
                        href={`tel:${data.provider.phone}`}
                        className="px-3 py-1 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                      >
                        Call
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Not available</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-16">Email:</span>
                  {data.provider.email ? (
                    <a
                      href={`mailto:${data.provider.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {data.provider.email}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">Not available</span>
                  )}
                </div>
              </div>
            </div>

            {/* Leads Section */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Leads ({data.leads.length})
              </h3>
              {data.leads.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No leads yet.</p>
              ) : (
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200 max-h-48 overflow-y-auto">
                  {data.leads.map((lead) => (
                    <div key={lead.id} className="p-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900 truncate">
                            {lead.familyName}
                          </span>
                          {lead.careType && (
                            <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700">
                              {lead.careType}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDaysAgo(lead.daysSinceInquiry)}
                          {lead.engagementLevel !== "new" && (
                            <span className="ml-2 text-gray-400">
                              ({lead.engagementLevel})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Questions Section */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Questions ({data.questions.length})
              </h3>
              {data.questions.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  No unanswered questions.
                </p>
              ) : (
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200 max-h-48 overflow-y-auto">
                  {data.questions.map((q) => (
                    <div key={q.id} className="p-3">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        &ldquo;{q.question}&rdquo;
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {q.askerName} &middot; {formatDaysAgo(q.daysSinceAsked)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
