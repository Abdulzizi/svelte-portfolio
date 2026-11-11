<script lang="ts">
	import { MAX_IMAGE_BYTES } from '$lib/images';
	import { onMount } from 'svelte';

	let { name = 'body', value = '' }: { name?: string; value?: string } = $props();

	// Mirrored into a hidden input so it posts with the form.
	// svelte-ignore state_referenced_locally -- initial value is the intent
	let html = $state(value);
	// Active marks/nodes, for toolbar highlight state.
	let active = $state<Record<string, boolean>>({});

	let element: HTMLDivElement;
	// caveman: `any` for the TipTap Editor instance — types live behind a dynamic
	// import that must stay out of the module graph so TipTap never enters a public
	// bundle. Upgrade to the real type with `import type { Editor }` if a typed-only
	// import is proven tree-shaken from client chunks.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let editor: any = null;

	function syncActive() {
		if (!editor) return;
		active = {
			bold: editor.isActive('bold'),
			italic: editor.isActive('italic'),
			bulletList: editor.isActive('bulletList'),
			orderedList: editor.isActive('orderedList'),
			h2: editor.isActive('heading', { level: 2 }),
			h3: editor.isActive('heading', { level: 3 }),
			link: editor.isActive('link')
		};
	}

	onMount(() => {
		// Browser-only, lazy: dynamic import keeps TipTap out of the module graph of
		// any statically-imported chunk, so it ships only in this admin-only lazy chunk.
		let destroyed = false;
		(async () => {
			const { Editor } = await import('@tiptap/core');
			const StarterKit = (await import('@tiptap/starter-kit')).default;
			const Image = (await import('@tiptap/extension-image')).default;
			if (destroyed) return;
			editor = new Editor({
				element,
				extensions: [
					StarterKit.configure({
						heading: { levels: [2, 3] },
						blockquote: false,
						code: false,
						codeBlock: false,
						strike: false,
						underline: false,
						horizontalRule: false,
						link: { openOnClick: false }
					}),
					Image
				],
				content: value,
				onUpdate: ({ editor: ed }) => {
					html = ed.getHTML();
					syncActive();
				},
				onSelectionUpdate: syncActive,
				onTransaction: syncActive
			});
			syncActive();
		})();
		return () => {
			destroyed = true;
			editor?.destroy();
			editor = null;
		};
	});

	function cmd(fn: (chain: any) => any) {
		if (!editor) return;
		fn(editor.chain().focus()).run();
		syncActive();
	}

	let fileInput: HTMLInputElement;
	let uploading = $state(false);
	let imageError = $state('');

	async function onImagePicked(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file || !editor) return;
		imageError = '';
		if (file.size > MAX_IMAGE_BYTES) {
			imageError = 'Image must be 4 MB or smaller.';
			return;
		}
		const alt = window.prompt('Alt text (describe the image):') ?? '';
		uploading = true;
		try {
			const body = new FormData();
			body.set('image', file);
			const res = await fetch('/admin/upload', { method: 'POST', body });
			const data = await res.json().catch(() => ({}));
			if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed.');
			editor.chain().focus().setImage({ src: data.url, alt }).run();
		} catch (err) {
			imageError = err instanceof Error ? err.message : 'Upload failed.';
		} finally {
			uploading = false;
		}
	}

	function toggleLink() {
		if (!editor) return;
		if (editor.isActive('link')) {
			editor.chain().focus().unsetLink().run();
			syncActive();
			return;
		}
		const url = window.prompt('Link URL (http/https/mailto):');
		if (!url) return;
		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
		syncActive();
	}
</script>

<div class="editor">
	<div class="toolbar font-mono" role="toolbar" aria-label="Text formatting">
		<button type="button" class:on={active.bold} onclick={() => cmd((c) => c.toggleBold())}>
			B
		</button>
		<button type="button" class:on={active.italic} onclick={() => cmd((c) => c.toggleItalic())}>
			I
		</button>
		<button type="button" class:on={active.h2} onclick={() => cmd((c) => c.toggleHeading({ level: 2 }))}>
			H2
		</button>
		<button type="button" class:on={active.h3} onclick={() => cmd((c) => c.toggleHeading({ level: 3 }))}>
			H3
		</button>
		<button type="button" class:on={active.bulletList} onclick={() => cmd((c) => c.toggleBulletList())}>
			UL
		</button>
		<button type="button" class:on={active.orderedList} onclick={() => cmd((c) => c.toggleOrderedList())}>
			OL
		</button>
		<button type="button" class:on={active.link} onclick={toggleLink}>LINK</button>
		<button type="button" disabled={uploading} onclick={() => fileInput.click()}>
			{uploading ? 'Uploading…' : 'Image'}
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept="image/jpeg,image/png,image/webp"
			hidden
			onchange={onImagePicked}
		/>
	</div>

	{#if imageError}
		<p class="error font-mono" role="alert">{imageError}</p>
	{/if}

	<!-- TipTap mounts into this container in the browser; empty/placeholder on SSR. -->
	<div class="content font-sans" bind:this={element}></div>

	<!-- Mirror HTML so it posts with the form. -->
	<input type="hidden" {name} value={html} />
</div>

<style>
	.editor {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--line);
	}
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.375rem;
		border-bottom: 1px solid var(--line);
	}
	.toolbar button {
		font-size: 0.625rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--ink-dim);
		background: transparent;
		border: 1px solid var(--line);
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		transition: color 0.2s ease, border-color 0.2s ease;
	}
	.toolbar button:hover {
		color: var(--ink);
	}
	.toolbar button.on {
		color: var(--accent);
		border-color: var(--accent);
	}
	.error {
		font-size: 0.75rem;
		color: var(--accent);
		padding: 0.375rem 0.75rem;
		border-bottom: 1px solid var(--line);
	}
	.toolbar button:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.content :global(img) {
		max-width: 100%;
		height: auto;
	}
	.content {
		min-height: 10rem;
		padding: 0.75rem;
		color: var(--ink);
		font-size: 1rem;
		line-height: 1.6;
	}
	/* TipTap renders a nested contenteditable; let it fill the area. */
	.content :global(.ProseMirror) {
		outline: none;
		min-height: 8.5rem;
	}
	.content :global(.ProseMirror:focus) {
		outline: none;
	}
	.content :global(a) {
		color: var(--accent);
	}
	.content :global(h2),
	.content :global(h3) {
		font-family: var(--font-hand);
		font-weight: 800;
		line-height: 1.1;
	}
	.content :global(ul),
	.content :global(ol) {
		padding-left: 1.5rem;
	}
	.content :global(ul) {
		list-style: disc;
	}
	.content :global(ol) {
		list-style: decimal;
	}
	.editor:focus-within {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.toolbar button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
