import { desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { messages, type Message, type NewMessage } from './db/schema';

export async function createMessage(data: Pick<NewMessage, 'name' | 'email' | 'body'>): Promise<Message> {
	const [row] = await db.insert(messages).values(data).returning();
	return row;
}

export function listMessages(): Promise<Message[]> {
	return db.select().from(messages).orderBy(desc(messages.createdAt));
}

export async function countUnread(): Promise<number> {
	const [row] = await db
		.select({ n: sql<number>`count(*)::int` })
		.from(messages)
		.where(eq(messages.read, false));
	return row.n;
}

export async function setRead(id: string, read: boolean): Promise<void> {
	await db.update(messages).set({ read }).where(eq(messages.id, id));
}

export async function deleteMessage(id: string): Promise<void> {
	await db.delete(messages).where(eq(messages.id, id));
}
