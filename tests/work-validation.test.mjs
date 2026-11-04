import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitStack, projectFromFormData, projectSchema } from '../src/lib/validation.ts';
import { sanitizeBody } from '../src/lib/server/sanitize.ts';

test('splitStack trims, splits on comma/newline, drops blanks', () => {
	assert.deepEqual(splitStack('Go, Cloudflare\nCI/CD'), ['Go', 'Cloudflare', 'CI/CD']);
	assert.deepEqual(splitStack(''), []);
	assert.deepEqual(splitStack(' a ,,b '), ['a', 'b']);
	assert.deepEqual(splitStack(null), []);
});

function fd(entries) {
	const f = new FormData();
	for (const [k, v] of Object.entries(entries)) f.set(k, v);
	return f;
}

const validFields = {
	title: 'Freecause',
	role: 'Full Stack',
	year: '2024',
	stack: 'Go, Postgres',
	impact: 'Shipped it',
	problem: 'Slow',
	result: 'Fast',
	rank: '3'
};

test('projectSchema accepts valid FormData', () => {
	const r = projectSchema.safeParse(projectFromFormData(fd({ ...validFields, featured: 'on' })));
	assert.equal(r.success, true);
});

test('projectSchema fails with a title fieldError when title missing', () => {
	const { title, ...noTitle } = validFields;
	const r = projectSchema.safeParse(projectFromFormData(fd(noTitle)));
	assert.equal(r.success, false);
	assert.ok(r.error.flatten().fieldErrors.title);
});

test('featured checkbox: "on" -> true, absent -> false', () => {
	const on = projectFromFormData(fd({ ...validFields, featured: 'on' }));
	assert.equal(on.featured, true);
	const off = projectFromFormData(fd(validFields));
	assert.equal(off.featured, false);
});

test('rank: "3" -> 3, "" -> 0', () => {
	assert.equal(projectFromFormData(fd({ ...validFields, rank: '3' })).rank, 3);
	assert.equal(projectFromFormData(fd({ ...validFields, rank: '' })).rank, 0);
});

test('sanitizeBody drops script, keeps safe markup', () => {
	const out = sanitizeBody('<script>alert(1)</script><p>ok</p>');
	assert.ok(out.includes('<p>ok</p>'));
	assert.ok(!out.includes('script'));
});

test('sanitizeBody strips javascript: scheme links', () => {
	const out = sanitizeBody('<a href="javascript:x">y</a>');
	assert.ok(!out.includes('javascript:'));
});

test('sanitizeBody keeps safe href and adds rel', () => {
	const out = sanitizeBody('<a href="https://x.com">y</a>');
	assert.ok(out.includes('href="https://x.com"'));
	assert.ok(out.includes('rel="noopener noreferrer"'));
});
