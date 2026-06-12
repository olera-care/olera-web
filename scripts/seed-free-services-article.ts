/**
 * Seed the "Free Services for Senior Citizens in Texas" article into content_articles.
 *
 * Usage:
 *   npx tsx scripts/seed-free-services-article.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const OLD_SLUG = "free-services-for-senior-citizens-texas-complete-2026-guide";
const NEW_SLUG = "free-services-seniors-texas-2026";

/* ------------------------------------------------------------------ */
/*  Article HTML                                                       */
/* ------------------------------------------------------------------ */

const contentHtml = `
<div class="not-prose my-8 rounded-2xl bg-primary-25 border border-primary-100 p-6 sm:p-8">
  <h2 class="text-xl font-bold text-gray-900" style="margin-top:0;margin-bottom:12px;">Quick Summary</h2>
  <ul style="list-style:none;padding:0;margin:0;font-size:15px;line-height:1.5;color:#374151;">
    <li style="padding:3px 0;"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#d1fae5;color:#059669;font-size:12px;flex-shrink:0;margin-right:6px;">&#10003;</span> Free statewide services for seniors, most with no income requirements</li>
    <li style="padding:3px 0;"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#d1fae5;color:#059669;font-size:12px;flex-shrink:0;margin-right:6px;">&#10003;</span> Includes legal help, Medicare counseling, meal delivery, companionship, and job training</li>
    <li style="padding:3px 0;"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#d1fae5;color:#059669;font-size:12px;flex-shrink:0;margin-right:6px;">&#10003;</span> Start with 2-1-1 Texas if you are not sure where to begin</li>
  </ul>
</div>

<p>Most Texas seniors qualify for more help than they realize. The state offers free services that cover everything from legal help and <a href="/texas/benefits/ship-medicare-counseling" class="text-primary-600 hover:text-primary-700">Medicare counseling</a> to hot meals and friendly visits, and most of them have no income requirements at all.</p>

<p>The problem is not that these services do not exist. The problem is that most families never hear about them until a crisis hits. By then, they are already overwhelmed.</p>

<p>This guide covers the core free services available to Texas seniors in 2026, plus how to access each one.</p>

<h2>Where to Start: 2-1-1 Texas</h2>

<p>Before anything else, save this number: <strong>2-1-1</strong></p>

<p>2-1-1 Texas is a free helpline that can connect you to every senior service in your area. One call gets you routed to the right aid agency for legal help, food assistance, transportation, or caregiver support.</p>

<div class="not-prose my-6 rounded-2xl bg-primary-25 border border-primary-100 p-5 sm:p-6">
  <p class="text-sm font-bold text-gray-900 mb-4">How to reach it</p>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div class="rounded-lg bg-white border border-primary-100 px-4 py-3">
      <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Call</p>
      <p class="text-sm font-semibold text-gray-900">2-1-1 from any phone in Texas</p>
    </div>
    <div class="rounded-lg bg-white border border-primary-100 px-4 py-3">
      <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Website</p>
      <p class="text-sm font-semibold"><a href="https://www.211texas.org" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700">211texas.org</a></p>
    </div>
    <div class="rounded-lg bg-white border border-primary-100 px-4 py-3">
      <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Hours</p>
      <p class="text-sm font-semibold text-gray-900">24/7</p>
    </div>
    <div class="rounded-lg bg-white border border-primary-100 px-4 py-3">
      <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Languages</p>
      <p class="text-sm font-semibold text-gray-900">English and Spanish <span class="font-normal text-gray-500">(150+ via interpreter)</span></p>
    </div>
  </div>
  <p class="text-xs text-gray-400 mt-4 mb-0">No cost or eligibility requirements.</p>
</div>

<p>If you only remember one thing from this guide, start here. 2-1-1 is a living, maintained directory of every state and local program. It is the fastest way to find help without having to search agency by agency.</p>

<h2>Texas Long-Term Care Ombudsman</h2>

<div class="not-prose my-4 flex flex-wrap gap-2">
  <span class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
    1-800-458-9858
  </span>
  <a href="/texas/benefits/ltc-ombudsman" class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700 no-underline hover:bg-primary-100 transition-colors">
    Learn more
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>
  </a>
</div>

<p>The <a href="/texas/benefits/ltc-ombudsman" class="text-primary-600 hover:text-primary-700">Long-Term Care Ombudsman</a> is a free advocate for anyone living in or considering a nursing home or assisted living facility. If you are worried about a loved one's care quality and need a free, independent opinion, this is where to turn.</p>

<h3>How They Help</h3>

<p>Ombudsmen handle issues like care quality, resident rights, and billing concerns. They investigate complaints, mediate disputes between families and facilities, and work on behalf of residents in nursing homes, assisted living facilities, and adult care institutions. They are trained to protect resident health, safety, and well-being.</p>

<h3>Who Qualifies</h3>

<p>Anyone who is at or has a loved one in a residential care facility. There is no cost, no income requirement, and no need to prove anything.</p>

<p>Ombudsmen are independent, which means they do not work for the facility. You can talk to them confidentially.</p>

<h2>Texas Legal Services for Seniors</h2>

<div class="not-prose my-4 flex flex-wrap gap-2">
  <span class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
    1-800-622-2520
  </span>
  <a href="/texas/benefits/legal-aid-seniors-aaa" class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700 no-underline hover:bg-primary-100 transition-colors">
    Learn more
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>
  </a>
</div>

<p>Many seniors face legal issues they cannot afford to resolve on their own, from benefits denials and property tax disputes to powers of attorney and advance directives. The <a href="/texas/benefits/legal-aid-seniors-aaa" class="text-primary-600 hover:text-primary-700">Legal Hotline for Texas Legal Services</a> is a free service you can call to get legal guidance.</p>

<h3>What They Help With</h3>

<p>The legal hotline can walk you through questions about <a href="/caregiver-support/texas-medicaid-eligibility-seniors-2026" class="text-primary-600 hover:text-primary-700">Medicaid</a> and Medicare, powers of attorney and advance directives, property tax exemptions, debt collection, consumer fraud, and elder abuse reporting. They can also help with wills and estate planning for qualifying seniors.</p>

<h3>Who Qualifies</h3>

<p>Seniors 60 and older who cannot afford a private attorney. Income or Medicaid eligibility is not required, but they may ask you to verify age. They cannot help with criminal law, Medicare Part D appeals, and some areas of family law.</p>

<p>If they cannot help you directly, they will refer you to a local legal aid organization that can.</p>

<h2>Texas SHIP Medicare Counseling</h2>

<div class="not-prose my-4 flex flex-wrap gap-2">
  <span class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
    1-800-252-9240
  </span>
  <a href="/texas/benefits/ship-medicare-counseling" class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700 no-underline hover:bg-primary-100 transition-colors">
    Learn more
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>
  </a>
</div>

<p>Medicare can be one of the most confusing things a senior faces, especially when more is combined with supplemental and prescription drug coverage. It is easy to end up paying for coverage you do not need or missing benefits you are entitled to. The <a href="/texas/benefits/ship-medicare-counseling" class="text-primary-600 hover:text-primary-700">State Health Insurance Assistance Program (SHIP)</a> is designed to help. You get no-cost counseling services that help you make sense of it all.</p>

<h3>What SHIP Counselors Help With</h3>

<p>SHIP counselors help with comparing Medicare Advantage, Part D, and Medigap plans. They also help with understanding Medicare eligibility and enrollment periods, reviewing claims, billing disputes, and appeals. They answer questions about how Medicare coordinates with other coverage like Medicaid and employer plans.</p>

<h3>Who Qualifies</h3>

<p>Any Medicare beneficiary or their representative, regardless of age. This includes people approaching 65 who want help understanding their options before they enroll.</p>

<p>Insurance brokers earn commissions on the plans they sell. SHIP counselors do not. They are volunteers trained by the state to give unbiased advice. That distinction matters when you are choosing coverage that could cost or save you thousands of dollars a year.</p>

<h2>Senior Companion Program</h2>

<div class="not-prose my-4 flex flex-wrap gap-2">
  <span class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">AmeriCorps</span>
  <a href="http://texasseniorcorps.org/scp.html" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700 no-underline hover:bg-primary-100 transition-colors">
    Learn more
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>
  </a>
</div>

<p>Loneliness is one of the most underestimated health risks for seniors, as harmful as smoking 15 cigarettes a day. The Senior Companion Program is designed to help combat that isolation by matching older adults with trained volunteer companions. Funded federally by AmeriCorps, it operates locally across Texas through nonprofit organizations.</p>

<h3>What Companions Help With</h3>

<p>Companions provide regular visits, conversations, and local excursions. They also assist with light tasks like simple meal preparation, medication reminders, errands, and light housekeeping. The primary goal is reducing isolation and helping seniors remain independent at home.</p>

<h3>Who Qualifies</h3>

<p>Texas residents 55 or older who are homebound, socially isolated, or need a little extra support to stay independent. There are no income requirements to receive a companion.</p>

<p><strong>How long it takes:</strong> Plan for at least a few weeks to be matched with a volunteer.</p>

<h2>Meals on Wheels Texas</h2>

<div class="not-prose my-4 flex flex-wrap gap-2">
  <span class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">Local chapters</span>
  <a href="/texas/benefits/meals-on-wheels" class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700 no-underline hover:bg-primary-100 transition-colors">
    Learn more
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>
  </a>
</div>

<p>For many seniors, the actual problem is not that food is unavailable but that the seniors who need it most cannot get to it. Mobility issues, lack of transportation, and limited cooking ability turn a basic need into a daily struggle. <a href="/texas/benefits/meals-on-wheels" class="text-primary-600 hover:text-primary-700">Meals on Wheels Texas</a> brings free or low-cost meals directly to seniors at home.</p>

<p>Delivery schedules vary by area, but most chapters deliver on a weekday basis. Some areas also provide weekend and emergency meals during severe weather.</p>

<h3>What Is Included</h3>

<p>Most local Meals on Wheels chapters serve hot or other dietitian-designed meals, along with a daily safety check during each visit. Some may do a weekend or emergency plan and provide pet food, shelf-stable emergency meal kits, or connections to other local aging services.</p>

<h3>Who Qualifies</h3>

<p>Adults 60 or older with mobility challenges too hard to cook for themselves, or who are homebound, socially isolated, or at nutritional risk. Income eligibility varies by local chapter, but most serve anyone who meets the age and need criteria.</p>

<p><strong>How to sign up:</strong> Contact 2-1-1 or your local area agency on aging to find your nearest Meals on Wheels chapter.</p>

<p>If your loved one also needs longer-term food support, call 2-1-1 to ask about SNAP benefits and congregate meal programs at local senior centers. These pair well with Meals on Wheels.</p>

<h2>Is There Really a $3,000 Senior Assistance Program in Texas?</h2>

<p>There is no single $3,000 program in Texas, despite what online searches suggest. The phrase usually refers to combined annual benefits from multiple programs - like SNAP food benefits, energy assistance, and Medicare savings programs.</p>

<p>Total benefits across multiple programs can exceed $3,000 per year for qualifying seniors. For example, a senior enrolled in SNAP, LIHEAP energy assistance, and a Medicare Savings Program could receive well over that amount annually. The key is knowing which programs to apply for and stacking them together.</p>

<p>If you are looking for a single large payment, that does not exist at the state level. But if you apply to the right combination of programs, the total value adds up quickly. Start with <strong>2-1-1 Texas</strong> to find out which programs you qualify for in your area.</p>

<h2>What If I Need Financial Help, Not Just Free Services?</h2>

<p>The services in this guide are free and available with minimal paperwork. But if you are also looking for help paying for medical care, home care, or living expenses, Texas has additional programs that can help.</p>

<p>We have put together a full list of <a href="/texas/benefits" class="text-primary-600 font-semibold hover:text-primary-700">Texas senior benefit programs</a> covering Medicaid, SNAP, energy assistance, Medicare savings, and more.</p>

<div class="not-prose my-8 rounded-2xl overflow-hidden border border-primary-200" style="background:linear-gradient(to bottom, #f4fafa, #ffffff);">
  <div style="padding:24px 24px 28px;">
    <p style="font-size:18px;font-weight:700;color:#1a3030;line-height:1.3;margin:0 0 8px;">Not sure what you qualify for?</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 20px;">The Olera Benefits Finder takes about 2 minutes and shows you every program your loved one may qualify for in Texas, your estimated savings, and exactly what to do next. Completely free.</p>
    <div style="display:flex;flex-wrap:wrap;gap:10px;">
      <a href="/benefits/finder" style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:10px;background:linear-gradient(to bottom, #5fa3a3, #4d8a8a);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;box-shadow:0 2px 4px rgba(77,138,138,0.3), inset 0 1px 0 rgba(255,255,255,0.2);">
        Find my benefits
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#ffffff;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
      <a href="/texas/benefits" style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:10px;background:#ffffff;border:1px solid #d1d5db;color:#374151;font-size:14px;font-weight:600;text-decoration:none;">
        Browse all Texas programs
      </a>
    </div>
  </div>
</div>

<!-- faq-accordion -->

<h2>References</h2>

<p class="text-sm text-gray-500 mb-4">Last reviewed: June 12, 2026 by Dr. Logan DuBose, MD</p>

<ol class="space-y-2 text-sm list-decimal pl-5">
  <li><a href="https://www.211texas.org/about-2-1-1/" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700">Texas 2-1-1: About the Service</a>. Texas Health and Human Services Commission.</li>
  <li><a href="https://www.hhs.texas.gov/services/aging/long-term-care-ombudsman" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700">Long-Term Care Ombudsman Program</a>. Texas Health and Human Services.</li>
  <li><a href="https://www.tlsc.org/legal-hotline" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700">Legal Hotline for Texans</a>. Texas Legal Services Center.</li>
  <li><a href="https://www.hhs.texas.gov/services/health/medicare/ship-state-health-insurance-assistance-program" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700">SHIP - State Health Insurance Assistance Program</a>. Texas Health and Human Services.</li>
  <li><a href="https://americorps.gov/serve/americorps-seniors/senior-companion-program" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700">Senior Companion Program</a>. AmeriCorps Seniors.</li>
  <li><a href="https://www.mealsonwheelsamerica.org/find-meals" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700">Find Meals on Wheels Near You</a>. Meals on Wheels America.</li>
  <li><a href="https://www.hhs.texas.gov/services/food/snap-food-benefits" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700">SNAP Food Benefits</a>. Texas Health and Human Services.</li>
  <li><a href="https://www.benefits.gov/benefit/623" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700">Low Income Home Energy Assistance Program (LIHEAP)</a>. Benefits.gov.</li>
</ol>
`.trim();

