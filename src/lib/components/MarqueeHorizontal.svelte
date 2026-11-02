<script lang="ts">
	let { position = 'top', text = ' FULL STACK DEVELOPER — DATA SCIENCE — CLEAN INTERFACES — TYPE DESIGN — CLEAN ARCHITECHTURE - ROBUST SYSTEM — ', speed = 150 }: { position?: 'top' | 'bottom'; text?: string; speed?: number } = $props();

	let track = $state<HTMLElement>();
	let width = 0;
	let clones = 0;

	function setup() {
		if (!track) return;
		const child = track.firstElementChild as HTMLElement;
		if (!child) return;

		child.style.whiteSpace = 'nowrap';
		width = child.getBoundingClientRect().width;
		if (width === 0) return;

		const containerWidth = track.parentElement?.getBoundingClientRect().width || window.innerWidth;
		const needed = Math.ceil(containerWidth / width) + 2;

		track.innerHTML = '';
		for (let i = 0; i < needed; i++) {
			const clone = child.cloneNode(true) as HTMLElement;
			track.appendChild(clone);
		}
		clones = needed;
		start();
	}

	function start() {
		if (!track || width === 0) return;
		const duration = width / speed;
		track.style.setProperty('--marquee-dist', `-${width}px`);
		track.style.setProperty('--marquee-dur', `${duration}s`);
	}

	$effect(() => {
		setup();
		document.fonts?.ready.then(setup);
		window.addEventListener('resize', setup);
		return () => window.removeEventListener('resize', setup);
	});
</script>

<style>
	@keyframes marquee-h {
		from { transform: translateX(0); }
		to { transform: translateX(var(--marquee-dist)); }
	}
	.track {
		display: flex;
		will-change: transform;
		color: var(--ink-dim);
		animation: marquee-h var(--marquee-dur, 10s) linear infinite;
	}
	@media (prefers-reduced-motion: reduce) {
		.track {
			animation: none !important;
		}
	}
</style>

<div class="absolute {position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 overflow-hidden bg-[var(--bg)] h-8 z-10 pointer-events-none" aria-hidden="true">
	<div class="track" bind:this={track}>
		<span class="font-mono text-[10px] uppercase tracking-[0.2em] h-full leading-8 whitespace-nowrap">{text}</span>
	</div>
</div>