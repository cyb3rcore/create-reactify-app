# create-reactify-app

CLI scaffolding tool. Consumes templates from `template-salam:main` via GitHub clone.

## Architecture

```
commands/create.ts     ← citty CLI entry, flag definitions, createProject() flow
prompts/index.ts       ← @clack/prompts for missing flags
vendor/schemas.ts      ← Zod schemas for all flags + cross-flag validation
vendor/handlers/*.ts   ← 6 feature handlers (auth, cms, erpnext, posthog, portal, quote)
vendor/generator.ts    ← generateProject() calls handlers in sequence
  └─ processCore()    → handles templates/core/*.hbs (always included)
  └─ feature handlers → handles templates/features/<name>/*.hbs
  └─ runPostProcessors() → only changes pkg.name, writes .env, writes README
vendor/core/virtual-fs.ts  ← in-memory VFS, writeProject() writes to disk
utils/template-fetcher.ts  ← clones template-salam from GitHub
```

**Dependencies flow**: The generated app's `package.json` comes from `templates/core/package.json.hbs`, which is auto-generated from template-salam's root `package.json` by `scripts/generate-templates.ts`. Adding a dependency to template-salam's own `package.json` and regenerating templates makes it flow to all generated apps automatically. The CLI has **no programmatic dependency injection** — all deps are handled through templates.

## Feature handlers

All follow the same pattern:

```ts
export function processFeature(vfs, templates, config) {
  if (config.feature === "none") return;
  processTemplatesFromPrefix(vfs, templates, "templates/features/feature", "", config);
}
```

## Adding a feature flag

1. Add Zod enum in `vendor/schemas.ts`
2. Add citty flag in `commands/create.ts`
3. Create handler in `vendor/handlers/` following the pattern above
4. Call it from `vendor/generator.ts` in generateProject()

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
cd packages/cli
bun run build
npm version patch --no-git-tag-version
npm publish
cd ../..
git add packages/cli/package.json
git commit -m "chore: bump to v$(node -p 'require(\"./packages/cli/package.json\").version')"
git push origin main
```

`npm whoami` confirms you're logged in — no `.npmrc` token dance needed.

## Dev setup

```bash
# Build CLI and scaffold a test app
cd packages/cli && bun run build
cd /tmp && rm -rf test-app && node dist/cli.mjs test-app --template salam --auth --cms --yes

# Quick test
cd /tmp/test-app && bun i && bun run dev &
sleep 12 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```
