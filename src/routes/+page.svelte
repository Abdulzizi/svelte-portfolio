<script lang="ts">
</script>

<main class="min-h-[100dvh] overflow-y-auto lg:overflow-hidden bg-transparent text-[var(--ink)] relative">
	<style>
		.grid-wrap { display: flex; flex-wrap: wrap; }
		.grid-section { min-width: 0; flex: 1 1 50%; transition: flex 0.45s ease, background-color 0.35s ease; min-height: 50vh; }
		.grid-wrap:hover .grid-section:not(:hover) { flex: 0.7 1 35%; opacity: 0.7; }
		.grid-section:hover { flex: 1.6 1 60%; z-index: 5; background-color: var(--surface); }

		@media (max-width: 1023px) {
			.grid-section { flex: 1 1 100%; }
			.grid-wrap:hover .grid-section:not(:hover) { flex: 1 1 100%; opacity: 1; }
			.grid-section:hover { flex: 1 1 100%; }
		}
	</style>

	<div class="grid-wrap min-h-[100dvh] z-0">
		<a href="#work" id="work" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-6 lg:p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand font-extrabold tracking-tight" style="font-size: clamp(2.5rem, 7vw, 5.5rem); line-height: 1;">WORK</h2>
		</a>
		<a href="#connect" id="connect" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-6 lg:p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand font-extrabold tracking-tight" style="font-size: clamp(2.5rem, 7vw, 5.5rem); line-height: 1;">CONNECT</h2>
		</a>
		<a href="#about" id="about" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-6 lg:p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand font-extrabold tracking-tight" style="font-size: clamp(2.5rem, 7vw, 5.5rem); line-height: 1;">ABOUT</h2>
		</a>
		<a href="#blog" id="blog" class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-6 lg:p-12 hover:bg-[var(--surface)]">
			<h2 class="font-hand font-extrabold tracking-tight" style="font-size: clamp(2.5rem, 7vw, 5.5rem); line-height: 1;">BLOG</h2>
		</a>
	</div>
</main>
