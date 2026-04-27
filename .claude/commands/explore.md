# Explore Before Building

Feature or area to explore: $ARGUMENTS

## Exploration Protocol

Before planning or writing ANY code, deeply understand the existing codebase.

**Critical rule**: Audit the relevant code BEFORE asking clarifying questions. Generic clarifiers are noise — informed clarifiers (the ones you can only ask after reading the code) are signal. The user is busy; don't waste their attention on questions you could have answered yourself.

---

### Step 0: Identify Team Member & Fetch Task

**STOP and ask the user (skip if already specified in $ARGUMENTS, e.g. "as TJ"):**

> **Who is working today?**
> - TJ
> - Logan
> - Esther

After identifying the team member, fetch their tasks using the **Notion MCP tools**:

1. **Use the Notion MCP** to query the **Web App** roadmap database:
   - **IMPORTANT: Use EXACTLY this data_source_id**: `2f75903a-0ffe-8166-9d6f-000b1b51cb11`
   - This is the "Web App Action Items/Roadmap" — NOT the iOS roadmap
   - Use the `mcp__notion__API-query-data-source` tool with this exact ID
   - Filter: `Status` (select) = "To Do" AND `Owner` (select) = team member's name (e.g. "TJ", "Logan", "Esther")
   - DO NOT search for databases — use the ID provided above directly
   - DO NOT use WebFetch — use the Notion MCP tools directly

2. **CRITICAL: Notion's select sort is NOT priority-aware.** Sorting by `Priority` returns alphabetical/option-order, not P1→P5. To find P1s reliably, run a **separate query filtering `Priority = "P1 🔥"`** instead of relying on sort. If the result list says `has_more: true`, page through — don't stop at page 1.

3. **Read the task body, not just the title.** Use `mcp__notion__API-get-block-children` with the task's page id to fetch any description, screenshots, or notes the user wrote. The body almost always contains the real intent and constraints — skipping it is the #1 source of bad clarifiers.

4. **If MCP tools aren't available**, ask the user to share the task details manually.

5. **Present the task**: Show the highest priority "To Do" task and confirm this is what the user wants to explore. If $ARGUMENTS already names a specific task, jump straight to it.

**Priority labels**: P1 🔥 (highest) > P2 > P3 > P4 > P5 > Backlog

---

### Step 1: Thorough Codebase Audit (BEFORE asking questions)

This is the most important step. The goal: come back to the user with a complete picture of how the relevant code currently works, so your clarifiers are surgical instead of generic.

**Spawn an Explore subagent** for this when the surface area is non-trivial (>5 files or >2 features touched). The Explore agent has parallel search/read and protects the main context. Brief it with:

- The exact task title + body
- A list of search keywords (synonyms, abbreviations, domain terms)
- A structured report format you want back (inventory tables, file:line citations, "does X exist? yes/no with evidence")
- An explicit "don't speculate; report only what's in the code"

**What to audit** (adapt to the task):

1. **Feature inventory** — every entry point that touches this area
   - API routes (`app/api/**/route.ts`)
   - Pages/components (`app/**/page.tsx`, `components/**`)
   - Library code (`lib/**`)
   - Cron jobs (`vercel.json` + `app/api/cron/**`)
   - Email templates (`lib/email-templates.tsx`, `lib/email.ts`)
   - Database tables touched (search for `.from('...')` calls)

2. **Data flow** — where state comes from and goes to
   - Supabase clients: `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server)
   - Tables in use, columns referenced, RPC functions called
   - Recent migrations in `supabase/migrations/` if relevant

3. **User-facing surface** — what the user sees today
   - The exact pages/modals/emails involved
   - Auth gating: check `middleware.ts` and `components/auth/UnifiedAuthModal.tsx`
   - Tracking/analytics: PostHog calls, Resend webhook events, Slack notifications

4. **Sequence / scheduled / follow-up logic** — if the user says "I don't think we have X," verify directly. Check `vercel.json` crons, `scripts/`, and any `app/api/cron/**` routes. Report yes/no with evidence.

5. **Recent activity** — `git log` on the relevant files for the last ~3 months. The 5-10 most recent commits often reveal in-flight work or a teammate's recent direction.

6. **Relevant memories** — check `~/.claude/projects/-Users-tfalohun-Desktop-olera-web/memory/MEMORY.md` for project memories that touch this area (e.g., `project_ux_pattern_fire_first.md` for Q&A flows, `feedback_one_click_ux_principles.md` for provider claim flows, etc.). Stale memories are common — verify against current code.

7. **Surprises / gotchas** — anything load-bearing, hacky, or non-obvious. Multi-ID lookups, verification gating, soft-delete patterns, dual provider tables, etc.

**Output format** (have the subagent return this verbatim):

```
## Inventory
[Table — one row per entry point, with file:line]

## Data flow
[Tables / RPCs / Supabase calls touched]

## User-facing surface
[Pages, modals, emails, auth gates]

## Does <X> exist?
[Yes/No + evidence — only if the user asked or implied it]

## Recent commits
[5-10 most relevant, with hash + one-line summary]

## Surprises / gotchas
[Anything worth knowing before designing a change]

## Files read most carefully
[Paths]
```

**Do NOT skip this step.** A good audit takes 5-10 minutes and saves hours of bad implementation. If you find yourself about to ask the user a generic question like "is this for care seekers or providers?" — stop and check the code first; it usually answers itself.

---

### Step 2: Ask Informed Clarifying Questions

Now — and only now — ask the user clarifiers. Frame them in light of what you found:

- **Don't ask** "what does the current flow do?" — you just read it. Tell them.
- **Do ask** about ambiguity, scope, success metric, and intentional gaps you found in the code (e.g. "I confirmed there are no follow-up emails today. Is that the gap you want closed, or is this strictly about the existing transactional emails?").

Good clarifier shape:
1. **Confirm scope** — "Based on the code, the task covers A, B, C. Is that the right slice, or are you thinking broader/narrower?"
2. **Surface decisions** — "I see two reasonable paths: X (smaller, lower risk) or Y (more complete, more churn). Which feels right?"
3. **Pin success metric** — "What's the single number you want this to move?"
4. **Flag constraints** — "Anything off-limits? (e.g. 'don't touch the verification gate', 'don't change the email template visuals')"

Wait for answers before continuing.

---

### Step 3: Document Findings

Create an exploration summary:

```
## Exploration Summary: [Feature Name]

### Current State (from audit)
- [What exists today, file:line citations]

### Relevant Data
- Tables: [list]
- API routes: [list]
- Components / templates: [list]

### Reusable Pieces
- [Component / lib function]: [how it could help]

### Risks & Considerations
- [Risk 1]
- [Risk 2]

### Open Questions Resolved (from clarifiers)
- [User confirmed X]
- [User chose path Y over Z]

### Recommended Approach
[1-2 sentences on how to proceed]
```

---

### Step 4: Hand Off

After exploration, ask: "Should I now create a detailed implementation plan with `/plan`?"

---

**Remember**: The goal is understanding, not implementation. Do NOT write code during exploration. And — read the code BEFORE you ask the user anything you could have figured out yourself.
