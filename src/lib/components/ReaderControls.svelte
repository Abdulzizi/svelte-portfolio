<script lang="ts">
	import { onMount } from 'svelte';

	let { target }: { target?: HTMLElement } = $props();

	const KEY = 'aj-reader';
	const SIZE = { s: '1rem', m: '1.125rem', l: '1.3rem' };
	const MEASURE = { narrow: '38rem', wide: '46rem' };
	const WRAP = { narrow: '44rem', wide: '50rem' };
	const FONT = { sans: 'var(--font-sans)', serif: "ui-serif, Georgia, 'Times New Roman', serif" };
	const LEADING = { tight: '1.5', normal: '1.7', loose: '1.95' };

	const groups = [
		{ key: 'size', label: 'Size', options: [['s', 'S'], ['m', 'M'], ['l', 'L']] },
		{ key: 'width', label: 'Width', options: [['narrow', 'Narrow'], ['wide', 'Wide']] },
		{ key: 'font', label: 'Font', options: [['sans', 'Sans'], ['serif', 'Serif']] },
		{ key: 'leading', label: 'Leading', options: [['tight', 'Tight'], ['normal', 'Normal'], ['loose', 'Loose']] }
	] as const;

	let zen = $state(false);
	const maps = { size: SIZE, width: MEASURE, font: FONT, leading: LEADING };
	let opts = $state({ size: 'm', width: 'narrow', font: 'sans', leading: 'normal' });
	let ready = $state(false);

	function pick(map: object, v: unknown, fallback: string) {
		return typeof v === 'string' && Object.hasOwn(map, v) ? v : fallback;
	}

	onMount(() => {
		try {
			const raw = localStorage.getItem(KEY);
			if (raw) {
				const s = JSON.parse(raw);
				zen = s?.zen === true;
				for (const k of Object.keys(maps) as (keyof typeof maps)[]) opts[k] = pick(maps[k], s?.[k], opts[k]);
			}
		} catch {}
		ready = true;
	});

	$effect(() => {
		const saved = JSON.stringify({ zen, ...opts });
		if (!ready) return;
		try {
			localStorage.setItem(KEY, saved);
		} catch {}
	});

	$effect(() => {
		if (!target) return;
		target.style.setProperty('--reader-size', SIZE[opts.size as keyof typeof SIZE]);
		target.style.setProperty('--reader-measure', MEASURE[opts.width as keyof typeof MEASURE]);
		target.style.setProperty('--reader-wrap', WRAP[opts.width as keyof typeof WRAP]);
		target.style.setProperty('--reader-font', FONT[opts.font as keyof typeof FONT]);
		target.style.setProperty('--reader-leading', LEADING[opts.leading as keyof typeof LEADING]);
	});

	$effect(() => {
		if (!zen) return;
		document.documentElement.setAttribute('data-zen', '');
		return () => document.documentElement.removeAttribute('data-zen');
	});

	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		const el = e.target as HTMLElement | null;
		if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
		if (e.key === 'z' || e.key === 'Z') zen = !zen;
		else if (e.key === 'Escape' && zen) zen = false;
	}
</script>

<svelte:window {onkeydown} />

<div class="reader font-mono">
	<button type="button" class="opt zen" aria-pressed={zen} onclick={() => (zen = !zen)}>
		{zen ? 'Exit zen' : 'Zen'}
	</button>
	{#each groups as g (g.key)}
		<div class="group" role="group" aria-label={g.label}>
			<span class="label">{g.label}</span>
			{#each g.options as [value, text] (value)}
				<button
					type="button"
					class="opt"
					aria-pressed={opts[g.key] === value}
					onclick={() => (opts[g.key] = value)}
				>{text}</button>
			{/each}
		</div>
	{/each}
</div>

<style>
	.reader {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 1.25rem;
		margin-bottom: 2.5rem;
		padding: 0.25rem 0;
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		transition: opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}
	.label { color: var(--ink-dim); margin-right: 0.25rem; }
	.opt {
		min-height: 2.25rem;
		padding: 0 0.5rem;
		color: var(--ink-dim);
		text-transform: inherit;
		letter-spacing: inherit;
		transition: color 0.2s ease;
	}
	@media (pointer: coarse) {
		.opt { min-height: 2.75rem; }
	}
	.opt[aria-pressed='true'] { color: var(--accent); }
	@media (hover: hover) and (pointer: fine) {
		.opt:hover { color: var(--ink); }
		.opt[aria-pressed='true']:hover { color: var(--accent); }
	}
	.opt:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.zen { padding-left: 0; }

	:global([data-zen]) .reader { opacity: 0.35; }
	:global([data-zen]) .reader:hover,
	:global([data-zen]) .reader:focus-within { opacity: 1; }
</style>
