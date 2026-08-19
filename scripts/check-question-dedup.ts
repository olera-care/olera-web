import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getUnaskedQuestionSuggestions,
  normalizeQuestion,
  summarizeQuestionTopics,
} from "../lib/qa-utils";
import { getSuggestedQuestions, isValidSuggestedQuestion } from "../lib/provider-utils";
import { SUPABASE_CAT_TO_PROFILE_CATEGORY } from "../lib/types/provider";

const insurance = "Do you accept insurance or Medicaid?";
const suggestions = [
  { key: "insurance_medicaid", text: insurance },
  { key: "services_provided", text: "What services do you provide?" },
];

assert.equal(
  normalizeQuestion("  Do you accept insurance or Medicaid?!  "),
  normalizeQuestion(insurance),
  "punctuation and whitespace variants must share one topic key",
);

assert.deepEqual(
  getUnaskedQuestionSuggestions(
    suggestions,
    [{ question: insurance, suggestion_key: "insurance_medicaid" }],
    {},
  ),
  [{ key: "services_provided", text: "What services do you provide?" }],
  "a pending live question must remove its suggested topic",
);

assert.deepEqual(
  getUnaskedQuestionSuggestions(
    suggestions,
    [],
    { insurance_medicaid: 5 },
  ),
  [{ key: "services_provided", text: "What services do you provide?" }],
  "server history must suppress a stale cached suggestion before the live fetch",
);

assert.equal(
  SUPABASE_CAT_TO_PROFILE_CATEGORY["Home Care (Non-medical)"],
  "home_care_agency",
  "claimed home-care profiles must inherit the directory category",
);

const categoryCatalogs = [
  null,
  "home_care_agency",
  "home_health_agency",
  "hospice_agency",
  "assisted_living",
  "memory_care",
  "nursing_home",
  "independent_living",
  "inpatient_hospice",
  "rehab_facility",
  "adult_day_care",
  "wellness_center",
  "private_caregiver",
] as const;
const catalogByKey = new Map<string, string>();
for (const category of categoryCatalogs) {
  for (const suggestion of getSuggestedQuestions(category)) {
    const existing = catalogByKey.get(suggestion.key);
    assert.ok(
      !existing || existing === suggestion.text,
      `suggestion key ${suggestion.key} must identify one stable topic`,
    );
    catalogByKey.set(suggestion.key, suggestion.text);
    assert.equal(
      isValidSuggestedQuestion(suggestion.key, suggestion.text),
      true,
      `catalog suggestion ${suggestion.key} must pass the server guard`,
    );
  }
}
assert.equal(
  isValidSuggestedQuestion("insurance_medicaid", "A forged question"),
  false,
  "a caller cannot attach a valid topic key to arbitrary copy",
);

const insuranceTopic = normalizeQuestion(insurance);
const servicesTopic = normalizeQuestion("What services do you provide?");
assert.deepEqual(
  summarizeQuestionTopics(
    [insuranceTopic, insuranceTopic, insuranceTopic, servicesTopic],
    new Map([
      [insuranceTopic, false],
      [servicesTopic, true],
    ]),
  ),
  { received: 4, unanswered: 3, uniqueReceived: 2, uniqueUnanswered: 1 },
  "campaign reporting must preserve raw taps while deduplicating topics",
);

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/185_provider_question_deduplication.sql"),
  "utf8",
);
assert.match(
  migration,
  /CREATE TABLE IF NOT EXISTS provider_question_asks/,
  "every family ask needs its own append-only receipt",
);
assert.match(
  migration,
  /CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_questions_topic_text_unique[\s\S]+provider_identity_key, normalized_question/,
  "concurrent custom submissions require a stable provider/topic unique index",
);
assert.match(
  migration,
  /CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_questions_topic_suggestion_unique[\s\S]+provider_identity_key, suggestion_key/,
  "suggested topics need a copy-independent uniqueness boundary",
);
assert.match(
  migration,
  /CREATE OR REPLACE FUNCTION record_provider_question_ask[\s\S]+EXCEPTION WHEN unique_violation[\s\S]+INSERT INTO provider_question_asks/,
  "the recording RPC must recover from concurrent topic creation and still append the ask",
);
assert.match(
  migration,
  /CREATE OR REPLACE FUNCTION reserve_provider_question_answer_notifications[\s\S]+answer_notification_reserved_at/,
  "answer fan-out must reserve receipts before sending",
);
assert.match(
  migration,
  /CASE WHEN NULLIF\(trim\(candidate\.answer\), ''\) IS NOT NULL THEN 0 ELSE 1 END/,
  "duplicate cleanup must preserve an answered canonical thread",
);
assert.match(
  migration,
  /idx_provider_question_asks_legacy_question[\s\S]+metadata->>'legacy_question_id'[\s\S]+WHERE NOT EXISTS[\s\S]+existing\.metadata->>'legacy_question_id'/,
  "a manually applied migration must not duplicate historical ask receipts when replayed",
);
assert.match(
  migration,
  /SELECT question_id, count\(\*\)::integer AS ask_count[\s\S]+canonical\.canonical_question_id IS NULL/,
  "canonical demand counts must be recomputed from receipts without discarding newer asks",
);

const providerQuestionsRoute = readFileSync(
  join(process.cwd(), "app/api/provider/questions/route.ts"),
  "utf8",
);
assert.match(
  providerQuestionsRoute,
  /requestedQuestion\.canonical_question_id \|\| requestedQuestion\.id[\s\S]+question = canonicalQuestion[\s\S]+eq\("id", question\.id\)/,
  "legacy emailed IDs must resolve to the canonical topic for Q&A selection and answers",
);

const providerOnboardPage = readFileSync(
  join(process.cwd(), "app/provider/[slug]/onboard/page.tsx"),
  "utf8",
);
assert.match(
  providerOnboardPage,
  /canonical_question_id[\s\S]+id: question\.canonical_question_id \|\| question\.id/,
  "one-click question cards must answer the canonical topic behind a legacy email ID",
);

const variantSessionsRoute = readFileSync(
  join(process.cwd(), "app/api/admin/analytics/variant-sessions/route.ts"),
  "utf8",
);
assert.match(
  variantSessionsRoute,
  /metadata\?\.ask_id[\s\S]+from\("provider_question_asks"\)[\s\S]+delete\(\{ count: "exact" \}\)/,
  "QA test-session cleanup must delete the individual ask receipt, not a shared topic",
);

const providerDashboardRoute = readFileSync(
  join(process.cwd(), "app/api/provider/dashboard/route.ts"),
  "utf8",
);
assert.match(
  providerDashboardRoute,
  /from\("provider_questions"\)[\s\S]+is\("canonical_question_id", null\)/,
  "provider-facing question totals must ignore archived legacy duplicates",
);

const networkHealthRoute = readFileSync(
  join(process.cwd(), "app/api/admin/network-health/route.ts"),
  "utf8",
);
assert.match(
  networkHealthRoute,
  /questionsAskedQuery = db[\s\S]+from\("provider_question_asks"\)/,
  "network demand reporting must count raw ask receipts",
);

const adBoostQuestions = readFileSync(
  join(process.cwd(), "lib/ad-boost/delivered.server.ts"),
  "utf8",
);
assert.match(
  adBoostQuestions,
  /from\("provider_question_asks"\)[\s\S]+topic\.status !== "archived" && topic\.status !== "rejected"/,
  "Ad Boost raw taps must retain attribution without counting rejected or archived topics",
);

console.log("question deduplication regression checks passed");
