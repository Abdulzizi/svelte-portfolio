import { listPublished } from '$lib/server/posts';
import { listByKind } from '$lib/server/projects';
import { esc } from '$lib/server/xml';
import type { RequestHandler } from './$types';

export const prerender = false;

type Entry = { path: string; lastmod?: Date | null };

export const GET: RequestHandler = async ({ url }) => {
	const entries: Entry[] = ['/', '/work', '/about', '/connect', '/blog'].map((path) => ({ path }));
	try {
		const [posts, projects] = await Promise.all([listPublished(), listByKind('project')]);
		for (const p of posts) entries.push({ path: `/blog/${p.slug}`, lastmod: p.updatedAt ?? p.publishedAt });
		for (const p of projects) entries.push({ path: `/work/${p.id}`, lastmod: p.updatedAt });
	} catch (err) {
		console.error('sitemap load failed', err);
	}
	const body = entries
		.map((e) => {
			const lastmod = e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : '';
			return `<url><loc>${esc(url.origin + e.path)}</loc>${lastmod}</url>`;
		})
		.join('');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`,
		{
			headers: {
				'content-type': 'application/xml; charset=utf-8',
				'cache-control': 'public, max-age=0, s-maxage=3600'
			}
		}
	);
};
