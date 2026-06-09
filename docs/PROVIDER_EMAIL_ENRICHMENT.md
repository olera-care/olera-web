# Provider Email Enrichment System - Integration Guide

## Overview

The MedJobs system has an **AI-powered provider data enrichment system** that intelligently finds provider contact information using web scraping and Perplexity AI. This system can be integrated into the connections page to help admins find accurate provider emails when they bounce or are missing.

---

## How It Works

### Technology Stack
1. **Web Scraping** (primary method, free)
   - Scrapes provider website (homepage, /contact, /about pages)
   - Extracts emails from `mailto:` links and page content
   - Ranks emails intelligently (prefers role mailboxes like `info@`, `contact@`, `admin@`)

2. **Perplexity AI** (fallback, ~$0.008 per call)
   - Uses Perplexity Sonar API when scraping fails
   - Queries: "What is the public contact email for [Provider Name] in [City, State]?"
   - Returns structured JSON response

3. **Google Places API** (optional website resolution)
   - Looks up website from `place_id` if provider doesn't have direct website
   - Cost: ~$0.017 per call

### What It Can Find
- ✅ **Email addresses** (primary use case for connections)
- ✅ **Contact form URLs**
- ✅ **Phone numbers**
- ✅ **Fax numbers**
- ✅ **Physical addresses** (street, city, state, zip)

---

## Current Implementation (MedJobs)

### API Endpoint
**Location:** `/app/api/admin/medjobs/enrich-contact/route.ts`

**Request:**
```typescript
POST /api/admin/medjobs/enrich-contact

Body: {
  outreachId: string,
  mode: "email" | "contact_form" | "phone" | "fax" | "address" | "both" | "all"
}
```

**Response (mode="email"):**
```json
{
  "value": "contact@provider.com",
  "source": "scrape" | "perplexity" | null
}
```

**Response (mode="all"):**
```json
{
  "email": { "value": "contact@provider.com", "source": "scrape" },
  "contactForm": { "value": "https://provider.com/contact", "source": "scrape" },
  "phone": { "value": "(555) 123-4567", "source": "perplexity" },
  "fax": { "value": null, "source": null },
  "address": {
    "street": "123 Main St",
    "city": "Houston",
    "state": "TX",
    "zip": "77001",
    "source": "perplexity"
  }
}
```

### Core Library
**Location:** `/lib/medjobs/outreach-enrichment.ts`

**Key Functions:**
```typescript
// Find email address
export async function findEmail(
  ctx: ProviderContext,
  cost?: CostTracker
): Promise<EmailResult>

// Provider context (minimal info needed)
export interface ProviderContext {
  name?: string | null;
  website?: string | null;
  place_id?: string | null;  // Google Places ID
  city?: string | null;
  state?: string | null;
}
```

---

## Integration Plan for Connections Page

### Option 1: Simple "Find Email" Button (Recommended for MVP)

Add a button in the edit email form that calls the enrichment API:

**UI Location:** `components/admin/ConnectionRow.tsx` (provider email section)

**Implementation:**
```tsx
// Add state
const [findingEmail, setFindingEmail] = useState(false);
const [foundEmails, setFoundEmails] = useState<string[]>([]);

// Add handler
async function handleFindEmail() {
  if (!c.provider.id) return;

  setFindingEmail(true);
  setFoundEmails([]);

  try {
    const res = await fetch('/api/admin/connections/find-provider-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: c.provider.id }),
    });

    const data = await res.json();

    if (res.ok && data.email) {
      setFoundEmails(data.candidates || [data.email]);
      setEditEmailInput(data.email); // Pre-fill with best match
    } else {
      setEditEmailError('No email found');
    }
  } catch {
    setEditEmailError('Network error');
  } finally {
    setFindingEmail(false);
  }
}

// Add button in UI
<button
  onClick={handleFindEmail}
  disabled={findingEmail}
  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
>
  {findingEmail ? 'Searching...' : '✦ Find Email'}
</button>
```

### Option 2: Auto-Suggest on Bounced Emails (Smart)

Automatically run enrichment when an email bounces:

**Trigger:** When bounced filter is active, show suggested emails

**Backend:** Add to bounced detection logic in `app/api/admin/connections/route.ts`

**UI:** Show suggestion badge with "Try: contact@provider.com (from website)"

---

## New API Endpoint Needed

**Location:** `/app/api/admin/connections/find-provider-email/route.ts`

**Why a new endpoint?**
- Connections use `business_profiles` table (different structure than `student_outreach`)
- Need to fetch provider data from `business_profiles` + `olera-providers`
- Simpler interface (just providerId, not outreachId + mode)

