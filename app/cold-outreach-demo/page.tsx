"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Mock images - 6 images for the gallery
const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1600&q=80",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80",
  "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800&q=80",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&q=80",
  "https://images.unsplash.com/photo-1576765974257-b414b9e8f8ce?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
];

export default function ColdOutreachDemo() {
  return <ProviderPageTab />;
}

// =============================================================================
// Mock Provider Data - Full data like Chantel's Emerald Oaks
// =============================================================================
const MOCK_PROVIDER = {
  name: "Emerald Oaks Senior Living",
  slug: "emerald-oaks",
  category: "Independent Living",
  city: "Yuba City",
  state: "CA",
  address: "1550 Palora Avenue",
  rating: 4.6,
  reviewCount: 47,
  priceRange: "$3,880–5,800/mo",
  lastUpdated: "July 5, 2026",
  description: "Emerald Oaks offers resort-style independent living in the heart of Yuba City. Our community provides the perfect balance of privacy and community, with spacious apartments, chef-prepared dining, and a full calendar of activities. Whether you're looking for an active lifestyle or simply want to enjoy maintenance-free living, Emerald Oaks delivers an exceptional experience.",
  staffName: "Jennifer Martinez",
  staffTitle: "Community Director",
};

const MOCK_REVIEWS = [
  {
    id: 1,
    author: "Patricia H.",
    rating: 5,
    date: "2 weeks ago",
    text: "My mother has been at Emerald Oaks for 6 months and absolutely loves it. The staff treats her like family, and the activities keep her engaged and happy. The dining is excellent - she raves about the Sunday brunch!",
  },
  {
    id: 2,
    author: "Robert M.",
    rating: 5,
    date: "1 month ago",
    text: "We toured several communities before choosing Emerald Oaks. The apartments are spacious and well-maintained, and the amenities rival a resort. Dad especially loves the movie theater and billiards room.",
  },
  {
    id: 3,
    author: "Susan K.",
    rating: 4,
    date: "2 months ago",
    text: "Beautiful community with caring staff. The only reason for 4 stars instead of 5 is that some activities fill up quickly. But overall, we're very happy with Mom's care here.",
  },
  {
    id: 4,
    author: "Michael T.",
    rating: 5,
    date: "3 months ago",
    text: "The transition was seamless. Staff helped my parents every step of the way. Now they have an active social life and we have peace of mind knowing they're well cared for.",
  },
];

const MOCK_AMENITIES = [
  "Meal Services",
  "Transportation",
  "Housekeeping",
  "24/7 Support",
  "Emergency Response",
  "Social Activities",
  "Pet Friendly",
  "Accessible Facilities",
  "Outdoor Spaces",
];

const MOCK_SIMILAR_PROVIDERS = [
  {
    id: 1,
    name: "Sunrise Senior Living",
    category: "Independent Living",
    location: "Sacramento, CA",
    rating: 4.8,
    priceRange: "$3,500–5,200/mo",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80",
    highlight: "Highly Rated",
  },
  {
    id: 2,
    name: "Golden Oak Residences",
    category: "Independent Living",
    location: "Roseville, CA",
    rating: 4.6,
    priceRange: "$3,200–4,800/mo",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
    highlight: "Pet Friendly",
  },
  {
    id: 3,
    name: "Valley View Senior Community",
    category: "Independent Living",
    location: "Folsom, CA",
    rating: 4.7,
    priceRange: "$3,400–5,000/mo",
    image: null,
    highlight: "Newly Renovated",
  },
];

