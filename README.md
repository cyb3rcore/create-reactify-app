# create-reactify-app

Scaffold a **Reactify** project — a production-ready stack built on **Fastify + React SSR + RSC** with file-system routing, server actions, streaming, and Valtio integration.

## Usage

```bash
npx create-reactify-app my-app
cd my-app
npm run dev
```

This creates a project directory `my-app` with a fully configured Reactify application, fetches the latest template from the [template-lamsa](https://github.com/cyb3rcore/template-lamsa) repository, and writes everything to disk.

## What's Included

- **File-system routing** — routes map to the `pages/` directory automatically
- **React Server Components (RSC)** — server-rendered React with streaming
- **Fastify backend** — performant Node.js HTTP server
- **Vite dev server** — fast HMR and production builds
- **Server Actions** — call server functions directly from client components
- **Valtio state management** — reactive proxy-based state

## Options

| Argument            | Description                            |
|---------------------|----------------------------------------|
| `projectName`       | Project name or target directory       |
| `--runtime`         | Runtime (`bun` or `node`, default: bun)|
| `--package-manager` | Package manager (`npm`, `pnpm`, `bun`) |
| `--git`             | Initialize git repo (default: true)    |
| `--no-git`          | Skip git initialization                |
| `--install`         | Install dependencies after scaffolding |
| `--yes` / `-y`      | Skip prompts, use defaults             |
| `--dry-run`         | Validate configuration without writing |

## Requirements

- **Node.js >= 20** or **Bun >= 1.0**
- A Reactify project requires **Fastify >= 5**, **React >= 19**, and **Vite >= 6**

## Related

- [@cyb3rcore/reactify](https://github.com/cyb3rcore/reactify) — the React SSR + RSC framework for Fastify
- [template-lamsa](https://github.com/cyb3rcore/template-lamsa) — the default project template
- [reactify.sh](https://reactify.sh) — documentation site
