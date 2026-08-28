# -*- coding: utf-8 -*-
"""Pass 1: compression to the 12-page limit, expressed as an explicit edit list.

Every entry is either a deletion or a replacement assembled from sentences that
already exist in the live document. Where a replacement appears, it contains only
sentences (or clauses) present in the source, minus what was cut. `**` marks a
bold run-in. Nothing here paraphrases; the audit in `audit_edits.py` proves it.
"""

# --------------------------------------------------------------- deletions
DROP = {
    9,    # "The order matters" - the numbered list and Figure 2 already carry sequence
    15,   # "Together, these aims advance Olera" - summary of the paragraph above
    29,   # "Integration with Olera's business plan" - restates 12, 50 and 97
    36,   # relationship tenure - Table 3 carries it
    37,   # lead-in to the deleted progression figure
    66,   # "Taken together" - summary of the section
    72,   # "Working legal basis for drafting" - a note on consulting counsel
    123,  # truncated final sentence, see the change log
    # captions belonging to figures cut below
    39, 44, 54, 70, 77, 103, 111, 120,
}

# Figures cut in Pass 1. Each is listed with what already carries its content.
DROP_FIGURES = {
    'image6.png',   # two markets: every value is in the two paragraphs above it
    'image7.png',   # IP protections: the four categories are the Protection strategy paragraph
    'image12.png',  # market activation process: the Market selection paragraph carries it
    'image1.png',   # replication economics: the same three points are in the paragraph above
    'image3.png',   # evidence chain: uncaptioned, restates the institutional paragraphs
    'image2.png',   # revenue by year: Table 8 carries the same series plus Years 5 to 10
    'image5.png',   # stages and gates: Table 9's period and gate columns carry it
    'image4.png',   # financing transition: the two Finance paragraphs state the same timing
}

# Figure-content tables cut with their figures
DROP_FIGURE_TABLES = {38, 43}

# The care-establishment pathway figure sits with the paragraph that references it,
# on page one. The Valley of Death figure keeps the source's own anchor, after the
# five risks, which also fills the page-two break.
FIG_REANCHOR = {'image20.png': 2}

# tables removed outright
DROP_TABLES = {
    79,   # fundraising plan - Figure 4 and the Fundraising Plan paragraph carry it
    80,   # and its caption
}
DROP |= DROP_TABLES

# ------------------------------------------------------- table restructuring
# item -> column indices to drop
TABLE_DROP_COLS = {
    121: [1],   # management timeline: the research column belongs to the Research Strategy
    21:  [1],   # pathway table: "what exists today" is implied by where families fall off
}

# item -> row indices to drop
TABLE_DROP_ROWS = {
    99: [1, 6],   # the two equation rows: both equations are stated in the prose
}

# item -> {(row, col): replacement text}. Cell text only, no new claims.
TABLE_CELL = {
    33: {(4, 0): 'Team',
         (4, 1): 'Founder-led product and engineering · full-time engineer (~2 years) · two full-time '
                 'family/provider call-center personnel (>3 years) · part-time marketing (~1.5 years) · '
                 'two part-time research assistants (~5 and ~1.5 years)',
         (10, 0): 'Finance, compliance, regulatory',
         (10, 1): 'Founder-led finance and federal administration supported by ADC accounting/CPA and '
                  'specialized legal/compliance counsel · HIPAA-aligned data practices · federal '
                  'research, IRB, and data stewardship experience · referral-compliance review'},
    121: {(1, 2): 'Technical and measurement infrastructure operational; Staffing workflow ready for '
                  'real-world deployment.',
          (1, 3): 'Confirm readiness for real-world market validation.',
          (2, 2): 'Quantify acquisition costs, hires per county per month, provider demand, '
                  'geographic replicability, and care-establishment performance.',
          (2, 3): 'Determine which configurations advance to paid testing; begin investor '
                  'cultivation.',
          (3, 2): 'About $120K recognized Staffing revenue and about $240K annualized exit run '
                  'rate; county economics characterized.',
          (3, 3): 'Select markets for post-CRP replication; conduct the third-party financing '
                  'process before CRP runway ends.',
          (4, 2): 'About $600K combined commercial revenue, with Staffing expansion and initial '
                  'institutional revenue.',
          (4, 3): 'Set expansion pace based on measured county economics, institutional traction, '
                  'and available capital.',
          (5, 2): 'About $1.5M combined commercial revenue, approximately 25 Staffing counties and '
                  'three institutional relationships.',
          (5, 3): 'Scale according to measured economics and capital efficiency.'},
}

TABLE_CELL[21] = {
    (1, 2): 'Assessment may end as information or referral rather than an executable case',
    (2, 2): 'Fragmented inventories and handoffs leave families to reconcile options',
    (3, 2): 'Eligibility information does not ensure applications, documentation, or approval',
    (4, 2): 'Providers may have an opening but lack workers to serve the family',
    (5, 2): 'Administrative tasks cross organizations; risk of "lost to follow up"',
    (6, 2): 'Referral or eligibility is treated as success even when service never starts',
    (7, 2): 'No longitudinal record connects need, pathway failure, and subsequent outcomes',
    (1, 3): 'Persistent case begins with structured needs assessment',
    (2, 3): 'Curated national resource infrastructure identifies services and providers',
    (3, 3): 'Aid identification is linked to execution and case tracking',
    (4, 3): 'Caregiver Staffing adds a workforce channel when capacity blocks care',
    (5, 3): 'AI-supported workflows execute applications, documents, follow-up, and intake',
    (6, 3): 'Closed-loop confirmation records whether appropriate care actually begins',
    (7, 3): 'Case-level outcomes infrastructure supports institutional evidence generation',
}

TABLE_CELL[90] = {
    (1, 1): 'Organic search through provider pages, benefits resources, and guides; social communities',
    (1, 2): 'Geo-targeted search and social ads; community, faith, and aging-service organizations; clinics',
    (2, 1): 'National provider index; organic discovery; inbound profile claiming',
    (2, 2): 'Claim-your-profile email and calls; family inquiries; associations, conferences, franchise relationships',
    (3, 1): 'University relationships and prior applicant pipeline',
    (3, 2): 'Career centers and job boards; student organizations; advisors and faculty; career fairs',
    (4, 1): 'Advisor and industry relationships; emerging CRP evidence',
    (4, 2): 'Direct business development; advisor introductions; targeted outreach to MA plans, MCOs, ACOs, health systems',
}

# Table 7 (source item 99) carried the revenue-stream section's local marker
# numbers. Renumber into the document-wide sequence: 75% turnover is the 2025
# Activated Insights benchmarking report (6); the ~$2,700 replacement cost is
# the Activated Insights retention brief (14).
TABLE_CELL[99] = {
    (4, 3): 'Published benchmark6',
    (5, 3): 'Published benchmark14',
}

TABLE_CELL[33][(2, 1)] = ('Pre-scale commercial company · nationally deployed CareNavigator · early '
                          'Caregiver Staffing validation · no significant annual sales')
TABLE_CELL[33][(8, 1)] = 'NSF I-Corps customer discovery (200+ interviews) · Blackstone Techstars · Texas A&M'

TABLE_CELL[27] = {
    (1, 0): '**Societal.** Families establish appropriate care; available aid is converted into '
            'support; caregiving capacity is added where supply is short',
    (3, 0): '**Scientific and public health.** New visibility into where the care-establishment '
            'pathway fails and how patterns differ across communities',
    (3, 1): 'Case-level pathway records; failure points; county-level capacity and outcomes',
    (3, 2): 'Healthy aging, integrated care, long-term care access, implementation research',
}

TABLE_CELL[47] = {
    (3, 1): 'FY2021 100% · FY2022 100% · FY2023 100% · FY2024 ~100% · FY2025 ~100% (one-off pilot fees, <1%)',
    (5, 1): 'Limited and by design: multiple one-off paid pilots, no recurring revenue. Olera held '
            'monetization until the platform could support it without charging families or gating '
            'referrals. Provider willingness to pay also depends on concentrating families and '
            'providers in the same local markets, which research funding was not scoped to do.',
}

TABLE_CELL[62] = {
    (3, 1): 'Generate longitudinal care-establishment and outcomes data, economic analyses, and '
            'contracting-ready evidence for institutional buyers.',
    (4, 1): 'Independently verify workflows, characterize error behavior, ground actions in curated '
            'data, and maintain auditable records.',
    (5, 1): 'Deploy across multiple counties and measure where performance, cost, workforce '
            'capacity, and care-establishment rates vary.',
}

