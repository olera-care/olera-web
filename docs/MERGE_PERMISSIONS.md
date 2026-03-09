# Merge Permissions

## Who Can Merge

| User | Role | Can Create PRs | Can Merge | Notes |
|------|------|---------------|-----------|-------|
| tfalohun (TJ) | admin | Yes | Yes (main + staging) | Owner, sole merger |
| jakub300 | admin | Yes | No | XFive tech lead, admin for transfer tasks |
| logan447 | write | Yes | No | COO, 2nd in charge |
| chantel-stack | maintain | Yes | No | |
| Efuanyamekye | write | Yes | No | |

## How It Works

Merge access is controlled by **repository rulesets**, not classic branch protection.

### Rulesets

| Branch | Ruleset | Enforcement |
|--------|---------|-------------|
| `main` | `main-branch-protection` | active |
| `staging` | `staging-branch-protection` | active |

Both rulesets enforce:
- **Pull request required** — No direct pushes to protected branches
- **No deletion** — Protected branches cannot be deleted
- **No force push** — History cannot be rewritten

### The `merge-admins` Team

The `merge-admins` org team is the **only bypass actor** in both rulesets. Only members of this team can merge PRs to `main` and `staging`. Currently, TJ is the sole member.

To add someone to `merge-admins`:
```bash
gh api orgs/olera-care/teams/merge-admins/memberships/USERNAME -X PUT -f role=member
```

To remove someone:
```bash
gh api orgs/olera-care/teams/merge-admins/memberships/USERNAME -X DELETE
```

## Emergency Procedure

If TJ is unavailable and a critical fix must be merged:

1. **Option A:** Another org admin temporarily adds themselves to `merge-admins`:
   ```bash
   gh api orgs/olera-care/teams/merge-admins/memberships/YOUR_USERNAME -X PUT -f role=member
   ```
   Merge the PR, then remove yourself from the team.

2. **Option B:** An org admin temporarily disables the ruleset:
   - Go to https://github.com/olera-care/olera-web/settings/rules
   - Set the relevant ruleset to "Disabled"
   - Merge the PR
   - Re-enable the ruleset immediately

Both options require org admin access. Document any emergency merge in Slack.

## Why This Exists

After the Feb 26 post-mortem, uncontrolled merges were identified as a source of regressions. Centralizing merge authority through TJ creates a quality gate that ensures:
- All changes are reviewed before reaching protected branches
- No accidental or premature merges
- Clear accountability for what ships to staging and production
