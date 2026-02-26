# Olera Web — Claude Code Instructions

## Git Workflow

This project uses a staging-based workflow:

```
feature branch → PR to staging → QA → PR to main → production
```

### Branch rules

- **Always branch from `staging`**, not `main`
- **PRs target `staging`** by default, not `main`
- Only target `main` for hotfixes or production promotions
- When creating worktrees, use `staging` as the base:
  ```bash
  git worktree add ../olera-web-feature -b feature-name origin/staging
  ```

### Deployments

| Branch | URL | Purpose |
|--------|-----|---------|
| `main` | olera2-web.vercel.app | Production |
| `staging` | staging-olera2-web.vercel.app | QA / Demo |

### Merge permissions

- **Only `tfalohun` (TJ) can merge PRs** to `main` and `staging`
- Enforced via GitHub rulesets with `merge-admins` team as the only bypass actor
- Everyone else can create branches, push, and open PRs — but cannot merge
- The `/pr-merge` command authenticates as TJ, so it works as expected

### Commit conventions

- Imperative mood: "Add X" not "Added X"
- First line under 50 chars
- Body explains WHAT and WHY, not HOW

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS with custom design system (see tailwind.config.ts)
- **Database**: Supabase (shared iOS project, read-only + auth)
- **Auth**: Supabase Auth (Google OAuth + email OTP)
- **Payments**: Stripe (configured, not fully live)
- **Hosting**: Vercel

## Supabase Projects

| Environment | Project ID | Dashboard |
|-------------|-----------|-----------|
| Production | `ocaabzfiilkjcgqwhbwr` | Supabase → Olera (main / PRODUCTION) |
| Staging | TODO | Supabase → Olera Staging |

**Credentials:** Stored in Claude Code auto-memory at `memory/supabase-credentials.md`. Each worktree needs its own `.env.local` — copy `.env.example` and fill in values from that file. Never commit `.env.local`.

## Key Files

- `lib/supabase/client.ts` — Browser Supabase client
- `lib/supabase/server.ts` — Server Supabase client
- `components/auth/UnifiedAuthModal.tsx` — Main auth modal
- `middleware.ts` — Auth protection for /portal and /admin
- `SCRATCHPAD.md` — Living context doc (read this for session history)
- `CONTRIBUTING.md` — Team workflow and branch strategy
