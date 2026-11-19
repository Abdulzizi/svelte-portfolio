import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hash } from '@node-rs/argon2';
import * as OTPAuth from 'otpauth';

process.env.TOTP_ENCRYPTION_KEY = 'test-key-do-not-use';

const stored = { codes: [], step: null };
let updateCalls = 0;
let insertCalls = 0;
let lastInsert = null;

globalThis.__testDb = {
	select: () => ({
		from: () => ({ where: async () => [{ codes: stored.codes }] })
	}),
	update: () => ({
		set: (payload) => ({
			where: () => ({
				returning: async () => {
					updateCalls++;
					if ('totpLastStep' in payload) {
						const step = payload.totpLastStep;
						if (stored.step !== null && stored.step >= step) return [];
						stored.step = step;
						return [{ id: 'admin' }];
					}
					const sql = payload.recoveryCodes;
					const target = sql.queryChunks.find((c) => typeof c === 'string');
					const before = stored.codes.length;
					stored.codes = stored.codes.filter((h) => h !== target);
					return stored.codes.length < before ? [{ id: 'admin' }] : [];
				}
			})
		})
	}),
	insert: () => ({
		values: (values) => ({
			onConflictDoUpdate: async () => {
				insertCalls++;
				lastInsert = values;
			}
		})
	})
};

const {
	sealSecret,
	unsealSecret,
	generateSecret,
	acceptedStep,
	verifyCode,
	consumeRecoveryCode,
	verifySecondFactor,
	enableTotp
} = await import('../src/lib/server/totp.ts');

const SECRET = 'JBSWY3DPEHPK3PXP';

function withoutConsoleError(fn) {
	const original = console.error;
	console.error = () => {};
	try {
		return fn();
	} finally {
		console.error = original;
	}
}

function totpFor(secret) {
	return new OTPAuth.TOTP({
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
		secret: OTPAuth.Secret.fromBase32(secret)
	});
}

test('sealSecret encrypts and unsealSecret round-trips with the key', () => {
	const sealed = sealSecret(SECRET);
	assert.ok(sealed.startsWith('enc:v1:'));
	assert.ok(!sealed.includes(SECRET));
	assert.equal(unsealSecret(sealed), SECRET);
});

test('unsealSecret passes plaintext through untouched', () => {
	assert.equal(unsealSecret(SECRET), SECRET);
});

test('unsealSecret returns null when the key changes or clears', () => {
	const sealed = sealSecret(SECRET);
	process.env.TOTP_ENCRYPTION_KEY = 'a-different-key';
	assert.equal(withoutConsoleError(() => unsealSecret(sealed)), null);
	delete process.env.TOTP_ENCRYPTION_KEY;
	assert.equal(withoutConsoleError(() => unsealSecret(sealed)), null);
	process.env.TOTP_ENCRYPTION_KEY = 'test-key-do-not-use';
	assert.equal(unsealSecret(sealed), SECRET);
});

test('generateSecret returns base32 and a current token verifies', () => {
	const secret = generateSecret();
	assert.match(secret, /^[A-Z2-7]+$/);

	const now = Date.now();
	const token = totpFor(secret).generate({ timestamp: now });
	assert.match(token, /^\d{6}$/);
	assert.equal(verifyCode(secret, token), true);
	assert.equal(acceptedStep(secret, token), Math.floor(now / 1000 / 30));
});

test('non 6-digit input is rejected', () => {
	const secret = generateSecret();
	assert.equal(verifyCode(secret, '12345'), false);
	assert.equal(verifyCode(secret, '1234567'), false);
	assert.equal(acceptedStep(secret, '12345'), null);
	assert.equal(acceptedStep(secret, 'ABC123'), null);
});

test('a recovery code is consumed once and only removes its own hash', async () => {
	const known = 'ABCDE-FGHIJ';
	const knownHash = await hash('ABCDEFGHIJ');
	const otherHash = await hash('ZZZZZZZZZZ');
	stored.codes = [otherHash, knownHash];
	updateCalls = 0;

	assert.equal(await consumeRecoveryCode(known), true);
	assert.deepEqual(stored.codes, [otherHash]);
	assert.equal(updateCalls, 1);

	assert.equal(await consumeRecoveryCode(known), false);
	assert.deepEqual(stored.codes, [otherHash]);
});

test('rejects codes that are the wrong length or unknown', async () => {
	const knownHash = await hash('ABCDEFGHIJ');
	stored.codes = [knownHash];
	updateCalls = 0;

	assert.equal(await consumeRecoveryCode('SHORT'), false);
	assert.equal(await consumeRecoveryCode('ZZZZZ-ZZZZZ'), false);
	assert.equal(updateCalls, 0);
	assert.deepEqual(stored.codes, [knownHash]);
});

test('a TOTP step is accepted once and a replayed step is rejected', async () => {
	const secret = generateSecret();
	const now = 1_700_000_000_000;
	const step = Math.floor(now / 1000 / 30);
	const token = totpFor(secret).generate({ timestamp: now });
	const nextToken = totpFor(secret).generate({ timestamp: now + 30_000 });

	stored.step = null;
	const originalNow = Date.now;
	Date.now = () => now;
	try {
		assert.equal(await verifySecondFactor(secret, token, null), true);
		assert.equal(stored.step, step);

		assert.equal(await verifySecondFactor(secret, token, step), false);
		assert.equal(stored.step, step);

		assert.equal(await verifySecondFactor(secret, nextToken, step), true);
		assert.equal(stored.step, step + 1);
	} finally {
		Date.now = originalNow;
	}
});

test('enableTotp persists the sealed secret, enabled flag and last step', async () => {
	stored.step = null;
	insertCalls = 0;
	lastInsert = null;

	const codes = await enableTotp(SECRET, 12345);

	assert.equal(insertCalls, 1);
	assert.equal(codes.length, 8);
	assert.match(codes[0], /^[A-Z0-9]{5}-[A-Z0-9]{5}$/);
	assert.equal(lastInsert.id, 'admin');
	assert.equal(lastInsert.totpEnabled, true);
	assert.equal(lastInsert.totpLastStep, 12345);
	assert.ok(lastInsert.totpSecret.startsWith('enc:v1:'));
	assert.equal(lastInsert.recoveryCodes.length, 8);
	assert.ok(!lastInsert.recoveryCodes.includes(codes[0]));
});
