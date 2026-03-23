import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import ProviderWelcomeClient from "@/components/provider-welcome/ProviderWelcomeClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Welcome | Olera for Providers",
  description: "View and respond to families looking for care.",
};

export type ActionType = "lead" | "question" | "review" | "message" | "match";

interface ProviderWelcomePageProps {
  searchParams: Promise<{
    action?: ActionType;
    id?: string;
  }>;
}

/**
 * Helper to get provider info for unauthenticated users (State 2: expired magic link)
 * Returns provider profile and email if found
 */
async function getProviderInfoForAuth(
  action: ActionType,
  actionId: string | undefined
): Promise<{ profile: { id: string; display_name: string; image_url: string | null; city: string | null; state: string | null } | null; email: string | null }> {
  if (!actionId) return { profile: null, email: null };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { profile: null, email: null };

  const adminDb = createAdminClient(url, serviceKey);

  let providerProfileId: string | null = null;

  // Step 1: Get provider profile ID from action data
  switch (action) {
    case "lead":
    case "match":
    case "message": {
      const { data: connection } = await adminDb
        .from("connections")
        .select("to_profile_id")
        .eq("id", actionId)
        .single();
      providerProfileId = connection?.to_profile_id || null;
      break;
    }
    case "question": {
      // Questions use provider slug, need to look up profile
      const { data: question } = await adminDb
        .from("provider_questions")
        .select("provider_id")
        .eq("id", actionId)
        .single();
      if (question?.provider_id) {
        const { data: profile } = await adminDb
          .from("business_profiles")
          .select("id")
          .eq("slug", question.provider_id)
          .single();
        providerProfileId = profile?.id || null;
      }
      break;
    }
    case "review": {
      const { data: review } = await adminDb
        .from("reviews")
        .select("provider_id")
        .eq("id", actionId)
        .single();
      providerProfileId = review?.provider_id || null;
      break;
    }
  }

  if (!providerProfileId) return { profile: null, email: null };

  // Step 2: Get provider profile details
  const { data: profile } = await adminDb
    .from("business_profiles")
    .select("id, display_name, image_url, city, state, account_id")
    .eq("id", providerProfileId)
    .single();

  if (!profile?.account_id) return { profile: profile ? { id: profile.id, display_name: profile.display_name, image_url: profile.image_url, city: profile.city, state: profile.state } : null, email: null };

  // Step 3: Get account to find user_id
  const { data: account } = await adminDb
    .from("accounts")
    .select("user_id")
    .eq("id", profile.account_id)
    .single();

  if (!account?.user_id) return { profile: { id: profile.id, display_name: profile.display_name, image_url: profile.image_url, city: profile.city, state: profile.state }, email: null };

  // Step 4: Get user email from auth.users
  const { data: { user: authUser } } = await adminDb.auth.admin.getUserById(account.user_id);
  const email = authUser?.email || null;

  return {
    profile: { id: profile.id, display_name: profile.display_name, image_url: profile.image_url, city: profile.city, state: profile.state },
    email,
  };
}

export default async function ProviderWelcomePage({ searchParams }: ProviderWelcomePageProps) {
  const params = await searchParams;
  const action = params.action || "lead";
  const actionId = params.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch provider profile for the authenticated user
  let providerProfile = null;
  let providerStats = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let actionData: any = null;
  // For unauthenticated users (State 2: expired magic link)
  let providerForAuth: { profile: { id: string; display_name: string; image_url: string | null; city: string | null; state: string | null } | null; email: string | null } | null = null;

  if (user) {
    // Get the user's account and active profile
    const { data: account } = await supabase
      .from("accounts")
      .select("id, display_name, active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (account?.active_profile_id) {
      // Get the provider profile
      const { data: profile } = await supabase
        .from("business_profiles")
        .select("id, display_name, type, slug, image_url, city, state")
        .eq("id", account.active_profile_id)
        .single();

      if (profile && (profile.type === "organization" || profile.type === "caregiver")) {
        providerProfile = profile;

        // Fetch stats for the provider
        const [leadsResult, questionsResult, reviewsResult, messagesResult] = await Promise.all([
          // Leads (connections where this provider is the recipient)
          supabase
            .from("connections")
            .select("id", { count: "exact", head: true })
            .eq("to_profile_id", profile.id)
            .eq("status", "pending"),
          // Unanswered questions
          supabase
            .from("provider_questions")
            .select("id", { count: "exact", head: true })
            .eq("provider_id", profile.slug)
            .is("answer", null),
          // Total reviews
          supabase
            .from("reviews")
            .select("id", { count: "exact", head: true })
            .eq("provider_id", profile.id),
          // Unread messages (connections with unread messages)
          supabase
            .from("connections")
            .select("id", { count: "exact", head: true })
            .or(`to_profile_id.eq.${profile.id},from_profile_id.eq.${profile.id}`)
            .gt("metadata->unread_count", 0),
        ]);

        providerStats = {
          leads: leadsResult.count || 0,
          questions: questionsResult.count || 0,
          reviews: reviewsResult.count || 0,
          messages: messagesResult.count || 0,
        };

        // Fetch action-specific data if we have an ID
        if (actionId) {
          switch (action) {
            case "lead":
            case "match": {
              const { data: connection } = await supabase
                .from("connections")
                .select(`
                  id,
                  created_at,
                  metadata,
                  from_profile:from_profile_id (
                    id,
                    display_name,
                    city,
                    state,
                    image_url
                  )
                `)
                .eq("id", actionId)
                .single();
              // Supabase returns joined relations, normalize the shape
              if (connection) {
                actionData = {
                  ...connection,
                  from_profile: Array.isArray(connection.from_profile)
                    ? connection.from_profile[0]
                    : connection.from_profile,
                };
              }
              break;
            }
            case "question": {
              const { data: question } = await supabase
                .from("provider_questions")
                .select("id, question, asker_name, created_at")
                .eq("id", actionId)
                .single();
              actionData = question;
              break;
            }
            case "review": {
              const { data: review } = await supabase
                .from("reviews")
                .select("id, rating, comment, reviewer_name, created_at")
                .eq("id", actionId)
                .single();
              actionData = review;
              break;
            }
            case "message": {
              const { data: connection } = await supabase
                .from("connections")
                .select(`
                  id,
                  metadata,
                  from_profile:from_profile_id (
                    id,
                    display_name,
                    image_url
                  ),
                  to_profile:to_profile_id (
                    id,
                    display_name,
                    image_url
                  )
                `)
                .eq("id", actionId)
                .single();
              // Supabase returns joined relations, normalize the shape
              if (connection) {
                actionData = {
                  ...connection,
                  from_profile: Array.isArray(connection.from_profile)
                    ? connection.from_profile[0]
                    : connection.from_profile,
                  to_profile: Array.isArray(connection.to_profile)
                    ? connection.to_profile[0]
                    : connection.to_profile,
                };
              }
              break;
            }
          }
        }
      }
    }
  } else {
    // User not authenticated — fetch provider info for State 2 (expired magic link)
    providerForAuth = await getProviderInfoForAuth(action, actionId);
  }

  return (
    <ProviderWelcomeClient
      user={user}
      providerProfile={providerProfile}
      providerStats={providerStats}
      action={action}
      actionId={actionId}
      actionData={actionData}
      providerForAuth={providerForAuth}
    />
  );
}
