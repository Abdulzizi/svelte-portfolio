import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { messages, type Message, type NewMessage } from './db/schema';

export async function createMessage(data: Pick<NewMessage, 'name' | 'email' | 'body'>): Promise<Message> {
	const [row] = await db.insert(messages).values(data).returning();
	return row;
}

export type MessageView = 'inbox' | 'archived' | 'spam' | 'all';
type MessageCounts = { inbox: number; archived: number; spam: number; all: number };

const viewWhere = {
	inbox: and(eq(messages.archived, false), eq(messages.spam, false)),
	archived: and(eq(messages.archived, true), eq(messages.spam, false)),
	spam: eq(messages.spam, true),
	all: undefined
};

export async function listMessages(
	view: MessageView = 'inbox',
	page = 1
): Promise<{ messages: Message[]; counts: MessageCounts; hasMore: boolean; page: number }> {
	const [rows, [c]] = await Promise.all([
		db
			.select()
			.from(messages)
			.where(viewWhere[view])
			.orderBy(desc(messages.createdAt), desc(messages.id))
			.limit(101)
			.offset((page - 1) * 100),
		db
			.select({
				inbox: sql<number>`count(*) filter (where not archived and not spam)::int`,
				archived: sql<number>`count(*) filter (where archived and not spam)::int`,
				spam: sql<number>`count(*) filter (where spam)::int`,
				all: sql<number>`count(*)::int`
			})
			.from(messages)
	]);
	const hasMore = rows.length > 100;
	return { messages: hasMore ? rows.slice(0, 100) : rows, counts: c, hasMore, page };
}

export async function countUnread(): Promise<number> {
	const [row] = await db
		.select({ n: sql<number>`count(*)::int` })
		.from(messages)
		.where(and(eq(messages.read, false), eq(messages.archived, false), eq(messages.spam, false)));
	return row.n;
}

export async function setRead(id: string, read: boolean): Promise<void> {
	await db.update(messages).set({ read }).where(eq(messages.id, id));
}

export async function setArchived(id: string, archived: boolean): Promise<void> {
	await db.update(messages).set({ archived }).where(eq(messages.id, id));
}

export async function setSpam(id: string, spam: boolean): Promise<void> {
	await db.update(messages).set({ spam }).where(eq(messages.id, id));
}

export async function markAllRead(): Promise<void> {
	await db
		.update(messages)
		.set({ read: true })
		.where(and(eq(messages.read, false), eq(messages.archived, false), eq(messages.spam, false)));
}

export async function deleteMessage(id: string): Promise<void> {
	await db.delete(messages).where(eq(messages.id, id));
}
