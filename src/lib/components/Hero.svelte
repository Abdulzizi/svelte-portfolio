<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
</script>

<section use:reveal class="mx-auto flex min-h-[82svh] w-full max-w-3xl flex-col justify-center px-6 py-16">
	<p
		class="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 font-mono text-xs"
		style="background: var(--accent-soft); color: var(--accent); border: 1px solid var(--line);"
	>
		<span aria-hidden="true">✳</span>
		<span>{'{{still finding}}'}</span>
	</p>

	<h1
		class="relative w-fit text-5xl font-bold leading-[1.05] sm:text-6xl"
		style="font-family: var(--font-ink); color: var(--ink);"
	>
		Abdul Jawad Azizi
	</h1>

	<p
		class="mt-8 inline-flex w-fit rounded px-2 py-1 font-mono text-sm"
		style="color: var(--ink-dim); border: 1px dashed var(--line);"
	>
		Full Stack Developer
	</p>

	<div class="mt-8 flex items-center gap-4">
		<a
			href="#about"
			class="rounded-full px-5 py-2.5 text-sm font-semibold"
			style="background: var(--accent); color: var(--bg);"
		>
			About me ↓
		</a>
	</div>
</section>
