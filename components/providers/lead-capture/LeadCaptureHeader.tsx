"use client";

import Image from "next/image";
import type { LeadCaptureEntryPoint, StaffDisplayInfo } from "./types";

interface LeadCaptureHeaderProps {
  entryPoint: LeadCaptureEntryPoint;
  staff?: StaffDisplayInfo | null;
  providerName: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function LeadCaptureHeader({
  entryPoint,
  staff,
  providerName,
}: LeadCaptureHeaderProps) {
  // Message host variant with staff info
  if (entryPoint === "message_host" && staff) {
    return (
      <div className="flex items-center gap-4 pb-5">
        <div className="relative flex-shrink-0">
          {staff.image ? (
            <Image
              src={staff.image}
              alt={staff.name}
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary-600">
                {getInitials(staff.name)}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">{staff.name}</p>
          <p className="text-sm text-gray-500">{staff.role}</p>
        </div>
      </div>
    );
  }

  // Custom quote variant
  if (entryPoint === "custom_quote") {
    return (
      <div className="flex items-center gap-4 pb-5">
        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-7 h-7 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">
            Get pricing tailored to your needs
          </p>
          <p className="text-sm text-gray-500">
            {providerName} will respond with a custom quote
          </p>
        </div>
      </div>
    );
  }

  // Book consultation variant
  if (entryPoint === "book_consultation") {
    return (
      <div className="flex items-center gap-4 pb-5">
        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-7 h-7 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">
            Schedule a consultation
          </p>
          <p className="text-sm text-gray-500">
            Discuss care options with {providerName}
          </p>
        </div>
      </div>
    );
  }

  // Fallback for message_host without staff
  return (
    <div className="flex items-center gap-4 pb-5">
      <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
        <svg
          className="w-7 h-7 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-gray-900">
          Send a message
        </p>
        <p className="text-sm text-gray-500">
          Connect with {providerName}
        </p>
      </div>
    </div>
  );
}
