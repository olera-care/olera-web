# Erase Test Data from Supabase

Wipe test accounts or provider profiles from Supabase using the erase script.

## Arguments

`$ARGUMENTS` — an email address or provider name to erase.

## Instructions

Run the erase script from the main repo directory (worktrees don't have node_modules):

```bash
cd ~/Desktop/olera-web
```

**Determine mode from the argument:**
- If the argument looks like an email (contains `@`), use `--email`
- Otherwise, use `--provider`

**Always preview first** (no `--confirm` flag), then show the user what will be deleted. Ask for confirmation before running with `--confirm`.

### Email mode (hard-delete — frees email for reuse)
```bash
node scripts/erase.mjs --email <email>           # preview
node scripts/erase.mjs --email <email> --confirm  # execute
```

### Provider mode (archives — sets claim_state to 'archived')
```bash
node scripts/erase.mjs --provider "<name>"           # preview
node scripts/erase.mjs --provider "<name>" --confirm  # execute
```

If the provider search returns multiple matches, show all matches and ask the user to pick one using `--pick <number>`.

### Safety
- The script has built-in protection for `tfalohun@gmail.com` and `logan@olera.care` — these can never be erased.
- Always show the preview output before confirming deletion.
- Email mode is destructive (hard-delete across 20+ tables). Make sure the user sees and approves the preview.
