<script lang="ts">
	import { enhance } from '$app/forms';
	import SlidePage from '$lib/components/SlidePage.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const links = [
		{ label: 'Email', text: 'jawadabdul307@gmail.com', href: 'mailto:jawadabdul307@gmail.com' },
		{ label: 'GitHub', text: 'Abdulzizi', href: 'https://github.com/Abdulzizi' },
		{ label: 'LinkedIn', text: 'abduljawadazizi07', href: 'https://www.linkedin.com/in/abduljawadazizi07/' },
		{ label: 'Instagram', text: '@sundirthebadgoy', href: 'https://instagram.com/sundirthebadgoy' }
	];

	let index = $state(0);
	let sending = $state(false);
</script>

<svelte:head>
	<title>Connect | Abdul Jawad Azizi</title>
	<meta name="description" content="Contact Abdul Jawad Azizi: send a message or find him on GitHub, LinkedIn and Instagram." />
</svelte:head>

<SlidePage
	bind:index
	count={2}
	headingIds={['msg-heading', 'links-heading']}
	arrowLabel={index === 0 ? 'Show links' : 'Show message form'}
>
	{#snippet children({ wide, index })}
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
	{/snippet}
</SlidePage>

<style>
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
</style>
