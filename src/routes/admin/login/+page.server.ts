import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { loginSchema } from '$lib/validation';
import { SESSION_COOKIE, createSession, verifyAdmin } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.admin) throw redirect(303, '/admin');
};

export const actions: Actions = {
	default: async ({ request, cookies, locals }) => {
		const form = await request.formData();
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

		const { id, expiresAt } = await createSession();
		// secure:!dev — sent over https in prod (Vercel TLS), relaxed in dev so
		// plain http://localhost login works. httpOnly + sameSite:'lax' unchanged.
		cookies.set(SESSION_COOKIE, id, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			expires: expiresAt
		});
		locals.admin = true;
		throw redirect(303, '/admin');
	}
};
