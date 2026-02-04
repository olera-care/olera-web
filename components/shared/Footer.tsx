import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 min-h-[420px] flex flex-col">
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
                  href="/browse?type=assisted-living"
                  className="text-gray-500 hover:text-primary-600 transition-colors text-[15px]"
                >
                  Assisted Living
                </Link>
              </li>
              <li>
                <Link
                  href="/browse?type=home-care"
                  className="text-gray-500 hover:text-primary-600 transition-colors text-[15px]"
                >
                  Home Care
                </Link>
              </li>
              <li>
                <Link
                  href="/browse?type=memory-care"
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
                  href="/for-providers/claim"
                  className="text-gray-500 hover:text-primary-600 transition-colors text-[15px]"
                >
                  Claim Your Listing
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-auto pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Olera. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-gray-400 text-sm cursor-default">
              Privacy
            </span>
            <span className="text-gray-400 text-sm cursor-default">
              Terms
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
