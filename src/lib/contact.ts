export type Field = 'name' | 'email' | 'message';

export type Result = {
	ok: boolean;
	honeypot: boolean;
	errors: Partial<Record<Field, string>>;
	values: { name: string; email: string; message: string };
};

/** CR/LF would let a visitor inject mail headers via the subject. */
export function cleanName(name: string): string {
	return name.replace(/[\r\n]+/g, ' ').trim();
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(data: Record<string, unknown>): Result {
	const str = (k: string) => (typeof data[k] === 'string' ? (data[k] as string) : '');
	const values = { name: cleanName(str('name')), email: str('email').trim(), message: str('message').trim() };
	const errors: Result['errors'] = {};

	if (values.name.length < 1 || values.name.length > 80) errors.name = 'Enter a name, up to 80 characters.';
	if (values.email.length > 254 || !EMAIL.test(values.email)) errors.email = 'Enter a valid email address.';
	if (values.message.length < 10 || values.message.length > 2000)
		errors.message = 'Message must be 10 to 2000 characters.';

	return {
		ok: Object.keys(errors).length === 0,
		honeypot: str('website') !== '',
		errors,
		values
	};
}
