import type { ProjectConfig } from "@cyber-stack/types";
import type { VirtualFileSystem } from "../../core/virtual-fs";

export function processReadme(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  const features: string[] = ["Fastify + React SSR + RSC"];

  if (config.api === "trpc") features.push("tRPC API layer");
  else if (config.api === "orpc") features.push("OpenRPC API layer");

  if (config.auth === "better-auth") features.push("Better Auth");

  if (config.database === "sqlite") features.push("SQLite (via libsql + Drizzle ORM)");
  else if (config.database === "postgres") features.push("PostgreSQL (via Drizzle ORM)");

  if (config.addons.length > 0) {
    features.push(...config.addons.map((a) => `Addon: ${a}`));
  }

  const readme = `# ${config.projectName}

${features.join(" | ")}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| \`npm run dev\`     | Start development server with HMR     |
| \`npm run build\`   | Build for production                  |
| \`npm run start\`   | Start production server               |

## Stack

- **Framework:** Fastify 5 + React 19 + Vite 8
- **SSR:** Reactify (@cyb3rcore/reactify)
- **RSC:** React Server Components with Fastify context bridge
- **Routing:** File-system based (reactify/router)
- **State:** Valtio
- **Streaming:** React 19 renderToReadableStream
`;

  vfs.writeFile("README.md", readme);
}
