import { json } from '@sveltejs/kit';
import { listPublished } from '$lib/server/posts';
import type { RequestHandler } from './$types';

const GITHUB_USER = 'Abdulzizi';
const TTL = 10 * 60 * 1000;
const EMPTY_TTL = 60 * 1000;
const MAX = 60;
const HEADERS = { 'Cache-Control': 'public, s-maxage=600' };
const NO_STORE = { 'Cache-Control': 'no-store' };

type Ticker = { post: string | null; github: string | null };

let cache: { at: number; data: Ticker } | null = null;
let inflight: Promise<Ticker> | null = null;

function clean(s: string): string {
	const t = s.replace(/\s+/g, ' ').trim();
	return t.length > MAX ? `${t.slice(0, MAX - 1)}…` : t;
}

async function latestPost(): Promise<string | null> {
	try {
		const [row] = await listPublished().limit(1);
		return row?.title ? clean(row.title) : null;
	} catch {
		return null;
	}
}

async function latestPush(): Promise<string | null> {
	try {
		const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/events/public`, {
			headers: { accept: 'application/vnd.github+json' },
			signal: AbortSignal.timeout(5000)
		});
		if (!res.ok) return null;
		const events = (await res.json()) as {
			type: string;
			repo?: { name?: string };
			payload?: { head?: string };
		}[];
		const push = events.find((e) => e.type === 'PushEvent' && e.payload?.head && e.repo?.name);
		if (!push?.repo?.name || !push.payload?.head) return null;
		const repo = push.repo.name.split('/').pop();
		const commit = await fetch(`https://api.github.com/repos/${push.repo.name}/commits/${push.payload.head}`, {
			headers: { accept: 'application/vnd.github+json' },
			signal: AbortSignal.timeout(5000)
		});
		if (!commit.ok) return repo ? clean(`pushed to ${repo}`) : null;
		const body = (await commit.json()) as { commit?: { message?: string } };
		const msg = body.commit?.message?.split('\n')[0];
		return repo && msg ? clean(`${repo}: ${msg}`) : repo ? clean(`pushed to ${repo}`) : null;
	} catch {
		return null;
	}
}

function ttl(data: Ticker): number {
	return data.post || data.github ? TTL : EMPTY_TTL;
}

function load(): Promise<Ticker> {
	return (inflight ??= Promise.all([latestPost(), latestPush()])
		.then(([post, github]) => {
			const data: Ticker = { post, github };
			cache = { at: Date.now(), data };
			return data;
		})
		.catch(() => {
			const data: Ticker = { post: null, github: null };
			cache = { at: Date.now(), data };
			return data;
		})
		.finally(() => {
			inflight = null;
		}));
}

export const GET: RequestHandler = async () => {
	const data = cache && Date.now() - cache.at <= ttl(cache.data) ? cache.data : await load();
	return json(data, { headers: data.post || data.github ? HEADERS : NO_STORE });
};
