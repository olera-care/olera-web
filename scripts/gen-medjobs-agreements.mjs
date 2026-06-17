/**
 * One-off generator for the MedJobs agreement PDFs (Intern, Agency Host,
 * Family Host) on Olera letterhead, using @react-pdf/renderer (no JSX so it
 * runs under plain `node`). Writes static PDFs to /public, replacing the
 * placeholders the "read the agreement" buttons open.
 *
 *   node scripts/gen-medjobs-agreements.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { Document, Page, Text, View, Image, renderToBuffer } from "@react-pdf/renderer";

const h = React.createElement;

const EMERALD = "#059669";
const EMERALD_DARK = "#047857";
const GRAY_900 = "#111827";
const GRAY_700 = "#374151";
const GRAY_500 = "#6b7280";
const GRAY_300 = "#d1d5db";
const GRAY_100 = "#f3f4f6";

const s = {
  page: { paddingTop: 34, paddingBottom: 46, paddingHorizontal: 48, fontFamily: "Helvetica", fontSize: 10, color: GRAY_700, lineHeight: 1.5 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottomWidth: 0.75, borderBottomColor: GRAY_300, marginBottom: 16 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandLogo: { width: 20, height: 20, marginRight: 7 },
  brandWord: { fontSize: 17, fontFamily: "Helvetica-Bold", color: EMERALD_DARK, letterSpacing: 0.5 },
  headerTag: { fontSize: 8, color: GRAY_500, letterSpacing: 0.6, textTransform: "uppercase" },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", color: GRAY_900, marginBottom: 10 },
  preambleBox: { backgroundColor: GRAY_100, borderLeftWidth: 2, borderLeftColor: EMERALD, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12 },
  preamble: { fontFamily: "Helvetica-Oblique", color: GRAY_700, fontSize: 10, lineHeight: 1.5 },
  signoff: { fontFamily: "Helvetica-Bold", color: GRAY_900, fontSize: 9, marginTop: 6 },
  intro: { color: GRAY_700, marginBottom: 10 },
  defLine: { color: GRAY_700, marginBottom: 2, fontSize: 9.5 },
  bold: { fontFamily: "Helvetica-Bold", color: GRAY_900 },
  section: { marginBottom: 8 },
  note: { fontFamily: "Helvetica-Oblique", color: EMERALD_DARK, fontSize: 9, marginTop: 2 },
  accepted: { marginTop: 14, paddingTop: 10, borderTopWidth: 0.75, borderTopColor: GRAY_300, color: GRAY_900, fontFamily: "Helvetica-Bold", fontSize: 10 },
  footer: { position: "absolute", bottom: 22, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: GRAY_300, paddingTop: 6 },
  footerText: { fontSize: 7.5, color: GRAY_500 },
};

function section({ n, title, body, note }) {
  return h(View, { style: s.section, key: n },
    h(Text, { style: { color: GRAY_700 } }, h(Text, { style: s.bold }, `${n}. ${title} `), body),
    note ? h(Text, { style: s.note }, note) : null,
  );
}

function doc({ logo, title, preamble, intro, definitions, sections, accepted }) {
  return h(Document, null,
    h(Page, { size: "LETTER", style: s.page },
      h(View, { style: s.headerRow },
        h(View, { style: s.brandRow },
          logo ? h(Image, { src: logo, style: s.brandLogo }) : null,
          h(Text, { style: s.brandWord }, "Olera"),
        ),
        h(Text, { style: s.headerTag }, "Student Caregiver Internship"),
      ),
      h(Text, { style: s.title }, title),
      h(View, { style: s.preambleBox },
        h(Text, { style: s.preamble }, preamble),
        h(Text, { style: s.signoff }, "— Dr. Logan DuBose, MD"),
      ),
      h(Text, { style: s.intro }, intro),
      definitions && definitions.length
        ? h(View, { style: { marginBottom: 10 } },
            ...definitions.map((d, i) =>
              h(Text, { style: s.defLine, key: i }, h(Text, { style: s.bold }, d.term + " — "), d.def)))
        : null,
      ...sections.map(section),
      h(Text, { style: s.accepted }, accepted),
      h(View, { style: s.footer, fixed: true },
        h(Text, { style: s.footerText }, "Draft v0.1 · plain-language, source of truth · subject to legal review before binding"),
        h(Text, { style: s.footerText }, "olera.care"),
      ),
    ),
  );
}

// ── Content ────────────────────────────────────────────────────────────────
const INTERN = {
  title: "Olera Student Caregiver Internship — Intern Agreement",
  preamble:
    "You're not signing up for a job — you're starting the work you want to do for the rest of your life, with real hands and a real person who needs you. The hard part has always been getting experience that counts. That's what we built Olera to fix: do the work, and we'll make sure it's verified, credentialed, and ready to carry into every application — and every patient — that comes after.",
  intro:
    "This agreement is between you (the Intern) and Olera. It explains how the internship works, what you commit to, and what you receive. It is the single source of truth for the internship — if you ever wonder how something works, the answer is here.",
  definitions: [
    { term: "Host", def: "the family or agency you work for; your host is your employer, not Olera." },
    { term: "Shift", def: "a care session you and a host arrange." },
    { term: "Care Report Card", def: "the short record you submit after each shift." },
    { term: "Verified Hours", def: "report-card hours a host has confirmed." },
    { term: "Credential", def: "the certificate Olera issues when you complete the internship." },
  ],
  sections: [
    { n: 1, title: "Eligibility.", body: "You confirm you are currently enrolled — or recently graduated and planning to apply to a professional school — and that you need patient-care hours for that goal. Nothing else is required to join." },
    { n: 2, title: "The fee — once.", body: "You pay $200, one time. That single fee covers as many hosts and as many terms as it takes to meet the requirements and graduate. You pay it only after you accept your first host's offer — never before a real match, and never again.", note: "One fee, one finish line: we only succeed when you graduate, so we stay with you until you do." },
    { n: 3, title: "Getting ready.", body: "Before your first shift, complete the required onboarding and training, finish an accurate profile, and upload any certifications we ask for.", note: "You should be ready before someone's care depends on you." },
    { n: 4, title: "Your hours.", body: "Submit a Care Report Card for every shift. At the end of the internship, Olera consolidates your records and your host verifies them. Your verified hours are yours to keep, even if a placement ends." },
    { n: 5, title: "Your host is your employer.", body: "Your host sets your schedule, pay, and supervision. Olera does not employ you, set your wages, or direct your work. You are paid by your host — an agency through its payroll, or a family directly (Olera may help process family payments)." },
    { n: 6, title: "Your commitments.", body: "Be reliable, give advance notice, keep the availability you agree to, work within your training, and protect the privacy of the person you care for. Keep your profile current whenever your availability, host, or term changes, so hosts always know where you stand." },
    { n: 7, title: "What you receive.", body: "Connection to hosts; verified patient-care hours; references; reviews; a letter of recommendation when a host feels you've earned it; and application support — resume, personal statement, and mock-interview help to frame your experience in its best light." },
    { n: 8, title: "Your credential.", body: "When you reach 120 verified hours of quality experience — with verified reviews and letters, your training complete, and your hands-on metrics met — Olera issues your internship certificate.", note: "Not a participation badge: proof, earned, that you can hold up in any interview." },
    { n: 9, title: "What Olera is, and isn't.", body: "Olera connects, structures, and records. Olera is not your employer, a staffing agency, an insurer, or a guarantor of any outcome — hours, placement, pay, or admission. We promise the structure and the support; the work and the relationship are real, and yours." },
    { n: 10, title: "After the internship.", body: "You're welcome to keep using Olera to work with families and agencies for as long as it's useful, and your application support stays with you." },
    { n: 11, title: "Accepting.", body: "You accept by signing electronically when you accept your first host's offer. We record who accepted and when. If we update these terms, we'll ask you to re-acknowledge." },
  ],
  accepted: "Accepted by — Intern name  ·  e-signature  ·  date",
};

const AGENCY = {
  title: "Olera Agency Host Agreement",
  preamble:
    "You already know how rare a caregiver is who actually wants to be there. Olera's interns do — pre-health students building toward a clinical career, who treat every shift like it counts, because for them it does. You get reliable, screened help at no fee; the field gets the clinicians it's going to depend on. That's a trade worth making.",
  intro:
    "This agreement is between your agency (the Agency Host) and Olera. It sets out your role when you employ an Olera intern, and it is the source of truth for hosting. There is no fee to you.",
  sections: [
    { n: 1, title: "What hosting is.", body: "You employ an Olera intern — a vetted pre-health student — through your agency." },
    { n: 2, title: "Eligibility.", body: "You confirm you are a licensed or registered care agency." },
    { n: 3, title: "You are the employer.", body: "The intern is your employee under your normal operations: payroll, onboarding, background checks, insurance, and compliance with applicable employment, labor, and care law are yours.", note: "The cleanest, truest structure is the one where the licensed employer stays the employer." },
    { n: 4, title: "Pay.", body: "You pay the intern through your own payroll. Olera does not process agency pay." },
    { n: 5, title: "Liability and compliance.", body: "Because you employ the intern and run the engagement, liability, insurance, and legal compliance are entirely yours. Olera carries none and does not direct the work." },
    { n: 6, title: "Your role in the internship.", body: "Verify your intern's hours honestly, leave a brief review after shifts, and — if your intern asks and you feel they earned it — consider writing a letter of recommendation (we provide a work summary and template) and serving as a reference." },
    { n: 7, title: "Good faith.", body: "Honor the availability and terms you set, and treat your intern as the professional-in-training they are." },
    { n: 8, title: "What Olera is, and isn't.", body: "Olera connects you with motivated, screened students and structures the internship. Olera is not the employer, an insurer, or a guarantor. What you get is reliable talent who want to be there — at no cost." },
    { n: 9, title: "After the internship.", body: "If it's a good fit, you're encouraged to hire your intern on for the long term, using Olera however helps." },
    { n: 10, title: "Accepting.", body: "You accept by signing electronically when you send an offer. We record who accepted and when; updates require re-acknowledgment." },
  ],
  accepted: "Accepted by — Agency (entity) name  ·  authorized signer  ·  e-signature  ·  date",
};

const FAMILY = {
  title: "Olera Family Host Agreement",
  preamble:
    "Letting someone help with the person you love is the hardest trust there is. The students you'll meet through Olera chose caregiving because it's their calling — they show up because it matters to their future and because your parent matters now. You give them a real beginning; they give your family attentive, present care. And the parts that are new to you — being the employer, doing it safely — you won't figure out alone.",
  intro:
    "This agreement is between you (the Family Host) and Olera. It explains your role when you host an Olera intern in your home, what you commit to, and how we support you. It is the source of truth for hosting. There is no fee to you.",
  sections: [
    { n: 1, title: "What hosting is.", body: "You bring on an Olera intern — a vetted pre-health student — to help care for your family member." },
    { n: 2, title: "You are the employer.", body: "Because the care happens in your home and under your direction, you are the household employer: you set the schedule, pay, and supervision. This isn't a technicality — the person directing the care is rightly the one responsible for it.", note: "You hold this role because it's truly yours." },
    { n: 3, title: "We help you do it safely.", body: "Being a household employer — and handling liability and insurance — has real nuances, and it can be done simply and safely with the right documentation. You get our Quick-Start Household-Employer Guide and a 30-minute consultation with our team, so you're never figuring it out alone." },
    { n: 4, title: "Pay.", body: "You and your intern agree on pay. Olera may help you process payment — a convenience that does not make Olera the employer." },
    { n: 5, title: "Liability and insurance.", body: "Because you control the home and the care setting, liability and insurance are yours; Olera carries none. (The guide and consultation above are there to help you cover this properly.)" },
    { n: 6, title: "Your role in the internship — short, and meaningful.", body: "Verify your intern's hours honestly, leave a brief review after shifts, and — if your intern asks and you feel they earned it — consider writing a letter of recommendation (we'll give you a summary of their work and a ready template) and serving as a reference.", note: "Your honest word can launch a future nurse or doctor. It costs nothing and may mean everything." },
    { n: 7, title: "Good faith.", body: "Keep the availability you agree to, barring emergencies, and treat your intern as the professional-in-training they are." },
    { n: 8, title: "What Olera is, and isn't.", body: "Olera connects you with vetted students and structures the internship. Olera is not the employer, an insurer, or a guarantor. What you get is a motivated caregiver — and our help being a confident, safe employer — at no cost." },
    { n: 9, title: "After the internship.", body: "If it's a good fit, you're encouraged to keep your caregiver on for the long term, using Olera however helps." },
    { n: 10, title: "Accepting.", body: "You accept by signing electronically when you send your intern an offer. We record who accepted and when; updates require re-acknowledgment." },
  ],
  accepted: "Accepted by — Family Host name  ·  e-signature  ·  date",
};

async function main() {
  const pub = path.join(process.cwd(), "public");
  let logo;
  try {
    const buf = await fs.readFile(path.join(pub, "olera-logo.png"));
    logo = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    logo = undefined;
  }

  await fs.mkdir(path.join(pub, "medjobs"), { recursive: true });

  const intern = await renderToBuffer(doc({ logo, ...INTERN }));
  const agency = await renderToBuffer(doc({ logo, ...AGENCY }));
  const family = await renderToBuffer(doc({ logo, ...FAMILY }));

  // Intern → the single file every "read the internship agreement" button opens.
  await fs.writeFile(path.join(pub, "docs/internship-agreement-sample.pdf"), intern);
  // Agency → both host-facing button targets.
  await fs.writeFile(path.join(pub, "docs/host-agreement-sample.pdf"), agency);
  await fs.writeFile(path.join(pub, "medjobs/hosting-agreement.pdf"), agency);
  // Family → staged for when its surface exists (not yet wired to a button).
  await fs.writeFile(path.join(pub, "docs/family-host-agreement.pdf"), family);

  console.log("Wrote: internship (%d kb), agency x2 (%d kb), family (%d kb)",
    Math.round(intern.length / 1024), Math.round(agency.length / 1024), Math.round(family.length / 1024));
}

main().catch((e) => { console.error(e); process.exit(1); });
