import { test } from 'node:test';
import assert from 'node:assert/strict';

const order = [];
const inserts = [];
const executed = [];
let stored = 0;

globalThis.__testDb = {
	transaction: async (fn) =>
		fn({
			execute: async (q) => {
				executed.push(String(q.queryChunks?.[0]?.value ?? ''));
				order.push('lock');
			},
			select: () => ({
				from: () => ({
					where: async () => {
						order.push('count');
						return [{ n: stored }];
					}
				})
			}),
			insert: () => ({
				values: async (v) => {
					order.push('insert');
					stored++;
					inserts.push(v);
				}
			})
		}),
	delete: () => ({
		where: async () => {
			order.push('delete');
		}
	})
};

const { checkRateLimit } = await import('../src/lib/server/rate-limit.ts');

test('advisory lock is taken before the count and the insert', async () => {
	order.length = 0;
	inserts.length = 0;
	executed.length = 0;
	stored = 0;

	assert.equal(await checkRateLimit('contact', 5, 60_000), true);
	assert.deepEqual(order, ['lock', 'lock', 'count', 'insert', 'delete']);
	assert.match(executed[0], /lock_timeout/);
	assert.ok(executed.some((s) => /pg_advisory_xact_lock/.test(s)));
	assert.equal(inserts.at(-1).bucket, 'contact');
});

test('max calls pass and the next call is denied without inserting', async () => {
	order.length = 0;
	inserts.length = 0;
	stored = 0;

	const results = [];
	for (let i = 0; i < 4; i++) results.push(await checkRateLimit('contact', 3, 60_000));

	assert.deepEqual(results, [true, true, true, false]);
	assert.equal(stored, 3);
	assert.equal(inserts.length, 3);
	assert.deepEqual(order.slice(-2), ['lock', 'count']);
	assert.equal(order.filter((k) => k === 'delete').length, 3);
});
