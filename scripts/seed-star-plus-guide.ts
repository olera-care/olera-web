/**
 * Seed the STAR+PLUS complete guide article into content_articles.
 *
 * Usage:
 *   npx tsx scripts/seed-star-plus-guide.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually (no dotenv dependency)
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

const SLUG = "star-plus-waiver-texas-complete-guide";

const ARTICLE_HTML = `
<p class="text-lg leading-relaxed">STAR+PLUS is Texas Medicaid&rsquo;s program that helps seniors and adults with disabilities stay home instead of moving to a nursing facility. It covers everything from personal care to home modifications.</p>

<p>Most families don&rsquo;t find out about it until there&rsquo;s a crisis. This guide puts everything you need in one place.</p>

<h2>What Is the STAR+PLUS Waiver?</h2>

<p><strong>STAR+PLUS</strong> is a Texas Medicaid managed care program that combines acute care (doctor visits, hospital stays, prescriptions) with long-term services and supports (LTSS). It is run through private managed care organizations (MCOs) contracted by the state.</p>

<p>The <strong>HCBS waiver</strong> (Home and Community-Based Services) is the part of STAR+PLUS that pays for services delivered at home or in the community, rather than in a nursing facility. This is what most families are looking for when they search for the STAR+PLUS waiver. For a quick overview of eligibility and covered services, see our <a href="/texas/benefits/star-plus" class="text-primary-600 underline">STAR+PLUS HCBS program page</a>.</p>

<div class="my-6 rounded-xl bg-primary-50 border border-primary-200 p-5 not-prose">
  <p class="text-sm font-semibold text-primary-800 mb-2">Key distinction</p>
  <p class="text-sm text-primary-900">Everyone on Texas Medicaid who is aged or disabled is enrolled in STAR+PLUS for basic coverage. But the <strong>HCBS waiver</strong> is an additional layer of services you must specifically request and qualify for. It is this waiver that covers personal attendants, home modifications, and other supports.</p>
</div>

<h2>Who Is Eligible</h2>

<p>To qualify for the STAR+PLUS HCBS waiver, your loved one must meet <strong>all</strong> of the following:</p>

<ul style="list-style:none;padding-left:0;" class="space-y-3">
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Be <strong>21 or older</strong> (or 65+ for some services)</span></li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Be a <strong>Texas resident</strong> and U.S. citizen or qualified non-citizen</span></li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Meet the <strong>income limit</strong> of $2,982/month (2026)</span></li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Have <strong>countable assets</strong> under $2,000 (home and one vehicle are exempt)</span></li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Need a <strong>nursing facility level of care</strong> (assessed by the state)</span></li>
</ul>

<h3>Income and Asset Limits for 2026</h3>

<div class="my-6 rounded-xl border border-primary-200 overflow-hidden not-prose">
  <table style="margin:0;border:none;" class="w-full">
    <thead>
      <tr class="bg-primary-50">
        <th class="text-left text-xs font-semibold text-primary-800 uppercase tracking-wider px-4 py-3" style="border:none;">Category</th>
        <th class="text-left text-xs font-semibold text-primary-800 uppercase tracking-wider px-4 py-3" style="border:none;">Individual</th>
        <th class="text-left text-xs font-semibold text-primary-800 uppercase tracking-wider px-4 py-3" style="border:none;">Married (community spouse)</th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-t border-primary-100">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">Monthly income limit</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">$2,982</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">$2,982 (applicant only)</td>
      </tr>
      <tr class="border-t border-primary-100 bg-primary-25">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">Asset limit</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">$2,000</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">$154,140 (community spouse allowance)</td>
      </tr>
      <tr class="border-t border-primary-100">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">Home</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">Exempt</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">Exempt</td>
      </tr>
      <tr class="border-t border-primary-100 bg-primary-25">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">One vehicle</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">Exempt</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;">Exempt</td>
      </tr>
    </tbody>
  </table>
</div>

<p><em>If your loved one&rsquo;s income is over $2,982, a <strong>Qualified Income Trust</strong> (Miller Trust) can bring countable income below the limit. This is very common and your managed care organization can help set one up.</em></p>

<!-- eligibility-checker -->

<h2>What Services Does STAR+PLUS Cover?</h2>

<p>The HCBS waiver covers a wide range of services designed to keep your loved one safely at home. Services are determined by the care plan created with the service coordinator.</p>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 not-prose">
  <div class="rounded-xl bg-primary-50 border border-primary-200 p-5 shadow-sm">
    <div class="flex items-center gap-3 mb-3">
      <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 flex-shrink-0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg></span>
      <p class="text-base font-semibold text-primary-800">Personal care</p>
    </div>
    <ul class="space-y-2.5 text-sm text-primary-900" style="list-style:none;padding:0;margin:0;">
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Personal attendant services (PAS)</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Help with bathing, dressing, meals</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Medication reminders</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Mobility and transfer help</li>
    </ul>
  </div>
  <div class="rounded-xl bg-primary-50 border border-primary-200 p-5 shadow-sm">
    <div class="flex items-center gap-3 mb-3">
      <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 flex-shrink-0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
      <p class="text-base font-semibold text-primary-800">Home &amp; community</p>
    </div>
    <ul class="space-y-2.5 text-sm text-primary-900" style="list-style:none;padding:0;margin:0;">
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Home modifications (ramps, grab bars)</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Adaptive aids and medical equipment</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Adult day care</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Respite care for family caregivers</li>
    </ul>
  </div>
  <div class="rounded-xl bg-primary-50 border border-primary-200 p-5 shadow-sm">
    <div class="flex items-center gap-3 mb-3">
      <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 flex-shrink-0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span>
      <p class="text-base font-semibold text-primary-800">Medical &amp; nursing</p>
    </div>
    <ul class="space-y-2.5 text-sm text-primary-900" style="list-style:none;padding:0;margin:0;">
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Skilled nursing visits</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Physical, occupational, speech therapy</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Prescription drugs</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Doctor and specialist visits</li>
    </ul>
  </div>
  <div class="rounded-xl bg-primary-50 border border-primary-200 p-5 shadow-sm">
    <div class="flex items-center gap-3 mb-3">
      <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 flex-shrink-0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
      <p class="text-base font-semibold text-primary-800">Consumer Directed Services</p>
    </div>
    <ul class="space-y-2.5 text-sm text-primary-900" style="list-style:none;padding:0;margin:0;">
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Hire your own caregiver (including family)</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Set your own schedule</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Manage care on your terms</li>
      <li class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>Payroll handled by an FMSA</li>
    </ul>
  </div>
</div>

<h2>How to Apply for STAR+PLUS in Texas</h2>

<p>The process has several steps and typically takes <strong>30 to 90 days</strong> from start to first services. Here is how it works:</p>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 not-prose">
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">1</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Get on the interest list</p><p class="text-sm text-gray-500">Call <strong>211</strong> or apply at <a href="https://www.yourtexasbenefits.com" target="_blank" rel="noopener noreferrer" class="text-primary-600 underline">YourTexasBenefits.com</a>. Do this as early as possible because wait times can be 6 to 18 months.</p></div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">2</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Apply for Medicaid</p><p class="text-sm text-gray-500">If not already enrolled, apply for Texas Medicaid. You will need proof of income, assets, residency, and citizenship.</p></div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">3</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Medical assessment</p><p class="text-sm text-gray-500">A state assessor will evaluate your loved one to confirm they need a nursing facility level of care.</p></div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">4</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Choose an MCO</p><p class="text-sm text-gray-500">Select a managed care organization: UnitedHealthcare, Molina, Superior HealthPlan, or others available in your area.</p></div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">5</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Service coordinator visit</p><p class="text-sm text-gray-500">Your MCO assigns a service coordinator who creates a personalized care plan with approved hours and services.</p></div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm flex gap-4 items-start">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">6</span>
    <div><p class="text-sm font-semibold text-gray-900 mb-1">Services begin</p><p class="text-sm text-gray-500">Once the care plan is approved, services start. You can choose agency-directed care or Consumer Directed Services (CDS).</p></div>
  </div>
</div>

<h3>How Long Is the Waitlist?</h3>

<p>The STAR+PLUS HCBS waiver interest list wait time varies by region:</p>

<div class="my-6 rounded-xl border border-primary-200 overflow-hidden not-prose">
  <table style="margin:0;border:none;" class="w-full">
    <thead>
      <tr class="bg-primary-50">
        <th class="text-left text-xs font-semibold text-primary-800 uppercase tracking-wider px-4 py-3" style="border:none;">Region</th>
        <th class="text-left text-xs font-semibold text-primary-800 uppercase tracking-wider px-4 py-3" style="border:none;">Typical Wait</th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-t border-primary-100">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">Houston / Harris County</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;"><span class="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>6 &ndash; 12 months</span></td>
      </tr>
      <tr class="border-t border-primary-100 bg-primary-25">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">Dallas / Fort Worth</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;"><span class="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>8 &ndash; 14 months</span></td>
      </tr>
      <tr class="border-t border-primary-100">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">San Antonio / Bexar County</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;"><span class="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>6 &ndash; 12 months</span></td>
      </tr>
      <tr class="border-t border-primary-100 bg-primary-25">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">Austin / Travis County</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;"><span class="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>8 &ndash; 16 months</span></td>
      </tr>
      <tr class="border-t border-primary-100">
        <td class="px-4 py-3 text-sm font-medium text-gray-900" style="border:none;">Rural areas</td>
        <td class="px-4 py-3 text-sm text-gray-600" style="border:none;"><span class="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>3 &ndash; 8 months</span></td>
      </tr>
    </tbody>
  </table>
</div>

<p><em>Wait times are estimates based on 2025&ndash;2026 data. Getting on the interest list early is the single most important step you can take.</em></p>

<h2>STAR+PLUS in Houston, Dallas, and San Antonio</h2>

<p>STAR+PLUS is available statewide, but the managed care organizations and service availability vary by region.</p>

<!-- service-map -->

<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 not-prose">
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
    <div class="flex items-center gap-3 mb-3">
      <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 flex-shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
      <p class="text-base font-semibold text-gray-900">Houston</p>
    </div>
    <p class="text-sm text-gray-500 mb-3">Harris, Fort Bend &amp; Montgomery counties</p>
    <div class="flex flex-wrap gap-1.5">
      <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-xs font-medium text-primary-700">UnitedHealthcare</span>
      <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-xs font-medium text-primary-700">Molina</span>
      <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-xs font-medium text-primary-700">Amerigroup</span>
      <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-xs font-medium text-primary-700">Superior</span>
    </div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
    <div class="flex items-center gap-3 mb-3">
      <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 flex-shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
      <p class="text-base font-semibold text-gray-900">Dallas&ndash;Fort Worth</p>
    </div>
    <p class="text-sm text-gray-500 mb-3">Dallas, Collin, Denton &amp; Tarrant counties</p>
    <div class="flex flex-wrap gap-1.5">
      <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-xs font-medium text-primary-700">UnitedHealthcare</span>
      <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-xs font-medium text-primary-700">Superior</span>
      <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-xs font-medium text-primary-700">Molina</span>
    </div>
  </div>
  <div class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
    <div class="flex items-center gap-3 mb-3">
      <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 flex-shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
      <p class="text-base font-semibold text-gray-900">San Antonio</p>
    </div>
    <p class="text-sm text-gray-500 mb-3">Bexar County</p>
    <div class="flex flex-wrap gap-1.5">
      <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-xs font-medium text-primary-700">Superior</span>
      <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-xs font-medium text-primary-700">UnitedHealthcare</span>
      <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-xs font-medium text-primary-700">Community First</span>
    </div>
  </div>
</div>

<h2>Hire a Family Member as Your Caregiver</h2>

<p>Through STAR+PLUS, you can hire someone you already trust to be your paid caregiver &mdash; including a family member or close friend. You&rsquo;re in charge of who you hire and how they work. No agency required.</p>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 not-prose">
  <div class="rounded-xl bg-primary-50 border border-primary-200 p-5 shadow-sm">
    <p class="text-base font-semibold text-primary-800 mb-3">Who can be hired</p>
    <ul class="space-y-2.5 text-sm text-primary-900" style="list-style:none;padding:0;margin:0;">
      <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600 flex-shrink-0"><path d="M20 6L9 17l-5-5"/></svg>Adult children</li>
      <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600 flex-shrink-0"><path d="M20 6L9 17l-5-5"/></svg>Siblings and other relatives</li>
      <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600 flex-shrink-0"><path d="M20 6L9 17l-5-5"/></svg>Close friends and neighbors</li>
      <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600 flex-shrink-0"><path d="M20 6L9 17l-5-5"/></svg>Anyone 18+ who passes a background check</li>
    </ul>
  </div>
  <div class="rounded-xl bg-red-50 border border-red-200 p-5 shadow-sm">
    <p class="text-base font-semibold text-red-700 mb-3">Who cannot</p>
    <ul class="space-y-2.5 text-sm text-red-800" style="list-style:none;padding:0;margin:0;">
      <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-500 flex-shrink-0"><path d="M18 6L6 18M6 6l12 12"/></svg>Spouses (in most cases)</li>
      <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-500 flex-shrink-0"><path d="M18 6L6 18M6 6l12 12"/></svg>Legal guardians (in most cases)</li>
      <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-500 flex-shrink-0"><path d="M18 6L6 18M6 6l12 12"/></svg>The person receiving services</li>
    </ul>
  </div>
</div>

<p>Pay ranges from <strong>$10 to $17 per hour</strong>, depending on your location and insurance plan. For a detailed breakdown, see our guide on <a href="/texas/how-to-get-paid-as-a-caregiver-in-texas" class="text-primary-600 underline">how to get paid as a caregiver in Texas</a>.</p>

<h2>Documents You Will Need</h2>

<ul style="list-style:none;padding-left:0;" class="space-y-3">
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Government-issued photo ID</li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Social Security card</li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Proof of income (Social Security statement, pay stubs, pension)</li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Bank statements (last 3 months)</li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Proof of Texas residency (utility bill, lease)</li>
  <li class="flex items-start gap-3"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>Medical records or doctor&rsquo;s statement of need</li>
</ul>

<p><strong>Want a personalized checklist?</strong> Use the <a href="/texas/benefits/star-plus/checklist" class="text-primary-600 underline">Olera Document Checklist</a> to get a downloadable list tailored to STAR+PLUS.</p>

<h2>Related Texas Benefit Programs</h2>

<p>STAR+PLUS is just one of several programs available to Texas families. Depending on your situation, you may also qualify for:</p>

<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 not-prose">
  <a href="/texas/benefits/medicaid" class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-primary-300 hover:shadow-md transition-all no-underline block">
    <p class="text-sm font-semibold text-gray-900 mb-1">Texas Medicaid for Elderly &amp; Disabled</p>
    <p class="text-xs text-gray-500">Full Medicaid coverage for seniors and adults with disabilities who meet income and asset limits.</p>
  </a>
  <a href="/texas/benefits/medicare-savings" class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-primary-300 hover:shadow-md transition-all no-underline block">
    <p class="text-sm font-semibold text-gray-900 mb-1">Medicare Savings Programs</p>
    <p class="text-xs text-gray-500">Help paying Medicare premiums, deductibles, and copays for low-income seniors.</p>
  </a>
  <a href="/texas/benefits/respite-care" class="rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-primary-300 hover:shadow-md transition-all no-underline block">
    <p class="text-sm font-semibold text-gray-900 mb-1">Respite Care Services</p>
    <p class="text-xs text-gray-500">Temporary relief for family caregivers so you can rest while your loved one is cared for.</p>
  </a>
</div>

<!-- faq-accordion -->

<h2>Find Out What Your Family Qualifies For</h2>

<p>You do not have to figure this out alone. The <strong>Olera Benefits Finder</strong> shows you every program your loved one may qualify for in about 2 minutes. Free, no signup required.</p>

<div class="my-6 not-prose"><a href="/benefits/finder" style="color:#ffffff;" class="inline-flex items-center justify-center px-8 py-3.5 bg-primary-600 text-base font-semibold rounded-full hover:bg-primary-700 shadow-md hover:shadow-lg transition-all no-underline">Check Your Benefits &rarr;</a></div>

<hr />

<p class="text-sm text-gray-500"><em>Eligibility requirements are updated annually. Verify current program availability at <a href="https://www.hhs.texas.gov" target="_blank" rel="noopener noreferrer">hhs.texas.gov</a> or call <strong>211</strong>.</em></p>
`;

async function main() {
  // Check if article already exists
  const { data: existing } = await db
    .from("content_articles")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing) {
    // Update existing article
    const { error } = await db
      .from("content_articles")
      .update({
        title: "STAR+PLUS Waiver Texas 2026 — Complete Guide to Eligibility & How to Apply",
        meta_title: "STAR+PLUS Waiver Texas 2026 — Complete Guide to Eligibility & How to Apply",
        meta_description:
          "STAR+PLUS Texas 2026 guide: income limits, covered services, how to apply, waitlist times, and where to find help in Houston, Dallas, and San Antonio.",
        canonical_url: `https://olera.care/texas/${SLUG}`,
        content_html: ARTICLE_HTML.trim(),
        excerpt:
          "STAR+PLUS is Texas Medicaid\u2019s program that helps seniors and adults with disabilities stay home instead of moving to a nursing facility. It covers everything from personal care to home modifications.",
        subtitle:
          "Everything you need to know about eligibility, covered services, how to apply, and waitlist times across Texas.",
        reading_time: "10 min read",
        care_types: ["home-health"],
        tags: ["texas", "medicaid", "star-plus", "waiver", "hcbs", "eligibility", "cover-alt:Caregiver comforting elderly woman wrapped in blanket on couch in Texas home"],
        focus_keyword: "star plus waiver texas",
        structured_data_type: "Article",
        author_name: "Olera Team",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("Failed to update article:", error.message);
      process.exit(1);
    }
    console.log(`Updated article (id: ${existing.id})`);
    console.log(`  URL: /texas/${SLUG}`);
    return;
  }

  // Insert new article
  const { data, error } = await db
    .from("content_articles")
    .insert({
      slug: SLUG,
      title: "STAR+PLUS Waiver Texas 2026 — Complete Guide to Eligibility & How to Apply",
      status: "published",
      published_at: new Date().toISOString(),
      section: "caregiver-support",
      category: "guide",
      meta_title: "STAR+PLUS Waiver Texas 2026 — Complete Guide to Eligibility & How to Apply",
      meta_description:
        "STAR+PLUS Texas 2026 guide: income limits, covered services, how to apply, waitlist times, and where to find help in Houston, Dallas, and San Antonio.",
      canonical_url: `https://olera.care/texas/${SLUG}`,
      content_html: ARTICLE_HTML.trim(),
      excerpt:
        "STAR+PLUS is Texas Medicaid\u2019s program that helps seniors and adults with disabilities stay home instead of moving to a nursing facility. It covers everything from personal care to home modifications.",
      subtitle:
        "Everything you need to know about eligibility, covered services, how to apply, and waitlist times across Texas.",
      reading_time: "10 min read",
      care_types: ["home-health"],
      tags: ["texas", "medicaid", "star-plus", "waiver", "hcbs", "eligibility", "cover-alt:Caregiver comforting elderly woman wrapped in blanket on couch in Texas home"],
      focus_keyword: "star plus waiver texas",
      structured_data_type: "Article",
      author_name: "Olera Team",
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("Failed to insert article:", error.message);
    process.exit(1);
  }

  console.log(`Created and published article:`);
  console.log(`  ID:   ${data.id}`);
  console.log(`  Slug: ${data.slug}`);
  console.log(`  URL:  /texas/${data.slug}`);
}

main();
