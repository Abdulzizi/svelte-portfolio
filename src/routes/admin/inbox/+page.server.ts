import { fail, redirect } from '@sveltejs/kit';
import { deleteMessage, listMessages, setRead } from '$lib/server/messages';
import { UUID } from '$lib/uuid';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
	return { messages: await listMessages() };
};

export const actions: Actions = {
	toggleRead: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !UUID.test(id)) return fail(400, { error: 'Invalid message id.' });
		await setRead(id, form.get('read') !== 'true');
		return { ok: true };
	},
	delete: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !UUID.test(id)) return fail(400, { error: 'Invalid message id.' });
		await deleteMessage(id);
		return { ok: true };
	}
};
