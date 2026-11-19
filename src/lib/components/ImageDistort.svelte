<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Renderer, Program, Mesh, Texture } from 'ogl';
	import { motionOff } from '$lib/motion-pref.svelte';

	let { src = '', alt, class: cls = '' }: { src?: string; alt: string; class?: string } = $props();

	let generated = $state('');
	let useGenerated = $state(false);
	const shown = $derived(!src || useGenerated ? generated : src);

	let wrap: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let active = $state(false);
	let hovering = false;
	
	const vertex = `
		attribute vec2 uv;
		attribute vec2 position;
		varying vec2 vUv;
		void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
	`;
	const fragment = `
		precision highp float;
		uniform sampler2D tMap;
		uniform vec2 uMouse;
		uniform vec2 uRes;
		uniform vec2 uImg;
		uniform float uTime;
		uniform float uStrength;
		varying vec2 vUv;
		void main() {
			vec2 r = uRes / uImg;
			float s = max(r.x, r.y);
			vec2 uv = (vUv - 0.5) * uRes / (uImg * s) + 0.5;
			vec2 d = vUv - uMouse;
			d.x *= uRes.x / uRes.y;
			float dist = length(d);
			float wave = sin(dist * 32.0 - uTime * 5.0) * exp(-dist * 3.2);
			uv += normalize(d + 1e-5) * wave * 0.08 * uStrength;
			gl_FragColor = texture2D(tMap, uv);
		}
	`;

	function makeTexture() {
		const css = getComputedStyle(document.documentElement);
		const v = (n: string, d: string) => css.getPropertyValue(n).trim() || d;
		const bg = v('--bg', '#0a0a08');
		const surface = v('--surface', '#11110e');
		const ink = v('--ink', '#f2f0e4');
		const accent = v('--accent', '#4ade80');
		const c = document.createElement('canvas');
		c.width = 960;
		c.height = 540;
		const g = c.getContext('2d');
		if (!g) return '';
		const grad = g.createLinearGradient(0, 0, 960, 540);
		grad.addColorStop(0, surface);
		grad.addColorStop(1, bg);
		g.fillStyle = grad;
		g.fillRect(0, 0, 960, 540);
		g.globalAlpha = 0.35;
		g.strokeStyle = ink;
		g.lineWidth = 1;
		for (let x = 0; x <= 960; x += 40) {
			g.beginPath();
			g.moveTo(x, 0);
			g.lineTo(x, 540);
			g.stroke();
		}
		for (let y = 0; y <= 540; y += 40) {
			g.beginPath();
			g.moveTo(0, y);
			g.lineTo(960, y);
			g.stroke();
		}
		g.globalAlpha = 0.9;
		g.strokeStyle = accent;
		g.lineWidth = 3;
		for (let r = 40; r < 420; r += 40) {
			g.beginPath();
			g.arc(480, 270, r, 0, Math.PI * 2);
			g.stroke();
		}
		g.fillStyle = accent;
		g.beginPath();
		g.arc(480, 270, 14, 0, Math.PI * 2);
		g.fill();
		return c.toDataURL('image/png');
	}

	$effect(() => {
		if (!generated && (!src || useGenerated)) generated = makeTexture();
	});

	function unsupported() {
		return !shown || dead || motionOff() || matchMedia('(hover: none)').matches;
	}

	const load = async (url: string) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = url;
		await img.decode();
		return img;
	};

	type Rig = {
		src: string;
		renderer: Renderer;
		program: Program;
		mesh: Mesh;
		texture: Texture;
		ro: ResizeObserver;
	};
	let rig: Rig | null = null;
	let building = false;
	let dead = false;
	let destroyed = false;
	let energy = 0;
	let raf = 0;
	let t0 = 0;
	let last: [number, number] | null = null;
	const target = [0.5, 0.5];
	const cur = [0.5, 0.5];

	function halt() {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		energy = 0;
		active = false;
	}

	function release() {
		halt();
		if (!rig) return;
		const { renderer, texture, ro } = rig;
		rig = null;
		ro.disconnect();
		const ctx = renderer.gl;
		if (texture.texture) ctx.deleteTexture(texture.texture);
		ctx.getExtension('WEBGL_lose_context')?.loseContext();
	}

	function frame(now: number) {
		raf = 0;
		if (!rig || dead || motionOff()) {
			active = false;
			return;
		}
		energy *= 0.965;
		cur[0] += (target[0] - cur[0]) * 0.15;
		cur[1] += (target[1] - cur[1]) * 0.15;
		const u = rig.program.uniforms;
		u.uMouse.value = cur;
		u.uStrength.value = energy;
		u.uTime.value = (now - t0) / 1000;
		rig.renderer.render({ scene: rig.mesh });
		if (energy < 0.01) {
			halt();
			return;
		}
		active = true;
		raf = requestAnimationFrame(frame);
	}

	async function ensure() {
		if (building || destroyed || dead || unsupported()) return;
		if (rig && rig.src === shown) return;
		building = true;
		try {
			const { Renderer, Program, Mesh, Triangle, Texture } = await import('ogl');
			const url = shown;
			let image: HTMLImageElement;
			try {
				image = await load(url);
			} catch {
				return;
			}
			if (destroyed || !hovering) return;
			const size = [image.naturalWidth, image.naturalHeight];
			if (rig) {
				rig.texture.image = image;
				rig.texture.needsUpdate = true;
				rig.program.uniforms.uImg.value = size;
				rig.src = url;
				return;
			}
			let renderer: Renderer;
			try {
				renderer = new Renderer({ canvas, alpha: true, dpr: Math.min(devicePixelRatio, 2) });
			} catch {
				dead = true;
				return;
			}
			const ctx = renderer.gl;
			if (!ctx) {
				dead = true;
				return;
			}
			const texture = new Texture(ctx, { image, generateMipmaps: false });
			texture.minFilter = texture.magFilter = ctx.LINEAR;
			texture.wrapS = texture.wrapT = ctx.CLAMP_TO_EDGE;
			const program = new Program(ctx, {
				vertex,
				fragment,
				uniforms: {
					tMap: { value: texture },
					uMouse: { value: [0.5, 0.5] },
					uRes: { value: [1, 1] },
					uImg: { value: size },
					uTime: { value: 0 },
					uStrength: { value: 0 }
				}
			});
			const mesh = new Mesh(ctx, { geometry: new Triangle(ctx), program });
			const resize = () => {
				renderer.setSize(wrap.clientWidth, wrap.clientHeight);
				program.uniforms.uRes.value = [renderer.width * renderer.dpr, renderer.height * renderer.dpr];
			};
			resize();
			const ro = new ResizeObserver(resize);
			ro.observe(wrap);
			t0 = performance.now();
			rig = { src: url, renderer, program, mesh, texture, ro };
		} finally {
			building = false;
		}
	}

	function move(e: PointerEvent) {
		const b = wrap.getBoundingClientRect();
		if (!b.width || !b.height) return;
		target[0] = (e.clientX - b.left) / b.width;
		target[1] = 1 - (e.clientY - b.top) / b.height;
		const speed = last ? Math.hypot(e.clientX - last[0], e.clientY - last[1]) : 0;
		last = [e.clientX, e.clientY];
		if (!rig || dead) return;
		energy = Math.min(1, Math.max(energy, speed / 20));
		if (!raf && energy >= 0.01) raf = requestAnimationFrame(frame);
	}

	function enter(e: PointerEvent) {
		hovering = true;
		last = [e.clientX, e.clientY];
		ensure();
	}

	function leave() {
		hovering = false;
		last = null;
	}

	$effect(() => {
		const onLost = (e: Event) => {
			e.preventDefault();
			dead = true;
			halt();
		};
		const onRestored = () => {
			rig?.ro.disconnect();
			rig = null;
			dead = false;
		};
		canvas.addEventListener('webglcontextlost', onLost);
		canvas.addEventListener('webglcontextrestored', onRestored);
		return () => {
			canvas.removeEventListener('webglcontextlost', onLost);
			canvas.removeEventListener('webglcontextrestored', onRestored);
		};
	});

	onDestroy(() => {
		destroyed = true;
		release();
	});
</script>

<div bind:this={wrap} class="distort {cls}" onpointerenter={enter} onpointerleave={leave} onpointermove={move} role="presentation">
	{#if shown}<img src={shown} {alt} width="960" height="540" loading="lazy" onerror={() => (useGenerated = true)} />{/if}
	<canvas bind:this={canvas} aria-hidden="true" class:on={active}></canvas>
</div>

<style>
	.distort { position: relative; display: block; width: 100%; aspect-ratio: 16 / 9; }
	img { display: block; width: 100%; height: 100%; object-fit: cover; }
	canvas { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; pointer-events: none; }
	canvas.on { opacity: 1; }
</style>
