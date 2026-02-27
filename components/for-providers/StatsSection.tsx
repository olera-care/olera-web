export default function StatsSection() {
  return (
    <section className="bg-primary-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-16 lg:py-20">
          {/* Left — Copy + Partner Logos */}
          <div>
            <h2 className="font-serif text-display-md md:text-display-lg font-bold leading-tight">
              Over 40,000 providers
              <br />
              on Olera
            </h2>
            <p className="mt-4 text-text-lg text-primary-100">
              Join thousands of home care and senior living communities
            </p>

            {/* Partner logos row */}
            <div className="mt-8 flex items-center gap-4 flex-wrap">
              {["Health", "Caring", "Yelp", "Google"].map((name) => (
                <div
                  key={name}
                  className="h-8 px-3 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <span className="text-text-xs font-medium text-white/80">
                    {name}
                  </span>
                </div>
              ))}
              <span className="text-text-sm text-primary-200">& more</span>
            </div>
          </div>

          {/* Right — Photo */}
          <div className="hidden lg:flex justify-end">
            <div className="w-full max-w-md aspect-[4/3] rounded-2xl bg-primary-600 flex items-center justify-center">
              <span className="text-primary-300 text-text-sm">
                Photo — elderly couple
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
