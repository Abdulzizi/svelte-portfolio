import { fail, redirect } from '@sveltejs/kit';
import { getSettings, saveSettings } from '$lib/server/settings';
import { settingsSchema } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

const keys = ['email', 'githubUrl', 'linkedinUrl', 'instagramUrl', 'availability'] as const;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
	return { settings: await getSettings() };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		const values = Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? '')])) as Record<
			(typeof keys)[number],
			string
		>;
		const parsed = settingsSchema.safeParse(values);
		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors, values });
		}
		try {
			await saveSettings(parsed.data);
		} catch {
			return fail(500, { error: 'Could not save settings.', values });
		}
		return { ok: true };
	}
};
