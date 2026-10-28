<script lang="ts">
	import { reveal } from '$lib/actions/reveal';

	const stack = ['TypeScript', 'SvelteKit', 'Tailwind', 'Node.js'];
</script>

<section id="about" class="mx-auto w-full max-w-3xl px-6 py-16">
	<div
		use:reveal
		class="relative rounded-lg p-6 sm:p-8"
		style="background: var(--surface); border: 1px solid var(--line); background-image: repeating-linear-gradient(transparent 0 27px, var(--line) 27px 28px);"
	>
		<span
			aria-hidden="true"
			class="absolute -top-3 left-8 h-6 w-20 -rotate-2 rounded-sm opacity-80"
			style="background: var(--accent-soft); border: 1px solid var(--line);"
		></span>
		<h2 class="text-2xl font-bold" style="font-family: var(--font-ink); color: var(--ink);">
			About
		</h2>
		<p class="mt-4 leading-7" style="color: var(--ink-dim);">
			I'm Abdul Jawad Azizi, a Full Stack Developer who enjoys turning rough ideas into
			simple, working software. I care about clean interfaces and small, readable code.
			Currently exploring and open to new opportunities.
		</p>
		<ul class="mt-5 flex flex-wrap gap-2" aria-label="Tech stack">
			{#each stack as s}
				<li
					class="rounded px-2.5 py-1 font-mono text-xs"
					style="border: 1px solid var(--line); color: var(--accent); background: var(--accent-soft);"
				>
					{s}
				</li>
			{/each}
		</ul>
	</div>
</section>
