import { fail, redirect } from '@sveltejs/kit';
import { deleteProject, getProject, listAll, reorderProjects, updateProject } from '$lib/server/projects';
import { deleteImage } from '$lib/server/uploads';
import { UUID } from '$lib/uuid';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
	return { projects: await listAll() };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !UUID.test(id)) {
			return fail(400, { error: 'Missing project id.' });
		}
		const row = await getProject(id);
		await deleteProject(id);
		if (row) await deleteImage(row.imagePath);
		return { ok: true };
	},

	toggleFeatured: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !UUID.test(id)) {
			return fail(400, { error: 'Missing project id.' });
		}
		const current = await getProject(id);
		if (!current) return fail(404, { error: 'Not found.' });
		await updateProject(id, { featured: !current.featured });
		return { ok: true };
	},

	reorder: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		let ids: unknown;
		try {
			ids = JSON.parse(String(form.get('ids') ?? ''));
		} catch {
			return fail(400, { error: 'Invalid order.' });
		}
		if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string' && UUID.test(id))) {
			return fail(400, { error: 'Invalid order.' });
		}
		if (!(await reorderProjects(ids))) return fail(400, { error: 'Order is out of date. Reload.' });
		return { ok: true };
	}
};
