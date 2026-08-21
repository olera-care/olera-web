/**
 * Update the Texas caregiver article with full content HTML.
 *
 * Usage:
 *   npx tsx scripts/update-texas-article.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually
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

const ARTICLE_HTML = `
<div class="not-prose my-8 rounded-2xl bg-primary-25 border border-primary-100 p-6 sm:p-8">
  <h2 class="text-xl font-bold text-gray-900" style="margin-top:0;margin-bottom:12px;">Quick Summary</h2>
  <ul style="list-style:none;padding:0;margin:0;font-size:15px;line-height:1.5;color:#374151;">
    <li style="padding:3px 0;"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#d1fae5;color:#059669;font-size:12px;flex-shrink:0;margin-right:6px;">&#10003;</span> Family members and close friends can get paid to care for a loved one through STAR+PLUS</li>
    <li style="padding:3px 0;"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#d1fae5;color:#059669;font-size:12px;flex-shrink:0;margin-right:6px;">&#10003;</span> Pay ranges from <b>$10 to $17 per hour</b>, up to 50 hours per week</li>
    <li style="padding:3px 0;"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#d1fae5;color:#059669;font-size:12px;flex-shrink:0;margin-right:6px;">&#10003;</span> You must be 18 or older and pass a background check</li>
    <li style="padding:3px 0;"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#d1fae5;color:#059669;font-size:12px;flex-shrink:0;margin-right:6px;">&#10003;</span> Spouses and legal guardians may qualify with MCO authorization</li>
    <li style="padding:3px 0;"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#d1fae5;color:#059669;font-size:12px;flex-shrink:0;margin-right:6px;">&#10003;</span> First paycheck typically takes <b>30 to 90 days</b></li>
  </ul>
</div>

<p class="text-lg leading-relaxed">Caring for someone you love is one of the hardest and most important things you can do. You deserve support, not just emotionally, but practically and financially too.</p>

<p>Applying for caregiver benefits in Texas is more complicated than it should be. The systems are confusing, the paperwork is overwhelming, and most families never find out about the help that is available to them. That is exactly why we built Olera to make this easier.</p>

<p>Here is what most families in Texas do not know: <strong>if you are already caring for an aging parent, spouse, or loved one, you may be able to get paid for the work you are doing every day.</strong> This guide walks you through everything, step by step.</p>

<h2>Can You Get Paid as a Caregiver in Texas?</h2>

<p><strong>Yes.</strong> Through Texas Medicaid&rsquo;s <strong>STAR+PLUS</strong> program, family members and close friends can be officially hired and paid as caregivers.</p>

<!-- eligibility-checker -->

<h2>Who Qualifies to Be a Paid Caregiver in Texas</h2>

<p>The requirements are straightforward:</p>

<ul style="list-style:none;padding-left:0;" class="space-y-3">
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>You are <strong>18 or older</strong></span></li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>You are an <strong>adult child, sibling, extended family member, or close friend</strong>. (Note: Spouses and legal guardians generally cannot serve as the paid attendant under standard Texas Medicaid rules.)</span></li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>You can <strong>pass a background check</strong></span></li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Your loved one is enrolled in <strong>Texas Medicaid</strong> (such as STAR+PLUS HCBS, Primary Home Care, or Community First Choice) and has an approved care plan authorizing personal attendant hours</span></li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>You are not serving as the designated <strong>Employer of Record</strong> for your loved one's CDS budget</span></li>
</ul>

<h3>Who Can and Cannot Be a Paid Caregiver</h3>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 not-prose">
  <div class="rounded-xl bg-primary-50 border border-primary-200 p-5 shadow-sm">
    <p class="text-base font-semibold text-primary-800 mb-3 flex items-center gap-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><path d="M20 6L9 17l-5-5"/></svg> Who Can Be Paid</p>
    <p class="text-sm text-primary-800 mb-2">Family members and other trusted individuals may be eligible to serve as paid caregivers, including:</p>
    <ul class="space-y-2.5 text-sm text-primary-900" style="list-style:none;padding:0;margin:0;">
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Adult children and grandchildren</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Siblings, nieces, nephews, and extended family members</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Close friends and trusted neighbors</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Unrelated personal attendants or hired aides</li>
    </ul>
  </div>
  <div class="rounded-xl bg-red-50 border border-red-200 p-5 shadow-sm">
    <p class="text-base font-semibold text-red-700 mb-3 flex items-center gap-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><path d="M18 6L6 18M6 6l12 12"/></svg> Who Generally Cannot Be Paid</p>
    <p class="text-sm text-red-700 mb-2">Some restrictions apply:</p>
    <ul class="space-y-2.5 text-sm text-red-800" style="list-style:none;padding:0;margin:0;">
      <li class="flex items-start gap-2.5"><span class="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-1.5"></span><span><strong>Designated Employer of Record:</strong> Cannot also be the paid caregiver.</span></li>
      <li class="flex items-start gap-2.5"><span class="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-1.5"></span><span><strong>Spouses:</strong> Generally excluded, with limited MCO-approved exceptions.</span></li>
      <li class="flex items-start gap-2.5"><span class="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-1.5"></span><span><strong>Court-appointed legal guardians:</strong> Generally excluded when acting as the legal representative or employer.</span></li>
      <li class="flex items-start gap-2.5"><span class="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-1.5"></span><span>Under 18 or unable to pass a required background check.</span></li>
    </ul>
  </div>
</div>

<h2>How Much Can You Earn</h2>

<p>Caregivers in Texas typically earn <strong>$10.60 to $17 per hour</strong>, with a minimum base attendant wage of $10.60. The number of paid hours depends on the individual&rsquo;s Medicaid assessment and care plan, often ranging from <strong>15 to 50 hours per week</strong>.</p>

<h3>MCO Pay Rate Comparison</h3>

<div class="my-6 rounded-xl border border-primary-200 overflow-hidden not-prose">
  <table style="margin:0;border:none;" class="w-full">
    <thead>
      <tr class="bg-primary-50">
        <th class="text-left text-xs font-semibold text-primary-800 uppercase tracking-wider px-4 py-3" style="border:none;">Organization</th>
        <th class="text-left text-xs font-semibold text-primary-800 uppercase tracking-wider px-4 py-3" style="border:none;">Hourly Rate Range</th>
        <th class="text-right text-xs font-semibold text-primary-800 uppercase tracking-wider px-4 py-3 hidden sm:table-cell" style="border:none;">Est. Monthly (20 hrs/wk)</th>
        <th class="text-right text-xs font-semibold text-primary-800 uppercase tracking-wider px-4 py-3 hidden md:table-cell" style="border:none;">Est. Monthly (40 hrs/wk)</th>
        <th class="text-right text-xs font-semibold text-primary-800 uppercase tracking-wider px-4 py-3" style="border:none;">Est. Monthly (50 hrs/wk)</th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-t border-primary-100">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">UnitedHealthcare Community Plan</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">$10.60 &ndash; $15.75 / hr</td>
        <td class="px-4 py-3 text-sm text-gray-600 text-right hidden sm:table-cell" style="border:none;">$919 &ndash; $1,365 / mo</td>
        <td class="px-4 py-3 text-sm text-gray-600 text-right hidden md:table-cell" style="border:none;">$1,837 &ndash; $2,730 / mo</td>
        <td class="px-4 py-3 text-sm font-semibold text-primary-700 text-right" style="border:none;">$2,297 &ndash; $3,413 / mo</td>
      </tr>
      <tr class="border-t border-primary-100 bg-primary-25">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">Molina Healthcare</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">$10.60 &ndash; $14.50 / hr</td>
        <td class="px-4 py-3 text-sm text-gray-600 text-right hidden sm:table-cell" style="border:none;">$919 &ndash; $1,257 / mo</td>
        <td class="px-4 py-3 text-sm text-gray-600 text-right hidden md:table-cell" style="border:none;">$1,837 &ndash; $2,513 / mo</td>
        <td class="px-4 py-3 text-sm font-semibold text-primary-700 text-right" style="border:none;">$2,297 &ndash; $3,142 / mo</td>
      </tr>
      <tr class="border-t border-primary-100">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">Superior HealthPlan</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">$10.60 &ndash; $16.00 / hr</td>
        <td class="px-4 py-3 text-sm text-gray-600 text-right hidden sm:table-cell" style="border:none;">$919 &ndash; $1,387 / mo</td>
        <td class="px-4 py-3 text-sm text-gray-600 text-right hidden md:table-cell" style="border:none;">$1,837 &ndash; $2,773 / mo</td>
        <td class="px-4 py-3 text-sm font-semibold text-primary-700 text-right" style="border:none;">$2,297 &ndash; $3,467 / mo</td>
      </tr>
      <tr class="border-t border-primary-100 bg-primary-25">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">Community First Health Plans</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">$11.00 &ndash; $17.00 / hr</td>
        <td class="px-4 py-3 text-sm text-gray-600 text-right hidden sm:table-cell" style="border:none;">$953 &ndash; $1,473 / mo</td>
        <td class="px-4 py-3 text-sm text-gray-600 text-right hidden md:table-cell" style="border:none;">$1,907 &ndash; $2,947 / mo</td>
        <td class="px-4 py-3 text-sm font-semibold text-primary-700 text-right" style="border:none;">$2,383 &ndash; $3,683 / mo</td>
      </tr>
    </tbody>
  </table>
</div>

<p><em>Rates vary by region and care plan. These are estimates based on 2025&ndash;2026 data.</em></p>

<h2>How to Apply, Step by Step</h2>

<p>The application process has six steps. Most families can complete it in 30 to 90 days.</p>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 not-prose">
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">1</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Confirm Medicaid / STAR+PLUS Coverage</p><p class="text-sm text-gray-500">Make sure your loved one is enrolled in Texas Medicaid and assigned to a STAR+PLUS Managed Care Organization (MCO). Call <strong>2-1-1</strong> or visit <a href="https://www.yourtexasbenefits.com" target="_blank" rel="noopener noreferrer" class="text-primary-600 underline">YourTexasBenefits.com</a> to check coverage or join the waiver interest list.</p></div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">2</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Schedule a Needs Assessment</p><p class="text-sm text-gray-500">Contact your loved one&rsquo;s MCO to request an assessment. A service coordinator or nurse will evaluate their daily care needs and determine the number of authorized care hours.</p></div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">3</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Choose Consumer Directed Services (CDS)</p><p class="text-sm text-gray-500">Tell the service coordinator you want to use CDS, which allows your loved one to hire an eligible family member, friend, or caregiver instead of using agency staff.</p></div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">4</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Choose an FMSA</p><p class="text-sm text-gray-500">Select a state-contracted Financial Management Services Agency (FMSA) to manage payroll, taxes, and employer paperwork.</p></div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">5</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Complete Caregiver Onboarding</p><p class="text-sm text-gray-500">The caregiver completes hiring paperwork, required background checks, and program orientation through the FMSA.</p></div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">6</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Track Hours &amp; Get Paid</p><p class="text-sm text-gray-500">Caregivers log approved hours through Electronic Visit Verification (EVV) and receive pay through the FMSA.</p></div>
  </div>
</div>

<h3>How Long Does It Take?</h3>

<p>Here is a realistic timeline for each phase of the process.</p>

<div class="my-6 space-y-3 not-prose">
  <div class="flex items-center gap-4 rounded-lg bg-primary-25 border border-primary-100 px-4 py-3">
    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex-shrink-0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
    <span class="flex-1 text-sm text-gray-800">Enrollment &amp; CDS request</span>
    <span class="text-sm font-semibold text-primary-700 flex-shrink-0">1 &ndash; 2 weeks</span>
  </div>
  <div class="flex items-center gap-4 rounded-lg bg-primary-25 border border-primary-100 px-4 py-3">
    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex-shrink-0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
    <span class="flex-1 text-sm text-gray-800">Assessment &amp; hour approval</span>
    <span class="text-sm font-semibold text-primary-700 flex-shrink-0">2 &ndash; 4 weeks</span>
  </div>
  <div class="flex items-center gap-4 rounded-lg bg-primary-25 border border-primary-100 px-4 py-3">
    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex-shrink-0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
    <span class="flex-1 text-sm text-gray-800">FMSA setup &amp; application</span>
    <span class="text-sm font-semibold text-primary-700 flex-shrink-0">2 &ndash; 4 weeks</span>
  </div>
  <div class="flex items-center gap-4 rounded-lg bg-primary-100 border border-primary-300 px-4 py-3">
    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white flex-shrink-0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>
    <span class="flex-1 text-sm font-medium text-gray-900">First paycheck</span>
    <span class="text-sm font-bold text-primary-800 flex-shrink-0">30 &ndash; 90 days total</span>
  </div>
</div>

<h2>What Documents Do You Need</h2>

<ul style="list-style:none;padding-left:0;" class="space-y-3">
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Government-issued photo ID</li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Social Security card</li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Proof of Texas address</li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Consent to background check</li>
</ul>

<p><strong>Want the full checklist?</strong> Use the <a href="/texas/benefits/senior-companion/checklist">Olera Document Checklist</a> to get a personalized document list you can download or email to yourself.</p>

<!-- faq-accordion -->

<h2>Find Out What Your Family Qualifies For</h2>

<p>You do not have to figure this out alone. The <strong>Olera Benefits Finder</strong> shows you every program your loved one may qualify for in about 2 minutes. Free, no signup required.</p>

<div class="my-6 not-prose"><a href="/benefits/finder" style="color:#ffffff;" class="inline-flex items-center justify-center px-8 py-3.5 bg-primary-600 text-base font-semibold rounded-full hover:bg-primary-700 shadow-md hover:shadow-lg transition-all no-underline">Check Your Benefits &rarr;</a></div>

<hr />

<p class="text-sm text-gray-500"><em>Eligibility requirements are updated annually. Verify current program availability at <a href="https://www.hhs.texas.gov" target="_blank" rel="noopener noreferrer">hhs.texas.gov</a> or call <strong>211</strong>.</em></p>
`;

async function main() {
  const slug = "how-to-get-paid-as-a-caregiver-in-texas";

  const { data: article } = await db
    .from("content_articles")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!article) {
    console.error(`Article with slug "${slug}" not found.`);
    process.exit(1);
  }

  const { error } = await db
    .from("content_articles")
    .update({
      content_html: ARTICLE_HTML.trim(),
      excerpt:
        "Can you get paid to care for a family member in Texas? Yes, through Medicaid\u2019s STAR+PLUS program. Here is who qualifies and how to apply.",
      subtitle:
        "A step-by-step guide to getting paid through Texas Medicaid\u2019s STAR+PLUS Consumer Directed Services program.",
      reading_time: "8 min read",
      tags: ["texas", "medicaid", "paid-caregiving", "star-plus", "cover-alt:Family caregiver helping elderly parent at home in Texas"],
      focus_keyword: "get paid as a caregiver in texas",
      structured_data_type: "Article",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", article.id);

  if (error) {
    console.error("Failed to update article:", error.message);
    process.exit(1);
  }

  console.log(`Updated article ${article.id} with full content.`);
  console.log(`  URL: /texas/${slug}`);
}

main();
