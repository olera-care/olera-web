import { redirect } from "next/navigation";

/**
 * The student families board moved to the public route /medjobs/families
 * (eligibility-screener funnel). This protected path now redirects there.
 */
export default function JobsRedirect() {
  redirect("/medjobs/families");
}
