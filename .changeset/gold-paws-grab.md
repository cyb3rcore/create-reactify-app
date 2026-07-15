---
"create-reactify-app": patch
---

`db98520`: fix: flatten features into Handlebars template context

Feature flags were nested in `config.features` but Handlebars templates reference them as top-level variables (`{{#if cms}}`, `{{#if auth}}`). Merging `config.features` into the context fixes empty file generation when feature flags are used.

`0c171e7`: feat: register `not` helper for `(not x)` sub-expression in templates

Supports the `@if !x → {{#if (not x)}}` conversion for truthy flag negation, replacing `{{#unless x}}` which had a closing tag mismatch with `@endif → {{/if}}`.
