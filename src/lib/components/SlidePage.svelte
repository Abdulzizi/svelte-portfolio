<script lang="ts">
	import type { Snippet } from 'svelte';
	import SlideArrow from '$lib/components/SlideArrow.svelte';
	import { useWide } from '$lib/wide.svelte';

	// Shared slide-page shell for /connect and /about: .page frame, Back link,
	// viewport/track, arrow nav, arrow-key + focus management. Page-specific
	// content and CSS stay in each page; only the shared shell lives here.
	let {
		count,
		index = $bindable(0),
		headingIds,
		arrowLabel,
		trackTiming = 'ease',
		children
	}: {
		count: number;
		index?: number;
		headingIds: string[];
		arrowLabel: string;
		// caveman: per-page track easing (connect: ease, about: cubic-bezier) kept via prop so one stylesheet serves both. Upgrade: a shared motion token.
		trackTiming?: string;
		children: Snippet<[{ wide: boolean; index: number }]>;
	} = $props();

	const wideState = useWide();
	const wide = $derived(wideState.current);

	async function focusSlide(i: number) {
		const { tick } = await import('svelte');
		await tick();
		document.getElementById(headingIds[i])?.focus();
	}

	async function onkeydown(e: KeyboardEvent) {
		if (!wide) return;
		const t = e.target as HTMLElement;
		// Keep keys usable for typing/activating: ignore when focus is in a field or control.
		if (t.matches('input, textarea, a, button')) return;
		if (e.key === 'ArrowRight' && index < count - 1) {
			index += 1;
			await focusSlide(index);
		}
		if (e.key === 'ArrowLeft' && index > 0) {
			index -= 1;
			await focusSlide(index);
		}
	}

	// Bare arrow: wrapping advance. For count=2 this is identical to a 0<->1 toggle.
	function onArrow() {
		if (count < 1) return;
		index = (index + 1) % count;
	}
</script>

<svelte:window {onkeydown} />

<main
	id="main-content"
	class="page relative text-[var(--ink)]"
	style="--i: {index}; --n: {count}; --track-timing: {trackTiming}"
>
	<a href="/" class="back font-hand font-extrabold">Back</a>

	{@render children({ wide, index })}

	<SlideArrow label={arrowLabel} onclick={onArrow} />
</main>

<style>
	/* Base (small / short screens): stacked, normal page scroll, clear of the marquee bars. */
	.page { padding: 4.5rem 2.25rem 4rem; min-height: 100dvh; }
	/* Above the fixed marquee bars (z-10) and clear of the ~2rem rails. */
	.back { position: absolute; top: 3rem; left: 2.5rem; z-index: 20; }

	/* Entrance: content fades up on load. transform/opacity only. */
	.back { animation: rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }

	@keyframes rise {
		from { opacity: 0; transform: translateY(1rem); }
		to { opacity: 1; transform: none; }
	}

	/* Back link; arrow owns its own ring. Pages add rings for their own focusables. */
	:where(a):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

	/* Shared shell structure comes from each page's <section class="slide"> inside .track. */
	:global(.page .track) { display: flex; flex-direction: column; gap: 4rem; }
	:global(.page .slide > div) { animation: rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: 80ms; }

	/* One viewport, no scroll, sideways slides. --n slides wide. */
	@media (min-width: 1024px) and (min-height: 640px) {
		.page { height: 100dvh; min-height: 0; overflow: hidden; padding: 3rem 2.5rem; }
		.back { top: 3rem; left: 2.5rem; }
		:global(.page .viewport) { height: 100%; overflow: hidden; }
		:global(.page .track) {
			flex-direction: row; gap: 0; width: calc(var(--n) * 100%); height: 100%;
			transform: translateX(calc(var(--i) * -100% / var(--n)));
			transition: transform 0.5s var(--track-timing);
		}
		:global(.page .slide) {
			flex: 0 0 calc(100% / var(--n)); display: flex; align-items: center;
			padding: 0 2rem; overflow-y: auto;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.page .track) { transition: none; }
	}
</style>
