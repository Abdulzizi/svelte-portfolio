import { fail, redirect } from '@sveltejs/kit';
import { postFormValues, postFromFormData, postSchema } from '$lib/validation';
import type { PostErrors } from '$lib/validation';
import { createPost, slugExists } from '$lib/server/posts';
import { sanitizeBody } from '$lib/server/sanitize';
import { saveImage } from '$lib/server/uploads';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');

		const form = await request.formData();
		const parsed = postSchema.safeParse(postFromFormData(form));
		if (!parsed.success) {
			const errors: PostErrors = parsed.error.flatten().fieldErrors;
			return fail(400, { errors, values: postFormValues(form) });
		}

		// Slug uniqueness (posts.slug is UNIQUE — fail nicely before the DB does).
		if (await slugExists(parsed.data.slug)) {
			const errors: PostErrors = { slug: ['That slug is already taken'] };
			return fail(400, { errors, values: postFormValues(form) });
		}

		// Sanitize body on save (stored-XSS guard). Empty → null.
		const clean = sanitizeBody(parsed.data.body ?? '');
		const body = clean.trim() === '' ? null : clean;

		// Cover image: handled outside zod. Save only a real upload.
		let coverImage: string | null = null;
		const image = form.get('image');
		if (image instanceof File && image.size > 0) {
			try {
				coverImage = await saveImage(image);
			} catch (err) {
				const errors: PostErrors = {
					image: [err instanceof Error ? err.message : 'Upload failed']
				};
				return fail(400, { errors, values: postFormValues(form) });
			}
		}

		// First publish stamps publishedAt; drafts leave it null.
		const publishedAt = parsed.data.published ? new Date() : null;

		await createPost({
			title: parsed.data.title,
			slug: parsed.data.slug,
			excerpt: parsed.data.excerpt,
			body,
			coverImage,
			published: parsed.data.published,
			publishedAt
		});
		throw redirect(303, '/admin/posts');
	}
};
