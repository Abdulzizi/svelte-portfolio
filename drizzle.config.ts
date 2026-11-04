import { defineConfig } from 'drizzle-kit';

// DATABASE_URL is read lazily by drizzle-kit at command time. Absent URL is fine
// for offline codegen (generate); migrate/push will fail loudly without it.
export default defineConfig({
	dialect: 'postgresql',
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dbCredentials: {
		url: process.env.DATABASE_URL as string
	}
});
