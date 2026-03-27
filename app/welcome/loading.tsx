export default function WelcomeLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-2xl mx-auto px-5 sm:px-6">
        {/* Header skeleton */}
        <section className="pt-10 sm:pt-14 pb-8">
          <div className="h-4 w-32 bg-gray-100 rounded-md animate-pulse" />
          <div className="mt-2 h-8 w-56 bg-gray-100 rounded-md animate-pulse" />
        </section>

        {/* Hero card skeleton — side-by-side layout */}
        <section className="pb-8">
          <div className="rounded-2xl border border-gray-200/60 overflow-hidden animate-pulse">
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-[200px] aspect-square sm:aspect-auto sm:min-h-[220px] bg-gray-100" />
              <div className="flex-1 p-5 space-y-3">
                <div className="h-5 w-48 bg-gray-100 rounded-md" />
                <div className="h-3 w-32 bg-gray-100 rounded-md" />
                <div className="h-3 w-56 bg-gray-100 rounded-md mt-4" />
                <div className="h-1.5 w-full bg-gray-100 rounded-full mt-3" />
              </div>
            </div>
          </div>
        </section>

        {/* Step cards skeleton */}
        <section className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-36 bg-gray-100 rounded-md" />
                  <div className="h-3 w-24 bg-gray-100 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
