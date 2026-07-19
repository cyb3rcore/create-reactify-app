# create-reactify-app

## 0.3.2

- **fix:** flatten features into Handlebars template context (`db98520`)

  Feature flags were nested in `config.features` but Handlebars templates reference them as top-level variables. Merging fixes empty file generation when feature flags are used.

- **feat:** register `not` helper for `(not x)` sub-expression in templates (`0c171e7`)

  Supports `@if !x → {{#if (not x)}}` conversion for truthy flag negation, replacing `{{#unless x}}` which had a closing tag mismatch with `@endif → {{/if}}`.

## 0.3.1

- **feat:** generic flag processing foundation, migrate CLI to commander.js (`06baba1`)

  Replaced 7 hardcoded feature handler files with generic flag iteration. Infra-only interactive prompts. Removed Zod enum dependency.

- **ci:** set up changeset-driven release workflow with GitHub Actions (`6cbbd8a`)

- **fix:** CI dependency hoisting and binary resolution for GitHub Actions (`3c99599`)

  Multiple CI fixes for dependency hoisting, module resolution, and binary discovery across monorepo refactor.

- **fix:** template names resolve dynamically without Zod enum (`1c41d77`)

- **docs:** add vite-plugin-flatten-ns, dep flow, canonical barrel convention (`b18453f`)

## 0.2.8

- _(empty bump — version only, no functional changes)_

## 0.2.7

- **docs:** tighten AGENTS.md with project workflow references (`6955b6d`, `832fa25`)

## 0.2.6

- **fix:** default to lamsa template; show install command in output (`a81d4ab`)

## 0.2.5

- _(AI mistake — version bump committed without the feature changes)_

## 0.2.4

- _(AI mistake — version bump committed without the feature changes)_

## 0.2.3

- _(AI mistake — version bump committed without the feature changes)_

## 0.2.2

- _(AI mistake — version bump committed without the feature changes)_

## 0.2.1

- **fix:** change feature flags to boolean type (`--auth` instead of `--auth auth`) (`9a1c8a3`)

## 0.2.0

- **feat:** initial public release with citty-based CLI, template-salam and template-lamsa support, and feature flag scaffolding
