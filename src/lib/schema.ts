import {
  pgTable,
  text,
  timestamp,
  serial,
  integer,
  boolean,
  date,
  numeric,
} from "drizzle-orm/pg-core";

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  auth0Id: text("auth0_id").unique().notNull(),

  // Identity
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  preferredLanguage: text("preferred_language"),

  // Voluntary EEO disclosures
  gender: text("gender"),
  ethnicity: text("ethnicity"),
  veteranStatus: text("veteran_status"),
  disability: text("disability"),

  // Job preferences
  expectedSalary: numeric("expected_salary"),
  authorizedInCountry: boolean("authorized_in_country"),
  validDrivingLicense: boolean("valid_driving_license"),
  needsVisaSponsorship: boolean("needs_visa_sponsorship"),
  availableDate: date("available_date"),
  yearsOfExperience: integer("years_of_experience"),
  jobType: text("job_type"),
  fullyRemote: boolean("fully_remote"),

  // Links + address
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipcode: text("zipcode"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;

// Auto-generated job-market / career blog posts.
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  locale: text("locale").notNull().default("zh"),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content").notNull(), // markdown
  category: text("category"),
  topic: text("topic"), // rotation topic key
  tags: text("tags").array(),
  source: text("source").default("ai"), // ai | grok | manual
  model: text("model"),
  status: text("status").notNull().default("published"),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

// A referral/coaching partner org (e.g. Awesome College Coaching) that
// receives student applications submitted through our site.
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Partner = typeof partners.$inferSelect;

// One login per partner org for the read-only portal (not Auth0 — partners
// are external orgs, not JYEdu students/staff, so this is a separate,
// deliberately minimal credential store).
export const partnerCredentials = pgTable("partner_credentials", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id")
    .references(() => partners.id, { onDelete: "cascade" })
    .notNull(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Full student application intake — field set mirrors
// docs/partners/awesome/Awesome_College_Coaching_Student_Application_Complete_Fillable(2).pdf
// so a partner's existing paper/PDF process maps 1:1 onto what we capture.
export const collegeCoachingApplications = pgTable(
  "college_coaching_applications",
  {
    id: serial("id").primaryKey(),
    partnerId: integer("partner_id")
      .references(() => partners.id, { onDelete: "restrict" })
      .notNull(),
    locale: text("locale").notNull().default("zh"),

    // 1. Applicant information
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    dateOfBirth: date("date_of_birth"),
    city: text("city"),
    state: text("state"),
    countryOfCitizenship: text("country_of_citizenship"),

    // 2. Academic profile
    currentSchool: text("current_school"),
    currentGradeLevel: text("current_grade_level"),
    expectedGraduationYear: text("expected_graduation_year"),
    intendedMajor: text("intended_major"),
    dreamSchools: text("dream_schools"),
    academicSupportNeeded: text("academic_support_needed"),
    specialAccommodations: text("special_accommodations"),

    // 3. Areas of support requested (checkboxes)
    supportAreas: text("support_areas").array(),
    otherSupportDetails: text("other_support_details"),

    // 4. Parent / guardian information
    primaryGuardianEmail: text("primary_guardian_email"),
    householdStatus: text("household_status"),
    motherName: text("mother_name"),
    motherEmail: text("mother_email"),
    motherPhone: text("mother_phone"),
    fatherName: text("father_name"),
    fatherEmail: text("father_email"),
    fatherPhone: text("father_phone"),

    // 6. Student background
    hobbiesInterests: text("hobbies_interests"),
    extracurriculars: text("extracurriculars"),
    studentStrengths: text("student_strengths"),
    areasForImprovement: text("areas_for_improvement"),
    personalChallenges: text("personal_challenges"),
    studentMotivation: text("student_motivation"),

    // 7. Parent assessment
    parentViewStrengths: text("parent_view_strengths"),
    parentViewGrowthAreas: text("parent_view_growth_areas"),
    parentViewMotivation: text("parent_view_motivation"),
    parentViewChallenges: text("parent_view_challenges"),
    coachingGoals: text("coaching_goals"),
    communityImpactGoals: text("community_impact_goals"),

    // 8. Submission details
    hearAboutUs: text("hear_about_us").array(),
    referralName: text("referral_name"),
    otherSource: text("other_source"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export type CollegeCoachingApplication =
  typeof collegeCoachingApplications.$inferSelect;
export type NewCollegeCoachingApplication =
  typeof collegeCoachingApplications.$inferInsert;

// 5. Uploaded / supporting documents — stored in R2, one row per file.
export const applicationFiles = pgTable("application_files", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .references(() => collegeCoachingApplications.id, { onDelete: "cascade" })
    .notNull(),
  kind: text("kind").notNull(), // 'transcript' | 'test_scores'
  fileName: text("file_name").notNull(),
  r2Key: text("r2_key").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export type ApplicationFile = typeof applicationFiles.$inferSelect;
