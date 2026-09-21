-- ===========================================================================
-- Step 2a — load the spreadsheet into a staging table and resolve matches
-- ===========================================================================
-- WRITES, but only ever to one new table: medjobs_migration_staging. No
-- existing table is read-modified. Nothing on the board changes here.
--
-- The staging table is deliberately a real table rather than a temp one.
-- It is the audit trail: after the overlay runs you can ask of any record
-- "which spreadsheet row produced this, and what did it say", and get an
-- answer. Drop it when the migration is signed off.
--
-- Two things happen:
--   1. all 432 worked rows land verbatim — name, phones, email, the
--      EMAIL SENT date and every call date with its remark
--   2. each row is matched against the directory once, and the result is
--      stored on the row
--
-- Matching is resolved ONCE and written down, rather than recomputed by
-- the plan and again by the apply. That is what makes the preview
-- trustworthy: both read the same stored answer, so they cannot disagree.
--
-- Re-runnable: it drops and rebuilds the staging table.
-- ===========================================================================

DROP TABLE IF EXISTS medjobs_migration_staging;

CREATE TABLE medjobs_migration_staging (
  id            SERIAL PRIMARY KEY,
  tab           TEXT NOT NULL,
  row_no        INT  NOT NULL,
  sheet_name    TEXT,
  phone         TEXT,
  phone2        TEXT,
  email         TEXT,
  email_sent    DATE,
  call1 DATE, remark1 TEXT,
  call2 DATE, remark2 TEXT,
  call3 DATE, remark3 TEXT,
  call4 DATE, remark4 TEXT,
  -- filled in by the resolve step below
  -- The directory row this sheet row matched, whether or not anybody has
  -- a record for it. Kept separate from matched_provider_id, which means
  -- something narrower: matched AND already on a campus board.
  dir_provider_id     TEXT,
  matched_provider_id TEXT,
  candidates          INT,
  outreach_id         UUID,
  campus_slug         TEXT,
  plan_action         TEXT,
  plan_step           INT,
  plan_round          INT,
  plan_reason         TEXT
);

INSERT INTO medjobs_migration_staging
  (tab, row_no, sheet_name, phone, phone2, email, email_sent,
   call1, remark1, call2, remark2, call3, remark3, call4, remark4)
