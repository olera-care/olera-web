import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "./whatsapp";
import { getRegionalEstimate, getPricingConfig } from "./pricing-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConversationState =
  | "sent_q1_recipient"
  | "sent_q2_needs"
  | "sent_q3_urgency"
  | "complete";

interface ConversationRow {
  id: string;
  connection_id: string;
  profile_id: string;
  phone: string;
  state: ConversationState;
  care_recipient: string | null;
  care_needs_text: string | null;
  urgency: string | null;
  provider_name: string | null;
  provider_category: string | null;
  created_at: string;
  updated_at: string;
}

interface StartConversationParams {
  connectionId: string;
  profileId: string;
  phone: string;
  seekerFirstName: string;
  providerName: string;
  providerCategory: string | null;
  city: string | null;
  state: string | null;
}

// ---------------------------------------------------------------------------
// DB helper
// ---------------------------------------------------------------------------

function getAdminDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase admin credentials missing");
  return createClient(url, serviceKey);
}

// ---------------------------------------------------------------------------
// Button text → stored value mappings
// ---------------------------------------------------------------------------

const RECIPIENT_MAP: Record<string, string> = {
  "my parent": "parent",
  "my spouse": "spouse",
  "myself": "self",
  // Fuzzy matches for free-text replies
  "parent": "parent",
  "mom": "parent",
  "dad": "parent",
  "mother": "parent",
  "father": "parent",
  "spouse": "spouse",
  "husband": "spouse",
  "wife": "spouse",
  "partner": "spouse",
  "me": "self",
  "self": "self",
  "i need": "self",
};

const URGENCY_MAP: Record<string, string> = {
  "right away": "immediate",
  "within a month": "within_1_month",
  "just exploring": "exploring",
  // Fuzzy
  "asap": "immediate",
  "immediately": "immediate",
  "now": "immediate",
  "urgent": "immediate",
  "soon": "within_1_month",
  "a month": "within_1_month",
  "few months": "exploring",
  "not sure": "exploring",
  "looking around": "exploring",
  "researching": "exploring",
};

// ---------------------------------------------------------------------------
// Start a new seeker enrichment conversation
// ---------------------------------------------------------------------------

export async function startSeekerConversation(
  params: StartConversationParams
): Promise<{ success: boolean; error?: string }> {
  const db = getAdminDb();

  // Build pricing string for Message 1
  const priceLine = buildPriceLine(
    params.providerCategory,
    params.state,
    params.city
  );
  const careTypeLabel = params.providerCategory
    ? getPricingConfig(params.providerCategory).label
    : "Care";
  const cityLabel = params.city || "your";
  const firstName = params.seekerFirstName || "there";
  const providerName = params.providerName || "the provider";

  // Create conversation row
  const { error: insertError } = await db
    .from("whatsapp_conversations")
    .insert({
      connection_id: params.connectionId,
      profile_id: params.profileId,
      phone: params.phone,
      state: "sent_q1_recipient",
      provider_name: providerName,
      provider_category: params.providerCategory,
    });

  if (insertError) {
    console.error("[wa-conv] Failed to create conversation:", insertError);
    return { success: false, error: insertError.message };
  }

  // Send Message 1
  const bodyText = priceLine
    ? `Hi ${firstName} — your inquiry to ${providerName} has been sent. ${careTypeLabel} in the ${cityLabel} area typically runs ${priceLine}.\n\nTo help them respond with the right information — who is the care for?`
    : `Hi ${firstName} — your inquiry to ${providerName} has been sent.\n\nTo help them respond with the right information — who is the care for?`;

  const result = await sendWhatsApp({
    to: params.phone,
    contentSid: process.env.TWILIO_WA_TPL_SEEKER_Q1 || "sandbox",
    contentVariables: {
      "1": firstName,
      "2": providerName,
      "3": careTypeLabel,
      "4": cityLabel,
      "5": priceLine || "varies by provider",
    },
    fallbackBody: bodyText + "\n\nReply: My parent, My spouse, or Myself",
    messageType: "seeker_enrichment_q1",
    recipientType: "seeker",
    profileId: params.profileId,
  });

  return result;
}

// ---------------------------------------------------------------------------
// Handle an inbound WhatsApp message (called by webhook)
// ---------------------------------------------------------------------------

export async function handleInboundMessage(
  phone: string,
  body: string,
  buttonText?: string
): Promise<{ handled: boolean; error?: string }> {
  const db = getAdminDb();

  // Find the most recent active conversation for this phone
  const { data: conv, error: lookupError } = await db
    .from("whatsapp_conversations")
    .select("*")
    .eq("phone", phone)
    .neq("state", "complete")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (lookupError || !conv) {
    return { handled: false, error: "No active conversation" };
  }

  const conversation = conv as ConversationRow;

  // Check 24hr window
  const ageMs = Date.now() - new Date(conversation.created_at).getTime();
  const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;
  if (ageMs > TWENTY_THREE_HOURS) {
    await db
      .from("whatsapp_conversations")
      .update({ state: "complete", updated_at: new Date().toISOString() })
      .eq("id", conversation.id);
    return { handled: false, error: "Conversation expired (>23hrs)" };
  }

  switch (conversation.state) {
    case "sent_q1_recipient":
      return handleQ1Reply(db, conversation, buttonText || body);

    case "sent_q2_needs":
      return handleQ2Reply(db, conversation, body);

    case "sent_q3_urgency":
      return handleQ3Reply(db, conversation, buttonText || body);

    case "complete":
      return { handled: false, error: "Conversation already complete" };

    default:
      return { handled: false, error: `Unknown state: ${conversation.state}` };
  }
}

