<script lang="ts">
	// Marquee-driven work index (G + F + D):
	//  G — project titles are giant Syne marquees that scroll as a passive attract-loop.
	//  D — clicking a row halts it, pulls it left, frames it with mono sprocket ticks, and
	//      "develops" the detail in like a film frame.
	//  F — what develops is a dense mono spec-sheet, not marketing prose.
	// Non-active rows keep scrolling. Click the open row again / Esc releases.
	type Project = {
		title: string;
		role: string;
		year: string;
		stack: string[];
		impact: string;
		problem: string;
		result: string;
	};

	const projects: Project[] = [
		{
			title: 'Freecause',
			role: 'Platform rebuild',
			year: '2026',
			stack: ['Go', 'Cloudflare', 'CI/CD'],
			impact: '19M users',
			problem: 'A 19M-user petition platform stuck on aging infrastructure.',
			result: 'Rebuilt from scratch: edge caching, versioned invalidation, hardened CI/CD.'
		},
		{
			title: 'Telkom Akses',
			role: 'Backend + UI owner',
			year: '2025',
			stack: ['Node.js', 'PostgreSQL', 'Microservices'],
			impact: '3 services',
			problem: 'A nationwide field workforce with no unified platform.',
			result: 'Own 3 backend services and the UI of the platform they run on.'
		},
		{
			title: 'Venturo',
			role: 'Full-stack',
			year: '2024',
			stack: ['Vue.js', 'Laravel', 'MySQL'],
			impact: '−30% admin work',
			problem: 'Admin work was manual, repetitive, slow.',
			result: 'Vue + Laravel admin dashboard that cut manual admin work by 30%.'
		},
		// caveman: dummy rows below — placeholder copy, swap for real projects. Remove before ship.
		{
			title: 'Project Four',
			role: 'Placeholder',
			year: '2023',
			stack: ['TypeScript', 'SvelteKit', 'Edge'],
			impact: 'dummy',
			problem: 'Placeholder problem statement for a sample project.',
			result: 'Placeholder result line describing what this sample project shipped.'
		},
		{
			title: 'Project Five',
			role: 'Placeholder',
			year: '2022',
			stack: ['Python', 'FastAPI', 'Redis'],
			impact: 'dummy',
			problem: 'Placeholder problem statement for another sample project.',
			result: 'Placeholder result line describing what this sample project shipped.'
		}
	];

	let open = $state<number | null>(null);

	function toggle(i: number) {
		open = open === i ? null : i;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open !== null) open = null;
	}
</script>

<svelte:head>
	<title>Work | Abdul Jawad Azizi</title>
	<meta name="description" content="Selected work by Abdul Jawad Azizi — platforms shipped, as spec sheets. The problem, the stack, the result." />
</svelte:head>

<svelte:window {onkeydown} />

