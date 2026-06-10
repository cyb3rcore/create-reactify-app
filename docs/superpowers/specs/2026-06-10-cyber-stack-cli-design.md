# create-cyber-stack — CLI Design Specification

## Overview

A CLI tool (`create-cyber-stack`) for scaffolding SSR web applications using the **Amal** stack: Fastify 5 + @fastify/react + React 19 + Panda CSS + Ark UI + Vite 7. Modeled after `create-better-t-stack` but focused on a single SSR stack with optional feature toggling.

**Template repo:** `cybercore-ma/template-amal`

**Usage:**
```bash
bun create cyber-stack@latest my-app \
  --template amal \
  --runtime bun \
  --api trpc \
  --auth better-auth \
  --database sqlite \
  --orm drizzle \
  --package-manager bun \
  --git \
  --install \
  --addons mcp skills vite-plus
```

---

## 1. Architecture

### Monorepo Structure

```
create-cyber-stack/
├── package.json                 # bun workspace root
├── tsconfig.json                # shared TS config
├── bunfig.toml
├── .gitignore
├── packages/
│   ├── cli/                     # create-cyber-stack (published)
│   │   ├── package.json         # name: create-cyber-stack, bin
│   │   ├── build.config.ts      # tsdown bundler config
│   │   └── src/
│   │       ├── index.ts         # Programmatic API (create function)
│   │       ├── cli.ts           # Executable entry
│   │       ├── commands/
│   │       │   └── create.ts    # citty create command
│   │       ├── prompts/         # Interactive prompts per feature
│   │       ├── utils/
│   │       │   ├── template-fetcher.ts  # Fetch tarball from GitHub
│   │       │   ├── project-writer.ts    # Write VFS to disk
│   │       │   └── package-manager.ts   # Install deps, git init
│   │       └── test/
│   │
│   ├── types/                   # @cyber-stack/types
│   │   ├── package.json
│   │   ├── build.config.ts
│   │   └── src/
│   │       ├── index.ts
│   │       ├── schemas.ts       # Zod schemas for all options
│   │       └── constants.ts     # Option arrays, defaults
│   │
│   └── template-generator/      # @cyber-stack/template-generator
│       ├── package.json
│       ├── build.config.ts
│       └── src/
│           ├── index.ts
│           ├── generator.ts     # Main orchestration
│           ├── core/
│           │   └── virtual-fs.ts    # In-memory file tree
│           ├── handlers/        # Feature template handlers
│           │   ├── core.ts
│           │   ├── api.ts
│           │   ├── auth.ts
│           │   ├── database.ts
│           │   ├── addons/
│           │   │   ├── mcp.ts
│           │   │   ├── skills.ts
│           │   │   └── vite-plus.ts
│           └── post-process/    # Post-template processors
│               ├── index.ts
│               └── processors/
│                   ├── package-json.ts
│                   ├── env-vars.ts
│                   └── readme.ts
```

### Layer Architecture

```
CLI Layer (citty args + interactive prompts)
    ↓ ProjectConfig
Template Fetcher (downloads tarball from cybercore-ma/template-amal)
    ↓ Template file map
Template Generator (VFS + handler processing)
    ↓ VirtualFileTree
Post-Processors (package.json, env, readme)
    ↓ VirtualFileTree
Project Writer (writes to disk)
    ↓
Git Init → Install → Done
```

---

## 2. CLI Flags & Type System

### Flags

| Flag                   | Type                           | Default          | Description                             |
| ---------------------- | ------------------------------ | ---------------- | --------------------------------------- |
| `--template`             | `"amal"`                         | `"amal"`           | Template (locked to amal for now)       |
| `--runtime`              | `"bun" \| "node"`               | `"bun"`            | Runtime environment                     |
| `--api`                  | `"trpc" \| "orpc" \| "none"`    | `"none"`           | API layer                               |
| `--auth`                 | `"better-auth" \| "none"`       | `"none"`           | Authentication provider                  |
| `--database`             | `"sqlite" \| "postgres" \| "none"` | `"none"`       | Database                                |
| `--orm`                  | `"drizzle" \| "none"`           | `"none"`           | ORM                                     |
| `--package-manager`      | `"npm" \| "pnpm" \| "bun"`      | `"bun"`            | Package manager                         |
| `--git`                  | `boolean`                       | `true`             | Initialize git                          |
| `--no-git`               | `boolean`                       | —                | Skip git init                           |
| `--install`              | `boolean`                       | `false`            | Install dependencies                    |
| `--addons`               | `string[]`                      | `[]`               | Dev addons: `mcp`, `skills`, `vite-plus` |
| `--yes` / `-y`           | `boolean`                       | `false`            | Skip all prompts, use defaults          |
| `--dry-run`              | `boolean`                       | `false`            | Validate without writing files          |

### Validation Logic (refined from interactions)

