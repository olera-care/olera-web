-- ===========================================================================
-- Will the spreadsheet history land? — v3
-- ===========================================================================
-- v2 measured my extraction, not the data. It read phone numbers only from
-- the PHONE column and found 298 of 396 provider rows had one. Dozens of
-- rows carry the number inside the name instead — "Synergy HomeCare ·
-- (480) 659-7771" — so real coverage is 420 of 432 rows, 97%.
--
-- The correction matters most for Arizona State. On the old extraction it
-- looked like two rows of history against 130 records, so I called it
-- greenfield. Reading the numbers inside the names it has 79 — the largest
-- block of prior work on any campus.
--
-- This version also matches a second phone where a row carries one, and
-- strips the embedded number out of the name so name matching is not
-- poisoned by it.
--
-- ── ON SAFETY ─────────────────────────────────────────────────────────
-- Creates TEMP tables: private to this connection, gone when the session
-- ends, cannot collide with anything real. Every statement that touches
-- your data is a SELECT.
--
-- Outcomes, one row each:
--   matched one       safe to overlay automatically
--   matched several   a shared switchboard or franchise number — needs a
--                     name to break the tie, never guess
--   in directory only the provider exists but is not on any campus board
--   no match          nothing in the directory. Counted loudly, because
--                     these are the rows that would be silently lost.
-- ===========================================================================

DROP TABLE IF EXISTS _sheet;
CREATE TEMP TABLE _sheet (tab TEXT, row_no INT, name TEXT, phone TEXT, phone2 TEXT, email TEXT);

