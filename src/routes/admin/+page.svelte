<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Per-row delete confirmation: first click arms, second click submits.
	let arming = $state<string | null>(null);
</script>

<svelte:head>
	<title>Projects | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="head">
	<h1 class="font-hand text-3xl font-extrabold leading-none">
		Pro<span class="text-[var(--accent)]">jects</span>
	</h1>
	<a href="/admin/projects/new" class="new font-hand font-extrabold">New project</a>
</div>

{#if data.projects.length === 0}
	<p class="empty font-mono">No projects yet. Create the first one.</p>
{:else}
	<ul class="rows">
		<li class="row headrow font-mono">
			<span>Title</span>
			<span>Year</span>
			<span>Stack</span>
			<span>Rank</span>
			<span class="col-feat">Featured</span>
			<span class="col-act">Actions</span>
		</li>
		{#each data.projects as p (p.id)}
			<li class="row">
				<a href={`/admin/projects/${p.id}`} class="title">{p.title}</a>
				<span class="meta font-mono">{p.year}</span>
				<span class="meta font-mono stack">{p.stack.join(' · ')}</span>
				<span class="meta font-mono">{p.rank}</span>
				<span class="col-feat">
					{#if p.featured}
						<span class="dot" aria-label="Featured" title="Featured"></span>
					{:else}
						<span class="dot off" aria-label="Not featured" title="Not featured"></span>
					{/if}
				</span>
				<span class="col-act actions">
					<a href={`/admin/projects/${p.id}`} class="act font-mono">Edit</a>
					<form
						method="POST"
						action="?/delete"
						use:enhance={() => {
							return async ({ update }) => {
								arming = null;
								await update();
							};
						}}
					>
						<input type="hidden" name="id" value={p.id} />
						{#if arming === p.id}
							<button type="submit" class="act danger font-mono">Confirm</button>
							<button
								type="button"
								class="act font-mono"
								onclick={() => (arming = null)}
							>
								Cancel
							</button>
						{:else}
							<button
								type="button"
								class="act font-mono"
								onclick={() => (arming = p.id)}
							>
								Delete
							</button>
						{/if}
					</form>
				</span>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 2rem;
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
		display: grid;
		grid-template-columns: minmax(8rem, 2fr) 4rem minmax(6rem, 2fr) 3rem 5rem auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0.25rem;
		border-bottom: 1px solid var(--line);
	}
	.headrow {
		font-size: 0.625rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.title {
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
	.stack {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.col-feat,
	.col-act {
		display: flex;
		align-items: center;
	}
	.dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--accent);
		display: inline-block;
	}
	.dot.off {
		background: transparent;
		border: 1px solid var(--line);
	}
	.actions {
		gap: 0.75rem;
	}
	.actions form {
		display: inline-flex;
		gap: 0.75rem;
	}
	.act {
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
	.act.danger {
		color: var(--danger);
	}
	@media (max-width: 720px) {
		.row {
			grid-template-columns: 1fr auto;
			grid-auto-rows: min-content;
		}
		.headrow {
			display: none;
		}
		.meta,
		.col-feat {
			grid-column: 1;
		}
		.col-act {
			grid-column: 2;
			grid-row: 1 / span 2;
			align-items: start;
		}
	}
	:where(a, button, input):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
