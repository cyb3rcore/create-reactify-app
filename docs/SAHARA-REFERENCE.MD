This is the official `@fastify/react` starter template.

Here's a full analysis of the **Sahara** project's stack at ~/dev/web/sahara/

---

## Full Stack Analysis

| Layer            | Technology                                                    |
| ---------------- | ------------------------------------------------------------- |
| **Server Runtime**   | Fastify 5 (Node.js)                                           |
| **SSR Framework**    | `@fastify/react` 1 + `@fastify/vite` 8                            |
| **UI Library**       | React 19                                                      |
| **Routing**          | react-router 7                                                |
| **State Management** | Valtio 2 (proxy-based reactive state)                         |
| **Styling**          | **Panda CSS** 1.8 — zero-runtime CSS-in-JS (generates static CSS) |
| **UI Components**    | Ark UI 5 (headless, Zag-based primitives) + Lucide icons      |
| **Head Management**  | @unhead/react                                                 |
| **Build/Bundler**    | Vite 7 + `@vitejs/plugin-react` + `vite-tsconfig-paths`           |
| **Language**         | TypeScript 5.9 (strict) with `@/` → `./src/` path aliases         |
| **Package Manager**  | pnpm                                                          |

---

## How SSR Works

### Architecture

This is the **official `@fastify/react` starter template**. The SSR pipeline is Vite-driven end-to-end:

```
Request → Fastify → @fastify/vite → @fastify/react renderer → Vite SSR build → React renderToString → HTML → Client hydration
```

### Server Entry (`src/server.ts`)

```ts
Fastify
  → registers @fastify/formbody
  → registers @fastify/vite with @fastify/react as the renderer
  → waits for Vite to be ready
  → listens on port 3000
```

The server is intentionally minimal (~25 lines). `@fastify/vite` handles all the complexity:
- In **dev mode**: spins up Vite's dev server internally (HMR, Fast Refresh)
- In **production**: serves pre-bundled assets from `dist/`

### Rendering Pipeline

1. **File-system routing**: `@fastify/react` auto-discovers page components from `src/client/pages/`. Each page file becomes a route.

2. **Server-side render**: When a request arrives, React renders the page component to static HTML on the server using `renderToString` (or streaming via `renderToPipeableStream`). Each page receives:
   - `url` — the current request URL
   - `routes` — the discovered route definitions
   - `head` — metadata from the page's `getMeta()` export
   - `ctxHydration` — serialized Valtio state for client rehydration
   - `routeMap` — per-route context

3. **HTML injection**: The rendered HTML is injected into `src/client/index.html` at the `<!-- element -->` placeholder. The auto-generated `/$app/mount.ts` script handles client hydration via React's `hydrateRoot`.

4. **SSR-aware state**: The index page demonstrates SSR-specific branching:
   ```tsx
   if (import.meta.env.SSR) {
     state.message = 'Welcome to @fastify/react!'
   }
   ```
   Valtio state set on the server is automatically serialized into the HTML and rehydrated on the client (no manual JSON script tags needed).

5. **Client hydration**: The browser loads the SSR'd HTML, then `$app/mount.ts` mounts the same React tree client-side, attaching event handlers to existing DOM — no flash of empty content.

### Layout System

All pages are wrapped by `src/client/layouts/default.jsx` (a simple `<Suspense>` wrapper). This is provided by the `@fastify/react` convention.

### Build Process

Two separate Vite builds produce the final output:

| Build  | Command                  | Output                                       |
| ------ | ------------------------ | -------------------------------------------- |
| **Client** | `vite build --ssrManifest` | Static assets + SSR manifest (chunk mapping) |
| **Server** | `vite build --ssr`         | Server-side bundle                           |

Both go to `dist/`. The SSR manifest is used in production to know which client chunks correspond to server-rendered components for optimal resource loading.

### CSS in SSR

**Panda CSS** is zero-runtime — all CSS is generated statically at build time by `@pandacss/dev/postcss` (via `postcss.config.cjs`). The generated styles live in `styled-system/`. During SSR, Panda's utility classes (`css()`, recipes) are already resolved to static class names, so the server-rendered HTML includes the correct CSS class references. The actual CSS is served as a static stylesheet (`/index.css`) loaded in the HTML `<head>`, ensuring no FOUC.

### Key Takeaway

This is a **Vite-centric SSR architecture** — the same Vite pipeline powers both development (HMR, Fast Refresh) and production (bundled SSR + static assets). `@fastify/react` acts as the glue between Fastify, Vite, and React's server rendering capabilities, with minimal boilerplate required from the developer.

---


