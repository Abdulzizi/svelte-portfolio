<script lang="ts">
	// /work — two-plane deck (v2), data-driven.
	//  Plane 0: FEATURED RAIL (horizontal filmstrip on lg+ tall). Clicking a title
	//    develops a spec sheet (F) in place.
	//  Plane 1: THE REST (vertical index). Opening shows the same spec sheet.
	//  Every control is a real, clickable, keyboard-operable button: arrow keys,
	//  on-screen prev/next, and a plane switcher all drive the same state.
	//  One viewport, no scroll on lg+ tall; stacks + scrolls below.
	import { tick } from 'svelte';
	import { useWide } from '$lib/wide.svelte';
import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const wideState = useWide();
	const wide = $derived(wideState.current);

	let plane = $state(0); // 0 = featured rail, 1 = the rest
	let feat = $state(0); // which featured card is centred
	let openId = $state<string | null>(null); // which spec sheet is developed (one at a time)

	const featured = $derived(data.featured);
	const rest = $derived(data.rest);
	const hasRest = $derived(rest.length > 0);
	const hasFeatured = $derived(featured.length > 0);
	const multiFeatured = $derived(featured.length > 1);
	// Clamp centred index so a stale/large feat never points past the list.
	const safeFeat = $derived(Math.min(feat, Math.max(0, featured.length - 1)));

	function toggle(id: string) {
		openId = openId === id ? null : id;
	}

	function goFeat(next: number) {
		const max = featured.length - 1;
		feat = Math.max(0, Math.min(max, next));
		openId = null;
	}

	async function switchPlane(p: 0 | 1) {
		if (p === plane) return;
		if (p === 1 && !hasRest) return;
		if (p === 0 && !hasFeatured) return;
		plane = p;
		openId = null;
		// Move focus into the newly shown plane so keyboard users land there.
		await tick();
		document.getElementById(p === 0 ? 'plane-featured' : 'plane-rest')?.focus();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			openId = null;
			return;
		}
		// Arrow-key deck nav only on the one-viewport layout, and never while typing.
		if (!wide) return;
		const t = e.target as HTMLElement | null;
		if (t && t.matches('input, textarea, select')) return;

		if (plane === 0) {
			if (e.key === 'ArrowRight' && feat < featured.length - 1) { e.preventDefault(); goFeat(feat + 1); }
			else if (e.key === 'ArrowLeft' && feat > 0) { e.preventDefault(); goFeat(feat - 1); }
			else if (e.key === 'ArrowDown' && hasRest) { e.preventDefault(); switchPlane(1); }
		} else if (plane === 1 && e.key === 'ArrowUp') {
			e.preventDefault();
			switchPlane(0);
		}
	}
</script>

<svelte:head>
	<title>Work | Abdul Jawad Azizi</title>
	<meta name="description" content="Selected work by Abdul Jawad Azizi — platforms shipped, as spec sheets. The problem, the stack, the result." />
</svelte:head>

<svelte:window {onkeydown} />

