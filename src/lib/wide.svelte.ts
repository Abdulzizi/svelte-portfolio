// Reactive "one viewport" breakpoint, shared by the slide pages.
// caveman: single matchMedia owns the breakpoint string; one observer. Upgrade: container query.
const QUERY = '(min-width: 1024px) and (min-height: 640px)';

export function useWide() {
	let wide = $state(false);

	$effect(() => {
		const mq = matchMedia(QUERY);
		const sync = () => (wide = mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	return {
		get current() {
			return wide;
		}
	};
}
