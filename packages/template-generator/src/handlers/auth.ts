import type { ProjectConfig } from "@cyber-stack/types";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processAuth(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (config.auth === "none") return;

  processTemplatesFromPrefix(
    vfs,
    templates,
    `templates/auth/${config.auth}`,
    "",
    config
  );
}
