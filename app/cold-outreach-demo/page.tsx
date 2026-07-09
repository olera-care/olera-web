"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// Mock images - 5 images like Chantel's Zillow-style grid
const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1600&q=80",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80",
  "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800&q=80",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&q=80",
  "https://images.unsplash.com/photo-1576765974257-b414b9e8f8ce?w=800&q=80",
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

const MOCK_QA = [
  {
    id: 1,
    question: "What's included in the monthly rent?",
    answer: "Monthly rent includes your apartment, all utilities, weekly housekeeping, scheduled transportation, access to all amenities, daily activities, and Freedom Dining with flexible meal times throughout the day.",
    asker: "David L.",
    date: "1 month ago",
  },
  {
    id: 2,
    question: "Are pets allowed?",
    answer: "Yes! We're a pet-friendly community. Dogs and cats are welcome, and we have landscaped walking grounds for dog owners. There is a small pet deposit required.",
    asker: "Carol W.",
    date: "2 months ago",
  },
  {
    id: 3,
    question: "Can my parent try a short-term stay before committing?",
    answer: "Absolutely. We offer respite and short-term stays so potential residents can experience our community firsthand. Contact us to learn about availability and pricing for trial stays.",
    asker: "James R.",
    date: "3 months ago",
  },
];

const MOCK_ACCOMMODATIONS = [
  { name: "Studio", price: "$4,020/mo", sqft: "566 Sq. Ft." },
  { name: "1 Bedroom", price: "$3,880/mo", sqft: "588–759 Sq. Ft." },
  { name: "2 Bedroom", price: "$5,800/mo", sqft: "1,013–1,138 Sq. Ft." },
  { name: "3 Bedroom", price: "Contact us", sqft: "1,206 Sq. Ft." },
];

const MOCK_DINING_FEATURES = [
  "Flexible Dining Hours",
  "Sunday Brunch",
  "24-Hour Chef's Pantry",
  "Tableside Service",
  "Meal Delivery for Daily Meals",
  "Casual Buffet",
  "Professional Chefs",
  "Fresh, Healthy Ingredients",
  "Share meals with friends and family anytime",
];

const MOCK_AMENITIES = [
  {
    heading: "Fitness & Wellness",
    icon: "fitness",
    items: ["Fitness Center", "Walking Paths", "Health & Wellness Programs", "Ageless Grace Brain Fitness Program", "Raised Garden Beds"],
  },
  {
    heading: "Pet Friendly",
    icon: "pet",
    items: ["Dogs & Cats Welcome", "Landscaped Dog-Walking Grounds"],
  },
  {
    heading: "Services & Convenience",
    icon: "services",
    items: ["Weekly Housekeeping", "On-Call Maintenance", "On-Site Salon & Spa", "Scheduled Transportation", "Bus Outings", "On-Site Bank Branch", "Pharmacy Delivery", "Gift Shop", "Grocery Shopping Service", "Guest Suite for Visiting Family", "Valet & Resident Parking"],
  },
  {
    heading: "Safety & Support",
    icon: "safety",
    items: ["24/7 Concierge", "Emergency Alert Systems", "Live-In On-Site Management"],
  },
  {
    heading: "Social & Recreation",
    icon: "social",
    items: ["Arts & Crafts Room", "Billiards & Game Room", "Library", "Computer Center", "Daily Social Activities", "Main Street Shops & Gathering Spaces", "Full-Size Movie Theater"],
  },
  {
    heading: "Languages Spoken",
    icon: "languages",
    items: ["English", "Spanish"],
  },
];

const MOCK_NEARBY = [
  { label: "Hospital", name: "Rideout Regional Medical Center", distance: "1.8 mi" },
  { label: "Grocery", name: "Raley's", distance: "0.6 mi" },
  { label: "Pharmacy", name: "Walgreens", distance: "0.4 mi" },
  { label: "Park", name: "Sam Brannan Park", distance: "0.9 mi" },
  { label: "Restaurant", name: "Black Bear Diner", distance: "0.3 mi" },
  { label: "Bank", name: "Wells Fargo", distance: "0.5 mi" },
];

const SECTION_NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "reviews", label: "Reviews" },
  { id: "qa", label: "Q&A" },
  { id: "accommodations", label: "Accommodations" },
  { id: "dining", label: "Dining" },
  { id: "amenities", label: "Amenities" },
  { id: "neighborhood", label: "Neighborhood" },
];

