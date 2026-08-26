# ADR-006 — Nothing is shared, including React

**Status:** Accepted · **Date:** 2026-08-25 · **Supersedes an earlier attempt to share React**

## Problem

The shell is React 19. The Dashboard remote is React 19. Sharing one React
instance between them saves roughly 45 kB gzip and is the textbook use of
Module Federation's share scope. Should we?

## What we tried

We did. The shell provided `react`, `react-dom`, `react-dom/client` and
`react/jsx-runtime` to the share scope as singletons via the runtime API, and
the Dashboard declared them as shared singletons in its Vite config.

**It failed at mount time**, with React error #527:

```
Incompatible React versions: react 19.2.0-canary-0bdb9206-20250818
                             and react-dom 19.2.8
```

The cause is that **Next.js pins a canary build of React**. The remote's
`requiredVersion: '^19.0.0'` does not semver-match a prerelease like
`19.2.0-canary-…`, so the share negotiation was only partially satisfied: the
remote picked up the host's `react` but kept its own `react-dom`. A half-shared
React is worse than no sharing at all — it fails loudly, at runtime, in a way
that looks like a federation bug rather than a version-range bug.

## Options

**A. Pin the remote to Next.js's canary React.**
Sharing works. *But* the Dashboard's dependency is now "whatever React Next.js
happens to bundle this week", so every Next.js upgrade forces a coordinated
release of a separately owned application. That is exactly the coupling this
architecture exists to remove, and it is a far higher price than 45 kB.

**B. Relax `requiredVersion` to `false`.**
Sharing works until the two Reacts genuinely diverge, at which point it breaks
subtly instead of loudly. Trading a clear failure for an unclear one is a bad
trade in a system that is already hard to debug.

**C. Share nothing. Each remote bundles its own framework.**

## Chosen

**C.**

## Why

The mount contract makes sharing an *optimisation*, not a correctness
requirement. Two React instances in one page are only dangerous when a component
from one renders inside a tree owned by the other — hooks read from the wrong
dispatcher and everything breaks. That never happens here: the shell hands a
remote a bare `HTMLElement` and the remote calls its own `createRoot`. The two
Reacts never meet.

So the cost is bytes, and the benefit is that the Dashboard team can upgrade
React on their own schedule and the shell team can upgrade Next.js on theirs.

## What it costs, measured

| Remote | Framework bundled | mount chunk (gzip) |
|---|---|---|
| dashboard (React 19) | React + ReactDOM + TanStack Query | ~75 kB |
| account (Vue 3.5) | Vue + Pinia + Vue Query | ~45 kB |
| transfer (Angular 20) | Angular + RxJS | ~81 kB |

A user who visits all three sections downloads three frameworks. A monolith
would ship one. **This is a genuine regression against a monolith and should be
stated as one** — it is bought with independent deployment, not with performance.

Mitigations actually in place: remotes load lazily (only on first navigation to
their section), each remote code-splits its own routes, and each is cached
independently — so a Dashboard release does not invalidate Angular's bundle,
which a monolith's single hashed bundle would.

## When sharing *would* be right

- Two remotes on the same framework, both built by federation plugins, with
  version ranges that genuinely overlap.
- A large, stable, framework-agnostic library used by several remotes (a date
  library, an icon set).
- Anything that must be a true singleton for correctness — a design-system theme
  registry, a router. This platform has none: the shell owns all of them.
