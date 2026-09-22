import ScriptsDoc from "@/components/admin/medjobs/ScriptsDoc";

/**
 * SOP · Scripts — the master instructions, call scripts and email copy.
 *
 * The fifth SOP page, and the only one that is not a PDF. The other four are
 * the operating model, which changes deliberately and is reviewed. This one
 * is the words we say, which improve every week and should be improvable by
 * whoever learned the improvement.
 */

export const metadata = { title: "MedJobs SOP — Instructions, Scripts and Email Copy" };

export default function MedJobsScriptsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <h1 className="text-[20px] font-semibold text-gray-900">
        Standard Operating Procedure (SOP) — Instructions, Scripts, and Email Copy
      </h1>
      <div className="mt-6">
        <ScriptsDoc />
      </div>
    </div>
  );
}
