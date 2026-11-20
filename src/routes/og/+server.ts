import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import regularDataUrl from '@fontsource/inter/files/inter-latin-500-normal.woff?inline';
import boldDataUrl from '@fontsource/inter/files/inter-latin-700-normal.woff?inline';
import { getPostBySlug } from '$lib/server/posts';
import { getProject } from '$lib/server/projects';
import { UUID } from '$lib/uuid';
import { SLUG_RE as SLUG } from '$lib/validation';
import type { RequestHandler } from './$types';

const STATIC: Record<string, { title: string; sub: string }> = {
	'/': { title: 'Abdul Jawad Azizi', sub: 'Full Stack Developer' },
	'/work': { title: 'Work', sub: 'Projects and experience' },
	'/about': { title: 'About', sub: 'Full stack developer' },
	'/connect': { title: 'Connect', sub: 'Email, GitHub, LinkedIn' },
	'/blog': { title: 'Blog', sub: 'Notes and writing' },
	'/cv': { title: 'CV', sub: 'Abdul Jawad Azizi' }
};

const regular = Buffer.from(regularDataUrl.slice(regularDataUrl.indexOf(',') + 1), 'base64');
const bold = Buffer.from(boldDataUrl.slice(boldDataUrl.indexOf(',') + 1), 'base64');

function clean(value: string | null, max: number) {
	const text = (value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
	return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}

async function resolve(path: string): Promise<{ title: string; sub: string } | null> {
	if (Object.hasOwn(STATIC, path)) return STATIC[path];

	if (path.startsWith('/blog/')) {
		const slug = path.slice('/blog/'.length);
		if (slug.length > 200 || !SLUG.test(slug)) return null;
		const post = await getPostBySlug(slug);
		return post?.published ? { title: post.title, sub: post.excerpt } : null;
	}

	if (path.startsWith('/work/')) {
		const id = path.slice('/work/'.length);
		if (!UUID.test(id)) return null;
		const project = await getProject(id);
		return project?.kind === 'project' ? { title: project.title, sub: project.impact } : null;
	}

	return null;
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const path = url.searchParams.get('path');
		const dynamic = !!path && (path.startsWith('/blog/') || path.startsWith('/work/'));

		if (!path || (!dynamic && !Object.hasOwn(STATIC, path))) {
			return new Response(null, {
				status: 302,
				headers: { location: '/og?path=%2F', 'cache-control': 'public, max-age=300' }
			});
		}

		const content = await resolve(path);

		if (!content) {
			return new Response('Not found', {
				status: 404,
				headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=60' }
			});
		}

		const title = clean(content.title, 90);
		const sub = clean(content.sub, 120);
		const size = title.length > 60 ? 64 : title.length > 35 ? 80 : 96;

		const tree = {
			type: 'div',
			props: {
				style: {
					width: '100%',
					height: '100%',
					boxSizing: 'border-box',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					background: '#0a0a08',
					color: '#f2f0e4',
					padding: '72px',
					fontFamily: 'Inter'
				},
				children: [
					{
						type: 'div',
						props: {
							style: { display: 'flex', alignItems: 'center', fontSize: 28, color: '#9a9580' },
							children: [
								{ type: 'div', props: { style: { width: 14, height: 14, background: '#4ade80', marginRight: 16 } } },
								'abdulzizi'
							]
						}
					},
					{
						type: 'div',
						props: {
							style: { display: 'flex', flexDirection: 'column' },
							children: [
								{
									type: 'div',
									props: {
										style: { fontSize: size, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, display: 'flex' },
										children: title
									}
								},
								{ type: 'div', props: { style: { width: 120, height: 8, background: '#4ade80', marginTop: 40, marginBottom: 28 } } },
								{ type: 'div', props: { style: { fontSize: 32, color: '#9a9580', display: 'flex' }, children: sub } }
							]
						}
					}
				]
			}
		};

		const svg = await satori(tree as never, {
			width: 1200,
			height: 630,
			fonts: [
				{ name: 'Inter', data: regular, weight: 500, style: 'normal' },
				{ name: 'Inter', data: bold, weight: 700, style: 'normal' }
			]
		});
		const png = new Resvg(svg).render().asPng();

		return new Response(new Uint8Array(png), {
			headers: {
				'content-type': 'image/png',
				'cache-control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
			}
		});
	} catch (err) {
		console.error('og render failed', err);
		return new Response('og render failed', { status: 500, headers: { 'content-type': 'text/plain' } });
	}
};
