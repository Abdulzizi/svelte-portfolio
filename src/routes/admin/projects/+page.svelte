<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Per-row delete confirmation: first click arms, second click submits.
	let arming = $state<string | null>(null);

	let items = $derived(data.projects.map((p) => ({ ...p })));
	let dragId = $state<string | null>(null);
	let status = $state('');
	let saveSeq = 0;

	async function save() {
		const seq = ++saveSeq;
		status = 'Saving…';
		const body = new FormData();
		body.set('ids', JSON.stringify(items.map((p) => p.id)));
		try {
			const res = await fetch('?/reorder', {
				method: 'POST',
				body,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await res.text());
			if (seq !== saveSeq) return;
			status =
				result.type === 'success'
					? 'Saved'
					: result.type === 'failure'
						? String(result.data?.error ?? 'Could not save order.')
						: 'Could not save order.';
		} catch {
			if (seq === saveSeq) status = 'Could not save order.';
		}
	}

	function move(from: number, to: number) {
		if (from === to || to < 0 || to >= items.length || items[from]?.featured !== items[to].featured) return;
		const next = [...items];
		const [item] = next.splice(from, 1);
		next.splice(to, 0, item);
		items = next.map((p, i) => ({ ...p, rank: i }));
		save();
	}

	function onDrop(e: DragEvent, toId: string) {
		e.preventDefault();
		if (!dragId) return;
		move(
			items.findIndex((p) => p.id === dragId),
			items.findIndex((p) => p.id === toId)
		);
		dragId = null;
	}
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
	<p class="status font-mono" role="status">{status}</p>
	<ul class="rows">
		<li class="row headrow font-mono">
			<span></span>
			<span>Title</span>
			<span>Year</span>
			<span>Stack</span>
			<span>Rank</span>
			<span class="col-feat">Featured</span>
			<span class="col-act">Actions</span>
		</li>
		{#each items as p, i (p.id)}
			<li
				class="row"
				class:dragging={dragId === p.id}
				ondragover={(e) => dragId && e.preventDefault()}
				ondrop={(e) => onDrop(e, p.id)}
			>
				<button
					type="button"
					class="handle font-mono"
					draggable="true"
					aria-label={`Drag to reorder ${p.title}`}
					ondragstart={(e) => {
						dragId = p.id;
						if (e.dataTransfer) {
							e.dataTransfer.effectAllowed = 'move';
							e.dataTransfer.setDragImage((e.currentTarget as HTMLElement).parentElement!, 0, 0);
						}
					}}
					ondragend={() => (dragId = null)}
				>
					⋮⋮
				</button>
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
					<button
						type="button"
						class="act font-mono"
						aria-label={`Move ${p.title} up`}
						disabled={i === 0 || items[i - 1].featured !== p.featured}
						onclick={() => move(i, i - 1)}
					>
						Up
					</button>
					<button
						type="button"
						class="act font-mono"
						aria-label={`Move ${p.title} down`}
						disabled={i === items.length - 1 || items[i + 1].featured !== p.featured}
						onclick={() => move(i, i + 1)}
					>
						Down
					</button>
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
		grid-template-columns: 1.25rem minmax(8rem, 2fr) 4rem minmax(6rem, 2fr) 3rem 5rem auto;
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
	.status {
		min-height: 1rem;
		margin: 0 0 0.75rem;
		font-size: 0.6875rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.handle {
		background: none;
		border: none;
		padding: 0;
		cursor: grab;
		color: var(--ink-dim);
		letter-spacing: -0.15em;
	}
	.handle:hover {
		color: var(--ink);
	}
	.row.dragging {
		opacity: 0.4;
	}
	.act:disabled {
		opacity: 0.3;
		cursor: default;
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
		.headrow,
		.handle {
			display: none;
		}
		.meta,
		.col-feat {
			grid-column: 1;
		}
		.col-act {
			grid-column: 2;
			flex-wrap: wrap;
			justify-content: flex-end;
			max-width: 9rem;
			grid-row: 1 / span 2;
			align-items: start;
		}
	}
	:where(a, button, input):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