// =============================================================================
// Provider Page (Unclaimed Demo)
// =============================================================================
function ProviderPageTab() {
  const [activeSection, setActiveSection] = useState("about");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Intersection Observer to update activeSection on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    // Observe all section elements
    SECTION_NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
        sectionRefs.current.set(item.id, el);
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ===== Hero Zone — Cream Background ===== */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-6">

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
        <div className="relative rounded-xl overflow-hidden aspect-[16/9] md:aspect-[3.5/1]">
          <Image src={MOCK_IMAGES[0]} alt={MOCK_PROVIDER.name} fill sizes="100vw" priority className="object-cover" />
          {/* Unclaimed badge overlay */}
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              <span className="text-sm font-medium text-gray-600">Unclaimed</span>
            </div>
          </div>
        </div>

        {/* Two-column layout starts here — CTA aligns with headline */}
        <div className="md:flex md:gap-10 md:items-start mt-6">
          {/* Left column: Details + About + Content */}
          <div className="flex-1 min-w-0">
            {/* Category + Location (like "Private room in rental unit in Aburi, Ghana") */}
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              {MOCK_PROVIDER.category} in {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state}
            </h2>

            {/* Stats line: Rating · Reviews · Price · Accepting */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-base text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium">{MOCK_PROVIDER.rating}</span>
              </span>
              <span className="text-gray-300">·</span>
              <span className="underline">{MOCK_PROVIDER.reviewCount} reviews</span>
              <span className="text-gray-300">·</span>
              <span className="font-medium">{MOCK_PROVIDER.priceRange}</span>
              <span className="text-gray-300">·</span>
              <span className="text-green-600 font-medium">Accepting residents</span>
            </div>

            {/* Unclaimed section — like Airbnb's "Hosted by" */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Unclaimed listing</p>
                <p className="text-sm text-gray-500">
                  Are you the owner?{" "}
                  <button className="text-primary-600 hover:text-primary-700 font-medium underline">
                    Manage this page
                  </button>
                </p>
              </div>
            </div>

            {/* Awards/Badges — right after unclaimed section */}
            <div className="mt-6 border border-gray-200 rounded-xl px-5 py-4">
              <div className="flex flex-wrap justify-evenly gap-y-4">
                <div className="flex items-center gap-3">
                  <svg className="w-11 h-11 shrink-0" viewBox="0 0 44 48" fill="none">
                    <path d="M22 0L44 10V24C44 37.2 34.8 45.6 22 48C9.2 45.6 0 37.2 0 24V10L22 0Z" fill="#C5A44E" />
                    <path d="M22 8l2.4 5h5.6l-4 3.5 1.5 5.5-5.5-3.5-5.5 3.5 1.5-5.5-4-3.5h5.6z" fill="white" />
                    <rect x="8" y="28" width="28" height="8" rx="1" fill="white" opacity="0.9" />
                    <text x="22" y="34.5" textAnchor="middle" fontSize="5" fontWeight="700" fill="#C5A44E" fontFamily="system-ui">AWARD</text>
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-wide text-gray-900 uppercase">Best of Senior Living</span>
                    <span className="text-sm text-gray-500">2024 Award Winner</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-11 h-11 shrink-0" viewBox="0 0 44 48" fill="none">
                    <path d="M22 0L44 10V24C44 37.2 34.8 45.6 22 48C9.2 45.6 0 37.2 0 24V10L22 0Z" fill="#198087" />
                    <path d="M22 8l2.4 5h5.6l-4 3.5 1.5 5.5-5.5-3.5-5.5 3.5 1.5-5.5-4-3.5h5.6z" fill="white" />
                    <rect x="8" y="28" width="28" height="8" rx="1" fill="white" opacity="0.9" />
                    <text x="22" y="34.5" textAnchor="middle" fontSize="5" fontWeight="700" fill="#198087" fontFamily="system-ui">5-STAR</text>
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-wide text-gray-900 uppercase">Five Star Quality</span>
                    <span className="text-sm text-gray-500">Medicare Rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* What makes this place special — Airbnb-style highlights */}
            <div className="mt-8 space-y-6">
              {/* Highlight 1 */}
              <div className="flex gap-4">
                <svg className="w-6 h-6 text-gray-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Zm-3 0a.375.375 0 1 1-.53 0L9 2.845l.265.265Zm6 0a.375.375 0 1 1-.53 0L15 2.845l.265.265Z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Resort-style dining</p>
                  <p className="text-gray-500 text-sm">Chef-prepared meals served throughout the day with flexible hours.</p>
                </div>
              </div>

              {/* Highlight 2 */}
              <div className="flex gap-4">
                <svg className="w-6 h-6 text-gray-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">On-site entertainment</p>
                  <p className="text-gray-500 text-sm">Full-size movie theater and Main Street shops within the community.</p>
                </div>
              </div>

              {/* Highlight 3 */}
              <div className="flex gap-4">
                <svg className="w-6 h-6 text-gray-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Pet-friendly community</p>
                  <p className="text-gray-500 text-sm">Landscaped walking grounds and welcoming atmosphere for pets.</p>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="mt-6">

            {/* Reviews Section — first after hero (matches real provider pages) */}
            <div id="reviews" className="scroll-mt-14 py-8 border-b border-gray-200">
              <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 tracking-tight leading-tight mb-2">
                What families are saying
              </h2>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < Math.floor(MOCK_PROVIDER.rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-600">{MOCK_PROVIDER.rating} · {MOCK_PROVIDER.reviewCount} reviews</span>
              </div>

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
            <div id="qa" className="scroll-mt-14 py-8 border-b border-gray-200">
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

              {/* Answered Questions */}
              {MOCK_QA.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-4">{MOCK_QA.length} answered questions</p>
                  <div className="space-y-4">
                    {MOCK_QA.slice(0, 2).map((qa) => (
                      <div key={qa.id} className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[15px] font-medium text-gray-900">{qa.question}</p>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{qa.answer}</p>
                        <p className="text-xs text-gray-400 mt-2">Asked by {qa.asker} · {qa.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* About Section — now after Reviews and Q&A */}
            <div id="about" className="scroll-mt-14 py-8 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 font-display mb-3">About {MOCK_PROVIDER.name}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{MOCK_PROVIDER.description}</p>
            </div>

            {/* Accommodations Section */}
            <div id="accommodations" className="scroll-mt-14 py-8 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 font-display mb-3 flex items-center gap-2.5">
                <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
                Accommodations
              </h2>
              <p className="text-sm text-gray-600 mb-6">Our thoughtfully designed floor plans offer the perfect blend of comfort, style, and functionality.</p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {MOCK_ACCOMMODATIONS.map((unit) => (
                  <div key={unit.name} className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all">
                    <h3 className="text-lg font-semibold text-gray-900">{unit.name}</h3>
                    <p className="text-xl font-bold text-primary-600 mt-1">{unit.price}</p>
                    <p className="text-sm text-gray-500 mt-1">{unit.sqft}</p>
                    <button className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700">
                      View floor plans →
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {["Full Kitchen", "In-Unit Washer/Dryer", "Private Patio", "Wheelchair Accessible", "Paid Utilities", "Cable & Wi-Fi"].map((feature) => (
                  <span key={feature} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-700">
                    <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Dining Section */}
            <div id="dining" className="scroll-mt-14 py-8 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 font-display mb-3 flex items-center gap-2.5">
                <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 8.25V6.75a3 3 0 10-6 0v1.5" />
                </svg>
                Dining
              </h2>
              <p className="text-sm text-gray-600 mb-6">Signature Freedom Dining offers chef-prepared meals served resort-style throughout the day, with flexible hours and multiple dining settings.</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-2.5">
                {MOCK_DINING_FEATURES.map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities Section */}
            <div id="amenities" className="scroll-mt-14 py-8 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 font-display mb-6 flex items-center gap-2.5">
                <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                Amenities
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {MOCK_AMENITIES.map((category) => (
                  <div key={category.heading}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{category.heading}</h3>
                    <ul className="space-y-2">
                      {category.items.map((item) => (
                        <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Neighborhood Section */}
            <div id="neighborhood" className="scroll-mt-14 py-8 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2.5">
                  <svg className="w-7 h-7 text-gray-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  What&apos;s nearby
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Close to medical care and shopping
                </span>
              </div>
              <p className="text-sm text-gray-900 mb-4">{MOCK_PROVIDER.address}, {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state}</p>

              {/* Map placeholder */}
              <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center mb-6">
                <p className="text-gray-400">Interactive map</p>
              </div>

              {/* Nearby places */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {MOCK_NEARBY.map((place) => (
                  <div key={place.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{place.label}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{place.name}</p>
                    <p className="text-xs text-gray-500">{place.distance}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="py-8">
              <h2 className="text-2xl font-bold text-gray-900 font-display mb-4">Disclaimer</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                We strive to keep this page accurate and current, but some details may not be up to date. Prices quoted are monthly rental charges and are provided by the community. Actual prices may differ due to one-time fees, timing, and care services required. To confirm whether {MOCK_PROVIDER.name} is the right fit for you or your loved one, please verify all information directly with the provider.
              </p>
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-200">
                <p className="text-sm text-gray-500">Are you the owner of this business?</p>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Manage this page <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            </div>{/* End Content Sections */}
          </div>{/* End Left Column */}

          {/* Right: CTA card (desktop only) — sticky */}
          <div className="hidden md:block w-[380px] flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-gradient-to-b from-white to-primary-25/40 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-6 py-6">
                  <p className="text-sm text-gray-500">{MOCK_PROVIDER.category} in {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{MOCK_PROVIDER.priceRange}</p>
                  <p className="text-sm text-gray-500 mt-1">Pricing varies by apartment type</p>

                  <div className="border-t border-gray-200 my-5" />

                  <h3 className="text-base font-semibold text-gray-900 mb-4">Check coverage & availability</h3>

                  <input type="email" placeholder="Your email address" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4" />

                  <button className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
                    Request details
                  </button>

                  <div className="flex items-center justify-center gap-1.5 mt-4 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>No spam. No sales calls.</span>
                  </div>

                  <p className="text-center text-sm text-gray-400 mt-2">81 families checked this month</p>
                </div>
              </div>
            </div>
          </div>{/* End Right CTA */}

        </div>{/* End Two-Column Layout */}
      </div>{/* End max-w-7xl container */}

      {/* Mobile Fixed CTA — positioned above floating tabs */}
      <div className="fixed bottom-24 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40">
        <button className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
          Request details
        </button>
      </div>
    </div>
  );
}

