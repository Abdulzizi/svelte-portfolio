import { fail, redirect } from '@sveltejs/kit';
import { deletePost, getPost, listAllPosts } from '$lib/server/posts';
import { deleteImage, deleteRemovedImages } from '$lib/server/uploads';
import { UUID } from '$lib/uuid';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
	return { posts: await listAllPosts() };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !UUID.test(id)) {
			return fail(400, { error: 'Missing post id.' });
		}
		const row = await getPost(id);
		await deletePost(id);
		if (row) {
			await deleteImage(row.coverImage);
			await deleteRemovedImages(row.body, null);
		}
		return { ok: true };
	}
};
