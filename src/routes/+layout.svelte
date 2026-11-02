<script lang="ts">
	import '../app.css';
	import Marquee from '$lib/components/Marquee.svelte';

	let { children } = $props();
</script>

<div class="relative">
	<Marquee axis="x" position="top" />
	<Marquee axis="x" position="bottom" />
	<Marquee axis="y" position="left" />
	<Marquee axis="y" position="right" />
	{@render children()}
</div>
