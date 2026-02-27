import Image from "next/image";

const leaders = [
  {
    name: "TJ Falohun, MS",
    role: "CEO",
    bio: "Before Olera, TJ worked at Pfizer as a biomedical engineer, designing auto-injectors.",
    linkedIn: "https://www.linkedin.com/in/tj-falohun/",
    image: "/images/for-providers/team/tj.jpg",
  },
  {
    name: "Logan DuBose, MD, MBA",
    role: "COO",
    bio: "Logan combines his clinical and business expertise to transform senior care, driving Olera\u2019s mission to deliver compassionate, comprehensive solutions.",
    linkedIn: "https://www.linkedin.com/in/logan-dubose/",
    image: "/images/for-providers/team/logan.jpg",
  },
];

export default function LeadershipSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-display-md font-bold text-gray-900 text-center mb-12">
          Our Leadership
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {leaders.map((leader) => (
            <div key={leader.name} className="flex gap-5">
              {/* Headshot — tall portrait */}
              <div className="shrink-0 w-40 sm:w-48 aspect-[3/4] rounded-lg overflow-hidden">
                <Image
                  src={leader.image}
                  alt={leader.name}
                  width={192}
                  height={256}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-between min-w-0 py-1">
                <div>
                  <span className="text-text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {leader.role}
                  </span>
                  <h3 className="text-text-lg font-bold text-gray-900 mt-0.5">
                    {leader.name}
                  </h3>
                  <p className="text-text-sm text-gray-600 mt-3 leading-relaxed">
                    {leader.bio}
                  </p>
                </div>

                {/* LinkedIn logo — bottom right */}
                <div className="flex justify-end mt-4">
                  <a
                    href={leader.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${leader.name} on LinkedIn`}
                  >
                    <Image
                      src="/images/for-providers/linkedin.png"
                      alt="LinkedIn"
                      width={28}
                      height={28}
                      className="rounded"
                    />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
