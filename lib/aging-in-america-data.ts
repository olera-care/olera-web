// Aging in America — Documentary Series Data
// Static episode data. Update this file when new episodes are published.
// YouTube IDs marked as TODO need to be pulled from the @OleraCare YouTube channel.

export type Episode = {
  slug: string
  title: string
  subject: string | null // null for topic-based episodes (Season 1)
  summary: string
  pullQuote: string | null
  youtubeId: string // TODO: replace placeholder IDs
  thumbnailUrl: string // YouTube maxresdefault fallback
  season: number
  episodeNumber: number
  durationMinutes: number
  year: number
  topics: string[]
  releaseDate: string // ISO date
  status: "published" | "coming-soon"
}

export type Season = {
  number: number
  title: string
  description: string
  episodes: Episode[]
}

// YouTube IDs where maxresdefault.jpg returns 404
const NO_MAXRES = new Set(["VqqAyeqiZ9M"])

// Helper to generate YouTube thumbnail URL (falls back to sddefault if maxres unavailable)
export function getYouTubeThumbnail(youtubeId: string): string {
  const quality = NO_MAXRES.has(youtubeId) ? "sddefault" : "maxresdefault"
  return `https://img.youtube.com/vi/${youtubeId}/${quality}.jpg`
}

// ─── Season 1 ────────────────────────────────────────────────────────────────
// Season 1 episodes are topic-based (not centered on one person).
// YouTube titles use "Chapter 1/2/3" naming. 193K views on Ch1 (viral hit).

const season1Episodes: Episode[] = [
  {
    slug: "stay-at-home-vs-assisted-living",
    title:
      "Stay at Home vs. Assisted Living: A Wife's Impossible Choice",
    subject: null,
    summary:
      "A wife faces the gut-wrenching decision between keeping her husband at home or moving him into assisted living. This episode explores the emotional, financial, and practical realities of a choice millions of American families confront every year.",
    pullQuote: null,
    youtubeId: "TiVrqkrYhEc",
    thumbnailUrl: getYouTubeThumbnail("TiVrqkrYhEc"),
    season: 1,
    episodeNumber: 1,
    durationMinutes: 6,
    year: 2025,
    topics: ["Senior Living Decisions", "Assisted Living", "Home Care"],
    releaseDate: "2025-05-01",
    status: "published",
  },
  {
    slug: "who-takes-care-of-the-caregiver",
    title: "Who Takes Care of the Caregiver?",
    subject: null,
    summary:
      "Caregivers pour everything into their loved ones — but who's looking out for them? This episode dives into the hidden toll of caregiving: burnout, isolation, and the struggle to ask for help when you're the one everyone depends on.",
    pullQuote: null,
    youtubeId: "-rUirbsNmzA",
    thumbnailUrl: getYouTubeThumbnail("-rUirbsNmzA"),
    season: 1,
    episodeNumber: 2,
    durationMinutes: 3,
    year: 2025,
    topics: ["Self Care", "Caregiver Burnout", "Mental Health"],
    releaseDate: "2025-06-01",
    status: "published",
  },
  {
    slug: "what-24-7-dementia-care-really-looks-like",
    title: "What 24/7 Dementia Care Really Looks Like at Home",
    subject: null,
    summary:
      "An unflinching look at what it actually means to provide round-the-clock dementia care at home. From sundowning to wandering, from medication schedules to moments of unexpected clarity — this is the reality most families never see coming.",
    pullQuote: null,
    youtubeId: "VqqAyeqiZ9M",
    thumbnailUrl: getYouTubeThumbnail("VqqAyeqiZ9M"),
    season: 1,
    episodeNumber: 3,
    durationMinutes: 5,
    year: 2025,
    topics: ["Dementia", "Home Care", "Daily Caregiving"],
    releaseDate: "2025-06-01",
    status: "published",
  },
]

// ─── Season 2 ────────────────────────────────────────────────────────────────
// Season 2 episodes are person-centered documentary stories.

