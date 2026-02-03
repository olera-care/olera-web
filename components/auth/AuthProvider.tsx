"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { AuthState, Account, Profile, Membership, DeferredAction } from "@/lib/types";
import { setDeferredAction } from "@/lib/deferred-action";

interface AuthContextValue extends AuthState {
  /** Open the auth modal. Optionally store a deferred action to execute after auth. */
  openAuthModal: (deferred?: Omit<DeferredAction, "createdAt">) => void;
  /** Close the auth modal. */
  closeAuthModal: () => void;
  /** Whether the auth modal is currently open. */
  isAuthModalOpen: boolean;
  /** Sign out the current user. */
  signOut: () => Promise<void>;
  /** Refresh account/profile/membership data from the database. */
  refreshAccountData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    account: null,
    activeProfile: null,
    membership: null,
    isLoading: true,
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const configured = isSupabaseConfigured();

  // Fetch account, active profile, and membership for the current user
  const fetchAccountData = useCallback(
    async (userId: string) => {
      if (!configured) return { account: null, activeProfile: null, membership: null };

      const supabase = createClient();

      // Get account
      const { data: account } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .single<Account>();

      if (!account) return { account: null, activeProfile: null, membership: null };

      // Get active profile (if set)
      let activeProfile: Profile | null = null;
      if (account.active_profile_id) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", account.active_profile_id)
          .single<Profile>();
        activeProfile = data;
      }

      // Get membership (if exists)
      const { data: membership } = await supabase
        .from("memberships")
        .select("*")
        .eq("account_id", account.id)
        .single<Membership>();

      return { account, activeProfile, membership };
    },
    [configured]
  );

  // Initialize: check current session
  useEffect(() => {
    if (!configured) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const supabase = createClient();

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { account, activeProfile, membership } = await fetchAccountData(
          session.user.id
        );
        setState({
          user: { id: session.user.id, email: session.user.email! },
          account,
          activeProfile,
          membership,
          isLoading: false,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    init();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { account, activeProfile, membership } = await fetchAccountData(
          session.user.id
        );
        setState({
          user: { id: session.user.id, email: session.user.email! },
          account,
          activeProfile,
          membership,
          isLoading: false,
        });
      } else if (event === "SIGNED_OUT") {
        setState({
          user: null,
          account: null,
          activeProfile: null,
          membership: null,
          isLoading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured, fetchAccountData]);

  const openAuthModal = useCallback(
    (deferred?: Omit<DeferredAction, "createdAt">) => {
      if (deferred) {
        setDeferredAction(deferred);
      }
      setIsAuthModalOpen(true);
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signOut = useCallback(async () => {
    if (configured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setState({
      user: null,
      account: null,
      activeProfile: null,
      membership: null,
      isLoading: false,
    });
  }, [configured]);

  const refreshAccountData = useCallback(async () => {
    if (!state.user) return;
    const { account, activeProfile, membership } = await fetchAccountData(
      state.user.id
    );
    setState((prev) => ({ ...prev, account, activeProfile, membership }));
  }, [state.user, fetchAccountData]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        signOut,
        refreshAccountData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
