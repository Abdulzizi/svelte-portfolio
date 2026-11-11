import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, setSessionCookie, validateSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const id = event.cookies.get(SESSION_COOKIE);
	// One DB lookup, only when a cookie is present.
	const session = id ? await validateSession(id) : null;
	if (session?.renewed) setSessionCookie(event.cookies, session.id, session.expiresAt);
	event.locals.admin = session !== null;
	event.locals.sessionId = session?.id ?? null;

	const route = event.route.id ?? '';
	if (route.startsWith('/admin') && route !== '/admin/login' && !event.locals.admin) {
		throw redirect(303, '/admin/login');
	}

	return resolve(event);
};
