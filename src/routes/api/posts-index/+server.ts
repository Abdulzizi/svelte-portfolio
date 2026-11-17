import { json } from '@sveltejs/kit';
import { listPublished } from '$lib/server/posts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const rows = await listPublished();
		return json(rows.map((r) => ({ slug: r.slug, title: r.title })), {
			headers: { 'Cache-Control': 'public, s-maxage=300' }
		});
	} catch {
		return json([]);
	}
};
