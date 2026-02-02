import Link from "next/link";

export interface Provider {
  id: string;
  slug: string;
  name: string;
  image: string;
  address: string;
  rating: number;
  priceRange: string;
  careTypes: string[];
  verified: boolean;
}

interface ProviderCardProps {
  provider: Provider;
}

export default function ProviderCard({ provider }: ProviderCardProps) {
  const displayedCareTypes = provider.careTypes.slice(0, 2);
  const remainingCount = provider.careTypes.length - 2;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      {/* Image Container */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={provider.image}
          alt={provider.name}
          className="w-full h-full object-cover"
        />
        {/* Verified Badge */}
        {provider.verified && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary-600 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Verified
          </div>
        )}
        {/* Favorite Button */}
        <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
          <svg
            className="w-5 h-5 text-gray-400 hover:text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name and Rating */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            {provider.name}
          </h3>
          <div className="flex items-center gap-1 text-primary-600 shrink-0">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-semibold">{provider.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Address */}
        <p className="text-gray-500 text-sm mt-1">{provider.address}</p>

        {/* Price */}
        <div className="mt-3">
          <p className="text-gray-500 text-xs">Estimated Pricing</p>
          <p className="text-gray-900 font-semibold">{provider.priceRange}</p>
        </div>

        {/* Care Types */}
        <div className="flex flex-wrap gap-2 mt-3">
          {displayedCareTypes.map((type) => (
            <span
              key={type}
              className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full"
            >
              {type}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
              +{remainingCount} more
            </span>
          )}
        </div>

        {/* CTA Button */}
        <Link
          href={`/provider/${provider.slug}`}
          className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center"
        >
          Go to provider page
        </Link>
      </div>
    </div>
  );
}
