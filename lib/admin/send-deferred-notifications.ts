import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { connectionRequestEmail, questionReceivedEmail, questionReceivedInbox, assignQuestionVariant } from "@/lib/email-templates";
import { generateLeadClaimUrl, generateNotificationUrl, generateProviderPortalUrl } from "@/lib/claim-tokens";

interface NotificationResult {
  leadEmailsSent: number;
  questionEmailsSent: number;
  leadsSkipped: number;
  /** Older repeats of a question text we already sent — suppressed, never sent. */
  questionDuplicatesSuppressed: number;
}

/**
 * Collapse a question to its comparable form. Families pick from the same
 * suggested-question chips, so one provider accumulates the identical text over
 * and over ("What's included in the monthly fee?" ×14). Punctuation and casing
 * are the only variation those repeats carry, so stripping both is enough —
 * this deliberately does NOT try to match paraphrases, which would need a model
 * and would risk suppressing a genuinely different question.
 */
interface QuestionRow {
  id: string;
  question: string;
  asker_name: string | null;
  asker_email: string | null;
  metadata: unknown;
  created_at: string | null;
  /** Which slug variant this row was filed under (set at gather time). */
  sourceSlug: string;
}

function questionKey(text: string | null | undefined): string {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface SendDeferredNotificationsOptions {
  /** Business profile ID (UUID). Can be empty for olera-providers-only cases. */
  profileId: string;
  /** Provider email to send notifications to */
  email: string;
  /** Provider display name */
  providerName: string;
  /** Provider slug (for URLs) - primary identifier */
  providerSlug: string;
  /**
   * Additional slug variants to check when finding questions.
   * Questions may be stored with different provider_id values (source_provider_id,
   * legacy alphanumeric ID, auto-generated slug, etc.)
   */
  additionalSlugVariants?: string[];
  /** If true, provider has unsubscribed from lead emails */
  leadsUnsubscribed?: boolean;
  /**
   * Report what a question flush WOULD do — which texts survive the dedupe and
   * how many repeats collapse — without sending anything or touching metadata.
   * Lets a batch caller preview a backlog before firing cold mail at it.
   * Leads are unaffected (they are not deduped).
   */
  dryRunQuestions?: boolean;
  /**
   * Cap how many QUESTION notifications to send this call (newest first), so a
   * large backlog can be paced instead of blasting the provider all at once.
   * Undefined = no cap (send all) — preserves existing add-email behavior.
   * Leads are not capped.
   */
  maxQuestions?: number;
}

/**
 * Send deferred notifications for a provider.
 *
 * Called when a provider's email is added/updated from any surface:
 * - Leads page "Add Email" button
 * - Questions page "Add Email" button
 * - Directory provider edit
 *
 * Finds all pending leads and questions that haven't been notified yet
 * (based on `email_sent_at` not being set) and sends notifications.
 *
 * Questions are deduped by text before sending: a provider holding the same
 * suggested question fourteen times gets asked it once (the newest instance),
 * and the older repeats are stamped `email_suppressed_at` so no later call
 * sends them either.
 *
 * Note: Callers are responsible for audit logging. This function does not
 * create audit log entries to avoid duplicate logs.
 */
export async function sendDeferredNotificationsForProvider(
  options: SendDeferredNotificationsOptions
): Promise<NotificationResult> {
  const {
    profileId,
    email,
    providerName,
    providerSlug,
    additionalSlugVariants = [],
    leadsUnsubscribed,
    maxQuestions,
    dryRunQuestions,
  } = options;
  const db = getServiceClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

  // Validation: warn if profileId is empty
  // This is valid for olera-providers-only cases (questions only), but worth logging
  if (!profileId) {
    console.warn(
      `[send-deferred] profileId is empty for provider ${providerSlug}. ` +
      `Connection notifications will be skipped (questions will still be sent if applicable).`
    );
  }

  const result: NotificationResult = {
    leadEmailsSent: 0,
    questionEmailsSent: 0,
    leadsSkipped: 0,
    questionDuplicatesSuppressed: 0,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 0. Check if provider is admin-archived (skip all notifications)
  // ─────────────────────────────────────────────────────────────────────────
  if (profileId) {
    const { data: providerProfile } = await db
      .from("business_profiles")
      .select("metadata")
      .eq("id", profileId)
      .maybeSingle();

    const providerMeta = (providerProfile?.metadata as Record<string, unknown>) ?? {};
    if (providerMeta.admin_archived === true) {
      console.log(
        `[send-deferred] Skipping notifications for admin-archived provider ${providerSlug}`
      );
      return result;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Send deferred LEAD notifications
  // ─────────────────────────────────────────────────────────────────────────

  // Only query leads if we have a valid profileId (UUID)
  // Note: profileId can be empty for olera-providers-only cases (no business_profiles row)
  // This is valid because connections MUST reference business_profiles.id (FK constraint)
  // So olera-providers-only providers can't have pending connections, only questions
  if (profileId) {
    // Find all pending, non-archived inquiry/request connections for this provider
    const { data: pendingConnections } = await db
      .from("connections")
      .select("id, message, metadata, from_profile:business_profiles!connections_from_profile_id_fkey(display_name)")
      .eq("to_profile_id", profileId)
      .eq("status", "pending")
      .in("type", ["inquiry", "request"])
      .not("metadata", "cs", JSON.stringify({ archived: true }));

    // Filter to only those without email_sent_at (not yet notified)
    const unnotifiedLeads = (pendingConnections ?? []).filter((conn) => {
      const meta = (conn.metadata as Record<string, unknown>) || {};
      return !meta.email_sent_at;
    });

    const careTypeMap: Record<string, string> = {
      home_care: "Home Care",
      home_health: "Home Health Care",
      assisted_living: "Assisted Living",
      memory_care: "Memory Care",
    };

    for (const conn of unnotifiedLeads) {
      try {
        // Re-fetch metadata to check if another process already sent this notification
        // This narrows the race condition window significantly
        const { data: freshConn } = await db
          .from("connections")
          .select("metadata")
          .eq("id", conn.id)
          .maybeSingle();

        // Skip if connection was deleted by another process
        if (!freshConn) {
          continue;
        }

        const meta = (freshConn.metadata as Record<string, unknown>) || {};

        // Skip if already sent by another process
        if (meta.email_sent_at) {
          continue;
        }

        // If provider unsubscribed from leads, mark as skipped
        if (leadsUnsubscribed) {
          delete meta.needs_provider_email;
          meta.email_skipped_unsubscribed = true;
          await db.from("connections").update({ metadata: meta }).eq("id", conn.id);
          result.leadsSkipped++;
          continue;
        }

        // Parse message data
        let careType: string | null = null;
        let city: string | null = null;
        let careRecipient: string | null = null;
        let familyName = "A family";
        let safeFamilyFirstName: string | null = null;

        // Care recipient display map
        const careRecipientDisplayMap: Record<string, string> = {
          parent: "their parent",
          spouse: "their spouse",
          self: "",
          other: "a family member",
          "My parent": "their parent",
          "My spouse": "their spouse",
          "Myself": "",
          "Someone else": "a family member",
        };

        try {
          const msg = JSON.parse(conn.message || "{}");
          careType = msg.care_type ? (careTypeMap[msg.care_type] || msg.care_type) : null;
          city = msg.looking_in_city || null;
          const rawRecipient = msg.care_recipient || null;
          careRecipient = rawRecipient ? (careRecipientDisplayMap[rawRecipient] || null) : null;

          // Normalize from_profile (Supabase joins return arrays)
          const rawFromProfile = (conn as { from_profile?: { display_name: string }[] | { display_name: string } | null }).from_profile;
          const fromProfile = Array.isArray(rawFromProfile) ? rawFromProfile[0] ?? null : rawFromProfile;
          familyName = fromProfile?.display_name || `${msg.seeker_first_name || ""} ${msg.seeker_last_name || ""}`.trim() || "A family";

          // Extract first name for subject line
          const firstNameRaw = (familyName || "").trim().split(/\s+/)[0] || "";
          const placeholders = ["anonymous", "careseeker", "care", "a", "family", "guest", "user"];
          safeFamilyFirstName = firstNameRaw && !placeholders.includes(firstNameRaw.toLowerCase()) && firstNameRaw.length > 1
            ? firstNameRaw : null;
        } catch { /* use defaults */ }

        // Build dynamic subject line
        let emailSubject: string;
        if (safeFamilyFirstName && city && careType) {
          emailSubject = `${safeFamilyFirstName} in ${city} is looking for ${careType.toLowerCase()}`;
        } else if (!safeFamilyFirstName && city && careType) {
          emailSubject = `A family in ${city} is looking for ${careType.toLowerCase()}`;
        } else if (safeFamilyFirstName && careType) {
          emailSubject = `${safeFamilyFirstName} is looking for ${careType.toLowerCase()}`;
        } else if (safeFamilyFirstName && city) {
          emailSubject = `${safeFamilyFirstName} in ${city} is looking for care`;
        } else if (safeFamilyFirstName) {
          emailSubject = `${safeFamilyFirstName} is looking for care`;
        } else if (city) {
          emailSubject = `A family in ${city} is looking for care`;
        } else {
          emailSubject = "A family is looking for care";
        }

        const emailLogId = await reserveEmailLogId({
          to: email,
          subject: emailSubject,
          emailType: "add_email_notification",
          recipientType: "provider",
          providerId: profileId,
        });

        // Generate one-click URLs with signed tokens
        // Use generateLeadClaimUrl for lead links - routes to /api/claim-lead which:
        // 1. Authenticates server-side (no client-side auth race)
        // 2. Tracks lead_opened event server-side
        // 3. Redirects directly to /provider/connections (skips onboard page)
        // 4. Higher conversion rates → providers see leads immediately
        let viewUrl: string;
        let manageListingUrl: string;
        let settingsUrl: string;

        try {
          viewUrl = generateLeadClaimUrl(providerSlug, email, conn.id, siteUrl);
          manageListingUrl = generateProviderPortalUrl(providerSlug, email, "manage", siteUrl);
          settingsUrl = generateProviderPortalUrl(providerSlug, email, "settings", siteUrl);
          // Append email tracking ID to view URL
          viewUrl = appendTrackingParams(viewUrl, emailLogId);
        } catch (urlError) {
          // Fallback: if token generation fails, use direct URLs
          // These go to onboard page but at least the email sends
          console.error("[send-deferred] URL generation failed, using fallback:", urlError);
          viewUrl = appendTrackingParams(
            `${siteUrl}/provider/${providerSlug}/onboard?action=lead&actionId=${conn.id}`,
            emailLogId
          );
          manageListingUrl = `${siteUrl}/provider/${providerSlug}/onboard?action=manage`;
          settingsUrl = `${siteUrl}/provider/${providerSlug}/onboard?action=settings`;
        }

        const { success: emailSuccess } = await sendEmail({
          to: email,
          subject: emailSubject,
          html: connectionRequestEmail({
            providerName: providerName || "Provider",
            familyName,
            careType,
            city,
            careRecipient,
            viewUrl,
            manageListingUrl,
            settingsUrl,
          }),
          emailType: "add_email_notification",
          recipientType: "provider",
          providerId: profileId,
          emailLogId: emailLogId ?? undefined,
        });

        // Only mark as sent if email actually succeeded
        if (!emailSuccess) {
          console.error(`[send-deferred] Email send failed for connection ${conn.id}, skipping metadata update`);
          continue;
        }

        // Mark as sent and reset follow-up sequence
        // This ensures providers who got email added later start fresh from Day 0
        delete meta.needs_provider_email;
        meta.email_sent_at = new Date().toISOString();
        // Reset follow-up sequence to start fresh
        meta.followup_stage = 0;
        meta.followup_sent_at = null;
        meta.followup_sent_by = null;
        meta.followup_stopped_at = null;
        meta.followup_stopped_reason = null;
        meta.needs_call = null;
        // Reset nudge counts for fresh start
        meta.nudge_count = 0;
        meta.nudged_at = null;
        const { error: metaUpdateErr } = await db.from("connections").update({ metadata: meta }).eq("id", conn.id);
        if (metaUpdateErr) {
          // Email was sent but metadata not updated - log warning for debugging
          // This could cause duplicate sends on retry, but we can't unsend the email
          console.warn(`[send-deferred] Email sent for connection ${conn.id} but metadata update failed:`, metaUpdateErr);
        }

        result.leadEmailsSent++;
      } catch (err) {
        console.error(`[send-deferred] Failed to send lead notification for connection ${conn.id}:`, err);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Send deferred QUESTION notifications
  // ─────────────────────────────────────────────────────────────────────────

  // Build comprehensive list of slug variants to check
  // Questions may be stored with different provider_id values
  const slugVariants = new Set<string>([providerSlug]);

  // Add any additional variants passed by caller
  for (const variant of additionalSlugVariants) {
    if (variant) slugVariants.add(variant);
  }

  // Also check if there's a source_provider_id that might be used
  if (profileId) {
    const { data: profile } = await db
      .from("business_profiles")
      .select("source_provider_id, slug")
      .eq("id", profileId)
      .maybeSingle();

    if (profile?.source_provider_id) {
      slugVariants.add(profile.source_provider_id);
    }
    if (profile?.slug && profile.slug !== providerSlug) {
      slugVariants.add(profile.slug);
    }
  }

  // Track which questions we've already processed to avoid duplicates
  const processedQuestionIds = new Set<string>();

  // Only fetch pending questions (not answered, archived, or rejected). Gather
  // across EVERY slug variant first, then sort globally newest-first, so both
  // the dedupe below and a capped flush see one ordered backlog rather than one
  // per variant.
  const gathered: QuestionRow[] = [];
  // Convert Set to Array for iteration (avoids TypeScript downlevelIteration issues)
  for (const slug of Array.from(slugVariants)) {
    const { data: pendingQuestions } = await db
      .from("provider_questions")
      .select("id, question, asker_name, asker_email, metadata, created_at")
      .eq("provider_id", slug)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Filter to only those without email_sent_at and not already suppressed as
    // a duplicate by an earlier call.
    for (const row of (pendingQuestions ?? []) as Omit<QuestionRow, "sourceSlug">[]) {
      if (processedQuestionIds.has(row.id)) continue;
      const meta = (row.metadata as Record<string, unknown>) || {};
      if (meta.email_sent_at || meta.email_suppressed_at) continue;
      processedQuestionIds.add(row.id);
      gathered.push({ ...row, sourceSlug: slug });
    }
  }
  gathered.sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));

  // Dedupe by question text. A provider holding "What's included in the monthly
  // fee?" fourteen times should be asked it ONCE — the newest instance carries
  // the family still waiting. Older repeats are marked suppressed so a later
  // call (another surface, another enrichment run) never resurrects them.
  const unnotifiedQuestions: QuestionRow[] = [];
  const newestByKey = new Map<string, string>();
  for (const q of gathered) {
    const key = questionKey(q.question);
    // An asker who left an email is a family we can actually reach, so this
    // repeat is not inert the way an anonymous one is: suppressing it means
    // that family's question never reaches the provider and never gets
    // answered, while an anonymous instance of the same text does. Always send
    // it. (scripts/suppress-duplicate-questions.ts carves out the same rows.)
    if (q.asker_email) {
      unnotifiedQuestions.push(q);
      continue;
    }
    const firstId = newestByKey.get(key);
    if (key && firstId) {
      if (!dryRunQuestions) {
        const meta = (q.metadata as Record<string, unknown>) || {};
        meta.email_suppressed_at = new Date().toISOString();
        meta.email_suppressed_reason = "duplicate_question";
        meta.duplicate_of_question_id = firstId;
        delete meta.needs_provider_email;
        const { error: supErr } = await db
          .from("provider_questions")
          .update({ metadata: meta })
          .eq("id", q.id);
        if (supErr) {
          console.warn(`[send-deferred] Failed to mark question ${q.id} as duplicate:`, supErr);
        }
      }
      result.questionDuplicatesSuppressed++;
      continue;
    }
    if (key) newestByKey.set(key, q.id);
    unnotifiedQuestions.push(q);
  }

  for (const q of unnotifiedQuestions) {
    // Honor the per-call cap across all slug variants.
    if (maxQuestions !== undefined && result.questionEmailsSent >= maxQuestions) break;
    // The variant this question was actually filed under — the one-click URL
    // must point at the page the question lives on, not the canonical slug.
    const slug = q.sourceSlug;
    if (dryRunQuestions) {
      console.log(
        `[send-deferred][dry-run] ${providerSlug} → ${email}: "${String(q.question).slice(0, 90)}"`,
      );
      result.questionEmailsSent++;
      continue;
    }
    try {
      // Re-fetch metadata to check if another process already sent this notification
      const { data: freshQ } = await db
        .from("provider_questions")
        .select("metadata")
        .eq("id", q.id)
        .maybeSingle();

      // Skip if question was deleted by another process
      if (!freshQ) {
        processedQuestionIds.add(q.id);
        continue;
      }

      const meta = (freshQ.metadata as Record<string, unknown>) || {};

      // Skip if already sent by another process
      if (meta.email_sent_at) {
        processedQuestionIds.add(q.id);
        continue;
      }

      const qaVariant = assignQuestionVariant();
      const qaInbox = questionReceivedInbox({
        providerName: providerName || "your organization",
        question: q.question,
        variant: qaVariant,
      });

      const emailLogId = await reserveEmailLogId({
        to: email,
        subject: qaInbox.subject,
        emailType: "question_received",
        recipientType: "provider",
        providerId: profileId || slug,
        metadata: { variant: qaVariant, phi_filtered: qaInbox.phiFiltered },
      });

      // Generate one-click URL with signed token
      let providerUrl: string;
      try {
        providerUrl = generateNotificationUrl(slug, email, "question", q.id, siteUrl);
        providerUrl = appendTrackingParams(providerUrl, emailLogId);
      } catch (tokenErr) {
        // Untokenized fallback = the recipient hits a sign-in wall they can't
        // pass. Should never happen — make it loud if it does.
        console.error("[deferred-notifications] generateNotificationUrl failed — sending UNTOKENIZED link:", tokenErr);
        providerUrl = appendTrackingParams(`${siteUrl}/provider/${slug}/onboard?action=question&actionId=${q.id}`, emailLogId);
      }

      const { success: questionEmailSuccess } = await sendEmail({
        to: email,
        subject: qaInbox.subject,
        html: questionReceivedEmail({
          providerName: providerName || "Provider",
          askerName: q.asker_name || "A family",
          question: q.question,
          providerUrl,
          providerSlug: slug,
          preheader: qaInbox.preheader,
        }),
        emailType: "question_received",
        recipientType: "provider",
        providerId: profileId || slug,
        emailLogId: emailLogId ?? undefined,
        metadata: { variant: qaVariant, phi_filtered: qaInbox.phiFiltered },
      });

      // Only mark as sent if email actually succeeded
      if (!questionEmailSuccess) {
        console.error(`[send-deferred] Question email send failed for question ${q.id}, skipping metadata update`);
        processedQuestionIds.add(q.id);
        continue;
      }

      // Mark as sent
      delete meta.needs_provider_email;
      meta.email_sent_at = new Date().toISOString();
      const { error: metaUpdateErr } = await db.from("provider_questions").update({ metadata: meta }).eq("id", q.id);
      if (metaUpdateErr) {
        // Email was sent but metadata not updated - log warning for debugging
        // This could cause duplicate sends on retry, but we can't unsend the email
        console.warn(`[send-deferred] Question email sent for ${q.id} but metadata update failed:`, metaUpdateErr);
      }

      processedQuestionIds.add(q.id);
      result.questionEmailsSent++;
    } catch (err) {
      console.error(`[send-deferred] Failed to send question notification for ${q.id}:`, err);
    }
  }

  return result;
}
