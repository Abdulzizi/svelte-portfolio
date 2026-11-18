<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let confirm = $state('');
</script>

<svelte:head>
	<title>Backup | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<h1 class="font-hand mb-8 text-3xl font-extrabold leading-none">
	Back<span class="text-[var(--accent)]">up</span>
</h1>

<section class="block">
	<h2 class="lbl font-mono">Export</h2>
	<p class="note">Projects, posts, story, messages and site settings as one JSON file.</p>
	<a class="btn font-mono" href="/admin/backup/export" download>Download backup</a>
</section>

<section class="block">
	<h2 class="lbl font-mono">Restore</h2>
	<p class="note">Max file size 4MB (platform limit).</p>

	{#if form && 'error' in form && form.error}
		<p class="err font-mono" role="alert">{form.error}</p>
	{/if}
	{#if form && 'counts' in form && form.counts}
		<p class="ok font-mono" role="status">
			Restored: {form.counts.projects} projects, {form.counts.posts} posts, {form.counts.storyChapters}
			story chapters, {form.counts.messages} messages, {form.counts.siteSettings} site settings.
		</p>
	{/if}

	<form
		method="POST"
		action="?/restore"
		enctype="multipart/form-data"
		use:enhance={() =>
			async ({ update }) => {
				await update({ reset: false });
				confirm = '';
			}}
	>
		<label class="field">
			<span class="lbl font-mono">Backup file</span>
			<input type="file" name="file" accept="application/json,.json" required />
		</label>
		<label class="field">
			<span class="lbl font-mono">Mode</span>
			<select name="mode">
				<option value="merge">Merge (upsert by id)</option>
			</select>
		</label>
		<label class="field">
			<span class="lbl font-mono">Type RESTORE to confirm</span>
			<input name="confirm" bind:value={confirm} autocomplete="off" />
		</label>
		<div>
			<button type="submit" class="btn font-mono" disabled={confirm !== 'RESTORE'}>Restore</button>
		</div>
	</form>
</section>

<style>
	.block {
		display: grid;
		gap: 0.75rem;
		max-width: 36rem;
		margin-bottom: 2.5rem;
	}
	form {
		display: grid;
		gap: 0.75rem;
	}
	.field {
		display: grid;
		gap: 0.25rem;
	}
	.lbl {
		font-size: 0.625rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.note {
		font-size: 0.8125rem;
		color: var(--ink-dim);
	}
	input,
	select {
		width: 100%;
		background: transparent;
		color: var(--ink);
		border: 1px solid var(--line);
		padding: 0.5rem 0.65rem;
		font: inherit;
	}
	.err {
		font-size: 0.6875rem;
		color: var(--danger);
	}
	.ok {
		font-size: 0.75rem;
		color: var(--accent);
	}
	.btn {
		font-size: 0.6875rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--ink-dim);
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color 0.2s ease;
	}
	.btn:hover:not(:disabled) {
		color: var(--ink);
	}
	.btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	:where(a, button, input, select):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
