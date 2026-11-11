import { error, fail, redirect } from '@sveltejs/kit';
import { postFormValues, postFromFormData, postSchema } from '$lib/validation';
import type { PostErrors } from '$lib/validation';
import { deletePost, getPost, slugExists, updatePost } from '$lib/server/posts';
import { cleanBody } from '$lib/server/sanitize';
import { deleteImage, deleteRemovedImages, resolveImage } from '$lib/server/uploads';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
	const post = await getPost(params.id);
	if (!post) throw error(404, 'Post not found');
	return { post };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');

		const form = await request.formData();
		const parsed = postSchema.safeParse(postFromFormData(form));
		if (!parsed.success) {
			const errors: PostErrors = parsed.error.flatten().fieldErrors;
			return fail(400, { errors, values: postFormValues(form) });
		}

		const existing = await getPost(params.id);
		if (!existing) throw error(404, 'Post not found');

		// Slug uniqueness, excluding this post.
		if (await slugExists(parsed.data.slug, params.id)) {
			const errors: PostErrors = { slug: ['That slug is already taken'] };
			return fail(400, { errors, values: postFormValues(form) });
		}

		// Sanitize body on save (stored-XSS guard). Empty → null.
		const body = cleanBody(parsed.data.body);

		const img = await resolveImage(form, existing.coverImage);
		if ('error' in img) {
			const errors: PostErrors = { image: [img.error] };
			return fail(400, { errors, values: postFormValues(form) });
		}

		// Stamp publishedAt only on the FIRST publish; re-publishing keeps the
		// original date. Unpublishing preserves the stored date too.
		let publishedAt = existing.publishedAt;
		if (parsed.data.published && existing.publishedAt === null) {
			publishedAt = new Date();
		}

		await updatePost(params.id, {
			title: parsed.data.title,
			slug: parsed.data.slug,
			excerpt: parsed.data.excerpt,
			body,
			coverImage: img.path,
			published: parsed.data.published,
			publishedAt
		});
		await deleteImage(img.replaced);
		await deleteRemovedImages(existing.body, body);
		throw redirect(303, '/admin/posts');
	},

	delete: async ({ params, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const row = await getPost(params.id);
		await deletePost(params.id);
		if (row) {
			await deleteImage(row.coverImage);
			await deleteRemovedImages(row.body, null);
		}
		throw redirect(303, '/admin/posts');
	}
};
