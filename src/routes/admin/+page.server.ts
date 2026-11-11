import { fail, redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, destroySession } from '$lib/server/auth';
import { countUnread } from '$lib/server/messages';
import { getPost, listAllPosts, updatePost } from '$lib/server/posts';
import { listRecentProjects, projectCounts } from '$lib/server/projects';
import { UUID } from '$lib/uuid';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.admin) throw redirect(303, '/admin/login');
	const [counts, recentProjects, posts, unread] = await Promise.all([
		projectCounts(),
		listRecentProjects(5),
		listAllPosts(),
		countUnread()
	]);
	const recent = [
		...recentProjects.map((p) => ({
			type: 'Project' as const,
			id: p.id,
			title: p.title,
			updatedAt: p.updatedAt,
			href: `/admin/projects/${p.id}`
		})),
		...posts.map((p) => ({
			type: 'Post' as const,
			id: p.id,
			title: p.title,
			updatedAt: p.updatedAt,
			href: `/admin/posts/${p.id}`
		}))
	]
		.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
		.slice(0, 5);
	return {
		stats: {
			projects: counts.total,
			featured: counts.featured,
			published: posts.filter((p) => p.published).length,
			drafts: posts.filter((p) => !p.published).length,
			unread
		},
		recent,
		drafts: posts.filter((p) => !p.published).map((p) => ({ id: p.id, title: p.title }))
	};
};

export const actions: Actions = {
	logout: async ({ cookies, locals }) => {
		const id = locals.sessionId ?? cookies.get(SESSION_COOKIE);
		if (id) await destroySession(id);
		cookies.delete(SESSION_COOKIE, { path: '/' });
		locals.admin = false;
		locals.sessionId = null;
		throw redirect(303, '/admin/login');
	},

	publish: async ({ request, locals }) => {
		if (!locals.admin) throw redirect(303, '/admin/login');
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !UUID.test(id)) {
			return fail(400, { error: 'Missing post id.' });
		}
		const post = await getPost(id);
		if (!post) return fail(404, { error: 'Not found.' });
		await updatePost(id, { published: true, publishedAt: post.publishedAt ?? new Date() });
		return { ok: true };
	}
};
