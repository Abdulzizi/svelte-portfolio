import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveImage } from '../src/lib/server/uploads.ts';

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
