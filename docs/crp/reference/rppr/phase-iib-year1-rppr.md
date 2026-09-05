<!-- Phase IIB Year 1 RPPR (5R44AG074116-05), reporting 08/01/2024 - 05/31/2025. Extracted from Google Drive 2026-08-19. Historical record, not current truth. -->

RPPR FINAL

A. COVER PAGE

Project Title: Olera CareNavigator - Increasing Affordability and Accessibility of Senior Care For Dementia Family Caregivers

Grant Number: 5R44AG074116-05 Project/Grant Period: 09/05/2021 - 05/31/2027

Reporting Period: 08/01/2024 - 05/31/2025 Requested Budget Period: 06/01/2025 - 05/31/2026

Report Term Frequency: Annual Date Submitted: 04/14/2025

Program Director/Principal Investigator Information: TOKUNBO FALOHUN , BS MS

Phone Number: 9706391173 Email: tfalohun@tamu.edu

RPPR Page 1

Recipient Organization: OLERA INC. 3801 CAVITT AVE BRYAN, TX 778014412

UEI: LY3HSJ7CCN87 EIN: 1853503617A1

RECIPIENT ID:

Change of Contact PD/PI: NA

Administrative Official: LOGAN LEE DUBOSE 3801 Cavitt Ave Bryan, TX 77801

Phone number: 9794819110 Email: logandubose960@tamu.edu

Signing Official: LOGAN LEE DUBOSE 3801 Cavitt Ave Bryan, TX 77801

Phone number: 9794819110 Email: logandubose960@tamu.edu

Human Subjects: Yes HS Exempt: NA Exemption Number: Phase III Clinical Trial: NA

Vertebrate Animals: No

hESC: No Inventions/Patents: No

RPPR FINAL

B. ACCOMPLISHMENTS

B.1 WHAT ARE THE MAJOR GOALS OF THE PROJECT?

The US aging care system is fragmented, expensive, and difficult to navigate for families with an elder loved one in need of care support. This project aims to address the high costs and accessibility barriers in U.S. senior care by developing and evaluating an AI system and experience for older adults and family caregivers, particularly those with dementia, that will match individuals with eligible financial aid programs to pay for basic needs (health care, food, rent, etc.) and support systems for home or facility-based services. It builds upon our previous Fast-Track SBIR project by leveraging Large Language Models (LLMs) and generative AI to enhance senior care planning and care coordination, ultimately aimed at improving the quality of life of aging Americans, and avoiding costly emergencies for families and Medicare from elder neglect in under-resourced situations.

B.1.a Have the major goals changed since the initial competing award or previous report?

No B.2 WHAT WAS ACCOMPLISHED UNDER THESE GOALS?

File Uploaded : Accomplishments.pdf

B.3 COMPETITIVE REVISIONS/ADMINISTRATIVE SUPPLEMENTS

For this reporting period, is there one or more Revision/Supplement associated with this award for which reporting is required?

No B.4 WHAT OPPORTUNITIES FOR TRAINING AND PROFESSIONAL DEVELOPMENT HAS THE PROJECT PROVIDED?

File Uploaded : Professional Development.pdf

B.5 HOW HAVE THE RESULTS BEEN DISSEMINATED TO COMMUNITIES OF INTEREST?

\- Accepted to 16th International Conference on Applied Human Factors and Ergonomics (AHFE 2025) for related paper “Understanding Older Adults’ Perceptions of AI Use in Financial Decisions” - Submitted paper to Applied Human Factors and Ergonomics International journal titled “Understanding Older Adults’ Perceptions of AI Use in Financial Decisions” - Completed data collection for Phase II study related to usability and acceptability of our care resource directory front-end UI/UX, to be analyzed, and ultimately reported to Journal of Internet Medical Research (JIMR) in Q2 2025 - Technical report (in progress) on reinforcement learning (RL) with agent system in Q2 2025 with LCSW rating care coordination output and reporting on effectiveness of AI use in senior benefits navigation.

B.6 WHAT DO YOU PLAN TO DO DURING THE NEXT REPORTING PERIOD TO ACCOMPLISH THE GOALS?

\- Specific Aim 2: Integration of a Multi-Agent Network and development of an intelligent user interface (UI) capable of dynamic, human-like interactions using generative AI (i.e., AI Avatar and conversational AI experience). This UI/UX work will be critical in making the elder care planning agent system usable by older adults and their family caregivers and will ultimately derisk end- product launch, usefulness, effectiveness and scalability.

RPPR Page 2

RPPR FINAL

\- Conduct preliminary usability testing with 25 AD/ADRD caregivers using the User Experience in Intelligent Environments (UXIE) framework to complete a Build-Measure-Learn cycle with the combined multi-agent system and UI/UX developed.

\- Refine agent prompts and conversation flows based on usability testing feedback and expert evaluations.

\- Iterate UI design based on survey data, platform analytics, and caregiver feedback from usability studies.

\- Complete the integration of the Multi-Agent Network with the user interface (UI), creating a cohesive experience that masks the complexity of the underlying architecture.

\- Enhance the Autogen-based agent communication system to support more complex multi-turn workflows that better address caregiver edge cases.

\- Optimize the vector database implementation to improve query performance and resource matching accuracy across our expanding EMCR database of resources and supports.

\- Expand the capabilities of the flexible model backend system to incorporate emerging open-source models that may offer better performance or capabilities

\- Develop a comprehensive test suite to evaluate each agent's performance across diverse caregiver scenarios

RPPR Page 3

B.2 (Accomplishments.pdf)

Progress Toward Goals

Milestones Achieved for Specific Aim 1

Development of Specialized AI Agents for Elder Care Planning

Engineered three categories of AI agents:

1\. Needs Assessment Agents – Initial Prototype: We developed a custom Needs Assessment Agent capable of understanding the needs of a caregiver or individual needing care. This AI agent leverages GPT-4o-mini, with the possibility of modifying the underlying model, which is critical in the rapidly evolving field of AI research. In its current form, the Needs Assessment Agent is a fine-tuned AI chatbot system that evaluates the needs of the care seeker by prompting users through a series of personalized questions focused on the Activities of Daily Living (ADLs) and Instrumental Activities of Daily Living (IADLs) and assessing the match for federal, state, and local financial aid programs and support systems that can assist with tasks like bathing, grooming, toileting, financial management, meal prep, medication management, and more (ADL/IADLs). The agent was trained on a growing repository of curated information on elder care benefits and support services developed in past SBIR work and is undergoing internal testing and integration before real-world usage.

Next-Phase Development: Our next phase includes developing a modular Needs Assessment Agent with flexible model architecture, allowing seamless switching between different AI models as the models evolve. This enhanced system will support using local models via Ollama (e.g., Llama-2, Mistral) for core processing with optional formatting by commercial APIs like Claude. This hybrid approach will significantly reduce costs while maintaining high-quality outputs, especially as we add more information on benefits, programs, and support services to our data repository for the agent to match with users. It will also allow our end-product to improve as the field of AI develops more robust LLM models. The agent will continually improve in its ability to analyze caregiver descriptions (i.e., case scenarios) to identify the care recipients’ functional needs, financial needs, and care level requirements, and family caregiver support opportunities, then structure this information for downstream processing and matching with appropriate supports with robust fallback mechanisms to ensure reliability even if primary models fail.

2\. Aid Matching Agent & Care Planning Agent – Initial Prototype:

Our team developed an Aid Matching & Care Planning Agent through a systematic approach. We began by researching the full landscape of senior care benefits and support resources, making sure our information was both accurate and up-to-date and structured in a way that can build upon our previous resource repository for eldercare services developed in Phase I and Phase II. This foundation was critical for what came next.

