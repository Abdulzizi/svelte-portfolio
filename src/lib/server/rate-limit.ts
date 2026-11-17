import type { RequestEvent } from '@sveltejs/kit';
import { and, count, eq, gte, lt } from 'drizzle-orm';
import { db } from './db';
import { rateLimits } from './db/schema';

const DAY_MS = 86_400_000;

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
	try {
		const since = new Date(Date.now() - windowMs);
		const [row] = await db
			.select({ n: count() })
			.from(rateLimits)
			.where(and(eq(rateLimits.bucket, bucket), gte(rateLimits.createdAt, since)));
		if ((row?.n ?? 0) >= max) return false;
		await db.insert(rateLimits).values({ bucket });
		await db.delete(rateLimits).where(lt(rateLimits.createdAt, new Date(Date.now() - DAY_MS)));
		return true;
	} catch (e) {
		console.error('rate-limit: db error', e instanceof Error ? e.message : 'unknown');
		return true;
	}
}
