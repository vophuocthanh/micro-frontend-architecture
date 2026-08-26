# ADR-002 — A framework-agnostic mount contract

**Status:** Accepted · **Date:** 2026-08-25

## Problem

The shell is a React application. Two of its three remotes are not. What exactly
does the shell import from a remote, and what does it do with it?

## Options

**A. Export a React component.**
`loadRemote()` returns a component the shell renders. Idiomatic for the React
remote; the shell gets Suspense and error boundaries for free.
*But* Vue and Angular would each need a React wrapper, and the wrapper has to
manage a foreign framework's lifecycle from inside React's — bridging two
reconcilers is a category of bug nobody wants to own. It also forces React to be
a shared singleton across the whole platform.

**B. Export a Web Component per remote.**
The shell renders `<account-app>`. Framework-neutral and standards-based.
*But* passing rich objects (an event bus, a token provider) through attributes
means serialising, and Angular and Vue both need extra build configuration to
emit custom elements.

**C. Export `mount(element, context) → unmount`.**
The shell hands over a DOM node and a set of capabilities; the remote renders
into it however it likes and returns a teardown function.

## Chosen

**C — the mount contract**, defined in
[`packages/contracts/src/shell.ts`](../../packages/contracts/src/shell.ts).

```ts
export type MfeMount = (
  element: HTMLElement,
  context: MfeMountContext,
) => MfeUnmount | Promise<MfeUnmount>;
```

## Why

The contract's entire vocabulary is `HTMLElement`, functions and plain objects —
things all three frameworks already agree on. Nothing React-shaped crosses the
boundary, so the shell genuinely does not know what a remote is written in, and
adding a Svelte or a Solid remote tomorrow needs no change to the shell.

It also delivers isolation as a side effect. Each remote calls its own
`createRoot` / `createApp` / `bootstrapApplication`, so an error inside one
never propagates into the shell's React tree — see
[ADR-005](./ADR-005-error-isolation.md).

`context` carries **capabilities, not state**: `getAccessToken()` rather than a
token, `navigate()` rather than a router, `events` rather than a store. A remote
can therefore do what it needs without being able to corrupt anything the shell
owns.

## Consequences

- The shell cannot use Suspense or its own error boundary for what happens
  *inside* a remote. It compensates with explicit loading and error states in
  [`RemoteOutlet`](../../apps/shell-nextjs/components/layout/remote-outlet.tsx).
- `unmount` must be total. A remote that leaves a timer or a subscription behind
  leaks on every navigation, so each remote clears its query cache on teardown.
- Changing `MfeMountContext` is a breaking change for all three remotes at once
  — the one piece of genuine coupling left, which is why it is small and
  reviewed as a contract rather than as code.
