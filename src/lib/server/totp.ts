import { eq } from 'drizzle-orm';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { db } from './db';
import { adminSecurity } from './db/schema';

const ISSUER = 'Portfolio Admin';
const ID = 'admin';

function totp(secret: string, label = 'admin') {
	return new OTPAuth.TOTP({
		issuer: ISSUER,
		label,
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
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

export function otpauthUri(secret: string): string {
	return totp(secret).toString();
}

export function qrDataUrl(secret: string): Promise<string> {
	return QRCode.toDataURL(otpauthUri(secret), { margin: 1, width: 220 });
}

export async function getTotp(): Promise<{ enabled: boolean; secret: string | null }> {
	const [row] = await db.select().from(adminSecurity).where(eq(adminSecurity.id, ID));
	return { enabled: !!row?.totpEnabled && !!row.totpSecret, secret: row?.totpSecret ?? null };
}

export async function enableTotp(secret: string): Promise<void> {
	const set = { totpSecret: secret, totpEnabled: true, updatedAt: new Date() };
	await db.insert(adminSecurity).values({ id: ID, ...set }).onConflictDoUpdate({ target: adminSecurity.id, set });
}

export async function disableTotp(): Promise<void> {
	await db
		.update(adminSecurity)
		.set({ totpSecret: null, totpEnabled: false, updatedAt: new Date() })
		.where(eq(adminSecurity.id, ID));
}
