<script lang="ts">
	import { onMount, tick as flush } from 'svelte';
	import DataField from '$lib/components/DataField.svelte';
	import AsciiPortrait from '$lib/components/AsciiPortrait.svelte';
	import { loadGsap } from '$lib/motion';
	import { motionOff, motionPref } from '$lib/motion-pref.svelte';
	import { useWide } from '$lib/wide.svelte';
	import { loadTicker, ticker } from '$lib/ticker.svelte';
	import { jakartaTime } from '$lib/date';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let chapters = $derived(data.chapters);

	const wide = useWide();

	let root: HTMLElement;
	let active = $state(0);
	let density = $state(0.4);
	let pinned = $state(false);
	let progress = $state(0);
	let triggers: { start: number }[] = [];

	let time = $state('--:--');
	const commit = $derived(ticker.github);

	function tick() {
		time = jakartaTime();
	}

	onMount(() => {
		tick();
		loadTicker();
		const id = setInterval(() => {
			tick();
			loadTicker();
		}, 60_000);
		return () => clearInterval(id);
	});

	$effect(() => {
		const count = chapters.length;
		if (!wide.current || motionPref.off || motionOff() || !matchMedia('(pointer: fine)').matches) {
			pinned = false;
			density = 0.4;
			return;
		}
		let dead = false;
		let revert = () => {};
		loadGsap().then((m) => {
			if (!m || dead) return;
			const { gsap, ScrollTrigger } = m;
			const ctx = gsap.context(() => {
				triggers = [];
				root.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el, i) => {
					const tl = gsap.timeline({
						defaults: { ease: 'power2.out' },
						scrollTrigger: {
							trigger: el,
							start: 'top top',
							end: () => `+=${Math.round(innerHeight * 0.7)}`,
							pin: true,
							scrub: 0.5,
							invalidateOnRefresh: true,
							onToggle: (self) => {
								if (self.isActive) {
									active = i;
									density = (i + 1) / count;
								}
							}
						}
					});
					tl.from(el.querySelector('.big'), { opacity: 0, y: 48, duration: 1 })
						.from(el.querySelector('.after'), { opacity: 0, y: 24, duration: 1 })
						.to({}, { duration: 0.4 });
					triggers.push(tl.scrollTrigger as { start: number });
				});
				ScrollTrigger.create({
					trigger: root,
					start: 'top top',
					end: 'bottom bottom',
					onUpdate: (self) => (progress = self.progress)
				});
			}, root);
			revert = () => ctx.revert();
			pinned = true;
			flush().then(() => !dead && ScrollTrigger.refresh());
			document.fonts?.ready.then(() => !dead && ScrollTrigger.refresh());
		});
		return () => {
			dead = true;
			revert();
			triggers = [];
			pinned = false;
		};
	});

	function go(i: number) {
		const top = triggers[i]?.start;
		if (top !== undefined) scrollTo({ top, behavior: 'smooth' });
		document.getElementById(`${chapters[i].id}-heading`)?.focus({ preventScroll: true });
	}
</script>

<svelte:head>
	<title>About | Abdul Jawad Azizi</title>
	<meta name="description" content="Abdul Jawad Azizi, full-stack engineer in Jakarta. What he builds, where he ships, and the stack he works in." />
</svelte:head>

<div class="backdrop" aria-hidden="true"><DataField {density} /></div>

