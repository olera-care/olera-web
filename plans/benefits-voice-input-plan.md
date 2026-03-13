# Plan: Senior Benefits Finder — Web Voice Input

Created: 2026-03-10
Status: In Progress (Phases 1-4 complete)
Branch: `peaceful-hawking`

## Goal

Add a mic button to each step of the Benefits Finder intake form so users can speak their answers instead of typing/tapping. Port the iOS keyword-based voice intent parser to TypeScript. Use Web Speech API (free, real-time) with Deepgram Nova-3 as a cross-browser fallback.

## Success Criteria

- [ ] Mic button appears on all 6 intake steps
- [ ] Tapping mic → browser requests permission → real-time transcript visible
- [ ] Spoken answers auto-map to form fields (ZIP, age, pills)
- [ ] Works on Chrome/Edge via Web Speech API (free)
- [ ] Falls back to Deepgram on unsupported browsers (Firefox, iOS Safari)
- [ ] Graceful degradation: if mic denied/unavailable, form works exactly as before
- [ ] Mobile and desktop layouts both work
- [ ] No regressions to existing form flow

## Architecture

```
User taps mic → useSpeechRecognition() hook
  ├─ Web Speech API (Chrome/Edge/desktop Safari)
  └─ Deepgram WebSocket fallback (Firefox, iOS browsers)
       ↓
  Real-time transcript displayed below input
       ↓
  voiceIntentParser.ts — keyword matching per step
       ↓
  Maps to form state via useCareProfile() context
       ↓
  Auto-advances if confident match; shows transcript if ambiguous
```

### Key Design Decisions

1. **Mic per step, not a separate voice mode** — Keeps voice as an enhancement to the existing form, not a parallel experience. Users can mix voice and tap freely.

2. **Web Speech API primary, Deepgram fallback** — ~75% of web traffic is Chrome/Edge where Web Speech API is free. Deepgram covers Firefox (~3%) and iOS Safari (~15%) at $0.008/min. Average session ~2min = ~$0.016 for fallback users.

3. **Keyword parser, not LLM** — The iOS VoiceIntentParser uses simple keyword matching and handles all edge cases. No need for Claude API calls — deterministic, instant, free.

4. **No TTS in v1** — System doesn't talk back. Voice is input-only. This keeps scope tight. TTS can be added in Plan B later.

5. **Privacy-sensitive mic permission** — Only request on explicit user action (tap mic). Show brief "audio is processed securely" note on first use. Never auto-listen.

## Tasks

### Phase 1: Speech Recognition Hook (Foundation)

- [x] **1. Create `hooks/use-speech-recognition.ts`**
  - Abstract speech-to-text behind a unified hook
  - Returns: `{ transcript, isListening, isSupported, start, stop, reset }`
  - Detect Web Speech API support (`window.SpeechRecognition || window.webkitSpeechRecognition`)
  - Implement Web Speech API path: continuous=false, interimResults=true, lang="en-US"
  - Track interim vs final transcript
  - Handle permission states: prompt → granted → denied
  - Handle errors: no-speech (timeout), audio-capture, not-allowed, network
  - Auto-stop after 10s silence (configurable)
  - Files: `hooks/use-speech-recognition.ts` (new)
  - Depends on: none
  - Verify: Import hook in a test page, tap start, speak, see transcript in console

- [x] **2. Add TypeScript types for Web Speech API**
  - Add type declarations for `SpeechRecognition`, `SpeechRecognitionEvent`, `SpeechRecognitionResult`
  - These are not in default TS lib — need a `.d.ts` file or augment `Window`
  - Files: `types/speech-recognition.d.ts` (new)
  - Depends on: none
  - Verify: No TS errors when importing SpeechRecognition in hook

### Phase 2: Voice Intent Parser (Port from iOS)

- [x] **3. Create `lib/benefits/voice-intent-parser.ts`**
  - Port `VoiceIntentParser.swift` keyword maps to TypeScript
  - Implement per-step parsers:
    - `parseZipCode(text)` → ZIP string or null (regex + spoken digit words)
    - `parseAge(text)` → number or null (spoken numbers + digits)
    - `parseCarePreference(text)` → CarePreference or null
    - `parsePrimaryNeeds(text)` → PrimaryNeed[] or empty
    - `parseIncomeRange(text)` → IncomeRange or null
    - `parseMedicaidStatus(text)` → MedicaidStatus or null (negation-first checking)
  - Main entry: `parseVoiceIntent(transcript: string, step: IntakeStep) → VoiceParseResult`
  - Return type includes: parsed value, confidence hint ("exact" | "fuzzy" | "unknown"), clarification prompt
  - Port clarification prompts from iOS (e.g., "I didn't catch the ZIP code. Could you say just the 5 digits?")
  - Files: `lib/benefits/voice-intent-parser.ts` (new)
  - Depends on: none (uses types from `lib/types/benefits.ts`)
  - Verify: Unit-test key phrases: "seventy two" → age 72, "seven five two zero one" → ZIP 75201, "stay at home" → stayHome, "help with bathing and cooking" → [personalCare, householdTasks]

