<script lang="ts">
	import { navigating } from '$app/state';

	let visible = $state(false);
	let shownAt = 0;
	let showTimer: ReturnType<typeof setTimeout> | undefined;
	let hideTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const busy = navigating.to !== null;
		clearTimeout(showTimer);
		clearTimeout(hideTimer);
		if (busy) {
			if (!visible) {
				showTimer = setTimeout(() => {
					shownAt = Date.now();
					visible = true;
				}, 150);
			}
		} else if (visible) {
			hideTimer = setTimeout(() => (visible = false), Math.max(0, 300 - (Date.now() - shownAt)));
		}
	});

	$effect(() => {
		if (!visible) return;
		document.documentElement.setAttribute('data-loading', '');
		document.documentElement.setAttribute('aria-busy', 'true');
		return () => {
			document.documentElement.removeAttribute('data-loading');
			document.documentElement.removeAttribute('aria-busy');
		};
	});
</script>

{#if visible}
	<div class="nav-progress" role="progressbar" aria-label="Loading page"></div>
	<span class="sr-only" role="status" aria-live="polite">Loading</span>
{/if}

<style>
	.nav-progress {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		z-index: 80;
		overflow: hidden;
		pointer-events: none;
	}

	.nav-progress::after {
		content: '';
		position: absolute;
		inset: 0;
		width: 40%;
		background: var(--accent);
		animation: nav-slide 1s ease-in-out infinite;
	}

	@keyframes nav-slide {
		from { transform: translateX(-100%); }
		to { transform: translateX(250%); }
	}

	:global(html[data-motion='off']) .nav-progress::after {
		width: 100%;
		opacity: 0.35;
		animation: none;
		transform: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-progress::after {
			width: 100%;
			opacity: 0.35;
			animation: none;
			transform: none;
		}
	}

	:global(html[data-loading]:not([data-custom-cursor])),
	:global(html[data-loading]:not([data-custom-cursor]) body) {
		cursor: progress;
	}
</style>
