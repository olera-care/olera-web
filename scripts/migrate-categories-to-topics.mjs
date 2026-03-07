/**
 * Migrate article categories from format-based (guide, comparison, etc.)
 * to topic-based (costs-and-benefits, getting-started, etc.)
 *
 * Uses article tags, title keywords, and care_types to determine best-fit topic.
 *
 * Usage:
 *   node scripts/migrate-categories-to-topics.mjs --dry-run
 *   node scripts/migrate-categories-to-topics.mjs
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DRY_RUN = process.argv.includes("--dry-run");

// Topic classification rules — order matters (first match wins)
const TOPIC_RULES = [
  {
    topic: "costs-and-benefits",
    titleKeywords: ["cost", "pay", "price", "afford", "insurance", "medicare", "medicaid", "financial", "benefit", "coverage", "bcbs", "blue cross"],
    tagKeywords: ["cost", "insurance", "medicare", "medicaid", "financial", "payment", "pricing", "BCBS", "benefits", "coverage"],
  },
  {
    topic: "dementia-care",
    titleKeywords: ["dementia", "alzheimer", "memory care", "cognitive", "brain"],
    tagKeywords: ["dementia", "alzheimer", "memory", "cognitive"],
  },
  {
    topic: "legal-and-planning",
    titleKeywords: ["legal", "guardian", "custody", "power of attorney", "advance directive", "estate", "rights"],
    tagKeywords: ["legal", "guardianship", "custody", "power of attorney", "planning", "estate"],
  },
  {
    topic: "comparing-care",
    titleKeywords: [" vs ", "versus", "compare", "comparison", "difference between"],
    tagKeywords: ["comparison", "vs"],
  },
  {
    topic: "wellness-and-support",
    titleKeywords: ["stress", "burnout", "self-care", "support group", "caregiver wellness", "mental health", "counseling"],
    tagKeywords: ["wellness", "stress", "burnout", "support", "self-care", "mental health"],
  },
  {
    topic: "getting-started",
    titleKeywords: ["guide", "what is", "how to", "getting started", "beginner", "first time", "checklist", "questions to ask", "tips"],
    tagKeywords: ["getting-started", "beginner", "guide", "tips"],
  },
];

function classifyArticle(article) {
  const titleLower = (article.title || "").toLowerCase();
  const tags = (article.tags || []).map((t) => t.toLowerCase());

  for (const rule of TOPIC_RULES) {
    // Check title keywords
    const titleMatch = rule.titleKeywords.some((kw) => titleLower.includes(kw.toLowerCase()));
    if (titleMatch) return rule.topic;

    // Check tags
    const tagMatch = rule.tagKeywords.some((kw) =>
      tags.some((tag) => tag.includes(kw.toLowerCase()))
    );
    if (tagMatch) return rule.topic;
  }

  // Default: getting-started (broadest bucket)
  return "getting-started";
}

async function main() {
  console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Migrating article categories to topics...\n`);

  // Fetch all caregiver-support articles
  const { data: articles, error } = await sb
    .from("content_articles")
    .select("id, slug, title, tags, care_types, category, section")
    .eq("section", "caregiver-support")
    .eq("status", "published");

  if (error) {
    console.error("Error fetching articles:", error);
    process.exit(1);
  }

  console.log(`Found ${articles.length} caregiver-support articles\n`);

  // Classify each article
  const topicCounts = {};
  const updates = [];

  for (const article of articles) {
    const newTopic = classifyArticle(article);
    topicCounts[newTopic] = (topicCounts[newTopic] || 0) + 1;

    updates.push({
      id: article.id,
      slug: article.slug,
      oldCategory: article.category,
      newTopic,
      title: article.title,
    });
  }

  // Print distribution
  console.log("Topic distribution:");
  for (const [topic, count] of Object.entries(topicCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${topic}: ${count}`);
  }
  console.log();

  // Print each classification
  for (const u of updates) {
    const changed = u.oldCategory !== u.newTopic ? " (CHANGED)" : "";
    console.log(`  [${u.newTopic}] ${u.slug}${changed}`);
  }
  console.log();

  if (DRY_RUN) {
    console.log("[DRY RUN] No changes applied. Remove --dry-run to execute.");
    return;
  }

  // Apply updates
  let updated = 0;
  let failed = 0;

  for (const u of updates) {
    const { error } = await sb
      .from("content_articles")
      .update({ category: u.newTopic })
      .eq("id", u.id);

    if (error) {
      console.error(`  FAIL: ${u.slug} — ${error.message}`);
      failed++;
    } else {
      updated++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed.`);
}

main();
