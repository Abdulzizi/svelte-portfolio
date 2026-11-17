import { browser } from '$app/environment';
import { motionOff } from '$lib/motion-pref.svelte';

type Gsap = typeof import('gsap').gsap;
type ScrollTriggerPlugin = typeof import('gsap/ScrollTrigger').ScrollTrigger;
export type Motion = { gsap: Gsap; ScrollTrigger: ScrollTriggerPlugin };

let cached: Promise<Motion | null> | undefined;

export function loadGsap(): Promise<Motion | null> {
	if (!browser || motionOff()) {
		return Promise.resolve(null);
	}
	cached ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
		.then(([g, s]) => {
			g.gsap.registerPlugin(s.ScrollTrigger);
			return { gsap: g.gsap, ScrollTrigger: s.ScrollTrigger };
		})
		.catch(() => {
			document.documentElement.classList.remove('motion');
			return null;
		});
	return cached;
}
