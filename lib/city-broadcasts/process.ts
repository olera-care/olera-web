/**
 * City Broadcasts - Core Processing Logic
 *
 * Handles detection of new events (questions, published profiles) and
 * processing them into broadcast emails to eligible providers.
 */

import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { findEligibleProviders, type EligibleProvider } from "./eligibility";
import { renderQuestionBroadcast, renderProfileBroadcast } from "./templates";

/** Email types for city broadcasts (registered in email governance) */
export const CITY_BROADCAST_QUESTION_TYPE = "city_broadcast_question";
export const CITY_BROADCAST_PROFILE_TYPE = "city_broadcast_profile";

/** Max events to process per cron run */
const BATCH_SIZE = 50;

/** Max providers to notify per event */
const MAX_PROVIDERS_PER_EVENT = 20;

export interface DetectedEvent {
  eventType: "question_asked" | "profile_published";
  eventId: string;
  city: string;
  state: string | null;
  category: string | null;
  questionText?: string;
}

export interface ProcessResult {
  eventsDetected: number;
  eventsProcessed: number;
  eventsSkipped: number;
  providersSent: number;
  providersSkipped: number;
}

/**
 * Detect new events that should trigger city broadcasts.
 * Looks for questions and published profiles from the last hour
 * that haven't been processed yet.
 */
