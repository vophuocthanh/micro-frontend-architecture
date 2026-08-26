# Versioning, deployment and rollback

## Each application versions itself

```
shell@1.0.0   dashboard@1.0.0   account@1.0.0   transfer@1.0.0   api@1.0.0
```

Every application carries its own `package.json` version and moves on its own
schedule. A remote reports its version back to the shell through the mount
contract (`export const version`), so what is *actually running* in a browser
can be read at runtime rather than inferred from a deploy log.

## What "breaking change" means here

The only thing that can break across the boundary is the **mount contract**
(`MfeMountContext`, `MfeMount`) and the **event contract**. Everything else in a
remote — its components, its routes, its state, its styling — is private and can
change freely in a patch release.

| Change | Semver | Coordination needed |
|---|---|---|
| A remote's internal refactor | patch | none |
| A remote adds a screen under its own base path | minor | none |
| A new event added to `PlatformEventMap` | minor | publisher first, then subscribers |
| An event's payload loses a field | **major** | every subscriber must ship first |
| `MfeMountContext` gains a required field | **major** | shell and all three remotes |
| API adds an optional response field | minor | none |
| API removes a field the contract declares | **major** | frontends first |

The asymmetry is the useful part: **adding is cheap, removing is expensive**.
Widening a contract is a one-sided deploy; narrowing one requires every consumer
to have already stopped depending on it.

## Rollback

Because the shell resolves remote URLs at runtime, rolling back one application
does not involve the others:

```bash
# Point the route at the previous build and restart the shell.
TRANSFER_REMOTE_ENTRY=https://transfer.example.com/v3.0.0/remoteEntry.js
```

Nothing is rebuilt. Contrast a monolith, where rolling back Transfer means
rolling back the single bundle — and with it, everything else that shipped since.

**The caveat that matters:** a rollback is only safe while the *contract* is
compatible. Rolling a remote back past a breaking contract change gives the
shell an application it cannot mount — which is precisely why the shell reports
`invalid-contract` as its own distinct failure state rather than as a generic
outage.

## Deployment order

For contract changes, the order follows from the table above:

1. **Widening** (adding an event, adding an optional field): deploy the producer
   first; consumers ignore what they do not know about.
2. **Narrowing** (removing anything): deploy every consumer first, so nothing
   depends on the field by the time it disappears.
3. **API before frontends**, always — the API is the one component all four
   browser applications depend on.

An expand/contract migration makes even a "breaking" change two safe deploys:
add the new shape, move consumers over, then remove the old shape in a later
release. This is also why the Prisma schema changes are split into separate
migrations rather than one destructive step.

## Phase 5 — what is missing

`infra/` and `.github/` are deliberately absent rather than present and empty.
When they land they should contain:

- A `Dockerfile` per application — five images, five tags, five registries.
- `docker-compose.yml` for a full local stack behind Nginx as a reverse proxy.
- One GitHub Actions workflow **per application**, each with a `paths:` filter,
  so a change to the Angular remote does not rebuild the other four. That path
  filter is the mechanism that keeps independent deployment true in a monorepo —
  see the note in the [README](../../README.md#a-note-on-the-monorepo).
