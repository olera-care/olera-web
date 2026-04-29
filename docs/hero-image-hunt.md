# Hero Image Hunt — Spec

**Goal:** Find 11 images for the provider dashboard's `DashboardHero` component. The hero swaps images based on which tier of the priority stack is firing (engagement signals like leads/questions vs. completion-tier nudges per profile section). Each image conveys a specific mood for one tier. Right now the dashboard uses a single static image regardless of context — this hunt fixes that.

---

## What to do

1. Find 11 stock photos (one per filename below) on **Pexels**, **Unsplash**, or **iStock/Getty**.
2. Save each image with the **exact filename** listed.
3. Place all files in: **`public/images/for-providers/`** (relative to the repo root).
   - Absolute path on TJ's machine: `/Users/tfalohun/.claude-worktrees/olera-web/keen-feynman/public/images/for-providers/`
4. Confirm each download meets the **image specs** below before saving.
5. Don't skip the priority ordering — the first 3 are the highest-impact and should ship even if the rest take longer.

---

## Image specs (apply to all 11)

| Spec | Value | Why |
|---|---|---|
| Dimensions | **1920×1080 (16:9 landscape)** | Matches existing `dashboard-hero.jpg` |
| Minimum acceptable | 1280×720 | Anything smaller looks soft on retina |
| Subject placement | Right 60–70% of frame | Left ~30% fades into a dark gradient and disappears |
| Eye-line / focal point | ~35% from top of image | Matches `backgroundPosition: "right 35%"` |
| Background tone (left edge) | Warm or neutral | Cool / bright-white edges create a visible seam against the dark gradient |
| File format | JPEG (.jpg) | Smaller file size, sufficient quality for photos |

**Reject any image that:**
- Is below 1280×720
- Has its main subject in the left 30% of the frame
- Has a busy / bright / cool-toned left edge
- Looks AI-generated, overly stylized, or unprofessional
- Doesn't depict senior care / caregivers / community life (off-topic)

---

## Filename + filing convention

**Folder (exact):** `public/images/for-providers/`

**Filenames (exact — case-sensitive, hyphenated, lowercase, .jpg):**

```
dashboard-hero-gallery.jpg
dashboard-hero-leads.jpg
dashboard-hero-questions.jpg
dashboard-hero-about.jpg
dashboard-hero-pricing.jpg
dashboard-hero-services.jpg
dashboard-hero-screening.jpg
dashboard-hero-payment.jpg
dashboard-hero-overview.jpg
dashboard-hero-spike.jpg
dashboard-hero-fallback.jpg
```

Don't rename existing files. Don't create subfolders. One file per filename.

---

## Priority

If you can only find 3 today, do these first:

1. **`dashboard-hero-gallery.jpg`** — fires for new providers prompted to add photos. The most-shown empty-state image.
2. **`dashboard-hero-leads.jpg`** — fires when a lead arrives. The most-shown engagement-state image.
3. **`dashboard-hero-questions.jpg`** — fires when there's an unanswered question. Existing image already serves this OK, so this is the lowest-urgency of the top 3.

---

## The 11 images

### 1. `dashboard-hero-gallery.jpg` — section: gallery (Tier 4 + Tier 5)

**Mood:** Capturing the space / community life. The provider needs to upload photos so families can picture where their loved one would live.

**Search terms:**
- "senior community photo"
- "photographer at care home"
- "residents activity room sunlit"
- "common area assisted living"
- "warm interior senior care"

**What to look for:** A photographer-feel scene, OR a beautifully-lit interior of a senior care community, OR a moment of community life (residents in a sunlit common room). NOT a portrait of one person.

---

### 2. `dashboard-hero-leads.jpg` — Tier 1 (fresh inquiries)

**Mood:** Active inquiry. Someone's reaching out. Energetic but warm — not panicked.

**Search terms:**
- "caregiver answering phone smiling"
- "senior care professional with phone"
- "nurse picking up call warm"
- "smiling administrator phone"

**What to look for:** A caregiver/professional looking up, on the phone, mid-conversation. Hopeful expression. NOT a stock-photo "headset rep" cliché.

---

### 3. `dashboard-hero-questions.jpg` — Tier 2 (unanswered questions)

**Mood:** Engaged, listening, pondering. A real family asking a real thing — provider is taking it seriously.

**Search terms:**
- "senior care professional reading tablet"
- "thoughtful caregiver listening"
- "professional reviewing notes care home"

**What to look for:** Someone reading on a phone/tablet, listening intently, thoughtful expression. Eyes engaged with content, not the camera.

**Note:** The existing `dashboard-hero.jpg` already implies this mood, so this one is the lowest-urgency replacement among the top 3.

---

