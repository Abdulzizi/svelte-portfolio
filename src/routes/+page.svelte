<svelte:head>
	<title>Abdul Jawad Azizi — Full Stack Developer</title>
	<meta name="description" content="Abdul Jawad Azizi, full stack developer. Work, contact, about and blog." />
</svelte:head>

<main class="min-h-[100dvh] overflow-y-auto lg:overflow-hidden bg-transparent text-[var(--ink)] relative">
	<style>
		.grid-wrap { display: flex; flex-wrap: wrap; }
		.grid-section { min-width: 0; flex: 1 1 50%; transition: flex 0.45s ease, background-color 0.35s ease; min-height: 50vh; }
		.grid-wrap:has(.grid-section:is(:hover, :focus-visible)) .grid-section:not(:is(:hover, :focus-visible)) { flex: 0.7 1 35%; opacity: 0.7; }
		.grid-section:is(:hover, :focus-visible) { flex: 1.6 1 60%; z-index: 5; background-color: var(--surface); }
		.grid-section:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }
		.grid-title { font-size: clamp(1.5rem, 3.5vw, 3rem); line-height: 1; text-transform: uppercase; transition: color 0.35s ease; }
		.grid-section:is(:hover, :focus-visible) .grid-title { color: var(--accent); }

		@media (max-width: 1023px) {
			.grid-section { flex: 1 1 100%; }
			.grid-wrap:has(.grid-section:is(:hover, :focus-visible)) .grid-section:not(:is(:hover, :focus-visible)) { flex: 1 1 100%; opacity: 1; }
			.grid-section:is(:hover, :focus-visible) { flex: 1 1 100%; }
		}
	</style>

	<h1 class="sr-only">Abdul Jawad Azizi</h1>

	<div class="grid-wrap min-h-[100dvh] z-0">
		<!-- caveman: href="#x" id="x" are placeholders, no pages behind panels yet. Upgrade: real routes (/work etc.) when pages exist. -->
		{#each ['work', 'connect', 'about', 'blog'] as p}
			<a href="#{p}" id={p} class="grid-section relative flex items-center justify-center border-[1px] border-[var(--line)] p-6 lg:p-12">
				<h2 class="grid-title font-hand font-extrabold tracking-tight">{p}</h2>
			</a>
		{/each}
	</div>
</main>
