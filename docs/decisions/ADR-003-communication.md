# ADR-003 — Cross-application communication and routing

**Status:** Accepted · **Date:** 2026-08-25

## Problem

Completing a transfer in the Angular application must refresh the balance shown
by the React application. Selecting an account in the Vue application should
pre-fill the Angular wizard. Neither may import the other.

## Options

**A. A shared global store (Redux, Zustand) in the share scope.**
Familiar and easy to debug with devtools.
*But* it forces a shared runtime on three frameworks, makes every remote depend
on the store's shape, and turns a store upgrade into a synchronised release of
four applications. It also invites the real failure: business state slowly
migrating into a global blob nobody owns.

**B. Props from the shell.**
The shell holds the state and passes it down through `MfeMountContext`.
Explicit and type-safe. *But* the shell would have to know that a completed
transfer affects the dashboard — domain knowledge that belongs to the domains,
not the host, and the shell would grow a rule for every new interaction.

**C. The URL.**
Encode shared state in query parameters. Excellent for anything the user should
be able to bookmark or share. *But* useless for transient facts like "a transfer
just completed", and it makes every interaction a navigation.

**D. `postMessage`.**
Necessary between iframes; here it means serialising and re-parsing within one
document for no benefit.

**E. A typed event bus owned by the shell.**
Remotes publish and subscribe to a small, explicitly enumerated set of events.

## Chosen

**E for behaviour, C for anything addressable.**

The contract lives in
[`packages/contracts/src/events.ts`](../../packages/contracts/src/events.ts) and
is exactly five events:

```
account:selected · transfer:completed · auth:logout
notification:show · navigation:request
```

The bus is a typed facade over the DOM's own `EventTarget`, so the transport is
the browser's `CustomEvent` — already understood by React, Vue and Angular
alike, requiring no shared runtime.

## Why

Publishers and subscribers never learn about each other. The Angular application
emits `transfer:completed` and knows nothing about a dashboard; the React
application invalidates its cache on that event and knows nothing about Angular.
Deleting either one leaves the other compiling and running.

Enumerating the events in one file is the point. It is a small, reviewable
public surface: adding a key is a deliberate widening of the platform's API, not
an accident of someone reaching for a store.

Every event carries `meta.source` and `meta.correlationId`, which is what makes
the system debuggable — otherwise a dashboard that refreshed itself looks like a
bug rather than a response to something three applications away.

## Routing: one owner, many readers

The same reasoning applies to the URL. Two routers writing to `history` in one
page is the classic micro frontend bug: the host pushes a state the remote does
not recognise, the remote rewrites it, and the back button dies.

So the **shell owns the URL** and remotes read their slice of it through
`MfeRoute` (`current()` + `subscribe()`), asking for changes via `navigate()`.

- **Vue** reads it with a small composable rather than `vue-router` — a second
  history-owning router is the bug, not the feature.
- **Angular** keeps its real `Router`, wired to the shell through a custom
  [`ShellLocationStrategy`](../../apps/transfer-angular/src/app/core/shell-location.strategy.ts).
  Angular routes normally and never touches `history` itself.

Hash routing (`withHashLocation`) was rejected: it would make every remote's URL
unshareable and unindexable, and would break the shell's own `usePathname`.

## Consequences

- An event with no subscriber is silently dropped. That is deliberate — a remote
  that is not mounted must not queue work — but it means "nothing happened" is a
  legitimate outcome and the contract has to tolerate it.
- `MfeRoute` is one more thing every remote implements, including in its
  standalone development harness, so standalone mode cannot quietly diverge from
  the composed one.
- `replaceState` behaves like `pushState`, because the shell exposes one
  navigation primitive. A redirect leaves an extra history entry — an acceptable
  price for not handing remotes the power to rewrite the host's history.