VALUES
    ('prov', 2, 'Unique In Home Personal Care', '2845877800', '6086402720', NULL, NULL, DATE '2026-06-25', 'Called — no answer.', DATE '2026-06-26', 'called - no asnwer. ring for 2 mins', DATE '2026-06-29', 'call attempt 3 - No answer. The phone has been ringing for 3 minutes. The phone number i called is 608-640-2720', DATE '2026-06-30', 'call attempt 3: the phone has been ringing for 3 minutes but no one answered.'),
    ('prov', 3, 'Morgan''s Caring Connection', '6085989665', '', NULL, NULL, DATE '2026-06-25', 'Called — voicemail / message left.', DATE '2026-06-26', 'Called — voicemail / message left.', DATE '2026-06-29', 'Call attempt 3. routed to VM. Left message.', DATE '2026-06-30', 'call attempt 3: Directly routed to vm.'),
    ('prov', 4, 'Right at Home', '6088507335', '', 'erin.mckenna@rahmadison.com', DATE '2026-06-29', DATE '2026-06-25', 'The email is erin.mckenna@rahmadison.com (Erin, the care manager) . I Talked to Sarah, the coordinator.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 5, 'Senior Services Plus Health', '6087575940', '', NULL, NULL, DATE '2026-06-25', 'Called — voicemail / message left', DATE '2026-06-26', 'Called — voicemail / message left', DATE '2026-06-29', 'call attempt 3 : NO one answered the phone.', DATE '2026-06-30', 'call attempt 3 : no answer'),
    ('prov', 6, 'Always Best Care Of Madison', '6083152378', '', 'dogunnoiki@abc-seniors.com', DATE '2026-06-29', DATE '2026-06-25', 'Email of David- the administrator is dogunnoiki@abc-seniors.com. I talked to Tutu, she said, David is also one of the decision-makers.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 7, 'Agape Senior Services', '6088411004', '', NULL, NULL, DATE '2026-06-25', 'Called — no answer.', DATE '2026-06-26', 'the number i have dialled is busy. as per the operator.', DATE '2026-06-29', 'The number I have dialed is busy. No answer.', NULL, NULL),
    ('prov', 8, 'Cornerstone Caregiving - Madison Home Care', '6085995440', '', 'madisonwi@cornerstonecaregiving.com', DATE '2026-06-29', DATE '2026-06-25', 'Talked to Brandon, the administrator and one of the decision maker. His email is madisonwi@cornerstonecaregiving.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 9, 'Visiting Angels', '6088190665', '', 'tteske@visitingangels.com', DATE '2026-06-29', DATE '2026-06-25', 'Called — no answer', DATE '2026-06-26', 'Talked to Ashely, she gave me Tracy''s email tteske@visitingangels.com. Tracy is the Director', NULL, NULL, NULL, NULL),
    ('prov', 10, 'Comfort Keepers In-Home Senior Care of Madison', '6089270611', '', NULL, NULL, DATE '2026-06-25', 'Called — voicemail / message left', DATE '2026-06-26', 'Called — voicemail / message left', DATE '2026-06-29', 'call attempt 3 : Was routed to the owner''s vm .', NULL, NULL),
    ('prov', 11, 'Home Instead', '6085713064', '', 'mwright@ckmadison.com', DATE '2026-06-29', DATE '2026-06-25', 'was able to talked to Beka, she gave me Mike''s email, whom is the supervisor. Email is mwright@ckmadison.co', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 12, 'Village Caregiving', '4146261732', '', NULL, NULL, DATE '2026-06-25', 'Called — no answer', DATE '2026-06-26', 'Called — voicemail / message left', DATE '2026-06-29', 'call attempt 3 :left message', NULL, NULL),
    ('prov', 13, 'Good People - Live in Caregivers', '6086091620', '', NULL, NULL, DATE '2026-06-25', 'Called — voicemail / message left.', DATE '2026-06-26', 'Called — voicemail / message left', DATE '2026-06-29', 'call attempt 3 - vm', DATE '2026-06-30', 'call attempt 3 : vm / left message'),
    ('prov', 14, 'Serenity Hearts Home Care', '6082306519', '', NULL, NULL, DATE '2026-06-25', 'Called — no answer', DATE '2026-06-26', 'Called — voicemail / message left', DATE '2026-06-29', 'call attempt 3 : vm', DATE '2026-06-30', 'call attempt 3: vm / left message'),
    ('prov', 15, 'Home Instead', '6088869210', '', 'abigail.davidson@homeinstead.com', DATE '2026-06-29', DATE '2026-06-25', 'was able to talk to jasmine, and she gave me Abigail''s email abigail.davidson@homeinstead.com . Abigail is the administrator.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 16, 'Village Caregiving', '3049625877', '', 'charliehupp@villagecaregiving.com', DATE '2026-06-29', DATE '2026-06-25', 'Was able to talk to Charlie , one of the staff, and he gave his email charliehupp@villagecaregiving.com which he then said that he will just forward it to his executive director.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 17, 'Full Spectrum Health Services', '6082373550', '', 'contact@fshcare.com', NULL, DATE '2026-06-25', 'was able to talk to B. and gave me the email contact@fshcare.com ,but when checked, the email is invalid. B, repeatedly said that it is the same email that they are using in receiving information or inquiries.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 18, 'Sunprime Homecare', '2025384712', '', 'sunprimehc@gmail.com', DATE '2026-06-29', DATE '2026-06-25', 'Was able to talk to Ousman, the administrator, and gave the email sunprimehc@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 19, 'Senior Helpers', '6087295365', '', 'tanyas@seniorhelpers.com', DATE '2026-06-29', DATE '2026-06-25', 'Was able to talk to Brooke, and gave me Tanya''s email tanyas@seniorhelpers.com , Tanya is the Executive Director.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 20, 'Home Care, Recharged', '3525657155', '', 'carecoordinator@homecarerecharged.com', DATE '2026-06-29', DATE '2026-06-26', 'Was able to talk with Leah, the care coordinator and her email is carecoordinator@homecarerecharged.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 21, 'Granny Nannies of Gainesville', '3523273877', '', 'gainesville@grannynannies.com', NULL, DATE '2026-06-26', 'directly routed to vm, but mailbox is full. Was not able to left a message.', DATE '2026-06-29', 'directly routed to vm, but mailbox is full. Was not able to left a message.', DATE '2026-06-30', 'call attempt 3 : Was able to talk with Jackie, she gave email gainesville@grannynannies.com', NULL, NULL),
    ('prov', 22, 'Home by Choice', '3523764024', '', NULL, NULL, DATE '2026-06-26', 'Was able to talk to Sally and she said they''re not interested', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 23, 'Touching Hearts At Home', '3522253727', '', 'c.ramos@touchinghearts.com', DATE '2026-06-29', DATE '2026-06-26', 'Was able to talk to Alexis, she gave Christina''s email c.ramos@touchinghearts.com . Christina is the executive director.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 24, 'Visiting Angels', '3523722000', '', 'bcombs@visitingangels.com', DATE '2026-06-29', DATE '2026-06-26', 'Was able to talk with Lynn, she gave me William''s email, bcombs@visitingangels.com. William is the owner. Also confirmed the physical address .', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 25, 'Guardian Home Care', '3525546091', '', NULL, NULL, DATE '2026-06-26', 'Was able to talk with Kyla but she is not interested.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 26, 'Home Instead', '3526642789', '', NULL, NULL, DATE '2026-06-26', 'Was able to talk to Cheryl but she only get our contact number and maybe will call or text us. She refuse to give her email or emails of one of the decision makers.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 27, 'Visiting Angels', '3526208484', '', 'k.anderson@visitingangels.com', DATE '2026-06-29', DATE '2026-06-26', 'Was able to talk with Kara, the recruitment specialist. She gave her email k.anderson@visitingangels.com.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 28, 'Community Companion Care', '3528541358', '', 'communitycompanioncare@cox.net', NULL, DATE '2026-06-26', 'was able to talk to Jacky, but unfortunately, the owner or the decision maker is not present. Will have to call back next week.', DATE '2026-06-29', 'The email provided is communitycompanioncare@cox.net but she said that they are a non-medical agency.', NULL, NULL, NULL, NULL),
    ('prov', 29, 'ElderCare of Alachua County', '3522659040', '', NULL, NULL, DATE '2026-06-26', 'no answer. The phone has been ringing for 2 minutes.', NULL, 'No answer. The phone has been ringing for 2 minutes. The operator is still assisting other callers.', NULL, NULL, NULL, NULL),
    ('prov', 30, 'Comfort Keepers Home Care', '3528553793', '', NULL, NULL, DATE '2026-06-26', 'Linda is not available to take the call. Left a voicemail message.', DATE '2026-06-29', 'no one is available to take the call.', NULL, NULL, NULL, NULL),
    ('prov', 31, 'Alternative Care', '3526818993', '', NULL, NULL, DATE '2026-06-26', '"THE NUMBER YOU HAVE DIALLED DOES NOT EXIST OR IS NO LONGER IN SERVICE" AS PER THE OPERATOR.', NULL, 'vm', NULL, NULL, NULL, NULL),
    ('prov', 32, 'Viceroy Home Health', '3522816727', '', NULL, NULL, DATE '2026-06-26', 'Was able to talk to Mara but she only get our contact number.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 33, 'Comfort Keepers Home Care', '3525583414', '', 'lindadaniels@comfortkeepers.com', DATE '2026-06-29', DATE '2026-06-26', 'Was able to talk to Gywnn but she transferred me to Donna , the recruitment specialist. Was routed to DOnna''s vm.', DATE '2026-06-29', 'was able to talk to Linda, the HR specialist- her email is lindadaniels@comfortkeepers.com . She''ll be waiting for our emails for the full details.', NULL, NULL, NULL, NULL),
    ('prov', 34, 'Miracle Hands healthcare', '3523552121', '', 'zsewell@mymiraclehands.net', DATE '2026-06-29', DATE '2026-06-26', 'Was able to speak with Zarria, the office cleark. She gave me her email zsewell@mymiraclehands.net and will forward it to the executive director.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 35, 'Mederi Private Care', '3525548023', '', 'jamee.tetstone@lhcgroup.com', DATE '2026-06-29', DATE '2026-06-26', 'Was able to talk to Tymbre and she gave me Jamee''s email jamee.tetstone@lhcgroup.com .She is one of the decision makers.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 36, 'Concierge Care - Gainesville', '3523203657', '', NULL, NULL, DATE '2026-06-26', 'someone answer the call but did not speak a word then hangs up. Dialed the number twice but do the same thing.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 37, 'My Home Sweet Home', '3525541127', '', NULL, NULL, DATE '2026-06-26', 'voicemail left message.', DATE '2026-06-29', 'call attempt 2 : the staff answered the call but she hangs up. Dialed twice', NULL, NULL, NULL, NULL),
    ('prov', 38, 'Ocala Caregivers', '3524010040', '', NULL, NULL, DATE '2026-06-26', 'the number does not exist and is no longer in service.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 39, 'Ovation Home Care', '3525711163', '', 'brent@ovationhomecare.com // marylin@ovationhomecare.com', DATE '2026-06-29', DATE '2026-06-29', 'Talked with Laurie, she gave me the owner''s email brent@ovationhomecare.com and the executive admin marylin@ovationhomecare.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 40, 'Embrace Group Home', '3523368198', '', NULL, NULL, DATE '2026-06-29', 'number is disconnected', DATE '2026-06-30', 'call attempt 2 : the number is disconnected --- as per google, this facility is temporarily closed.', NULL, NULL, NULL, NULL),
    ('prov', 41, 'Comfort Keepers of Tallahassee, FL', '8504272273', '', 'jennifer.adams@ckcoastalfl.com', NULL, DATE '2026-06-30', 'Was able to talk to Mary - She gave me email of Jennifer Adams, the assistant general manager - jennifer.adams@ckcoastalfl.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 42, 'Standard Home-Care Providers', '8665574272', '', NULL, NULL, DATE '2026-06-30', 'call attempt 1 : routed to vm.', DATE '2026-07-07', 'BRENT NOT INTERESTED', NULL, NULL, NULL, NULL),
    ('prov', 43, 'Care First Private Home Health Care', '8502128783', '', NULL, NULL, DATE '2026-06-30', 'the staff refuse to provide her name and email and said she''s not interested about the program for now.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 44, 'Right At Home Tallahassee', '8507654701', '', NULL, NULL, DATE '2026-06-30', 'the staff refuse to give name and the owner''s email, saying she cannot provide any information without the owner''s consent then hangs up.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 45, 'Visiting Angels (Florida State University · Provider)', '8503206062', '', NULL, NULL, DATE '2026-06-30', 'call attempt 1: the staff refuse to provide the email of their facility , only get our contact number so she can forward it to one of her boss , and might call us back if they''re interested.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 46, 'Heaven Sent Elderly Care Services', '8509996527', '', NULL, NULL, DATE '2026-06-30', 'call attempt 1 : vm / left message', DATE '2026-07-01', 'call attempt 2 : The staff said she''s not interested for the said program.', NULL, NULL, NULL, NULL),
    ('prov', 47, 'Hopewell In-Home Senior Care', '8503865552', '', 'shae@hopewellcare.com', NULL, DATE '2026-06-30', 'call attempt1 : was able to speak with Shae and her email is shae@hopewellcare.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 48, 'Caring Connections Senior Care', '8503545336', '', NULL, NULL, DATE '2026-06-30', 'call attempt1 : was able to speak with Jordan and said no for now.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 49, 'Tallahassee Living Center', '8509429868', '', 'mwalker@aviatahg.com', DATE '2026-07-03', DATE '2026-06-30', 'call attempt 1 : routed to vm', DATE '2026-07-01', 'call attempt 2 : Was able to speak with Linda and she gave me email mwalker@aviatahg.com - The email of their administrator.', NULL, NULL, NULL, NULL),
    ('prov', 50, 'Guardian Angel Care Services', '2545352419', '', 'gacs2.2024@gmail.com', NULL, DATE '2026-06-30', 'the phone number (254) 535-2419 is not in service, but as per google, the primary number of this facility is 850) 727-6705 and their email is GACS2.2024@gmail.com.I spoke to one of their staff and confirmed it.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 51, 'Home Instead', '8502971897', '', NULL, NULL, DATE '2026-06-30', 'The staff said they may have to pass for now.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 52, 'SYNERGY HomeCare', '8506610557', '', 'malloryjackson@synergyhomecare.com', NULL, DATE '2026-06-30', 'call attempt 1: was able to speak with Mallory, her email is malloryjackson@synergyhomecare.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 53, 'Affinity Home Care Agency', '8507655241', '', 'affinityhomecareflorida@gmail.com', NULL, DATE '2026-06-30', 'call attempt 1: was able to speak with Ashley and she gave the email affinityhomecareflorida@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 54, 'Always Best Care Of Madison', '8554702273', '', 'dogunnoiki@abc-seniors.com', NULL, DATE '2026-07-02', 'I was able to speak with David, owner of the email dogunnoiki@abc-seniors.com, he said that he did not receive any email yet from us about the program. Please send the email to him so I can call him back by Monday.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 55, 'Cornerstone Caregiving - Madison Home Care', '6085995440', '', 'madisonwi@cornerstonecaregiving.com', NULL, DATE '2026-07-02', 'Was able to speak with ALi, but said Brandon, whom we sent the email is out of the office due to the holiday.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 56, 'Home Instead', '6083149241', '', 'mwright@ckmadison.com', NULL, DATE '2026-07-02', 'Mike may not be interested at this point.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 57, 'Village Caregiving', '4146261732', '', 'charliehupp@villagecaregiving.com', NULL, DATE '2026-07-02', 'call attempt 1 for call back : VM / left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 58, 'Sunprime Homecare', '2025384712', '', 'sunprimehc@gmail.com', NULL, DATE '2026-07-02', 'Ousman did not have the time to check his email yet, but will take a loot at it on weekend. Will call him back nextweek.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 59, 'Senior Helpers', '6087295365', '', 'tanyas@seniorhelpers.com', NULL, DATE '2026-07-02', 'as per staff, the best thing to do for Tanya is just to email her and asked her response because she is very hard to reach and is more active in replying emails than answering the phone.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 60, 'Touching Hearts At Home', '3522253727', '', 'c.ramos@touchinghearts.com', NULL, DATE '2026-07-02', 'As per Alexis, Christina is out of the office for the holiday.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 61, 'Visiting Angels', '3526208484', '', 'k.anderson@visitingangels.com', NULL, DATE '2026-07-02', 'As per Kara, she did not receive any email yet from us. She''s been looking forward to it.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 62, 'Comfort Keepers Home Care', '3525583414', '', 'lindadaniels@comfortkeepers.com', NULL, DATE '2026-07-03', 'NO ANSWER . THEY ARE CURRENTLY CLOSE TO ALLOW THEIR EMPLOYEES CELEBRATE THE HOLIDAY. THAT''S WHAT THE OPERATOR SAID.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 63, 'Miracle Hands healthcare', '3523552121', '', 'zsewell@mymiraclehands.net', NULL, DATE '2026-07-03', 'Zariah said that she did not receive the email and also as of now, she thinks that they are not interested yet to participate.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 64, 'Mederi Private Care', '3525548023', '', 'jamee.tetstone@lhcgroup.com', NULL, DATE '2026-07-03', 'no answer. No one was able to pick up the phone. The phone has been ringing for 2 minutes.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 65, 'Home Care, Recharged', '3525657155', '', 'carecoordinator@homecarerecharged.com', NULL, DATE '2026-07-03', 'The staff said Leah is not available at the moment, she also gave me another email that might also be the one who can decide for the program which is administrator@homecarerecharged.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 66, 'Visiting Angels', '6088190665', '', 'tteske@visitingangels.com', NULL, DATE '2026-07-03', 'left vm for Tracy', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 67, 'Ovation Home Care', '3523091656', '', 'marylin@ovationhomecare.com', NULL, DATE '2026-07-03', 'Was able to speak with Laurie and said that the office is close right now due to coming holiday .', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 68, 'Visiting Angels', '2563390013', '', 'bcombs@visitingangels.com', NULL, DATE '2026-07-03', 'Vm left', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 69, 'Standard Home-Care Providers', '8665574272', '', 'standardhomecare@outlook.com', NULL, DATE '2026-07-07', 'Was able to talk to Pete and hedid not receive any email. He requested that it will be sent to this email standardhomecare@outlook.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 70, 'Always Best Care Of Madison', '8554702273', '', 'dogunnoiki@abc-seniors.com', NULL, DATE '2026-07-07', 'I was able to talk to Lope , he said he is not the one handling the calls, David is not available to talk to and Lope does not have any access to David''s Email. Ask Lope if there''s a way he can pass this message to David , kindly ask him to check his email if he did receive the email from us regarding the student caregiver program.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 71, 'Cornerstone Caregiving - Madison Home Care', '6085995440', '', 'madisonwi@cornerstonecaregiving.com', NULL, DATE '2026-07-07', 'Was able to speak with Ali, saying that Brandon is not available today.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 72, 'Village Caregiving', '4146261732', '', 'madisonwi@cornerstonecaregiving.com', NULL, DATE '2026-07-07', 'VM. Left Message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 73, 'Sunprime Homecare', '2025384712', '', 'sunprimehc@gmail.com', NULL, DATE '2026-07-07', 'Mailbox is full and cannot accept messages at this time', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 74, 'Senior HelperS', '6087295365', '', NULL, NULL, DATE '2026-07-07', 'The staff said that it would really be best to communicate Tanya via email tanyas@seniorhelpers.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 75, 'Touching Hearts At Home', '3522253727', '', 'c.ramos@touchinghearts.com', NULL, DATE '2026-07-07', 'Cristina is not available to speak with, one of her staff took the message.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 76, 'Visiting Angels', '', '', 'k.anderson@visitingangels.com', NULL, DATE '2026-07-07', 'Was able to speak with Kara and she still did not receive our email. Her email is k.anderson@visitingangels.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 77, 'Comfort Keepers Home Care', '3525583414', '', 'lindadaniels@comfortkeepers.com', NULL, DATE '2026-07-07', 'Sarah transferred me to Linda, but i was routed to Linda''s vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 78, 'Mederi Private Care', '3525548023', '', NULL, NULL, DATE '2026-07-07', 'Was able to speak with Jamee and she''s not interested to join the said program.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 79, 'Home Care, Recharged', '3525657155', '', 'administrator@homecarerecharged.com', NULL, DATE '2026-07-07', 'the staff said that the administrator is not available to speak with. Ask the staff if she can pass my message.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 80, 'Visiting Angels', '6088190665', '', 'tteske@visitingangels.com', NULL, DATE '2026-07-07', 'routed to Tracy''s vm/', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 81, 'mwalker@aviatahg.com', '8509429868', '', NULL, NULL, DATE '2026-07-07', 'Call attempt 3 :routed to Monica''s voicemail , who owns the email mwalker@aviatahg.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 82, 'Comfort Keepers Home Care', '3528553793', '', 'donnaosteen@comfortkeepers.com', NULL, DATE '2026-07-07', 'Was routed to DOnna''s vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 83, 'Academic Advising (Dean''s Office)', '8506441081', '', 'donnaosteen@comfortkeepers.com', NULL, DATE '2026-07-07', 'Was routed to VM.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 84, 'Undergraduate Academic Advising', '8506445470', '', 'cosspp-advising@fsu.edu', NULL, DATE '2026-07-07', 'the staff who has access to the email cosspp-advising@fsu.edu said they did not receive any email yet. Said she will be on a look out for that email.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 85, 'The Career Center', '8506446431', '', NULL, NULL, DATE '2026-07-07', 'Routed to VM', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 86, 'Pre-Health Advising Office', '3523921521', '', 'prehealth@advising.ufl.edu', NULL, DATE '2026-07-07', 'Routed to VM', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 87, 'Standard Home-Care Providers', '8665574272', '', NULL, NULL, DATE '2026-07-07', 'Was able to speak with Brent and said that this program is not right for us.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 88, 'Ovation Home Care', '', '', NULL, NULL, DATE '2026-07-07', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 89, 'Visiting Angels', '', '', 'bcombs@visitingangels.com', NULL, DATE '2026-07-07', 'WILLIAM IS NOT AVAILABLE.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 90, 'NULL - Stampede Into Bull Nursing · University of Florida · Student Org', '', '', NULL, NULL, DATE '0202-07-08', 'null. NO PHONE NUMBER AND NO PROVIDER''S NAME', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 91, 'Pre-Therapy Student Association', '7865319292', '', 'ptsafiu@gmail.com', NULL, DATE '0202-07-08', 'VM- LEFT MESSAGE.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 92, 'College of Nursing Student Council', '3522736001', '', NULL, NULL, DATE '0202-07-08', 'vm- LEFT MESSAGE', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 93, 'Brad Barbazuk', '3522738624', '', NULL, NULL, DATE '0202-07-08', 'vm- LEFT MESSAGE', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 94, 'Stephen Deban', '8139748393', '', 'sdeban@usf.edu', NULL, DATE '0202-07-08', 'was routed to VM. left message.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 95, 'Mildred (Maldonado-Molina) Schreiner', '3523920583', '', 'mmmm@ufl.edu', NULL, DATE '0202-07-08', 'Talked to ALi and she transfer me to vm of the one who has access to this email mmmm@ufl.edu .', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 96, 'Michael Reid', '3522941606', '', 'vcourt@ufl.edu', NULL, DATE '0202-07-08', 'Was able to talk to Shawn, and he is calling the doctor who has access to this email vcourt@ufl.edu but can''t get a hold of him so he transfer me to Lori but no answer from Lori''s dept. I was put on hold for 5 minutes.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 97, 'Shakira Henderson · College of Nursing', '3522736400', '', 'shakirahenderson@ufl.edu', NULL, DATE '0202-07-08', 'Vm -left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 98, 'Jesse Kresak', '3526279240', '', 'jkresak@ufl.edu', NULL, DATE '0202-07-08', 'Dr. Jesse is not around , and his assistant will relay the message.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 99, 'Dietmar W Siemann', '3522738231', '', 'siemadw@ufl.edu', NULL, DATE '0202-07-08', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 100, 'David C Bloom', '3522739524', '', 'dbloom@ufl.edu', NULL, DATE '0202-07-08', 'David is not around but his assistant will relay the message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 101, 'Matthew Gentry', '3522948397', '', 'matthew.gentry@ufl.edu', NULL, DATE '0202-07-08', 'left message. Vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 102, 'Karyn Esser', '3522735728', '', 'kaesser@ufl.edu', NULL, DATE '0202-07-08', 'Nobody answers the call.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 103, 'Ann L Horgas PhD', '3522736400', '', 'ahorgas@ufl.edu.', NULL, DATE '0202-07-08', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 104, 'Daniel Wesson', '3522948767', '', 'danielwesson@ufl.edu', NULL, DATE '0202-07-08', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 105, 'Beth A. Virnig · College of Public Health and Health Professions', '', '', 'bvirnig@ufl.edu', NULL, DATE '0202-07-08', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 106, 'Comfort Keepers of Tallahassee, FL', '8504272273', '', 'jennifer.adams@ckcoastalfl.com', NULL, DATE '0202-07-08', 'Mary -- gave this email jennifer.adams@ckcoastalfl.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 107, 'Tallahassee Living Center', '8509429868', '', 'mwalker@aviatahg.com', NULL, DATE '2026-07-09', 'call attempt 4 :routed to Monica''s voicemail , who owns the email mwalker@aviatahg.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 108, 'Comfort Keepers Home Care', '3528553793', '', 'donnaosteen@comfortkeepers.com', NULL, DATE '2026-07-09', 'Call attempt 4 : was routed to Donna''s vm.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 109, 'Thomas A. Houpt', '8506446624', '', 'houpt@bio.fsu.edu', NULL, DATE '2026-07-13', 'VM- LEFT MESSAGE', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 110, 'Wei Yang · Department of Chemistry & Biochemistry', '8506456884', '', 'yang@sb.fsu.edu', NULL, DATE '2026-07-13', 'NO ANSWER . PHONE HAS BEEN RINGING FOR 2 MINUTES', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 111, 'Lisa Griffiths · Department of Health, Nutrition, and Food Sciences', '8506446885', '', 'lgriffiths@fsu.edu', NULL, DATE '2026-07-13', 'NO ANSWER . PHONE HAS BEEN RINGING FOR 2 MINUTES', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 112, 'Alan Rowan · Public Health Program', '8506441025', '', 'arowan@fsu.edu', NULL, DATE '2026-07-13', 'NO ANSWER . PHONE HAS BEEN RINGING FOR 2 MINUTES', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 113, 'Jing Wang · College of Nursing', '8506443299', '', 'jingwang@nursing.fsu.edu', NULL, DATE '2026-07-13', 'VM', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 114, 'Richard Nowakowski · Department of Biomedical Sciences', '8506449219', '', 'richard.nowakowski@med.fsu.edu', NULL, DATE '2026-07-13', 'THE NUMBER DOES NOT EXIST OR IS NO LONGER IN SERVICE', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 115, 'Alma Littles · College of Medicine', '8506441855', '', 'alma.littles@med.fsu.edu', NULL, DATE '2026-07-13', 'VM', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 116, 'Damon Andrew · Anne Spencer Daves College of Education, Health, and Human Sciences', '8506446885', '', 'dandrew@fsu.edu', NULL, DATE '2026-07-13', 'NO ANSWER . PHONE HAS BEEN RINGING FOR 2 MINUTES', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 117, 'Heather Flynn · Department of Behavioral Sciences and Social Medicine', '8506457367', '', 'heather.flynn@med.fsu.edu', NULL, DATE '2026-07-13', 'VM', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 118, 'Geriatrics Interest Group', '7274395229', '', 'cll20d@fsu.edu', NULL, DATE '2026-07-13', 'VM', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 119, 'Cornerstone Caregiving - Madison Home Care', '6085995440', '', 'madisonwi@cornerstonecaregiving.com', NULL, DATE '2026-07-15', 'Meeting July 22 2026- sometime in the morning. Brandon Confirmed. Please booked Brandon a meeting on July 22 - sometime in the morning. Thanks.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 120, 'Comfort Keepers Home Care', '3525583414', '', NULL, NULL, DATE '2026-07-15', 'Vm- Left message to Linda', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 121, 'Accent Care Personal Care Services', '9286325219', '', NULL, NULL, DATE '2026-07-15', 'Was able to speak with Tifanny and said they''re not medical so she think she''ll pass for it.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 122, 'Arosa Salt Lake', '8015033200', '', 'elaine.sario@arosacare.com', NULL, DATE '2026-07-15', 'Was able to speak with the staff and she gave me Elaine''s email elaine.sario@arosacare.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 123, 'Visiting Angels', '8018039248', '', 'palexandrov@visitingangels.com', NULL, DATE '2026-07-15', 'Was able to speak with ANnie and she gave me Pat''s email which is palexandrov@visitingangels.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 124, 'Right at Home', '8017580630', '', 'frank@rahslc.com', NULL, DATE '2026-07-15', 'Was able to speak with Chelsea and gave me Frank, the manager''s email which is frank@rahslc.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 125, 'TheKey - Formerly Home Care Assistance', '3852312154', '', NULL, NULL, DATE '2026-07-15', 'VM- Left message about the program and our phone number', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 126, 'Amada Senior Care', '8018933877', '', 'phil.j@amadaseniorcare.com', NULL, DATE '2026-07-15', 'Was able to speak with Janni and she gave me the owner''s email - phil.j@amadaseniorcare.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 127, 'A Caring Hand', '8012531265', '', NULL, NULL, DATE '2026-07-15', 'The number does not exist or is no longer in service.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 128, 'ComForCare Home Care Utah', '8008864044', '', 'eastslc@comforcare.com', NULL, DATE '2026-07-15', 'The phone number for COmforCare Salt Lake CIty in UTAH is 801-447-5353 -- the staff give me this email eastslc@comforcare.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 129, 'Danville Support Services', '8013631521', '', 'm.rochin@danvilleservices.com', NULL, DATE '2026-07-15', 'Was able to speak with Emily and gave me the admin''s email m.rochin@danvilleservices.com . Her name is Marisol, the administrator.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 130, 'Select Home Care', '8014327500', '', NULL, NULL, DATE '2026-07-15', 'routed to VM= left message and our phone number', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 131, 'SYNERGY HomeCare', '8019460355', '', 'ut01@synergyhomecare.com', NULL, DATE '2026-07-15', 'Was able to speak with JOcelyn and the email she gave is ut01@synergyhomecare.com which can be address to Chris, the manager.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 132, 'Home Instead', '8016309089', '', NULL, NULL, DATE '2026-07-15', 'Sarah said that''s something they do not want to participate.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 133, 'Assisting Hands - Davis', '8014999993', '', 'lbrown@assistinghands.com', NULL, DATE '2026-07-15', 'Was able to speak with Heide and she confirmed that lbrown@assistinghands.com is the owner''s email address and the best address to send the details of the program', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 134, 'Homewatch CareGivers', '8884045191', '', NULL, NULL, DATE '2026-07-15', 'Left VM with our phone number.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 135, 'Homewatch CareGivers', '8884045191', '', NULL, NULL, DATE '2026-07-16', 'Vm - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 136, 'Homewatch CareGivers', '8884045191', '', NULL, NULL, DATE '2026-07-20', 'use zipcode- 84112 - Still routed to VM/ left message and our phone number.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 137, 'Cornerstone Caregiving', '8127141427', '', 'bloomingtonin@cornerstonecaregiving.com', NULL, DATE '2026-07-20', 'Was able to speak with Sarah and she gave me email bloomingtonin@cornerstonecaregiving.com .', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 138, 'Village Caregiving', '8126166226', '', NULL, NULL, DATE '2026-07-20', 'vm - left message with our phone number.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 139, 'Paid.care', '8123245958', '', 'info@paid.care', NULL, DATE '2026-07-20', NULL, DATE '2026-09-15', 'Vm - left detailed message', NULL, NULL, NULL, NULL),
    ('prov', 140, 'Alternative Care Solutions', '8126710247', '', 'acshr@altcaresolutions.com', NULL, DATE '2026-07-20', 'The lady staff provided the email acshr@altcaresolutions.com which can be used to send the details of the Student CAREGIVING PROGRAM.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 141, 'AccessiCare Elder Home Care', '8127253504', '', NULL, NULL, DATE '2026-07-20', 'the number does not exist or is no longer in service', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 142, 'Caregivers', '1784327782', '', NULL, NULL, DATE '2026-07-20', 'Unable to complete call at this time.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 143, 'Home Instead', '9302708368', '', 'sarah.lacey@homeinstead.com', NULL, DATE '2026-07-20', 'Sarah, one of the staff provided her email sarah.lacey@homeinstead.com which can be used to send the details of the student caregiving program.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 144, 'Comfort Keepers of Bloomington, IN', '8128220145', '', 'stacybruce@comfortkeepers.com', NULL, DATE '2026-07-20', 'Heather- give me Stacy''s email which is stacybruce@comfortkeepers.com which can be used to send the program details.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 145, 'Arosa Salt Lake', '8015033200', '', 'elaine.sario@arosacare.com', NULL, DATE '2026-07-20', 'was able to speak with Tawnia Dean- assistant of Elaine, she wants to have a quick meeting with DR. Dubose this Thursday 1pm.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 146, 'Visiting Angels', '8018039248', '', 'palexandrov@visitingangels.com', NULL, DATE '2026-07-20', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 147, 'Right at Home', '8017580630', '', 'frank@rahslc.com', NULL, DATE '2026-07-20', 'Was able to speak with Chelsea and said that Frank is not available to speak with. I kindly asked Chelsea if she can remind Frank to check if he receive the email we sent and to response on that email or call us for more details.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 148, 'TheKey - Formerly Home Care Assistance', '3852312154', '', 'angelica.garcia@thekey.com', NULL, DATE '2026-07-20', 'Was able to speak with Angelica and her email is angelica.garcia@thekey.com .', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 149, 'Amada Senior Care', '8018933877', '', NULL, NULL, DATE '2026-07-20', 'Was able to speak with Phil and he just said that if whoever students who wants to participate in this program, we can just text this number 8081-893-3877 for their first and last name and they can try to accommodate. He does not have any time to have a meeting with Dr. Dubose as he is a very busy businessman.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 150, 'A Caring Hand', '8012521265', '', NULL, NULL, DATE '2026-07-20', 'the number does not exist or is no longer in service', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 151, 'ComForCare Home Care Utah', '8014475353', '', NULL, NULL, DATE '2026-07-20', 'the staff said that they are not interested to participate of the said program.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 152, 'Danville Support Services', '8013631521', '', 'm.rochin@danvilleservices.com', NULL, DATE '2026-07-20', 'Was able to speak with Staff and said that Marisol, the admin whom we sent the email is not available to speak with.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 153, 'Select Home Care', '8014327500', '', NULL, NULL, DATE '2026-07-20', 'routed to Vm- left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 154, 'SYNERGY HomeCare', '8019460355', '', 'hrmanagerut01@synergyhomecare.com', NULL, DATE '2026-07-20', 'the staff said to send the email to hrmanagerut01@synergyhomecare.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 155, 'Assisting Hands - Davis', '8014999993', '', 'lbrown@assistinghands.com', NULL, DATE '2026-07-20', 'Was able to speak with Heide and she''s not sure if the owner receive the email, and if she did, and if interested on the said program, she may be respond to that email. I kindly ask Heide as well if she can remind her boss tomorrow to check the email.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 156, 'Caregivers', '8123338800', '', NULL, NULL, DATE '2026-07-22', 'the number has been disconnected or is no longer in service', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 157, 'AccessiCare Elder Home Care', '8127253843', '', NULL, NULL, DATE '2026-07-22', 'vm -left message with our phone number.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 158, 'Village Caregiving', '8125511311', '', NULL, NULL, DATE '2026-07-22', 'vm- left message with details and our phone number', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 159, 'Homewatch CareGivers', '8017904365', '', NULL, NULL, DATE '2026-07-22', 'The phone rings for 3 minutes and operator said the call could not go through then hung up.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 160, 'Visiting Angels', '8018039248', '', NULL, NULL, DATE '2026-07-22', 'vm- left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 161, 'Right at Home', '8017580630', '', NULL, NULL, DATE '2026-07-22', 'Frank is in a meeting and was routed to His voicemail- Left a message to check his email and may respond to that email if he has questions.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 162, 'A Caring Hand', '8012531265', '', NULL, NULL, DATE '2026-07-22', 'the number does not exist or is no longer in service.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 163, 'Danville Support Services', '8013631521', '', 'm.rochin@danvilleservices.com', NULL, DATE '2026-07-22', 'Was able to speak with Marisol but she said she did not receive the email yet, she would love to see the details first prior having a quick meeting with dr. Dubose. Will resend the details of the program to her email m.rochin@danvilleservices.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 164, 'Select Home Care', '8014327500', '', NULL, NULL, DATE '2026-07-22', 'Vm- left message with our phone number', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 165, 'SYNERGY HomeCare', '8019460355', '', 'hrmanagerut01@synergyhomecare.com', NULL, DATE '2026-07-22', 'Intake staff was able to answer the call and transferred me to the HR whose email was being used for the details but got no answer.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 166, 'Assisting Hands - Davis', '8014999993', '', NULL, NULL, DATE '2026-07-22', 'was able to speak with Heide and she said we can just remove her from the contact list because the owner might not be interested with the program.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 167, 'Homewatch CareGivers', '8017904365', '', NULL, NULL, DATE '2026-07-23', 'called new number 801) 790-4365 - the phone rings for 2 minutes then operator will say " im sorry the call could not go through".', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 168, 'Comfort Keepers of Bloomington, IN', '8128220145', '', NULL, NULL, DATE '2026-07-24', 'was able to speak with Heather and asked if Stacey was able to read the email that we sent to her, Heather have no idea and Stacey is out of the office today..', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 169, 'Home Instead', '9302708368', '', NULL, NULL, DATE '2026-07-24', 'no one is answering the call- phone has been ringing for 3 minutes but no one answered.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 170, 'Cornerstone Caregiving', '8127141427', '', 'bloomingtonin@cornerstonecaregiving.com', NULL, DATE '2026-07-24', 'was able to talk to Alexis, and she said that emails send to bloomingtonin@cornerstonecaregiving.com will be opened only by their operating director. Kindly Ask Alexis to pass the message to the director and if she need more info, she can call us back or reply to the email we sent.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 171, 'Paid.care', '8123245958', '', 'info@paid.care', NULL, DATE '2026-07-24', 'no one is available to take the call. Left Vm and detailed message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 172, 'Alternative Care Solutions', '8126710247', '', 'kellei@altcaresolutions.com', NULL, DATE '2026-07-24', 'Was able to talk to one of HR head, Kellie, she said it would be best to send the details on her direct email kellei@altcaresolutions.com // also advise her to reply on the email or call us once email is sent.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 173, 'Comfort Keepers of Bloomington, IN', '8128220145', '', NULL, NULL, DATE '2026-07-27', 'Was able to speak with Jennifer and she said that Stacey , is not in the office. Ask Jennifer when she sees Stacey if she could ask to check on her email and see if she receive the message from us.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 174, 'Home Instead', '9302708368', '', NULL, NULL, DATE '2026-07-27', 'was able to speak with Sarah, she checked the email that we sent and she said she may not have to participate with the program.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 175, 'Cornerstone Caregiving', '8127141427', '', NULL, NULL, DATE '2026-07-27', 'Was able to speak with Alexis, and she said it was Tina, who can open the email we sent, and she is not available to speak with as of the moment, just ask Alexis to let TINA check her email and reply what will be her thoughts or call us back if she need more info.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 176, 'Paid.care', '8123245958', '', NULL, NULL, DATE '2026-07-27', 'No one is available to take the call- Leave VM', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 177, 'TheKey - Formerly Home Care Assistance', '3852312154', '', NULL, NULL, DATE '2026-07-27', 'No one is available _ Left Vm address to Angelica', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 178, 'Caregivers', '8123338800', '', NULL, NULL, DATE '2026-07-27', 'CALLING NUMBER (812) 333-8800 - THE NUMBER IS NO LONGER IN SERVICE', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 179, 'AccessiCare Elder Home Care', '8127253843', '', NULL, NULL, DATE '2026-07-27', 'BRANDY WHITE VM', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 180, 'Village Caregiving', '8123450014', '', 'bloomington@villagecaregiving.com', NULL, DATE '2026-07-27', 'calling (812) 551-1311 - one of the director said that it would be best to send it to this email bloomington@villagecaregiving.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 181, 'Homewatch CareGivers', '8778369330', '', NULL, NULL, DATE '2026-07-27', 'CALLING THE NUMBER 877-836-9330 USING THESE TWO ZIPCODES 84115 AND 84021/ FOR THE FIRST ZIPCODE , NO ANSWER , THE PHONE RINGS FOR 3 MINUTES BUT STILL NO ANSWER, USING THE 2ND ZIPCODE, THE PHONE DROPPED.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 182, 'Homewatch CareGivers', '8778369330', '', NULL, NULL, DATE '2026-07-28', 'CALLING THE NUMBER 877-836-9330 USING ZIPCODES 84115, routed to Vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 183, 'Caregivers', '8123338800', '', NULL, NULL, DATE '2026-07-28', 'CALLING NUMBER (812) 333-8800 - THE NUMBER IS NO LONGER IN SERVICE', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 184, 'AccessiCare Elder Home Care', '8127253843', '', NULL, NULL, DATE '2026-07-28', 'Was able to speak with Dana , home care manager, said they are far from Bloomington so she think she may not participate on this program.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 185, 'Village Caregiving', '8123450014', '', NULL, NULL, DATE '2026-07-28', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 186, 'Pre-Health Student Organization', '3172748477', '', 'stuact@iu.edu', NULL, DATE '2026-07-29', 'Vm- the operator confirmed that their email is stuact@iu.edu /// but still leave a message for details.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 187, 'Advising & Major Exploration Services', '8128556768', '', 'ames@iu.edu', NULL, DATE '2026-07-29', 'Staff named Tidi - confirm that email ames@iu.edu is the right email and the manager is the one who has access to it and it''s not available at the moment. Said she will relay that info to the manager.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 188, 'Health Professions Programs Administrative Office', '3172784752', '', 'askhpp@iu.edu', NULL, DATE '2026-07-29', 'askhpp@iu.edu - they receivej the email but it is not intended for them because the email says " for Bloomington Students". So the staff said they may have to pass .', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 189, 'Career Services & Jobs', '8128556500', '', 'iub.studentcentral@iu.edu', NULL, DATE '2026-07-29', 'the phone keeps ringing but no answer.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 190, 'IU School of Nursing Bloomington Advising', '8128551736', '', 'iubnurse@iu.edu', NULL, DATE '2026-07-29', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 191, 'Nan Rockey', '8128553717', '', 'junecole@iu.edu', NULL, DATE '2026-07-29', 'reach June Coleman ·vm- junecole@iu.edu is his email as per his vm. Left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 192, 'Emily Wetzel', '8128565126', '', 'ejwetzel@iu.edu', NULL, DATE '2026-07-29', 'Was routed to Vm- left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 193, 'Undergraduate Career Services', '8128555317', '', 'hirekelley@iu.edu', NULL, DATE '2026-07-29', 'VM- the email is per the operator hirekelley@iu.edu', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 194, 'Pre-Professional Services', '2199806722', '', NULL, NULL, DATE '2026-07-29', '(219) 980-6722 - reach the vacant and disconnected. number', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 195, 'Student Involvement and Leadership Center', '8128554682', '', 'sil@iu.edu', NULL, DATE '2026-07-29', 'sil@iu.edu - did not receive any email from us yet .', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 196, 'Mentoring Services & Leadership Development', '8128553540', '', 'omsld@iu.edu', NULL, DATE '2026-07-29', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 197, 'Student Care and Resource Center', '8128562273', '', 'iucare@iu.edu', NULL, DATE '2026-07-29', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 198, 'Health Professions Programs IU School of Medicine Contact Us', '3172784752', '', 'askhpp@iu.edu', NULL, DATE '2026-07-29', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 199, 'Sylvia Beaver', '8128552032', '', 'sylbeave@iu.edu', NULL, DATE '2026-07-29', 'VM- left detailed message.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 200, 'MarChé Daughtry', '8128552032', '', 'mdaughtr@iu.edu', NULL, DATE '2026-07-29', 'VM- left detailed message. same phone number with the ff: Sylvia Beaver Niki Blackwell MarChé Daughtry Rachel Downey Taylor Erickson Megan Greene Anthony Lanman Jennifer Lopatin', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 201, 'Jennifer Lopatin', '8128552032', '', 'jlopatin@iu.edu', NULL, DATE '2026-07-29', 'VM- left detailed message. same phone number with the ff: Sylvia Beaver Niki Blackwell MarChé Daughtry Rachel Downey Taylor Erickson Megan Greene Anthony Lanman Jennifer Lopatin', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 202, 'Niki Blackwell', '8128552032', '', 'ncblackw@iu.edu', NULL, DATE '2026-07-29', 'VM- left detailed message. same phone number with the ff: Sylvia Beaver Niki Blackwell MarChé Daughtry Rachel Downey Taylor Erickson Megan Greene Anthony Lanman Jennifer Lopatin', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 203, 'School of Public Health-Bloomington Undergraduate Advising', '8128552032', '', 'tericks@iu.edu', NULL, DATE '2026-07-29', 'VM- left detailed message. same phone number with the ff: Sylvia Beaver Niki Blackwell MarChé Daughtry Rachel Downey Taylor Erickson Megan Greene Anthony Lanman Jennifer Lopatin', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 204, 'Megan Greene', '8128552032', '', 'greene17@iu.edu src', NULL, DATE '2026-07-29', 'VM- left detailed message. same phone number with the ff: Sylvia Beaver Niki Blackwell MarChé Daughtry Rachel Downey Taylor Erickson Megan Greene Anthony Lanman Jennifer Lopatin', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 205, 'Anthony Lanman', '8128552032', '', 'alanman@iu.edu src ↗', NULL, DATE '2026-07-29', 'VM- left detailed message. same phone number with the ff: Sylvia Beaver Niki Blackwell MarChé Daughtry Rachel Downey Taylor Erickson Megan Greene Anthony Lanman Jennifer Lopatin', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 206, 'Taylor Erickson', '8128552032', '', 'tericks@iu.edu src', NULL, DATE '2026-07-29', 'VM- left detailed message. same phone number with the ff: Sylvia Beaver Niki Blackwell MarChé Daughtry Rachel Downey Taylor Erickson Megan Greene Anthony Lanman Jennifer Lopatin', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 207, 'Office of University & Exploratory Advising', '4357973373', '', 'exploratoryadvising@usu.edu', NULL, DATE '2026-07-29', 'Vm - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 208, '21st Century Scholars Program', '8128561910', '', 'vcsl@iu.edu', NULL, DATE '2026-07-29', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 209, 'Office of Student Life', '8128552002', '', 'iub21cs@iu.edu', NULL, DATE '2026-07-29', 'email address confirmed iub21cs@iu.edu but the staff said they did nt receive any email from us.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 210, 'Advising and Major Exploration Services', '8128556768', '', 'ames@iu.edu', NULL, DATE '2026-07-29', 'EMAIL confirmed by an operator ames@iu.edu. Then route me to VM - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 211, 'Health Professions & Prelaw Advising', '8128551873', '', NULL, NULL, DATE '2026-07-29', 'Staff i was able to talk to said that they receive the email butu are not interested to participate with the said program.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 212, 'Career Exploration & Student Employment', '8128555234', '', 'iucareer@iu.edu', NULL, DATE '2026-07-29', 'vm- left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 213, 'Utah Geriatrics and Gerontology Society', '8012134156', '', 'utahaging@gmail.com', NULL, DATE '2026-07-29', 'VM- left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 214, 'PrePhysical Therapy', '8015818146', '', 'kayla.bacon@utah.edu', NULL, DATE '2026-07-29', 'VM- - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 215, 'College Student Council', '8015813414', '', 'utahconsac@gmail.com', NULL, DATE '2026-07-29', 'vm- left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 216, 'PreMedical - Preprofessional Advising', '8015818146', '', 'kayla.bacon@utah.edu', NULL, DATE '2026-07-29', 'Vm - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 217, 'RonJai Staton', '4358794736', '', 'ronjai.staton@utahtech.edu', NULL, DATE '2026-07-29', 'Their department is not for this program- They only cater enrollments for the upcoming freshmen enrollees.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 218, 'Marisa Hamblin', '4358794736', '', 'marisa.hamblin@utahtech.edu', NULL, DATE '2026-07-29', 'Their department is not for this program- They only cater enrollments for the upcoming freshmen enrollees.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 219, 'Monique Rubio', '4358794736', '', 'monique.rubio@utahtech.edu', NULL, DATE '2026-07-29', 'Their department is not for this program- They only cater enrollments for the upcoming freshmen enrollees.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 220, 'Sanja Pantovic', '4358794736', '', 'sanja.pantovic@utahtech.edu', NULL, DATE '2026-07-29', 'Their department is not for this program- They only cater enrollments for the upcoming freshmen enrollees.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 221, 'Jake Richins', '4358794736', '', 'jake.richins@utahtech.edu', NULL, DATE '2026-07-29', 'Their department is not for this program- They only cater enrollments for the upcoming freshmen enrollees.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 222, 'Heather Thomas', '4357972926', '', 'heather.thomas@usu.edu', NULL, DATE '2026-07-29', 'Vm - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 223, 'Alyza Harper', '4357971350', '', 'alyza.harper@usu.edu', NULL, DATE '2026-07-29', 'Vm - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 224, 'Nursing Advising', '4357972926', '', 'heather.thomas@usu.edu', NULL, DATE '2026-07-29', 'As per Alyza, she will reach out to Heather to response to that email.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 225, 'Heather Thomas', '4357972926', '', 'heather.thomas@usu.edu', NULL, DATE '2026-07-29', 'As per Alyza, she will reach out to Heather to response to that email.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 226, 'College of Nursing Undergraduate Advising', '8015813414', '', 'conadvising@utah.edu', NULL, NULL, 'Vm- left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 227, 'Undergraduate Advisors - College of Health Student Success', '8015818379', '', 'ron.ramsing@health.utah.edu', NULL, DATE '2026-07-29', 'The number will ring but will hung up after a few rings.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 228, 'Preprofessional Advising Navigate Hub for Exploring Students', '8015878687', '', 'ppa@advising.utah.edu', NULL, DATE '2026-07-29', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 229, 'College of Health Student Success Undergraduate Advisors', '8015818379', '', 'ron.ramsing@health.utah.edu', NULL, DATE '2026-07-29', 'The number will ring but will hung up after a few rings.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 230, 'PreProfessional Advising Office', '8015818146', '', 'ppa@advising.utah.edu', NULL, DATE '2026-07-29', 'Staff said preprofessional advising is no longer in their office and this concern is not handled by them.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 231, 'Office of Academic Culture and Community', '8015877672', '', 'somacc@hsc.utah.edu', NULL, DATE '2026-07-29', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 232, 'Preprofessional Advising', '8015818146', '', 'ppa@advising.utah.edu', NULL, DATE '2026-07-29', 'Staff said preprofessional advising is no longer in their office and this concern is not handled by them.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 233, 'Pre-Health Student Organization', '3172748477', '', 'stuact@iu.edu', NULL, DATE '2026-08-05', 'Routed to VM - Left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 234, 'Advising & Major Exploration Services', '8128556768', '', 'ames@iu.edu', NULL, DATE '2026-08-05', 'Routed to VM - Left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 235, 'Career Services & Jobs', '8128556500', '', NULL, NULL, DATE '2026-08-05', 'they may not participate on the said program', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 236, 'IU School of Nursing Bloomington Advising', '8128551736', '', 'iubnurse@iu.edu', NULL, DATE '2026-08-05', 'routed to Vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 237, 'Nan Rockey', '8128553717', '', 'nlrockey@iu.edu', NULL, DATE '2026-08-05', 'Routed to Vm- Left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 238, 'Undergraduate Career Services', '8128553717', '', NULL, NULL, DATE '2026-08-05', 'Same office and same number to Nan Rockey - Still routed to Vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 239, 'Pre-Professional Services', '2199806722', '', 'dr. ming gao · minggao@iu.edu src ↗', NULL, DATE '2026-08-05', 'Reach the vacant and disconnected number.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 240, 'Student Involvement and Leadership Center', '', '', 'sil@iu.edu', NULL, DATE '2026-08-05', 'vm - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 241, 'Mentoring Services & Leadership Development', '8128553540', '', 'omsld@iu.edu', NULL, DATE '2026-08-05', 'Was able to speak with Marissa and confirmed that email omsld@iu.edu is correct but she did not re ceive any email from us yet. Told her we will resend the email and maybe will call her the next day.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 242, 'Student Care and Resource Center', '8128562273', '', 'iucare@iu.edu', NULL, DATE '2026-08-05', 'the phone keeps on ringing and will hung up after 2 minutes', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 243, 'Health Professions Programs IU School of Medicine Contact Us', '', '', 'askhpp@iu.edu', NULL, DATE '2026-08-05', 'VOicemail - left message// Email confirmed askhpp@iu.edu thru an operator.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 244, 'Sylvia Beaver', '8128552032', '', NULL, NULL, DATE '2026-08-05', 'Vm- left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 245, 'Office of University & Exploratory Advising', '4357973373', '', NULL, NULL, DATE '2026-08-05', 'Was able to speak with Eric and said they are not interested for the said program', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 246, '21st Century Scholars Program', '8128561910', '', 'iub21cs@iu.edu', NULL, DATE '2026-08-05', 'Haesook - Was able to speak with the woman named Haesook - she confirmed the email iub21cs@iu.edu but she also confirmed that they did not receive any email yet from us about the program. Told her we will send her another one.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 247, 'Office of Student Life', '8128552002', '', 'vcsl@iu.edu', NULL, DATE '2026-08-05', 'Was able to speak with Suzanne / she said that they did not receive the email yet, vcsl@iu.edu / She asked to resend the email and they will respond to it.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 248, 'Advising and Major Exploration Services', '8128556768', '', 'ames@iu.edu', NULL, DATE '2026-08-05', 'ames@iu.edu // Alison // Was able to speak with Alison and she check the inbox and found none from us or any email about the student caregiving program. Told her we''ll send her another one and asked if she or on of the decision maker to reply on that email if they are interested and might want to have a quick meeting with dr. Dubose', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 249, 'Career Exploration & Student Employment', '8128555234', '', 'iucareer@iu.edu', NULL, DATE '2026-08-05', 'Same office space (location) with Advising and Major Exploration Services and I was still able to speak with Alison, and same thing, for Career Exploration & Student Employment they''re not receiving it also .', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 250, 'Utah Geriatrics and Gerontology Society', '8012134156', '', NULL, NULL, DATE '2026-08-05', 'The phone keeps on ringing and no answer.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 251, 'PrePhysical Therapy', '8015818146', '', 'kayla.bacon@utah.edu - vm', NULL, DATE '2026-08-05', 'vm- left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 252, 'College Student Council', '8015813414', '', 'utahconsac@gmail.com', NULL, DATE '2026-08-05', 'vm- left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 253, 'PreMedical - Preprofessional Advising', '8015818146', '', NULL, NULL, DATE '2026-08-05', 'Same office with PrePhysical Therapy and same number 801-581-8146 - VM', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 254, 'Heather Thomas', '4357979684', '', NULL, NULL, DATE '2026-08-05', 'Was able to speak with Heather and she said she''s not interested', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 255, 'College of Nursing Undergraduate Advising', '8015813414', '', NULL, NULL, DATE '2026-08-05', 'Same office with College Student Council and same number 801-581-3414 - Vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 256, 'Undergraduate Advisors - College of Health Student Success', '8015818379', '', 'ron.ramsing@health.utah.edu', NULL, DATE '2026-08-05', 'Lorraine / Was able to speak with Loraine and she has no idea if Ron Ramsing received the email or not, but she said that she''ll ask ROn once she sees him and ask to respond on that email.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 257, 'Preprofessional Advising Navigate Hub for Exploring Students', '8015878687', '', NULL, NULL, DATE '2026-08-05', 'Phone keeps on ringing- nobody answered', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 258, 'College of Health Student Success Undergraduate Advisors', '8015818379', '', NULL, NULL, DATE '2026-08-05', 'Same office with College Student Council and same number 801-581-3414 - Vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 259, 'Office of Academic Culture and Community', '8015877672', '', NULL, NULL, DATE '2026-08-05', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 260, 'Commonwise Home Care Charlottesville', '4342028565', '', NULL, NULL, DATE '2026-08-05', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 261, 'Touching Hearts at Home Central VA', '5406032626', '', 'jcook@touchinghearts.com', NULL, DATE '2026-08-06', 'Was able to speak with janel and she give me email of one of the desicion makers which is jcook@touchinghearts.com .', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 262, 'Commonwise Home Care Charlottesville', '4342028565', '', NULL, NULL, DATE '2026-08-06', 'VM- Left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 263, 'Home Instead', '4342699012', '', 'homeinstead@532.com', NULL, DATE '2026-08-06', 'Was able to speak with Mitch and he gave email homeinstead@532.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 264, 'Kindwell Homecare', '4342022926', '', NULL, NULL, DATE '2026-08-06', 'Vm - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 265, 'Visiting Angels', '4342275917', '', 'marilynmfc@visitingangels.com', NULL, DATE '2026-08-06', 'Was able to speak with Marilyn and her email address is marilynmfc@visitingangels.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 266, 'Alpha Home Care Services', '4342315592', '', NULL, NULL, DATE '2026-08-06', 'Answered but no response from the other line', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 267, 'AT Home Care Staffing', '4343274610', '', 'lindsey.wade@athomecarestaffing.com', NULL, DATE '2026-08-06', 'Was able to speak with Lindsey - and her email is lindsey.wade@athomecarestaffing.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 268, 'Loving Arms Care', '4349649431', '', 'dawnjones@lovingarmscareinc.com', NULL, DATE '2026-08-06', 'Was able to speak with Dawn and her email address is dawnjones@lovingarmscareinc.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 269, 'Eleos Home Care', '4343366123', '', NULL, NULL, DATE '2026-08-06', 'The phone keeps on ringing for 2 minutes and no answer', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 270, 'Providential Homecare', '4343289472', '', NULL, NULL, DATE '2026-08-06', '"The service You are attempting to use is currently unavailable" The operator says.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 271, 'Home Instead', '4349794663', '', 'ashley.james@homeinstead.com', NULL, DATE '2026-08-07', 'Email address homeinstead@532.com was invalid , so called today to get the right one and was able to speak with Dana, she gave me HR Manager email Ashley James - ashley.james@homeinstead.com / Dana office Coordinator.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 272, 'AT Home Care Staffing', '2857142857', '', 'lindsey.wade@athomecarestaffing.com', NULL, DATE '2026-08-07', 'Was able to speak with Lindsey and she gave me same email address lindsey.wade@athomecarestaffing.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 273, 'Providential Homecare', '4343289472', '', NULL, NULL, DATE '2026-08-07', 'Call attempt 2 for this number (434) 328-9472 : the service you are attempting to use is currently unavailable. Operator said.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 274, 'Touching Hearts at Home Central VA', '5406032626', '', NULL, NULL, DATE '2026-08-10', 'Male staff said Janel is in a meeting, kindly ask the male staff to pass the message to janel.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 275, 'Commonwise Home Care Charlottesville', '4342028565', '', NULL, NULL, DATE '2026-08-10', 'VM - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 276, 'Kindwell Homecare', '4342022926', '', NULL, NULL, DATE '2026-08-10', 'Vm - Left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 277, 'Visiting Angels', '4342275917', '', NULL, NULL, DATE '2026-08-10', 'Was able to speak with Pat, and she said Marilyn is in a meeting. Kindly ask Pat to pass the message about the email we sent to her.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 278, 'Alpha Home Care Services', '4342315592', '', NULL, NULL, DATE '2026-08-10', 'female staff said that she does not have the ability to open the email, only the bosses. She will just pass the message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 279, 'Loving Arms Care', '4349649431', '', NULL, NULL, DATE '2026-08-10', 'vm - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 280, 'Eleos Home Care', '4343366123', '', NULL, NULL, DATE '2026-08-10', 'The phone has been ringing for 2 minutes and no one answered.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 281, 'SYNERGY HomeCare', '8019460355', '', NULL, NULL, DATE '2026-08-10', 'Male staff said that the email is directed for HR manager, but she''s not in today. Staff said he''ll pass the message.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 282, 'Cornerstone Caregiving', '8127141427', '', NULL, NULL, DATE '2026-08-10', 'was able to speak with Alexis and it is the OPerating Director Tina who has been communiticating with us throug email bloomingtonin@cornerstonecaregiving.com and she is out in the field right now. She''s not in the office. She suggested to email her', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 283, 'Providential Homecare', '8049242118', '', NULL, NULL, DATE '2026-08-10', 'called this new number 804-924-2118 but it still says : the number you have dialed does not exist or is no longer in service. Try Searching new number in google, the only number i found is (434) 328-9472 which i called three times , but still says the service you are attempting to use is currently unavailable.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 284, 'Career Exploration & Student Employment', '8128555234', '', NULL, NULL, DATE '2026-08-11', 'Was able to speak with Kitty and said they''re not interested now.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 285, 'Caregivers', '8123338800', '', NULL, NULL, DATE '2026-08-11', 'Calling this number 812) 333-8800 but it is disconnected and is no longer in servicd', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 286, 'Touching Hearts at Home Central VA', '5406032626', '', NULL, NULL, DATE '2026-08-11', 'female staff hung up the phone/ called twice but still hung up', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 287, 'Commonwise Home Care Charlottesville', '4342028565', '', 'info@commonwisecare.com', NULL, DATE '2026-08-12', 'The number is busy. try call again later', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 288, 'Kindwell Homecare', '4342022926', '', 'kindwellhomecare@outlook.com', NULL, DATE '2026-08-12', 'Vm - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 289, 'Visiting Angels', '4342275917', '', 'marilynmfc@visitingangels.com', NULL, DATE '2026-08-12', 'Spoke with Marilyn herself. she said she did not receive any email from us. She confirmed the email marilynmfc@visitingangels.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 290, 'Alpha Home Care Services', '4342315592', '', NULL, NULL, DATE '2026-08-12', 'The phone has been ringing for 3 minutes and nobody answered.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 291, 'Eleos Home Care', '4343366123', '', NULL, NULL, DATE '2026-08-12', 'No answer', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 292, 'Loving Arms Care', '4349649431', '', NULL, NULL, DATE '2026-08-12', 'Vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 293, 'Touching Hearts at Home Central VA', '5406032626', '', NULL, NULL, DATE '2026-08-12', 'female staff hung up the call/ called twice but still hung up just right after stating I am from DR. Dubose.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 294, 'Brennan Gourley', '4349248900', '', NULL, NULL, DATE '2026-08-17', 'Vm - left message - Same number with Brennan Gourley 434-924-8900', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 295, 'Pre-Health Advising', '4349248900', '', NULL, NULL, DATE '2026-08-17', 'Vm - left message - Same number with Brennan Gourley 434-924-8900', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 296, 'Home Instead', '4349794663', '', NULL, NULL, DATE '2026-08-17', 'Ashley is out of the office - Left VM', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 297, 'AT Home Care Staffing', '2857142857', '', NULL, NULL, DATE '2026-08-17', 'calling on this number 285) 714-2857 the operator said : the number you have dialed does not exist or is no longer in service.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 298, 'FirstLight Home Care', '4809222820', '', 'scottsdale@firstlighthomecare.com', NULL, DATE '2026-08-21', 'Spoke with Kayla and she gave email scottsdale@firstlighthomecare.com', DATE '2026-08-27', 'staff confirmed that they did receive the email but she just dont have access or right to decide. She''ll pass the message to the one who can.', DATE '2026-08-31', NULL, NULL, NULL),
    ('prov', 299, 'Home For Me Home Care', '4805998529', '', NULL, NULL, DATE '2026-08-21', 'No answer', DATE '2026-08-24', 'vm', DATE '2026-08-25', '3rd attempt for this provider and still routed to VM- left detailed messages', NULL, NULL),
    ('prov', 300, 'Synergy HomeCare', '4806597771', '', NULL, NULL, DATE '2026-08-21', 'not interested as per Bryan', NULL, NULL, DATE '2026-08-25', '3rd attempt for this provider- NO answer this time.', NULL, NULL),
    ('prov', 301, 'Connections In Home Care & Communities', '6027088626', '', NULL, NULL, DATE '2026-08-21', 'vm', DATE '2026-08-24', 'Vm- left message', DATE '2026-09-04', '3rd attempt for this provider/ it was answered by a female staff then she hug up// called back and still hung up.', NULL, NULL),
    ('prov', 302, 'Abloom Health Care', '4805900020', '', NULL, NULL, DATE '2026-08-21', 'the number (480) 590-0020 does not exist or is no longer in service', DATE '2026-08-27', 'called this number 480) 590-0020 it no longer exist or not in service. No other number found on google for this provider.', DATE '2026-08-31', '3rd attempt for this provider with number 480) 590-0020. Cannot find another number in google for this provider.', NULL, NULL),
    ('prov', 303, 'Griswold Home Care', '4803050131', '', NULL, NULL, DATE '2026-08-21', 'Spoke with Amanda- confirmed they;re not interested', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 304, 'PrimeCare Home Solutions', '6026330738', '', NULL, NULL, DATE '2026-08-21', 'Only get our contact info but refuse to provide their email address', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 305, 'Home Instead', '6237773637', '', 'blair.sateta@homeinstead.com', NULL, DATE '2026-08-21', 'Owner''s email - blair.sateta@homeinstead.com', DATE '2026-08-27', 'spoke with a female staff and she dont have access to the owner''s email blair.sateta@homeinstead.com -- She''ll pass the message to the owner to reply on our email if she''s interested .', DATE '2026-08-31', 'spoke with a female staff and asked her if she has any idea if the owner received the email we sent, she said she''s not sure and she put me on hold for 3 minutes and never gets back.', NULL, NULL),
    ('prov', 306, 'DailyCare Non-Medical Homecare Agency', '4803602825', '', NULL, NULL, DATE '2026-08-21', 'This number (480) 360-2825 does not exist or is no longer in servic', DATE '2026-08-24', 'Calling number (480) 878-1466 from google- cannot complete the call at this time , please check the number and try again. Search Google and only found previously listed number 480-360-2825 which is no longer in service.', NULL, NULL, NULL, NULL),
    ('prov', 307, 'Amada Senior Care', '6232272100', '', 'amadaphoenixwestrecruiting@gmail.com', NULL, DATE '2026-08-21', 'Shiela -put me on hold for almost 4 minutes and never gets back.', DATE '2026-08-24', 'Vm- left message', DATE '2026-09-04', '3rd attempt for this provider and spoke with Shiella she gave email amadaphoenixwestrecruiting@gmail.com', NULL, NULL),
    ('prov', 308, 'FirstLight Home Care of Sun City', '6232017716', '', 'bhodges@firstlighthomecare.com', NULL, DATE '2026-08-21', 'Nobody answer the call', DATE '2026-08-24', 'Was able to speak with Barron - one fo the decision makers. His email is bhodges@firstlighthomecare.com', DATE '2026-09-09', '3rd attempt : No answer', NULL, NULL),
    ('prov', 309, 'Preferred Homecare', '4802851192', '', 'heather.owens@preferredhomecare.com', NULL, DATE '2026-08-21', 'Email of Coordinator heather.owens@preferredhomecare.com', DATE '2026-08-27', 'No one is available to take the call', DATE '2026-08-31', '3rd attempt for this provider : still no one answer.', NULL, NULL),
    ('prov', 310, 'Like Family Home Care', '4805429333', '', 'info@likefamilyhomecareaz.com', NULL, DATE '2026-08-21', 'Amber gave the email info@likefamilyhomecareaz.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 311, 'Phoenician Home Care', '4807149883', '', NULL, NULL, DATE '2026-08-21', 'Kirk - said he''s not interested', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 312, 'Homewatch CareGivers of Phoenix', '6023133991', '', 'ronnclark@homewatchcaregivers.com', NULL, DATE '2026-08-21', 'Dacian - recruiter and his email is dbutas@hwcg.com', DATE '2026-08-27', 'sproke with male staff and asked if someone receive the email we went to ROn ronnclark@homewatchcaregivers.com - but ron is in a meeting. He will just pass the message.', DATE '2026-08-31', 'no answer', NULL, NULL),
    ('prov', 313, 'Salkeld Home Care Agency *call tab olera*', '8554024445', '', NULL, NULL, DATE '2026-08-24', 'Pressed option 2 to talk to care coordinator- was routed to Michelle mailbox- mailbox is full and no option to leave a message.', NULL, NULL, DATE '2026-08-25', 'call attempt 3- routed to Michelle''s mailbox but hers is full- cannot leave a message', NULL, NULL),
    ('prov', 314, 'Hart2Heart', '4805006298', '', NULL, NULL, DATE '2026-08-24', 'Directly routed to Vm', DATE '2026-09-04', '2nd attempt for this provider - calls went straight to vm', DATE '2026-09-08', '3rd attempt : call went straight to Vm', NULL, NULL),
    ('prov', 315, 'Visiting Angels', '6232669304', '', 'april.visitingangelsaz@gmail.com', NULL, DATE '2026-08-24', 'VM - left message', DATE '2026-09-04', '2nd attempt - vm', DATE '2026-09-08', 'Spoke to one of the Staff and gave April''s email april.visitingangelsaz@gmail.com - She''s owner', DATE '2026-09-14', 'spoke with one of the staff but she hung up, called back but now routed to vm- left message for April'),
    ('prov', 316, 'TheKey - Formerly Home Care Assistance', '5202773766', '', NULL, NULL, DATE '2026-08-24', 'vm - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 317, 'Signature Home Care', '6232824143', '', NULL, NULL, DATE '2026-08-24', 'called this number (623) 282-4143 but it does not exist or is no longer in service. NO other number found on google when tried to search for a new one.', DATE '2026-09-09', 'called this number 715-892-0926 as per research notes, routed to Vm', NULL, NULL, NULL, NULL),
    ('prov', 318, 'Abrio Home Care Phoenix', '6029563817', '', 'sbree@abrioservices.com', NULL, DATE '2026-08-24', 'Was able to speak with Stephanie and she gave me Sarah''s email sbree@abrioservices.com - Sarah is one of the decision makers.', DATE '2026-09-09', 'a female staff answered but Sarah- to whom we sent the email is out of the office today. She will just pass the message that we called and to check the email.', NULL, NULL, NULL, NULL),
    ('prov', 319, 'ITC Personal In-Home Care', '1748960875', '', 'admin@pathwaysforlife.care', NULL, DATE '2026-08-24', 'called this number 174) 896-0875 - cannot be completed as dialled. Search new number in google 480-969-5480 and was given this email admin@pathwaysforlife.care', DATE '2026-09-04', 'called another number found on google (623) 792-8112 spoke with a female staff and said they wont be interested about the program', DATE '2026-09-09', 'Was able to speak with the the female staff and said she does not have access to open the email. She will just pass the message to the admin.', NULL, NULL),
    ('prov', 320, 'Home Instead', '9284824881', '', 'hr195@homeinstead.com', NULL, DATE '2026-08-24', 'female staff only give this email hr195@homeinstead.com', DATE '2026-09-09', 'spoke with female staff and does not have access to the email whom we sent the details, but got our contact number and will pass it to the right person', NULL, NULL, NULL, NULL),
    ('prov', 321, 'Right at Home', '6235470700', '', NULL, NULL, DATE '2026-08-24', 'Was able to speak with Nikki but she refuse to provide an email.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 322, 'Visiting Angels', '4808338247', '', 'hr@visitingangelsaz.com', NULL, DATE '2026-08-24', 'was able to speak with Cris and she gave me HR''s email hr@visitingangelsaz.com', DATE '2026-09-09', 'Was able to speak with Annie from HR stating she did not receive the email yet sent to hr@visitingangelsaz.com -- Will resend the email and informed her to just reply back to the email once received.', NULL, NULL, NULL, NULL),
    ('prov', 323, 'Right At Home', '6238782885', '', NULL, NULL, DATE '2026-08-24', 'Was able to speak with Tina and she confirmed that they''re not interested', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 324, 'Doves at Home Senior Care', '2545352419', '', NULL, NULL, DATE '2026-08-24', 'called this number 254) 535-2419 is not in service // Search on google , got new number 480-268-2685 --was able to speak with Tricia and she confirmed that they''re not interested.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 325, 'Affordable Home Care Solutions', '4804518183', '', NULL, NULL, DATE '2026-08-24', 'Was able to speak with Mike but said they''re not interested.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 326, 'A Caring Hand for Mom', '8008817706', '', NULL, NULL, DATE '2026-08-24', 'vm = left message', DATE '2026-09-04', '2nd attempt - vm', DATE '2026-09-08', '3rd attempt : No answer', NULL, NULL),
    ('prov', 327, 'ComForCare Home Care', '6024381300', '', 'csullivan@comforcare.com', NULL, DATE '2026-08-24', 'was able to speak with a male staff and give me Cindy''s email csullivan@comforcare.com - Cindy is one of the decision makers.', DATE '2026-09-09', 'spoke with Cindy herself- whom we sent the email with. She said she was able to receive it but she was still catching up because she was on leave for a week last week. She will just read the details firsts and will reply on the email if she is interested to be part of the program.', NULL, NULL, NULL, NULL),
    ('prov', 328, 'Goldstar Homecare', '6023217177', '', 'rebeccar@goldstar-homecare.com', NULL, DATE '2026-08-24', 'Was able to speak with Rebecca - rebeccar@goldstar-homecare.com', DATE '2026-09-09', 'Spoke with a female staff and she said that Rebecca is not in the office. She will pass the message.', NULL, NULL, NULL, NULL),
    ('prov', 329, 'Simple Living Assisted Home Care', '6232726459', '', NULL, NULL, DATE '2026-08-24', 'unable to contact', DATE '2026-09-04', '2nd attempt - vm', DATE '2026-09-08', '3rd attempt : vm', DATE '2026-09-10', '4th attempt : vm'),
    ('prov', 330, 'Thrive Home Care Services', '4808470887', '', NULL, NULL, DATE '2026-08-24', 'vM - LEFT MESSAGE', DATE '2026-09-04', '2nd attempt - vm', DATE '2026-09-08', '3rd attempt : vm', DATE '2026-09-10', '4th attempt : vm'),
    ('prov', 331, 'SYNERGY HomeCare of the West Valley', '6232461000', '', 'orlonda@westvalleyhomecare.com', NULL, DATE '2026-08-24', 'Was able to speak with a female staff and she gave her email orlonda@westvalleyhomecare.com -', DATE '2026-09-09', 'was able to speak with another female staff but the owner of the email orlonda@westvalleyhomecare.com is not available. She will just pass the message', NULL, NULL, NULL, NULL),
    ('prov', 332, 'HomeWell Care Services', '4806298322', '', 'mroley@homewellcares.com', NULL, DATE '2026-08-24', 'Vm - routed to Vm', DATE '2026-09-04', 'Michael the owner- his email is mroley@homewellcares.com', NULL, NULL, NULL, NULL),
    ('prov', 333, 'Assisting Hands Home Care-North Phoenix', '6023745775', '', 'kestia@assistinghands.com', NULL, DATE '2026-08-24', 'Called this number (602) 374-5775 , it does not exist or is no longer in service // search google and found 480-863-6591 was able to speak with female staff and give me Abby''s email kestia@assistinghands.com', DATE '2026-09-09', 'vm', NULL, NULL, NULL, NULL),
    ('prov', 334, 'Bayada Assistive Care', '8882536197', '', 'jmcfeeley@bayada.com', NULL, DATE '2026-08-24', 'was able to speak to one of their associate and she gave me this email jmcfeeley@bayada.com -- part of their nursing employee program / The associate dont know the full name of owner of the email but she said that email is part of the team where our program can be discussed with.', DATE '2026-09-09', 'vm', NULL, NULL, NULL, NULL),
    ('prov', 335, 'ITC Personal In-Home Care', '1748960875', '', NULL, NULL, DATE '2026-08-24', 'called this number (174) 896-0875 but it does not exist, search google, got a new number 85302-3127 but it cannot be completed as dialed. No other number found.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 336, 'Blessings for Seniors Companion Care', '6235940819', '', 'info@blessingsforseniors.com', NULL, DATE '2026-08-24', 'was able to speak with Susan and she gave me this email info@blessingsforseniors.com - which handles by the management team..', DATE '2026-09-09', 'spoke with Susan and she said that she wont be able to access the inbox of the email/ only the management team can open it/ she advised to send another email to the same email info@blessingsforseniors.com', NULL, NULL, NULL, NULL),
    ('prov', 337, 'Freedomcare - Arizona', '8887302654', '', NULL, NULL, DATE '2026-08-24', 'No one is answering the phone and is been ringing for 3 mins.', DATE '2026-09-04', '2nd attempt no answer', DATE '2026-09-08', '3rd attempt : No answer', DATE '2026-09-10', '4th attempt : Still no one answered.'),
    ('prov', 338, 'Sunland Home Care', '4804478893', '', NULL, NULL, DATE '2026-08-24', 'was able to speak by a male staff and confirmed that they''re not interested', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 339, 'Visiting Angels', '4804518800', '', 'jehrhardt@averyangels.com', NULL, DATE '2026-08-24', 'Was able to speak with female staff and gave Josie''s email - jehrhardt@averyangels.com', DATE '2026-09-09', 'spoke to a female staff/ she does not have access to open Josei''s email but she will pass the message.', NULL, NULL, NULL, NULL),
    ('prov', 340, 'HomeWell Care Services', '8883990309', '', 'sharon.szayer@arizonahealthacademy.org', NULL, DATE '2026-08-24', 'Was able to speak with Sharon and her email is sharon.szayer@arizonahealthacademy.org', DATE '2026-09-09', 'spoke with Sharon- she received the email but have not found the time yet to read its entirety. She will read it first and will reply back if she''s interested to be part of this program.', NULL, NULL, NULL, NULL),
    ('prov', 341, 'Gentiva Personal Care', '8884368482', '', NULL, NULL, DATE '2026-08-24', 'The operator routed me to their website// no option to speak with live staff', DATE '2026-09-04', 'The operator will still route me to their website', NULL, NULL, NULL, NULL),
    ('prov', 342, 'Care for All Phoenix', '6237779267', '', 'careforallllc@gmail.com', NULL, DATE '2026-08-24', 'VM- left message', DATE '2026-09-04', 'staff provided email careforallllc@gmail.com', NULL, NULL, NULL, NULL),
    ('prov', 343, 'Home Instead', '6026031725', '', 'centralphoenix@homeinstead.com', NULL, DATE '2026-08-24', 'Was able to speak with Michelle and gave me the email address centralphoenix@homeinstead.com', DATE '2026-09-09', 'was able to speak with Michelle again and she said that the email should be centralphx@homeinstead.com // Will resend it right away.', NULL, NULL, NULL, NULL),
    ('prov', 344, 'Urgent Home Care Inc.', '6026879625', '', 'carmenmuhc@outlook.com', NULL, DATE '2026-08-24', 'Was able to speak with Carmen and her email is carmenmuhc@outlook.com', DATE '2026-09-09', 'spoke with Carmen and she confirmed that she received the email we sent. She will have to read it first then will reply back to the email.', NULL, NULL, NULL, NULL),
    ('prov', 345, 'Comfort Keepers of Chandler', '4805736525', '', 'wardck617@gmail.com', NULL, DATE '2026-08-24', 'Was able to speak with Female staff and gave Grado''s email which is wardck617@gmail.com - Grados is one of the decision maker.', DATE '2026-09-09', 'spoke with Ashley and Grado is not in the office. She will just pass the message', NULL, NULL, NULL, NULL),
    ('prov', 346, 'Caring Hearts In Home Care', '6234404047', '', NULL, NULL, DATE '2026-08-24', 'answered by a female staff and confirmed they''re not interested', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 347, 'All Valley Home Health Care & Nursing', '6239773977', '', 'jmule@allvalleycare.com', NULL, DATE '2026-08-24', 'vm - left message', DATE '2026-09-04', 'Spoke with Human resource staff and her email is jmule@allvalleycare.com', NULL, NULL, NULL, NULL),
    ('prov', 348, 'A Z BEST HOME HEALTH INC', '4804187400', '', NULL, NULL, DATE '2026-08-24', 'called this number (480) 418-7400 and it does not exist. Search on google, there is no verified active or public phone number for this entity', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 349, 'Abrio Home Care Mesa', '4809304881', '', NULL, NULL, DATE '2026-08-24', 'Female staff said they''re not interested for the program', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 350, 'Living Free Homecare', '4804429667', '', 'john@livingfreehomecare.com', NULL, DATE '2026-08-24', 'vm - left vm', DATE '2026-09-04', '2nd attempt vm', DATE '2026-09-08', '3rd attempt : vm', DATE '2026-09-10', '4th attempt : Spoke with JOhn and his email is john@livingfreehomecare.com'),
    ('prov', 351, 'A Place At Home - Maricopa County', '1740692094', '', NULL, NULL, DATE '2026-08-24', 'called this number 174-069-2094 it does not exist/ search google got this new number 480) 542-4050 but routed to VM', DATE '2026-09-04', '2nd attempt vm', DATE '2026-09-08', '3rd attempt calling this number 480) 542-4050 found on google but still no answer', DATE '2026-09-10', '4th attempt : vm'),
    ('prov', 352, 'My Priority Home Care', '6023763485', '', 'info@mypriorityhomecare.com', NULL, DATE '2026-08-24', 'Was able to speak with Kyle and gave email info@mypriorityhomecare.com', DATE '2026-09-09', 'spoke with Kyle again and said that he does not have access to check the inbox but will pass the message to the management team.', NULL, NULL, NULL, NULL),
    ('prov', 353, 'Comfort-N-Home', '6023183310', '', NULL, NULL, DATE '2026-08-24', 'vm', DATE '2026-09-04', '2nd attempt vm', DATE '2026-09-08', '3rd attempt Vm', DATE '2026-09-10', '4th attempt : No answer/ called twice'),
    ('prov', 354, 'Amada Senior Care', '4809995250', '', 'amadacares@amadaseniorcare.com', NULL, DATE '2026-08-24', 'Was able to speak with Jaime and she gave email amadacares@amadaseniorcare.com', DATE '2026-09-09', 'spoke with a female staff and said that Jaime is not in the office but will pass the message', NULL, NULL, NULL, NULL),
    ('prov', 355, 'Right At Home', '6235470700', '', NULL, NULL, DATE '2026-08-24', 'was able to speak with a female staff and she said they''re not interefsted', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 356, 'Senior Helpers', '4804856486', '', 'nhenry@seniorhelpers.com', NULL, DATE '2026-08-24', 'Was able to speak with Amanda and gave me email- nhenry@seniorhelpers.com - owned by Niesha', DATE '2026-09-09', 'was able to speak with female staff and does not have direct access to the email nhenry@seniorhelpers.com / She will pass the message to the Niesha , the owner of the email', NULL, NULL, NULL, NULL),
    ('prov', 357, 'Visiting Angels', '6234767882', '', 'mfoyle@visitingangels.com', NULL, DATE '2026-08-25', 'was able to speak with Melissa and she gave me her email mfoyle@visitingangels.com -- Melissa', DATE '2026-09-09', '2nd attempt :no answer', NULL, NULL, NULL, NULL),
    ('prov', 358, 'No Place Like Home Care', '4804008824', '', NULL, NULL, DATE '2026-08-25', 'VM - left detailed message', DATE '2026-09-04', '2nd attempt vm', DATE '2026-09-08', '3rd attempt : vm', DATE '2026-09-10', '4th attempt : spoke with a female staff this time and said she''s not interested.'),
    ('prov', 359, 'Always Best Care Senior Services', '4803045625', '', NULL, NULL, DATE '2026-08-25', 'Staff refuse to provide email saying she does not have one and only get our phone number and will let forward it to one of decision maker.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 360, 'Sonora Home Health', '4809701328', '', NULL, NULL, DATE '2026-08-25', 'called this number 480-970-1328 but is no longer in service. Search in google, no other number available for this provider', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 361, 'I Need An Angel', '4809514083', '', 'hello@ineedanangel.com', NULL, DATE '2026-08-25', 'was able to speak with male staff and provided this email hello@ineedanangel.com', DATE '2026-09-09', 'male staff does not have access to open the email but will pass the message to the one who can', NULL, NULL, NULL, NULL),
    ('prov', 362, 'Always Best Care Senior Services )', '4804993112', '', NULL, NULL, DATE '2026-08-25', 'female staff refuse to provide email and only get our info and the details of the program.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 363, 'ComForCare Home Care & Care Management (NW Valley)', '6239342722', '', NULL, NULL, DATE '2026-08-25', 'Christina said they''re not interested', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 364, 'Homewatch CareGivers of East Valley', '4807127611', '', 'dbutas@hwcg.com', NULL, DATE '2026-08-25', 'Spoke with Dacian and his email is dbutas@hwcg.com', DATE '2026-09-09', '2nd attempt : vm', NULL, NULL, NULL, NULL),
    ('prov', 365, 'Valley of the Sun Homecare', '4802645252', '', 'suzette@valleyofthesunhomecare.com', NULL, DATE '2026-08-25', 'Spoke Patrick --- and gave email suzette@valleyofthesunhomecare.com', DATE '2026-09-09', 'no answer', NULL, NULL, NULL, NULL),
    ('prov', 366, 'Compassionate Home Care', '6235477521', '', NULL, NULL, DATE '2026-08-25', 'Staff refuse to provide email but get our contact info', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 367, 'Adultcare Assistance Homecare', '6024551118', '', 'office@adultcareassistance.com', NULL, DATE '2026-08-25', 'spoke with Carla and she gave me email office@adultcareassistance.com', DATE '2026-09-15', 'Spoke with Carla she said that she did not receive the email from us. I''ll go and resend the email.', NULL, NULL, NULL, NULL),
    ('prov', 368, 'Arion Care Solutions', '4807221300', '', NULL, NULL, DATE '2026-08-25', 'Spoke with Ynah - and she said that they might not be interested since their services are non-medical.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 369, 'Tender Heart Home Care', '4807194444', '', 'info@tenderhearthomecare.com', NULL, DATE '2026-08-25', 'Was able to speak with a male staff and gave this emaill address info@tenderhearthomecare.com to me', DATE '2026-09-15', 'spoke with a male staff and said that if they receive it, they will respond accordingly. HE also said that us keeps calling them is quite overwhelming. He requested not to keep calling them.', NULL, NULL, NULL, NULL),
    ('prov', 370, 'FirstLight Home Care of Goodyear', '6232328851', '', NULL, NULL, DATE '2026-08-25', 'Spoke with Sarah and she said they''re not interested of the said program', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 371, 'Always Best Care Senior Services', '4805221054', '', NULL, NULL, DATE '2026-08-25', 'spoke with Jaime - refuse to provide email address but get our contact info', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 372, 'Good Neighbor Support Services', '6239324878', '', 'jaranda@gncares.com - the business manager', NULL, DATE '2026-08-25', 'Vm- left message', DATE '2026-09-04', 'staff gave email jaranda@gncares.com - the business manager', NULL, NULL, NULL, NULL),
    ('prov', 373, 'Homewell Care Services', '6232656300', '', 'infoaz183@homewellcares.com', NULL, DATE '2026-08-25', 'NO one is available to answer our call', DATE '2026-09-04', 'staff gave email infoAZ183@homewellcares.com', DATE '2026-09-08', 'same email provided', DATE '2026-09-10', '4th attempt : spoke to staff and email given is still infoAZ183@homewellcares.com / which is monitored by their care managers.'),
    ('prov', 374, 'Preferred Care at Home of Southeast Valley', '4805367726', '', 'sevalley@preferhome.com', NULL, DATE '2026-08-25', 'no one answer', DATE '2026-09-04', 'staff gave email sevalley@preferhome.com', DATE '2026-09-08', 'staff provided email sevalley@preferhome.com', DATE '2026-09-10', '4th call : staff gave me same email sevalley@preferhome.com'),
    ('prov', 375, 'Cypress HomeCare Solutions', '6028786212', '', 'jennifer@cypresshomecare.com', NULL, DATE '2026-08-25', 'called this number 602) 878-6212but it no longer exist// search new number from google 602-264-8009 and female staff provide me Jennifer''s email jennifer@cypresshomecare.com - one of the decision maker.', NULL, NULL, DATE '2026-09-15', 'spoke with Megan and she said that Jennifer (to whom we sent the email) is out of the office, she also said we can also send that details of the program to Jasmine , the manager of collaboration, jasmine@cypresshomecare.com', NULL, NULL),
    ('prov', 376, 'Endeavor In Home Care - Mesa', '4804982324', '', NULL, NULL, DATE '2026-08-25', 'Spoke with KZ , she did not provide an email , only get our contact info', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 377, 'Right at Home', '4806321100', '', NULL, NULL, DATE '2026-08-25', 'Spoke with Alexis , confirmed that they wont be interested for the program', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 378, 'Home Instead', '6232239215', '', 'surpriseaz@homeinstead.com', NULL, DATE '2026-08-25', 'spoke with a female staff and gave me email surpriseaz@homeinstead.com - administrator', DATE '2026-09-15', 'able to speak with Knox - she said that she will pass the message to the person who has access to the email.', NULL, NULL, NULL, NULL),
    ('prov', 379, 'Golden Heart Senior Care', '4802847360', '', 'info@goldenheartscottsdale.com', NULL, DATE '2026-08-25', 'left vm', DATE '2026-09-04', 'staff just gave email info@goldenheartscottsdale.com', NULL, NULL, NULL, NULL),
    ('prov', 380, 'Compassionate Assistance', '4804682699', '', 'christine@compassionateassistance.com', NULL, DATE '2026-08-25', 'no one is available to take the call', DATE '2026-09-04', 'staff gave email info@CompassionateAssistance.com', DATE '2026-09-10', 'spoke with staff and gave me same email like last call , but ask for more direct email who handles recruitment , she gave me Christine@CompassionateAssistance.com', NULL, NULL),
    ('prov', 381, 'A Caring Solution Home Care', '6022642086', '', NULL, NULL, DATE '2026-08-25', 'called this number 602-264-2086 but it no longer exist or is no longer in srvice. No other number found when search on google.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 382, 'Touching Hearts at Home', '6232079391', '', NULL, NULL, DATE '2026-08-25', 'Spoke with Jan - but they''re not interested', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 383, 'Senior Helpers', '4806927433', '', 'jdevary@seniorhelpers.com', NULL, DATE '2026-08-25', 'spoke with Ivan - he transferred to James - the owner -- jdevary@seniorhelpers.com', DATE '2026-09-15', 'vm - left message to James', NULL, NULL, NULL, NULL),
    ('prov', 384, 'TheKey - Formerly Home Care Assistance', '3852312154', '', NULL, NULL, DATE '2026-08-27', 'VM - left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 386, 'Like Family Home Care', '4805429333', '', 'tanyamahler@likefamilyhomecareaz.com', NULL, DATE '2026-08-27', 'Spoke with Tanya- the hiring manager said they did not receive an email being sent to info@likefamilyhomecareaz.com -- she gave me direct email for the details to be sent on her. tanyamahler@likefamilyhomecareaz.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 387, 'A Plus Home Health Care', '4809176994', '', 'usman@aplushhs.com', NULL, DATE '2026-09-04', 'staff gave the email of owner usman@aplushhs.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('prov', 388, 'Leading Edge Senior Care', '4806185995', '', NULL, NULL, DATE '2026-09-04', '1st attempt vm', DATE '2026-09-08', '2nd attempt : vm', DATE '2026-09-10', 'spoke to a female staff and only gave the email info@leadingedgeseniorcare.com / she said this email is monitored by the management team/ if they are interested, they will respond to it.', NULL, NULL),
    ('prov', 390, 'Aging In Place', '2175314663', '', NULL, NULL, DATE '2026-09-08', 'The number dialed is not in service at this time/ Checked other numbers in google but no other number related to this provider', DATE '2026-09-10', 'number still no longer in service / no other number when checked on google.', NULL, NULL, NULL, NULL),
    ('prov', 391, 'SYNERGY HomeCare', '2173180268', '', 'sarahburkhardt@synergyhomecare.com', NULL, DATE '2026-09-07', 'spoke with sarah - sarahburkhardt@synergyhomecare.com', DATE '2026-09-10', 'Spoke with a female staff and said Sarah is out until Monday. Sarah is to whom we sent the details with.', NULL, NULL, NULL, NULL),
    ('prov', 392, 'Assisting Hands Home Care - Gilbert, Mesa, Queen Creek & Surrounding Areas', '', '', 'gilbertoffice@assistinghands.com', NULL, DATE '2026-09-08', 'Search phone number in google 602-535-5440 but it does not exist / no longer in service', DATE '2026-09-10', '2nd attempt : called this number 602-535-5440 but still no longer in service// cannot find another number for this provider', DATE '2026-09-15', 'called new number from Google - (480) 550-8451 for this provider with address 6 E Palo Verde St # 3, Gilbert, AZ 85296 // spoke with a staff and gave the email gilbertoffice@assistinghands.com', NULL, NULL),
    ('prov', 393, 'All Ways Caring HomeCare - Champaign, IIllinois', '', '', NULL, NULL, DATE '2026-09-08', 'operator just route me to visit website at allwayscaring.com and choose careers.', DATE '2026-09-10', '2nd attempt : option 2 - for jobs with always caring but operator will still route me to their website - alwayscaring.com', NULL, NULL, NULL, NULL),
    ('prov', 394, 'Help at Home', '2174469740', '', NULL, NULL, DATE '2026-09-08', 'vm', DATE '2026-09-10', '2nd attempt : The phone has been ringing for 4 minutes and no one answered.', NULL, NULL, NULL, NULL),
    ('prov', 395, 'Presence Home Care', '2173554120', '', NULL, NULL, DATE '2026-09-08', 'all rep are busy, no one is available to answer', DATE '2026-09-10', '2nd attempt " vm', NULL, NULL, NULL, NULL),
    ('prov', 396, 'Home Instead', '2173182883', '', 'sarah.robbins@homeinstead.com', NULL, DATE '2026-09-08', 'spoke with Sarah and her email is sarah.robbins@homeinstead.com', DATE '2026-09-10', 'spoke with Anna and said Sarah is out until next week.', NULL, NULL, NULL, NULL),
    ('prov', 397, 'Addus HomeCare', '2173561121', '', 'info1@addus.com', NULL, DATE '2026-09-08', 'no answer', DATE '2026-09-10', 'spoke with female staff and gave me general email info1@addus.com', NULL, NULL, NULL, NULL),
    ('prov', 398, 'R. Angell''s Homecare Services', '2173776018', '', NULL, NULL, DATE '2026-09-08', 'no answer', DATE '2026-09-10', '2nd attempt : vm', NULL, NULL, NULL, NULL),
    ('prov', 989, 'Comfort Keepers Home Care', '3528553793', '', 'donnaosteen@comfortkeepers.com', NULL, DATE '2026-07-01', 'Call attempt 3 : Was able to speak with Donna, and her email is donnaosteen@comfortkeepers.com', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 2, 'Graduate Advising', '8506443296', '', NULL, NULL, DATE '2026-06-30', 'only get our contact info and will let the admission department call us', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 3, 'Pre-Nursing Advising · Florida State University · Advising Office · Pre-Nursing Advisor (Jacqueline Hare)', '8506443296', '', NULL, NULL, DATE '2026-06-30', 'the staff said they''re not into it, then hangs up.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 4, 'The Career Center', '8506446431', '', NULL, NULL, DATE '2026-06-30', 'call attempt 1- routed to vm.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 5, 'Academic Advising (Dean''s Office)', '8506441081', '', 'hathey@fsu.edu', NULL, DATE '2026-06-30', 'Hearthe Athey - the Assistant Dean- email is hathey@fsu.edu.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 6, 'Undergraduate Academic Advising', '8506445470', '', 'cosspp-advising@fsu.edu', NULL, DATE '2026-06-30', 'Was able to talk to Jersey- the email is cosspp-advising@fsu.edu which was handled by the academic advisors.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 7, 'Pre-Health Advising (Meredith Gellepis)', '8506447678', '', 'imsadvising@med.fsu.edu', NULL, DATE '2026-06-30', 'call attempt 1 : email is IMSadvising@med.fsu.edu -- saying they will keep an eye for our email .', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 8, 'University of Florida Honors Program Advising Office (Meredith Beaupre )', '3523921519', '', 'advisor@honors.ufl.edu', NULL, DATE '2026-06-30', 'call attempt 1: was able to speak with Eden and the email provided is advisor@honors.ufl.edu', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 9, 'Pre-Health Advising Office', '3523921521', '', 'prehealth@advising.ufl.edu', NULL, DATE '2026-06-30', 'call attempt 1 : the staff provided the email prehealth@advising.ufl.edu is a good email to send the full details of our program.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 10, 'Department of Kinesiology · University of Wisconsin-Madison · Dept Head · Professor, Department Chairperson (Dr. Andrea Mason )', '6082629904', '', NULL, NULL, DATE '2026-06-30', 'call attempt 1 : Routed directly to vm. Left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 11, 'Department of Integrative Biology · University of Wisconsin-Madison · Dept Head · Professor (Dr. Lauren Riters )', '', '', NULL, NULL, DATE '2026-06-30', 'call attempt 1 : directly routed to her vm. left message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 12, 'Department of Medicine · University of Wisconsin-Madison · Dept Head · George R. and Elaine Love Professor and chair of the Department of Medicine (Dr. Lynn Schnapp )', '', '', NULL, NULL, DATE '2026-06-30', 'call attempt 1: nobody is available to take the call.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 13, 'Center for Pre-Health Advising', '6082636614', '', NULL, NULL, DATE '2026-06-30', 'call attempt 1 : Directly routed to VM.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 14, 'U Career Success', '8015878687', '', NULL, NULL, DATE '2026-07-24', 'CALL ATTEMPT 1:VM- LEFT MESSAGE WITH OUR DETAILS AND PHONE NUMBER.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 15, 'Student Success Center for College of Health Undergraduate Advisors', '8015818379', '', NULL, NULL, DATE '2026-07-24', 'CALL ATTEMPT 1 : THE NUMBER YOU DIALLED IS TEMPORARILY UNAVAILABLE', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 16, 'U Career Success', '6082636614', '', NULL, NULL, DATE '2026-07-27', 'Staff just get our information and will forward it to her Manager and if the manager might be interested, she will contact us back, but for now, she refuse to provide email address.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 17, 'Student Success Center for College of Health Undergraduate Advisors', '8015818379', '', NULL, NULL, DATE '2026-07-27', 'no answer- Phone has been ringing for 2 minutes.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 18, 'Student Success Center for College of Health Undergraduate Advisors', '8015818379', '', NULL, NULL, DATE '2026-07-28', 'The phone keeps on ringing but will drop after 2 minutes.', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 19, 'Brennan Gourley', '4349248900', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 20, 'Brennan Gourley', '4349248900', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 21, 'UVA Career Center', '4349248900', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 22, 'Pre-Health Advising', '4349248900', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 23, 'The Career Center', '2173330820', '', NULL, NULL, DATE '2026-09-07', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 24, 'ASU Career Services', '4809652350', '', NULL, NULL, DATE '2026-09-07', 'vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 25, 'Pre-Health Advising', '6024963300', '', NULL, NULL, DATE '2026-09-07', 'no answer', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 26, 'Casey Dozier', '8506448315', '', 'casey.dozier@fsu.edu src ↗', NULL, DATE '2026-09-14', 'no one is availblae to take the call- leave vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 27, 'PrePhysical Therapy', '8015815020', '', 'info@disability.utah.edu', NULL, DATE '2026-09-14', 'called this number 801-581-8146 but she said they''re not the right department, transfer me to another department wth phone number 801-581-5020 which is THE CENTER FOR DISABILITY ACCESS AT THE UNIVERSITY OF UTAH - the male staff gave me their general email so we can send the details over ///', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 28, 'College Student Council', '8015813414', '', 'admissions@nurs.utah.edu', NULL, DATE '2026-09-14', 'spoke with Lauren --- but she transferred me to the student offices dept- SPoke with Emily- she is trying to check who would be the best person to speak with- She''s not quite sure whom I need to speak with but she gave me email christine.moua@nurs.utah.edu and admissions@nurs.utah.edu which i can send over the details of STudent caregiver program', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 29, 'Utah Geriatrics and Gerontology Society', '8012134156', '', NULL, NULL, DATE '2026-09-14', 'vm - left detailed message about our program', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 30, 'Preprofessional Advising Navigate Hub for Exploring Students', '8015878687', '', 'careersuccess@utah.edu', NULL, DATE '2026-09-14', 'spoke with Hamzo and he said that best email to send the details over is careersuccess@utah.edu', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 31, 'June Coleman', '8128553717', '', 'junecole@iu.edu', NULL, DATE '2026-09-14', 'reach VM and left detailed message', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 32, 'Medical Admissions Preparatory Program (MAPP)', '8015877672', '', 'eric.warner@hsc.utah.edu', NULL, DATE '2026-09-14', 'operator routes vm', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 33, 'Anesthesia SIG', '8128562273', '', 'iucare@iu.educ', NULL, DATE '2026-09-15', 'SPoke with a female staff and she gave me email iucare@iu.educ', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 34, 'Health Professions Programs IU School of Medicine Contact Us', '3174916969', '', 'nbrehl@iu.edu', NULL, DATE '2026-09-15', 'spoke with a female staff and she gave me email of Nicholas nbrehl@iu.edu - the Senior director', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 35, 'Kori Renn', '8128555317', '', 'hirekelley@iu.edu', NULL, DATE '2026-09-15', 'routed to VM -left detailed message. The operator also provided and email hirekelley@iu.edu', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 36, 'Eric Warner', '8015877672', '', 'eric.warner@hsc.utah.edu', NULL, DATE '2026-09-15', 'routed to vm - left message -operator provided email of Eric eric.warner@hsc.utah.edu', NULL, NULL, NULL, NULL, NULL, NULL),
    ('partner', 37, 'Asian Pacific American Medical Student Association (APAMSA)', '', '', NULL, NULL, DATE '2026-09-15', 'vm', NULL, NULL, NULL, NULL, NULL, NULL);

-- ── resolve the match, once ──────────────────────────────────────────────
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

DROP TABLE IF EXISTS _hits;
CREATE TEMP TABLE _hits AS
  SELECT s.id, d.provider_id FROM medjobs_migration_staging s
    JOIN _dir d ON d.phone = s.phone       WHERE s.phone  <> ''
UNION
  SELECT s.id, d.provider_id FROM medjobs_migration_staging s
    JOIN _dir d ON d.phone = s.phone2      WHERE s.phone2 <> ''
UNION
  SELECT s.id, d.provider_id FROM medjobs_migration_staging s
    JOIN _dir d ON d.email_key = s.email   WHERE s.email IS NOT NULL AND s.email <> ''
UNION
  SELECT s.id, d.provider_id FROM medjobs_migration_staging s
    JOIN _dir d ON d.name_key = lower(regexp_replace(s.sheet_name, '\s+', ' ', 'g'))
   WHERE s.phone = '' AND s.phone2 = '' AND (s.email IS NULL OR s.email = '');
CREATE INDEX ON _hits (id);
ANALYZE _hits;

-- Only a hit that is already a record on a board can be overlaid.
DROP TABLE IF EXISTS _onboard;
CREATE TEMP TABLE _onboard AS
SELECT h.id, h.provider_id, so.id AS outreach_id, sc.slug AS campus_slug
  FROM _hits h
  JOIN student_outreach so
    ON so.kind = 'provider'
   AND so.research_data->>'olera_provider_id' = h.provider_id
  JOIN student_outreach_campuses sc ON sc.id = so.campus_id;
CREATE INDEX ON _onboard (id);
ANALYZE _onboard;

UPDATE medjobs_migration_staging s
   SET candidates = c.n
  FROM (SELECT id, count(*) AS n FROM _hits GROUP BY id) c
 WHERE c.id = s.id;

-- The directory match on its own, recorded even when no board carries it.
-- Without this the "in the directory but on no board" rows have nothing to
-- point at, and anything downstream that looks for them finds nothing.
UPDATE medjobs_migration_staging s
   SET dir_provider_id = h.provider_id
  FROM (
    SELECT id, (array_agg(provider_id))[1] AS provider_id
      FROM _hits GROUP BY id HAVING count(*) = 1
  ) h
 WHERE h.id = s.id;
UPDATE medjobs_migration_staging SET candidates = 0 WHERE candidates IS NULL;

-- Exactly one board record: this is the only case we overlay onto.
UPDATE medjobs_migration_staging s
   SET matched_provider_id = o.provider_id,
       outreach_id         = o.outreach_id,
       campus_slug         = o.campus_slug
  FROM (
    SELECT id,
           (array_agg(provider_id))[1] AS provider_id,
           (array_agg(outreach_id))[1] AS outreach_id,
           (array_agg(campus_slug))[1] AS campus_slug
      FROM _onboard GROUP BY id HAVING count(*) = 1
  ) o
 WHERE o.id = s.id;

-- ── decide the rung, from structured fields only ─────────────────────────
-- Nothing here reads the remark prose for a rung. Two archive rules match
-- unambiguous phrases; everything else is decided by whether EMAIL SENT
-- carries a date. The remark text is migrated verbatim into history, but
-- it never decides where a record sits.
UPDATE medjobs_migration_staging s
   SET plan_action = CASE
         WHEN s.outreach_id IS NULL AND s.candidates > 0 AND EXISTS (
                SELECT 1 FROM _onboard o WHERE o.id = s.id)
              THEN 'tie — resolve by hand'
         WHEN s.outreach_id IS NULL AND s.tab = 'partner'
              THEN 'stakeholder — belongs in advisors, not providers'
         WHEN s.outreach_id IS NULL AND s.candidates > 0
              THEN 'in directory, not on a board'
         WHEN s.outreach_id IS NULL
              THEN 'no match — create a new record'
         -- Two guards, both added after the twenty-row check turned up
         -- three matches that looked wrong out of twenty.
         --
         -- First: a phone on several directory rows is a franchise or
         -- switchboard number. Only one branch is on a board, so it
         -- resolves to exactly one record by luck rather than by evidence.
         -- Village Caregiving matched a Madison record on 304-962-5877,
         -- which is the franchise head office in West Virginia.
         WHEN s.candidates > 1
              THEN 'review — number is shared across directory rows'
         -- Second: an area code from nowhere near the campus. The record
         -- is on that board because its coordinates put it there, so a
         -- distant area code means the phone probably belongs to a
         -- different branch of the same brand.
         WHEN s.campus_slug IS NOT NULL AND s.phone <> '' AND left(s.phone,3) <> ALL (
                CASE s.campus_slug
                  WHEN 'u-utah'              THEN ARRAY['801','385','435']
                  WHEN 'arizona-state'       THEN ARRAY['480','602','623','928','520']
                  WHEN 'uw-madison'          THEN ARRAY['608']
                  WHEN 'florida-state'       THEN ARRAY['850']
                  WHEN 'indiana-bloomington' THEN ARRAY['812','930']
                  WHEN 'u-florida'           THEN ARRAY['352','386']
                  ELSE ARRAY[]::text[]
                END)
              THEN 'review — area code is not local to the campus'
         -- A dead number only archives when the remark stops there. Eleven
         -- of the twenty-eight go on to say "search google, got a new
         -- number" — those are live leads, not dead ends, and archiving
         -- them would throw the follow-up away.
         WHEN concat_ws(' ', s.remark1, s.remark2, s.remark3, s.remark4)
                ~* '(no longer in service|does not exist|disconnected|not in service)'
          AND concat_ws(' ', s.remark1, s.remark2, s.remark3, s.remark4)
                !~* '\m(but|however|as per google|alternative|new number|correct number|updated number|other number)\M'
              THEN 'archive — number dead'
         WHEN concat_ws(' ', s.remark1, s.remark2, s.remark3, s.remark4)
                ~* '(no longer in service|does not exist|disconnected|not in service)'
              THEN 'review — number dead but a replacement was mentioned'
         WHEN concat_ws(' ', s.remark1, s.remark2, s.remark3, s.remark4)
                ~* '(not for this program|no longer in their office|wrong (number|department))'
              THEN 'archive — wrong department'
         WHEN s.email_sent IS NOT NULL
              THEN 'overlay — info already sent'
         ELSE 'overlay — still finding the contact'
       END
 WHERE TRUE;

UPDATE medjobs_migration_staging s
   SET plan_step  = CASE WHEN s.plan_action LIKE 'review —%' THEN 0
                         WHEN s.plan_action = 'overlay — info already sent' THEN 2
                         WHEN s.plan_action = 'overlay — still finding the contact' THEN 0
                         ELSE NULL END,
       plan_round = CASE WHEN s.plan_action LIKE 'review —%' THEN 0
                         WHEN s.plan_action = 'overlay — info already sent' THEN 1
                         WHEN s.plan_action = 'overlay — still finding the contact' THEN 0
                         ELSE NULL END,
       plan_reason = CASE
         WHEN s.plan_action = 'archive — number dead'  THEN 'a remark says out of service, with no replacement mentioned'
         WHEN s.plan_action = 'review — number dead but a replacement was mentioned'
              THEN 'out of service, but the remark names another number to try'
         WHEN s.plan_action = 'archive — wrong department' THEN 'a remark says wrong department'
         WHEN s.plan_action = 'review — number is shared across directory rows'
              THEN 'several directory rows carry this number, so the branch is a guess'
         WHEN s.plan_action = 'review — area code is not local to the campus'
              THEN 'the number is not from this campus region'
         WHEN s.plan_action = 'overlay — info already sent' THEN 'EMAIL SENT carries a date'
         WHEN s.plan_action = 'overlay — still finding the contact' THEN 'no EMAIL SENT date, so the contact was never found'
         ELSE 'no record on any board to attach to'
       END
 WHERE TRUE;

-- ── what landed ──────────────────────────────────────────────────────────
SELECT
  plan_action,
  count(*) AS rows,
  count(*) FILTER (WHERE call2 IS NOT NULL) AS with_2plus_calls,
  count(*) FILTER (WHERE email_sent IS NOT NULL) AS info_sent
FROM medjobs_migration_staging
GROUP BY plan_action
ORDER BY rows DESC;
