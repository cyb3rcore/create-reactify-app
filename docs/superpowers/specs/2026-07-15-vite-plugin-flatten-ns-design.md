# vite-plugin-flatten-ns

Vite plugin that flattens namespace re-exports (`export * as Name from './module'`) into individual flat re-exports so React Server Components can register each sub-component as a separate client reference.

## Problem

Compound components are common in UI libraries (Park UI, Radix, Ark UI). They export grouped objects like `export const Dialog = { Root, Trigger, Content }` or use namespace re-exports like `export * as Dialog from './dialog'`.

Inside `@vitejs/plugin-rsc`'s `rsc:use-client` transform, these patterns produce a single `registerClientReference` proxy for the entire namespace. Accessing `Dialog.Root` from a server component hits the proxy trap and throws, because the RSC runtime cannot statically trace property lookups on a client reference.

The upstream (`vite-plugin-react`) explicitly does not handle `export * as ns from` expansion. PRs #1234 and #1239 added `transformExpandExportAll` for bare `export * from` only. For namespace re-exports, the maintainers consider it a semantically different pattern. `wrap-export.ts` now throws on `ExportAllDeclaration` with an exported identifier — a known, accepted regression.

A custom plugin is the correct solution.

## Solution

A Vite plugin with two `enforce: 'pre'` transform passes that run before `rsc:use-client`:

### Pass 1: Component file enrichment

Detects `export const X = { key1, key2 }` where property names reference local `const`/`function`/`let` declarations at module scope. Adds the `export` keyword to those declarations in-memory.

**Input** (card.tsx):
```ts
const Root = withProvider(ark.div, 'root')
const Header = withContext(ark.div, 'header')
export const Card = { Root, Header }
```

**Output** (in-memory, no disk writes):
```ts
export const Root = withProvider(ark.div, 'root')
export const Header = withContext(ark.div, 'header')
export const Card = { Root, Header }
```

This makes `Root`, `Header` etc. available as named exports that Pass 2 can re-export.

**Conservatism**: Only handles property values that are simple Identifier references to module-scope declarations. Skips dynamic keys, spreads, and computed properties.

### Pass 2: Barrel file flattening

Intercepts barrel files (default: `**/components/ui/index.ts`). Finds `export * as Name from './module'`, loads the target module (already enriched by Pass 1 if applicable), extracts named value exports, and appends flat re-exports.

**Input** (barrel):
```ts
'use client'
export * as Card from './card'
export * as Dialog from './dialog'
```

**Output** (in-memory):
```ts
'use client'
export * as Card from './card'
export { Root as CardRoot, Header as CardHeader, Body as CardBody, Footer as CardFooter, Title as CardTitle, Description as CardDescription } from './card'
export * as Dialog from './dialog'
export { Root as DialogRoot, Trigger as DialogTrigger, Content as DialogContent } from './dialog'
```

Each flat export receives its own `registerClientReference` from the RSC transform. Server components import `{ CardRoot }` instead of accessing `Card.Root`.

## Package

- **Name**: `vite-plugin-flatten-ns`
- **Type**: `"module"` ESM-only Node package
- **Language**: TypeScript, compiled to JS
- **Dependencies**: `magic-string`, `estree-walker` (uses Vite's `parseAstAsync` for parsing)

## Plugin options

```ts
type Options = {
  // Glob(s) for barrel files to flatten. Default: ['**/components/ui/index.ts']
  include?: string | string[]
  // Glob(s) for component files to enrich. Default: same directories as barrels
  includeComponents?: string | string[]
  // Keep original export * as statements (default: true)
  keepNamespaceExports?: boolean
}
```

## Edge cases

| Case                              | Behavior                                                     |
| --------------------------------- | ------------------------------------------------------------ |
| Target module has no named exports | No-op                                                        |
| Name collision                    | Skip conflicting name, warn                                  |
| Type-only exports                 | Skipped — not needed for RSC references                      |
| Name equals namespace (`export * as Dialog from './dialog'` where Dialog is also a named export of the module) | Excluded from flat list |
| Circular re-exports               | Plugin detects and bails with a warning                      |
| Non-static object keys            | Skipped — can't statically determine                         |
| No `export * as` in barrel         | Fast early return, zero overhead                             |

## Non-goals (v1)

- No runtime behavior
- No config file — options passed via Vite config object
- No external parsing dependencies beyond what Vite provides
- No type export expansion

## Distribution

Published as a standard npm package. Consumed in `vite.config.ts`:

```ts
import { flattenNamespaceExports } from 'vite-plugin-flatten-ns'

export default defineConfig({
  plugins: [
    flattenNamespaceExports(),
    reactifyPlugin({ ts: true }),
  ],
})
```

The plugin must be placed before the RSC plugin in the array because `enforce: 'pre'` ensures it runs first, but the array position documents the dependency.

## Testing strategy

- Unit tests for both transform passes with known input/output fixtures
- Integration test: scaffold a template-salam app, add a compound component, verify RSC page renders without proxy errors
- Edge case fixtures: no namespace exports, empty module, name collisions, type-only exports
