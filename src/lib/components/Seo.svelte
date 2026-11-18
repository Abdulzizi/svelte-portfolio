<script lang="ts">
	import { page } from '$app/state';
	import { SITE_URL } from '$lib/site';

	const siteTitle = 'Abdul Jawad Azizi';
	const siteDescription = 'Abdul Jawad Azizi, full stack developer. Work, contact, about and blog.';

	const og = $derived(page.data.og as { title?: string; description?: string } | undefined);
	const title = $derived(og?.title ?? siteTitle);
	const description = $derived(og?.description ?? siteDescription);
	const origin = $derived(
		page.url.origin === 'http://sveltekit-prerender' ? SITE_URL : page.url.origin
	);
	const image = $derived(`${origin}/og?path=${encodeURIComponent(page.url.pathname)}`);
	const skip = $derived(page.url.pathname.startsWith('/admin'));
</script>

<svelte:head>
	{#if !skip}
		<meta property="og:title" content={title} />
		<meta property="og:description" content={description} />
		<meta property="og:type" content="website" />
		<meta property="og:url" content={`${origin}${page.url.pathname}`} />
		<meta property="og:image" content={image} />
		<meta name="twitter:card" content="summary_large_image" />
		<link rel="alternate" type="application/rss+xml" title="Abdul Jawad Azizi blog" href="/blog/rss.xml" />
	{/if}
</svelte:head>
