<script lang="ts">
	// /blog/[slug] — the reading view. A centred, measured reading column is the point.
	import { tick } from 'svelte';
	import { fmtDate } from '$lib/date';
	import { reveal } from '$lib/actions/reveal';
	import { loadGsap } from '$lib/motion';
	import ReaderControls from '$lib/components/ReaderControls.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const post = $derived(data.post);
	const ogImage = $derived(data.ogImage);

	let article = $state<HTMLElement>();
	let bar = $state<HTMLElement>();
	let progress = $state(false);

	$effect(() => {
		let alive = true;
		let kill = () => {};
		loadGsap().then(async (m) => {
			if (!m || !alive) return;
			progress = true;
			await tick();
			if (!alive || !bar || !article) return;
			const tween = m.gsap.fromTo(
				bar,
				{ scaleX: 0 },
				{
					scaleX: 1,
					ease: 'none',
					scrollTrigger: { trigger: article, start: 'top top', end: 'bottom bottom', scrub: true }
				}
			);
			kill = () => {
				tween.scrollTrigger?.kill();
				tween.kill();
			};
		});
		return () => {
			alive = false;
			kill();
		};
	});
</script>

<svelte:head>
	<title>{post.title} | Abdul Jawad Azizi</title>
	<meta name="description" content={post.excerpt} />
	<meta property="og:title" content={post.title} />
	<meta property="og:description" content={post.excerpt} />
	<meta property="og:type" content="article" />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}
	{#if data.draft}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

{#if progress}
	<div class="progress" bind:this={bar} aria-hidden="true"></div>
{/if}

<main id="main-content" class="page text-[var(--ink)]">
	<a href="/blog" class="back font-hand font-extrabold">Back</a>

	<article class="wrap" bind:this={article}>
		{#if data.draft}
			<div class="draft font-mono">Draft preview — not published</div>
		{/if}
		<header class="masthead">
			<span class="kicker font-mono">Writing</span>
			<span class="date font-mono">{fmtDate(post.publishedAt ?? post.createdAt)}</span>
			<span class="date font-mono">{data.minutes} min read</span>
			<h1 class="headline font-hand font-extrabold" style="view-transition-name: post-{post.slug}">{post.title}</h1>
			{#if post.coverImage}
				<img class="cover" data-reveal use:reveal src={post.coverImage} alt={`${post.title} cover`} />
			{/if}
		</header>

		<ReaderControls target={article} />

		<div class="body" data-reveal-children use:reveal>
			{#if post.body}
				<!-- Sanitized server-side on save AND again on output (+page.server.ts). -->
				{@html post.body}
			{:else}
				<p class="lead">{post.excerpt}</p>
			{/if}
		</div>
	</article>
</main>

<style>
	/* Mirror /work wrapper: uniform gutters clear the marquee frame; safe-area only ADDS. */
	.page {
		padding: 4.5rem 2.25rem 4rem;
		min-height: 100dvh;
		padding-left: max(2.25rem, env(safe-area-inset-left));
		padding-right: max(2.25rem, env(safe-area-inset-right));
		padding-bottom: max(4rem, env(safe-area-inset-bottom));
	}
	/* Above the fixed marquee bars (z-10) and clear of the ~2rem rails. */
	.back {
		position: absolute;
		top: 3rem;
		left: 2.5rem;
		z-index: 20;
		padding: 0.25rem 0;
	}
	.back:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

	.wrap { margin: 3.5rem auto 0; width: 100%; max-width: var(--reader-wrap, 44rem); }

	.draft {
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--accent);
		border: 1px solid var(--accent);
		padding: 0.5rem 0.75rem;
		margin-bottom: 1.5rem;
	}

	/* Subtle entrance on the masthead only — transform/opacity, gated below. */
	.masthead {
		margin-bottom: 2.5rem;
		animation: rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	.kicker {
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--accent);
	}
	.date {
		margin-left: 1rem;
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.headline {
		margin-top: 1.25rem;
		font-size: clamp(2.25rem, 7vw, 4rem);
		line-height: 1.02;
		letter-spacing: -0.02em;
		overflow-wrap: anywhere;
	}
	.cover {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border: 1px solid var(--line);
		margin-top: 1.75rem;
	}

	/* The reading column: measured, generous, no horizontal overflow at 320px. */
	.body {
		max-width: var(--reader-measure, 38rem);
		font-family: var(--reader-font, var(--font-sans));
		font-size: var(--reader-size, 1.0625rem);
		line-height: var(--reader-leading, 1.7);
		color: var(--ink);
		overflow-wrap: anywhere;
	}
	@media (min-width: 640px) {
		.body { font-size: var(--reader-size, 1.125rem); }
	}

	.lead { color: var(--ink-dim); font-style: italic; }

	/* Rich elements (sanitize allowlist: p, br, strong, em, b, i, ul, ol, li, h2, h3, a). */
	.body :global(p) { margin: 0 0 1.4rem; }
	.body :global(p:last-child) { margin-bottom: 0; }
	.body :global(h2),
	.body :global(h3) {
		font-family: var(--font-hand);
		font-weight: 800;
		line-height: 1.15;
		letter-spacing: -0.01em;
		margin: 2.25rem 0 0.9rem;
	}
	.body :global(h2) { font-size: 1.75rem; }
	.body :global(h3) { font-size: 1.35rem; }
	.body :global(ul),
	.body :global(ol) { margin: 0 0 1.4rem 1.5rem; }
	.body :global(ul) { list-style: disc; }
	.body :global(ol) { list-style: decimal; }
	.body :global(li) { margin: 0.35rem 0; }
	.body :global(a) { color: var(--accent); text-decoration: underline; text-decoration-color: var(--line); text-underline-offset: 0.15em; transition: text-decoration-color 0.25s ease, text-underline-offset 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
	@media (hover: hover) and (pointer: fine) {
		.body :global(a:hover) { text-decoration-color: var(--accent); text-underline-offset: 0.25em; }
	}
	.body :global(a:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
	.body :global(strong),
	.body :global(b) { font-weight: 700; }
	.body :global(em),
	.body :global(i) { font-style: italic; }
	.body :global(img) { display: block; max-width: 100%; height: auto; border: 1px solid var(--line); margin: 1.75rem 0; }
	.body :global(blockquote) {
		margin: 1.6rem 0;
		padding-left: 1.1rem;
		border-left: 1px solid var(--line);
		color: var(--ink-dim);
		font-style: italic;
	}

	.progress {
		position: fixed;
		top: 2rem;
		left: 0;
		right: 0;
		height: 2px;
		z-index: 15;
		background: var(--accent);
		transform: scaleX(0);
		transform-origin: left;
		pointer-events: none;
	}

	:global([data-zen]) .back { display: none; }
	:global([data-zen]) .page { padding-top: 2rem; }
	:global([data-zen]) .wrap { margin-top: 1.5rem; }
	:global([data-zen]) .progress { top: 0; }

	@keyframes rise {
		from { opacity: 0; transform: translateY(0.75rem); }
		to { opacity: 1; transform: none; }
	}

	@media (prefers-reduced-motion: reduce) {
		.masthead { animation: none; }
	}
</style>
