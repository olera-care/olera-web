import { seriesMeta } from "@/lib/aging-in-america-data"

export default function AboutSection() {
  const paragraphs = seriesMeta.aboutBody.split("\n\n")

  return (
    <section className="py-24 md:py-32 border-t border-gray-800/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
          {/* Left — Headline */}
          <div>
            <span className="text-xs tracking-widest text-gray-500 uppercase mb-6 block">
              About
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
              {seriesMeta.aboutHeadline}
            </h2>
          </div>

          {/* Right — Body */}
          <div className="flex flex-col justify-end">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-gray-400 leading-relaxed mb-5 last:mb-0"
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
