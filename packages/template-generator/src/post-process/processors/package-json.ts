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

  vfs.writeFile("package.json", JSON.stringify(pkg, null, 2) + "\n");
}
