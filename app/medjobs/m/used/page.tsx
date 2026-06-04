import Link from "next/link";

/**
 * Magic-link landing — token already redeemed. Phase 2+3 Bullet 5
 * (2026-06-04).
 *
 * Renders when a magic-link token's JTI is already in the touchpoint
 * ledger — the link was clicked before. Provider still has a session
 * cookie from the first click (the magic-link landing route established
 * one), so we point them at the candidate board OR a sign-in page with
 * the email pre-filled.
 */
export default async function UsedPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="font-serif text-3xl text-gray-900">
        You&apos;ve already used this link.
      </h1>
      <p className="mt-3 text-base text-gray-600">
        Each invitation link is one-time use for security.
      </p>
      <div className="mt-6 space-y-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <p>
          If you&apos;re still signed in from the first click, you can pick up
          where you left off:
        </p>
        <Link
          href="/medjobs/candidates"
          className="inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Go to the candidate board →
        </Link>
        {email && (
          <p className="pt-2 text-xs text-gray-500">
            Need to sign in again? Use{" "}
            <span className="font-mono">{email}</span> at{" "}
            <Link
              href={`/login?email=${encodeURIComponent(email)}`}
              className="font-medium text-primary-700 hover:underline"
            >
              olera.care/login
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
