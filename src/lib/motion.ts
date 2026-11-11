import { browser } from '$app/environment';

type Gsap = typeof import('gsap').gsap;
type ScrollTriggerPlugin = typeof import('gsap/ScrollTrigger').ScrollTrigger;
export type Motion = { gsap: Gsap; ScrollTrigger: ScrollTriggerPlugin };

let cached: Promise<Motion | null> | undefined;

export function loadGsap(): Promise<Motion | null> {
	if (!browser || matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
