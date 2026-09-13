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
