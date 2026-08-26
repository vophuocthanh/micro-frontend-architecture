# ADR-001 — Runtime composition with Module Federation

**Status:** Accepted · **Date:** 2026-08-25

## Problem

Three teams own three business domains and want to release without coordinating.
The user must still see one banking product. How does one page end up containing
a React application, a Vue application and an Angular application that were
built and deployed at different times?

## Options

**A. Build-time composition (npm packages).**
Each domain publishes a package; the shell depends on all three and builds them
in. Simple, one artefact, one CSP.
*But* releasing Transfer means bumping a version in the shell, rebuilding the
shell, retesting the shell and redeploying the shell. That is the coupling the
whole exercise exists to remove.

**B. iframes.**
Total isolation of CSS, JS and crashes — genuinely the strongest isolation
available. *But* the shared session, cross-application events, deep linking and
a consistent layout all become work, and the result feels like three websites in
one page.

**C. Web Components.**
Each domain compiles to a custom element; the shell renders a tag. Shadow DOM
gives real style isolation. *But* it is a packaging format, not a loading
mechanism — something still has to fetch the script, and versioning, shared
dependencies and lazy loading remain unsolved.

**D. Module Federation at runtime.**
The shell fetches a `remoteEntry.js` from each domain's own origin at runtime and
imports a module from it.

## Chosen

**D — Module Federation, via `@module-federation/enhanced`'s runtime API.**

## Why

Only D makes the deployment property true: the shell never contains a remote's
code, so redeploying Transfer changes what users get **without touching the
shell at all**. Remote URLs are read from the server environment on every
request ([`runtime-config.ts`](../../apps/shell-nextjs/lib/config/runtime-config.ts)),
so pointing a route at a different build — or rolling one back — is a config
change and a restart.

This part is easy to get subtly wrong. An earlier version of this shell read the
registry from `NEXT_PUBLIC_*` variables, which Next.js **inlines into the client
bundle at build time**. Everything worked, and the deployment property was
quietly false: changing a remote URL would have required rebuilding and
redeploying the shell — the exact coupling option A was rejected for. The
registry is now resolved by a per-request Server Component and passed to the
browser as props.

The runtime API specifically, rather than a build plugin, because the shell is a
Next.js application. `@module-federation/nextjs-mf` requires forcing webpack and
has not kept pace with the App Router; the runtime API needs no build
integration at all, which means the shell's own toolchain stays stock.

## Consequences

- The shell executes JavaScript it did not build. This is the platform's largest
  security exposure and is mitigated by an origin allowlist in the CSP — see
  [ADR-004](./ADR-004-authentication.md) and the security section of the README.
- A remote can be unavailable at runtime, which is a state that simply does not
  exist with build-time composition. Every remote therefore has loading, error,
  timeout and retry states — see [ADR-005](./ADR-005-error-isolation.md).
- More network requests on first load than a monolith. Measured in the README's
  performance section; this is a real cost, not a rounding error.
