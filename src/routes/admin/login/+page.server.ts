import { fail, redirect } from '@sveltejs/kit';
import { loginSchema } from '$lib/validation';
import { createSession, setSessionCookie, verifyAdmin } from '$lib/server/auth';
import { checkRateLimit, clientKey } from '$lib/server/rate-limit';
import { getTotp, verifySecondFactor } from '$lib/server/totp';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.admin) throw redirect(303, '/admin');
};

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, locals } = event;
		const form = await request.formData();
		if (!(await checkRateLimit(`login:${clientKey(event)}`, 5, 15 * 60_000))) {
			return fail(429, { error: 'Too many attempts, try again later', email: '' });
		}
		const parsed = loginSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) {
			const email = typeof form.get('email') === 'string' ? (form.get('email') as string) : '';
			return fail(400, { error: 'Enter a valid email and password.', email });
		}

		const { email, password } = parsed.data;
		if (!(await verifyAdmin(email, password))) {
			// Echo email back (not the password) so the user needn't retype it.
			return fail(400, { error: 'Invalid credentials', email });
		}

		let totp: Awaited<ReturnType<typeof getTotp>> = { enabled: false, secret: null, error: false, lastStep: null };
		try {
			totp = await getTotp();
		} catch {
			return fail(500, { error: 'Sign in unavailable, try again later', email });
		}
		if (totp.error) {
			return fail(500, { error: 'Sign in unavailable, try again later', email });
		}
		if (totp.enabled && totp.secret) {
			const code = String(form.get('code') ?? '').trim();
			if (!code) return fail(400, { needCode: true, email });
			if (!(await verifySecondFactor(totp.secret, code, totp.lastStep))) {
				return fail(400, { needCode: true, error: 'Invalid credentials', email });
			}
		}

		const { id, expiresAt } = await createSession();
		// secure:!dev — sent over https in prod (Vercel TLS), relaxed in dev so
		// plain http://localhost login works. httpOnly + sameSite:'lax' unchanged.
		setSessionCookie(cookies, id, expiresAt);
		locals.admin = true;
		throw redirect(303, '/admin');
	}
};
