/* eslint-disable react/no-unknown-property */
/**
 * The provider brochure, as a two-page PDF.
 *
 * Page one is the offer: what it is, why agencies take it, how it runs, and
 * what it costs. Page two is the people, because an agency deciding whether
 * to let a stranger send them a caregiver is deciding whether to trust the
 * people behind it, and a founder's paragraph does more for that than
 * another benefit card.
 *
 * Nothing university-specific lives here. Everything the page says comes
 * from a ProgramPdfConfig, so a new campus is a data add.
 *
 * Photos and the QR arrive as base64 data URIs: @react-pdf/renderer's
 * <Image> needs in-memory bytes when it runs somewhere with no network.
 */

import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { ProgramPdfConfig } from "./configs";
import { StudentFlyer } from "./StudentFlyer";
import { RecruitFlyerPage } from "./RecruitFlyer";

const EMERALD = "#059669";
const EMERALD_DARK = "#047857";
const EMERALD_DEEP = "#064e3b";
const EMERALD_TINT = "#ecfdf5";
const GRAY_900 = "#111827";
const GRAY_700 = "#374151";
const GRAY_600 = "#4b5563";
const GRAY_500 = "#6b7280";
const GRAY_200 = "#e5e7eb";
const GRAY_50 = "#f9fafb";
const WHITE = "#ffffff";

