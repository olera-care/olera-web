import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

interface ContentItem {
  id: string;
  title: string;
  type: "article" | "federal_program" | "state_program" | "page";
  content: string;
  slug?: string;
  status?: string;
}

export interface AuditIssue {
  flag: string;
  reason: string;
  severity: "high" | "medium" | "low";
  suggestion: string;
  source: string;
  source_url: string;
}

export interface AuditResult {
  id: string;
  title: string;
  type: ContentItem["type"];
  slug?: string;
  status: "accurate" | "needs_review" | "likely_outdated";
  issues: (AuditIssue | string)[];
  summary: string;
  audited_at: string;
}

const AUDIT_SYSTEM_PROMPT = `You are a content accuracy auditor for a senior care benefits website (Olera). Your job is to review content and cross-reference it against official government sources to flag anything inaccurate, outdated, or misleading to seniors and their families.

Today's date is ${new Date().toISOString().split("T")[0]}.

## Official Sources to Cross-Reference

Use your knowledge of these official sources to verify claims:
- **hhs.texas.gov** — Texas Medicaid, STAR+PLUS, STAR, and state benefit programs
- **benefits.gov** — Federal benefit program eligibility and details
- **medicare.gov** — Medicare plans, enrollment, costs, and coverage
- **medicaid.gov** — Medicaid eligibility, waivers, and federal guidelines
- **acl.gov** — Administration for Community Living programs (Senior Companion, respite, AAAs)
- **ssa.gov** — Social Security, SSI income limits, and benefit amounts
- **va.gov** — Veterans benefits (Aid & Attendance, Veterans Directed Care)

## What to Check

1. **Eligibility requirements** — Are they accurate and current for 2025-2026?
2. **Income limits** — Are dollar amounts correct per current federal/state guidelines?
3. **Program names and descriptions** — Are they accurate? Are programs still active?
4. **Application steps** — Are the steps correct and in the right order?
5. **Missing information** — Is anything important left out that users would need to know?
6. **Dates and years** — Flag any references to past years or expired figures.
7. **Misleading claims** — Could anything confuse a vulnerable user?

## Severity Levels

Assign a severity to each issue:
- **high** — Wrong income limits, incorrect eligibility criteria, wrong program names, missing critical disclaimers, or anything that could cause a user to miss benefits or make a bad decision
- **medium** — Unverified figures that may be correct but need confirmation, missing context, vague descriptions, or claims that could be more precise
- **low** — Phone number formatting, minor wording issues, style inconsistencies, or cosmetic problems that don't affect accuracy

## Response Format

Respond with valid JSON only (no markdown fences, no code blocks):
{
  "status": "accurate" | "needs_review" | "likely_outdated",
  "issues": [
    {
      "flag": "The specific claim or text that is problematic",
      "reason": "Why this is flagged — what might be wrong",
      "severity": "high" | "medium" | "low",
      "suggestion": "What the text should say instead, based on official sources. Provide the corrected text or a specific recommendation.",
      "source": "Name of the official source to verify against",
      "source_url": "Direct URL to the relevant page on the official source"
    }
  ],
  "summary": "One-sentence overall assessment"
}

## Rules

- **Be conservative**: If you are not sure whether something is accurate, flag it as "needs_review" rather than marking it "accurate". It is better to over-flag than to miss something.
- "accurate" = you are confident all claims match current official sources
- "needs_review" = there are claims you cannot confidently verify, or minor concerns
- "likely_outdated" = contains clearly outdated info (old year, expired rates, wrong limits)
- Be specific — cite the exact text, number, or claim in the "flag" field
- Always provide a real, relevant URL in "source_url" pointing to the official page where the claim can be verified
- In the "suggestion" field, provide the corrected replacement text or a specific action to take. Do not just say "verify this" — give a concrete replacement.
- If no issues are found and you are confident the content is accurate, return an empty issues array
- Keep responses concise — limit to the 5 most important issues maximum. Prioritize high severity issues first.
- Keep "flag", "reason", and "suggestion" fields short (1-2 sentences each)`;

