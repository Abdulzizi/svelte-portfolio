import { listPublished } from '$lib/server/posts';
import { esc } from '$lib/server/xml';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url }) => {
	let items = '';
	try {
		const posts = await listPublished();
		items = posts
			.map((p) => {
				const link = esc(`${url.origin}/blog/${p.slug}`);
				const date = (p.publishedAt ?? p.createdAt).toUTCString();
				return `<item><title>${esc(p.title)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><pubDate>${date}</pubDate><description>${esc(p.excerpt ?? '')}</description></item>`;
			})
			.join('');
	} catch (err) {
		console.error('rss load failed', err);
	}
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Abdul Jawad Azizi blog</title><link>${esc(url.origin)}/blog</link><description>Writing by Abdul Jawad Azizi.</description>${items}</channel></rss>`,
		{
			headers: {
				'content-type': 'application/rss+xml; charset=utf-8',
				'cache-control': 'public, max-age=0, s-maxage=3600'
			}
		}
	);
};
