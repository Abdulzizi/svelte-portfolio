<script lang="ts">
	import '../app.css';
	import MarqueeHorizontal from '$lib/components/MarqueeHorizontal.svelte';
	import MarqueeVertical from '$lib/components/MarqueeVertical.svelte';

	let { children } = $props();
</script>

<div class="relative">
	<MarqueeHorizontal position="top" />
	<MarqueeHorizontal position="bottom" />
	<MarqueeVertical side="left" />
	<MarqueeVertical side="right" />
	{@render children()}
</div>

<style>
	:global(::view-transition-old(root)),
	:global(::view-transition-new(root)) {
		animation-duration: 180ms;
		animation-timing-function: ease-out;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(::view-transition-old(root)),
		:global(::view-transition-new(root)) {
			animation: none;
		}
	}
</style>
