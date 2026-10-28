let observer: IntersectionObserver | null = null;
const seen = new WeakSet<Element>();

function getObserver(): IntersectionObserver | null {
	if (observer) return observer;
	if (typeof window === 'undefined') return null;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
	observer = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (e.isIntersecting) {
					e.target.classList.add('is-in');
					observer?.unobserve(e.target);
				}
			}
		},
		{ threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
	);
	return observer;
}

export function reveal(node: HTMLElement) {
	node.classList.add('reveal');
	if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		node.classList.add('is-in');
		return { destroy() {} };
	}
	const io = getObserver();
	if (!io) {
		node.classList.add('is-in');
		return { destroy() {} };
	}
	if (!seen.has(node)) {
		seen.add(node);
		io.observe(node);
	}
	return {
		destroy() {
			io.unobserve(node);
		}
	};
}
