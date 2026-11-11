import { register } from 'node:module';

register(
	'data:text/javascript,' +
		encodeURIComponent(`export async function resolve(s, c, next) {
	if (s === '$env/dynamic/private') return { url: 'data:text/javascript,export const env = process.env;', shortCircuit: true };
	return next(s, c);
}`)
);