INSERT INTO _sheet (tab, row_no, name, phone, phone2, email) VALUES
    ('prov', 2, 'Unique In Home Personal Care', '2845877800', '6086402720', ''),
    ('prov', 3, 'Morgan''s Caring Connection', '6085989665', '', ''),
    ('prov', 4, 'Right at Home', '6088507335', '', 'erin.mckenna@rahmadison.com'),
    ('prov', 5, 'Senior Services Plus Health', '6087575940', '', ''),
    ('prov', 6, 'Always Best Care Of Madison', '6083152378', '', 'dogunnoiki@abc-seniors.com'),
    ('prov', 7, 'Agape Senior Services', '6088411004', '', ''),
    ('prov', 8, 'Cornerstone Caregiving - Madison Home Care', '6085995440', '', 'madisonwi@cornerstonecaregiving.com'),
    ('prov', 9, 'Visiting Angels', '6088190665', '', 'tteske@visitingangels.com'),
    ('prov', 10, 'Comfort Keepers In-Home Senior Care of Madison', '6089270611', '', ''),
    ('prov', 11, 'Home Instead', '6085713064', '', 'mwright@ckmadison.com'),
    ('prov', 12, 'Village Caregiving', '4146261732', '', ''),
    ('prov', 13, 'Good People - Live in Caregivers', '6086091620', '', ''),
    ('prov', 14, 'Serenity Hearts Home Care', '6082306519', '', ''),
    ('prov', 15, 'Home Instead', '6088869210', '', 'abigail.davidson@homeinstead.com'),
    ('prov', 16, 'Village Caregiving', '3049625877', '', 'charliehupp@villagecaregiving.com'),
    ('prov', 17, 'Full Spectrum Health Services', '6082373550', '', 'contact@fshcare.com'),
    ('prov', 18, 'Sunprime Homecare', '2025384712', '', 'sunprimehc@gmail.com'),
    ('prov', 19, 'Senior Helpers', '6087295365', '', 'tanyas@seniorhelpers.com'),
    ('prov', 20, 'Home Care, Recharged', '3525657155', '', 'carecoordinator@homecarerecharged.com'),
    ('prov', 21, 'Granny Nannies of Gainesville', '3523273877', '', 'gainesville@grannynannies.com'),
    ('prov', 22, 'Home by Choice', '3523764024', '', ''),
    ('prov', 23, 'Touching Hearts At Home', '3522253727', '', 'c.ramos@touchinghearts.com'),
    ('prov', 24, 'Visiting Angels', '3523722000', '', 'bcombs@visitingangels.com'),
    ('prov', 25, 'Guardian Home Care', '3525546091', '', ''),
    ('prov', 26, 'Home Instead', '3526642789', '', ''),
    ('prov', 27, 'Visiting Angels', '3526208484', '', 'k.anderson@visitingangels.com'),
    ('prov', 28, 'Community Companion Care', '3528541358', '', 'communitycompanioncare@cox.net'),
    ('prov', 29, 'ElderCare of Alachua County', '3522659040', '', ''),
    ('prov', 30, 'Comfort Keepers Home Care', '3528553793', '', ''),
    ('prov', 31, 'Alternative Care', '3526818993', '', ''),
    ('prov', 32, 'Viceroy Home Health', '3522816727', '', ''),
    ('prov', 33, 'Comfort Keepers Home Care', '3525583414', '', 'lindadaniels@comfortkeepers.com'),
    ('prov', 34, 'Miracle Hands healthcare', '3523552121', '', 'zsewell@mymiraclehands.net'),
    ('prov', 35, 'Mederi Private Care', '3525548023', '', 'jamee.tetstone@lhcgroup.com'),
    ('prov', 36, 'Concierge Care - Gainesville', '3523203657', '', ''),
    ('prov', 37, 'My Home Sweet Home', '3525541127', '', ''),
    ('prov', 38, 'Ocala Caregivers', '3524010040', '', ''),
    ('prov', 39, 'Ovation Home Care', '3525711163', '', 'brent@ovationhomecare.com // marylin@ovationhomecare.com'),
    ('prov', 40, 'Embrace Group Home', '3523368198', '', ''),
    ('prov', 41, 'Comfort Keepers of Tallahassee, FL', '8504272273', '', 'jennifer.adams@ckcoastalfl.com'),
    ('prov', 42, 'Standard Home-Care Providers', '8665574272', '', ''),
    ('prov', 43, 'Care First Private Home Health Care', '8502128783', '', ''),
    ('prov', 44, 'Right At Home Tallahassee', '8507654701', '', ''),
    ('prov', 45, 'Visiting Angels (Florida State University · Provider)', '8503206062', '', ''),
    ('prov', 46, 'Heaven Sent Elderly Care Services', '8509996527', '', ''),
    ('prov', 47, 'Hopewell In-Home Senior Care', '8503865552', '', 'shae@hopewellcare.com'),
    ('prov', 48, 'Caring Connections Senior Care', '8503545336', '', ''),
    ('prov', 49, 'Tallahassee Living Center', '8509429868', '', 'mwalker@aviatahg.com'),
    ('prov', 50, 'Guardian Angel Care Services', '2545352419', '', 'gacs2.2024@gmail.com'),
    ('prov', 51, 'Home Instead', '8502971897', '', ''),
    ('prov', 52, 'SYNERGY HomeCare', '8506610557', '', 'malloryjackson@synergyhomecare.com'),
    ('prov', 53, 'Affinity Home Care Agency', '8507655241', '', 'affinityhomecareflorida@gmail.com'),
    ('prov', 54, 'Always Best Care Of Madison', '8554702273', '', 'dogunnoiki@abc-seniors.com'),
    ('prov', 55, 'Cornerstone Caregiving - Madison Home Care', '6085995440', '', 'madisonwi@cornerstonecaregiving.com'),
    ('prov', 56, 'Home Instead', '6083149241', '', 'mwright@ckmadison.com'),
    ('prov', 57, 'Village Caregiving', '4146261732', '', 'charliehupp@villagecaregiving.com'),
    ('prov', 58, 'Sunprime Homecare', '2025384712', '', 'sunprimehc@gmail.com'),
    ('prov', 59, 'Senior Helpers', '6087295365', '', 'tanyas@seniorhelpers.com'),
    ('prov', 60, 'Touching Hearts At Home', '3522253727', '', 'c.ramos@touchinghearts.com'),
    ('prov', 61, 'Visiting Angels', '3526208484', '', 'k.anderson@visitingangels.com'),
    ('prov', 62, 'Comfort Keepers Home Care', '3525583414', '', 'lindadaniels@comfortkeepers.com'),
    ('prov', 63, 'Miracle Hands healthcare', '3523552121', '', 'zsewell@mymiraclehands.net'),
    ('prov', 64, 'Mederi Private Care', '3525548023', '', 'jamee.tetstone@lhcgroup.com'),
    ('prov', 65, 'Home Care, Recharged', '3525657155', '', 'carecoordinator@homecarerecharged.com'),
    ('prov', 66, 'Visiting Angels', '6088190665', '', 'tteske@visitingangels.com'),
    ('prov', 67, 'Ovation Home Care', '3523091656', '', 'marylin@ovationhomecare.com'),
    ('prov', 68, 'Visiting Angels', '2563390013', '', 'bcombs@visitingangels.com'),
    ('prov', 69, 'Standard Home-Care Providers', '8665574272', '', 'standardhomecare@outlook.com'),
    ('prov', 70, 'Always Best Care Of Madison', '8554702273', '', 'dogunnoiki@abc-seniors.com'),
    ('prov', 71, 'Cornerstone Caregiving - Madison Home Care', '6085995440', '', 'madisonwi@cornerstonecaregiving.com'),
    ('prov', 72, 'Village Caregiving', '4146261732', '', 'madisonwi@cornerstonecaregiving.com'),
    ('prov', 73, 'Sunprime Homecare', '2025384712', '', 'sunprimehc@gmail.com'),
    ('prov', 74, 'Senior HelperS', '6087295365', '', ''),
    ('prov', 75, 'Touching Hearts At Home', '3522253727', '', 'c.ramos@touchinghearts.com'),
    ('prov', 76, 'Visiting Angels', '', '', 'k.anderson@visitingangels.com'),
    ('prov', 77, 'Comfort Keepers Home Care', '3525583414', '', 'lindadaniels@comfortkeepers.com'),
    ('prov', 78, 'Mederi Private Care', '3525548023', '', ''),
    ('prov', 79, 'Home Care, Recharged', '3525657155', '', 'administrator@homecarerecharged.com'),
    ('prov', 80, 'Visiting Angels', '6088190665', '', 'tteske@visitingangels.com'),
    ('prov', 81, 'mwalker@aviatahg.com', '8509429868', '', ''),
    ('prov', 82, 'Comfort Keepers Home Care', '3528553793', '', 'donnaosteen@comfortkeepers.com'),
    ('prov', 83, 'Academic Advising (Dean''s Office)', '8506441081', '', 'donnaosteen@comfortkeepers.com'),
    ('prov', 84, 'Undergraduate Academic Advising', '8506445470', '', 'cosspp-advising@fsu.edu'),
    ('prov', 85, 'The Career Center', '8506446431', '', ''),
    ('prov', 86, 'Pre-Health Advising Office', '3523921521', '', 'prehealth@advising.ufl.edu'),
    ('prov', 87, 'Standard Home-Care Providers', '8665574272', '', ''),
    ('prov', 88, 'Ovation Home Care', '', '', ''),
    ('prov', 89, 'Visiting Angels', '', '', 'bcombs@visitingangels.com'),
    ('prov', 90, 'NULL - Stampede Into Bull Nursing · University of Florida · Student Org', '', '', ''),
    ('prov', 91, 'Pre-Therapy Student Association', '7865319292', '', 'ptsafiu@gmail.com'),
    ('prov', 92, 'College of Nursing Student Council', '3522736001', '', ''),
    ('prov', 93, 'Brad Barbazuk', '3522738624', '', ''),
    ('prov', 94, 'Stephen Deban', '8139748393', '', 'sdeban@usf.edu'),
    ('prov', 95, 'Mildred (Maldonado-Molina) Schreiner', '3523920583', '', 'mmmm@ufl.edu'),
    ('prov', 96, 'Michael Reid', '3522941606', '', 'vcourt@ufl.edu'),
    ('prov', 97, 'Shakira Henderson · College of Nursing', '3522736400', '', 'shakirahenderson@ufl.edu'),
    ('prov', 98, 'Jesse Kresak', '3526279240', '', 'jkresak@ufl.edu'),
    ('prov', 99, 'Dietmar W Siemann', '3522738231', '', 'siemadw@ufl.edu'),
    ('prov', 100, 'David C Bloom', '3522739524', '', 'dbloom@ufl.edu'),
    ('prov', 101, 'Matthew Gentry', '3522948397', '', 'matthew.gentry@ufl.edu'),
    ('prov', 102, 'Karyn Esser', '3522735728', '', 'kaesser@ufl.edu'),
    ('prov', 103, 'Ann L Horgas PhD', '3522736400', '', 'ahorgas@ufl.edu.'),
    ('prov', 104, 'Daniel Wesson', '3522948767', '', 'danielwesson@ufl.edu'),
    ('prov', 105, 'Beth A. Virnig · College of Public Health and Health Professions', '', '', 'bvirnig@ufl.edu'),
    ('prov', 106, 'Comfort Keepers of Tallahassee, FL', '8504272273', '', 'jennifer.adams@ckcoastalfl.com'),
    ('prov', 107, 'Tallahassee Living Center', '8509429868', '', 'mwalker@aviatahg.com'),
    ('prov', 108, 'Comfort Keepers Home Care', '3528553793', '', 'donnaosteen@comfortkeepers.com'),
    ('prov', 109, 'Thomas A. Houpt', '8506446624', '', 'houpt@bio.fsu.edu'),
    ('prov', 110, 'Wei Yang · Department of Chemistry & Biochemistry', '8506456884', '', 'yang@sb.fsu.edu'),
    ('prov', 111, 'Lisa Griffiths · Department of Health, Nutrition, and Food Sciences', '8506446885', '', 'lgriffiths@fsu.edu'),
    ('prov', 112, 'Alan Rowan · Public Health Program', '8506441025', '', 'arowan@fsu.edu'),
    ('prov', 113, 'Jing Wang · College of Nursing', '8506443299', '', 'jingwang@nursing.fsu.edu'),
    ('prov', 114, 'Richard Nowakowski · Department of Biomedical Sciences', '8506449219', '', 'richard.nowakowski@med.fsu.edu'),
    ('prov', 115, 'Alma Littles · College of Medicine', '8506441855', '', 'alma.littles@med.fsu.edu'),
    ('prov', 116, 'Damon Andrew · Anne Spencer Daves College of Education, Health, and Human Sciences', '8506446885', '', 'dandrew@fsu.edu'),
    ('prov', 117, 'Heather Flynn · Department of Behavioral Sciences and Social Medicine', '8506457367', '', 'heather.flynn@med.fsu.edu'),
    ('prov', 118, 'Geriatrics Interest Group', '7274395229', '', 'cll20d@fsu.edu'),
    ('prov', 119, 'Cornerstone Caregiving - Madison Home Care', '6085995440', '', 'madisonwi@cornerstonecaregiving.com'),
    ('prov', 120, 'Comfort Keepers Home Care', '3525583414', '', ''),
    ('prov', 121, 'Accent Care Personal Care Services', '9286325219', '', ''),
    ('prov', 122, 'Arosa Salt Lake', '8015033200', '', 'elaine.sario@arosacare.com'),
    ('prov', 123, 'Visiting Angels', '8018039248', '', 'palexandrov@visitingangels.com'),
    ('prov', 124, 'Right at Home', '8017580630', '', 'frank@rahslc.com'),
    ('prov', 125, 'TheKey - Formerly Home Care Assistance', '3852312154', '', ''),
    ('prov', 126, 'Amada Senior Care', '8018933877', '', 'phil.j@amadaseniorcare.com'),
    ('prov', 127, 'A Caring Hand', '8012531265', '', ''),
    ('prov', 128, 'ComForCare Home Care Utah', '8008864044', '', 'eastslc@comforcare.com'),
    ('prov', 129, 'Danville Support Services', '8013631521', '', 'm.rochin@danvilleservices.com'),
    ('prov', 130, 'Select Home Care', '8014327500', '', ''),
    ('prov', 131, 'SYNERGY HomeCare', '8019460355', '', 'ut01@synergyhomecare.com'),
    ('prov', 132, 'Home Instead', '8016309089', '', ''),
    ('prov', 133, 'Assisting Hands - Davis', '8014999993', '', 'lbrown@assistinghands.com'),
    ('prov', 134, 'Homewatch CareGivers', '8884045191', '', ''),
    ('prov', 135, 'Homewatch CareGivers', '8884045191', '', ''),
    ('prov', 136, 'Homewatch CareGivers', '8884045191', '', ''),
    ('prov', 137, 'Cornerstone Caregiving', '8127141427', '', 'bloomingtonin@cornerstonecaregiving.com'),
    ('prov', 138, 'Village Caregiving', '8126166226', '', ''),
    ('prov', 139, 'Paid.care', '8123245958', '', 'info@paid.care'),
    ('prov', 140, 'Alternative Care Solutions', '8126710247', '', 'acshr@altcaresolutions.com'),
    ('prov', 141, 'AccessiCare Elder Home Care', '8127253504', '', ''),
    ('prov', 142, 'Caregivers', '1784327782', '', ''),
    ('prov', 143, 'Home Instead', '9302708368', '', 'sarah.lacey@homeinstead.com'),
    ('prov', 144, 'Comfort Keepers of Bloomington, IN', '8128220145', '', 'stacybruce@comfortkeepers.com'),
    ('prov', 145, 'Arosa Salt Lake', '8015033200', '', 'elaine.sario@arosacare.com'),
    ('prov', 146, 'Visiting Angels', '8018039248', '', 'palexandrov@visitingangels.com'),
    ('prov', 147, 'Right at Home', '8017580630', '', 'frank@rahslc.com'),
    ('prov', 148, 'TheKey - Formerly Home Care Assistance', '3852312154', '', 'angelica.garcia@thekey.com'),
    ('prov', 149, 'Amada Senior Care', '8018933877', '', ''),
    ('prov', 150, 'A Caring Hand', '8012521265', '', ''),
    ('prov', 151, 'ComForCare Home Care Utah', '8014475353', '', ''),
    ('prov', 152, 'Danville Support Services', '8013631521', '', 'm.rochin@danvilleservices.com'),
    ('prov', 153, 'Select Home Care', '8014327500', '', ''),
    ('prov', 154, 'SYNERGY HomeCare', '8019460355', '', 'hrmanagerut01@synergyhomecare.com'),
    ('prov', 155, 'Assisting Hands - Davis', '8014999993', '', 'lbrown@assistinghands.com'),
    ('prov', 156, 'Caregivers', '8123338800', '', ''),
    ('prov', 157, 'AccessiCare Elder Home Care', '8127253843', '', ''),
    ('prov', 158, 'Village Caregiving', '8125511311', '', ''),
    ('prov', 159, 'Homewatch CareGivers', '8017904365', '', ''),
    ('prov', 160, 'Visiting Angels', '8018039248', '', ''),
    ('prov', 161, 'Right at Home', '8017580630', '', ''),
    ('prov', 162, 'A Caring Hand', '8012531265', '', ''),
    ('prov', 163, 'Danville Support Services', '8013631521', '', 'm.rochin@danvilleservices.com'),
    ('prov', 164, 'Select Home Care', '8014327500', '', ''),
    ('prov', 165, 'SYNERGY HomeCare', '8019460355', '', 'hrmanagerut01@synergyhomecare.com'),
    ('prov', 166, 'Assisting Hands - Davis', '8014999993', '', ''),
    ('prov', 167, 'Homewatch CareGivers', '8017904365', '', ''),
    ('prov', 168, 'Comfort Keepers of Bloomington, IN', '8128220145', '', ''),
    ('prov', 169, 'Home Instead', '9302708368', '', ''),
    ('prov', 170, 'Cornerstone Caregiving', '8127141427', '', 'bloomingtonin@cornerstonecaregiving.com'),
    ('prov', 171, 'Paid.care', '8123245958', '', 'info@paid.care'),
    ('prov', 172, 'Alternative Care Solutions', '8126710247', '', 'kellei@altcaresolutions.com'),
    ('prov', 173, 'Comfort Keepers of Bloomington, IN', '8128220145', '', ''),
    ('prov', 174, 'Home Instead', '9302708368', '', ''),
    ('prov', 175, 'Cornerstone Caregiving', '8127141427', '', ''),
    ('prov', 176, 'Paid.care', '8123245958', '', ''),
    ('prov', 177, 'TheKey - Formerly Home Care Assistance', '3852312154', '', ''),
    ('prov', 178, 'Caregivers', '8123338800', '', ''),
    ('prov', 179, 'AccessiCare Elder Home Care', '8127253843', '', ''),
    ('prov', 180, 'Village Caregiving', '8123450014', '', 'bloomington@villagecaregiving.com'),
    ('prov', 181, 'Homewatch CareGivers', '8778369330', '', ''),
    ('prov', 182, 'Homewatch CareGivers', '8778369330', '', ''),
    ('prov', 183, 'Caregivers', '8123338800', '', ''),
    ('prov', 184, 'AccessiCare Elder Home Care', '8127253843', '', ''),
    ('prov', 185, 'Village Caregiving', '8123450014', '', ''),
    ('prov', 186, 'Pre-Health Student Organization', '3172748477', '', 'stuact@iu.edu'),
    ('prov', 187, 'Advising & Major Exploration Services', '8128556768', '', 'ames@iu.edu'),
    ('prov', 188, 'Health Professions Programs Administrative Office', '3172784752', '', 'askhpp@iu.edu'),
    ('prov', 189, 'Career Services & Jobs', '8128556500', '', 'iub.studentcentral@iu.edu'),
    ('prov', 190, 'IU School of Nursing Bloomington Advising', '8128551736', '', 'iubnurse@iu.edu'),
    ('prov', 191, 'Nan Rockey', '8128553717', '', 'junecole@iu.edu'),
    ('prov', 192, 'Emily Wetzel', '8128565126', '', 'ejwetzel@iu.edu'),
    ('prov', 193, 'Undergraduate Career Services', '8128555317', '', 'hirekelley@iu.edu'),
    ('prov', 194, 'Pre-Professional Services', '2199806722', '', ''),
    ('prov', 195, 'Student Involvement and Leadership Center', '8128554682', '', 'sil@iu.edu'),
    ('prov', 196, 'Mentoring Services & Leadership Development', '8128553540', '', 'omsld@iu.edu'),
    ('prov', 197, 'Student Care and Resource Center', '8128562273', '', 'iucare@iu.edu'),
    ('prov', 198, 'Health Professions Programs IU School of Medicine Contact Us', '3172784752', '', 'askhpp@iu.edu'),
    ('prov', 199, 'Sylvia Beaver', '8128552032', '', 'sylbeave@iu.edu'),
    ('prov', 200, 'MarChé Daughtry', '8128552032', '', 'mdaughtr@iu.edu'),
    ('prov', 201, 'Jennifer Lopatin', '8128552032', '', 'jlopatin@iu.edu'),
    ('prov', 202, 'Niki Blackwell', '8128552032', '', 'ncblackw@iu.edu'),
    ('prov', 203, 'School of Public Health-Bloomington Undergraduate Advising', '8128552032', '', 'tericks@iu.edu'),
    ('prov', 204, 'Megan Greene', '8128552032', '', 'greene17@iu.edu src'),
    ('prov', 205, 'Anthony Lanman', '8128552032', '', 'alanman@iu.edu src ↗'),
    ('prov', 206, 'Taylor Erickson', '8128552032', '', 'tericks@iu.edu src'),
    ('prov', 207, 'Office of University & Exploratory Advising', '4357973373', '', 'exploratoryadvising@usu.edu'),
    ('prov', 208, '21st Century Scholars Program', '8128561910', '', 'vcsl@iu.edu'),
    ('prov', 209, 'Office of Student Life', '8128552002', '', 'iub21cs@iu.edu'),
    ('prov', 210, 'Advising and Major Exploration Services', '8128556768', '', 'ames@iu.edu'),
    ('prov', 211, 'Health Professions & Prelaw Advising', '8128551873', '', ''),
    ('prov', 212, 'Career Exploration & Student Employment', '8128555234', '', 'iucareer@iu.edu'),
    ('prov', 213, 'Utah Geriatrics and Gerontology Society', '8012134156', '', 'utahaging@gmail.com'),
    ('prov', 214, 'PrePhysical Therapy', '8015818146', '', 'kayla.bacon@utah.edu'),
    ('prov', 215, 'College Student Council', '8015813414', '', 'utahconsac@gmail.com'),
    ('prov', 216, 'PreMedical - Preprofessional Advising', '8015818146', '', 'kayla.bacon@utah.edu'),
    ('prov', 217, 'RonJai Staton', '4358794736', '', 'ronjai.staton@utahtech.edu'),
    ('prov', 218, 'Marisa Hamblin', '4358794736', '', 'marisa.hamblin@utahtech.edu'),
    ('prov', 219, 'Monique Rubio', '4358794736', '', 'monique.rubio@utahtech.edu'),
    ('prov', 220, 'Sanja Pantovic', '4358794736', '', 'sanja.pantovic@utahtech.edu'),
    ('prov', 221, 'Jake Richins', '4358794736', '', 'jake.richins@utahtech.edu'),
    ('prov', 222, 'Heather Thomas', '4357972926', '', 'heather.thomas@usu.edu'),
    ('prov', 223, 'Alyza Harper', '4357971350', '', 'alyza.harper@usu.edu'),
    ('prov', 224, 'Nursing Advising', '4357972926', '', 'heather.thomas@usu.edu'),
    ('prov', 225, 'Heather Thomas', '4357972926', '', 'heather.thomas@usu.edu'),
    ('prov', 226, 'College of Nursing Undergraduate Advising', '8015813414', '', 'conadvising@utah.edu'),
    ('prov', 227, 'Undergraduate Advisors - College of Health Student Success', '8015818379', '', 'ron.ramsing@health.utah.edu'),
    ('prov', 228, 'Preprofessional Advising Navigate Hub for Exploring Students', '8015878687', '', 'ppa@advising.utah.edu'),
    ('prov', 229, 'College of Health Student Success Undergraduate Advisors', '8015818379', '', 'ron.ramsing@health.utah.edu'),
    ('prov', 230, 'PreProfessional Advising Office', '8015818146', '', 'ppa@advising.utah.edu'),
    ('prov', 231, 'Office of Academic Culture and Community', '8015877672', '', 'somacc@hsc.utah.edu'),
    ('prov', 232, 'Preprofessional Advising', '8015818146', '', 'ppa@advising.utah.edu'),
    ('prov', 233, 'Pre-Health Student Organization', '3172748477', '', 'stuact@iu.edu'),
    ('prov', 234, 'Advising & Major Exploration Services', '8128556768', '', 'ames@iu.edu'),
    ('prov', 235, 'Career Services & Jobs', '8128556500', '', ''),
    ('prov', 236, 'IU School of Nursing Bloomington Advising', '8128551736', '', 'iubnurse@iu.edu'),
    ('prov', 237, 'Nan Rockey', '8128553717', '', 'nlrockey@iu.edu'),
    ('prov', 238, 'Undergraduate Career Services', '8128553717', '', ''),
    ('prov', 239, 'Pre-Professional Services', '2199806722', '', 'dr. ming gao · minggao@iu.edu src ↗'),
    ('prov', 240, 'Student Involvement and Leadership Center', '', '', 'sil@iu.edu'),
    ('prov', 241, 'Mentoring Services & Leadership Development', '8128553540', '', 'omsld@iu.edu'),
    ('prov', 242, 'Student Care and Resource Center', '8128562273', '', 'iucare@iu.edu'),
    ('prov', 243, 'Health Professions Programs IU School of Medicine Contact Us', '', '', 'askhpp@iu.edu'),
    ('prov', 244, 'Sylvia Beaver', '8128552032', '', ''),
    ('prov', 245, 'Office of University & Exploratory Advising', '4357973373', '', ''),
    ('prov', 246, '21st Century Scholars Program', '8128561910', '', 'iub21cs@iu.edu'),
    ('prov', 247, 'Office of Student Life', '8128552002', '', 'vcsl@iu.edu'),
    ('prov', 248, 'Advising and Major Exploration Services', '8128556768', '', 'ames@iu.edu'),
    ('prov', 249, 'Career Exploration & Student Employment', '8128555234', '', 'iucareer@iu.edu'),
    ('prov', 250, 'Utah Geriatrics and Gerontology Society', '8012134156', '', ''),
    ('prov', 251, 'PrePhysical Therapy', '8015818146', '', 'kayla.bacon@utah.edu - vm'),
    ('prov', 252, 'College Student Council', '8015813414', '', 'utahconsac@gmail.com'),
    ('prov', 253, 'PreMedical - Preprofessional Advising', '8015818146', '', ''),
    ('prov', 254, 'Heather Thomas', '4357979684', '', ''),
    ('prov', 255, 'College of Nursing Undergraduate Advising', '8015813414', '', ''),
    ('prov', 256, 'Undergraduate Advisors - College of Health Student Success', '8015818379', '', 'ron.ramsing@health.utah.edu'),
    ('prov', 257, 'Preprofessional Advising Navigate Hub for Exploring Students', '8015878687', '', ''),
    ('prov', 258, 'College of Health Student Success Undergraduate Advisors', '8015818379', '', ''),
    ('prov', 259, 'Office of Academic Culture and Community', '8015877672', '', ''),
    ('prov', 260, 'Commonwise Home Care Charlottesville', '4342028565', '', ''),
    ('prov', 261, 'Touching Hearts at Home Central VA', '5406032626', '', 'jcook@touchinghearts.com'),
    ('prov', 262, 'Commonwise Home Care Charlottesville', '4342028565', '', ''),
    ('prov', 263, 'Home Instead', '4342699012', '', 'homeinstead@532.com'),
    ('prov', 264, 'Kindwell Homecare', '4342022926', '', ''),
    ('prov', 265, 'Visiting Angels', '4342275917', '', 'marilynmfc@visitingangels.com'),
    ('prov', 266, 'Alpha Home Care Services', '4342315592', '', ''),
    ('prov', 267, 'AT Home Care Staffing', '4343274610', '', 'lindsey.wade@athomecarestaffing.com'),
    ('prov', 268, 'Loving Arms Care', '4349649431', '', 'dawnjones@lovingarmscareinc.com'),
    ('prov', 269, 'Eleos Home Care', '4343366123', '', ''),
    ('prov', 270, 'Providential Homecare', '4343289472', '', ''),
    ('prov', 271, 'Home Instead', '4349794663', '', 'ashley.james@homeinstead.com'),
    ('prov', 272, 'AT Home Care Staffing', '2857142857', '', 'lindsey.wade@athomecarestaffing.com'),
    ('prov', 273, 'Providential Homecare', '4343289472', '', ''),
    ('prov', 274, 'Touching Hearts at Home Central VA', '5406032626', '', ''),
    ('prov', 275, 'Commonwise Home Care Charlottesville', '4342028565', '', ''),
    ('prov', 276, 'Kindwell Homecare', '4342022926', '', ''),
    ('prov', 277, 'Visiting Angels', '4342275917', '', ''),
    ('prov', 278, 'Alpha Home Care Services', '4342315592', '', ''),
    ('prov', 279, 'Loving Arms Care', '4349649431', '', ''),
    ('prov', 280, 'Eleos Home Care', '4343366123', '', ''),
    ('prov', 281, 'SYNERGY HomeCare', '8019460355', '', ''),
    ('prov', 282, 'Cornerstone Caregiving', '8127141427', '', ''),
    ('prov', 283, 'Providential Homecare', '8049242118', '', ''),
    ('prov', 284, 'Career Exploration & Student Employment', '8128555234', '', ''),
    ('prov', 285, 'Caregivers', '8123338800', '', ''),
    ('prov', 286, 'Touching Hearts at Home Central VA', '5406032626', '', ''),
    ('prov', 287, 'Commonwise Home Care Charlottesville', '4342028565', '', 'info@commonwisecare.com'),
    ('prov', 288, 'Kindwell Homecare', '4342022926', '', 'kindwellhomecare@outlook.com'),
    ('prov', 289, 'Visiting Angels', '4342275917', '', 'marilynmfc@visitingangels.com'),
    ('prov', 290, 'Alpha Home Care Services', '4342315592', '', ''),
    ('prov', 291, 'Eleos Home Care', '4343366123', '', ''),
    ('prov', 292, 'Loving Arms Care', '4349649431', '', ''),
    ('prov', 293, 'Touching Hearts at Home Central VA', '5406032626', '', ''),
    ('prov', 294, 'Brennan Gourley', '4349248900', '', ''),
    ('prov', 295, 'Pre-Health Advising', '4349248900', '', ''),
    ('prov', 296, 'Home Instead', '4349794663', '', ''),
    ('prov', 297, 'AT Home Care Staffing', '2857142857', '', ''),
    ('prov', 298, 'FirstLight Home Care', '4809222820', '', 'scottsdale@firstlighthomecare.com'),
    ('prov', 299, 'Home For Me Home Care', '4805998529', '', ''),
    ('prov', 300, 'Synergy HomeCare', '4806597771', '', ''),
    ('prov', 301, 'Connections In Home Care & Communities', '6027088626', '', ''),
    ('prov', 302, 'Abloom Health Care', '4805900020', '', ''),
    ('prov', 303, 'Griswold Home Care', '4803050131', '', ''),
    ('prov', 304, 'PrimeCare Home Solutions', '6026330738', '', ''),
    ('prov', 305, 'Home Instead', '6237773637', '', 'blair.sateta@homeinstead.com'),
    ('prov', 306, 'DailyCare Non-Medical Homecare Agency', '4803602825', '', ''),
    ('prov', 307, 'Amada Senior Care', '6232272100', '', 'amadaphoenixwestrecruiting@gmail.com'),
    ('prov', 308, 'FirstLight Home Care of Sun City', '6232017716', '', 'bhodges@firstlighthomecare.com'),
    ('prov', 309, 'Preferred Homecare', '4802851192', '', 'heather.owens@preferredhomecare.com'),
    ('prov', 310, 'Like Family Home Care', '4805429333', '', 'info@likefamilyhomecareaz.com'),
    ('prov', 311, 'Phoenician Home Care', '4807149883', '', ''),
    ('prov', 312, 'Homewatch CareGivers of Phoenix', '6023133991', '', 'ronnclark@homewatchcaregivers.com'),
    ('prov', 313, 'Salkeld Home Care Agency *call tab olera*', '8554024445', '', ''),
    ('prov', 314, 'Hart2Heart', '4805006298', '', ''),
    ('prov', 315, 'Visiting Angels', '6232669304', '', 'april.visitingangelsaz@gmail.com'),
    ('prov', 316, 'TheKey - Formerly Home Care Assistance', '5202773766', '', ''),
    ('prov', 317, 'Signature Home Care', '6232824143', '', ''),
    ('prov', 318, 'Abrio Home Care Phoenix', '6029563817', '', 'sbree@abrioservices.com'),
    ('prov', 319, 'ITC Personal In-Home Care', '1748960875', '', 'admin@pathwaysforlife.care'),
    ('prov', 320, 'Home Instead', '9284824881', '', 'hr195@homeinstead.com'),
    ('prov', 321, 'Right at Home', '6235470700', '', ''),
    ('prov', 322, 'Visiting Angels', '4808338247', '', 'hr@visitingangelsaz.com'),
    ('prov', 323, 'Right At Home', '6238782885', '', ''),
    ('prov', 324, 'Doves at Home Senior Care', '2545352419', '', ''),
    ('prov', 325, 'Affordable Home Care Solutions', '4804518183', '', ''),
    ('prov', 326, 'A Caring Hand for Mom', '8008817706', '', ''),
    ('prov', 327, 'ComForCare Home Care', '6024381300', '', 'csullivan@comforcare.com'),
    ('prov', 328, 'Goldstar Homecare', '6023217177', '', 'rebeccar@goldstar-homecare.com'),
    ('prov', 329, 'Simple Living Assisted Home Care', '6232726459', '', ''),
    ('prov', 330, 'Thrive Home Care Services', '4808470887', '', ''),
    ('prov', 331, 'SYNERGY HomeCare of the West Valley', '6232461000', '', 'orlonda@westvalleyhomecare.com'),
    ('prov', 332, 'HomeWell Care Services', '4806298322', '', 'mroley@homewellcares.com'),
    ('prov', 333, 'Assisting Hands Home Care-North Phoenix', '6023745775', '', 'kestia@assistinghands.com'),
    ('prov', 334, 'Bayada Assistive Care', '8882536197', '', 'jmcfeeley@bayada.com'),
    ('prov', 335, 'ITC Personal In-Home Care', '1748960875', '', ''),
    ('prov', 336, 'Blessings for Seniors Companion Care', '6235940819', '', 'info@blessingsforseniors.com'),
    ('prov', 337, 'Freedomcare - Arizona', '8887302654', '', ''),
    ('prov', 338, 'Sunland Home Care', '4804478893', '', ''),
    ('prov', 339, 'Visiting Angels', '4804518800', '', 'jehrhardt@averyangels.com'),
    ('prov', 340, 'HomeWell Care Services', '8883990309', '', 'sharon.szayer@arizonahealthacademy.org'),
    ('prov', 341, 'Gentiva Personal Care', '8884368482', '', ''),
    ('prov', 342, 'Care for All Phoenix', '6237779267', '', 'careforallllc@gmail.com'),
    ('prov', 343, 'Home Instead', '6026031725', '', 'centralphoenix@homeinstead.com'),
    ('prov', 344, 'Urgent Home Care Inc.', '6026879625', '', 'carmenmuhc@outlook.com'),
    ('prov', 345, 'Comfort Keepers of Chandler', '4805736525', '', 'wardck617@gmail.com'),
    ('prov', 346, 'Caring Hearts In Home Care', '6234404047', '', ''),
    ('prov', 347, 'All Valley Home Health Care & Nursing', '6239773977', '', 'jmule@allvalleycare.com'),
    ('prov', 348, 'A Z BEST HOME HEALTH INC', '4804187400', '', ''),
    ('prov', 349, 'Abrio Home Care Mesa', '4809304881', '', ''),
    ('prov', 350, 'Living Free Homecare', '4804429667', '', 'john@livingfreehomecare.com'),
    ('prov', 351, 'A Place At Home - Maricopa County', '1740692094', '', ''),
    ('prov', 352, 'My Priority Home Care', '6023763485', '', 'info@mypriorityhomecare.com'),
    ('prov', 353, 'Comfort-N-Home', '6023183310', '', ''),
    ('prov', 354, 'Amada Senior Care', '4809995250', '', 'amadacares@amadaseniorcare.com'),
    ('prov', 355, 'Right At Home', '6235470700', '', ''),
    ('prov', 356, 'Senior Helpers', '4804856486', '', 'nhenry@seniorhelpers.com'),
    ('prov', 357, 'Visiting Angels', '6234767882', '', 'mfoyle@visitingangels.com'),
    ('prov', 358, 'No Place Like Home Care', '4804008824', '', ''),
    ('prov', 359, 'Always Best Care Senior Services', '4803045625', '', ''),
    ('prov', 360, 'Sonora Home Health', '4809701328', '', ''),
    ('prov', 361, 'I Need An Angel', '4809514083', '', 'hello@ineedanangel.com'),
    ('prov', 362, 'Always Best Care Senior Services )', '4804993112', '', ''),
    ('prov', 363, 'ComForCare Home Care & Care Management (NW Valley)', '6239342722', '', ''),
    ('prov', 364, 'Homewatch CareGivers of East Valley', '4807127611', '', 'dbutas@hwcg.com'),
    ('prov', 365, 'Valley of the Sun Homecare', '4802645252', '', 'suzette@valleyofthesunhomecare.com'),
    ('prov', 366, 'Compassionate Home Care', '6235477521', '', ''),
    ('prov', 367, 'Adultcare Assistance Homecare', '6024551118', '', 'office@adultcareassistance.com'),
    ('prov', 368, 'Arion Care Solutions', '4807221300', '', ''),
    ('prov', 369, 'Tender Heart Home Care', '4807194444', '', 'info@tenderhearthomecare.com'),
    ('prov', 370, 'FirstLight Home Care of Goodyear', '6232328851', '', ''),
    ('prov', 371, 'Always Best Care Senior Services', '4805221054', '', ''),
    ('prov', 372, 'Good Neighbor Support Services', '6239324878', '', 'jaranda@gncares.com - the business manager'),
    ('prov', 373, 'Homewell Care Services', '6232656300', '', 'infoaz183@homewellcares.com'),
    ('prov', 374, 'Preferred Care at Home of Southeast Valley', '4805367726', '', 'sevalley@preferhome.com'),
    ('prov', 375, 'Cypress HomeCare Solutions', '6028786212', '', 'jennifer@cypresshomecare.com'),
    ('prov', 376, 'Endeavor In Home Care - Mesa', '4804982324', '', ''),
    ('prov', 377, 'Right at Home', '4806321100', '', ''),
    ('prov', 378, 'Home Instead', '6232239215', '', 'surpriseaz@homeinstead.com'),
    ('prov', 379, 'Golden Heart Senior Care', '4802847360', '', 'info@goldenheartscottsdale.com'),
    ('prov', 380, 'Compassionate Assistance', '4804682699', '', 'christine@compassionateassistance.com'),
    ('prov', 381, 'A Caring Solution Home Care', '6022642086', '', ''),
    ('prov', 382, 'Touching Hearts at Home', '6232079391', '', ''),
    ('prov', 383, 'Senior Helpers', '4806927433', '', 'jdevary@seniorhelpers.com'),
    ('prov', 384, 'TheKey - Formerly Home Care Assistance', '3852312154', '', ''),
    ('prov', 386, 'Like Family Home Care', '4805429333', '', 'tanyamahler@likefamilyhomecareaz.com'),
    ('prov', 387, 'A Plus Home Health Care', '4809176994', '', 'usman@aplushhs.com'),
    ('prov', 388, 'Leading Edge Senior Care', '4806185995', '', ''),
    ('prov', 390, 'Aging In Place', '2175314663', '', ''),
    ('prov', 391, 'SYNERGY HomeCare', '2173180268', '', 'sarahburkhardt@synergyhomecare.com'),
    ('prov', 392, 'Assisting Hands Home Care - Gilbert, Mesa, Queen Creek & Surrounding Areas', '', '', 'gilbertoffice@assistinghands.com'),
    ('prov', 393, 'All Ways Caring HomeCare - Champaign, IIllinois', '', '', ''),
    ('prov', 394, 'Help at Home', '2174469740', '', ''),
    ('prov', 395, 'Presence Home Care', '2173554120', '', ''),
    ('prov', 396, 'Home Instead', '2173182883', '', 'sarah.robbins@homeinstead.com'),
    ('prov', 397, 'Addus HomeCare', '2173561121', '', 'info1@addus.com'),
    ('prov', 398, 'R. Angell''s Homecare Services', '2173776018', '', ''),
    ('prov', 989, 'Comfort Keepers Home Care', '3528553793', '', 'donnaosteen@comfortkeepers.com'),
    ('partner', 2, 'Graduate Advising', '8506443296', '', ''),
    ('partner', 3, 'Pre-Nursing Advising · Florida State University · Advising Office · Pre-Nursing Advisor (Jacqueline Hare)', '8506443296', '', ''),
    ('partner', 4, 'The Career Center', '8506446431', '', ''),
    ('partner', 5, 'Academic Advising (Dean''s Office)', '8506441081', '', 'hathey@fsu.edu'),
    ('partner', 6, 'Undergraduate Academic Advising', '8506445470', '', 'cosspp-advising@fsu.edu'),
    ('partner', 7, 'Pre-Health Advising (Meredith Gellepis)', '8506447678', '', 'imsadvising@med.fsu.edu'),
    ('partner', 8, 'University of Florida Honors Program Advising Office (Meredith Beaupre )', '3523921519', '', 'advisor@honors.ufl.edu'),
    ('partner', 9, 'Pre-Health Advising Office', '3523921521', '', 'prehealth@advising.ufl.edu'),
    ('partner', 10, 'Department of Kinesiology · University of Wisconsin-Madison · Dept Head · Professor, Department Chairperson (Dr. Andrea Mason )', '6082629904', '', ''),
    ('partner', 11, 'Department of Integrative Biology · University of Wisconsin-Madison · Dept Head · Professor (Dr. Lauren Riters )', '', '', ''),
    ('partner', 12, 'Department of Medicine · University of Wisconsin-Madison · Dept Head · George R. and Elaine Love Professor and chair of the Department of Medicine (Dr. Lynn Schnapp )', '', '', ''),
    ('partner', 13, 'Center for Pre-Health Advising', '6082636614', '', ''),
    ('partner', 14, 'U Career Success', '8015878687', '', ''),
    ('partner', 15, 'Student Success Center for College of Health Undergraduate Advisors', '8015818379', '', ''),
    ('partner', 16, 'U Career Success', '6082636614', '', ''),
    ('partner', 17, 'Student Success Center for College of Health Undergraduate Advisors', '8015818379', '', ''),
    ('partner', 18, 'Student Success Center for College of Health Undergraduate Advisors', '8015818379', '', ''),
    ('partner', 19, 'Brennan Gourley', '4349248900', '', ''),
    ('partner', 20, 'Brennan Gourley', '4349248900', '', ''),
    ('partner', 21, 'UVA Career Center', '4349248900', '', ''),
    ('partner', 22, 'Pre-Health Advising', '4349248900', '', ''),
    ('partner', 23, 'The Career Center', '2173330820', '', ''),
    ('partner', 24, 'ASU Career Services', '4809652350', '', ''),
    ('partner', 25, 'Pre-Health Advising', '6024963300', '', ''),
    ('partner', 26, 'Casey Dozier', '8506448315', '', 'casey.dozier@fsu.edu src ↗'),
    ('partner', 27, 'PrePhysical Therapy', '8015815020', '', 'info@disability.utah.edu'),
    ('partner', 28, 'College Student Council', '8015813414', '', 'admissions@nurs.utah.edu'),
    ('partner', 29, 'Utah Geriatrics and Gerontology Society', '8012134156', '', ''),
    ('partner', 30, 'Preprofessional Advising Navigate Hub for Exploring Students', '8015878687', '', 'careersuccess@utah.edu'),
    ('partner', 31, 'June Coleman', '8128553717', '', 'junecole@iu.edu'),
    ('partner', 32, 'Medical Admissions Preparatory Program (MAPP)', '8015877672', '', 'eric.warner@hsc.utah.edu'),
    ('partner', 33, 'Anesthesia SIG', '8128562273', '', 'iucare@iu.educ'),
    ('partner', 34, 'Health Professions Programs IU School of Medicine Contact Us', '3174916969', '', 'nbrehl@iu.edu'),
    ('partner', 35, 'Kori Renn', '8128555317', '', 'hirekelley@iu.edu'),
    ('partner', 36, 'Eric Warner', '8015877672', '', 'eric.warner@hsc.utah.edu'),
    ('partner', 37, 'Asian Pacific American Medical Student Association (APAMSA)', '', '', '');

