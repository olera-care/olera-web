/**
 * Static author data for editorial content.
 * Used by author pages and article bylines.
 */

export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  linkedin?: string;
}

export const AUTHORS: Author[] = [
  {
    slug: "tj-falohun",
    name: "TJ Falohun",
    role: "Co-founder & CEO",
    bio: "TJ Falohun, co-founder and CEO of Olera, is a trained biomedical engineer passionate about developing novel digital health and medical technologies. His passion for innovative solutions drives him to write about the cost of healthcare in America and to revolutionize the senior healthcare industry.",
    avatar: "/images/for-providers/team/tj.jpg",
    linkedin: "https://www.linkedin.com/in/tjfalohun/",
  },
  {
    slug: "logan-dubose",
    name: "Dr. Logan DuBose",
    role: "Co-founder & MD",
    bio: "Dr. Logan DuBose is a MD and co-founder of Olera.care. He writes about dementia, Alzheimer's, and other age-related conditions. He is a Texas A&M MD/MBA alum. Olera specializes in merging clinical practice with innovative solutions for the aging population.",
    avatar: "/images/for-providers/team/logan.jpg",
    linkedin: "https://www.linkedin.com/in/logandubose/",
  },
  {
    slug: "lisa-fields",
    name: "Lisa Fields",
    role: "Healthcare Writer",
    bio: "Lisa Fields is a passionate healthcare writer and advocate for better senior care in America. This article has been reviewed by TJ Falohun, co-founder and CEO of Olera. He is a trained biomedical engineer and writes about the cost of healthcare in America for seniors.",
  },
  {
    slug: "laura-herman",
    name: "Laura Herman",
    role: "Elder Care Professional",
    bio: "Laura Herman is an elder and dementia care professional who advocates for better senior care in America. This article has been reviewed by TJ Falohun, co-founder and CEO of Olera. He is a trained biomedical engineer and writes about the cost of healthcare in America for seniors.",
  },
  {
    slug: "jamie-dubose",
    name: "Jamie DuBose",
    role: "Pediatric Hospitalist, MD, MPH",
    bio: "Jamie DuBose, MD, MPH, is a pediatric hospitalist at Children's National Hospital in Washington, D.C., and affiliated community sites, including Mary Washington and Stafford Hospitals. Her primary interests include newborn care, global health and hospital-to-community care transitions.",
  },
];

/** Look up an author by their display name (as stored in content_articles.author_name) */
export function getAuthorByName(name: string): Author | undefined {
  return AUTHORS.find(
    (a) => a.name === name || a.name.replace("Dr. ", "") === name
  );
}

/** Look up an author by their URL slug */
export function getAuthorBySlug(slug: string): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}

/** Get all author slugs for static generation */
export function getAllAuthorSlugs(): string[] {
  return AUTHORS.map((a) => a.slug);
}
