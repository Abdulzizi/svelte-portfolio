import { error, fail, redirect } from '@sveltejs/kit';
import { projectFormValues, projectFromFormData, projectSchema } from '$lib/validation';
import type { ProjectErrors } from '$lib/validation';
import { deleteProject, getProject, updateProject } from '$lib/server/projects';
import { cleanBody } from '$lib/server/sanitize';
import { deleteImage, deleteRemovedImages, resolveImage } from '$lib/server/uploads';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
	const project = await getProject(params.id);
	if (!project) throw error(404, 'Project not found');
	return { project };
};

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');

		const form = await request.formData();
		const parsed = projectSchema.safeParse(projectFromFormData(form));
		if (!parsed.success) {
			const errors: ProjectErrors = parsed.error.flatten().fieldErrors;
			return fail(400, { errors, values: projectFormValues(form) });
		}

		const existing = await getProject(params.id);
		if (!existing) throw error(404, 'Project not found');

		// Sanitize body on save (stored-XSS guard). Empty → null.
		const body = cleanBody(parsed.data.body);

		const img = await resolveImage(form, existing.imagePath);
		if ('error' in img) {
			const errors: ProjectErrors = { image: [img.error] };
			return fail(400, { errors, values: projectFormValues(form) });
		}

		const { body: _body, ...scalars } = parsed.data;
		await updateProject(params.id, { ...scalars, body, imagePath: img.path });
		await deleteImage(img.replaced);
		await deleteRemovedImages(existing.body, body);
		throw redirect(303, '/admin/projects');
	},

	delete: async ({ params, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const row = await getProject(params.id);
		await deleteProject(params.id);
		if (row) {
			await deleteImage(row.imagePath);
			await deleteRemovedImages(row.body, null);
		}
		throw redirect(303, '/admin/projects');
	}
};
