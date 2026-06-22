/* eslint-disable react/no-unknown-property */
/**
 * One-page React-PDF document for the provider outreach attachment.
 *
 * Renders from a ProgramPdfConfig — no university-specific code
 * here. The renderer is letter-paper (8.5"×11"), six vertical
 * sections, Olera-emerald primary accent + per-config secondary
 * accent. Tight whitespace; healthcare-clinical visual language
 * (no gradients, no flashy chrome).
 *
 * Photos + QR are passed in as base64 data URIs because
 * @react-pdf/renderer's <Image> needs in-memory bytes when running
 * in a serverless context (no implicit network fetch).
 */

import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { ProgramPdfConfig } from "./configs";

// Olera primary accent. Per-config university accent is layered
// on top for the top-rule + university wordmark.
const EMERALD = "#059669";
const EMERALD_DARK = "#047857";
const GRAY_900 = "#111827";
const GRAY_700 = "#374151";
const GRAY_500 = "#6b7280";
const GRAY_300 = "#d1d5db";
const GRAY_100 = "#f3f4f6";

// Font: @react-pdf/renderer's built-in Helvetica family. Looks
// clean + healthcare-adjacent without an external font fetch
// (Google Fonts URLs aren't reliable inside serverless / sandbox
// runtimes). If we ever need Inter specifically, register the
// font from a self-hosted /public/fonts/ path.

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: GRAY_700,
    lineHeight: 1.4,
  },
  // ── Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
    borderBottomWidth: 0.75,
    borderBottomColor: GRAY_300,
    marginBottom: 12,
  },
  brandWord: {
    fontSize: 16,
    fontWeight: 700,
    color: EMERALD_DARK,
    letterSpacing: 0.5,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandLogo: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  brandTag: {
    fontSize: 8,
    color: GRAY_500,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  universityWord: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 0.5,
    textAlign: "right",
    textTransform: "uppercase",
  },
  universityTag: {
    fontSize: 8,
    color: GRAY_500,
    textAlign: "right",
    marginTop: 2,
  },
  // ── Title + hero
  titleBlock: {
    marginBottom: 10,
  },
  programTitle: {
    fontSize: 22,
    color: GRAY_900,
    lineHeight: 1.15,
  },
  programSubtitle: {
    fontSize: 10.5,
    color: EMERALD_DARK,
    marginTop: 3,
  },
  hero: {
    backgroundColor: GRAY_100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: EMERALD,
    marginBottom: 12,
    borderRadius: 3,
  },
  heroHeadline: {
    fontSize: 12,
    color: GRAY_900,
    marginBottom: 5,
    lineHeight: 1.3,
  },
  heroBody: {
    fontSize: 9.5,
    color: GRAY_700,
    lineHeight: 1.5,
  },
  // ── Section
  sectionHeader: {
    fontSize: 8.5,
    color: EMERALD_DARK,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  // ── Benefits grid
  benefitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    marginHorizontal: -5,
  },
  benefitCell: {
    width: "50%",
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  benefitInner: {
    paddingVertical: 3,
    paddingLeft: 9,
    borderLeftWidth: 2,
    borderLeftColor: EMERALD,
  },
  benefitTitle: {
    fontSize: 10,
    color: GRAY_900,
    marginBottom: 2,
  },
  benefitBody: {
    fontSize: 9,
    color: GRAY_700,
    lineHeight: 1.4,
  },
  // ── Steps row
  stepsRow: {
    flexDirection: "row",
    marginBottom: 10,
    marginHorizontal: -3,
  },
  stepCell: {
    flex: 1,
    paddingHorizontal: 3,
  },
  stepInner: {
    backgroundColor: "#FFFFFF",
    borderWidth: 0.75,
    borderColor: GRAY_300,
    borderRadius: 3,
    padding: 7,
    // Fixed minHeight so all four boxes match regardless of how
    // each step text wraps. Sized for one step-number line + a
    // two-line subtext line at the current font/lineHeight, with
    // a touch of breathing room.
    minHeight: 56,
  },
  stepNumber: {
    fontSize: 11,
    color: EMERALD_DARK,
    marginBottom: 3,
  },
  stepText: {
    fontSize: 8.5,
    color: GRAY_700,
    lineHeight: 1.4,
  },
  // ── Vetting bullets
  vettingBlock: {
    marginBottom: 8,
  },
  vettingRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bullet: {
    width: 8,
    color: EMERALD,
  },
  vettingText: {
    flex: 1,
    fontSize: 9,
    color: GRAY_700,
    lineHeight: 1.4,
  },
  // ── Participation & pricing
  pricingBlock: {
    backgroundColor: GRAY_100,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: EMERALD,
    marginBottom: 10,
    borderRadius: 3,
  },
  pricingHeadline: {
    fontSize: 10,
    color: GRAY_900,
    marginBottom: 3,
    lineHeight: 1.3,
  },
  pricingBody: {
    fontSize: 9,
    color: GRAY_700,
    lineHeight: 1.4,
  },
  // ── Footer / signatures
  footer: {
    flexDirection: "row",
    paddingTop: 10,
    borderTopWidth: 0.75,
    borderTopColor: GRAY_300,
  },
  sigsCol: {
    flex: 1,
    flexDirection: "row",
  },
  sigBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    // v9.1 Graize 05.13 audit (Item 2C): wider gap between the two
    // signature blocks so Logan's longer credential ("Director,
    // Olera's Texas A&M Student Caregiver Program") can't bleed into
    // Graize's photo. Was 8.
    paddingRight: 14,
  },
  // v9.1 Graize 05.13 audit (Item 2C): inner text column needs an
  // explicit flex + minWidth:0 so React-PDF wraps the credential
  // lines inside its own sigBlock rather than overflowing into the
  // neighboring block. Without this the text can spill rightward.
  sigText: {
    flex: 1,
    minWidth: 0,
  },
  sigPhoto: {
    width: 38,
    height: 38,
    borderRadius: 3,
    marginRight: 7,
  },
  sigName: {
    fontSize: 9,
    color: GRAY_900,
  },
  sigCred: {
    fontSize: 8,
    color: GRAY_500,
    marginTop: 1,
    lineHeight: 1.3,
  },
  ctaCol: {
    width: 130,
    alignItems: "flex-end",
    paddingLeft: 12,
  },
  qrImage: {
    width: 64,
    height: 64,
    marginBottom: 3,
  },
  ctaLabel: {
    fontSize: 8.5,
    color: GRAY_900,
    textAlign: "right",
    marginBottom: 1,
  },
  ctaUrl: {
    fontSize: 7.5,
    color: EMERALD_DARK,
    textAlign: "right",
  },
});