- `--template` is always `"amal"`. Validated but only one value accepted.
- `--addons` items are validated against `["mcp", "skills", "vite-plus"]`.
- If `--database` is `"none"`, `--orm` must also be `"none"`.
- If `--orm` is `"drizzle"`, `--database` must not be `"none"`.
- `--api`, `--auth`, `--database` can each be `"none"` independently — they opt-out of that feature entirely (files for that feature are not included in the output).

### Interactive Prompts

When a flag is not provided and `--yes` is not set, the CLI prompts interactively using `@clack/prompts`:
- Feature prompts show sensible defaults and navigation
- Prompts only appear for flags not already provided

### ProjectConfig (Zod Schema)

```typescript
export const ProjectConfigSchema = z.object({
  projectName: z.string().min(1),
  projectDir: z.string(),
  template: z.literal("amal"),
  runtime: z.enum(["bun", "node"]),
  api: z.enum(["trpc", "orpc", "none"]),
  auth: z.enum(["better-auth", "none"]),
  database: z.enum(["sqlite", "postgres", "none"]),
  orm: z.enum(["drizzle", "none"]),
  packageManager: z.enum(["npm", "pnpm", "bun"]),
  git: z.boolean(),
  install: z.boolean(),
  addons: z.array(z.enum(["mcp", "skills", "vite-plus"])),
});
```

---

## 3. Template System (Hybrid BTS-style)

### Template Source

Templates live in `cybercore-ma/template-amal` GitHub repo. The CLI fetches a tarball (via GitHub API) for a specific tag/release matching the CLI version (e.g., CLI `0.1.0` → template tag `v0.1.0`), then loads `.hbs` files into an in-memory map.

### Template Directory Structure (in the `template-amal` repo)

```
template-amal/
├── templates/
│   ├── core/                  # Always included
│   │   ├── package.json.hbs
│   │   ├── tsconfig.json.hbs
│   │   ├── vite.config.ts.hbs
│   │   ├── panda.config.ts.hbs
│   │   ├── postcss.config.cjs.hbs
│   │   ├── src/
│   │   │   ├── server.ts.hbs
│   │   │   ├── server/config.ts.hbs
│   │   │   └── client/
│   │   │       ├── root.tsx.hbs
│   │   │       ├── index.html.hbs
│   │   │       ├── pages/index.tsx.hbs
│   │   │       └── index.css.hbs
│   │   └── _gitignore
│   │
│   ├── api/
│   │   ├── trpc/              # Copied if --api=trpc
│   │   │   └── src/server/plugins/trpc.ts.hbs
│   │   │   └── src/client/providers/trpc.tsx.hbs
│   │   ├── orpc/              # Copied if --api=orpc
│   │   │   └── src/server/plugins/orpc.ts.hbs
│   │   │   └── src/client/providers/orpc.tsx.hbs
│   │   └── none/              # Copied if --api=none
│   │       └── (empty — no API files)
│   │
│   ├── auth/
│   │   ├── better-auth/       # Copied if --auth=better-auth
│   │   │   ├── src/server/plugins/auth.ts.hbs
│   │   │   ├── src/client/providers/auth.tsx.hbs
│   │   │   ├── src/client/pages/login.tsx.hbs
│   │   │   └── src/db/schema/auth.ts.hbs
│   │   └── none/              # Copied if --auth=none
│   │       └── src/client/providers/auth.tsx.hbs  (stub — null-object)
│   │
│   ├── database/              # Copied if --database is set
│   │   ├── sqlite/
│   │   │   ├── src/db/client.ts.hbs
│   │   │   └── drizzle.config.ts.hbs
│   │   └── postgres/
│   │       ├── src/db/client.ts.hbs
│   │       └── drizzle.config.ts.hbs
│   │
│   └── addons/
│       ├── mcp/
│       │   └── .opencode/mcp.json.hbs
│       ├── skills/
│       │   └── .opencode/skills.json.hbs
│       └── vite-plus/
│           └── vite.config.ts.hbs  (partial — merged with core config)
```

### File-level Selection (Primary Mechanism)

Each handler checks config and processes only matching template prefixes:

```typescript
// handlers/api.ts
if (config.api === "trpc") {
  processTemplatesFromPrefix(vfs, templates, "templates/api/trpc", "", config)
} else if (config.api === "orpc") {
  processTemplatesFromPrefix(vfs, templates, "templates/api/orpc", "", config)
}
// config.api === "none" → no API templates processed
```

### Template-level Conditionals (Secondary)

Used for minor content variations within files:

```handlebars
{{#if (eq runtime "bun")}}
  "bun": "^1.0.0",
{{/if}}
```

### Handlebars Helpers

Registered helpers (matching BTS pattern):

