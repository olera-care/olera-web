# -*- coding: utf-8 -*-
"""
Olera staffing beachhead revenue model.

Bottom-up, market-by-market. Built for the CRP Commercialization Plan; the
Research Strategy quotes only the headline figures this produces.

Every assumption is named in ASSUMPTIONS below with its source or its status
as a hypothesis to be measured during the award. Nothing here is fitted
backwards from a target revenue number.

Run:  python3 staffing_revenue_model.py
"""
import math

# ----------------------------------------------------------------------------
# ASSUMPTIONS
# ----------------------------------------------------------------------------
A = {
    # --- Price -------------------------------------------------------------
    # $275/month per provider organization, unlimited hiring. This is the
    # pricing hypothesis carried from the preliminary staffing pilot; Aim 3
    # Task 3.2 sets the price by experiment rather than assumption.
    "price_per_month": 275.0,

    # --- Market definition -------------------------------------------------
    # A "market" is a US metropolitan area carrying at least 150 licensed
    # provider organizations that employ direct-care staff: non-medical home
    # care agencies, home health agencies, assisted living operators, adult
    # day programs, and small skilled-nursing operators.
    #
    # National denominator: ~33,200 home health care agencies (2022) plus
    # ~9,961 Medicare-certified home health agencies (2024). Concentration in
    # large metros means a targeted metro carries well above the naive
    # national average of ~85 agencies per metro area.
    "addressable_providers_per_market": 250,

    # --- Penetration -------------------------------------------------------
    # Steady-state share of addressable providers holding an active paid
    # account, 36 months after market activation. Grounded in the ROI in
    # Table 1: a 30-caregiver agency replacing 23 caregivers a year spends
    # about $11,700 at the $520 median acquisition cost and $3,300 with
    # Olera. Vertical software with that ratio reaches 15-25% penetration in
    # a mature local market. 20% is the midpoint. THIS IS THE SINGLE MOST
    # SENSITIVE ASSUMPTION IN THE MODEL; Aim 3 measures it directly.
    "steady_state_penetration": 0.20,

    # --- Ramp --------------------------------------------------------------
    # Logistic adoption within a market. Midpoint at month 15 after
    # activation, slope 0.22. Produces ~7% of ceiling at activation, ~50% at
    # month 15, ~90% at month 25, ~97% at month 36.
    "ramp_midpoint_month": 15.0,
    "ramp_slope": 0.22,

    # --- Retention ---------------------------------------------------------
    # Annual logo retention. Home care operators are sticky when a vendor
    # delivers hires and churn quickly when it does not, so retention is
    # treated as a measured Aim 3 endpoint, not a given. 75% is the planning
    # assumption. Churn is already embedded in the net-account ceiling above;
    # this figure drives lifetime value only.
    "annual_retention": 0.75,

    # --- Acquisition cost --------------------------------------------------
    # Market entry cost is the Aim 3 operational figure. Per-account
    # acquisition cost is a planning assumption that Aim 2 Task 2.5 and Aim 3
    # measure from live spend.
    "market_entry_cost": 30_000.0,
    # Direct sales and marketing cost to close one account. A local rep at a
    # fully loaded $90,000 closing four accounts a month implies about $1,875;
    # adding marketing and onboarding gives $2,400. Deliberately set at the
    # expensive end so the model is not flattered by an optimistic CAC.
    "direct_acquisition_cost_per_account": 2_400.0,

    # --- Caregiver supply requirement --------------------------------------
    # Placements each paid account needs per year for the subscription to
    # keep paying for itself. A 30-caregiver agency at 75-80% turnover
    # replaces ~23 caregivers a year; Olera supplying a third of that is 8.
    # This is the operational constraint the workforce product must clear.
    "placements_per_account_per_year": 8,
}

# Market activation schedule, as month index from award start (month 1 = first
# month of the award). Award runs months 1-36.
#   Aim 3 wave 1: 4 markets at month 22
#   Aim 3 wave 2: 4 markets at month 30
# Post-award expansion reuses the replicated playbook.
SCHEDULE = (
    [(22, 4), (30, 4)]                                   # in-award, paid
    + [(37 + 3 * i, 3) for i in range(4)]                # year 4: +12
    + [(49 + 3 * i, 4) for i in range(4)]                # year 5: +16
    + [(61 + 3 * i, 5) for i in range(4)]                # year 6: +20
)

HORIZON = 72  # months modeled (6 years: 3 award + 3 post-award)


def ceiling_accounts():
    return A["addressable_providers_per_market"] * A["steady_state_penetration"]


def accounts_at(months_since_activation):
    """Net active paid accounts in one market, m months after activation."""
    if months_since_activation < 0:
        return 0.0
    c = ceiling_accounts()
    k, t0 = A["ramp_slope"], A["ramp_midpoint_month"]
    return c / (1.0 + math.exp(-k * (months_since_activation - t0)))


