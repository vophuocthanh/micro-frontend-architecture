<!--
Keep a pull request to one concern. A refactor bundled with a feature is two
reviews wearing one hat — see CONTRIBUTING.md §6.

Title follows Conventional Commits, scoped to the package you touched:
  feat(dashboard): add month-over-month spending delta
-->

## What and why

<!-- What changed, and the problem it solves. Link the issue if there is one. -->

Closes #

## Applications touched

<!-- Tick every application this pull request changes. -->

- [ ] `apps/shell-nextjs` — layout, navigation, session, routing
- [ ] `apps/dashboard-react` — balances, spending, transactions
- [ ] `apps/account-vue` — profile, account settings
- [ ] `apps/transfer-angular` — money movement, payees
- [ ] `apps/api-nestjs` — data, business rules, authorization
- [ ] `packages/contracts` — types, RBAC, events, the mount contract
- [ ] `packages/config` — shared ESLint / TypeScript config
- [ ] `apps/e2e-playwright` — cross-application tests
- [ ] Docs only

### Contract change

- [ ] This pull request changes `packages/contracts`.

<!--
If ticked: every application is built against that boundary. Say what changed,
and update all consumers in this same pull request. If not ticked, delete the
rest of this section.
-->

## How it was verified

<!--
The gates from CONTRIBUTING.md §3. Paste the failure if one is expected to stay
red, rather than leaving a box unticked without explanation.
-->

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm test:e2e` (platform running in a second terminal)

**Tests added:**

<!--
A bug fix needs a regression test that fails without the fix. New API behaviour
needs unit tests. New UI behaviour needs component tests queried by role and
label. Anything crossing an application boundary needs a Playwright test.
If none were added, say why.
-->

**Screenshots / recording** (UI changes):

<!-- Before and after. Include the mobile width if the layout is responsive. -->

## Boundaries

- [ ] No business logic was added to the shell.
- [ ] No remote imports another remote — cross-application communication goes
      through `packages/contracts/src/events.ts`.
- [ ] A failing remote still leaves the rest of the page usable (ADR-005).
- [ ] Structural changes are recorded as an ADR in `docs/decisions/`.
- [ ] No `.env`, database URL, JWT secret or API key is committed.

## Deliberately left out

<!-- Anything out of scope, follow-up work, known limitations. Write "Nothing" if there is none. -->
