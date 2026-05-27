import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

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
    const data = (await request.json()) as GenerateMessageRequest;

    // Validate required fields
    if (!data.familyFirstName || !data.providerName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt(data);

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
