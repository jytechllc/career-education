-- Case handling on student profiles (edu /admin/profiles/[id], 学员 page).
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS case_status text;      -- new | active | closed
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS owner_partner_id int;  -- null = JYEdu directly
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS poc text;              -- counsellor point of contact
