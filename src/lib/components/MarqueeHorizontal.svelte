<script lang="ts">
	let { position = 'top', text = 'FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN —', speed = 50 }: { position?: 'top' | 'bottom'; text?: string; speed?: number } = $props();

	let track = $state<HTMLElement>();
	let width = 0;
	let clones = 0;

	function setup() {
		if (!track) return;
		const style = getComputedStyle(track);
		const gap = parseFloat(style.columnGap || style.gap || '0');
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
		const duration = width * clones / speed;
		const name = `marquee-${Math.random().toString(36).slice(2)}`;
		track.style.animation = `${name} ${duration}s linear infinite`;
		const sheet = document.styleSheets[0];
		const keyframes = `@keyframes ${name} { from { transform: translateX(0); } to { transform: translateX(-${width * clones}px); } }`;
		try {
			sheet.insertRule(keyframes, sheet.cssRules.length);
		} catch {}
	}

	$effect(() => {
		setup();
		window.addEventListener('resize', setup);
		return () => window.removeEventListener('resize', setup);
	});
</script>

<style>
	.track {
		display: flex;
		will-change: transform;
		color: var(--ink-dim);
	}
</style>

<div class="absolute {position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 overflow-hidden bg-[var(--bg)] h-8 z-10 pointer-events-none" aria-hidden="true">
	<div class="track" bind:this={track}>
		<span class="font-mono text-[10px] uppercase tracking-[0.2em] h-full leading-8 whitespace-nowrap">{text}</span>
	</div>
</div>