// Dynamic-by-default (safe default): a new route is NOT prerendered unless it
// opts in. Public static pages (`/`, `/about`) set `prerender = true` in their
// own +page.ts. Dynamic routes (/connect, /work, /admin/**) stay server-rendered.
// This prevents a future admin/data route from being silently baked to static
// HTML (and bypassing auth) just because someone forgot a `prerender = false`.
export const prerender = false;