TABLE_CELL[57] = {
    (0, 0): '**1. End-to-end execution.** CareNavigator integrates assessment, care identification, '
            'funding, AI-agent execution, staffing when needed, and longitudinal outcomes rather '
            'than optimizing a single step.',
    (0, 1): '**2. New workforce supply and demand intelligence.** Caregiver Staffing creates an '
            'easier pathway into direct care rather than merely redistributing workers already '
            'circulating among providers; CareNavigator reveals where family demand and provider '
            'capacity constraints collide locally.',
    (1, 0): '**3. Distribution and local data.** Organic family demand, a national provider and '
            'benefits infrastructure, and county-level care-establishment and outcomes data '
            'compound as the platform is used.',
    (1, 1): '**4. AI interoperability.** Olera can expose domain data and execution capabilities to '
            'search and general-purpose AI interfaces, allowing them to become entry points to '
            'CareNavigator rather than substitutes for its execution layer.',
}

TABLE_DROP_ROWS[99] = [1, 6, 10]   # the payment-precedent row repeats the GUIDE and ACO prose

# rows 5, 6 of the at-a-glance table are folded into the merged Team row above
TABLE_DROP_ROWS[33] = [5, 6, 11]

# ------------------------------------------------------------- replacements
R = {}

R[1] = ("**The product and its impact.** Older Americans and their families face a problem the "
        "market has not solved. Unmet daily care needs compound into preventable geriatric "
        "hospitalization, premature institutionalization, and rising public costs, and each makes "
        "the next more likely (Figure 1). Olera developed CareNavigator through NIA Phase I–IIB as "
        "a care-navigation platform that helps families identify the care they need, the aid that "
        "can help pay for it, and the providers who can deliver it. Its impact potential comes from "
        "intervening while unmet need may still be reversible: among community-dwelling Medicaid "
        "HCBS users, unmet service needs have been associated with substantially greater "
        "emergency-department use (52% vs. 34%) and hospital or rehabilitation stays "
        "(36% vs. 24%).1 CareNavigator therefore targets an upstream, measurable intermediate "
        "outcome, whether a recognized need successfully reaches established care, before unmet "
        "needs force higher and costlier levels of care.")

R[2] = ("The remaining opportunity is to carry navigation through the full pathway from recognized "
        "need to established care (Figure 2). Prior work substantially developed the upstream navigation "
        "needed to assess needs, identify care, and fund care. The CRP will develop and validate "
        "the ability to staff and execute and track the care plan and outcomes, using a validated "
        "**Caregiver Staffing** product to expand the local workforce available to home-care "
        "providers, including when insufficient provider capacity would otherwise prevent care "
        "establishment, and **Task-based AI Agent Execution** to execute care-plan administrative "
        "tasks that cause families to get lost to follow up, together with an **Analytic Outcomes "
        "Data** layer needed to confirm that care was established and measure what follows from "
        "that pathway.")

R[3] = ("**Olera's Valley of Death (Figure 3).** CareNavigator is deployed nationally, draws "
        "15,500+ visitors per month through organic search at near-zero acquisition cost, and has "
        "demonstrated usability and technology acceptance in peer-reviewed studies.2,3 Caregiver "
        "Staffing has also been tested in prior pilots, where providers hired workers sourced "
        "through Olera and demonstrated willingness to pay for the service.4 Family demand, "
        "CareNavigator usability, and basic provider demand for Caregiver Staffing are therefore "
        "substantially de-risked. Five remaining risks must now be retired in sequence:")

R[10] = ''   # text deleted; the paragraph still anchors Figure 2 and its caption

R[12] = ("The alternative is not simply to raise prices or sell the same product differently. The "
         "most immediate ways to monetize CareNavigator would change whom the platform serves or "
         "how families reach care. Charging families would create the greatest barrier for "
         "households already struggling to afford eldercare. Charging providers for referrals would "
         "introduce steering incentives and limit participation by some federally reimbursed "
         "providers. Caregiver Staffing can generate nearer-term provider revenue without those "
         "tradeoffs, but staffing alone addresses only the workforce barrier; it does not help "
         "families navigate, fund, and execute the rest of the care-establishment pathway.")

R[13] = ("Our investor advisors agree that longitudinal outcomes demonstrating CareNavigator's "
         "value to institutional buyers, together with a repeatable provider-revenue model, would "
         "materially improve Olera's investability.")

R[17] = ("**The product to be commercialized.** CareNavigator is Olera's family-facing eldercare "
         "navigation platform. It combines a national, expert-curated resource database with "
         "AI-supported execution workflows and longitudinal outcomes tracking to help families move "
         "from recognized need to established care. Families use CareNavigator at no cost. The "
         "platform assesses needs, identifies appropriate care and financial aid, helps execute the "
         "administrative and follow-up work required to obtain them, confirms whether care was "
         "established, and records where the pathway succeeds or fails (Figure 4).")

R[18] = ("Caregiver Staffing is a complementary provider-facing product and capacity mechanism. "
         "When an otherwise appropriate care plan cannot be delivered because a provider lacks "
         "workers, Olera recruits new caregivers into the workforce and connects them with licensed "
         "providers, which retain responsibility for interviewing, hiring, training, credentialing, "
         "supervision, and care delivery.")

R[20] = ("**Weaknesses in current approaches.** Families do not lack individual resources; they "
         "lack a system accountable for carrying them across the full pathway to established care. "
         "Table 1 organizes current approaches around the same care-establishment pathway used "
         "throughout this application.")

R[23] = ("**Commercial applications and innovation.** The commercial opportunity is not another "
         "directory, referral marketplace, or staffing channel in isolation. It is an integrated "
         "infrastructure that carries a family across the care-establishment pathway and creates "
         "evidence about what happened at every step. Commercially, three features matter most. "
         "First, CareNavigator links assessment, resource identification, funding, execution, "
         "staffing when needed, and confirmation of care rather than optimizing a single handoff. "
         "Second, AI-supported execution moves the product from recommending what a family should "
         "do toward completing and tracking the work required to establish care. Third, every "
         "executed case can produce a structured longitudinal record of the family's needs, "
         "resources pursued, administrative barriers, local capacity, care establishment, and "
         "subsequent outcomes.")

R[24] = ("At scale, this longitudinal record could become a distinctive commercial and scientific "
         "asset: a county-level empirical map of where eldercare pathways succeed, where they fail, "
         "and what resolves those failures. The resulting analytics could inform payers and "
         "accountable care organizations seeking to reduce avoidable utilization, health systems "
         "seeking reliable transitions from referral to care, and providers planning service and "
         "workforce capacity. The CRP tests and builds the infrastructure required to create this "
         "asset; it does not assume its value in advance (Figure 3, lower register).")

R[26] = ("**Commercial and non-commercial impact.** Olera's commercial and public-health objectives "
         "reinforce one another: growth means more families can receive support before unmet needs "
         "progress to higher-cost crises, while each completed case improves the evidence available "
         "to make the system more effective.")

R[35] = ("**Core competencies and operating continuity.** Olera's capabilities now extend beyond "
         "the founders and reflect several years of accumulated operating experience. The company "
         "combines software and applied AI engineering, an expert-curated eldercare data "
         "infrastructure, human-centered aging research, digital distribution, family/provider "
         "operations, and commercialization research. Four peer-reviewed studies established "
         "usability and technology acceptance, and direct family/provider operations continue to "
         "expose the team to the practical barriers between a recommendation and established care.")

R[40] = ("**Olera's progression from R&D to commercial scale.** Early discovery defined the "
         "problem; Phase I/II built and evaluated the first-generation platform and national "
         "resource infrastructure; Phase IIB supported national deployment and deeper "
         "provider/workforce learning; and the CRP is designed to complete execution and outcomes "
         "capabilities, establish repeatable Caregiver Staffing economics, and build the evidence "
         "required for institutional commercialization. Successful CRP completion therefore changes "
         "the appropriate source of capital: subsequent scale is intended to be financed by "
         "commercial revenue and private investment rather than continued dependence on federal "
         "R&D support.")

R[45] = ("As CRP milestones demonstrate repeatable provider sales, operating demand, and "
         "institutional engagement, Olera will internalize dedicated commercial, customer-success, "
         "operations, data/compliance, and finance capabilities when their workload and strategic "
         "importance justify full-time leadership. Post-CRP, commercial revenue and private capital "
         "are expected to support the mature organization required for national scale.")

R[46] = ("**SBIR/STTR commercialization history.** Olera's SBIR history is one continuous arc: a "
         "single NIA project carried from concept to a validated national platform across a Phase "
         "I/II Fast-Track and a Phase IIB continuation (1R44AG074116); Table 4 answers the required "
         "history questions directly.")

R[51] = ("**Caregiver Staffing addresses an unusually persistent provider problem.** The United "
         "States employed approximately 4.68 million home health and personal care aides in 2025, "
         "with roughly 760,500 openings projected each year from 2025 to 2035; home-care benchmarking "
         "separately reported 75% median professional-caregiver turnover in 2024.5,6 The problem "
         "directly constrains growth: 63.3% of surveyed home-care providers reported turning down "
         "cases because of staffing shortages in 2023.7 Caregiver Staffing therefore addresses "
         "provider workforce demand regardless of where the underlying client originates, existing "
         "clients, externally generated referrals, growth, turnover replacement, or a capacity "
         "constraint observed through CareNavigator. Non-medical home care is Olera's initial "
         "provider beachhead.")

