<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, tick } from 'svelte';
	import { magnetic } from '$lib/actions/magnetic';
	import { validate } from '$lib/contact';
	import { AVAILABILITY, EMAIL, GITHUB_URL, INSTAGRAM_URL, LINKEDIN_URL } from '$lib/site';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const timelines = [
		{ value: 'asap', label: 'ASAP' },
		{ value: '1-3', label: '1-3 months' },
		{ value: 'flexible', label: 'Flexible' }
	];

	let js = $state(false);
	let step = $state(1);
	let sending = $state(false);
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;
	let formEl = $state<HTMLFormElement>();
	let reviewHeading = $state<HTMLHeadingElement>();
	let doneHeading = $state<HTMLHeadingElement>();

	let message = $state(form?.values?.message ?? '');
	let timeline = $state('');
	let name = $state(form?.values?.name ?? '');
	let email = $state(form?.values?.email ?? '');
	let clientErrors = $state<{ message?: string; name?: string; email?: string }>({});

	const errors = $derived({ ...(form?.errors ?? {}), ...clientErrors });
	const timelineLabel = $derived(timelines.find((t) => t.value === timeline)?.label ?? 'Not set');

	onMount(() => {
		js = true;
		if (form?.errors) step = form.errors.message ? 1 : 3;
		return () => clearTimeout(copyTimer);
	});

	$effect(() => {
		if (form?.success) tick().then(() => doneHeading?.focus());
	});

	function check(fields: ('message' | 'name' | 'email')[]) {
		const all = validate({ name, email, message }).errors;
		const picked: typeof clientErrors = {};
		for (const f of fields) if (all[f]) picked[f] = all[f];
		clientErrors = picked;
		return Object.keys(picked).length === 0;
	}

	async function go(to: number) {
		step = to;
		await tick();
		if (to === 1) formEl?.querySelector<HTMLElement>('[name="message"]')?.focus();
		else if (to === 2) formEl?.querySelector<HTMLElement>('[name="timeline"]:checked, [name="timeline"]')?.focus();
		else if (to === 3) formEl?.querySelector<HTMLElement>('[name="name"]')?.focus();
		else reviewHeading?.focus();
	}

	function next() {
		if (step === 1 && !check(['message'])) return;
		if (step === 3 && !check(['name', 'email'])) return;
		go(step + 1);
	}

	function sendAll() {
		if (check(['message'])) {
			if (check(['name', 'email'])) return formEl?.requestSubmit();
			return go(3);
		}
		go(1);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter' || e.isComposing) return;
		const t = e.target as HTMLElement;
		if (t instanceof HTMLTextAreaElement) {
			if (e.metaKey || e.ctrlKey) {
				e.preventDefault();
				sendAll();
			}
			return;
		}
		if (t instanceof HTMLButtonElement || step === 4) return;
		e.preventDefault();
		next();
	}

	async function copyEmail() {
		let ok = false;
		try {
			await navigator.clipboard.writeText(EMAIL);
			ok = true;
		} catch {
			const t = document.createElement('textarea');
			t.value = EMAIL;
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
		copyTimer = setTimeout(() => (copied = false), 2000);
	}

	const show = (n: number) => !js || step === n;
</script>

<svelte:head>
	<title>Connect | Abdul Jawad Azizi</title>
	<meta name="description" content="Tell Abdul Jawad Azizi what you are building. A short brief, then a reply by email." />
</svelte:head>

<main id="main-content" class="page relative text-[var(--ink)]">
	<a href="/" class="back font-hand font-extrabold">Back</a>

	<div class="mx-auto w-full max-w-xl">
		<span class="idx font-mono">CONNECT</span>
		<h1 class="font-hand text-3xl font-extrabold leading-none sm:text-4xl">Let's <span class="text-[var(--accent)]">connect</span></h1>
		<p class="avail mt-3 flex items-center gap-2 text-sm text-[var(--ink-dim)]">
			<span class="dot" aria-hidden="true"></span>{AVAILABILITY}
		</p>

		{#if form?.success}
			<div class="mt-8" role="status">
				<h2 bind:this={doneHeading} tabindex="-1" class="font-hand text-2xl font-extrabold">Brief <span class="text-[var(--accent)]">sent</span></h2>
				<p class="mt-3 text-[var(--ink-dim)]">Thank you. I will reply by email.</p>
				<a href="/" class="mt-6 inline-block underline underline-offset-4">Back to home</a>
			</div>
		{:else}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<form
				bind:this={formEl}
				method="POST"
				class="mt-8"
				novalidate
				{onkeydown}
				use:enhance={() => {
					sending = true;
					return async ({ update }) => {
						await update({ reset: false });
						sending = false;
						if (form?.errors) go(form.errors.message ? 1 : 3);
					};
				}}
			>
				{#if js && step < 4}
					<p class="font-mono text-xs tracking-widest text-[var(--ink-dim)]">STEP {step} OF 3</p>
					<div class="bar" aria-hidden="true"><span style="width: {(step / 3) * 100}%"></span></div>
				{/if}

				<fieldset class="step" hidden={!show(1)}>
					<legend class="q font-hand">What are you building?</legend>
					<label class="sr-only" for="f-message">Describe what you are building</label>
					<textarea
						id="f-message"
						name="message"
						rows="5"
						required
						maxlength="2000"
						bind:value={message}
						placeholder="A few lines is plenty."
						aria-invalid={errors.message ? 'true' : undefined}
						aria-describedby={errors.message ? 'err-message' : undefined}
					></textarea>
					<p id="err-message" class="err" aria-live="polite">{errors.message ?? ''}</p>
				</fieldset>

				<fieldset class="step" hidden={!show(2)}>
					<legend class="q font-hand">Timeline?</legend>
					<div class="chips">
						{#each timelines as t}
							<label class="chip">
								<input type="radio" name="timeline" value={t.value} bind:group={timeline} />
								<span>{t.label}</span>
							</label>
						{/each}
					</div>
					<p class="hint">Optional.</p>
				</fieldset>

				<fieldset class="step" hidden={!show(3)}>
					<legend class="q font-hand">Where do I reply?</legend>
					<div class="grid gap-4 sm:grid-cols-2">
						<label class="field">
							<span>Name</span>
							<input
								name="name"
								autocomplete="name"
								required
								maxlength="80"
								bind:value={name}
								aria-invalid={errors.name ? 'true' : undefined}
								aria-describedby={errors.name ? 'err-name' : undefined}
							/>
							<small id="err-name" class="err" aria-live="polite">{errors.name ?? ''}</small>
						</label>
						<label class="field">
							<span>Email</span>
							<input
								name="email"
								type="email"
								autocomplete="email"
								required
								maxlength="254"
								bind:value={email}
								aria-invalid={errors.email ? 'true' : undefined}
								aria-describedby={errors.email ? 'err-email' : undefined}
							/>
							<small id="err-email" class="err" aria-live="polite">{errors.email ?? ''}</small>
						</label>
					</div>
				</fieldset>

				{#if js && step === 4}
					<section class="step" aria-labelledby="review-h">
						<h2 id="review-h" bind:this={reviewHeading} tabindex="-1" class="q font-hand">Review</h2>
						<dl class="review">
							<dt>Building</dt>
							<dd class="whitespace-pre-wrap break-words">{message}</dd>
							<dt>Timeline</dt>
							<dd>{timelineLabel}</dd>
							<dt>Reply to</dt>
							<dd class="break-words">{name} &lt;{email}&gt;</dd>
						</dl>
					</section>
				{/if}

				<div class="sr-only" aria-hidden="true">
					<label>Website <input name="website" tabindex="-1" autocomplete="off" /></label>
				</div>

				{#if form && 'error' in form && form.error}
					<p role="alert" class="err mt-4">{form.error}</p>
				{/if}

				<div class="mt-6 flex items-center gap-3">
					{#if js && step > 1}
						<button type="button" class="btn ghost font-hand font-extrabold" onclick={() => go(step - 1)}>Back</button>
					{/if}
					{#if js && step < 4}
						<button type="button" use:magnetic class="btn font-hand font-extrabold" onclick={next}>Next</button>
					{:else}
						<button type="submit" use:magnetic class="btn font-hand font-extrabold" disabled={sending}>
							{sending ? 'Sending' : 'Send'}
						</button>
					{/if}
				</div>
			</form>
		{/if}

		<div class="mt-12 border-t border-[var(--line)] pt-6">
			<p class="text-sm text-[var(--ink-dim)]">Or email directly</p>
			<div class="mt-2 flex flex-wrap items-center gap-3">
				<a href="mailto:{EMAIL}" class="break-all underline underline-offset-4">{EMAIL}</a>
				{#if js}
					<button type="button" use:magnetic class="btn copy font-hand font-extrabold" onclick={copyEmail}>
						{copied ? 'Copied' : 'Copy email'}
					</button>
				{/if}
			</div>
			<p class="sr-only" role="status" aria-live="polite">{copied ? 'Email copied to clipboard' : ''}</p>
			<p class="mt-4 flex gap-4 text-sm text-[var(--ink-dim)]">
				<a class="quiet" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
				<a class="quiet" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">LinkedIn</a>
				<a class="quiet" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram</a>
			</p>
		</div>
	</div>
</main>

<style>
	.page { padding: 4.5rem 2.25rem 4rem; min-height: 100dvh; }
	.back { position: absolute; top: 3rem; left: 2.5rem; z-index: 20; }
	.idx { display: block; font-size: 0.75rem; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 0.5rem; }
	.dot { width: 0.5rem; height: 0.5rem; border-radius: 9999px; background: var(--accent); }
	.bar { height: 2px; background: var(--line); margin: 0.5rem 0 1.5rem; }
	.bar span { display: block; height: 100%; background: var(--accent); transition: width 0.3s ease; }
	.step { border: 0; padding: 0; margin: 1.5rem 0 0; min-width: 0; animation: rise 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
	.step[hidden] { display: none; }
	.q { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem; padding: 0; }
	@keyframes rise { from { opacity: 0; transform: translateY(0.5rem); } to { opacity: 1; transform: none; } }
	.field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; color: var(--ink-dim); }
	.field input, textarea {
		background: transparent; color: var(--ink); border: 1px solid var(--line);
		padding: 0.625rem 0.75rem; font: inherit; font-size: 1rem; resize: vertical; width: 100%;
	}
	[aria-invalid='true'] { border-color: var(--danger); }
	.err { color: var(--danger); font-size: 0.875rem; min-height: 1.25rem; margin-top: 0.25rem; }
	.hint { font-size: 0.8125rem; color: var(--ink-dim); margin-top: 0.5rem; }
	.chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	.chip { position: relative; }
	.chip input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
	.chip span { display: inline-block; border: 1px solid var(--line); padding: 0.5rem 1rem; transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
	.chip input:checked + span { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
	.chip input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 2px; }
	.review { display: grid; grid-template-columns: 6rem 1fr; gap: 0.5rem 1rem; }
	.review dt { color: var(--ink-dim); font-size: 0.875rem; }
	.btn { border: 1px solid var(--ink); padding: 0.5rem 1.5rem; min-height: 2.75rem; transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease; }
	.btn.ghost { border-color: var(--line); }
	.btn:active:not(:disabled) { transform: scale(0.97); }
	.btn:hover:not(:disabled) { background: var(--ink); color: var(--bg); }
	.btn:disabled { opacity: 0.5; }
	.copy { border-color: var(--accent); color: var(--accent); }
	.copy:hover:not(:disabled) { background: var(--accent); color: var(--bg); }
	.quiet:hover { color: var(--accent); }
	:where(a, button, input, textarea):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	@media (prefers-reduced-motion: reduce) { .step { animation: none; } .bar span { transition: none; } }
</style>
