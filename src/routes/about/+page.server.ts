import { chapters as defaults, type Chapter } from '$lib/about-story';
import { listChapters } from '$lib/server/story';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' });
	try {
		const rows = await listChapters();
		if (rows.length > 0) {
			const chapters: Chapter[] = rows.map((r) => ({
				id: r.id,
				kicker: r.kicker,
				big: r.big,
				text: r.body,
				variant: r.variant
			}));
			return { chapters };
		}
	} catch (err) {
		console.error('about load failed', err);
	}
	return { chapters: defaults };
};