<main id="main-content" class="page relative text-[var(--ink)]" style="--feat: {safeFeat}; --plane: {plane}; --n: {Math.max(featured.length, 1)}">
	<a href="/" class="back font-hand font-extrabold">Back</a>
	<h1 class="sr-only">Work</h1>

	{#if data.loadError}
		<p class="empty font-mono">Couldn't load work right now. Try again shortly.</p>
	{:else if !hasFeatured && !hasRest}
		<p class="empty font-mono">No projects yet.</p>
	{:else}
		<!-- Plane switcher: visible, functional on every viewport. -->
		{#if hasFeatured && hasRest}
			<div class="switch font-mono" role="tablist" aria-label="Work sections">
				<button type="button" role="tab" aria-selected={plane === 0} class="switch-btn" class:on={plane === 0} onclick={() => switchPlane(0)}>Featured</button>
				<button type="button" role="tab" aria-selected={plane === 1} class="switch-btn" class:on={plane === 1} onclick={() => switchPlane(1)}>The rest</button>
			</div>
		{/if}

		<div class="deck" data-plane={plane}>
			<!-- PLANE 0 — FEATURED RAIL -->
			{#if hasFeatured}
				<section id="plane-featured" class="plane rail" tabindex="-1" aria-label="Featured work" inert={wide && plane !== 0}>
					<div class="rail-track" data-reveal-stacked-children use:reveal>
						{#each featured as p, i (p.id)}
							{@const isOpen = openId === p.id}
							<article class="card" class:active={i === safeFeat} class:open={isOpen} inert={wide && i !== safeFeat}>
								<button
									type="button"
									class="bar"
									aria-expanded={isOpen}
									aria-controls={`sheet-${p.id}`}
									onclick={() => toggle(p.id)}
								>
									<span class="title font-hand font-extrabold">{p.title}</span>
								</button>

								{@render sheet(p, isOpen)}
							</article>
						{/each}
					</div>

					{#if multiFeatured}
						<div class="rail-nav">
							<button type="button" class="nav-btn font-mono" aria-label="Previous project" disabled={feat === 0} onclick={() => goFeat(feat - 1)}>←</button>
							<span class="count font-mono" aria-live="polite">{String(feat + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}</span>
							<button type="button" class="nav-btn font-mono" aria-label="Next project" disabled={feat === featured.length - 1} onclick={() => goFeat(feat + 1)}>→</button>
						</div>
					{/if}

					{#if hasRest}
						<button type="button" class="jump font-mono" onclick={() => switchPlane(1)}>The rest ↓</button>
					{/if}
				</section>
			{/if}

			<!-- PLANE 1 — THE REST -->
			{#if hasRest}
				<section id="plane-rest" class="plane rest" tabindex="-1" aria-label="More work" inert={wide && plane !== 1}>
					<div class="rest-head">
						<h2 class="font-hand font-extrabold">The rest</h2>
						{#if hasFeatured}
							<button type="button" class="jump font-mono" onclick={() => switchPlane(0)}>↑ Featured</button>
						{/if}
					</div>
					<ul class="rest-list" data-reveal-stacked-children use:reveal>
						{#each rest as p (p.id)}
							{@const isOpen = openId === p.id}
							<li class="rest-row" class:open={isOpen}>
								<button
									type="button"
									class="rest-bar"
									aria-expanded={isOpen}
									aria-controls={`sheet-${p.id}`}
									onclick={() => toggle(p.id)}
								>
									<span class="rest-title font-hand font-extrabold">{p.title}</span>
									<span class="rest-year font-mono">{p.year}</span>
								</button>
								{@render sheet(p, isOpen)}
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>
	{/if}
</main>

<!-- Shared spec sheet (F). Identical reveal in both planes. -->
{#snippet sheet(p: PageData['featured'][number], isOpen: boolean)}
	<div id={`sheet-${p.id}`} class="sheet" hidden={!isOpen}>
		<div class="sheet-inner">
			<dl class="spec font-mono">
				<div class="spec-row"><dt>Role</dt><dd>{p.role}</dd></div>
				<div class="spec-row"><dt>Year</dt><dd>{p.year}</dd></div>
				<div class="spec-row"><dt>Stack</dt><dd>{p.stack.join(' · ')}</dd></div>
				<div class="spec-row"><dt>Impact</dt><dd class="impact">{p.impact}</dd></div>
			</dl>
			<div class="prose">
				{#if p.imagePath}
					<img class="shot" src={p.imagePath} alt={`${p.title} screenshot`} loading="lazy" />
				{/if}
				<p class="problem">{p.problem}</p>
				<p class="result"><span class="arrow font-mono" aria-hidden="true">→</span><span>{p.result}</span></p>
				{#if p.body}
					<!-- Sanitized server-side (sanitize.ts) before storage. -->
					<div class="body">{@html p.body}</div>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

<style>
	/* Wrapper mirrors SlidePage (/connect, /about): uniform 2.25rem gutters that
	   clear the marquee frame, safe-area only ever ADDS to that floor. */
	.page { padding: 4.5rem 2.25rem 4rem; min-height: 100dvh; padding-left: max(2.25rem, env(safe-area-inset-left)); padding-right: max(2.25rem, env(safe-area-inset-right)); padding-bottom: max(4rem, env(safe-area-inset-bottom)); }
	/* Above the fixed marquee bars (z-10) and clear of the ~2rem rails. */
	.back { position: absolute; top: 3rem; left: 2.5rem; z-index: 20; padding: 0.25rem 0; animation: rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
	.empty { margin-top: 6rem; color: var(--ink-dim); letter-spacing: 0.15em; text-transform: uppercase; }

	/* Plane switcher (tabs) */
	/* Plane switcher (tabs) — deck-only; on mobile both planes stack and scroll. */
	.switch { display: none; gap: 0; margin: 2.5rem auto 0; border: 1px solid var(--line); width: max-content; }
	.switch-btn {
		background: none; border: none; color: var(--ink-dim); cursor: pointer;
		font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase;
		padding: 0.6rem 1.1rem; min-height: 44px; transition: color 0.2s ease, background-color 0.2s ease;
	}
	.switch-btn + .switch-btn { border-left: 1px solid var(--line); }
	.switch-btn.on { color: var(--bg); background: var(--accent); }
	.switch-btn:not(.on):hover { color: var(--ink); }
	.switch-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

	/* Deck (stacked + scroll on small; transform-driven one-viewport on lg+ tall) */
	.deck { margin: 2rem auto 0; width: 100%; max-width: 78rem; display: flex; flex-direction: column; gap: 3.5rem; }
	.plane:focus-visible { outline: none; }
	.rail-track { display: flex; flex-direction: column; }

	/* Cards / rail rows */
	.card { border-bottom: 1px solid var(--line); }
	.card:first-child { border-top: 1px solid var(--line); }

	.bar {
		position: relative; display: flex; align-items: center; gap: 1.25rem;
		width: 100%; padding: 0.75rem 0; min-height: 56px;
		background: none; border: none; color: inherit; text-align: left; cursor: pointer;
	}
	.bar:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }

	.title { font-size: clamp(1.9rem, 7vw, 5rem); line-height: 1; text-transform: uppercase; letter-spacing: -0.02em; transition: color 0.35s ease; overflow-wrap: anywhere; }
	.card.open .title { color: var(--accent); }
	@media (hover: hover) and (pointer: fine) { .bar:hover .title { color: var(--accent); } }

	/* Spec sheet (F) */
	.sheet { overflow: hidden; }
	.sheet-inner {
		display: grid; grid-template-columns: 1fr; gap: 1.25rem;
		padding: 0.5rem 0 1.75rem 0;
		animation: develop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	.spec { display: flex; flex-direction: column; max-width: 26rem; width: 100%; }
	.spec-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.55rem 0; border-bottom: 1px dashed var(--line); font-size: 0.8rem; letter-spacing: 0.08em; }
	.spec dt { color: var(--ink-dim); text-transform: uppercase; flex: 0 0 auto; }
	.spec dd { text-align: right; min-width: 0; overflow-wrap: anywhere; }
	.spec .impact { color: var(--accent); }
	.prose { max-width: 42rem; }
	.shot { display: block; width: 100%; max-width: 32rem; aspect-ratio: 16 / 9; height: auto; object-fit: cover; border: 1px solid var(--line); margin-bottom: 1rem; }
	.problem { color: var(--ink-dim); line-height: 1.5; }
	.result { margin-top: 0.5rem; display: flex; gap: 0.6rem; line-height: 1.5; }
	.arrow { color: var(--accent); flex: 0 0 auto; }
	.body { margin-top: 1rem; color: var(--ink-dim); line-height: 1.6; }
	.body :global(a) { color: var(--accent); text-decoration: underline; }
	.body :global(h2), .body :global(h3) { color: var(--ink); font-family: var(--font-hand); font-weight: 800; margin: 0.75rem 0 0.25rem; }
	.body :global(ul), .body :global(ol) { margin: 0.5rem 0 0.5rem 1.25rem; }
	.body :global(img) { display: block; max-width: 100%; height: auto; border: 1px solid var(--line); margin: 1rem 0; }

	@media (min-width: 768px) {
		.sheet-inner { grid-template-columns: 26rem 1fr; gap: 3rem; align-items: start; }
	}

	/* The rest plane */
	.rest-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem; }
	.rest-head h2 { font-size: clamp(1.5rem, 4vw, 2.25rem); text-transform: uppercase; }
	.rest-list { display: flex; flex-direction: column; }
	.rest-row { border-bottom: 1px solid var(--line); }
	.rest-row:first-child { border-top: 1px solid var(--line); }
	.rest-bar {
		display: flex; align-items: baseline; justify-content: space-between; gap: 1rem;
		width: 100%; padding: 1rem 0; min-height: 56px; background: none; border: none; color: inherit; text-align: left; cursor: pointer;
	}
	.rest-bar:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }
	.rest-title { font-size: clamp(1.4rem, 4vw, 2.5rem); text-transform: uppercase; letter-spacing: -0.01em; transition: color 0.35s ease; }
	@media (hover: hover) and (pointer: fine) { .rest-bar:hover .rest-title { color: var(--accent); } }
	.rest-row.open .rest-title { color: var(--accent); }
	.rest-year { flex: 0 0 auto; font-size: 0.7rem; letter-spacing: 0.15em; color: var(--ink-dim); }

	/* Rail nav: real prev/next buttons (click + keyboard + touch all work) */
	/* Rail prev/next only makes sense on the horizontal deck; on mobile all
	   featured cards stack and are directly visible, so hide it there. */
	.rail-nav { display: none; align-items: center; gap: 0.5rem; margin-top: 1.25rem; }
	.nav-btn {
		display: inline-flex; align-items: center; justify-content: center;
		width: 44px; height: 44px; background: none; border: 1px solid var(--line);
		color: var(--ink-dim); cursor: pointer; font-size: 1rem;
		transition: color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
	}
	.nav-btn:active:not(:disabled) { transform: scale(0.97); }
	.nav-btn:hover:not(:disabled) { color: var(--accent); border-color: var(--accent); }
	.nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
	.nav-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.count { font-size: 0.7rem; letter-spacing: 0.2em; color: var(--ink-dim); padding: 0 0.5rem; }

	/* Jump buttons between planes — deck-only (mobile just scrolls). */
	.jump {
		display: none;
		margin-top: 1.5rem; align-self: flex-start; background: none; border: 1px solid var(--line);
		color: var(--ink-dim); padding: 0.5rem 1rem; min-height: 44px; font-size: 0.7rem; letter-spacing: 0.2em;
		text-transform: uppercase; cursor: pointer; transition: color 0.2s ease, border-color 0.2s ease;
	}
	.rest-head .jump { margin-top: 0; }
	.jump:hover { color: var(--accent); border-color: var(--accent); }
	.jump:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

	/* === One-viewport deck: lg+ tall === */
	@media (min-width: 1024px) and (min-height: 640px) {
		.page { height: 100dvh; min-height: 0; overflow: hidden; padding: 3rem max(2.5rem, env(safe-area-inset-right)) 3rem max(2.5rem, env(safe-area-inset-left)); }
		.back { top: 3rem; left: 2.5rem; }
		/* Deck-only controls become visible here. */
		.switch { display: inline-flex; position: absolute; top: 3rem; right: 3.5rem; max-width: calc(100% - 7rem); margin: 0; }
		.rail-nav { display: flex; }
		.jump { display: inline-block; }

		.deck {
			margin: 0; height: 100%; gap: 0; flex-direction: column;
			transform: translateY(calc(var(--plane) * -100%));
			transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
		}
		.plane { flex: 0 0 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }

		.rail-track {
			flex-direction: row; flex: 0 0 auto; width: calc(var(--n) * 100%);
			transform: translateX(calc(var(--feat) * -100% / var(--n)));
			transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
		}
		.card { flex: 0 0 calc(100% / var(--n)); border: none; display: flex; flex-direction: column; justify-content: center; padding-right: 3rem; }
		.card:first-child { border: none; }
		.card:not(.active) { opacity: 0.2; transition: opacity 0.4s ease; }

		.rest { overflow-y: auto; }
	}

	@keyframes rise { from { opacity: 0; transform: translateY(1rem); } to { opacity: 1; transform: none; } }
	@keyframes develop { from { opacity: 0; transform: translateY(0.75rem); } to { opacity: 1; transform: none; } }

	@media (prefers-reduced-motion: reduce) {
		.back, .sheet-inner { animation: none; }
		.deck, .rail-track, .card, .nav-btn, .jump, .switch-btn { transition: none; }
	}
</style>
