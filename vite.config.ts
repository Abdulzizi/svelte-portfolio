import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

const WOFF_INLINE = /\.woff\?inline$/;

function inlineWoff(): Plugin {
	return {
		name: 'inline-woff',
		enforce: 'pre',
		load(id) {
			if (!WOFF_INLINE.test(id)) return null;
			const base64 = readFileSync(id.slice(0, -'?inline'.length)).toString('base64');
			return `export default "data:font/woff;base64,${base64}"`;
		}
	};
}

export default defineConfig({ plugins: [inlineWoff(), tailwindcss(), sveltekit()] });
