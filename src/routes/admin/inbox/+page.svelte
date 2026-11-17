<script lang="ts">
	import { enhance } from '$app/forms';
	import { fmtDate } from '$lib/date';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let arming = $state<string | null>(null);

	const tabs = [
		['inbox', 'Inbox'],
		['archived', 'Archived'],
		['spam', 'Spam']
	] as const;

	function reply(m: PageData['messages'][number]) {
		const quoted = m.body
			.split('\n')
			.map((l) => `> ${l}`)
			.join('\n');
		const body = `\n\nOn ${fmtDate(m.createdAt)}, ${m.name} wrote:\n${quoted}`;
		return `mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}&body=${encodeURIComponent(body)}`;
	}
</script>

<svelte:head>
	<title>Inbox | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="head">
	<h1 class="font-hand text-3xl font-extrabold leading-none">
		In<span class="text-[var(--accent)]">box</span>
	</h1>
</div>

<div class="bar">
	<nav class="tabs" aria-label="Inbox views">
		{#each tabs as [key, label] (key)}
			<a
				href={key === 'inbox' ? '/admin/inbox' : `/admin/inbox?view=${key}`}
				class="tab font-mono"
				class:on={data.view === key}
				aria-current={data.view === key ? 'page' : undefined}
				data-sveltekit-replacestate
			>
				{label} <span class="count">{data.counts[key]}</span>
			</a>
		{/each}
	</nav>
	{#if data.view === 'inbox' && data.messages.some((m) => !m.read)}
		<form method="POST" action="?/markAllRead" use:enhance>
			<button type="submit" class="act font-mono">Mark all read</button>
		</form>
	{/if}
</div>

{#if data.messages.length === 0}
	<p class="empty font-mono">No messages here.</p>
{:else}
	<ul class="rows">
		{#each data.messages as m (m.id)}
			<li class="row">
				<div class="top">
					<span class="who">
						{#if !m.read}
							<span class="dot" aria-label="Unread" title="Unread"></span>
						{/if}
						<span class="name" class:unread={!m.read}>{m.name}</span>
					</span>
					<a href={`mailto:${m.email}`} class="meta font-mono">{m.email}</a>
					<span class="meta font-mono">{fmtDate(m.createdAt)}</span>
				</div>
				<p class="body">{m.body}</p>
				<div class="actions">
					<a href={reply(m)} class="act font-mono">Reply</a>
					<form method="POST" action="?/toggleRead" use:enhance>
						<input type="hidden" name="id" value={m.id} />
						<input type="hidden" name="read" value={String(m.read)} />
						<button type="submit" class="act font-mono">
							{m.read ? 'Mark unread' : 'Mark read'}
						</button>
					</form>
					<form method="POST" action="?/toggleArchived" use:enhance>
						<input type="hidden" name="id" value={m.id} />
						<input type="hidden" name="archived" value={String(m.archived)} />
						<button type="submit" class="act font-mono">
							{m.archived ? 'Unarchive' : 'Archive'}
						</button>
					</form>
					<form method="POST" action="?/toggleSpam" use:enhance>
						<input type="hidden" name="id" value={m.id} />
						<input type="hidden" name="spam" value={String(m.spam)} />
						<button type="submit" class="act font-mono">
							{m.spam ? 'Not spam' : 'Mark spam'}
						</button>
					</form>
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
						<input type="hidden" name="id" value={m.id} />
						{#if arming === m.id}
							<button type="submit" class="act danger font-mono">Confirm</button>
							<button type="button" class="act font-mono" onclick={() => (arming = null)}>
								Cancel
							</button>
						{:else}
							<button type="button" class="act font-mono" onclick={() => (arming = m.id)}>
								Delete
							</button>
						{/if}
					</form>
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.head {
		margin-bottom: 2rem;
	}
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1rem;
		margin-bottom: 1.5rem;
	}
	.tabs {
		display: inline-flex;
		border: 1px solid var(--line);
	}
	.tab {
		font-size: 0.6875rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--ink-dim);
		padding: 0.5rem 0.9rem;
		transition: color 0.2s ease;
	}
	.tab:hover {
		color: var(--ink);
	}
	.tab.on {
		color: var(--ink);
		background: var(--line);
	}
	.count {
		color: var(--accent);
		margin-left: 0.25rem;
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
		padding: 1rem 0.25rem;
		border-bottom: 1px solid var(--line);
		display: grid;
		gap: 0.75rem;
	}
	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem 1rem;
	}
	.who {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	.name {
		color: var(--ink);
	}
	.name.unread {
		font-weight: 800;
	}
	.dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--accent);
		display: inline-block;
	}
	.meta {
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		color: var(--ink-dim);
		transition: color 0.2s ease;
	}
	a.meta:hover {
		color: var(--accent);
	}
	.body {
		margin: 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		color: var(--ink);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
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
	:where(a, button, input):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
