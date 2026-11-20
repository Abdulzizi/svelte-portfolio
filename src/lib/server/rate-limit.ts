import type { RequestEvent } from '@sveltejs/kit';
import { and, count, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from './db';
import { rateLimits } from './db/schema';

export function clientKey(event: Pick<RequestEvent, 'getClientAddress' | 'request'>): string {
	const forwarded = event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
	if (forwarded) return forwarded;
	try {
		return event.getClientAddress();
	} catch {
		return 'unknown';
	}
}

export async function checkRateLimit(bucket: string, max: number, windowMs: number): Promise<boolean> {
	let allowed: boolean;
	try {
		allowed = await db.transaction(async (tx) => {
			await tx.execute(sql`set local lock_timeout = '2s'`);
			await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${bucket}), hashtext(${bucket} || ':2'))`);
			const since = new Date(Date.now() - windowMs);
			const [row] = await tx
				.select({ n: count() })
				.from(rateLimits)
				.where(and(eq(rateLimits.bucket, bucket), gte(rateLimits.createdAt, since)));
			if ((row?.n ?? 0) >= max) return false;
			await tx.insert(rateLimits).values({ bucket });
			return true;
		});
	} catch (e) {
		console.error('rate-limit: db error', e instanceof Error ? e.message : 'unknown');
		return false;
	}
	if (allowed) {
		try {
			await db.delete(rateLimits).where(lt(rateLimits.createdAt, new Date(Date.now() - 86_400_000)));
		} catch (e) {
			console.error('rate-limit: cleanup error', e instanceof Error ? e.message : 'unknown');
		}
	}
	return allowed;
}