def run():
    active = []  # activation month for every market opened
    for start, n in SCHEDULE:
        active.extend([start] * n)

    rows = []
    cumulative_revenue = 0.0
    for m in range(1, HORIZON + 1):
        accts = sum(accounts_at(m - s) for s in active if s <= m)
        mrr = accts * A["price_per_month"]
        cumulative_revenue += mrr
        rows.append({
            "month": m,
            "markets": sum(1 for s in active if s <= m),
            "accounts": accts,
            "mrr": mrr,
            "arr": mrr * 12,
            "cum_rev": cumulative_revenue,
        })
    return rows


def lifetime_value():
    annual = A["price_per_month"] * 12
    churn = 1.0 - A["annual_retention"]
    return annual / churn


def cac():
    per_market_accounts = ceiling_accounts()
    return (A["market_entry_cost"] / per_market_accounts
            + A["direct_acquisition_cost_per_account"])


def mature_market_economics():
    c = ceiling_accounts()
    return {
        "accounts": c,
        "arr": c * A["price_per_month"] * 12,
        "entry_cost": A["market_entry_cost"],
        "placements_needed_per_year": c * A["placements_per_account_per_year"],
    }


def national_tam():
    """Subscription TAM across US home care agencies alone, at list price."""
    agencies = 33_200
    return agencies * A["price_per_month"] * 12


if __name__ == "__main__":
    rows = run()
    by_month = {r["month"]: r for r in rows}

    print("=" * 72)
    print("OLERA STAFFING BEACHHEAD REVENUE MODEL")
    print("=" * 72)
    print()
    print("Per-account price          $%s/mo  ($%s/yr)"
          % (int(A["price_per_month"]), int(A["price_per_month"] * 12)))
    print("Addressable per market     %d provider organizations"
          % A["addressable_providers_per_market"])
    print("Steady-state penetration   %.0f%%" % (A["steady_state_penetration"] * 100))
    print("Ceiling accounts / market  %.0f" % ceiling_accounts())
    print("Annual logo retention      %.0f%%" % (A["annual_retention"] * 100))
    print()

    mm = mature_market_economics()
    print("-" * 72)
    print("MATURE SINGLE-MARKET UNIT")
    print("-" * 72)
    print("  Active paid accounts       %.0f" % mm["accounts"])
    print("  Annual recurring revenue   $%s" % f'{mm["arr"]:,.0f}')
    print("  Cost to enter the market   $%s" % f'{mm["entry_cost"]:,.0f}')
    print("  Placements needed / year   %.0f" % mm["placements_needed_per_year"])
    print()

    print("-" * 72)
    print("CUSTOMER ECONOMICS")
    print("-" * 72)
    print("  Lifetime value             $%s  (at %.0f%% annual retention)"
          % (f"{lifetime_value():,.0f}", A["annual_retention"] * 100))
    print("  Blended acquisition cost   $%s  (entry amortized + direct)"
          % f"{cac():,.0f}")
    print("  LTV / CAC                  %.1fx" % (lifetime_value() / cac()))
    print("  CAC payback                %.0f months"
          % (cac() / A["price_per_month"]))
    print()

    print("-" * 72)
    print("TRAJECTORY")
    print("-" * 72)
    print("  %-28s %8s %10s %14s" % ("", "markets", "accounts", "ARR"))
    for label, m in [
        ("End of award (month 36)", 36),
        ("Month 48", 48),
        ("Month 60", 60),
        ("Month 72", 72),
    ]:
        r = by_month[m]
        print("  %-28s %8d %10.0f %14s"
              % (label, r["markets"], r["accounts"], f'${r["arr"]:,.0f}'))
    print()
    print("  Cumulative revenue through month 36:  $%s"
          % f'{by_month[36]["cum_rev"]:,.0f}')
    print("  Cumulative revenue through month 72:  $%s"
          % f'{by_month[72]["cum_rev"]:,.0f}')
    print()

    print("-" * 72)
    print("SENSITIVITY ON STEADY-STATE PENETRATION")
    print("-" * 72)
    print("  %-14s %14s %16s %14s"
          % ("penetration", "accts/market", "ARR/market", "ARR month 72"))
    base = A["steady_state_penetration"]
    for pen in (0.10, 0.15, 0.20, 0.25):
        A["steady_state_penetration"] = pen
        c = ceiling_accounts()
        r72 = run()[-1]
        print("  %-14s %14.0f %16s %14s"
              % ("%.0f%%" % (pen * 100), c,
                 f'${c * A["price_per_month"] * 12:,.0f}',
                 f'${r72["arr"]:,.0f}'))
    A["steady_state_penetration"] = base
    print()

    print("-" * 72)
    print("NATIONAL CONTEXT")
    print("-" * 72)
    print("  US home care agencies              ~33,200")
    print("  Subscription TAM, home care only   $%s/yr"
          % f"{national_tam():,.0f}")
    print("  (excludes assisted living, adult day, and skilled nursing")
    print("   operators, and excludes the institutional customer class)")
    print()