<main class="page relative text-[var(--ink)]" class:has-open={open !== null}>
	<a href="/" class="back font-hand font-extrabold">Back</a>
	<h1 class="sr-only">Work</h1>

	<ul class="reel">
		{#each projects as p, i}
			{@const isOpen = open === i}
			<li class="row" class:open={isOpen} class:dim={open !== null && !isOpen}>
				<button
					type="button"
					class="bar"
					aria-expanded={isOpen}
					aria-controls={`sheet-${i}`}
					onclick={() => toggle(i)}
				>
					<!-- G: title scrolls as an attract-loop; halts (static, left-aligned) when open. -->
					<span class="scroller" class:running={!isOpen}>
						<span class="title font-hand font-extrabold">{p.title}</span>
						<span class="title font-hand font-extrabold" aria-hidden="true">{p.title}</span>
						<span class="title font-hand font-extrabold" aria-hidden="true">{p.title}</span>
						<span class="title font-hand font-extrabold" aria-hidden="true">{p.title}</span>
					</span>

					<!-- D: sprocket ticks frame the halted frame. -->
					<span class="sprockets" aria-hidden="true">
						{#each Array(8) as _, s (s)}<span class="hole"></span>{/each}
					</span>
				</button>

				<!-- F: the spec sheet that develops in. -->
				<div id={`sheet-${i}`} class="sheet" hidden={!isOpen}>
					<div class="sheet-inner">
						<dl class="spec font-mono">
							<div class="spec-row"><dt>Role</dt><dd>{p.role}</dd></div>
							<div class="spec-row"><dt>Year</dt><dd>{p.year}</dd></div>
							<div class="spec-row"><dt>Stack</dt><dd>{p.stack.join(' · ')}</dd></div>
							<div class="spec-row"><dt>Impact</dt><dd class="impact">{p.impact}</dd></div>
						</dl>
						<div class="prose">
							<p class="problem">{p.problem}</p>
							<p class="result"><span class="arrow font-mono" aria-hidden="true">→</span>{p.result}</p>
						</div>
					</div>
				</div>
			</li>
		{/each}
	</ul>
</main>

<style>
	.page { padding: 4.5rem 2.25rem 4rem; min-height: 100dvh; }
	.back { position: absolute; top: 2.75rem; left: 2.25rem; z-index: 2; animation: rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }

	.reel { margin: 3.5rem auto 0; width: 100%; max-width: 78rem; display: flex; flex-direction: column; }

	.row { border-bottom: 1px solid var(--line); transition: opacity 0.35s ease; }
	.row:first-child { border-top: 1px solid var(--line); }
	.row.dim { opacity: 0.4; }

	/* The clickable title bar. */
	.bar {
		position: relative; display: flex; align-items: center; gap: 1.25rem;
		width: 100%; padding: 0.4rem 0; overflow: hidden;
		background: none; border: none; color: inherit; text-align: left; cursor: pointer;
	}
	.bar:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }

	/* G — scrolling title. The row of repeated titles slides left forever; paused when open. */
	.scroller {
		flex: 1 1 auto; display: inline-flex; gap: 2.5rem; min-width: 0; white-space: nowrap;
		padding-left: 0;
	}
	.scroller.running {
		width: max-content;
		animation: reel-scroll 18s linear infinite;
	}
	.title {
		font-size: clamp(2.25rem, 7vw, 5rem); line-height: 1; text-transform: uppercase;
		letter-spacing: -0.02em; transition: color 0.35s ease;
	}
	/* Halted (open): only the first title shows, left-aligned, accented. */
	.row.open .scroller { animation: none; }
	.row.open .scroller .title:not(:first-child) { display: none; }
	.row.open .title { color: var(--accent); }
	.bar:hover .title { color: var(--accent); }

	/* D — sprocket ticks fade in on the open frame's right edge. */
	.sprockets {
		position: absolute; right: 0; top: 0; bottom: 0; display: none;
		flex-direction: column; justify-content: space-around; padding: 0.35rem 0;
		opacity: 0; transition: opacity 0.35s ease;
	}
	.hole { width: 0.5rem; height: 0.5rem; border: 1px solid var(--ink-dim); }
	.row.open .sprockets { display: flex; opacity: 0.6; }

	/* F — spec sheet. Base: simple reveal. */
	.sheet { overflow: hidden; }
	.sheet-inner {
		display: grid; grid-template-columns: 1fr; gap: 1.5rem;
		padding: 0.5rem 0 1.75rem 0;
		animation: develop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	.spec { display: flex; flex-direction: column; max-width: 26rem; }
	.spec-row {
		display: flex; justify-content: space-between; gap: 1rem;
		padding: 0.5rem 0; border-bottom: 1px dashed var(--line);
		font-size: 0.8rem; letter-spacing: 0.1em;
	}
	.spec dt { color: var(--ink-dim); text-transform: uppercase; }
	.spec dd { text-align: right; }
	.spec .impact { color: var(--accent); }
	.prose { max-width: 40rem; }
	.problem { color: var(--ink-dim); }
	.result { margin-top: 0.5rem; display: flex; gap: 0.6rem; }
	.arrow { color: var(--accent); }

	@media (min-width: 768px) {
		.sheet-inner { grid-template-columns: 26rem 1fr; gap: 3rem; align-items: start; }
	}

	@keyframes rise {
		from { opacity: 0; transform: translateY(1rem); }
		to { opacity: 1; transform: none; }
	}
	/* D — the frame "develops": fade + slight rise, as if an image appearing on paper. */
	@keyframes develop {
		from { opacity: 0; transform: translateY(0.75rem); }
		to { opacity: 1; transform: none; }
	}
	@keyframes reel-scroll {
		from { transform: translateX(0); }
		/* four copies: shifting by 25% loops seamlessly. */
		to { transform: translateX(-25%); }
	}

	@media (prefers-reduced-motion: reduce) {
		.back, .sheet-inner { animation: none; }
		.scroller.running { animation: none; width: auto; }
		/* Static list: show one title, no scroll. */
		.scroller .title:not(:first-child) { display: none; }
		.row { transition: none; }
	}
</style>
