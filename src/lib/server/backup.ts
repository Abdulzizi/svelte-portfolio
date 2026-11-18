import { z } from 'zod';
import { db } from './db';
import { projects, posts, storyChapters, siteSettings, messages } from './db/schema';
import { sanitizeBody } from './sanitize';
import { LIMITS, httpsUrl } from '../validation';
import { EMAIL_RE } from '../email';

const id = z.string().uuid();
const date = z.string().datetime({ offset: true }).transform((v) => new Date(v));
const nullDate = date.nullable();
const text = (max: number) => z.string().max(max);
const nullText = (max: number) => z.string().max(max).nullable();

const project = z.strictObject({
	id,
	title: text(LIMITS.project.title).min(1),
	kind: z.enum(['project', 'experience']),
	company: nullText(LIMITS.project.company),
	role: text(LIMITS.project.role).min(1),
	year: text(LIMITS.project.year).min(1),
	stack: z.array(text(LIMITS.project.stackItem).min(1)).max(LIMITS.project.stack),
	impact: text(LIMITS.project.impact).min(1),
	problem: text(LIMITS.project.problem),
	result: text(LIMITS.project.result),
	body: nullText(LIMITS.project.body),
	imagePath: nullText(LIMITS.project.imagePath),
	featured: z.boolean(),
	rank: z.number().int(),
	createdAt: date,
	updatedAt: date
});

const post = z.strictObject({
	id,
	title: text(LIMITS.post.title).min(1),
	slug: text(LIMITS.post.slug)
		.min(1)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	excerpt: text(LIMITS.post.excerpt).min(1),
	body: nullText(LIMITS.post.body),
	coverImage: nullText(LIMITS.post.coverImage),
	published: z.boolean(),
	publishedAt: nullDate,
	createdAt: date,
	updatedAt: date
});

const chapter = z.strictObject({
	id,
	kicker: text(LIMITS.chapter.kicker).min(1),
	big: text(LIMITS.chapter.big).min(1),
	body: text(LIMITS.chapter.body).min(1),
	variant: z.enum(['text', 'now', 'next']),
	rank: z.number().int(),
	createdAt: date,
	updatedAt: date
});

const setting = z.strictObject({
	id: text(40).min(1),
	email: text(LIMITS.settings.email).min(1).email(),
	githubUrl: httpsUrl,
	linkedinUrl: httpsUrl,
	instagramUrl: httpsUrl,
	availability: text(LIMITS.settings.availability).min(1),
	updatedAt: date
});

const message = z.strictObject({
	id,
	name: z.string().min(1).max(LIMITS.message.name),
	email: z.string().min(1).max(LIMITS.message.email).regex(EMAIL_RE),
	body: z.string().min(1).max(LIMITS.message.body),
	read: z.boolean(),
	archived: z.boolean(),
	spam: z.boolean(),
	createdAt: date
});

const sections = {
	projects: project,
	posts: post,
	storyChapters: chapter,
	messages: message,
	siteSettings: setting
} as const;

export type BackupSection = keyof typeof sections;
export type RestoreCounts = Record<BackupSection, number>;

export async function buildExport() {
	const [p, po, sc, ss, m] = await Promise.all([
		db.select().from(projects),
		db.select().from(posts),
		db.select().from(storyChapters),
		db.select().from(siteSettings),
		db.select().from(messages)
	]);
	return {
		version: 1,
		exportedAt: new Date().toISOString(),
		projects: p,
		posts: po,
		storyChapters: sc,
		messages: m,
		siteSettings: ss
	};
}

export function parseBackup(raw: string): { ok: true; data: { [K in BackupSection]: z.output<(typeof sections)[K]>[] } } | { ok: false; error: string } {
	let json: unknown;
	try {
		json = JSON.parse(raw);
	} catch {
		return { ok: false, error: 'File is not valid JSON.' };
	}
	if (!json || typeof json !== 'object' || (json as { version?: unknown }).version !== 1) {
		return { ok: false, error: 'Unsupported backup: version must be 1.' };
	}
	const obj = json as Record<string, unknown>;
	const out: Record<string, unknown[]> = {};
	for (const name of Object.keys(sections) as BackupSection[]) {
		const rows = name === 'messages' && obj[name] === undefined ? [] : obj[name];
		if (!Array.isArray(rows)) return { ok: false, error: `Section "${name}" must be an array.` };
		const seen = new Set<string>();
		const parsed: unknown[] = [];
		for (const [i, row] of rows.entries()) {
			const r = sections[name].safeParse(row);
			if (!r.success) {
				const issue = r.error.issues[0];
				const path = issue.path.join('.') || 'row';
				return { ok: false, error: `Section "${name}", index ${i}: ${path}: ${issue.message}` };
			}
			const rid = (r.data as { id: string }).id;
			if (seen.has(rid)) return { ok: false, error: `Section "${name}", index ${i}: duplicate id.` };
			seen.add(rid);
			parsed.push(r.data);
		}
		out[name] = parsed;
	}
	return { ok: true, data: out as never };
}

export async function restoreMerge(data: Extract<ReturnType<typeof parseBackup>, { ok: true }>['data']): Promise<RestoreCounts> {
	await db.transaction(async (tx) => {
		for (const { id: rid, ...rest } of data.projects) {
			const row = { ...rest, body: rest.body ? sanitizeBody(rest.body) || null : null };
			await tx.insert(projects).values({ id: rid, ...row }).onConflictDoUpdate({ target: projects.id, set: row });
		}
		for (const { id: rid, ...rest } of data.posts) {
			const row = { ...rest, body: rest.body ? sanitizeBody(rest.body) || null : null };
			await tx.insert(posts).values({ id: rid, ...row }).onConflictDoUpdate({ target: posts.id, set: row });
		}
		for (const { id: rid, ...row } of data.storyChapters) {
			await tx.insert(storyChapters).values({ id: rid, ...row }).onConflictDoUpdate({ target: storyChapters.id, set: row });
		}
		for (const { id: rid, ...row } of data.messages) {
			await tx.insert(messages).values({ id: rid, ...row }).onConflictDoUpdate({ target: messages.id, set: row });
		}
		for (const { id: rid, ...row } of data.siteSettings) {
			await tx.insert(siteSettings).values({ id: rid, ...row }).onConflictDoUpdate({ target: siteSettings.id, set: row });
		}
	});
	return {
		projects: data.projects.length,
		posts: data.posts.length,
		storyChapters: data.storyChapters.length,
		messages: data.messages.length,
		siteSettings: data.siteSettings.length
	};
}
