/**
 * Mock data for Resources/Guides
 */

import { Resource } from "@/types/resource";

export const MOCK_RESOURCES: Resource[] = [
  // Featured Articles
  {
    id: "1",
    slug: "complete-guide-to-home-health",
    title: "The Complete Guide to Home Health Care",
    subtitle: "Everything you need to know about skilled medical care at home",
    excerpt: "Home health care provides skilled medical services in your home, including nursing care, physical therapy, and more. Learn when it's right for your loved one and how to get started.",
    coverImage: "/images/home-health.webp",
    careTypes: ["home-health"],
    category: "guide",
    author: {
      name: "Dr. Sarah Chen",
      role: "Geriatric Care Specialist",
      avatar: "/images/avatars/sarah.jpg",
    },
    publishedAt: "2025-12-15",
    readingTime: "15 min",
    featured: true,
    tags: ["getting-started", "home-health", "medicare"],
  },
  {
    id: "2",
    slug: "home-health-vs-home-care",
    title: "Home Health vs Home Care: Understanding the Difference",
    subtitle: "A side-by-side comparison to help you choose the right care",
    excerpt: "While the names sound similar, home health and home care serve different needs. This guide breaks down the key differences in services, costs, and who qualifies for each.",
    coverImage: "/images/home-care.jpg",
    careTypes: ["home-health", "home-care"],
    category: "comparison",
    author: {
      name: "Michael Torres",
      role: "Senior Care Advisor",
    },
    publishedAt: "2025-11-28",
    readingTime: "8 min",
    featured: true,
    tags: ["comparison", "home-health", "home-care"],
  },
  {
    id: "3",
    slug: "paying-for-assisted-living",
    title: "How to Pay for Assisted Living in 2025",
    subtitle: "Financial options, tips, and resources for families",
    excerpt: "The average cost of assisted living is $4,500/month. Discover all the ways to fund care, from long-term care insurance to veteran benefits and Medicaid programs.",
    coverImage: "/images/assisted-living.webp",
    careTypes: ["assisted-living"],
    category: "financial",
    author: {
      name: "Jennifer Walsh",
      role: "Elder Care Financial Planner",
    },
    publishedAt: "2025-12-01",
    readingTime: "10 min",
    featured: true,
    tags: ["financial", "assisted-living", "medicaid", "insurance"],
  },
  {
    id: "4",
    slug: "memory-care-checklist",
    title: "Memory Care Facility Checklist: 25 Questions to Ask",
    subtitle: "Don't visit a memory care community without this list",
    excerpt: "Choosing a memory care facility is one of the most important decisions you'll make. Use this comprehensive checklist to evaluate safety, staff training, and quality of care.",
    coverImage: "/images/memory-care.jpg",
    careTypes: ["memory-care"],
    category: "checklist",
    author: {
      name: "Lisa Park, RN",
      role: "Memory Care Specialist",
    },
    publishedAt: "2025-11-20",
    readingTime: "5 min",
    featured: false,
    tags: ["checklist", "memory-care", "dementia"],
  },
  {
    id: "5",
    slug: "when-its-time-for-memory-care",
    title: "10 Signs It May Be Time for Memory Care",
    subtitle: "Recognizing when your loved one needs specialized support",
    excerpt: "Knowing when to transition a loved one to memory care is never easy. Learn the warning signs that indicate it's time to consider specialized dementia care.",
    coverImage: "/images/memory-care-signs.jpg",
    careTypes: ["memory-care"],
    category: "guide",
    author: {
      name: "Dr. Robert Kim",
      role: "Neurologist",
    },
    publishedAt: "2025-10-15",
    readingTime: "8 min",
    featured: false,
    tags: ["memory-care", "dementia", "alzheimers", "signs"],
  },
  {
    id: "6",
    slug: "nursing-home-vs-assisted-living",
    title: "Nursing Home vs Assisted Living: Which Is Right?",
    subtitle: "A comprehensive comparison of care levels and costs",
    excerpt: "Understanding the difference between nursing homes and assisted living can help you choose the right level of care. Compare services, costs, and daily life in each setting.",
    coverImage: "/images/nursing-homes.webp",
    careTypes: ["nursing-homes", "assisted-living"],
    category: "comparison",
    author: {
      name: "Amanda Foster",
      role: "Care Placement Specialist",
    },
    publishedAt: "2025-11-10",
    readingTime: "10 min",
    featured: false,
    tags: ["comparison", "nursing-homes", "assisted-living"],
  },
  {
    id: "7",
    slug: "medicare-covers-home-health",
    title: "What Medicare Covers for Home Health Care",
    subtitle: "A complete breakdown of benefits and eligibility",
    excerpt: "Medicare can cover 100% of home health care costs if you qualify. Learn the eligibility requirements, covered services, and how to ensure your claim is approved.",
    coverImage: "/images/medicare-coverage.jpg",
    careTypes: ["home-health"],
    category: "financial",
    author: {
      name: "Patricia Lee",
      role: "Medicare Benefits Specialist",
    },
    publishedAt: "2025-12-05",
    readingTime: "8 min",
    featured: false,
    tags: ["medicare", "home-health", "insurance", "financial"],
  },
  {
    id: "8",
    slug: "independent-living-guide",
    title: "Independent Living Communities: A Complete Guide",
    subtitle: "What to expect and how to find the perfect fit",
    excerpt: "Independent living offers maintenance-free living with social activities and amenities. Discover if it's the right choice and what to look for in a community.",
    coverImage: "/images/independent-living.jpg",
    careTypes: ["independent-living"],
    category: "guide",
    author: {
      name: "David Martinez",
      role: "Senior Living Consultant",
    },
    publishedAt: "2025-10-28",
    readingTime: "10 min",
    featured: false,
    tags: ["independent-living", "getting-started", "guide"],
  },
  {
    id: "9",
    slug: "caregiver-burnout-prevention",
    title: "Preventing Caregiver Burnout: Self-Care Strategies",
    subtitle: "How to care for yourself while caring for others",
    excerpt: "Over 60% of family caregivers experience burnout. Learn practical strategies to protect your mental health while providing excellent care for your loved one.",
    coverImage: "/images/caregiver-support.jpg",
    careTypes: ["home-care", "home-health"],
    category: "guide",
    author: {
      name: "Rachel Stevens, LCSW",
      role: "Caregiver Support Specialist",
    },
    publishedAt: "2025-11-05",
    readingTime: "8 min",
    featured: false,
    tags: ["caregiver", "self-care", "burnout", "mental-health"],
  },
  {
    id: "10",
    slug: "medicaid-nursing-home-coverage",
    title: "Medicaid Coverage for Nursing Homes: Complete Guide",
    subtitle: "Eligibility, spend-down rules, and how to apply",
    excerpt: "Medicaid is the largest payer of nursing home care in the US. Understand the complex eligibility rules and learn strategies to protect your family's assets.",
    coverImage: "/images/medicaid-nursing.jpg",
    careTypes: ["nursing-homes"],
    category: "financial",
    author: {
      name: "James Harrison, Esq.",
      role: "Elder Law Attorney",
    },
    publishedAt: "2025-10-20",
    readingTime: "15 min",
    featured: false,
    tags: ["medicaid", "nursing-homes", "financial", "legal"],
  },
  {
    id: "11",
    slug: "home-care-interview-questions",
    title: "20 Questions to Ask When Hiring a Home Caregiver",
    subtitle: "Essential interview questions for finding the right caregiver",
    excerpt: "Hiring the right in-home caregiver is crucial for your loved one's safety and happiness. Use these interview questions to evaluate experience, personality, and fit.",
    coverImage: "/images/hiring-caregiver.jpg",
    careTypes: ["home-care"],
    category: "checklist",
    author: {
      name: "Nancy Williams",
      role: "Home Care Agency Director",
    },
    publishedAt: "2025-09-30",
    readingTime: "5 min",
    featured: false,
    tags: ["home-care", "checklist", "hiring", "interview"],
  },
  {
    id: "12",
    slug: "long-distance-caregiving",
    title: "Long-Distance Caregiving: A Practical Guide",
    subtitle: "How to support a loved one from miles away",
    excerpt: "Managing care from a distance presents unique challenges. Learn how to coordinate care, stay connected, and handle emergencies when you can't be there in person.",
    coverImage: "/images/long-distance-care.jpg",
    careTypes: ["home-care", "home-health", "assisted-living"],
    category: "guide",
    author: {
      name: "Karen Thompson",
      role: "Geriatric Care Manager",
    },
    publishedAt: "2025-09-15",
    readingTime: "10 min",
    featured: false,
    tags: ["long-distance", "caregiving", "coordination", "guide"],
  },
];

// Helper functions
export function getResourceBySlug(slug: string): Resource | undefined {
  return MOCK_RESOURCES.find((r) => r.slug === slug);
}

export function getResourcesByCareType(careType: string): Resource[] {
  if (careType === "all") return MOCK_RESOURCES;
  return MOCK_RESOURCES.filter((r) => r.careTypes.includes(careType as any));
}

export function getResourcesByCategory(category: string): Resource[] {
  return MOCK_RESOURCES.filter((r) => r.category === category);
}

export function getFeaturedResources(): Resource[] {
  return MOCK_RESOURCES.filter((r) => r.featured);
}

export function searchResources(query: string): Resource[] {
  const lowerQuery = query.toLowerCase();
  return MOCK_RESOURCES.filter(
    (r) =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.excerpt.toLowerCase().includes(lowerQuery) ||
      r.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}
