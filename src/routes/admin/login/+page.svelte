<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Admin login | Abdul Jawad Azizi</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="wrap">
	<div class="card">
		<span class="idx font-mono">ADMIN</span>
		<h1 class="font-hand text-3xl font-extrabold leading-none">Sign <span class="text-[var(--accent)]">in</span></h1>

		<form
			method="POST"
			class="mt-6 flex flex-col gap-4"
			novalidate
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<label class="field" for="email">
				<span>Email</span>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="username"
					required
					value={form?.email ?? ''}
				/>
			</label>

			<label class="field" for="password">
				<span>Password</span>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
				/>
			</label>

			<div class="flex items-center gap-4">
				<button type="submit" class="send font-hand font-extrabold" disabled={submitting}>
					{submitting ? 'Signing in' : 'Sign in'}
				</button>
				<p role="status" aria-live="polite" class="text-sm">
					{#if form?.error}<span class="err">{form.error}</span>{/if}
				</p>
			</div>
		</form>

		<a href="/" class="back font-mono">← Back</a>
	</div>
</main>

<style>
	.wrap { min-height: 100dvh; display: grid; place-items: center; padding: 2rem; }
	.card { width: 100%; max-width: 22rem; }
	.idx { display: block; font-size: 0.75rem; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 0.5rem; }
	.field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; color: var(--ink-dim); }
	.field input {
		background: transparent; color: var(--ink); border: 1px solid var(--line);
		padding: 0.625rem 0.75rem; font: inherit; font-size: 1rem;
	}
	.send { border: 1px solid var(--accent); color: var(--accent); padding: 0.5rem 1.5rem; transition: background-color 0.2s ease, color 0.2s ease; }
	.send:hover:not(:disabled) { background: var(--accent); color: var(--bg); }
	.send:disabled { opacity: 0.5; }
	.err { color: var(--danger); }
	.back { display: inline-block; margin-top: 2rem; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-dim); transition: color 0.2s ease; }
	.back:hover { color: var(--ink); }
	:where(a, button, input):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
