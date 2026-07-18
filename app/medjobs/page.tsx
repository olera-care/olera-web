import { redirect } from "next/navigation";

/**
 * The student landing has been folded into the converged /medjobs/families
 * page (board + "how it works" + audience sections). This route now redirects
 * there; its metadata and sections live on /medjobs/families.
 */
export default function MedJobsPage() {
  redirect("/medjobs/families");
}
