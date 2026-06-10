import type { ProjectConfig } from "@cyber-stack/types";
import type { VirtualFileSystem } from "../core/virtual-fs";
import { processPackageJson } from "./processors/package-json";
import { processEnvVars } from "./processors/env-vars";

export function runPostProcessors(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  processPackageJson(vfs, config);
  processEnvVars(vfs, config);
}
