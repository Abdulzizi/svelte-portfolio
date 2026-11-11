import { loadGsap } from '$lib/motion';
import { QUERY } from '$lib/wide.svelte';

type Options = { selector?: string; stagger?: number };

const ATTRS = ['data-reveal', 'data-reveal-children', 'data-reveal-stacked', 'data-reveal-stacked-children'];

export function reveal(node: HTMLElement, options: Options = {}) {
	let cleanup = () => {};
	let alive = true;

	const targets = () =>
		options.selector
			? Array.from(node.querySelectorAll<HTMLElement>(options.selector))
			: node.hasAttribute('data-reveal-children') || node.hasAttribute('data-reveal-stacked-children')
				? (Array.from(node.children) as HTMLElement[])
				: [node];

	const show = () => ATTRS.forEach((a) => node.removeAttribute(a));

	loadGsap().then((m) => {
		if (!alive) return;
		if (!m || (node.hasAttribute('data-reveal-stacked') || node.hasAttribute('data-reveal-stacked-children')) && matchMedia(QUERY).matches) {
			show();
			return;
		}
		const { gsap, ScrollTrigger } = m;
		const els = targets();
		const triggers = ScrollTrigger.batch(els, {
			start: 'top 92%',
			once: true,
			onEnter: (batch) =>
				gsap.fromTo(
					batch,
					{ opacity: 0, y: 16 },
					{
						opacity: 1,
						y: 0,
						duration: 0.6,
						ease: 'power3.out',
						stagger: options.stagger ?? 0.08,
						overwrite: true,
						clearProps: 'transform'
					}
				)
		});
		ScrollTrigger.refresh();
		cleanup = () => {
			triggers.forEach((t) => t.kill());
			gsap.killTweensOf(els);
		};
	});

	return {
		destroy() {
			alive = false;
			cleanup();
		}
	};
}
