import AvailabilityClient from "./AvailabilityClient";

/**
 * Landing page for provider availability self-report.
 * URL: /provider/availability?tok=<signed_token>
 *
 * The token encodes the profileId and value (yes/no).
 * The client component POSTs on mount (scanner-safe) and shows a
 * confirmation message.
 */
export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tok = typeof sp.tok === "string" ? sp.tok : "";
  return <AvailabilityClient tok={tok} />;
}
