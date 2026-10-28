<script lang="ts">
	let { side = 'left' }: { side?: 'left' | 'right' } = $props();
</script>

<style>
	@keyframes scroll-up { from { transform: translateY(0); } to { transform: translateY(-50%); } }
	.strip-inner {
		color: var(--ink-dim);
		animation: scroll-up 15s linear infinite;
	}
</style>

{#if side === 'left'}
	<div class="absolute left-0 top-8 bottom-8 w-6 lg:w-8 overflow-hidden border-r border-[var(--line)] bg-[var(--bg)] pointer-events-none z-10" aria-hidden="true">
		<div class="strip-inner font-mono text-[8px] lg:text-[9px] uppercase tracking-[0.2em] whitespace-nowrap h-full leading-6" style="writing-mode: vertical-rl; transform: rotate(180deg);">
			FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN — FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN —
		</div>
	</div>
{:else}
	<div class="absolute right-0 top-8 bottom-8 w-6 lg:w-8 overflow-hidden border-l border-[var(--line)] bg-[var(--bg)] pointer-events-none z-10" aria-hidden="true">
		<div class="strip-inner font-mono text-[8px] lg:text-[9px] uppercase tracking-[0.2em] whitespace-nowrap h-full leading-6" style="writing-mode: vertical-rl;">
			FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN — FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN —
		</div>
	</div>
{/if}
