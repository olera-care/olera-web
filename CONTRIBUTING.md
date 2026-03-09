 # Contributing to Olera

Welcome! This guide will help you contribute to Olera, even if you're new to coding.

---

## Our Philosophy

1. **No question is dumb** - We're all learning
2. **Small changes are great** - Fix a typo? Update a color? That counts!
3. **Ask for help early** - Don't struggle alone for hours
4. **AI is your friend** - Use Claude, Copilot, etc. liberally
5. **Done is better than perfect** - Ship it, then improve

---

## Before You Start

Make sure you've completed the [Quick Start Guide](README.md#for-the-team-quick-start-guide) in the README.

---

## Types of Contributions

### 1. Bug Fixes
Found something broken? Fix it!

### 2. New Features
Adding new functionality (check with team first for big features)

### 3. Styling/Design
Improving how things look

### 4. Documentation
Improving these docs, adding comments to code

### 5. Refactoring
Cleaning up code without changing what it does

---

## Branch Strategy

| Branch       | Purpose        | Deploys to                          |
|--------------|----------------|-------------------------------------|
| `main`       | Production     | [olera.vercel.app](https://olera.vercel.app) |
| `staging`    | QA / Demo      | staging-olera.vercel.app            |
| `feature/*`  | Development    | Vercel preview (auto-generated per PR) |

### How code gets to production

```
feature/xyz ──PR──▶ staging ──PR──▶ main (production)
                      │                  │
                      ▼                  ▼
              staging-olera.vercel.app    olera.vercel.app
```

### Branch protection & merge permissions

- **`main`** and **`staging`** are protected by GitHub rulesets. No direct pushes. No force pushes. All changes require a PR.
- **Only TJ (`tfalohun`) can merge PRs** to `main` and `staging`. This is enforced via the `merge-admins` team bypass in rulesets.
- Everyone else can create branches, push code, and open PRs — but cannot merge.
- See [Merge Permissions](docs/MERGE_PERMISSIONS.md) for details.

### Environment variables

Both staging and production currently share the same Supabase project. Environment-specific variables are managed in Vercel under **Settings → Environment Variables** (Production / Preview / Development).

| Variable | Production | Staging (Preview) |
|----------|------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same | Same (for now) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same | Same (for now) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same | Same (for now) |
| `STRIPE_SECRET_KEY` | Live key (when ready) | Test key |

### Keeping branches in sync

- Promote `staging` → `main` **at least weekly** to avoid drift
- After a hotfix to `main`, always merge `main` back into `staging`
- If `staging` falls behind:
  ```bash
  git checkout staging && git pull
  git merge main && git push
  ```

---

## The Contribution Workflow

### Step 1: Pick Something to Work On

Check our [GitHub Issues](https://github.com/olera-care/olera-web/issues) or the roadmap in the README.

**Good first contributions:**
- Fixing typos
- Adjusting colors or spacing
- Adding missing content
- Improving documentation

### Step 2: Create a Branch

Always work on a branch, never directly on `main`. **Branch from `staging`**, not `main`.

```bash
# Make sure you have the latest staging
git checkout staging
git pull origin staging

# Create your branch
git checkout -b your-branch-name
```

**Branch naming conventions:**
- `feature/what-youre-adding` - New features
- `fix/what-youre-fixing` - Bug fixes
- `style/what-youre-styling` - Design changes
- `docs/what-youre-documenting` - Documentation
- `refactor/what-youre-cleaning` - Code cleanup

### Step 3: Make Your Changes

Open the project in VS Code and make your changes.

**Tips:**
- Save frequently (Cmd+S on Mac, Ctrl+S on Windows)
- Check the browser often to see your changes
- If something breaks, undo with Cmd+Z / Ctrl+Z

### Step 4: Test Your Changes

```bash
# Make sure the app still runs
npm run dev

# Check for errors
npm run build
```

Visit http://localhost:3000 and click around to make sure nothing is broken.

### Step 5: Commit Your Changes

```bash
# See what files you changed
git status

# Stage all changes
git add .

# Commit with a descriptive message
git commit -m "Add filter buttons to browse page"
```

**Good commit messages:**
- Start with a verb: Add, Fix, Update, Remove, Refactor
- Be specific: "Fix navbar dropdown on mobile" not "Fix bug"
- Keep it short: Under 50 characters ideally

### Step 6: Push to GitHub

```bash
git push origin your-branch-name
```

### Step 7: Create a Pull Request (PR)

1. Go to https://github.com/olera-care/olera-web
2. You'll see a yellow banner saying "your-branch-name had recent pushes"
3. Click "Compare & pull request"
4. **Set the base branch to `staging`** (not `main`)
5. Write a description of what you changed and why
6. Click "Create pull request"

### Step 8: Get Reviewed & Merged

- Someone will review your PR
- They might suggest changes - that's normal and helpful!
- Make any requested changes on your branch and push again
- Once approved, **TJ will merge your PR** into `staging` (only TJ has merge access)
- When staging is validated, TJ promotes `staging` → `main` (production)

---

## Code Style Guidelines

### File Naming
- Components: `PascalCase.tsx` (e.g., `ProviderCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Folders: `kebab-case` (e.g., `provider-dashboard/`)

### Component Structure

```tsx
// 1. Imports at the top
import { useState } from "react";
import Link from "next/link";

// 2. Types/interfaces (if needed)
interface Props {
  title: string;
  description?: string; // ? means optional
}

// 3. The component
export default function MyComponent({ title, description }: Props) {
  // 4. Hooks and state at the top of the function
  const [isOpen, setIsOpen] = useState(false);

  // 5. Helper functions
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  // 6. The JSX return
  return (
    <div className="p-4">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      <button onClick={handleClick}>
        {isOpen ? "Close" : "Open"}
      </button>
    </div>
  );
}
```

### Tailwind CSS Tips

- Use existing utility classes instead of custom CSS
- Group related classes together
- Use our custom classes: `btn-primary`, `btn-secondary`, `card`, `input-field`

```tsx
// Good
<button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">

// Even better - use our custom class
<button className="btn-primary">
```

---

## Common Tasks

### Adding a New Page

1. Create a folder in `app/` with the route name
2. Add a `page.tsx` file inside

```bash
# Example: Create /about page
mkdir app/about
touch app/about/page.tsx
```

```tsx
// app/about/page.tsx
export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">About Olera</h1>
      <p className="mt-4">Your content here...</p>
    </div>
  );
}
```

### Adding a New Component

1. Decide which folder it belongs in (`shared/`, `ui/`, `providers/`, `families/`)
2. Create the file with PascalCase name
3. Export the component

```tsx
// components/ui/Badge.tsx
interface BadgeProps {
  text: string;
  color?: "green" | "blue" | "orange";
}

export default function Badge({ text, color = "green" }: BadgeProps) {
  const colors = {
    green: "bg-primary-100 text-primary-800",
    blue: "bg-secondary-100 text-secondary-800",
    orange: "bg-warm-100 text-warm-800",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm ${colors[color]}`}>
      {text}
    </span>
  );
}
```

### Using the Component

```tsx
import Badge from "@/components/ui/Badge";

// In your JSX:
<Badge text="Home Care" color="green" />
```

---

## Troubleshooting

### "npm run dev" isn't working

```bash
# Try reinstalling dependencies
rm -rf node_modules
npm install
npm run dev
```

### "I made changes but don't see them"

1. Make sure you saved the file
2. Check the terminal for errors
3. Try refreshing with Cmd+Shift+R (hard refresh)

### "Git says I have merge conflicts"

Don't panic! This happens when two people edit the same file.

```bash
# Get the latest staging
git checkout staging
git pull origin staging

# Go back to your branch
git checkout your-branch-name

# Merge staging into your branch
git merge staging
```

If there are conflicts, VS Code will show them. Look for:
```
<<<<<<< HEAD
your changes
=======
their changes
>>>>>>> main
```

Choose which to keep (or combine them), save, then:
```bash
git add .
git commit -m "Resolve merge conflicts"
git push origin your-branch-name
```

### "I accidentally committed to main"

```bash
# Create a branch with your changes
git branch my-feature

# Reset main to match remote
git checkout main
git reset --hard origin/main

# Go to your branch
git checkout my-feature
```

---

## Questions?

- **Slack/Discord:** Ask in #olera-dev
- **GitHub:** Open an issue with your question
- **AI:** Ask Claude! Copy the relevant code and explain your question

---

## 🎯 Hands-On Practice: Your First PR (Monday Session)

This 15-minute exercise walks through the entire workflow with a real change.

### Exercise: Add Your Name to the Team

**Goal:** Create a branch → Make a change → Push → Open a PR → Get it merged

---

#### Step 1: Get the Latest Code (1 min)

```bash
cd ~/Desktop/olera-web       # Navigate to project
git checkout staging          # Switch to staging branch
git pull origin staging       # Get latest changes
```

#### Step 2: Create Your Branch (1 min)

```bash
git checkout -b docs/add-yourname
```

Replace `yourname` with your actual name (e.g., `docs/add-tj`).

#### Step 3: Make a Simple Change (2 min)

Open `README.md` and find the Contributors section (or create one at the bottom):

```markdown
## Contributors

- Your Name - Your Role
```

Save the file.

#### Step 4: Check, Stage, and Commit (2 min)

```bash
git status                              # See your changes (red = unstaged)
git add README.md                       # Stage the file (or `git add .` for all)
git status                              # Now it's green = staged
git commit -m "Add [Your Name] to contributors"
```

#### Step 5: Push Your Branch (1 min)

```bash
git push origin docs/add-yourname
```

First time? GitHub may ask you to set up credentials.

#### Step 6: Open a Pull Request (3 min)

1. Go to https://github.com/olera-care/olera-web
2. Click the yellow "Compare & pull request" banner
3. Add a title: `Add [Your Name] to contributors`
4. Add description: `Adding myself to the README`
5. Click **Create pull request**

#### Step 7: Get Reviewed & Merged (5 min)

- Wait for a teammate to approve (we'll do this together)
- Once approved, **ask TJ to merge** your PR (only TJ has merge access)
- TJ will click **Merge pull request** and **Delete branch** (cleanup)

#### Step 8: Sync Your Local (1 min)

```bash
git checkout staging
git pull origin staging
```

---

### Quick Reference Card

| What you want to do | Command |
|---------------------|---------|
| See current branch | `git branch` |
| See changes | `git status` |
| Create new branch | `git checkout -b branch-name` |
| Switch branches | `git checkout branch-name` |
| Stage all changes | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push origin branch-name` |
| Get latest staging | `git checkout staging && git pull` |

---

### Hotfixes (urgent production issues)

For fixes that can't wait for the staging cycle:

1. Branch from `main` (not `staging`)
2. Open PR directly targeting `main`
3. After merging, sync `staging`:
   ```bash
   git checkout staging && git pull
   git merge main && git push
   ```

---

### The Golden Rule

```
staging → branch → changes → push → PR to staging → review → TJ merges → promote to main
```

**Never push directly to `main` or `staging`. Always use a PR. Only TJ merges.**

---

*Happy coding!*