const season2Episodes: Episode[] = [
  {
    slug: "carol-dean",
    title: "When Your Parent No Longer Recognizes You | Dementia Caregiving",
    subject: "Carol Dean",
    summary:
      "Carol Dean has been her mother's caregiver for over 13 years. Her mother lives with vascular dementia — a slow, relentless progression that has erased the recognition between mother and daughter. Carol speaks about identity loss, ambiguous grief, and the patience that caregiving without closure demands.",
    pullQuote:
      "It's when she's looking at me and doesn't know that I'm her daughter. I've been her mother, I've been her roommate, I've been her sister... and those are the killers.",
    youtubeId: "aF_fekzYNDw",
    thumbnailUrl: getYouTubeThumbnail("aF_fekzYNDw"),
    season: 2,
    episodeNumber: 1,
    durationMinutes: 5,
    year: 2026,
    topics: [
      "Dementia",
      "Vascular Dementia",
      "Long-term Caregiving",
      "Identity Loss",
    ],
    releaseDate: "2026-02-10",
    status: "published",
  },
  {
    slug: "rob-arnold",
    title: "A Battle You Know You'll Lose | Family Caregiving",
    subject: "Rob Arnold",
    summary:
      "Rob Arnold is 36 and has already been a caregiver for his grandmother, his father, his brother, and now his mother. He runs an antique business founded in his father's name as a form of grief work. Rob speaks candidly about protecting your mental health, setting boundaries, and accepting that caregiving is not a battle you enter expecting to win.",
    pullQuote:
      "You're caregiving. You're not a savior. I can't save people. I'm not a surgeon. I'm not a doctor. What I can do is the best I can.",
    youtubeId: "TODO_ROB_ARNOLD_ID", // TODO: get from YouTube channel
    thumbnailUrl: getYouTubeThumbnail("TODO_ROB_ARNOLD_ID"),
    season: 2,
    episodeNumber: 2,
    durationMinutes: 5,
    year: 2026,
    topics: [
      "Caregiver Burnout",
      "Anticipatory Grief",
      "Mental Health",
      "Young Caregivers",
    ],
    releaseDate: "2026-04-07",
    status: "coming-soon",
  },
  {
    slug: "jason-goldstein",
    title: "My Dad's Here but He's Gone | Dementia Caregiving",
    subject: "Jason Goldstein",
    summary:
      "Jason Goldstein, 54, cares for his 82-year-old father who has Alzheimer's. He describes the painful transition from friend to caregiver — the loss of conversation, the loss of guidance, the frustration with doctors who can't offer timelines. His story makes clear that for many families, the caregiver is the only form of treatment.",
    pullQuote:
      "It's a difficult transition, right? Because someone I looked up to and could talk to, that's gone. I can't have a conversation anymore. I can't ask for advice anymore.",
    youtubeId: "TODO_JASON_GOLDSTEIN_ID", // TODO: get from YouTube channel
    thumbnailUrl: getYouTubeThumbnail("TODO_JASON_GOLDSTEIN_ID"),
    season: 2,
    episodeNumber: 3,
    durationMinutes: 3,
    year: 2026,
    topics: [
      "Alzheimer's",
      "Anticipatory Grief",
      "Father-Son Relationship",
      "Dementia Caregiving",
    ],
    releaseDate: "2026-05-12",
    status: "coming-soon",
  },
  {
    slug: "robert-sutton",
    title: "Caring for a Mother with Dementia: A Family Caregiving Story",
    subject: "Robert Sutton",
    summary:
      "Robert Sutton is a father of three, a husband, and a caregiver for his mother who has dementia. He cares for her at home in Washington, D.C. His story is defined by role reversal — his mother spent her life as a stay-at-home mom, and now Robert returns that care. He speaks about frustration giving way to patience, the unpredictability of dementia, and finding meaning in showing up consistently.",
    pullQuote:
      "If you're in a situation where your mom has took care of you all of your life... and then when it comes to a time that it's your turn to do it, it actually feels good because it's a repeated thing.",
    youtubeId: "TODO_ROBERT_SUTTON_ID", // TODO: get from YouTube channel
    thumbnailUrl: getYouTubeThumbnail("TODO_ROBERT_SUTTON_ID"),
    season: 2,
    episodeNumber: 4,
    durationMinutes: 3,
    year: 2026,
    topics: [
      "Dementia Care",
      "Role Reversal",
      "Sandwich Generation",
      "Caring for a Parent at Home",
    ],
    releaseDate: "2026-06-17",
    status: "coming-soon",
  },
]

// ─── Exports ─────────────────────────────────────────────────────────────────

export const seasons: Season[] = [
  {
    number: 2,
    title: "Season 2",
    description:
      "Four intimate portraits of Americans navigating caregiving — with dementia, with grief, with no easy answers.",
    episodes: season2Episodes,
  },
  {
    number: 1,
    title: "Season 1",
    description:
      "The questions every family faces: where to find care, who cares for the caregiver, and what daily life really looks like.",
    episodes: season1Episodes,
  },
]

export const allEpisodes: Episode[] = [
  ...season2Episodes,
  ...season1Episodes,
]

export function getEpisodeBySlug(slug: string): Episode | undefined {
  return allEpisodes.find((ep) => ep.slug === slug)
}

export function getRelatedEpisodes(
  currentSlug: string,
  limit = 3
): Episode[] {
  return allEpisodes
    .filter((ep) => ep.slug !== currentSlug && ep.status === "published")
    .slice(0, limit)
}

// Series-level metadata for JSON-LD
export const seriesMeta = {
  name: "Aging in America",
  description:
    "A documentary series by Olera that travels across the country, listening to family caregivers navigate aging, illness, dementia, and long-term care. Each episode shares a different caregiving experience, because no two journeys are the same.",
  url: "https://olera.care/aging-in-america",
  creator: "Olera",
  tagline: "Every family has their version of this story.",
  aboutHeadline: "If we're lucky, we will all grow old",
  aboutBody:
    "And at some point, many of us will care for someone who is aging. Yet, we hardly ever talk about these topics with those around us, who may be having similar experiences.\n\nThat's why olera.care created \"Aging in America\" — a documentary series that sheds light on these hidden conversations through honest, intimate stories of real people navigating the aging journey.",
}
