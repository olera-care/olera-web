"use client";

import { useState, useRef } from "react";

/* ─── Types ───────────────────────────────────────────────── */

export interface IdentityFormState {
  idFile: File | null;
  idPreview: string | null;
  selfieFile: File | null;
  selfiePreview: string | null;
  submitted: boolean;
}

export const INITIAL_IDENTITY: IdentityFormState = {
  idFile: null,
  idPreview: null,
  selfieFile: null,
  selfiePreview: null,
  submitted: false,
};

/* ─── Component ───────────────────────────────────────────── */

export default function Step3Identity({
  identity,
  setIdentity,
  onBack,
  onContinue,
}: {
  identity: IdentityFormState;
  setIdentity: React.Dispatch<React.SetStateAction<IdentityFormState>>;
  onBack: () => void;
  onContinue: () => void;
}) {
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const [dragOverId, setDragOverId] = useState(false);

  const handleIdFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setIdentity((s) => ({ ...s, idFile: file, idPreview: url }));
  };

  const handleSelfieFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setIdentity((s) => ({ ...s, selfieFile: file, selfiePreview: url }));
  };

  const handleSubmit = () => {
    setIdentity((s) => ({ ...s, submitted: true }));
  };

  const canSubmit = identity.idFile && identity.selfieFile;

  /* ── Submitted success state ── */
  if (identity.submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
            Identity submitted for verification
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning-50 border border-warning-100 text-warning-700 text-sm font-medium mt-3 mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Pending review, usually 1-2 business days
          </div>
          <div>
            <button
              onClick={onContinue}
              className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-[15px] font-semibold rounded-xl transition-colors shadow-sm shadow-primary-600/20"
            >
              Continue to background check
              <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form state ── */
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
          Verify your identity
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          We verify identity to keep families safe and build trust on the platform. This usually takes 1-2 business days.
        </p>
      </div>

      {/* Why this matters */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        <p className="text-sm text-primary-800">
          Families want to know who&apos;s coming into their home. Identity verification is a required step before you can go live on the platform.
        </p>
      </div>

      {/* ID Upload */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload a government-issued ID</h3>
        <p className="text-sm text-gray-400 mb-5">
          Driver&apos;s license, passport, or state ID accepted.
        </p>

        <input
          ref={idInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleIdFile(f);
          }}
        />

        {identity.idPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img src={identity.idPreview} alt="ID preview" className="w-full max-h-64 object-contain" />
            <button
              onClick={() => {
                setIdentity((s) => ({ ...s, idFile: null, idPreview: null }));
                if (idInputRef.current) idInputRef.current.value = "";
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-500 hover:text-error-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOverId ? "border-primary-400 bg-primary-50" : "border-gray-200 hover:border-gray-300 bg-gray-50"
            }`}
            onClick={() => idInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOverId(true); }}
            onDragLeave={() => setDragOverId(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverId(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleIdFile(f);
            }}
          >
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Drag and drop your ID, or <span className="text-primary-600">browse files</span>
            </p>
            <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          Make sure your name, photo, and date of birth are clearly visible.
        </p>
      </div>

      {/* Selfie capture */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Take a quick selfie</h3>
        <p className="text-sm text-gray-400 mb-5">
          We compare this to your ID photo to confirm it&apos;s really you.
        </p>

        <input
          ref={selfieInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleSelfieFile(f);
          }}
        />

        {identity.selfiePreview ? (
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary-100">
              <img src={identity.selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  setIdentity((s) => ({ ...s, selfieFile: null, selfiePreview: null }));
                  if (selfieInputRef.current) selfieInputRef.current.value = "";
                }}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-500 hover:text-error-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-primary-600 font-medium mt-3">Looking good!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Circular frame guide */}
            <div
              className="w-48 h-48 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
              onClick={() => selfieInputRef.current?.click()}
            >
              <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
              <p className="text-sm font-medium text-gray-500">Take a selfie</p>
            </div>
            <button
              onClick={() => selfieInputRef.current?.click()}
              className="mt-3 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              Or upload a photo instead
            </button>
          </div>
        )}
      </div>

      {/* Privacy reassurance */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex gap-3">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <p className="text-xs text-gray-500 leading-relaxed">
          Your ID and selfie are encrypted and stored securely. We use Stripe Identity for verification — an industry-standard service used by companies like Lyft, DoorDash, and Substack.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          onClick={onBack}
          className="order-2 sm:order-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back to profile
        </button>
        <div className="order-1 sm:order-2 flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex-1 sm:flex-initial px-8 py-3.5 text-[15px] font-semibold rounded-xl transition-colors shadow-sm ${
              canSubmit
                ? "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20"
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            Submit for verification
          </button>
        </div>
      </div>
    </div>
  );
}
