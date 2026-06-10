import type { ProjectConfig } from "@cyber-stack/types";
import type { VirtualFileSystem } from "../../core/virtual-fs";

export function processEnvVars(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  const vars: string[] = [
    `# ${config.projectName}`,
    `NODE_ENV=development`,
  ];

  if (config.database === "sqlite") {
    vars.push(`DATABASE_URL=file:./data/${config.projectName}.db`);
  } else if (config.database === "postgres") {
    vars.push(`DATABASE_URL=postgres://localhost:5432/${config.projectName}`);
  }

  if (config.auth !== "none") {
    vars.push(`AUTH_SECRET=change-me-to-a-random-secret`);
    vars.push(`AUTH_URL=http://localhost:3000`);
  }

  vfs.writeFile(".env", vars.join("\n") + "\n");
}
