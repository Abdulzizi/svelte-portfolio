import { json } from '@sveltejs/kit';
import { listPublished } from '$lib/server/posts';
import type { RequestHandler } from './$types';

const GITHUB_USER = 'Abdulzizi';
const TTL = 10 * 60 * 1000;
const MAX = 60;

type Ticker = { post: string | null; github: string | null };

let cache: { at: number; data: Ticker } | null = null;

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

export const GET: RequestHandler = async () => {
	if (!cache || Date.now() - cache.at > TTL) {
		const [post, github] = await Promise.all([latestPost(), latestPush()]);
		cache = { at: Date.now(), data: { post, github } };
	}
	return json(cache.data, { headers: { 'Cache-Control': 'public, s-maxage=600' } });
};
