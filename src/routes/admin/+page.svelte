<script lang="ts">
	import { enhance } from '$app/forms';
	import { fmtDate } from '$lib/date';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const tiles = $derived([
		{ label: 'Projects', value: data.stats.projects },
		{ label: 'Featured', value: data.stats.featured },
		{ label: 'Posts published', value: data.stats.published },
		{ label: 'Drafts', value: data.stats.drafts },
		{ label: 'Unread messages', value: data.stats.unread }
	]);
</script>

<svelte:head>
	<title>Dashboard | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="head">
	<h1 class="font-hand text-3xl font-extrabold leading-none">
		Dash<span class="text-[var(--accent)]">board</span>
	</h1>
	<div class="quick">
		<a href="/admin/posts/new" class="new font-hand font-extrabold">New post</a>
		<a href="/admin/projects/new" class="new font-hand font-extrabold">New project</a>
	</div>
</div>

<ul class="tiles">
	{#each tiles as t (t.label)}
		<li class="tile">
			<span class="num font-hand font-extrabold">{t.value}</span>
			<span class="label font-mono">{t.label}</span>
		</li>
	{/each}
</ul>

<section class="section">
	<h2 class="sect font-mono">Recent edits</h2>
	{#if data.recent.length === 0}
		<p class="empty font-mono">Nothing yet.</p>
	{:else}
		<ul class="rows">
			{#each data.recent as r (r.type + r.id)}
				<li class="row">
					<span class="type font-mono">{r.type}</span>
					<a href={r.href} class="title">{r.title}</a>
					<span class="meta font-mono">{fmtDate(r.updatedAt)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="section">
	<h2 class="sect font-mono">Drafts waiting</h2>
	{#if data.drafts.length === 0}
		<p class="empty font-mono">No drafts.</p>
	{:else}
		<ul class="rows">
			{#each data.drafts as d (d.id)}
				<li class="row">
					<a href={`/admin/posts/${d.id}`} class="title">{d.title}</a>
					<a href={`/admin/posts/${d.id}`} class="act font-mono">Edit</a>
					<form method="POST" action="?/publish" use:enhance>
						<input type="hidden" name="id" value={d.id} />
						<button type="submit" class="pub font-mono">Publish</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.quick {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.new {
		border: 1px solid var(--accent);
		color: var(--accent);
		padding: 0.5rem 1.25rem;
		white-space: nowrap;
		transition: background-color 0.2s ease, color 0.2s ease;
	}
	.new:hover {
		background: var(--accent);
		color: var(--bg);
	}
	.tiles {
		list-style: none;
		margin: 0 0 2.5rem;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		border-top: 1px solid var(--line);
		border-left: 1px solid var(--line);
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-right: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}
	.num {
		font-size: 2rem;
		line-height: 1;
	}
	.label,
	.sect,
	.type {
		font-size: 0.625rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.section {
		margin-bottom: 2.5rem;
	}
	.sect {
		margin: 0 0 0.75rem;
		font-weight: 400;
	}
	.empty {
		font-size: 0.8125rem;
		letter-spacing: 0.1em;
		color: var(--ink-dim);
	}
	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--line);
	}
	.row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
		padding: 0.75rem 0.25rem;
		border-bottom: 1px solid var(--line);
	}
	.type {
		width: 4.5rem;
	}
	.title {
		flex: 1;
		min-width: 8rem;
		color: var(--ink);
		font-weight: 600;
		transition: color 0.2s ease;
	}
	.title:hover {
		color: var(--accent);
	}
	.meta {
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		color: var(--ink-dim);
	}
	.act,
	.pub {
		font-size: 0.6875rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--ink-dim);
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color 0.2s ease;
	}
	.act:hover {
		color: var(--ink);
	}
	.pub {
		border: 1px solid var(--accent);
		color: var(--accent);
		padding: 0.25rem 0.75rem;
		transition: background-color 0.2s ease, color 0.2s ease;
	}
	.pub:hover {
		background: var(--accent);
		color: var(--bg);
	}
	:where(a, button):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
