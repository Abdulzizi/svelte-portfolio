<script lang="ts">
	import { onMount } from 'svelte';
	import { motionOff } from '$lib/motion-pref.svelte';

	const RAMP = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
	const SRC = '/portrait.webp';
	const ASPECT = 373 / 669;
	const CELL = 4;

	let box: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let glow: HTMLCanvasElement;

	const load = () =>
		new Promise<HTMLImageElement>((res, rej) => {
			const img = new Image();
			img.onload = () => res(img);
			img.onerror = rej;
			img.src = SRC;
		});

	const blur = (src: Float32Array, w: number, h: number, r: number) => {
		const tmp = new Float32Array(src.length);
		const out = new Float32Array(src.length);
		const n = 2 * r + 1;
		for (let y = 0; y < h; y++) {
			let sum = 0;
			for (let x = -r; x <= r; x++) sum += src[y * w + Math.min(w - 1, Math.max(0, x))];
			for (let x = 0; x < w; x++) {
				tmp[y * w + x] = sum / n;
				sum += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
			}
		}
		for (let x = 0; x < w; x++) {
			let sum = 0;
			for (let y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
			for (let y = 0; y < h; y++) {
				out[y * w + x] = sum / n;
				sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
			}
		}
		return out;
	};

	const prepare = (img: HTMLImageElement, w: number, h: number, light: boolean) => {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		const ctx = c.getContext('2d', { willReadFrequently: true })!;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(img, 0, 0, w, h);
		const img2 = ctx.getImageData(0, 0, w, h);
		const d = img2.data;
		const n = w * h;
		const lum = new Float32Array(n);
		const solid = new Uint8Array(n);
		const hist = new Uint32Array(256);
		let count = 0;
		for (let i = 0; i < n; i++) {
			const o = i * 4;
			lum[i] = 0.299 * d[o] + 0.587 * d[o + 1] + 0.114 * d[o + 2];
			if (d[o + 3] >= 128) {
				solid[i] = 1;
				hist[Math.min(255, lum[i] | 0)]++;
				count++;
			}
		}
		let lo = 0;
		let hi = 255;
		for (let a = 0, i = 0; i < 256; i++) {
			a += hist[i];
			if (a >= count * 0.01) {
				lo = i;
				break;
			}
		}
		for (let a = 0, i = 255; i >= 0; i--) {
			a += hist[i];
			if (a >= count * 0.01) {
				hi = i;
				break;
			}
		}
		const span = Math.max(1, hi - lo);
		const base = new Float32Array(n);
		for (let i = 0; i < n; i++) {
			const t = Math.min(1, Math.max(0, (lum[i] - lo) / span));
			base[i] = Math.sqrt(t);
		}
		const fine = blur(base, w, h, Math.max(2, Math.round(w / 90)));
		const soft = blur(base, w, h, Math.max(6, Math.round(w / 14)));
		const bg = light ? 255 : 0;
		for (let i = 0; i < n; i++) {
			const o = i * 4;
			let v = bg;
			if (solid[i]) {
				const t = base[i] + 1.8 * (base[i] - fine[i]) + 0.9 * (base[i] - soft[i]);
				v = Math.round(255 * (0.1 + 0.9 * Math.pow(Math.min(1, Math.max(0, t)), 1.7)));
				if (!light) v = Math.max(v, 10);
				if (light) v = Math.min(v, 245);
			}
			d[o] = d[o + 1] = d[o + 2] = v;
			d[o + 3] = solid[i] ? 255 : 0;
		}
		ctx.putImageData(img2, 0, 0);
		return c;
	};

	onMount(() => {
		let mo: MutationObserver | undefined;
		let dead = false;
		let run = 0;
		let raf = 0;
		let idle = 0;
		let px = 0;
		let py = 0;
		let asciify: typeof import('asciify-engine').asciify;
		let img: HTMLImageElement;

		const hideReveal = () => {
			box.style.setProperty('--mx', '-9999px');
			box.style.setProperty('--my', '-9999px');
		};

		const move = (e: PointerEvent) => {
			px = e.clientX;
			py = e.clientY;
			if (raf) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				const r = box.getBoundingClientRect();
				const near = px > r.left - 300 && px < r.right + 300 && py > r.top - 300 && py < r.bottom + 300;
				if (!near) return hideReveal();
				box.style.setProperty('--mx', `${px - r.left}px`);
				box.style.setProperty('--my', `${py - r.top}px`);
			});
		};

		const render = async () => {
			const id = ++run;
			const style = getComputedStyle(document.documentElement);
			const light = document.documentElement.dataset.theme === 'light';
			const still = motionOff();
			const h = Math.round(box.clientHeight);
			const w = Math.round(h * ASPECT);
			if (!h) return;
			window.removeEventListener('pointermove', move);
			hideReveal();
			glow.style.opacity = '0';
			try {
				const stop = await asciify(prepare(img, w, h, light), canvas, {
					fontSize: CELL,
					options: {
						colorMode: 'accent',
						accentColor: style.getPropertyValue('--ink').trim(),
						invert: light,
						charset: RAMP,
						charSpacing: 1,
						charAspect: 0.55,
						hoverStrength: 0
					}
				});
				stop();
				if (dead || id !== run) return;
				if (still) return;
				glow.width = canvas.width;
				glow.height = canvas.height;
				const g = glow.getContext('2d')!;
				g.clearRect(0, 0, glow.width, glow.height);
				g.drawImage(canvas, 0, 0);
				g.globalCompositeOperation = 'source-in';
				g.fillStyle = style.getPropertyValue('--accent').trim() || '#7dffb0';
				g.fillRect(0, 0, glow.width, glow.height);
				g.globalCompositeOperation = 'source-over';
				glow.style.opacity = '1';
				window.addEventListener('pointermove', move, { passive: true });
			} catch {
				canvas.style.display = 'none';
			}
		};

		const later = (fn: () => void) => {
			if (typeof requestIdleCallback === 'function') idle = requestIdleCallback(fn, { timeout: 600 });
			else idle = setTimeout(fn, 150) as unknown as number;
		};

		Promise.all([import('asciify-engine'), load()])
			.then(([mod, loaded]) => {
				if (dead) return;
				asciify = mod.asciify;
				img = loaded;
				later(render);
				mo = new MutationObserver(render);
				mo.observe(document.documentElement, {
					attributes: true,
					attributeFilter: ['data-theme', 'data-motion']
				});
			})
			.catch(() => {
				canvas.style.display = 'none';
			});

		return () => {
			dead = true;
			mo?.disconnect();
			window.removeEventListener('pointermove', move);
			cancelAnimationFrame(raf);
			if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idle);
			else clearTimeout(idle);
		};
	});
</script>

<div bind:this={box} class="portrait" role="img" aria-label="Portrait of Abdul Jawad Azizi">
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
	<canvas bind:this={glow} class="glow" aria-hidden="true"></canvas>
</div>

<style>
	.portrait {
		position: fixed; top: 50%; right: 8rem; z-index: 1; transform: translateY(-50%);
		height: 78dvh; aspect-ratio: 373 / 669; pointer-events: none;
		-webkit-mask-image: linear-gradient(to bottom, #000 68%, transparent 100%), linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%);
		-webkit-mask-composite: source-in;
		mask-image: linear-gradient(to bottom, #000 68%, transparent 100%), linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%);
		mask-composite: intersect;
	}
	.portrait canvas { display: block; height: 100%; width: 100%; background: transparent; }
	.portrait .glow {
		position: absolute; inset: 0; opacity: 0;
		-webkit-mask-image: radial-gradient(circle 110px at var(--mx, -9999px) var(--my, -9999px), #000 0%, transparent 100%);
		mask-image: radial-gradient(circle 110px at var(--mx, -9999px) var(--my, -9999px), #000 0%, transparent 100%);
	}
</style>
