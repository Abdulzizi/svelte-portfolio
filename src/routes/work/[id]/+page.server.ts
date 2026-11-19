import { error } from '@sveltejs/kit';
import { getProject, listByKind } from '$lib/server/projects';
import { sanitizeBody } from '$lib/server/sanitize';
import { UUID } from '$lib/uuid';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	if (!UUID.test(params.id)) error(404, 'Project not found');
	const project = await getProject(params.id);
	if (!project || project.kind !== 'project') error(404, 'Project not found');

	const all = await listByKind('project');
	const i = all.findIndex((p) => p.id === project.id);
	const prev = all.length > 1 && i >= 0 ? all[(i - 1 + all.length) % all.length] : null;
	const next = all.length > 1 && i >= 0 ? all[(i + 1) % all.length] : null;

	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' });
	return {
		project: { ...project, body: project.body === null ? null : sanitizeBody(project.body) },
		prev: prev && { id: prev.id, title: prev.title },
		next: next && { id: next.id, title: next.title },
		og: { title: project.title, description: project.impact }
	};
};
