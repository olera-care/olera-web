/* eslint-disable react/no-unknown-property */
/**
 * The student recruitment flyer — the page an advising office actually
 * forwards.
 *
 * It is appended to the advising document rather than kept separately,
 * because the whole ask of that document is "share this with your students",
 * and an office that has to reply and wait for an attachment is an office
 * that shares it next week or not at all.
 *
 * The design is the one the team already uses and likes: a deep teal band,
 * a serif headline, two columns of reasons beside a portrait, three numbered
 * steps, and a cream footer carrying the QR. Two things differ from the
 * original. The headline reads "Open Caregiving Jobs" rather than "We're
 * Hiring", because Olera is not the employer — the local agency is, and a
 * flyer that says otherwise is the first thing a careful advising office
 * would catch. And the opening line names the work instead of describing it
 * in the abstract.
 *
 * The headline is set in Times-Bold. @react-pdf ships three font families
 * and fetching a fourth is the one step in a render that can fail in a
 * serverless runtime; a flyer set in Times always generates.
 */

import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, Svg, Path, Font } from "@react-pdf/renderer";
import type { ProgramPdfAssets } from "./Template";

// No hyphenation. @react-pdf breaks a word at the column edge by default,
// which turned "Create Your Olera Profile" into "Pro-file" and an email
// address into "chantel@ol-era.care" — a hyphen inside an address somebody
// is meant to read off a printed page.
Font.registerHyphenationCallback((word) => [word]);

// Sampled from the team's own flyer rather than guessed, so the two sit
// beside each other without a colour shift.
const TEAL = "#166963";
const TEAL_DARK = "#0f4f4a";
const CREAM = "#f6f5ee";
const GRAY_900 = "#111827";
const GRAY_700 = "#374151";
const GRAY_600 = "#4b5563";
const WHITE = "#ffffff";

