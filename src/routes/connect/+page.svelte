<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const links = [
		{ label: 'Email', text: 'jawadabdul307@gmail.com', href: 'mailto:jawadabdul307@gmail.com' },
		{ label: 'GitHub', text: 'Abdulzizi', href: 'https://github.com/Abdulzizi' },
		{ label: 'LinkedIn', text: 'abduljawadazizi07', href: 'https://www.linkedin.com/in/abduljawadazizi07/' },
		{ label: 'Instagram', text: '@sundirthebadgoy', href: 'https://instagram.com/sundirthebadgoy' }
	];

	let index = $state(0);
	let wide = $state(false);
	let sending = $state(false);

	// caveman: one media query decides "one viewport" layout; below it slides stack and page scrolls. Upgrade: container query.
	$effect(() => {
		const mq = matchMedia('(min-width: 1024px) and (min-height: 640px)');
		const sync = () => (wide = mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	async function onkeydown(e: KeyboardEvent) {
		if (!wide) return;
		const t = e.target as HTMLElement;
		if (t.matches('input, textarea')) return;
		if (e.key === 'ArrowRight') {
			index = 1;
			await tick();
			document.getElementById('links-heading')?.focus();
		}
		if (e.key === 'ArrowLeft') {
			index = 0;
			await tick();
			document.getElementById('msg-heading')?.focus();
		}
	}
</script>

<svelte:head>
	<title>Connect | Abdul Jawad Azizi</title>
	<meta name="description" content="Contact Abdul Jawad Azizi: send a message or find him on GitHub, LinkedIn and Instagram." />
</svelte:head>

<svelte:window {onkeydown} />

<main class="page relative text-[var(--ink)]" class:flipped={index === 1} style="--i: {index}">
	<a href="/" class="back font-hand font-extrabold">Back</a>

	<div class="viewport">
		<div class="track">
			<section class="slide" aria-label="Message" inert={wide && index !== 0}>
				<div class="mx-auto w-full max-w-md">
					<h1 id="msg-heading" tabindex="-1" class="font-hand text-3xl font-extrabold leading-none">Connect</h1>
					<p class="mt-3 text-[var(--ink-dim)]">Send a message and I will reply by email.</p>

					<form
						method="POST"
						class="mt-6 flex flex-col gap-4"
						novalidate
						use:enhance={() => {
							sending = true;
							return async ({ update }) => {
								await update();
								sending = false;
							};
						}}
					>
						<label class="field">
							<span>Name</span>
							<input
								name="name"
								autocomplete="name"
								required
								maxlength="80"
								value={form?.values?.name ?? ''}
								aria-invalid={form?.errors?.name ? 'true' : undefined}
								aria-describedby={form?.errors?.name ? 'err-name' : undefined}
							/>
							{#if form?.errors?.name}<small id="err-name" class="err">{form.errors.name}</small>{/if}
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
								aria-invalid={form?.errors?.email ? 'true' : undefined}
								aria-describedby={form?.errors?.email ? 'err-email' : undefined}
							/>
							{#if form?.errors?.email}<small id="err-email" class="err">{form.errors.email}</small>{/if}
						</label>

						<label class="field">
							<span>Message</span>
							<textarea
								name="message"
								rows="4"
								required
								maxlength="2000"
								aria-invalid={form?.errors?.message ? 'true' : undefined}
								aria-describedby={form?.errors?.message ? 'err-message' : undefined}>{form?.values?.message ?? ''}</textarea
							>
							{#if form?.errors?.message}<small id="err-message" class="err">{form.errors.message}</small>{/if}
						</label>

						<!-- Honeypot: humans never see or tab to it. -->
						<div class="sr-only" aria-hidden="true">
							<label>Website <input name="website" tabindex="-1" autocomplete="off" /></label>
						</div>

						<div class="flex items-center gap-4">
							<button type="submit" class="send font-hand font-extrabold" disabled={sending}>
								{sending ? 'Sending' : 'Send'}
							</button>
							<p role="status" aria-live="polite" class="text-sm">
								{#if form?.success}
									<span class="text-[var(--accent)]">Sent. Thank you.</span>
								{:else if form && 'error' in form && form.error}
									<span class="err">{form.error}</span>
								{/if}
							</p>
						</div>
					</form>
				</div>
			</section>

			<section class="slide" aria-label="Links" inert={wide && index !== 1}>
				<div class="mx-auto w-full max-w-md">
					<h2 id="links-heading" tabindex="-1" class="font-hand text-3xl font-extrabold leading-none">Elsewhere</h2>
					<ul class="mt-6 flex flex-col">
						{#each links as l}
							<li class="border-b border-[var(--line)] first:border-t">
								<a
									href={l.href}
									class="link flex items-baseline justify-between gap-4 py-3"
									{...l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}}
								>
									<span class="font-hand font-extrabold">{l.label}</span>
									<span class="truncate text-[var(--ink-dim)]">{l.text}</span>
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</section>
		</div>
	</div>

	<button
		type="button"
		class="arrow"
		aria-label={index === 0 ? 'Show links' : 'Show message form'}
		onclick={() => (index = index === 0 ? 1 : 0)}
	>
		<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path d="M9 5l7 7-7 7" />
		</svg>
	</button>
</main>

<style>
	/* Base (small / short screens): stacked, normal page scroll, clear of the 32px/24px marquee bars. */
	.page { padding: 4.5rem 2.25rem 4rem; min-height: 100dvh; }
	.back { position: absolute; top: 2.75rem; left: 2.25rem; }
	.track { display: flex; flex-direction: column; gap: 4rem; }
	.arrow { display: none; }

	.field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; color: var(--ink-dim); }
	.field input, .field textarea {
		background: transparent; color: var(--ink); border: 1px solid var(--line);
		padding: 0.625rem 0.75rem; font: inherit; font-size: 1rem; resize: none;
	}
	.field [aria-invalid='true'] { border-color: var(--danger); }
	.err { color: var(--danger); }
	.send { border: 1px solid var(--ink); padding: 0.5rem 1.5rem; transition: background-color 0.2s ease, color 0.2s ease; }
	.send:hover:not(:disabled) { background: var(--ink); color: var(--bg); }
	.send:disabled { opacity: 0.5; }
	.link { transition: opacity 0.2s ease; }
	.link:hover { opacity: 0.7; }
	:where(a, button, input, textarea):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

	/* One viewport, no scroll, sideways slides. */
	@media (min-width: 1024px) and (min-height: 640px) {
		.page { height: 100dvh; min-height: 0; overflow: hidden; padding: 3rem 2.5rem; }
		.back { top: 3rem; left: 2.5rem; }
		.viewport { height: 100%; overflow: hidden; }
		.track {
			flex-direction: row; gap: 0; width: 200%; height: 100%;
			transform: translateX(calc(var(--i) * -50%));
			transition: transform 0.5s ease;
		}
		.slide { flex: 0 0 50%; display: flex; align-items: center; padding: 0 2rem; overflow-y: auto; }
		.arrow {
			display: flex; align-items: center; justify-content: center;
			position: absolute; right: 2.5rem; top: 50%; margin-top: -1.5rem;
			width: 3rem; height: 3rem; border: 1px solid var(--line); color: var(--ink);
			transition: transform 0.5s ease, opacity 0.2s ease;
		}
		.arrow:hover { opacity: 0.7; }
		.flipped .arrow { transform: rotate(180deg); }
	}

	@media (prefers-reduced-motion: reduce) {
		.track, .arrow { transition: none; }
	}
</style>