R[55] = ("**Market opportunity and path to meaningful scale.** Caregiver Staffing enters an "
         "existing, recurring recruitment market in which providers already spend to fill "
         "vacancies; the CRP determines Olera's repeatable pricing, conversion, retention, and unit "
         "economics. CareNavigator enters a larger institutional market only as evidence matures; "
         "the CRP determines whether established care and longitudinal outcomes create sufficient "
         "economic value for institutional contracting. Olera's geographic unit of "
         "commercialization is a local market, defined as one U.S. county or county equivalent. "
         "This unit allows family demand, provider supply, workforce capacity, care-establishment "
         "outcomes, acquisition costs, and revenue performance to be measured within the same "
         "geography. With more than 3,100 such geographic units nationally, Olera can expand by "
         "replicating a validated local-market model without requiring dominant national market "
         "share.")

R[56] = ("**Significant advantages and competitive position.** The remaining relevant competitive "
         "question is not whether alternatives exist, but why Olera can create differentiated value "
         "as those alternatives evolve. Four advantages matter.")

R[58] = ("**Caregiver Staffing's initial workforce wedge is deliberately narrow.** Olera initially "
         "targets health-profession applicants and students for whom paid caregiving can also "
         "provide meaningful patient-care experience. The opportunity is nationally distributed and "
         "continuously replenished: in the most recent cycles, U.S. MD programs reported 54,699 "
         "applicants and NursingCAS reported 75,078 applicants across 282 participating nursing "
         "schools.32,33 These figures do not represent the full addressable workforce; they "
         "demonstrate the scale of only two readily measured pipelines before PA, PT, OT, pharmacy, "
         "allied-health, other nursing pathways, and students preparing to apply are considered.")

R[59] = ("**This wedge is differentiated from conventional job boards.** Traditional recruiting "
         "channels primarily compete for workers already searching for caregiver jobs. Recent "
         "recruitment benchmarking found Indeed generated 68% of applications to participating "
         "home-care agencies in Q1 2026, illustrating how concentrated conventional caregiver "
         "acquisition remains.13 Olera instead builds relationships with universities and applicant "
         "communities to introduce caregiving as a paid entry pathway into healthcare, while the "
         "licensed provider remains the employer responsible for interviewing, hiring, training, "
         "credentialing, supervision, and employment standards.")

R[60] = ("**Current and emerging competition.** For Caregiver Staffing, Olera competes across "
         "categories rather than against a single end-to-end incumbent. Provider staffing "
         "alternatives include large job boards like Indeed, staffing agencies, caregiver-specific "
         "recruiting platforms, and emerging student-caregiver models such as CareYaya. For "
         "CareNavigator, alternatives include government and nonprofit resource directories, "
         "patient navigators, social workers and care managers, eldercare referral platforms like A "
         "Place for Mom or Caring.com, and increasingly general-purpose AI and search where "
         "families ask eldercare-related questions. Incumbents may add AI, execution, or staffing "
         "capabilities over the next several years, and general-purpose AI systems will become more "
         "capable at answering eldercare questions. Olera's response is to compete where "
         "domain-specific infrastructure matters most: verified local provider and benefits data, "
         "execution of real administrative workflows, workforce-capacity creation, confirmation of "
         "care establishment, and longitudinal outcome records.")

R[64] = ("**Strategic alliances, partnerships, and route to market.** Olera enters the CRP with "
         "relationships on both sides of its beachhead: university relationships that support "
         "workforce recruitment and working relationships with local and franchise-affiliated "
         "eldercare providers that can serve as early customers and implementation sites. Its "
         "existing national provider database and organic family traffic provide additional "
         "distribution infrastructure, while academic and commercialization advisors connect the "
         "company to senior-care operators, payers, investors, and strategic partners. No FDA "
         "approval is required for the products proposed here, and Olera does not depend on a "
         "licensing agreement to commercialize them.")

R[65] = ("**Marketing and sales strategy.** Provider sales begin where Olera can demonstrate an "
         "immediate staffing constraint and measurable hiring value; institutional development "
         "begins with organizations whose populations and economics align with the outcomes the CRP "
         "is designed to measure. The detailed acquisition channels, sales process, production "
         "infrastructure, and post-CRP scaling plan are presented in the Production and Marketing "
         "Plan (Section 7).")

R[68] = ("**Protection strategy.** Olera will protect each component of its commercial advantage "
         "with the form of intellectual-property protection best suited to that asset. The "
         "principal proprietary assets generated and extended through the CRP include "
         "CareNavigator's non-public workflow orchestration and execution logic; the structure, "
         "normalization, quality-control methods, and derived variables that organize Olera's "
         "provider and financial-aid data; the longitudinal care-establishment and outcomes "
         "architecture and resulting proprietary datasets; and the methods that connect local "
         "workforce capacity to care execution. Olera will maintain appropriate non-public methods, "
         "configurations, derived data, and operating processes as trade secrets through role-based "
         "technical access, confidentiality obligations, and employee, contractor, and partner "
         "agreements governing confidentiality, intellectual-property ownership, and permitted data "
         "use. Original source code, interfaces, documentation, and content are protected by "
         "copyright, while Olera and product branding will be protected through trademark rights "
         "and registration where commercially appropriate. For CRP-generated inventions with "
         "sufficient novelty and commercial value, Olera will evaluate patent protection with IP "
         "counsel before public disclosure; where disclosure would weaken the asset's defensive "
         "value, trade-secret protection may provide the stronger strategy.")

R[71] = ("**Temporal barriers to replication.** Individual interface features can be reproduced; "
         "the integrated commercial asset is substantially harder to recreate. A new entrant would "
         "need to rebuild Olera's family distribution, national provider and benefits "
         "infrastructure, execution workflows, provider and workforce relationships, and the "
         "longitudinal evidence showing where care is established, where it fails, and what "
         "follows. These barriers compound during the CRP: every deployment both advances "
         "commercialization and adds execution history, local-market intelligence, "
         "care-establishment records, and longitudinal outcomes that a new entrant cannot obtain "
         "retrospectively. Olera will selectively expose capabilities through controlled interfaces "
         "where interoperability expands distribution while retaining the proprietary data, "
         "workflow logic, and outcome infrastructure behind those interfaces.")

R[74] = ("**Capital required.** Olera is requesting approximately $4 million in CRP funding over "
         "three years to finance the later-stage R&D, real-world validation, and commercialization "
         "work required to cross the Valley of Death described in Section 1. CRP capital will "
         "complete and validate the CareNavigator execution and outcomes infrastructure, establish "
         "Caregiver Staffing as a repeatable provider-revenue pathway, generate the evidence needed "
         "for institutional commercialization, and develop the operating playbooks required for "
         "subsequent expansion. The award is designed to move Olera from pre-scale "
         "commercialization to an investable commercial inflection point, not to assume that "
         "revenue from the limited CRP markets immediately replaces the full federal operating "
         "budget.")

R[75] = ("**From CRP capital to commercial sustainability.** Olera's financing strategy combines "
         "capital sources that enter at different stages (Figure 4). During the CRP, federal "
         "capital finances the R&D and evidence generation that private investors are not yet "
         "positioned to underwrite. Caregiver Staffing is validated free in Year 2 and begins paid "
         "testing in Year 3, producing approximately $120,000 in recognized revenue and a ~$240,000 "
         "annualized exit run rate under the conservative base case (Section 8). Post-CRP, the "
         "model projects approximately $600,000 in total commercial revenue in Year 4 and $1.5 "
         "million in Year 5 as additional Staffing markets open and the first institutional "
         "CareNavigator contracts emerge. This growing revenue base contributes operating cash but "
         "does not eliminate the near-term financing requirement; independent third-party capital "
         "bridges the remaining operating need and finances faster market and institutional "
         "expansion until recurring commercial revenue can assume a greater share of growth.")

R[78] = ("**Fundraising Plan.** Olera will begin financing its next stage before CRP funding ends. "
         "The aims are deliberately sequenced so that sufficient technical, real-world, and early "
         "commercial evidence should be available by approximately the end of Year 2 to begin "
         "structured investor cultivation, while Year 3 strengthens the financing case and supports "
         "a formal raise. Year 1 establishes quarterly investor-readiness reviews and defines "
         "financing milestones and reporting. The objective is to enter post-CRP commercialization "
         "with financing secured or actively closing rather than encounter a new funding gap.")

R[82] = ("**Post-CRP financing requirement.** Olera expects independent third-party capital to "
         "finance the transition from CRP validation to commercial scale. The current five-year "
         "model estimates approximately $1.4 million in operating requirements in post-CRP Year 4 "
         "against ~$600,000 in projected commercial revenue, leaving an approximately $800,000 "
         "operating gap; by Year 5, approximately $1.85 million in operating requirements against "
         "~$1.5 million in projected revenue narrows that gap to approximately $350,000. Olera "
         "therefore anticipates a post-CRP financing round of approximately $3–5 million, subject "
         "to refinement as CRP unit economics are measured. The raise is intentionally larger than "
         "the modeled operating deficit because its purpose is not merely to extend runway: it will "
         "finance replication into additional county markets, workforce acquisition, institutional "
         "business development and implementation, product and engineering capacity, and sufficient "
         "working capital to grow ahead of internally generated cash. Detailed revenue assumptions "
         "and commercial economics are presented in Section 8.")

