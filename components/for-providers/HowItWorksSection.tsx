export default function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-serif text-display-sm md:text-display-md font-bold text-gray-900">
            See how it works
          </h2>
          <p className="mt-3 text-lg text-gray-500 max-w-xl mx-auto">
            One platform. Two pipelines. Here is how providers use Olera to
            grow their business.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-0">
          {/* Families side */}
          <div className="lg:border-r lg:border-gray-200 lg:pr-12 pb-12 lg:pb-0">
            <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-8">
              Finding families
            </p>
            <div className="space-y-8">
              {[
                {
                  num: "01",
                  title: "Set up your profile",
                  desc: "Add your services, photos, and service area. Takes a few minutes. Your profile goes live immediately.",
                },
                {
                  num: "02",
                  title: "Families find you",
                  desc: "Through Google, Bing, ChatGPT, Claude, and Olera search. Optimized so you rank for care in your area.",
                },
                {
                  num: "03",
                  title: "They send a connection request",
                  desc: "Direct to your inbox. Every lead is exclusive and free. No commissions, no middlemen.",
                },
                {
                  num: "04",
                  title: "You schedule a meeting",
                  desc: "Respond, qualify, and convert. With Pro, you can also proactively match and reach out to high-intent families.",
                },
              ].map((step) => (
                <div key={step.num} className="flex gap-5">
                  <span className="text-3xl font-bold text-gray-200 leading-none pt-0.5 shrink-0 w-10 tabular-nums">
                    {step.num}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900">
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hiring side */}
          <div className="lg:pl-12 pt-12 lg:pt-0 border-t lg:border-t-0 border-gray-200">
            <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-8">
              Hiring staff
            </p>
            <div className="space-y-8">
              {[
                {
                  num: "01",
                  title: "Browse caregiver profiles",
                  desc: "Pre-health university caregivers, pre-vetted. Each profile includes a video intro and scenario-based responses.",
                },
                {
                  num: "02",
                  title: "Watch their video intro",
                  desc: "See who you are hiring before you schedule an interview. Assess communication, professionalism, and fit.",
                },
                {
                  num: "03",
                  title: "Schedule an interview",
                  desc: "Reach out directly. No gatekeepers, no agency in the middle. Caregivers can also find and request to connect with you.",
                },
                {
                  num: "04",
                  title: "Hire",
                  desc: "Your first three hires are free. After that, $50/month unlocks unlimited hiring and family matching.",
                },
              ].map((step) => (
                <div key={step.num} className="flex gap-5">
                  <span className="text-3xl font-bold text-gray-200 leading-none pt-0.5 shrink-0 w-10 tabular-nums">
                    {step.num}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900">
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
