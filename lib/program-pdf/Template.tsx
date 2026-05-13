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
    padding: 6,
  },
  stepNumber: {
    fontSize: 11,
    color: EMERALD_DARK,
    marginBottom: 2,
  },
  stepText: {
    fontSize: 8.5,
    color: GRAY_700,
    lineHeight: 1.35,
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
    paddingRight: 8,
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
  /** Olera-emerald wordmark not used yet — left for future iteration.
   *  Photos + QR are base64 data URIs ready for @react-pdf/Image. */
  loganPhotoDataUri?: string;
  graziePhotoDataUri?: string;
  qrDataUri: string;
}

export function ProgramPdfTemplate({
  config,
  assets,
}: {
  config: ProgramPdfConfig;
  assets: ProgramPdfAssets;
}) {
  return (
    <Document
      title={`${config.universityShort} Student Caregiver Program`}
      author="Olera"
      subject="Provider outreach packet"
    >
      <Page size="LETTER" style={styles.page}>
        {/* ── Header row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brandWord}>olera</Text>
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
            <Text style={styles.universityTag}>Pre-health staffing pipeline</Text>
          </View>
        </View>

        {/* ── Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.programTitle}>
            {config.universityShort} Student Caregiver Program
          </Text>
          <Text style={styles.programSubtitle}>
            A pre-health student staffing pipeline for home care agencies
          </Text>
        </View>

        {/* ── Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroHeadline}>{config.heroHeadline}</Text>
          <Text style={styles.heroBody}>{config.heroSubhead}</Text>
        </View>

        {/* ── Benefits */}
        <Text style={styles.sectionHeader}>Why agencies participate</Text>
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
        <Text style={styles.sectionHeader}>How it works</Text>
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

        {/* ── Student vetting */}
        <Text style={styles.sectionHeader}>Student vetting</Text>
        <View style={styles.vettingBlock}>
          {config.vetting.map((v, i) => (
            <View key={i} style={styles.vettingRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.vettingText}>{v}</Text>
            </View>
          ))}
        </View>

        {/* ── Participation & pricing */}
        <Text style={styles.sectionHeader}>Participation &amp; pricing</Text>
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
              <View>
                <Text style={styles.sigName}>Dr. Logan DuBose, MD/MBA</Text>
                <Text style={styles.sigCred}>NIH-funded researcher</Text>
                <Text style={styles.sigCred}>Texas A&M College of Medicine alum</Text>
                <Text style={styles.sigCred}>Director, Student Caregiver Program</Text>
              </View>
            </View>
            <View style={styles.sigBlock}>
              {assets.graziePhotoDataUri ? (
                <Image src={assets.graziePhotoDataUri} style={styles.sigPhoto} />
              ) : null}
              <View>
                <Text style={styles.sigName}>Grazie Belandres</Text>
                <Text style={styles.sigCred}>Research Assistant to</Text>
                <Text style={styles.sigCred}>Dr. Logan DuBose</Text>
                <Text style={styles.sigCred}>grazie@olera.care</Text>
              </View>
            </View>
          </View>
          <View style={styles.ctaCol}>
            <Image src={assets.qrDataUri} style={styles.qrImage} />
            <Text style={styles.ctaLabel}>{config.ctaLabel}</Text>
            <Text style={styles.ctaUrl}>
              {config.ctaUrl.replace(/^https?:\/\//, "")}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
