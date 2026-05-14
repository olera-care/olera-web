"use client";

import { useState, useRef } from "react";

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

const PROGRAMS = [
  "Pre-Med",
  "Nursing",
  "Psychology",
  "Public Health",
  "Pre-PA",
  "Pre-Dental",
];

const GRAD_YEARS = ["2026", "2027", "2028", "2029", "2030"];

/* ─── Types ───────────────────────────────────────────────── */

export interface StudentFormState {
  school: string;
  schoolOther: string;
  year: string;
  program: string;
  programOther: string;
  gradYear: string;
  verifyMethod: "edu" | "id" | "document" | "";
  eduEmail: string;
  eduEmailSent: boolean;
  studentIdFile: File | null;
  studentIdPreview: string | null;
  documentFile: File | null;
  documentPreview: string | null;
  submitted: boolean;
}

export const INITIAL_STUDENT: StudentFormState = {
  school: "",
  schoolOther: "",
  year: "",
  program: "",
  programOther: "",
  gradYear: "",
  verifyMethod: "",
  eduEmail: "",
  eduEmailSent: false,
  studentIdFile: null,
  studentIdPreview: null,
  documentFile: null,
  documentPreview: null,
  submitted: false,
};

/* ─── Component ───────────────────────────────────────────── */

export default function Step5Student({
  student,
  setStudent,
  onBack,
  onContinue,
}: {
  student: StudentFormState;
  setStudent: React.Dispatch<React.SetStateAction<StudentFormState>>;
  onBack: () => void;
  onContinue: () => void;
}) {
  const idUploadRef = useRef<HTMLInputElement>(null);
  const docUploadRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileUpload = (
    file: File,
    fileKey: "studentIdFile" | "documentFile",
    previewKey: "studentIdPreview" | "documentPreview"
  ) => {
    const url = URL.createObjectURL(file);
    setStudent((s) => ({ ...s, [fileKey]: file, [previewKey]: url }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!student.school) e.school = "Please select a school";
    if (student.school === "Other" && !student.schoolOther.trim()) e.schoolOther = "Please enter your school name";
    if (!student.year) e.year = "Please select your year";
    if (!student.program) e.program = "Please select your program";
    if (student.program === "Other" && !student.programOther.trim()) e.programOther = "Please enter your program";
    if (!student.gradYear) e.gradYear = "Please select graduation year";
    if (!student.verifyMethod) e.verifyMethod = "Please select a verification method";
    if (student.verifyMethod === "edu" && !student.eduEmail.trim()) e.eduEmail = "Please enter your .edu email";
    if (student.verifyMethod === "edu" && student.eduEmail && !student.eduEmail.endsWith(".edu")) e.eduEmail = "Must be a .edu email address";
    if (student.verifyMethod === "id" && !student.studentIdFile) e.studentIdFile = "Please upload your student ID";
    if (student.verifyMethod === "document" && !student.documentFile) e.documentFile = "Please upload your enrollment document";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      if (student.verifyMethod === "edu") {
        setStudent((s) => ({ ...s, eduEmailSent: true, submitted: true }));
      } else {
        setStudent((s) => ({ ...s, submitted: true }));
      }
    }
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
      <select
        value={student[key] as string}
        onChange={(e) => setStudent((s) => ({ ...s, [key]: e.target.value }))}
        className={`w-full px-4 py-3 rounded-xl border ${
          errors[key] ? "border-error-300 ring-1 ring-error-300" : "border-gray-300"
        } text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
        {includeOther && <option value="Other">Other</option>}
      </select>
      {errors[key] && <p className="text-xs text-error-500 mt-1">{errors[key]}</p>}
    </div>
  );

  /* ── Submitted success state ── */
  if (student.submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
            Student status submitted for verification
          </h2>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mt-3 mb-8 ${
            student.verifyMethod === "edu"
              ? "bg-primary-50 border border-primary-100 text-primary-700"
              : "bg-warning-50 border border-warning-100 text-warning-700"
          }`}>
            {student.verifyMethod === "edu" ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                Verification email sent — check your inbox to complete.
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Pending review, usually 1 business day
              </>
            )}
          </div>
          <div>
            <button
              onClick={onContinue}
              className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-[15px] font-semibold rounded-xl transition-colors shadow-sm shadow-primary-600/20"
            >
              Continue to availability and rates
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
          Verify you&apos;re a student
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Olera caregivers are medical and healthcare students. Confirm your school and enrollment to continue.
        </p>
      </div>

      {/* Section A: Your school */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Your school</h3>
          <p className="text-xs text-gray-400">
            Only students from partner schools can join during our Houston launch. More schools coming soon.
          </p>
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
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.schoolOther ? "border-error-300 ring-1 ring-error-300" : "border-gray-300"
              } text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
            />
            {errors.schoolOther && <p className="text-xs text-error-500 mt-1">{errors.schoolOther}</p>}
          </div>
        )}
      </div>

      {/* Section B: Your program */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Your program</h3>

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
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.programOther ? "border-error-300 ring-1 ring-error-300" : "border-gray-300"
              } text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
            />
            {errors.programOther && <p className="text-xs text-error-500 mt-1">{errors.programOther}</p>}
          </div>
        )}

        {selectField("gradYear", "Expected graduation year", GRAD_YEARS, "Select year...")}
      </div>

      {/* Section C: Verify enrollment */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Verify your enrollment</h3>
          <p className="text-sm text-gray-400 mb-4">How would you like to verify your enrollment?</p>
          {errors.verifyMethod && <p className="text-xs text-error-500 mb-3">{errors.verifyMethod}</p>}
        </div>

        {/* Option cards */}
        <div className="space-y-3">
          {/* Option 1: .edu email */}
          <div
            className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
              student.verifyMethod === "edu"
                ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-500"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
            onClick={() => setStudent((s) => ({ ...s, verifyMethod: "edu" }))}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                student.verifyMethod === "edu" ? "border-primary-500" : "border-gray-300"
              }`}>
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
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={student.eduEmail}
                    onChange={(e) => setStudent((s) => ({ ...s, eduEmail: e.target.value }))}
                    placeholder="you@university.edu"
                    className={`flex-1 px-4 py-3 rounded-xl border ${
                      errors.eduEmail ? "border-error-300 ring-1 ring-error-300" : "border-gray-300"
                    } text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  />
                </div>
                {errors.eduEmail && <p className="text-xs text-error-500 mt-1">{errors.eduEmail}</p>}
              </div>
            )}
          </div>

          {/* Option 2: Student ID */}
          <div
            className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
              student.verifyMethod === "id"
                ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-500"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
            onClick={() => setStudent((s) => ({ ...s, verifyMethod: "id" }))}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                student.verifyMethod === "id" ? "border-primary-500" : "border-gray-300"
              }`}>
                {student.verifyMethod === "id" && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Upload your student ID</p>
                <p className="text-xs text-gray-500 mt-0.5">Takes 1 business day</p>
              </div>
            </div>
            {student.verifyMethod === "id" && (
              <div className="mt-4 ml-8">
                <input
                  ref={idUploadRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, "studentIdFile", "studentIdPreview");
                  }}
                />
                {student.studentIdPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={student.studentIdPreview} alt="Student ID" className="w-full max-h-48 object-contain" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStudent((s) => ({ ...s, studentIdFile: null, studentIdPreview: null }));
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-500 hover:text-error-600 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-300 bg-gray-50 transition-colors"
                    onClick={(e) => { e.stopPropagation(); idUploadRef.current?.click(); }}
                  >
                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm text-gray-500">Click to upload your student ID</p>
                    <p className="text-xs text-gray-400 mt-1">Make sure your name, school, and current year are visible</p>
                  </div>
                )}
                {errors.studentIdFile && <p className="text-xs text-error-500 mt-2">{errors.studentIdFile}</p>}
              </div>
            )}
          </div>

          {/* Option 3: Enrollment document */}
          <div
            className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
              student.verifyMethod === "document"
                ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-500"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
            onClick={() => setStudent((s) => ({ ...s, verifyMethod: "document" }))}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                student.verifyMethod === "document" ? "border-primary-500" : "border-gray-300"
              }`}>
                {student.verifyMethod === "document" && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Upload an enrollment letter or transcript</p>
                <p className="text-xs text-gray-500 mt-0.5">Takes 1 business day</p>
              </div>
            </div>
            {student.verifyMethod === "document" && (
              <div className="mt-4 ml-8">
                <input
                  ref={docUploadRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, "documentFile", "documentPreview");
                  }}
                />
                {student.documentPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={student.documentPreview} alt="Document" className="w-full max-h-48 object-contain" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStudent((s) => ({ ...s, documentFile: null, documentPreview: null }));
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-500 hover:text-error-600 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-300 bg-gray-50 transition-colors"
                    onClick={(e) => { e.stopPropagation(); docUploadRef.current?.click(); }}
                  >
                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm text-gray-500">Click to upload your document</p>
                    <p className="text-xs text-gray-400 mt-1">An official document from your registrar showing current enrollment</p>
                  </div>
                )}
                {errors.documentFile && <p className="text-xs text-error-500 mt-2">{errors.documentFile}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          onClick={onBack}
          className="order-2 sm:order-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back to background check
        </button>
        <div className="order-1 sm:order-2 flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleSubmit}
            className="flex-1 sm:flex-initial px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-[15px] font-semibold rounded-xl transition-colors shadow-sm shadow-primary-600/20"
          >
            {student.verifyMethod === "edu" ? "Send verification email" : "Submit for verification"}
          </button>
        </div>
      </div>
    </div>
  );
}
