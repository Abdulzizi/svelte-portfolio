import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { validate } from '$lib/contact';
import type { Actions } from './$types';

// Form actions need a server runtime; `/` stays prerendered via +layout.ts.
export const prerender = false;

const TO = 'jawadabdul307@gmail.com';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const form = await request.formData();
		const r = validate(Object.fromEntries(form));

		// Order matters: honeypot must be checked before any network call.
		// caveman: bots get a fake success, no signal to retry. Upgrade: rate limit in shared store.
		if (r.honeypot) return { success: true };
		if (!r.ok) return fail(400, { errors: r.errors, values: r.values });

		const key = env.RESEND_API_KEY;
		if (!key) {
			console.error('contact: RESEND_API_KEY not set');
			return fail(500, { error: 'Sending is not set up yet. Email me directly instead.', values: r.values });
		}

		try {
			const res = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({
					from: 'Portfolio <contact@abdulzizi.xyz>',
					to: [TO],
					reply_to: r.values.email,
					subject: `Portfolio message from ${r.values.name}`,
					text: `${r.values.message}\n\n${r.values.name} <${r.values.email}>`
				}),
				signal: AbortSignal.timeout(8000)
			});
			if (!res.ok) {
				console.error('contact: resend status', res.status);
				return fail(500, { error: 'Could not send. Try again or email me directly.', values: r.values });
			}
		} catch {
			console.error('contact: resend request failed');
			return fail(500, { error: 'Could not send. Try again or email me directly.', values: r.values });
		}

		return { success: true };
	}
};
