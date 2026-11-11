import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	if (env.CRON_SECRET && request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
		return new Response('Unauthorized', { status: 401 });
	}
	await db.execute(sql`select 1`);
	return json({ ok: true });
};
