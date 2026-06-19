"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Redirect legacy /medjobs/jobs/[id] to the consolidated workspace. */
export default function JobRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/medjobs/jobs?job=${id}`);
  }, [id, router]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mx-auto" />
    </div>
  );
}
