import { fail, redirect } from '@sveltejs/kit';
import { cvInfo, saveCv } from '$lib/server/uploads';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
	return { cv: await cvInfo() };
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		const file = form.get('cv');
		if (!(file instanceof File) || file.size === 0) return fail(400, { error: 'Choose a PDF.' });
		try {
			await saveCv(file);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Upload failed' });
		}
		return { ok: true };
	}
};
