import type { ProjectConfig } from "../schemas";
import type { VirtualFileSystem } from "../core/virtual-fs";
import { processPackageJson } from "./processors/package-json";
import { processEnvVars } from "./processors/env-vars";
import { processReadme } from "./processors/readme";

export function runPostProcessors(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  processPackageJson(vfs, config);
  processEnvVars(vfs, config);
  processReadme(vfs, config);
}
