<script lang="ts">
	let { side = 'left', text = 'FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN —', speed = 150 }: { side?: 'left' | 'right'; text?: string; speed?: number } = $props();

	let track = $state<HTMLElement>();
	let itemHeight = 0;
	let clones = 0;

	function setup() {
		if (!track) return;
		const child = track.firstElementChild as HTMLElement;
		if (!child) return;

		child.style.whiteSpace = 'nowrap';
		const rect = child.getBoundingClientRect();
		itemHeight = rect.height;
		if (itemHeight === 0) return;

		const containerHeight = track.parentElement?.getBoundingClientRect().height || window.innerHeight;
		const needed = Math.ceil(containerHeight / itemHeight) + 2;

		track.innerHTML = '';
		for (let i = 0; i < needed; i++) {
			const clone = child.cloneNode(true) as HTMLElement;
			track.appendChild(clone);
		}
		clones = needed;
		start();
	}

	function start() {
		if (!track || itemHeight === 0) return;
		const duration = itemHeight / speed;
		const name = `marquee-v-${Math.random().toString(36).slice(2)}`;
		track.style.animation = `${name} ${duration}s linear infinite`;
		const sheet = document.styleSheets[0];
		const keyframes = `@keyframes ${name} { from { transform: translateY(0); } to { transform: translateY(-${itemHeight}px); } }`;
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
		flex-direction: row; /* in vertical-rl, inline axis = vertical, so row stacks vertically */
		will-change: transform;
		color: var(--ink-dim);
		writing-mode: vertical-rl;
	}
</style>

{#if side === 'left'}
	<div class="absolute left-0 top-8 bottom-8 w-6 lg:w-8 overflow-hidden border-r border-[var(--line)] bg-[var(--bg)] pointer-events-none z-10" aria-hidden="true">
		<div class="track" bind:this={track}>
			<span class="font-mono text-[8px] lg:text-[9px] uppercase tracking-[0.2em] whitespace-nowrap leading-6">{text}</span>
		</div>
	</div>
{:else}
	<div class="absolute right-0 top-8 bottom-8 w-6 lg:w-8 overflow-hidden border-l border-[var(--line)] bg-[var(--bg)] pointer-events-none z-10" aria-hidden="true">
		<div class="track" bind:this={track}>
			<span class="font-mono text-[8px] lg:text-[9px] uppercase tracking-[0.2em] whitespace-nowrap leading-6">{text}</span>
		</div>
	</div>
{/if}