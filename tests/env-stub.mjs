import { register } from 'node:module';

register(
	'data:text/javascript,' +
		encodeURIComponent(`import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const withExt = (u) => {
	if (/\\.\\w+$/.test(u.pathname)) return u;
	for (const p of [u.href + '.ts', u.href + '/index.ts']) if (existsSync(fileURLToPath(p))) return new URL(p);
	return u;
};
export async function resolve(s, c, next) {
	if (s === '$env/dynamic/private') return { url: 'data:text/javascript,export const env = process.env;', shortCircuit: true };
	if (s === '$app/environment') return { url: 'data:text/javascript,export const dev = false, browser = false, building = false;', shortCircuit: true };
	if (s.startsWith('$lib/')) return { url: withExt(pathToFileURL(${JSON.stringify(process.cwd() + '/src/lib/')} + s.slice(5))).href, shortCircuit: true };
	if (s.startsWith('.') && c.parentURL?.includes('/src/')) return { url: withExt(new URL(s, c.parentURL)).href, shortCircuit: true };
	return next(s, c);
}`)
);
