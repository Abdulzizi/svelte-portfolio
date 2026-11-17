import { fail, redirect } from '@sveltejs/kit';
import { parseBackup, restoreMerge } from '$lib/server/backup';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

const MAX_BYTES = 2 * 1024 * 1024;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
	return {};
};

export const actions: Actions = {
	restore: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		if (form.get('mode') !== 'merge') return fail(400, { error: 'Unknown restore mode.' });
		if (form.get('confirm') !== 'RESTORE') return fail(400, { error: 'Type RESTORE to confirm.' });
		const file = form.get('file');
		if (!(file instanceof File) || file.size === 0) return fail(400, { error: 'Choose a backup file.' });
		if (file.size > MAX_BYTES) return fail(400, { error: 'File is larger than 2MB.' });
		const parsed = parseBackup(await file.text());
		if (!parsed.ok) return fail(400, { error: parsed.error });
		try {
			return { counts: await restoreMerge(parsed.data) };
		} catch {
			return fail(500, { error: 'Restore failed. No changes were applied.' });
		}
	}
};
