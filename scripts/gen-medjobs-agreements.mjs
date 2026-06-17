/**
 * One-off generator for the MedJobs agreement PDFs (Intern, Agency Host,
 * Family Host) on Olera letterhead, using @react-pdf/renderer (no JSX so it
 * runs under plain `node`). Writes static PDFs to /public.
 *
 * Style: plain, short, ~5th-grade. Terms are information only. Warmth lives
 * only in the preamble. Almost no em dashes. One page each (verified below).
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
  page: { paddingTop: 30, paddingBottom: 40, paddingHorizontal: 46, fontFamily: "Helvetica", fontSize: 9.5, color: GRAY_700, lineHeight: 1.4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottomWidth: 0.75, borderBottomColor: GRAY_300, marginBottom: 12 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandLogo: { width: 18, height: 18, marginRight: 6 },
  brandWord: { fontSize: 16, fontFamily: "Helvetica-Bold", color: EMERALD_DARK, letterSpacing: 0.5 },
  headerTag: { fontSize: 7.5, color: GRAY_500, letterSpacing: 0.6, textTransform: "uppercase" },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", color: GRAY_900, marginBottom: 8 },
  preambleBox: { backgroundColor: GRAY_100, borderLeftWidth: 2, borderLeftColor: EMERALD, paddingVertical: 8, paddingHorizontal: 11, marginBottom: 10 },
  preamble: { color: GRAY_700, fontSize: 9.5, lineHeight: 1.4 },
  signoff: { fontFamily: "Helvetica-Bold", color: GRAY_900, fontSize: 9, marginTop: 5 },
  intro: { color: GRAY_700, marginBottom: 9 },
  section: { marginBottom: 5 },
  bold: { fontFamily: "Helvetica-Bold", color: GRAY_900 },
  accepted: { marginTop: 12, paddingTop: 9, borderTopWidth: 0.75, borderTopColor: GRAY_300, color: GRAY_900, fontFamily: "Helvetica-Bold", fontSize: 9.5 },
  footer: { position: "absolute", bottom: 20, left: 46, right: 46, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: GRAY_300, paddingTop: 5 },
  footerText: { fontSize: 7.5, color: GRAY_500 },
};

function section({ n, title, body }) {
  return h(View, { style: s.section, key: n },
    h(Text, { style: { color: GRAY_700 } }, h(Text, { style: s.bold }, `${n}. ${title} `), body));
}

function doc({ logo, title, preamble, intro, sections, accepted }) {
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
        h(Text, { style: s.signoff }, "Dr. Logan DuBose, MD"),
      ),
      h(Text, { style: s.intro }, intro),
      ...sections.map(section),
      h(Text, { style: s.accepted }, accepted),
      h(View, { style: s.footer, fixed: true },
        h(Text, { style: s.footerText }, "Draft for review. Not legally binding yet."),
        h(Text, { style: s.footerText }, "olera.care"),
      ),
    ),
  );
}

// ── Content (plain, ~5th-grade; terms are information only) ──────────────────
const INTERN = {
  title: "Olera Student Caregiver Internship — Intern Agreement",
  preamble:
    "You want a career in health care. To get there, you need real hours caring for patients. This internship helps you get those hours, prove they happened, and use them on your applications. Do good work, and we will help you show it.",
  intro:
    "This is the agreement between you (the intern) and Olera. It explains how the internship works and what you agree to. If you have a question about the internship, the answer is here.",
  sections: [
    { n: 1, title: "Who can join.", body: "You can join if you are in school now, or you finished school recently and plan to apply to a professional school. You must need patient-care hours. That is all." },
    { n: 2, title: "The fee.", body: "You pay $200 one time. You pay it only after a host offers you a spot and you accept. You never pay again. It covers you until you finish, no matter how many hosts or terms it takes." },
    { n: 3, title: "Before you start.", body: "First, finish our short training. Fill out your profile. Upload any documents we ask for. Do this before your first shift." },
    { n: 4, title: "Your host is your boss.", body: "A host is the family or agency you work for. Your host sets your schedule, pays you, and supervises you. Olera is not your boss and does not pay you. Agencies pay you through their payroll. Families pay you directly, and Olera may help send the payment." },
    { n: 5, title: "How your hours count.", body: "After each shift, you fill out a short report card. Your host checks it. At the end, Olera adds up your checked hours. Your checked hours stay yours, even if you stop working with a host." },
    { n: 6, title: "What you agree to do.", body: "Show up on time. Tell your host early if your plans change. Only do tasks you were trained for. Keep private things private. Keep your profile up to date so hosts know when you are free." },
    { n: 7, title: "What you get.", body: "You get hosts to work with, checked patient-care hours, reviews, references, and a letter of recommendation if a host feels you earned it. You also get help with your resume, your personal statement, and a practice interview." },
    { n: 8, title: "Your certificate.", body: "When you reach 120 checked hours and finish your training, Olera gives you a certificate. It shows what you did. You can use it on your applications." },
    { n: 9, title: "What Olera does and does not do.", body: "Olera connects you to hosts, keeps your records, and gives you the certificate. Olera is not your employer or your insurer. Olera does not promise you a job, pay, hours, or a school acceptance." },
    { n: 10, title: "After you finish.", body: "You can keep using Olera to work with families and agencies for as long as you want. Your application help stays free." },
    { n: 11, title: "Signing.", body: "You sign by clicking accept when you take your first offer. We save the date. If we change these terms, we will ask you to accept again." },
  ],
  accepted: "Accepted by:  Intern name ____________________   Signature ____________________   Date __________",
};

const AGENCY = {
  title: "Olera Agency Host Agreement",
  preamble:
    "Good caregivers are hard to find. Our interns are pre-health students who want to be there, because the work helps their future. You get reliable help at no cost. In return, you help train the next group of clinicians.",
  intro:
    "This is the agreement between your agency (the host) and Olera. It explains your part when you employ an Olera intern. There is no fee for you.",
  sections: [
    { n: 1, title: "What you do.", body: "You hire an Olera intern, a checked pre-health student, to work at your agency." },
    { n: 2, title: "Who can host.", body: "You confirm your agency is licensed or registered." },
    { n: 3, title: "You are the employer.", body: "The intern is your employee. You handle payroll, hiring steps, background checks, insurance, and following the law. This is your normal process." },
    { n: 4, title: "Pay.", body: "You pay the intern through your own payroll. Olera does not handle agency pay." },
    { n: 5, title: "Insurance and liability.", body: "Because you employ the intern, all insurance, liability, and legal duties are yours. Olera has none and does not direct the work." },
    { n: 6, title: "Your part in the internship.", body: "After shifts, check the intern's hours and leave a short review. If the intern asks and you feel they earned it, write a letter of recommendation. We give you a summary and a template to make it easy. You may also agree to be a reference." },
    { n: 7, title: "Good faith.", body: "Keep to the schedule you set. Treat the intern as a professional in training." },
    { n: 8, title: "What Olera does and does not do.", body: "Olera connects you to students and runs the internship. Olera is not the employer or insurer, and promises no outcomes. You get reliable help at no cost." },
    { n: 9, title: "After the internship.", body: "If it works out, you can hire the intern long term. You can keep using Olera." },
    { n: 10, title: "Signing.", body: "You sign by clicking accept when you send an offer. We save the date. If we change these terms, we will ask you to accept again." },
  ],
  accepted: "Accepted by:  Agency name ____________________   Authorized signer ____________________   Date __________",
};

const FAMILY = {
  title: "Olera Family Host Agreement",
  preamble:
    "Trusting someone to help care for the person you love is hard. Our interns are pre-health students who chose caregiving because it matters to them. They give your family attentive care, and you give them a real start. The parts that are new to you, like being an employer, we will help with.",
  intro:
    "This is the agreement between you (the family host) and Olera. It explains your part when an Olera intern helps care for your family member at home. There is no fee for you.",
  sections: [
    { n: 1, title: "What you do.", body: "You bring on an Olera intern, a checked pre-health student, to help care for your family member at home." },
    { n: 2, title: "You are the employer.", body: "The care happens in your home and you direct it. That makes you the employer. You set the schedule, pay, and supervision." },
    { n: 3, title: "We help you do this safely.", body: "Being an employer at home has rules about pay, taxes, and insurance. It can be done simply with the right steps. We give you a short guide and a 30-minute call with our team, so you are not alone." },
    { n: 4, title: "Pay.", body: "You and the intern agree on pay. Olera may help you send the payment. That does not make Olera the employer." },
    { n: 5, title: "Insurance and liability.", body: "You control your home and the care, so insurance and liability are yours. Olera has none. Our guide and call help you cover this the right way." },
    { n: 6, title: "Your part in the internship.", body: "After shifts, check the intern's hours and leave a short review. If the intern asks and you feel they earned it, write a letter of recommendation. We give you a summary and a template to make it easy. You may also agree to be a reference." },
    { n: 7, title: "Good faith.", body: "Keep to the schedule you agree on, unless there is an emergency. Treat the intern as a professional in training." },
    { n: 8, title: "What Olera does and does not do.", body: "Olera connects you to students and runs the internship. Olera is not the employer or insurer, and promises no outcomes. You get a caring helper and our support, at no cost." },
    { n: 9, title: "After the internship.", body: "If it works out, you can keep the caregiver long term. You can keep using Olera." },
    { n: 10, title: "Signing.", body: "You sign by clicking accept when you send an offer. We save the date. If we change these terms, we will ask you to accept again." },
  ],
  accepted: "Accepted by:  Family name ____________________   Signature ____________________   Date __________",
};

function pageCount(buf) {
  return (buf.toString("latin1").match(/\/Type\s*\/Page(?![s])/g) || []).length;
}

async function main() {
  const pub = path.join(process.cwd(), "public");
  let logo;
  try {
    const b = await fs.readFile(path.join(pub, "olera-logo.png"));
    logo = `data:image/png;base64,${b.toString("base64")}`;
  } catch {
    logo = undefined;
  }
  await fs.mkdir(path.join(pub, "medjobs"), { recursive: true });

  const intern = await renderToBuffer(doc({ logo, ...INTERN }));
  const agency = await renderToBuffer(doc({ logo, ...AGENCY }));
  const family = await renderToBuffer(doc({ logo, ...FAMILY }));

  await fs.writeFile(path.join(pub, "docs/internship-agreement-sample.pdf"), intern);
  await fs.writeFile(path.join(pub, "docs/host-agreement-sample.pdf"), agency);
  await fs.writeFile(path.join(pub, "medjobs/hosting-agreement.pdf"), agency);
  await fs.writeFile(path.join(pub, "docs/family-host-agreement.pdf"), family);

  console.log("Pages — intern: %d, agency: %d, family: %d", pageCount(intern), pageCount(agency), pageCount(family));
}

main().catch((e) => { console.error(e); process.exit(1); });
