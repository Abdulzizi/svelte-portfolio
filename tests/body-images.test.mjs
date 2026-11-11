import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://x.supabase.co';
process.env.SUPABASE_BUCKET = 'images';
const { ownImageUrls, deleteRemovedImages } = await import('../src/lib/server/uploads.ts');

const own = (n) => `https://x.supabase.co/storage/v1/object/public/images/${n}`;
const img = (src) => `<p>a</p><img src="${src}" alt="" loading="lazy">`;

test('ownImageUrls finds own-bucket urls and ignores foreign hosts', () => {
	const html = img(own('a.png')) + img('https://evil.com/b.png') + img(own('c.jpg'));
	assert.deepEqual(ownImageUrls(html), [own('a.png'), own('c.jpg')]);
});

test('ownImageUrls returns none for null or empty', () => {
	assert.deepEqual(ownImageUrls(null), []);
	assert.deepEqual(ownImageUrls(''), []);
});

test('deleteRemovedImages deletes only removed own urls', async () => {
	const calls = [];
	const real = globalThis.fetch;
	globalThis.fetch = async (url, init) => {
		calls.push([String(url), init?.method]);
		return new Response(null, { status: 200 });
	};
	try {
		await deleteRemovedImages(
			img(own('keep.png')) + img(own('gone.png')) + img('https://evil.com/z.png'),
			img(own('keep.png'))
		);
	} finally {
		globalThis.fetch = real;
	}
	assert.deepEqual(calls, [['https://x.supabase.co/storage/v1/object/images/gone.png', 'DELETE']]);
});

test('deleteRemovedImages with null new body deletes all own urls', async () => {
	const calls = [];
	const real = globalThis.fetch;
	globalThis.fetch = async (url, init) => {
		calls.push(init?.method);
		return new Response(null, { status: 200 });
	};
	try {
		await deleteRemovedImages(img(own('a.png')) + img(own('b.png')), null);
	} finally {
		globalThis.fetch = real;
	}
	assert.deepEqual(calls, ['DELETE', 'DELETE']);
});
