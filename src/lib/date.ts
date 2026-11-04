// Shared date formatter for the blog. No dependency.
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Format a date as "2026 · MAR 14". Empty string for null/invalid input. */
export function fmtDate(value: Date | string | null): string {
	if (!value) return '';
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return '';
	return `${d.getFullYear()} · ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
}
