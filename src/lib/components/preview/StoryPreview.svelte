<script lang="ts">
	import { onMount } from 'svelte';

	let root: HTMLDivElement;
	let kicker = $state('');
	let big = $state('');
	let body = $state('');

	onMount(() => {
		const form = root.closest('form');
		if (!form) return;
		const read = () => {
			const d = new FormData(form);
			kicker = String(d.get('kicker') ?? '');
			big = String(d.get('big') ?? '');
			body = String(d.get('body') ?? '');
		};
		read();
		form.addEventListener('input', read);
		return () => form.removeEventListener('input', read);
	});
</script>

<div class="card" bind:this={root} aria-label="Chapter preview">
	<p class="tag font-mono">Preview</p>
	<p class="kicker font-mono">{kicker}</p>
	<p class="big font-hand font-extrabold">{big}</p>
	<p class="text">{body}</p>
</div>

<style>
	.card {
		border: 1px dashed var(--line);
		background: var(--bg);
		padding: 1.25rem;
		min-width: 0;
	}
	.tag {
		margin: 0;
		font-size: 0.625rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.kicker {
		margin: 0.75rem 0 0;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: var(--accent);
	}
	.big {
		margin: 0.75rem 0 0;
		font-size: clamp(1.75rem, 6vw, 2.75rem);
		line-height: 0.95;
		letter-spacing: -0.02em;
		color: var(--ink);
		overflow-wrap: anywhere;
	}
	.text {
		margin: 1rem 0 0;
		max-width: 34rem;
		font-size: 1rem;
		color: var(--ink-dim);
		overflow-wrap: anywhere;
	}
</style>
