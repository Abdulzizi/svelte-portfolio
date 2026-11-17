<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let arming = $state<string | null>(null);

	const errs = (scope: string) =>
		form && 'scope' in form && form.scope === scope ? (form.errors ?? {}) : {};
</script>

<svelte:head>
	<title>Story | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="head">
	<h1 class="font-hand text-3xl font-extrabold leading-none">
		Sto<span class="text-[var(--accent)]">ry</span>
	</h1>
	{#if data.chapters.length === 0}
		<form method="POST" action="?/seed" use:enhance>
			<button type="submit" class="new font-hand font-extrabold">Load defaults</button>
		</form>
	{/if}
</div>

{#if form && 'error' in form && form.error}
	<p class="err font-mono" role="alert">{form.error}</p>
{/if}

{#snippet fields(c: { kicker: string; big: string; body: string; variant: string } | null, e: Record<string, string[] | undefined>)}
	<label class="field">
		<span class="lbl font-mono">Kicker</span>
		<input name="kicker" maxlength="40" required value={c?.kicker ?? ''} />
		{#if e.kicker}<span class="err font-mono">{e.kicker[0]}</span>{/if}
	</label>
	<label class="field">
		<span class="lbl font-mono">Big line</span>
		<input name="big" maxlength="160" required value={c?.big ?? ''} />
		{#if e.big}<span class="err font-mono">{e.big[0]}</span>{/if}
	</label>
	<label class="field">
		<span class="lbl font-mono">Body</span>
		<textarea name="body" rows="4" maxlength="600" required>{c?.body ?? ''}</textarea>
		{#if e.body}<span class="err font-mono">{e.body[0]}</span>{/if}
	</label>
	<label class="field">
		<span class="lbl font-mono">Variant</span>
		<select name="variant" value={c?.variant ?? 'text'}>
			<option value="text">Text</option>
			<option value="now">Now (live panel)</option>
			<option value="next">Next (links)</option>
		</select>
		{#if e.variant}<span class="err font-mono">{e.variant[0]}</span>{/if}
	</label>
{/snippet}

<ul class="rows">
	{#each data.chapters as c, i (c.id)}
		<li class="row">
			<form method="POST" action="?/update" use:enhance={() => async ({ update }) => update({ reset: false })}>
				<input type="hidden" name="id" value={c.id} />
				<p class="num font-mono">{String(i + 1).padStart(2, '0')}</p>
				{@render fields(c, errs(c.id))}
				<div class="actions">
					<button type="submit" class="act font-mono">Save</button>
				</div>
			</form>
			<div class="actions">
				<form method="POST" action="?/move" use:enhance={() => async ({ update }) => update({ reset: false })}>
					<input type="hidden" name="id" value={c.id} />
					<input type="hidden" name="dir" value="up" />
					<button type="submit" class="act font-mono" disabled={i === 0} aria-label={`Move ${c.kicker} up`}>Up</button>
				</form>
				<form method="POST" action="?/move" use:enhance={() => async ({ update }) => update({ reset: false })}>
					<input type="hidden" name="id" value={c.id} />
					<input type="hidden" name="dir" value="down" />
					<button type="submit" class="act font-mono" disabled={i === data.chapters.length - 1} aria-label={`Move ${c.kicker} down`}>Down</button>
				</form>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => async ({ update }) => {
						arming = null;
						await update();
					}}
				>
					<input type="hidden" name="id" value={c.id} />
					{#if arming === c.id}
						<button type="submit" class="act danger font-mono">Confirm</button>
						<button type="button" class="act font-mono" onclick={() => (arming = null)}>Cancel</button>
					{:else}
						<button type="button" class="act font-mono" onclick={() => (arming = c.id)}>Delete</button>
					{/if}
				</form>
			</div>
		</li>
	{/each}
</ul>

<h2 class="sub font-mono">Add chapter</h2>
<form method="POST" action="?/create" class="add" use:enhance>
	{@render fields(null, errs('new'))}
	<div class="actions">
		<button type="submit" class="act font-mono">Add</button>
	</div>
</form>

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
		background: none;
		padding: 0.5rem 1.25rem;
		cursor: pointer;
		transition: background-color 0.2s ease, color 0.2s ease;
	}
	.new:hover {
		background: var(--accent);
		color: var(--bg);
	}
	.rows {
		list-style: none;
		margin: 0 0 2.5rem;
		padding: 0;
		border-top: 1px solid var(--line);
	}
	.row {
		display: grid;
		gap: 0.75rem;
		padding: 1.25rem 0.25rem;
		border-bottom: 1px solid var(--line);
	}
	.row > form,
	.add {
		display: grid;
		gap: 0.75rem;
	}
	.num {
		margin: 0;
		font-size: 0.6875rem;
		letter-spacing: 0.2em;
		color: var(--accent);
	}
	.sub {
		margin: 0 0 1rem;
		font-size: 0.75rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.field {
		display: grid;
		gap: 0.25rem;
	}
	.lbl {
		font-size: 0.625rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	input,
	textarea,
	select {
		width: 100%;
		background: transparent;
		color: var(--ink);
		border: 1px solid var(--line);
		padding: 0.5rem 0.65rem;
		font: inherit;
	}
	.err {
		font-size: 0.6875rem;
		color: var(--danger);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
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
	.act:disabled {
		opacity: 0.3;
		cursor: default;
	}
	.act.danger {
		color: var(--danger);
	}
	:where(button, input, textarea, select):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
