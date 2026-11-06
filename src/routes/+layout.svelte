<script lang="ts">
	import '../app.css';
	import Marquee from '$lib/components/Marquee.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { children } = $props();
</script>

<div class="relative">
	<Marquee axis="x" position="top" />
	<Marquee axis="x" position="bottom" />
	<Marquee axis="y" position="left" />
	<Marquee axis="y" position="right" />
	<a class="skip-link" href="#main-content">Skip to content</a>
	{@render children()}
	<ThemeToggle />
</div>

<style>
	.skip-link {
		position: fixed;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 70;
		padding: 0.5rem 0.75rem;
		background: var(--bg);
		color: var(--ink);
		transform: translateY(-200%);
	}

	.skip-link:focus-visible {
		transform: translateY(0);
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