/* ------------------------------------------------------------------ */
/*  Article fields                                                     */
/* ------------------------------------------------------------------ */

const ARTICLE_FIELDS = {
  slug: NEW_SLUG,
  title: "Free Services for Senior Citizens in Texas",
  subtitle:
    "Finding help for an aging parent shouldn\u2019t feel like a full-time job. We found free services in Texas for you.",
  excerpt:
    "Most Texas seniors qualify for more help than they realize. The state offers free services covering legal help, Medicare counseling, meal delivery, companionship, and more - most with no income requirements.",
  content_html: contentHtml,
  status: "published" as const,
  section: "caregiver-support",
  category: "guide",
  care_types: [],
  tags: ["texas", "senior-care", "free-services", "medicaid", "medicare"],
  reading_time: "12 min read",
  author_name: "Olera Team",
  reviewer_name: "Dr. Logan DuBose",
  reviewer_role: "Co-founder & MD",
  meta_title:
    "Free Services for Senior Citizens in Texas (2026 Guide) | Olera",
  meta_description:
    "A complete 2026 guide to free services for senior citizens in Texas. Find Medicaid waivers, Meals on Wheels, legal aid, and benefits help for your aging parent.",
  og_title: "Free Services for Senior Citizens in Texas (2026 Guide)",
  og_description:
    "A complete 2026 guide to free services for senior citizens in Texas. Find Medicaid waivers, Meals on Wheels, legal aid, and benefits help for your aging parent.",
  focus_keyword: "free services for senior citizens in texas",
  structured_data_type: "MedicalWebPage",
  twitter_card_type: "summary_large_image",
  canonical_url: `https://olera.care/caregiver-support/${NEW_SLUG}`,
};

