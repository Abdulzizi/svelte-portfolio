export function readingTime(html: string): number {
	const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 200));
}
