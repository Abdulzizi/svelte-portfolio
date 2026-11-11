import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/hooks.server.ts';

const run = (path, id = path) => {
	const event = {
		url: new URL('http://localhost' + path),
		route: { id },
		cookies: { get: () => undefined, set() {} },
		locals: {}
	};
	return { event, result: handle({ event, resolve: async () => new Response('ok') }) };
};

for (const path of ['/admin/posts', '/admin/upload']) {
	test(`${path} redirects to login without session`, async () => {
		await assert.rejects(run(path).result, { status: 303, location: '/admin/login' });
	});
}

test('percent-encoded admin path redirects to login', async () => {
	await assert.rejects(run('/%61dmin/upload', '/admin/upload').result, {
		status: 303,
		location: '/admin/login'
	});
});

test('/admin/login passes through as non-admin', async () => {
	const { event, result } = run('/admin/login');
	assert.equal(await (await result).text(), 'ok');
	assert.equal(event.locals.admin, false);
});

test('/blog passes through', async () => {
	assert.equal(await (await run('/blog').result).text(), 'ok');
});
