import type { ProjectConfig } from "../../schemas";
import type { VirtualFileSystem } from "../../core/virtual-fs";

export function processEnvVars(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  const vars: string[] = [
    `# ${config.projectName}`,
    `NODE_ENV=development`,
  ];

  vfs.writeFile(".env", vars.join("\n") + "\n");
}
