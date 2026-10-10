/**
 * Apply-along for senior SNAP (Phase 5 of the benefits caseworker, 10 Oct
 * 2026), the second after Medicare Savings.
 *
 * There is no national form: every state takes its own application, so the
 * sheet stands on a verified table of each state's door (data/benefits/
 * snap-states.json: the online application, the phone line and whether it
 * takes applications, a shorter senior form, how the state counts medical
 * costs). Olera's earlier SNAP links sent Kansans to an Arkansas site.
 *
 * What the sheet adds is the rules older households lose money on. Federal
 * rules, 7 CFR part 273:
 *   - 273.9(a): a household with someone 60+ faces the net income test only.
 *   - 273.9(d)(3): medical costs over $35 a month for that person lower the
 *     income counted (Medicare premiums, prescriptions, dental, glasses,
 *     hearing aids, rides to treatment, paid help at home). Many states use
 *     a set amount instead of the receipts (a Standard Medical Deduction).
 *   - 273.9(d)(6)(ii): no cap on the shelter deduction for those households.
 *   - 273.1(a)(2), (b)(1): an adult 22+ who buys and cooks apart from the
 *     people they live with is their own household; spouses always apply
 *     together.
 *   - 273.2(n): a relative can be named the authorized representative and do
 *     the interview. 273.2(c)(1)(iii): a name, address and signature is
 *     enough to file, and the 30 days (273.2(g)) start then.
 *
 * Client-safe. Like the Medicare Savings sheet, it states no benefit amount.
 */
import { finderVoice, type FinderWho } from "@/lib/benefits/finder-answers";
import { narrowRange, parseCuts } from "@/lib/benefits/cut";
import { PART_B_PREMIUM, type ApplyAlong, type ApplyHousehold, type ApplyStep, type MoneyRow } from "@/lib/benefits/apply-along";
import snapStates from "@/data/benefits/snap-states.json";

export { isSnapProgram, snapApplyHref } from "@/lib/benefits/snap-match";

export interface SnapState {
  code: string;
  /** What the state calls SNAP ("CalFresh", "Basic Food", or "SNAP"). */
  name: string;
  applyUrl: string | null;
  phone: string;
  /** Can you apply by phone on that line? null when the state doesn't say. */
  phoneApplies: boolean | null;
  phoneNote: string | null;
  seniorForm: { name: string; url: string | null } | null;
  /** "standard": a set amount once costs pass $35. "actual": the costs over $35. */
  medicalDeduction: "standard" | "actual";
  interviewNote: string | null;
  paperOnly: boolean;
  paperUrl: string | null;
  confidence: string;
  sources: string[];
}

export const SNAP_STATES_CHECKED: string = snapStates.checked;

export function snapStateFacts(code: string | null): SnapState | null {
  if (!code) return null;
  return ((snapStates.states as SnapState[]).find((s) => s.code === code.toUpperCase())) ?? null;
}

export interface SnapApplyInput {
  who: FinderWho | null;
  household: ApplyHousehold;
  income: string | null;
  incomeCut: string | null;
  stateName: string;
  state: SnapState | null;
}

const INCOME: Record<string, [number, number]> = { under1000: [0, 1000], under1500: [1000, 1500], under2500: [1500, 2500], under4000: [2500, 4000], over4000: [4000, Infinity] };
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function incomeText(income: string | null, cut: string | null): string | null {
  const range = income ? INCOME[income] : undefined;
  if (!range) return null;
  const [lo, hi] = parseCuts(cut) ? narrowRange(range, cut) : range;
  if (hi === Infinity) return `more than ${usd(lo)}`;
  if (lo <= 0) return `${usd(hi)} or less`;
  return `between ${usd(lo)} and ${usd(hi)}`;
}

