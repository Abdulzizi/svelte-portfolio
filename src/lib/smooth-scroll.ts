import { loadGsap } from '$lib/motion';
import { motionOff } from '$lib/motion-pref.svelte';

type Scroller = { stop: () => void; start: () => void };
let current: Scroller | null = null;

export function lockScroll(on: boolean) {
	document.documentElement.style.overflow = on ? 'hidden' : '';
	if (on) current?.stop();
	else current?.start();
}

export function startSmoothScroll(): () => void {
	if (motionOff() || matchMedia('(pointer: coarse)').matches) return () => {};
	let stop = () => {};
	let dead = false;
	Promise.all([import('lenis'), loadGsap()]).then(([{ default: Lenis }, motion]) => {
		if (dead) return;
		const lenis = new Lenis({ autoRaf: !motion });
		current = lenis;
		if (motion) {
			const { gsap, ScrollTrigger } = motion;
			lenis.on('scroll', ScrollTrigger.update);
			const tick = (t: number) => lenis.raf(t * 1000);
			gsap.ticker.add(tick);
			gsap.ticker.lagSmoothing(0);
			stop = () => {
				current = null;
				gsap.ticker.remove(tick);
				lenis.destroy();
			};
		} else {
			stop = () => {
				current = null;
				lenis.destroy();
			};
		}
	});
	return () => {
		dead = true;
		stop();
	};
}
