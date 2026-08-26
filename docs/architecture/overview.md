# Architecture documentation

The [root README](../../README.md) is the primary document: it covers the
platform end to end, from the topology through to running it locally.

These pages go deeper on things the README summarises.

| Document | What it adds |
|---|---|
| [../RUNNING.md](../RUNNING.md) | Setup, the four ways to run the platform, everyday commands, troubleshooting |
| [module-federation.md](./module-federation.md) | Operational detail — the failure modes actually hit, how to tell them apart, how to verify a remote locally |
| [versioning-and-deployment.md](./versioning-and-deployment.md) | What counts as a breaking change, deployment ordering, and how rollback works without a rebuild |

## Decision records

Every significant choice is recorded with the options that were rejected. Two of
them ([ADR-006](../decisions/ADR-006-shared-dependencies.md) especially) reverse
a decision that the implementation proved wrong; that history is kept rather
than tidied away, because the reasoning that led to the wrong answer is the part
worth reading.

| ADR | Decision |
|---|---|
| [001](../decisions/ADR-001-host-and-remotes.md) | Runtime composition with Module Federation |
| [002](../decisions/ADR-002-mount-contract.md) | A framework-agnostic `mount(element, context)` contract |
| [003](../decisions/ADR-003-communication.md) | A typed event bus, and one owner of the URL |
| [004](../decisions/ADR-004-authentication.md) | Access token in memory, refresh token httpOnly, rotated |
| [005](../decisions/ADR-005-error-isolation.md) | Five remote states, not three |
| [006](../decisions/ADR-006-shared-dependencies.md) | Share nothing — including React — and what that costs |
| [007](../decisions/ADR-007-server-state.md) | Server state is a cache, not global state |

## Diagrams

Mermaid sources live in [`../diagrams/`](../diagrams) and are embedded in the
README: platform topology, the runtime composition sequence, and the deployment
topology.
