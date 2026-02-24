import Link from "next/link";

const careTypes = [
  { label: "Assisted Living", href: "/assisted-living" },
  { label: "Home Care", href: "/home-care" },
  { label: "Memory Care", href: "/memory-care" },
  { label: "Home Health Care", href: "/home-health-care" },
  { label: "Nursing Homes", href: "/nursing-home" },
  { label: "Independent Living", href: "/independent-living" },
  { label: "Hospice Care", href: "/hospice" },
];

const popularCities = [
  { label: "Houston, TX", href: "/assisted-living/texas/houston" },
  { label: "Dallas, TX", href: "/assisted-living/texas/dallas" },
  { label: "Los Angeles, CA", href: "/assisted-living/california/los-angeles" },
  { label: "Phoenix, AZ", href: "/assisted-living/arizona/phoenix" },
  { label: "Chicago, IL", href: "/assisted-living/illinois/chicago" },
  { label: "New York, NY", href: "/assisted-living/new-york/new-york" },
  { label: "San Antonio, TX", href: "/assisted-living/texas/san-antonio" },
  { label: "Miami, FL", href: "/assisted-living/florida/miami" },
  { label: "Atlanta, GA", href: "/assisted-living/georgia/atlanta" },
  { label: "Philadelphia, PA", href: "/assisted-living/pennsylvania/philadelphia" },
  { label: "Denver, CO", href: "/assisted-living/colorado/denver" },
  { label: "Seattle, WA", href: "/assisted-living/washington/seattle" },
];

const popularStates = [
  { label: "Texas", href: "/assisted-living/texas" },
  { label: "California", href: "/assisted-living/california" },
  { label: "Florida", href: "/assisted-living/florida" },
  { label: "New York", href: "/assisted-living/new-york" },
  { label: "Pennsylvania", href: "/assisted-living/pennsylvania" },
  { label: "Illinois", href: "/assisted-living/illinois" },
  { label: "Ohio", href: "/assisted-living/ohio" },
  { label: "Georgia", href: "/assisted-living/georgia" },
  { label: "North Carolina", href: "/assisted-living/north-carolina" },
  { label: "Arizona", href: "/assisted-living/arizona" },
  { label: "Michigan", href: "/assisted-living/michigan" },
  { label: "Virginia", href: "/assisted-living/virginia" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200/80">
      {/* Browse by Location — pre-footer SEO section */}
      <div className="border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Find Care Near You</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Care Types */}
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">By Care Type</h4>
              <ul className="space-y-2">
                {careTypes.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Cities */}
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Popular Cities</h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {popularCities.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular States */}
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Browse by State</h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {popularStates.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 min-h-[300px] flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2.5 mb-5">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Olera</span>
            </Link>
            <p className="text-gray-500 max-w-sm leading-relaxed text-[15px]">
              Helping families find the right senior care. Compare trusted
              providers in your area and connect with confidence.
            </p>
          </div>

          {/* For Families */}
          <div>
            <h3 className="text-gray-900 font-semibold text-sm uppercase tracking-wider mb-5">For Families</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/browse"
                  className="text-gray-500 hover:text-primary-600 transition-colors text-[15px]"
                >
                  Browse Care Options
                </Link>
              </li>
              <li>
                <Link
                  href="/assisted-living"
                  className="text-gray-500 hover:text-primary-600 transition-colors text-[15px]"
                >
                  Assisted Living
                </Link>
              </li>
              <li>
                <Link
                  href="/home-care"
                  className="text-gray-500 hover:text-primary-600 transition-colors text-[15px]"
                >
                  Home Care
                </Link>
              </li>
              <li>
                <Link
                  href="/memory-care"
                  className="text-gray-500 hover:text-primary-600 transition-colors text-[15px]"
                >
                  Memory Care
                </Link>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h3 className="text-gray-900 font-semibold text-sm uppercase tracking-wider mb-5">For Providers</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/for-providers"
                  className="text-gray-500 hover:text-primary-600 transition-colors text-[15px]"
                >
                  Why Olera?
                </Link>
              </li>
              <li>
                <Link
                  href="/for-providers/create"
                  className="text-gray-500 hover:text-primary-600 transition-colors text-[15px]"
                >
                  Claim Your Listing
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-auto pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-[15px]">
            &copy; {new Date().getFullYear()} Olera. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700 text-[15px] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700 text-[15px] transition-colors">
              Terms
            </Link>
            <Link href="/support" className="text-gray-500 hover:text-gray-700 text-[15px] transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
