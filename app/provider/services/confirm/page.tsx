import ServicesConfirmClient from "./ServicesConfirmClient";

/**
 * Landing page for one-click service confirmation from building emails.
 * URL: /provider/services/confirm?tok=<signed_token>
 *
 * The token encodes the profileId, services[], and email.
 * The client component POSTs on mount (scanner-safe) and shows
 * a confirmation with the services that were added.
 */
export default async function ServicesConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tok = typeof sp.tok === "string" ? sp.tok : "";
  return <ServicesConfirmClient tok={tok} />;
}
