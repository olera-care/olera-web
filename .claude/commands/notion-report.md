# NotionReport — Branch Handoff to Notion

Capture the current state of **this branch** and publish a resume-ready handoff page to Notion, so future-you (or a cold Claude session) can pick the work back up after compacting, context loss, or just time away.

This is the **"I'm pausing this branch" report** — distinct from `/pr-merge`'s PR Merge Reports (those are post-merge records). This one is mid-project, branch-not-yet-merged, and optimized for *resuming*. Its single most important output is a copy-paste `cd` line into this worktree, plus a paste-after-compacting prompt.

## Usage

`/notion-report` — no args needed. Operates on the current branch / worktree.

Optional: `/notion-report <one-line note>` — a steering hint for the summary (e.g. `/notion-report focus on the Stripe migration, ignore the unrelated copy edits`).

## Autonomy

Run **end-to-end without pausing for approval** (TJ's standing preference — see memory `feedback_pipeline_autonomous`). Gather context, write the report, publish to Notion, then print the `cd` line. Do not draft-and-wait. The one exception: if you genuinely cannot determine the branch or worktree, stop and say so rather than guessing.

---

## Phase 1: Gather Context

Run these from the current worktree. Batch the independent ones in parallel.

1. **Identity + worktree (the find-branch core):**
   - Current branch: `git rev-parse --abbrev-ref HEAD`
   - Current worktree path: `git rev-parse --show-toplevel` (this IS the resume `cd` line — no lookup needed, you're already in it)
   - Confirm the codename↔branch mapping for the report: `git worktree list | grep -i "$(git rev-parse --abbrev-ref HEAD)"`
   - Display the path with `~` instead of `/Users/tfalohun/...` (shorter, still pastes correctly).

2. **Work state:**
   - `git status --short` — uncommitted/staged changes (a pause-point often has these)
   - `git log origin/staging..HEAD --oneline` — commits on this branch not yet in staging
   - `git diff --stat origin/staging...HEAD` — overall shape of the change
   - Branch age vs staging: `git rev-list --count HEAD..origin/staging` (how far behind — relevant for the "next phase" advice)

3. **PR, if any:** `gh pr list --head "$(git rev-parse --abbrev-ref HEAD)" --json number,title,url,state` — include the link/number in the report if a PR exists.

4. **Session narrative:** Read `SCRATCHPAD.md` (especially "Current Focus", "In Progress", "Next Up", "Blocked / Needs Input") for the WHY behind the work. Also factor in what actually happened in *this* conversation.

5. **Relevant memory:** Note any memory files that bear on this work (the recalled `<system-reminder>` memories, or the index at `~/.claude/projects/-Users-tfalohun-Desktop-olera-web/memory/MEMORY.md`). List them as pointers — don't paste their contents.

6. **Plans:** If a plan file under `plans/` or `.claude/plans/` drives this work, reference its path.

---

## Phase 2: Write the Report

Model the structure on TJ's proven handoff format (the "Market Diagnostic — State, Worktree & Phase-2 Resume" page is the gold standard). Use Notion-flavored Markdown — callout for the headline status, code blocks for commands, headings for sections.

Required sections, in this order:

### 1. Where it stands
A callout block leading with the headline status (✅ shipped / 🚧 in progress / ⏸ paused / 🔬 spike). Then: what's **built/done**, what's **not done yet**, and any **gating** (feature flags, env limits, test-only scope). Be honest about state — "done" means verified, not "I wrote it."

### 2. Worktree (find-branch)
- The bare resume command on its own line so it's trivially copyable:
  ```
  cd ~/.claude-worktrees/olera-web/<codename>
  ```
- One line: `branch: <branch>` — call it out especially when the branch differs from the codename (that's the whole point of find-branch).
- If the next step is a new phase off fresh staging, also give the fresh-worktree command:
  ```
  git worktree add ../olera-web-<next> -b <next-branch> origin/staging
  ```

### 3. Resume command (paste after compacting)
A single fenced code block containing a prompt that re-hydrates a cold Claude session: what the project is, what's done, what's next, which files/memory/plan to read, and the explicit instruction (e.g. "plan with me before writing code"). This is the highest-leverage block — write it as if Claude has zero prior context.

### 4. What's next (plan first)
The next concrete steps. If there's a plan file, point to it and summarize the fork/decision. Default to "plan before writing code" framing for non-trivial next steps.

### 5. ⚠️ Blind spots & open risks  — REQUIRED, do not skip
The part that's easiest to omit and most valuable. Actively surface what's **unfinished, unverified, risky, or assumed** on this branch — not a rosy recap. Pull from:
- Uncommitted/untested changes from Phase 1
- `TODO`/`FIXME`/`HACK` markers in the diff
- Paths you wrote but never ran or tested
- Assumptions baked into the code that haven't been validated
- Migrations not yet applied, env vars not yet set, third-party state not yet configured
- Anything in SCRATCHPAD's "Blocked / Needs Input"
- Known regressions risk on shared files (Footer/Navbar/auth/SEO — see `/pr-merge`'s critical watchlist)

If you genuinely find none, say so explicitly ("No open risks identified — change is small and verified") rather than dropping the section.

### 6. Key pointers
Relevant memory files (by name), related PRs, related people, plan paths. Bulleted, terse.

Keep the whole thing terse and concrete — TJ's writing style (memory `feedback_tj_writing_style`): no essays, no filler.

---

## Phase 3: Publish to Notion

Create the page in the dedicated handoffs database (autonomously, no confirmation):

- **Database:** Product Development › **Branch Handoff Reports**
- **Parent (data source ID):** `e3014bc0-3a03-40ed-9c09-a66994fb9e78`
- **Tool:** `mcp__claude_ai_Notion__notion-create-pages` with `parent: { data_source_id: "e3014bc0-3a03-40ed-9c09-a66994fb9e78" }`

Set these properties (names from the data source schema):

| Property | Value |
|----------|-------|
| `Title` | `<short feature name> — Handoff (<YYYY-MM-DD>)` |
| `Branch` | the git branch name |
| `Worktree` | the `~/.claude-worktrees/...` path |
| `Status` | one of: `In progress`, `Paused`, `Ready for PR`, `Merged`, `Abandoned` |
| `PR` | PR number/URL if one exists, else leave empty |
| `Date` | today (use the expanded `date:Date:start` property) |

Give the page a `🧭` icon to match the existing handoff pages. Put the report body (Phase 2) in `content` — do **not** repeat the title at the top of the content.

> Notion mechanics: if the primary `notion-create-pages` call is blocked by Cloudflare, fall back to the raw `mcp__notion__API-*` tools per memory `Notion MCP Tools` (create page first, then append children). Always `await` the create call before reporting success (memory `feedback_serverless_fire_and_forget`).

---

## Phase 4: Report Back to TJ

After the page is created, print to the terminal (not just Notion):

1. The Notion page URL.
2. The bare `cd` line on its own line, so TJ can paste it immediately:
   ```
   cd ~/.claude-worktrees/olera-web/<codename>
   ```
3. A one-line summary of the status + the single most important blind spot.

Keep it tight. The point is that TJ closes the laptop knowing the handoff is saved and exactly how to get back in.

---

## Notes

- **Don't `cd` for him or run anything destructive** — this command reads state and writes a Notion page; that's it. No commits, no pushes, no merges.
- The worktree codename ≠ branch name — always surface the real branch (the whole reason `/find-branch` exists).
- This pairs naturally with `/save` (which logs to SCRATCHPAD). Run `/save` first if the session log is stale, then `/notion-report` for the cross-session, resume-focused artifact.
