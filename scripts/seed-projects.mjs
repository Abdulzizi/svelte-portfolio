// One-off seed: the three real projects. Idempotent-ish — skips if a project with
// the same title already exists, so re-running won't duplicate.
// Run: node --env-file=.env scripts/seed-projects.mjs
import pg from 'pg';

const projects = [
	{
		title: 'Freecause',
		role: 'Platform rebuild',
		year: '2026',
		stack: ['Go', 'Cloudflare', 'CI/CD'],
		impact: '19M users',
		problem: 'A 19M-user petition platform stuck on aging infrastructure.',
		result: 'Rebuilt from scratch: edge caching, versioned invalidation, hardened CI/CD.',
		featured: true,
		rank: 0
	},
	{
		title: 'Telkom Akses',
		role: 'Backend + UI owner',
		year: '2025',
		stack: ['Node.js', 'PostgreSQL', 'Microservices'],
		impact: '3 services',
		problem: 'A nationwide field workforce with no unified platform.',
		result: 'Own 3 backend services and the UI of the platform they run on.',
		featured: true,
		rank: 1
	},
	{
		title: 'Venturo',
		role: 'Full-stack',
		year: '2024',
		stack: ['Vue.js', 'Laravel', 'MySQL'],
		impact: '-30% admin work',
		problem: 'Admin work was manual, repetitive, slow.',
		result: 'Vue + Laravel admin dashboard that cut manual admin work by 30%.',
		featured: false,
		rank: 0
	}
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

let inserted = 0;
let skipped = 0;
for (const p of projects) {
	const exists = await pool.query('select 1 from projects where title = $1 limit 1', [p.title]);
	if (exists.rowCount > 0) {
		skipped++;
		continue;
	}
	await pool.query(
		`insert into projects (title, role, year, stack, impact, problem, result, featured, rank)
		 values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		[p.title, p.role, p.year, p.stack, p.impact, p.problem, p.result, p.featured, p.rank]
	);
	inserted++;
}

const total = await pool.query('select count(*)::int as n from projects');
console.log(`seed done — inserted ${inserted}, skipped ${skipped}, total ${total.rows[0].n}`);
await pool.end();
