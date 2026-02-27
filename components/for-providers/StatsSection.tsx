import Image from "next/image";

const partners = [
  {
    name: "HomeWell Care Services",
    logo: "/images/for-providers/partners/homewell.png",
  },
  {
    name: "SYNERGY HomeCare",
    logo: "/images/for-providers/partners/synergy.png",
  },
  {
    name: "Senior Helpers",
    logo: "/images/for-providers/partners/senior-helpers.png",
  },
];

export default function StatsSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-4">
      {/* Full-bleed card with background image + teal overlay */}
      <div className="relative max-w-[1312px] mx-auto rounded-3xl overflow-hidden min-h-[320px] sm:min-h-[380px]">
        {/* Background image */}
        <Image
          src="/images/for-providers/stats-couple.jpg"
          alt="Elderly man and young woman laughing together"
          fill
          className="object-cover"
          sizes="100vw"
        />

        {/* Teal overlay — heavier on the left for text, transparent on the right to show photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-800/90 via-primary-700/80 to-primary-600/50" />

        {/* Content */}
        <div className="relative z-10 flex items-center h-full min-h-[320px] sm:min-h-[380px] p-8 sm:p-12 lg:p-16">
          <div className="max-w-lg">
            <h2 className="font-serif text-display-sm sm:text-display-md lg:text-display-lg font-bold text-white leading-tight">
              Over 40,000 providers
              <br />
              on Olera
            </h2>
            <p className="mt-4 text-text-lg text-white/85">
              Join thousands of home care and senior living communities
            </p>

            {/* Partner logos — overlapping circles */}
            <div className="mt-8 flex items-center">
              <div className="flex -space-x-3">
                {partners.map((partner) => (
                  <div
                    key={partner.name}
                    className="w-12 h-12 rounded-full bg-white border-2 border-white overflow-hidden flex items-center justify-center shadow-sm"
                  >
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      width={48}
                      height={48}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                ))}
              </div>
              <span className="ml-3 text-text-sm font-medium text-white/80">
                & more
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
