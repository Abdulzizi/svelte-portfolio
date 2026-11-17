<script lang="ts">
	import { page } from '$app/state';

	const siteTitle = 'Abdul Jawad Azizi';
	const siteDescription = 'Abdul Jawad Azizi, full stack developer. Work, contact, about and blog.';

	const og = $derived(page.data.og as { title?: string; description?: string } | undefined);
	const title = $derived(og?.title ?? siteTitle);
	const description = $derived(og?.description ?? siteDescription);
	const image = $derived(
		`${page.url.origin}/og?title=${encodeURIComponent(title)}&sub=${encodeURIComponent(description)}`
	);
	const skip = $derived(page.url.pathname.startsWith('/admin'));
</script>

<svelte:head>
	{#if !skip}
		<meta property="og:title" content={title} />
		<meta property="og:description" content={description} />
		<meta property="og:type" content="website" />
		<meta property="og:url" content={page.url.href} />
		<meta property="og:image" content={image} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
</svelte:head>
