import { json } from '@sveltejs/kit';
import { and, eq, lt, sql } from 'drizzle-orm';
import { timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

function authorized(header: string | null): boolean {
	const secret = env.CRON_SECRET;
	if (!secret || !header) return false;
	const given = Buffer.from(header);
	const expected = Buffer.from(`Bearer ${secret}`);
	return given.length === expected.length && timingSafeEqual(given, expected);
}

export const GET: RequestHandler = async ({ request }) => {
	if (!authorized(request.headers.get('authorization'))) {
		return new Response('Unauthorized', { status: 401 });
	}
	await db.execute(sql`select 1`);
	await db
		.delete(messages)
		.where(and(eq(messages.spam, true), lt(messages.createdAt, sql`now() - interval '30 days'`)));
	return json({ ok: true });
};
