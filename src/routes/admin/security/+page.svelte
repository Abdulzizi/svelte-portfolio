<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const setup = $derived(form && 'setup' in form ? form.setup : undefined);
</script>

<svelte:head>
	<title>Security | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="flex max-w-md flex-col gap-4">
	<h1 class="font-hand text-3xl font-extrabold">Security</h1>
	<p class="font-mono text-sm">Two-factor authentication: {data.enabled ? 'ON' : 'OFF'}</p>

	{#if form?.error}<p class="err" role="alert">{form.error}</p>{/if}
	{#if form && 'done' in form && form.done}<p role="status">{form.done}</p>{/if}

	{#if data.enabled}
		<form method="POST" action="?/disable" use:enhance class="flex flex-col gap-3">
			<label class="field">
				<span>Current 6-digit code</span>
				<input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required />
			</label>
			<button class="btn font-hand font-extrabold">Disable</button>
		</form>
	{:else if setup}
		<img src={setup.qr} alt="TOTP QR code" width="220" height="220" />
		<p class="font-mono text-sm break-all">{setup.secret}</p>
		<form method="POST" action="?/enable" use:enhance class="flex flex-col gap-3">
			<input type="hidden" name="secret" value={setup.secret} />
			<label class="field">
				<span>Confirm with 6-digit code</span>
				<input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required />
			</label>
			<button class="btn font-hand font-extrabold">Confirm and enable</button>
		</form>
	{:else}
		<form method="POST" action="?/start" use:enhance>
			<button class="btn font-hand font-extrabold">Enable</button>
		</form>
	{/if}
</section>

<style>
	.field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; color: var(--ink-dim); }
	.field input { background: transparent; color: var(--ink); border: 1px solid var(--line); padding: 0.625rem 0.75rem; font: inherit; }
	.btn { border: 1px solid var(--accent); color: var(--accent); padding: 0.5rem 1.5rem; align-self: flex-start; }
	.btn:hover { background: var(--accent); color: var(--bg); }
	.err { color: var(--danger); }
</style>
