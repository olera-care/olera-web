"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function PortalDashboard() {
  const { activeProfile, membership } = useAuth();

  if (!activeProfile) {
    return (
      <EmptyState
        title="No profile found"
        description="Complete onboarding to set up your profile."
        action={<Link href="/onboarding"><Button>Complete setup</Button></Link>}
      />
    );
  }

  const isProvider =
    activeProfile.type === "organization" ||
    activeProfile.type === "caregiver";

  const trialDaysRemaining = getTrialDaysRemaining(membership?.trial_ends_at);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-lg text-gray-600 mt-1">
          Welcome back, {activeProfile.display_name}.
        </p>
      </div>

      {/* Trial banner for providers */}
      {isProvider && membership?.status === "trialing" && trialDaysRemaining !== null && (
        <div className="mb-8 bg-primary-50 border border-primary-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-primary-800">
                  Free trial active
                </h2>
                <Badge variant="trial">Trial</Badge>
              </div>
              <p className="text-base text-primary-700">
                {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""}{" "}
                remaining. You have full access to respond to inquiries and
                connect with families.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expired trial banner */}
      {isProvider && membership?.status === "free" && (
        <div className="mb-8 bg-warm-50 border border-warm-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-warm-800 mb-1">
            Trial ended
          </h2>
          <p className="text-base text-warm-700">
            Upgrade to Pro to respond to inquiries and connect with families.
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Profile views"
          value="—"
          description="Coming soon"
        />
        {isProvider && (
          <>
            <StatCard
              label="Inquiries received"
              value="0"
              description="No inquiries yet"
            />
            <StatCard
              label="Response rate"
              value="—"
              description="Start responding to build your rate"
            />
          </>
        )}
        {activeProfile.type === "family" && (
          <>
            <StatCard
              label="Inquiries sent"
              value="0"
              description="Request a consultation to get started"
            />
            <StatCard
              label="Saved providers"
              value="0"
              description="Save providers while you browse"
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Get started
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuickAction
            title="Complete your profile"
            description="Add more details to help families find you."
            href="/portal/profile"
            show={isProvider}
          />
          <QuickAction
            title="Browse providers"
            description="Find and compare care options near you."
            href="/browse"
            show={activeProfile.type === "family"}
          />
          <QuickAction
            title="View your public profile"
            description="See how your profile appears to families."
            href={`/provider/${activeProfile.slug}`}
            show={isProvider}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <p className="text-base text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-base text-gray-500">{description}</p>
    </div>
  );
}

function QuickAction({
  title,
  description,
  href,
  show,
}: {
  title: string;
  description: string;
  href: string;
  show: boolean;
}) {
  if (!show) return null;

  return (
    <a
      href={href}
      className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all group"
    >
      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 mb-1">
        {title}
      </h3>
      <p className="text-base text-gray-600">{description}</p>
    </a>
  );
}

function getTrialDaysRemaining(trialEndsAt: string | null | undefined): number | null {
  if (!trialEndsAt) return null;
  const now = new Date();
  const end = new Date(trialEndsAt);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