-- Normalise the directory once. This is the only full scan.
DROP TABLE IF EXISTS _dir;
CREATE TEMP TABLE _dir AS
SELECT
  x.provider_id,
  lower(regexp_replace(coalesce(x.provider_name,''), '\s+', ' ', 'g')) AS name_key,
  lower(btrim(coalesce(x.email,'')))                                   AS email_key,
  CASE WHEN length(x.d) = 11 AND left(x.d,1) = '1' THEN right(x.d,10) ELSE x.d END AS phone
FROM (
  SELECT provider_id, provider_name, email,
         regexp_replace(coalesce(phone,''), '\D', '', 'g') AS d
    FROM "olera-providers"
   WHERE deleted IS NULL OR deleted = false
) x;

CREATE INDEX ON _dir (phone);
CREATE INDEX ON _dir (email_key);
CREATE INDEX ON _dir (name_key);
ANALYZE _dir;

DROP TABLE IF EXISTS _onboard;
CREATE TEMP TABLE _onboard AS
SELECT DISTINCT so.research_data->>'olera_provider_id' AS provider_id
  FROM student_outreach so
 WHERE so.kind = 'provider'
   AND so.research_data->>'olera_provider_id' IS NOT NULL;
CREATE INDEX ON _onboard (provider_id);
ANALYZE _onboard;

