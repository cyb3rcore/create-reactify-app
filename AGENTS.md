# create-reactify-app

CLI scaffolding tool. Consumes templates from `template-salam:main` via GitHub clone.

## Architecture

```
commands/create.ts     ← citty CLI entry, flag definitions, createProject() flow
prompts/index.ts       ← @clack/prompts for missing flags
vendor/schemas.ts      ← Zod schemas for all flags + cross-flag validation
vendor/handlers/*.ts   ← 6 feature handlers (auth, cms, erpnext, posthog, portal, quote)
vendor/generator.ts    ← generateProject() calls handlers in sequence
vendor/core/virtual-fs.ts  ← in-memory VFS, writeProject() writes to disk
utils/template-fetcher.ts  ← clones template-salam from GitHub
```

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
cd packages/cli
bun run build
cd /tmp && rm -rf test-app && node dist/cli.mjs test-app --template salam --auth --cms --yes
```
