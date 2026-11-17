<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const errors = $derived(form && 'errors' in form ? (form.errors ?? {}) : {});
	const v = $derived(form?.values ?? data.settings);

	const fields = [
		{ name: 'email', label: 'Email', type: 'email', max: 254 },
		{ name: 'githubUrl', label: 'GitHub URL', type: 'url', max: 300 },
		{ name: 'linkedinUrl', label: 'LinkedIn URL', type: 'url', max: 300 },
		{ name: 'instagramUrl', label: 'Instagram URL', type: 'url', max: 300 },
		{ name: 'availability', label: 'Availability', type: 'text', max: 80 }
	] as const;
</script>

<svelte:head>
	<title>Settings | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<h1 class="font-hand mb-8 text-3xl font-extrabold leading-none">
	Sett<span class="text-[var(--accent)]">ings</span>
</h1>

{#if form && 'error' in form && form.error}
	<p class="err font-mono" role="alert">{form.error}</p>
{/if}
{#if form && 'ok' in form && form.ok}
	<p class="ok font-mono" role="status">Settings saved.</p>
{/if}

<form method="POST" use:enhance={() => async ({ update }) => update({ reset: false })}>
	{#each fields as f (f.name)}
		<label class="field">
			<span class="lbl font-mono">{f.label}</span>
			<input name={f.name} type={f.type} maxlength={f.max} required value={v[f.name]} />
			{#if errors[f.name]}<span class="err font-mono">{errors[f.name]?.[0]}</span>{/if}
		</label>
	{/each}
	<div>
		<button type="submit" class="save font-mono">Save</button>
	</div>
</form>

<style>
	form {
		display: grid;
		gap: 0.75rem;
		max-width: 36rem;
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
	input {
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
		margin-bottom: 1rem;
	}
	.save {
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
	.save:hover {
		color: var(--ink);
	}
	:where(button, input):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
