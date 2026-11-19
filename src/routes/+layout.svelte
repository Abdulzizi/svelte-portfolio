<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import Marquee from '$lib/components/Marquee.svelte';
	import AsciiBackdrop from '$lib/components/AsciiBackdrop.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import MotionToggle from '$lib/components/MotionToggle.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import Cursor from '$lib/components/Cursor.svelte';
	import NavProgress from '$lib/components/NavProgress.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { motionPref, motionOff } from '$lib/motion-pref.svelte';
	import { startSmoothScroll } from '$lib/smooth-scroll';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => motionPref.init());

	$effect(() => {
		if (motionPref.off || page.url.pathname.startsWith('/admin')) return;
		return startSmoothScroll();
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (motionOff()) return;
		const from = navigation.from?.url.pathname ?? '';
		const to = navigation.to?.url.pathname ?? '';
		if (from.startsWith('/admin') || to.startsWith('/admin')) return;
		const target = from === '/' ? to.slice(1) : '';
		const title = ['work', 'connect', 'about', 'blog'].includes(target)
			? document.querySelector<HTMLElement>(`#${target} .grid-title`)
			: null;
		if (title) title.style.viewTransitionName = 'title-morph';
		return new Promise<void>((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
				if (title) {
					title.style.viewTransitionName = '';
					const h1 = document.querySelector<HTMLElement>('h1');
					if (h1) h1.style.viewTransitionName = 'title-morph';
				}
			});
			transition.finished.finally(() => {
				if (title) title.style.viewTransitionName = '';
				const h1 = document.querySelector<HTMLElement>('h1');
				if (h1) h1.style.viewTransitionName = '';
			});
		});
	});
</script>

<div class="relative">
	{#if !page.url.pathname.startsWith('/admin')}
		<AsciiBackdrop />
	{/if}
	<Marquee axis="x" position="top" />
	<Marquee axis="x" position="bottom" />
	<Marquee axis="y" position="left" />
	<Marquee axis="y" position="right" />
	<a class="skip-link" href="#main-content">Skip to content</a>
	{@render children()}
	<ThemeToggle />
	<MotionToggle />
	<CommandPalette />
	<Cursor />
	<NavProgress />
	<Seo />
</div>

<style>
	.skip-link {
		position: fixed;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 70;
		padding: 0.5rem 0.75rem;
		background: var(--bg);
		color: var(--ink);
		transform: translateY(-200%);
	}

	.skip-link:focus-visible {
		transform: translateY(0);
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
