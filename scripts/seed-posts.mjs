// Seed sample blog posts so /blog renders with real content. Idempotent by slug
// (re-running skips existing). 10 PUBLISHED posts + keeps any existing draft.
// Run: node --env-file=.env scripts/seed-posts.mjs
import pg from 'pg';

const RICH = `
<p>Most "rewrite it from scratch" stories end badly. This one didn't — because we never took the site down to do it.</p>
<h2>The constraint</h2>
<p>Nineteen million users, a petition platform that couldn't be offline for a weekend, and infrastructure a decade old. The rule was simple: <strong>no big-bang cutover</strong>.</p>
<ul><li>Edge caching in front of everything.</li><li>Versioned cache invalidation so a bad deploy never served stale data.</li><li>CI/CD that could roll back in under a minute.</li></ul>
<h3>What actually mattered</h3>
<p>The cache invalidation strategy did more for reliability than any rewrite. You can read more about the approach on <a href="https://example.com">the write-up</a>.</p>
<p>Ship small, verify, repeat.</p>
`;

// publishedAt offsets in days ago; newest first in the list.
const posts = [
	{ slug: 'rebuilding-without-downtime', title: 'Rebuilding a 19M-user platform without downtime', excerpt: 'How versioned cache invalidation and edge caching let us replace the engine mid-flight — no maintenance window.', body: RICH, days: 3 },
	{ slug: 'edge-caching-notes', title: 'Edge caching: the parts nobody warns you about', excerpt: 'Cache keys, invalidation races, and why "just add a CDN" is where the real work starts.', body: '<p>A cache is a promise you make to the future. Break it carefully.</p><h2>Keys</h2><p>Most bugs are key-design bugs.</p>', days: 9 },
	{ slug: 'postgres-for-people-who-fear-it', title: 'Postgres for people who fear it', excerpt: 'Indexes, EXPLAIN, and the three queries that cause most slow dashboards.', body: '<p>Run <strong>EXPLAIN ANALYZE</strong> before you guess.</p>', days: 18 },
	{ slug: 'microservices-i-regret', title: 'The microservices I regret', excerpt: 'Three services that should have stayed one function. A short confession.', body: '<p>Every network hop is a new way to fail.</p>', days: 27 },
	{ slug: 'sveltekit-on-a-vps', title: 'Running SvelteKit on a boring VPS', excerpt: 'adapter-node, nginx, systemd — no serverless, no vendor lock-in, and it sleeps fine at night.', body: '<p>Boring infrastructure is a feature.</p>', days: 40 },
	{ slug: 'typescript-without-the-ceremony', title: 'TypeScript without the ceremony', excerpt: 'Types that catch bugs vs types that just make you type more. Keeping only the first kind.', body: '<p>If a type never caught a bug, ask what it is for.</p>', days: 55 },
	{ slug: 'ci-that-rolls-back', title: 'CI/CD that can actually roll back', excerpt: 'A deploy you can undo in under a minute changes how brave you are about shipping.', body: '<p>Rollback speed is deploy confidence.</p>', days: 71 },
	{ slug: 'reading-other-peoples-code', title: 'Reading other people\u2019s code', excerpt: 'The skill nobody teaches and everybody needs. Trace one path end to end.', body: '<p>Start at the entry point. Follow one request all the way down.</p>', days: 92 },
	{ slug: 'the-admin-panel-nobody-sees', title: 'The admin panel nobody sees', excerpt: 'Internal tools deserve the same care as the public site — they just never get it.', body: '<p>Your future self is the user here.</p>', days: 120 },
	{ slug: 'shipping-whole-products', title: 'On shipping whole products', excerpt: 'UI to database to deploy. Being decent across the stack beats being perfect in one layer.', body: '<p>Own the seam, not just the box.</p>', days: 150 }
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

let inserted = 0;
let skipped = 0;
for (const p of posts) {
	const exists = await pool.query('select 1 from posts where slug = $1 limit 1', [p.slug]);
	if (exists.rowCount > 0) {
		skipped++;
		continue;
	}
	const publishedAt = new Date(Date.now() - p.days * 86_400_000);
	await pool.query(
		`insert into posts (title, slug, excerpt, body, published, published_at, created_at)
		 values ($1,$2,$3,$4,true,$5,$5)`,
		[p.title, p.slug, p.excerpt, p.body, publishedAt]
	);
	inserted++;
}

const total = await pool.query('select count(*)::int as n, count(*) filter (where published)::int as pub from posts');
console.log(`seed posts — inserted ${inserted}, skipped ${skipped}. total ${total.rows[0].n} (${total.rows[0].pub} published)`);
await pool.end();
