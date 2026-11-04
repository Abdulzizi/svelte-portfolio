<script lang="ts">
	import { enhance } from '$app/forms';
	import RichEditor from '$lib/components/RichEditor.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);

	let v = $derived(form?.values);
	let e = $derived(form?.errors);
</script>

<svelte:head>
	<title>New project | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="head">
	<a href="/admin" class="back font-mono">← Projects</a>
	<h1 class="font-hand text-3xl font-extrabold leading-none">
		New <span class="text-[var(--accent)]">project</span>
	</h1>
</div>

<form
	method="POST"
	class="form"
	enctype="multipart/form-data"
	novalidate
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
>
	<label class="field" for="title">
		<span>Title</span>
		<input id="title" name="title" type="text" required value={v?.title ?? ''} />
		{#if e?.title}<span class="err">{e.title[0]}</span>{/if}
	</label>

	<div class="grid2">
		<label class="field" for="role">
			<span>Role</span>
			<input id="role" name="role" type="text" required value={v?.role ?? ''} />
			{#if e?.role}<span class="err">{e.role[0]}</span>{/if}
		</label>
		<label class="field" for="year">
			<span>Year</span>
			<input id="year" name="year" type="text" required value={v?.year ?? ''} />
			{#if e?.year}<span class="err">{e.year[0]}</span>{/if}
		</label>
	</div>

	<label class="field" for="stack">
		<span>Stack <em class="hint font-mono">— one per line or comma-separated</em></span>
		<textarea id="stack" name="stack" rows="3" required>{v?.stack ?? ''}</textarea>
		{#if e?.stack}<span class="err">{e.stack[0]}</span>{/if}
	</label>

	<label class="field" for="impact">
		<span>Impact</span>
		<input id="impact" name="impact" type="text" required value={v?.impact ?? ''} />
		{#if e?.impact}<span class="err">{e.impact[0]}</span>{/if}
	</label>

	<label class="field" for="problem">
		<span>Problem</span>
		<textarea id="problem" name="problem" rows="3" required>{v?.problem ?? ''}</textarea>
		{#if e?.problem}<span class="err">{e.problem[0]}</span>{/if}
	</label>

	<label class="field" for="result">
		<span>Result</span>
		<textarea id="result" name="result" rows="3" required>{v?.result ?? ''}</textarea>
		{#if e?.result}<span class="err">{e.result[0]}</span>{/if}
	</label>

	<div class="field">
		<span>Body <em class="hint font-mono">— optional rich text</em></span>
		<!-- caveman: body does not repopulate from a failed submit (values omits it);
		     acceptable for now — rich HTML round-trip into the editor is the upgrade path. -->
		<RichEditor name="body" value="" />
	</div>

	<div class="field">
		<span>Image <em class="hint font-mono">— jpeg / png / webp, ≤5MB</em></span>
		<input type="file" name="image" accept="image/png,image/jpeg,image/webp" />
		{#if e?.image}<span class="err">{e.image[0]}</span>{/if}
	</div>

	<div class="grid2">
		<label class="field checkbox" for="featured">
			<input id="featured" name="featured" type="checkbox" checked={v?.featured ?? false} />
			<span>Featured</span>
		</label>
		<label class="field" for="rank">
			<span>Rank</span>
			<input id="rank" name="rank" type="number" step="1" value={v?.rank ?? '0'} />
			{#if e?.rank}<span class="err">{e.rank[0]}</span>{/if}
		</label>
	</div>

	<div class="actions">
		<button type="submit" class="save font-hand font-extrabold" disabled={submitting}>
			{submitting ? 'Saving' : 'Create project'}
		</button>
		<a href="/admin" class="cancel font-mono">Cancel</a>
	</div>
</form>

<style>
	.head {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.back {
		font-size: 0.75rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
		transition: color 0.2s ease;
	}
	.back:hover {
		color: var(--ink);
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 40rem;
	}
	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--ink-dim);
	}
	.field > span {
		font-size: 0.6875rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	.hint {
		text-transform: none;
		letter-spacing: 0.05em;
		font-style: normal;
		color: var(--ink-dim);
		opacity: 0.8;
	}
	.field input[type='text'],
	.field input[type='number'],
	.field textarea {
		background: transparent;
		color: var(--ink);
		border: 1px solid var(--line);
		padding: 0.625rem 0.75rem;
		font: inherit;
		font-size: 1rem;
		width: 100%;
	}
	.field textarea {
		resize: vertical;
	}
	.field input[type='file'] {
		color: var(--ink-dim);
		font: inherit;
		font-size: 0.875rem;
	}
	.checkbox {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		align-self: end;
		padding-bottom: 0.625rem;
	}
	.checkbox input {
		width: 1rem;
		height: 1rem;
		accent-color: var(--accent);
	}
	.err {
		color: var(--danger);
		font-size: 0.75rem;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		margin-top: 0.5rem;
	}
	.save {
		border: 1px solid var(--accent);
		color: var(--accent);
		padding: 0.5rem 1.5rem;
		transition: background-color 0.2s ease, color 0.2s ease;
	}
	.save:hover:not(:disabled) {
		background: var(--accent);
		color: var(--bg);
	}
	.save:disabled {
		opacity: 0.5;
	}
	.cancel {
		font-size: 0.75rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
		transition: color 0.2s ease;
	}
	.cancel:hover {
		color: var(--ink);
	}
	@media (max-width: 560px) {
		.grid2 {
			grid-template-columns: 1fr;
		}
	}
	:where(a, button, input, textarea):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
