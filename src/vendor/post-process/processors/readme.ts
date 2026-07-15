import type { ProjectConfig } from "../../schemas";
import type { VirtualFileSystem } from "../../core/virtual-fs";

export function processReadme(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  const readme = `# ${config.projectName}

Fastify + React SSR + RSC

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
