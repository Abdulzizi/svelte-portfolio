<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

{@render children()}

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
