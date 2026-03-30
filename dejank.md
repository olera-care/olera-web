# De-Jank: Airbnb-Smooth State Transitions

Systematically find and eliminate jank (layout shifts, flickers, disappearing content, delayed transitions) from a UI flow.

**Bar:** Telegram responsiveness, Airbnb stability. Every click, every transition.

## Input

$ARGUMENTS — Description of the janky flow (e.g., "connection card → enrichment → /welcome page")

---

## Phase 1: Observe — Read the Console, Not the Code

Before touching code, identify what the browser is actually doing:

1. **Ask for console screenshots** if not provided — console logs are the single best diagnostic tool
2. **Identify timeout/error patterns** — look for:
   - Query timeouts (e.g., `accounts query timed out after 5000ms`)
   - 403/401 errors from background fetches
   - `SIGNED_IN fetch failed` or similar auth state churn
   - Multiple rapid re-renders visible as layout shifts
3. **Map the timeline** — what fires and when:
   ```
   T=0ms    User action (click, navigate)
   T=Xms    API returns / state changes
   T=Yms    Effect fires / re-render
   T=Zms    Content appears/disappears (the jank)
   ```

**Key insight:** Jank is almost never a CSS problem. It's a state management race condition.

---

## Phase 2: Audit — Every State Setter is a Suspect

For the component(s) involved:

1. **Find every `setState` / `setX` call** that controls what the user sees:
   ```
   grep -n "setCardState\|setLoading\|setStep\|setVisible" component.tsx
   ```

2. **For each setter, document:**
   | Line | Sets to | Triggered by | During user flow? | Guarded? |
   |------|---------|-------------|-------------------|----------|

3. **Find every `useEffect`** and its dependency array:
   - Which deps change during the flow?
   - Does the effect unconditionally reset state?
   - Is there an early return guard for "flow in progress"?

4. **Identify the killers** — effects that reset visible state:
   - Auth state changes (`user`, `isLoading`, `profiles`, `activeProfile`)
   - Data fetching completion (`connection`, `provider`, etc.)
   - Timer/timeout resolution
   - Background session establishment

---

## Phase 3: Trace — Walk Every Async Path

For each async operation in the flow:

1. **What triggers it?** (user click, effect, auth event)
2. **What state does it change when it resolves?**
3. **What effects does that state change trigger?**
4. **Do any of those effects override user-visible state?**

Draw the chain:
```
User click → API call → setConnectionId → checkExisting effect → setCardState("connected") ← JANK
```

Common jank patterns:
- **Effect cascade:** State A changes → Effect 1 fires → State B changes → Effect 2 fires → visible state resets
- **Auth churn:** SIGNED_IN event → isLoading=true → timeout → isLoading=false → initialization effect resets UI
- **Conditional rendering flip-flop:** Variable goes truthy→falsy→truthy as data loads, causing section to appear→disappear→reappear

---

## Phase 4: Fix — Apply These Patterns

### Pattern 1: Flow Lock (ref-based guard)
When a multi-step flow is in progress, prevent background effects from overriding state:
```ts
const flowLock = useRef(false);

// In the flow:
flowLock.current = true;
setCardState("enrichment");

// In EVERY effect that sets visible state:
useEffect(() => {
  if (flowLock.current) return; // Don't override during flow
  // ... normal logic
}, [deps]);

// When flow completes:
flowLock.current = false;
```

### Pattern 2: Optimistic State
Show the next state before the API returns:
```ts
// Instead of: await API → show result
// Do: show result → fire API in background → rollback on failure
setCardState("success");
try {
  await apiCall();
} catch {
  setCardState("form"); // Rollback
  setError(msg);
}
```

### Pattern 3: Move Blocking Awaits to Background
If a function `awaits` something the UI doesn't need:
```ts
// Before (blocks UI):
await refreshAccountData();
setCardState("next");

// After (non-blocking):
setCardState("next");
refreshAccountData().catch(() => {}); // Background
```

### Pattern 4: Stable Conditional Rendering
Prevent sections from appearing/disappearing during data loading:
```ts
// Before (janky):
{isConnected && <HeroSection />}

// After (stable — use initial value until data settles):
const [heroVisible, setHeroVisible] = useState(true);
useEffect(() => {
  if (!loading) setHeroVisible(!isConnected && !allStepsComplete);
}, [loading, isConnected, allStepsComplete]);
{heroVisible && <HeroSection />}
```

### Pattern 5: Skeleton Placeholders
Reserve layout space while data loads:
```ts
{loading ? <HeroSkeleton /> : <HeroSection data={data} />}
// NOT: {data && <HeroSection data={data} />} ← causes layout shift
```

---

## Phase 5: Triple-Audit — Every Click, Every Transition

After implementing fixes:

1. **Grep every state setter** that affects visible UI — verify each one is guarded
2. **Grep every useEffect** — verify none can reset state during a flow
3. **Walk every async timeline:**
   - What if auth times out (5s)?
   - What if the API is slow (2s)?
   - What if session establishment races with data fetch?
   - What if the user navigates before async completes?
4. **Check for double-render triggers:**
   - Does `refreshAccountData` change deps of multiple effects?
   - Does `setSession` trigger `onAuthStateChange` which triggers more effects?

---

## Phase 6: Verify

- Build passes (`npx next build`)
- Describe what the user should see at each step
- Confirm no layout shifts, no content flicker, no delayed transitions
- Every transition should feel instant or have an intentional loading state (skeleton, spinner)

---

## Anti-Patterns to Watch For

| Anti-Pattern | Why It Causes Jank | Fix |
|-------------|-------------------|-----|
| `await` before state transition | User waits for network | Optimistic state or background await |
| Unconditional `setState` in useEffect | Resets visible state on re-render | Add flow lock guard |
| Conditional render on async data | Section appears/disappears as data loads | Stable state + skeleton |
| Multiple effects with overlapping deps | Cascade of re-renders | Consolidate or add guards |
| Auth state in effect deps | Auth churn (SIGNED_IN → timeout → retry) triggers UI resets | Guard with flow lock |
| No loading skeleton | Content pops in causing layout shift | Reserve space with skeleton |
