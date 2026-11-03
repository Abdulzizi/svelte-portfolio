<svelte:head>
	<title>Abdul Jawad Azizi — Full Stack Developer</title>
	<meta name="description" content="Abdul Jawad Azizi, full stack developer. Work, contact, about and blog." />
</svelte:head>

<main class="min-h-[100dvh] overflow-y-auto lg:overflow-hidden bg-transparent text-[var(--ink)] relative">
	<h1 class="sr-only">Abdul Jawad Azizi</h1>

	<div class="grid-wrap min-h-[100dvh] z-0">
		<!-- caveman: #blog is a placeholder anchor; /work /connect /about are real routes. Upgrade: real /blog route when the page exists. -->
		{#each ['work', 'connect', 'about', 'blog'] as p, i}
			<a href={p === 'connect' ? '/connect' : p === 'about' ? '/about' : p === 'work' ? '/work' : `#${p}`} id={p} class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-6 lg:p-12" style="--d: {i * 70}ms">
				<h2 class="grid-title font-hand font-extrabold tracking-tight">{p}</h2>
			</a>
		{/each}
	</div>
</main>

<style>
	.grid-wrap { display: flex; flex-wrap: wrap; }
	.grid-section { min-width: 0; flex: 1 1 50%; transition: flex 0.45s ease, background-color 0.35s ease; min-height: 50vh; }
	/* Entrance: staggered rise+fade on load. transform/opacity only, --d per panel. */
	.grid-section { animation: panel-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: var(--d, 0ms); }
	.grid-wrap:has(.grid-section:focus-visible) .grid-section:not(:focus-visible) { flex: 0.7 1 35%; opacity: 0.7; }
	.grid-section:focus-visible { flex: 1.6 1 60%; z-index: 5; background-color: var(--surface); outline: 2px solid var(--accent); outline-offset: -4px; }
	.grid-title { font-size: clamp(1.5rem, 3.5vw, 3rem); line-height: 1; text-transform: uppercase; transition: color 0.35s ease; position: relative; }
	/* Signature detail: accent underline grows from the left on hover/focus. */
	.grid-title::after {
		content: ""; position: absolute; left: 0; bottom: -0.15em; height: 2px; width: 100%;
		background: var(--accent); transform: scaleX(0); transform-origin: left;
		transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.grid-section:focus-visible .grid-title { color: var(--accent); }
	.grid-section:focus-visible .grid-title::after { transform: scaleX(1); }

	@keyframes panel-in {
		from { opacity: 0; transform: translateY(1.25rem); }
		to { opacity: 1; transform: none; }
	}

	/* caveman: hover only on real-hover devices; touch >=1024px no sticky hover. */
	@media (hover: hover) {
		.grid-wrap:has(.grid-section:hover) .grid-section:not(:hover) { flex: 0.7 1 35%; opacity: 0.7; }
		.grid-section:hover { flex: 1.6 1 60%; z-index: 5; background-color: var(--surface); }
		.grid-section:hover .grid-title { color: var(--accent); }
		.grid-section:hover .grid-title::after { transform: scaleX(1); }
	}

	/* Must stay last: same specificity as rules above, wins by order. */
	@media (max-width: 1023px) {
		.grid-section { flex: 1 1 100%; }
		.grid-wrap:has(.grid-section:is(:hover, :focus-visible)) .grid-section:not(:is(:hover, :focus-visible)) { flex: 1 1 100%; opacity: 1; }
		.grid-section:is(:hover, :focus-visible) { flex: 1 1 100%; }
	}
</style>
