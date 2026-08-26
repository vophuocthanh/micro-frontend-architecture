# Running the platform

Everything you need to get five applications talking to each other, plus what to
do when one of them will not.

---

## 1. Prerequisites

| | Version | Check |
|---|---|---|
| Node.js | 22 or newer | `node -v` |
| pnpm | 10 or newer | `pnpm -v` |
| PostgreSQL | any reachable instance | a connection URL is enough |

The database can be local or hosted. This project was developed against
[Neon](https://neon.tech) — a free serverless Postgres — which needs no local
install:

```bash
npm install -g pnpm      # if you do not have it
```

---

## 2. First-time setup

Five steps, once.

```bash
# 1 — install every workspace at once
pnpm install

# 2 — build the shared contracts package
#     Everything else compiles against it, so this comes first.
pnpm --filter @banking/contracts build

# 3 — create the environment files from their templates
cp apps/api-nestjs/.env.example        apps/api-nestjs/.env
cp apps/shell-nextjs/.env.example      apps/shell-nextjs/.env.local
cp apps/dashboard-react/.env.example   apps/dashboard-react/.env
cp apps/account-vue/.env.example       apps/account-vue/.env
cp apps/transfer-angular/.env.example  apps/transfer-angular/.env

# 4 — point the API at your database, then create the schema
#     Edit DATABASE_URL in apps/api-nestjs/.env first.
pnpm db:migrate

# 5 — load the demo data (3 users, 4 accounts, ~119 transactions, 3 payees)
pnpm db:seed
```

The defaults in every `.env.example` already assume localhost, so **only
`DATABASE_URL` actually needs editing.**

If step 1 prints `Ignored build scripts`, run `pnpm approve-builds` — pnpm
blocks native post-install scripts (Prisma, esbuild) until you allow them. The
allowlist is already committed in `pnpm-workspace.yaml`, so this should not
happen on a clean checkout.

---

## 3. Running it — four ways

### a) Everything at once — the normal way

```bash
pnpm dev
```

Turborepo builds `@banking/contracts` first, then starts all five applications
in watch mode. Open **http://localhost:3000** and sign in.

Every app hot-reloads. Editing `packages/contracts` requires a rebuild
(`pnpm --filter @banking/contracts build`) because its consumers import the
compiled output — or run `pnpm --filter @banking/contracts dev` in a spare
terminal to keep it rebuilding.

### b) One micro frontend on its own — the fast loop

If you are working on the Account domain, you do not need the shell, the
dashboard or the transfer application:

```bash
pnpm dev:api        # terminal 1 — the domain still needs real data
pnpm dev:account    # terminal 2 — http://localhost:3002
```

Each remote runs standalone against a small stand-in for the shell
(`src/dev/standalone-context.ts`) that implements the same `MfeMountContext`,
signs in as the demo customer, and implements routing — so
`localhost:3002/banking/accounts/<id>` behaves exactly as it does inside the
shell.

This is a first-class supported mode, not a hack: a team owning one domain must
be able to work without booting the rest of the platform, and it is the quickest
way to tell whether a bug is yours or the shell's.

| Command | Application | URL |
|---|---|---|
| `pnpm dev:shell` | Next.js shell | http://localhost:3000 |
| `pnpm dev:dashboard` | React remote | http://localhost:3001 |
| `pnpm dev:account` | Vue remote | http://localhost:3002 |
| `pnpm dev:transfer` | Angular remote | http://localhost:3003 |
| `pnpm dev:api` | NestJS API | http://localhost:4000 |

### c) Production mode, locally

Worth doing before you trust a change: dev servers hide bundling problems, and
the shell's security policy is stricter in production.

```bash
pnpm build     # builds all six packages
pnpm start     # serves every production build
```

`pnpm start` runs `next start` for the shell, `vite preview` for each remote and
`node dist/main.js` for the API — one command, whatever each app happens to use.

One caveat worth knowing: Turborepo supervises these as a group, so if any one
of them exits the rest are stopped too. That is fine for normal use and wrong
for deliberately killing a remote to watch error isolation — see §8.

### d) Just the API

```bash
pnpm dev:api
curl http://localhost:4000/health
```

---

## 4. Ports, URLs and accounts

| Application | Port | Notes |
|---|---|---|
| Shell | 3000 | **start here** |
| Dashboard (React) | 3001 | also serves `/remoteEntry.js` |
| Account (Vue) | 3002 | also serves `/remoteEntry.js` |
| Transfer (Angular) | 3003 | also serves `/remoteEntry.js` |
| API (NestJS) | 4000 | `/health` is public |

Ports are `--strictPort`: if one is taken the app refuses to start rather than
silently moving. That is deliberate — the shell looks for remotes at fixed
addresses, and a remote that quietly moved to 3004 produces a confusing
"failed to load" instead of a clear startup error.

**Demo accounts** — password `Password123!` for all three:

| Email | Role | Can transfer money? |
|---|---|---|
| `customer@bank.test` | CUSTOMER | yes |
| `staff@bank.test` | STAFF | **no** — sign in as this one to watch RBAC work |
| `admin@bank.test` | ADMIN | yes |

---

## 5. A five-minute tour

Once signed in as `customer@bank.test`, this exercises every architectural claim
the project makes:

1. **Dashboard** loads — that is a React application, fetched from port 3001 at
   runtime and mounted into a Next.js page.
2. Click **Accounts** — a Vue application replaces it. Different framework, same
   page, no reload.
3. Click an account card, then press **F5**. The deep link survives: the session
   is rebuilt from the refresh cookie, the remote is re-fetched, and the view is
   restored from the URL.
4. Click **Transfer** — Angular now. Send **$25** to Jordan Lee.
5. Watch a toast appear: the Angular remote asked the *shell* to show it, because
   remotes own no global UI.
6. Go back to **Dashboard**. The balance is already $25 lower — the React
   application refreshed because it heard `transfer:completed`, without ever
   knowing that an Angular application exists.
7. Sign out, sign in as `staff@bank.test`. **Transfer** is gone from the
   navigation, and typing `/banking/transfer` is refused.

---

## 6. Everyday commands

```bash
# Quality gates
pnpm typecheck                 # all six packages
pnpm lint
pnpm test                      # 48 unit + component tests, nothing needs to be running

# End-to-end (needs the platform up — see below)
pnpm --filter @banking/e2e-playwright install:browsers    # once
pnpm test:e2e

# Database
pnpm db:studio                 # browse the data
pnpm db:migrate                # create + apply a migration after editing schema.prisma
pnpm db:seed                   # reload the demo data
pnpm db:reset                  # drop everything, re-migrate, re-seed
pnpm db:generate               # regenerate the Prisma client

# Housekeeping
pnpm clean                     # remove build output and node_modules
```

### Running the end-to-end suite

The suite deliberately **does not start the applications** — a micro frontend
platform's integration risk lives in composition, and booting everything from
inside the runner would hide exactly those failures. Start the platform first,
in another terminal.

It also signs in far more often than a human does, which the login rate limit
correctly rejects. Raise it for the test run:

```bash
# terminal 1
AUTH_LOGIN_RATE_LIMIT=200 TRANSFER_RATE_LIMIT=100 pnpm start

# terminal 2
pnpm test:e2e
```

---

## 7. Troubleshooting

Everything below is a failure that actually happened while building this.

### The page loads but a section says "Failed to load dashboard"

Error isolation working as designed — the rest of the platform is fine. The
message names the reason:

| Reason shown | Meaning | Fix |
|---|---|---|
| *could not be reached* | the remote is not running | start it (`pnpm dev:dashboard`) |
| *did not respond in time* | up but slow, or mid-deploy | wait, then **Retry** |
| *does not match the version this shell expects* | loaded, but exports no `mount()` | a bad build — rebuild that remote |

Check the remote directly: `curl -I http://localhost:3001/remoteEntry.js` should
return `200` and `content-type: text/javascript`.

### `Cannot use import statement outside a module` in the console

The shell tried to run a remote's container as a classic script. Every remote is
registered with `type: 'module'` in
[`lib/federation/runtime.ts`](../apps/shell-nextjs/lib/federation/runtime.ts) —
if you added a remote, it needs that too.

### A blank page, and the console mentions Content Security Policy

The shell only executes JavaScript from origins it names explicitly. Add the new
origin to `REMOTE_ORIGINS` in `apps/shell-nextjs/.env.local` and restart.

Confirm what the server is actually sending:

```bash
curl -sD - -o /dev/null http://localhost:3000/login | grep -i content-security-policy
```

### `EADDRINUSE` / a port is already taken

```bash
lsof -ti :3000 | xargs kill -9      # replace 3000 with the port
```

Usually a previous run that did not shut down.

### Login returns 429

The rate limit is doing its job: five attempts per minute. Wait a minute, or
raise it for a test environment — see the end-to-end section above.

### The shell 500s in development with `Cannot find module './xxx.js'`

`pnpm build` and `pnpm dev` share `apps/shell-nextjs/.next`, and running one
while the other is active corrupts it. Stop everything and:

```bash
rm -rf apps/shell-nextjs/.next
pnpm dev
```

### Editing the React dashboard inside the shell does not hot-reload

Expected. Fast Refresh is disabled when that remote is federated, because a
Vite React remote cannot rely on a Next.js host installing its preamble — see
[module-federation.md](./architecture/module-federation.md). Refresh the page,
or work on that domain with `pnpm dev:dashboard`, where HMR is fully enabled.

### A remote builds to an empty chunk

The framework compiler produced nothing, and federation is not to blame. The
usual cause is `noEmit: true` reaching a compiler that *is* the emitter (this
bit the Angular remote). Diagnose by building that remote without the federation
plugin — if the output is still tiny, the problem is upstream of federation.
See [module-federation.md](./architecture/module-federation.md).

### `pnpm test` fails with "no test files found"

An app declares a `test` script but has no tests. Add tests, or remove the
script — a failing gate nobody can fix is worse than no gate.

### Changing an environment variable seems to have no effect

Two separate causes:

1. **Turborepo filters the environment.** Tasks only receive variables declared
   in `globalEnv` in `turbo.json`. An undeclared variable silently arrives as
   `undefined`, which looks like the application ignoring you.
2. **Next.js inlines `NEXT_PUBLIC_*` at build time.** The shell's configuration
   deliberately avoids that prefix so the remote registry stays genuinely
   runtime — see [ADR-001](./decisions/ADR-001-host-and-remotes.md). If you add a
   `NEXT_PUBLIC_` variable, changing it requires a rebuild.

---

## 8. Secrets and what never reaches GitHub

### The rule

Real values live in `.env` files on your machine and in your deployment
platform's secret store. Nothing else. Every `.env.example` is committed and
documents the shape without the values.

| File | Committed? | Holds |
|---|---|---|
| `.env.example` | **yes** | key names, safe localhost defaults |
| `.env`, `.env.local` | **never** | `DATABASE_URL`, both JWT secrets |
| `.claude/settings*.json` | **never** | permission allowlists containing absolute paths |

Every package has its own `.gitignore` rather than relying on the root one. The
duplication is deliberate: an app is meant to be extractable into its own
repository, and its ignore rules should travel with it.

### Check before your first push

`.gitignore` only protects files git is not already tracking. If a secret was
committed once, adding it to `.gitignore` afterwards does nothing — the value
stays in the history.

```bash
git init
git add -A

# Should print nothing at all.
git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example'

# Should print nothing. Substitute anything sensitive you have configured.
git grep -l 'YOUR_DB_PASSWORD' -- $(git ls-files)
```

If either prints something, **do not push**. Unstage it, fix the ignore rule,
and only then commit:

```bash
git rm --cached path/to/.env
```

### It is not only keys that leak

`.claude/settings.json` accumulates permission entries with absolute paths from
whatever you were working on — which can include unrelated clients' repository
names and their internal file structure. It is ignored here for that reason.
The shareable parts of that directory, `agents/`, `commands/` and `skills/`, are
committed: those are the team's conventions and contain nothing personal.

### If a secret has already been pushed

Rotate it first, then clean the history — in that order. A credential in a
public repository should be assumed compromised the moment it lands, and
rewriting history does not un-copy it.

1. Rotate the credential at its source (Neon: reset the database password;
   JWT secrets: generate new ones — every session is invalidated, which is the
   intended effect).
2. Remove it from history with `git filter-repo` or the BFG.
3. Force-push, and tell anyone who has cloned to re-clone.

---

## 9. Verifying the architecture holds

Two checks worth knowing, because they test the claims rather than the code.

**A remote can be repointed without rebuilding the shell:**

```bash
pnpm --filter @banking/shell-nextjs build
pnpm --filter @banking/shell-nextjs start
curl -s localhost:3000/banking/dashboard | grep -o 'localhost:3001/remoteEntry.js'

# same build, different remote — no rebuild
DASHBOARD_REMOTE_ENTRY=https://canary.example.com/remoteEntry.js \
  pnpm --filter @banking/shell-nextjs start
curl -s localhost:3000/banking/dashboard | grep -o 'canary.example.com/remoteEntry.js'
```

**One remote failing does not take the platform down:**

Start the applications as **separate processes** for this one — Turborepo treats
`pnpm start` as a single supervised group and tears the whole group down when
any member exits, which would mask exactly the behaviour you are trying to see:

```bash
# five terminals, or five backgrounded commands
pnpm --filter @banking/api-nestjs        start
pnpm --filter @banking/dashboard-react   start
pnpm --filter @banking/account-vue       start
pnpm --filter @banking/transfer-angular  start
pnpm --filter @banking/shell-nextjs      start
```

Sign in, then kill just the dashboard remote:

```bash
lsof -ti :3001 | xargs kill -9
```

Reload http://localhost:3000/banking/dashboard. You get
*"Failed to load dashboard — this application could not be reached"* with a
**Retry** button, while the navigation, your session, **Accounts** and
**Transfer** all keep working.