export function buildSnapApplyAlong(input: SnapApplyInput): ApplyAlong {
  const st = input.state;
  const known = input.stateName !== "your state";
  const State = known ? input.stateName : "Your state";
  const state = known ? input.stateName : "your state";
  const v = finderVoice(input.who);
  const self = input.who === "me" || !input.who;
  const couple = input.household === "couple";
  const them = self ? "you" : v.subject;
  const Them = self ? "You" : v.subject.charAt(0).toUpperCase() + v.subject.slice(1);
  const their = self ? "your" : "their";
  const Their = self ? "Your" : "Their";
  const they = self ? "you" : "they";
  const income = incomeText(input.income, input.incomeCut);
  const programName = st?.name ?? "SNAP";
  const calledLine = programName === "SNAP"
    ? "It's called SNAP, and some still call it food stamps."
    : `${State} calls it ${programName}, the state's name for SNAP.`;

  const household: MoneyRow = {
    icon: "pot-of-food",
    title: self ? "Who you buy and cook for" : "Who they buy and cook for",
    text: input.household === "alone"
      ? `Just ${them}.`
      : couple
        ? "Both of you. A married couple living together always applies together."
        : input.household === "family"
          ? `If ${they} buy and cook ${their} food apart from the rest of the household, ${they} can apply on ${their} own, with only ${their} income. If everyone shares meals, everyone who eats together applies together.`
          : `Everyone ${they} usually buy and cook food with. Someone who buys and cooks apart can apply on their own, even in the same home.`,
  };
  const incomeRow: MoneyRow = {
    icon: "receipt",
    title: "Income",
    text: income
      ? `${income.charAt(0).toUpperCase()}${income.slice(1)} a month${couple ? " together" : ""}. Enter each source: Social Security, pensions, any wages.`
      : "Enter each source as a monthly amount: Social Security, pensions, any wages.",
  };
  const medical: MoneyRow = {
    icon: "stethoscope",
    title: "Medical costs: list every one",
    text: `${st?.medicalDeduction === "standard"
      ? `Once ${their} medical costs pass $35 a month, ${state} lowers the income it counts by a set amount, or by more if ${they} show the bills.`
      : `${State} lowers the income it counts by what ${they} spend on medical costs above $35 a month.`} The $${PART_B_PREMIUM.toFixed(2)} Medicare premium alone clears that, unless Medicare Savings pays it. Add prescriptions, copays, dental, glasses, hearing aids, rides to the doctor, and paid help at home.`,
    key: true,
    flag: "The step most people skip",
  };
  const housing: MoneyRow = {
    icon: "house-with-garden",
    title: "Housing",
    text: "Rent or mortgage, property tax, home insurance, and utilities like heat, electricity and phone. For someone 60 or older, there's no cap on how much of this counts.",
  };

  const steps: ApplyStep[] = [
    input.who === "spouse"
      ? {
          title: "Start the application",
          answer: "Apply for both of you. A married couple living together is one household, so you fill it in together.",
        }
      : {
          title: self ? "Start the application" : "Say you're applying for them",
          answer: self
            ? "Apply for yourself."
            : "The form asks who is filling it in. You can be named their authorized representative, which also lets you do the interview.",
          note: self ? undefined : `${Them} signs to name you, or you can both sign the application.`,
        },
    { title: "Who lives there and eats together", answer: household.text },
    { title: "Income", answer: incomeRow.text },
    { title: "Bank accounts and savings", answer: `Enter each account and its balance. ${Their} home and car usually don't count.` },
    { title: "Housing and utilities", answer: housing.text },
    { title: "Medical costs", answer: medical.text, key: true },
    {
      title: "Sign and send",
      answer: "Review and submit. If something is missing, send it anyway: a name, address and signature is enough to start, and the 30 days count from that day.",
    },
  ];

  const interview = st?.interviewNote
    ?? `${State} sets up a short interview, usually by phone. Answer it: a missed interview ends the application.`;
  const next = [
    interview,
    `A decision comes within 30 days. If approved, the money arrives on a card every month.`,
    `If ${they} have almost no money or food right now, ask about expedited benefits, which can come within 7 days.`,
  ];

  const phone = st
    ? {
        number: st.phone,
        label: `Call ${state}, ${st.phone}`,
        note: st.phoneNote
          ?? (st.phoneApplies === true
            ? `${State} can take the application on this call.`
            : st.phoneApplies === false
              ? `${State} can't take the application by phone. Call to ask questions or have a paper form mailed.`
              : "Ask whether they can take the application on the call. If not, they can mail a paper form."),
        script: st.phoneApplies === false ? null : `Hi, I'd like to apply for ${programName === "SNAP" ? "SNAP food benefits" : programName} ${v.callFor}. ${self ? "I'm" : "They're"} over 60.`,
      }
    : null;

  const open = st?.paperOnly
    ? { title: `Get ${state}'s paper form`, href: st.paperUrl, label: `Get ${state}'s form` }
    : { title: `Apply on ${state}'s website`, href: st?.applyUrl ?? null, label: `Open ${state}'s application` };

  return {
    route: "state_snap",
    variant: "apply_along_snap_v1",
    open,
    moneyIntro: "Here's what to put, and the costs most people leave out:",
    checkinLine: "We'll check in after about five days to make sure the interview call came, and again after about five weeks.",
    doneCheckin: "in about five days to make sure the interview call came",
    contactLine: "We'll ask in a few days whether the interview call came, and help if something's stuck.",
    phone,
    shortForm: st?.seniorForm
      ? { text: `${State} has a shorter form for some older households with no wages: ${st.seniorForm.name}. Ask if ${they} qualify.`, href: st.seniorForm.url }
      : null,
    eyebrow: `${programName === "SNAP" ? "SNAP" : programName} application${known ? ` · ${input.stateName}` : ""}`,
    heading: "Apply for help buying groceries",
    lede: `${calledLine} It puts money for groceries on a card every month. For someone 60 or older, medical and housing costs lower the income ${state} counts.`,
    formLine: st?.paperOnly
      ? `${State} has no online application. Fill in the paper form with the answers below, then mail, fax, email or bring it to your local office.`
      : `You apply on ${state}'s own site. It works on a phone, and you can fill it in ${self ? "yourself" : `for ${v.subject}`}.`,
    gatherLine: `Have ${their} Social Security number, income amounts, and recent bills nearby.`,
    money: [household, incomeRow, medical, housing],
    gather: [
      `${Their} Social Security number`,
      "Monthly amounts of Social Security, pensions and any wages",
      "Rent or mortgage, utility and medical bills",
    ],
    steps,
    next,
    disclaimer: `Olera is a free service and isn't part of ${known ? `the state of ${input.stateName}` : "your state"} or the USDA. We share free information and can get things wrong, so please confirm anything important with ${state}. They make every decision.`,
  };
}
