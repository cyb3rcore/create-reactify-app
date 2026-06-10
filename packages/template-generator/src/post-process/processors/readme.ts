import type { ProjectConfig } from "@cyber-stack/types";
import type { VirtualFileSystem } from "../../core/virtual-fs";

export function processReadme(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  const features: string[] = ["Fastify + React SSR"];

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
bun install
bun run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| \`bun run dev\`     | Start development server with HMR    |
| \`bun run build\`   | Build for production                 |
| \`bun run start\`   | Start production server              |
| \`bun run prepare\` | Run Panda CSS codegen                |

## Stack

- **Framework:** Fastify 5 + React 19
- **SSR:** @fastify/react + @fastify/vite
- **Styling:** Panda CSS (zero-runtime CSS-in-JS)
- **UI:** Ark UI + Park UI
- **Routing:** react-router 7
- **State:** Valtio
- **Build:** Vite 7
`;

  vfs.writeFile("README.md", readme);
}
