import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, cleanName } from '../src/lib/contact.ts';

const good = { name: 'Ada', email: 'ada@example.com', message: 'Hello, I would like to talk.' };

test('valid input passes', () => {
	const r = validate(good);
	assert.equal(r.ok, true);
	assert.equal(r.honeypot, false);
});

test('empty input fails every field', () => {
	const r = validate({});
	assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'message', 'name']);
});

test('whitespace-only fields fail', () => {
	const r = validate({ name: '   ', email: '  ', message: '          ' });
	assert.equal(r.ok, false);
	assert.equal(Object.keys(r.errors).length, 3);
});

test('too long name and message fail', () => {
	assert.ok(validate({ ...good, name: 'a'.repeat(81) }).errors.name);
	assert.ok(validate({ ...good, message: 'a'.repeat(2001) }).errors.message);
	assert.equal(validate({ ...good, message: 'a'.repeat(2000) }).ok, true);
});

test('bad email fails', () => {
	for (const email of ['nope', 'a@b', 'a b@c.d', '@c.d'])
		assert.ok(validate({ ...good, email }).errors.email, email);
});

test('honeypot filled is flagged', () => {
	assert.equal(validate({ ...good, website: 'http://spam' }).honeypot, true);
});

test('newlines in name are stripped', () => {
	assert.equal(cleanName('Ada\r\nBcc: x@y.z'), 'Ada Bcc: x@y.z');
	assert.equal(validate({ ...good, name: 'A\nB' }).values.name, 'A B');
});
