# AI Engineering Rules — Site Entekhab Reshte

## Product

This repository is the public Persian-first admission database website.

It was derived from `mrst10578/starter-web`, but it is no longer a generic starter.

## Source of truth

Canonical admission data lives in:

`mrst10578/Entekhab-Reshte`

Never fabricate ranks, majors, universities, quotas, admission types, years, or acceptance records.

If source data is unavailable, preserve a truthful empty state or report the integration blocker.

## Product constraints

The public search interface has exactly three modes:

1. رشته
2. دانشگاه
3. رشته + دانشگاه

Do not add extra filters unless the user explicitly requests them.

Do not add these in v1:

- annual comparison charts
- trend charts
- record-count badges
- completeness badges
- acceptance probability
- AI recommendations
- login or user accounts
- full admin dashboard

## Data architecture

- Keep raw-source parsing separate from UI models.
- Prefer generated static shards over shipping one huge dataset.
- Initial page load must not download the entire database.
- Lazy-load year shards.
- When a search requires cross-year data, load the necessary generated shards.
- Preserve source metadata where useful for debugging.
- Dedupe deterministically.
- Invalid records must not crash the UI.

## RTL and Persian

- `<html lang="fa" dir="rtl">` is required.
- Prefer logical CSS properties.
- Test mixed Persian/Latin content.
- Do not use hidden bidi marks as a substitute for correct semantics.
- Internal numeric values remain numeric; format Persian digits at presentation time.

## Core architecture

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn-compatible UI conventions
- Vitest
- Playwright

Prefer Server Components unless browser state or APIs are required.

## Dependencies

Do not add auth, database, storage, payments, CMS, AI, analytics, monitoring, search providers, or email merely because they may be useful later.

A new dependency needs a current product requirement.

## Verification

Before shipping:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Do not weaken lint, TypeScript, tests, accessibility, or data validation to make a change pass.
