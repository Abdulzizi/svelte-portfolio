<script lang="ts">
	import { page } from '$app/state';
	import { motionPref, motionOff } from '$lib/motion-pref.svelte';

	let fine = $state(false);
	let label = $state('');
	let seen = $state(false);
	let pressed = $state(false);
	let refract = $state(false);
	let ring: HTMLDivElement | undefined = $state();

	const stops = [255, 193, 155, 136, 129, 128, 127, 120, 101, 63, 1];
	const gradient = (id: string, horizontal: boolean) =>
		`<linearGradient id='${id}' x2='${horizontal ? 1 : 0}' y2='${horizontal ? 0 : 1}'>` +
		stops
			.map(
				(v, i) =>
					`<stop offset='${i / 10}' stop-color='rgb(${horizontal ? `${v},0,0` : `0,${v},0`})'/>`
			)
			.join('') +
		`</linearGradient>`;
	const lensMap =
		'data:image/svg+xml,' +
		encodeURIComponent(
			`<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 1 1' preserveAspectRatio='none'><defs>${gradient('x', true)}${gradient('y', false)}</defs><rect width='1' height='1' fill='#000'/><rect width='1' height='1' fill='url(#x)'/><rect width='1' height='1' fill='url(#y)' style='mix-blend-mode:screen'/></svg>`
		);

	const active = $derived(
		fine && !page.url.pathname.startsWith('/admin') && !(motionPref.off || motionOff())
	);

	$effect(() => {
		fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
		refract = /Chrome\//.test(navigator.userAgent);
	});

	$effect(() => {
		if (!active || !seen) return;
		document.documentElement.setAttribute('data-custom-cursor', '');
		return () => document.documentElement.removeAttribute('data-custom-cursor');
	});

	$effect(() => {
		if (!active || !ring) return;
		const el = ring;
		let tx = 0;
		let ty = 0;
		let x = 0;
		let y = 0;
		let raf = 0;
		let first = true;

		const frame = () => {
			x += (tx - x) * 0.2;
			y += (ty - y) * 0.2;
			el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
			raf = requestAnimationFrame(frame);
		};
		const start = () => {
			if (!raf) raf = requestAnimationFrame(frame);
		};
		const stop = () => {
			cancelAnimationFrame(raf);
			raf = 0;
		};
		const move = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse') return;
			tx = e.clientX;
			ty = e.clientY;
			if (first) {
				x = tx;
				y = ty;
				first = false;
			}
			seen = true;
			label =
				(e.target instanceof Element
					? e.target.closest<HTMLElement>('[data-cursor]')?.dataset.cursor
					: '') ?? '';
			start();
		};
		const leave = () => {
			seen = false;
			pressed = false;
			label = '';
			stop();
		};
		const down = (e: PointerEvent) => {
			if (e.pointerType === 'mouse') pressed = true;
		};
		const up = () => (pressed = false);
		const visibility = () => (document.hidden ? leave() : undefined);

		addEventListener('pointermove', move, { passive: true });
		addEventListener('pointerdown', down, { passive: true });
		addEventListener('pointerup', up, { passive: true });
		document.documentElement.addEventListener('mouseleave', leave);
		document.addEventListener('visibilitychange', visibility);
		return () => {
			stop();
			seen = false;
			pressed = false;
			removeEventListener('pointermove', move);
			removeEventListener('pointerdown', down);
			removeEventListener('pointerup', up);
			document.documentElement.removeEventListener('mouseleave', leave);
			document.removeEventListener('visibilitychange', visibility);
		};
	});
</script>

{#if active}
	<svg width="0" height="0" aria-hidden="true" style="position:absolute">
		<filter
			id="lens"
			x="0"
			y="0"
			width="1"
			height="1"
			filterUnits="objectBoundingBox"
			primitiveUnits="objectBoundingBox"
			color-interpolation-filters="sRGB"
		>
			<feImage
				href={lensMap}
				result="map"
				x="0"
				y="0"
				width="100%"
				height="100%"
				preserveAspectRatio="none"
			/>
			<feDisplacementMap
				in="SourceGraphic"
				in2="map"
				scale="0.9"
				xChannelSelector="R"
				yChannelSelector="G"
			/>
		</filter>
	</svg>
	<div
		class="cursor"
		class:seen
		class:big={label}
		class:pressed
		class:refract
		aria-hidden="true"
		bind:this={ring}
	>
		<span class="ring">
			<span class="glass"></span>
			<span class="rim"></span>
			<span class="arc"></span>
			<span class="label">{label}</span>
		</span>
	</div>
{/if}

<style>
	.cursor {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 65;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.2s ease;
		will-change: transform;
	}

	.cursor.seen {
		opacity: 1;
	}

	.ring {
		position: absolute;
		top: 0;
		left: 0;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		margin: -17px 0 0 -17px;
		border-radius: 50%;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
		transition:
			width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
			height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
			margin 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
			transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.glass,
	.rim,
	.arc {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		pointer-events: none;
	}

	.glass {
		background:
			radial-gradient(ellipse 30% 18% at 78% 86%, rgba(255, 255, 255, 0.28), transparent 100%),
			rgba(255, 255, 255, 0.03);
		-webkit-backdrop-filter: blur(2.5px) saturate(1.4);
		backdrop-filter: blur(2.5px) saturate(1.4);
		box-shadow:
			inset 0 1px 1px rgba(255, 255, 255, 0.7),
			inset 0 -2px 3px rgba(255, 255, 255, 0.2),
			inset 0 0 0 1px rgba(255, 255, 255, 0.05);
	}

	.refract .glass {
		-webkit-backdrop-filter: url(#lens) blur(2.5px) saturate(1.25) brightness(1.05);
		backdrop-filter: url(#lens) blur(2.5px) saturate(1.25) brightness(1.05);
	}

	.rim {
		padding: 1px;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.9),
			rgba(255, 255, 255, 0.12) 30%,
			rgba(255, 255, 255, 0.12) 70%,
			rgba(255, 255, 255, 0.9)
		);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
	}

	.arc {
		inset: 3px;
		border-top: 1px solid rgba(255, 255, 255, 0.95);
		-webkit-mask-image: radial-gradient(ellipse 42% 32% at 50% 0, #000 40%, transparent 100%);
		mask-image: radial-gradient(ellipse 42% 32% at 50% 0, #000 40%, transparent 100%);
	}

	:global(html[data-theme='light']) .ring {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	:global(html[data-theme='light']) .rim {
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.85),
			rgba(0, 0, 0, 0.16) 30%,
			rgba(0, 0, 0, 0.16) 70%,
			rgba(255, 255, 255, 0.85)
		);
	}

	.big .ring {
		width: 84px;
		height: 84px;
		margin: -42px 0 0 -42px;
	}

	.pressed .ring {
		transform: scale(0.92);
	}

	.label {
		font-family: 'Inter', var(--font-sans, sans-serif);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #fff;
		opacity: 0;
		position: relative;
		z-index: 1;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
		transition: opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.big .label {
		opacity: 1;
	}

	:global(html[data-custom-cursor]),
	:global(html[data-custom-cursor] *) {
		cursor: none !important;
	}

	:global(html[data-custom-cursor] input),
	:global(html[data-custom-cursor] textarea),
	:global(html[data-custom-cursor] select),
	:global(html[data-custom-cursor] [contenteditable]:not([contenteditable='false'])) {
		cursor: text !important;
	}
</style>
