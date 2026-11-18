import { fail } from '@sveltejs/kit';
import { checkRateLimit, clientKey } from '$lib/server/rate-limit';
import {
	acceptedStep,
	disableTotp,
	enableTotp,
	encryptionConfigured,
	generateSecret,
	getTotp,
	qrDataUrl,
	recordUsedStep,
	regenerateRecoveryCodes,
	verifySecondFactor
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
	const { secret, error, lastStep } = await getTotp();
	if (error) return { res: fail(500, { error: 'Stored 2FA secret cannot be decrypted. Check TOTP_ENCRYPTION_KEY.' }) };
	if (!secret || !(await verifySecondFactor(secret, code, lastStep))) {
		return { res: fail(400, { error: 'Invalid code' }) };
	}
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
		const currentCode = String(form.get('currentCode') ?? '').trim();
		if (!(await checkRateLimit(`totp:${clientKey(event)}`, 5, 15 * 60_000))) {
			return fail(429, { error: 'Too many attempts, try again later' });
		}
		const current = await getTotp();
		if (current.error) {
			return fail(500, { error: 'Stored 2FA secret cannot be decrypted. Check TOTP_ENCRYPTION_KEY.' });
		}
		if (!secret) {
			return fail(400, { error: 'Invalid code', setup: { secret, qr: await qrDataUrl(generateSecret()) } });
		}
		const newStep = acceptedStep(secret, code);
		if (newStep === null) {
			return fail(400, { error: 'Invalid code', setup: { secret, qr: await qrDataUrl(secret) } });
		}
		if (current.enabled) {
			const step = current.secret ? acceptedStep(current.secret, currentCode) : null;
			const fresh =
				step !== null &&
				(current.lastStep === null || step > current.lastStep) &&
				(await recordUsedStep(step));
			if (!fresh) {
				return fail(400, {
					error: 'Invalid current code',
					setup: { secret, qr: await qrDataUrl(secret || generateSecret()) }
				});
			}
		}
		const step = current.enabled ? Math.max(newStep, current.lastStep ?? newStep) : newStep;
		const codes = await enableTotp(secret, step);
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
