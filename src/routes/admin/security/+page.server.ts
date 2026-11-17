import { fail } from '@sveltejs/kit';
import { checkRateLimit, clientKey } from '$lib/server/rate-limit';
import { disableTotp, enableTotp, generateSecret, getTotp, qrDataUrl, verifyCode } from '$lib/server/totp';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { enabled } = await getTotp();
	return { enabled };
};

export const actions: Actions = {
	start: async () => {
		const secret = generateSecret();
		return { setup: { secret, qr: await qrDataUrl(secret) } };
	},
	enable: async (event) => {
		const form = await event.request.formData();
		const secret = String(form.get('secret') ?? '');
		const code = String(form.get('code') ?? '').trim();
		if (!(await checkRateLimit(`totp:${clientKey(event)}`, 5, 15 * 60_000))) {
			return fail(429, { error: 'Too many attempts, try again later' });
		}
		if (!secret || !verifyCode(secret, code)) {
			return fail(400, { error: 'Invalid code', setup: { secret, qr: await qrDataUrl(secret || generateSecret()) } });
		}
		await enableTotp(secret);
		return { done: 'Two-factor authentication enabled.' };
	},
	disable: async (event) => {
		const form = await event.request.formData();
		const code = String(form.get('code') ?? '').trim();
		if (!(await checkRateLimit(`totp:${clientKey(event)}`, 5, 15 * 60_000))) {
			return fail(429, { error: 'Too many attempts, try again later' });
		}
		const { secret } = await getTotp();
		if (!secret || !verifyCode(secret, code)) return fail(400, { error: 'Invalid code' });
		await disableTotp();
		return { done: 'Two-factor authentication disabled.' };
	}
};