R[83] = ("**Use of post-CRP capital.** Third-party capital accelerates both commercialization "
         "pathways. Expanding Caregiver Staffing into additional county markets generates successful "
         "hires, provider revenue, and greater workforce capacity. Expanding CareNavigator generates "
         "more care-establishment episodes and a larger longitudinal evidence base from which "
         "institutional contracts can mature. Private capital therefore serves not simply as "
         "runway, but as the bridge from a CRP-validated model to progressively revenue-financed "
         "commercial scale (Figure 5).")

R[84] = ("**Financing continuity.** If financing takes longer than expected, management can "
         "moderate expansion while commercial revenue extends runway.")

R[86] = ("**Production model.** Olera produces and operates its software in-house, but the "
         "commercially meaningful unit of production is a functioning local market: a county in "
         "which the provider and benefits infrastructure is available, families can enter "
         "CareNavigator, providers can participate, workers can enter local provider labor pools "
         "through Caregiver Staffing, and completed care pathways can be measured.")

R[87] = ("**Digital product and AI infrastructure.** CareNavigator and Caregiver Staffing are "
         "developed by Olera's internal engineering team, including the founders and full-time "
         "engineering personnel. Development follows a rapid build-measure-learn cycle: features "
         "are coded and tested in staging, quality-assured, released to production, and "
         "instrumented to measure onboarding, click-through, task completion, and fall-off. Because "
         "the products are software, there is no manufacturing, inventory, or physical-distribution "
         "dependency; additional engineering capacity can be added as product velocity and "
         "commercial demand increase. **Data and workforce infrastructure.** Olera's provider and "
         "benefits information is indexed, normalized, reviewed, and surfaced geographically so "
         "that local CareNavigator infrastructure can exist before every provider has actively "
         "joined the network. Providers can then claim and maintain their profiles through "
         "self-service portals. Caregiver Staffing operates through the same platform: providers "
         "can seek workers for staffing needs arising anywhere in their business, while "
         "CareNavigator provides an additional signal when local workforce capacity is preventing a "
         "family from establishing care.")

R[89] = ("**Customer and participant acquisition.** A functioning Olera market requires "
         "concentrated participation from families, providers, and caregivers; commercialization "
         "additionally requires conversion of providers and, as evidence matures, institutional "
         "buyers. Olera enters the CRP with established channels for each audience and will use the "
         "award to measure their cost, yield, and reproducibility across markets (Table 6).")

R[93] = ("**Institutional development is evidence-gated rather than transactional.** Olera will "
         "identify Medicare Advantage plans, Medicaid managed-care and managed-LTSS organizations, "
         "ACOs, health systems, and other prospective buyers with meaningful member concentration "
         "in markets where CRP data can demonstrate care-establishment and economic value. "
         "Beginning as evidence matures, the company will use direct business development, advisor "
         "introductions, and industry relationships to move from buyer discovery to an evidence "
         "review, scoped pilot or annual contract, and, if successful, broader geographic "
         "deployment.")

R[94] = ("**Distribution and route to market.** Olera's distribution advantage is already visible "
         "in organic demand: traffic has grown from approximately 50 visitors per day in 2023 to "
         "more than 500 per day in 2026 without paid acquisition (Figure 6). No manufacturing "
         "partner, distributor, or licensing intermediary is required. Families, providers, and "
         "workers access Olera directly through its web and mobile products; provider and staffing "
         "workflows are increasingly self-service; and paid acquisition can be expanded or reduced "
         "by market as measured economics warrant. Olera also intends to make CareNavigator's "
         "domain data and execution capabilities interoperable with search and general-purpose AI "
         "interfaces, allowing those systems to become additional entry points rather than "
         "requiring Olera to own every point of discovery.")

R[95] = ("**Scaling the production and commercial system.** The operating base already includes "
         "founder-led product and commercial leadership, internal engineering, experienced "
         "part-time marketing support, two full-time call-center personnel, established call and "
         "email queues and scripts, self-service portals, and instrumented product analytics. "
         "Variable outreach labor, paid media, travel, and engineering capacity can therefore "
         "expand with validated market demand. The CRP does not fund construction of a "
         "commercialization apparatus from scratch; it measures, systematizes, and makes repeatable "
         "operating processes Olera already uses.")

R[97] = ("**Two revenue engines, sequenced by evidence.** CareNavigator remains free to families "
         "and basic family-provider connections remain free to providers. The near-term engine is "
         "Caregiver Staffing: providers pay when Olera helps them successfully hire workers, "
         "whether the staffing need arises from turnover, existing clients, externally generated "
         "referrals, growth, or a capacity constraint identified through CareNavigator. The "
         "emerging engine is institutional CareNavigator contracting with organizations responsible "
         "for populations of older adults, including Medicare Advantage plans, accountable care "
         "organizations, Medicaid organizations, and health systems.")

R[104] = ("The five-year model is an early commercialization case, not the scale ceiling. At the "
          "same conservative assumptions, 100 active counties produce approximately 12,000 "
          "successful hires and $3.0 million in annual Staffing revenue; 250 counties, 30,000 hires "
          "and $7.5 million; and 500 counties, 60,000 hires and $15 million. At 500 counties, "
          "60,000 successful provider hires are equivalent in scale to approximately 8% of the "
          "roughly 760,500 annual U.S. home health and personal care aide openings projected by "
          "BLS.5 Successful hires are not assumed to equal unique new workforce entrants: the CRP "
          "will separately measure unique workers recruited, prior workforce status, repeat "
          "placements, retention, and resulting provider capacity.")

R[105] = ("**Institutional CareNavigator: contracts follow outcomes evidence.** The institutional "
          "engine is modeled separately and more conservatively. Olera assumes no institutional "
          "revenue during the CRP. Years 1 to 3 instead test the intermediate outcome on which the "
          "institutional value proposition depends: whether recognized needs progress through "
          "navigation, funding, execution, and ultimately established care; why pathways fail when "
          "they do not; and what happens longitudinally after care is or is not established. This "
          "matters economically because unmet home- and community-based service needs have been "
          "associated with substantially greater acute-care utilization (Section 1).1 The CRP does "
          "not assume that CareNavigator prevents these downstream events; it generates the "
          "care-establishment and longitudinal evidence needed to determine whether that value "
          "proposition is real.")

R[112] = ("**How the projection should be read.** These projections are not top-down estimates of "
          "market share. They are bottom-up scenarios derived from the number of successful "
          "caregiver hires Olera can produce in each county and the number of evidence-gated "
          "institutional contracts the company can secure. The principal assumptions, which are "
          "Staffing throughput, price, repeat purchasing, contribution margin, and institutional "
          "contracting value, are therefore the same variables the CRP and subsequent buyer "
          "negotiations are designed to replace with measured commercial data.")

R[114] = ("**Staffing and capital as revenue grows.** During the CRP, engineering, research, and "
          "market-validation personnel remain central. As paid Staffing expands, Olera adds "
          "centralized market operations, worker acquisition, provider success, and sales capacity "
          "rather than recreating a full team in every county. As institutional contracts emerge, "
          "business development, implementation, analytics, and account-management capacity grow in "
          "parallel. Engineering grows more slowly because the platform, portals, and workflows are "
          "designed for self-service and automation.")

R[117] = ("**How research and commercialization stay synchronized.** Day-to-day execution is "
          "managed through named workstream owners, maintained task boards, regular operating "
          "meetings, and milestone dashboards tied to the Research Strategy and Commercialization "
          "Plan. Leadership reviews operating progress continuously and commercialization evidence "
          "at defined stage gates, including transitions from engineering to free real-world "
          "validation, from validation to paid commercialization, and from CRP-supported "
          "experimentation to post-CRP expansion. A milestone that misses its predefined threshold "
          "triggers the corresponding alternative strategy rather than automatic continuation.")

R[118] = ("**Commercialization timeline and gates.** The first three years deliberately progress "
          "from build, to validate free, to monetize. Post-CRP commercialization then shifts to "
          "expand and scale, using the evidence, operating playbooks, commercial revenue, and "
          "third-party capital developed during the award. The detailed experimental timeline and "
          "thresholds are provided in the Research Strategy; the management timeline below shows "
          "how those activities produce successive commercialization decisions.")

# captions: identify the takeaway, do not restate the figure
R[22] = ("Table 1. Current approaches address portions of the care-establishment pathway; the CRP "
         "integrates them into a closed-loop system oriented to confirmed care.")
