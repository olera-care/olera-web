"use client";

import { useState, useRef } from "react";
import type { IdentityFormState } from "./Step3Identity";
import type { StudentFormState } from "./Step5Student";
import OleraSelect from "./OleraSelect";

/* ─── Option Data ─────────────────────────────────────────── */

const SCHOOLS = [
  "University of Houston",
  "Texas A&M University",
  "Rice University",
  "Baylor University",
  "University of Texas at Austin",
  "Houston Community College",
  "Lone Star College",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year+", "Graduate"];

const PROGRAMS = ["Pre-Med", "Nursing", "Psychology", "Public Health", "Pre-PA", "Pre-Dental"];

const GRAD_YEARS = ["2026", "2027", "2028", "2029", "2030"];

/* ─── Component ───────────────────────────────────────────── */

export default function Step4Verify({
  identity,
  setIdentity,
  student,
  setStudent,
  onBack,
  onContinue,
}: {
  identity: IdentityFormState;
  setIdentity: React.Dispatch<React.SetStateAction<IdentityFormState>>;
  student: StudentFormState;
  setStudent: React.Dispatch<React.SetStateAction<StudentFormState>>;
  onBack: () => void;
  onContinue: () => void;
}) {
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const studentIdUploadRef = useRef<HTMLInputElement>(null);
  const docUploadRef = useRef<HTMLInputElement>(null);
  const [dragOverId, setDragOverId] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleIdFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setIdentity((s) => ({ ...s, idFile: file, idPreview: url }));
  };

  const handleSelfieFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setIdentity((s) => ({ ...s, selfieFile: file, selfiePreview: url }));
  };

  const handleStudentFile = (
    file: File,
    fileKey: "studentIdFile" | "documentFile",
    previewKey: "studentIdPreview" | "documentPreview"
  ) => {
    const url = URL.createObjectURL(file);
    setStudent((s) => ({ ...s, [fileKey]: file, [previewKey]: url }));
  };

  const selectField = (
    key: keyof StudentFormState,
    label: string,
    options: string[],
    placeholder: string,
    includeOther = false
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <OleraSelect
        value={student[key] as string}
        onChange={(v) => setStudent((s) => ({ ...s, [key]: v }))}
        options={options}
        placeholder={placeholder}
        includeOther={includeOther}
        error={!!errors[key]}
      />
      {errors[key] && <p className="text-xs text-error-500 mt-1">{errors[key]}</p>}
    </div>
  );

  const handleSubmit = () => {
    setIdentity((s) => ({ ...s, submitted: true }));
    if (student.verifyMethod === "edu") {
      setStudent((s) => ({ ...s, eduEmailSent: true, submitted: true }));
    } else {
      setStudent((s) => ({ ...s, submitted: true }));
    }
    setSubmitted(true);
  };

  /* ── Submitted success state ── */
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
            Verification submitted
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Your identity and student status are being reviewed. You&apos;ll get an email when each one clears.
          </p>

          <div className="inline-flex flex-col gap-2 text-left mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning-50 border border-warning-100">
              <svg className="w-4 h-4 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-sm text-warning-700 font-medium">Identity: 1-2 business days</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              student.verifyMethod === "edu" ? "bg-primary-50 border border-primary-100" : "bg-warning-50 border border-warning-100"
            }`}>
              {student.verifyMethod === "edu" ? (
                <>
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  <span className="text-sm text-primary-700 font-medium">Student: Check your .edu inbox</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-sm text-warning-700 font-medium">Student: 1 business day</span>
                </>
              )}
            </div>
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

  /* ── Form ── */
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
          Verify your identity and student status
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Families need to know you are who you say you are and that you&apos;re an enrolled student. This usually takes 1-2 business days.
        </p>
      </div>

      {/* Why this matters */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        <p className="text-sm text-primary-800">
          Identity and student verification are required before you can go live on the platform. This keeps families safe and maintains the quality of our caregiver network.
        </p>
      </div>

      {/* ── Identity section ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload a government-issued ID</h3>
        <p className="text-sm text-gray-400 mb-5">Driver&apos;s license, passport, or state ID accepted.</p>

        <input
          ref={idInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleIdFile(f); }}
        />

        {identity.idPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img src={identity.idPreview} alt="ID preview" className="w-full max-h-48 object-contain" />
            <button
              onClick={() => { setIdentity((s) => ({ ...s, idFile: null, idPreview: null })); if (idInputRef.current) idInputRef.current.value = ""; }}
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
            onDrop={(e) => { e.preventDefault(); setDragOverId(false); const f = e.dataTransfer.files?.[0]; if (f) handleIdFile(f); }}
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
        <p className="text-xs text-gray-400 mt-3">Make sure your name, photo, and date of birth are clearly visible.</p>
      </div>

      {/* Selfie */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Take a quick selfie</h3>
        <p className="text-sm text-gray-400 mb-5">We compare this to your ID photo to confirm it&apos;s really you.</p>

        <input
          ref={selfieInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSelfieFile(f); }}
        />

        {identity.selfiePreview ? (
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-primary-100">
              <img src={identity.selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
              <button
                onClick={() => { setIdentity((s) => ({ ...s, selfieFile: null, selfiePreview: null })); if (selfieInputRef.current) selfieInputRef.current.value = ""; }}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-500 hover:text-error-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div
              className="w-36 h-36 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
              onClick={() => selfieInputRef.current?.click()}
            >
              <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
              <p className="text-xs font-medium text-gray-500">Take a selfie</p>
            </div>
            <button onClick={() => selfieInputRef.current?.click()} className="mt-3 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors">
              Or upload a photo instead
            </button>
          </div>
        )}
      </div>

      {/* ── Student section ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Your school</h3>
          <p className="text-xs text-gray-400">Only students from partner schools can join during our Houston launch. More schools coming soon.</p>
        </div>

        {selectField("school", "Select your school", SCHOOLS, "Choose your school...", true)}

        {student.school === "Other" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">School name</label>
            <input
              type="text"
              value={student.schoolOther}
              onChange={(e) => setStudent((s) => ({ ...s, schoolOther: e.target.value }))}
              placeholder="Enter your school name"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {selectField("year", "Year", YEARS, "Select year...")}
          {selectField("program", "Program", PROGRAMS, "Select program...", true)}
        </div>

        {student.program === "Other" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Program name</label>
            <input
              type="text"
              value={student.programOther}
              onChange={(e) => setStudent((s) => ({ ...s, programOther: e.target.value }))}
              placeholder="Enter your program"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
        )}

        {selectField("gradYear", "Expected graduation year", GRAD_YEARS, "Select year...")}
      </div>

      {/* Enrollment verification method */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Verify your enrollment</h3>
          <p className="text-sm text-gray-400 mb-2">How would you like to verify your enrollment?</p>
        </div>

        <div className="space-y-3">
          {/* .edu email */}
          <div
            className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
              student.verifyMethod === "edu" ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-500" : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setStudent((s) => ({ ...s, verifyMethod: "edu" }))}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${student.verifyMethod === "edu" ? "border-primary-500" : "border-gray-300"}`}>
                {student.verifyMethod === "edu" && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">Use your .edu email</p>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 uppercase">Fastest</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Takes 1-2 minutes</p>
              </div>
            </div>
            {student.verifyMethod === "edu" && (
              <div className="mt-4 ml-8">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">.edu email address</label>
                <input
                  type="email"
                  value={student.eduEmail}
                  onChange={(e) => setStudent((s) => ({ ...s, eduEmail: e.target.value }))}
                  placeholder="you@university.edu"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Student ID */}
          <div
            className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
              student.verifyMethod === "id" ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-500" : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setStudent((s) => ({ ...s, verifyMethod: "id" }))}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${student.verifyMethod === "id" ? "border-primary-500" : "border-gray-300"}`}>
                {student.verifyMethod === "id" && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Upload your student ID</p>
                <p className="text-xs text-gray-500 mt-0.5">Takes 1 business day</p>
              </div>
            </div>
            {student.verifyMethod === "id" && (
              <div className="mt-4 ml-8">
                <input ref={studentIdUploadRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStudentFile(f, "studentIdFile", "studentIdPreview"); }} />
                {student.studentIdPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={student.studentIdPreview} alt="Student ID" className="w-full max-h-40 object-contain" />
                    <button onClick={(e) => { e.stopPropagation(); setStudent((s) => ({ ...s, studentIdFile: null, studentIdPreview: null })); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-500 hover:text-error-600 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-gray-300 bg-gray-50 transition-colors"
                    onClick={(e) => { e.stopPropagation(); studentIdUploadRef.current?.click(); }}>
                    <svg className="w-7 h-7 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                    <p className="text-xs text-gray-500">Click to upload your student ID</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Document */}
          <div
            className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
              student.verifyMethod === "document" ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-500" : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setStudent((s) => ({ ...s, verifyMethod: "document" }))}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${student.verifyMethod === "document" ? "border-primary-500" : "border-gray-300"}`}>
                {student.verifyMethod === "document" && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Upload an enrollment letter or transcript</p>
                <p className="text-xs text-gray-500 mt-0.5">Takes 1 business day</p>
              </div>
            </div>
            {student.verifyMethod === "document" && (
              <div className="mt-4 ml-8">
                <input ref={docUploadRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStudentFile(f, "documentFile", "documentPreview"); }} />
                {student.documentPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={student.documentPreview} alt="Document" className="w-full max-h-40 object-contain" />
                    <button onClick={(e) => { e.stopPropagation(); setStudent((s) => ({ ...s, documentFile: null, documentPreview: null })); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-500 hover:text-error-600 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-gray-300 bg-gray-50 transition-colors"
                    onClick={(e) => { e.stopPropagation(); docUploadRef.current?.click(); }}>
                    <svg className="w-7 h-7 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                    <p className="text-xs text-gray-500">Click to upload your document</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Privacy reassurance */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex gap-3">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <p className="text-xs text-gray-500 leading-relaxed">
          Your ID, selfie, and student documents are encrypted and stored securely. We use Stripe Identity for verification — an industry-standard service used by companies like Lyft, DoorDash, and Substack.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button onClick={onBack} className="order-2 sm:order-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Back to experience
        </button>
        <button
          onClick={handleSubmit}
          className="order-1 sm:order-2 w-full sm:w-auto px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-[15px] font-semibold rounded-xl transition-colors shadow-sm shadow-primary-600/20"
        >
          Submit for verification
        </button>
      </div>
    </div>
  );
}
