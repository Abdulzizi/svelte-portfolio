<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { motionPref, motionOff } from '$lib/motion-pref.svelte';
	import { tick } from 'svelte';
	import { lockScroll } from '$lib/smooth-scroll';
	import { EMAIL, GITHUB_URL, LINKEDIN_URL } from '$lib/site';

	type Item = { id: string; label: string; hint: string; keep?: boolean; run: () => void };

	let open = $state(false);
	let query = $state('');
	let active = $state(0);
	let posts = $state<{ slug: string; title: string }[]>([]);
	let loaded = false;
	let site = $state({ email: EMAIL, githubUrl: GITHUB_URL, linkedinUrl: LINKEDIN_URL });
	let input = $state<HTMLInputElement>();
	let returnTo: HTMLElement | null = null;
	let lastPath = '';

	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	async function copyEmail() {
		try {
			await navigator.clipboard.writeText(site.email);
		} catch {
			const t = document.createElement('textarea');
			t.value = site.email;
			t.style.position = 'fixed';
			t.style.opacity = '0';
			document.body.appendChild(t);
			t.select();
			try {
				document.execCommand('copy');
			} finally {
				t.remove();
			}
		}
		copied = true;
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 1200);
	}

	function openTab(href: string) {
		window.open(href, '_blank', 'noopener');
	}

	const hidden = $derived(page.url.pathname.startsWith('/admin'));

	function flipTheme() {
		const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem('aj-theme', next);
		} catch {
			return;
		}
	}

	async function go(href: string) {
		if (href === page.url.pathname + page.url.search) return;
		await goto(href, { noScroll: false, keepFocus: false });
		await tick();
		const main = document.getElementById('main-content');
		if (main) {
			if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
			main.focus({ preventScroll: true });
		}
	}

	const pages: [string, string][] = [
		['Home', '/'],
		['Work', '/work'],
		['About', '/about'],
		['Connect', '/connect'],
		['Blog', '/blog']
	];

	const items = $derived<Item[]>([
		...pages.map(([label, href]) => ({
			id: `page-${label}`,
			label,
			hint: 'Page',
			run: () => go(href)
		})),
		{ id: 'theme', label: 'Toggle theme', hint: 'Action', run: flipTheme },
		{
			id: 'motion',
			label: motionPref.off ? 'Turn motion on' : 'Turn motion off',
			hint: 'Action',
			run: () => motionPref.toggle()
		},
		{ id: 'copy-email', label: 'Copy email', hint: 'Action', keep: true, run: copyEmail },
		{
			id: 'github',
			label: 'Open GitHub',
			hint: 'Action',
			run: () => openTab(site.githubUrl)
		},
		{
			id: 'linkedin',
			label: 'Open LinkedIn',
			hint: 'Action',
			run: () => openTab(site.linkedinUrl)
		},
		{
			id: 'cv',
			label: 'Download CV',
			hint: 'Action',
			run: () => openTab('/cv')
		},
		...posts.map((p) => ({
			id: `post-${p.slug}`,
			label: p.title,
			hint: 'Post',
			run: () => go(`/blog/${encodeURIComponent(p.slug)}`)
		}))
	]);

	function matchIdx(label: string, q: string): number[] | null {
		const l = label.toLowerCase();
		const at = l.indexOf(q);
		if (at >= 0) return Array.from({ length: q.length }, (_, k) => at + k);
		const out: number[] = [];
		let i = 0;
		for (let k = 0; k < l.length && i < q.length; k++) if (l[k] === q[i]) (out.push(k), i++);
		return i === q.length ? out : null;
	}

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return items
			.map((item) => ({ item, idx: q ? matchIdx(item.label, q) : [] }))
			.filter((r): r is { item: Item; idx: number[] } => r.idx !== null);
	});

	function parts(label: string, idx: number[]) {
		const set = new Set(idx);
		const out: { t: string; m: boolean }[] = [];
		for (let k = 0; k < label.length; k++) {
			const m = set.has(k);
			if (out.length && out[out.length - 1].m === m) out[out.length - 1].t += label[k];
			else out.push({ t: label[k], m });
		}
		return out;
	}

	$effect(() => {
		results.length;
		active = 0;
	});

	$effect(() => {
		const p = page.url.pathname + page.url.search;
		if (p === lastPath) return;
		lastPath = p;
		open = false;
	});

	$effect(() => {
		if (!open) return;
		lockScroll(true);
		return () => lockScroll(false);
	});

	async function show() {
		returnTo = document.activeElement as HTMLElement | null;
		query = '';
		open = true;
		if (!loaded) {
			loaded = true;
			try {
				const [res, siteRes] = await Promise.all([fetch('/api/posts-index'), fetch('/api/site')]);
				if (res.ok) posts = await res.json();
				if (siteRes.ok) site = await siteRes.json();
			} catch {
				loaded = false;
			}
		}
		await tick();
		input?.focus();
	}

	function close(refocus = true) {
		open = false;
		if (refocus) returnTo?.focus();
	}

	function choose(item: Item | undefined) {
		if (!item) return;
		const nav = item.id.startsWith('page-') || item.id.startsWith('post-');
		if (!item.keep) close(!nav);
		item.run();
	}

	function onWindowKey(e: KeyboardEvent) {
		if (hidden) return;
		const t = e.target as HTMLElement | null;
		if (t?.isContentEditable) return;
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			if (open) close();
			else show();
		}
	}

	function onKey(e: KeyboardEvent) {
		const n = results.length;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (n) active = (active + 1) % n;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (n) active = (active - 1 + n) % n;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			choose(results[active]?.item);
		} else if (e.key === 'Tab') {
			e.preventDefault();
		}
	}

	$effect(() => {
		if (!open) return;
		document.getElementById(`cp-${results[active]?.item.id}`)?.scrollIntoView({ block: 'nearest' });
	});