// Helvetica is built in. An external font fetch is the one thing that can
// fail in a serverless render, and a brochure that sometimes does not
// generate is worse than a brochure set in Helvetica.
const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 30,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: GRAY_700,
    lineHeight: 1.45,
  },
  body: { paddingHorizontal: 42 },

  // ── the band across the top ───────────────────────────────────────────
  band: {
    backgroundColor: EMERALD_DEEP,
    paddingHorizontal: 42,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  bandLeft: { flexDirection: "row", alignItems: "center" },
  bandLogo: { width: 20, height: 20, marginRight: 8 },
  bandWord: { fontSize: 17, fontFamily: "Helvetica-Bold", color: WHITE, letterSpacing: 0.3 },
  bandRule: { width: 1, height: 20, backgroundColor: "#10b981", marginHorizontal: 12 },
  bandProgram: { fontSize: 10, color: "#a7f3d0", letterSpacing: 1.1 },
  bandRight: { fontSize: 8.5, color: "#6ee7b7", letterSpacing: 1.1, textAlign: "right" },

  // ── hero ──────────────────────────────────────────────────────────────
  eyebrow: { fontSize: 8.5, color: EMERALD, letterSpacing: 1.3, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  h1: { fontSize: 21, fontFamily: "Helvetica-Bold", color: GRAY_900, lineHeight: 1.18, marginBottom: 8 },
  heroSub: { fontSize: 10, color: GRAY_600, lineHeight: 1.55, marginBottom: 16 },

  // ── section furniture ─────────────────────────────────────────────────
  sectionHead: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: EMERALD_DARK, letterSpacing: 1.3 },
  sectionLine: { flex: 1, height: 0.75, backgroundColor: GRAY_200, marginLeft: 10 },

  // ── why agencies participate: four cards ──────────────────────────────
  cardRow: { flexDirection: "row", marginBottom: 7 },
  card: {
    flex: 1,
    backgroundColor: GRAY_50,
    borderLeftWidth: 2.5,
    borderLeftColor: EMERALD,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  cardGap: { width: 9 },
  cardTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: GRAY_900, marginBottom: 3 },
  cardBody: { fontSize: 8.5, color: GRAY_600, lineHeight: 1.45 },

  // ── how it works: numbered circles in a row ───────────────────────────
  stepRow: { flexDirection: "row", marginBottom: 16, marginTop: 2 },
  step: { flex: 1, flexDirection: "row", alignItems: "flex-start" },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: EMERALD,
    color: WHITE,
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 5,
    marginRight: 8,
  },
  // No flex here. It used to sit directly in the row, where flex:1 gave it
  // the remaining width; it now sits inside a column beside the number, and
  // flex:1 in a column made it claim a height it did not have and clipped
  // the third line of every step.
  stepText: { fontSize: 8.5, color: GRAY_700, lineHeight: 1.45 },

  // ── vetting ───────────────────────────────────────────────────────────
  vetRow: { flexDirection: "row", marginBottom: 14 },
  vetCol: { flex: 1 },
  vetItem: { flexDirection: "row", marginBottom: 4, paddingRight: 12 },
  vetTick: { fontSize: 9, color: EMERALD, fontFamily: "Helvetica-Bold", marginRight: 6 },
  vetText: { flex: 1, fontSize: 8.5, color: GRAY_700, lineHeight: 1.4 },

  // ── price ─────────────────────────────────────────────────────────────
  priceBox: {
    borderWidth: 1,
    borderColor: "#a7f3d0",
    backgroundColor: EMERALD_TINT,
    padding: 12,
    marginBottom: 10,
  },
  priceRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-start" },
  // The offer panel that replaced pricing. One ask, stated once, with room
  // around it — the page has no other call to action competing with it.
  offerBox: {
    borderWidth: 1,
    borderColor: "#a7f3d0",
    backgroundColor: EMERALD_TINT,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  // The advising flyer's page one clears the panel by about three points,
  // which is not a margin — one extra wrapped line anywhere above it and the
  // panel lands on a page of its own. This buys back twenty-four: eight from
  // the padding and sixteen from a bottom margin that is doing nothing,
  // because on that page the panel is the last thing before the page break.
  offerBoxTight: { paddingVertical: 11, marginBottom: 0 },
  offerHead: { fontSize: 14, fontFamily: "Helvetica-Bold", color: GRAY_900, marginBottom: 6 },
  offerAsk: { fontSize: 10.5, color: EMERALD_DARK, fontFamily: "Helvetica-Bold", marginBottom: 7 },
  offerBody: { fontSize: 8.5, color: GRAY_600, lineHeight: 1.5 },
  stepTitle: { fontSize: 8.8, fontFamily: "Helvetica-Bold", color: GRAY_900, marginBottom: 1.5 },
  // The one-word reply, given the weight of the thing we actually want.
  replyBox: {
    backgroundColor: EMERALD_DEEP,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  replyLabel: { fontSize: 8, color: "#6ee7b7", letterSpacing: 1.6, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  replyWord: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    letterSpacing: 2,
    lineHeight: 1.2,
  },
  replyTail: { fontSize: 9, color: "#a7f3d0", marginTop: 8 },
  footerLine: { fontSize: 8, color: GRAY_500, textAlign: "center" },
  priceCell: { flex: 1 },
  priceLabel: { fontSize: 8, color: EMERALD_DARK, letterSpacing: 1.1, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  priceBig: { fontSize: 16, fontFamily: "Helvetica-Bold", color: GRAY_900, lineHeight: 1.2 },
  priceDivider: { width: 1, backgroundColor: "#a7f3d0", marginHorizontal: 14 },
  priceBody: {
    fontSize: 8.5,
    color: GRAY_600,
    lineHeight: 1.45,
    borderTopWidth: 0.75,
    borderTopColor: "#a7f3d0",
    paddingTop: 10,
  },

  // ── footers ───────────────────────────────────────────────────────────
  footer: {
    marginTop: 4,
    paddingTop: 11,
    borderTopWidth: 0.75,
    borderTopColor: GRAY_200,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerAsk: { flex: 1, paddingRight: 18 },
  footerAskTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: GRAY_900, marginBottom: 3 },
  footerAskBody: { fontSize: 8.5, color: GRAY_600, lineHeight: 1.45 },
  qrWrap: { alignItems: "center" },
  qr: { width: 58, height: 58 },
  qrLabel: { fontSize: 7, color: GRAY_500, marginTop: 3 },
  // Page two is short, so its footer is pinned rather than left to float in
  // the middle of a half-empty page.
  footerPinned: {
    position: "absolute",
    bottom: 28,
    left: 42,
    right: 42,
  },

  // ── page two ──────────────────────────────────────────────────────────
  storyRow: { flexDirection: "row", marginBottom: 34 },
  // The radius goes on the image. A wrapper with its own border and
  // overflow:hidden drew a ring the image did not quite reach, which is what
  // the flat edges and the hairline on each circle were.
  storyPhotoWrap: { marginRight: 18 },
  storyPhoto: { width: 108, height: 108, borderRadius: 54, objectFit: "cover" },
  storyText: { flex: 1 },
  storyQuote: { fontSize: 11.5, color: GRAY_700, lineHeight: 1.65 },
  storyName: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: GRAY_900, marginTop: 11 },
  storyRole: { fontSize: 9, color: GRAY_500 },

  teamRow: { flexDirection: "row", marginBottom: 14, marginTop: 4 },
  member: { flex: 1 },
  memberGap: { width: 14 },
  avatarWrap: { marginBottom: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, objectFit: "cover" },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: EMERALD_TINT,
    color: EMERALD_DARK,
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 25,
    marginBottom: 8,
  },
  memberName: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: GRAY_900 },
  memberRole: { fontSize: 8.5, color: EMERALD_DARK, marginBottom: 2 },
  memberEmail: { fontSize: 8.5, color: GRAY_500, marginBottom: 6 },
  memberBio: { fontSize: 8.5, color: GRAY_600, lineHeight: 1.5, paddingRight: 10 },
});

