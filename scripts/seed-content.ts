// @ts-nocheck
/**
 * Seed content_articles table from mock data.
 *
 * Usage:
 *   npx tsx scripts/seed-content.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";

// Load env from .env.local
import { config } from "dotenv";
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

// Import mock data inline to avoid module resolution issues with tsx
const MOCK_ARTICLES = [
  {
    slug: "complete-guide-to-home-health",
    title: "The Complete Guide to Home Health Care",
    subtitle: "Everything you need to know about skilled medical care at home",
    excerpt: "Home health care provides skilled medical services in your home, including nursing care, physical therapy, and more. Learn when it's right for your loved one and how to get started.",
    cover_image_url: "/images/home-health.webp",
    care_types: ["home-health"],
    category: "guide",
    author_name: "Dr. Sarah Chen",
    author_role: "Geriatric Care Specialist",
    status: "published",
    featured: true,
    tags: ["getting-started", "home-health", "medicare"],
    reading_time: "15 min",
    published_at: "2025-12-15T00:00:00Z",
  },
  {
    slug: "home-health-vs-home-care",
    title: "Home Health vs Home Care: Understanding the Difference",
    subtitle: "A side-by-side comparison to help you choose the right care",
    excerpt: "While the names sound similar, home health and home care serve different needs. This guide breaks down the key differences in services, costs, and who qualifies for each.",
    cover_image_url: "/images/home-care.jpg",
    care_types: ["home-health", "home-care"],
    category: "comparison",
    author_name: "Michael Torres",
    author_role: "Senior Care Advisor",
    status: "published",
    featured: true,
    tags: ["comparison", "home-health", "home-care"],
    reading_time: "8 min",
    published_at: "2025-11-28T00:00:00Z",
  },
  {
    slug: "paying-for-assisted-living",
    title: "How to Pay for Assisted Living in 2025",
    subtitle: "Financial options, tips, and resources for families",
    excerpt: "The average cost of assisted living is $4,500/month. Discover all the ways to fund care, from long-term care insurance to veteran benefits and Medicaid programs.",
    cover_image_url: "/images/assisted-living.webp",
    care_types: ["assisted-living"],
    category: "financial",
    author_name: "Jennifer Walsh",
    author_role: "Elder Care Financial Planner",
    status: "published",
    featured: true,
    tags: ["financial", "assisted-living", "medicaid", "insurance"],
    reading_time: "10 min",
    published_at: "2025-12-01T00:00:00Z",
  },
  {
    slug: "memory-care-checklist",
    title: "Memory Care Facility Checklist: 25 Questions to Ask",
    subtitle: "Don't visit a memory care community without this list",
    excerpt: "Choosing a memory care facility is one of the most important decisions you'll make. Use this comprehensive checklist to evaluate safety, staff training, and quality of care.",
    cover_image_url: "/images/memory-care.jpg",
    care_types: ["memory-care"],
    category: "checklist",
    author_name: "Lisa Park, RN",
    author_role: "Memory Care Specialist",
    status: "published",
    featured: false,
    tags: ["checklist", "memory-care", "dementia"],
    reading_time: "5 min",
    published_at: "2025-11-20T00:00:00Z",
  },
  {
    slug: "nursing-home-vs-assisted-living",
    title: "Nursing Home vs Assisted Living: Which Is Right?",
    subtitle: "Key differences in care, cost, and lifestyle",
    excerpt: "Nursing homes and assisted living communities serve different populations. Learn when skilled nursing is necessary and when assisted living may be a better fit.",
    cover_image_url: "/images/nursing-home.webp",
    care_types: ["nursing-homes", "assisted-living"],
    category: "comparison",
    author_name: "Dr. Sarah Chen",
    author_role: "Geriatric Care Specialist",
    status: "published",
    featured: false,
    tags: ["comparison", "nursing-homes", "assisted-living"],
    reading_time: "9 min",
    published_at: "2025-11-15T00:00:00Z",
  },
  {
    slug: "independent-living-guide",
    title: "Independent Living Communities: The Complete Guide",
    subtitle: "Active adult communities for those who need minimal assistance",
    excerpt: "Independent living communities offer maintenance-free living with social activities and amenities. Find out if it's the right choice for your family.",
    cover_image_url: "/images/independent-living.webp",
    care_types: ["independent-living"],
    category: "guide",
    author_name: "Michael Torres",
    author_role: "Senior Care Advisor",
    status: "published",
    featured: false,
    tags: ["guide", "independent-living", "active-adults"],
    reading_time: "12 min",
    published_at: "2025-11-10T00:00:00Z",
  },
];

async function seed() {
  console.log(`Seeding ${MOCK_ARTICLES.length} articles...`);

  for (const article of MOCK_ARTICLES) {
    // Check if slug already exists
    const { data: existing } = await db
      .from("content_articles")
      .select("id")
      .eq("slug", article.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  Skipping "${article.title}" (slug exists)`);
      continue;
    }

    const { error } = await db.from("content_articles").insert(article);

    if (error) {
      console.error(`  Error inserting "${article.title}":`, error.message);
    } else {
      console.log(`  Inserted "${article.title}"`);
    }
  }

  console.log("Done.");
}

seed();
