# Olera Score — Code Backup (Pre-Removal)

Backed up: 2026-03-20
Reason: Replacing Olera Score with Trust Signals system. Preserving all score-related code for potential revert.

---

## 1. Score Computation (app/provider/[slug]/page.tsx)

```typescript
// Lines 453-462
// Olera Score: prioritize community_score, then fall back to rating (for legacy data)
// For claimed profiles with no reviews, don't show a rating
const oleraScore = meta?.community_score || (rating ? Math.round(rating * 10) / 10 : null);

// --- Boolean flags for real data availability ---
const hasOleraScore = oleraScore != null;

// Lines 497-502
// Score breakdowns — only real values, no hardcoded fallbacks
const scoreBreakdown = [
  meta?.community_score != null ? { label: "Community", value: meta.community_score } : null,
  meta?.value_score != null ? { label: "Value", value: meta.value_score } : null,
  meta?.info_score != null ? { label: "Transparency", value: meta.info_score } : null,
].filter((item): item is { label: string; value: number } => item !== null);
const hasScoreBreakdown = scoreBreakdown.length > 0;
```

## 2. JSON-LD aggregateRating (app/provider/[slug]/page.tsx)

```typescript
// Lines 560-568
...(oleraScore != null && {
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: oleraScore,
    bestRating: 5,
    worstRating: 0,
    ...(reviewCount != null && { reviewCount }),
  },
}),
```

## 3. Prop passes (app/provider/[slug]/page.tsx)

```typescript
// Line 631
oleraScore={oleraScore}  // → SectionNav

// Line 1042
oleraScore={oleraScore}  // → ConnectionCardWithRedirect

// Line 1079
oleraScore={oleraScore}  // → MobileStickyBottomCTA
```

## 4. SectionNav sticky header (components/providers/SectionNav.tsx)

```typescript
// Props interface (line 16)
oleraScore?: number | null;

// Destructuring (line 28)
oleraScore,

// Render (lines 160-182)
{oleraScore && (
  <div className="flex items-center gap-1.5">
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-50 text-[13px] font-bold text-primary-700">
      {oleraScore.toFixed(1)}
    </span>
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 ${
            star <= Math.round(oleraScore)
              ? "text-primary-500"
              : "text-gray-200"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  </div>
)}
```

## 5. MobileStickyBottomCTA (components/providers/MobileStickyBottomCTA.tsx)

```typescript
// Interface (line 131)
oleraScore: number | null;

// Destructuring (line 147)
oleraScore,

// Render (lines 433-455)
{oleraScore != null && oleraScore > 0 && (
  <div className="flex items-center gap-2 pt-2 pb-3">
    <span className="text-xl font-bold text-gray-900">
      {oleraScore.toFixed(1)}
    </span>
    <div className="flex gap-px">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill={i < Math.round(oleraScore) ? "#06b6d4" : "#d1d5db"}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <span className="text-xs text-primary-600 font-medium underline decoration-primary-600/25 underline-offset-2">
      {reviewCount ?? 0} review{(reviewCount ?? 0) !== 1 ? "s" : ""}
    </span>
  </div>
)}
```

## 6. ConnectionCard CardTopSection (components/providers/connection-card/CardTopSection.tsx)

```typescript
// Full component score-related code
interface CardTopSectionProps {
  priceRange: string | null;
  oleraScore: number | null;
  reviewCount: number | undefined;
  responseTime: string | null;
  hideResponseTime?: boolean;
}

// StarIcon component
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20"
      fill={filled ? "#9ca3af" : "#e5e7eb"}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

// Score display (lines 80-100)
{hasScore && (
  <button onClick={() => scrollToSection("reviews")}
    className="text-right cursor-pointer hover:opacity-80 transition-opacity">
    <div className="flex items-center gap-1">
      <div className="flex gap-px items-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} filled={i < Math.round(oleraScore)} />
        ))}
      </div>
      <span className="text-[13px] text-gray-500 font-medium">
        {oleraScore.toFixed(1)}
      </span>
      <span className="text-[12px] text-gray-400">
        ({reviewCount ?? 0})
      </span>
    </div>
  </button>
)}
```

## 7. ConnectionCard types (components/providers/connection-card/types.ts)

```typescript
// Line 48
oleraScore: number | null;
```

## 8. Data mapping — useProviderDashboardData (hooks/useProviderDashboardData.ts)

```typescript
// Line 52 (Supabase select)
"community_Score, value_score, information_availability_score"

// Lines 74-85 (metadata merge)
community_score: currentBaseMeta.community_score ?? (data.community_Score as number | null) ?? undefined,
value_score: currentBaseMeta.value_score ?? (data.value_score as number | null) ?? undefined,
info_score: currentBaseMeta.info_score ?? (data.information_availability_score as number | null) ?? undefined,
```

## 9. Data mapping — SmartDashboardShell (components/provider-onboarding/SmartDashboardShell.tsx)

```typescript
// Lines 166-168
community_score: provider.community_Score || undefined,
value_score: provider.value_score || undefined,
info_score: provider.information_availability_score || undefined,
```

## 10. Data mapping — mock-providers (lib/mock-providers.ts)

```typescript
// Interface (lines 690-692)
community_score?: number;
value_score?: number;
info_score?: number;

// Mapping (lines 709-711)
community_score: provider.community_Score || undefined,
value_score: provider.value_score || undefined,
info_score: provider.information_availability_score || undefined,
```

## 11. Admin directory editing (app/admin/directory/[providerId]/page.tsx)

```typescript
// Lines 502-508 — "Scores" section
<FieldInput label="Community Score" value={formData.community_Score as string}
  onChange={(v) => updateField("community_Score", v === "" ? null : Number(v))} type="number" step="0.1" />
<FieldInput label="Value Score" value={formData.value_score as string}
  onChange={(v) => updateField("value_score", v === "" ? null : Number(v))} type="number" step="0.1" />
<FieldInput label="Info Availability" value={formData.information_availability_score as string}
  onChange={(v) => updateField("information_availability_score", v === "" ? null : Number(v))} type="number" step="0.1" />
```

## 12. Admin API route (app/api/admin/directory/[providerId]/route.ts)

```typescript
// Lines 26-28 — updatable fields
"community_Score",
"value_score",
"information_availability_score",
```

## 13. Score generation script (external, on T7 Shield)

Location: `/Volumes/T7 Shield/Olera Data Analysis Scripts/Rating:Scores/olera_score_evaluator.py`
- Uses Perplexity API to rate providers on sentiment, value, information
- Batch processing with score boosting logic
- Targets average ~4.3

---

## Type Definitions (KEPT — describe iOS schema, not removed)

```typescript
// lib/types.ts (lines 238-240)
community_score?: number;
value_score?: number;
info_score?: number;

// lib/types/provider.ts (lines 32-34)
community_Score: number | null;
value_score: number | null;
information_availability_score: number | null;

// lib/profile-completeness.ts (lines 44-46)
community_score?: number;
value_score?: number;
info_score?: number;
```

---

## To Revert

1. Restore all code blocks above to their respective files at the documented line numbers
2. Re-add `oleraScore` prop passes in page.tsx
3. Re-add admin score editing fields
4. Re-add data mapping in hooks
5. The database columns are unchanged — no migration needed for revert
