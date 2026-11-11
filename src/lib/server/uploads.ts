import { basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';

// Server-only. Never import into client code.

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const EXT_BY_MIME: Record<string, string> = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp'
};

function bucket(): string {
	return env.SUPABASE_BUCKET || 'images';
}

function objectUrl(name: string): string {
	return `${env.SUPABASE_URL}/storage/v1/object/${bucket()}/${name}`;
}

function publicPrefix(): string {
	return `${env.SUPABASE_URL}/storage/v1/object/public/${bucket()}/`;
}

function authHeader(): Record<string, string> {
	const key = env.SUPABASE_SERVICE_ROLE_KEY ?? '';
	return { apikey: key, Authorization: `Bearer ${key}` };
}

/**
 * Validate (mime + size), upload to Supabase Storage under a random filename, and
 * return the public URL to store in projects.imagePath.
 * Throws Error with a clear message on invalid input.
 */
export async function saveImage(file: File): Promise<string> {
	const ext = EXT_BY_MIME[file.type];
	if (!ext) throw new Error('Image must be JPEG, PNG, or WebP.');
	if (file.size > MAX_BYTES) throw new Error('Image must be 4 MB or smaller.');

	const filename = randomUUID() + ext;
	const res = await fetch(objectUrl(filename), {
		method: 'POST',
		headers: { ...authHeader(), 'Content-Type': file.type },
		body: Buffer.from(await file.arrayBuffer())
	});
	if (!res.ok) throw new Error(`Image upload failed (${res.status}).`);

	return publicPrefix() + filename;
}

/**
 * Best-effort delete of the object backing a public Storage URL.
 * Path-traversal safe: only the basename is used.
 * Ignores a missing file.
 */
export async function deleteImage(path: string | null): Promise<void> {
	if (!path || !path.startsWith(publicPrefix())) return;
	const name = basename(path); // strips any traversal segments
	if (!name || name === '.' || name === '..') return;
	try {
		await fetch(objectUrl(name), { method: 'DELETE', headers: authHeader() });
	} catch {
		// missing / already gone — ignore
	}
}
