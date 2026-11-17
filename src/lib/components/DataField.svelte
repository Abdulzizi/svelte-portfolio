<script lang="ts">
	import { onMount } from 'svelte';
	import { Renderer, Program, Mesh, Geometry } from 'ogl';
	import { motionOff } from '$lib/motion-pref.svelte';

	let host: HTMLDivElement;

	const COLS = 64;
	const ROWS = 40;

	const vertex = `
		attribute vec2 grid;
		attribute vec3 rnd;
		uniform float uTime;
		uniform float uForm;
		uniform vec2 uMouse;
		uniform vec2 uAspect;
		uniform float uPx;
		varying float vA;
		void main() {
			vec2 scatter = (rnd.xy * 2.0 - 1.0);
			scatter += 0.04 * vec2(sin(uTime * 0.5 + rnd.z * 40.0), cos(uTime * 0.4 + rnd.z * 31.0));
			float x = grid.x * 2.0 - 1.0;
			float band = grid.y * 2.0 - 1.0;
			float w = sin(x * 4.0 + uTime * 0.5 + band * 1.6) * 0.16 + sin(x * 9.0 - uTime * 0.3) * 0.04;
			vec2 wave = vec2(x, band * 0.55 + w);
			vec2 p = mix(scatter, wave, uForm);
			p += uMouse * 0.03 * (0.4 + rnd.z);
			vec2 d = (p - uMouse) * uAspect;
			float l = length(d);
			p += normalize(d + 1e-4) / uAspect * exp(-l * l * 10.0) * 0.16;
			vA = 0.35 + 0.65 * rnd.z;
			gl_Position = vec4(p, 0.0, 1.0);
			gl_PointSize = uPx * (1.5 + rnd.z * 1.5);
		}
	`;

	const fragment = `
		precision mediump float;
		uniform vec3 uColor;
		uniform float uAlpha;
		varying float vA;
		void main() {
			float d = length(gl_PointCoord - 0.5);
			if (d > 0.5) discard;
			gl_FragColor = vec4(uColor, uAlpha * vA);
		}
	`;

	function readColor(el: Element, name: string, fallback: string): [number, number, number] {
		const raw = getComputedStyle(el).getPropertyValue(name).trim() || fallback;
		const c = document.createElement('canvas');
		c.width = c.height = 1;
		const ctx = c.getContext('2d');
		if (!ctx) return [0.5, 0.5, 0.5];
		ctx.fillStyle = raw;
		ctx.fillRect(0, 0, 1, 1);
		const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
		return [r / 255, g / 255, b / 255];
	}

	onMount(() => {
		if (matchMedia('(hover: none)').matches) return;

		let renderer: Renderer;
		try {
			renderer = new Renderer({ alpha: true, antialias: false, dpr: Math.min(devicePixelRatio || 1, 1.5) });
		} catch {
			return;
		}
		const gl = renderer.gl;
		if (!gl) return;

		const canvas = gl.canvas as HTMLCanvasElement;
		canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block';
		canvas.setAttribute('aria-hidden', 'true');
		host.appendChild(canvas);
		gl.clearColor(0, 0, 0, 0);

		const n = COLS * ROWS;
		const grid = new Float32Array(n * 2);
		const rnd = new Float32Array(n * 3);
		for (let i = 0; i < n; i++) {
			grid[i * 2] = (i % COLS) / (COLS - 1);
			grid[i * 2 + 1] = Math.floor(i / COLS) / (ROWS - 1);
			rnd[i * 3] = Math.random();
			rnd[i * 3 + 1] = Math.random();
			rnd[i * 3 + 2] = Math.random();
		}
		const geometry = new Geometry(gl, {
			grid: { size: 2, data: grid },
			rnd: { size: 3, data: rnd }
		});

		const program = new Program(gl, {
			vertex,
			fragment,
			transparent: true,
			depthTest: false,
			depthWrite: false,
			uniforms: {
				uTime: { value: 0 },
				uForm: { value: 0 },
				uMouse: { value: [2, 2] },
				uAspect: { value: [1, 1] },
				uPx: { value: renderer.dpr },
				uColor: { value: [0.5, 0.5, 0.5] },
				uAlpha: { value: 0.28 }
			}
		});
		const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });

		const u = program.uniforms;
		let raf = 0;
		let visible = true;
		let still = motionOff();
		let last = 0;
		let time = 0;
		let form = still ? 1 : 0;
		let rect = host.getBoundingClientRect();
		const target = [2, 2];
		const mouse = [2, 2];

		function colors() {
			const dim = readColor(document.documentElement, '--ink-dim', '#888');
			const acc = readColor(document.documentElement, '--accent', '#888');
			u.uColor.value = [dim[0] * 0.7 + acc[0] * 0.3, dim[1] * 0.7 + acc[1] * 0.3, dim[2] * 0.7 + acc[2] * 0.3];
		}

		function resize() {
			rect = host.getBoundingClientRect();
			const w = Math.max(1, host.clientWidth);
			const h = Math.max(1, host.clientHeight);
			renderer.setSize(w, h);
			u.uAspect.value = [w / h, 1];
			render();
		}

		function render() {
			u.uTime.value = time;
			u.uForm.value = form;
			u.uMouse.value = mouse.slice();
			renderer.render({ scene: mesh });
		}

		function frame(t: number) {
			raf = 0;
			const dt = Math.min(0.05, (t - last) / 1000 || 0);
			last = t;
			time += dt;
			form += (1 - form) * Math.min(1, dt * 0.8);
			mouse[0] += (target[0] - mouse[0]) * Math.min(1, dt * 6);
			mouse[1] += (target[1] - mouse[1]) * Math.min(1, dt * 6);
			render();
			schedule();
		}

		function schedule() {
			if (raf || still || !visible || document.hidden) return;
			last = performance.now();
			raf = requestAnimationFrame(frame);
		}

		function stop() {
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
		}

		function onMove(e: PointerEvent) {
			if (still) return;
			target[0] = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			target[1] = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
		}

		function onVisibility() {
			if (document.hidden) stop();
			else schedule();
		}

		const io = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			if (visible) schedule();
			else stop();
		});
		io.observe(host);

		const ro = new ResizeObserver(resize);
		ro.observe(host);

		const mo = new MutationObserver(() => {
			colors();
			const off = motionOff();
			if (off !== still) {
				still = off;
				if (still) {
					stop();
					form = 1;
					target[0] = target[1] = mouse[0] = mouse[1] = 2;
				} else schedule();
			}
			render();
		});
		mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-motion'] });

		window.addEventListener('pointermove', onMove, { passive: true });
		document.addEventListener('visibilitychange', onVisibility);

		colors();
		resize();
		schedule();

		return () => {
			stop();
			io.disconnect();
			ro.disconnect();
			mo.disconnect();
			window.removeEventListener('pointermove', onMove);
			document.removeEventListener('visibilitychange', onVisibility);
			geometry.remove();
			program.remove();
			gl.getExtension('WEBGL_lose_context')?.loseContext();
			canvas.remove();
		};
	});
</script>

<div bind:this={host} class="data-field" aria-hidden="true"></div>

<style>
	.data-field { position: absolute; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
</style>
