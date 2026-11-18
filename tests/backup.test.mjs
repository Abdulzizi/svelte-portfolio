import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { parseBackup } from '../src/lib/server/backup.ts';
import { LIMITS } from '../src/lib/validation.ts';

const ISO = '2024-03-01T10:00:00.000+01:00';

const project = {
	id: randomUUID(),
	title: 'Freecause',
	kind: 'project',
	company: null,
	role: 'Full Stack',
	year: '2024',
	stack: ['Go', 'Postgres'],
	impact: 'Shipped it',
	problem: 'Slow',
	result: 'Fast',
	body: '<p>Body</p>',
	imagePath: null,
	featured: true,
	rank: 1,
	createdAt: ISO,
	updatedAt: ISO
};

const post = {
	id: randomUUID(),
	title: 'Hello World',
	slug: 'hello-world',
	excerpt: 'A short teaser',
	body: '<p>Post body</p>',
	coverImage: null,
	published: true,
	publishedAt: ISO,
	createdAt: ISO,
	updatedAt: ISO
};

const chapter = {
	id: randomUUID(),
	kicker: 'Now',
	big: 'Building things',
	body: 'Chapter body',
	variant: 'now',
	rank: 0,
	createdAt: ISO,
	updatedAt: ISO
};

const message = {
	id: randomUUID(),
	name: 'Ada',
	email: 'ada@example.com',
	body: 'Hello, I would like to work with you.',
	read: false,
	archived: false,
	spam: false,
	createdAt: ISO
};

const setting = {
	id: 'site',
	email: 'hi@example.com',
	githubUrl: 'https://github.com/ada',
	linkedinUrl: 'https://www.linkedin.com/in/ada',
	instagramUrl: 'https://instagram.com/ada',
	availability: 'Open to work',
	updatedAt: ISO
};

const backup = {
	version: 1,
	exportedAt: ISO,
	projects: [project],
	posts: [post],
	storyChapters: [chapter],
	messages: [message],
	siteSettings: [setting]
};

const parse = (patch = {}) => parseBackup(JSON.stringify({ ...backup, ...patch }));

test('accepts a valid v1 backup with every section', () => {
	const r = parse();
	assert.equal(r.ok, true, r.ok ? '' : r.error);
	assert.equal(r.data.messages.length, 1);
	assert.equal(r.data.messages[0].id, message.id);
	assert.equal(r.data.messages[0].body, message.body);
	assert.ok(r.data.messages[0].createdAt instanceof Date);
	assert.equal(r.data.projects[0].title, project.title);
	assert.equal(r.data.posts[0].slug, post.slug);
	assert.equal(r.data.storyChapters[0].variant, 'now');
	assert.equal(r.data.siteSettings[0].githubUrl, setting.githubUrl);
});

test('rejects a project title the old admin form allowed past the limit', () => {
	const title = 'x'.repeat(300);
	assert.ok(title.length > LIMITS.project.title);
	const r = parse({ projects: [{ ...project, title }] });
	assert.equal(r.ok, false);
	assert.match(r.error, /Section "projects", index 0: title/);
});

test('rejects a javascript: settings URL but keeps an https one', () => {
	const bad = parse({ siteSettings: [{ ...setting, githubUrl: 'javascript:alert(1)' }] });
	assert.equal(bad.ok, false);
	assert.match(bad.error, /githubUrl/);

	const good = parse({ siteSettings: [{ ...setting, linkedinUrl: 'https://example.com/ada' }] });
	assert.equal(good.ok, true, good.ok ? '' : good.error);
	assert.equal(good.data.siteSettings[0].linkedinUrl, 'https://example.com/ada');
});

test('rejects a message body over the shared limit', () => {
	const body = 'x'.repeat(LIMITS.message.body + 1);
	const r = parse({ messages: [{ ...message, body }] });
	assert.equal(r.ok, false);
	assert.match(r.error, /Section "messages", index 0: body/);
});

test('accepts a v1 backup where JSON.stringify dropped an undefined messages key', () => {
	const raw = JSON.stringify({ ...backup, messages: undefined });
	assert.ok(!raw.includes('"messages"'));
	const r = parseBackup(raw);
	assert.equal(r.ok, true, r.ok ? '' : r.error);
	assert.deepEqual(r.data.messages, []);
	assert.equal(r.data.projects.length, 1);
});

test('rejects messages: null instead of treating it as absent', () => {
	const r = parse({ messages: null });
	assert.equal(r.ok, false);
	assert.match(r.error, /Section "messages" must be an array/);
});
