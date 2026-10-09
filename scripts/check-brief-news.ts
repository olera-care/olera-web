/**
 * Deterministic checks for the news-only brief (lib/war-room/brief-news.ts).
 *
 *   npx tsx scripts/check-brief-news.ts
 */
import assert from "node:assert/strict";
import { numbersCheck, numbersIn, rememberKeys, renderPlainBrief, renewalFact, selectNews, withDrafts, type BriefFact } from "../lib/war-room/brief-news";

const f = (key: string, weight: number, text = key): BriefFact => ({ key, text, weight });

// Only new facts, most important first, at most two.
const facts = [f("inbox:19", 10), f("move:robbie", 100), f("moment:jacob", 70), f("reading:benefits:77", 60)];
assert.deepEqual(selectNews(facts, []).map((x) => x.key), ["move:robbie", "moment:jacob"]);
assert.deepEqual(selectNews(facts, ["move:robbie"]).map((x) => x.key), ["moment:jacob", "reading:benefits:77"]);
// The same fact tomorrow is not news; a changed value (new key) is.
assert.deepEqual(selectNews([f("reading:benefits:77", 60)], ["reading:benefits:77"]), []);
assert.equal(selectNews([f("reading:benefits:81", 60)], ["reading:benefits:77"]).length, 1);
// Duplicates count once.
assert.equal(selectNews([f("a", 1), f("a", 1)], []).length, 1);

// What was said is remembered; the third item, not said, comes tomorrow.
const shown = selectNews(facts, []);
const keys = rememberKeys([], shown);
assert.deepEqual(selectNews(facts, keys).map((x) => x.key), ["reading:benefits:77", "inbox:19"]);
assert.equal(rememberKeys(Array.from({ length: 400 }, (_, i) => `k${i}`), [f("new", 1)], 300).length, 300);

// Renewal: news a week out and the day before, not every day of the month.
const short = (iso: string) => ({ "2026-10-15": "Oct 15", "2026-10-20": "Oct 20" } as Record<string, string>)[iso] ?? iso;
assert.equal(renewalFact({ name: "Hoop Cares", renewsOn: "2026-10-15", daysUntilRenewal: 12, amount: 75 }, short), null);
const week = renewalFact({ name: "Hoop Cares", renewsOn: "2026-10-15", daysUntilRenewal: 7, amount: 75, flightEndsOn: "2026-10-20" }, short)!;
assert.equal(week.text, "Hoop Cares renews in 7 days, Oct 15 for $75, and her ad flight ends Oct 20.");
assert.notEqual(week.key, renewalFact({ name: "Hoop Cares", renewsOn: "2026-10-15", daysUntilRenewal: 1, amount: 75 }, short)!.key);

// The number check: the invented "oldest from Monday, 3 days" fails; numbers from the facts pass.
assert.deepEqual(numbersIn("1,562 questions, $75, 4.33%, Oct 15."), ["1562", "75", "4.33", "15"]);
const factTexts = ["19 inbox items waiting on your approval.", "Hoop Cares renews in 7 days, Oct 15 for $75."];
assert.ok(numbersCheck("Hoop renews in 7 days on Oct 15 ($75). 19 items are waiting.", factTexts).ok);
assert.deepEqual(numbersCheck("19 items, the oldest from 3 days ago.", factTexts).invented, ["3"]);
assert.ok(numbersCheck("Two things this week.", factTexts).ok);

// Template: quiet day, news day, drafts quoted.
assert.equal(renderPlainBrief([], [], "Next date: Hoop renews Oct 15."), "Nothing new today. Next date: Hoop renews Oct 15.");
assert.equal(renderPlainBrief([f("a", 1, "One."), f("b", 1, "Two.")], [], null), "One. Two.");
assert.equal(withDrafts("Reply to Robbie.", [{ key: "m", text: "x", weight: 1, draft: "Hi Robbie,\nthanks" }]), "Reply to Robbie.\n\n_Draft:_\n> Hi Robbie,\n> thanks");

console.log("brief news checks passed");
