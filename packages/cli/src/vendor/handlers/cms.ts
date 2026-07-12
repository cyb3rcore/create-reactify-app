import type { ProjectConfig } from "../schemas";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processCMS(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (config.cms === "none") return;

  processTemplatesFromPrefix(
    vfs,
    templates,
    "templates/features/cms",
    "",
    config
  );
}
