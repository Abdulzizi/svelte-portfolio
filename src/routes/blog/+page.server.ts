import { listPublished } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

// Public blog index is DB-driven: loaded per request, cannot prerender.
export const prerender = false;

// Resilience mirrors /work: if Postgres is unreachable, degrade to an empty list
// plus a quiet message instead of throwing a raw 500. Do NOT rethrow.
// Body is intentionally dropped here — the index only needs listing fields.
export const load: PageServerLoad = async ({ setHeaders }) => {
	try {
		const published = await listPublished();
		const posts = published.map((p) => ({
			title: p.title,
			slug: p.slug,
			excerpt: p.excerpt,
			coverImage: p.coverImage,
			publishedAt: p.publishedAt,
			createdAt: p.createdAt
		}));
		setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' });
		return { posts, loadError: false };
	} catch (err) {
		console.error('blog index load failed', err);
		return { posts: [], loadError: true };
	}
};
