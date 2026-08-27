# Contributing to Northwind Bank

Thanks for taking the time to contribute. This is a micro frontend monorepo —
six packages, three UI frameworks, one runtime composition — so a change that is
correct inside one application can still break the platform. This guide is about
keeping that from happening.

Read [`docs/RUNNING.md`](./docs/RUNNING.md) first if you have not run the
platform yet. The architecture and the reasoning behind it live in
[`README.md`](./README.md) and [`docs/decisions/`](./docs/decisions).

---

## 1. Getting set up

**Prerequisites:** Node **>= 22**, pnpm **11.1.3** (`corepack enable`), and a
PostgreSQL connection string. Full details in
[`docs/RUNNING.md`](./docs/RUNNING.md) §1–2.

```bash
git clone git@github.com:vophuocthanh/micro-frontend-architecture.git
cd micro-frontend-architecture

pnpm install
pnpm --filter @banking/contracts build     # everything else compiles against it

# create the five env files from their templates, then set DATABASE_URL
cp apps/api-nestjs/.env.example        apps/api-nestjs/.env
cp apps/shell-nextjs/.env.example      apps/shell-nextjs/.env.local
cp apps/dashboard-react/.env.example   apps/dashboard-react/.env
cp apps/account-vue/.env.example       apps/account-vue/.env
cp apps/transfer-angular/.env.example  apps/transfer-angular/.env

pnpm db:migrate && pnpm db:seed
pnpm dev
```

`pnpm dev` brings up all five applications. To iterate on one remote on its own,
use `pnpm dev:shell`, `dev:dashboard`, `dev:account`, `dev:transfer` or
`dev:api` — see [`docs/RUNNING.md`](./docs/RUNNING.md) §3b.