With this knowledge base established and data structure integrated such that it can be continuously build upon, we built a specialized matching agent designed to connect care seekers using our previous agent with appropriate benefits and supports for their unique situation. The system analyzes needs identified during assessment and pairs them with appropriate entries in our data repository. What surprised us was how quickly large language model capabilities have advanced. These systems now demonstrate reasoning abilities that make them ideal for matching care seekers with appropriate programs and services based on ADL/IADL needs and creating structured, personalized care supports recommendations that are well-reasoned and easy to act upon in plain language (and “step-by-step” formatting). This insight led us to combine resource matching and care plan development into one unified agent—a decision that proved quite effective.

The Aid Matching & Care Planning Agent runs on GPT-4.5, which Hugging Face evaluations rate among the most sophisticated models available. We enhanced its performance through Parameter-Efficient Fine-Tuning (PEFT) using specialized data curated for senior care benefits and care planning scenarios, and structured the system architecture to allow for continued performance enhancement as additional data is added to our resource and supports repository for the agent to pull from.

Next-Phase Development: We're enhancing our approach by implementing a vector database for

RPPR Page 4

B.2 (Accomplishments.pdf)

efficient resource matching using semantic search capabilities. This will allow the system to match caregiver needs with appropriate resources based on contextual understanding rather than just keyword matching. The architecture will feature a microservices approach where independent, modular services communicate via RESTful APIs, enabling separate deployment, scaling, and optimization of each component. For the next iteration of this agent, we're implementing this system to enhances the agents ability to prioritize action steps, specific guidance on resource access and aid program initiation, and next steps for more longitudinal or ongoing care coordination. Eventually, we aim to include updated contact information to key personnel associated with a given resource and imitating phone, email, and text- based communications to further facilitate care coordination with the appropriate personnel. To maximize flexibility while minimizing costs, we're developing a novel hybrid approach that uses local open-source models through Ollama for primary processing, with optional formatting by commercial APIs like Claude, OpenAI, or Gemini.

3\. Advanced Multi-Agent Architecture Development: Building on our successful initial prototype using GPT-4o-mini and GPT-4.5 models, we have significantly advanced our approach by developing a sophisticated multi-agent architecture using the widely accepted Autogen Agent framework. This evolutionary step transforms our promising single-agent system into a collaborative network of specialized AI assistants that more effectively addresses the fragmented, expensive, and complex nature of the U.S. aging care system.

Our initial prototype single-agents demonstrated the viability of AI-assisted care matching components, but through user testing and expert feedback, we identified opportunities to create a more robust, usable, and scalable solution. The resulting multi-agent architecture represents a natural progression of our work, strategically designed to overcome the limitations of our first-generation system:

1\. Multi-Agent Architecture - We have developed a novel multi-agent architecture for the Olera CareNavigator using the Autogen framework that fundamentally reimagines how AI can assist families in navigating elder care. This innovation addresses the fragmented, expensive, and complex nature of the U.S. aging care system by allowing our specialized needs assessment, aid matching, and care planning AI agents to work collaboratively—much like a team of human experts—to deliver personalized, comprehensive program or service matching and care coordination guidance.

2\. Agent Orchestration: We developed a comprehensive agent orchestration system where each agent performs specialized elder care planning functions while collaborating through a centralized messaging system, ensuring more holistic care outputs and recommendations than single-agent approaches.