-- Four indexed lookups instead of one un-indexable OR.
DROP TABLE IF EXISTS _hits;
CREATE TEMP TABLE _hits AS
  SELECT s.tab, s.row_no, d.provider_id
    FROM _sheet s JOIN _dir d ON d.phone = s.phone
   WHERE s.phone <> ''
UNION
  SELECT s.tab, s.row_no, d.provider_id
    FROM _sheet s JOIN _dir d ON d.phone = s.phone2
   WHERE s.phone2 <> ''
UNION
  SELECT s.tab, s.row_no, d.provider_id
    FROM _sheet s JOIN _dir d ON d.email_key = s.email
   WHERE s.email <> ''
UNION
  SELECT s.tab, s.row_no, d.provider_id
    FROM _sheet s JOIN _dir d
      ON d.name_key = lower(regexp_replace(s.name, '\s+', ' ', 'g'))
   WHERE s.phone = '' AND s.phone2 = '' AND s.email = '';

DROP TABLE IF EXISTS _verdict;
CREATE TEMP TABLE _verdict AS
SELECT
  s.tab,
  s.row_no,
  s.name,
  CASE WHEN s.phone = '' THEN '(none)' ELSE left(s.phone,3) END AS area,
  count(h.provider_id)                              AS candidates,
  count(*) FILTER (WHERE o.provider_id IS NOT NULL) AS on_board
