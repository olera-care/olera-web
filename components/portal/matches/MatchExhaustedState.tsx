"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

interface MatchExhaustedStateProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function MatchExhaustedState({
  onRefresh,
  refreshing,
}: MatchExhaustedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-10">
      <span className="text-5xl mb-4">✨</span>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        You&apos;ve reviewed this batch
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-[360px] leading-relaxed">
        Refresh to see more recommendations, or browse all providers in your
        area.
      </p>
      <div className="flex gap-3">
        {onRefresh && (
          <Button size="sm" onClick={onRefresh} loading={refreshing}>
            Refresh matches
          </Button>
        )}
        <Link href="/browse">
          <Button size="sm" variant="secondary">
            Browse providers
          </Button>
        </Link>
      </div>
    </div>
  );
}