`pnpm install` also installs the Git hooks (via husky's `prepare` script). You
do not need to run anything else for §3 and §6 to start applying.

---

## 2. Where your change belongs

| You are changing… | It goes in |
|---|---|
| Layout, navigation, session, routing, global UI | `apps/shell-nextjs` |
| Balances, spending, transactions | `apps/dashboard-react` |
| Profile, account settings | `apps/account-vue` |
| Money movement, payees | `apps/transfer-angular` |
| Data, business rules, authorization | `apps/api-nestjs` |
| Types, RBAC, events, the mount contract | `packages/contracts` |
| Shared ESLint / TypeScript config | `packages/config` |

Two boundaries the review will hold you to:

- **The shell owns no business logic.** If your change puts a balance, a payee or
  a transfer rule into `apps/shell-nextjs`, it is in the wrong application.
- **Remotes do not import each other.** They talk through the event contract in
  [`packages/contracts/src/events.ts`](./packages/contracts/src/events.ts).
  A direct import between two remotes defeats independent deployment.

Changing `packages/contracts` changes the boundary every application is built
against. Say so explicitly in the PR description, and update every consumer in
the same PR.

---

## 3. Quality gates

Everything below must pass before you open a pull request:

```bash
pnpm typecheck     # all packages
pnpm lint
pnpm test          # unit + component tests, nothing needs to be running
```

End-to-end tests need the platform running, in a second terminal, with the login
rate limit raised for the run:

```bash
# terminal 1
AUTH_LOGIN_RATE_LIMIT=200 TRANSFER_RATE_LIMIT=100 pnpm start
# terminal 2
pnpm test:e2e
```

The e2e suite deliberately does not start the applications itself — booting them
from inside the runner would hide exactly the composition failures the suite
exists to catch.

**The pre-commit hook is not one of these gates.** It runs ESLint over the files
you staged and nothing else — six packages linted on every commit would take
minutes, and a hook that slow gets bypassed with `--no-verify`, which is worse
than not having one. Each application carries its own `.lintstagedrc.mjs` so
that lint-staged runs ESLint from that application's directory, against that
application's flat config. `pnpm lint` over the whole repository is still what
has to pass before you open a pull request; the hook only catches the obvious
half a few minutes earlier.

**What needs a test:**

- A bug fix — a regression test that fails without your fix.
- New API behaviour — unit tests in `apps/api-nestjs`.
- New UI behaviour — component tests, queried by role and label, testing what a
  user does rather than internal state.
- Anything crossing an application boundary — a Playwright test in
  `apps/e2e-playwright`.

---

## 4. Coding conventions

- **TypeScript throughout.** No `any` at a module boundary; validate anything
  arriving from the network or storage rather than asserting its type.
- **Match the file you are editing** — its naming, its structure, its comment
  density. Each application follows its own framework's idioms; do not port
  React patterns into Vue or Angular.
- **Styling:** Tailwind + shadcn/ui in the shell and dashboard. Read
  [`README.md`](./README.md) §11 on CSS isolation before touching global styles —
  two Tailwind builds share one page, and the collision rules are not obvious.
- **State:** server state through the query layer of each framework, client state
  local and lifted only when it must be. See
  [ADR-007](./docs/decisions/ADR-007-server-state.md).
- **Errors:** a failing remote must not take down the page. Anything you add
  inside `RemoteOutlet` stays behind its error boundary — see
  [ADR-005](./docs/decisions/ADR-005-error-isolation.md).
- **Accessibility is part of "done":** semantic elements, labelled inputs,
  keyboard reachable, focus visible.

---

## 5. Architecture decisions

Structural changes — a new remote, a different composition mechanism, a change to
how remotes communicate or share dependencies — are recorded as an ADR in
[`docs/decisions/`](./docs/decisions).

Copy the shape of an existing one: context, the options considered, the decision,
and the consequences. State the alternatives you rejected and why. When an ADR
turns out to be wrong, the fix is a follow-up ADR that supersedes it — not a
quiet edit to the original.

---

## 6. Commits and pull requests

Commits follow [Conventional Commits](https://www.conventionalcommits.org/),
scoped to the package you touched:

```
feat(dashboard): add month-over-month spending delta
fix(shell): keep the deep link after a token refresh
docs(adr): supersede ADR-006 on shared dependencies
test(e2e): cover transfer failure across the shell boundary
chore(deps): bump turbo to 2.3.3
```

The `commit-msg` hook checks this with
[commitlint](https://commitlint.js.org). The permitted scopes are listed in
[`commitlint.config.mjs`](./commitlint.config.mjs) — one per workspace package,
plus `adr`, `docs`, `deps`, `ci`, `repo` and `release`. A new package needs a
scope added there, or every commit touching it is rejected.

Branch off `dev`, and open your pull request against `dev`.

The pull request template asks the questions below; fill it in rather than
deleting it.

A pull request should say:

1. **What** changed and **why** — link the issue if there is one.
2. **Which applications** it touches, and whether the contract changed.
3. **How you verified it** — the gates you ran, plus screenshots for UI changes.
4. Anything you deliberately left out, and why.

Keep pull requests to one concern. A refactor bundled with a feature is two
reviews wearing one hat.

---

## 7. Secrets

Never commit a `.env`, a database URL, a JWT secret or an API key. `.env.example`
files carry the *shape* of the configuration and nothing real.
[`docs/RUNNING.md`](./docs/RUNNING.md) §8 has the full rule, the pre-push check,
and what to do if a secret has already been pushed — rotate first, rewrite
history second.

---

## 8. Reporting bugs and proposing features

Both have an issue form under
[`.github/ISSUE_TEMPLATE/`](./.github/ISSUE_TEMPLATE) that asks for the fields
below.

**Bugs** — include: what you expected, what happened, which applications were
running, and the `requestId` from the error message. Every error response carries
one, and the UI shows it, so a screenshot is usually enough to find the log line.

**Features** — describe the user-facing outcome and which application should own
it before proposing an implementation. If it needs a new cross-application
event or a change to the mount contract, expect the discussion to start there.

---

## 9. License

By contributing, you agree that your contributions are licensed under the
[MIT License](./LICENSE) that covers this project.
