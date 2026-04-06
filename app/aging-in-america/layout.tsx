import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Aging in America | A Documentary Series by Olera",
  description:
    "A documentary series that travels across the country, listening to family caregivers navigate aging, illness, dementia, and long-term care. Every family has their version of this story.",
  keywords: [
    "aging in america",
    "documentary series",
    "caregiving documentary",
    "dementia caregiving",
    "family caregiver stories",
    "senior care documentary",
    "olera",
  ],
  alternates: {
    canonical: "/aging-in-america",
  },
  openGraph: {
    title: "Aging in America | A Documentary Series by Olera",
    description:
      "Honest, intimate stories of real people navigating the aging journey. Every family has their version of this story.",
    url: "https://olera.care/aging-in-america",
    siteName: "Olera",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aging in America | A Documentary Series by Olera",
    description:
      "Honest, intimate stories of real people navigating the aging journey.",
  },
}

export default function AgingInAmericaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="bg-[#0a0a0a] text-white min-h-screen">{children}</div>
}
