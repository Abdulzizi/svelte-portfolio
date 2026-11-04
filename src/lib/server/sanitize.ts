import sanitizeHtml from 'sanitize-html';

// Server-only. Runs on EVERY body save before it touches the DB (stored-XSS guard).
// Never import into client code.

// Conservative allowlist: inline emphasis + lists + h2/h3 + links only.
// No script/style/img/iframe, no on* handlers, no inline styles.
const OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'h2', 'h3', 'a'],
	allowedAttributes: {
		a: ['href', 'target', 'rel']
	},
	allowedSchemes: ['http', 'https', 'mailto'],
	// Normalize links: force safe rel, drop everything else.
	transformTags: {
		a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true)
	},
	disallowedTagsMode: 'discard'
};

/** Sanitize TipTap/user-authored HTML down to the allowlist above. */
export function sanitizeBody(dirty: string): string {
	return sanitizeHtml(dirty, OPTIONS);
}