### 4. `dashboard-hero-about.jpg` — section: about (Tier 4 + Tier 5)

**Mood:** Storytelling, conversation, warmth. The provider needs to write their description.

**Search terms:**
- "caregiver chatting with family senior"
- "two people in conversation care home"
- "provider smiling at camera senior"
- "warm portrait senior caregiver"

**What to look for:** A conversational moment — two people, or a friendly portrait of a caregiver. Warm light, eye contact possible.

---

### 5. `dashboard-hero-pricing.jpg` — section: pricing (Tier 4 + Tier 5)

**Mood:** Calm transparency. "No surprises." Avoid money imagery (clichéd) — go with a reassuring professional portrait or scene instead.

**Search terms:**
- "senior care administrator desk calm"
- "family meeting at care home"
- "professional in office senior care"
- "consultation senior assisted living"

**What to look for:** A professional in a calm setting (office, meeting room), or a family being walked through paperwork. Not stacks of dollar bills, not calculators.

---

### 6. `dashboard-hero-services.jpg` — section: services (Tier 4 + Tier 5)

**Mood:** Care types in action. Hands-on caregiving moments.

**Search terms:**
- "nurse with senior daily activity"
- "caregiver helping senior bathing dressing"
- "physical therapy senior"
- "occupational therapy senior care"

**What to look for:** A care moment — caregiver helping with a daily task (eating, walking, therapy). Should feel competent and gentle.

---

### 7. `dashboard-hero-screening.jpg` — section: screening (Tier 4 + Tier 5)

**Mood:** Trust, professional, clean. The provider needs to detail how they screen their team.

**Search terms:**
- "nurse portrait professional senior care"
- "caregiver headshot scrubs uniform"
- "senior care staff group smiling"
- "professional caregiver portrait"

**What to look for:** A polished portrait of a caregiver in scrubs/uniform, OR a small group of staff looking professional and approachable.

---

### 8. `dashboard-hero-payment.jpg` — section: payment (Tier 4 + Tier 5)

**Mood:** Same calm-transparency energy as pricing — could even be a similar-feeling image. The provider needs to list which insurances/payments they accept.

**Search terms:**
- "reassuring senior care professional"
- "family consulting paperwork care home"
- "administrator senior care office"

**What to look for:** Calm, professional, transparent. If you find a perfect "pricing" image with extra similar vibes, this can be a sibling shot.

---

### 9. `dashboard-hero-overview.jpg` — section: overview (Tier 4 + Tier 5)

**Mood:** Welcoming, "let's get you started." This fires when the provider hasn't even filled in basic profile info — needs encouragement, not pressure.

**Search terms:**
- "warm portrait senior caregiver welcoming"
- "smiling care professional inviting pose"
- "friendly caregiver introduction"

**What to look for:** A welcoming, smiling portrait. Eye contact. Inviting body language.

---

### 10. `dashboard-hero-spike.jpg` — Tier 3 (view spike)

**Mood:** Celebratory but warm. "Your work is being seen." Positive reinforcement, no CTA.

**Search terms:**
- "smiling senior caregiver looking at screen"
- "happy care professional"
- "content senior care worker"
- "satisfied caregiver portrait"

**What to look for:** Genuine warmth. Someone looking at a phone/screen with a positive expression, OR a content portrait. NOT staged "celebration" (no high-fives).

---

### 11. `dashboard-hero-fallback.jpg` — Tier 6 (fully complete + sparse engagement)

**Mood:** Calm, dialed-in, "all set." This is the rare state where the provider has done everything and is just waiting for activity. Minimal energy, hangtime.

**Search terms:**
- "serene caregiver portrait"
- "well-lit senior care professional"
- "established care home exterior warm"
- "peaceful senior care setting"

**What to look for:** A still moment. Could be an exterior shot of a care community at golden hour, or a very calm professional portrait.

---

## After saving

When all 11 (or your priority 3) are in `public/images/for-providers/`:

1. List the filenames you successfully saved
2. Note any filename you couldn't find a fitting image for — those will fall back to the existing `dashboard-hero.jpg`

The wiring (updating `components/provider-dashboard/v2/DashboardHero.tsx` to swap images per tier) will happen in a separate step — you don't need to do that. Just hunt and save.

---

## Quick sanity checklist

Before you save each file, confirm:

- [ ] At least 1920×1080 (or 1280×720 minimum)
- [ ] Subject is in the right 60–70% of the frame
- [ ] Subject's focal point is roughly 35% from the top
- [ ] Left edge tone is warm/neutral (not bright white or cool blue)
- [ ] Filename matches the exact spec above (lowercase, hyphenated, .jpg)
- [ ] Saved to `public/images/for-providers/` (no subfolders)

Done.
