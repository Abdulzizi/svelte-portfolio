import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { validate } from '$lib/contact';
import { EMAIL as TO } from '$lib/site';
import { createMessage } from '$lib/server/messages';
import type { Actions } from './$types';

// Form actions need a server runtime; `/` stays prerendered via +layout.ts.
export const prerender = false;

const TIMELINES: Record<string, string> = { asap: 'ASAP', '1-3': '1-3 months', flexible: 'Flexible' };

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const form = await request.formData();
		const r = validate(Object.fromEntries(form));

		// Order matters: honeypot must be checked before any network call.
		// caveman: bots get a fake success, no signal to retry. Upgrade: rate limit in shared store.
		if (r.honeypot) return { success: true };
		if (!r.ok) return fail(400, { errors: r.errors, values: r.values });

		const tl = TIMELINES[String(form.get('timeline') ?? '')];
		const text = `Building: ${r.values.message}${tl ? `\nTimeline: ${tl}` : ''}`;

		let saved = false;
		try {
			await createMessage({ name: r.values.name, email: r.values.email, body: text });
			saved = true;
		} catch {
			console.error('contact: save failed');
		}

		const key = env.RESEND_API_KEY;
		if (!key) {
			console.error('contact: RESEND_API_KEY not set');
			if (saved) return { success: true };
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
					text: `${text}\n\n${r.values.name} <${r.values.email}>`
				}),
				signal: AbortSignal.timeout(8000)
			});
			if (!res.ok) {
				console.error('contact: resend status', res.status);
				if (saved) return { success: true };
				return fail(500, { error: 'Could not send. Try again or email me directly.', values: r.values });
			}
		} catch {
			console.error('contact: resend request failed');
			if (saved) return { success: true };
			return fail(500, { error: 'Could not send. Try again or email me directly.', values: r.values });
		}

		return { success: true };
	}
};