// ---------------------------------------------------------------------------
// State handlers
// ---------------------------------------------------------------------------

async function handleQ1Reply(
  db: SupabaseClient,
  conv: ConversationRow,
  reply: string
): Promise<{ handled: boolean; error?: string }> {
  const normalized = reply.trim().toLowerCase();
  const careRecipient = RECIPIENT_MAP[normalized];

  if (!careRecipient) {
    // Check if we already retried (updated_at > created_at means we sent a retry)
    const hasRetried = conv.updated_at !== conv.created_at;
    if (hasRetried) {
      // Second miss — skip Q1, store "other", move to Q2
      await db
        .from("whatsapp_conversations")
        .update({
          care_recipient: "other",
          state: "sent_q2_needs",
          updated_at: new Date().toISOString(),
        })
        .eq("id", conv.id);

      await sendWhatsApp({
        to: conv.phone,
        contentSid: process.env.TWILIO_WA_TPL_SEEKER_Q2 || "sandbox",
        contentVariables: {},
        fallbackBody:
          "Got it — thank you. Can you share a little about what's going on? What's been the hardest part?\n\nEven a sentence or two helps providers understand your situation and respond faster.",
        messageType: "seeker_enrichment_q2",
        recipientType: "seeker",
        profileId: conv.profile_id,
      });
      return { handled: true };
    }

    // First miss — re-ask once
    await db
      .from("whatsapp_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conv.id);

    await sendWhatsApp({
      to: conv.phone,
      contentSid: "sandbox",
      contentVariables: {},
      fallbackBody:
        "No worries — just let me know: is the care for your parent, your spouse, or yourself?",
      messageType: "seeker_enrichment_q1_retry",
      recipientType: "seeker",
      profileId: conv.profile_id,
    });
    return { handled: true };
  }

  // Store answer, advance state, send Message 2
  await db
    .from("whatsapp_conversations")
    .update({
      care_recipient: careRecipient,
      state: "sent_q2_needs",
      updated_at: new Date().toISOString(),
    })
    .eq("id", conv.id);

  await sendWhatsApp({
    to: conv.phone,
    contentSid: process.env.TWILIO_WA_TPL_SEEKER_Q2 || "sandbox",
    contentVariables: {},
    fallbackBody:
      "Got it — thank you. Can you share a little about what's going on? What's been the hardest part?\n\nEven a sentence or two helps providers understand your situation and respond faster.",
    messageType: "seeker_enrichment_q2",
    recipientType: "seeker",
    profileId: conv.profile_id,
  });

  return { handled: true };
}

async function handleQ2Reply(
  db: SupabaseClient,
  conv: ConversationRow,
  reply: string
): Promise<{ handled: boolean; error?: string }> {
  const careNeedsText = reply.trim();

  if (!careNeedsText || careNeedsText.length < 2) {
    // Empty or too short — still advance (don't nag)
  }

  // Store the open-text answer, advance state, send Message 3
  const firstName = conv.provider_name ? "" : "there"; // We'll use a variable in template
  await db
    .from("whatsapp_conversations")
    .update({
      care_needs_text: careNeedsText || null,
      state: "sent_q3_urgency",
      updated_at: new Date().toISOString(),
    })
    .eq("id", conv.id);

  await sendWhatsApp({
    to: conv.phone,
    contentSid: process.env.TWILIO_WA_TPL_SEEKER_Q3 || "sandbox",
    contentVariables: {
      // Template uses {{1}} for a personal touch — but we don't have first name on the conversation row.
      // The connection message JSON has it. For now use empty string; template handles gracefully.
      "1": "",
    },
    fallbackBody:
      "Thank you for sharing that. We've passed this along so they can give you a much more specific response.\n\nOne last thing — how soon are you looking for help?\n\nReply: Right away, Within a month, or Just exploring",
    messageType: "seeker_enrichment_q3",
    recipientType: "seeker",
    profileId: conv.profile_id,
  });

  return { handled: true };
}

async function handleQ3Reply(
  db: SupabaseClient,
  conv: ConversationRow,
  reply: string
): Promise<{ handled: boolean; error?: string }> {
  const normalized = reply.trim().toLowerCase();
  const urgency = URGENCY_MAP[normalized];

  if (!urgency) {
    // Can't parse — still complete the conversation, store raw text
    await db
      .from("whatsapp_conversations")
      .update({
        urgency: normalized,
        state: "complete",
        updated_at: new Date().toISOString(),
      })
      .eq("id", conv.id);
  } else {
    await db
      .from("whatsapp_conversations")
      .update({
        urgency,
        state: "complete",
        updated_at: new Date().toISOString(),
      })
      .eq("id", conv.id);
  }

  // Send final confirmation (free-form within 24hr window)
  await sendWhatsApp({
    to: conv.phone,
    contentSid: "sandbox",
    contentVariables: {},
    fallbackBody:
      "All set. We'll message you here as soon as they respond.",
    messageType: "seeker_enrichment_complete",
    recipientType: "seeker",
    profileId: conv.profile_id,
  });

  // Sync enrichment data to the connection + profile
  await syncEnrichmentToConnection(db, conv.connection_id, {
    careRecipient: conv.care_recipient || undefined,
    careNeedsText: conv.care_needs_text || undefined,
    urgency: urgency || normalized,
  });

  return { handled: true };
}

// ---------------------------------------------------------------------------
// Sync collected data back to connection + profile
// ---------------------------------------------------------------------------

async function syncEnrichmentToConnection(
  db: SupabaseClient,
  connectionId: string,
  data: {
    careRecipient?: string;
    careNeedsText?: string;
    urgency?: string;
  }
): Promise<void> {
  try {
    // Read current connection
    const { data: conn, error } = await db
      .from("connections")
      .select("message, metadata, from_profile_id")
      .eq("id", connectionId)
      .single();

    if (error || !conn) {
      console.error("[wa-conv] Failed to read connection:", error);
      return;
    }

    // Parse existing message JSON
    let messageObj: Record<string, unknown> = {};
    try {
      messageObj =
        typeof conn.message === "string"
          ? JSON.parse(conn.message)
          : conn.message || {};
    } catch {
      messageObj = {};
    }

    // Merge enrichment data
    if (data.careRecipient) messageObj.care_recipient = data.careRecipient;
    if (data.urgency) messageObj.urgency = data.urgency;
    if (data.careNeedsText) {
      messageObj.care_needs_text = data.careNeedsText;
      // Also append to additional_notes for provider visibility
      const existing = (messageObj.additional_notes as string) || "";
      messageObj.additional_notes = existing
        ? `${existing}\n\n[Via WhatsApp] ${data.careNeedsText}`
        : `[Via WhatsApp] ${data.careNeedsText}`;
    }

    // Add to thread
    const metadata = (conn.metadata || {}) as Record<string, unknown>;
    const thread = (metadata.thread as Array<Record<string, unknown>>) || [];
    if (data.careNeedsText) {
      thread.push({
        from_profile_id: conn.from_profile_id,
        text: data.careNeedsText,
        source: "whatsapp_enrichment",
        created_at: new Date().toISOString(),
      });
      metadata.thread = thread;
    }

    // Regenerate auto_intro with enrichment
    const firstName = (messageObj.seeker_first_name as string) || "A family";
    const city = messageObj.looking_in_city as string;
    const state = messageObj.looking_in_state as string;
    const location = [city, state].filter(Boolean).join(", ");
    const recipientLabel = data.careRecipient
      ? `for their ${data.careRecipient}`
      : "";

    let autoIntro = `${firstName} is looking for care ${recipientLabel}${location ? ` in ${location}` : ""}.`;
    if (data.careNeedsText) {
      autoIntro += ` "${data.careNeedsText}"`;
    }
    metadata.auto_intro = autoIntro;
    metadata.whatsapp_enriched = true;
    metadata.whatsapp_enriched_at = new Date().toISOString();

    // Write back
    await db
      .from("connections")
      .update({
        message: JSON.stringify(messageObj),
        metadata,
      })
      .eq("id", connectionId);

    // Sync to profile metadata
    if (conn.from_profile_id) {
      const { data: profile } = await db
        .from("business_profiles")
        .select("metadata")
        .eq("id", conn.from_profile_id)
        .single();

      const profileMeta = (profile?.metadata || {}) as Record<string, unknown>;
      if (data.careRecipient) {
        profileMeta.relationship_to_recipient = data.careRecipient;
      }
      if (data.urgency) profileMeta.timeline = data.urgency;
      if (data.careNeedsText) {
        profileMeta.care_needs_text = data.careNeedsText;
      }
      profileMeta.whatsapp_enriched = true;

      await db
        .from("business_profiles")
        .update({ metadata: profileMeta })
        .eq("id", conn.from_profile_id);
    }

    console.log(
      `[wa-conv] Synced enrichment for connection ${connectionId}: recipient=${data.careRecipient}, urgency=${data.urgency}, needs=${data.careNeedsText?.slice(0, 50)}`
    );
  } catch (err) {
    console.error("[wa-conv] Failed to sync enrichment:", err);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPriceLine(
  category: string | null,
  state: string | null,
  city: string | null
): string | null {
  if (!category || !state) return null;
  const estimate = getRegionalEstimate(category, state, city);
  if (!estimate) return null;
  return estimate.formatted;
}