3\. We implemented a flexible model backend system that allows each agent to utilize different LLMs (Ollama's local models or commercial APIs) based on task requirements, optimizing for both performance and cost-efficiency to ensure sustainable scaling, especially as newer LLM models evolve and improve.

4\. We developed an agent conversation manager that coordinates complex workflows between agents, maintains a conversation state, and ensures coherent end-user interactions, creating a more natural user experience for non-technical caregivers.

Next Steps: Integrated Reinforcement Learning with Human Feedback (RLHF), with guidance from licensed clinical social workers (LCSWs), to refine AI-generated responses. We will be working with LCSW – professionals trained in care needs assessments, financial and aid program matching, and care coordination -- to perform testing focused on improving the final outputs of the multi-agent architecture using common ADL/IADL care profiles in example care seeker dilemmas. For example, we will test the output recommendations of our system when presented with the case of a care seeker being discharged from the hospital after a recent fall event at home. LCSW will provide expertise and help rate the quality of the multi-agent system output in methodical RLHF sessions. The output will be rated and then the multi-agent system will be further refined using PEFT and RAG to optimize output to satisfactory levels using the Build-Measure-Learn framework to improve the acceptability of the end-product prior to human

RPPR Page 5

B.2 (Accomplishments.pdf)

subjects research in Aim 2. We expect to complete a round of RLHF sessions with LCSW in Q2 2025 and refine our multi-agent system in parallel with the sessions to prepare it for UI/UX front-end development and user testing in Aim 2.

Other Key Accomplishments for Year 1 Aim 1 (ongoing through Q2 2025)

● Developed and deployed a sophisticated AI-powered conversational system using GPT-4o-mini with advanced prompting strategies to provide personalized senior care benefit navigation, significantly streamlining the information discovery process.

● Launched a functional landing page to gather user information on demand for care planning Ai technology, collect initial feedback on care needs, and build a community of interested caregivers for future testing and engagement.

● Successfully registered roughly 320 qualified elder care stakeholders through targeted outreach campaigns, establishing a diverse beta-testing cohort representing various socioeconomic backgrounds, care needs, and technical proficiency levels

● Conducted extensive market research and evidence-based analysis of national and state-level senior benefits programs, resulting in a comprehensive, structured database of over 45,000 high-impact resources (elder-relevant aid programs, home or facility-based service providers, elder care financial or legal consultants) with detailed eligibility criteria and application procedures

● Expanded our resource and service support data repository and increased organic users per day to our associated care directory front end site developed in Phase I and II, and will eventually host the AI agent UI/UX system

● Obtained IRB approval from Clemson IRB in preparation for the next phase of development with Aim 2 usability studies

RPPR Page 6

B.4 (Professional Development.pdf)

Training and Professional Development

Project contributors have developed expertise in:

● Tokunbo Falohun, Logan DuBose: LLM development, AI agent creation, RL for AI agents, UI/UX platform development, online distribution.

● Qiping Fan: Study design, IRB.

● Diana, Minh-Nguyet (Research Assistants): Research study design, LLM reinforcement learning, UI/UX software development.

● Jim Nolan, Marcia Ory: LLM training, Autogen multi-agent architecture, AI agent orchestration, vector databases, RAG implementation,model backend flexibility, conversation management, error handling, and software development, research study design.

RPPR Page 7

RPPR FINAL

C. PRODUCTS

C.1 PUBLICATIONS

Are there publications or manuscripts accepted for publication in a journal or other publication (e.g., book, one-time publication, monograph) during the reporting period resulting directly from this award?

No C.2 WEBSITE(S) OR OTHER INTERNET SITE(S)

Category Explanation

Educational aids or curricula https://olera.care/caregiver-support

Data or Databases https://olera.care/

Data or Databases , Educational aids or curricula https://www.seniorbenefits.ai/

C.3 TECHNOLOGIES OR TECHNIQUES

Category Explanation

Software Reinforcement learning with expert feedback to refine LLM responses

C.4 INVENTIONS, PATENT APPLICATIONS, AND/OR LICENSES

Have inventions, patent applications and/or licenses resulted from the award during the reporting period? No

If yes, has this information been previously provided to the PHS or to the official responsible for patent matters at the grantee organization? No

C.5 OTHER PRODUCTS AND RESOURCE SHARING

C.5.a Other Products

NOTHING TO REPORT

C.5.b Resource Sharing

Progress implementing the resource sharing plan:

We are currently in the early stages of our NIH Phase 2B project. At this time, we have not yet begun working with human subjects or collecting related data. Our primary efforts thus far have focused on the development of our intelligent agents and supporting infrastructure in preparation for future testing and validation.

As outlined in our original Resource Sharing Plan, we remain committed to disseminating research results through peer-reviewed publications, conference presentations, and research seminars.

RPPR Page 8

RPPR FINAL

C.5.c Data Management and Sharing

Has data

Has the

Data Type

been

data generated

been to date?

shared?

RPPR Page 9

Unique Identifiers/Digital Object Identifiers

Technology engagement metrics (e.g., AI interaction data, usage statistics, resource matching performance)

Status of Data Sharing Repository

N N Not yet expected to be shared Not

Applicable Not Applicable

Participant feedback and qualitative insights from caregiver interviews and surveys

N N Not yet expected to be shared Not

Applicable Not Applicable

User assessment summaries (e.g., Technology Assessment Survey, Caregiver Self-Efficacy Scale, PANAC)

N N Not yet expected to be shared Not

Applicable Not Applicable

Structured data on publicly available senior care benefits, including eligibility requirements, application steps, and coverage details at the federal and state level

The data is currently being structured and refined for internal use and integration with our system. It has not yet been shared externally but is being prepared for future public availability in accordance with our approved Data Management and Sharing Plan.

Not Applicable Not Applicable

Participant demographics and caregiver resource needs data.

Y N

N N Not yet expected to be shared Not

Applicable Not Applicable

Description: Since we are currently in the first phase of a three-year project. We have not yet begun working with human subjects or collecting associated data. As a result, the data management and sharing plan is still in early development and has not been fully implemented at this stage.

To date, our work has focused on developing our intelligent agents and backend systems. As part of this, we have begun curating and structuring data from publicly available sources related to senior care benefits. These structured datasets will support both the functionality of our system and eventual public sharing, consistent with our plan. As we progress toward phases of the project that involve human subjects research and the generation of unique datasets, we will follow through on our plan to de-identify, store, and share these data in accordance with NIH’s policies and our approved Data Management and Sharing Plan.

Are significant prospective changes to the Data Management and Sharing Plan being requested for the coming year (e.g., change in repository, change in timeline, or change in scientific direction)? No Change

Foreign RPPR FINAL D. PARTICIPANTS

D.1 WHAT INDIVIDUALS HAVE WORKED ON THE PROJECT?

Commons ID Sr/Key Name Degree(s) Role Cal Aca Sum Foreign Org Country SS

TFALOHUN Y Falohun, Tokunbo BS,MS PD/PI 12.0 0.0 0.0 NA

LOGANDUBOSE960 Y DuBose, Logan Lee MD, MBA Co-

Investigator 12.0 0.0 0.0 NA

QIPINGF Y Fan, Qiping DRPH,MS,BS Co-

Investigator 2.3 0.0 0.0 NA

Glossary of acronyms: Sr/Key - Senior/Key Cal - Person Months (Calendar) Aca - Person Months (Academic) Sum - Person Months (Summer)

Org - Foreign Organization Affiliation SS - Supplement Support RS - Reentry Supplement DS - Diversity Supplement OT - Other NA - Not Applicable

D.2 PERSONNEL UPDATES

D.2.a Level of Effort

Will there be, in the next budget period, either (1) a reduction of 25% or more in the level of effort from what was approved by the agency for the PD/PI(s) or other senior/key personnel designated in the Notice of Award, or (2) a reduction in the level of effort below the minimum amount of effort required by the Notice of Award?

No D.2.b New Senior/Key Personnel

Are there, or will there be, new senior/key personnel?

No D.2.c Changes in Other Support

Has there been a change in the active other support of senior/key personnel since the last reporting period?

No D.2.d New Other Significant Contributors

Are there, or will there be, new other significant contributors?

No RPPR Page 10

D.2.e Multi-PI (MPI) Leadership Plan

Will there be a change in the MPI Leadership Plan for the next budget period? No RPPR FINAL

RPPR Page 11

RPPR FINAL

E. IMPACT

E.1 WHAT IS THE IMPACT ON THE DEVELOPMENT OF HUMAN RESOURCES?

Not Applicable

E.2 WHAT IS THE IMPACT ON PHYSICAL, INSTITUTIONAL, OR INFORMATION RESOURCES THAT FORM INFRASTRUCTURE?

NOTHING TO REPORT

E.3 WHAT IS THE IMPACT ON TECHNOLOGY TRANSFER?

NOTHING TO REPORT

E.3.a Commercialization Activities

Report on the status of commercialization activities resulting from the award:

NOTHING TO REPORT

E.3.b FDA Interactions

Not Applicable to this technology

E.4 WHAT DOLLAR AMOUNT OF THE AWARD'S BUDGET IS BEING SPENT IN FOREIGN COUNTRY(IES)?

NOTHING TO REPORT

RPPR Page 12

RPPR FINAL

F. CHANGES

F.1 CHANGES IN APPROACH AND REASONS FOR CHANGE

Not Applicable

F.2 ACTUAL OR ANTICIPATED CHALLENGES OR DELAYS AND ACTIONS OR PLANS TO RESOLVE THEM

NOTHING TO REPORT

F.3 SIGNIFICANT CHANGES TO HUMAN SUBJECTS, VERTEBRATE ANIMALS, BIOHAZARDS, AND/OR SELECT AGENTS

F.3.a Human Subject

No Change

F.3.b Vertebrate Animals

No Change

F.3.c Biohazards

No Change

F.3.d Select Agents

No Change

RPPR Page 13

RPPR FINAL

G. SPECIAL REPORTING REQUIREMENTS SPECIAL REPORTING REQUIREMENTS

G.1 SPECIAL NOTICE OF AWARD TERMS AND NOTICE OF FUNDING OPPORTUNITIES REPORTING REQUIREMENTS

NOTHING TO REPORT

Have there been any changes that require the submission of an updated SBIR STTR Foreign Disclosure Form?

NO G.2 RESPONSIBLE CONDUCT OF RESEARCH

Not Applicable

G.3 MENTOR'S REPORT OR SPONSOR COMMENTS

Not Applicable

G.4 HUMAN SUBJECTS

Sub- Project ID

RPPR Page 14

Study ID Study Title Delayed

Clinical Onset

Trial NIH-

NCT

Defined

ACT Phase 3

472626 Integration & Preliminary User Interface (UI) Evaluation of a Multi-Agent Network and

NO NO NO NO

472627

Evaluation of the User experience and Caregiver perception of the Integrated Multi-Agent Network Among Human Users with Diverse Characteristics.

NO NO NO

G.5 HUMAN SUBJECTS EDUCATION REQUIREMENT

Are there personnel on this project who are newly involved in the design or conduct of human subjects research?

No G.6 HUMAN EMBRYONIC STEM CELLS (HESCS)

Does this project involve human embryonic stem cells (only hESC lines listed as approved in the NIH Registry may be used in NIH funded research)?

No G.7 VERTEBRATE ANIMALS

Does this project involve vertebrate animals?

1337 RPPR FINAL No G.8 PROJECT/PERFORMANCE SITES

Organization Name UEI Congressional District Address

W 43rd St. Primary: OLERA INC. LY3HSJ7CCN87 TX-018

Unit \#1010 Houston, TX 77018

Clemson University H2BMNX7DSKU8 SC-003 230 Kappa Street

Clemson, SC 296345702

G.9 FOREIGN COMPONENT

No foreign component

G.10 ESTIMATED UNOBLIGATED BALANCE

G.10.a Is it anticipated that an estimated unobligated balance (including prior year carryover) will be greater than 25% of the current year's total approved budget?

No G.11 PROGRAM INCOME

Is program income anticipated during the next budget period? No

G.12 F\&A COSTS

Is there a change in performance sites that will affect F\&A costs?

No RPPR Page 15

Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

Section 1 - Basic Information (Study 472626)

1.1. Study Title \*

Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI)

1.2. Is this study exempt from Federal Regulations \* ● Yes ❍ No 1.3. Exemption Number ❏ 1 ❏✔ 2 ❏ 3 ❏ 4 ❏ 5 ❏ 6 ❏ 7 ❏ 8

1.4. Clinical Trial Questionnaire \*

1.4.a. Does the study involve human participants? ● Yes ❍ No

