import { json } from '@sveltejs/kit';
import { buildExport } from '$lib/server/backup';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.admin) return json({ error: 'Unauthorized' }, { status: 401 });
	const body = JSON.stringify(await buildExport(), null, 2);
	return new Response(body, {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': `attachment; filename="site-backup-${new Date().toISOString().slice(0, 10)}.json"`,
			'Cache-Control': 'no-store'
		}
	});
};
