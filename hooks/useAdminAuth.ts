"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminUser } from "@/lib/types";

const ADMIN_AUTH_TIMEOUT_MS = 5_000;

interface UseAdminAuthResult {
  adminUser: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useAdminAuth(): UseAdminAuthResult {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setAdminUser(null);
    setError(null);
    setIsLoading(true);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), ADMIN_AUTH_TIMEOUT_MS);

    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/auth", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setAdminUser(data.adminUser);
          } else if (res.status === 403) {
            setError("access_denied");
          } else if (res.status === 401) {
            setError("not_authenticated");
          } else {
            setError("server_error");
          }
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError((fetchError as Error)?.name === "AbortError" ? "timeout" : "network_error");
        }
      } finally {
        window.clearTimeout(timeout);
        if (!cancelled) setIsLoading(false);
      }
    }

    checkAdmin();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [attempt]);

  return { adminUser, isLoading, error, retry };
}
