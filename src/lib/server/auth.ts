import { randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { eq, lt } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { db } from './db';
import { sessions, type Session } from './db/schema';

// Server-only. Never import into client code.

export const SESSION_COOKIE = 'aj_session';

const DEFAULT_TTL_DAYS = 7;
const DAY_MS = 86_400_000;

/**
 * True only when email matches ADMIN_EMAIL and the password verifies against
 * ADMIN_PASSWORD_HASH (argon2). Unset env or any error → false; never throws to
 * the client, so a misconfigured server reads as "wrong credentials".
 */
export async function verifyAdmin(email: string, password: string): Promise<boolean> {
	const adminEmail = env.ADMIN_EMAIL;
	const adminHash = env.ADMIN_PASSWORD_HASH;
	if (!adminEmail || !adminHash) return false;
	// verify() does the constant-time compare on the password; email is a plain
	// equality check (not secret).
	if (email !== adminEmail) return false;
	try {
		return await verify(adminHash, password);
	} catch {
		return false;
	}
}

function ttlDays(): number {
	const n = Number(env.SESSION_TTL_DAYS);
	return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_DAYS;
}

/** Delete all expired session rows. Cheap opportunistic sweep (one query) to keep
 * the table bounded; called from createSession on login. */
export async function sweepExpiredSessions(): Promise<void> {
	await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

/** Create a session row with a random id. Returns id + expiry for the cookie. */
export async function createSession(): Promise<{ id: string; expiresAt: Date }> {
	await sweepExpiredSessions();
	const id = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + ttlDays() * DAY_MS);
	await db.insert(sessions).values({ id, expiresAt });
	return { id, expiresAt };
}

/** Return the session if present and unexpired; delete + return null if expired. */
export async function validateSession(
	id: string
): Promise<(Session & { renewed: boolean }) | null> {
	const [row] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
	if (!row) return null;
	if (row.expiresAt.getTime() <= Date.now()) {
		await destroySession(id);
		return null;
	}
	if (row.expiresAt.getTime() - Date.now() < (ttlDays() * DAY_MS) / 2) {
		const expiresAt = new Date(Date.now() + ttlDays() * DAY_MS);
		await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
		return { ...row, expiresAt, renewed: true };
	}
	return { ...row, renewed: false };
}

export function setSessionCookie(cookies: Cookies, id: string, expiresAt: Date): void {
	cookies.set(SESSION_COOKIE, id, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		expires: expiresAt
	});
}

export async function destroySession(id: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, id));
}
