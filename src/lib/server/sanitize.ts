import sanitizeHtml from 'sanitize-html';
import { env } from '$env/dynamic/private';
import { SANITIZE_TAGS, SANITIZE_ATTRS } from '$lib/sanitize-allowlist';

// Server-only. Runs on EVERY body save before it touches the DB (stored-XSS guard).
// Never import into client code.

// Conservative allowlist: inline emphasis + lists + h2/h3 + links only.
// No script/style/img/iframe, no on* handlers, no inline styles.
const OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: [...SANITIZE_TAGS],
	allowedAttributes: { a: [...SANITIZE_ATTRS.a], img: [...SANITIZE_ATTRS.img] },
	allowedSchemesByTag: { img: ['https'] },
	allowedSchemes: ['http', 'https', 'mailto'],
	// Normalize links: force safe rel, drop everything else.
	transformTags: {
		a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
		img: sanitizeHtml.simpleTransform('img', { loading: 'lazy' }, true)
	},
	exclusiveFilter: (frame) => frame.tag === 'img' && !isOwnImage(frame.attribs.src),
	disallowedTagsMode: 'discard'
};

function isOwnImage(src: string | undefined): boolean {
	if (!src || !env.SUPABASE_URL) return false;
	try {
		return new URL(src).host === new URL(env.SUPABASE_URL).host;
	} catch {
		return false;
	}
}

/** Sanitize TipTap/user-authored HTML down to the allowlist above. */
export function sanitizeBody(dirty: string): string {
	return sanitizeHtml(dirty, OPTIONS);
}

export function cleanBody(raw: string | undefined): string | null {
	const clean = sanitizeBody(raw ?? '');
	return clean.trim() === '' ? null : clean;
}
