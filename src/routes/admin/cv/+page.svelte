<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busy = $state(false);
</script>

<svelte:head>
	<title>CV | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="head">
	<h1 class="font-hand text-3xl font-extrabold leading-none">
		C<span class="text-[var(--accent)]">V</span>
	</h1>
</div>

<p class="status font-mono">
	{#if data.cv}
		Custom CV live{data.cv.size ? ` · ${(data.cv.size / 1024).toFixed(0)} KB` : ''}{data.cv.updated
			? ` · ${new Date(data.cv.updated).toLocaleString()}`
			: ''}
	{:else}
		No uploaded CV. Serving the bundled fallback.
	{/if}
	· <a href="/cv" target="_blank" rel="noopener noreferrer" class="view">View</a>
</p>

<form
	method="POST"
	action="?/upload"
	enctype="multipart/form-data"
	use:enhance={() => {
		busy = true;
		return async ({ update }) => {
			await update();
			busy = false;
		};
	}}
>
	<label class="font-mono lbl" for="cv">Replace CV (PDF, max 4 MB)</label>
	<input id="cv" name="cv" type="file" accept="application/pdf" required />
	{#if form?.error}
		<p class="err font-mono" role="alert">{form.error}</p>
	{:else if form?.ok}
		<p class="okmsg font-mono" role="status">Uploaded. Live within a minute.</p>
	{/if}
	<button type="submit" class="act font-mono" disabled={busy}>{busy ? 'Uploading' : 'Upload'}</button>
</form>

<style>
	.head {
		margin-bottom: 2rem;
	}
	.status {
		font-size: 0.8125rem;
		letter-spacing: 0.1em;
		color: var(--ink-dim);
		margin: 0 0 2rem;
	}
	.view {
		color: var(--accent);
	}
	form {
		display: grid;
		gap: 0.75rem;
		justify-items: start;
	}
	.lbl {
		font-size: 0.6875rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.err {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--danger);
	}
	.okmsg {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--accent);
	}
	.act {
		font-size: 0.6875rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--ink);
		background: none;
		border: 1px solid var(--line);
		padding: 0.5rem 1rem;
		cursor: pointer;
		transition: color 0.2s ease;
	}
	.act:hover {
		color: var(--accent);
	}
	.act:disabled {
		opacity: 0.5;
		cursor: default;
	}
	:where(a, button, input):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
