import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Managed Ads — Terms | Olera",
  description:
    "How Olera Managed Ads works: your free first campaign, all-in monthly plans, the zero-inquiry month guarantee, your leads, and how to cancel.",
  alternates: { canonical: "/managed-ads-terms" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Managed Ads — Terms | Olera",
    description:
      "How Olera Managed Ads works: your free first campaign, all-in monthly plans, the zero-inquiry month guarantee, your leads, and how to cancel.",
    url: "/managed-ads-terms",
    siteName: "Olera",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Managed Ads — Terms | Olera",
    description:
      "How Olera Managed Ads works: your free first campaign, all-in monthly plans, the zero-inquiry month guarantee, your leads, and how to cancel.",
  },
};

export default function ManagedAdsTermsPage() {
  return (
    <LegalPageLayout title="Managed Ads — How It Works" lastUpdated="July 6, 2026">
      <p>
        These terms describe Olera Managed Ads (the &ldquo;Service&rdquo;), an
        optional paid advertising service offered by Olera, Inc.
        (&ldquo;Olera,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
        &ldquo;our&rdquo;) to care providers listed on olera.care. They are
        written in plain language and are meant to be read alongside, and as a
        supplement to, our <a href="/terms">Terms of Use</a> and{" "}
        <a href="/privacy">Privacy Policy</a>. By asking us to run a campaign for
        you, you agree to these terms.
      </p>

      {/* 1. WHAT THE SERVICE DOES */}
      <h2>What the Service Does</h2>
      <p>
        With Managed Ads, Olera builds and runs paid advertising campaigns on
        platforms such as Google and Facebook to reach families searching for
        care near you, and sends that traffic to your Olera provider page. Any
        family who contacts you through your page appears directly in your Olera
        dashboard for you to follow up with. There is nothing for you to install,
        configure, or manage.
      </p>

      {/* 2. ELIGIBILITY */}
      <h2>Eligibility</h2>
      <p>
        Managed Ads is available only to providers who have claimed and verified
        their Olera page and have requested the Service. Because families decide
        based on what your page shows, we also ask that your page meet our
        completeness threshold before a campaign launches; if it does not yet, we
        queue your request and help you finish, and the campaign launches once
        your page is ready. We run paid advertising only at a provider&apos;s
        request and only to that provider&apos;s own claimed page. We do not run
        paid advertising to unclaimed listings.
      </p>

      {/* 3. HOW CAMPAIGNS ARE RUN */}
      <h2>How Campaigns Are Run</h2>
      <p>
        Campaigns are created and operated by Olera using Olera&apos;s own
        advertising accounts and point to your Olera provider page. We design the
        targeting, write the ads, and manage and optimize the campaign on your
        behalf. We do not require access to your own advertising accounts, and we
        do not act as your agent for any account other than the campaign we run
        for you.
      </p>

      {/* 4. PLANS AND PAYMENT */}
      <h2>Plans and Payment</h2>
      <p>
        Your first campaign is on us: Olera covers approximately the first $50 of
        advertising spend at no cost to you, one time per provider, so you can
        see the Service in action before paying anything. No payment method is
        required to request it.
      </p>
      <p>
        If you continue after the introductory campaign, you choose a flat
        monthly plan. Plan prices are all-in: they include your advertising
        budget and Olera&apos;s campaign setup, management, and optimization
        together. There are no separate service fees, no per-lead charges, and no
        long-term contract; plans run month to month. We will confirm your plan
        with you before anything is billed, and you are only ever charged for a
        plan you have approved.
      </p>

      {/* 5. ZERO-INQUIRY MONTH GUARANTEE */}
      <h2>Zero-Inquiry Month Guarantee</h2>
      <p>
        If a fully paid month on a monthly plan ends with zero family inquiries
        received through your Olera page while your campaign was running, that
        month is free: we will credit or refund that month&apos;s plan fee in
        full. For this purpose, an inquiry means a family contacting you through
        your Olera page while your campaign is active, as shown on your Olera
        dashboard. Months in which your campaign was paused or stopped at your
        request are not covered. This guarantee is a billing promise, not a
        results promise; it does not apply to the introductory campaign, which is
        already free.
      </p>

      {/* 6. NO GUARANTEED RESULTS */}
      <h2>No Guaranteed Results</h2>
      <p>
        Advertising increases how often local families see you, but Olera does
        not and cannot guarantee any specific number of clicks, leads, inquiries,
        new clients, or any particular return on your spend. Results depend on
        factors outside our control, including local demand, competition, your
        chosen budget, the completeness of your page, and how quickly you respond
        to families who reach out. The introductory campaign is intended to let
        you see the Service in action and is not a promise of any particular
        outcome. The Zero-Inquiry Month Guarantee above is a billing promise
        about what you pay, not a promise of results.
      </p>

      {/* 7. YOUR LEADS AND RELATIONSHIPS */}
      <h2>Your Leads and Relationships</h2>
      <p>
        Families who contact you through your Olera page are yours. Olera does not
        charge a commission, referral fee, or per-lead fee on the Service, and we
        do not take any share of business you win. You are solely responsible for
        responding to families, for the care services you provide, and for
        complying with all laws that apply to your business.
      </p>

      {/* 8. CANCELLATION */}
      <h2>Cancellation</h2>
      <p>
        There is no long-term contract. You may pause or stop your campaign at any
        time by contacting us, and we will wind it down promptly. You are
        responsible only for advertising budget you have already approved and that
        has been spent or committed at the time you cancel.
      </p>

      {/* 9. YOUR REPRESENTATIONS */}
      <h2>Your Representations</h2>
      <p>
        By requesting the Service, you represent and warrant that: (1) you own or
        are authorized to act on behalf of the business shown on your Olera page;
        (2) you authorize Olera to advertise that business and to use its name,
        location, and the information on your Olera page in advertising; (3) the
        information on your page is accurate and not misleading; and (4) you hold
        all licenses and registrations required to provide the care services you
        advertise.
      </p>

      {/* 10. ADVERTISING PLATFORM POLICIES */}
      <h2>Advertising Platform Policies</h2>
      <p>
        Campaigns are subject to the policies and approval processes of the
        advertising platforms we use, such as Google and Meta. We design campaigns
        to comply with those policies, but the platforms control ad approval,
        delivery, and account standing, and may pause, reject, or limit ads for
        reasons outside our control. We are not responsible for platform decisions
        or downtime.
      </p>

      {/* 11. REPORTING */}
      <h2>Reporting</h2>
      <p>
        We will share information about what your campaign delivered so you can see
        what your spend produced. Reporting reflects data made available to us by
        the advertising platforms and by our own systems and may be estimated or
        subject to the platforms&apos; own measurement limitations.
      </p>

      {/* 12. DISCLAIMERS AND LIABILITY */}
      <h2>Disclaimers and Limitation of Liability</h2>
      <p>
        The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; basis. To the fullest extent permitted by law, Olera
        disclaims all warranties in connection with the Service. Our total
        liability arising out of or relating to the Service will not exceed the
        amount you have paid to Olera for the Service. The limitations and
        disclaimers in our <a href="/terms">Terms of Use</a> also apply to the
        Service.
      </p>

      {/* 13. CHANGES TO THESE TERMS */}
      <h2>Changes to These Terms</h2>
      <p>
        We may update these terms from time to time. When we do, we will revise
        the &ldquo;Last Updated&rdquo; date above. Continued use of the Service
        after a change means you accept the updated terms.
      </p>

      {/* 14. GOVERNING LAW */}
      <h2>Governing Law</h2>
      <p>
        These terms are governed by the laws of the State of Texas, without regard
        to its conflict of law principles. The dispute-resolution provisions of
        our <a href="/terms">Terms of Use</a> apply to the Service.
      </p>

      {/* 15. CONTACT */}
      <h2>Contact Us</h2>
      <p>
        Questions about Managed Ads? Reach us at:
      </p>
      <p>
        Olera, Inc.
        <br />
        1337 W 43rd St., Unit #1010
        <br />
        Houston, TX 77018
      </p>
      <p>
        Email: support@olera.care
      </p>
    </LegalPageLayout>
  );
}
