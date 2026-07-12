# template-salam — Design Specification

**Date:** 2026-07-12
**Status:** Draft

## Overview

Template-salam is a Handlebars template collection for the `create-reactify-app` CLI. It scaffolds Fastify 5 + React 19 + Vite 8 projects built on `@cyb3rcore/reactify`, with Panda CSS and Park UI as the base design system. Everything beyond the core stack is optional and controlled by feature flags.

This template replaces `template-lamsa`, which provided only a bare scaffold with demo pages. Template-salam provides a production-ready starting point with a design system, CMS infrastructure, ERPNext integration, and authentication — all opt-in.

The template follows the two-branch workflow established by `template-amal`: a `dev` branch with runnable TypeScript and `// @if` markers, and a `main` branch with generated `.hbs` files consumed by the CLI.

## Architecture

### Core Stack (always included)

| Layer      | Choice                           |
| ---------- | -------------------------------- |
| HTTP       | Fastify 5                        |
| SSR/RSC    | `@cyb3rcore/reactify` (fork)     |
| UI         | React 19                         |
| Build      | Vite 8                           |
| CSS        | Panda CSS (zero-runtime)         |
| Components | Park UI (headless primitives)    |
| Dev runner | tsx                              |

### Feature Flags (all optional)

| Flag        | Description                                      | Depends on     |
| ----------- | ------------------------------------------------ | -------------- |
| `--erpnext`   | ERPNext REST client, setup scripts, webhooks     | —              |
| `--auth`      | OTP + JWT authentication, login page             | —              |
| `--cms`       | Section system: partition, SectionRenderer, sections | —           |
| `--posthog`   | PostHog analytics proxy + provider               | —              |
| `--portal`    | Authenticated dashboard layout + pages           | `--auth`       |
| `--quote`     | Quote banner + multi-step quote form             | —              |

### Template Repository Structure

```
template-salam/
├── package.json                 # Template metadata
├── README.md
├── scripts/
│   └── generate-templates.ts    # Dev → Main converter
├── src/                         # Dev branch: runnable TypeScript
│   ├── server.ts                # Fastify + reactify server entry
│   ├── lib/
│   │   ├── erpnext.ts           # (if --erpnext) ERPNext REST client
│   │   └── jwt.ts               # (if --auth) JWT sign/verify
│   ├── plugins/
│   │   ├── posthog-proxy.ts     # (if --posthog) analytics proxy
│   │   └── webhooks.ts          # (if --erpnext) ERPNext webhook receiver
│   ├── services/
│   │   ├── auth.service.ts      # (if --auth) OTP + user management
│   │   └── lead.service.ts      # (if --erpnext) lead/opportunity creation
│   ├── procedures/
│   │   └── schemas/
│   │       └── sections.ts      # (if --cms) Zod schemas for section types
│   └── client/
│       ├── index.html           # HTML shell with $app/mount.ts
│       ├── root.tsx             # Root with feature providers
│       ├── panda.config.ts      # Panda CSS design tokens
│       ├── theme/               # Recipes, colors, keyframes, text styles
│       ├── components/
│       │   ├── ui/              # Park UI components (button, card, heading, etc.)
│       │   ├── layout/          # Header, Footer, MobileNavDrawer
│       │   └── sections/        # (if --cms) hero, bento, about, contact-form
│       ├── pages/
│       │   ├── index.tsx        # SSR landing page (or RSC with --cms)
│       │   ├── login.tsx        # (if --auth)
│       │   └── dashboard.tsx    # (if --portal)
│       ├── layouts/
│       │   ├── default.tsx      # Always included
│       │   └── portal.tsx       # (if --portal) authenticated layout
│       └── lib/
│           ├── sections.ts      # (if --cms) partition() utility
│           └── use-form.ts      # (if --quote) form state hook
├── templates-src/               # Alternative implementations (no-op stubs)
└── docs/
    └── dev-workflow.md          # Two-branch workflow documentation
```

## Feature Modules

### Panda CSS + Park UI (always on)

The design system uses Panda CSS for zero-runtime CSS-in-JS with static extraction. It includes:

