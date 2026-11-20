import { pgTable, uuid, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	kind: text('kind', { enum: ['project', 'experience'] }).notNull().default('project'),
	company: text('company'),
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
}).enableRLS();

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
}).enableRLS();

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
}).enableRLS();

export const messages = pgTable(
	'messages',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		email: text('email').notNull(),
		body: text('body').notNull(),
		read: boolean('read').notNull().default(false),
		archived: boolean('archived').notNull().default(false),
		spam: boolean('spam').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('messages_spam_created_idx').on(t.spam, t.createdAt)]
).enableRLS();

export const storyChapters = pgTable('story_chapters', {
	id: uuid('id').primaryKey().defaultRandom(),
	kicker: text('kicker').notNull(),
	big: text('big').notNull(),
	body: text('body').notNull(),
	variant: text('variant', { enum: ['text', 'now', 'next'] }).notNull().default('text'),
	rank: integer('rank').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}).enableRLS();

export const siteSettings = pgTable('site_settings', {
	id: text('id').primaryKey().default('site'),
	email: text('email').notNull(),
	githubUrl: text('github_url').notNull(),
	linkedinUrl: text('linkedin_url').notNull(),
	instagramUrl: text('instagram_url').notNull(),
	availability: text('availability').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}).enableRLS();

export const adminSecurity = pgTable('admin_security', {
	id: text('id').primaryKey().default('admin'),
	totpSecret: text('totp_secret'),
	totpEnabled: boolean('totp_enabled').notNull().default(false),
	totpLastStep: integer('totp_last_step'),
	recoveryCodes: text('recovery_codes').array().notNull().default([]),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}).enableRLS();

export const rateLimits = pgTable(
	'rate_limits',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		bucket: text('bucket').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('rate_limits_bucket_created_idx').on(t.bucket, t.createdAt)]
).enableRLS();

export type StoryChapter = typeof storyChapters.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
type AdminSecurity = typeof adminSecurity.$inferSelect;
type RateLimit = typeof rateLimits.$inferSelect;
