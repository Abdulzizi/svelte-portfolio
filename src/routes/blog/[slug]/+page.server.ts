import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/posts';
import { sanitizeBody } from '$lib/server/sanitize';
import { readingTime } from '$lib/reading-time';
import type { PageServerLoad } from './$types';

// Public reading view is DB-driven: loaded per request, cannot prerender.
export const prerender = false;

export const load: PageServerLoad = async ({ params, url }) => {
	let post;
	try {
		post = await getPostBySlug(params.slug);
	} catch (err) {
		// Genuine DB failure: let it throw so the styled +error.svelte (500) renders.
		console.error('blog post load failed', err);
		throw err;
	}

	// Missing OR unpublished → 404 publicly (drafts must never leak).
	if (!post || !post.published) {
		throw error(404, 'Post not found');
	}

	// Defense-in-depth: body is sanitized on SAVE, but re-sanitize on OUTPUT so a
	// row written outside the current allowlist can't render unsafe HTML via {@html}.
	// og:image must be an absolute URL for social scrapers — resolve against origin.
	const ogImage = post.coverImage ? new URL(post.coverImage, url.origin).href : null;
	const body = post.body ? sanitizeBody(post.body) : null;
	return { post: { ...post, body }, ogImage, minutes: readingTime(body ?? post.excerpt) };
};
