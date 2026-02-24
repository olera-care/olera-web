import type { ReactNode } from "react";

interface SectionEmptyStateProps {
  icon: "clipboard" | "info" | "star" | "chat";
  message: string;
  subMessage?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

const icons: Record<SectionEmptyStateProps["icon"], ReactNode> = {
  clipboard: (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  chat: (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-11.25 5.25v-1.875a3.375 3.375 0 013.375-3.375h6.75a3.375 3.375 0 013.375 3.375v1.875m-16.5 0h16.5" />
    </svg>
  ),
};

export default function SectionEmptyState({
  icon,
  message,
  subMessage,
  ctaLabel,
  onCtaClick,
}: SectionEmptyStateProps) {
  return (
    <div className="bg-gradient-to-br from-vanilla-50 to-warm-25 rounded-xl py-10 px-6 flex flex-col items-center text-center border border-warm-100/40">
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 border border-warm-100/60 shadow-xs">
        {icons[icon]}
      </div>
      <p className="text-[15px] font-medium text-gray-900">{message}</p>
      {subMessage && (
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{subMessage}</p>
      )}
      {ctaLabel && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="mt-4 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
