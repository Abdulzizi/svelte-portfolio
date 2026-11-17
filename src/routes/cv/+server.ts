import { redirect } from '@sveltejs/kit';
import { cvInfo, cvPublicUrl } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60' });
	throw redirect(302, (await cvInfo()) ? cvPublicUrl() : '/abdul-jawad-azizi-cv.pdf');
};
