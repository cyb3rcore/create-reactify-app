# Project Status

## What exists

Two repositories:

### 1. `~/dev/web/create-reactify-app` — The CLI

A monorepo with 3 packages:

| Package | Purpose | Build |
|---------|---------|-------|
| `packages/types` | Zod schemas + constants for all CLI options | tsdown → ESM |
| `packages/template-generator` | Handlebars rendering, VFS, feature handlers, post-processors | tsdown → ESM |
| `packages/cli` (`create-reactify-app`) | citty CLI, prompts, template fetch, disk write, git/install | tsdown → ESM + bin |

**Entry points:**
- CLI: `packages/cli/dist/cli.mjs` (bin: `create-reactify-app`)
- Programmatic API: `packages/cli/src/index.ts` (exports `createProject`)

**Usage (dev):**
```bash
cd ~/dev/web/create-reactify-app
bun run link                      # build + register globally
bunx create-reactify-app my-app    # scaffold from anywhere
```

### 2. `~/dev/web/template-lamsa` — The Template Source

Two branches:

**`dev` branch** — Runnable TypeScript project with all features enabled:
```
bun install && bun run dev        # starts on port 3000
```
- Files in `src/` are real `.ts`/`.tsx` — full IDE support
- Conditional features use `// @if api` / `// @endif` markers (TypeScript comments)
- `scripts/generate-templates.ts` converts dev → `.hbs` templates
- `templates-src/` holds alternative implementations (auth stub, postgres variant, addon placeholders)

**`main` branch** — `.hbs` template files fetched by the CLI at scaffold time.

---

## CLI flags

```
--runtime bun|node        # defaults to bun
--api trpc|orpc|none      # API layer
--auth better-auth|none   # Authentication
--database sqlite|postgres|none
--package-manager bun|pnpm|npm
--git                     # init git (default: true)
--no-git
--install                 # install deps after scaffold (default: false)
--addons mcp,skills,vite-plus  # comma-separated
--yes / -y                # skip prompts, use defaults
--dry-run                 # validate without writing
```

---

## Feature status

### Core infrastructure ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Fastify 5 SSR server | ✅ Working | Port 3000, HMR via Vite |
| React 19 + @fastify/react | ✅ Working | SSR render + client hydration |
| Panda CSS | ✅ Working | Zero-runtime CSS-in-JS, codegen via `prepare` script |
| Ark UI + Park UI | ✅ Working | Headless components + theme recipes |
| react-router 7 | ✅ Working | File-based auto-routing |
| Valtio state | ✅ Working | SSR-aware state via `useRouteContext` |
| Vite 7 build | ✅ Working | Dual build (client SSR manifest + server bundle) |

### Optional features ✅

| Flag | Status | Notes |
|------|--------|-------|
| `--api trpc` | ✅ Working | Uses `@trpc/server/adapters/fastify` |
| `--api orpc` | ✅ Working | Simple health endpoint |
| `--auth better-auth` | ✅ Working | Uses `fromNodeHeaders` + `auth.handler` |
| `--database sqlite` | ✅ Working | Via `@libsql/client` + `drizzle-orm` |
| `--database postgres` | ✅ Working | Via `pg` + `drizzle-orm` |
| `--orm drizzle` | ✅ Working | Always default when database is set |
| `--git` | ✅ Working | `git init` + initial commit |
| `--install` | ✅ Working | Runs `bun install` / `npm install` / `pnpm install` |
| `--yes` | ✅ Working | Skips all interactive prompts |
| `--dry-run` | ✅ Working | Validates config, doesn't write |

### Addons ⚠️

| Addon | Status | Notes |
|-------|--------|-------|
| `mcp` | ⚠️ Placeholder | Generates empty `.opencode/` dir |
| `skills` | ⚠️ Placeholder | Generates empty `.opencode/` dir |
| `vite-plus` | ✅ Working | Enhances vite.config.ts with HTTPS + host |

### Post-processors ✅

| Processor | Status | What it does |
|-----------|--------|-------------|
| `package-json.ts` | ✅ | Sets project name, strips unused deps per feature |
| `env-vars.ts` | ✅ | Generates `.env` with DB URL, auth secrets |
| `readme.ts` | ✅ | Generates `README.md` with feature list + scripts |

### Template pipeline ✅

| Step | What |
|------|------|
| Template fetch | `git clone --depth 1` via SSH (no tokens) |
| Retry logic | 3 attempts with exponential backoff |
| VFS generation | In-memory file tree via template handlers |
| Disk write | With rollback on failure |
| Git init | Optional |
| Dep install | Optional |

---

## template-lamsa dev branch structure

```
template-lamsa/
├── src/                    # Runnable TypeScript (all features enabled)
│   ├── server.ts           # Fastify entry, has @if markers
│   ├── server/plugins/     # trpc.ts, auth.ts, orpc.ts
│   ├── client/             # React app (root, pages, layouts)
│   ├── components/ui/      # Park UI components
│   ├── db/client.ts        # Drizzle + libsql
│   └── theme/recipes/      # Panda CSS recipes
├── templates-src/          # Alternative impls (auth none stub, postgres, addons)
├── scripts/
│   ├── generate-templates.ts   # Converts dev → main .hbs templates
│   └── preview.sh              # (optional) renders templates with default config
├── docs/dev-workflow.md    # Full workflow documentation
└── .templateignore         # Files excluded from template generation
```

---

## Routes / pages

| Route | File | Included when | Status |
|-------|------|---------------|--------|
| `/` | `src/client/pages/index.tsx` | Always | ✅ Todo example (client-side only, doesn't use API/DB) |
| `/login` | `src/client/pages/login.tsx` | `--auth better-auth` | ❌ Not created yet |
| `/profile` | `src/client/pages/profile.tsx` | `--auth better-auth` | ❌ Not created yet |
| `/api-demo` | `src/client/pages/api-demo.tsx` | `--api trpc` or `--api orpc` | ❌ Not created yet |
| `/db-demo` | `src/client/pages/db-demo.tsx` | `--database sqlite` or `postgres` | ❌ Not created yet |

The index page also doesn't have nav links to feature pages (no `@if` markers for conditional nav).

## What's not implemented

| Thing | Why skipped |
|-------|-------------|
| Tests | Private tool, sole developer, manual testing is faster |
| CI/CD pipeline | Private project, npm publish not needed |
| MCP server subcommand | Future — like BTS's `create-better-t-stack mcp` |
| `--payments` flag | Future — payments integration |
| `--db-setup` flag | Future — automated DB provisioning (turso, neon, etc.) |
| `--web-deploy` / `--server-deploy` | Future — deploy targets |
| Embedded templates in CLI | Not needed — uses git clone at runtime |
| Production template tag pinning | Currently fetches `main` branch; could pin to `v0.1.0` tag |

---

## Sync workflow

```bash
# Edit templates in dev branch
cd ~/dev/web/template-lamsa
# ...edit src/ files...
bun run scripts/generate-templates.ts
git add -A && git commit -m "..."
git push

# Sync to main
git checkout main
git checkout dev -- templates/ docs/ scripts/
bun run scripts/generate-templates.ts
git add -A && git commit -m "sync templates from dev"
git push && git tag -f v0.1.0 && git push -f origin v0.1.0
git checkout dev
```
