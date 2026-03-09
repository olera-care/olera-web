import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Use | Olera",
  description:
    "Terms of Use for Olera, Inc. — governing your access to and use of the olera.care website and related services.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Use | Olera",
    description:
      "Terms of Use for Olera, Inc. — governing your access to and use of the olera.care website and related services.",
    url: "/terms",
    siteName: "Olera",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Use | Olera",
    description:
      "Terms of Use for Olera, Inc. — governing your access to and use of the olera.care website and related services.",
  },
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Use" lastUpdated="December 1, 2025">
        {/* 1. AGREEMENT TO TERMS */}
        <h2>1. Agreement to Terms</h2>
        <p>
          These Terms of Use constitute a legally binding agreement made between
          you, whether personally or on behalf of an entity (&ldquo;you&rdquo;)
          and Olera, Inc. (&ldquo;Company,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;), concerning your access to
          and use of the olera.care website as well as any other media form,
          media channel, mobile website or mobile application related, linked, or
          otherwise connected thereto (collectively, the &ldquo;Site&rdquo;). We
          are registered in Texas and have our registered office at 105 Spanish
          Moss Ln, Lake Jackson, Texas, 77566. You agree that by accessing the
          Site, you have read, understood, and agreed to be bound by all of these
          Terms of Use. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF USE, THEN
          YOU ARE EXPRESSLY PROHIBITED FROM USING THE SITE AND YOU MUST
          DISCONTINUE USE IMMEDIATELY.
        </p>
        <p>
          Supplemental terms and conditions or documents that may be posted on
          the Site from time to time are hereby expressly incorporated herein by
          reference. We reserve the right, in our sole discretion, to make
          changes or modifications to these Terms of Use at any time and for any
          reason. We will alert you about any changes by updating the &ldquo;Last
          updated&rdquo; date of these Terms of Use, and you waive any right to
          receive specific notice of each such change. The information provided
          on the Site is not intended for distribution to or use by any person or
          entity in any jurisdiction or country where such distribution or use
          would be contrary to law or regulation. The Site is not tailored to
          comply with industry-specific regulations (HIPAA, FISMA, etc.). The
          Site is intended for users who are at least 18 years old.
        </p>

        {/* 2. INTELLECTUAL PROPERTY RIGHTS */}
        <h2>2. Intellectual Property Rights</h2>
        <p>
          Unless otherwise indicated, the Site is our proprietary property and
          all source code, databases, functionality, software, website designs,
          audio, video, text, photographs, and graphics on the Site
          (collectively, the &ldquo;Content&rdquo;) and the trademarks, service
          marks, and logos contained therein (the &ldquo;Marks&rdquo;) are owned
          or controlled by us or licensed to us. The Content and the Marks are
          provided on the Site &ldquo;AS IS&rdquo; for your information and
          personal use only. You are granted a limited license to access and use
          the Site and to download or print a copy of any portion of the Content
          to which you have properly gained access solely for your personal,
          non-commercial use. We reserve all rights not expressly granted to you.
        </p>

        {/* 3. USER REPRESENTATIONS */}
        <h2>3. User Representations</h2>
        <p>
          By using the Site, you represent and warrant that: (1) all registration
          information you submit will be true, accurate, current, and complete;
          (2) you will maintain the accuracy of such information; (3) you have
          the legal capacity and agree to comply with these Terms; (4) you are
          not a minor; (5) you will not access the Site through automated or
          non-human means; (6) you will not use the Site for any illegal or
          unauthorized purpose; and (7) your use of the Site will not violate any
          applicable law or regulation.
        </p>

        {/* 4. USER REGISTRATION */}
        <h2>4. User Registration</h2>
        <p>
          You may be required to register with the Site. You agree to keep your
          password confidential and will be responsible for all use of your
          account and password. We reserve the right to remove, reclaim, or
          change a username you select if we determine it is inappropriate.
        </p>

        {/* 5. PROHIBITED ACTIVITIES */}
        <h2>5. Prohibited Activities</h2>
        <p>
          You may not access or use the Site for any purpose other than that for
          which we make the Site available. As a user, you agree not to:
        </p>
        <ul>
          <li>
            Systematically retrieve data to create a collection without written
            permission
          </li>
          <li>Trick, defraud, or mislead us and other users</li>
          <li>Circumvent security-related features of the Site</li>
          <li>Disparage, tarnish, or otherwise harm us and/or the Site</li>
          <li>
            Use information obtained from the Site to harass, abuse, or harm
            another person
          </li>
          <li>Make improper use of our support services</li>
          <li>Use the Site inconsistently with applicable laws</li>
          <li>Engage in unauthorized framing of or linking to the Site</li>
          <li>Upload or transmit viruses or other harmful material</li>
          <li>Engage in automated use of the system</li>
          <li>Delete copyright or other proprietary rights notices</li>
          <li>Attempt to impersonate another user</li>
          <li>
            Upload material that acts as a passive or active information
            collection mechanism
          </li>
          <li>
            Interfere with or create an undue burden on the Site
          </li>
          <li>
            Harass, annoy, intimidate, or threaten any of our employees
          </li>
          <li>
            Attempt to bypass any measures designed to prevent or restrict access
          </li>
          <li>Copy or adapt the Site&apos;s software</li>
          <li>
            Decipher, decompile, disassemble, or reverse engineer any software
          </li>
          <li>Use, launch, develop, or distribute any automated system</li>
          <li>Use a buying agent or purchasing agent</li>
          <li>Make unauthorized use of the Site</li>
          <li>
            Use the Site to advertise or offer to sell goods and services
          </li>
          <li>Sell or otherwise transfer your profile</li>
        </ul>

        {/* 6. USER GENERATED CONTRIBUTIONS */}
        <h2>6. User Generated Contributions</h2>
        <p>
          The Site may provide you with the opportunity to create, submit, post,
          display, transmit, perform, publish, distribute, or broadcast content
          and materials (&ldquo;Contributions&rdquo;). Contributions may be
          viewable by other users. When you create or make available any
          Contributions, you represent and warrant that: your Contributions do
          not infringe proprietary rights; you are the creator and owner; your
          Contributions are not false, inaccurate, or misleading; not unsolicited
          advertising; not obscene, lewd, or harassing; not used to harass or
          threaten; do not violate any applicable law; do not violate privacy or
          publicity rights; do not violate laws concerning child safety; do not
          include offensive comments connected to race, national origin, gender,
          sexual preference, or physical handicap.
        </p>

        {/* 7. CONTRIBUTION LICENSE */}
        <h2>7. Contribution License</h2>
        <p>
          By posting your Contributions, you automatically grant us an
          unrestricted, unlimited, irrevocable, perpetual, non-exclusive,
          transferable, royalty-free, fully-paid, worldwide right and license to
          host, use, copy, reproduce, disclose, sell, publish, broadcast,
          retitle, archive, store, cache, publicly perform, publicly display,
          reformat, translate, transmit, excerpt, and distribute such
          Contributions for any purpose, commercial, advertising, or otherwise.
          We do not assert any ownership over your Contributions. You retain full
          ownership.
        </p>

        {/* 8. GUIDELINES FOR REVIEWS */}
        <h2>8. Guidelines for Reviews</h2>
        <p>
          When posting a review, you must comply with the following criteria: (1)
          firsthand experience; (2) no offensive profanity or hate language; (3)
          no discriminatory references; (4) no references to illegal activity;
          (5) no affiliation with competitors if posting negative reviews; (6) no
          conclusions as to the legality of conduct; (7) no false or misleading
          statements; (8) no Protected Health Information; and (9) no campaigns
          encouraging others to post reviews. Anyone may report a review using
          the &ldquo;Report&rdquo; or &ldquo;Flag&rdquo; button. Providers may
          submit a brief rebuttal response. Appeals may be submitted to
          support@olera.care within 10 business days.
        </p>

        {/* 9. SOCIAL MEDIA */}
        <h2>9. Social Media</h2>
        <p>
          As part of the functionality of the Site, you may link your account
          with online accounts you have with third-party service providers.
        </p>

        {/* 10. SUBMISSIONS */}
        <h2>10. Submissions</h2>
        <p>
          You acknowledge and agree that any questions, comments, suggestions,
          ideas, feedback, or other information regarding the Site
          (&ldquo;Submissions&rdquo;) provided by you to us are non-confidential
          and shall become our sole property.
        </p>

        {/* 11. THIRD-PARTY WEBSITE AND CONTENT */}
        <h2>11. Third-Party Website and Content</h2>
        <p>
          The Site may contain links to other websites (&ldquo;Third-Party
          Websites&rdquo;) as well as articles, photographs, text, graphics,
          pictures, designs, music, sound, video, information, applications,
          software, and other content or items belonging to or originating from
          third parties (&ldquo;Third-Party Content&rdquo;). Such Third-Party
          Websites and Content are not investigated, monitored, or checked for
          accuracy by us. If you decide to leave the Site and access Third-Party
          Websites, you do so at your own risk.
        </p>

        {/* 12. SITE MANAGEMENT */}
        <h2>12. Site Management</h2>
        <p>
          We reserve the right to: (1) monitor the Site for violations; (2) take
          appropriate legal action; (3) refuse, restrict access to, or disable
          any Contributions; (4) remove files and content that are excessive or
          burdensome; and (5) otherwise manage the Site to protect our rights and
          property.
        </p>

        {/* 13. PRIVACY POLICY */}
        <h2>13. Privacy Policy</h2>
        <p>
          We care about data privacy and security. Please review our Privacy
          Policy at{" "}
          <a href="/privacy">/privacy</a>
          . By using the Site, you agree to be bound by our Privacy Policy. The
          Site is hosted in the United States.
        </p>

        {/* 14. TERM AND TERMINATION */}
        <h2>14. Term and Termination</h2>
        <p>
          These Terms remain in full force while you use the Site. WE RESERVE THE
          RIGHT TO DENY ACCESS TO AND USE OF THE SITE TO ANY PERSON FOR ANY
          REASON OR FOR NO REASON, INCLUDING FOR BREACH OF THESE TERMS OF USE.
          If we terminate or suspend your account, you are prohibited from
          registering and creating a new account under your name, a fake or
          borrowed name, or the name of any third party.
        </p>

        {/* 15. MODIFICATIONS AND INTERRUPTIONS */}
        <h2>15. Modifications and Interruptions</h2>
        <p>
          We reserve the right to change, modify, or remove the contents of the
          Site at any time or for any reason at our sole discretion without
          notice. We cannot guarantee the Site will be available at all times.
        </p>

        {/* 16. GOVERNING LAW */}
        <h2>16. Governing Law</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws
          of the State of Texas applicable to agreements made and to be entirely
          performed within the State of Texas, without regard to its conflict of
          law principles.
        </p>

        {/* 17. DISPUTE RESOLUTION */}
        <h2>17. Dispute Resolution</h2>

        <h3>Informal Negotiations</h3>
        <p>
          The Parties agree to first attempt to negotiate any Dispute informally
          for at least thirty (30) days before initiating arbitration.
        </p>

        <h3>Binding Arbitration</h3>
        <p>
          If the Parties are unable to resolve a Dispute through informal
          negotiations, the Dispute will be finally and exclusively resolved
          through binding arbitration. YOU UNDERSTAND THAT WITHOUT THIS
          PROVISION, YOU WOULD HAVE THE RIGHT TO SUE IN COURT AND HAVE A JURY
          TRIAL. The arbitration shall be conducted under the Commercial
          Arbitration Rules of the American Arbitration Association
          (&ldquo;AAA&rdquo;). The arbitration will take place in Brazos Valley,
          Texas. In no event shall any Dispute be commenced more than one (1)
          year after the cause of action arose.
        </p>

        <h3>Restrictions</h3>
        <p>
          Any arbitration shall be limited to the Dispute between the Parties
          individually. No class-action basis or representative capacity is
          permitted.
        </p>

        <h3>Exceptions</h3>
        <p>
          The following Disputes are not subject to arbitration: (a) intellectual
          property rights; (b) theft, piracy, invasion of privacy, or
          unauthorized use; and (c) any claim for injunctive relief.
        </p>

        {/* 18. CORRECTIONS */}
        <h2>18. Corrections</h2>
        <p>
          There may be information on the Site that contains typographical
          errors, inaccuracies, or omissions. We reserve the right to correct any
          errors and to change or update information at any time without prior
          notice.
        </p>

        {/* 19. DISCLAIMER */}
        <h2>19. Disclaimer</h2>
        <p>
          THE SITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT
          YOUR USE OF THE SITE AND OUR SERVICES WILL BE AT YOUR SOLE RISK. TO
          THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
          EXPRESS OR IMPLIED, IN CONNECTION WITH THE SITE AND YOUR USE THEREOF.
        </p>

        {/* 20. LIMITATIONS OF LIABILITY */}
        <h2>20. Limitations of Liability</h2>
        <p>
          IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO
          YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL,
          EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES. OUR LIABILITY WILL
          AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US.
        </p>

        {/* 21. INDEMNIFICATION */}
        <h2>21. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold us harmless from and against
          any loss, damage, liability, claim, or demand arising out of: (1) your
          Contributions; (2) use of the Site; (3) breach of these Terms; (4)
          breach of your representations and warranties; (5) violation of third
          party rights; or (6) any harmful act toward any other user.
        </p>

        {/* 22. USER DATA */}
        <h2>22. User Data</h2>
        <p>
          We will maintain certain data that you transmit to the Site for
          managing the Site&apos;s performance. You are solely responsible for all
          data that you transmit. We shall have no liability for any loss or
          corruption of any such data.
        </p>

        {/* 23. ELECTRONIC COMMUNICATIONS */}
        <h2>23. Electronic Communications, Transactions, and Signatures</h2>
        <p>
          Visiting the Site, sending us emails, and completing online forms
          constitute electronic communications. You consent to receive electronic
          communications. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES,
          CONTRACTS, ORDERS, AND OTHER RECORDS.
        </p>

        {/* 24. CALIFORNIA USERS AND RESIDENTS */}
        <h2>24. California Users and Residents</h2>
        <p>
          If any complaint is not satisfactorily resolved, you can contact the
          Complaint Assistance Unit of the Division of Consumer Services of the
          California Department of Consumer Affairs at 1625 North Market Blvd.,
          Suite N 112, Sacramento, California 95834 or by telephone at (800)
          952-5210.
        </p>

        {/* 25. MISCELLANEOUS */}
        <h2>25. Miscellaneous</h2>
        <p>
          These Terms of Use and any policies or operating rules posted by us on
          the Site constitute the entire agreement between you and us. Our
          failure to exercise any right shall not operate as a waiver. We may
          assign any or all of our rights and obligations to others at any time.
        </p>

        {/* 26. CAREGIVER COMMUNITY FORUM */}
        <h2>26. Caregiver Community Forum Terms and Conditions</h2>
        <p>
          These Forum Terms govern your access to and use of the Caregiver
          Community Forum (&ldquo;Forum&rdquo;) at
          https://olera.care/caregiver-forum. By accessing the Forum, you agree
          to these Forum Terms.
        </p>
        <p>Key provisions include:</p>
        <ul>
          <li>
            <strong>Eligibility:</strong> 18 years of age or older
          </li>
          <li>
            <strong>User Conduct:</strong> No unlawful, fraudulent, threatening,
            or abusive content; no harassment; no impersonation
          </li>
          <li>
            <strong>Content Ownership:</strong> By posting, you grant Olera a
            non-exclusive, worldwide, royalty-free, perpetual license to use your
            content
          </li>
          <li>
            <strong>No Medical Advice:</strong> Information on the Forum is for
            informational purposes only
          </li>
          <li>
            <strong>Privacy:</strong> Do not post personal health information
            (PHI) or personally identifiable information (PII)
          </li>
          <li>
            <strong>Moderation:</strong> We reserve the right to monitor, edit,
            or remove any content
          </li>
          <li>
            <strong>Termination:</strong> We may terminate or suspend your access
            without prior notice
          </li>
          <li>
            THE FORUM IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS
            AVAILABLE&rdquo; BASIS
          </li>
        </ul>

        {/* 27. TAKE DOWN REQUESTS */}
        <h2>27. Take Down Requests</h2>
        <p>
          Olera allows users and providers to request removal or correction of
          content including provider listings, photos/logos/descriptions, reviews,
          and other content.
        </p>
        <p>
          Types of requests: DMCA Copyright Claim, Trademark Complaint, Business
          Information Correction or Removal, Defamation or False Review Claim,
          Privacy or Personal Information Removal.
        </p>
        <p>
          To submit: Complete the form on the provider page (&ldquo;Manage this
          page&rdquo;) or email support@olera.care with subject &ldquo;Takedown
          Request.&rdquo;
        </p>
        <p>
          Required information: full name, contact info, exact URLs, description,
          supporting evidence, certification under penalty of perjury, electronic
          signature.
        </p>
        <p>
          Review process: Acknowledgment within 3 business days, verification,
          evaluation under applicable laws, decision within 5-10 business days.
        </p>

        {/* 28. HOW LISTINGS AND RANKINGS WORK */}
        <h2>28. How Listings and Rankings Work</h2>

        <h3>Where Listing Information Comes From</h3>
        <p>
          Olera combines publicly available information with provider-submitted
          data. Sources include public websites, government/regulatory listings,
          third-party data providers, and verified providers through the Olera
          Provider Portal.
        </p>

        <h3>Types of Listings</h3>
        <ul>
          <li>
            <strong>Basic Listing:</strong> Free, automatically created using
            public information. Provider may claim or remove at any time.
          </li>
          <li>
            <strong>Premium Listing:</strong> Optional upgrade for added
            visibility. Flat subscription, no commissions or per-lead fees. All
            providers may receive inquiries and reviews for free.
          </li>
        </ul>

        <h3>How Providers Are Ranked</h3>
        <p>
          Results are based on: Olera Score (composite rating), Proximity,
          Listing Completeness, Responsiveness, and Featured Status. Featured
          status does not determine who receives inquiries.
        </p>

        <h3>Olera Score</h3>
        <p>
          A weighted measure incorporating average rating, publicly available
          ratings, recency, and review volume. NOT clinical quality ratings.
        </p>

        <h3>Featured Listings</h3>
        <p>
          Featured providers may be displayed in highlighted positions, labeled
          with &ldquo;Featured (Paid Placement)&rdquo; tag. Featured status is
          advertising and does not reflect endorsement.
        </p>

        <h3>Our Commitment to Fairness</h3>
        <ul>
          <li>
            Every provider has the option to create a free basic listing
          </li>
          <li>No referral commissions or lead-sale agreements</li>
          <li>Ranking and inquiry delivery remain neutral</li>
        </ul>

        {/* 29. OLERA PRO SUBSCRIPTION */}
        <h2>29. Olera Pro Subscription</h2>
        <p>
          Olera Pro is an optional monthly subscription that enhances visibility
          and tools. Features may include featured placement, expanded
          information sections, local marketing emails, and review-generation
          tools.
        </p>
        <p>Key terms:</p>
        <ul>
          <li>Pricing at checkout, charged through Stripe</li>
          <li>Non-refundable except where required by law</li>
          <li>
            Free trial available; auto-converts to paid unless canceled
          </li>
          <li>
            Auto-renewal each month; cancel anytime before next billing date
          </li>
          <li>
            Cancellations effective immediately, access until end of billing
            cycle
          </li>
          <li>30 days&apos; notice of material pricing changes</li>
          <li>Governed by the laws of the State of Texas</li>
        </ul>

        {/* 30. DMCA & TRADEMARK NOTICE */}
        <h2>30. DMCA &amp; Trademark Notice</h2>
        <p>
          Olera respects intellectual property rights. DMCA notices should be sent
          to support@olera.care with subject &ldquo;DMCA Notice.&rdquo;
        </p>
        <p>
          Required for copyright claims: identification of copyrighted work,
          location of infringing material, contact information, good-faith belief
          statement, accuracy statement under penalty of perjury, signature.
        </p>
        <p>
          Counter-notifications may be filed. Material may be restored within
          10-14 business days unless original complainant files court action.
        </p>
        <p>
          Repeat infringers will be terminated. Trademark complaints reviewed
          under U.S. nominative fair-use standards.
        </p>

        {/* 31. CONTACT US */}
        <h2>31. Contact Us</h2>
        <p>
          Olera, Inc.
          <br />
          1337 W 43rd St., Unit #1010
          <br />
          Houston, TX 77018
        </p>
        <p>
          Phone: +1 979-243-9801
          <br />
          Email: support@olera.care
        </p>
    </LegalPageLayout>
  );
}