async function auditContent(
  client: Anthropic,
  item: ContentItem
): Promise<AuditResult> {
  const contentPreview = item.content.slice(0, 6000);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: AUDIT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Audit this ${item.type.replace("_", " ")}:\n\nTitle: ${item.title}\n\nContent:\n${contentPreview}`,
        },
      ],
    });

    let text =
      response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown fences if present
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // If JSON is truncated, try to repair it by closing open structures
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Attempt to fix truncated JSON by closing brackets
      let repaired = text;
      // Close any open strings
      const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
      if (quoteCount % 2 !== 0) repaired += '"';
      // Close open arrays and objects
      const opens = (repaired.match(/[{[]/g) || []).length;
      const closes = (repaired.match(/[}\]]/g) || []).length;
      for (let j = 0; j < opens - closes; j++) {
        // Determine if we need ] or }
        const lastOpen = repaired.lastIndexOf("[") > repaired.lastIndexOf("{") ? "]" : "}";
        repaired += lastOpen;
      }
      parsed = JSON.parse(repaired);
    }

    return {
      id: item.id,
      title: item.title,
      type: item.type,
      slug: item.slug,
      status: parsed.status,
      issues: parsed.issues ?? [],
      summary: parsed.summary ?? "",
      audited_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      slug: item.slug,
      status: "needs_review",
      issues: [`Audit failed: ${err instanceof Error ? err.message : String(err)}`],
      summary: "Could not complete audit — manual review recommended.",
      audited_at: new Date().toISOString(),
    };
  }
}

/**
 * POST /api/admin/content-audit
 *
 * Fetches all content from the database, audits each item using Claude,
 * and returns the results.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const pageUrl: string | undefined = body.url;

    const client = new Anthropic({ apiKey });

    // Single page audit by URL
    if (pageUrl) {
      try {
        const res = await fetch(pageUrl, {
          headers: { "User-Agent": "OleraContentAudit/1.0" },
        });
        if (!res.ok) {
          return NextResponse.json(
            { error: `Failed to fetch page: ${res.status} ${res.statusText}` },
            { status: 400 }
          );
        }
        const html = await res.text();
        // Extract title from <title> tag
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = titleMatch?.[1]?.trim() || pageUrl;
        // Strip HTML for audit
        const plainText = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const item: ContentItem = {
          id: pageUrl,
          title,
          type: "page",
          content: plainText,
          slug: new URL(pageUrl).pathname,
        };

        const result = await auditContent(client, item);
        return NextResponse.json({
          results: [result],
          total: 1,
          summary: {
            accurate: result.status === "accurate" ? 1 : 0,
            needs_review: result.status === "needs_review" ? 1 : 0,
            likely_outdated: result.status === "likely_outdated" ? 1 : 0,
          },
        });
      } catch (err) {
        return NextResponse.json(
          { error: `Failed to fetch page: ${err instanceof Error ? err.message : String(err)}` },
          { status: 400 }
        );
      }
    }

    // Full audit of all content
    const contentTypes: string[] = body.types ?? [
      "article",
      "federal_program",
      "state_program",
    ];

    const db = getServiceClient();
    const items: ContentItem[] = [];

    // Fetch articles
    if (contentTypes.includes("article")) {
      const { data: articles } = await db
        .from("content_articles")
        .select("id, title, slug, status, content_html")
        .eq("status", "published")
        .order("updated_at", { ascending: false });

      for (const a of articles ?? []) {
        // Strip HTML tags for cleaner audit
        const plainText = (a.content_html ?? "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        items.push({
          id: a.id,
          title: a.title,
          type: "article",
          content: plainText,
          slug: a.slug,
          status: a.status,
        });
      }
    }

    // Fetch federal programs
    if (contentTypes.includes("federal_program")) {
      const { data: fedPrograms } = await db
        .from("sbf_federal_programs")
        .select("id, name, description, max_income_single, max_income_couple, min_age, phone, website, what_to_say")
        .eq("is_active", true)
        .order("name");

      for (const p of fedPrograms ?? []) {
        const content = [
          p.description,
          p.max_income_single ? `Income limit (single): $${p.max_income_single}` : "",
          p.max_income_couple ? `Income limit (couple): $${p.max_income_couple}` : "",
          p.min_age ? `Minimum age: ${p.min_age}` : "",
          p.phone ? `Phone: ${p.phone}` : "",
          p.website ? `Website: ${p.website}` : "",
          p.what_to_say ?? "",
        ]
          .filter(Boolean)
          .join("\n");
        items.push({
          id: p.id,
          title: p.name,
          type: "federal_program",
          content,
        });
      }
    }

    // Fetch state programs
    if (contentTypes.includes("state_program")) {
      const { data: statePrograms } = await db
        .from("sbf_state_programs")
        .select("id, name, description, state_code, max_income_single, max_income_couple, min_age, phone, website, what_to_say")
        .eq("is_active", true)
        .order("name");

      for (const p of statePrograms ?? []) {
        const content = [
          `State: ${p.state_code}`,
          p.description,
          p.max_income_single ? `Income limit (single): $${p.max_income_single}` : "",
          p.max_income_couple ? `Income limit (couple): $${p.max_income_couple}` : "",
          p.min_age ? `Minimum age: ${p.min_age}` : "",
          p.phone ? `Phone: ${p.phone}` : "",
          p.website ? `Website: ${p.website}` : "",
          p.what_to_say ?? "",
        ]
          .filter(Boolean)
          .join("\n");
        items.push({
          id: p.id,
          title: p.name,
          type: "state_program",
          content,
        });
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ results: [], total: 0 });
    }

    // Audit items in batches of 5 for parallelism
    const results: AuditResult[] = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((item) => auditContent(client, item))
      );
      results.push(...batchResults);
    }

    return NextResponse.json({
      results,
      total: results.length,
      summary: {
        accurate: results.filter((r) => r.status === "accurate").length,
        needs_review: results.filter((r) => r.status === "needs_review").length,
        likely_outdated: results.filter((r) => r.status === "likely_outdated")
          .length,
      },
    });
  } catch (err) {
    console.error("Content audit error:", err);
    return NextResponse.json(
      {
        error: `Internal server error: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
