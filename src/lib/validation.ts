import { z } from 'zod';

// Admin form schemas (zod).

export const LIMITS = {
	project: {
		title: 200,
		company: 200,
		role: 200,
		year: 40,
		stackItem: 80,
		stack: 50,
		impact: 2000,
		problem: 5000,
		result: 5000,
		body: 200000,
		imagePath: 500
	},
	post: { title: 200, slug: 200, excerpt: 300, body: 200000, coverImage: 500 },
	chapter: { kicker: 40, big: 160, body: 600 },
	settings: { email: 254, url: 300, availability: 80 },
	message: { name: 80, email: 254, body: 2000 }
} as const;

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1)
});


// Step 5: body is raw TipTap HTML — validated as optional string here, then
// sanitized server-side AFTER safeParse (zod does not sanitize). The image File
// is handled separately in the action, never through zod.
export const projectSchema = z
	.object({
		kind: z.enum(['project', 'experience']),
		company: z.string().max(LIMITS.project.company).optional(),
		title: z.string().min(1, 'Required').max(LIMITS.project.title),
		role: z.string().min(1, 'Required').max(LIMITS.project.role),
		year: z.string().min(1, 'Required').max(LIMITS.project.year),
		stack: z.array(z.string().min(1).max(LIMITS.project.stackItem)).min(1, 'At least one stack entry').max(LIMITS.project.stack),
		impact: z.string().min(1, 'Required').max(LIMITS.project.impact),
		problem: z.string().max(LIMITS.project.problem).optional(),
		result: z.string().max(LIMITS.project.result).optional(),
		body: z.string().max(LIMITS.project.body).optional(),
		featured: z.boolean().default(false),
		rank: z.number().int().default(0)
	})
	.superRefine((d, ctx) => {
		const need = d.kind === 'experience' ? (['company'] as const) : (['problem', 'result'] as const);
		for (const k of need) {
			if (!d[k]?.trim()) ctx.addIssue({ code: 'custom', path: [k], message: 'Required' });
		}
	})
	.transform((d) =>
		d.kind === 'experience'
			? { ...d, company: d.company!.trim(), problem: '', result: '', body: undefined, featured: false }
			: { ...d, company: null, problem: d.problem!, result: d.result! }
	);

