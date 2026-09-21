# ADR-0001 — Frontend stack: Vite + React + TypeScript

**Status:** Accepted · **Date:** 19.09.2026

## Context
The product is a static web app to be hosted for free on GitHub Pages. No backend, server cost must be zero. The developer is fluent in the React/Next.js ecosystem. Performance budget is tight (JS < 200 KB gzip), accessibility target is WCAG 2.1 AA.

## Options considered

| Option | Pro | Con |
|---|---|---|
| **Vite + React + TS** | Fastest DX; pure static output; subpath support via `base`; full ecosystem | Needs a Pages trick for routing |
| Next.js (`output: export`) | Developer's primary stack; file-based routing | We get none of the benefit from SSR/ISR/RSC; static export has constraints; larger bundle; unnecessary complexity |
| Astro + React islands | Best Lighthouse scores; content pages are static | 90% of the app is interactive (the exam engine); the islands model gains nothing here; low team familiarity |
| SvelteKit | Small bundle | Low ecosystem and familiarity; no shadcn/Radix-equivalent maturity |

## Decision
**Vite 6 + React 19 + TypeScript 5.**

Complementary choices:
- **Tailwind CSS v4** — tokens as CSS variables, dark mode for free
- **shadcn/ui (Radix)** — source code is copied in, no dependency bloat, accessibility built in
- **Zustand** — session state
- **React Router v7** — clean URLs via a 404.html trick (see [`../05-technical-architecture.md §6`](../05-technical-architecture.md))

## Rationale
The heart of the app is an exam engine — meaning fully client-side, interactive, and state-heavy. There is nothing SSR can offer here. Next.js's static export mode means carrying the weight of a framework whose features go unused. Astro's islands advantage disappears once the whole page is interactive.

## Consequences
- **+** Zero server cost, single-command build
- **+** Bundle control is easy; route-based `React.lazy` is enough
- **−** SPA routing needs a Pages-specific workaround (404.html)
- **−** No page-level static HTML is generated for SEO; content pages like `/syllabus` may not be sufficiently exposed to organic traffic → build-time prerendering can be added for these pages later if needed
