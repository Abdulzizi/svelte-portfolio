import { count, eq, max, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { messages, posts, projects, storyChapters } from './db/schema';

export type Stat<T> = { ok: true; value: T } | { ok: false };
export type Storage = { bytes: number; truncated: boolean };

const MAX_OBJECTS = 300;
const PAGE = 100;
const TTL = 60_000;

let cache: { at: number; value: Storage } | null = null;

export async function safe<T>(p: Promise<T>): Promise<Stat<T>> {
	try {
		return { ok: true, value: await p };
	} catch {
		return { ok: false };
	}
}

export async function messageTotal(): Promise<number> {
	const [row] = await db.select({ n: count() }).from(messages);
	return row.n;
}

export async function postStats(): Promise<{ published: number; drafts: number; lastPublished: Date | null }> {
	const [row] = await db
		.select({
			published: sql<number>`count(*) filter (where ${posts.published})::int`,
			drafts: sql<number>`count(*) filter (where not ${posts.published})::int`,
			last: max(posts.publishedAt)
		})
		.from(posts);
	return { published: row.published, drafts: row.drafts, lastPublished: row.last ?? null };
}

export async function experienceCount(): Promise<number> {
	const [row] = await db.select({ n: count() }).from(projects).where(eq(projects.kind, 'experience'));
	return row.n;
}

export async function chapterCount(): Promise<number> {
	const [row] = await db.select({ n: count() }).from(storyChapters);
	return row.n;
}

type Entry = { id: string | null; name: string; metadata: { size?: number } | null };

async function listStorage(): Promise<Storage> {
	const key = env.SUPABASE_SERVICE_ROLE_KEY ?? '';
	const bucket = env.SUPABASE_BUCKET || 'images';
	const url = `${env.SUPABASE_URL}/storage/v1/object/list/${bucket}`;
	const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
	let bytes = 0;
	let seen = 0;
	let truncated = false;
	const queue = [''];
	while (queue.length) {
		const prefix = queue.shift() as string;
		for (let offset = 0; ; offset += PAGE) {
			const res = await fetch(url, {
				method: 'POST',
				headers,
				body: JSON.stringify({ prefix, limit: PAGE, offset }),
				signal: AbortSignal.timeout(5000)
			});
			if (!res.ok) throw new Error(`storage list ${res.status}`);
			const rows = (await res.json()) as Entry[];
			for (const r of rows) {
				if (r.id === null) {
					queue.push(prefix ? `${prefix}/${r.name}` : r.name);
					continue;
				}
				if (seen >= MAX_OBJECTS) {
					truncated = true;
					return { bytes, truncated };
				}
				seen++;
				bytes += r.metadata?.size ?? 0;
			}
			if (rows.length < PAGE) break;
		}
	}
	return { bytes, truncated };
}

export async function storageUsed(): Promise<Storage> {
	if (cache && Date.now() - cache.at < TTL) return cache.value;
	const value = await listStorage();
	cache = { at: Date.now(), value };
	return value;
}
