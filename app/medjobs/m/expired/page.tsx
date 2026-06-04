import Link from "next/link";

/**
 * Magic-link landing — expired / invalid token. Phase 2+3 Bullet 5
 * (2026-06-04).
 *
 * Renders when a token fails verifyWelcomeToken (expired / bad sig /
 * malformed) OR when the landing route can't complete (Supabase error,
 * missing outreach row, etc.). Different `?reason=` query values get
 * different copy so admin debugging a stuck provider can tell what
 * happened. Provider-facing copy stays the same: "this link is no
 * longer working; reach out and we'll send a fresh one."
 */
export default async function ExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const reasonLabel = labelFor(reason);

  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="font-serif text-3xl text-gray-900">
        This link is no longer working.
      </h1>
      <p className="mt-3 text-base text-gray-600">{reasonLabel}</p>
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <p>
          Reach out to{" "}
          <a
            href="mailto:logan@olera.care"
            className="font-semibold text-primary-700 hover:underline"
          >
            logan@olera.care
          </a>{" "}
          and we&apos;ll send you a fresh link.
        </p>
      </div>
      <div className="mt-8">
        <Link
          href="/medjobs/candidates"
          className="text-sm font-medium text-primary-700 hover:underline"
        >
          Browse the candidate board →
        </Link>
      </div>
    </main>
  );
}

function labelFor(reason: string | undefined): string {
  switch (reason) {
    case "expired":
      return "The link expired (links are valid for 30 days).";
    case "invalid":
      return "The link didn't match what we sent. Sometimes copy-paste truncates it.";
    case "missing":
      return "We can't find the original outreach this link belongs to.";
    case "user":
      return "We hit an error setting up your account.";
    case "link":
      return "We hit an error establishing your session.";
    case "config":
      return "Something on our side isn't quite right yet.";
    default:
      return "Something didn't go through.";
  }
}