- [ ] **4. Create `lib/benefits/voice-intent-parser.test.ts`**
  - Test all 6 step parsers with variety of spoken inputs
  - Test edge cases: spoken digits, compound numbers, negation-first Medicaid
  - Test unknown/ambiguous inputs return "unknown"
  - Test clarification prompts are returned for each step
  - Files: `lib/benefits/voice-intent-parser.test.ts` (new)
  - Depends on: 3
  - Verify: `npx vitest run voice-intent-parser` passes

### Phase 3: Mic Button Component

- [x] **5. Create `components/benefits/VoiceMicButton.tsx`**
  - Small mic icon button (32x32, or 40x40 on mobile for touch targets)
  - States: idle (gray mic), listening (pulsing red ring + red mic), error (gray + tooltip)
  - Listening state: subtle pulse animation via CSS keyframes (not heavy — 2 concentric rings)
  - Shows real-time transcript text below/beside the button when listening
  - On click: calls `start()` from speech hook; second click calls `stop()`
  - After stop: runs voice intent parser for current step
  - If parse succeeds → calls `onResult(parsedValue)` callback
  - If parse fails → shows clarification text (from parser), transcript stays visible
  - First-time tooltip: "Speak your answer" (shown once, stored in localStorage)
  - Accessible: `aria-label="Speak your answer"`, `role="button"`, announces listening state
  - Files: `components/benefits/VoiceMicButton.tsx` (new)
  - Depends on: 1, 2, 3
  - Verify: Renders in isolation, shows mic icon, click toggles listening state

- [x] **6. Create `components/benefits/VoiceTranscript.tsx`**
  - Displays the real-time transcript text during/after listening
  - Styled as a subtle gray text bubble below the main input area
  - Shows interim text in lighter color, final text in normal color
  - If parse was successful, briefly shows confirmation (e.g., "Got it — 72 years old") before auto-advancing
  - If parse failed, shows clarification prompt in amber/warning style
  - Auto-hides after 3s if parse succeeded
  - Files: `components/benefits/VoiceTranscript.tsx` (new)
  - Depends on: none (pure presentational)
  - Verify: Renders with sample transcript text

### Phase 4: Integration into Intake Form

- [x] **7. Wire VoiceMicButton into BenefitsIntakeForm.tsx**
  - Add mic button next to each step's input area:
    - Step 0 (Location): Mic button inside the location input row, right side
    - Step 1 (Age): Mic button inside the age input row, right side
    - Steps 2-5 (Pills): Mic button below the question heading, before pills
  - On voice result for each step:
    - Step 0: If ZIP → set zipCode + lookup state. If city name detected → trigger city search
    - Step 1: Set age input + flush to context
    - Step 2: Set carePreference
    - Step 3: Toggle matching primaryNeeds (additive, not replace)
    - Step 4: Set incomeRange
    - Step 5: Set medicaidStatus
  - Auto-advance after successful parse (same as pill click behavior)
  - Show VoiceTranscript below the input area during/after listening
  - Files: `components/benefits/BenefitsIntakeForm.tsx` (modify)
  - Depends on: 5, 6
  - Verify: Full flow — tap mic at each step, speak answer, see it parsed and form advance

- [ ] **8. Handle location voice input specially**
  - When voice returns a city name (not ZIP), need to search city list and auto-select
  - Use `useCitySearch` to find the closest match from spoken city name
  - If exact match → auto-select and advance
  - If multiple matches → show dropdown with matches, user taps to confirm
  - If no match → show "I didn't find that city. Try saying the ZIP code."
  - Also handle: "Houston Texas" → parse as city + state, search for match
  - Files: `components/benefits/BenefitsIntakeForm.tsx` (modify)
  - Depends on: 7
  - Verify: Say "Houston Texas" → selects Houston, TX. Say "78701" → sets ZIP

### Phase 5: Deepgram Fallback

- [ ] **9. Create `app/api/speech/token/route.ts` — Deepgram auth proxy**
  - Server-side route that returns a short-lived Deepgram API key/token
  - Reads `DEEPGRAM_API_KEY` from env
  - Returns temporary key scoped to transcription only
  - Rate-limited: max 10 tokens per user session per hour
  - Files: `app/api/speech/token/route.ts` (new)
  - Depends on: none
  - Verify: `curl /api/speech/token` returns a token (with API key set in env)

- [ ] **10. Add Deepgram WebSocket path to `use-speech-recognition.ts`**
  - When Web Speech API is not supported, use Deepgram streaming
  - Flow: fetch token from `/api/speech/token` → open WebSocket to `wss://api.deepgram.com/v1/listen` → stream mic audio via MediaRecorder → receive JSON transcripts
  - Use `navigator.mediaDevices.getUserMedia({ audio: true })` for mic access
  - Parse Deepgram JSON responses (interim + final transcripts)
  - Same hook interface — callers don't know which engine is used
  - Files: `hooks/use-speech-recognition.ts` (modify)
  - Depends on: 1, 9
  - Verify: Test on Firefox — mic button works, transcript appears

