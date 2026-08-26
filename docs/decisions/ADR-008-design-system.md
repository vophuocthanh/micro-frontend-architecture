# ADR-008 — A shared design language without a shared component library

**Status:** Accepted · **Date:** 2026-08-26

## Problem

The shell and the React remote should look like one product. The obvious way to
achieve that is a shared UI package. [ADR-002](./ADR-002-mount-contract.md)
already rules out sharing components across frameworks — Vue and Angular cannot
consume React components — so what do the two React applications do, and how do
Vue and Angular stay visually consistent?

## Options

**A. A `packages/ui` component library.**
The shell and the Dashboard import the same `<Button>`. Perfectly consistent
between those two. *But* it makes them release together: a change to `Button`
means republishing the package, bumping it in two applications and deploying
both. It also does nothing for Vue or Angular, so the platform would still need
a second answer for two thirds of its surface.

**B. Nothing shared; each application styles itself.**
Maximum independence, guaranteed drift. Three teams would produce three blues.

**C. shadcn/ui — components copied into each repository, not imported.**
Each application owns its component source outright. What is shared is the
*design decision* (the token values, the radius scale, the variant vocabulary),
not a runtime dependency.

## Chosen

**C, plus a token contract.**

The shell and the Dashboard each run `shadcn` and keep their own copy of
`button.tsx`, `card.tsx` and the rest. They share the *token values* — the same
`slate` base palette from the shadcn registry — and nothing else.

## Why

shadcn's copy-in model happens to match this architecture exactly. A component
library creates the release coupling micro frontends exist to remove; copied
source creates none. Two applications diverging on a button's padding is a
cosmetic problem a design review catches. Two applications unable to deploy
independently is an architectural problem no review catches.

The Vue and Angular remotes are not left out: they take the same palette and the
same radius scale, expressed in their own frameworks' idioms. Visual consistency
comes from agreeing on values, which is a document, not a dependency.

## What this costs

- A shadcn upgrade is per-application, not platform-wide. Deliberate: it is also
  what lets the Dashboard upgrade without waiting for the shell.
- The two copies can drift. Mitigated by the token values coming from one
  registry, and by the shell owning every pixel of chrome around the remotes —
  the part a user actually perceives as "one product".

## The part that needed real care

Two independently built Tailwind stylesheets in one document is a genuine
collision risk, not a theoretical one. Both emit `.p-4`; both want to define
`:root` variables; both ship a preflight that resets `body`.

The remote therefore:

- builds with **`prefix(dash)`**, namespacing every utility *and* every theme
  variable (`--dash-spacing`), so neither build can redefine the other's;
- **omits preflight entirely**, because a document-wide reset belongs to the
  shell — and adds it back only in `standalone.css`, where there is no shell;
- defines its shadcn tokens on **`.banking-dashboard`**, its mount root, rather
  than on `:root`.

`tailwind-merge` has to be told about the prefix too (`extendTailwindMerge({
prefix: 'dash:' })`), or `cn()` silently stops deduplicating and the
last-declared-wins fights that utilities exist to prevent come straight back.

Without the prefix this would still *look* fine today, because both applications
currently build the same Tailwind version with the same defaults. It would break
the first time one of them upgraded — which is precisely the day this
architecture is supposed to make safe.