1.4.b. Are the participants prospectively assigned to an intervention? ● Yes ❍ No

1.4.c. Is the study designed to evaluate the effect of the intervention on the participants? ● Yes ❍ No 1.4.d. Is the effect that will be evaluated a health-related biomedical or behavioral outcome? ❍ Yes ● No 1.5. Provide the ClinicalTrials.gov Identifier (e.g. NCT87654321) for this trial, if applicable

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z RPPR Page 16

Falohun, Tokunbo Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

Section 2 - Study Population Characteristics (Study 472626)

2.1. Conditions or Focus of Study

❍ AD/ADRD - Alzheimer's Disease and Alzheimer’s Disease and Related Dementias Caregivers

2.2. Eligibility Criteria

(1) be the primary non-paid caregiver of a person living with dementia (PLWD) (including a mix of mild, moderate, or severe cases) (2) provide at least 10 weekly hours of care for a PLDW who is yet to be institutionalized (3) be the adult child spouse, or family member of the PLWD (4) have a concern about or perceive a need for more information on financial management and/or legal planning for caregiving (5) have access to a smartphone or computer with internet access.

Exclusion criteria for both studies Formal (paid) caregivers will be excluded from this study.

2.3. Age Limits Min Age: 18 Years Max Age: N/A (No limit)

2.3.a. Inclusion of Individuals Across the Lifespan Lifespan\_Study\_1.pdf

2.4. Inclusion of Women and Minorities Inclusion\_of\_Women\_and\_minorities\_Study\_1.pdf

2.5. Recruitment and Retention Plan Recruitment\_and\_Retention\_Plan\_Study\_1.pdf

2.6. Recruitment Status Not yet recruiting

2.7. Study Timeline Study\_1\_Timeline.pdf

2.8. Enrollment of First Participant (SEE SECTION 6.3)

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z RPPR Page 17

Falohun, Tokunbo

Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

2.3.a Inclusion of Individuals Across the Lifespan

Study 1 will target a small group of family caregivers of PLWD. The specific aim for study 1 is preliminary evaluation of the integrated agent network using the UXIE framework, aiming to design more enriching experiences for users. The specific aim of the study 2 is to comprehensively evaluate the User experience and Caregiver perception of the Integrated Multi-Agent Network Among Human Users with Diverse Characteristics. This study will focus on family caregivers aged 18 and older. Choosing adults across the lifespan is aligned with the 2023 Alzheimer’s Disease Facts and Figures and the caregiving population distribution in the Texas area. For example, the 2023 Alzheimer’s Disease Facts and Figures has shown that 23% of caregivers aged 18-49 help someone with dementia, and 30% of caregivers are age 65 or older. The 2020 AARP report on the caregivers suggested caregivers of adults are with an average age of 49.4 years old, with a median age of 51.0 years. Additionally, according to the profile of informal caregivers in Texas, the majority of the caregivers are the spouse or the adult child of the care recipient. Therefore, inclusion of individuals aged 18 and older and across the lifespan is appropriate. PIs in this proposed project have extensive network and experience working with older adults. Particularly relevant for this project, consultants from the Texas A\&amp;M Center for Community Health and Aging research team has conducted multiple extramurally funded project to evaluate technology-based solutions for people living with ADRD and their caregivers. The experience and built networks will support recruitment by providing easier access to the target population.

Exclusion of Minors Potential participants with children under 18 years of age will be excluded from participating in the research because we believe the children are usually not actively involved in the financial and legal decisions of PLwD. Also, the overarching project focuses on the family caregiver population who are actively in financial management and legal decisions of PLwD, therefore, we believe the exclusion of children under 18 is scientifically justified.

Exclusion of Prisoners This study requires human subjects to either be living in a community-dwelling residence or assisted living facility or providing care to a senior with AD/ADRD at a home or assisted living facility. Therefore, prisoners are excluded from this study.

RPPR Inclusion of Individuals Across the Lifespan

Page 18

Falohun, Tokunbo

Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

2.4 Inclusion of Women and minorities

Inclusion of Pregnant Women The 2023 Alzheimer’s Disease Facts and Figures has shown that 23% of caregivers aged 18-49 help someone with dementia, and two-thirds of the family caregivers are female. Therefore, the target population should include reproductive-aged women who are possibly pregnant, as being pregnant will have no additional research risks.

Inclusion of Minorities In this proposed study (Study 1- Integration \&amp; Preliminary Evaluation of a Multi-Agent Network and User Interface (UI) \[n= 25\] and Study 2 - Comprehensive Evaluation of User Experience and Caregiver Response. \[n=200\]), we will recruit participants with from racial/ethnic minority populations including Hispanics, Black/African Americans, Asian and other Americans. The rationale of enrolling racial/ethnic minorities in our study is that persons living with dementia include these people. The justification for the racial/ethnic distribution is based on the percentages of different racial/ethnic populations and percentages of family caregivers of people living with dementia and Alzheimer’s diseases among each racial/ethnic population. We also considered the population distribution in the Texas area to make realistic enrollment plans for minority populations. Following are some statistics we have considered. According to the 2020 profile of older Americans in the U.S., 24% of persons aged 65 and older were members of racial or ethnic minority populations—9% were African American (not Hispanic), 5% were Asian American (not Hispanic) in 2019. Persons of Hispanic origin (who may be of any race) represented 9% of the older population in the U.S. Additionally, the Texas Caregiver demographics indicated that 20-25% percent were Black/African Americans, 32-37% were Hispanic, and 2-5% were Asian and others.

RPPR Inclusion of Women and Minorities

Page 19

Falohun, Tokunbo

Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

2.5 Recruitment and Retention Plan

Recruitment For the study 1 to pilot test and preliminary evaluate the specialized agents, a group of dementia caregivers (n=25) that represent the diverse range of our end-users (e.g., both male and females, spouse and child caregivers; at least 30% racial or ethnic minorities) will be recruited from Texas. For the study 2 to comprehensively evaluate the user experience and caregiver response, a group of diverse socioeconomic cohort of dementia caregivers (n=200) with at least 50% of the subjects from individuals indicating at least one domain of social needs from the Health Leads tool (e.g., food insecurity, housing instability, utility needs, childcare difficulties, financial resource strain, transportation challenges, literacy difficulties, lack of social support) will be recruited from Texas. We will conduct an evaluation of the acceptance and perceived value of the specialized agents suite assisting with caregiving across 200 participants. We chose Texas for recruitment as our company was launched there, and it offers a large diverse population of caregivers, aligning with our study goals. We will plan to recruit at least 50% of the subjects from individuals indicating at least one domain of social needs from the Health Leads tool. We will do so by strategizing recruitment (e.g., recruiting through local service providers who serve low-socioeconomic status households) and closely monitoring the baseline survey responses of enrolled participants (reported household income and perceived social needs in survey responses).

We will recruit through Alzheimer Association chapters and Area Agencies on Aging caregiver networks in Texas, and our other partners (see letters of support). Dementia caregivers will be recruited primarily through various local dementia and community service providers. This includes the Capital of Texas chapter of the Alzheimer’s Association (AA), The Houston \&amp; Southeast Texas Chapter of the AA, as well as the Brazos Valley Area Agency on Aging’s (AAA) existing caregiver network. Additionally, we have attracted a community of over 10,000 family caregivers and older adults looking for care support, many of which are interested in participating in further research studies with Olera, Inc. researchers in our Phase I and II activities. Furthermore, various recruitment materials, such as recruitment emails, recruitment flyers/posters, social media (e.g., twitter), and word of mouth will be used. The recruitment materials will be created in a culturally relevant manner.

Retention Since the active research period is 4 weeks for both studies, and we will follow up with participants in study 2 for additional 3 months, we think retention issues will be minimal. To enhance retention, it would be important to convey the potential benefits of the proposed technology solution to the study participants. We have scheduled at least one phone calls which will help us stay in contact with participants during their 4-week active search period and address any concerns during interaction with the platform. In cases of requests for early withdrawal, we will develop a withdrawal protocol to identify participants’ reasons for leaving, discuss potential ways to address the barriers, and if appropriate and feasible, enhance retention plan to eliminate or alleviate the barriers for participants. To stay in contact with participants, we will send out reminder emails for each follow-up data collection. It would be also important for study team to build trust and with the participants, as in community participatory research.

