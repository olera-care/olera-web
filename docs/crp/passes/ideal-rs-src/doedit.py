# -*- coding: utf-8 -*-
from ed2 import apply

B1 = [
# SIG 4 -- tighten the closing money argument
("""The money to support older adults at home largely exists today. Too much of it is spent later, on worse outcomes and more expensive care.""",
 """The money largely exists today; too much of it is spent later, on worse outcomes and more expensive care."""),

# SIG 13 -- Table 2's note already carries the staffing-channel point
("""On the staffing side the distinction is simpler: agencies, job boards, and gig platforms compete only for workers already in the direct-care pool. <b>Olera builds the pathways and infrastructure that bring new people into caregiving,</b> which is the subject of Key Innovation 1.""",
 """<b>Olera builds the pathways that bring new people into caregiving,</b> which is the subject of Key Innovation 1."""),

# SIG 16 -- Phase IIB study is described in full in the Progress Report
("""A Phase IIB evaluation now underway is measuring acceptance of the navigation product in 200 diverse family caregivers and reports before this award begins; Aim 1 then audits the execution outputs against a blinded expert panel and tests the execution experience with families directly.""",
 """The Phase IIB evaluation now underway measures acceptance in 200 diverse family caregivers and reports before this award begins; Aim 1 then audits execution outputs against a blinded panel and tests the execution experience with families."""),

# INN 4 -- the compounding claim belongs to KI3, not here
("""Agents that complete multi-step administrative work are being built across many industries; the general capability is not ours. What is ours is the substrate they act on.""",
 """Agents that complete multi-step administrative work are being built across many industries; the general capability is not ours, the substrate they act on is."""),
("""That makes the outcome measurable, makes it saleable to an organization bearing the cost of unmet need, and makes the system improve, since every completed case becomes supervised training data for the next.""",
 """That makes the outcome measurable, and saleable to an organization bearing the cost of unmet need."""),

# INN 8
("""Execution is what produces that layer, and it compounds: more families produce more executed cases, which produce more observed rules, capacity, and outcomes, which produce better navigation, which establishes care for more families.""",
 """Execution produces that layer, and it compounds: more families produce more executed cases, which produce more observed rules, capacity, and outcomes, which produce better navigation for more families."""),
]

B2 = [
# APOPEN 1 -- Figure 5 states the stands-on-the-one-before-it line
("""<b>Each stage stands on the one before it, and Phase IIB is the first stage:</b> this award does not re-establish what prior funding has already established, and where it relies on a Phase IIB result the contingency is stated.""",
 """<b>Phase IIB is the first stage in Figure 5:</b> where this award relies on a Phase IIB result, the contingency is stated."""),

# AIM1 2 -- engineering approach
("""The platform runs today as a TypeScript and React web application over managed Postgres, with the agent and data services in Python, under trunk-based development with separate staging and production environments; staging runs on a synthetic household corpus, so no real family record is used in testing.""",
 """The platform runs today as a TypeScript and React web application over managed Postgres, with agent and data services in Python, under trunk-based development; staging runs on a synthetic household corpus, so no real family record is used in testing."""),

# AIM1 6 -- Task 1.4 opening
("""Phase IIB
already measures how accurately CareNavigator identifies what a household qualifies for, against a
manually determined standard, at a greater than 90 percent target. <b>This task does not re-measure
that. It measures what this award adds:</b> whether the packages the execution agents assemble are
correct enough to send to an agency on a family's behalf.""",
 """Phase IIB already measures how accurately CareNavigator identifies what a household qualifies for, at a greater than 90 percent target against a manually determined standard. <b>This task does not re-measure that;</b> it measures whether the packages the execution agents assemble are correct enough to send to an agency on a family's behalf."""),

# AIM1 7 -- Task 1.5
("""<b>This is deliberately not a repeat of the Phase IIB evaluation,</b> which measures acceptance of navigation and planning in 200 diverse caregivers. What is untested is whether a family understands and trusts an agent acting on their behalf and catches an error when one appears.""",
 """<b>This is not a repeat of the Phase IIB evaluation,</b> which measures acceptance of navigation and planning. What is untested is whether a family understands and trusts an agent acting on their behalf and catches an error when one appears."""),

# AIM2 4
("""Aim 2 therefore reports establishment as an estimate with stated precision rather than against a threshold we would have to invent, which would be worse than reporting an unmeasured quantity honestly, and gates instead on the loops completing for both aid and services.""",
 """Aim 2 therefore reports establishment as an estimate with stated precision rather than against a threshold we would have to invent, and gates instead on the loops completing for both aid and services."""),

# AIM3 4 -- pricing design
("""<b>Each of the four prices is assigned to two of the eight markets.</b> Price is assigned by market rather than by account because providers in the same market compare quotes.""",
 """<b>Each of the four prices is assigned to two of the eight markets,</b> by market rather than by account because providers in the same market compare quotes."""),
("""<i>Eight markets is eight units of assignment, and the analysis is designed for that rather than around it.</i> The primary comparison uses randomization inference: the observed difference between arms is referred to the distribution of differences the other possible price assignments would have produced, which is valid with few clusters. <b>With four arms of two markets each, that comparison resolves""",
 """The primary comparison uses randomization inference: the observed difference between arms is referred to the distribution of differences the other possible price assignments would have produced, which is valid with eight units of assignment. <b>That comparison resolves"""),

# AIM3 5 -- ADC described once, in Technical assistance
("""ADC confirms revenue, acquisition cost, operating cost, retention, customer economics, and market-level profitability, and produces the financial package an investor requires; discrepancies are investigated and reported rather than quietly reconciled.""",
 """ADC confirms revenue, acquisition cost, operating cost, retention, customer economics, and market-level profitability and produces the financial package an investor requires; discrepancies are reported rather than quietly reconciled."""),

# AIM3 7 -- typo, stale task number, and revenue diversification belongs to the CP
("""improve the product where the the Aim 2 value study locates the gap""",
 """improve the product where the Aim 2 value study locates the gap"""),
("""And if staffing revenue alone proves insufficient, the alternative commercialization pathway is the institutional customer class that Task 3.5 makes available, together with an employer-paid caregiver benefit on the same product, contracted navigation on the GUIDE precedent, and aggregate market intelligence from the outcomes record.""",
 """Revenue pathways beyond staffing, including the institutional customer class Task 3.4 makes available, are developed in the Commercialization Plan."""),

# APCLOSE 0 -- ADC's descriptor already given in Task 3.3
("""<b>ADC</b>, a strategic accounting and CPA firm, performs the independent financial validation in Task 3.3""",
 """<b>ADC</b> performs the independent financial validation in Task 3.3"""),

# PROG 1 -- reliance on Phase IIB is stated in the Approach and in Figure 5
("""It reports before this award begins, and this application relies on it rather than repeating it.""",
 """It reports before this award begins."""),

# PROG 2 -- Dr. Fan's effort and Dr. Ory's role are given under Technical assistance
("""Dr. Fan is Co-Investigator at 25 percent effort and holds every human subjects protocol, supported by Dr. Marcia Ory of the Center for Population Health and Aging at Texas A&amp;M University, who has supervised human subjects research on Phase IIB.""",
 """Dr. Fan is Co-Investigator and holds every human subjects protocol, with Dr. Marcia Ory of the Center for Population Health and Aging at Texas A&amp;M University supervising, as she has on Phase IIB."""),
]

apply("body1.py", B1)
apply("body2.py", B2)
