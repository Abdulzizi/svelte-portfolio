<script lang="ts">
	import ImageDistort from '$lib/components/ImageDistort.svelte';
</script>

<svelte:head>
	<title>Ripple sample</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="wrap">
	<ImageDistort class="demo" src="/ripple-sample.svg" alt="Colorful abstract artwork" />
	<p class="font-mono cap">Move the mouse over the image.</p>
</main>

<style>
	.wrap { min-height: 100dvh; display: grid; place-content: center; gap: 1rem; padding: 4.5rem 2.25rem; }
	.cap { color: var(--ink-dim); font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; }
	:global(.demo) { width: min(100%, 48rem); aspect-ratio: 16 / 9; border: 1px solid var(--line); }
</style>