- **Color tokens**: Light/dark semantic palette (neutral + accent)
- **Text styles**: Full scale (xs through 7xl)
- **Recipes**: Button, Card, Heading, Text, Badge, Spinner, BentoGrid
- **Keyframes**: Slide, fade, scale, collapse animations
- **Global CSS**: Reset, body defaults, CSS custom properties

Park UI provides headless primitives for accessible components. The template ships button, card, heading, text, badge, and spinner as styled recipes wrapping Ark UI primitives.

### ERPNext (`--erpnext`)

Provides the infrastructure to connect an ERPNext instance:

- **`lib/erpnext.ts`**: REST client with `get()`, `list()`, `create()`, `update()`, `callMethod()`, `uploadFile()`. Generic — no business-specific DocTypes.
- **`plugins/webhooks.ts`**: Fastify plugin receiving ERPNext webhook events.
- **`plugins/scheduler.ts`**: node-cron job runner for automation.
- **`scripts/setup-erpnext.ts`**: Creates `Web App Section` (child DocType) and `Web App Page` (parent DocType) in ERPNext. These are the CMS data store.
- **`scripts/setup-phase0.ts`**: Sets up custom fields, quotation workflow, webhooks, and project template. Only generated when `--quote` is also enabled.

### Auth (`--auth`)

OTP-based authentication with JWT session management:

- **`lib/jwt.ts`**: Sign and verify JWT tokens.
- **`services/auth.service.ts`**: OTP generation, verification, user lookup via ERPNext.
- **`pages/login.tsx`**: Login page with email input, OTP verification, and callback handling. Three states: email entry → OTP entry → authenticated redirect.

### CMS (`--cms`)

Full section-based CMS infrastructure modeled after isma's pattern:

- **`partition()` utility**: Extracts specific sections for explicit layout, returns remaining sections for generic rendering. Same 16-line implementation with full TypeScript inference.
- **`SectionRenderer`**: Generic component that maps sections to registered components via the `sectionComponents` registry.
- **`sectionComponents` registry**: Maps type strings to React components using a discriminated union.
- **Zod schemas**: Discriminated union of all section types, validated at the data boundary.
- **Generic section components** (four shipped):

| Component     | Type      | Schema fields                                                            |
| ------------- | --------- | ------------------------------------------------------------------------ |
| **Hero**      | `hero`      | `heading`, `subtitle`, `ctas[]` (label, link, variant, icon), `image_url`  |
| **Bento**     | `bento`     | `cards[]` (icon, title, text, image_url, colSpan, rowSpan, start, order)  |
| **About**     | `about`     | `heading`, `body[]`, `stats[]` (value, label), `image_url`                  |
| **Contact**   | `contact-form` | `heading` (simple form, no backend wiring)                              |

Adding a new section type requires: Zod schema → component → registry entry. No other changes needed.

### PostHog (`--posthog`)

- **`plugins/posthog-proxy.ts`**: Fastify plugin that proxies `/e/*` requests to `eu.i.posthog.com`, bypassing ad blockers. Strips cookies, sets `X-Forwarded-For`.
- **`root.tsx`**: Wraps app in `PostHogProvider` with `posthog-js` pointed at the proxy.
- **Server-side**: Optional `PostHog` Node client for backend event capture.

### Portal (`--portal`)

- **`layouts/portal.tsx`**: Authenticated layout with nav sidebar.
- **`pages/dashboard.tsx`**: Generic dashboard page (placeholder). No assumptions about projects, products, or business entities.
- **Middleware**: Route guard that redirects unauthenticated users to `/login`.

### Quote (`--quote`)

- **`components/sections/quote-banner.tsx`**: Generic call-to-action banner with heading, text, and CTA button.
- **`components/sections/quote-form.tsx`**: Multi-step form builder driven by CMS content schema. Supports 10 field types (text, input, textarea, select, radio, checkbox, checkbox_group, file_upload, separator, group) with validation, grouping, and lead capture points.
- **`lib/use-form.ts`**: Form state management hook with validation and PostHog interaction tracking.
- The quote-form schema is a full form builder in JSON: steps with fields, validation rules, lead capture configuration, and success screen content.

## CLI Integration

The `create-reactify-app` CLI follows the `create-cyber-stack` pattern exactly:

