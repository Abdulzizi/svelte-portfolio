# PLAN.md — v2: /work CMS + admin + backend

Active build plan. `SPEC.md` owns the end state; this file tracks what is still open. When v2 ships, fold the stable parts into SPEC/DESIGN and shrink this file.

## Goal
The owner manages site content without touching code: log in at `/admin`, CRUD projects, experience, posts and the About story, with rich text and images. `/work` renders the data as the two-plane deck.

## Locked decisions
- **Host:** Vercel (Hobby), serverless functions, `@sveltejs/adapter-vercel` v6 (v7 needs SvelteKit 3).
- **DB:** Postgres (Supabase) via Drizzle ORM + drizzle-kit migrations, `pg` driver.
- **Auth:** single admin, no signup. argon2 hash in env, session row + HTTP-only cookie, optional TOTP 2FA.
- **Rich text:** TipTap, stored as `sanitize-html`-sanitized HTML, admin bundle only.
- **Images:** public Supabase Storage bucket via REST `fetch`, public URL only in DB. mime + 4 MB cap validated.
- **Validation:** zod for admin forms.
- **Rendering:** `+layout.ts` defaults to `prerender = false`; only `/` (`src/routes/+page.ts`) opts in.

## Dependencies (exact pins for new ones)
| Dep | Why | Scope |
|---|---|---|
| `@sveltejs/adapter-vercel` | Vercel serverless runtime | build |
| `drizzle-orm`, `drizzle-kit`, `pg` | Postgres + migrations | server |
| `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/pm`, `@tiptap/extension-image` | rich text | admin client only |
| `sanitize-html` | sanitize TipTap HTML on save (pinned 2.17.3; 2.18 needs ESM-only htmlparser2, which the Vercel runtime cannot require) | server |
| `dompurify` | sanitize the body in the admin project preview | admin client only |
| `@node-rs/argon2` | password and recovery-code hashing | server |
| `zod` | admin form validation | server |
| `gsap` (3.15.1), `lenis`, `ogl` | scroll motion, smooth scroll, WebGL ripple/backdrop | public, lazy-loaded |
| `@fontsource/inter`, `@fontsource-variable/space-grotesk` | fonts | public |
| `satori`, `@resvg/resvg-js` | `/og` cards | server |
| `otpauth`, `qrcode` | admin TOTP 2FA | server |

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
TOTP_ENCRYPTION_KEY=     # encrypts the 2FA secret; openssl rand -base64 32
```
No env var is read for the GitHub ticker; the user name is hard-coded in `src/routes/api/ticker/+server.ts`.

## Done
- Foundation (steps 1-6, 8, 9): Vercel adapter, Drizzle schema and migrations, argon2 auth and sessions, project CRUD, TipTap + sanitize + Supabase Storage uploads, data-driven `/work` deck, docs reconcile through commit 97e8ff8.
- v3 polish: GSAP motion foundation, view transitions, scroll reveals, micro-motion, reading progress, Zen reader.
- v4 additions: Inter + Space Grotesk fonts, 40 px/s marquees, global motion switch, live ticker, command palette, glass cursor, Lenis, ogl effects, Projects | Experience tabs and `/work/[id]` case studies (0004), six-chapter `/about` with `story_chapters` and `/admin/story` (0005), email-first `/connect`, admin dashboard, inbox views, settings, CV upload, backup/restore, `rate_limits` and `site_settings` (0006), SEO surfaces (`/og`, sitemap, RSS, robots, error page, `/ripple`).
- TOTP hardening: secret encryption (`TOTP_ENCRYPTION_KEY`, `enc:v1`), 8 single-use recovery codes with Regenerate (0007), `dompurify` admin preview, `/about` fully dynamic (`src/routes/about/+page.ts` removed). Details in `SPEC.md` Auth.
- Hardening: `/og` resolves `path` server-side with Inter WOFF inlined at build, TOTP step replay guard (0008), spam index (0009), backup restores messages at a 4 MB cap, keepalive prunes spam after 30 days, inbox pages by 100, rate limits serialize under an advisory lock and fail closed, upload bytes sniffed, ticker fetches deduped.

## Open
- [ ] **Seed real data** (old step 7): Freecause / Telkom Akses / Venturo as real projects with `featured` and `rank`, remove placeholder rows, and seed posts so `/blog` and `/work` show content. Not verified against the live DB.
- [ ] Browser QA of the v4 surfaces and the new 2FA recovery flow.
- [ ] Safari and Firefox cursor fallback untested; the Vercel deploy itself is still unverified.
- [ ] About chapters 4 (How I work) and 6 (Next) are placeholder copy.
- [ ] Whether "the rest" plane paginates if there are many non-featured projects (defer until it hurts).

## Deploy notes (Vercel)
- Supabase: create a **public** Storage bucket `images`; copy project URL + service role key.
- Run `npm run db:migrate` locally against the Supabase `DATABASE_URL` (session pooler, port 5432).
- Import the GitHub repo in Vercel (SvelteKit auto-detected).
- Set env vars in Vercel: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SESSION_TTL_DAYS`, `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, `CRON_SECRET`, `TOTP_ENCRYPTION_KEY`. Keep `TOTP_ENCRYPTION_KEY` stable: a wrong or missing key blocks admin login while 2FA is on.
- Optional: set the function region near the Supabase region.
- Keepalive cron: `vercel.json` schedules daily `/api/keepalive` (DB ping), authed by `CRON_SECRET`.
- Firewall rate limit: Vercel WAF rule "Rate limit login and contact", POST `/admin/login` and `/connect`, 5 per 60s per IP, then deny. Applied via `vercel api` (the MCP token lacks firewall write).

## Out of scope (do NOT build)
Public signup / multi-user auth, color picker, i18n, analytics, image bytes in Postgres.
