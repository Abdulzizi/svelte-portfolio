<script lang="ts">
	import { reveal } from '$lib/actions/reveal';

	const stack = ['TypeScript', 'SvelteKit', 'Tailwind', 'Node.js'];
</script>

<section id="about" class="mx-auto w-full max-w-none px-6 sm:px-12 py-16">
	<div use:reveal class="relative pt-6" style="border-top: 1px solid var(--line);">
		<div class="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-8 items-start">
			<h2 class="font-hand text-xs uppercase tracking-[0.15em]" style="color: var(--ink-dim);">About</h2>
			<div>
				<p class="font-sans text-base leading-7" style="color: var(--ink);">
					I'm Abdul Jawad Azizi, a Full Stack Developer who turns rough ideas into simple, working software. Care about clean interfaces and small, readable code. Currently exploring and open to new opportunities.
				</p>
				<ul class="mt-6 flex flex-wrap gap-x-4 gap-y-1 font-hand text-sm" aria-label="Tech stack" style="color: var(--accent);">
					{#each stack as s}
						<li>{s}</li>
					{/each}
				</ul>
			</div>
		</div>
		<div use:reveal class="mt-16 pt-6" style="border-top: 1px solid var(--line);">
			<blockquote class="font-hand text-3xl sm:text-5xl leading-[1.05]" style="color: var(--ink);">
				“The role of the creative is to make the revolution irresistible.”
			</blockquote>
			<p class="mt-4 font-sans text-sm" style="color: var(--ink-dim);">— Toni Cade Bambara</p>
		</div>
	</div>
</section>
