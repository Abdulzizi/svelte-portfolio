import { eq } from 'drizzle-orm';
import { db } from './db';
import { siteSettings, type SiteSettings } from './db/schema';
import { EMAIL, GITHUB_URL, LINKEDIN_URL, INSTAGRAM_URL, AVAILABILITY } from '$lib/site';

type Values = Omit<SiteSettings, 'id' | 'updatedAt'>;

const defaults: Values = {
	email: EMAIL,
	githubUrl: GITHUB_URL,
	linkedinUrl: LINKEDIN_URL,
	instagramUrl: INSTAGRAM_URL,
	availability: AVAILABILITY
};

export async function getSettings(): Promise<Values> {
	try {
		const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 'site'));
		if (!row) return defaults;
		const { id, updatedAt, ...rest } = row;
		return { ...defaults, ...rest };
	} catch {
		return defaults;
	}
}

export async function saveSettings(values: Values) {
	const set = { ...values, updatedAt: new Date() };
	await db
		.insert(siteSettings)
		.values({ id: 'site', ...set })
		.onConflictDoUpdate({ target: siteSettings.id, set });
}
