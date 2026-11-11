import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

// Single shared Pool (module singleton). DATABASE_URL is read at runtime via
// $env/dynamic/private, not at build time. A missing URL does NOT crash this
// module — the Pool only attempts to connect when a query actually runs.
const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 1 });
// shortcut: session pooler only (port 5432) — prepared statements stay ON, which
// Drizzle/pg use by default. Do NOT point DATABASE_URL at the transaction pooler
// (port 6543) without setting prepare:false here, or queries will fail. Pool max 1
// per serverless instance; fine at single-admin / low-traffic load.

export const db = drizzle(pool, { schema });
