# PLAN.md — v2: /work CMS + admin + backend

Active build plan. `SPEC.md` owns the end state; this file tracks how we get there and in what order. Update the checkboxes as steps land. When v2 ships, fold the stable parts into SPEC/DESIGN and shrink this file.

## Goal
The owner manages `/work` content without touching code: log in at `/admin`, CRUD projects (with rich text + images), toggle `featured`, order with `rank`. `/work` renders that data as the approved two-plane deck.

## Locked decisions
- **Host:** Vercel (Hobby), serverless functions. Adapter: `@sveltejs/adapter-vercel` (v6; v7 needs SvelteKit 3).
- **DB:** Postgres (Supabase) via Drizzle ORM + drizzle-kit migrations, `pg` driver.
- **Auth:** single admin, no signup. argon2 hash in env, session row + HTTP-only cookie.
- **Rich text:** TipTap, stored as `sanitize-html`-sanitized HTML, admin bundle only.
- **Images:** public Supabase Storage bucket via REST `fetch`, public URL only in DB. mime + 4 MB cap validated.
- **Validation:** zod for admin forms.
- **`/work` layout:** featured rail (→/←) + "the rest" plane (↓), one viewport, no scroll on lg+ tall; reduced-motion = static list. Non-featured opens the same spec sheet.
- **Blog:** public `/blog`, `/blog/[slug]` and admin posts CMS shipped.

## New dependencies (pin exact versions)
| Dep | Why | Scope |
|---|---|---|
| `@sveltejs/adapter-vercel` | Vercel serverless runtime | build |
| `drizzle-orm`, `drizzle-kit`, `pg` | Postgres + migrations | server |
| `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/pm` | rich text | admin client only |
| `sanitize-html` | sanitize TipTap HTML on save | server |
| `@node-rs/argon2` | password hashing | server |
| `zod` | admin form validation | server |

## Env (keep `.env.example` in sync; never commit `.env`)
```
DATABASE_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=     # npm run hash
SESSION_TTL_DAYS=7
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=  # server-only
SUPABASE_BUCKET=images
RESEND_API_KEY=          # existing
CRON_SECRET=             # Vercel cron auth for /api/keepalive
```

## File map (target)
```
svelte.config.js                       adapter-vercel
drizzle.config.ts
scripts/hash-password.mjs              npm run hash
src/lib/server/db/schema.ts            projects, sessions
src/lib/server/db/index.ts             pg pool + drizzle
src/lib/server/auth.ts                 argon2 verify, session create/validate/destroy
src/lib/server/projects.ts             listFeatured / listRest / get / create / update / delete
src/lib/server/uploads.ts              save/validate image, random name
src/lib/validation.ts                  zod: projectSchema, loginSchema
src/hooks.server.ts                    cookie -> locals.admin, guard /admin
src/routes/work/+page.server.ts        load featured + rest
src/routes/work/+page.svelte           two-plane deck (rewrite)
src/routes/admin/login/+page.svelte|.server.ts
src/routes/admin/+layout.server.ts     guard
src/routes/admin/+page.svelte          project list + featured/rank
src/routes/admin/projects/new/+page.svelte|.server.ts
src/routes/admin/projects/[id]/+page.svelte|.server.ts   edit + delete
src/lib/components/RichEditor.svelte   TipTap wrapper (admin only)
```

