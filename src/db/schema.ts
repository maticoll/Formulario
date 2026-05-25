import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const respondents = pgTable('respondents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  careerRaw: text('career_raw').notNull(),
  careerNormalized: text('career_normalized'),
  universityName: text('university_name').notNull(),
  universityType: text('university_type').notNull(), // 'publica' | 'privada' | 'otra'
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
  enrichedAnswer: text('enriched_answer'), // null hasta que la IA lo procese
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Respondent = typeof respondents.$inferSelect
export type Response = typeof responses.$inferSelect
