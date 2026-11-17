<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { magnetic } from '$lib/actions/magnetic';
		import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const s = $derived(data.settings);

	let sending = $state(false);
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	const errors = $derived(form?.errors ?? {});

	onMount(() => () => clearTimeout(copyTimer));

	async function copyEmail() {
		let ok = false;
		try {
			await navigator.clipboard.writeText(s.email);
			ok = true;
		} catch {
			const t = document.createElement('textarea');
			t.value = s.email;
			t.setAttribute('readonly', '');
			t.style.position = 'fixed';
			t.style.opacity = '0';
			document.body.appendChild(t);
			t.select();
			try {
				ok = document.execCommand('copy');
			} catch {
				ok = false;
			}
			t.remove();
		}
		if (!ok) return;
		copied = true;
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 1800);
	}
</script>

<svelte:head>
	<title>Connect | Abdul Jawad Azizi</title>
	<meta name="description" content="Email Abdul Jawad Azizi directly or send a short message." />
</svelte:head>

<main id="main-content" class="page relative text-[var(--ink)]">
	<a href="/" class="back font-hand font-extrabold">Back</a>

	<div class="wrap">
		<h1 class="title font-hand font-extrabold">Connect</h1>

		<button type="button" use:magnetic class="mail font-hand font-extrabold" onclick={copyEmail} aria-label="Copy email address {s.email}">
			{copied ? 'Copied' : s.email}
		</button>
		<p class="sr-only" role="status" aria-live="polite">{copied ? 'Email copied to clipboard' : ''}</p>
		<a class="alt" href="mailto:{s.email}">or open in mail app</a>

		{#if form?.success}
			<div class="done" role="status">
				<p class="font-hand text-2xl font-extrabold">Message <span class="text-[var(--accent)]">sent</span></p>
				<p class="mt-2 text-[var(--ink-dim)]">Thank you. I will reply by email.</p>
			</div>
		{:else}
			<form
				method="POST"
				class="msg"
				novalidate
				use:enhance={() => {
					sending = true;
					return async ({ update }) => {
						await update({ reset: false });
						sending = false;
					};
				}}
			>
				<div class="row">
					<label class="field">
						<span>Name</span>
						<input
							name="name"
							autocomplete="name"
							required
							maxlength="80"
							value={form?.values?.name ?? ''}
							aria-invalid={errors.name ? 'true' : undefined}
							aria-describedby={errors.name ? 'err-name' : undefined}
						/>
						<small id="err-name" class="err">{errors.name ?? ''}</small>
					</label>
					<label class="field">
						<span>Email</span>
						<input
							name="email"
							type="email"
							autocomplete="email"
							required
							maxlength="254"
							value={form?.values?.email ?? ''}
							aria-invalid={errors.email ? 'true' : undefined}
							aria-describedby={errors.email ? 'err-email' : undefined}
						/>
						<small id="err-email" class="err">{errors.email ?? ''}</small>
					</label>
				</div>
				<label class="field">
					<span>Message</span>
					<textarea
						name="message"
						rows="3"
						required
						maxlength="2000"
						aria-invalid={errors.message ? 'true' : undefined}
						aria-describedby={errors.message ? 'err-message' : undefined}>{form?.values?.message ?? ''}</textarea
					>
					<small id="err-message" class="err">{errors.message ?? ''}</small>
				</label>

				<div class="sr-only" aria-hidden="true">
					<label>Website <input name="website" tabindex="-1" autocomplete="off" /></label>
				</div>

				<div class="send">
					<button type="submit" use:magnetic class="btn font-hand font-extrabold" disabled={sending}>
						{sending ? 'Sending…' : 'Send'}
					</button>
					<p class="status err" role="status" aria-live="polite">
						{#if form && 'error' in form && form.error}{form.error}{/if}
					</p>
				</div>
			</form>
		{/if}

		<footer class="foot">
			<p class="flex items-center gap-2 text-sm text-[var(--ink-dim)]">
				<span class="dot" aria-hidden="true"></span>{s.availability}
			</p>
			<p class="links">
				<a href={s.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
				<a href={s.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>
				<a href={s.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>
			</p>
		</footer>
	</div>
</main>

<style>
	.page { padding: 6rem 1.25rem 3rem; min-height: 100dvh; display: flex; }
	.back { position: absolute; top: 3rem; left: 2.5rem; z-index: 20; padding: 0.25rem 0; }
	.wrap { width: 100%; max-width: 78rem; margin: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; }
	.title { font-size: clamp(1.75rem, 4vw, 2.5rem); line-height: 1; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 1.5rem; }
	.mail {
		font-size: clamp(1.5rem, 7vw, 7vw); line-height: 1.05; letter-spacing: -0.03em; text-align: left;
		min-height: 2.75rem; padding: 0.25rem 0; max-width: 100%; overflow-wrap: anywhere;
		color: var(--ink); background: none; border: 0; border-bottom: 2px solid var(--line);
		transition: color 0.2s ease, border-color 0.2s ease;
	}
	.mail:hover { color: var(--accent); border-color: var(--accent); }
	.mail:active { opacity: 0.8; }
	.alt { display: inline-flex; align-items: center; min-height: 2.75rem; font-size: 0.875rem; color: var(--ink-dim); text-decoration: underline; text-underline-offset: 4px; }
	.alt:hover, .links a:hover { color: var(--accent); }
	.msg { width: 100%; max-width: 40rem; margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
	.row { display: grid; gap: 0.75rem; grid-template-columns: 1fr; }
	.field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; color: var(--ink-dim); }
	.field input, textarea {
		background: var(--surface); color: var(--ink); border: 1px solid var(--line);
		padding: 0.625rem 0.75rem; min-height: 2.75rem; font: inherit; font-size: 1rem; resize: vertical; width: 100%;
	}
	.field input:hover, textarea:hover { border-color: var(--ink-dim); }
	[aria-invalid='true'] { border-color: var(--danger); }
	.err { color: var(--danger); font-size: 0.875rem; min-height: 1.1rem; }
	.send { display: flex; align-items: center; gap: 1rem; }
	.status { margin: 0; }
	.btn { border: 1px solid var(--ink); padding: 0.5rem 1.75rem; min-height: 2.75rem; transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease; }
	.btn:hover:not(:disabled) { background: var(--ink); color: var(--bg); }
	.btn:active:not(:disabled) { transform: scale(0.97); }
	.btn:disabled { opacity: 0.5; }
	.done { margin-top: 1.5rem; }
	.foot { margin-top: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 1.5rem; width: 100%; }
	.dot { width: 0.5rem; height: 0.5rem; border-radius: 9999px; background: var(--accent); }
	.links { display: flex; gap: 0.25rem; font-size: 0.875rem; color: var(--ink-dim); }
	.links a { display: inline-flex; align-items: center; min-height: 2.75rem; padding: 0 0.5rem; text-decoration: none; }
	.links a:hover { text-decoration: underline; text-underline-offset: 4px; }
	:where(a, button, input, textarea):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	@media (min-width: 640px) { .row { grid-template-columns: 1fr 1fr; } }
	@media (min-width: 1024px) { .page { padding: 6rem 2.5rem 3rem; } }
	@media (prefers-reduced-motion: reduce) { .mail, .btn { transition: none; } }
</style>