</script>

<svelte:window onkeydown={onWindowKey} />

{#if open && !hidden}
	<div class="backdrop" class:still={motionOff()} role="presentation" onmousedown={(e) => e.target === e.currentTarget && close()}>
		<div class="panel" role="dialog" aria-modal="true" aria-label="Command palette" tabindex="-1">
			<input
				bind:this={input}
				bind:value={query}
				onkeydown={onKey}
				class="field"
				type="text"
				role="combobox"
				aria-expanded="true"
				aria-controls="cp-list"
				aria-autocomplete="list"
				aria-activedescendant={results[active] ? `cp-${results[active].item.id}` : undefined}
				placeholder="Type a command or search"
				autocomplete="off"
				spellcheck="false"
			/>
			<ul id="cp-list" class="list" role="listbox" aria-label="Results">
				{#each results as { item, idx }, i (item.id)}
					<li
						id="cp-{item.id}"
						role="option"
						aria-selected={i === active}
						class="row"
						class:on={i === active}
						onmousemove={() => (active = i)}
						onmousedown={(e) => e.preventDefault()}
						onclick={() => choose(item)}
						onkeydown={(e) => e.key === 'Enter' && choose(item)}
					>
						<span class="label">{#each parts(item.label, idx) as p}{#if p.m}<mark>{p.t}</mark>{:else}{p.t}{/if}{/each}</span>
						<span class="chip font-mono">{item.id === 'copy-email' && copied ? 'Copied' : item.hint}</span>
					</li>
				{:else}
					<li class="empty" role="presentation">No results</li>
				{/each}
			</ul>
			<div class="foot font-mono" >
				<span>Up/Down navigate</span><span>Enter select</span><span>Esc close</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 12vh 1rem 1rem;
		background: color-mix(in srgb, var(--bg) 70%, transparent);
		backdrop-filter: blur(2px);
		animation: fade 0.15s ease-out;
	}
	.backdrop.still {
		animation: none;
	}
	.panel {
		width: 100%;
		max-width: 34rem;
		background: var(--surface);
		color: var(--ink);
		border: 1px solid var(--line);
		font-family: 'Inter', sans-serif;
	}
	.field {
		width: 100%;
		padding: 0.9rem 1rem;
		background: transparent;
		color: var(--ink);
		border: 0;
		border-bottom: 1px solid var(--line);
		font: inherit;
		font-size: 1rem;
		outline: none;
	}
	.field::placeholder {
		color: var(--ink-dim);
	}
	.field:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	.list {
		max-height: min(50vh, 22rem);
		overflow-y: auto;
		margin: 0;
		padding: 0.25rem 0;
		list-style: none;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.6rem 1rem;
		cursor: pointer;
		border-left: 2px solid transparent;
	}
	.row.on {
		border-left-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--ink) 6%, transparent);
	}
	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.chip {
		flex: none;
		font-size: 0.65rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-dim);
		border: 1px solid var(--line);
		padding: 0.1rem 0.4rem;
	}
	mark {
		background: transparent;
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.empty {
		padding: 0.9rem 1rem;
		color: var(--ink-dim);
	}
	.foot {
		display: flex;
		gap: 1rem;
		padding: 0.5rem 1rem;
		border-top: 1px solid var(--line);
		font-size: 0.65rem;
		color: var(--ink-dim);
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
</style>
