import { FaqAccordion } from "@/components/waiver-library/FaqAccordion";

interface Faq {
  question: string;
  answer: string;
}

export function ProgramFaqSection({ faqs }: { faqs: Faq[] | undefined }) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <section className="pb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <FaqAccordion faqs={faqs} columns={1} />
        </div>
      </div>
    </section>
  );
}
