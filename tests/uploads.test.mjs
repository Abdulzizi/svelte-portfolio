import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveImage, saveImage } from '../src/lib/server/uploads.ts';

test('keeps current when no image and no remove flag', async () => {
	assert.deepEqual(await resolveImage(new FormData(), '/x.png'), { path: '/x.png', replaced: null });
});

test('empty file counts as keep', async () => {
	const form = new FormData();
	form.set('image', new File([], 'a.png'));
	assert.deepEqual(await resolveImage(form, '/x.png'), { path: '/x.png', replaced: null });
});

test('removeImage clears and reports replaced', async () => {
	const form = new FormData();
	form.set('removeImage', 'on');
	assert.deepEqual(await resolveImage(form, '/x.png'), { path: null, replaced: '/x.png' });
});

test('new page with no image', async () => {
	assert.deepEqual(await resolveImage(new FormData(), null), { path: null, replaced: null });
});

test('rejects bytes that do not match the declared image type', async () => {
	const file = new File(['not really a png'], 'a.png', { type: 'image/png' });
	await assert.rejects(saveImage(file), /not a valid JPEG, PNG, or WebP/);
});

test('rejects a JPEG declared as PNG before any fetch', async () => {
	const original = globalThis.fetch;
	let calls = 0;
	globalThis.fetch = async () => {
		calls++;
		throw new Error('fetch must not run');
	};
	try {
		const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
		await assert.rejects(
			saveImage(new File([jpeg], 'a.png', { type: 'image/png' })),
			/Image content is image\/jpeg but the file was sent as image\/png/
		);
	} finally {
		globalThis.fetch = original;
	}
	assert.equal(calls, 0);
});

test('rejects unsupported declared type before any fetch', async () => {
	const original = globalThis.fetch;
	let calls = 0;
	globalThis.fetch = async () => {
		calls++;
		throw new Error('fetch must not run');
	};
	try {
		await assert.rejects(
			saveImage(new File(['GIF89a'], 'a.gif', { type: 'image/gif' })),
			/must be JPEG, PNG, or WebP/
		);
	} finally {
		globalThis.fetch = original;
	}
	assert.equal(calls, 0);
});
