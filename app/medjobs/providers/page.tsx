import { redirect } from "next/navigation";

/**
 * The provider marketing landing converged into /medjobs/candidates (the same
 * move we did for students: /medjobs → /medjobs/families). This route now
 * redirects there, preserving any threaded query params (?campus=, ?welcome=)
 * so cold-email / outreach links keep landing filtered + auto-opening the quiz.
 */
export default async function MedJobsProvidersRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") qs.set(k, v);
    else if (Array.isArray(v) && v[0]) qs.set(k, v[0]);
  }
  const query = qs.toString();
  redirect(query ? `/medjobs/candidates?${query}` : "/medjobs/candidates");
}