// =============================================================================
// Provider Page (Unclaimed Demo)
// =============================================================================
function ProviderPageTab() {
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  // Care services with icons
  const CARE_SERVICES = [
    { name: "Independent Living", icon: "home" },
    { name: "Wellness Programs", icon: "wellness" },
    { name: "Medication Management", icon: "medication" },
    { name: "Health Monitoring", icon: "health" },
    { name: "Emergency Response", icon: "emergency" },
    { name: "Coordination of Care", icon: "coordination" },
    { name: "Scheduled Transportation", icon: "transport" },
    { name: "Social Activities", icon: "social" },
    { name: "Meal Services", icon: "meal" },
    { name: "Personal Care", icon: "personal" },
  ];

  const visibleServices = showAllServices ? CARE_SERVICES : CARE_SERVICES.slice(0, 6);
  const visibleAmenities = showAllAmenities ? MOCK_AMENITIES : MOCK_AMENITIES.slice(0, 6);

  // Simple icon component
  const ServiceIcon = ({ type }: { type: string }) => {
    const iconClass = "w-6 h-6 text-gray-500";
    switch (type) {
      case "home":
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
      case "wellness":
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>;
      case "medication":
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.47 4.403a2.07 2.07 0 0 1-1.96 1.397H8.43a2.07 2.07 0 0 1-1.96-1.397L5 14.5m14 0H5" /></svg>;
      case "health":
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>;
      case "emergency":
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>;
      case "coordination":
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
      case "transport":
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>;
      case "social":
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>;
      case "meal":
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Zm-3 0a.375.375 0 1 1-.53 0L9 2.845l.265.265Zm6 0a.375.375 0 1 1-.53 0L15 2.845l.265.265Z" /></svg>;
      case "personal":
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
      default:
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ===== Hero Zone — Cream Background ===== */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-6">

        {/* Mobile: Provider name */}
        <h1 className="md:hidden text-2xl font-bold text-gray-900 tracking-tight leading-tight font-display mb-4">
          {MOCK_PROVIDER.name}
        </h1>

        {/* Desktop: Provider name + Save/Share above photos */}
        <div className="hidden md:flex md:items-center md:gap-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight font-display">
            {MOCK_PROVIDER.name}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <button className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
              </svg>
              <span className="underline">Share</span>
            </button>
            <button className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              <span className="underline">Save</span>
            </button>
          </div>
        </div>

        {/* One big hero image — compact like Airbnb */}
        <div className="relative rounded-xl overflow-hidden aspect-[16/9] md:aspect-[3/1]">
          <Image src={MOCK_IMAGES[0]} alt={MOCK_PROVIDER.name} fill sizes="100vw" priority className="object-cover" />
          {/* Unclaimed badge overlay — compact with tooltip on hover */}
          <div className="absolute top-4 left-4 z-20 group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm bg-white/90 text-gray-600 transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              Unclaimed
            </button>
            {/* Tooltip */}
            <div className="absolute top-full left-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-gray-900 text-white rounded-lg px-4 py-3 text-[13px] leading-relaxed shadow-lg">
                <p className="mb-2">This listing hasn&apos;t been claimed by the owner yet.</p>
                <button className="inline-flex items-center gap-1 text-primary-300 hover:text-primary-200 font-medium transition-colors">
                  Are you the owner? Manage this page
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {/* Show all photos button */}
          <Link href="/cold-outreach-demo/photos" className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 text-gray-900 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Show all {MOCK_IMAGES.length} photos
          </Link>
        </div>

        {/* Two-column layout starts here — CTA aligns with headline */}
        <div className="md:flex md:gap-10 md:items-start mt-6">
          {/* Left column: Details + About + Content */}
          <div className="flex-1 min-w-0">
            {/* 1. Heading: Category + Location + Address */}
            <h2 className="text-base md:text-xl font-semibold text-gray-900">
              {MOCK_PROVIDER.category} in {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state}
              <span className="hidden md:inline">, {MOCK_PROVIDER.address}</span>
            </h2>

            {/* 2. Stats line: Rating · Reviews · Price est. ⓘ · Availability */}
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-2 text-sm md:text-base text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium text-gray-900">{MOCK_PROVIDER.rating}</span>
              </span>
              <span className="font-medium underline">{MOCK_PROVIDER.reviewCount} reviews</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-gray-900">{MOCK_PROVIDER.priceRange}</span>
                <span className="text-gray-400 text-sm">est.</span>
                <div className="relative group inline-flex">
                  <button className="text-gray-300 hover:text-gray-400 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-0 mb-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30">
                    <div className="bg-gray-900 text-white rounded-lg px-4 py-3 text-[13px] leading-relaxed shadow-lg">
                      <p>This is an estimated price range for {MOCK_PROVIDER.category.toLowerCase()} in {MOCK_PROVIDER.city}. Contact the provider for actual pricing.</p>
                    </div>
                  </div>
                </div>
              </span>
              <span className="hidden md:inline text-gray-300">·</span>
              <span className="hidden md:inline font-medium text-gray-600">Contact for availability</span>
            </div>

            {/* 3. Claim Status Section */}
            <div className="mt-4">
              <div className="flex items-center gap-3">
                {/* Avatar with person icon (unclaimed) */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-400 tracking-wide">UNCLAIMED</span>
                    <div className="relative group">
                      <button className="text-gray-400 hover:text-gray-500 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30">
                        <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-[12px] leading-relaxed shadow-lg">
                          <p>This listing has not been claimed by its owner yet. Information shown is from public sources.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Are you the owner?{" "}
                    <button className="text-primary-600 hover:text-primary-700 font-medium">
                      Manage this page
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="mt-6">

            {/* Reviews Section — first after hero (matches real provider pages) */}
            <div id="reviews" className="scroll-mt-14 py-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 font-display tracking-tight mb-4 md:mb-6">
                What families are saying
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {MOCK_REVIEWS.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-50 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600">{review.author.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{review.author}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-4 h-4 ${i < review.rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Q&A Section — "Got questions?" style (matches real provider pages) */}
            <div id="qa" className="scroll-mt-14 py-8 border-t border-gray-200">
              <div className="mb-6">
                <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 tracking-tight leading-tight">
                  Got questions?
                </h2>
                <p className="text-[14px] text-gray-400 mt-1.5">
                  Tap a question to ask {MOCK_PROVIDER.name} directly
                </p>
              </div>

              {/* Suggestion Cards */}
              <div className="space-y-2">
                {[
                  "What services do you provide?",
                  "What are your rates or pricing?",
                  "How quickly can you get started?",
                  "Do you accept insurance or Medicaid?",
                  "What's included in the monthly rent?",
                ].map((question) => (
                  <button
                    key={question}
                    className="group/card w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors"
                  >
                    <span className="text-[15px] text-gray-900 leading-snug">{question}</span>
                    <svg className="w-4 h-4 text-gray-300 group-hover/card:text-primary-600 transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Care Services Section */}
            <div id="care-services" className="scroll-mt-14 py-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 font-display mb-6">Care Services</h2>
              <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                {visibleServices.map((service) => (
                  <div key={service.name} className="flex items-center gap-4">
                    <ServiceIcon type={service.icon} />
                    <span className="text-base text-gray-800">{service.name}</span>
                  </div>
                ))}
              </div>
              {CARE_SERVICES.length > 6 && (
                <button
                  onClick={() => setShowAllServices(!showAllServices)}
                  className="mt-6 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium rounded-lg transition-colors"
                >
                  {showAllServices ? "Show less" : `Show all ${CARE_SERVICES.length} services`}
                </button>
              )}
            </div>

            {/* Amenities Section */}
            <div id="amenities" className="scroll-mt-14 py-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 font-display mb-6">Amenities</h2>
              <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                {visibleAmenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-4">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-base text-gray-800">{amenity}</span>
                  </div>
                ))}
              </div>
              {MOCK_AMENITIES.length > 6 && (
                <button
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-6 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium rounded-lg transition-colors"
                >
                  {showAllAmenities ? "Show less" : `Show all ${MOCK_AMENITIES.length} amenities`}
                </button>
              )}
            </div>

            {/* About Section */}
            <div id="about" className="scroll-mt-14 py-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 font-display mb-3">About {MOCK_PROVIDER.name}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{MOCK_PROVIDER.description}</p>
            </div>

            {/* Payment & Insurance Section */}
            <div id="payment" className="py-8 scroll-mt-20 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 font-display mb-5">Acceptable Payment / Insurance Options</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Private Pay"].map((payment) => (
                  <div key={payment} className="flex items-center justify-between py-3 px-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-base text-primary-600 font-medium">{payment}</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-base text-gray-500">
                For clarity and guidance,{" "}
                <button className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Book a consultation
                </button>
              </p>
            </div>

            {/* Disclaimer + Claim CTA — stacked together */}
            <div className="pt-10 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 font-display mb-4">Disclaimer</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                We strive to keep this page accurate and current, but some details may not be up to date. Prices quoted are monthly rental charges and are provided by the community. Actual prices may differ due to one-time fees, timing, and care services required. To confirm whether {MOCK_PROVIDER.name} is the right fit for you or your loved one, please verify all information directly with the provider.
              </p>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm font-medium text-gray-700">Are you the owner of this business?</p>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Manage this page <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            </div>{/* End Content Sections */}
          </div>{/* End Left Column */}

          {/* Right: CTA card (desktop only) — sticky */}
          <div className="hidden md:block w-[380px] flex-shrink-0 self-stretch">
            <div className="sticky top-24">
              <div className="bg-gradient-to-b from-white to-primary-25/40 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-5 py-5">
                  <p className="text-sm text-gray-500">{MOCK_PROVIDER.category} in {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{MOCK_PROVIDER.priceRange}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Area estimate — not this provider&apos;s actual price</p>

                  <div className="border-t border-gray-200 my-4" />

                  <h3 className="text-base font-semibold text-gray-900 mb-3">Get actual pricing & availability</h3>

                  <input type="email" placeholder="Your email address" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3" />

                  <button className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
                    Request details
                  </button>

                  <div className="flex items-center justify-center gap-1.5 mt-3 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>No spam. No sales calls.</span>
                  </div>

                  <p className="text-center text-sm text-gray-400 mt-1.5">81 families checked this month</p>
                </div>
              </div>
            </div>
          </div>{/* End Right CTA */}

        </div>{/* End Two-Column Layout */}

        {/* Compare Section — full width, outside two-column layout */}
        <div className="pt-10">
          <h2 className="text-2xl font-bold text-gray-900 font-display mb-6">
            Compare {MOCK_PROVIDER.name} to the best local options
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MOCK_SIMILAR_PROVIDERS.map((provider) => (
              <div key={provider.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative h-40 bg-gray-100">
                  {provider.image ? (
                    <Image src={provider.image} alt={provider.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-primary-400">{provider.name.slice(0, 2).toUpperCase()}</span>
                      <span className="text-sm text-primary-600 mt-1">{provider.category}</span>
                    </div>
                  )}
                  {/* Save button */}
                  <button className="absolute top-2 right-2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                  </button>
                </div>
                {/* Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 leading-tight">{provider.name}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium">{provider.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{provider.category} · {provider.location}</p>
                  {provider.highlight && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">{provider.highlight}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="text-xs text-gray-400 uppercase">Area avg.</span>{" "}
                    <span className="font-semibold text-gray-900">{provider.priceRange}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>{/* End max-w-7xl container */}

      {/* Minimal Footer */}
      <footer className="border-t border-gray-200 mt-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-500">© 2026 Olera. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Terms</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40">
        <button className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
          Request details
        </button>
      </div>
    </div>
  );
}

