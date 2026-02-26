# GitHub Repository Setup

One-time setup steps for the repository owner.

---

## 1. Branch Protection (Rulesets)

Branch protection is enforced via **repository rulesets** (not classic branch protection). Two rulesets exist:

- **`main-branch-protection`** — Protects `main`
- **`staging-branch-protection`** — Protects `staging`

### What the rulesets enforce:

- All changes must go through a pull request (no direct pushes)
- No branch deletion
- No force pushes
- **Only the `merge-admins` team can merge PRs** (currently only TJ)

### To view or edit rulesets:

1. Go to https://github.com/olera-care/olera-web/settings/rules
2. Click on a ruleset to view/edit

### How merge permissions work:

The rulesets require PRs but set 0 required approvals. Since only `merge-admins` team members are listed as bypass actors, only they can actually merge. Everyone else can create PRs but will see "merge blocked."

See [Merge Permissions](MERGE_PERMISSIONS.md) for details.

---

## 2. Connect to Vercel

Vercel should auto-deploy from GitHub.

### Steps:

1. Go to https://vercel.com
2. Sign in with GitHub
3. Import the `olera` repository
4. Use default settings and deploy

Now every push to `main` auto-deploys, and every PR gets a preview URL!

---

## 3. Add Team Members

### To the GitHub repo:

1. Go to https://github.com/olera-care/olera-web/settings/access
2. Click "Add people"
3. Enter their GitHub username or email
4. Choose role:
   - **Write** - Can push branches, create PRs (default for most team members)
   - **Maintain** - Write + manage issues/PRs/labels (for senior contributors)
   - **Admin** - Full control (TJ only — do not grant to others)

### To Vercel (if needed):

1. Go to Vercel project settings
2. Team → Invite Team Member

---

## 4. Set Up Labels

Labels help organize issues. Create these labels:

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | #d73a4a (red) | Something isn't working |
| `enhancement` | #a2eeef (teal) | New feature or improvement |
| `task` | #0075ca (blue) | General task |
| `good first issue` | #7057ff (purple) | Good for newcomers |
| `help wanted` | #008672 (green) | Extra attention needed |
| `documentation` | #0075ca (blue) | Documentation updates |
| `blocked` | #b60205 (red) | Waiting on something |
| `in progress` | #fbca04 (yellow) | Being worked on |

Go to: https://github.com/olera-care/olera-web/labels to manage labels.

---

## 5. Create Initial Issues

Help the team get started with some clear tasks:

### Example Issues to Create:

1. **[Task] Set up Supabase database**
   - Create Supabase project
   - Add environment variables
   - Create database schema

2. **[Task] Build browse page with provider cards**
   - Create `/browse` route
   - Display provider cards in a grid
   - Add basic filtering

3. **[Task] Create individual provider page**
   - Create `/provider/[slug]` route
   - Display provider details
   - Add "Request Consultation" button

4. **[Good First Issue] Update homepage copy**
   - Review and improve text content
   - Make sure tone is warm and helpful

---

## 6. Set Up Project Board (Optional)

GitHub Projects helps visualize work.

1. Go to https://github.com/olera-care/olera-web/projects
2. Click "New project"
3. Choose "Board" template
4. Create columns: `Backlog`, `To Do`, `In Progress`, `Review`, `Done`

---

## Environment Variables

When you set up Supabase, you'll need to add environment variables.

### For Local Development:

Create a file called `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Never commit this file!** It's in `.gitignore` for safety.

### For Vercel:

1. Go to Vercel project settings
2. Environment Variables
3. Add the same variables

---

## Quick Links

- **Repository:** https://github.com/olera-care/olera-web
- **Issues:** https://github.com/olera-care/olera-web/issues
- **Pull Requests:** https://github.com/olera-care/olera-web/pulls
- **Settings:** https://github.com/olera-care/olera-web/settings
- **Live Site:** Check Vercel for URL

---

*Once these are set up, you're ready for team collaboration!*