/** Split a comma/newline-separated string into trimmed, non-empty parts. */
export function splitStack(raw: FormDataEntryValue | null): string[] {
	if (typeof raw !== 'string') return [];
	return raw
		.split(/[\n,]/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

/**
 * Shape raw FormData into an object ready for projectSchema.safeParse:
 * splits `stack`, coerces the `featured` checkbox ('on'/absent) to boolean, and
 * parses `rank` to an int (NaN → 0).
 */
export function projectFromFormData(form: FormData): unknown {
	const rankRaw = form.get('rank');
	const rankNum = typeof rankRaw === 'string' && rankRaw.trim() !== '' ? Number(rankRaw) : 0;
	return {
		kind: form.get('kind') ?? '',
		company: form.get('company') ?? '',
		title: form.get('title') ?? '',
		role: form.get('role') ?? '',
		year: form.get('year') ?? '',
		stack: splitStack(form.get('stack')),
		impact: form.get('impact') ?? '',
		problem: form.get('problem') ?? '',
		result: form.get('result') ?? '',
		body: typeof form.get('body') === 'string' ? (form.get('body') as string) : '',
		featured: form.get('featured') === 'on' || form.get('featured') === 'true',
		rank: Number.isFinite(rankNum) ? Math.trunc(rankNum) : 0
	};
}

// One ActionData shape across both fail branches of the project forms.
export type ProjectErrors = Record<string, string[] | undefined>;

/**
 * Raw form field values echoed back to the project form on a failed submit.
 * Kept as strings/bool (not the parsed shape) so the form re-renders what the
 * user typed. Shared by new/ and [id]/ actions.
 */
export function projectFormValues(form: FormData) {
	return {
		kind: String(form.get('kind') ?? 'project'),
		company: String(form.get('company') ?? ''),
		title: String(form.get('title') ?? ''),
		role: String(form.get('role') ?? ''),
		year: String(form.get('year') ?? ''),
		stack: String(form.get('stack') ?? ''),
		impact: String(form.get('impact') ?? ''),
		problem: String(form.get('problem') ?? ''),
		result: String(form.get('result') ?? ''),
		featured: form.get('featured') === 'on' || form.get('featured') === 'true',
		rank: String(form.get('rank') ?? '0')
	};
}

// --- Blog posts (v2.1) --- mirrors the project form helpers above.

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Deterministic, pure slugifier: lowercase, trim, spaces/underscores → '-',
 * strip anything but [a-z0-9-], collapse repeated '-', trim leading/trailing '-'.
 */
export function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[\s_]+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
}

// body is raw TipTap HTML — validated as optional string here, then sanitized
// server-side AFTER safeParse. coverImage File handled separately in the action.
export const postSchema = z.object({
	title: z.string().min(1, 'Required').max(LIMITS.post.title),
	slug: z.string().min(1, 'Required').max(LIMITS.post.slug).regex(SLUG_RE, 'Lowercase letters, numbers, and dashes only'),
	excerpt: z.string().min(1, 'Required').max(LIMITS.post.excerpt, 'Keep it under 300 characters'),
	body: z.string().max(LIMITS.post.body).optional(),
	published: z.boolean().default(false)
});


/**
 * Shape raw FormData into an object ready for postSchema.safeParse. If the
 * posted slug is blank, derive it from the title via slugify (admins may leave
 * slug empty). Coerces the `published` checkbox ('on'/absent) to boolean.
 */
export function postFromFormData(form: FormData): unknown {
	const title = typeof form.get('title') === 'string' ? (form.get('title') as string) : '';
	const slugRaw = typeof form.get('slug') === 'string' ? (form.get('slug') as string).trim() : '';
	const slug = slugRaw === '' ? slugify(title) : slugify(slugRaw);
	return {
		title,
		slug,
		excerpt: form.get('excerpt') ?? '',
		body: typeof form.get('body') === 'string' ? (form.get('body') as string) : '',
		published: form.get('published') === 'on' || form.get('published') === 'true'
	};
}

// Same ActionData bag shape as the project forms.
export type PostErrors = ProjectErrors;

/**
 * Raw form field values echoed back to the post form on a failed submit, kept as
 * strings/bool so the form re-renders what the user typed.
 */
export function postFormValues(form: FormData) {
	return {
		title: String(form.get('title') ?? ''),
		slug: String(form.get('slug') ?? ''),
		excerpt: String(form.get('excerpt') ?? ''),
		published: form.get('published') === 'on' || form.get('published') === 'true'
	};
}

export const chapterSchema = z.object({
	kicker: z.string().trim().min(1, 'Required').max(LIMITS.chapter.kicker, 'Max 40 characters'),
	big: z.string().trim().min(1, 'Required').max(LIMITS.chapter.big, 'Max 160 characters'),
	body: z.string().trim().min(1, 'Required').max(LIMITS.chapter.body, 'Max 600 characters'),
	variant: z.enum(['text', 'now', 'next'])
});

export const httpsUrl = z
	.string()
	.trim()
	.min(1, 'Required')
	.max(LIMITS.settings.url, 'Max 300 characters')
	.refine((v) => {
		try {
			return new URL(v).protocol === 'https:';
		} catch {
			return false;
		}
	}, 'Must be an https URL');

export const settingsSchema = z.object({
	email: z.string().trim().min(1, 'Required').max(LIMITS.settings.email, 'Max 254 characters').email('Invalid email'),
	githubUrl: httpsUrl,
	linkedinUrl: httpsUrl,
	instagramUrl: httpsUrl,
	availability: z.string().trim().min(1, 'Required').max(LIMITS.settings.availability, 'Max 80 characters')
});
