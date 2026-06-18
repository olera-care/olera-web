/**
 * Generates the MedJobs agreement PDFs (Student + Host) on Olera letterhead
 * using @react-pdf/renderer (no JSX, runs under plain `node`). Each agreement
 * also serves as the "how it works" explainer: plain language, the journey in
 * order, what you agree to at each step, and what Olera does and does not do.
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

const st = {
  page: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 52, fontFamily: "Helvetica", fontSize: 10.5, color: GRAY_700, lineHeight: 1.5 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottomWidth: 0.75, borderBottomColor: GRAY_300, marginBottom: 14 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandLogo: { width: 18, height: 18, marginRight: 6 },
  brandWord: { fontSize: 16, fontFamily: "Helvetica-Bold", color: EMERALD_DARK, letterSpacing: 0.5 },
  headerTag: { fontSize: 7.5, color: GRAY_500, letterSpacing: 0.6, textTransform: "uppercase" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", color: GRAY_900, marginBottom: 6 },
  lead: { color: GRAY_700, marginBottom: 6 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", color: GRAY_900, marginTop: 12, marginBottom: 5 },
  p: { color: GRAY_700, marginBottom: 6 },
  pMt: { color: GRAY_700, marginTop: 4, marginBottom: 0 },
  step: { marginBottom: 7 },
  bullet: { color: GRAY_700, marginBottom: 3, paddingLeft: 12 },
  bold: { fontFamily: "Helvetica-Bold", color: GRAY_900 },
  sign: { marginTop: 16, paddingTop: 10, borderTopWidth: 0.75, borderTopColor: GRAY_300, color: GRAY_900, fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  footer: { position: "absolute", bottom: 22, left: 52, right: 52, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: GRAY_300, paddingTop: 5 },
  footerText: { fontSize: 7.5, color: GRAY_500 },
};

// A bullet item is a string, or [boldLead, rest].
function bulletEl(item, key) {
  const body = Array.isArray(item)
    ? [h(Text, { style: st.bold, key: "b" }, item[0] + " "), item[1]]
    : [item];
  return h(Text, { style: st.bullet, key }, "•  ", ...body);
}

function blockEl(b, i) {
  if (b.lead) return h(Text, { style: st.lead, key: i }, b.lead);
  if (b.h2) return h(Text, { style: st.h2, key: i }, b.h2);
  if (b.p) return h(Text, { style: st.p, key: i }, b.p);
  if (b.pkv) return h(Text, { style: st.p, key: i }, h(Text, { style: st.bold }, b.pkv[0] + " "), b.pkv[1]);
  if (b.bullets) return h(View, { key: i, style: { marginBottom: 4 } }, ...b.bullets.map((it, j) => bulletEl(it, j)));
  if (b.sign) return h(Text, { style: st.sign, key: i }, b.sign);
  if (b.step) {
    const { n, title, body, bullets } = b.step;
    const paras = body ? String(body).split("\n\n") : [];
    const children = [];
    children.push(h(Text, { style: st.p, key: "t" }, h(Text, { style: st.bold }, `${n}. ${title} `), paras[0] || ""));
    for (let k = 1; k < paras.length; k++) children.push(h(Text, { style: st.pMt, key: "p" + k }, paras[k]));
    if (bullets) bullets.forEach((it, j) => children.push(bulletEl(it, "b" + j)));
    return h(View, { style: st.step, key: i }, ...children);
  }
  return null;
}

function docEl({ logo, tag, title, blocks }) {
  return h(Document, null,
    h(Page, { size: "LETTER", style: st.page },
      h(View, { style: st.headerRow },
        h(View, { style: st.brandRow },
          logo ? h(Image, { src: logo, style: st.brandLogo }) : null,
          h(Text, { style: st.brandWord }, "Olera"),
        ),
        h(Text, { style: st.headerTag }, tag),
      ),
      h(Text, { style: st.title }, title),
      ...blocks.map(blockEl),
      h(View, { style: st.footer, fixed: true },
        h(Text, { style: st.footerText }, "Draft for review. Not legally binding yet."),
        h(Text, { style: st.footerText }, "olera.care"),
      ),
    ),
  );
}

// ── Student ──────────────────────────────────────────────────────────────────
const STUDENT = {
  tag: "Student Caregiver Internship",
  title: "Olera Student Caregiver Internship Agreement",
  blocks: [
    { lead: "This agreement explains how the Olera internship works and what you agree to when you join. It is written for you, the student. If you ever have a question about how the internship works, this is the place to find the answer. Please read it before you accept your first host." },
    { h2: "What the internship is" },
    { p: "The internship is a way to get real, paid experience caring for people, and to prove that experience so you can use it on your applications to medical, nursing, PA, and other health programs. You work for a local host. You earn hours. We help you track those hours, get them verified, and turn them into a credential and a stronger application." },
    { p: "Olera runs the internship and keeps your records. Olera does not employ you. Your host does. More on that below." },
    { h2: "How it works, step by step" },
    { step: { n: 1, title: "You join.", body: "You can join if you are in school now, or if you finished school recently and plan to apply to a professional school, and you need patient-care hours. When you join, you confirm that this is true. There is nothing else you need to qualify." } },
    { step: { n: 2, title: "You find a host and accept an offer.", body: "A host is who you will work for. A host is either a family who needs care for a loved one, or a care agency. You browse the hosts near you who are looking for help, and you can talk with a host before you decide. When a host wants to work with you, they send you an offer. You choose the offer you want and accept it. You are never required to accept an offer." } },
    { step: { n: 3, title: "You pay once and sign.", body: "When you accept your first offer, you pay a one-time fee of $200 and sign this agreement. This is the only fee you will ever pay. It covers the whole internship, no matter how many hosts you work with or how many terms it takes you to finish. You only pay after a host has offered you a spot and you have accepted, so you never pay for something that has not happened yet." } },
    { step: { n: 4, title: "You get ready before your first shift.", body: "Before you start working, you complete a short training, fill out your profile, and upload any documents we ask for, such as proof of certifications. You agree to finish these before your first shift. This keeps you and the person you care for safe." } },
    { step: { n: 5, title: "You work your shifts.", body: "You and your host agree on your schedule and your pay. Your host is your employer. That means your host sets your hours, pays you, and supervises your work. If your host is an agency, they pay you through their payroll. If your host is a family, they pay you directly, and Olera can help send the payment. Olera does not set your pay and does not pay you.\n\nWhile you work, you agree to:", bullets: ["show up on time, and tell your host early if your plans change", "only do tasks you have been trained for", "keep private what you learn about the person you care for", "keep your profile up to date, so hosts know when you are available and which hosts you are working with"] } },
    { step: { n: 6, title: "You log your hours, and your host checks them.", body: "After each shift, you fill out a short report card. It lists the date, how long you worked, and what you did. Your host reviews it and confirms it is correct. You agree to log your hours honestly. This step is what turns the time you worked into hours you can prove." } },
    { step: { n: 7, title: "Your hours add up and stay yours.", body: "Olera keeps a running total of the hours your hosts have confirmed. You can see your total at any time. Your confirmed hours belong to you. They stay yours even if you stop working with a host or move to a new one.\n\nIf a host does not confirm a shift right away, that shift waits as pending. At the end of your time with a host, your host confirms your full total. If there is ever a disagreement about a shift, Olera will help you and your host work it out." } },
    { step: { n: 8, title: "You finish and get your certificate.", body: "When you reach 120 confirmed hours and complete your training, Olera gives you a certificate. The certificate shows the hours you worked, and that your reviews, references, and any letters were verified. You can use it on your applications." } },
    { step: { n: 9, title: "You can keep going after you finish.", body: "After the internship, you are welcome to keep using Olera to work with families and agencies for as long as you want. Your application help stays free." } },
    { h2: "What you get" },
    { bullets: ["hosts to work with near you", "confirmed patient-care hours you can prove", "reviews from your hosts", "references, if a host had a good experience with you", "a letter of recommendation, if a host feels you earned one. Olera gives the host a short summary of your work and a template to make it easy. You ask for the letter, and the host decides.", "your certificate", "help with your resume, your personal statement, and a practice interview"] },
    { h2: "What Olera does, and does not do" },
    { pkv: ["Olera does:", "connect you with hosts, keep your records and your hours, and give you your certificate and your application help."] },
    { pkv: ["Olera does not:", "employ you or pay you (your host does), act as your insurer, or promise you a job, a certain amount of pay, a certain number of hours, or admission to any school."] },
    { h2: "A few more things to know" },
    { bullets: [["When you pay:", "only after you accept a real offer. Never before."], ["More than one host:", "the $200 covers all of them. Most students start with one."], ["If it does not work out with a host:", "you can stop and find another. The hours you already earned stay yours."], ["If we change these terms:", "we will tell you and ask you to accept the new version."], ["Your privacy:", "we handle your information under our privacy policy."]] },
    { h2: "Your agreement" },
    { p: "When you click accept, you are signing this agreement. You confirm that you have read it, that you qualify to join, and that you agree to how the internship works as described here. We record the date you accepted." },
    { sign: "Accepted by:   Student name ____________________    Date __________" },
  ],
};

// ── Host (covers family and agency; differences marked inline) ───────────────
const HOST = {
  tag: "Caregiver Internship · Hosts",
  title: "Olera Host Agreement",
  blocks: [
    { lead: "This agreement explains how it works to host an Olera intern, and what you agree to. It is written for you, the host. A host is either a family caring for a loved one at home, or a care agency. Most of this is the same for both. Where it is different, we say so. There is no fee to host." },
    { h2: "What hosting is" },
    { p: "You bring on an Olera intern, a pre-health student who wants real caregiving experience, to help with care. You are their employer. Olera connects you with the student, runs the internship, and keeps the records. Olera is not the employer and is not involved in the care itself. More on that below." },
    { h2: "How it works, step by step" },
    { step: { n: 1, title: "You decide to host.", bullets: ["If you are an agency: you confirm you are a licensed or registered care agency.", "If you are a family: you are hosting an intern in your own home to help care for a family member."] } },
    { step: { n: 2, title: "You find a student and send an offer.", body: "You browse students near you and can talk with them first. When you find one you want, you send an offer. When you send the offer, you sign this agreement and agree to what is in it." } },
    { step: { n: 3, title: "You are the employer.", body: "The student works for you. You set the schedule, you pay them, and you supervise the work.", bullets: ["If you are an agency: you handle this through your normal operations: payroll, hiring steps, background checks, insurance, and following the laws that apply to you.", "If you are a family: you are a household employer. This is new for most families, and it has rules about pay, taxes, and insurance. It can be done simply and safely with the right steps. Olera gives you a short guide and a 30-minute call with our team, so you are not doing it alone."] } },
    { step: { n: 4, title: "The student works their shifts.", body: "You and the student agree on the schedule and the work. You supervise them and treat them as a professional in training. You keep to the schedule you agreed on, except in an emergency." } },
    { step: { n: 5, title: "You pay the student.", bullets: ["If you are an agency: you pay through your own payroll. Olera does not handle your pay.", "If you are a family: you and the student agree on pay, and you pay them directly. Olera can help you send the payment. That help does not make Olera the employer."] } },
    { step: { n: 6, title: "You check the student's hours and leave a review.", body: "After each shift, the student fills out a short report card with the date, the time worked, and what they did. You review it and confirm it is correct. You agree to do this honestly and on time. Your reviews help the student build a record they can use." } },
    { step: { n: 7, title: "At the end, you confirm the total and consider a letter.", body: "When the student finishes their time with you, you confirm their total hours. If the student asks, and you feel they earned it, you consider writing a letter of recommendation. Olera gives you a summary of their work and a template to make it easy. You may also agree to be a reference. Whether to write a letter or be a reference is always your choice." } },
    { step: { n: 8, title: "After the internship.", body: "If it works out, you are welcome to keep the student on for the long term, and to keep using Olera." } },
    { h2: "Who is responsible for what" },
    { bullets: ["You (the host): employ the student, set the schedule and pay, supervise the work, and confirm the hours.", "The student: does the care, logs each shift, and keeps their profile current.", "Olera: connects you with students, runs the internship, keeps the records, and (for families) helps you host safely."] },
    { h2: "Insurance and liability" },
    { bullets: ["If you are an agency: because the student is your employee, all insurance, liability, and legal duties are yours. Olera carries none.", "If you are a family: because the care happens in your home and you direct it, insurance and liability are yours. Olera carries none. The guide and the call we give you are there to help you cover this the right way."] },
    { h2: "What Olera does, and does not do" },
    { p: "Olera does: connect you with students, run the internship, keep the records, and help family hosts do this safely." },
    { p: "Olera does not: employ the student, pay the student (you do), act as an insurer, or promise any outcome." },
    { h2: "A few more things to know" },
    { bullets: [["No fee:", "there is no fee to host."], ["Your choice:", "you are never required to send an offer or to keep a student."], ["If we change these terms:", "we will tell you and ask you to accept the new version."], ["Your privacy:", "we handle your information under our privacy policy."]] },
    { h2: "Your agreement" },
    { p: "When you send an offer, you are signing this agreement. You confirm that you have read it, that the role of employer is yours, and that you agree to how hosting works as described here. We record the date you accepted." },
    { sign: "Accepted by:   Host name ____________________    Date __________" },
  ],
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

  const student = await renderToBuffer(docEl({ logo, ...STUDENT }));
  const host = await renderToBuffer(docEl({ logo, ...HOST }));

  await fs.writeFile(path.join(pub, "docs/internship-agreement-sample.pdf"), student);
  await fs.writeFile(path.join(pub, "docs/host-agreement-sample.pdf"), host);
  await fs.writeFile(path.join(pub, "medjobs/hosting-agreement.pdf"), host);

  console.log("Pages — student: %d, host: %d", pageCount(student), pageCount(host));
}

main().catch((e) => { console.error(e); process.exit(1); });
