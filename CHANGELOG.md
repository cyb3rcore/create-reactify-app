# create-reactify-app

## 0.3.0

### Minor Changes

- 06baba1: - 46c60ce: refactor: generic flag processing foundation (commander.js, parseFlags, generic feature iteration)
  - 48fe428: refactor: migrate CLI to commander.js with generic flag parsing
  - d017b1d: refactor: infra-only interactive prompts (remove all feature prompts)
  - c094bbf: refactor: remove 7 hardcoded feature handler files
  - b18453f: docs: add vite-plugin-flatten-ns, dep flow, canonical barrel convention to AGENTS.md
  - 208562c: docs: update AGENTS.md for generic flag architecture
  - 7ec409c: spec: vite-plugin-flatten-ns design document
  - 1c41d77: fix: projectDir default and allowExcessArguments for generic flags
  - c066fa1: refactor: template names resolve dynamically without Zod enum
  - 6cbbd8a: ci: set up changeset-driven release workflow with GitHub Actions
  - 57dc501: fix: add test script to cli package, fix root --filter
- 3c99599: - 1650717..0473122: fix: CI dependency hoisting and binary resolution for GitHub Actions
  - 9b8bc1a..b030014: fix: vitest module resolution and bun --cwd for workspace builds
  - 91b7cb8..dc22839: fix: root devDependencies for vitest and test path resolution
  - e2290e6: fix: add workspaces config for changeset package discovery
  - 3c2e64d: refactor: flatten packages/cli into root package (single-package structure)

## 0.2.8

### Patch Changes

- _(empty bump — version only, no functional changes)_

## 0.2.7

### Patch Changes

- 6955b6d: docs: tighten AGENTS.md
- 832fa25: docs: add AGENTS.md with reference to template-\* project workflows

## 0.2.6

### Patch Changes

- a81d4ab: fix: default to lamsa template; show install command in output

## 0.2.5

### Patch Changes

- _(AI mistake — version bump committed without the feature changes it was meant to release)_

## 0.2.4

### Patch Changes

- _(AI mistake — version bump committed without the feature changes it was meant to release)_

## 0.2.3

### Patch Changes

- _(AI mistake — version bump committed without the feature changes it was meant to release)_

## 0.2.2

### Patch Changes

- _(AI mistake — version bump committed without the feature changes it was meant to release)_

## 0.2.1

### Patch Changes

- 9a1c8a3: fix: change feature flags to boolean type (--auth instead of --auth auth)

## 0.2.0

### Minor Changes

- Initial public release with citty-based CLI, template-salam and template-lamsa support, and feature flag scaffolding
