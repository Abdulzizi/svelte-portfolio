<script lang="ts">
	import { enhance } from '$app/forms';
	import RichEditor from '$lib/components/RichEditor.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);
	let sizeError = $state('');
	// Delete confirmation: first click arms, second click submits.
	let armed = $state(false);

	const p = $derived(data.project);
	let e = $derived(form?.errors);
	// On a failed submit, prefer the rejected values; otherwise the loaded row.
	let v = $derived(form?.values);

	let stackText = $derived(p.stack.join('\n'));
</script>

<svelte:head>
	<title>{p.title} | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="head">
	<a href="/admin/projects" class="back font-mono">← Projects</a>
	<h1 class="font-hand text-3xl font-extrabold leading-none">{p.title}</h1>
</div>

<form
	method="POST"
	action="?/save"
	class="form"
	enctype="multipart/form-data"
	novalidate
	use:enhance={({ formData, cancel }) => {
		const img = formData.get('image');
		if (img instanceof File && img.size > 4 * 1024 * 1024) {
			sizeError = 'Image must be 4 MB or smaller.';
			cancel();
			return;
		}
		sizeError = '';
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
>
	<label class="field" for="title">
		<span>Title</span>
		<input id="title" name="title" type="text" required value={v?.title ?? p.title} />
		{#if e?.title}<span class="err">{e.title[0]}</span>{/if}
	</label>

	<div class="grid2">
		<label class="field" for="role">
			<span>Role</span>
			<input id="role" name="role" type="text" required value={v?.role ?? p.role} />
			{#if e?.role}<span class="err">{e.role[0]}</span>{/if}
		</label>
		<label class="field" for="year">
			<span>Year</span>
			<input id="year" name="year" type="text" required value={v?.year ?? p.year} />
			{#if e?.year}<span class="err">{e.year[0]}</span>{/if}
		</label>
	</div>

	<label class="field" for="stack">
		<span>Stack <em class="hint font-mono">— one per line or comma-separated</em></span>
		<textarea id="stack" name="stack" rows="3" required>{v?.stack ?? stackText}</textarea>
		{#if e?.stack}<span class="err">{e.stack[0]}</span>{/if}
	</label>

	<label class="field" for="impact">
		<span>Impact</span>
		<input id="impact" name="impact" type="text" required value={v?.impact ?? p.impact} />
		{#if e?.impact}<span class="err">{e.impact[0]}</span>{/if}
	</label>

	<label class="field" for="problem">
		<span>Problem</span>
		<textarea id="problem" name="problem" rows="3" required>{v?.problem ?? p.problem}</textarea>
		{#if e?.problem}<span class="err">{e.problem[0]}</span>{/if}
	</label>

	<label class="field" for="result">
		<span>Result</span>
		<textarea id="result" name="result" rows="3" required>{v?.result ?? p.result}</textarea>
		{#if e?.result}<span class="err">{e.result[0]}</span>{/if}
	</label>

	<div class="field">
		<span>Body <em class="hint font-mono">— optional rich text</em></span>
		<!-- caveman: body does not repopulate from a failed submit (values omits it);
		     on error it resets to the last-saved value. Upgrade: round-trip failed HTML. -->
		<RichEditor name="body" value={p.body ?? ''} />
	</div>

	<div class="field">
		<span>Image <em class="hint font-mono">— jpeg / png / webp, ≤4MB</em></span>
		{#if p.imagePath}
			<img class="preview" src={p.imagePath} alt="Current project" />
			<label class="checkbox" for="removeImage">
				<input id="removeImage" name="removeImage" type="checkbox" />
				<span>Remove image</span>
			</label>
		{/if}
		<input type="file" name="image" accept="image/png,image/jpeg,image/webp" />
		{#if sizeError || e?.image}<span class="err">{sizeError || e?.image?.[0]}</span>{/if}
	</div>

	<div class="grid2">
		<label class="field checkbox" for="featured">
			<input
				id="featured"
				name="featured"
				type="checkbox"
				checked={v?.featured ?? p.featured}
			/>
			<span>Featured</span>
		</label>
		<label class="field" for="rank">
			<span>Rank</span>
			<input id="rank" name="rank" type="number" step="1" value={v?.rank ?? String(p.rank)} />
			{#if e?.rank}<span class="err">{e.rank[0]}</span>{/if}
		</label>
	</div>

	<div class="actions">
		<button type="submit" class="save font-hand font-extrabold" disabled={submitting}>
			{submitting ? 'Saving' : 'Save changes'}
		</button>
		<a href="/admin/projects" class="cancel font-mono">Cancel</a>
	</div>
</form>

<form
	method="POST"
	action="?/delete"
	class="delete-form"
	use:enhance={() => {
		return async ({ update }) => {
			armed = false;
			await update();
		};
	}}
>
	{#if armed}
		<button type="submit" class="delete danger font-mono">Confirm delete</button>
		<button type="button" class="delete font-mono" onclick={() => (armed = false)}>Cancel</button>
	{:else}
		<button type="button" class="delete font-mono" onclick={() => (armed = true)}>
			Delete project
		</button>
	{/if}
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
	.preview {
		max-width: 12rem;
		border: 1px solid var(--line);
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
	.delete-form {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--line);
		max-width: 40rem;
		display: flex;
		gap: 0.75rem;
	}
	.delete {
		font-size: 0.6875rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--danger);
		background: none;
		border: 1px solid var(--line);
		padding: 0.5rem 1rem;
		cursor: pointer;
		transition: border-color 0.2s ease;
	}
	.delete:hover {
		border-color: var(--danger);
	}
	.delete.danger {
		border-color: var(--danger);
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
