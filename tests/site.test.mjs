import { test } from 'node:test';
import assert from 'node:assert/strict';

function resolveTheme(stored, prefersLight) {
	return (stored === 'light' || stored === 'dark') ? stored : (prefersLight ? 'light' : 'dark');
}

function marqueeDuration(dimension, speed) {
	return dimension / speed;
}

test('theme resolver accepts valid light/dark', () => {
	assert.equal(resolveTheme('light', false), 'light');
	assert.equal(resolveTheme('dark', true), 'dark');
});

test('theme resolver sanitizes corrupt storage and falls back', () => {
	assert.equal(resolveTheme('blue', true), 'light');
	assert.equal(resolveTheme('undefined', false), 'dark');
	assert.equal(resolveTheme(null, false), 'dark');
	assert.equal(resolveTheme('', true), 'light');
});

test('marquee speed is constant across widths', () => {
	const speed = 150;
	const durationNarrow = marqueeDuration(300, speed);
	const durationWide = marqueeDuration(1200, speed);
	assert.equal(300 / durationNarrow, speed);
	assert.equal(1200 / durationWide, speed);
});
