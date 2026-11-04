import { asc, desc, eq } from 'drizzle-orm';
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
