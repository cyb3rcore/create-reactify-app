---
"create-reactify-app": patch
---

fix: flatten features into Handlebars template context (db98520)

Feature flags were nested in `config.features` but Handlebars templates
reference them as top-level variables (`{{#if cms}}`, `{{#if auth}}`).
Merging `config.features` into the context fixes empty file generation
when feature flags are used.

feat: register `not` helper for `(not x)` sub-expression in templates (0c171e7)

Supports the `@if !x → {{#if (not x)}}` conversion for truthy flag
negation, replacing `{{#unless x}}` which had a closing tag mismatch
with `@endif → {{/if}}`.
