import { fail } from '@sveltejs/kit';
import { checkRateLimit, clientKey } from '$lib/server/rate-limit';
import {
	disableTotp,
	enableTotp,
	encryptionConfigured,
	generateSecret,
	getTotp,
	qrDataUrl,
	regenerateRecoveryCodes,
	verifyCode
} from '$lib/server/totp';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { enabled, error } = await getTotp();
	return { enabled, secretError: error, encryptionConfigured: encryptionConfigured() };
};

async function guarded(event: Parameters<Actions[string]>[0]) {
	const form = await event.request.formData();
	if (!(await checkRateLimit(`totp:${clientKey(event)}`, 5, 15 * 60_000))) {
		return { res: fail(429, { error: 'Too many attempts, try again later' }) };
	}
	const code = String(form.get('code') ?? '').trim();
	const { secret, error } = await getTotp();
	if (error) return { res: fail(500, { error: 'Stored 2FA secret cannot be decrypted. Check TOTP_ENCRYPTION_KEY.' }) };
	if (!secret || !verifyCode(secret, code)) return { res: fail(400, { error: 'Invalid code' }) };
	return { res: null };
}

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
		const codes = await enableTotp(secret);
		return { done: 'Two-factor authentication enabled.', codes };
	},
	disable: async (event) => {
		const { res } = await guarded(event);
		if (res) return res;
		await disableTotp();
		return { done: 'Two-factor authentication disabled.' };
	},
	regenerate: async (event) => {
		const { res } = await guarded(event);
		if (res) return res;
		const codes = await regenerateRecoveryCodes();
		return { done: 'New recovery codes generated. Old codes no longer work.', codes };
	}
};
