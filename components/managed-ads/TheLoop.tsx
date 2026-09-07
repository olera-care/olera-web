/**
 * The operating-discipline section.
 *
 * The point is not "we check on it". It is that the checking has rules that can
 * be violated, and one of them is enforced by the database rather than by
 * anyone's diligence. Concrete constraints are the only credible way to say
 * "managed" and mean something.
 */

const STEPS = [
  {
    n: "01",
    title: "Every live campaign, every three to four days",
    body:
      "A two-week flight only has about three useful checks in it before the money is gone, so the cadence is set by the budget rather than by a monthly reporting habit. Every campaign is read against the same fixed set of numbers, so they can be compared against each other rather than each judged on its own story.",
  },
  {
    n: "02",
    title: "Every change is written down with the result we expect",
    body:
      "A change is recorded with what we predicted it would do and the date we will come back and check. The database refuses to store one without both. It means we cannot quietly forget a change that did not work, and it is why we can tell you why your campaign looks the way it does six weeks later.",
  },
  {
    n: "03",
    title: "One change at a time, then wait",
    body:
      "We never adjust the keywords and the filters in the same pass, because then no one can say which did what. Filters first, forty eight hours, re-read, and only then touch the keywords. Slower on purpose. It is the difference between managing a campaign and fiddling with it.",
  },
  {
    n: "04",
    title: "Knowing the difference between a bad result and no result",
    body:
      "A $50 budget buys about 25 clicks. At the rate families actually inquire, that is well under one expected inquiry, so roughly half of correctly built campaigns produce zero and nothing is wrong. We will not redesign your campaign because of that, and we will tell you so rather than look busy. Zero impressions is the number that means something is broken.",
  },
];

export default function TheLoop() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-3xl font-serif text-display-sm font-bold text-gray-900 md:text-display-md">
          What managed actually means here
        </h2>
        <p className="mt-3 max-w-2xl text-text-md text-gray-600">
          Campaigns do not drift because nobody cares. They drift because the platform changes
          things on its own and nothing tells you. The routine exists to catch that.
        </p>

        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-5">
              <div className="shrink-0 font-sans text-text-sm font-semibold tabular-nums text-primary-600">
                {s.n}
              </div>
              <div>
                <h3 className="font-serif text-text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-text-sm leading-relaxed text-gray-600">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-gray-200 bg-vanilla-100 p-6 sm:p-8">
          <h3 className="font-serif text-text-lg font-bold text-gray-900">
            And a standing check on the thing the ads point at
          </h3>
          <p className="mt-2 max-w-3xl text-text-sm leading-relaxed text-gray-600">
            Before a campaign spends anything we open your page and look at it the way a family
            would. On one batch of four providers, every one passed an automatic has-photos check
            and every one had a problem worth fixing first: a hero image that was a photograph of a
            printed brochure, a home care agency showing a facility dining hall, and a care home
            whose second photo was a crock pot. Ordering is usually the fix, it costs nothing, and
            it is worth more than any keyword.
          </p>
        </div>
      </div>
    </section>
  );
}
