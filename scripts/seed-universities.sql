-- Seed Texas universities for MedJobs launch market
-- Run in Supabase SQL editor after migration 019

INSERT INTO public.medjobs_universities (name, slug, city, state, lat, lng) VALUES
-- Major research universities
('University of Texas at Austin', 'ut-austin', 'Austin', 'TX', 30.2849, -97.7341),
('Texas A&M University', 'texas-a-m', 'College Station', 'TX', 30.6187, -96.3365),
('Rice University', 'rice', 'Houston', 'TX', 29.7174, -95.4018),
('Baylor University', 'baylor', 'Waco', 'TX', 31.5488, -97.1131),
('Southern Methodist University', 'smu', 'Dallas', 'TX', 32.8426, -96.7847),
('Texas Christian University', 'tcu', 'Fort Worth', 'TX', 32.7098, -97.3628),
('University of Houston', 'u-houston', 'Houston', 'TX', 29.7199, -95.3422),

-- UT System
('University of Texas at Dallas', 'ut-dallas', 'Richardson', 'TX', 32.9857, -96.7502),
('University of Texas at San Antonio', 'utsa', 'San Antonio', 'TX', 29.5830, -98.6190),
('University of Texas at Arlington', 'uta', 'Arlington', 'TX', 32.7299, -97.1131),
('University of Texas at El Paso', 'utep', 'El Paso', 'TX', 31.7697, -106.5042),
('University of Texas Rio Grande Valley', 'utrgv', 'Edinburg', 'TX', 26.3070, -98.1736),
('University of Texas at Tyler', 'ut-tyler', 'Tyler', 'TX', 32.3160, -95.2530),
('University of Texas Permian Basin', 'utpb', 'Odessa', 'TX', 31.8621, -102.3441),

-- Texas A&M System
('Texas A&M University-Corpus Christi', 'tamu-cc', 'Corpus Christi', 'TX', 27.7120, -97.3256),
('Texas A&M University-Kingsville', 'tamu-kingsville', 'Kingsville', 'TX', 27.5263, -97.8822),
('Texas A&M University-Commerce', 'tamu-commerce', 'Commerce', 'TX', 33.2290, -95.9093),
('Prairie View A&M University', 'prairie-view', 'Prairie View', 'TX', 30.0880, -95.9860),
('Tarleton State University', 'tarleton', 'Stephenville', 'TX', 32.2183, -98.2107),
('West Texas A&M University', 'west-texas-am', 'Canyon', 'TX', 34.9870, -101.9207),

-- Health/nursing-focused
('UT Health San Antonio', 'ut-health-sa', 'San Antonio', 'TX', 29.5082, -98.5780),
('UT Health Houston', 'ut-health-houston', 'Houston', 'TX', 29.7108, -95.3969),
('UT Southwestern Medical Center', 'ut-southwestern', 'Dallas', 'TX', 32.8121, -96.8408),
('Texas Tech University Health Sciences Center', 'ttuhsc', 'Lubbock', 'TX', 33.4610, -101.8475),
('Baylor College of Medicine', 'baylor-med', 'Houston', 'TX', 29.7104, -95.3965),
('Texas Woman''s University', 'twu', 'Denton', 'TX', 33.2279, -97.1454),

-- Large state universities
('Texas Tech University', 'texas-tech', 'Lubbock', 'TX', 33.5843, -101.8457),
('Texas State University', 'texas-state', 'San Marcos', 'TX', 29.8884, -97.9384),
('University of North Texas', 'unt', 'Denton', 'TX', 33.2107, -97.1486),
('Sam Houston State University', 'shsu', 'Huntsville', 'TX', 30.7164, -95.5501),
('Stephen F. Austin State University', 'sfa', 'Nacogdoches', 'TX', 31.6225, -94.6502),
('Lamar University', 'lamar', 'Beaumont', 'TX', 30.0561, -94.0937),
('Midwestern State University', 'midwestern', 'Wichita Falls', 'TX', 33.8765, -98.5200),
('Sul Ross State University', 'sul-ross', 'Alpine', 'TX', 30.3604, -103.6610),

-- Private universities
('Trinity University', 'trinity', 'San Antonio', 'TX', 29.4619, -98.4833),
('St. Edward''s University', 'st-edwards', 'Austin', 'TX', 30.2310, -97.7559),
('Abilene Christian University', 'acu', 'Abilene', 'TX', 32.4390, -99.7092),
('Hardin-Simmons University', 'hardin-simmons', 'Abilene', 'TX', 32.4548, -99.7371),
('University of the Incarnate Word', 'uiw', 'San Antonio', 'TX', 29.4655, -98.4634),
('Dallas Baptist University', 'dbu', 'Dallas', 'TX', 32.7060, -96.9012),
('Houston Baptist University', 'hbu', 'Houston', 'TX', 29.7191, -95.5501),
('Lubbock Christian University', 'lcu', 'Lubbock', 'TX', 33.5530, -101.8990),

-- Community colleges with nursing programs (high-volume student source)
('Lone Star College', 'lone-star', 'Houston', 'TX', 30.0467, -95.4565),
('Dallas College', 'dallas-college', 'Dallas', 'TX', 32.8193, -96.8556),
('Tarrant County College', 'tcc', 'Fort Worth', 'TX', 32.7466, -97.3408),
('San Antonio College', 'san-antonio-college', 'San Antonio', 'TX', 29.4620, -98.5050),
('Austin Community College', 'acc', 'Austin', 'TX', 30.3937, -97.7266),
('Collin College', 'collin', 'McKinney', 'TX', 33.1982, -96.6397),
('Alamo Colleges District', 'alamo-colleges', 'San Antonio', 'TX', 29.4236, -98.4928),
('El Paso Community College', 'epcc', 'El Paso', 'TX', 31.8004, -106.4254)
ON CONFLICT (slug) DO NOTHING;
