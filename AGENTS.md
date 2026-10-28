# AGENTS.md — long-context guardrails

Read SPEC.md first. It wins on conflict.

## Principles
1. YAGNI: Hero + About only. Skip unasked features, name them in reply.
2. Stdlib/native first. No new dep for a few lines of CSS/Svelte.
3. Shortest diff. Fewest files. Delete before adding.
4. Tokens only — never hardcode `#7BD88F` etc. Use `var(--accent)`.
5. Both themes must work after every change. Test `data-theme` flip.
6. Motion: transform/opacity only. Gate everything behind reduced-motion.
7. `caveman:` comment any deliberate simplification + upgrade path.

## SvelteKit conventions
- `+layout.svelte` owns theme + cursor. Pages compose only.
- Shared logic → `src/lib/actions/` or `src/lib/stores/`. No dup observers.
- Styles: Tailwind utilities + `var()` tokens. `app.css` for tokens/grid/grain only.

## Checks before done
- `npm run check && npm run build` passes.
- No flash on reload (theme script in `app.html`).
- Keyboard + touch usable without cursor anim.
- Lighthouse perf ≥90 mobile (no WebGL, fonts subset).

## Reply shape
- 1-line result first. Max 3 bullets. End with `Skipped: X. Risk: Y.`
