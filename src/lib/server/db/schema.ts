import { pgTable, uuid, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

// blog table intentionally omitted — reserved/deferred per SPEC (no blog CRUD in v2).

export const projects = pgTable('projects', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	role: text('role').notNull(),
	year: text('year').notNull(),
	stack: text('stack').array().notNull().default([]),
	impact: text('impact').notNull(),
	problem: text('problem').notNull(),
	result: text('result').notNull(),
	body: text('body'),
	imagePath: text('image_path'),
	featured: boolean('featured').notNull().default(false),
	rank: integer('rank').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
