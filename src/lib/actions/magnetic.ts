import { motionOff } from '$lib/motion-pref.svelte';

const MAX = 6;
const LERP = 0.25;

export function magnetic(node: HTMLElement) {
	if (typeof matchMedia === 'undefined' || matchMedia('(pointer: coarse)').matches) return {};

	let tx = 0;
	let ty = 0;
	let x = 0;
	let y = 0;
	let raf = 0;

	const tick = () => {
		x += (tx - x) * LERP;
		y += (ty - y) * LERP;
		const settled = Math.abs(tx - x) < 0.05 && Math.abs(ty - y) < 0.05;
		if (settled) {
			x = tx;
			y = ty;
		}
		node.style.transform = x === 0 && y === 0 ? '' : `translate3d(${x}px, ${y}px, 0)`;
		raf = settled ? 0 : requestAnimationFrame(tick);
	};

	const run = () => {
		if (!raf) raf = requestAnimationFrame(tick);
	};

	const move = (e: PointerEvent) => {
		if (e.pointerType !== 'mouse') return;
		if (motionOff()) return leave();
		const r = node.getBoundingClientRect();
		const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
		const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
		tx = Math.max(-1, Math.min(1, dx)) * MAX;
		ty = Math.max(-1, Math.min(1, dy)) * MAX;
		run();
	};

	const leave = () => {
		tx = 0;
		ty = 0;
		run();
	};

	node.addEventListener('pointermove', move);
	node.addEventListener('pointerleave', leave);

	return {
		destroy() {
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', leave);
			cancelAnimationFrame(raf);
			node.style.transform = '';
		}
	};
}
