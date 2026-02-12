# Commit Changes

Commit current changes to git with a well-formed commit message.

## Steps

1. **Check git status** to see what's changed:
   - Staged vs unstaged changes
   - New files vs modified files
   - Current branch

2. **Review the diff** to understand all changes:
   - What functionality was added/changed?
   - Which files were touched?

3. **Draft a commit message** following conventions:
   - First line: Short summary (50 chars max), imperative mood ("Add X" not "Added X")
   - Blank line
   - Body: Explain WHAT and WHY (not HOW), wrap at 72 chars
   - Focus on user-facing changes and business value

4. **Stage appropriate files**:
   - Don't commit unrelated changes together
   - Ask user if unsure what to include

5. **Create the commit** and show the result.

6. **Ask about push**:
   - Show current branch and remote status
   - Only push if user confirms

7. **Ask about PR**:
   - If user wants to open a PR, **default the base branch to `staging`** (not `main`)
   - Use: `gh pr create --base staging`
   - Only target `main` if the user explicitly asks for a production/hotfix PR

## Commit Message Examples

```
Add Senior Benefits Finder intake flow

- 5-step intake: location, age, household, circumstances, priorities
- Eligibility matching against federal and Texas state programs
- Local AAA lookup by ZIP code
```

```
Fix bottom sheet swipe sensitivity

Sheets were snapping back too aggressively. Lowered velocity
threshold and increased boost multiplier for smoother UX.
```

Now check git status and prepare a commit.
