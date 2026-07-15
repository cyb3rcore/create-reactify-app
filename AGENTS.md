# create-reactify-app

CLI scaffolding tool. Consumes templates from `template-salam:main` via GitHub clone.

## Architecture

```
src/commands/create.ts     ← commander.js CLI entry, infra-flag definitions, createProject() flow
src/prompts/index.ts       ← @clack/prompts for infra-only missing flags (project name, runtime, pm)
src/vendor/schemas.ts      ← Zod schemas for infra fields + generic features: Record<string, string|boolean>
src/vendor/flag-parser.ts  ← parseFlags() extracts --flag / --flag value from argv into features record
src/vendor/generator.ts    ← generateProject() discovers templates/features/<name>/ dirs and processes
                             only those matching a truthy feature flag
  └─ processTemplatesFromPrefix() → handles templates/<prefix>/*.hbs
  └─ shouldProcessFeature()      → naming-convention gating (see below)
  └─ discoverFeatureDirs()       → scans TemplateMap for templates/features/ paths
  └─ runPostProcessors()         → only changes pkg.name, writes .env, writes README
src/vendor/__tests__/       ← vitest unit tests for flag-parser, schemas, generator
src/vendor/core/virtual-fs.ts  ← in-memory VFS, writeProject() writes to disk
src/utils/template-fetcher.ts  ← clones template-salam from GitHub
```

## CLI: Infrastructure vs Features

Two knowledge domains:

1. **Infrastructure** — declared in commander.js: `projectName`, `--template`, `--yes`, `--package-manager`, `--git`/`--no-git`, `--install`, `--dry-run`, `--runtime`. Only these have typed options and interactive prompts.

2. **Features** — never declared in the CLI. Any `--flag` or `--flag value` not in the infra set is collected by `parseFlags()` into a `features` record and passed to the Handlebars template context. The template repo decides what to do with them.

The CLI is stack-agnostic. A user discovers features by reading the template source's `// @if` markers.

## Feature directory naming convention

The generator processes `templates/features/<name>/` directories based on the features record:

| Directory         | Processed when                    |
|-------------------|-----------------------------------|
| `auth`            | `features.auth` truthy            |
| `cms-shared`      | `features.cms` truthy             |
| `cms-erpnext`     | `features.cms === "erpnext"`      |
| `cms-sveltia`     | `features.cms === "sveltia"`      |
| `erpnext`         | `features.erpnext` truthy         |
| `multi-company`   | `features.multiCompany` truthy    |
| `quote`           | `features.quote` truthy           |

Pattern: `<name>-<shared>` for value-agnostic shared infrastructure, `<name>-<value>` for value-specific variants.

## Adding a feature flag

1. Add `// @if feature_name` markers in the template source (`template-salam` dev branch)
2. The CLI picks it up automatically — no code changes needed

The template's `generate-templates.ts` converts markers to Handlebars:
- `// @if auth` → `{{#if auth}}`
- `// @if !auth` → `{{#unless auth}}`
- `// @if cms::sveltia` → `{{#if (eq cms "sveltia")}}`

Test with: `node dist/cli.mjs my-app --feature-name --template salam --yes`

## Templates

Fetched from `template-salam:main` at scaffold time. The template repo uses a two-branch model — source on `dev`, `.hbs` files on `main`. Changes to templates must be pushed to template-salam `main` for the CLI to pick them up.

**When working on any template-* project (`template-salam`, `template-amal`, `template-lamsa`, etc.), read that project's `AGENTS.md`** for the full workflow guidance. They all follow the same two-branch model with feature flag markers, FILE_MAP, and sync process — just different contents and styling.

## `vite-plugin-flatten-ns`

The plugin `vite-plugin-flatten-ns` (published on npm, github.com/cyb3rcore/vite-plugin-flatten-ns) is integrated into template-salam and flows to generated apps. It solves RSC compound component issues.

**What it does**: Runs before `@vitejs/plugin-rsc`'s `rsc:use-client` transform. Two passes:

- **Pass 1 (component enrichment)**: Detects `export const Component = { Part1, Part2 }` — an object literal referencing local `const` declarations — and adds `export` to those declarations in-memory. You do not need to manually add `export const Part1` in component files.
- **Pass 2 (barrel flattening)**: Handles both `export * as Name from './module'` and `export { Name } from './module'` in barrel files. For `export * as`, it flattens all named exports. For `export { Name }`, it detects if `Name` is a compound object and injects flat re-exports for its parts.

**Canonical barrel convention** (matching Park UI, isma, liyem):
```ts
// Compound/multi-part components → namespace re-export
export * as Card from './card'
export * as Dialog from './dialog'

// Simple/leaf components → named export with type
export { Button, type ButtonProps } from './button'
export { Heading, type HeadingProps } from './heading'
```

**Integration check**: When debugging a scaffolded app with the plugin:
1. Check the barrel uses `export * as` for compound components
2. Verify component files have `'use client'` when using `forwardRef`/`createContext`
3. Check the RSC page imports flat names (`BentoGridRoot`) instead of dotted access (`BentoGrid.Root`)
4. If `React is not defined` error: the plugin's esbuild `jsx: 'automatic'` mode is the fix
5. If `this.load()` errors: the plugin reads files directly with `fs.readFileSync` (not available in transform hooks)

## Release

```bash
bun run build
npm version patch --no-git-tag-version
npm publish
git add package.json
git commit -m "chore: bump to v$(node -p 'require(\"./package.json\").version')"
git push origin main
```

`npm whoami` confirms you're logged in — no `.npmrc` token dance needed.

## Dev setup

```bash
# Build CLI and scaffold a test app
bun run build
cd /tmp && rm -rf test-app && node dist/cli.mjs test-app --template salam --auth --cms erpnext --yes

# Quick test
cd /tmp/test-app && bun i && bun run dev &
sleep 12 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

## Testing

```bash
bun run test
```