1. **Flag definitions**: `citty` arg definitions for each flag.
2. **Interactive prompts**: `@clack/prompts` for missing flags (skipped with `--yes`).
3. **Validation**: Zod schema with cross-flag dependencies (`--portal` requires `--auth`, etc.).
4. **Template fetching**: SSH clone of `template-salam`, reads `templates/` directory.
5. **Handlebars rendering**: `{{#if}}` blocks for feature-gated content. Only `{{projectName}}` as a variable.
6. **Post-processors**: Set package name, write `.env`, generate README.

The `@cyber-stack/types` schemas serve as the reference for valid flag values. Adding a new flag value (e.g., a new auth provider) requires:
1. A directory in the template repo
2. An entry in the CLI's Zod schema

## Two-Branch Template Workflow

The template repo uses two branches:

| Branch | Contents | Runnable | Purpose |
|--------|----------|----------|---------|
| `main` | `.hbs` template files | No | Fetched by CLI at scaffold time |
| `dev`  | TypeScript source with `@if` markers | Yes | Where you edit code |

**Marker conversion** (in `scripts/generate-templates.ts`):

| Dev marker                  | Template output                      |
| --------------------------- | ------------------------------------ |
| `// @if feature`              | `{{#if (ne feature "none")}}`          |
| `// @if feature::value`       | `{{#if (eq feature "value")}}`         |
| `// @endif`                   | `{{/if}}`                            |
| `// @dev` / `// @enddev`       | (Stripped from template)             |

Files in `templates-src/` are alternative implementations (e.g., no-op stubs) copied verbatim to `templates/`.

**Update workflow:**
```bash
git checkout dev            # Edit TypeScript source
bun run scripts/generate-templates.ts  # Generate .hbs files
git add templates/ && git commit

git checkout main
git checkout dev -- templates/ docs/ scripts/generate-templates.ts
git add -A && git commit
git push

git checkout dev
git push
```

## Generated Project Layout

```
my-app/
├── package.json
├── panda.config.ts
├── postcss.config.cjs
├── tsconfig.json
├── vite.config.ts
├── scripts/                  # (if --erpnext)
│   ├── setup-erpnext.ts
│   ├── setup-phase0.ts
│   ├── seed-pages.ts         # (if --cms)
│   ├── seed-images.ts
│   └── seed-test-data.ts
├── src/
│   ├── server.ts             # Fastify + reactify
│   ├── server/
│   │   ├── lib/
│   │   │   ├── erpnext.ts    # (if --erpnext)
│   │   │   └── jwt.ts        # (if --auth)
│   │   ├── plugins/
│   │   │   ├── posthog-proxy.ts  # (if --posthog)
│   │   │   ├── webhooks.ts      # (if --erpnext)
│   │   │   └── scheduler.ts     # (if --erpnext + --quote)
│   │   └── services/
│   │       ├── auth.service.ts   # (if --auth)
│   │       └── lead.service.ts   # (if --erpnext)
│   └── client/
│       ├── index.html
│       ├── index.css
│       ├── root.tsx
│       ├── env.d.ts
│       ├── theme/
│       │   ├── recipes/
│       │   ├── colors/
│       │   ├── tokens/
│       │   └── ...
│       ├── components/
│       │   ├── ui/          # Button, Card, Heading, Text, Badge, Spinner, BentoGrid
│       │   ├── sections/    # (if --cms) Hero, Bento, About, ContactForm
│       │   │   └── (if --quote) QuoteBanner, QuoteForm
│       │   └── layout/      # Header, Footer, MobileNavDrawer
│       ├── pages/
│       │   ├── index.tsx
│       │   ├── login.tsx    # (if --auth)
│       │   └── dashboard.tsx# (if --portal)
│       ├── layouts/
│       │   ├── default.tsx
│       │   └── portal.tsx   # (if --portal)
│       └── lib/
│           ├── sections.ts  # (if --cms) partition()
│           └── use-form.ts  # (if --quote)
└── .github/workflows/ci.yml
```

## Non-Goals

- No ORPC or tRPC layer — RSC and Server Actions replace them.
- No database scaffolding — the template targets ERPNext for persistence.
- No test files in generated projects (user adds their own).
- No deployment configuration beyond the default Vite SSR build.
- No documentation pages in generated projects.
- No business-specific content or assumptions about entity types.

## Open Questions

None. All design decisions have been validated.
