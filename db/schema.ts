import {
  date,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  text,
} from 'drizzle-orm/pg-core';
import type { AnswerValue } from '@/lib/inventory/types';

export const questionAnswers = pgTable(
  'question_answer',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    questionId: text('question_id').notNull(),
    batteryRunId: uuid('battery_run_id'),
    forDate: date('for_date', { mode: 'string' }).notNull(),
    answeredAt: timestamp('answered_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    value: jsonb('value').$type<AnswerValue>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('question_answer_question_for_date_uniq').on(
      t.questionId,
      t.forDate,
    ),
  ],
);
