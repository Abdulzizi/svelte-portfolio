import { fail, redirect } from '@sveltejs/kit';
import {
	deleteMessage,
	listMessages,
	markAllRead,
	setArchived,
	setRead,
	setSpam,
	type MessageView
} from '$lib/server/messages';
import { UUID } from '$lib/uuid';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

const VIEWS: MessageView[] = ['inbox', 'archived', 'spam'];

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
	const v = url.searchParams.get('view') as MessageView;
	const view = VIEWS.includes(v) ? v : 'inbox';
	const raw = Number(url.searchParams.get('page'));
	const page = Number.isSafeInteger(raw) && raw > 0 ? Math.min(raw, 1_000_000) : 1;
	return { view, ...(await listMessages(view, page)) };
};

function flag(setter: (id: string, value: boolean) => Promise<void>, field: string) {
	return async ({ request, locals }: { request: Request; locals: App.Locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !UUID.test(id)) return fail(400, { error: 'Invalid message id.' });
		await setter(id, form.get(field) !== 'true');
		return { ok: true };
	};
}

export const actions: Actions = {
	toggleRead: flag(setRead, 'read'),
	toggleArchived: flag(setArchived, 'archived'),
	toggleSpam: flag(setSpam, 'spam'),
	markAllRead: async ({ locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		await markAllRead();
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
