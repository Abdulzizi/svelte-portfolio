import { fail, redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, destroySession } from '$lib/server/auth';
import { deleteProject, getProject, listAll, updateProject } from '$lib/server/projects';
import { deleteImage } from '$lib/server/uploads';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async () => {
	return { projects: await listAll() };
};

export const actions: Actions = {
	logout: async ({ cookies, locals }) => {
		const id = locals.sessionId ?? cookies.get(SESSION_COOKIE);
		if (id) await destroySession(id);
		cookies.delete(SESSION_COOKIE, { path: '/' });
		locals.admin = false;
		locals.sessionId = null;
		throw redirect(303, '/admin/login');
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || id.length === 0) {
			return fail(400, { error: 'Missing project id.' });
		}
		const row = await getProject(id);
		if (row) await deleteImage(row.imagePath);
		await deleteProject(id);
		return { ok: true };
	},

	toggleFeatured: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || id.length === 0) {
			return fail(400, { error: 'Missing project id.' });
		}
		const current = await getProject(id);
		if (!current) return fail(404, { error: 'Not found.' });
		await updateProject(id, { featured: !current.featured });
		return { ok: true };
	}
};
