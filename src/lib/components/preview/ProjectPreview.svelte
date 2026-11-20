<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { SANITIZE_ATTRS, SANITIZE_TAGS } from '$lib/sanitize-allowlist';

	let { children }: { children: Snippet } = $props();

	let wrap: HTMLDivElement;
	let open = $state(false);
	let f = $state<Record<string, string>>({});

	const field = (n: string) => f[n] ?? '';
	const list = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
	const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
	let purify = $state.raw<((html: string) => string) | null>(null);
	const bodyHtml = $derived(purify && field('body') ? purify(field('body')) : '');
	const isExp = $derived(field('kind') === 'experience');

	function read() {
		const el = wrap?.querySelector('form');
		if (!el) return;
		const next: Record<string, string> = {};
		for (const [k, v] of new FormData(el)) if (typeof v === 'string') next[k] = v;
		f = next;
	}

	function later() {
		setTimeout(read, 0);
	}

	onMount(() => {
		open = matchMedia('(min-width: 1024px)').matches;
		read();
		import('dompurify').then(({ default: DOMPurify }) => {
			DOMPurify.addHook('afterSanitizeAttributes', (node) => {
				if (node.tagName === 'A') node.setAttribute('rel', 'noopener noreferrer');
				if (node.tagName === 'IMG') {
					if (!/^https:\/\//i.test(node.getAttribute('src') ?? '')) node.remove();
					else node.setAttribute('loading', 'lazy');
				}
			});
			purify = (html) =>
				DOMPurify.sanitize(html, {
					ALLOWED_TAGS: [...SANITIZE_TAGS],
					ALLOWED_ATTR: [...SANITIZE_ATTRS.a, ...SANITIZE_ATTRS.img] as string[],
					ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
					ALLOW_DATA_ATTR: false
				});
		});
	});
</script>

<div class="wrap" class:open bind:this={wrap} oninput={later} onchange={later} role="presentation">
	<div class="editor">{@render children()}</div>
	<aside class="side" aria-label="Public preview">
		<button type="button" class="toggle font-mono" aria-expanded={open} onclick={() => (open = !open)}>
			{open ? 'Hide preview' : 'Preview'}
		</button>
		{#if open}
			<p class="note font-mono">
				{isExp ? 'Experience entry' : 'Case study'} preview{#if !isExp} · body sanitized like the public page{/if}
			</p>
			{#if isExp}
				<div class="entry">
					<p class="when font-mono">{field('year')}</p>
					<div>
						<h2 class="co font-hand font-extrabold">{field('company') || field('title')}</h2>
						<p class="xrole font-mono">{field('role')}</p>
						<ul class="outcomes">
							{#each lines(field('impact')) as line}<li>{line}</li>{/each}
						</ul>
						<ul class="chips font-mono">
							{#each list(field('stack')) as s}<li>{s}</li>{/each}
						</ul>
					</div>
				</div>
			{:else}
				<article class="case">
					<h2 class="title font-hand font-extrabold">{field('title')}</h2>
					<dl class="meta font-mono">
						<div><dt>Role</dt><dd>{field('role')}</dd></div>
						<div><dt>Year</dt><dd>{field('year')}</dd></div>
					</dl>
					<ul class="chips font-mono">
						{#each list(field('stack')) as s}<li>{s}</li>{/each}
					</ul>
					<section class="sec"><h3 class="font-mono">Problem</h3><p>{field('problem')}</p></section>
					<section class="sec"><h3 class="font-mono">Impact</h3><p class="impact">{field('impact')}</p></section>
					<section class="sec"><h3 class="font-mono">Result</h3><p>{field('result')}</p></section>
					{#if bodyHtml}<div class="body">{@html bodyHtml}</div>{/if}
				</article>
			{/if}
		{/if}
	</aside>
</div>

<style>
	.wrap {
		display: grid;
		gap: 1.5rem;
		align-items: start;
	}
	.wrap.open {
		grid-template-columns: minmax(0, 1fr);
	}
	@media (min-width: 1024px) {
		.wrap.open {
			grid-template-columns: minmax(0, 40rem) minmax(0, 1fr);
			gap: 3rem;
		}
		.wrap.open .side {
			position: sticky;
			top: 1.5rem;
			max-height: calc(100dvh - 3rem);
			overflow-y: auto;
		}
	}
	.side {
		display: grid;
		gap: 1rem;
		align-content: start;
		order: -1;
	}
	@media (min-width: 1024px) {
		.side {
			order: 0;
		}
	}
	.toggle {
		justify-self: start;
		font-size: 0.75rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--accent);
		border: 1px solid var(--accent);
		background: none;
		padding: 0.4rem 1rem;
		cursor: pointer;
	}
	.toggle:hover {
		background: var(--accent);
		color: var(--bg);
	}
	.toggle:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.note {
		margin: 0;
		font-size: 0.6875rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.side > :not(.toggle):not(.note) {
		border: 1px solid var(--line);
		background: var(--bg);
		color: var(--ink);
		padding: 1.5rem;
	}
	.title {
		font-size: clamp(1.75rem, 5vw, 3rem);
		line-height: 1;
		text-transform: uppercase;
		letter-spacing: -0.02em;
		overflow-wrap: anywhere;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 2rem;
		margin-top: 1rem;
		font-size: 0.8rem;
		letter-spacing: 0.08em;
	}
	.meta div {
		display: flex;
		gap: 0.75rem;
	}
	.meta dt {
		color: var(--ink-dim);
		text-transform: uppercase;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.9rem;
		padding: 0;
		list-style: none;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
	}
	.chips li {
		border: 1px solid var(--line);
		padding: 0.25rem 0.6rem;
		color: var(--ink-dim);
	}
	.sec {
		padding: 1rem 0;
		border-top: 1px solid var(--line);
		margin-top: 1rem;
	}
	.sec h3 {
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
		margin-bottom: 0.5rem;
	}
	.sec p {
		line-height: 1.6;
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
	.impact {
		color: var(--accent);
	}
	.body {
		padding-top: 1rem;
		border-top: 1px solid var(--line);
		color: var(--ink-dim);
		line-height: 1.7;
		overflow-wrap: anywhere;
	}
	.body :global(a) {
		color: var(--accent);
		text-decoration: underline;
	}
	.body :global(h2),
	.body :global(h3) {
		color: var(--ink);
		font-family: var(--font-hand);
		font-weight: 800;
		margin: 1rem 0 0.25rem;
	}
	.body :global(ul),
	.body :global(ol) {
		margin: 0.5rem 0 0.5rem 1.25rem;
	}
	.body :global(img) {
		display: block;
		max-width: 100%;
		height: auto;
		border: 1px solid var(--line);
		margin: 1rem 0;
	}
	.entry {
		display: grid;
		grid-template-columns: 6rem minmax(0, 1fr);
		gap: 1rem;
	}
	.when {
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		color: var(--accent);
	}
	.co {
		font-size: 1.75rem;
		line-height: 1;
		overflow-wrap: anywhere;
	}
	.xrole {
		margin-top: 0.4rem;
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		color: var(--ink-dim);
	}
	.outcomes {
		margin: 0.9rem 0 0 1.1rem;
		padding: 0;
		display: grid;
		gap: 0.35rem;
		color: var(--ink-dim);
		line-height: 1.5;
	}
</style>