R[28] = "Table 2. Commercial growth produces measurable societal, educational, and scientific value."
R[34] = "Table 3. Olera at a glance."
R[48] = "Table 4. SBIR/STTR commercialization history."
R[63] = "Table 5. Principal market-acceptance uncertainties and the CRP activity designed to retire each."
R[91] = ("Table 6. Olera uses distinct but coordinated acquisition channels to concentrate the "
         "participants and customers required for each local market.")
R[100] = "Table 7. The projection separates published benchmarks from Olera assumptions and CRP hypotheses."
R[109] = ("Table 8. Illustrative base case through post-CRP Year 4, with the final column widening "
          "Year 5 into a Year 5 to Year 10 replication range. *Year 3 assumes approximately six "
          "paid-month equivalents across the eight CRP markets; the resulting exit Staffing run "
          "rate is approximately $240K a year at the same conservative throughput.")
R[122] = ("Table 9. Five-year commercialization management timeline. Revenue values are planning "
          "projections rather than CRP success criteria and will be replaced by economics measured "
          "during the award.")

# section headings, renumbered in document order
R[0]   = "1. Statement of Need"
R[16]  = "2. Value of the CRP Project, Expected Outcomes, and Impact"
R[30]  = "3. Company"
R[49]  = "4. Market, Customer, and Competition"
R[67]  = "5. Intellectual Property Protection"
R[73]  = "6. Finance Plan"
R[85]  = "7. Production and Marketing Plan"
R[96]  = "8. Revenue Stream"
R[115] = "9. Project Management Plan"



# Deeper cuts, second sweep. Whole sentences removed; nothing paraphrased.
R[4] = '**Technical risk.** Can CareNavigator execute and track care establishment?'
R[5] = '**Real-world validation risk.** Does the complete pathway work in practice?'
R[6] = '**Evidence risk.** Does establishing care produce outcomes and economic value institutional buyers care about?'
R[7] = '**Commercial risk.** Can the value created support durable revenue?'
R[8] = '**Financing risk.** Is Olera investable when CRP ends?'

R[23] = ("**Commercial applications and innovation.** The commercial opportunity is not another "
         "directory, referral marketplace, or staffing channel in isolation. It is an integrated "
         "infrastructure that carries a family across the care-establishment pathway and creates "
         "evidence about what happened at every step. AI-supported execution moves the product from "
         "recommending what a family should do toward completing and tracking the work required to "
         "establish care, and every executed case can produce a structured longitudinal record of "
         "the family's needs, resources pursued, administrative barriers, local capacity, care "
         "establishment, and subsequent outcomes.")

R[31] = ("**Origins and objectives.** Olera, Inc. grew from a multidisciplinary effort at Texas A&M "
         "University to solve a problem families repeatedly described: eldercare was difficult to "
         "navigate, difficult to afford, and difficult to convert from information into actual "
         "support. PI Tokunbo (TJ) Falohun began working with Logan DuBose, MD, MBA, now Olera's "
         "Chief Research Officer and co-investigator, through the Texas A&M chapter of Sling Health "
         "in 2019. Their initial work focused on dementia caregiving; continued discovery revealed "
         "a broader need across eldercare and led to Olera's formation in 2020.")

R[41] = ("**Vision, sustainability, and management evolution.** Today, the founders retain "
         "overlapping responsibility for strategy, product, engineering, research, finance, and "
         "administration, supported by established engineering, operations, marketing, and research "
         "personnel. DuBose leads research and internal finance/federal administration with "
         "professional accounting support from ADC; Falohun leads company, product, and technical "
         "strategy. This structure has allowed Olera to remain capital-efficient while building and "
         "operating a national platform.")

R[42] = ("The lean internal team is complemented by senior expertise accumulated over years rather "
         "than assembled for a single application. Marcia Ory, PhD, has advised Olera for more than "
         "six years and brings decades of aging, caregiving, implementation, dissemination, and "
         "sustainability expertise, including 20 years at NIA. Qiping Fan, MD, MS, and Clemson "
         "University provide longstanding capabilities in epidemiology, mixed-methods evaluation, "
         "health-services research, and independent study execution. David Qu, MBA, brings "
         "approximately 30 years of healthcare-technology commercialization and executive "
         "experience, including scaling and exiting digital-health companies, together with "
         "relationships across healthcare and senior-care investment networks.")

R[55] = ("**Market opportunity and path to meaningful scale.** Caregiver Staffing enters an "
         "existing, recurring recruitment market in which providers already spend to fill "
         "vacancies; the CRP determines Olera's repeatable pricing, conversion, retention, and unit "
         "economics. CareNavigator enters a larger institutional market only as evidence matures; "
         "the CRP determines whether established care and longitudinal outcomes create sufficient "
         "economic value for institutional contracting. Olera's geographic unit of "
         "commercialization is a local market, defined as one U.S. county or county equivalent, "
         "within which family demand, provider supply, workforce capacity, care-establishment "
         "outcomes, acquisition costs, and revenue performance are all measured. With more than "
         "3,100 such geographic units nationally, Olera can expand by replicating a validated "
         "local-market model without requiring dominant national market share.")

R[68] = ("**Protection strategy.** Olera will protect each component of its commercial advantage "
         "with the form of intellectual-property protection best suited to that asset. The "
         "principal proprietary assets generated and extended through the CRP include "
         "CareNavigator's non-public workflow orchestration and execution logic; the structure, "
         "normalization, quality-control methods, and derived variables that organize Olera's "
         "provider and financial-aid data; the longitudinal care-establishment and outcomes "
         "architecture and resulting proprietary datasets; and the methods that connect local "
         "workforce capacity to care execution. Olera will maintain appropriate non-public methods, "
         "configurations, derived data, and operating processes as trade secrets through role-based "
         "technical access, confidentiality obligations, and employee, contractor, and partner "
         "agreements governing confidentiality, intellectual-property ownership, and permitted data "
         "use. Original source code, interfaces, documentation, and content are protected by "
         "copyright, while Olera and product branding will be protected through trademark rights "
         "and registration where commercially appropriate. For CRP-generated inventions with "
         "sufficient novelty and commercial value, Olera will evaluate patent protection with IP "
         "counsel before public disclosure.")

R[71] = ("**Temporal barriers to replication.** Individual interface features can be reproduced; "
         "the integrated commercial asset is substantially harder to recreate. A new entrant would "
         "need to rebuild Olera's family distribution, national provider and benefits "
         "infrastructure, execution workflows, provider and workforce relationships, and the "
         "longitudinal evidence showing where care is established, where it fails, and what "
         "follows. These barriers compound during the CRP: every deployment both advances "
         "commercialization and adds execution history, local-market intelligence, "
         "care-establishment records, and longitudinal outcomes that a new entrant cannot obtain "
         "retrospectively.")

R[74] = ("**Capital required.** Olera is requesting approximately $4 million in CRP funding over "
         "three years to finance the later-stage R&D, real-world validation, and commercialization "
         "work required to cross the Valley of Death described in Section 1. The award is designed "
         "to move Olera from pre-scale commercialization to an investable commercial inflection "
         "point, not to assume that revenue from the limited CRP markets immediately replaces the "
         "full federal operating budget.")

R[75] = ("**From CRP capital to commercial sustainability.** Olera's financing strategy combines "
         "capital sources that enter at different stages. During the CRP, federal capital finances "
         "the R&D and evidence generation that private investors are not yet positioned to "
         "underwrite. Caregiver Staffing is validated free in Year 2 and begins paid testing in "
         "Year 3, producing approximately $120,000 in recognized revenue and a ~$240,000 annualized "
         "exit run rate under the conservative base case (Section 8). This growing revenue base "
         "contributes operating cash but does not eliminate the near-term financing requirement; "
         "independent third-party capital bridges the remaining operating need and finances faster "
         "market and institutional expansion until recurring commercial revenue can assume a "
         "greater share of growth.")

R[82] = ("**Post-CRP financing requirement.** Olera expects independent third-party capital to "
         "finance the transition from CRP validation to commercial scale. The current five-year "
         "model estimates approximately $1.4 million in operating requirements in post-CRP Year 4 "
         "against ~$600,000 in projected commercial revenue, leaving an approximately $800,000 "
         "operating gap; by Year 5, approximately $1.85 million in operating requirements against "
         "~$1.5 million in projected revenue narrows that gap to approximately $350,000. Olera "
         "therefore anticipates a post-CRP financing round of approximately $3–5 million, subject "
         "to refinement as CRP unit economics are measured. Detailed revenue assumptions and "
         "commercial economics are presented in Section 8.")

R[83] = ("**Use of post-CRP capital.** The raise is intentionally larger than the modeled operating "
         "deficit because its purpose is not merely to extend runway. Expanding Caregiver Staffing "
         "into additional county markets generates successful hires, provider revenue, and greater "
         "workforce capacity. Expanding CareNavigator generates more care-establishment episodes "
         "and a larger longitudinal evidence base from which institutional contracts can mature. "
         "Private capital therefore serves as the bridge from a CRP-validated model to "
         "progressively revenue-financed commercial scale (Figure 5).")

