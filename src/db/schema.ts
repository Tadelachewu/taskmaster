import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description').notNull(),
  deadline: timestamp('deadline', { withTimezone: true }).notNull(),
  importance: text('importance', { enum: ['low', 'medium', 'high'] }).notNull(),
  predictedEffort: varchar('predicted_effort', { length: 256 }).notNull(),
  completed: boolean('completed').default(false).notNull(),
  priorityScore: integer('priority_score'),
  reasoning: text('reasoning'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks);
export const selectTaskSchema = createSelectSchema(tasks);
