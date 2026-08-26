# ADR-004 — One session, four applications

**Status:** Accepted · **Date:** 2026-08-25

## Problem

Four browser applications, one user. Where does the access token live, and how
does a remote get one without being able to leak it?

## Options for token storage

| Where | Survives reload | Readable by XSS | Notes |
|---|---|---|---|
| `localStorage` | yes | **yes** | Any script on the page — including one injected into *any* of the three remotes — can read it |
| `sessionStorage` | per tab | **yes** | Same exposure, smaller blast radius |
| httpOnly cookie | yes | no | Sent automatically, so it must be defended against CSRF |
| In memory | **no** | only while the page lives | Nothing persisted to steal |

The runtime-loading architecture sharpens this. The shell executes JavaScript
from three other origins; a compromise of any one of them is a compromise of the
page. A credential sitting in `localStorage` is readable by all of them, forever,
in one line.

## Chosen

**Access token in memory, in the shell. Refresh token in an httpOnly,
`SameSite` cookie scoped to `/auth`.**

- [`sessionStore`](../../apps/shell-nextjs/lib/auth/session-store.ts) holds the access
  token in a closure. It is never written to any storage API.
- Remotes never see a refresh token and never refresh anything. They call
  `context.auth.getAccessToken()` and receive a short-lived bearer token.
- On reload the access token is gone; the shell rebuilds the session from the
  cookie alone.

## Why

An XSS payload in a remote can still make requests *while the page is open* —
nothing prevents that — but it cannot exfiltrate a durable credential, and
closing the tab ends its access. That is a meaningful reduction in blast radius
for one architectural decision.

Concentrating the session in the shell also means there is exactly one place
that can log the user out, one refresh implementation, and one thing to audit.
Three remotes each managing a token would be three chances to get it wrong.

## Refresh token rotation

Every refresh revokes the presented token and issues a new one, so a leaked
cookie is usable at most once. Presenting an already-revoked token is treated as
theft: **every** session for that user is revoked
([`TokenService.rotateRefreshToken`](../../apps/api-nestjs/src/auth/services/token.service.ts)).

Tokens are stored as an HMAC digest, keyed with a server-side secret — a stolen
database yields no usable session and cannot be attacked with precomputed
hashes.

## Single-flight refresh

Three remotes mount at once and all ask for a token in the same tick. Without
deduplication that is three refreshes; each rotates the cookie, so the second
and third present an already-revoked token and the user is logged out by the
platform's own theft detection.

`sessionStore` therefore keeps one in-flight refresh promise and shares it. This
is a bug that does not exist in a monolith and is easy to miss until three
applications race.

## Why there is no auth check in `proxy.ts`

The refresh cookie belongs to the **API's** origin, so it is never sent to the
shell's server and the proxy cannot see it. A gate there would therefore always
fail. Authentication is enforced where the evidence actually is: in the browser
by `AuthProvider`, and on every request by the API.

(`proxy.ts` is Next.js 16's replacement for `middleware.ts` — same position in
the request pipeline, new file name, and a default export rather than a named
`middleware` one.)

## Consequences

- A reload costs one extra round trip before the UI can render. The shell shows
  a neutral "restoring your session" state rather than flashing a login screen.
- `SameSite=None; Secure` is required in production because the frontends are on
  sibling domains. The CSRF surface that opens is limited to `/auth/refresh`,
  whose response is unreadable cross-origin thanks to the CORS allowlist.
- The API's CORS configuration must enumerate every remote origin explicitly.
  `credentials: true` with a wildcard origin is refused by browsers — correctly.