R[86] = ("**Production model.** Olera produces and operates its software in-house, but the "
         "commercially meaningful unit of production is a functioning local market: the county in "
         "which families can enter CareNavigator, providers can participate, workers can enter "
         "local provider labor pools through Caregiver Staffing, and completed care pathways can be "
         "measured.")

R[87] = ("**Digital product and AI infrastructure.** CareNavigator and Caregiver Staffing are "
         "developed by Olera's internal engineering team, including the founders and full-time "
         "engineering personnel. Development follows a rapid build-measure-learn cycle: features "
         "are coded and tested in staging, quality-assured, released to production, and "
         "instrumented to measure onboarding, click-through, task completion, and fall-off. Because "
         "the products are software, there is no manufacturing, inventory, or physical-distribution "
         "dependency. **Data and workforce infrastructure.** Olera's provider and benefits "
         "information is indexed, normalized, reviewed, and surfaced geographically so that local "
         "CareNavigator infrastructure can exist before every provider has actively joined the "
         "network. Caregiver Staffing operates through the same platform: providers can seek "
         "workers for staffing needs arising anywhere in their business, while CareNavigator "
         "provides an additional signal when local workforce capacity is preventing a family from "
         "establishing care.")

R[94] = ("**Distribution and route to market.** Olera's distribution advantage is already visible "
         "in organic demand: traffic has grown from approximately 50 visitors per day in 2023 to "
         "more than 500 per day in 2026 without paid acquisition (Figure 5). No manufacturing "
         "partner, distributor, or licensing intermediary is required. Olera also intends to make "
         "CareNavigator's domain data and execution capabilities interoperable with search and "
         "general-purpose AI interfaces, allowing those systems to become additional entry points "
         "rather than requiring Olera to own every point of discovery.")

R[95] = ("**Scaling the production and commercial system.** The operating base already includes "
         "founder-led product and commercial leadership, internal engineering, experienced "
         "part-time marketing support, two full-time call-center personnel, established call and "
         "email queues and scripts, self-service portals, and instrumented product analytics. The "
         "CRP does not fund construction of a commercialization apparatus from scratch; it "
         "measures, systematizes, and makes repeatable operating processes Olera already uses.")

R[97] = ("**Two revenue engines, sequenced by evidence.** CareNavigator remains free to families "
         "and basic family-provider connections remain free to providers. The near-term engine is "
         "Caregiver Staffing: providers pay when Olera helps them successfully hire workers, "
         "whether the staffing need arises from turnover, existing clients, externally generated "
         "referrals, growth, or a capacity constraint identified through CareNavigator. The "
         "emerging engine is institutional CareNavigator contracting.")

R[98] = ("**Caregiver Staffing: revenue follows successful hires.** The Staffing model is "
         "intentionally simple: successful hires, times realized revenue per successful hire, times "
         "active county markets. CRP Year 1 is an engineering year and generates no Staffing "
         "revenue. In Year 2, Olera deploys Staffing free to providers so the project can establish "
         "applicant acquisition, provider hiring, placement, retention, and market-to-market "
         "reproducibility before price is introduced. Paid testing begins in Year 3. The working "
         "base-case price is $250 per successful hire, with $150 and $350 as sensitivity bounds. "
         "This is an Aim 3 pricing hypothesis, not an asserted market price.")

R[104] = ("The five-year model is an early commercialization case, not the scale ceiling. At the "
          "same conservative assumptions, 100 active counties produce approximately 12,000 "
          "successful hires and $3.0 million in annual Staffing revenue; 250 counties, 30,000 hires "
          "and $7.5 million; and 500 counties, 60,000 hires and $15 million. At 500 counties, "
          "60,000 successful provider hires are equivalent in scale to approximately 8% of the "
          "roughly 760,500 annual U.S. home health and personal care aide openings projected by "
          "BLS.5")

R[107] = ("There is already precedent for organizations responsible for health outcomes to pay for "
          "care-management and coordination infrastructure: CMS's GUIDE Model uses "
          "per-patient-per-month dementia care-management payments for coordination and caregiver "
          "support, and in 2026 the Medicare Shared Savings Program includes 511 ACOs serving 12.6 "
          "million Traditional Medicare beneficiaries.9,10 These sources establish the buyer class "
          "and purchasing logic; they do not establish Olera's future price. Accordingly, the "
          "five-year model treats institutional revenue as evidence-gated contracts rather than "
          "multiplying an unvalidated PMPM across a hypothetical health plan. The base case assumes "
          "the first paid relationship in post-CRP Year 4 and approximately three active "
          "relationships in Year 5.")

R[112] = ("**How the projection should be read.** These are bottom-up scenarios derived from the "
          "number of successful caregiver hires Olera can produce in each county and the number of "
          "evidence-gated institutional contracts the company can secure. The principal "
          "assumptions, which are Staffing throughput, price, repeat purchasing, contribution "
          "margin, and institutional contracting value, are therefore the same variables the CRP "
          "and subsequent buyer negotiations are designed to replace with measured commercial "
          "data.")

R[116] = ("**Team and governance.** The PI, TJ Falohun, has led the project as PD/PI since Phase I "
          "and retains final go/no-go authority at major decision points. Co-investigator Logan "
          "DuBose, MD, MBA, the company's Chief Research Officer and a practicing primary-care "
          "clinician, oversees clinical relevance, research operations, commercialization "
          "coordination, and the milestone calendar. Clemson University leads the academic "
          "human-subjects effort with co-investigator Qiping Fan, PhD, supported by biostatistical "
          "expertise for study design and analysis. Independent statistical review and external CPA "
          "validation of the commercial unit-economics model provide additional checks on the "
          "research and commercialization conclusions.")

R[19] = ("**Foundation from prior SBIR R&D.** Olera's NIA Phase I and Phase IIB awards (Impact "
         "Scores 20 and 25) established the foundation for this commercialization effort: a "
         "nationally deployed first-generation CareNavigator; an expert-curated database containing "
         "more than 72,000 eldercare provider and aid-program records; peer-reviewed evidence of "
         "usability and technology acceptance; and extensive customer discovery defining the needs "
         "of families and providers. In an early staffing pilot, Olera received approximately 900 "
         "student applications, accepted 100 candidates, and placed 25 with local providers, with "
         "participating students and providers returning in a subsequent semester. These results "
         "support the CRP's next step: integrate, execute, measure, and commercialize the complete "
         "pathway.")

R[50] = ("**Market segments and potential customers.** Olera commercializes through two buyer "
         "classes created by the same care-establishment pathway. The near-term beachhead is "
         "care-delivery providers that lose revenue when caregiver vacancies prevent them from "
         "accepting or staffing new cases. The emerging institutional market is healthcare "
         "organizations that bear financial risk when unmet needs contribute to avoidable "
         "utilization, failed care transitions, or earlier institutional care.")

R[52] = ("**The institutional market is larger but evidence-gated.** Prospective customers include "
         "Medicare Advantage plans, accountable care organizations (ACOs), health systems, Medicaid "
         "managed-care and managed long-term-services-and-supports organizations, and other "
         "entities exposed to the downstream cost of unmet need. In 2026, 35.2 million people are "
         "enrolled in Medicare Advantage and 14.3 million Medicare beneficiaries receive care "
         "coordinated through accountable-care arrangements.8,9 CMS's active GUIDE Model further "
         "validates the purchasing logic: Medicare is already testing and paying for dementia care "
         "navigation, community-resource connection, and caregiver support, with the explicit aim of "
         "delaying nursing-home placement.10")

R[60] = ("**Current and emerging competition.** For Caregiver Staffing, Olera competes across "
         "categories rather than against a single end-to-end incumbent. Provider staffing "
         "alternatives include large job boards like Indeed, staffing agencies, caregiver-specific "
         "recruiting platforms, and emerging student-caregiver models such as CareYaya. For "
         "CareNavigator, alternatives include government and nonprofit resource directories, "
         "patient navigators, social workers and care managers, eldercare referral platforms like A "
         "Place for Mom or Caring.com, and increasingly general-purpose AI and search where "
         "families ask eldercare-related questions. Olera's response is to compete where "
         "domain-specific infrastructure matters most: verified local provider and benefits data, "
         "execution of real administrative workflows, workforce-capacity creation, confirmation of "
         "care establishment, and longitudinal outcome records.")

R[64] = ("**Strategic alliances, partnerships, and route to market.** Olera enters the CRP with "
         "relationships on both sides of its beachhead: university relationships that support "
         "workforce recruitment and working relationships with local and franchise-affiliated "
         "eldercare providers that can serve as early customers and implementation sites. No FDA "
         "approval is required for the products proposed here, and Olera does not depend on a "
         "licensing agreement to commercialize them.")

