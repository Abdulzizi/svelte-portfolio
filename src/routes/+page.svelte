<script lang="ts">
</script>

<main class="min-h-[100dvh] bg-[var(--bg)] text-[var(--ink)]">
	<style>
		.grid-wrap { display: flex; flex-wrap: wrap; }
		.grid-section { flex: 1 1 50%; transition: flex 0.45s ease; min-height: 50vh; }
		.grid-wrap:hover .grid-section:not(:hover) { flex: 0.7 1 35%; opacity: 0.7; }
		.grid-section:hover { flex: 1.6 1 60%; z-index: 10; }
	</style>

	<!-- Top marquee -->
	<div class="overflow-hidden border-b border-[var(--line)] bg-[var(--bg)] h-8 shrink-0" aria-hidden="true">
		<div class="inline-block font-mono text-[10px] uppercase tracking-[0.2em] h-full leading-8 whitespace-nowrap animate-scroll-left" style="color: var(--ink-dim); animation: scroll-left 20s linear infinite;">
			FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN — FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN —
		</div>
	</div>

	<style>
		@keyframes scroll-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
	</style>

	<div class="grid-wrap min-h-[100dvh]">
		<a href="#work" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand text-4xl md:text-6xl tracking-tighter">WORK</h2>
		</a>
		<a href="#connect" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand text-4xl md:text-6xl tracking-tighter">CONNECT</h2>
		</a>
		<a href="#about" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand text-4xl md:text-6xl tracking-tighter">ABOUT</h2>
		</a>
		<a href="#work" id="work" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand text-4xl md:text-6xl tracking-tighter">COMUNITY</h2>
		</a>
	</div>

	<!-- Bottom marquee -->
	<div class="overflow-hidden border-t border-[var(--line)] bg-[var(--bg)] h-8 shrink-0" aria-hidden="true">
		<div class="inline-block font-mono text-[10px] uppercase tracking-[0.2em] h-full leading-8 whitespace-nowrap animate-scroll-left" style="color: var(--ink-dim); animation: scroll-left 20s linear infinite;">
			FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN — FULL STACK DEVELOPER — AZIZI PORTFOLIO — CLEAN INTERFACES — TYPE DESIGN —
		</div>
	</div>
</main>
