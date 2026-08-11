# Meticulous Message Review — Before TJ Sends

Optional argument: a draft id, a state, or a program id to scope the review. With no argument, review every pending navigator draft.

## Purpose

TJ is about to send letters to real families, most of them older adults short on money and heavily targeted by scams. This command is the last gate before that happens. It exists because a letter can be **internally consistent, carry a correct phone number, and still be wrong** — and no automated check will tell you.

Run this before any send or schedule. A clean `benefits-draft-lint` run is **not** a substitute; see "Why the lint is not enough" below.

---

## The four axes

A draft is only safe to send when all four hold. Most rounds check one or two and declare victory. On 2026-08-11 the first two rounds passed and the third axis failed on **17 of 20 programs**.

### 1. The number

Not "does it ring" but **"does it do the thing the letter says"**. These all rang and all failed:

- an EBT customer-service line that handles lost cards and cannot take an application (CO SNAP)
- a Medicaid **eligibility** line that cannot take a **services** request (SC, LA, VA, OK)
- a member-services line whose first menu option replaces ID cards (OK SoonerCare)
- a generic agency switchboard that appears on none of the program's own pages, and was superseded besides (OK ADvantage)
- **a number that appears only in the site-wide page footer** (AR LIHEAP). Grep the raw HTML: if the number appears only in the footer block that is on every page of the domain, it is the switchboard, not the program's line.
- a **locator** line for a **counseling** program, three hops from anyone who can determine eligibility (CA HICAP)
- a line whose only documented function is to **mail you a form** (AL MSP, TX 2-1-1)

Ask: what does this number's own operator say it is for? Prefer institutional front doors over named-person desk lines, but check whether the "desk line" is actually carried in a state grantor roster (VT BROC was, and the standing rule would have wrongly rejected it).

### 2. The documents

Only `documentsNeeded[0..2]` reach a family. Ask **which step** each document belongs to. The recurring error is bolting a later stage's paperwork onto a first call:

- LA: Social Security cards and proof of residency on what is actually a five-minute registry call. That makes a short call look like a documents appointment, which is exactly the friction that stops people dialing.
- GA EDWP: income, assets and two doctor approvals belong to the downstream Medicaid application, not the screening call.
- FL: a doctor's note whose only basis is a **post-enrollment** modified-diet order.

Also ask what the screener actually asks. If the first step is a phone screen, list what they will be asked, not a packet.

### 3. The route ← **the one everyone skips**

Does the sequence we describe match what the operator publishes, **in their order**?

- **Inversion.** The state lists online first and frames the phone as the fallback, and we lead with the phone. Tell: the page says "*If you are unable to complete the online application, you may call…*" (OK ADvantage), or a handbook lists filing channels and telephone is not among them (TX). Decisive test used on NJ: the same page writes "*to apply, call*" for **other** programs and pointedly does not for this one.
- **Missing pre-step.** Something the family must do first that they would never anticipate. OK ADvantage: choose Home Care and Case Management providers from a search tool **before** applying, because they are asked for at the assessment. VT: a separate Form 407 per job. GA Gateway: create an account first. NJ: hold a **New Jersey** E-ZPass account, since other states do not qualify.
- **Route omitted entirely.** VT is a four-step paper process with two forms and two required signatures; we said "call".
- **Hidden blocker.** CO: payment is never approved until the family proves they applied to Social Security, within 11 days. It appears only in rule text, never on the public page.
- **Step count.** SD: the call finds the local provider, then enrolment is a **second** step with that provider, and the largest one publishes no phone at all, only an online form.

### 4. The links

`applicationGuide.urls` is what the plan page offers. **Zero urls means a family cannot reach an application from us.** Four programs had zero. Publish the actual application, the actual form, and any locator the route depends on.

---

## Procedure

1. **Enumerate.** Pull every pending draft with its program, letter body, SMS, `applicationGuide` (method, steps, urls) and `documentsNeeded[0..2]`. Dedupe by program; several drafts often share one.

2. **Fan out, one agent per program.** Give each: the program, our anchor and its label, our `method`, our step titles, our url count, and the letter's actual claims. Require them to answer the four axes and to name **the domain that answered**. Tell them to prefer a few decisive primary fetches over broad searching, and to return partial findings marked UNVERIFIED rather than stalling.

3. **Never accept a search summary for a route.** Phone numbers from summaries have historically held; **routing and process claims have not**. Three separate summary errors were caught on 2026-08-11 alone: a fabricated "call X to apply", a wrong helpdesk number, and a synthesized benefit figure produced *before* any primary source was read. Escalate instead:
   - `curl 'https://web.archive.org/web/2026/<url>'` returns full page bytes including PDFs. Note responses can arrive gzip-encoded without a header, and it truncates at 5MB.
   - `r.jina.ai` text proxy clears WAFs that block curl.
   - Download PDFs and run `pdftotext -layout`. **WebFetch's summarizer silently returns nothing on compressed PDF text layers**, which reads as "the page is empty" rather than as a failure.
   - Known walls: `ldh.la.gov`, `goea.louisiana.gov`, `ahca.myflorida.com` (even its own PDFs), `scdhhs.gov`, `hhs.texas.gov`, `njta.gov`, `dhcs.ca.gov`, `chfs.ky.gov`, `cms.gov`, `medicare.gov`. `dmas.virginia.gov` DNS-fails outright. `dhs.sd.gov` is CAPTCHA-walled to every method.
   - **Ignore olera.care results.** Our own pages rank for these programs and will "corroborate" our own errors.

4. **Apply to `data/pipeline/<ST>/drafts.json`.** Fail loudly when a target is not found. Then regenerate, de-churn, and stamp `lastVerifiedDate`.

5. **Rewrite the letters to match the route**, patching `subject`, `body`, `sms` and the `edited_*` variants together. Refresh the `pick` snapshot in the same write.

6. **Run `scripts/benefits-draft-lint.js`** with `--pipeline` pointed at the branch holding the corrections. Fix until `--high` is empty and read every `low`.

7. **Promote before sending.** Letters are database rows and cross the deploy boundary instantly. **Plan pages render from the deployed bundle.** Ship the data or the two halves of the same message disagree. On 2026-08-11, 8 of 10 corrected programs briefly had a letter with the right number and a plan page with the old one.

---

## Why the lint is not enough

`benefits-draft-lint` catches **inconsistency**, not **wrongness**. A draft whose phone is wrong but consistent everywhere passes clean. OK SoonerCare passed it while pointing a memory-and-health family at a card-replacement line. Both Florida letters passed while one contained a sentence that was false for every applicant scoring under 30.

The lint is the floor. This command is the ceiling. Run both.

---

## Voice checks, on top of accuracy

- No em dashes. No smart quotes (they also break exact-match patching).
- No speed or ease promises. "It's one phone call" is the banned "just one call" with the qualifier filed off, and AL proved it false: that call only mails a form.
- Count words must match their lists. "Have three things nearby" followed by four items was live on 2026-08-11.
- Never assert a fact the family did not give us. If age is unknown, write "if the person needing care is 65 or older", not "your 65-year-old".
- Say what a call will **not** do, when that is the honest thing. "This call does not start a Medicaid application" prevents the disappointment that stops people replying.

---

## Report

Per program: what was verified against which source, what changed, what was deliberately not changed and why, and anything still unverified. Name your own errors explicitly — four of the 2026-08-11 corrections were fixes to mistakes made earlier that same day, and finding them was the point.
