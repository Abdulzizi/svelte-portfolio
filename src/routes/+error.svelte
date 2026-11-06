<script lang="ts">
	// Site-wide styled error page. Renders inside +layout.svelte (marquee frame
	// already present), so this only supplies the content — padding clears the rails.
	import { page } from '$app/stores';

	const notFound = $derived($page.status === 404);
</script>

<svelte:head>
	<title>{$page.status} | Abdul Jawad Azizi</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="page text-[var(--ink)]">
	<a href="/" class="back font-hand font-extrabold">Back</a>
	<div class="mid">
		<p class="status font-mono">{$page.status}</p>
		<h1 class="heading font-hand font-extrabold">
			{#if notFound}Not <span class="accent">found</span>{:else}Something <span class="accent">broke</span>{/if}
		</h1>
		{#if $page.error?.message}
			<p class="detail font-mono">{$page.error.message}</p>
		{/if}
		<a href="/" class="home font-hand font-extrabold">Back home</a>
	</div>
</main>

<style>
	.page { padding: 4.5rem 2.25rem 4rem; min-height: 100dvh; display: flex; flex-direction: column; justify-content: center; padding-left: max(2.25rem, env(safe-area-inset-left)); padding-right: max(2.25rem, env(safe-area-inset-right)); padding-bottom: max(4rem, env(safe-area-inset-bottom)); }
	/* Above the fixed marquee bars (z-10) and clear of the ~2rem rails. */
	.back { position: absolute; top: 3rem; left: 2.5rem; z-index: 20; padding: 0.25rem 0; }
	.back:focus-visible, .home:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.mid { max-width: 42rem; }
	.status { font-size: clamp(3rem, 14vw, 8rem); line-height: 1; color: var(--ink-dim); letter-spacing: -0.02em; }
	.heading { font-size: clamp(2rem, 7vw, 4.5rem); line-height: 1; text-transform: uppercase; letter-spacing: -0.02em; margin-top: 0.5rem; }
	.accent { color: var(--accent); }
	.detail { margin-top: 1.25rem; color: var(--ink-dim); font-size: 0.8rem; letter-spacing: 0.08em; overflow-wrap: anywhere; }
	.home { display: inline-block; margin-top: 2rem; color: var(--accent); }
</style>
