import type { ProjectConfig } from "../schemas";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processPortal(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (config.portal === "none") return;

  processTemplatesFromPrefix(
    vfs,
    templates,
    "templates/features/portal",
    "",
    config
  );
}