## Build order (gate each with `npm run check && npm run build`)
- [x] **1. Adapter swap.** `adapter-auto` → `adapter-node`. Set `/work` `prerender = false`. Confirm existing site still builds and serves. — DONE: adapter-node@^5.5.7, `/work/+page.server.ts` opts out, `build/index.js` Node entry produced, check+build clean.
- [x] **2. DB layer.** Add drizzle + pg, `drizzle.config.ts`, `schema.ts` (projects, sessions), `db/index.ts`. Generate + run first migration against Supabase. `.env.example` updated. — CODE DONE: drizzle-orm@0.45.4, pg@8.23.1, drizzle-kit@0.31.11, @types/pg@8.23.1 (exact-pinned). Schema matches SPEC; `drizzle/0000_loose_plazm.sql` generated offline; `db:generate|migrate|push` scripts added; lazy pool via `$env/dynamic/private`. **Migration RUN against Supabase is DEFERRED** — needs `DATABASE_URL` (see open item).
- [x] **3. Auth.** `scripts/hash-password.mjs` + `npm run hash`. `auth.ts`, `hooks.server.ts` (locals.admin + guard), `/admin/login` with action. Verify login/logout/guard by hand. — CODE DONE: @node-rs/argon2@2.2.2, zod@4.6.7 (exact). `verifyAdmin`/`createSession`/`validateSession`/`destroySession`, `SESSION_COOKIE='aj_session'`, hooks guard `/admin` (except `/admin/login`), login form matches design, cookie httpOnly+secure+sameSite=lax. **Live login verification DEFERRED** (needs DB + TLS; `secure:true` blocks http://localhost — use `secure: !dev` to test locally).
- [x] **4. Project CRUD (no media yet).** `projects.ts`, zod schema, `/admin` list, new/edit/delete with title/role/year/stack/impact/problem/result/featured/rank. Prove full CRUD. — CODE DONE: query layer (listAll/listFeatured/listRest/get/create/update/delete), `projectSchema` + form helpers, `/admin` list (featured dot, rank, arm→confirm delete, toggleFeatured, logout), `/admin/projects/new` + `/admin/projects/[id]` forms, `+layout` guard+chrome. All dynamic, var() tokens only. **Live CRUD verification DEFERRED** (no DB).
- [x] **5. Rich text + images.** `RichEditor.svelte` (TipTap), sanitize on save; `uploads.ts` + image field wired into new/edit. nginx `/uploads/` note in README/PLAN. — DONE: @tiptap/core|pm|starter-kit|extension-link@3.32.2, sanitize-html@2.17.3 (pinned: 2.18 needs ESM-only htmlparser2, which Vercel runtime cannot require), @types/sanitize-html@2.16.2 (exact). RichEditor lazy-imports TipTap in onMount (client+admin-only; verified absent from entry/app and all public page chunks — only admin nodes 7/8 load it). `sanitizeBody` (conservative allowlist, rel=noopener) runs on every body save; `saveImage` validates mime jpeg/png/webp + 5MB cap + randomUUID names under `UPLOAD_DIR`, path-only in DB; `deleteImage` basename-guarded. Both forms multipart; edit has preview + removeImage. `uploads/` gitignored. **nginx:** serve `location /uploads/ { alias <UPLOAD_DIR>/; }` directly as static (bytes never in DB/Node). Live upload+DB verification DEFERRED (no DATABASE_URL).
- [x] **6. /work rewrite.** `+page.server.ts` loads featured + rest; `+page.svelte` becomes the two-plane deck reading DB data. Keyboard + reduced-motion parity. — CODE DONE: server load `{featured, rest}`; deck with featured rail (→/←, filmstrip slide on `--feat`), "the rest" plane (↓/↑ slide on `--plane`), shared `sheet` snippet (spec sheet identical both planes), optional image + sanitized `{@html body}`, empty state, Esc closes, reduced-motion fallback to static list. Dummy array removed — page is DB-driven now. **Live render DEFERRED** (needs seeded DB).
- [ ] **7. Seed real data.** Replace dummy rows: Freecause / Telkom Akses / Venturo as real projects, set featured + rank. Remove placeholder rows.
- [x] **9. Vercel migration.** adapter-node → adapter-vercel; `uploads.ts` writes to Supabase Storage (4 MB cap, Vercel body limit 4.5 MB); pg Pool `max: 1` per instance. Live upload verification needs Supabase env.
- [ ] **8. Docs reconcile.** Verify SPEC/DESIGN/AGENTS/CLAUDE match what shipped; trim this plan.
- [ ] **Seed posts/projects (step 7) so /blog and /work show content.**

## v3 polish (2026-11-11)
Shipped in the working tree, not yet committed.
- [x] **Motion foundation.** `gsap` 3.15.1 (exact) lazy-loaded in `src/lib/motion.ts`; `motion` class on `<html>` from the `app.html` inline script unless reduced motion.
- [x] **View transitions.** Native View Transitions via `onNavigate` in `+layout.svelte`; marquees and theme toggle pinned; `/blog` title morphs into the post headline.
- [x] **Scroll reveals.** `use:reveal` action (`src/lib/actions/reveal.ts`) on `/blog`, post page, and stacked `/work`, `/about`, `/connect`.
- [x] **Hover / micro-motion.** Home panel `flex` transition, blog row title underline, post link underline, theme toggle spin, `:active` press scale.
- [x] **Reading progress.** 2px accent bar on `/blog/[slug]`, GSAP ScrollTrigger scrub.
- [x] **Zen reader.** `ReaderControls.svelte` on `/blog/[slug]`: Zen, size, width, font, leading; saved in `aj-reader`; reading time from `src/lib/reading-time.ts` with tests.
- [x] **Docs.** SPEC, DESIGN, AGENTS and this file updated to match.

## Deploy notes (Vercel)
- Supabase: create a **public** Storage bucket `images`; copy project URL + service role key.
- Run `npm run db:migrate` locally against the Supabase `DATABASE_URL` (session pooler, port 5432).
- Import the GitHub repo in Vercel (SvelteKit auto-detected).
- Set env vars in Vercel: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SESSION_TTL_DAYS`, `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`.
- Optional: set the function region near the Supabase region.
- Keepalive cron: `vercel.json` schedules daily `/api/keepalive` (DB ping), authed by `CRON_SECRET`.
- Firewall rate limit: Vercel WAF rule "Rate limit login and contact", POST `/admin/login` and `/connect`, 5 per 60s per IP, then deny. Applied via `vercel api` (the MCP token lacks firewall write).

## Open items / to confirm during build
- Supabase `DATABASE_URL` availability: build against it live, or local Postgres then swap at deploy. (If not ready at step 2, develop on local Postgres.)
- Exact TipTap extension set (starter-kit + link is the likely minimum).
- Whether "the rest" plane paginates if there are many non-featured projects (defer until it hurts).

## Out of scope (do NOT build in v2)
Public signup / multi-user auth, color picker, WebGL, i18n, analytics, image bytes in Postgres.