export interface ProgramPdfAssets {
  loganPhotoDataUri?: string;
  graziePhotoDataUri?: string;
  /** Olera logo (square PNG, ~275×286). Rendered next to the
   *  "olera" wordmark in the header. Optional so a missing asset
   *  still produces a renderable PDF (text-only wordmark). */
  oleraLogoDataUri?: string;
  qrDataUri: string;
}

export function ProgramPdfTemplate({
  config,
  assets,
}: {
  config: ProgramPdfConfig;
  assets: ProgramPdfAssets;
}) {
  // Provider defaults — the student config overrides each of these.
  const subtitle =
    config.subtitle ??
    "A Student Caregiver Program that matches vetted student caregivers to your recurring shifts";
  // Descriptive, non-possessive default. The header pairs this with the
  // university name; "<University> · Student Caregiver Program" would imply
  // the university runs the program, so the tagline describes the audience
  // instead.
  const universityTagLine = config.universityTagLine ?? "Paid caregiving program";
  const headers = config.sectionHeaders ?? {
    benefits: "Why agencies participate",
    steps: "How it works",
    vetting: "Student vetting",
    pricing: "Participation & pricing",
  };
  return (
    <Document
      title="Olera's Student Caregiver Program"
      author="Olera"
      subject={config.documentSubject ?? "Provider outreach packet"}
    >
      <Page size="LETTER" style={styles.page}>
        {/* ── Header row */}
        {/* v9.1 Graize 05.13 audit (Item 11): logo rendered next to
            the "olera" wordmark when the asset is available. */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.brandRow}>
              {assets.oleraLogoDataUri ? (
                <Image src={assets.oleraLogoDataUri} style={styles.brandLogo} />
              ) : null}
              <Text style={styles.brandWord}>Olera</Text>
            </View>
            <Text style={styles.brandTag}>Student Caregiver Program</Text>
          </View>
          <View>
            <Text
              style={[
                styles.universityWord,
                { color: config.universityAccent },
              ]}
            >
              {config.universityName}
            </Text>
            <Text style={styles.universityTag}>{universityTagLine}</Text>
          </View>
        </View>

        {/* ── Title */}
        {/* Title is "Olera's Student Caregiver Program" — the university is
            NOT baked into the program name (a possessive "Olera's <University>
            …" implies the school runs/endorses it). The campus still appears
            descriptively in the header lockup and, for real campuses, the
            eyebrow line below. Matches the outreach emails' framing. */}
        <View style={styles.titleBlock}>
          {config.universityShort ? (
            <Text style={styles.programSubtitle}>
              For pre-health students near {config.universityName}
            </Text>
          ) : null}
          <Text style={styles.programTitle}>Olera’s Student Caregiver Program</Text>
          <Text style={styles.programSubtitle}>{subtitle}</Text>
        </View>

        {/* ── Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroHeadline}>{config.heroHeadline}</Text>
          <Text style={styles.heroBody}>{config.heroSubhead}</Text>
        </View>

        {/* ── Benefits */}
        <Text style={styles.sectionHeader}>{headers.benefits}</Text>
        <View style={styles.benefitGrid}>
          {config.benefits.map((b, i) => (
            <View key={i} style={styles.benefitCell}>
              <View style={styles.benefitInner}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitBody}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── How it works */}
        <Text style={styles.sectionHeader}>{headers.steps}</Text>
        <View style={styles.stepsRow}>
          {config.steps.map((s, i) => (
            <View key={i} style={styles.stepCell}>
              <View style={styles.stepInner}>
                <Text style={styles.stepNumber}>0{i + 1}</Text>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Eligibility / vetting */}
        <Text style={styles.sectionHeader}>{headers.vetting}</Text>
        <View style={styles.vettingBlock}>
          {config.vetting.map((v, i) => (
            <View key={i} style={styles.vettingRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.vettingText}>{v}</Text>
            </View>
          ))}
        </View>

        {/* ── Participation / what to expect */}
        <Text style={styles.sectionHeader}>{headers.pricing}</Text>
        <View style={styles.pricingBlock}>
          <Text style={styles.pricingHeadline}>{config.pricing.headline}</Text>
          <Text style={styles.pricingBody}>{config.pricing.body}</Text>
        </View>

        {/* ── Footer / signatures + QR */}
        <View style={styles.footer}>
          <View style={styles.sigsCol}>
            <View style={styles.sigBlock}>
              {assets.loganPhotoDataUri ? (
                <Image src={assets.loganPhotoDataUri} style={styles.sigPhoto} />
              ) : null}
              <View style={styles.sigText}>
                <Text style={styles.sigName}>Dr. Logan DuBose, MD, MBA</Text>
                <Text style={styles.sigCred}>Texas A&M College of Medicine &apos;22</Text>
                <Text style={styles.sigCred}>NIH-funded researcher</Text>
                <Text style={styles.sigCred}>Director, Olera Student Caregiver Program</Text>
              </View>
            </View>
            <View style={styles.sigBlock}>
              {assets.graziePhotoDataUri ? (
                <Image src={assets.graziePhotoDataUri} style={styles.sigPhoto} />
              ) : null}
              <View style={styles.sigText}>
                <Text style={styles.sigName}>Graize Belandres</Text>
                <Text style={styles.sigCred}>Research Assistant to</Text>
                <Text style={styles.sigCred}>Dr. Logan DuBose</Text>
                <Text style={styles.sigCred}>graize@olera.care</Text>
              </View>
            </View>
          </View>
          <View style={styles.ctaCol}>
            <Image src={assets.qrDataUri} style={styles.qrImage} />
            <Text style={styles.ctaLabel}>{config.ctaLabel}</Text>
            <Text style={styles.ctaUrl}>
              {/* QR encodes the full (attributed) URL; the printed text shows a
                  clean, memorable URL without the query string. */}
              {config.ctaUrl.replace(/^https?:\/\//, "").replace(/\?.*$/, "")}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