**Implementation:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { findEmail, type ProviderContext } from "@/lib/medjobs/outreach-enrichment";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { providerId } = await request.json();
    if (!providerId) {
      return NextResponse.json({ error: "providerId required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch provider from business_profiles
    const { data: provider, error } = await db
      .from("business_profiles")
      .select("id, display_name, website, city, state, source_provider_id")
      .eq("id", providerId)
      .maybeSingle();

    if (error || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Build context
    const ctx: ProviderContext = {
      name: provider.display_name,
      website: provider.website,
      city: provider.city,
      state: provider.state,
      place_id: null,
    };

    // Fall back to olera-providers for website/place_id if needed
    if ((!ctx.website || !ctx.place_id) && provider.source_provider_id) {
      const { data: iosProvider } = await db
        .from("olera-providers")
        .select("website, place_id, city, state")
        .eq("provider_id", provider.source_provider_id)
        .maybeSingle();

      if (iosProvider) {
        ctx.website = ctx.website || iosProvider.website;
        ctx.place_id = iosProvider.place_id;
        ctx.city = ctx.city || iosProvider.city;
        ctx.state = ctx.state || iosProvider.state;
      }
    }

    // Run email finder
    const result = await findEmail(ctx);

    return NextResponse.json({
      email: result.email,
      source: result.source,
      candidates: result.candidates, // All found emails, ranked
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
```

---

## Cost Estimation

**Scenario: Admin needs to find 100 bounced provider emails**

- 70 providers have websites that scrape successfully: **$0** (free scraping)
- 30 providers need Perplexity AI fallback: **$0.24** (30 × $0.008)
- 10 providers need Google Places lookup for website: **$0.17** (10 × $0.017)

**Total cost:** ~$0.41 for 100 lookups

**Compare to:** Manually calling 100 providers = ~10 hours of admin time

---

## Environment Variables Required

Add to `.env.local`:

```bash
# Perplexity AI (for fallback email lookup)
PERPLEXITY_API_KEY=pplx-xxx...

# Google Places API (for website resolution, optional)
GOOGLE_PLACES_API_KEY=AIza...
# OR use existing:
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

**Getting keys:**
- Perplexity: https://www.perplexity.ai/settings/api
- Google Places: https://console.cloud.google.com/apis/credentials

---

## Testing Plan

1. **Test with existing provider** (has website):
   - Should scrape email successfully
   - Source should be "scrape"
   - Cost: $0

2. **Test with provider without website** (has place_id):
   - Should use Google Places to find website
   - Then scrape email
   - Cost: ~$0.017

3. **Test with difficult provider** (website has no email):
   - Should fall back to Perplexity
   - Should return email or null
   - Cost: ~$0.008

4. **Test with multiple candidates**:
   - Should return ranked list
   - Should prefer role mailboxes (info@, contact@)

---

## UI/UX Recommendations

### When to Show "Find Email"
1. **When editing email** - Always available
2. **When email bounced** - Automatically suggest
3. **When no email exists** - Proactively offer to find

### Success States
- ✅ "Found: contact@provider.com (from website)"
- ✅ "Found 3 options: [dropdown to select]"
- ⚠️  "No email found - try calling provider"

### Loading States
- "🔍 Searching website..."
- "🤖 Asking AI assistant..." (when using Perplexity)

### Error States
- "Website not accessible"
- "No public email found"

---

## Next Steps

1. ✅ **Understand the system** (DONE - this document)
2. ⬜ **Add environment variables** to `.env.local`
3. ⬜ **Create new API endpoint** (`/api/admin/connections/find-provider-email/route.ts`)
4. ⬜ **Add "Find Email" button** to ConnectionRow edit form
5. ⬜ **Test with real providers** (scrape + Perplexity paths)
6. ⬜ **Add auto-suggest** for bounced emails (future enhancement)

---

## Questions to Answer

1. **Should we auto-run on bounce detection?**
   - Pro: Proactive, saves admin clicks
   - Con: Costs money for every bounce, might not always be needed

2. **Should we show all candidates or just best match?**
   - Best match: Simpler UX
   - All candidates: More control, admin can choose

3. **Should we log enrichment attempts?**
   - Good for cost tracking
   - Good for debugging ("we tried, it failed")

4. **Should we cache results?**
   - Avoid re-enriching same provider multiple times
   - Could add `enrichment_cache` to metadata

---

## Files to Reference

- **Core library:** `/lib/medjobs/outreach-enrichment.ts`
- **Existing API:** `/app/api/admin/medjobs/enrich-contact/route.ts`
- **Target UI:** `/components/admin/ConnectionRow.tsx`
- **Target API:** `/app/api/admin/connections/find-provider-email/route.ts` (NEW)
