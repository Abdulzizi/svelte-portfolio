<script lang="ts">
	// Shared slide-nav arrow for /connect and /about. Hidden until the one-viewport
	// breakpoint (min-width 1024px and min-height 640px), same as both pages' layout.
	let {
		label,
		onclick
	}: { label: string; onclick: () => void } = $props();
</script>

<button type="button" class="arrow" aria-label={label} {onclick}>
	<!-- Phosphor caret-right (MIT). -->
	<svg class="icon-nudge" viewBox="0 0 256 256" width="22" height="22" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<polyline points="96 48 176 128 96 208" />
	</svg>
</button>

<style>
	.arrow { display: none; }

	@media (min-width: 1024px) and (min-height: 640px) {
		.arrow {
			display: flex; align-items: center; justify-content: center;
			position: absolute; right: 2.5rem; top: 50%; margin-top: -1.5rem;
			width: 3rem; height: 3rem; border: 1px solid var(--line); color: var(--ink);
			transition: opacity 0.2s ease;
			--tx: 3px;
		}
		.arrow:hover { opacity: 0.7; }
	}

	:where(.arrow):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

	@media (prefers-reduced-motion: reduce) {
		.arrow { transition: none; }
	}
</style>
