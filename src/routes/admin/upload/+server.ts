import { json } from '@sveltejs/kit';
import { saveImage } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) return json({ error: 'Unauthorized' }, { status: 401 });
	const form = await request.formData().catch(() => null);
	const image = form?.get('image');
	if (!(image instanceof File) || image.size === 0) {
		return json({ error: 'Image is required.' }, { status: 400 });
	}
	try {
		return json({ url: await saveImage(image) });
	} catch (err) {
		return json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 400 });
	}
};
