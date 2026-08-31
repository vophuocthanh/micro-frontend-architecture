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

## Amendment — hand-offs between applications (2026-08-27)

The original decision had one gap, and it only shows up in the interaction this
ADR opens with: *selecting an account in Vue should pre-fill the Angular wizard.*

It did not work. Vue publishes `account:selected` while it is mounted; the user
then opens Transfer; the shell unmounts Vue and mounts Angular; Angular
subscribes — and the event went past several hundred milliseconds earlier, to an
empty room. The failure was invisible: no error, no warning, just a wizard that
looked like it had ignored the user. The end-to-end test that claimed to cover
it asserted something true either way, so it went unnoticed.

Two additions, both narrow:

**1. Retained state events.**
[`REPLAYED_EVENTS`](../../packages/contracts/src/events.ts) names the events
whose last value is delivered to a subscriber that arrives afterwards. It holds
exactly one entry, `account:selected`, and the test for inclusion is whether the
payload is still *true* a moment later. Imperative events — `notification:show`,
`navigation:request` — must never be retained: replaying one would re-fire an
action on every mount. Retained state is dropped on `auth:logout`, so a second
person signing in on the same tab cannot inherit the first one's selection.

Replay is delivered on a microtask, never synchronously inside `on()`: a handler
that fires mid-subscribe runs before the caller holds its unsubscribe function,
and in a component, before the framework has finished constructing it.

**2. `navigateToApp(app, subPath?)` on `MfeMountContext`.**
`navigate()` takes a URL, which meant a remote wanting to send the user to
Transfer had to hardcode `/banking/transfer` — the one fact the runtime registry
exists to keep configurable. Naming the *application* instead leaves the address
to the shell, which is the only component entitled to know it.

Together these make a hand-off a two-part statement that neither names nor
imports the other application: *this is what the user is working on* (an event,
addressed to the platform) and *take them to that application* (an id, resolved
by the shell). All three are exercised in the end-to-end suite — React into Vue,
Vue into Angular, Angular back into Vue.

**Cost.** The bus is no longer purely stateless, so `REPLAYED_EVENTS` is now a
list that must be reviewed as carefully as the event map itself; the temptation
to add "just one more" is how a bus becomes the shared global store option A was
rejected for. Adding a required member to `MfeMountContext` is a **major**
contract change under
[versioning-and-deployment](../architecture/versioning-and-deployment.md) — the
shell and all three remotes ship together.

## Consequences

- An event with no subscriber is dropped, unless it is listed in
  `REPLAYED_EVENTS` — see the amendment above. The default remains "nothing
  happened is a legitimate outcome", and the exception is narrow and enumerated.
- `MfeRoute` is one more thing every remote implements, including in its
  standalone development harness, so standalone mode cannot quietly diverge from
  the composed one.
- `replaceState` behaves like `pushState`, because the shell exposes one
  navigation primitive. A redirect leaves an extra history entry — an acceptable
  price for not handing remotes the power to rewrite the host's history.