| Helper        | Example                             |
| ------------- | ----------------------------------- |
| `{{eq}}`        | `{{#if (eq runtime "bun")}}`          |
| `{{ne}}`        | `{{#if (ne auth "none")}}`            |
| `{{includes}}`  | `{{#if (includes addons "mcp")}}`     |
| `{{and}}`       | `{{#if (and (eq auth "better-auth") (eq database "sqlite"))}}` |
| `{{or}}`        | `{{#if (or (eq api "trpc") (eq api "orpc"))}}` |

### VirtualFileSystem

In-memory file tree (based on BTS's `memfs` approach):
- `writeFile(path, content)` — add file to VFS
- `readFile(path)` — read from VFS
- `exists(path)` — check existence
- `toTree()` — produce tree structure for CLI display
- `getAllFiles()` — flat list for writing to disk

---

## 4. Execution Flow

```
1. citty parses CLI args → CLIInput object
2. CLI validates input (Zod + custom validation)
3. Interactive prompts fill missing flags (if not --yes)
4. CLIInput → ProjectConfig
5. template-fetcher downloads tarball from GitHub:
   GET https://api.github.com/repos/cybercore-ma/template-amal/tarball/v0.1.0
   → extracts to temp directory
   → loads all .hbs files into Map<string, string>
6. template-generator processes templates:
   a. core handler (always)
   b. api handler (based on config.api)
   c. auth handler (based on config.auth)
   d. database handler (based on config.database + config.orm)
   e. addons handlers (based on config.addons)
   f. post-processors run
7. project-writer writes VFS to <project-name>/ directory
8. git init (if --git)
9. dependency install (if --install)
10. Success output with next steps
```

---

## 5. Post-Processors

After all templates are applied to the VFS, post-processors mutate it programmatically:

### package-json.ts
- Sets project name from config
- Removes unused dependencies based on disabled features
- Sets package manager type and scripts

### env-vars.ts
- Generates `.env` with correct database URLs, auth secrets, etc.
- Feature-gated: only vars for selected features

### readme.ts
- Generates README with enabled features listed, setup instructions

---

## 6. Addon System

Addons are **development environment configurations**, not source code modifications.

### mcp
- Generates `.opencode/mcp.json` with MCP server configurations
- Configures AI coding agent tool access

### skills
- Generates skill configurations for AI coding agents
- Adds `.opencode/skills/` entries

### vite-plus
- Enhances `vite.config.ts` with development extras (HTTPS, tunnel)
- Implemented as a post-processor that modifies the core Vite config in the VFS after template rendering
- Not a separate template file — it mutates `vite.config.ts` in-place

---

## 7. Phase 0 — Template Repository

Separate deliverable: `cybercore-ma/template-amal`

### State
- GitHub repository containing `.hbs` template files
- NOT directly runnable — templates must be rendered by the CLI
- Tagged releases correspond to CLI versions

### Template test strategy
- CLI integration tests render the template and verify output
- Each CI run fetches the template and runs smoke tests on generated projects

### Contents
- `templates/` directory with the structure described in Section 3
- `scripts/generate-embedded-templates.ts` for production builds
- `README.md` documenting the template structure
- Versioned releases (`v0.1.0`, etc.)

---

## 8. CLI Package (`create-cyber-stack`)

### Package.json

```json
{
  "name": "create-cyber-stack",
  "version": "0.1.0",
  "bin": {
    "create-cyber-stack": "dist/cli.mjs"
  },
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs"
    },
    "./cli": {
      "import": "./dist/cli.mjs"
    }
  },
  "files": ["dist"],
  "dependencies": {
    "@clack/prompts": "^1.4.0",
    "citty": "^0.1.6",
    "consola": "^3.4.2",
    "handlebars": "^4.7.9",
    "picocolors": "^1.1.1",
    "zod": "^4.4.0"
  }
}
```

### CI/CD
- Published to npm as `create-cyber-stack`
- Version bumps via changesets or manual tagging
- CI builds all packages, runs tests, publishes

---

## 9. Error Handling

| Scenario                      | Behavior                                                  |
| ----------------------------- | --------------------------------------------------------- |
| Invalid flag value            | Zod validation error, clear message, exit code 1          |
| Network failure (template)    | Retry with backoff, then error: "Could not fetch template" |
| Disk write failure            | Roll back partial writes, show error                      |
| User cancels prompt           | Clean exit, no files written                              |
| Validation conflict (db+orm) | Explain the conflict, suggest fix                         |

---

## 10. Future Considerations

- **Additional templates**: When `--template` gains new values, the handler system extends naturally
- **Deploy targets**: `--web-deploy`/`--server-deploy` flags can be added with their own template handlers
- **Payments**: `--payments polar` future flag, same handler pattern
- **Database setup**: `--db-setup turso/neon/d1` for provisioning
- **Agent integration**: MCP server subcommand (like BTS's `mcp` command)
