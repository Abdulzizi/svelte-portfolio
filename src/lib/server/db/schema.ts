import { pgTable, uuid, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

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

// Blog posts (v2.1). Same patterns as projects: body is sanitized TipTap HTML,
// coverImage is a public Storage URL, published gates public visibility.
export const posts = pgTable('posts', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	excerpt: text('excerpt').notNull(),
	body: text('body'),
	coverImage: text('cover_image'),
	published: boolean('published').notNull().default(false),
	publishedAt: timestamp('published_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
