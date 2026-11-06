<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	// Login page owns its own centered layout — skip the admin chrome there.
	let showChrome = $derived($page.url.pathname !== '/admin/login');

	// Active section highlight: Posts owns /admin/posts**, Projects owns the rest.
	let onPosts = $derived($page.url.pathname.startsWith('/admin/posts'));
</script>

{#if showChrome}
	<div class="shell">
		<header class="bar">
			<span class="brand font-mono">ADMIN</span>
			<nav class="sections">
				<a href="/admin" class="link font-mono" class:active={!onPosts}>Projects</a>
				<a href="/admin/posts" class="link font-mono" class:active={onPosts}>Posts</a>
			</nav>
			<nav class="links">
				<a href="/" class="link font-mono">View site</a>
				<form method="POST" action="/admin?/logout">
					<button type="submit" class="link logout font-mono">Log out</button>
				</form>
			</nav>
		</header>
		<main id="main-content" class="content">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid var(--line);
	}
	.brand {
		font-size: 0.75rem;
		letter-spacing: 0.2em;
		color: var(--accent);
	}
	.links {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	.sections {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	.link.active {
		color: var(--accent);
	}
	.link {
		font-size: 0.75rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color 0.2s ease;
	}
	.link:hover {
		color: var(--ink);
	}
	.content {
		flex: 1;
		width: 100%;
		max-width: 60rem;
		margin: 0 auto;
		padding: 2rem 1.25rem 4rem;
	}
	:where(a, button):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
