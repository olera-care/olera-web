import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";
import { sendSlackAlert, slackQuestionAsked, slackQuestionMissingEmail } from "@/lib/slack";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { questionConfirmationEmail, questionReceivedEmail } from "@/lib/email-templates";
import { generateProviderSlug } from "@/lib/slugify";

/**
 * GET /api/questions?provider_id=xxx
 *
 * Fetch public questions for a provider (both pending and answered).
 * No auth required — these are public Q&A.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("provider_id");

  if (!providerId) {
    return NextResponse.json({ error: "provider_id required" }, { status: 400 });
  }

  try {
    const db = getServiceClient();
    // Fetch both pending and answered questions that are public
    const { data: questions, error } = await db
      .from("provider_questions")
      .select("id, question, answer, asker_name, asker_user_id, status, answered_at, created_at")
      .eq("provider_id", providerId)
      .eq("is_public", true)
      .in("status", ["pending", "approved", "answered"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Failed to fetch questions:", error);
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    return NextResponse.json({ questions: questions ?? [] });
  } catch (err) {
    console.error("Questions GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/questions
 *
 * Submit a question on a provider page.
 * Supports both authenticated users and guests.
 * Guests must provide asker_name + asker_email in body.
 * Body: { provider_id, question, asker_name?, asker_email?, honeypot? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { provider_id, question, asker_name: guestName, asker_email: guestEmail, honeypot } = body;

    // Honeypot — bots fill this hidden field; silently succeed without creating anything
    if (honeypot) {
      return NextResponse.json({ question: { id: "ok", question, asker_name: guestName || "Guest", status: "pending", created_at: new Date().toISOString() } }, { status: 201 });
    }

    if (!provider_id || !question) {
      return NextResponse.json({ error: "provider_id and question are required" }, { status: 400 });
    }

    if (question.length > 1000) {
      return NextResponse.json({ error: "Question must be under 1000 characters" }, { status: 400 });
    }

    // Determine asker identity: authenticated user or anonymous guest
    const db = getServiceClient();
    let askerName: string;
    let askerEmail: string | null;
    let askerUserId: string | null;

    let askerProfileId: string | null = null;

    if (user) {
      // Authenticated user — get display name from profile
      const { data: profile } = await db
        .from("business_profiles")
        .select("id, display_name")
        .eq("user_id", user.id)
        .single();

      askerProfileId = profile?.id || null;
      askerName = profile?.display_name || user.email?.split("@")[0] || "Anonymous";
      askerEmail = user.email || null;
      askerUserId = user.id;
    } else {
      // Guest — question fires immediately, name/email optional (added via PATCH later)
      // If guest provided name/email inline, use them
      const normalizedEmail = guestEmail?.trim().toLowerCase() || null;

      if (normalizedEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
          return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
        }

        // Rate limiting: 5 questions per email per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recentQuestions } = await db
          .from("provider_questions")
          .select("id")
          .eq("asker_email", normalizedEmail)
          .gte("created_at", oneHourAgo);

        if (recentQuestions && recentQuestions.length >= 5) {
          return NextResponse.json({ error: "Too many questions. Please try again later." }, { status: 429 });
        }
      }

      askerName = guestName?.trim() || "Anonymous";
      askerEmail = normalizedEmail;
      askerUserId = null;
    }

    const { data: newQuestion, error } = await db
      .from("provider_questions")
      .insert({
        provider_id,
        question: question.trim(),
        asker_name: askerName,
        asker_email: askerEmail,
        asker_user_id: askerUserId,
        status: "pending",
        is_public: true,
      })
      .select("id, question, asker_name, status, created_at")
      .single();

    if (error) {
      console.error("Failed to create question:", error);
      return NextResponse.json({ error: "Failed to submit question" }, { status: 500 });
    }

    // Log family engagement event (fire-and-forget, authenticated users only)
    if (askerProfileId) {
      db.from("seeker_activity").insert({
        profile_id: askerProfileId,
        event_type: "question_asked",
        related_provider_id: provider_id,
        metadata: {
          question_id: newQuestion.id,
          question_preview: question.trim().substring(0, 100),
        },
      }).then(({ error: actErr }: { error: { message: string } | null }) => {
        if (actErr) console.error("[seeker_activity] question_asked insert failed:", actErr);
      });
    }

    // Log provider-side activity (fire-and-forget, ALL questions including guests)
    db.from("provider_activity").insert({
      provider_id,
      event_type: "question_received",
      metadata: {
        question_id: newQuestion.id,
        question_preview: question.trim().substring(0, 100),
        asker_name: askerName,
        is_guest: !user,
      },
    }).then(({ error: actErr }: { error: { message: string } | null }) => {
      if (actErr) console.error("[provider_activity] question_received insert failed:", actErr);
    });

    // ── Multi-strategy provider lookup (shared by Slack + email below) ──
    // Mirrors the 4-strategy lookup from admin add-email endpoint.
    // Provider detail pages generate ephemeral slugs via generateProviderSlug()
    // for iOS providers with slug=null, so the stored provider_id may not match
    // any persisted slug in either table.
    let resolvedProvider: { id: string; display_name: string; email: string | null; slug: string | null; source_provider_id: string | null } | null = null;
    let resolvedIos: { provider_id: string; email: string | null; provider_name: string | null } | null = null;

    try {
      // Strategy 1: business_profiles by slug
      resolvedProvider = await db
        .from("business_profiles")
        .select("id, display_name, email, slug, source_provider_id")
        .eq("slug", provider_id)
        .maybeSingle()
        .then(r => r.data);

      if (!resolvedProvider) {
        // Strategy 2: olera-providers by slug
        resolvedIos = await db
          .from("olera-providers")
          .select("provider_id, email, provider_name")
          .eq("slug", provider_id)
          .not("deleted", "is", true)
          .maybeSingle()
          .then(r => r.data);

        if (!resolvedIos) {
          // Strategy 3: olera-providers by provider_id (legacy alphanumeric ID)
          resolvedIos = await db
            .from("olera-providers")
            .select("provider_id, email, provider_name")
            .eq("provider_id", provider_id)
            .not("deleted", "is", true)
            .maybeSingle()
            .then(r => r.data);
        }

        if (!resolvedIos) {
          // Strategy 4: reverse-match auto-generated slug from name+state
          const slugParts = provider_id.split("-");
          const namePrefix = slugParts.slice(0, 3).join("-");
          const { data: candidates } = await db
            .from("olera-providers")
            .select("provider_id, email, provider_name, state")
            .not("deleted", "is", true)
            .is("slug", null)
            .ilike("provider_name", `${namePrefix.replace(/-/g, "%")}%`)
            .limit(20);
          if (candidates) {
            for (const c of candidates) {
              if (generateProviderSlug(c.provider_name, c.state) === provider_id) {
                resolvedIos = { provider_id: c.provider_id, email: c.email, provider_name: c.provider_name };
                break;
              }
            }
          }
        }

        // If found in olera-providers, check for linked business_profile
        if (resolvedIos) {
          resolvedProvider = await db
            .from("business_profiles")
            .select("id, display_name, email, slug, source_provider_id")
            .eq("source_provider_id", resolvedIos.provider_id)
            .maybeSingle()
            .then(r => r.data);
        }
      }
    } catch (lookupErr) {
      console.error("Provider lookup for notifications failed:", lookupErr);
    }

    const providerDisplayName = resolvedProvider?.display_name || resolvedIos?.provider_name || provider_id;
    const providerIdForLogs = resolvedProvider?.id || resolvedIos?.provider_id || provider_id;

    // Resolve email: business_profiles first, then olera-providers fallback
    let pEmail = resolvedProvider?.email || null;
    if (!pEmail) {
      const iosProviderId = resolvedProvider?.source_provider_id || resolvedIos?.provider_id;
      if (iosProviderId) {
        const { data: ios } = await db
          .from("olera-providers")
          .select("email")
          .eq("provider_id", iosProviderId)
          .maybeSingle();
        pEmail = ios?.email || null;
      }
      // resolvedIos may already have the email
      if (!pEmail && resolvedIos?.email) {
        pEmail = resolvedIos.email;
      }
    }

    // Slack notifications — must await in serverless to prevent early termination
    try {
      const guestSuffix = !user ? " (guest)" : "";
      const { text, blocks } = slackQuestionAsked({
        askerName: askerName + guestSuffix,
        providerName: providerDisplayName,
        question: question.trim(),
        providerSlug: provider_id,
      });
      await sendSlackAlert(text, blocks);

      if (!pEmail) {
        const missing = slackQuestionMissingEmail({
          askerName: askerName + guestSuffix,
          providerName: providerDisplayName,
          providerId: providerIdForLogs,
          question: question.trim(),
        });
        await sendSlackAlert(missing.text, missing.blocks);
      }
    } catch (slackErr) {
      console.error("Slack notification failed:", slackErr);
    }

    // Email notifications — must await in serverless
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
      const providerPageUrl = `${siteUrl}/provider/${provider_id}`;

      // 1. Email the provider about the new question (if they have an email)
      if (pEmail) {
        const providerSlug = resolvedProvider?.slug || provider_id;
        let providerUrl: string;
        try {
          const { generateNotificationUrl } = await import("@/lib/claim-tokens");
          providerUrl = generateNotificationUrl(
            providerSlug,
            pEmail,
            "question",
            newQuestion.id,
            siteUrl
          );
        } catch {
          providerUrl = `${siteUrl}/provider/${providerSlug}/onboard?action=question&actionId=${newQuestion.id}`;
        }

        await sendEmail({
          to: pEmail,
          subject: `A family has a question about ${providerDisplayName}`,
          html: questionReceivedEmail({
            providerName: providerDisplayName,
            askerName,
            question: question.trim(),
            providerUrl,
            providerSlug: provider_id,
          }),
          emailType: 'question_received',
          recipientType: 'provider',
          providerId: providerIdForLogs,
          recipientProfileId: providerIdForLogs,
        });
      } else if (newQuestion?.id) {
        // No provider email — flag for admin "Needs Email" tab
        await db
          .from("provider_questions")
          .update({ metadata: { needs_provider_email: true } })
          .eq("id", newQuestion.id);
      }

      // 2. Confirmation email to the asker (if they have an email)
      if (askerEmail) {
        const qConfirmEmailLogId = await reserveEmailLogId({
          to: askerEmail,
          subject: `Your question to ${providerDisplayName} on Olera`,
          emailType: "question_confirmation",
          recipientType: "family",
        });

        await sendEmail({
          to: askerEmail,
          subject: `Your question to ${providerDisplayName} on Olera`,
          html: questionConfirmationEmail({
            askerName,
            providerName: providerDisplayName,
            question: question.trim(),
            providerUrl: appendTrackingParams(providerPageUrl, qConfirmEmailLogId),
          }),
          emailType: 'question_confirmation',
          recipientType: 'family',
          emailLogId: qConfirmEmailLogId ?? undefined,
        });
      }
    } catch (emailErr) {
      console.error("Question email notifications failed:", emailErr);
    }

    return NextResponse.json({ question: newQuestion }, { status: 201 });
  } catch (err) {
    console.error("Questions POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/questions
 *
 * Two modes:
 * 1. Authenticated edit: { id, question } — edit question text (owner only, before answer)
 * 2. Guest enrichment: { id, asker_name, asker_email } — augment anonymous question with identity
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, question, asker_name: enrichName, asker_email: enrichEmail } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Mode 2: Guest enrichment — add name/email to an anonymous question
    if (enrichName || enrichEmail) {
      const { data: existing, error: fetchError } = await db
        .from("provider_questions")
        .select("id, asker_user_id, asker_email")
        .eq("id", id)
        .single();

      if (fetchError || !existing) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }

      // Only allow enrichment on anonymous questions (no user_id and no email yet)
      if (existing.asker_user_id || existing.asker_email) {
        return NextResponse.json({ error: "Question already has identity" }, { status: 400 });
      }

      const updates: Record<string, string> = {};
      if (enrichName?.trim()) updates.asker_name = enrichName.trim();
      if (enrichEmail?.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(enrichEmail.trim())) {
          return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }
        updates.asker_email = enrichEmail.trim().toLowerCase();
      }

      const { data: updated, error: updateError } = await db
        .from("provider_questions")
        .update(updates)
        .eq("id", id)
        .select("id, question, asker_name, status, created_at")
        .single();

      if (updateError) {
        console.error("Failed to enrich question:", updateError);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
      }

      // Send confirmation email (fire-and-forget)
      if (updates.asker_email && updated?.question) {
        try {
          // Look up provider name + slug for the email
          const { data: q } = await db
            .from("provider_questions")
            .select("provider_id")
            .eq("id", id)
            .single();

          const providerSlug = q?.provider_id || "";
          // Multi-strategy name lookup (same root cause as POST handler)
          let providerName: string | null = null;
          const { data: bp } = await db
            .from("business_profiles")
            .select("display_name")
            .eq("slug", providerSlug)
            .maybeSingle();
          providerName = bp?.display_name || null;
          if (!providerName) {
            // Try olera-providers by slug, then reverse slug match
            const { data: ios } = await db
              .from("olera-providers")
              .select("provider_name")
              .eq("slug", providerSlug)
              .not("deleted", "is", true)
              .maybeSingle();
            providerName = ios?.provider_name || null;
            if (!providerName) {
              const slugParts = providerSlug.split("-");
              const namePrefix = slugParts.slice(0, 3).join("-");
              const { data: candidates } = await db
                .from("olera-providers")
                .select("provider_name, state")
                .not("deleted", "is", true)
                .is("slug", null)
                .ilike("provider_name", `${namePrefix.replace(/-/g, "%")}%`)
                .limit(20);
              if (candidates) {
                for (const c of candidates) {
                  if (generateProviderSlug(c.provider_name, c.state) === providerSlug) {
                    providerName = c.provider_name;
                    break;
                  }
                }
              }
            }
          }

          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
          const enrichEmailLogId = await reserveEmailLogId({
            to: updates.asker_email,
            subject: `Your question to ${providerName || "a provider"} on Olera`,
            emailType: "question_confirmation",
            recipientType: "family",
          });

          await sendEmail({
            to: updates.asker_email,
            subject: `Your question to ${providerName || "a provider"} on Olera`,
            html: questionConfirmationEmail({
              askerName: updates.asker_name || "there",
              providerName: providerName || "the provider",
              question: updated.question,
              providerUrl: appendTrackingParams(`${siteUrl}/provider/${providerSlug}`, enrichEmailLogId),
            }),
            emailType: 'question_confirmation',
            recipientType: 'family',
            emailLogId: enrichEmailLogId ?? undefined,
          });
        } catch (emailErr) {
          console.error("Question confirmation email failed:", emailErr);
        }
      }

      return NextResponse.json({ question: updated });
    }

    // Mode 1: Authenticated edit — edit question text
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    if (question.length > 1000) {
      return NextResponse.json({ error: "Question must be under 1000 characters" }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await db
      .from("provider_questions")
      .select("id, asker_user_id, status, answer")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    if (existing.asker_user_id !== user.id) {
      return NextResponse.json({ error: "You can only edit your own questions" }, { status: 403 });
    }

    if (existing.status === "answered" || existing.answer) {
      return NextResponse.json({ error: "Cannot edit a question that has been answered" }, { status: 400 });
    }

    const { data: updated, error: updateError } = await db
      .from("provider_questions")
      .update({ question: question.trim() })
      .eq("id", id)
      .select("id, question, asker_name, asker_user_id, status, created_at")
      .single();

    if (updateError) {
      console.error("Failed to update question:", updateError);
      return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
    }

    return NextResponse.json({ question: updated });
  } catch (err) {
    console.error("Questions PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
