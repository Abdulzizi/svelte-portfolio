<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { motionOff } from '$lib/motion-pref.svelte';

	let canvas: HTMLCanvasElement;
	let markDirty = () => {};

	afterNavigate(() => markDirty());

	onMount(() => {
		if (matchMedia('(pointer: coarse)').matches) return;

		let field: { update: (o: Record<string, unknown>) => void; destroy: () => void } | undefined;
		let mo: MutationObserver | undefined;
		let ro: ResizeObserver | undefined;
		let dead = false;

		let rects: DOMRect[] = [];
		let dirty = true;
		const range = document.createRange();
		const mark = () => {
			dirty = true;
		};
		markDirty = mark;
		const read = () => {
			if (!dirty) return rects;
			dirty = false;
			rects = [...document.querySelectorAll('main h1, main h2, main h3, main p, main label, main button, main a, main li')].flatMap((el) => {
				range.selectNodeContents(el);
				return [...range.getClientRects()];
			});
			return rects;
		};

		const ink = () => getComputedStyle(document.documentElement).getPropertyValue('--ink-dim').trim();

		import('asciify-engine/field').then(({ isGlyphFieldSupported, mountGlyphField }) => {
			if (dead || !isGlyphFieldSupported()) return;
			field = mountGlyphField(canvas, {
				scene: 'flow',
				charset: ' .:-=+*',
				cellSize: 16,
				cellAspect: 0.62,
				font: 'ui-monospace, "Geist Mono", monospace',
				color: 'ink',
				ink: ink(),
				hover: 'trail',
				clear: { rects: read, padding: 6, softness: 24, strength: 0.25 },
				speed: motionOff() ? 0 : 0.6,
				label: ''
			});
			addEventListener('scroll', mark, { passive: true, capture: true });
			addEventListener('resize', mark);
			document.fonts.addEventListener('loadingdone', mark);
			ro = new ResizeObserver(mark);
			ro.observe(document.body);
			mo = new MutationObserver(() =>
				field?.update({ ink: ink(), speed: motionOff() ? 0 : 0.6 })
			);
			mo.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme', 'data-motion']
			});
		});

		return () => {
			dead = true;
			mo?.disconnect();
			ro?.disconnect();
			removeEventListener('scroll', mark, { capture: true });
			removeEventListener('resize', mark);
			document.fonts.removeEventListener('loadingdone', mark);
			field?.destroy();
		};
	});
</script>

<canvas bind:this={canvas} class="ascii" aria-hidden="true"></canvas>

<style>
	.ascii { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; opacity: 0.2; }
</style>
