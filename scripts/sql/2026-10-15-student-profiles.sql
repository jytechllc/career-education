-- Student profiles generated from a resume (src/lib/schema.ts: studentProfiles).
-- Text fields are null when the resume doesn't say; staff fill them in later.
CREATE TABLE IF NOT EXISTS student_profiles (
  id serial PRIMARY KEY,
  name text,
  gender text,
  age integer,
  master_school text,
  phd_school text,
  specialties text,
  target_roles text,
  visa text,
  hobbies text,
  email text,
  phone text,
  redacted_resume_md text,
  resume_r2_key text,
  resume_file_name text,
  resume_mime text,
  -- Drive "Talents" subfolder this profile was imported from (one profile per folder).
  talent_folder_id text UNIQUE,
  field_sources jsonb,
  model text,
  created_by text NOT NULL,
  updated_by text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_profiles_updated_at_idx ON student_profiles (updated_at DESC);