R[78] = ("**Fundraising Plan.** Olera will begin financing its next stage before CRP funding ends. "
         "The aims are deliberately sequenced so that sufficient technical, real-world, and early "
         "commercial evidence should be available by approximately the end of Year 2 to begin "
         "structured investor cultivation, while Year 3 strengthens the financing case and supports "
         "a formal raise. The objective is to enter post-CRP commercialization with financing "
         "secured or actively closing rather than encounter a new funding gap.")

R[88] = ("**Market selection and activation.** Olera will not enter counties indiscriminately. CRP "
         "markets are selected to support both rigorous testing and practical commercialization, "
         "using signals such as existing family demand, provider density and workforce need, "
         "recruitable workforce supply and nearby university or community-college infrastructure, "
         "existing local relationships, and the feasibility of concentrating enough participation "
         "to measure care-establishment and commercial outcomes. The CRP applies this process "
         "across approximately eight markets and measures the operating requirements and cost of "
         "activation so that subsequent expansion can use evidence rather than intuition.")

R[92] = ("**Sales and contracting.** Olera uses two distinct commercial motions. Provider sales are "
         "near-term and can become increasingly self-service: free listing and network "
         "participation lead to demonstrated staffing value, a subscription or other CRP-tested "
         "offer, online acceptance of terms, and electronic invoicing and billing.")

R[93] = ("**Institutional development is evidence-gated rather than transactional.** Olera will "
         "identify Medicare Advantage plans, Medicaid managed-care and managed-LTSS organizations, "
         "ACOs, health systems, and other prospective buyers with meaningful member concentration "
         "in markets where CRP data can demonstrate care-establishment and economic value.")

R[101] = ("For the financial projection, Olera holds every paid market at only 10 successful hires "
          "per month. At $250 per hire, that equals $30,000 annualized Staffing revenue per county. "
          "Olera expects mature markets may support approximately 10 to 30 successful hires per "
          "month, but the model does not require that maturation. Across eight CRP markets, the "
          "conservative case produces a $240,000 annualized Staffing run rate; the same markets "
          "would produce $480,000 at 20 hires per month and $720,000 at 30.")

R[117] = ("**How research and commercialization stay synchronized.** Day-to-day execution is "
          "managed through named workstream owners, maintained task boards, regular operating "
          "meetings, and milestone dashboards tied to the Research Strategy and Commercialization "
          "Plan. A milestone that misses its predefined threshold triggers the corresponding "
          "alternative strategy rather than automatic continuation.")

R[118] = ("**Commercialization timeline and gates.** The detailed experimental timeline and "
          "thresholds are provided in the Research Strategy; the management timeline below shows "
          "how those activities produce successive commercialization decisions.")

R[11] = ("**Why government funding is the right instrument at this stage.** Crossing this gap "
         "requires later-stage R&D and evidence generation before CareNavigator's largest "
         "commercial pathway can be demonstrated. Private investors must underwrite the risk of "
         "completing and deploying the system before its institutional value has been established, "
         "while institutional buyers need real-world evidence before they can confidently value and "
         "purchase the product. Non-dilutive CRP funding can break this cycle by financing the work "
         "needed to retire these risks.")

R[12] = ("The alternative is not simply to raise prices or sell the same product differently. "
         "Charging families would create the greatest barrier for households already struggling to "
         "afford eldercare. Charging providers for referrals would introduce steering incentives "
         "and limit participation by some federally reimbursed providers. Caregiver Staffing can "
         "generate nearer-term provider revenue without those tradeoffs, but staffing alone "
         "addresses only the workforce barrier; it does not help families navigate, fund, and "
         "execute the rest of the care-establishment pathway.")

R[25] = ("**Expected outcomes.** Successful completion of the CRP will leave Olera with: (1) a "
         "verified CareNavigator capable of executing and tracking the pathway from care plan to "
         "established care; (2) real-world evidence on care establishment, failure points, "
         "operating cost, and longitudinal outcomes; (3) a repeatable Caregiver Staffing model that "
         "can both generate provider revenue and relieve workforce constraints to enable care "
         "establishment; and (4) an institutional-buyer evidence package and operating model "
         "positioned for subsequent contracting and private investment.")

R[107] = ("There is already precedent for organizations responsible for health outcomes to pay for "
          "care-management and coordination infrastructure: CMS's GUIDE Model uses "
          "per-patient-per-month dementia care-management payments for coordination and caregiver "
          "support, and in 2026 the Medicare Shared Savings Program includes 511 ACOs serving 12.6 "
          "million Traditional Medicare beneficiaries.9,10 These sources establish the buyer class "
          "and purchasing logic; they do not establish Olera's future price. Accordingly, the "
          "five-year model treats institutional revenue as evidence-gated contracts rather than "
          "multiplying an unvalidated PMPM across a hypothetical health plan.")

R[58] = ("**Caregiver Staffing's initial workforce wedge is deliberately narrow.** Olera initially "
         "targets health-profession applicants and students for whom paid caregiving can also "
         "provide meaningful patient-care experience. The opportunity is nationally distributed and "
         "continuously replenished: in the most recent cycles, U.S. MD programs reported 54,699 "
         "applicants and NursingCAS reported 75,078 applicants across 282 participating nursing "
         "schools.11,12 These two pipelines are not the full addressable workforce.")

R[87] = ("**Digital product and AI infrastructure.** CareNavigator and Caregiver Staffing are "
         "developed by Olera's internal engineering team, including the founders and full-time "
         "engineering personnel. Because the products are software, there is no manufacturing, "
         "inventory, or physical-distribution dependency. **Data and workforce infrastructure.** "
         "Olera's provider and benefits information is indexed, normalized, reviewed, and surfaced "
         "geographically so that local CareNavigator infrastructure can exist before every provider "
         "has actively joined the network. Caregiver Staffing operates through the same platform: "
         "providers can seek workers for staffing needs arising anywhere in their business, while "
         "CareNavigator provides an additional signal when local workforce capacity is preventing a "
         "family from establishing care.")

R[95] = ("**Scaling the production and commercial system.** The CRP does not fund construction of a "
         "commercialization apparatus from scratch; it measures, systematizes, and makes repeatable "
         "operating processes Olera already uses.")

R[114] = ("**Staffing and capital as revenue grows.** During the CRP, engineering, research, and "
          "market-validation personnel remain central. As paid Staffing expands, Olera adds "
          "centralized market operations, worker acquisition, provider success, and sales capacity "
          "rather than recreating a full team in every county. Engineering grows more slowly "
          "because the platform, portals, and workflows are designed for self-service and "
          "automation.")

R[24] = ("At scale, this longitudinal record could become a distinctive commercial and scientific "
         "asset: a county-level empirical map of where eldercare pathways succeed, where they fail, "
         "and what resolves those failures. The CRP tests and builds the infrastructure required to "
         "create this asset; it does not assume its value in advance (Figure 4, lower register).")

R[26] = ("**Commercial and non-commercial impact.** Olera's commercial and public-health objectives "
         "reinforce one another: growth means more families can receive support before unmet needs "
         "progress to higher-cost crises.")

R[45] = ("As CRP milestones demonstrate repeatable provider sales, operating demand, and "
         "institutional engagement, Olera will internalize dedicated commercial, customer-success, "
         "operations, data/compliance, and finance capabilities when their workload and strategic "
         "importance justify full-time leadership.")

R[101] = ("For the financial projection, Olera holds every paid market at only 10 successful hires "
          "per month. At $250 per hire, that equals $30,000 annualized Staffing revenue per county. "
          "Olera expects mature markets may support approximately 10 to 30 successful hires per "
          "month, but the model does not require that maturation. Across eight CRP markets, the "
          "conservative case produces a $240,000 annualized Staffing run rate.")

R[14] = ("**How CRP funding advances Olera to full commercialization.** Three sequential aims "
         "remove these remaining barriers. Aim 1 develops and independently verifies the execution "
         "and outcomes technology required to carry families from a care and funding plan through "
         "to established care. Aim 2 validates the complete system in a smaller real-world "
         "deployment, measuring whether families identify, fund, and establish appropriate care; "
         "where cases fail; and whether Caregiver Staffing can relieve workforce constraints when "
         "they prevent care establishment. Aim 3 scales deployment and builds the "
         "institutional-buyer evidence case. Caregiver Staffing is evaluated in parallel as a "
         "repeatable provider-revenue pathway.")

R[98] = ("**Caregiver Staffing: revenue follows successful hires.** The Staffing model is "
         "intentionally simple: successful hires, times realized revenue per successful hire, times "
         "active county markets. CRP Year 1 is an engineering year and generates no Staffing "
         "revenue. In Year 2, Olera deploys Staffing free to providers so the project can establish "
         "applicant acquisition, provider hiring, placement, retention, and market-to-market "
         "reproducibility before price is introduced. Paid testing begins in Year 3. The working "
         "base-case price is $250 per successful hire, with $150 and $350 as sensitivity bounds. "
         "This is an Aim 3 pricing hypothesis, not an asserted market price. It is economically "
         "plausible relative to the burden providers already bear (Table 7).")

