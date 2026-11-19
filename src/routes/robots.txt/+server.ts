import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = ({ url }) =>
	new Response(
		`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${url.origin}/sitemap.xml\n`,
		{
			headers: {
				'content-type': 'text/plain; charset=utf-8',
				'cache-control': 'public, max-age=0, s-maxage=3600'
			}
		}
	);
