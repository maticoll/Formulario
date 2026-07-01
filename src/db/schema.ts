import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'

export const respondents = pgTable('respondents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  careerRaw: text('career_raw').notNull(),
  careerNormalized: text('career_normalized'),
  universityName: text('university_name').notNull(),
  universityType: text('university_type').notNull(),
  yearStage: text('year_stage').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const responses = pgTable('responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  respondentId: uuid('respondent_id')
    .notNull()
    .references(() => respondents.id),
  questionKey: text('question_key').notNull(),
  rawAnswer: text('raw_answer').notNull(),
  enrichedAnswer: text('enriched_answer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const explorerSessions = pgTable('explorer_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  preAnswers: jsonb('pre_answers'),
  profileArea: text('profile_area'),
  suggestedCareers: jsonb('suggested_careers'),
  usefulRating: text('useful_rating'),
  leaning: text('leaning'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const careerSummaries = pgTable('career_summaries', {
  careerKey: text('career_key').primaryKey(),
  summary: jsonb('summary').notNull(),
  model: text('model'),
  responsesCount: integer('responses_count'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
})

export type Respondent = typeof respondents.$inferSelect
export type Response = typeof responses.$inferSelect
export type ExplorerSession = typeof explorerSessions.$inferSelect
export type CareerSummary = typeof careerSummaries.$inferSelect