- [ ] **11. Add `DEEPGRAM_API_KEY` to Vercel env vars**
  - Add to staging and production environments
  - Document in `.env.example`
  - Files: `.env.example` (modify)
  - Depends on: 9
  - Verify: Vercel dashboard shows the env var for both envs

### Phase 6: Polish & Edge Cases

- [ ] **12. Privacy & permission UX**
  - First-time mic tap: show a brief inline note "Your audio is processed to understand your answer and is not stored." before triggering browser permission
  - If permission denied: show "Microphone access was blocked. You can enable it in browser settings." with a link/instructions
  - Store `olera-mic-permission-prompted` in localStorage so note only shows once
  - Files: `components/benefits/VoiceMicButton.tsx` (modify)
  - Depends on: 5
  - Verify: First tap shows privacy note, subsequent taps go straight to listening

- [ ] **13. Mobile responsiveness**
  - Ensure mic button doesn't break layout on small screens
  - Test: iPhone SE (375px), iPhone 14 (390px), Android (360px)
  - Mic button should be 44x44px minimum touch target
  - Transcript text should not overflow container
  - Files: `components/benefits/VoiceMicButton.tsx`, `components/benefits/VoiceTranscript.tsx` (modify)
  - Depends on: 5, 6
  - Verify: Responsive preview at 375px width — no overflow, mic button tappable

- [ ] **14. Accessibility audit**
  - Mic button: `aria-label`, `aria-pressed` (for listening state), focus-visible ring
  - Transcript: `aria-live="polite"` so screen readers announce results
  - Keyboard: Enter/Space to toggle mic
  - Reduced motion: disable pulse animation when `prefers-reduced-motion`
  - Files: `components/benefits/VoiceMicButton.tsx`, `components/benefits/VoiceTranscript.tsx` (modify)
  - Depends on: 5, 6
  - Verify: VoiceOver reads mic state changes, keyboard can trigger listening

- [ ] **15. Error recovery & edge cases**
  - Handle: mic in use by another tab/app → show "Microphone is busy"
  - Handle: mobile browser background/lock during listening → stop gracefully
  - Handle: very long transcript (>500 chars) → truncate display, still parse
  - Handle: non-English speech → parser returns unknown, show clarification
  - Handle: user says "go back" or "skip" → parse as navigation intent
  - Files: `hooks/use-speech-recognition.ts`, `components/benefits/VoiceMicButton.tsx` (modify)
  - Depends on: 1, 5
  - Verify: Kill mic mid-listen — no crash. Say gibberish — shows clarification prompt

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Safari iOS SpeechRecognition flaky | High | Medium | Deepgram fallback covers iOS (task 10) |
| Mic permission scary for senior users | Medium | High | Privacy note + never auto-request (task 12) |
| Keyword parser misinterprets accent/dialect | Medium | Low | Show transcript + allow retry; user can always tap instead |
| Deepgram costs spike from abuse | Low | Medium | Rate limit token endpoint (task 9); budget alerts on Deepgram dashboard |
| Web Speech API sends audio to Google | Known | Low | Acceptable per TJ's answer; privacy note covers it |

## Cost Estimate

| Scenario | Monthly Cost |
|----------|-------------|
| 1,000 sessions/mo, 80% Chrome (free) | ~$3.20 (200 Deepgram sessions × 2min × $0.008) |
| 5,000 sessions/mo, 80% Chrome | ~$16.00 |
| 10,000 sessions/mo, 80% Chrome | ~$32.00 |

## File Summary

| File | Action | Phase |
|------|--------|-------|
| `hooks/use-speech-recognition.ts` | New | 1, 5 |
| `types/speech-recognition.d.ts` | New | 1 |
| `lib/benefits/voice-intent-parser.ts` | New | 2 |
| `lib/benefits/voice-intent-parser.test.ts` | New | 2 |
| `components/benefits/VoiceMicButton.tsx` | New | 3 |
| `components/benefits/VoiceTranscript.tsx` | New | 3 |
| `components/benefits/BenefitsIntakeForm.tsx` | Modify | 4 |
| `app/api/speech/token/route.ts` | New | 5 |
| `.env.example` | Modify | 5 |

## Evolution Path (Plan B)

Once voice adoption is validated, the next iteration adds:
1. **Floating mic FAB** — single mic button that opens a voice overlay (bottom sheet)
2. **Browser TTS** — system reads each question aloud via `speechSynthesis` API (free)
3. **Audio level visualization** — waveform/amplitude ring around mic button during listening
4. **Guided flow** — overlay shows current question + transcript + confirmation in one view
5. **VoiceOrb** — port the iOS animated orb for a more premium feel

## Notes

- iOS codebase reference: `/Users/tfalohun/Desktop/OleraClean/OleraClean/VoiceIntentParser.swift`
- iOS uses `SFSpeechRecognizer` + `AVAudioEngine` — we use Web Speech API (conceptually identical)
- iOS Foundation Model extraction (iOS 26+) is NOT ported in v1 — keyword parser handles all cases
- The `react-speech-recognition` npm package wraps Web Speech API but adds 12KB and doesn't support fallbacks well — rolling our own hook is simpler and more flexible
- Deepgram $200 free credit for new accounts covers ~25,000 minutes of transcription
