import ConnectionStatusClient from "./ConnectionStatusClient";

/**
 * Landing page for provider connection status self-report.
 * URL: /provider/connection-status?tok=<signed_token>
 *
 * The token encodes the connectionId and value (connected/not_a_fit/no_capacity).
 * The client component POSTs on mount (scanner-safe pattern) and shows a
 * confirmation message based on the reported status.
 */
export default async function ConnectionStatusPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tok = typeof sp.tok === "string" ? sp.tok : "";
  return <ConnectionStatusClient tok={tok} />;
}