RPPR Recruitment and Retention Plan

Page 20

Falohun, Tokunbo

Study Timeline

Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

2.7 Study Timeline Within the first year of the award, we plan to complete the proposed specific aim 1 activity in Development of Specialized Agents for Elder Care Planning. To accelerate the research process, we will initiate the development and preparation activities before the start date of the grant. We aim to complete agent development in Y1Q3, and conduct agent refinement from Y1Q2 to Q4, and complete agent integration in Y1Q4.

While the actual human subjects and evaluation will begin after the product development in Year 1 Quarter 4 (Y1Q4), we will start IRB application for study 1 in Y1Q2, and obtain IRB approval in Y1Q3, and start recruitment after IRB approval, and start data collection in Y1Q4. We will focus on data analyses and the development of study products (e.g., presentation, reports, or manuscripts) for dissemination in Y2Q3\&Q4.

During the Y1Q4 and Y2Q1, we will start preparing for study 2 by starting the development of protocols, IRB amendment, and staff hiring and training. This will speed up the initiation of the proposed study 2 (specific aim 3) in the Y2Q1. After obtaining study 2 IRB amendment approval in Y2Q1-Q2, we will start recruitment and data collection. During the subsequent quarters, we will follow our developed protocol. We will track data and prepare reports throughout the study period, with the focus of the last quarter of the final year (Y3Q4) on summative data analyses, report writing, and the dissemination of study products.

The timeline of the study is provided in below table.

Approximate study timeline for major study activities. Year 1 2 3 Quarter 1 2 3 4 1 2 3 4 1 2 3 4 Protocol, IRB, and Training Protocol development X X X X X X

IRB approval/amendment X X X X X

Staff hiring/training X X X

Development of User Interface Agent development X X X

Agent refinement X X X

Agent integration X

Study 1: Preliminary evaluation Recruitment X X X X X

Data collection X X X X

Data analysis X X X

Study 2: Comprehensive evaluation Recruitment X X X X X X X

Data collection X X X X X X X

Data analysis X X

Dissemination and reports Quarterly reports X X X X X X X X X X X X Study product

X X X X X X X X X dissemination

RPPR Page 21

Falohun, Tokunbo Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

2.9. Inclusion Enrollment Reports

IER ID\# Enrollment Location Type Enrollment Location

IER 486380 Domestic Texas

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z RPPR Page 22

Falohun, Tokunbo Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

OMB Number: 0925-0770

Expiration Date: 09/30/2024 Inclusion Enrollment Report 486380

1\. Inclusion Enrollment Report Title\* : Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI)

2\. Using an Existing Dataset or Resource\* : ❍ Yes ● No

3\. Enrollment Location Type\* : ● Domestic ❍ Foreign

4\. Enrollment Country(ies): USA: UNITED STATES

5\. Enrollment Location(s): Texas

6\. Comments: N/A

Planned

Ethnic Categories Racial Categories

Not Hispanic or Latino Female Male

RPPR Page 23

Total

American Indian/

Alaska Native 0 0 0 0 0

Asian 1 0 1 0 2

Native Hawaiian or Other Pacific Islander 0 0 0 0 0

Black or African

American 4 2 0 0 6

White 7 4 4 2 17

More than One Race 0 0 0 0 0

Total 12 6 5 2 25

Cumulative (Actual)

Racial Categories

Hispanic or Latino Female Male

Ethnic Categories

Not Hispanic or Latino

Female Male

Unknown/Not

Unknown/

Hispanic or Latino

Unknown/

Reported Ethnicity

Unknown/

Total

Not

Female Male

Not

Female Male

Not Reported

Reported

Reported

American Indian/

Alaska Native 0 0 0 0 0 0 0 0 0 0

Asian 0 0 0 0 0 0 0 0 0 0

Native Hawaiian or Other Pacific Islander 0 0 0 0 0 0 0 0 0 0

Black or African

American 0 0 0 0 0 0 0 0 0 0

White 0 0 0 0 0 0 0 0 0 0

More than One Race 0 0 0 0 0 0 0 0 0 0

Unknown or Not Reported 0 0 0 0 0 0 0 0 0 0

Total 0 0 0 0 0 0 0 0 0 0

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z

Falohun, Tokunbo Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

Section 3 - Protection and Monitoring Plans (Study 472626)

3.1. Protection of Human Subjects Protection\_of\_Human\_Subjects\_Study\_1\_.pdf

3.2. Is this a multi-site study that will use the same protocol to conduct non-exempt human subjects research at more than one domestic site?

RPPR Page 24

❍ Yes ❍ No ● N/A

Single IRB plan attachment

3.3. Data and Safety Monitoring Plan Data\_and\_Safety\_Monitoring\_Plan\_Study\_1\_.pdf

3.4. Will a Data and Safety Monitoring Board be appointed for this study?

❍ Yes ● No

3.5. Overall structure of the study team Overall\_Structure\_of\_the\_Study\_Team\_Study\_1\_.pdf

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z

Falohun, Tokunbo

Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

3.1 Protection of Human Subjects

Our team is committed to maintaining the safety and confidentiality all participants. All studies will be structured with the well-being of the caregivers in mind after receiving informed consent, and survey question will be reviewed the lead investigator, with final review from a steering committee. As such, recorded information from participants will be deidentified and kept private in an encrypted database to maintain anonymity and recordings will not be shared.

Our enrollment strategies in both study 1 and study 2 include caregivers of PLWD so that they have to agree to participate before they are enrolled. To prevent any coercion or undue influence on them, we will inform the eligible caregivers of PLwD about the voluntary participation and can withdraw from the study at any time.

RPPR Protection of Human Subjects

Page 25

Falohun, Tokunbo

Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

3.3 Data and Safety Monitoring Plan

The conduct of this study and associated data and safety monitoring plan will adhere to the protocol that will be approved by the research team and the Clemson University Institutional Review Board (IRB). The data will include: survey data, audio-record data, interview transcripts, platform-recorded user data, and observation notes which will be kept on secure servers that are password protected.

In addition, participant's name and contact information (e.g., phone and email) will be collected to enable follow-up with participants. These administrative data will be kept separate from the study data and linked via unique participant identifier. Access to the identifiable information and link to the coded data will be restricted to the authorized data users. All of the materials collected are for research purposes only, and data will be kept in strict confidence. The platform data will be handled in a secure database with administration and user access. Data collected via Olera collected is stored securely in the platform-managed database, and are only accessible by platform manager. Our application will require robust passwords to login.

For the proposed project, we expect minimal risks for participants. Any harm experienced by a subject that is unexpected and information that indicates a new or increased risk including unanticipated problems will be documented and reported to the IRB and/or other agencies as appropriate. Key investigators involved in the human subject research will collectively review the details regarding the adverse events, modify the protocol accordingly, and seek approval of the change by the Clemson IRB (as appropriate).

As a part of data quality management, the PIs or designated data coordinator will review data collection to ensure data completeness per occurrence (for surveys) and back-up data monthly. The datasets will be stored in an encrypted external hard drive in a locked location, as well as, in an encrypted online cloud and will be only accessible by the authorized personnel. Lastly, The Advisory Board will meet twelve times for a total of approximately 24 hours during the 36 months of the study to review data, adjust measurement criteria, and review processes and outcomes.

RPPR Data and Safety Monitoring Plan

Page 26

Falohun, Tokunbo

Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

3.5 Overall Structure of the Study Team

The primary administrative and data coordinating sites for the proposed study is the Olera Inc., Bryan, Texas. The Olera, Inc. will recruit participants through its partners across Texas. Acting as the IRB of record and research collaborators, Clemson University and Texas A\&amp;M University will be the primary academic partners.

