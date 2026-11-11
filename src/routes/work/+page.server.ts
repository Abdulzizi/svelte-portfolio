import { listAll } from '$lib/server/projects';
import { sanitizeBody } from '$lib/server/sanitize';
import type { Project } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

// /work is data-driven (v2): loaded from the DB per request, so it cannot prerender.
export const prerender = false;

// Defense-in-depth: body is sanitized on SAVE, but re-sanitize on OUTPUT so a row
// written outside the current allowlist (direct DB edit, future allowlist change)
// can't render unsafe HTML to visitors via {@html}. Null stays null.
function sanitizeProject(p: Project): Project {
	return p.body === null ? p : { ...p, body: sanitizeBody(p.body) };
}

export const load: PageServerLoad = async ({ setHeaders }) => {
	// Two planes: featured rail (horizontal) + "the rest" (vertical drop).
	// Both rank-ordered in the query layer.
	// Resilience: if Postgres (Supabase pooler) is unreachable, degrade gracefully
	// instead of throwing a raw 500 — the public page still renders its frame + a
	// quiet message. Do NOT rethrow.
	try {
		const all = await listAll();
		setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' });
		return {
			featured: all.filter((p) => p.featured).map(sanitizeProject),
			rest: all.filter((p) => !p.featured).map(sanitizeProject),
			loadError: false
		};
	} catch (err) {
		console.error('work load failed', err);
		return { featured: [], rest: [], loadError: true };
	}
};