FROM _sheet s
LEFT JOIN _hits    h ON h.tab = s.tab AND h.row_no = s.row_no
LEFT JOIN _onboard o ON o.provider_id = h.provider_id
GROUP BY s.tab, s.row_no, s.name, s.phone;

WITH block1 AS (
  SELECT
    '1 outcome'::text AS section,
    (CASE
       WHEN on_board = 1   THEN 'matched one — overlay it'
       WHEN on_board > 1   THEN 'matched several — needs a tie-break'
       WHEN candidates > 0 THEN 'in directory only — not on any board'
       ELSE                     'no match — would be lost'
     END)::text AS label,
    tab::text   AS detail,
    count(*)    AS n
  FROM _verdict GROUP BY 1,2,3
),
block2 AS (
  SELECT
    '2 unmatched by area code'::text,
    area::text,
    (CASE area
       WHEN '801' THEN 'Salt Lake City'     WHEN '385' THEN 'Salt Lake City'
       WHEN '435' THEN 'Utah, outside SLC'  WHEN '480' THEN 'Phoenix east'
       WHEN '602' THEN 'Phoenix'            WHEN '623' THEN 'Phoenix west'
       WHEN '928' THEN 'Arizona'            WHEN '520' THEN 'Tucson'
       WHEN '608' THEN 'Madison'            WHEN '850' THEN 'Tallahassee'
       WHEN '352' THEN 'Gainesville'        WHEN '812' THEN 'Bloomington'
       WHEN '434' THEN 'Charlottesville — University of Virginia, not one of the six'
       WHEN '540' THEN 'Virginia'           WHEN '217' THEN 'Champaign, Illinois'
       WHEN '317' THEN 'Indianapolis'       WHEN '414' THEN 'Milwaukee'
       WHEN '(none)' THEN 'no phone anywhere on the row'
       ELSE 'elsewhere' END)::text,
    count(*)
  FROM _verdict WHERE on_board = 0 GROUP BY area
),
block3 AS (
  SELECT
    '3 tie to break'::text,
    left(name, 44)::text,
    (on_board || ' records share this number')::text,
    on_board
  FROM _verdict WHERE on_board > 1
)
SELECT * FROM block1
UNION ALL SELECT * FROM block2
UNION ALL SELECT * FROM block3
ORDER BY 1, 4 DESC, 2;
