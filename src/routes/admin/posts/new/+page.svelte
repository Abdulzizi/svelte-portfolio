<script lang="ts">
	import { enhance } from '$app/forms';
	import RichEditor from '$lib/components/RichEditor.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
	let sizeError = $state('');

	let v = $derived(form?.values);
	let e = $derived(form?.errors);
</script>

<svelte:head>
	<title>New post | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="head">
	<a href="/admin/posts" class="back font-mono">← Posts</a>
	<h1 class="font-hand text-3xl font-extrabold leading-none">
		New <span class="text-[var(--accent)]">post</span>
	</h1>
</div>

<form
	method="POST"
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
		<input id="title" name="title" type="text" required value={v?.title ?? ''} />
		{#if e?.title}<span class="err">{e.title[0]}</span>{/if}
	</label>

	<label class="field" for="slug">
		<span>Slug <em class="hint font-mono">— URL path, auto from title if blank</em></span>
		<input id="slug" name="slug" type="text" placeholder="auto from title" value={v?.slug ?? ''} />
		{#if e?.slug}<span class="err">{e.slug[0]}</span>{/if}
	</label>

	<label class="field" for="excerpt">
		<span>Excerpt</span>
		<textarea id="excerpt" name="excerpt" rows="3" required>{v?.excerpt ?? ''}</textarea>
		{#if e?.excerpt}<span class="err">{e.excerpt[0]}</span>{/if}
	</label>

	<div class="field">
		<span>Body <em class="hint font-mono">— optional rich text</em></span>
		<!-- caveman: body does not repopulate from a failed submit (values omits it);
		     acceptable for now — rich HTML round-trip into the editor is the upgrade path. -->
		<RichEditor name="body" value="" />
	</div>

	<div class="field">
		<span>Cover image <em class="hint font-mono">— jpeg / png / webp, ≤4MB</em></span>
		<input type="file" name="image" accept="image/png,image/jpeg,image/webp" />
		{#if sizeError || e?.image}<span class="err">{sizeError || e?.image?.[0]}</span>{/if}
	</div>

	<label class="field checkbox" for="published">
		<input id="published" name="published" type="checkbox" checked={v?.published ?? false} />
		<span>Published</span>
	</label>

	<div class="actions">
		<button type="submit" class="save font-hand font-extrabold" disabled={submitting}>
			{submitting ? 'Saving' : 'Create post'}
		</button>
		<a href="/admin/posts" class="cancel font-mono">Cancel</a>
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
	:where(a, button, input, textarea):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