The project leadership group will consist of the PIs, Co-Is, and project coordinators. The leadership group will meet regularly (e.g., biweekly for the first 2 quarters and last 2 quarters and monthly during other quarters) to closely monitor the project implementation and study progress, as well as to make timely decisions. We have also identified a panel of experts, who will share their expertise in healthy aging, caregiving, dementia, engineering, community engagement, and big data. The study team will hold regular meetings with the expert panel and consultants quarterly and seek advice in-between, as appropriate.

Our team is experienced in artificial intelligence research, aging research, clinical medicine, and software development making us uniquely suited to execute this project. Team is Led by Olera, Inc. CEO, Tokunbo “TJ” Falohun, a former Pfizer engineer and serial med-tech entrepreneur with a patent for the use of artificial intelligence technologies in ocular disease diagnosis. Dr. Jim Nolan, an expert on Large Language Models, deep learning, and transformers, will lead development of the multi-agent network. He has previously worked with NIAID and NIH on LLMs to detect misinformation about vaccines and infectious diseases. Human subjects research will be supervised by consultant Dr. Marcia Ory, the founding Director of the Center for Population Health \&amp; Aging at Texas A\&amp;M University with over 20 years in federal service as chief of Social Science

Research on Aging in the Behavioral and Social Research Program at the NIA. Dr. Qiping Fan, DrPH, MS, Assistant Professor of Epidemiology at Clemson University with over 6 years’ experience in conducting funded public health research, will be leading the human subjects research design, data analyses, and scientific reporting with guidance from senior biostatistician Gang Han, PhD., Professor of Epidemiology and Biostatistics, Texas A\&amp;M University. Logan DuBose, MD, MBA, the Chief Operating Officer of the company will serve as a co-investigator and Chief Medical Officer to provide clinical expertise relating to people living with dementia. This leadership team is supported by diverse interdisciplinary colleagues as outlined in the budget justification.

RPPR Overall Structure of the Study Team

Page 27

Falohun, Tokunbo Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

Section 4 - Protocol Synopsis (Study 472626)

4.1. Study Design

4.1.a. Detailed Description

4.1.b. Primary Purpose

4.1.c. Interventions

Type Name Description

4.1.d. Study Phase

Is this an NIH-defined Phase III Clinical Trial? ❍ Yes ● No

4.1.e. Intervention Model

4.1.f. Masking ❍ Yes ● No

❏ Participant ❏ Care Provider ❏ Investigator ❏ Outcomes Assessor

4.1.g. Allocation

4.2. Outcome Measures

Type Name Time Frame Brief Description

4.3. Statistical Design and Power

4.4. Subject Participation Duration

4.5. Will the study use an FDA-regulated intervention? ❍ Yes ● No

4.5.a. If yes, describe the availability of Investigational Product (IP) and Investigational New Drug (IND)/ Investigational Device Exemption (IDE) status

4.6. Is this an applicable clinical trial under FDAAA? (SEE SECTION 6.6)

4.7. Dissemination Plan

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z RPPR Page 28

