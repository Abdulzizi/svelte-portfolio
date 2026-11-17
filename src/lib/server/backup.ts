import { z } from 'zod';
import { db } from './db';
import { projects, posts, storyChapters, siteSettings, messages } from './db/schema';
import { sanitizeBody } from './sanitize';

const id = z.string().uuid();
const date = z.string().datetime({ offset: true }).transform((v) => new Date(v));
const nullDate = date.nullable();
const text = (max: number) => z.string().max(max);
const nullText = (max: number) => z.string().max(max).nullable();

const project = z.strictObject({
	id,
	title: text(200).min(1),
	kind: z.enum(['project', 'experience']),
	company: nullText(200),
	role: text(200).min(1),
	year: text(40).min(1),
	stack: z.array(text(80).min(1)).max(50),
	impact: text(2000).min(1),
	problem: text(5000),
	result: text(5000),
	body: nullText(200000),
	imagePath: nullText(500),
	featured: z.boolean(),
	rank: z.number().int(),
	createdAt: date,
	updatedAt: date
});

const post = z.strictObject({
	id,
	title: text(200).min(1),
	slug: text(200)
		.min(1)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	excerpt: text(300).min(1),
	body: nullText(200000),
	coverImage: nullText(500),
	published: z.boolean(),
	publishedAt: nullDate,
	createdAt: date,
	updatedAt: date
});

const chapter = z.strictObject({
	id,
	kicker: text(40).min(1),
	big: text(160).min(1),
	body: text(600).min(1),
	variant: z.enum(['text', 'now', 'next']),
	rank: z.number().int(),
	createdAt: date,
	updatedAt: date
});

const setting = z.strictObject({
	id: text(40).min(1),
	email: text(254).min(1).email(),
	githubUrl: text(300).min(1),
	linkedinUrl: text(300).min(1),
	instagramUrl: text(300).min(1),
	availability: text(80).min(1),
	updatedAt: date
});

const sections = {
	projects: project,
	posts: post,
	storyChapters: chapter,
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
		const rows = obj[name];
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
		for (const { id: rid, ...row } of data.siteSettings) {
			await tx.insert(siteSettings).values({ id: rid, ...row }).onConflictDoUpdate({ target: siteSettings.id, set: row });
		}
	});
	return {
		projects: data.projects.length,
		posts: data.posts.length,
		storyChapters: data.storyChapters.length,
		siteSettings: data.siteSettings.length
	};
}
