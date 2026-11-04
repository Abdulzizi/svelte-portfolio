import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';

// Server-only. Never import into client code.

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT_BY_MIME: Record<string, string> = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp'
};

function uploadDir(): string {
	return env.UPLOAD_DIR || './uploads';
}

/**
 * Validate (mime + size), write to UPLOAD_DIR under a random filename, and
 * return the PUBLIC path `/uploads/<name>` to store in projects.imagePath.
 * nginx serves /uploads/ from UPLOAD_DIR in prod.
 * Throws Error with a clear message on invalid input.
 */
export async function saveImage(file: File): Promise<string> {
	const ext = EXT_BY_MIME[file.type];
	if (!ext) throw new Error('Image must be JPEG, PNG, or WebP.');
	if (file.size > MAX_BYTES) throw new Error('Image must be 5 MB or smaller.');

	const dir = uploadDir();
	await mkdir(dir, { recursive: true });

	const filename = randomUUID() + ext;
	const bytes = Buffer.from(await file.arrayBuffer());
	await writeFile(join(dir, filename), bytes);

	return `/uploads/${filename}`;
}

/**
 * Best-effort delete of the file backing an `/uploads/..` public path.
 * Path-traversal safe: only the basename is used, joined onto UPLOAD_DIR.
 * Ignores a missing file.
 */
export async function deleteImage(path: string | null): Promise<void> {
	if (!path || !path.startsWith('/uploads/')) return;
	const name = basename(path); // strips any traversal segments
	if (!name || name === '.' || name === '..') return;
	try {
		await unlink(join(uploadDir(), name));
	} catch {
		// missing / already gone — ignore
	}
}