/* ------------------------------------------------------------------ */
/*  Seed / upsert                                                      */
/* ------------------------------------------------------------------ */

async function main() {
  // Check if old slug exists (needs migration)
  const { data: oldArticle } = await db
    .from("content_articles")
    .select("id")
    .eq("slug", OLD_SLUG)
    .maybeSingle();

  if (oldArticle) {
    // Migrate: update slug + all fields
    const { error } = await db
      .from("content_articles")
      .update({
        ...ARTICLE_FIELDS,
        updated_at: new Date().toISOString(),
      })
      .eq("id", oldArticle.id);

    if (error) {
      console.error("Failed to update article:", error.message);
      process.exit(1);
    }
    console.log(`Migrated slug: ${OLD_SLUG} -> ${NEW_SLUG}`);
    console.log(`Updated article (id: ${oldArticle.id})`);
    return;
  }

  // Check if new slug already exists
  const { data: existing } = await db
    .from("content_articles")
    .select("id")
    .eq("slug", NEW_SLUG)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from("content_articles")
      .update({
        ...ARTICLE_FIELDS,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("Failed to update article:", error.message);
      process.exit(1);
    }
    console.log(`Updated existing article (id: ${existing.id})`);
    return;
  }

  // Insert new
  const { data, error } = await db
    .from("content_articles")
    .insert({
      ...ARTICLE_FIELDS,
      published_at: "2026-04-15T10:00:00+00:00",
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("Failed to insert article:", error.message);
    process.exit(1);
  }

  console.log(`Created article:`);
  console.log(`  ID:   ${data.id}`);
  console.log(`  Slug: ${data.slug}`);
  console.log(`  URL:  /caregiver-support/${data.slug}`);
}

main();
