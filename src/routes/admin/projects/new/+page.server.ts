import { fail, redirect } from '@sveltejs/kit';
import { projectFormValues, projectFromFormData, projectSchema } from '$lib/validation';
import type { ProjectErrors } from '$lib/validation';
import { createProject } from '$lib/server/projects';
import { sanitizeBody } from '$lib/server/sanitize';
import { saveImage } from '$lib/server/uploads';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	// Layout+hooks already guard; keep the explicit dependency on locals.admin.
	if (!locals.admin) throw redirect(303, '/admin/login');
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');

		const form = await request.formData();
		const parsed = projectSchema.safeParse(projectFromFormData(form));
		if (!parsed.success) {
			const errors: ProjectErrors = parsed.error.flatten().fieldErrors;
			return fail(400, { errors, values: projectFormValues(form) });
		}

		// Sanitize body on save (stored-XSS guard). Empty → null.
		const clean = sanitizeBody(parsed.data.body ?? '');
		const body = clean.trim() === '' ? null : clean;

		// Image: handled outside zod. Save only a real upload.
		let imagePath: string | null = null;
		const image = form.get('image');
		if (image instanceof File && image.size > 0) {
			try {
				imagePath = await saveImage(image);
			} catch (err) {
				const errors: ProjectErrors = { image: [err instanceof Error ? err.message : 'Upload failed'] };
				return fail(400, { errors, values: projectFormValues(form) });
			}
		}

		const { body: _body, ...scalars } = parsed.data;
		await createProject({ ...scalars, body, imagePath });
		throw redirect(303, '/admin');
	}
};
