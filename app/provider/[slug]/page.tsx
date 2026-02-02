import Link from "next/link";

// Dummy provider data - same as homepage for consistency
const providers = [
  {
    id: "1",
    slug: "sunrise-senior-living",
    name: "Sunrise Senior Living",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    address: "1234 Oak Street, Austin, TX 78701",
    rating: 4.8,
    priceRange: "$3,500-5,000 / mo",
    careTypes: ["Assisted Living", "Memory Care", "Respite Care"],
    verified: true,
    phone: "(512) 555-0123",
    description: "Sunrise Senior Living offers compassionate care in a warm, home-like environment. Our dedicated team provides personalized support for residents with varying care needs, from independent living assistance to specialized memory care programs.",
    amenities: ["24/7 Staff", "Restaurant-Style Dining", "Fitness Center", "Gardens", "Transportation", "Salon Services"],
    hours: "Tours available 7 days a week, 9am - 5pm",
  },
  {
    id: "2",
    slug: "harmony-care-home",
    name: "Harmony Care Home",
    image: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800",
    address: "5678 Maple Avenue, Austin, TX 78702",
    rating: 4.6,
    priceRange: "$4,200-6,500 / mo",
    careTypes: ["Memory Care", "Hospice", "Skilled Nursing"],
    verified: true,
    phone: "(512) 555-0456",
    description: "Harmony Care Home specializes in memory care and skilled nursing services. Our evidence-based approach combines medical expertise with compassionate care to ensure the best quality of life for our residents.",
    amenities: ["Secure Memory Care Unit", "Physical Therapy", "Occupational Therapy", "Private Rooms", "Family Support Groups", "Pet Therapy"],
    hours: "Tours available Monday - Saturday, 10am - 4pm",
  },
  {
    id: "3",
    slug: "golden-years-residence",
    name: "Golden Years Residence",
    image: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800",
    address: "910 Pine Road, Austin, TX 78703",
    rating: 4.5,
    priceRange: "$2,800-4,200 / mo",
    careTypes: ["Independent Living", "Assisted Living"],
    verified: true,
    phone: "(512) 555-0789",
    description: "Golden Years Residence provides a vibrant community for active seniors. With a range of social activities, wellness programs, and supportive services, we help residents maintain their independence while enjoying a fulfilling lifestyle.",
    amenities: ["Swimming Pool", "Library", "Art Studio", "Movie Theater", "Shuttle Service", "Housekeeping"],
    hours: "Tours available 7 days a week, 8am - 6pm",
  },
  {
    id: "4",
    slug: "caring-hearts-home-care",
    name: "Caring Hearts Home Care",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800",
    address: "Serving Greater Austin Area",
    rating: 4.9,
    priceRange: "$25-45 / hr",
    careTypes: ["Home Care", "Respite Care", "Companion Care"],
    verified: true,
    phone: "(512) 555-1234",
    description: "Caring Hearts Home Care brings professional, compassionate care directly to your home. Our certified caregivers provide personalized support that allows seniors to age in place with dignity and comfort.",
    amenities: ["Flexible Scheduling", "Certified Caregivers", "Care Coordination", "Family Updates", "Medication Reminders", "Light Housekeeping"],
    hours: "24/7 Care Available",
  },
];

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = providers.find((p) => p.slug === slug);

  if (!provider) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Provider not found</h1>
        <p className="mt-2 text-gray-600">The provider you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="mt-4 inline-block text-primary-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section with Image */}
      <div className="relative h-64 md:h-80 bg-gray-300">
        <img
          src={provider.image}
          alt={provider.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {provider.verified && (
              <span className="inline-flex items-center gap-1.5 bg-white/90 text-primary-600 text-sm font-medium px-3 py-1 rounded-full mb-3">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified Provider
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white">{provider.name}</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-wrap gap-4 items-center text-sm">
                <div className="flex items-center gap-2 text-primary-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold">{provider.rating.toFixed(1)} rating</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">{provider.address}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {provider.careTypes.map((type) => (
                  <span
                    key={type}
                    className="bg-primary-50 text-primary-700 text-sm px-3 py-1 rounded-full"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed">{provider.description}</p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities & Services</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {provider.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Contact Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm">Estimated Pricing</p>
                <p className="text-2xl font-bold text-gray-900">{provider.priceRange}</p>
              </div>

              <div className="space-y-4">
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors">
                  Request Consultation
                </button>
                <a
                  href={`tel:${provider.phone}`}
                  className="w-full border border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {provider.phone}
                </a>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 text-center">{provider.hours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to search
          </Link>
        </div>
      </div>
    </div>
  );
}
