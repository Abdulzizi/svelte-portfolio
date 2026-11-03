<script lang="ts">
	// Flips data-theme and persists to localStorage under the key app.html reads on load.
	// SSR/prerender: start from the attribute the inline script already set, so no flash.
	const KEY = 'aj-theme';

	let theme = $state<'light' | 'dark'>('dark');

	// shortcut: icon starts 'dark' during SSR/hydration, then this $effect syncs to the
	// real theme app.html set before paint. On a light page the sun icon can flash for one
	// frame before correcting. Cosmetic only — the theme itself never renders wrong.
	// Upgrade: read the cookie/attribute during SSR so the first paint matches.
	$effect(() => {
		const t = document.documentElement.dataset.theme;
		theme = t === 'light' ? 'light' : 'dark';
	});

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem(KEY, theme);
		} catch {
			// Private mode / storage blocked: theme still flips for this session.
		}
	}
</script>

<button
	type="button"
	class="toggle font-mono"
	onclick={toggle}
	aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
	aria-pressed={theme === 'light'}
>
	{#if theme === 'dark'}
		<!-- Phosphor sun (MIT): tap for light. -->
		<svg viewBox="0 0 256 256" width="18" height="18" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<circle cx="128" cy="128" r="56" />
			<line x1="128" y1="28" x2="128" y2="12" />
			<line x1="128" y1="244" x2="128" y2="228" />
			<line x1="60" y1="60" x2="48" y2="48" />
			<line x1="208" y1="208" x2="196" y2="196" />
			<line x1="28" y1="128" x2="12" y2="128" />
			<line x1="244" y1="128" x2="228" y2="128" />
			<line x1="60" y1="196" x2="48" y2="208" />
			<line x1="208" y1="48" x2="196" y2="60" />
		</svg>
	{:else}
		<!-- Phosphor moon (MIT): tap for dark. -->
		<svg viewBox="0 0 256 256" width="18" height="18" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M216 112A88 88 0 1 1 144 40a72 72 0 0 0 72 72Z" />
		</svg>
	{/if}
</button>

<style>
	.toggle {
		position: fixed; z-index: 40; right: 2.25rem; bottom: 1.5rem;
		display: flex; align-items: center; justify-content: center;
		width: 2.5rem; height: 2.5rem;
		border: 1px solid var(--line); background: var(--bg); color: var(--ink);
		transition: color 0.2s ease, border-color 0.2s ease;
	}
	.toggle:hover { color: var(--accent); border-color: var(--accent); }
	.toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

	@media (min-width: 1024px) and (min-height: 640px) {
		.toggle { right: 2.75rem; bottom: 2.75rem; }
	}

	@media (prefers-reduced-motion: reduce) {
		.toggle { transition: none; }
	}
</style>
