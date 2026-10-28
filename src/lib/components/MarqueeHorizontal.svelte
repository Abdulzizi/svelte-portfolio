<script lang="ts">
	let { position = 'top' }: { position?: 'top' | 'bottom' } = $props();
</script>

<style>
	@keyframes scroll-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
	.strip-inner {
		color: var(--ink-dim);
		animation: scroll-left 20s linear infinite;
	}
</style>

<div class="absolute {position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 overflow-hidden bg-[var(--bg)] h-8 z-10 pointer-events-none" aria-hidden="true">
	<div class="inline-block font-mono text-[10px] uppercase tracking-[0.2em] h-full leading-8 whitespace-nowrap strip-inner">
		FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN — FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN —
	</div>
</div>
