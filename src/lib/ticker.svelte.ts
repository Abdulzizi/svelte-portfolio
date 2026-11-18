type TickerData = { post: string | null; github: string | null };

class Ticker {
	post = $state<string | null>(null);
	github = $state<string | null>(null);
}

export const ticker = new Ticker();

const TTL = 10 * 60_000;
const EMPTY_TTL = 60_000;

let pending: Promise<void> | null = null;
let lastAt = 0;
let lastTtl = 0;

export function loadTicker(): Promise<void> {
	if (typeof window === 'undefined') return Promise.resolve();
	if (lastAt && Date.now() - lastAt < lastTtl) return Promise.resolve();
	const p = (pending ??= fetch('/api/ticker')
		.then((r) => (r.ok ? r.json() : null))
		.then((d: TickerData | null) => {
			if (!d) return;
			const post = typeof d.post === 'string' ? d.post : null;
			const github = typeof d.github === 'string' ? d.github : null;
			lastAt = Date.now();
			if (!post && !github) {
				lastTtl = EMPTY_TTL;
				return;
			}
			ticker.post = post;
			ticker.github = github;
			lastTtl = TTL;
		})
		.catch(() => {})
		.finally(() => {
			pending = null;
		}));
	return p;
}