R[116] = ("**Team and governance.** The PI, TJ Falohun, has led the project as PD/PI since Phase I "
          "and retains final go/no-go authority at major decision points. Co-investigator Logan "
          "DuBose, MD, MBA, the company's Chief Research Officer and a practicing primary-care "
          "clinician, oversees clinical relevance, research operations, commercialization "
          "coordination, and the milestone calendar. Clemson University leads the academic "
          "human-subjects effort with co-investigator Qiping Fan, PhD, supported by biostatistical "
          "expertise for study design and analysis. Independent statistical review and external CPA "
          "validation of the commercial unit-economics model provide additional checks.")

R[109] = ("Table 8. Illustrative base case through post-CRP Year 4, with the final column widening "
          "Year 5 into a Year 5 to Year 10 replication range. *Year 3 assumes approximately six "
          "paid-month equivalents across the eight CRP markets.")
R[122] = ("Table 9. Five-year commercialization management timeline. Revenue values are planning "
          "projections rather than CRP success criteria.")
R[112] = ("**How the projection should be read.** These are bottom-up scenarios derived from the "
          "number of successful caregiver hires Olera can produce in each county and the number of "
          "evidence-gated institutional contracts the company can secure. The principal "
          "assumptions, Staffing throughput, price, repeat purchasing, contribution margin, and "
          "institutional contracting value, are the same variables the CRP and subsequent buyer "
          "negotiations are designed to replace with measured commercial data.")

R[105] = ("**Institutional CareNavigator: contracts follow outcomes evidence.** The institutional "
          "engine is modeled separately and more conservatively. Olera assumes no institutional "
          "revenue during the CRP. Years 1 to 3 instead test the intermediate outcome on which the "
          "institutional value proposition depends: whether recognized needs reach established "
          "care, why pathways fail when they do not, and what happens longitudinally afterward. "
          "This matters economically because unmet home- and community-based service needs have "
          "been associated with substantially greater acute-care utilization (Section 1).8 The CRP "
          "does not assume that CareNavigator prevents these downstream events; it generates the "
          "evidence needed to determine whether that value proposition is real.")

R[94] = ("**Distribution and route to market.** Olera's distribution advantage is already visible "
         "in organic demand: traffic has grown from approximately 50 visitors per day in 2023 to "
         "more than 500 per day in 2026 without paid acquisition (Figure 6). Olera also intends to "
         "make CareNavigator's domain data and execution capabilities interoperable with search and "
         "general-purpose AI interfaces, allowing those systems to become additional entry points "
         "rather than requiring Olera to own every point of discovery.")

R[23] = ("**Commercial applications and innovation.** The commercial opportunity is not another "
         "directory, referral marketplace, or staffing channel in isolation. It is an integrated "
         "infrastructure that carries a family across the care-establishment pathway and creates "
         "evidence about what happened at every step. AI-supported execution moves the product from "
         "recommending what a family should do toward completing and tracking the work required to "
         "establish care, and every executed case produces a structured longitudinal record of the "
         "family's needs, resources pursued, administrative barriers, local capacity, care "
         "establishment, and subsequent outcomes.")

R[104] = ("The five-year model is an early commercialization case, not the scale ceiling. At the "
          "same conservative assumptions, 100 active counties produce approximately 12,000 "
          "successful hires and $3.0 million in annual Staffing revenue; 250 counties, 30,000 hires "
          "and $7.5 million; and 500 counties, 60,000 hires and $15 million. At 500 counties, "
          "60,000 successful provider hires are equivalent in scale to approximately 8% of the "
          "roughly 760,500 annual U.S. home health and personal care aide openings projected by "
          "BLS.5")

R[23] = ("**Commercial applications and innovation.** The commercial opportunity is not another "
         "directory, referral marketplace, or staffing channel in isolation. It is an integrated "
         "infrastructure that carries a family across the care-establishment pathway and creates "
         "evidence about what happened at every step. AI-supported execution moves the product from "
         "recommending what a family should do toward completing and tracking the work required to "
         "establish care, and every executed case produces a structured longitudinal record of the "
         "pathway.")

R[68] = ("**Protection strategy.** Olera will protect each component of its commercial advantage "
         "with the form of intellectual-property protection best suited to that asset. The "
         "principal proprietary assets generated and extended through the CRP include "
         "CareNavigator's non-public workflow orchestration and execution logic; the structure, "
         "normalization, quality-control methods, and derived variables that organize Olera's "
         "provider and financial-aid data; the longitudinal care-establishment and outcomes "
         "architecture and resulting proprietary datasets; and the methods that connect local "
         "workforce capacity to care execution. Olera will maintain these as trade secrets through "
         "role-based technical access, confidentiality obligations, and employee, contractor, and "
         "partner agreements governing intellectual-property ownership and permitted data use. "
         "Original source code, interfaces, documentation, and content are protected by copyright, "
         "while Olera and product branding will be protected through trademark rights and "
         "registration where commercially appropriate. For CRP-generated inventions with sufficient "
         "novelty and commercial value, Olera will evaluate patent protection with IP counsel "
         "before public disclosure.")

R[22] = ("Table 1. Current approaches address portions of the pathway; the CRP integrates them into "
         "a closed-loop system oriented to confirmed care.")
R[91] = ("Table 6. Distinct but coordinated acquisition channels concentrate the participants and "
         "customers each local market requires.")
R[109] = ("Table 8. Illustrative base case through post-CRP Year 4, with the final column widening "
          "Year 5 into a Year 5 to Year 10 range. *Six paid-month equivalents in Year 3.")

REPLACE = R

# text-box captions attached to figures, keyed by the item that anchors them
# the caption travels with the re-anchored figure
# Item 3 carries the pathway caption inline as well as in a text box. The inline copy
# still has to be stripped, so the text box is kept for the de-duplication match and
# then suppressed: the caption itself travels to item 2 with the figure.
TB_SUPPRESS = {3}

TB_REANCHOR_CAPTION = {
    'image20.png': ["Figure 2. Care establishment requires a coordinated pathway from assessing "
                    "need through confirming care."],
}

TB_REPLACE = {
    87: [],   # market-process caption, cut with its figure
    1:  ["Figure 1. The vicious cycle of unmet need."],
    10: ["Figure 3. CRP bridges the five remaining risks between demonstrated demand and "
         "commercial sustainability."],
    18: ["Figure 4. What a family sees, what the system does, and what accumulates across a "
         "county. Shaded elements exist today."],
    83: ["Figure 5. Post-CRP growth flywheel."],
    91: ["Figure 6. Organic traffic growth, 2023–2026."],
}

# ---------------------------------------------------------------- bibliography
# One sequence, numbered by first appearance, merging the two schemes the live
# document carried (Section 4's 26 to 34 and the Revenue Stream's 1 to 8) and
# de-duplicating the four sources both cited. `verified` is the date the source
# was checked against the specific claim it is attached to, not the date it was
# supplied.
REFERENCES = [
 ("Agency for Healthcare Research and Quality. Evidence Map on Home- and Community-Based "
  "Services and Person-Centered Care for Older Adults. Technical Brief No. 49; 2024."),
 ("Fan Q, Hoang MN, DuBose L, et al. The Olera.care Digital Caregiving Assistance Platform for "
  "Dementia Caregivers: Preliminary Evaluation Study. JMIR Aging. 2024;7:e55132."),
 ("Hoang MN, Kim L, Fisher L, et al. Exploring Informal Caregivers' Perception of the Olera "
  "Digital Caregiving Assistance Platform for Dementia Care. JMIR Form Res. 2026;10:e92967."),
 "Olera, Inc. Caregiver Staffing pilot placements and provider fees, 2024 to 2025. Data on file.",
 ("U.S. Bureau of Labor Statistics. Home Health and Personal Care Aides. Occupational Outlook "
  "Handbook; 2025 to 2035 projections."),
 ("Activated Insights. 2025 Benchmarking Report for Home-Based Care; 2025. Median caregiver "
  "turnover 75.0% in 2024."),
 ("Activated Insights. 2024 Benchmarking Report for Home-Based Care; 2024. 63.3% of providers "
  "turned down cases in 2023."),
 "KFF. Medicare Advantage in 2026: Enrollment Update and Key Trends; 2026.",
 ("Centers for Medicare and Medicaid Services. 2026 Medicare ACO Initiatives Participation "
  "Highlights; 2026."),
 ("Centers for Medicare and Medicaid Services. Guiding an Improved Dementia Experience (GUIDE) "
  "Model; 2024."),
 ("Association of American Medical Colleges. U.S. Medical Schools Enroll Record Number of "
  "Students in 2025; 2025."),
 ("American Association of Colleges of Nursing. NursingCAS Application Cycle Closes with Most "
  "Applicants to Date; 2026."),
 ("Augusta and Home Care Association of America. National Caregiver Recruitment Benchmark "
  "Report, Q1 2026; 2026."),
 ("Activated Insights. Caregiver Retention for Home-Based Care; recruiting and training cost up "
  "to approximately $2,700 per replacement."),
]
