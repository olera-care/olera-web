# Compact Scratchpad

Archive old session logs to keep SCRATCHPAD.md focused and fast to read.

## When to Run

- SCRATCHPAD.md exceeds 500 lines
- Monthly maintenance
- Before starting a major new initiative

## Process

### 1. Analyze SCRATCHPAD.md

- Count total lines
- Identify sessions older than 7 days
- Find any sessions marked as complete

### 2. Preserve Active Content

Keep in SCRATCHPAD.md:
- "Current Focus" section (always keep)
- "In Progress" section (always keep)
- "Blocked / Needs Input" section (always keep)
- "Next Up" section (always keep)
- "Decisions Made" - keep last 10 entries only
- "Notes & Observations" - keep last 10 entries only
- "Session Log" - keep last 3 sessions only

### 3. Create Archive

Move old sessions to `archive/SCRATCHPAD-[YYYY-MM].md`:

```markdown
# Scratchpad Archive - [Month Year]

> Archived sessions from SCRATCHPAD.md

---

[Archived session logs, chronological order]
```

If archive file already exists for this month, append to it.

### 4. Update SCRATCHPAD.md Header

Add note after the intro quote:
```markdown
> Older sessions archived to `archive/SCRATCHPAD-[YYYY-MM].md`
```

### 5. Report

Summarize what was done:
```
Compacted SCRATCHPAD.md:
- Archived [N] sessions from [date range]
- Moved [X] decisions to archive
- File reduced from [old] to [new] lines
- Archive location: archive/SCRATCHPAD-[YYYY-MM].md
```

---

## Archive Structure

```
archive/
  SCRATCHPAD-2026-01.md   # January 2026 sessions
  SCRATCHPAD-2025-12.md   # December 2025 sessions
  ...
```

This keeps the main SCRATCHPAD.md lean while preserving full history for reference.

## Quick Reference

To find old sessions:
- Check `archive/` directory
- Sessions are dated in their headers
- Search for keywords across archives with grep
