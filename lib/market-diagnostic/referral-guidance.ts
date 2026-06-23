/**
 * Per-source-type referral guidance — turns "here's a phone number" into
 * "here's exactly how to work this kind of place." Senior-care BD playbooks,
 * curated by source type (a discharge planner ≠ an elder-law attorney).
 *
 * The opener interpolates the provider's agency name + city; "[your name]" is a
 * placeholder the provider fills (we don't store the owner's personal name).
 */
export interface ReferralGuidance {
  askFor: string;
  opener: string;
  ask: string;
  whyCare: string;
}

export function getReferralGuidance(cat: string, agencyName?: string, city?: string): ReferralGuidance | null {
  const me = agencyName?.trim() || "our agency";
  const here = city ? ` here in ${city}` : "";
  const intro = `Hi, I'm [your name] with ${me}, a licensed home-care agency${here}.`;

  const G: Record<string, ReferralGuidance> = {
    hospital: {
      askFor: "Case Management / Discharge Planning",
      opener: `${intro} I'd love to be a resource for the patients you're sending home who need a hand.`,
      ask: "Get added to their home-care referral list — and offer to drop off info for the team.",
      whyCare: "Fast, reliable partners who take the tough discharges lower their readmissions.",
    },
    skilled_nursing: {
      askFor: "Social Services / the discharge social worker",
      opener: `${intro} I help your residents stay safe at home after rehab — I'd love to be your go-to for those transitions.`,
      ask: "Be their first call when a resident is discharging home and needs support.",
      whyCare: "A smooth home transition means fewer bounce-backs and happier families.",
    },
    hospice: {
      askFor: "the intake coordinator / community liaison",
      opener: `${intro} We provide the non-medical home support that lets your team focus on comfort care.`,
      ask: "Be their referral for families who need extra hands at home alongside hospice.",
      whyCare: "Caregiver respite and home help keep their patients comfortable and families supported.",
    },
    assisted_living: {
      askFor: "the Executive Director or Community Relations",
      opener: `${intro} I partner with communities like yours for residents who need extra one-on-one care — and for families touring who aren't quite ready to move in.`,
      ask: "Be their recommended home-care partner for private-duty supplements and not-yet-ready families.",
      whyCare: "You handle the high-needs cases they can't staff 1:1, and you keep their prospects close.",
    },
    senior_resource: {
      askFor: "the resource / information coordinator",
      opener: `${intro} I'd love to be a vetted option you can point families to when they call needing care at home.`,
      ask: "Get on their referral / resource list.",
      whyCare: "They want trustworthy, responsive providers to send families to.",
    },
    elder_law: {
      askFor: "the attorney or their care coordinator",
      opener: `${intro} Many of your clients planning for care end up needing help at home — I'd love to be a trusted partner you can refer to.`,
      ask: "Set up a two-way referral relationship.",
      whyCare: "Their clients need reliable care partners — and you can send them planning clients too.",
    },
    home_health: {
      askFor: "the intake coordinator or clinical director",
      opener: `${intro} I provide the non-medical support — companion care, personal care, errands — that complements your clinical services.`,
      ask: "Be their go-to for families who need more than skilled nursing can provide.",
      whyCare: "A reliable non-medical partner extends their reach and keeps patients safer at home.",
    },
    financial: {
      askFor: "the advisor or their client services team",
      opener: `${intro} Many of your clients planning for retirement or long-term care end up needing help at home — I'd love to be a resource you can trust.`,
      ask: "Be on their list when clients ask about care options.",
      whyCare: "Their clients are planning ahead — you're the answer when the plan becomes real.",
    },
    faith: {
      askFor: "the pastor, parish nurse, or senior ministry coordinator",
      opener: `${intro} I help families in your congregation who need a hand at home — I'd love to be a trusted resource you can recommend.`,
      ask: "Be their referral when members ask about care options.",
      whyCare: "Their congregation trusts their recommendations — you become part of that circle of care.",
    },
  };

  return G[cat] ?? null;
}
