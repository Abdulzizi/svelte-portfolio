import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://abc.supabase.co';
const { sanitizeBody } = await import('../src/lib/server/sanitize.ts');
const good = 'https://abc.supabase.co/storage/v1/object/public/images/a.png';

test('own-host img kept with alt and lazy loading', () => {
	const out = sanitizeBody(`<img src="${good}" alt="hi">`);
	assert.match(out, /src="https:\/\/abc\.supabase\.co\//);
	assert.match(out, /alt="hi"/);
	assert.match(out, /loading="lazy"/);
});

test('other host dropped', () => {
	assert.equal(sanitizeBody('<p>x</p><img src="https://evil.com/a.png">'), '<p>x</p>');
});

test('http src dropped', () => {
	assert.equal(sanitizeBody('<img src="http://abc.supabase.co/a.png">'), '');
});

test('javascript src dropped', () => {
	assert.equal(sanitizeBody('<img src="javascript:alert(1)">'), '');
});

test('onerror stripped', () => {
	const out = sanitizeBody(`<img src="${good}" onerror="alert(1)">`);
	assert.doesNotMatch(out, /onerror/);
	assert.match(out, /<img/);
});
