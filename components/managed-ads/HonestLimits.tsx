import Link from "next/link";

/**
 * The section that makes the rest of the page believable.
 *
 * Everything above claims competence. A provider has heard that before, from
 * someone who then hid the results. This says the parts that are unimpressive,
 * in specifics, before they can be discovered — which is the only version of
 * this that is worth anything.
 *
 * NUMBERS HERE ARE LOAD-BEARING. Verified 2026-09-07 against the program totals
 * read directly in Google Ads on 2026-09-06 ($535.28, 255 clicks, 4,473
 * impressions, 7 attributed inquiries) and the Nextdoor pilot finals read at
 * source on 2026-08-26 (8,318 impressions, 134 clicks, $50.00, $0.37 CPC).
 * If you update one, update the ticker's source data and say when it was read.
 * Do not restate the outcome line as "one confirmed client": the platform never
 * saw it, and that distinction is the whole point of the paragraph.
 */

const LIMITS = [
  {
    title: "We are small, and the numbers are small",
    body:
      "Across every provider campaign we have ever run, about $535 has bought roughly 255 clicks and seven family inquiries. That is around $76 an inquiry. It is a real rate measured on real money, and it is not a large enough sample to promise anything from.",
  },
  {
    title: "One client, and our own system never saw it",
    body:
      "A provider told us on the phone that a family from her campaign became a client. Nothing in our platform recorded it, and of the other inquiries one was an explicit no, one was not a fit, and four were never followed up to a conclusion by anyone. That gap is why we now ask every provider, twice, whether a family became a client.",
  },
  {
    title: "At the free tier you should expect almost nothing",
    body:
      "Fifty dollars buys about twenty five clicks, which works out at well under one expected inquiry. Roughly half of perfectly good campaigns at that size produce zero. The free campaign is there so you can see the machine work on your own page, not so you can judge the market from it.",
  },
  {
    title: "Nextdoor delivered cheap clicks and no leads",
    body:
      "Our one completed Nextdoor flight spent $50 for 8,318 impressions and 134 clicks at 37 cents each, which is a fifth of what a search click costs. It produced no contactable leads at all. Cheap attention is not the same as demand, and we would rather tell you that than sell you the click price.",
  },
  {
    title: "We have never run a Meta campaign",
    body:
      "Facebook and Instagram are next, not current. Everything on this page was learned on Google Search, with one Nextdoor pilot alongside it. When we have run Meta we will publish what it did, including if it did nothing.",
  },
  {
    title: "Some of our own reporting lags",
    body:
      "Spend and click totals are read off each ad platform by hand during the optimization sweep rather than piped in automatically, so between sweeps the recorded figures sit behind the truth. We would rather show you a number a person checked and dated than one that is merely fast.",
  },
];

export default function HonestLimits() {
  return (
    <section className="bg-gray-900 px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-3xl font-serif text-display-sm font-bold text-white md:text-display-md">
          What we are not going to tell you
        </h2>
        <p className="mt-3 max-w-2xl text-text-md text-gray-300">
          That this is proven. Here is where it is thin, in the same detail as everything above.
        </p>

        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {LIMITS.map((l) => (
            <div key={l.title}>
              <h3 className="font-serif text-text-lg font-bold text-white">{l.title}</h3>
              <p className="mt-2 text-text-sm leading-relaxed text-gray-300">{l.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="max-w-2xl text-text-lg leading-relaxed text-white">
            The offer is that your first campaign costs nothing, you keep every family who
            contacts you, and we show you exactly what your money bought.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/provider/boost"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-7 py-3 text-text-md font-semibold text-gray-900 transition-colors hover:bg-gray-100"
            >
              Start your first campaign
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-gray-600 px-7 py-3 text-text-md font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Ask us something first
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
