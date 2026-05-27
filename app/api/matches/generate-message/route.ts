import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient as createServerClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

// Simple in-memory rate limiter (per user, per minute)
// Note: This resets on server restart and doesn't work across multiple instances.
// For production scale, consider Redis or database-backed rate limiting.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // 10 requests per minute per user
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_MAP_SIZE = 10000; // Prevent unbounded growth

function checkRateLimit(userId: string): { allowed: boolean } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  // Cleanup expired entry on access (lazy cleanup)
  if (entry && now > entry.resetAt) {
    rateLimitMap.delete(userId);
  }

  // If map is too large, clear expired entries (prevents memory leak)
  if (rateLimitMap.size > MAX_MAP_SIZE) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }

  const currentEntry = rateLimitMap.get(userId);

  if (!currentEntry) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (currentEntry.count >= RATE_LIMIT_MAX) {
    return { allowed: false };
  }

  currentEntry.count++;
  return { allowed: true };
}

const SYSTEM_PROMPT = `You are helping a senior care provider reach out to a family looking for care. Write a warm, professional, concise message (2–3 short paragraphs max). Use the family's first name. Reference their care needs if known. End with a clear, low-pressure call to action. Sign off with just the provider's name (no "Best regards" or formal closings - keep it casual). Never mention specific prices or guarantees.`;

interface GenerateMessageRequest {
  familyFirstName: string;
  careTypes?: string[];
  timeline?: string;
  whoNeedsCare?: string;
  tone?: "introduce" | "ask_needs" | "invite_visit"; // Now optional
  providerName: string;
  providerLocation?: string;
  profileState: "full" | "partial" | "minimal";
}

function buildUserPrompt(data: GenerateMessageRequest): string {
  const {
    familyFirstName,
    careTypes = [],
    timeline,
    whoNeedsCare,
    tone,
    providerName,
    providerLocation,
    profileState,
  } = data;

  let prompt = `Generate a reach-out message for a senior care provider.\n\n`;
  prompt += `Family's first name: ${familyFirstName}\n`;
  prompt += `Provider name: ${providerName}\n`;

  if (providerLocation) {
    prompt += `Provider location: ${providerLocation}\n`;
  }

  if (careTypes.length > 0) {
    prompt += `Care types they're looking for: ${careTypes.join(", ")}\n`;
  }

  if (timeline) {
    const timelineLabels: Record<string, string> = {
      as_soon_as_possible: "immediately",
      within_a_month: "within a month",
      in_a_few_months: "in a few months",
      just_researching: "just researching options",
      immediate: "immediately",
      within_1_month: "within a month",
      within_3_months: "within 3 months",
      exploring: "exploring options",
    };
    prompt += `Timeline: They need care ${timelineLabels[timeline] || timeline}\n`;
  }

  if (whoNeedsCare) {
    const careLabels: Record<string, string> = {
      myself: "themselves",
      my_parent: "their parent",
      my_spouse: "their spouse",
      someone_else: "someone they care about",
    };
    prompt += `Who needs care: ${careLabels[whoNeedsCare] || whoNeedsCare}\n`;
  }

  prompt += `\nProfile completeness: ${profileState}\n`;

  // Determine tone based on context if not explicitly provided
  const isUrgent = timeline === "as_soon_as_possible" || timeline === "immediate";
  const isExploring = timeline === "just_researching" || timeline === "exploring";

  // Smart tone instructions based on context
  if (tone) {
    // Legacy support: use explicit tone if provided
    switch (tone) {
      case "introduce":
        prompt += `\nTone: Warm introduction. Introduce the provider and express interest in helping.`;
        break;
      case "ask_needs":
        prompt += `\nTone: Curious and caring. Focus on asking about their specific needs.`;
        break;
      case "invite_visit":
        prompt += `\nTone: Inviting and welcoming. Extend an invitation to visit.`;
        break;
    }
  } else {
    // Smart approach based on context
    if (profileState === "minimal") {
      prompt += `\nApproach: Very warm and low-pressure. Don't assume anything about their needs. Just introduce yourself and let them know you're available to help.`;
    } else if (isUrgent) {
      prompt += `\nApproach: Direct and helpful. They need care soon, so be clear about availability and offer to connect quickly. Still warm, but action-oriented.`;
    } else if (isExploring) {
      prompt += `\nApproach: Relaxed and informational. They're just looking around, so no pressure. Just introduce yourself as an option.`;
    } else {
      prompt += `\nApproach: Warm and specific. Reference their care needs and express genuine interest in helping.`;
    }
  }

  // Profile state specific instructions
  if (profileState === "minimal") {
    prompt += `\n\nIMPORTANT: This family has very limited info. Keep the message short and welcoming without making assumptions.`;
  } else if (profileState === "partial") {
    prompt += `\n\nNote: Partial profile. Be warm and invite them to share more.`;
  } else {
    prompt += `\n\nNote: Full profile. Reference their specific care needs.`;
  }

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Rate limiting
    const { allowed } = checkRateLimit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before generating another message." },
        { status: 429 }
      );
    }

    const data = (await request.json()) as GenerateMessageRequest;

    // Validate and sanitize required fields
    const familyFirstName = data.familyFirstName?.trim();
    const providerName = data.providerName?.trim();

    if (!familyFirstName || !providerName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic input length validation to prevent abuse
    if (familyFirstName.length > 100 || providerName.length > 200) {
      return NextResponse.json(
        { error: "Input too long" },
        { status: 400 }
      );
    }

    // Validate profileState
    const validProfileStates = ["full", "partial", "minimal"] as const;
    const profileState = validProfileStates.includes(data.profileState as typeof validProfileStates[number])
      ? data.profileState
      : "partial"; // Default to partial if invalid

    // Sanitize the data before building prompt
    const sanitizedData: GenerateMessageRequest = {
      familyFirstName,
      providerName,
      profileState,
      providerLocation: data.providerLocation?.trim().slice(0, 200),
      careTypes: data.careTypes?.slice(0, 10).map(t => t.trim().slice(0, 100)),
      timeline: data.timeline?.trim().slice(0, 50),
      whoNeedsCare: data.whoNeedsCare?.trim().slice(0, 50),
      tone: data.tone,
    };

    const userPrompt = buildUserPrompt(sanitizedData);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract the text content from the response
    const textContent = response.content.find((block) => block.type === "text");
    const message = textContent?.type === "text" ? textContent.text : "";

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[generate-message] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}
