# ADR-005 — Failure of one remote must not be failure of the platform

**Status:** Accepted · **Date:** 2026-08-25

## Problem

In a monolith, a broken component is a bug you ship or you do not. Here, a remote
can be *deployed broken*, *mid-deploy*, *rolled back*, or simply *unreachable* —
states that do not exist when everything is in one bundle. The user must not see
a blank page because one team's CDN is having a bad afternoon.

## What the architecture gives for free

Because each remote mounts into its own framework root ([ADR-002](./ADR-002-mount-contract.md)),
a rendering error inside the Dashboard never propagates into the shell's React
tree. Isolation here is structural, not something a boundary has to catch. A
React error boundary in the shell would in fact **not** catch it — a real
subtlety worth knowing.

## What still had to be built

`RemoteOutlet` models five states explicitly, not three:

| State | Cause | What the user sees |
|---|---|---|
| loading | fetch in flight | a shaped skeleton, sized like the content |
| ready | mounted | the remote |
| timeout | no response in 10 s | "did not respond … it may be deploying" + Retry |
| unavailable | network / 404 | "could not be reached … it may be offline" + Retry |
| invalid-contract | loaded, no `mount()` | "does not match the version this shell expects" |

The timeout matters more than it looks. Without it an unreachable origin leaves
`loadRemote()` pending forever, and a spinner that never resolves is a worse
failure than an error with a button.

`invalid-contract` is separated from `unavailable` deliberately: one is an
outage, the other is a bad deploy, and telling an on-call engineer which is
which saves the first ten minutes of an incident.

## Teardown correctness

Two ordering hazards, both handled in
[`RemoteOutlet`](../../apps/shell-nextjs/components/layout/remote-outlet.tsx):

1. The outlet unmounts while `mount()` is still awaiting. The returned teardown
   is invoked immediately rather than stored, or a live application leaks.
2. A remote leaves stray DOM behind. The effect cleanup calls
   `element.replaceChildren()` so nothing bleeds into whatever mounts next.

## Consequences

- Every remote needs its own internal loading/empty/error states too — the
  shell's states only cover *loading the remote*, not *the remote loading data*.
- Retry re-runs the whole effect, including a fresh `loadRemote()`. Federation
  caches containers, so a retry after a fixed deploy may need a reload; this is
  noted rather than worked around, because cache-busting a container URL on
  every retry would defeat the caching that makes navigation fast.
