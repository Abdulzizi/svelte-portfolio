<script lang="ts">
</script>

<main class="min-h-[100dvh] overflow-y-auto lg:overflow-hidden bg-[var(--bg)] text-[var(--ink)] relative">
	<style>
		.grid-wrap { display: flex; flex-wrap: wrap; }
		.grid-section { min-width: 0; flex: 1 1 50%; transition: flex 0.45s ease, background-color 0.35s ease; min-height: 50vh; }
		.grid-wrap:hover .grid-section:not(:hover) { flex: 0.7 1 35%; opacity: 0.7; }
		.grid-section:hover { flex: 1.6 1 60%; z-index: 5; background-color: rgba(123, 216, 143, 0.15); }

		@media (max-width: 1023px) {
			.grid-section { flex: 1 1 100%; }
			.grid-wrap:hover .grid-section:not(:hover) { flex: 1 1 100%; opacity: 1; }
			.grid-section:hover { flex: 1 1 100%; }
		}
	</style>

	<!-- Top marquee -->
	<div class="absolute top-0 left-0 right-0 overflow-hidden bg-[var(--bg)] h-8 z-10" aria-hidden="true">
		<div class="inline-block font-mono text-[10px] uppercase tracking-[0.2em] h-full leading-8 whitespace-nowrap animate-scroll-left" style="color: var(--ink-dim); animation: scroll-left 20s linear infinite;">
			FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN — FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN —
		</div>
	</div>

	<style>
		@keyframes scroll-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
		@keyframes scroll-up { from { transform: translateY(0); } to { transform: translateY(-50%); } }
	</style>

	<!-- Left vertical -->
	<div class="absolute left-0 top-8 bottom-8 w-6 lg:w-8 overflow-hidden border-r border-[var(--line)] bg-[var(--bg)] pointer-events-none z-10" aria-hidden="true">
		<div class="font-mono text-[8px] lg:text-[9px] uppercase tracking-[0.2em] whitespace-nowrap h-full leading-6 animate-scroll-up" style="color: var(--ink-dim); animation: scroll-up 15s linear infinite; writing-mode: vertical-rl; transform: rotate(180deg);">
			FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN — FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN —
		</div>
	</div>

	<!-- Right vertical -->
	<div class="absolute right-0 top-8 bottom-8 w-6 lg:w-8 overflow-hidden border-l border-[var(--line)] bg-[var(--bg)] pointer-events-none z-10" aria-hidden="true">
		<div class="font-mono text-[8px] lg:text-[9px] uppercase tracking-[0.2em] whitespace-nowrap h-full leading-6 animate-scroll-up" style="color: var(--ink-dim); animation: scroll-up 15s linear infinite; writing-mode: vertical-rl;">
			FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN — FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN —
		</div>
	</div>

	<div class="grid-wrap min-h-[100dvh] z-0">
		<a href="#work" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-6 lg:p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand tracking-tighter" style="font-size: clamp(2rem, 6vw, 4.5rem); line-height: 1;">WORK</h2>
		</a>
		<a href="#connect" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-6 lg:p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand tracking-tighter" style="font-size: clamp(2rem, 6vw, 4.5rem); line-height: 1;">CONNECT</h2>
		</a>
		<a href="#about" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-6 lg:p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand tracking-tighter" style="font-size: clamp(2rem, 6vw, 4.5rem); line-height: 1;">ABOUT</h2>
		</a>
		<a href="#work" id="work" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-6 lg:p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand tracking-tighter" style="font-size: clamp(2rem, 6vw, 4.5rem); line-height: 1;">COMUNITY</h2>
		</a>
	</div>

	<!-- Bottom marquee -->
	<div class="absolute bottom-0 left-0 right-0 overflow-hidden bg-[var(--bg)] h-8 z-10" aria-hidden="true">
		<div class="inline-block font-mono text-[10px] uppercase tracking-[0.2em] h-full leading-8 whitespace-nowrap animate-scroll-left" style="color: var(--ink-dim); animation: scroll-left 20s linear infinite;">
			FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN — FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN —
		</div>
	</div>
</main>
