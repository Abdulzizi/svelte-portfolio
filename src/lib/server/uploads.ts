import { basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { MAX_IMAGE_BYTES } from '$lib/images';

// Server-only. Never import into client code.

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
	if (file.size > MAX_IMAGE_BYTES) throw new Error('Image must be 4 MB or smaller.');

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

export function ownImageUrls(html: string | null): string[] {
	if (!html) return [];
	const prefix = publicPrefix();
	const urls: string[] = [];
	for (const m of html.matchAll(/<img\b[^>]*?\ssrc="([^"]*)"/g)) {
		if (m[1].startsWith(prefix)) urls.push(m[1]);
	}
	return urls;
}

export async function deleteRemovedImages(oldBody: string | null, newBody: string | null): Promise<void> {
	const kept = new Set(ownImageUrls(newBody));
	for (const url of new Set(ownImageUrls(oldBody))) {
		if (!kept.has(url)) await deleteImage(url);
	}
}

export async function resolveImage(
	form: FormData,
	current: string | null
): Promise<{ path: string | null; replaced: string | null } | { error: string }> {
	const image = form.get('image');
	if (image instanceof File && image.size > 0) {
		try {
			return { path: await saveImage(image), replaced: current };
		} catch (err) {
			return { error: err instanceof Error ? err.message : 'Upload failed' };
		}
	}
	if (form.get('removeImage') === 'on') return { path: null, replaced: current };
	return { path: current, replaced: null };
}

const CV_OBJECT = 'cv/cv.pdf';
export const MAX_CV_BYTES = 4 * 1024 * 1024;

export function cvPublicUrl(): string {
	return publicPrefix() + CV_OBJECT;
}

export async function cvInfo(): Promise<{ size: number | null; updated: string | null } | null> {
	try {
		const res = await fetch(cvPublicUrl(), { method: 'HEAD', cache: 'no-store' });
		if (!res.ok) return null;
		const len = Number(res.headers.get('content-length'));
		return { size: len > 0 ? len : null, updated: res.headers.get('last-modified') };
	} catch {
		return null;
	}
}

export async function saveCv(file: File): Promise<void> {
	if (file.type !== 'application/pdf') throw new Error('CV must be a PDF.');
	if (file.size > MAX_CV_BYTES) throw new Error('CV must be 4 MB or smaller.');
	const bytes = Buffer.from(await file.arrayBuffer());
	if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') throw new Error('File is not a valid PDF.');
	const res = await fetch(objectUrl(CV_OBJECT), {
		method: 'POST',
		headers: { ...authHeader(), 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
		body: bytes
	});
	if (!res.ok) throw new Error(`CV upload failed (${res.status}).`);
}
