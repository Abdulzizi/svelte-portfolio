<script lang="ts">
	// /blog — editorial scroll index. Normal vertical scroll (NOT the /work deck).
	// Hairline-separated rows: mono date, Syne title link, dimmed excerpt.
	import { fmtDate } from '$lib/date';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const posts = $derived(data.posts);
	const hasPosts = $derived(posts.length > 0);
</script>

<svelte:head>
	<title>Blog | Abdul Jawad Azizi</title>
	<meta name="description" content="Writing by Abdul Jawad Azizi — notes on building and shipping full-stack products." />
</svelte:head>

<main id="main-content" class="page text-[var(--ink)]">
	<a href="/" class="back font-hand font-extrabold">Back</a>

	<div class="wrap">
		<header class="head">
			<h1 class="font-hand font-extrabold">Writing</h1>
			<p class="lede font-mono">Notes on building and shipping.</p>
		</header>

		{#if data.loadError}
			<p class="state font-mono">Couldn't load posts right now.</p>
		{:else if !hasPosts}
			<p class="state font-mono">No posts yet.</p>
		{:else}
			<ul class="list" data-reveal-children use:reveal={{ stagger: 0.06 }}>
				{#each posts as p (p.slug)}
					<li class="row">
						<a class="row-link" href={`/blog/${p.slug}`}>
							<span class="date font-mono">{fmtDate(p.publishedAt ?? p.createdAt)}</span>
							<span class="title font-hand font-extrabold" style="view-transition-name: post-{p.slug}">{p.title}</span>
							{#if p.excerpt}
								<span class="excerpt">{p.excerpt}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
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

	.wrap { margin: 3.5rem auto 0; width: 100%; max-width: 68rem; }

	.head { margin-bottom: 2.5rem; }
	.head h1 {
		font-size: clamp(2.5rem, 9vw, 5rem);
		line-height: 1;
		text-transform: uppercase;
		letter-spacing: -0.02em;
	}
	.lede {
		margin-top: 0.75rem;
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}

	.state {
		margin-top: 2rem;
		font-size: 0.8rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}

	.list { display: flex; flex-direction: column; }
	.row { border-bottom: 1px solid var(--line); }
	.row:first-child { border-top: 1px solid var(--line); }

	.row-link {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.4rem;
		padding: 1.5rem 0;
		min-height: 44px;
		color: inherit;
		text-decoration: none;
	}
	.row-link:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }

	.date {
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.title {
		font-size: clamp(1.5rem, 4.5vw, 2.75rem);
		line-height: 1.05;
		letter-spacing: -0.01em;
		overflow-wrap: anywhere;
		transition: color 0.3s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
		position: relative;
		justify-self: start;
	}
	.title::after {
		content: "";
		position: absolute;
		left: 0;
		bottom: -0.1em;
		height: 2px;
		width: 100%;
		background: var(--accent);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.excerpt {
		max-width: 48rem;
		color: var(--ink-dim);
		line-height: 1.6;
		overflow-wrap: anywhere;
	}

	@media (hover: hover) and (pointer: fine) {
		.row-link:hover .title { color: var(--accent); transform: translateX(0.35rem); }
		.row-link:hover .title::after { transform: scaleX(1); }
	}
	.row-link:focus-visible .title { color: var(--accent); transform: translateX(0.35rem); }
	.row-link:focus-visible .title::after { transform: scaleX(1); }

	@media (prefers-reduced-motion: reduce) {
		.title, .title::after { transition: none; }
	}
</style>
