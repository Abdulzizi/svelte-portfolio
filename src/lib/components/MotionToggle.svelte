<script lang="ts">
	import { motionPref } from '$lib/motion-pref.svelte';
</script>

<button
	type="button"
	class="toggle font-mono"
	data-chrome
	onclick={() => motionPref.toggle()}
	aria-label={motionPref.off ? 'Turn motion on' : 'Reduce motion'}
	aria-pressed={motionPref.off}
>
	{#if motionPref.off}
		<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
		</svg>
	{/if}
</button>

<style>
	.toggle {
		position: fixed; z-index: 40;
		right: calc(max(2.25rem, env(safe-area-inset-right)) + 3.5rem);
		bottom: max(2.25rem, env(safe-area-inset-bottom));
		display: flex; align-items: center; justify-content: center;
		width: 2.75rem; height: 2.75rem;
		border: 1px solid var(--line); background: var(--bg); color: var(--ink);
		transition: color 0.2s ease, border-color 0.2s ease, opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1);
		view-transition-name: motion-toggle;
	}
	.toggle:hover { color: var(--accent); border-color: var(--accent); }
	.toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

	@media (min-width: 1024px) and (min-height: 640px) {
		.toggle {
			right: calc(max(2.75rem, env(safe-area-inset-right)) + 3.5rem);
			bottom: max(2.75rem, env(safe-area-inset-bottom));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.toggle { transition: none; }
	}
</style>
