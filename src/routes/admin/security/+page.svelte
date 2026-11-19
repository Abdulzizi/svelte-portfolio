<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const setup = $derived(form && 'setup' in form ? form.setup : undefined);
	const codes = $derived(form && 'codes' in form ? form.codes : undefined);
	let acked = $state(false);
	$effect(() => {
		if (codes) acked = false;
	});

	function download() {
		const url = URL.createObjectURL(new Blob([codes!.join('\n') + '\n'], { type: 'text/plain' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = 'recovery-codes.txt';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Security | Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="flex max-w-md flex-col gap-4">
	<h1 class="font-hand text-3xl font-extrabold">Security</h1>
	<p class="font-mono text-sm">Two-factor authentication: {data.enabled ? 'ON' : 'OFF'}</p>

	{#if data.secretError}
		<p class="err" role="alert">The stored 2FA secret cannot be decrypted. Check TOTP_ENCRYPTION_KEY. Admin login is blocked until it is fixed.</p>
	{:else if !data.encryptionConfigured}
		<p class="err" role="alert">Set TOTP_ENCRYPTION_KEY to encrypt the secret at rest.</p>
	{/if}

	{#if form?.error}<p class="err" role="alert">{form.error}</p>{/if}
	{#if form && 'done' in form && form.done}<p role="status">{form.done}</p>{/if}

	{#if codes && !acked}
		<div class="flex flex-col gap-3">
			<p class="text-sm">Save these recovery codes now. Each works once and they will not be shown again.</p>
			<ul class="font-mono text-sm">{#each codes as c (c)}<li>{c}</li>{/each}</ul>
			<div class="flex gap-3">
				<button type="button" class="btn font-hand font-extrabold" onclick={() => navigator.clipboard.writeText(codes.join('\n'))}>Copy</button>
				<button type="button" class="btn font-hand font-extrabold" onclick={download}>Download</button>
				<button type="button" class="btn font-hand font-extrabold" onclick={() => (acked = true)}>I saved them</button>
			</div>
		</div>
	{:else if data.enabled}
		{#if setup}
			<div class="flex flex-col gap-3">
				<h2 class="font-hand text-xl font-extrabold">Replace authenticator</h2>
				<p class="text-sm">Scan this QR code with the new authenticator app, or enter the secret manually.</p>
				<img src={setup.qr} alt="New authenticator QR code" width="220" height="220" />
				<p class="font-mono text-sm break-all">{setup.secret}</p>
				<form method="POST" action="?/enable" use:enhance class="flex flex-col gap-3">
					<input type="hidden" name="secret" value={setup.secret} />
					<label class="field">
						<span>Current 6-digit code</span>
						<input name="currentCode" autocomplete="one-time-code" maxlength="11" required />
					</label>
					<label class="field">
						<span>New authenticator's 6-digit code</span>
						<input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required />
					</label>
					<button class="btn font-hand font-extrabold">Confirm and replace</button>
				</form>
			</div>
		{:else}
			<form method="POST" action="?/start" use:enhance>
				<button class="btn font-hand font-extrabold">Replace authenticator</button>
			</form>
		{/if}
		<form method="POST" action="?/regenerate" use:enhance class="flex flex-col gap-3">
			<label class="field">
				<span>Current 6-digit code or recovery code (regenerate recovery codes)</span>
				<input name="code" autocomplete="one-time-code" maxlength="11" required />
			</label>
			<button class="btn font-hand font-extrabold">Regenerate recovery codes</button>
		</form>
		<form method="POST" action="?/disable" use:enhance class="flex flex-col gap-3">
			<label class="field">
				<span>Current 6-digit code or recovery code</span>
				<input name="code" autocomplete="one-time-code" maxlength="11" required />
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