const styles = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0, fontFamily: "Helvetica", color: GRAY_700 },

  // ── the teal band ─────────────────────────────────────────────────────
  band: { backgroundColor: TEAL, paddingTop: 20, paddingBottom: 22, paddingHorizontal: 34 },
  // The top line: what this page is on the left, whose it is on the right.
  // An office forwarding it should be able to tell at a glance that this is
  // the student-facing sheet and not the letter that came with it.
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  stamp: {
    fontSize: 7.5,
    color: "#7fb3ad",
    letterSpacing: 1.6,
    fontFamily: "Helvetica-Bold",
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandLogo: { width: 15, height: 15, marginRight: 5 },
  brandWord: { fontSize: 12, fontFamily: "Helvetica-Bold", color: WHITE, letterSpacing: 0.3 },
  brandRule: { width: 1, height: 12, backgroundColor: "#4d8f89", marginHorizontal: 8 },
  brandProgram: { fontSize: 8.5, color: "#bcd9d6", letterSpacing: 0.9 },
  hero: {
    fontFamily: "Times-Bold",
    fontSize: 54,
    color: WHITE,
    textAlign: "center",
    lineHeight: 1.06,
    marginTop: 2,
  },
  heroSub: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 12.5,
    color: WHITE,
    textAlign: "center",
    lineHeight: 1.35,
    marginTop: 8,
    marginHorizontal: 16,
  },
  pillWrap: { alignItems: "center", marginTop: 12 },
  pill: {
    borderWidth: 1.2,
    borderColor: WHITE,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 22,
    backgroundColor: WHITE,
  },
  pillText: { fontSize: 11.5, color: TEAL, fontFamily: "Helvetica-Bold", letterSpacing: 0.2 },

  // ── body ──────────────────────────────────────────────────────────────
  body: { paddingHorizontal: 34, paddingTop: 18 },
  lede: {
    fontSize: 12.5,
    color: GRAY_900,
    textAlign: "center",
    lineHeight: 1.42,
    marginHorizontal: 8,
    marginBottom: 18,
  },
  cols: { flexDirection: "row" },
  colLeft: { flex: 1.35, paddingRight: 18 },
  colRight: { flex: 1 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", color: GRAY_900, marginBottom: 6 },
  bullet: { flexDirection: "row", marginBottom: 3.5, paddingRight: 6 },
  dot: { fontSize: 10, color: GRAY_900, marginRight: 6, marginTop: 0.5 },
  bulletText: { flex: 1, fontSize: 10.5, color: GRAY_700, lineHeight: 1.35 },

  // ── the portrait card ─────────────────────────────────────────────────
  card: { backgroundColor: CREAM, borderRadius: 10, padding: 14, alignItems: "center" },
  photo: { width: 118, height: 118, borderRadius: 59, objectFit: "cover" },
  quote: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 9.5,
    color: TEAL,
    textAlign: "center",
    lineHeight: 1.4,
    marginTop: 12,
  },
  name: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: GRAY_900, marginTop: 10, textAlign: "center" },
  role: { fontSize: 9.5, color: GRAY_600, textAlign: "center", lineHeight: 1.35 },

  // ── how to apply ──────────────────────────────────────────────────────
  applyHead: { fontSize: 14, fontFamily: "Helvetica-Bold", color: GRAY_900, marginTop: 22, marginBottom: 9 },
  stepRow: { flexDirection: "row" },
  step: {
    flex: 1,
    backgroundColor: CREAM,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  stepGap: { width: 10 },
  stepNum: { fontSize: 23, fontFamily: "Helvetica-Bold", color: TEAL, marginRight: 8 },
  stepRule: { width: 1, alignSelf: "stretch", backgroundColor: "#d8d6c9", marginRight: 8 },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: GRAY_900, marginBottom: 2 },
  stepText: { fontSize: 9, color: GRAY_600, lineHeight: 1.35 },

  // ── the cream footer ──────────────────────────────────────────────────
  footer: {
    marginTop: "auto",
    backgroundColor: CREAM,
    paddingVertical: 22,
    paddingHorizontal: 34,
    flexDirection: "row",
    alignItems: "center",
  },
  footerLeft: { flex: 1, paddingRight: 20 },
  ready: { fontSize: 25, fontFamily: "Helvetica-Bold", color: TEAL, marginBottom: 4 },
  readySub: { fontSize: 10.5, color: GRAY_700, lineHeight: 1.35 },
  hr: { height: 0.75, backgroundColor: "#d8d6c9", marginTop: 12, marginBottom: 12, width: "72%" },
  askRow: { flexDirection: "row", alignItems: "flex-start" },
  mailCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  askTitle: { fontSize: 11.5, fontFamily: "Helvetica-Bold", color: GRAY_900, marginBottom: 2 },
  askBody: { fontSize: 10.5, color: GRAY_700, lineHeight: 1.35 },
  askEmail: { fontFamily: "Helvetica-Bold", color: GRAY_900 },
  qrWrap: { alignItems: "center" },
  qr: { width: 108, height: 108 },
  qrUrl: { fontSize: 10, fontFamily: "Helvetica-Bold", color: GRAY_900, marginTop: 7 },
});

const WHY = [
  "Get paid while gaining experience",
  "Work around your class schedule",
  "Build hands-on caregiving experience",
  "Strengthen your professional school application",
  "Earn references + a recommendation letter",
];

const BUILT_FOR = [
  "Mentorship from Dr. Logan DuBose",
  "Guidance for your path to professional school",
  "Personal statement & application support",
  "Mock interview preparation",
];

const STEPS = [
  { n: "1", title: "Check Your Eligibility", body: "Check your eligibility in a few minutes." },
  { n: "2", title: "Create Your Olera Profile", body: "Apply, complete your profile, and get screened." },
  { n: "3", title: "Get Matched & Earn", body: "Get matched with a local care provider and start your shifts." },
];

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.dot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

/** A drawn envelope. Helvetica has no envelope glyph, and a missing glyph
 *  renders as nothing at all rather than as a visible mistake. */
function MailIcon() {
  return (
    <Svg width={15} height={11} viewBox="0 0 24 18">
      <Path
        d="M2 1h20v16H2z"
        stroke={WHITE}
        strokeWidth={2}
        fill="none"
      />
      <Path d="M2 2l10 8 10-8" stroke={WHITE} strokeWidth={2} fill="none" />
    </Svg>
  );
}

