import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { RequestHandler } from './$types';

const require = createRequire(import.meta.url);

let fonts: { regular: Buffer; bold: Buffer } | undefined;

function loadFonts() {
	if (!fonts) {
		const dir = require.resolve('@fontsource/inter/package.json').replace(/package\.json$/, 'files/');
		fonts = {
			regular: readFileSync(dir + 'inter-latin-500-normal.woff'),
			bold: readFileSync(dir + 'inter-latin-700-normal.woff')
		};
	}
	return fonts;
}

function clean(value: string | null, max: number) {
	const text = (value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
	return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const title = clean(url.searchParams.get('title'), 90) || 'Abdul Jawad Azizi';
		const sub = clean(url.searchParams.get('sub'), 120) || 'Full Stack Developer';
		const f = loadFonts();
		const size = title.length > 60 ? 64 : title.length > 35 ? 80 : 96;

		const tree = {
			type: 'div',
			props: {
				style: {
					width: '100%',
					height: '100%',
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
				{ name: 'Inter', data: f.regular, weight: 500, style: 'normal' },
				{ name: 'Inter', data: f.bold, weight: 700, style: 'normal' }
			]
		});
		const png = new Resvg(svg).render().asPng();

		return new Response(new Uint8Array(png), {
			headers: {
				'content-type': 'image/png',
				'cache-control': 'public, max-age=86400, s-maxage=604800'
			}
		});
	} catch (err) {
		console.error('og render failed', err);
		return new Response('og render failed', { status: 500, headers: { 'content-type': 'text/plain' } });
	}
};
