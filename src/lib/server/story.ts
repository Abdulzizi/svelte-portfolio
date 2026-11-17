import { asc, count, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { storyChapters, type StoryChapter } from './db/schema';
import { chapters as defaults } from '../about-story';

export type ChapterInput = Pick<StoryChapter, 'kicker' | 'big' | 'body' | 'variant'>;

export function listChapters(): Promise<StoryChapter[]> {
	return db.select().from(storyChapters).orderBy(asc(storyChapters.rank), asc(storyChapters.createdAt));
}

export async function createChapter(data: ChapterInput): Promise<StoryChapter> {
	const [{ next }] = await db
		.select({ next: sql<number>`coalesce(max(${storyChapters.rank}) + 1, 0)::int` })
		.from(storyChapters);
	const [row] = await db
		.insert(storyChapters)
		.values({ ...data, rank: next })
		.returning();
	return row;
}

export async function updateChapter(id: string, data: ChapterInput): Promise<StoryChapter | null> {
	const [row] = await db
		.update(storyChapters)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(storyChapters.id, id))
		.returning();
	return row ?? null;
}

export async function deleteChapter(id: string): Promise<void> {
	await db.delete(storyChapters).where(eq(storyChapters.id, id));
}

export async function reorder(id: string, dir: 'up' | 'down'): Promise<boolean> {
	return db.transaction(async (tx) => {
		const rows = await tx
			.select({ id: storyChapters.id })
			.from(storyChapters)
			.orderBy(asc(storyChapters.rank), asc(storyChapters.createdAt));
		const i = rows.findIndex((r) => r.id === id);
		const j = dir === 'up' ? i - 1 : i + 1;
		if (i < 0 || j < 0 || j >= rows.length) return false;
		[rows[i], rows[j]] = [rows[j], rows[i]];
		for (const [rank, r] of rows.entries()) {
			await tx.update(storyChapters).set({ rank }).where(eq(storyChapters.id, r.id));
		}
		return true;
	});
}

export async function seedDefaults(): Promise<boolean> {
	return db.transaction(async (tx) => {
		const [{ n }] = await tx.select({ n: count() }).from(storyChapters);
		if (n > 0) return false;
		await tx
			.insert(storyChapters)
			.values(
				defaults.map((c, rank) => ({
					kicker: c.kicker,
					big: c.big,
					body: c.text,
					variant: c.variant,
					rank
				}))
			);
		return true;
	});
}
