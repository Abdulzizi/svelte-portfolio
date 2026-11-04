import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const prerender = false;

// Belt-and-suspenders: hooks.server.ts already guards /admin/**, but this load
// makes child loads depend on an authenticated admin explicitly. /admin/login
// renders in this layout too, so only redirect away from it.
export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.admin && url.pathname !== '/admin/login') {
		throw redirect(303, '/admin/login');
	}
	return { admin: locals.admin };
};