Falohun, Tokunbo Human Subject Report (Integration & Preliminary Evaluation of a Multi-Agent Network and User Interface (UI

Section 6 - Clinical Trial Milestone Plan (Study 472626)

6.1. Study Primary Completion Date 6.2. Study Final Completion Date 6.3. Enrollment and randomization

Enrollment of the First Participant (Study Start Date) 06/01/2025 Anticipated 25% of planned enrollment recruited by 50% of planned enrollment recruited by 75% of planned enrollment recruited by 100% of planned enrollment recruited by 6.4. Completion of primary endpoint data analyses 6.5. Reporting of results in ClinicalTrials.gov 6.6. Is this an applicable clinical trial under FDAAA? ❍ Yes ❍ No

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z RPPR Page 29

Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

Section 1 - Basic Information (Study 472627)

1.1. Study Title \*

Evaluation of the User experience and Caregiver perception of the Integrated Multi-Agent Network Among Human Users with Diverse Characteristics.

1.2. Is this study exempt from Federal Regulations \* ● Yes ❍ No 1.3. Exemption Number ❏ 1 ❏✔ 2 ❏ 3 ❏ 4 ❏ 5 ❏ 6 ❏ 7 ❏ 8

1.4. Clinical Trial Questionnaire \*

1.4.a. Does the study involve human participants? ● Yes ❍ No

1.4.b. Are the participants prospectively assigned to an intervention? ● Yes ❍ No

1.4.c. Is the study designed to evaluate the effect of the intervention on the participants? ● Yes ❍ No 1.4.d. Is the effect that will be evaluated a health-related biomedical or behavioral outcome? ❍ Yes ● No 1.5. Provide the ClinicalTrials.gov Identifier (e.g. NCT87654321) for this trial, if applicable

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z RPPR Page 30

Falohun, Tokunbo Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

Section 2 - Study Population Characteristics (Study 472627)

2.1. Conditions or Focus of Study

❍ AD/ADRD - Alzheimer's Disease and Alzheimer’s Disease and Related Dementias Caregivers

2.2. Eligibility Criteria

Inclusion criteria for both studies (1) be the primary non-paid caregiver of a person living with dementia (PLWD) (including a mix of mild, moderate, or severe

cases) (2) provide at least 10 weekly hours of care for a PLDW who is yet to be institutionalized (3) be the adult child spouse, or family member of the PLWD (4) have a concern about or perceive a need for more information on financial management and/or legal planning for

caregiving (5) have access to a smartphone or computer with internet access.

Exclusion criteria for both studies Formal (paid) caregivers will be excluded from this study.

2.3. Age Limits Min Age: 18 Years Max Age: N/A (No limit)

2.3.a. Inclusion of Individuals Across the Lifespan Lifespan\_Study\_2.pdf

2.4. Inclusion of Women and Minorities Inclusion\_of\_Women\_and\_minorities\_Study\_2\_(1).pdf

2.5. Recruitment and Retention Plan Recruitment\_and\_Retention\_Plan\_Study\_2.pdf

2.6. Recruitment Status Not yet recruiting

2.7. Study Timeline Study\_2\_Timeline.pdf

2.8. Enrollment of First Participant (SEE SECTION 6.3)

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z RPPR Page 31

Falohun, Tokunbo

Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

4.7 Inclusion of Individuals Across the Lifespan

The specific aim of the study 2 is to comprehensively evaluate the User experience and Caregiver perception of the Integrated Multi-Agent Network Among Human Users with Diverse Characteristics. This study will focus on family caregivers aged 18 and older.

Choosing adults across the lifespan is aligned with the 2023 Alzheimer’s Disease Facts and Figures and the caregiving population distribution in the Texas area. For example, the 2023 Alzheimer’s Disease Facts and Figures has shown that 23% of caregivers aged 18-49 help someone with dementia, and 30% of caregivers are age 65 or older. The 2020 AARP report on the caregivers suggested caregivers of adults are with an average age of 49.4 years old, with a median age of 51.0 years. Additionally, according to the profile of informal caregivers in Texas, the majority of the caregivers are the spouse or the adult child of the care recipient. Therefore, inclusion of individuals aged 18 and older and across the lifespan is appropriate.

PIs in this proposed project have extensive network and experience working with older adults. Particularly relevant for this project, consultants from the Texas A\&M Center for Community Health and Aging research team has conducted multiple extramurally funded project to evaluate technology-based solutions for people living with ADRD and their caregivers. The experience and built networks will support recruitment by providing easier access to the target population.

Exclusion of Minors

Potential participants with children under 18 years of age will be excluded from participating in the research because we believe the children are usually not actively involved in the financial and legal decisions of PLwD. Also, the overarching project focuses on the family caregiver population who are actively in financial management and legal decisions of PLwD, therefore, we believe the exclusion of children under 18 is scientifically justified.

Exclusion of Prisoners This study requires human subjects to either be living in a community-dwelling residence or assisted living facility or providing care to a senior with AD/ADRD at a home or assisted living facility. Therefore, prisoners are excluded from this study.

RPPR Inclusion of Individuals Across the Lifespan

Page 32

Falohun, Tokunbo

Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

2.4 Inclusion of Women and minorities

Inclusion of Pregnant Women The 2023 Alzheimer’s Disease Facts and Figures has shown that 23% of caregivers aged 18-49 help someone with dementia, and two-thirds of the family caregivers are female. Therefore, the target population should include reproductive-aged women who are possibly pregnant, as being pregnant will have no additional research risks.

Inclusion of Minorities In Study 2 (Comprehensive Evaluation of User Experience and Caregiver Response. \[n=200\]), we will recruit participants with from racial/ethnic minority populations including Hispanics, Black/African Americans, Asian and other Americans. The rationale of enrolling racial/ethnic minorities in our study is that persons living with dementia include these people. The justification for the racial/ethnic distribution is based on the percentages of different racial/ethnic populations and percentages of family caregivers of people living with dementia and Alzheimer’s diseases among each racial/ethnic population. We also considered the population distribution in the Texas area to make realistic enrollment plans for minority populations.

Following are some statistics we have considered. According to the 2020 profile of older Americans in the U.S., 24% of persons aged 65 and older were members of racial or ethnic minority populations—9% were African American (not Hispanic), 5% were Asian American (not Hispanic) in 2019. Persons of Hispanic origin (who may be of any race) represented 9% of the older population in the U.S. Additionally, the Texas Caregiver demographics indicated that 20-25% percent were Black/African Americans, 32-37% were Hispanic, and 2-5% were Asian and others.

RPPR Inclusion of Women and Minorities

Page 33

Falohun, Tokunbo

Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

2.5 Recruitment and Retention Plan

Recruitment

For the study 2 to comprehensively evaluate the user experience and caregiver response, a group of diverse socioeconomic cohort of dementia caregivers (n=200) with at least 50% of the subjects from individuals indicating at least one domain of social needs from the Health Leads tool (e.g., food insecurity, housing instability, utility needs, childcare difficulties, financial resource strain, transportation challenges, literacy difficulties, lack of social support) will be recruited from Texas. We will conduct an evaluation of the acceptance and perceived value of the specialized agents suite assisting with caregiving across 200 participants.

We chose Texas for recruitment as our company was launched there, and it offers a large diverse population of caregivers, aligning with our study's goals. We will plan to recruit at least 50% of the subjects from individuals indicating at least one domain of social needs from the Health Leads tool. We will do so by strategizing recruitment (e.g., recruiting through local service providers who serve low-socioeconomic status households) and closely monitoring the baseline survey responses of enrolled participants (reported household income and perceived social needs in survey responses). We will recruit through Alzheimer's Association chapters and Area Agencies on Aging caregiver networks in Texas, and our other partners (see letters of support).

Dementia caregivers will be recruited primarily through various local dementia and community service providers. This includes the Capital of Texas chapter of the Alzheimer’s Association (AA), The Houston & Southeast Texas Chapter of the AA, as well as the Brazos Valley Area Agency on Aging’s (AAA) existing caregiver network. Additionally, we have attracted a community of over 10,000 family caregivers and older adults looking for care support, many of which are interested in participating in further research studies with Olera, Inc. researchers in our Phase I and II activities. Furthermore, various recruitment materials, such as recruitment emails, recruitment flyers/posters, social media (e.g., twitter), and word of mouth will be used. The recruitment materials will be created in a culturally relevant manner.

Retention

Since the active research period is 4 weeks for both studies, and we will follow up with participants in study 2 for additional 3 months, we think retention issues will be minimal. To enhance retention, it would be important to convey the potential benefits of the proposed technology solution to the study participants. We have scheduled at least one phone calls which will help us stay in contact with participants during their 4-week active search period and address any concerns during interaction with the platform. In cases of requests for early withdrawal, we will develop a withdrawal protocol to identify participants’ reasons for leaving, discuss potential ways to address the barriers, and if appropriate and feasible, enhance retention plan to eliminate or alleviate the barriers for participants. To stay in contact with participants, we will send out reminder emails for each follow-up data collection. It would be also important for study team to build trust and with the participants, as in community participatory research.

RPPR Recruitment and Retention Plan

Page 34

Falohun, Tokunbo

Study Timeline

Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

2.7 Study Timeline Within the first year of the award, we plan to complete the proposed specific aim 1 activity in Development of Specialized Agents for Elder Care Planning. To accelerate the research process, we will initiate the development and preparation activities before the start date of the grant. We aim to complete agent development in Y1Q3, and conduct agent refinement from Y1Q2 to Q4, and complete agent integration in Y1Q4.

While the actual human subjects and evaluation will begin after the product development in Year 1 Quarter 4 (Y1Q4), we will start IRB application for study 1 in Y1Q2, and obtain IRB approval in Y1Q3, and start recruitment after IRB approval, and start data collection in Y1Q4. We will focus on data analyses and the development of study products (e.g., presentation, reports, or manuscripts) for dissemination in Y2Q3\&Q4.

During the Y1Q4 and Y2Q1, we will start preparing for study 2 by starting the development of protocols, IRB amendment, and staff hiring and training. This will speed up the initiation of the proposed study 2 (specific aim 3) in the Y2Q1. After obtaining study 2 IRB amendment approval in Y2Q1-Q2, we will start recruitment and data collection. During the subsequent quarters, we will follow our developed protocol. We will track data and prepare reports throughout the study period, with the focus of the last quarter of the final year (Y3Q4) on summative data analyses, report writing, and the dissemination of study products.

The timeline of the study is provided in below table.

Approximate study timeline for major study activities. Year 1 2 3 Quarter 1 2 3 4 1 2 3 4 1 2 3 4 Protocol, IRB, and Training Protocol development X X X X X X

IRB approval/amendment X X X X X

Staff hiring/training X X X

Development of User Interface Agent development X X X

Agent refinement X X X

Agent integration X

Study 1: Preliminary evaluation Recruitment X X X X X

Data collection X X X X

Data analysis X X X

Study 2: Comprehensive evaluation Recruitment X X X X X X X

Data collection X X X X X X X

Data analysis X X

Dissemination and reports Quarterly reports X X X X X X X X X X X X Study product

X X X X X X X X X dissemination

RPPR Page 35

Falohun, Tokunbo Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

2.9. Inclusion Enrollment Reports

IER ID\# Enrollment Location Type Enrollment Location

IER 486381 Domestic Texas

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z RPPR Page 36

Falohun, Tokunbo Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

OMB Number: 0925-0770

Expiration Date: 09/30/2024 Inclusion Enrollment Report 486381

1\. Inclusion Enrollment Report Title\* : Evaluation of the User experience and Caregiver Perception of the Integrated Multi-

Agent Network Among Human Users with Diverse Characteristics

2\. Using an Existing Dataset or Resource\* : ❍ Yes ● No

3\. Enrollment Location Type\* : ● Domestic ❍ Foreign

4\. Enrollment Country(ies): USA: UNITED STATES

5\. Enrollment Location(s): Texas

6\. Comments: N/A

Planned

Ethnic Categories Racial Categories

Not Hispanic or Latino Female Male

RPPR Page 37

Total

American Indian/

Alaska Native 0 0 0 0 0

Asian 7 3 0 0 10

Native Hawaiian or Other Pacific Islander 0 0 0 0 0

Black or African

American 28 14 0 0 42

White 59 29 40 20 148

More than One Race 0 0 0 0 0

Total 94 46 40 20 200

Cumulative (Actual)

Racial Categories

Hispanic or Latino Female Male

Ethnic Categories

Not Hispanic or Latino

Female Male

Unknown/Not

Unknown/

Hispanic or Latino

Unknown/

Reported Ethnicity

Unknown/

Total

Not

Female Male

Not

Female Male

Not Reported

Reported

Reported

American Indian/

Alaska Native 0 0 0 0 0 0 0 0 0 0

Asian 0 0 0 0 0 0 0 0 0 0

Native Hawaiian or Other Pacific Islander 0 0 0 0 0 0 0 0 0 0

Black or African

American 0 0 0 0 0 0 0 0 0 0

White 0 0 0 0 0 0 0 0 0 0

More than One Race 0 0 0 0 0 0 0 0 0 0

Unknown or Not Reported 0 0 0 0 0 0 0 0 0 0

Total 0 0 0 0 0 0 0 0 0 0

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z

Falohun, Tokunbo Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

Section 3 - Protection and Monitoring Plans (Study 472627)

3.1. Protection of Human Subjects Protection\_of\_Human\_Subjects\_Study\_2.pdf

3.2. Is this a multi-site study that will use the same protocol to conduct non-exempt human subjects research at more than one domestic site?

RPPR Page 38

❍ Yes ❍ No ● N/A

Single IRB plan attachment

3.3. Data and Safety Monitoring Plan Data\_2.pdf

3.4. Will a Data and Safety Monitoring Board be appointed for this study?

❍ Yes ● No

3.5. Overall structure of the study team Overall\_Structure\_of\_the\_Study\_Team\_Study\_2\_.pdf

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z

Falohun, Tokunbo

Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

3.1 Protection of Human Subjects

Our team is committed to maintaining the safety and confidentiality all participants. All studies will be structured with the well-being of the caregivers in mind after receiving informed consent, and survey question will be reviewed the lead investigator, with final review from a steering committee. As such, recorded information from participants will be deidentified and kept private in an encrypted database to maintain anonymity and recordings will not be shared.

Our enrollment strategies in both study 1 and study 2 include caregivers of PLWD so that they have to agree to participate before they are enrolled. To prevent any coercion or undue influence on them, we will inform the eligible caregivers of PLwD about the voluntary participation and can withdraw from the study at any time.

RPPR Protection of Human Subjects

Page 39

Falohun, Tokunbo

Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

3.3 Data and Safety Monitoring Plan

The conduct of this study and associated data and safety monitoring plan will adhere to the protocol that will be approved by the research team and the Clemson University Institutional Review Board (IRB). The data will include: survey data, audio-record data, interview transcripts, platform-recorded user data, and observation notes which will be kept on secure servers that are password protected.

In addition, participant's name and contact information (e.g., phone and email) will be collected to enable follow-up with participants. These administrative data will be kept separate from the study data and linked via unique participant identifier. Access to the identifiable information and link to the coded data will be restricted to the authorized data users. All of the materials collected are for research purposes only, and data will be kept in strict confidence. The platform data will be handled in a secure database with administration and user access. Data collected via Olera collected is stored securely in the platform-managed database, and are only accessible by platform manager. Our application will require robust passwords to login.

For the proposed project, we expect minimal risks for participants. Any harm experienced by a subject that is unexpected and information that indicates a new or increased risk including unanticipated problems will be documented and reported to the IRB and/or other agencies as appropriate. Key investigators involved in the human subject research will collectively review the details regarding the adverse events, modify the protocol accordingly, and seek approval of the change by the Clemson IRB (as appropriate).

As a part of data quality management, the PIs or designated data coordinator will review data collection to ensure data completeness per occurrence (for surveys) and back-up data monthly. The datasets will be stored in an encrypted external hard drive in a locked location, as well as, in an encrypted online cloud and will be only accessible by the authorized personnel. Lastly, The Advisory Board will meet twelve times for a total of approximately 24 hours during the 36 months of the study to review data, adjust measurement criteria, and review processes and outcomes.

RPPR Data and Safety Monitoring Plan

Page 40

Falohun, Tokunbo

Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

3.5 Overall Structure of the Study Team

The primary administrative and data coordinating sites for the proposed study is the Olera Inc., Bryan, Texas. The Olera, Inc. will recruit participants through its partners across Texas. Acting as the IRB of record and research collaborators, Clemson University and Texas A\&amp;M University will be the primary academic partners.

The project leadership group will consist of the PIs, Co-Is, and project coordinators. The leadership group will meet regularly (e.g., biweekly for the first 2 quarters and last 2 quarters and monthly during other quarters) to closely monitor the project implementation and study progress, as well as to make timely decisions. We have also identified a panel of experts, who will share their expertise in healthy aging, caregiving, dementia, engineering, community engagement, and big data. The study team will hold regular meetings with the expert panel and consultants quarterly and seek advice in-between, as appropriate.

Our team is experienced in artificial intelligence research, aging research, clinical medicine, and software development making us uniquely suited to execute this project. Team is Led by Olera, Inc. CEO, Tokunbo “TJ” Falohun, a former Pfizer engineer and serial med-tech entrepreneur with a patent for the use of artificial intelligence technologies in ocular disease diagnosis. Dr. Jim Nolan, an expert on Large Language Models, deep learning, and transformers, will lead development of the multi-agent network. He has previously worked with NIAID and NIH on LLMs to detect misinformation about vaccines and infectious diseases. Human subjects research will be supervised by consultant Dr. Marcia Ory, the founding Director of the Center for Population Health \&amp; Aging at Texas A\&amp;M University with over 20 years in federal service as chief of Social Science

Research on Aging in the Behavioral and Social Research Program at the NIA. Dr. Qiping Fan, DrPH, MS, Assistant Professor of Epidemiology at Clemson University with over 6 years’ experience in conducting funded public health research, will be leading the human subjects research design, data analyses, and scientific reporting with guidance from senior biostatistician Gang Han, PhD., Professor of Epidemiology and Biostatistics, Texas A\&amp;M University. Logan DuBose, MD, MBA, the Chief Operating Officer of the company will serve as a co-investigator and Chief Medical Officer to provide clinical expertise relating to people living with dementia. This leadership team is supported by diverse interdisciplinary colleagues as outlined in the budget justification.

RPPR Overall Structure of the Study Team

Page 41

Falohun, Tokunbo Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

Section 4 - Protocol Synopsis (Study 472627)

4.1. Study Design

4.1.a. Detailed Description

4.1.b. Primary Purpose

4.1.c. Interventions

Type Name Description

4.1.d. Study Phase

Is this an NIH-defined Phase III Clinical Trial? ❍ Yes ❍ No

4.1.e. Intervention Model

4.1.f. Masking ❍ Yes ❍ No

❏ Participant ❏ Care Provider ❏ Investigator ❏ Outcomes Assessor

4.1.g. Allocation

4.2. Outcome Measures

Type Name Time Frame Brief Description

4.3. Statistical Design and Power

4.4. Subject Participation Duration

4.5. Will the study use an FDA-regulated intervention? ❍ Yes ● No

4.5.a. If yes, describe the availability of Investigational Product (IP) and Investigational New Drug (IND)/ Investigational Device Exemption (IDE) status

4.6. Is this an applicable clinical trial under FDAAA? (SEE SECTION 6.6)

4.7. Dissemination Plan

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z RPPR Page 42

Falohun, Tokunbo Human Subject Report (Evaluation of the User experience and Caregiver perception of the Integrated Multi-A

Section 6 - Clinical Trial Milestone Plan (Study 472627)

6.1. Study Primary Completion Date 6.2. Study Final Completion Date 6.3. Enrollment and randomization

Enrollment of the First Participant (Study Start Date) 03/01/2023 Anticipated 25% of planned enrollment recruited by 50% of planned enrollment recruited by 75% of planned enrollment recruited by 100% of planned enrollment recruited by 6.4. Completion of primary endpoint data analyses 6.5. Reporting of results in ClinicalTrials.gov 6.6. Is this an applicable clinical trial under FDAAA? ❍ Yes ❍ No

Tracking Number: GRANT13969992 Opportunity Number: PAS22-196 Received Date: 2023-09-05T04:00:00Z RPPR Page 43

[\#23](#23)   
[\#37](#37)   