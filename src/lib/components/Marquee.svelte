<script lang="ts">
	import { onMount } from 'svelte';
	import { loadTicker, ticker } from '$lib/ticker.svelte';

	const TAGLINE = ['FULL STACK DEVELOPER', 'DATA SCIENCE', 'CLEAN INTERFACES', 'TYPE DESIGN', 'CLEAN ARCHITECTURE', 'ROBUST SYSTEM'];
	const TIMEZONE = 'Asia/Jakarta';
	const SPEED = 40; // px per second

	let { axis, position }: { axis: 'x' | 'y'; position: 'top' | 'bottom' | 'left' | 'right' } = $props();

	let bar = $state<HTMLElement>();
	let track = $state<HTMLElement>();
	let count = $state(1);
	let now = $state('');

	const text = $derived(
		` ${[...TAGLINE, ...(now ? [`${now} JAKARTA`] : []), ...(ticker.post ? [`NEW: ${ticker.post}`] : []), ...(ticker.github ? [ticker.github] : [])].join(' — ')} — `
	);

	function tick() {
		now = new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
	}

	onMount(() => {
		tick();
		loadTicker();
		const id = setInterval(() => {
			tick();
			loadTicker();
		}, 60_000);
		return () => clearInterval(id);
	});

	const barClass = $derived(
		axis === 'x'
			? `${position === 'top' ? 'top-0 marquee-top' : 'bottom-0 marquee-bottom'} left-0 right-0 h-8`
			: `${position === 'left' ? 'left-0 marquee-left border-r' : 'right-0 marquee-right border-l'} top-8 bottom-8 w-6 lg:w-8 border-[var(--line)]`
	);
	const textClass = $derived(
		axis === 'x'
			? 'text-xs h-full leading-8'
			: 'text-xs leading-6'
	);

	$effect(() => {
		if (!bar || !track) return;
		void text;
		const b = bar;
		const t = track;
		let alive = true;

		function measure() {
			if (!alive) return;
			const item = t.firstElementChild?.getBoundingClientRect();
			const bounds = b.getBoundingClientRect();
			const size = item ? (axis === 'x' ? item.width : item.height) : 0;
			if (size === 0) return;
			const container = axis === 'x' ? bounds.width : bounds.height;
			count = Math.ceil(container / size) + 2;
			t.style.setProperty('--marquee-dist', `-${size}px`);
			t.style.setProperty('--marquee-dur', `${size / SPEED}s`);
		}

		const ro = new ResizeObserver(measure);
		ro.observe(b);
		document.fonts?.ready.then(measure);

		return () => {
			alive = false;
			ro.disconnect();
		};
	});
</script>

<div
	bind:this={bar}
	class="fixed overflow-hidden bg-[var(--bg)] z-10 {barClass}"
	style="view-transition-name: marquee-{position}"
	data-chrome
	aria-hidden="true"
>
	<div class="track" class:vertical={axis === 'y'} bind:this={track}>
		{#each Array(count) as _, i (i)}
			<span class="font-mono uppercase tracking-[0.1em] whitespace-pre {textClass}">{text}</span>
		{/each}
	</div>
</div>

<style>
	@keyframes marquee-x {
		from { transform: translateX(0); }
		to { transform: translateX(var(--marquee-dist)); }
	}
	@keyframes marquee-y {
		from { transform: translateY(0); }
		to { transform: translateY(var(--marquee-dist)); }
	}
	.track {
		display: flex;
		color: var(--ink-dim);
		animation: marquee-x var(--marquee-dur, 10s) linear infinite;
	}
	div:hover > .track {
		animation-play-state: paused;
	}
	.track.vertical {
		/* in vertical-rl, inline axis = vertical, so row stacks vertically */
		flex-direction: row;
		writing-mode: vertical-rl;
		animation-name: marquee-y;
	}

	.marquee-top { padding-top: env(safe-area-inset-top); }
	.marquee-bottom { padding-bottom: env(safe-area-inset-bottom); }
	.marquee-left { padding-left: env(safe-area-inset-left); }
	.marquee-right { padding-right: env(safe-area-inset-right); }
	@media (prefers-reduced-motion: reduce) {
		.track {
			animation: none !important;
		}
	}
</style>
