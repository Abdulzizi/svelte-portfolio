import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/posts';
import { sanitizeBody } from '$lib/server/sanitize';
import type { PageServerLoad } from './$types';

// Public reading view is DB-driven: loaded per request, cannot prerender.
export const prerender = false;

export const load: PageServerLoad = async ({ params }) => {
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
	return { post: { ...post, body: post.body ? sanitizeBody(post.body) : null } };
};
