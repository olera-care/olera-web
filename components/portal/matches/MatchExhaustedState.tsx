"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function MatchExhaustedState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-10">
      <span className="text-5xl mb-4">✨</span>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        You&apos;ve seen all your matches
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-[360px] leading-relaxed">
        We&apos;re finding more providers that fit your care needs. Check back
        tomorrow, or complete your profile for better matches.
      </p>
      <div className="flex gap-3">
        <Link href="/portal/profile">
          <Button size="sm">Complete your profile</Button>
        </Link>
        <Link href="/browse">
          <Button size="sm" variant="secondary">
            Browse providers
          </Button>
        </Link>
      </div>
    </div>
  );
}
