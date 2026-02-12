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

## Key Files

- `lib/supabase/client.ts` — Browser Supabase client
- `lib/supabase/server.ts` — Server Supabase client
- `components/auth/UnifiedAuthModal.tsx` — Main auth modal
- `middleware.ts` — Auth protection for /portal and /admin
- `SCRATCHPAD.md` — Living context doc (read this for session history)
- `CONTRIBUTING.md` — Team workflow and branch strategy
