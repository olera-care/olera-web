import ScriptsDoc from "@/components/admin/medjobs/ScriptsDoc";

/**
 * SOP · Scripts — the master call scripts and email copy.
 *
 * The fifth SOP page, and the only one that is not a PDF. The other four are
 * the operating model, which changes deliberately and is reviewed. This one
 * is the words we say, which improve every week and should be improvable by
 * whoever learned the improvement.
 */

export const metadata = { title: "MedJobs Scripts" };

export default function MedJobsScriptsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <h1 className="text-[20px] font-semibold text-gray-900">Scripts and email copy</h1>
      <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-gray-500">
        Everything we say, in one place. Read it before a call, copy from it when
        you write, and add to it when you learn something — every section is
        editable, and what you write is what the next person reads.
      </p>
      <div className="mt-6">
        <ScriptsDoc />
      </div>
    </div>
  );
}
