# ADR-007 — Server state is not global state

**Status:** Accepted · **Date:** 2026-08-25

## Problem

Accounts, balances, transactions and transfer history are needed by more than
one micro frontend. The reflex is to lift them into a shared store. What is
actually shared, and what only looks shared?

## The distinction that matters

| Kind | Examples | Where it lives |
|---|---|---|
| **Global client state** | current user, permissions, locale, theme, notifications | the shell, passed through `MfeMountContext` |
| **Server state** | accounts, balances, transactions, transfer history | a query cache **inside each remote** |
| **Local UI state** | wizard step, transaction page, open modal, form draft | the owning component or remote |

Server state is not state at all — it is a **cache of someone else's state**. It
can go stale without anyone in the browser doing anything, it needs
invalidation, refetching, retry and deduplication, and two remotes displaying
"the same" account are not sharing a value: they are each caching a resource.

Putting it in a global store means hand-writing all of that, badly, and gaining
a second source of truth that drifts.

## Chosen

- **Global client state:** owned by the shell, lent to remotes as capabilities.
- **Server state:** TanStack Query in the React and Vue remotes; RxJS
  observables over `HttpClient` in Angular. Each remote owns its own cache.
- **Local UI state:** `useState`, Pinia, and an RxJS store in the Angular wizard.
- **Cross-cutting invalidation:** the event contract, not a shared cache.

The duplication is real and deliberate: after a transfer, the Dashboard and the
Account remote each refetch. Two requests instead of one, in exchange for two
applications that do not share a cache implementation, a cache version, or a
release cadence.

## Why per-mount caches

Each remote creates its **query client per mount**, not as a module singleton,
and clears it on teardown. A module-level cache would survive a logout and a
second login in the same tab — briefly showing one user another user's balances.
In a banking product that is not a rough edge, it is an incident.

## Cache freshness, chosen per query

`staleTime` is set from how fast the underlying data actually moves, not applied
uniformly:

| Query | staleTime | Reasoning |
|---|---|---|
| account summary | 30 s | must look right immediately after a transfer |
| recent transactions | 60 s | changes on a human timescale |
| spending overview | 5 min | six months of aggregates barely move |

A blanket `0` would refetch six months of chart data on every tab switch; a
blanket hour would show a stale balance right after the user moved money.

## Consequences

- The same account can be fetched by two remotes. Measured and accepted; the
  alternative couples them.
- Invalidation is by prefix (`dashboardKeys.all`), so a new query added to a
  domain is covered by the existing event handler without editing it.
- A remote that is not mounted receives no events and refetches on its next
  mount instead. Correct, and worth knowing when reasoning about staleness.