/**
 * The flyer as a standalone page, so it can be the last page of the advising
 * document and a document of its own without the content being written twice.
 */
export function RecruitFlyerPage({ assets }: { assets: ProgramPdfAssets }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.band}>
        <View style={styles.topRow}>
          <Text style={styles.stamp}>STUDENT RECRUITMENT FLYER</Text>
          <View style={styles.brandRow}>
            {assets.oleraLogoDataUri ? (
              /* eslint-disable-next-line jsx-a11y/alt-text */
              <Image src={assets.oleraLogoDataUri} style={styles.brandLogo} />
            ) : null}
            <Text style={styles.brandWord}>Olera</Text>
            <View style={styles.brandRule} />
            <Text style={styles.brandProgram}>Student Caregiver Program</Text>
          </View>
        </View>
        <Text style={styles.hero}>Open Caregiving Jobs</Text>
        <Text style={styles.heroSub}>
          Get paid, hands-on caregiving experience, and build your future career in healthcare.
        </Text>
        <View style={styles.pillWrap}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Pre-Med • Pre-Nursing • Pre-PA • Pre-Health</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.lede}>
          Help older adults in your community with medication reminders, supervision,
          companionship, transfers and other bedside skills — and build your future career as a
          healthcare professional.
        </Text>

        <View style={styles.cols}>
          <View style={styles.colLeft}>
            <Text style={styles.h2}>Why Join the Program:</Text>
            {WHY.map((b) => (
              <Bullet key={b}>{b}</Bullet>
            ))}
            <Text style={[styles.h2, { marginTop: 14 }]}>Built for Pre-Health Students</Text>
            {BUILT_FOR.map((b) => (
              <Bullet key={b}>{b}</Bullet>
            ))}
          </View>

          <View style={styles.colRight}>
            <View style={styles.card}>
              {assets.loganPhotoDataUri ? (
                /* eslint-disable-next-line jsx-a11y/alt-text */
                <Image src={assets.loganPhotoDataUri} style={styles.photo} />
              ) : null}
              <Text style={styles.quote}>
                “We believe in empowering the next generation of healthcare professionals.”
              </Text>
              <Text style={styles.name}>Dr. Logan DuBose, MD, MBA</Text>
              <Text style={styles.role}>Primary Care Physician</Text>
              <Text style={styles.role}>Co-Founder, Olera</Text>
            </View>
          </View>
        </View>

        <Text style={styles.applyHead}>How to apply</Text>
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              {i > 0 && <View style={styles.stepGap} />}
              <View style={styles.step}>
                <Text style={styles.stepNum}>{s.n}</Text>
                <View style={styles.stepRule} />
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepText}>{s.body}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.ready}>Ready to get started?</Text>
          <Text style={styles.readySub}>
            Scan to check your eligibility and create your Olera profile.
          </Text>
          <View style={styles.hr} />
          <View style={styles.askRow}>
            <View style={styles.mailCircle}>
              <MailIcon />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.askTitle}>Have Questions:</Text>
              <Text style={styles.askBody}>
                Contact our Student Coordinator, Chantel Wright, at{" "}
                <Text style={styles.askEmail}>chantel@olera.care</Text>
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.qrWrap}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={assets.recruitQrDataUri ?? assets.qrDataUri} style={styles.qr} />
          {/* The printed address has to be where the QR goes. The student
              application lives on the families board behind the eligibility
              screener — studentApplyUrl() is the one thing that knows that,
              and a second guess here would be wrong the day it moves. */}
          <Text style={styles.qrUrl}>olera.care/medjobs/families</Text>
        </View>
      </View>
    </Page>
  );
}

/** The same page on its own, for anyone who wants only the flyer. */
export function RecruitFlyerDocument({ assets }: { assets: ProgramPdfAssets }) {
  return (
    <Document title="Olera · Open Caregiving Jobs" author="Olera">
      <RecruitFlyerPage assets={assets} />
    </Document>
  );
}
