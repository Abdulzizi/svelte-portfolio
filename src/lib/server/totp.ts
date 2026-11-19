import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { db } from './db';
import { adminSecurity } from './db/schema';

const ISSUER = 'Portfolio Admin';
const ID = 'admin';
const PERIOD = 30;

function totp(secret: string, label = 'admin') {
	return new OTPAuth.TOTP({
		issuer: ISSUER,
		label,
		algorithm: 'SHA1',
		digits: 6,
		period: PERIOD,
		secret: OTPAuth.Secret.fromBase32(secret)
	});
}

export function generateSecret(): string {
	return new OTPAuth.Secret({ size: 20 }).base32;
}

export function verifyCode(secret: string, code: string): boolean {
	if (!/^\d{6}$/.test(code)) return false;
	try {
		return totp(secret).validate({ token: code, window: 1 }) !== null;
	} catch {
		return false;
	}
}

export function acceptedStep(secret: string, code: string): number | null {
	if (!/^\d{6}$/.test(code)) return null;
	try {
		const now = Date.now();
		const delta = totp(secret).validate({ token: code, timestamp: now, window: 1 });
		return delta === null ? null : Math.floor(now / 1000 / PERIOD) + delta;
	} catch {
		return null;
	}
}

export function otpauthUri(secret: string): string {
	return totp(secret).toString();
}

export function qrDataUrl(secret: string): Promise<string> {
	return QRCode.toDataURL(otpauthUri(secret), { margin: 1, width: 220 });
}

const PREFIX = 'enc:v1:';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_COUNT = 8;

function encKey(): Buffer | null {
	const k = env.TOTP_ENCRYPTION_KEY;
	return k ? createHash('sha256').update(k).digest() : null;
}

export function encryptionConfigured(): boolean {
	return encKey() !== null;
}

export function sealSecret(secret: string): string {
	const key = encKey();
	if (!key) return secret;
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const ct = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
	return `${PREFIX}${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${ct.toString('base64')}`;
}

export function unsealSecret(stored: string): string | null {
	if (!stored.startsWith(PREFIX)) return stored;
	const key = encKey();
	if (!key) {
		console.error('totp: stored secret is encrypted but TOTP_ENCRYPTION_KEY is not set');
		return null;
	}
	try {
		const [iv, tag, ct] = stored.slice(PREFIX.length).split(':').map((p) => Buffer.from(p, 'base64'));
		const decipher = createDecipheriv('aes-256-gcm', key, iv);
		decipher.setAuthTag(tag);
		return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
	} catch {
		console.error('totp: failed to decrypt stored secret (wrong TOTP_ENCRYPTION_KEY?)');
		return null;
	}
}

export async function getTotp(): Promise<{
	enabled: boolean;
	secret: string | null;
	error: boolean;
	lastStep: number | null;
}> {
	const [row] = await db.select().from(adminSecurity).where(eq(adminSecurity.id, ID));
	const lastStep = row?.totpLastStep ?? null;
	const enabled = !!row?.totpEnabled && !!row.totpSecret;
	if (!enabled) return { enabled: false, secret: null, error: false, lastStep };
	const secret = unsealSecret(row!.totpSecret!);
	return { enabled: true, secret, error: secret === null, lastStep };
}

export async function recordUsedStep(step: number): Promise<boolean> {
	const won = await db
		.update(adminSecurity)
		.set({ totpLastStep: step })
		.where(
			and(eq(adminSecurity.id, ID), or(isNull(adminSecurity.totpLastStep), lt(adminSecurity.totpLastStep, step)))
		)
		.returning({ id: adminSecurity.id });
	return won.length === 1;
}

function newCodes(): string[] {
	return Array.from({ length: CODE_COUNT }, () => {
		const c = Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
		return `${c.slice(0, 5)}-${c.slice(5)}`;
	});
}

function normalizeCode(code: string): string {
	return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function hashCodes(codes: string[]): Promise<string[]> {
	return Promise.all(codes.map((c) => hash(normalizeCode(c))));
}

export async function enableTotp(secret: string, step: number): Promise<string[]> {
	const codes = newCodes();
	const set = {
		totpSecret: sealSecret(secret),
		totpEnabled: true,
		totpLastStep: step,
		recoveryCodes: await hashCodes(codes),
		updatedAt: new Date()
	};
	await db.insert(adminSecurity).values({ id: ID, ...set }).onConflictDoUpdate({ target: adminSecurity.id, set });
	return codes;
}

export async function regenerateRecoveryCodes(): Promise<string[]> {
	const codes = newCodes();
	await db
		.update(adminSecurity)
		.set({ recoveryCodes: await hashCodes(codes), updatedAt: new Date() })
		.where(eq(adminSecurity.id, ID));
	return codes;
}

export async function consumeRecoveryCode(code: string): Promise<boolean> {
	const norm = normalizeCode(code);
	if (norm.length !== 10) return false;
	const [row] = await db.select({ codes: adminSecurity.recoveryCodes }).from(adminSecurity).where(eq(adminSecurity.id, ID));
	for (const h of row?.codes ?? []) {
		let ok = false;
		try {
			ok = await verify(h, norm);
		} catch {
			ok = false;
		}
		if (!ok) continue;
		const removed = await db
			.update(adminSecurity)
			.set({ recoveryCodes: sql`array_remove(${adminSecurity.recoveryCodes}, ${h})` })
			.where(sql`${adminSecurity.id} = ${ID} and ${h} = any(${adminSecurity.recoveryCodes})`)
			.returning({ id: adminSecurity.id });
		return removed.length === 1;
	}
	return false;
}

export async function verifySecondFactor(secret: string, code: string, lastStep: number | null): Promise<boolean> {
	const step = acceptedStep(secret, code);
	if (step !== null && (lastStep === null || step > lastStep) && (await recordUsedStep(step))) return true;
	return consumeRecoveryCode(code);
}

export async function disableTotp(): Promise<void> {
	await db
		.update(adminSecurity)
		.set({ totpSecret: null, totpEnabled: false, totpLastStep: null, recoveryCodes: [], updatedAt: new Date() })
		.where(eq(adminSecurity.id, ID));
}
