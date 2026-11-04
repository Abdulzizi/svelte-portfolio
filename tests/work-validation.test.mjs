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

import { slugify, postFromFormData, postSchema } from '../src/lib/validation.ts';

test('slugify lowercases, replaces spaces/underscores, strips, collapses dashes', () => {
	assert.equal(slugify('Hello World'), 'hello-world');
	assert.equal(slugify('  Foo_Bar  '), 'foo-bar');
	assert.equal(slugify('A! B@ C#'), 'a-b-c');
	assert.equal(slugify('multi   space__under'), 'multi-space-under');
	assert.equal(slugify('--trim--'), 'trim');
	assert.equal(slugify(''), '');
});

const validPost = {
	title: 'My First Post',
	slug: 'my-first-post',
	excerpt: 'A short teaser'
};

test('postSchema accepts valid FormData', () => {
	const r = postSchema.safeParse(postFromFormData(fd({ ...validPost, published: 'on' })));
	assert.equal(r.success, true);
	assert.equal(r.data.published, true);
});

test('postFromFormData derives slug from title when slug blank', () => {
	const out = postFromFormData(fd({ title: 'My First Post', slug: '', excerpt: 'x' }));
	assert.equal(out.slug, 'my-first-post');
});

test('postSchema rejects an invalid slug', () => {
	const r = postSchema.safeParse(postFromFormData(fd({ ...validPost, slug: 'Not A Slug!' })));
	// postFromFormData slugifies, so a messy slug becomes valid; feed one that
	// slugifies to empty to force the regex failure.
	const bad = postSchema.safeParse({ title: 'x', slug: '', excerpt: 'y' });
	assert.equal(bad.success, false);
	assert.ok(bad.error.flatten().fieldErrors.slug);
	assert.equal(r.success, true);
});

test('published checkbox: "on" -> true, absent -> false', () => {
	assert.equal(postFromFormData(fd({ ...validPost, published: 'on' })).published, true);
	assert.equal(postFromFormData(fd(validPost)).published, false);
});
