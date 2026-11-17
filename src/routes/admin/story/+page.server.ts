import { fail, redirect } from '@sveltejs/kit';
import {
	createChapter,
	deleteChapter,
	listChapters,
	reorder,
	seedDefaults,
	updateChapter
} from '$lib/server/story';
import { chapterSchema } from '$lib/validation';
import { UUID } from '$lib/uuid';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
	return { chapters: await listChapters() };
};

function parse(form: FormData) {
	return chapterSchema.safeParse({
		kicker: String(form.get('kicker') ?? ''),
		big: String(form.get('big') ?? ''),
		body: String(form.get('body') ?? ''),
		variant: String(form.get('variant') ?? '')
	});
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const parsed = parse(await request.formData());
		if (!parsed.success) {
			return fail(400, { scope: 'new', errors: parsed.error.flatten().fieldErrors });
		}
		await createChapter(parsed.data);
		return { ok: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !UUID.test(id)) return fail(400, { error: 'Invalid chapter id.' });
		const parsed = parse(form);
		if (!parsed.success) {
			return fail(400, { scope: id, errors: parsed.error.flatten().fieldErrors });
		}
		if (!(await updateChapter(id, parsed.data))) return fail(404, { error: 'Not found.' });
		return { ok: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const id = (await request.formData()).get('id');
		if (typeof id !== 'string' || !UUID.test(id)) return fail(400, { error: 'Invalid chapter id.' });
		await deleteChapter(id);
		return { ok: true };
	},

	move: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		const id = form.get('id');
		const dir = form.get('dir');
		if (typeof id !== 'string' || !UUID.test(id) || (dir !== 'up' && dir !== 'down')) {
			return fail(400, { error: 'Invalid move.' });
		}
		await reorder(id, dir);
		return { ok: true };
	},

	seed: async ({ locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		await seedDefaults();
		return { ok: true };
	}
};
