"use client";

import { useState, useRef } from "react";
import Modal from "@/components/ui/Modal";

interface ApplyToJobModalProps {
  providerProfileId: string;
  providerName: string;
  jobTitle: string;
  onClose: () => void;
  onApplied: () => void;
}

export default function ApplyToJobModal({
  providerProfileId,
  providerName,
  jobTitle,
  onClose,
  onApplied,
}: ApplyToJobModalProps) {
  const [coverLetter, setCoverLetter] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles = Array.from(selected).filter(
      (f) => !files.some((existing) => existing.name === f.name)
    );
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      // Use the existing interviews API to create the application
      // The cover letter goes in notes, and we flag it as a job application
      const res = await fetch("/api/medjobs/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerProfileId,
          type: "video",
          proposedTime: new Date().toISOString(),
          notes: coverLetter.trim() || undefined,
          isJobApplication: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setShowSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <Modal isOpen onClose={() => { onApplied(); onClose(); }} hideHeader size="md">
        <div className="text-center py-10 px-6 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-6 left-10 w-16 h-16 rounded-full bg-emerald-100/40 animate-scale-in" />
            <div className="absolute top-14 right-8 w-10 h-10 rounded-full bg-primary-100/40 animate-scale-in" style={{ animationDelay: "100ms" }} />
            <div className="absolute bottom-20 left-14 w-8 h-8 rounded-full bg-amber-100/50 animate-scale-in" style={{ animationDelay: "200ms" }} />
          </div>

          {/* Check icon */}
          <div className="relative z-10 w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="relative z-10 text-xl font-bold text-gray-900 mb-2">
            You applied to {providerName}
          </h2>
          <p className="relative z-10 text-sm text-gray-500 leading-relaxed max-w-xs mx-auto mb-8">
            If they&apos;re interested, you&apos;ll see a message in your inbox. Keep browsing — more matches are out there.
          </p>

          <div className="relative z-10 space-y-3">
            <button
              type="button"
              onClick={() => { onApplied(); onClose(); }}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg text-sm"
            >
              Keep browsing jobs
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  const footer = (
    <div className="space-y-3 pt-2">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl text-sm font-semibold text-white transition-colors min-h-[48px]"
      >
        {submitting ? "Sending..." : "Send application"}
      </button>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} title="Apply to this job" size="lg" footer={footer}>
      <div className="py-4 space-y-5">
        {/* Job info */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-snug">{jobTitle}</p>
            <p className="text-xs text-gray-500 mt-0.5">{providerName}</p>
          </div>
        </div>

        {/* Cover letter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover letter <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Tell them why you're a great fit — what draws you to this role, relevant experience, or anything you'd want them to know..."
            rows={5}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-colors"
          />
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documents <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Resume, certifications, or anything else that helps your application. Up to 5 files.
          </p>

          {/* Uploaded files list */}
          {files.length > 0 && (
            <div className="space-y-2 mb-3">
              {files.map((file) => (
                <div key={file.name} className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{file.name}</p>
                    <p className="text-[11px] text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.name)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          {files.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Upload a file
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </Modal>
  );
}
