import Link from "next/link";

/** Minimal legal-only footer for hub/account pages. */
export default function SimpleFooter() {
  return (
    <footer className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-gray-500 text-[15px]">
          &copy; {new Date().getFullYear()} Olera. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="text-gray-500 hover:text-gray-700 text-[15px] transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-gray-500 hover:text-gray-700 text-[15px] transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/support"
            className="text-gray-500 hover:text-gray-700 text-[15px] transition-colors"
          >
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
