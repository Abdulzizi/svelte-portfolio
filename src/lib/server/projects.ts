import { asc, desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { projects, type NewProject, type Project } from './db/schema';

// Server-only. Never import into client code.

/** All projects for the admin list: featured first, then rank, then oldest. */
export function listAll(): Promise<Project[]> {
	return db
		.select()
		.from(projects)
		.orderBy(desc(projects.featured), asc(projects.rank), asc(projects.createdAt));
}

/** Featured projects, rank-ordered (step 6: featured rail). */
export function listFeatured(): Promise<Project[]> {
	return db
		.select()
		.from(projects)
		.where(eq(projects.featured, true))
		.orderBy(asc(projects.rank), asc(projects.createdAt));
}

/** Non-featured projects, rank-ordered (step 6: "the rest" plane). */
export function listRest(): Promise<Project[]> {
	return db
		.select()
		.from(projects)
		.where(eq(projects.featured, false))
		.orderBy(asc(projects.rank), asc(projects.createdAt));
}

export async function getProject(id: string): Promise<Project | null> {
	const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
	return row ?? null;
}

export async function createProject(data: NewProject): Promise<Project> {
	const [row] = await db.insert(projects).values(data).returning();
	return row;
}

export async function updateProject(
	id: string,
	data: Partial<NewProject>
): Promise<Project | null> {
	const [row] = await db
		.update(projects)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(projects.id, id))
		.returning();
	return row ?? null;
}

export async function deleteProject(id: string): Promise<void> {
	await db.delete(projects).where(eq(projects.id, id));
}

export async function projectCounts(): Promise<{ total: number; featured: number }> {
	const [row] = await db
		.select({
			total: sql<number>`count(*)::int`,
			featured: sql<number>`(count(*) filter (where ${projects.featured}))::int`
		})
		.from(projects);
	return row;
}

export function listRecentProjects(limit: number) {
	return db
		.select({ id: projects.id, title: projects.title, updatedAt: projects.updatedAt })
		.from(projects)
		.orderBy(desc(projects.updatedAt))
		.limit(limit);
}

export async function reorderProjects(ids: string[]): Promise<boolean> {
	return db.transaction(async (tx) => {
		const existing = await tx.select({ id: projects.id }).from(projects);
		const known = new Set(existing.map((r) => r.id));
		if (ids.length !== known.size || new Set(ids).size !== ids.length) return false;
		if (!ids.every((id) => known.has(id))) return false;
		for (let i = 0; i < ids.length; i++) {
			await tx.update(projects).set({ rank: i }).where(eq(projects.id, ids[i]));
		}
		return true;
	});
}
