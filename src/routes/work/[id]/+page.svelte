<script lang="ts">
	import ImageDistort from '$lib/components/ImageDistort.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const p = $derived(data.project);
</script>

<svelte:head>
	<title>{p.title} | Abdul Jawad Azizi</title>
	<meta name="description" content={p.impact} />
</svelte:head>

<main id="main-content" class="page text-[var(--ink)]">
	<a href="/work" class="back font-hand font-extrabold">Back</a>

	<article class="case">
		<h1 class="title font-hand font-extrabold">{p.title}</h1>

		<dl class="meta font-mono">
			<div><dt>Role</dt><dd>{p.role}</dd></div>
			<div><dt>Year</dt><dd>{p.year}</dd></div>
		</dl>
		<ul class="chips font-mono" aria-label="Stack">
			{#each p.stack as s}
				<li>{s}</li>
			{/each}
		</ul>

		<ImageDistort class="hero" src={p.imagePath ?? ''} alt={`${p.title} screenshot`} />

		<section class="sec">
			<h2 class="font-mono">Problem</h2>
			<p>{p.problem}</p>
		</section>
		<section class="sec">
			<h2 class="font-mono">Impact</h2>
			<p class="impact">{p.impact}</p>
		</section>
		<section class="sec">
			<h2 class="font-mono">Result</h2>
			<p>{p.result}</p>
		</section>

		{#if p.body}
			<div class="body">{@html p.body}</div>
		{/if}

		{#if data.prev && data.next}
			<nav class="pn font-mono" aria-label="More projects">
				<a href={`/work/${data.prev.id}`} rel="prev"><span>← Previous</span><strong class="font-hand">{data.prev.title}</strong></a>
				<a href={`/work/${data.next.id}`} rel="next"><span>Next →</span><strong class="font-hand">{data.next.title}</strong></a>
			</nav>
		{/if}
	</article>
</main>

<style>
	.page { padding: 4.5rem 2.25rem 4rem; min-height: 100dvh; padding-left: max(2.25rem, env(safe-area-inset-left)); padding-right: max(2.25rem, env(safe-area-inset-right)); padding-bottom: max(4rem, env(safe-area-inset-bottom)); }
	.back { position: absolute; top: 3rem; left: 2.5rem; z-index: 20; padding: 0.25rem 0; }
	.back:focus-visible, .pn a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.case { max-width: 52rem; margin: 3rem auto 0; animation: rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
	.title { font-size: clamp(2.5rem, 9vw, 6rem); line-height: 1; text-transform: uppercase; letter-spacing: -0.02em; overflow-wrap: anywhere; }
	.meta { display: flex; flex-wrap: wrap; gap: 0.5rem 2rem; margin-top: 1.5rem; font-size: 0.8rem; letter-spacing: 0.08em; }
	.meta div { display: flex; gap: 0.75rem; }
	.meta dt { color: var(--ink-dim); text-transform: uppercase; }
	.chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; font-size: 0.75rem; letter-spacing: 0.1em; }
	.chips li { border: 1px solid var(--line); padding: 0.25rem 0.6rem; color: var(--ink-dim); }
	:global(.hero) { display: block; width: 100%; aspect-ratio: 16 / 9; height: auto; object-fit: cover; border: 1px solid var(--line); background: var(--surface); margin: 2rem 0; }
	.sec { padding: 1.25rem 0; border-top: 1px solid var(--line); }
	.sec h2 { font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-dim); margin-bottom: 0.5rem; }
	.sec p { line-height: 1.6; max-width: 42rem; }
	.impact { color: var(--accent); }
	.body { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--line); color: var(--ink-dim); line-height: 1.7; max-width: 42rem; }
	.body :global(a) { color: var(--accent); text-decoration: underline; }
	.body :global(h2), .body :global(h3) { color: var(--ink); font-family: var(--font-hand); font-weight: 800; margin: 1rem 0 0.25rem; }
	.body :global(ul), .body :global(ol) { margin: 0.5rem 0 0.5rem 1.25rem; }
	.body :global(img) { display: block; max-width: 100%; height: auto; border: 1px solid var(--line); margin: 1rem 0; }
	.pn { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 3rem; }
	.pn a { display: flex; flex-direction: column; gap: 0.25rem; padding: 1rem; min-height: 44px; border: 1px solid var(--line); transition: color 0.2s ease, border-color 0.2s ease; }
	.pn a:last-child { text-align: right; }
	.pn span { font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-dim); }
	.pn strong { font-size: 1.25rem; text-transform: uppercase; overflow-wrap: anywhere; }
	.pn a:hover { color: var(--accent); border-color: var(--accent); }
	@keyframes rise { from { opacity: 0; transform: translateY(1rem); } to { opacity: 1; transform: none; } }
	@media (prefers-reduced-motion: reduce) {
		.case { animation: none; }
		.pn a { transition: none; }
	}
</style>
