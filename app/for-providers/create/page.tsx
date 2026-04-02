"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy create-profile page. Redirects to the provider onboarding wizard.
 * Cleans up old storage from the previous create flow.
 */
export default function CreateProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Clean up old form storage from the previous create flow
    sessionStorage.removeItem("olera_create_profile_form");

    // Redirect to the provider onboarding flow (auth at the end)
    router.replace("/provider/onboarding");
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <p className="text-lg text-gray-500">Redirecting to onboarding...</p>
    </div>
  );
}
