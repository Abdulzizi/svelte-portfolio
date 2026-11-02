<script lang="ts">
	import { tick } from 'svelte';
	import SlideArrow from '$lib/components/SlideArrow.svelte';

	// caveman: one media query decides "one viewport" slides vs stacked scroll. Mirrors /connect. Upgrade: container query.
	let index = $state(0);
	let wide = $state(false);

	const SLIDES = 3;
	const words = ['Build', 'Ship', 'Stack'];

	$effect(() => {
		const mq = matchMedia('(min-width: 1024px) and (min-height: 640px)');
		const sync = () => (wide = mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	const headings = ['who-heading', 'work-heading', 'stack-heading'];

	async function focusSlide(i: number) {
		await tick();
		document.getElementById(headings[i])?.focus();
	}

	async function onkeydown(e: KeyboardEvent) {
		if (!wide) return;
		const t = e.target as HTMLElement;
		if (t.matches('input, textarea, a, button')) return;
		if (e.key === 'ArrowRight' && index < SLIDES - 1) {
			index += 1;
			await focusSlide(index);
		}
		if (e.key === 'ArrowLeft' && index > 0) {
			index -= 1;
			await focusSlide(index);
		}
	}

	// Bare arrow: advance with wrap 0->1->2->0.
	function onclick() {
		index = (index + 1) % SLIDES;
	}

	const roles = [
		{ at: 'Telkom Akses', when: 'Jul 2025 — now', line: 'Own 3 backend services and the UI of a nationwide workforce platform.' },
		{ at: 'Freecause', when: 'Jan 2026 — now', line: 'Rebuilding a 19M-user petition platform from scratch. Edge caching, versioned invalidation, hardened CI/CD.' },
		{ at: 'Venturo', when: 'Nov 2024 — Apr 2025', line: 'Vue + Laravel admin dashboard that cut manual admin work by 30%.' }
	];

	const stack = [
		{ group: 'Languages', items: ['PHP', 'JavaScript', 'TypeScript', 'Python', 'Go'] },
		{ group: 'Frontend', items: ['Vue.js', 'Next.js', 'React'] },
		{ group: 'Backend', items: ['Laravel', 'Node.js', 'Express', 'REST', 'Microservices'] },
		{ group: 'Data', items: ['PostgreSQL', 'MySQL', 'MongoDB'] },
		{ group: 'DevOps', items: ['Docker', 'GitHub Actions', 'Deployer 8', 'Cloudflare', 'CI/CD'] }
	];
</script>

<svelte:head>
	<title>About | Abdul Jawad Azizi</title>
	<meta name="description" content="Abdul Jawad Azizi, full-stack engineer in Jakarta. What he builds, where he ships, and the stack he works in." />
</svelte:head>

<svelte:window {onkeydown} />

<main class="page relative text-[var(--ink)]" style="--i: {index}">
	<a href="/" class="back font-hand font-extrabold">Back</a>

	<!-- Signature device: one giant Syne word per slide, cross-fades + rises on change. -->
	<div class="ghost" aria-hidden="true">
		{#key index}
			<span class="ghost-word font-hand font-extrabold">{words[index]}</span>
		{/key}
	</div>

	<div class="viewport">
		<div class="track">
			<!-- 01 — WHO -->
			<section class="slide" aria-label="Who" inert={wide && index !== 0}>
				<div class="mx-auto w-full max-w-lg">
					<span class="idx font-mono">01</span>
					<h1 id="who-heading" tabindex="-1" class="font-hand text-4xl font-extrabold leading-[0.95] sm:text-5xl">
						I ship whole <span class="text-[var(--accent)]">products</span>.
					</h1>
					<p class="mt-5 text-lg text-[var(--ink-dim)]">UI to database to deploy. Full-stack, Jakarta.</p>
					<p class="mt-3 text-[var(--ink-dim)]">
						Often stronger across the stack than a specialist is in any single layer.
					</p>
					<a class="resume font-hand font-extrabold" href="/abdul-jawad-azizi-cv.pdf" target="_blank" rel="noopener noreferrer">
						Résumé
						<!-- Phosphor arrow-up-right (MIT): opens externally. -->
						<svg viewBox="0 0 256 256" width="18" height="18" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<line x1="64" y1="192" x2="192" y2="64" />
							<polyline points="96 64 192 64 192 160" />
						</svg>
					</a>
				</div>
			</section>

			<!-- 02 — WORK -->
			<section class="slide" aria-label="Work" inert={wide && index !== 1}>
				<div class="mx-auto w-full max-w-lg">
					<span class="idx font-mono">02</span>
					<h2 id="work-heading" tabindex="-1" class="font-hand text-4xl font-extrabold leading-none sm:text-5xl">Where I <span class="text-[var(--accent)]">ship</span></h2>
					<ul class="mt-7 flex flex-col">
						{#each roles as r}
							<li class="role border-b border-[var(--line)] py-4 first:border-t">
								<div class="flex items-baseline justify-between gap-4">
									<span class="font-hand text-xl font-extrabold">{r.at}</span>
									<span class="shrink-0 font-mono text-xs text-[var(--ink-dim)]">{r.when}</span>
								</div>
								<p class="mt-1.5 text-sm text-[var(--ink-dim)]">{r.line}</p>
							</li>
						{/each}
					</ul>
				</div>
			</section>

			<!-- 03 — STACK -->
			<section class="slide" aria-label="Stack" inert={wide && index !== 2}>
				<div class="mx-auto w-full max-w-lg">
					<span class="idx font-mono">03</span>
					<h2 id="stack-heading" tabindex="-1" class="font-hand text-4xl font-extrabold leading-none sm:text-5xl">The <span class="text-[var(--accent)]">stack</span></h2>
					<dl class="mt-7 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
						{#each stack as s}
							<div>
								<dt class="font-mono text-xs uppercase tracking-wider text-[var(--ink-dim)]">{s.group}</dt>
								<dd class="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-hand font-extrabold">
									{#each s.items as it}<span>{it}</span>{/each}
								</dd>
							</div>
						{/each}
					</dl>
				</div>
			</section>
		</div>
	</div>

	<SlideArrow label="Next section" {onclick} />
</main>

<style>
	/* Base (small / short screens): stacked, normal page scroll, clear of the marquee bars. */
	.page { padding: 4.5rem 2.25rem 4rem; min-height: 100dvh; }
	.back { position: absolute; top: 2.75rem; left: 2.25rem; z-index: 2; }
	.track { display: flex; flex-direction: column; gap: 4rem; }
	.ghost { display: none; }

	.idx { display: block; font-size: 0.75rem; letter-spacing: 0.2em; color: var(--accent); }
	.role { transition: opacity 0.2s ease; }

	.resume {
		display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 2rem;
		border: 1px solid var(--ink); padding: 0.5rem 1.1rem;
		transition: background-color 0.2s ease, color 0.2s ease;
	}
	.resume svg { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
	.resume:hover { background: var(--ink); color: var(--bg); }
	.resume:hover svg { transform: translate(2px, -2px); }

	/* Entrance: content fades up on load. transform/opacity only. */
	.back { animation: rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
	.slide > div { animation: rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: 80ms; }

	@keyframes rise {
		from { opacity: 0; transform: translateY(1rem); }
		to { opacity: 1; transform: none; }
	}

	:where(a):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

	/* One viewport, no scroll, sideways slides (3 wide). */
	@media (min-width: 1024px) and (min-height: 640px) {
		.page { height: 100dvh; min-height: 0; overflow: hidden; padding: 3rem 2.5rem; }
		.back { top: 3rem; left: 2.5rem; }
		.viewport { height: 100%; overflow: hidden; }
		.track {
			flex-direction: row; gap: 0; width: 300%; height: 100%;
			transform: translateX(calc(var(--i) * -33.3333%));
			transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
		}
		.slide { flex: 0 0 33.3333%; display: flex; align-items: center; padding: 0 2rem; overflow-y: auto; }

		/* Signature device: giant word behind the content, swaps per slide. */
		.ghost {
			display: block; position: absolute; right: 2.5rem; bottom: 2rem;
			z-index: -1; pointer-events: none; overflow: hidden; max-width: 60vw;
		}
		.ghost-word {
			display: block; font-size: clamp(6rem, 18vw, 16rem); line-height: 0.8;
			text-transform: uppercase; letter-spacing: -0.03em;
			color: transparent; -webkit-text-stroke: 1px var(--line);
			animation: word-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
		}
	}

	@keyframes word-in {
		from { opacity: 0; transform: translateY(0.75rem); }
		to { opacity: 1; transform: none; }
	}

	@media (prefers-reduced-motion: reduce) {
		.track, .ghost-word, .resume svg { transition: none; animation: none; }
	}
</style>
