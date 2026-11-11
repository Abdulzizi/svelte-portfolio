import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { db } from './db';
import { posts, type NewPost, type Post } from './db/schema';

// Server-only. Never import into client code.

const listColumns = {
	id: posts.id,
	title: posts.title,
	slug: posts.slug,
	excerpt: posts.excerpt,
	coverImage: posts.coverImage,
	published: posts.published,
	publishedAt: posts.publishedAt,
	createdAt: posts.createdAt,
	updatedAt: posts.updatedAt
};

/** Published posts for public use: newest published first, nulls last, then newest created. */
export function listPublished() {
	return db
		.select(listColumns)
		.from(posts)
		.where(eq(posts.published, true))
		.orderBy(sql`${posts.publishedAt} desc nulls last`, desc(posts.createdAt));
}

/** All posts for the admin list: newest created first. */
export function listAllPosts() {
	return db.select(listColumns).from(posts).orderBy(desc(posts.createdAt));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
	const [row] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
	return row ?? null;
}

export async function getPost(id: string): Promise<Post | null> {
	const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
	return row ?? null;
}

export async function createPost(data: NewPost): Promise<Post> {
	const [row] = await db.insert(posts).values(data).returning();
	return row;
}

export async function updatePost(id: string, data: Partial<NewPost>): Promise<Post | null> {
	const [row] = await db
		.update(posts)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(posts.id, id))
		.returning();
	return row ?? null;
}

export async function deletePost(id: string): Promise<void> {
	await db.delete(posts).where(eq(posts.id, id));
}

/** True if a post with this slug exists (optionally excluding one id, for edit). */
export async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
	const where = exceptId
		? and(eq(posts.slug, slug), ne(posts.id, exceptId))
		: eq(posts.slug, slug);
	const [row] = await db.select({ id: posts.id }).from(posts).where(where).limit(1);
	return row != null;
}