{#if wide.current}
	<AsciiPortrait />
{/if}

<main id="main-content" bind:this={root} class="story relative text-[var(--ink)]" class:pinned>
	<a href="/" class="back font-hand font-extrabold">Back</a>

	{#each chapters as c, i (c.id)}
		<section data-chapter aria-labelledby="{c.id}-heading" class="chapter">
			<div class="copy">
				{#if i === 0}
					<h1 class="font-hand text-2xl font-extrabold">About</h1>
				{/if}
				<h2 id="{c.id}-heading" tabindex="-1" class="kicker font-mono">
					<span>{String(i + 1).padStart(2, '0')}</span>
					{c.kicker}
				</h2>
				<p class="big font-hand font-extrabold">{c.big}</p>
				<div class="after">
					<p class="text">{c.text}</p>

					{#if c.variant === 'now'}
						<dl class="live font-mono">
							<div>
								<dt>Jakarta</dt>
								<dd>{time} WIB</dd>
							</div>
							{#if commit}
								<div>
									<dt>Latest commit</dt>
									<dd class="commit">{commit}</dd>
								</div>
							{/if}
						</dl>
					{/if}

					{#if c.variant === 'next'}
						<div class="links font-hand font-extrabold">
							<a href="/connect">Get in touch</a>
							<a href="/cv" target="_blank" rel="noopener noreferrer">Résumé</a>
						</div>
					{/if}
				</div>
			</div>
		</section>
	{/each}

	{#if pinned}
		<nav class="rail" aria-label="Chapters" style="--p: {progress}">
			<ol>
				{#each chapters as c, i (c.id)}
					<li>
						<button
							type="button"
							class="font-mono"
							class:on={i === active}
							aria-label="Chapter {i + 1}: {c.kicker}"
							aria-current={i === active ? 'step' : undefined}
							onclick={() => go(i)}
						>
							{String(i + 1).padStart(2, '0')}
						</button>
					</li>
				{/each}
			</ol>
		</nav>
	{/if}
</main>

<style>
	.backdrop { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

	.story { z-index: 1; }

	.back { position: absolute; top: 3rem; left: 2.5rem; z-index: 20; }

	.chapter {
		display: flex; align-items: center; min-height: 100dvh;
		padding: 5rem 2.25rem 4rem;
	}

	.copy {
		position: relative; width: 100%; max-width: 44rem; margin-inline: auto; padding: 2rem;
		background: radial-gradient(closest-side, color-mix(in srgb, var(--bg) 85%, transparent) 85%, transparent);
	}

	.kicker {
		display: flex; gap: 0.75rem; margin-top: 1rem; font-size: 0.75rem; font-weight: 400;
		text-transform: uppercase; letter-spacing: 0.2em; color: var(--accent);
	}
	.kicker:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }

	.big {
		margin-top: 1rem; font-size: clamp(2.5rem, 11vw, 4.5rem); line-height: 0.95; letter-spacing: -0.02em;
	}

	.text { margin-top: 1.5rem; max-width: 34rem; font-size: 1.125rem; color: var(--ink-dim); }

	.live {
		display: grid; gap: 1rem; margin-top: 2rem; max-width: 34rem;
		border-top: 1px solid var(--line); padding-top: 1rem;
	}
	.live dt { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--ink-dim); }
	.live dd { margin-top: 0.25rem; font-size: 1rem; color: var(--ink); }

	.links { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 2rem; }
	.links a {
		border: 1px solid var(--ink); padding: 0.5rem 1.1rem;
		transition: background-color 0.2s ease, color 0.2s ease;
	}
	.links a:hover { background: var(--ink); color: var(--bg); }

	:where(a, button):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

	.pinned .chapter { height: 100dvh; min-height: 0; padding-right: 5rem; }
	.pinned .big { font-size: clamp(3.5rem, 10vw, 8rem); }
	.pinned .copy { max-width: 56rem; margin: 0 auto 0 4rem; }

	.rail {
		position: fixed; top: 50%; right: 3rem; z-index: 15; transform: translateY(-50%);
	}
	.rail::before, .rail::after {
		content: ''; position: absolute; top: 0; bottom: 0; right: 0.45rem; width: 1px; background: var(--line);
	}
	.rail::after {
		background: var(--accent); transform-origin: top; transform: scaleY(var(--p, 0));
	}
	.rail ol { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1.25rem; list-style: none; margin: 0; padding: 0; }
	.rail button {
		display: block; padding: 0.25rem 0.75rem 0.25rem 0.5rem; background: var(--bg);
		font-size: 0.75rem; letter-spacing: 0.15em; color: var(--ink-dim); cursor: pointer;
		transition: color 0.2s ease;
	}
	.rail button:hover, .rail button.on { color: var(--accent); }
</style>
