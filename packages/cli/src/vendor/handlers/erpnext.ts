import type { ProjectConfig } from "../schemas";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processERPNext(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (config.erpnext === "none") return;

  processTemplatesFromPrefix(
    vfs,
    templates,
    "templates/features/erpnext",
    "",
    config
  );
}
