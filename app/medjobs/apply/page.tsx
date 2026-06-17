import { redirect } from "next/navigation";

/**
 * The student application is now the eligibility screener on the public
 * families board. This legacy path redirects there, preserving attribution
 * params (campus / uni / pid / src) and auto-opening the screener.
 */
export default async function ApplyRedirect({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp ?? {})) {
    if (typeof v === "string") qs.set(k, v);
  }
  qs.set("screener", "1");
  redirect(`/medjobs/families?${qs.toString()}`);
}
