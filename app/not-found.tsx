import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-primary-600 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors min-h-[44px]"
          >
            Go home
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-lg bg-white text-primary-700 border-2 border-primary-600 hover:bg-primary-50 transition-colors min-h-[44px]"
          >
            Browse care options
          </Link>
        </div>
      </div>
    </div>
  );
}
