"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProviderProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/provider");
  }, [router]);

  return null;
}
