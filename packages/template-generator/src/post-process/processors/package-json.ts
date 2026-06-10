import type { ProjectConfig } from "@cyber-stack/types";
import type { VirtualFileSystem } from "../../core/virtual-fs";

export function processPackageJson(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  const content = vfs.readFile("package.json");
  if (!content) return;

  const pkg = JSON.parse(content);

  pkg.name = config.projectName;

  if (config.api === "none" && pkg.dependencies) {
    delete pkg.dependencies["@trpc/server"];
    delete pkg.dependencies["@orpc/server"];
    delete pkg.dependencies["@trpc/client"];
    delete pkg.dependencies["@orpc/client"];
  }

  if (config.auth === "none" && pkg.dependencies) {
    delete pkg.dependencies["better-auth"];
  }

  if (config.database === "none" && pkg.dependencies) {
    delete pkg.dependencies["drizzle-orm"];
    delete pkg.dependencies["@libsql/client"];
    delete pkg.dependencies["pg"];
  }

  if (config.database === "sqlite" && pkg.dependencies) {
    delete pkg.dependencies["pg"];
  }

  if (config.database === "postgres" && pkg.dependencies) {
    delete pkg.dependencies["@libsql/client"];
  }

  vfs.writeFile("package.json", JSON.stringify(pkg, null, 2) + "\n");
}
