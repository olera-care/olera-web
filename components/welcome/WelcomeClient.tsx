"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

interface WelcomeClientProps {
  destination: string;
  initialProviders?: unknown[];
  initialCity?: string | null;
}

export default function WelcomeClient({ destination }: WelcomeClientProps) {
  const { user, account, activeProfile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userName = activeProfile?.display_name?.split(" ")[0] || account?.display_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome, {userName}!
        </h1>
        <p className="text-gray-600 mb-8">
          This is a minimal test version of the Welcome page.
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            User: {user?.email || "Not logged in"}
          </p>
          <p className="text-sm text-gray-500">
            Profile: {activeProfile?.display_name || "No profile"}
          </p>
          <p className="text-sm text-gray-500">
            Destination: {destination}
          </p>
        </div>
        <div className="mt-8">
          <Link
            href={destination}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Continue to {destination}
          </Link>
        </div>
      </div>
    </div>
  );
}