export async function detectNewEvents(): Promise<DetectedEvent[]> {
  const db = getServiceClient();
  const events: DetectedEvent[] = [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Find recent questions that haven't been broadcast
  // Questions are linked to a provider, so we get city from the provider
  const { data: questions, error: qErr } = await db
    .from("provider_questions")
    .select("id, question, provider_id")
    .gte("created_at", oneHourAgo)
    .eq("status", "pending")
    .is("canonical_question_id", null)
    .limit(BATCH_SIZE);

  if (qErr) {
    console.error("[city-broadcasts] Failed to fetch questions:", qErr);
  } else if (questions && questions.length > 0) {
    // Filter out questions that already have a broadcast event
    const questionIds = questions.map((q) => q.id);
    const { data: existing } = await db
      .from("city_broadcast_events")
      .select("event_id")
      .eq("event_type", "question_asked")
      .in("event_id", questionIds);
    const existingIds = new Set((existing || []).map((e) => e.event_id));

    // Fetch provider details for remaining questions
    const newQuestions = questions.filter((q) => !existingIds.has(q.id));
    if (newQuestions.length > 0) {
      const providerIds = newQuestions.map((q) => q.provider_id);
      const { data: providers } = await db
        .from("olera-providers")
        .select("provider_id, city, state, provider_category")
        .in("provider_id", providerIds);

      const providerMap = new Map(
        (providers || []).map((p) => [p.provider_id, p])
      );

      for (const q of newQuestions) {
        const provider = providerMap.get(q.provider_id);
        if (!provider?.city) continue;

        events.push({
          eventType: "question_asked",
          eventId: q.id,
          city: provider.city,
          state: provider.state || null,
          category: provider.provider_category || null,
          questionText: q.question,
        });
      }
    }
  }

  // Find recent published profiles that haven't been broadcast
  // seeker_activity has profile_id, need to join to business_profiles for city
  const { data: seekerActivity, error: pErr } = await db
    .from("seeker_activity")
    .select("id, profile_id, metadata")
    .eq("event_type", "profile_published")
    .gte("created_at", oneHourAgo)
    .limit(BATCH_SIZE);

  if (pErr) {
    console.error("[city-broadcasts] Failed to fetch profiles:", pErr);
  } else if (seekerActivity && seekerActivity.length > 0) {
    // Filter out profiles that already have a broadcast event
    const activityIds = seekerActivity.map((p) => p.id);
    const { data: existing } = await db
      .from("city_broadcast_events")
      .select("event_id")
      .eq("event_type", "profile_published")
      .in("event_id", activityIds);
    const existingIds = new Set((existing || []).map((e) => e.event_id));

    // Fetch business_profiles to get city/state
    const newActivity = seekerActivity.filter((a) => !existingIds.has(a.id));
    if (newActivity.length > 0) {
      const profileIds = newActivity.map((a) => a.profile_id);
      const { data: profiles } = await db
        .from("business_profiles")
        .select("id, city, state")
        .in("id", profileIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      for (const activity of newActivity) {
        const profile = profileMap.get(activity.profile_id);
        if (!profile?.city) continue;

        events.push({
          eventType: "profile_published",
          eventId: activity.id,
          city: profile.city,
          state: profile.state || null,
          category: null, // Profile broadcasts don't filter by category
        });
      }
    }
  }

  return events;
}

/**
 * Create a broadcast event record for tracking.
 */
export async function createBroadcastEvent(event: DetectedEvent): Promise<string | null> {
  const db = getServiceClient();

  const { data, error } = await db
    .from("city_broadcast_events")
    .insert({
      event_type: event.eventType,
      event_id: event.eventId,
      city: event.city,
      state: event.state,
      category: event.category,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[city-broadcasts] Failed to create event:", error);
    return null;
  }

  return data.id;
}

/**
 * Process a single broadcast event: find eligible providers and send emails.
 */
export async function processEvent(
  broadcastEventId: string,
  event: DetectedEvent
): Promise<{ sent: number; skipped: number }> {
  const db = getServiceClient();
  let sent = 0;
  let skipped = 0;

  // Mark as processing
  await db
    .from("city_broadcast_events")
    .update({ status: "processing" })
    .eq("id", broadcastEventId);

  // Find eligible providers
  const { eligible, excluded } = await findEligibleProviders(
    event.city,
    event.category,
    MAX_PROVIDERS_PER_EVENT
  );

  const totalExcluded = Object.values(excluded).reduce((a, b) => a + b, 0);

  if (eligible.length === 0) {
    // No eligible providers - mark as skipped
    await db
      .from("city_broadcast_events")
      .update({
        status: "skipped",
        skip_reason: `No eligible providers (${totalExcluded} excluded)`,
        providers_eligible: 0,
        providers_sent: 0,
        processed_at: new Date().toISOString(),
      })
      .eq("id", broadcastEventId);

    return { sent: 0, skipped: 0 };
  }

  // Create recipient records
  const recipientRows = eligible.map((p) => ({
    event_id: broadcastEventId,
    provider_id: p.provider_id,
    provider_email: p.email,
    provider_name: p.name,
    status: "pending" as const,
  }));

  await db.from("city_broadcast_recipients").insert(recipientRows);

  // Send emails to each provider
  for (const provider of eligible) {
    const result = await sendBroadcastEmail(broadcastEventId, event, provider);
    if (result.sent) {
      sent++;
    } else {
      skipped++;
    }
  }

  // Mark event as completed
  await db
    .from("city_broadcast_events")
    .update({
      status: "completed",
      providers_eligible: eligible.length,
      providers_sent: sent,
      processed_at: new Date().toISOString(),
    })
    .eq("id", broadcastEventId);

  return { sent, skipped };
}

/**
 * Send a broadcast email to a single provider.
 */
async function sendBroadcastEmail(
  broadcastEventId: string,
  event: DetectedEvent,
  provider: EligibleProvider
): Promise<{ sent: boolean; error?: string }> {
  const db = getServiceClient();

  const ctx = {
    providerId: provider.provider_id,
    providerName: provider.name,
    providerSlug: provider.slug,
    providerEmail: provider.email,
    city: event.city,
    category: event.category,
    questionText: event.questionText,
  };

  const emailType =
    event.eventType === "question_asked"
      ? CITY_BROADCAST_QUESTION_TYPE
      : CITY_BROADCAST_PROFILE_TYPE;

  const rendered =
    event.eventType === "question_asked"
      ? renderQuestionBroadcast(ctx)
      : renderProfileBroadcast(ctx);

  const result = await sendEmail({
    to: provider.email,
    subject: rendered.subject,
    html: rendered.html,
    emailType,
    recipientType: "provider",
    providerId: provider.provider_id,
    metadata: {
      broadcast_event_id: broadcastEventId,
      event_type: event.eventType,
      city: event.city,
      category: event.category,
    },
  });

  // Update recipient record
  if (result.success && !result.skipped) {
    await db
      .from("city_broadcast_recipients")
      .update({
        status: "sent",
        email_log_id: result.emailLogId || null,
      })
      .eq("event_id", broadcastEventId)
      .eq("provider_id", provider.provider_id);

    return { sent: true };
  } else {
    await db
      .from("city_broadcast_recipients")
      .update({
        status: result.skipped ? "skipped" : "failed",
        skip_reason: result.skipReason || result.error || "Unknown error",
        email_log_id: result.emailLogId || null,
      })
      .eq("event_id", broadcastEventId)
      .eq("provider_id", provider.provider_id);

    return { sent: false, error: result.skipReason || result.error };
  }
}

/**
 * Process pending broadcast events.
 * Called by the cron job with a timeout guard.
 */
export async function processPendingEvents(
  maxRuntimeMs: number
): Promise<ProcessResult> {
  const db = getServiceClient();
  const startedAt = Date.now();
  const result: ProcessResult = {
    eventsDetected: 0,
    eventsProcessed: 0,
    eventsSkipped: 0,
    providersSent: 0,
    providersSkipped: 0,
  };

  // Step 1: Process any orphaned pending events from previous runs
  // This prevents events from getting stuck if the cron timed out mid-processing
  const { data: orphanedEvents } = await db
    .from("city_broadcast_events")
    .select("id, event_type, event_id, city, state, category")
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  for (const orphan of orphanedEvents || []) {
    if (Date.now() - startedAt > maxRuntimeMs) {
      result.eventsSkipped++;
      continue;
    }

    // We need to reconstruct the DetectedEvent - fetch question text if applicable
    let questionText: string | undefined;
    if (orphan.event_type === "question_asked") {
      const { data: question } = await db
        .from("provider_questions")
        .select("question")
        .eq("id", orphan.event_id)
        .single();
      questionText = question?.question;
    }

    const event: DetectedEvent = {
      eventType: orphan.event_type as "question_asked" | "profile_published",
      eventId: orphan.event_id,
      city: orphan.city,
      state: orphan.state,
      category: orphan.category,
      questionText,
    };

    const { sent, skipped } = await processEvent(orphan.id, event);
    result.eventsProcessed++;
    result.providersSent += sent;
    result.providersSkipped += skipped;
  }

  // Step 2: Detect new events
  const newEvents = await detectNewEvents();
  result.eventsDetected = newEvents.length;

  // Step 3: Create broadcast event records for new events
  const eventRecords: Array<{ id: string; event: DetectedEvent }> = [];
  for (const event of newEvents) {
    if (Date.now() - startedAt > maxRuntimeMs) break;
    const id = await createBroadcastEvent(event);
    if (id) {
      eventRecords.push({ id, event });
    }
  }

  // Step 4: Process each new event
  for (const record of eventRecords) {
    if (Date.now() - startedAt > maxRuntimeMs) {
      result.eventsSkipped++;
      continue;
    }

    const { sent, skipped } = await processEvent(record.id, record.event);
    result.eventsProcessed++;
    result.providersSent += sent;
    result.providersSkipped += skipped;
  }

  return result;
}
