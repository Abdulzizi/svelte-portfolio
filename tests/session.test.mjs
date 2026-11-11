import { test } from 'node:test';
import assert from 'node:assert/strict';

const DAY = 86_400_000;
let row;
const calls = [];
const chain = (kind) => ({
	from: () => chain(kind),
	where: () => chain(kind),
	set: (v) => (calls.push(['set', v]), chain(kind)),
	limit: async () => (row ? [row] : []),
	then: (res, rej) => {
		calls.push([kind]);
		return Promise.resolve().then(res, rej);
	}
});
globalThis.__testDb = {
	select: () => chain('select'),
	delete: () => chain('delete'),
	update: () => chain('update')
};

const { validateSession } = await import('../src/lib/server/auth.ts');
const reset = (expiresAt) => {
	calls.length = 0;
	row = expiresAt && { id: 's1', expiresAt };
};

test('unknown id returns null', async () => {
	reset();
	assert.equal(await validateSession('x'), null);
});

test('expired session returns null and deletes row', async () => {
	reset(new Date(Date.now() - 1000));
	assert.equal(await validateSession('s1'), null);
	assert.ok(calls.some(([k]) => k === 'delete'));
});

test('session with under half TTL left is renewed', async () => {
	reset(new Date(Date.now() + DAY));
	const s = await validateSession('s1');
	assert.equal(s.renewed, true);
	assert.ok(Math.abs(s.expiresAt.getTime() - (Date.now() + 7 * DAY)) < 5000);
	assert.ok(calls.some(([k]) => k === 'update'));
	assert.equal(calls.find(([k]) => k === 'set')[1].expiresAt, s.expiresAt);
});

test('fresh session is not renewed', async () => {
	reset(new Date(Date.now() + 6 * DAY));
	const s = await validateSession('s1');
	assert.equal(s.renewed, false);
	assert.ok(!calls.some(([k]) => k === 'update'));
});