export interface ProgramPdfAssets {
  loganPhotoDataUri?: string;
  graziePhotoDataUri?: string;
  chantelPhotoDataUri?: string;
  saraPhotoDataUri?: string;
  /** Olera logo, reversed out of the header band. */
  oleraLogoDataUri?: string;
  qrDataUri: string;
  /**
   * The QR on the student recruitment flyer, which points at the student
   * application rather than at whatever the host document's CTA is. An
   * advising office forwards that page to students; a QR that took them to
   * the advising page would be the one broken thing on it.
   */
  recruitQrDataUri?: string;
}

const initials = (name: string) =>
  name
    .replace(/,.*$/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

function SectionHead({ children }: { children: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{children}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

export function ProgramPdfTemplate({
  config,
  assets,
}: {
  config: ProgramPdfConfig;
  assets: ProgramPdfAssets;
}) {
  // Two audiences, two documents. They shared one layout until the provider
  // brochure grew a price, a team and a one-word reply, at which point the
  // student flyer inherited all three.
  if (config.audience === "student") {
    return <StudentFlyer config={config} assets={assets} />;
  }

  const photos: Record<string, string | undefined> = {
    logan: assets.loganPhotoDataUri,
    grazie: assets.graziePhotoDataUri,
    chantel: assets.chantelPhotoDataUri,
    sara: assets.saraPhotoDataUri,
  };
  const advisor = config.audience === "advisor";
  const team = config.team ?? [];
  const lead = team[0];
  const rest = team.slice(1);
  const uni = config.universityShort;
  const stepOf = (s: string | { title: string; body: string }) =>
    typeof s === "string" ? { title: "", body: s } : s;

  const Band = ({ right }: { right: string }) => (
    <View style={styles.band}>
      <View style={styles.bandLeft}>
        {assets.oleraLogoDataUri ? (
          <Image src={assets.oleraLogoDataUri} style={styles.bandLogo} />
        ) : null}
        <Text style={styles.bandWord}>Olera</Text>
        <View style={styles.bandRule} />
        <Text style={styles.bandProgram}>STUDENT CAREGIVER PROGRAM</Text>
      </View>
      {right ? <Text style={styles.bandRight}>{right.toUpperCase()}</Text> : null}
    </View>
  );

  const Steps = ({ items }: { items: Array<{ title: string; body: string }> }) => (
    <View style={styles.stepRow}>
      {items.map((step, i) => (
        <View style={styles.step} key={step.body}>
          <Text style={styles.stepNum}>{i + 1}</Text>
          <View style={{ flex: 1, paddingRight: 10 }}>
            {step.title ? <Text style={styles.stepTitle}>{step.title}</Text> : null}
            <Text style={styles.stepText}>{step.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <Document
      title={`Olera Student Caregiver Program — ${config.universityName}`}
      author="Olera"
      subject={config.documentSubject ?? "Provider outreach packet"}
    >
      {/* ── page one: the offer ─────────────────────────────────────── */}
      <Page size="LETTER" style={styles.page}>
        <Band right={uni} />

        <View style={styles.body}>
          <Text style={styles.eyebrow}>{config.eyebrow ?? "FOR HOME CARE AGENCIES"}</Text>
          <Text style={styles.h1}>{config.heroHeadline}</Text>
          <Text style={styles.heroSub}>{config.heroSubhead}</Text>

          <SectionHead>{config.benefitsHeading ?? "WHY AGENCIES PARTICIPATE"}</SectionHead>
          {[0, 2].map((i) => (
            <View style={styles.cardRow} key={i}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{config.benefits[i]?.title}</Text>
                <Text style={styles.cardBody}>{config.benefits[i]?.body}</Text>
              </View>
              <View style={styles.cardGap} />
              {config.benefits[i + 1] ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{config.benefits[i + 1].title}</Text>
                  <Text style={styles.cardBody}>{config.benefits[i + 1].body}</Text>
                </View>
              ) : (
                <View style={styles.card} />
              )}
            </View>
          ))}

          <View style={{ height: 10 }} />
          {/* The founder and his photograph, high on the page. It was on the
              team page, which left page one as five blocks of type and
              nothing to rest on. */}
          {config.story ? (
            <>
              <SectionHead>{config.story.heading.toUpperCase()}</SectionHead>
              <View style={styles.storyRow}>
                {lead && photos[lead.photo ?? ""] ? (
                  <View style={styles.storyPhotoWrap}>
                    <Image src={photos[lead.photo!]!} style={styles.storyPhoto} />
                  </View>
                ) : null}
                <View style={styles.storyText}>
                  <Text style={styles.storyQuote}>{config.story.body}</Text>
                  {lead ? (
                    <>
                      <Text style={styles.storyName}>{lead.name}</Text>
                      <Text style={styles.storyRole}>{lead.role}</Text>
                      <Text style={styles.storyRole}>{lead.bio}</Text>
                    </>
                  ) : null}
                </View>
              </View>
            </>
          ) : null}

          <SectionHead>HOW IT WORKS</SectionHead>
          <Steps items={config.steps.map(stepOf)} />

          {config.offer ? (
            <View style={advisor ? [styles.offerBox, styles.offerBoxTight] : styles.offerBox}>
              <Text style={styles.offerHead}>{config.offer.headline}</Text>
              <Text style={styles.offerAsk}>{config.offer.ask}</Text>
              <Text style={styles.offerBody}>{config.offer.body}</Text>
            </View>
          ) : null}

        </View>
      </Page>

      {/* ── page two: the people, and the one-word reply ────────────── */}
      {team.length > 0 ? (
        <Page size="LETTER" style={styles.page}>
          <Band right="the team" />

          <View style={styles.body}>
            {/* Page two says who it is for, the same way page one does. A
                page forwarded on its own, or printed and left on a desk,
                otherwise says only "the team". It goes here rather than in
                the band beside "STUDENT CAREGIVER PROGRAM", where the two
                labels ran into each other. */}
            {advisor && config.eyebrow ? (
              <Text style={[styles.eyebrow, { marginBottom: 12 }]}>{config.eyebrow}</Text>
            ) : null}

            <SectionHead>WHO YOU WILL BE WORKING WITH</SectionHead>
            <View style={styles.teamRow}>
              {rest.map((m, i) => (
                <React.Fragment key={m.name}>
                  {i > 0 ? <View style={styles.memberGap} /> : null}
                  <View style={styles.member}>
                    {photos[m.photo ?? ""] ? (
                      <View style={styles.avatarWrap}>
                        <Image src={photos[m.photo!]!} style={styles.avatar} />
                      </View>
                    ) : (
                      <Text style={styles.avatarFallback}>{initials(m.name)}</Text>
                    )}
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Text style={styles.memberRole}>{m.role}</Text>
                    {m.email ? <Text style={styles.memberEmail}>{m.email}</Text> : null}
                    <Text style={styles.memberBio}>{m.bio}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            {config.nextStep ? (
              <View style={styles.offerBox}>
                <Text style={styles.offerHead}>{config.nextStep.heading}</Text>
                {config.nextStep.kicker ? (
                  <Text style={styles.offerAsk}>{config.nextStep.kicker}</Text>
                ) : null}
                <Text
                  style={[
                    styles.offerAsk,
                    { color: GRAY_900 },
                    // Nothing follows it, so the gap under it is a gap at the
                    // bottom of the box rather than space between two lines.
                    config.nextStep.body ? {} : { marginBottom: 0 },
                  ]}
                >
                  {config.nextStep.ask}
                </Text>
                {config.nextStep.body ? (
                  <Text style={styles.offerBody}>{config.nextStep.body}</Text>
                ) : null}
              </View>
            ) : null}

            {/* The ask, then what follows it. The advising flyer asks for
                the reply and then says what happens after one, which is the
                order somebody reads in; the agency brochure keeps the ask
                last, where its page has been building to it. */}
            {advisor ? (
              <>
                {config.replyBlock ? (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyLabel}>{config.replyBlock.label}</Text>
                    <Text style={styles.replyWord}>{config.replyBlock.word}</Text>
                    <Text style={styles.replyTail}>{config.replyBlock.tail}</Text>
                  </View>
                ) : null}
                {config.afterReply?.length ? (
                  <>
                    <SectionHead>WHAT HAPPENS AFTER YOU REPLY</SectionHead>
                    <Steps items={config.afterReply} />
                  </>
                ) : null}
              </>
            ) : (
              <>
                {config.afterReply?.length ? (
                  <>
                    <SectionHead>WHAT HAPPENS AFTER YOU REPLY</SectionHead>
                    <Steps items={config.afterReply} />
                  </>
                ) : null}
                {config.replyBlock ? (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyLabel}>{config.replyBlock.label}</Text>
                    <Text style={styles.replyWord}>{config.replyBlock.word}</Text>
                    <Text style={styles.replyTail}>{config.replyBlock.tail}</Text>
                  </View>
                ) : null}
              </>
            )}
            {config.footerLine ? (
              <Text style={styles.footerLine}>{config.footerLine}</Text>
            ) : null}
          </View>
        </Page>
      ) : null}

      {/* The thing the office is being asked to share, in the same file as
          the asking. An advising office that has to reply and wait for an
          attachment shares it next week, or never. */}
      {config.audience === "advisor" ? <RecruitFlyerPage assets={assets} /> : null}
    </Document>
  );
}
