# SPEC — Abdul Jawad Azizi Portfolio v1

## Identity
- Name: Abdul Jawad Azizi
- Role: Full Stack Developer
- Tagline: `{{still finding}}` — placeholder, never ship empty.

## Scope v1
- Hero + About only. No Projects/Blog/Contact pages.
- Lightweight. No WebGL, no three.js, no heavy libs.

## Stack
- SvelteKit + Tailwind (v4, CSS-first config)
- TypeScript strict. No new deps without asking.
- Fonts via `fontsource`: `Caveat`, `Kalam`, `Inter`, `JetBrains Mono`.

## Themes — Moss Green, dark default
```css
[data-theme="dark"] {
  --bg:#0F1410; --surface:#161C15; --ink:#E9EFE6;
  --ink-dim:#A8B5A0; --line:rgba(233,239,230,.12);
  --accent:#7BD88F; --accent-soft:rgba(123,216,143,.14);
}
[data-theme="light"] {
  --bg:#F2F4EC; --surface:#E9ECE0; --ink:#23281F;
  --ink-dim:#5A6355; --line:rgba(35,40,31,.12);
  --accent:#2E7D46; --accent-soft:rgba(46,125,70,.12);
}
```
- No-flash: inline script in `app.html` sets `data-theme` before paint.
- Store: `src/lib/stores/theme.ts` — default dark, localStorage, system fallback.
- Contrast: body text ≥4.5:1 both themes. Accent text on bg ≥3:1.

## File tree
```
src/routes/+layout.svelte      theme init, cursor, page transition
src/routes/+page.svelte         Hero + About composition
src/lib/stores/theme.ts
src/lib/components/Hero.svelte      ink headline + SVG draw underline
src/lib/components/About.svelte     ruled paper card + scroll reveal
src/lib/components/Cursor.svelte    spotlight dot
src/lib/components/Doodles.svelte   arrow, squiggle, circle SVGs
src/lib/actions/reveal.ts           single IntersectionObserver
src/app.css                     tokens, grid, grain
static/fonts/ (only if self-hosting)
```

## Motion budget (experimental max, lightweight)
- Stroke draw: `stroke-dashoffset` CSS only.
- Reveal: one shared `IntersectionObserver`, `translateY(12px)+opacity`, ≤300ms.
- Cursor: single `rAF` transform, `pointer:fine` only.
- Page: `view-transition` fade only.
- All gated: `@media (prefers-reduced-motion: reduce)` → static.
- Perf: no layout thrash, transform/opacity only, grain via `feTurbulence` SVG once.

## 10 style refs (compressed)
1 Notebook base — paper, ruled lines, tape
2 Ink line-art hero — 1 accent only
3 Stroke-by-stroke SVG writing for name
4 Spotlight cursor + dust (CSS only, no canvas)
5 Graph-paper grid overlay
6 Doodle marginalia — wobbly underline, arrow, circle
7 Chalk/brush display headline — big crooked hand font
8 Dark gallery — off-black, work floats
9 Live accent slot reserved (future picker, do NOT build v1)
10 Paper-pile scroll feel via stacked cards (no 3D lib)

## Do NOT build v1
- Projects/Blog/Contact, color picker, WebGL, i18n, CMS, analytics.
- `shortcut: live accent picker reserved, add when user asks.`
