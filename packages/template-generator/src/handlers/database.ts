import type { ProjectConfig } from "@cyber-stack/types";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processDatabase(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (config.database === "none") return;

  processTemplatesFromPrefix(
    vfs,
    templates,
    `templates/database/${config.database}`,
    "",
    config
  );
}
