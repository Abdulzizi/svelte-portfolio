// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare namespace App {
	// interface Error {}
	interface Locals {
		admin: boolean;
		sessionId: string | null;
	}
	// interface PageData {}
	// interface PageState {}
	// interface Platform {}
}

declare module '*.woff?inline' {
	const src: string;
	export default src;
}
