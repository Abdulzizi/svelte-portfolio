import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readingTime } from '../src/lib/reading-time.ts';

test('empty string reads in 1 minute', () => {
	assert.equal(readingTime(''), 1);
});

test('short text reads in 1 minute', () => {
	assert.equal(readingTime('hello world'), 1);
});

test('450 plain words is 3 minutes', () => {
	assert.equal(readingTime(Array(450).fill('word').join(' ')), 3);
});

test('HTML tags are not counted as words', () => {
	const tagged = Array(120).fill('<p>one</p><p>two</p>').join('');
	const untagged = Array(240).fill('word').join(' ');
	assert.equal(readingTime(tagged), readingTime(untagged));
	assert.equal(readingTime(Array(200).fill('<b>a</b>').join(' ')), 1);
	assert.equal(readingTime(Array(201).fill('<b>a</b>').join(' ')), 2);
});
