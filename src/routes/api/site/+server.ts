import { json } from '@sveltejs/kit';
import { getSettings } from '$lib/server/settings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () =>
	json(await getSettings(), { headers: { 'Cache-Control': 'public, s-maxage=60' } });
